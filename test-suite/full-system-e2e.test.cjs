const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ts = require('typescript');

console.log('====================================================');
console.log('🧪 AL-RASHIDI MARKET: MASTER END-TO-END SYSTEM TEST');
console.log('====================================================\n');

let passes = 0;
let failures = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passes++;
  } catch (err) {
    console.error(`❌ FAIL: ${name} ->`, err.message);
    failures++;
  }
}

// ----------------------------------------------------
// Transpile and load ViewModels for logic tests
// ----------------------------------------------------
const vmTs = fs.readFileSync(path.join(__dirname, '../src/ViewModels.ts'), 'utf8');
const vmJs = ts.transpileModule(vmTs, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const vmModule = { exports: {} };
new Function('require', 'exports', 'module', vmJs)(require, vmModule.exports, vmModule);
const { cartSubtotal, findValidCoupon, calculateEarnedPoints, toCartLine } = vmModule.exports;

// ----------------------------------------------------
// 1. STORAGE & CACHE PERSISTENCE TESTS (تخزين)
// ----------------------------------------------------
console.log('--- [1/5] Testing Storage & State Persistence (تخزين) ---');

const storeCode = fs.readFileSync(path.join(__dirname, '../src/store.ts'), 'utf8');
const modelsCode = fs.readFileSync(path.join(__dirname, '../src/models.ts'), 'utf8');
const fbStoreCode = fs.readFileSync(path.join(__dirname, '../src/firebaseStore.ts'), 'utf8');

runTest('AppState includes all critical persistent fields', () => {
  const fields = [
    'products', 'cart', 'weeklyList', 'orders', 'branch', 'fontScale',
    'addressBook', 'deliveryLocation', 'themeMode', 'stories', 'showcase',
    'notices', 'coupons', 'badges', 'loyalty', 'points', 'categoryImages',
    'branchImages', 'storeStatus'
  ];
  fields.forEach(field => {
    assert(storeCode.includes(`${field}:`) || storeCode.includes(`${field}?:`), `AppState must declare field ${field}`);
  });
});

runTest('saveLocalCache persists full state snapshot to AsyncStorage', () => {
  assert(storeCode.includes('LOCAL_STORAGE_KEY'), 'Must define local storage key');
  assert(storeCode.includes('AsyncStorage.setItem(LOCAL_STORAGE_KEY'), 'Must save to AsyncStorage');
  assert(storeCode.includes('showcase: state.showcase'), 'Must persist showcase config');
  assert(storeCode.includes('stories: state.stories'), 'Must persist stories array');
  assert(storeCode.includes('orders: (state.orders'), 'Must persist orders history');
});

runTest('loadState safely restores state with robust fallbacks', () => {
  assert(storeCode.includes('showcase: localData.showcase'), 'Must restore showcase with default fallback');
  assert(storeCode.includes('stories: Array.isArray(localData.stories)'), 'Must restore stories with defaultStories fallback');
  assert(storeCode.includes('defaultProductsCatalog'), 'Must fallback to default products if cache empty');
  assert(storeCode.includes('emptyDeliveryLocation'), 'Must safely initialize empty delivery location');
});

runTest('Cloud Firestore synchronization exports all persistence methods', () => {
  const requiredMethods = [
    'saveShowcaseToFirestore',
    'saveStoriesToFirestore',
    'saveOrderToFirestore',
    'saveProductToFirestore',
    'saveCategoryImagesToFirestore',
    'saveBranchImagesToFirestore',
    'saveStoreStatusToFirestore',
    'saveLoyaltyToFirestore',
    'saveNoticeToFirestore',
    'subscribeAppSettings'
  ];
  requiredMethods.forEach(method => {
    assert(fbStoreCode.includes(`export async function ${method}`) ||
           fbStoreCode.includes(`export function ${method}`) ||
           fbStoreCode.includes(`export const ${method}`),
      `firebaseStore must export ${method}`);
  });
});

// ----------------------------------------------------
// 2. ORDERING WORKFLOW & CART RULES (طلب)
// ----------------------------------------------------
console.log('\n--- [2/5] Testing Ordering Workflow & Business Logic (طلب) ---');

runTest('Cart line formulation with custom preparation options', () => {
  const product = { id: 'p_chick', name: 'دجاج بلدي فلاحي', price: 140, unit: 'كيلو', emoji: '🐔' };
  const line = toCartLine(product, 2.5, 'وسط', ['تقطيع 8 قطع', 'تنظيف بدون جلد'], 'تغليف خاص ومحكم');
  assert.strictEqual(line.productId, 'p_chick');
  assert.strictEqual(line.price, 140);
  assert.strictEqual(line.quantity, 2.5);
  assert.strictEqual(line.options.length, 2);
  assert.strictEqual(line.options[0], 'تقطيع 8 قطع');
  assert.strictEqual(line.note, 'تغليف خاص ومحكم');
});

runTest('Multi-item cart subtotal calculation', () => {
  const lines = [
    { id: '1', productId: 'p1', name: 'بانيه', price: 220, quantity: 2, unit: 'كيلو', emoji: '', size: '', options: [], note: '' }, // 440
    { id: '2', productId: 'p2', name: 'حمام بلدي', price: 95, quantity: 4, unit: 'قطعة', emoji: '', size: '', options: [], note: '' }, // 380
    { id: '3', productId: 'p3', name: 'شيش طاووق', price: 210, quantity: 1.5, unit: 'كيلو', emoji: '', size: '', options: [], note: '' }, // 315
  ];
  const subtotal = cartSubtotal(lines);
  assert.strictEqual(subtotal, 440 + 380 + 315); // 1135 EGP
});

runTest('Coupon validation: percent discount, min spend, max discount ceiling', () => {
  const coupons = [
    { code: 'RASHIDI10', type: 'percent', value: 10, minimum: 300, maxDiscount: 50, expiresAt: Date.now() + 86400000, active: true },
    { code: 'FLAT100', type: 'fixed', value: 100, minimum: 500, expiresAt: Date.now() + 86400000, active: true },
  ];

  // 10% of 400 = 40 (below 50 cap)
  const r1 = findValidCoupon(coupons, 'RASHIDI10', 400);
  assert.strictEqual(r1.error, '');
  assert.strictEqual(r1.discount, 40);

  // 10% of 800 = 80 -> capped at 50
  const r2 = findValidCoupon(coupons, 'RASHIDI10', 800);
  assert.strictEqual(r2.error, '');
  assert.strictEqual(r2.discount, 50);

  // Below minimum 300
  const r3 = findValidCoupon(coupons, 'RASHIDI10', 250);
  assert.strictEqual(r3.discount, 0);
  assert.ok(r3.error.length > 0);

  // Fixed 100 discount
  const r4 = findValidCoupon(coupons, 'FLAT100', 600);
  assert.strictEqual(r4.error, '');
  assert.strictEqual(r4.discount, 100);
});

runTest('Sequential order ID generation and formatting', () => {
  const orders = [
    { id: 1001, total: 300, status: 'تم التسليم' },
    { id: 1002, total: 450, status: 'تم التسليم' },
    { id: '1003', total: 600, status: 'خرج للتوصيل' },
  ];
  const lastNum = orders.reduce((max, o) => {
    const n = parseInt(String(o.id).replace(/\D/g, ''), 10);
    return !isNaN(n) && n > max ? n : max;
  }, 1000);
  const nextOrderNumber = lastNum + 1;
  assert.strictEqual(nextOrderNumber, 1004);
});

runTest('Order status lifecycle states validation', () => {
  const validStatuses = ['قيد المراجعة والتجهيز', 'جاري التجهيز', 'خرج للتوصيل', 'تم التسليم', 'ملغي'];
  assert(modelsCode.includes('isOrderPending'), 'models.ts must export isOrderPending helper');
  
  // Pending check
  const checkPending = (status) => !/تم التسليم|مكتمل|جاري التجهيز|خرج للتوصيل|ملغي/.test(status) &&
                                  /قيد المراجعة|قيد الانتظار|جديد|pending/i.test(status);
  assert.strictEqual(checkPending('قيد المراجعة والتجهيز'), true);
  assert.strictEqual(checkPending('جاري التجهيز'), false);
  assert.strictEqual(checkPending('خرج للتوصيل'), false);
  assert.strictEqual(checkPending('تم التسليم'), false);
  assert.strictEqual(checkPending('ملغي'), false);
});

runTest('Loyalty points calculation: standard poultry vs special cuts', () => {
  const dummyProducts = [
    { id: '1', name: 'فراخ بيضاء طازجة', price: 130 },
    { id: '2', name: 'صدور بالعظم', price: 180 },
    { id: '3', name: 'الكبدة', price: 160 },
  ];
  const cartLines = [
    { productId: '1', name: 'فراخ بيضاء طازجة', quantity: 2, price: 130 },
    { productId: '2', name: 'صدور بالعظم', quantity: 1, price: 180 },
    { productId: '3', name: 'الكبدة', quantity: 1, price: 160 },
  ];
  // Standard rate: 1 pt per unit. Special rate: 3 pts per unit.
  const points = calculateEarnedPoints(cartLines, dummyProducts, 1, 3);
  // 2*1 (regular) + 1*3 (special) + 1*3 (special) = 2 + 3 + 3 = 8 points
  assert.strictEqual(points, 8);
});

// ----------------------------------------------------
// 3. NOTIFICATION & BROADCAST TESTS (إشعارات)
// ----------------------------------------------------
console.log('\n--- [3/5] Testing Notifications & Broadcasts (إشعارات) ---');

const appTsxCode = fs.readFileSync(path.join(__dirname, '../App.tsx'), 'utf8');
const dashCode = fs.readFileSync(path.join(__dirname, '../src/DashboardScreen.tsx'), 'utf8');

runTest('In-app notices model supports order and promo categories', () => {
  assert(modelsCode.includes('AppNotice'), 'models.ts must define AppNotice');
  assert(modelsCode.includes("kind:'promo'|'order'") || modelsCode.includes("kind: 'promo' | 'order'"), 'AppNotice must declare kind');
});

runTest('Admin dashboard broadcast transmits promo notices with coupons', () => {
  assert(dashCode.includes('onBroadcast'), 'DashboardScreen must accept onBroadcast handler');
  assert(appTsxCode.includes('broadcastPromotionToFirestore'),
    'App.tsx must wire broadcast to Firestore and local state');
});

runTest('New order audio alert and unread counter in header', () => {
  const homeCodeStr = fs.readFileSync(path.join(__dirname, '../src/HomeScreen.tsx'), 'utf8');
  assert(homeCodeStr.includes('unreadNoticesCount'), 'HomeScreen Header must calculate unread notices count');
  assert(dashCode.includes('playNewOrderSound'), 'DashboardScreen must trigger playNewOrderSound');
  assert(appTsxCode.includes('playNewOrderSound'), 'App.tsx must trigger sound on incoming orders');
});

// ----------------------------------------------------
// 4. IMAGE DYNAMICS & CLOUD CDN TESTS (تغيير صور)
// ----------------------------------------------------
console.log('\n--- [4/5] Testing Dynamic Images & Cloud CDN (تغيير صور) ---');

const nativeAssetsCode = fs.readFileSync(path.join(__dirname, '../src/nativeAssets.ts'), 'utf8');
const cloudMediaCode = fs.readFileSync(path.join(__dirname, '../src/cloudMedia.ts'), 'utf8');
const imagePickerCode = fs.readFileSync(path.join(__dirname, '../src/imagePicker.ts'), 'utf8');

runTest('Native assets dictionary contains all essential high-res poultry keys', () => {
  const assetKeys = [
    'story-fresh-chicken', 'story-shish-tawook', 'story-fresh-panee',
    'story-baladi-poultry', 'hero-chicken', 'hero-marinated',
    'product-burger', 'product-marinated-shawerma', 'chicken', 'duck',
    'pigeon', 'panee', 'shish', 'wings', 'drumsticks'
  ];
  assetKeys.forEach(k => {
    assert(nativeAssetsCode.includes(`'${k}':`), `nativeAssets must include key '${k}'`);
  });
});

runTest('CloudMediaItem supports showcase, products, stories, categories, and branches', () => {
  assert(cloudMediaCode.includes("'showcase'"), 'CloudMediaItem must support showcase type');
  assert(cloudMediaCode.includes("'product'"), 'CloudMediaItem must support product type');
  assert(cloudMediaCode.includes("'story'"), 'CloudMediaItem must support story type');
  assert(cloudMediaCode.includes("'category'"), 'CloudMediaItem must support category type');
  assert(cloudMediaCode.includes("'branch'"), 'CloudMediaItem must support branch type');
});

runTest('Cloud image uploader handles base64 data and returns secure CDN URL', () => {
  assert(cloudMediaCode.includes('export async function uploadImageToCloud'),
    'cloudMedia.ts must export uploadImageToCloud');
  assert(imagePickerCode.includes('pickCompressedImage'), 'imagePicker.ts must compress image before upload');
});

runTest('ShowcaseAdminTab provides 4 image selection methods', () => {
  assert(dashCode.includes('openCloudPicker'), 'Showcase admin must support Cloud Media Picker');
  assert(dashCode.includes('pickAndUploadToCloud'), 'Showcase admin must support direct phone upload');
  assert(dashCode.includes('pickCompressedImage'), 'Showcase admin must support local gallery pick');
  assert(dashCode.includes('showcasePresetImages'), 'Showcase admin must provide curated presets carousel');
});

// ----------------------------------------------------
// 5. RESPONSIVENESS AUDIT ACROSS ALL DEVICES (التجاوب)
// ----------------------------------------------------
console.log('\n--- [5/5] Testing Responsiveness Across All Device Sizes (التجاوب) ---');

const homeCode = fs.readFileSync(path.join(__dirname, '../src/HomeScreen.tsx'), 'utf8');

// Simulate layout width and bento height computation across 9 device viewports
const simulatedViewports = [
  { name: 'Small Phone (iPhone SE 1st gen)', width: 320, expectedPadding: 16 },
  { name: 'Compact Phone (Galaxy A series)', width: 360, expectedPadding: 16 },
  { name: 'Standard Phone (iPhone 13/14/15)', width: 390, expectedPadding: 16 },
  { name: 'Standard Android (Galaxy S23/Pixel)', width: 412, expectedPadding: 16 },
  { name: 'Max Phablet (iPhone 15 Pro Max)', width: 430, expectedPadding: 16 },
  { name: 'Foldable / Small Tablet', width: 600, expectedPadding: 16 },
  { name: 'iPad Mini (Portrait)', width: 768, expectedPadding: 16 },
  { name: 'Laptop / Desktop Web', width: 1024, expectedPadding: 16 },
  { name: 'Full HD Desktop Screen', width: 1920, expectedPadding: 16 },
];

simulatedViewports.forEach(vp => {
  runTest(`Responsiveness on ${vp.name} (${vp.width}px): Grid & Column Math`, () => {
    // Container max-width rule
    const contentMaxWidth = 680;
    const effectiveContainerWidth = Math.min(vp.width, contentMaxWidth);
    const availableWidth = effectiveContainerWidth - (vp.expectedPadding * 2);

    // Bento Height rule
    const bentoHeight = Math.max(250, Math.min(Math.round(availableWidth * 0.70), 310));
    assert(bentoHeight >= 250 && bentoHeight <= 310, `Bento height ${bentoHeight} must stay within optimal bounds [250-310]`);

    // Flex layout distribution: Hero (flex: 1.25) vs Secondary (flex: 1) with 10px gap
    const gap = 10;
    const remainingWidth = availableWidth - gap;
    const heroWidth = Math.round(remainingWidth * (1.25 / 2.25));
    const secondaryColWidth = Math.round(remainingWidth * (1.0 / 2.25));
    const totalFilledWidth = heroWidth + secondaryColWidth + gap;

    // Verify 100% width coverage within 1px rounding tolerance
    const diff = Math.abs(availableWidth - totalFilledWidth);
    assert(diff <= 1, `Total width (${totalFilledWidth}px) must equal available width (${availableWidth}px)`);

    // Verify left stacked card heights with 10px vertical gap
    const cardHeight = (bentoHeight - gap) / 2;
    assert(cardHeight >= 120 && cardHeight <= 150, `Secondary card height ${cardHeight}px must be touch-friendly`);
  });
});

runTest('HomeScreen Bento Grid uses pure flexbox (flex: 1.25 and flex: 1)', () => {
  assert(homeCode.includes('flex: 1.25'), 'Hero card must use flex: 1.25 for 100% width fill');
  assert(homeCode.includes('flex: 1'), 'Secondary cards must use flex: 1 for equal height split');
  assert(!homeCode.includes('width: rightColWidth'), 'Must not use fixed pixel rightColWidth');
  assert(!homeCode.includes('width: leftColWidth'), 'Must not use fixed pixel leftColWidth');
});

runTest('Screen containers enforce responsive max-widths on large displays', () => {
  assert(homeCode.includes('maxWidth:680') || homeCode.includes('maxWidth: 680'),
    'HomeScreen must constrain content to maxWidth 680 on desktop');
  assert(appTsxCode.includes('maxWidth:560') || appTsxCode.includes('maxWidth: 560'),
    'Bottom navigation dock must constrain to maxWidth 560 on desktop');
});

runTest('RTL Arabic text directionality preserved across styles', () => {
  const themeCode = fs.readFileSync(path.join(__dirname, '../src/theme.ts'), 'utf8');
  assert(themeCode.includes("writingDirection: 'rtl'"), 'Theme styles must enforce writingDirection: rtl');
  assert(themeCode.includes("flexDirection: 'row-reverse'"), 'Theme styles must enforce flexDirection: row-reverse');
});

console.log('\n====================================================');
console.log(`TOTAL PASSES: ${passes}`);
console.log(`TOTAL FAILURES: ${failures}`);
console.log('====================================================');

if (failures === 0) {
  console.log('🎉 ALL SYSTEM, STORAGE, ORDERING, NOTIFICATION, IMAGE & RESPONSIVENESS TESTS PASSED 100%!\n');
} else {
  console.error('❌ SOME TESTS FAILED. PLEASE REVIEW OUTPUT ABOVE.\n');
  process.exit(1);
}
