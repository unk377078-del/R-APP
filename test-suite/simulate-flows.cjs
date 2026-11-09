const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ts = require('typescript');

console.log('=== BUSINESS LOGIC & SIMULATION TEST SUITE ===\n');

// Transpile src/ViewModels.ts on the fly
const sourceTs = fs.readFileSync(path.join(__dirname, '../src/ViewModels.ts'), 'utf8');
const compiledJs = ts.transpileModule(sourceTs, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;

// Evaluate in a module scope
const vmModule = { exports: {} };
const fn = new Function('require', 'exports', 'module', compiledJs);
fn(require, vmModule.exports, vmModule);

const { cartSubtotal, findValidCoupon, calculateEarnedPoints, toCartLine } = vmModule.exports;

let passes = 0;
let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passes++;
  } catch (err) {
    console.error(`❌ FAIL: ${name} ->`, err.message);
    failures++;
  }
}

// 1. toCartLine tests
test('toCartLine handles standard kilo pricing', () => {
  const prod = { id: 'p1', name: 'فرخة بيضاء', price: 125, unit: 'كيلو', emoji: '🍗' };
  const line = toCartLine(prod, 2, 'عادي', ['تنظيف كامل'], 'بدون ملح');
  assert.strictEqual(line.productId, 'p1');
  assert.strictEqual(line.price, 125);
  assert.strictEqual(line.quantity, 2);
  assert.strictEqual(line.unit, 'كيلو');
  assert.deepStrictEqual(line.options, ['تنظيف كامل']);
  assert.strictEqual(line.note, 'بدون ملح');
});

test('toCartLine handles piece pricing when available', () => {
  const prod = { id: 'p2', name: 'حمام محشي', price: 150, piecePrice: 85, unit: 'للقطعة', emoji: '🐦' };
  const line = toCartLine(prod, 3, 'جامبو', [], '', 'للقطعة');
  assert.strictEqual(line.price, 85);
  assert.strictEqual(line.quantity, 3);
  assert.strictEqual(line.unit, 'للقطعة');
});

// 2. cartSubtotal tests
test('cartSubtotal calculates multi-item totals accurately', () => {
  const lines = [
    { id: 'l1', productId: 'p1', name: 'فراخ', price: 120, quantity: 2, unit: 'كيلو', emoji: '', size: '', options: [], note: '' },
    { id: 'l2', productId: 'p2', name: 'بانيه', price: 210, quantity: 1.5, unit: 'كيلو', emoji: '', size: '', options: [], note: '' },
    { id: 'l3', productId: 'p3', name: 'شيش', price: 190, quantity: 0.5, unit: 'كيلو', emoji: '', size: '', options: [], note: '' }
  ];
  // 120*2 = 240, 210*1.5 = 315, 190*0.5 = 95 -> Total = 650
  const subtotal = cartSubtotal(lines);
  assert.strictEqual(subtotal, 650);
});

// 3. findValidCoupon tests
const now = Date.now();
const activeCoupons = [
  { code: 'WELCOME10', type: 'percent', value: 10, minimum: 200, expiresAt: now + 86400000, active: true, uses: 0, popup: false },
  { code: 'MAXCAP', type: 'percent', value: 20, minimum: 100, maxDiscount: 30, expiresAt: now + 86400000, active: true, uses: 0, popup: false },
  { code: 'FLAT50', type: 'fixed', value: 50, minimum: 300, expiresAt: now + 86400000, active: true, uses: 0, popup: false },
  { code: 'EXPIRED', type: 'fixed', value: 20, minimum: 100, expiresAt: now - 1000, active: true, uses: 0, popup: false },
  { code: 'MAXEDOUT', type: 'fixed', value: 20, minimum: 100, maxUses: 5, uses: 5, expiresAt: now + 86400000, active: true, popup: false },
  { code: 'VIPONLY', type: 'fixed', value: 100, minimum: 100, expiresAt: now + 86400000, active: true, uses: 0, popup: false, eligibleCustomerIds: ['cust_123'] }
];

test('findValidCoupon accepts valid percent coupon meeting minimum', () => {
  const result = findValidCoupon(activeCoupons, 'welcome10', 300);
  assert.strictEqual(result.error, '');
  assert.strictEqual(result.discount, 30); // 10% of 300 = 30
});

test('findValidCoupon rejects coupon below minimum order', () => {
  const result = findValidCoupon(activeCoupons, 'WELCOME10', 150);
  assert.strictEqual(result.discount, 0);
  assert.ok(result.error.includes('الحد الأدنى'));
});

test('findValidCoupon respects maxDiscount ceiling', () => {
  // 20% of 500 is 100, but maxDiscount is 30
  const result = findValidCoupon(activeCoupons, 'MAXCAP', 500);
  assert.strictEqual(result.error, '');
  assert.strictEqual(result.discount, 30);
});

test('findValidCoupon rejects expired coupon', () => {
  const result = findValidCoupon(activeCoupons, 'EXPIRED', 500);
  assert.strictEqual(result.discount, 0);
  assert.ok(result.error.includes('منتهي') || result.error.includes('غير صالح'));
});

test('findValidCoupon rejects coupon exceeding maxUses limit', () => {
  const result = findValidCoupon(activeCoupons, 'MAXEDOUT', 500);
  assert.strictEqual(result.discount, 0);
  assert.ok(result.error.includes('الحد الأقصى'));
});

test('findValidCoupon restricts targeted customer coupons', () => {
  // Wrong customer
  const result1 = findValidCoupon(activeCoupons, 'VIPONLY', 500, 'cust_999');
  assert.strictEqual(result1.discount, 0);
  assert.ok(result1.error.includes('مخصص'));

  // Eligible customer
  const result2 = findValidCoupon(activeCoupons, 'VIPONLY', 500, 'cust_123');
  assert.strictEqual(result2.error, '');
  assert.strictEqual(result2.discount, 100);
});

// 4. calculateEarnedPoints tests
test('calculateEarnedPoints distinguishes regular vs special rate products', () => {
  const products = [
    { id: 'p1', name: 'وراك بالعظم', price: 90, unit: 'كيلو', emoji: '' }, // special (5 pts)
    { id: 'p2', name: 'شاورما دجاج', price: 180, unit: 'كيلو', emoji: '' } // regular (10 pts)
  ];
  const cart = [
    { id: 'l1', productId: 'p1', name: 'وراك بالعظم', price: 90, quantity: 2, unit: 'كيلو', emoji: '', size: '', options: [], note: '' },
    { id: 'l2', productId: 'p2', name: 'شاورما دجاج', price: 180, quantity: 3, unit: 'كيلو', emoji: '', size: '', options: [], note: '' }
  ];
  // p1 specialRate(5) * 2 = 10 pts
  // p2 regularRate(10) * 3 = 30 pts
  // Total = 40 pts
  const points = calculateEarnedPoints(cart, products, 10, 5);
  assert.strictEqual(points, 40);
});

console.log('\n====================================================');
console.log(`TOTAL PASSES: ${passes}`);
console.log(`TOTAL FAILURES: ${failures}`);
console.log('====================================================');

if (failures > 0) process.exit(1);
console.log('🎉 ALL BUSINESS RULES & SIMULATION TESTS PASSED 100%!');
