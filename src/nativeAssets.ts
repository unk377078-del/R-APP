import { ImageSourcePropType } from 'react-native';
import { cloudImages, toCdnUrl } from './cloudAssets';

/**
 * All assets in Al-Rashidi Market are 100% cloud-powered from high-speed CDNs.
 * Only the core logo & fallback thumbnail are kept locally for instant startup.
 */
export const images: Record<string, any> = {
  'brand-logo': require('../assets/android/logo_alrashidi.png'),
  'chicken': require('../assets/android/prod_chicken_whole.png'),
  'duck': require('../assets/android/prod_duck.png'),
  'pigeon': require('../assets/android/prod_hamam.png'),
  'panee': require('../assets/android/prod_panee.png'),
  'shish': require('../assets/android/prod_shish.png'),
  'wings': require('../assets/android/prod_wings.png'),
  'drumsticks': require('../assets/android/prod_drumsticks.png'),
  'hero-chicken': require('../assets/android/hero_chicken_banner_1790709457836.jpg'),
  'hero-marinated': require('../assets/android/hero_marinated_banner_1790709470755.jpg'),
  'branch-camp': require('../assets/android/branch_camp_cesar.png'),
  'branch-smouha': require('../assets/android/branch_smouha.png'),
  'branch-bahary': require('../assets/android/branch_bahary.png'),
  'story-fresh-chicken': require('../assets/stories/story_fresh_chicken.jpg'),
  'story-shish-tawook': require('../assets/stories/story_shish_tawook.jpg'),
  'story-fresh-panee': require('../assets/stories/story_fresh_panee.jpg'),
  'story-alex-branch': require('../assets/stories/story_alex_branch.jpg'),
  'story-baladi-poultry': require('../assets/stories/story_baladi_poultry.jpg'),
  'product-burger': { uri: toCdnUrl(cloudImages['product-burger'], 380) },
  'product-marinated-shawerma': { uri: toCdnUrl(cloudImages['product-marinated-shawerma'], 380) },
};

// Map all 71 cloud catalog images to fast Cloudflare CDN WebP URIs
for (const [key, rawUrl] of Object.entries(cloudImages)) {
  if (!images[key] && typeof rawUrl === 'string') {
    images[key] = { uri: toCdnUrl(rawUrl, key.startsWith('story-') ? 480 : 380) };
  }
}

export const productImageKeys = Object.keys(images).filter((key) => key.startsWith('product-'));

export const branchDetails = [
  { name: 'فرع كامب شيزار', address:'كامب شيزار', locationAddress:'شارع بورسعيد أمام مستشفى القوات المسلحة', tag: 'الرئيسي', phone: '01223381405', landline: '035900717 · 035927195', mobiles: '01223381405 · 01099342344', whatsapp: '201223381405', image: 'branch-camp', latitude: 31.2120425, longitude: 29.9287196 },
  { name: 'فرع سموحة', address:'سموحة', locationAddress:'سموحة', tag: 'سموحة', phone: '01226151455', landline: '034261199', mobiles: '01226151455 · 01018532722', whatsapp: '201226151455', image: 'branch-smouha', latitude: undefined, longitude: undefined },
  { name: 'فرع بحري', address:'بحري', locationAddress:'بحري', tag: 'بحري', phone: '01282398999', landline: '—', mobiles: '01282398999', whatsapp: '201282398999', image: 'branch-bahary', latitude: undefined, longitude: undefined },
];

export function getBranchImageSource(
  branch: { name: string; image: string } | string,
  branchImages?: Record<string, string>
): any {
  const branchName = typeof branch === 'string' ? branch : branch.name;
  const defaultKey = typeof branch === 'string' ? branch : branch.image;
  const custom = branchImages?.[branchName] || branchImages?.[defaultKey];
  if (custom) {
    if (custom.startsWith('http') || custom.startsWith('data:')) {
      return { uri: toCdnUrl(custom, 450) };
    }
    if (images[custom]) {
      return images[custom];
    }
    if (cloudImages[custom]) {
      return { uri: toCdnUrl(cloudImages[custom], 450) };
    }
  }
  if (images[defaultKey]) {
    return images[defaultKey];
  }
  if (cloudImages[defaultKey]) {
    return { uri: toCdnUrl(cloudImages[defaultKey], 450) };
  }
  return images['chicken'];
}

export const alexandriaAreas = ['كامب شيزار','سموحة','جناكليس','بحري والأنفوشي','سيدي بشر','جليم','رشدي','ستانلي','الإبراهيمية','كليوباترا','لوران','زيزينيا','سابا باشا','فكتوريا','ميامي','العصافرة','المندرة','السيوف','محرم بك','سيدي جابر','الشاطبي','المنشية والعطارين'];
export const deliverySlots = ['خلال ساعتين إلى 3 ساعات','من 11 صباحاً إلى 1 مساءً','من 1 مساءً إلى 3 مساءً','من 3 مساءً إلى 5 مساءً','من 5 مساءً إلى 8 مساءً'];
