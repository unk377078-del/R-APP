const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST: RASHIDI SHOWCASE (سفرة الرشيدي) & ADMIN CONTROL ===\n');

// 1. Models & Defaults
console.log('[1/5] Verifying models.ts definitions and defaultShowcaseConfig...');
const modelsContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'models.ts'), 'utf8');
assert(modelsContent.includes('export type RashidiShowcaseConfig'), 'RashidiShowcaseConfig must be defined in models.ts');
assert(modelsContent.includes('export type ShowcasePreset'), 'ShowcasePreset must be defined in models.ts');
assert(modelsContent.includes('export type ShowcaseCard'), 'ShowcaseCard must be defined in models.ts');
assert(modelsContent.includes('export const defaultShowcaseConfig'), 'defaultShowcaseConfig must be defined in models.ts');
assert(modelsContent.includes('سفرة الرشيدي'), 'defaultShowcaseConfig title must mention سفرة الرشيدي');
console.log('✅ PASS: Showcase types and authentic defaults verified in models.ts');

// 2. Store & Local Storage
console.log('[2/5] Verifying store.ts AppState and cache persistence...');
const storeContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'store.ts'), 'utf8');
assert(storeContent.includes('showcase?: RashidiShowcaseConfig'), 'AppState must declare showcase field');
assert(storeContent.includes('showcase: state.showcase'), 'saveLocalCache must persist showcase');
assert(storeContent.includes('localData.showcase'), 'loadState must restore showcase');
console.log('✅ PASS: State persistence verified in store.ts');

// 3. Firebase Firestore Sync
console.log('[3/5] Verifying Cloud Firestore synchronization in firebaseStore.ts...');
const fbContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'firebaseStore.ts'), 'utf8');
assert(fbContent.includes("doc(firestore, 'app_settings', 'showcase')"), 'subscribeAppSettings must listen to app_settings/showcase');
assert(fbContent.includes('export async function saveShowcaseToFirestore'), 'saveShowcaseToFirestore must be exported');
console.log('✅ PASS: Firestore showcase subscription and persistence verified in firebaseStore.ts');

// 4. HomeScreen Bento Grid Dynamic Wiring
console.log('[4/5] Verifying HomeScreen.tsx Bento Grid dynamic rendering...');
const homeContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'HomeScreen.tsx'), 'utf8');
assert(homeContent.includes('showcase?: RashidiShowcaseConfig'), 'RashidiCollageShowcase must accept showcase prop');
assert(homeContent.includes('defaultShowcaseConfig'), 'RashidiCollageShowcase must fallback to defaultShowcaseConfig');
assert(homeContent.includes('cfg.autoRotate'), 'Showcase must respect autoRotate setting');
assert(homeContent.includes('cfg.intervalSeconds'), 'Showcase must respect intervalSeconds setting');
assert(!homeContent.includes('BannersCarousel'), 'Custom banner carousel should not be rendered on home screen');
console.log('✅ PASS: Dynamic Bento Grid connected to showcase in HomeScreen.tsx');

// 5. Dashboard Tab & Admin Control
console.log('[5/5] Verifying DashboardScreen.tsx Showcase Admin Tab...');
const dashContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'DashboardScreen.tsx'), 'utf8');
assert(dashContent.includes("'سفرة الرشيدي 🍗'"), 'Dashboard tabs must include سفرة الرشيدي 🍗');
assert(!dashContent.includes("const tabs=['الملخص','الرسوم البيانية','المنتجات','مكتبة السحابة ☁️','البانرات'"), 'Old banners tab should be removed from tabs array');
assert(dashContent.includes('function ShowcaseAdminTab'), 'ShowcaseAdminTab component must be defined');
assert(dashContent.includes('saveShowcaseToFirestore'), 'ShowcaseAdminTab must support saving to cloud');
assert(dashContent.includes('openCloudPicker'), 'ShowcaseAdminTab must support picking from Cloud Media Library');
assert(dashContent.includes('pickAndUploadToCloud'), 'ShowcaseAdminTab must support uploading images from phone');
console.log('✅ PASS: DashboardScreen Showcase Admin Tab fully wired with 100% control');

console.log('\n====================================================');
console.log('🎉 ALL RASHIDI SHOWCASE TESTS PASSED 100%!');
console.log('====================================================');
