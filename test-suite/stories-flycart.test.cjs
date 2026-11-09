const assert = require('assert');
const fs = require('fs');

console.log('=== TEST: STORIES & FLY-TO-CART MICRO-INTERACTION ===\n');

// 1. Test Stories Model and File Integrity
console.log('[1/4] Testing Stories Model & Store Definitions in TypeScript Source...');
const storeSource = fs.readFileSync('./src/store.ts', 'utf8');
assert(storeSource.includes('export const defaultStories: AppStory[]'), 'defaultStories must be defined in src/store.ts');
assert(storeSource.includes('story-fresh-daily'), 'Must include story-fresh-daily');
assert(storeSource.includes('story-marinated'), 'Must include story-marinated');
assert(storeSource.includes('story-offers'), 'Must include story-offers');
assert(storeSource.includes('story-branches'), 'Must include story-branches');
assert(storeSource.includes('story-quality'), 'Must include story-quality');
console.log('✅ PASS: defaultStories definitions verified in src/store.ts');

// 2. Test StoriesBar Component Source Integrity
console.log('\n[2/4] Testing StoriesBar Component & Modal Implementation...');
const storiesBarSource = fs.readFileSync('./src/StoriesBar.tsx', 'utf8');
assert(storiesBarSource.includes('export function StoriesBar'), 'StoriesBar must be exported');
assert(storiesBarSource.includes('StoryCircleItem'), 'StoryCircleItem component must exist');
assert(storiesBarSource.includes('StoryViewerModal'), 'StoryViewerModal must exist');
assert(storiesBarSource.includes('STORY_DURATION_MS = 5500'), 'Story progress timer set to 5.5s');
assert(storiesBarSource.includes('fontRuqaaBold'), 'Uses authentic Aref Ruqaa bold font for titles');
console.log('✅ PASS: StoriesBar and StoryViewerModal verified');

// 3. Test Dashboard Stories Administration
console.log('\n[3/4] Testing Dashboard Stories Admin Tab & Controls...');
const dashboardSource = fs.readFileSync('./src/DashboardScreen.tsx', 'utf8');
assert(dashboardSource.includes("'الستوريز ⭐'"), "Dashboard tabs must include 'الستوريز ⭐'");
assert(dashboardSource.includes('function StoriesAdminTab'), 'StoriesAdminTab component must exist');
assert(dashboardSource.includes('onStoriesChange'), 'onStoriesChange callback must be supported');
assert(dashboardSource.includes('storyColorThemes'), 'Color theme presets must be available');
assert(dashboardSource.includes('storyIconsList'), 'Curated professional icons list must be available');
console.log('✅ PASS: Dashboard Stories management tab verified');

// 4. Test Fly-to-Cart Animation in App.tsx
console.log('\n[4/4] Testing Fly-to-Cart Animation & Button Pulse in App.tsx...');
const appSource = fs.readFileSync('./App.tsx', 'utf8');
assert(appSource.includes('triggerFlyToCart'), 'triggerFlyToCart function must exist in App.tsx');
assert(appSource.includes('flyingProduct'), 'flyingProduct state must exist in App.tsx');
assert(appSource.includes('cartBounce'), 'cartBounce spring animation must exist in App.tsx');
assert(appSource.includes('scale:cartBounce'), 'Cart button must have bounce transform scale');
console.log('✅ PASS: Fly-to-Cart animation and cart button pulse verified');

console.log('\n====================================================');
console.log('🎉 ALL STORIES & MICRO-INTERACTION TESTS PASSED 100%!');
console.log('====================================================');
