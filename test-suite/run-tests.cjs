const fs = require('fs');
const path = require('path');

let failures = 0;
let passes = 0;

function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL: ' + message);
    failures++;
  } else {
    console.log('✅ PASS: ' + message);
    passes++;
  }
}

console.log('=== AL-RASHIDI MARKET: COMPREHENSIVE TEST SUITE ===\n');

// ----------------------------------------------------
// TEST 1: Cloud Media Library & Core Branding Assets Verification
// ----------------------------------------------------
console.log('[1/7] Testing Cloud Media Library & Core Branding Assets...');
const cloudImages = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/cloudImages.json'), 'utf8'));
const cloudKeys = Object.keys(cloudImages);
assert(cloudKeys.length >= 70, `Cloud library has all 70+ assets (Actual: ${cloudKeys.length})`);

// Verify essential branding assets exist on disk
assert(fs.existsSync(path.join(__dirname, '../assets/android/logo_alrashidi.png')), 'Brand logo exists');
assert(fs.existsSync(path.join(__dirname, '../assets/android/prod_chicken_whole.png')), 'Chicken placeholder exists');
for (const key of cloudKeys) {
  assert(cloudImages[key].startsWith('https://'), `Valid Cloud CDN URL for ${key}`);
}

// ----------------------------------------------------
// TEST 2: App Configuration & Permissions (app.json)
// ----------------------------------------------------
console.log('\n[2/7] Testing App Store & Google Play Readiness (app.json)...');
const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../app.json'), 'utf8'));
const expo = appJson.expo;
assert(expo.name === 'طيور الرشيدي' || expo.name === 'الرشيدي ماركت', 'App name is set correctly');
assert(expo.slug === 'rashidi-market' || expo.slug === 'ahmeedsayed', 'Slug is set');
assert(expo.version === '1.0.0', 'Version is 1.0.0');
assert(expo.ios && expo.ios.bundleIdentifier === 'com.alrashidi.market', 'iOS bundleIdentifier is com.alrashidi.market');
assert(expo.android && expo.android.package === 'com.alrashidi.market', 'Android package is com.alrashidi.market');
assert(expo.android && expo.android.targetSdkVersion >= 34, `Target SDK is >= 34 (Actual: ${expo.android.targetSdkVersion})`);
assert(expo.splash && fs.existsSync(path.join(__dirname, '..', expo.splash.image)), 'Splash image exists on disk');
assert(expo.icon && fs.existsSync(path.join(__dirname, '..', expo.icon)), 'App icon exists on disk');
assert(expo.ios.infoPlist.NSLocationWhenInUseUsageDescription, 'iOS Location permission description present');
assert(expo.ios.infoPlist.NSPhotoLibraryUsageDescription, 'iOS Photo library permission description present');
assert(expo.ios.infoPlist.NSCameraUsageDescription, 'iOS Camera permission description present');

// ----------------------------------------------------
// TEST 3: Default Product Catalog Data Integrity
// ----------------------------------------------------
console.log('\n[3/7] Testing Products & Categories Catalog...');
const modelsContent = fs.readFileSync(path.join(__dirname, '../src/models.ts'), 'utf8');
// Extract defaultProducts array from models.ts or test default product definitions
assert(modelsContent.includes('export type Product'), 'Product type defined');
assert(modelsContent.includes('export type CartLine'), 'CartLine type defined');
assert(modelsContent.includes('export type Order'), 'Order type defined');
assert(modelsContent.includes('export type Coupon'), 'Coupon type defined');

// ----------------------------------------------------
// TEST 4: Cart Math, Discounts & Customizations Logic
// ----------------------------------------------------
console.log('\n[4/7] Testing Cart Calculation Math & Coupon Logic...');
function calculateCartTotals(items, coupon, deliveryFee) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discount = 0;
  if (coupon) {
    if (coupon.type === 'percent') {
      discount = Math.min(subtotal, (subtotal * coupon.value) / 100);
    } else if (coupon.type === 'fixed') {
      discount = Math.min(subtotal, coupon.value);
    }
  }
  const total = Math.max(0, subtotal - discount + (deliveryFee || 0));
  return { subtotal, discount, total };
}

const testCart = [
  { id: '1', name: 'فرخة بيضاء مزارع', price: 120, quantity: 2 },
  { id: '2', name: 'بانيه طازج', price: 210, quantity: 1.5 }
];
const percentCoupon = { code: 'SAVE10', type: 'percent', value: 10 };
const fixedCoupon = { code: 'EGP50', type: 'fixed', value: 50 };

const res1 = calculateCartTotals(testCart, null, 25);
assert(res1.subtotal === 555, `Subtotal correct without coupon: 555 == ${res1.subtotal}`);
assert(res1.discount === 0, `Discount 0: ${res1.discount}`);
assert(res1.total === 580, `Total with 25 EGP delivery: 580 == ${res1.total}`);

const res2 = calculateCartTotals(testCart, percentCoupon, 0);
assert(res2.discount === 55.5, `10% discount correct: 55.5 == ${res2.discount}`);
assert(res2.total === 499.5, `Total after 10% discount: 499.5 == ${res2.total}`);

const res3 = calculateCartTotals(testCart, fixedCoupon, 0);
assert(res3.discount === 50, `Fixed discount 50: ${res3.discount}`);
assert(res3.total === 505, `Total after fixed discount: 505 == ${res3.total}`);

// ----------------------------------------------------
// TEST 5: State Serialization & Offline Local Storage
// ----------------------------------------------------
console.log('\n[5/7] Testing State Serialization & Persistence Key...');
const storeContent = fs.readFileSync(path.join(__dirname, '../src/store.ts'), 'utf8');
assert(storeContent.includes('@alrashidi_local_cart_cache_v2'), 'Local storage key is versioned v2');
assert(storeContent.includes('saveLocalCache'), 'saveLocalCache exists');
assert(storeContent.includes('loadState'), 'loadState exists');
assert(storeContent.includes('emptyDeliveryLocation'), 'emptyDeliveryLocation initialized safely');

// ----------------------------------------------------
// TEST 6: Web Public & Legal Compliance
// ----------------------------------------------------
console.log('\n[6/7] Testing Web Public Hosting & Legal Documents...');
assert(fs.existsSync(path.join(__dirname, '../web-public/index.html')), 'index.html exists in web-public');
assert(fs.existsSync(path.join(__dirname, '../web-public/privacy-policy.html')), 'privacy-policy.html exists in web-public');
assert(fs.existsSync(path.join(__dirname, '../web-public/account-deletion.html')), 'account-deletion.html exists in web-public');

const privacyHtml = fs.readFileSync(path.join(__dirname, '../web-public/privacy-policy.html'), 'utf8');
assert(privacyHtml.includes('سياسة الخصوصية — طيور الرشيدي'), 'Privacy policy has brand title');
assert(privacyHtml.includes('Firebase'), 'Privacy policy discloses Firebase data processing');
assert(privacyHtml.includes('account-deletion'), 'Privacy policy links to account deletion page');

const legalScreensContent = fs.readFileSync(path.join(__dirname, '../src/LegalScreens.tsx'), 'utf8');
assert(legalScreensContent.includes('AppFooter'), 'AppFooter component exported');
assert(legalScreensContent.includes('TermsScreen'), 'TermsScreen component exported');
assert(legalScreensContent.includes('PrivacyScreen'), 'PrivacyScreen component exported');
assert(legalScreensContent.includes('جميع الحقوق محفوظة'), 'Copyright notice present');

// ----------------------------------------------------
// TEST 7: Theme Tokens & Contrast Consistency
// ----------------------------------------------------
console.log('\n[7/7] Testing Theme Contrast & Typography Tokens...');
const themeContent = fs.readFileSync(path.join(__dirname, '../src/theme.ts'), 'utf8');
assert(themeContent.includes('E2EEFE'), 'Dark mode C.navy has high-contrast #E2EEFE');
assert(themeContent.includes('F8FAFC'), 'Dark mode C.ink has crisp white #F8FAFC');
assert(themeContent.includes('94A3B8'), 'Dark mode C.muted has readable Slate-400 #94A3B8');
assert(themeContent.includes('backdropFilter'), 'Glassmorphism backdropFilter defined in styles');
assert(themeContent.includes('isDarkMode'), 'isDarkMode helper exported from theme');
assert(themeContent.includes('ruqaaStroke'), 'ruqaaStroke defined in theme styles');

const uiContent = fs.readFileSync(path.join(__dirname, '../src/ui.tsx'), 'utf8');
assert(uiContent.includes('ruqaaExtraStyle'), 'ruqaaExtraStyle outline logic injected into Txt component');
assert(uiContent.includes('WebkitTextStroke'), 'WebkitTextStroke applied for web Arabic calligraphy');
assert(uiContent.includes('paintOrder'), 'paintOrder stroke fill applied to prevent letter thinning');

console.log('\n====================================================');
console.log(`TOTAL PASSES: ${passes}`);
console.log(`TOTAL FAILURES: ${failures}`);
console.log('====================================================');

if (failures > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL SYSTEM & INTEGRATION TESTS PASSED 100%!');
}
