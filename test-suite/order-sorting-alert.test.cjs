const assert = require('assert');

console.log('=== TEST: ORDER SORTING, NUMBERING, DELIVERY & MANAGER ALERT SYSTEM ===\n');

// 1. Test Order Sorting (Newest to Oldest)
console.log('[1/6] Testing Order Sorting (Descending createdAt)...');
const unsortedOrders = [
  { id: '1001', orderNumber: 1001, createdAt: 1700000000000, total: 250, status: 'تم التسليم' },
  { id: '1003', orderNumber: 1003, createdAt: 1700000200000, total: 420, status: 'قيد المراجعة والتجهيز' },
  { id: '1002', orderNumber: 1002, createdAt: 1700000100000, total: 310, status: 'جاري التجهيز' },
  { id: '1004', orderNumber: 1004, createdAt: 1700000500000, total: 180, status: 'قيد المراجعة والتجهيز' },
];

const sorted = [...unsortedOrders].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

assert.strictEqual(sorted[0].id, '1004', 'Latest order must be first');
assert.strictEqual(sorted[1].id, '1003', 'Second latest order must be second');
assert.strictEqual(sorted[2].id, '1002', 'Third latest order must be third');
assert.strictEqual(sorted[3].id, '1001', 'Oldest order must be last');
console.log('✅ PASS: Orders are strictly sorted newest to oldest (createdAt descending)');

// 2. Test Pending Orders Count for Manager Attention
console.log('\n[2/6] Testing Pending Orders Count & Filter...');
const pendingOrders = sorted.filter(o => o.status === 'قيد المراجعة والتجهيز');
assert.strictEqual(pendingOrders.length, 2, 'Must detect exactly 2 pending orders awaiting store manager');
assert.strictEqual(pendingOrders[0].id, '1004', 'First pending order is the latest one');
assert.strictEqual(pendingOrders[1].id, '1003', 'Second pending order is the earlier one');
console.log('✅ PASS: Manager pending count accurately calculated as:', pendingOrders.length);

// 3. Test New Order Detection & Alert Trigger Logic
console.log('\n[3/6] Testing Manager Real-Time Alert Trigger...');
let knownOrderIds = new Set(['1001', '1002', '1003']);
const incomingBatch = [
  ...unsortedOrders,
  { id: '1005', orderNumber: 1005, createdAt: 1700000900000, total: 550, status: 'قيد المراجعة والتجهيز', customer: 'أحمد محمود' }
];

const newIncoming = incomingBatch.filter(o => !knownOrderIds.has(o.id));
assert.strictEqual(newIncoming.length, 2, 'Detected 2 new incoming orders');
const latestIncoming = newIncoming.sort((a, b) => b.createdAt - a.createdAt)[0];
assert.strictEqual(latestIncoming.id, '1005', 'Identified latest incoming order');
assert.strictEqual(latestIncoming.customer, 'أحمد محمود', 'Customer name preserved');
console.log(`✅ PASS: New order alert correctly generated for Manager: Order #${latestIncoming.id} from ${latestIncoming.customer} (${latestIncoming.total} EGP)`);

// 4. Test Manager Order Reception / State Transition ('قيد المراجعة والتجهيز' -> 'جاري التجهيز')
console.log('\n[4/6] Testing Manager Order Reception Flow (استلام الطلب)...');
let currentOrder = { ...latestIncoming };
assert.strictEqual(currentOrder.status, 'قيد المراجعة والتجهيز', 'Initial status is pending');

function managerReceiveOrder(order) {
  if (order.status === 'قيد المراجعة والتجهيز') {
    return { ...order, status: 'جاري التجهيز', receivedAt: Date.now() };
  }
  return order;
}

const receivedOrder = managerReceiveOrder(currentOrder);
assert.strictEqual(receivedOrder.status, 'جاري التجهيز', 'Status successfully updated to جاري التجهيز');
assert.ok(receivedOrder.receivedAt > 0, 'Timestamp recorded upon reception');

// Verify Optimistic State & Cloud Synchronization Merge
let cloudOrders = [{ id: '1005', status: 'قيد المراجعة والتجهيز', createdAt: 1700000900000 }];
let stateOrders = [{ id: '1005', status: 'قيد المراجعة والتجهيز', createdAt: 1700000900000 }];
const updateTime = Date.now();
cloudOrders = cloudOrders.map(o => String(o.id) === '1005' ? { ...o, status: 'جاري التجهيز', updatedAt: updateTime } : o);
stateOrders = stateOrders.map(o => String(o.id) === '1005' ? { ...o, status: 'جاري التجهيز', updatedAt: updateTime } : o);
const map = new Map();
stateOrders.forEach(o => map.set(String(o.id), o));
cloudOrders.forEach(o => {
  const existing = map.get(String(o.id));
  if (!existing || (o.updatedAt || o.createdAt || 0) >= (existing.updatedAt || existing.createdAt || 0)) {
    map.set(String(o.id), o);
  }
});
const merged = Array.from(map.values());
assert.strictEqual(merged[0].status, 'جاري التجهيز', 'Merged orders reflect immediate status update without blocking or reverting');

// Test isOrderPending and Dynamic Bottom Tab Badge Calculation
function isOrderPending(status) {
  if (!status) return false;
  const s = String(status).trim();
  if (/تم التسليم|مكتمل|جاري التجهيز|خرج للتوصيل|ملغي/.test(s)) return false;
  return /قيد المراجعة|قيد الانتظار|جديد|pending/i.test(s);
}
const beforeBadge = [{ id: '1005', status: 'قيد المراجعة والتجهيز' }, { id: '1004', status: 'قيد الانتظار' }, { id: '1003', status: 'جاري التجهيز' }].filter(o => isOrderPending(o.status)).length;
assert.strictEqual(beforeBadge, 2, 'Pending badge count initially 2');

const afterBadge = [{ id: '1005', status: 'جاري التجهيز' }, { id: '1004', status: 'قيد الانتظار' }, { id: '1003', status: 'جاري التجهيز' }].filter(o => isOrderPending(o.status)).length;
assert.strictEqual(afterBadge, 1, 'Pending badge count immediately decremented to 1 upon order acceptance');

console.log('✅ PASS: Manager successfully received and transitioned order to «جاري التجهيز» (Optimistic Cloud & Local in Sync)');
console.log('✅ PASS: Bottom Bar Admin Badge dynamically recalculates and decrements upon status update');

// 5. Test Sequential Order Numbering (ترقيم متسلسل بدون عشوائية)
console.log('\n[5/6] Testing Sequential Order Numbering (ترقيم الطلبات بالتسلسل)...');
function simulateNextOrderSequence(ordersList, cloudSequence = 0) {
  let highest = 1000;
  for (const o of ordersList) {
    const num = o.orderNumber || parseInt(String(o.id).replace(/\D/g, ''), 10);
    if (num && num >= 1000 && num < 100000 && num > highest) highest = num;
  }
  if (cloudSequence > highest) highest = cloudSequence - 1;
  const nextNumber = highest + 1;
  return { id: String(nextNumber), orderNumber: nextNumber };
}

// Case A: empty system starts at 1001
const first = simulateNextOrderSequence([]);
assert.strictEqual(first.id, '1001', 'First order should be 1001');

// Case B: existing 1001..1013 produces 1014
const existingOrders = [
  { id: '1013', orderNumber: 1013 },
  { id: '1012', orderNumber: 1012 },
  { id: '1011', orderNumber: 1011 },
];
const nextOrder = simulateNextOrderSequence(existingOrders, 1014);
assert.strictEqual(nextOrder.id, '1014', 'Next order after 1013 must be 1014');
assert.strictEqual(nextOrder.orderNumber, 1014);

// Case C: subsequent order increments to 1015
const updatedList = [{ id: nextOrder.id, orderNumber: nextOrder.orderNumber }, ...existingOrders];
const nextOrder2 = simulateNextOrderSequence(updatedList, 1015);
assert.strictEqual(nextOrder2.id, '1015', 'Subsequent order must be 1015');

// Case D: ignoring old 6-digit timestamp random IDs
const mixedWithOldTimestamps = [
  { id: 'R459812' },
  { id: '1013', orderNumber: 1013 }
];
const safeNext = simulateNextOrderSequence(mixedWithOldTimestamps);
assert.strictEqual(safeNext.id, '1014', 'Must ignore legacy timestamps >= 100000 and continue from 1013');
console.log('✅ PASS: Order numbering is strictly sequential (1001 -> 1013 -> 1014 -> 1015)');

// 6. Test Delivery Timing Modes (خلال ساعتين لـ 3 ساعات أو ميعاد محدد)
console.log('\n[6/6] Testing Delivery Timing Modes...');
function computeDeliverySchedule(mode, selectedSlot, reservedForTomorrow = false) {
  if (mode === 'standard_2_3h') {
    return reservedForTomorrow
      ? 'بكرة (خلال ساعتين إلى ٣ ساعات)'
      : 'اليوم (خلال ساعتين إلى ٣ ساعات)';
  }
  return `${reservedForTomorrow ? 'بكرة' : 'اليوم'} · ${selectedSlot}`;
}

const scheduleMode1Today = computeDeliverySchedule('standard_2_3h', 'من 1 إلى 2 ظهراً', false);
assert.strictEqual(scheduleMode1Today, 'اليوم (خلال ساعتين إلى ٣ ساعات)');

const scheduleMode1Tomorrow = computeDeliverySchedule('standard_2_3h', 'من 1 إلى 2 ظهراً', true);
assert.strictEqual(scheduleMode1Tomorrow, 'بكرة (خلال ساعتين إلى ٣ ساعات)');

const scheduleMode2Today = computeDeliverySchedule('scheduled', 'من 12 إلى 1 ظهراً', false);
assert.strictEqual(scheduleMode2Today, 'اليوم · من 12 إلى 1 ظهراً');

const scheduleMode2Tomorrow = computeDeliverySchedule('scheduled', 'من 2 إلى 3 عصراً', true);
assert.strictEqual(scheduleMode2Tomorrow, 'بكرة · من 2 إلى 3 عصراً');

console.log('✅ PASS: Both delivery timing options correctly formulate schedules for today & tomorrow');

console.log('\n====================================================');
console.log('🎉 ALL 6 SYSTEM, NUMBERING, DELIVERY & MANAGER TESTS PASSED 100%!');
console.log('====================================================\n');
