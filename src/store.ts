import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AppNotice, AppStory, BadgeOption, Banner, CartLine, Coupon, Order, Product, RashidiShowcaseConfig, defaultShowcaseConfig } from './models';
import { auth, firestore, isFirebaseConfigured } from './firebase';
import { findExistingCustomer } from './customerAuth';
import { defaultProductsCatalog } from './productCatalog';

export type DeliveryLocation = { zone: string; street: string; building: string; coords: string; fullAddress: string };
export const emptyDeliveryLocation: DeliveryLocation = { zone: '', street: '', building: '', coords: '', fullAddress: '' };
export type ThemeMode = 'system' | 'light' | 'dark';
export type StoreStatus = { isOpen: boolean; message: string; nextOpenTime: string };

export const defaultStoreStatus: StoreStatus = {
  isOpen: true,
  message: 'نستقبل طلباتكم يومياً للتوصيل والاستلام',
  nextOpenTime: '١١ صباحاً',
};

export const defaultStories: AppStory[] = [
  {
    id: 'story-fresh-daily',
    title: '',
    subtitle: '',
    icon: 'flame',
    image: 'story-fresh-chicken',
    imageUrl: 'https://iili.io/n4xOnOx.jpg',
    gradientColors: ['#DC2626', '#F59E0B'],
    badge: 'طازة فجر اليوم',
    actionType: 'category',
    actionValue: 'فراخ',
    description: 'دواجن وبط طيور الرشيدي ذبحت يدوياً فجر اليوم على الشريعة الإسلامية.. لحم أبيض ناصع وتغليف صحي معقم فوراً.',
    active: true,
  },
  {
    id: 'story-marinated',
    title: '',
    subtitle: '',
    icon: 'restaurant',
    image: 'story-shish-tawook',
    imageUrl: 'https://iili.io/n4xvQIf.jpg',
    gradientColors: ['#D97706', '#EA580C'],
    badge: 'تتبيلة الشيف',
    actionType: 'category',
    actionValue: 'متبلات',
    description: 'شيش طاووق وبانيه متبل ببهارات الرشيدي الطبيعية 100%.. وفر وقت المطبخ واشوي على طول بطعم المطاعم الفاخرة.',
    active: true,
  },
  {
    id: 'story-offers',
    title: '',
    subtitle: '',
    icon: 'gift',
    image: 'story-fresh-panee',
    imageUrl: 'https://iili.io/n4x8o21.jpg',
    gradientColors: ['#E11D48', '#FB7185'],
    badge: 'تقطيع ليزر',
    actionType: 'category',
    actionValue: 'أجزاء دواجن',
    description: 'صدور دجاج بيضاء مخلية بدون عظم أو دهون، تقطيع رفيع ومثالي للشاورما والبانيه المقرمش.',
    active: true,
  },
  {
    id: 'story-branches',
    title: '',
    subtitle: '',
    icon: 'location',
    image: 'story-alex-branch',
    imageUrl: 'https://iili.io/n4x8WQ4.jpg',
    gradientColors: ['#2563EB', '#0284C7'],
    badge: 'توصيل فوري',
    actionType: 'branch',
    actionValue: 'فرع كامب شيزار',
    description: 'فروعنا في كامب شيزار وسموحة وبحري في خدمتكم يومياً.. تجهيز سريع وتوصيل لجميع أحياء الإسكندرية.',
    active: true,
  },
  {
    id: 'story-quality',
    title: '',
    subtitle: '',
    icon: 'shield-checkmark',
    image: 'story-baladi-poultry',
    imageUrl: 'https://iili.io/n4x8ynR.jpg',
    gradientColors: ['#059669', '#10B981'],
    badge: 'معتمد 100%',
    actionType: 'category',
    actionValue: 'بط',
    description: 'بط فلاحي أصيل وحمام بلدي مغسول ومعقم بعناية تامة بأعلى معايير سلامة الغذاء ونظافة طيور الرشيدي.',
    active: true,
  },
];

export type AppState = {
  products: Product[];
  cart: CartLine[];
  weeklyList: CartLine[];
  coupons: Coupon[];
  orders: Order[];
  banners: Banner[];
  stories?: AppStory[];
  showcase?: RashidiShowcaseConfig;
  categoryImages?: Record<string, string>;
  branchImages?: Record<string, string>;
  badges: BadgeOption[];
  notices: AppNotice[];
  registered: boolean;
  verifiedCustomerIdentifier: string;
  name: string;
  contact: string;
  email?: string;
  points: number;
  loyalty: boolean;
  pointValue: number;
  earnRate: number;
  specialEarnRate: number;
  minPoints: number;
  branch: string;
  fontScale: number;
  addressBook: string[];
  deliveryLocation: DeliveryLocation;
  themeMode: ThemeMode;
  storeStatus: StoreStatus;
  appliedCoupon?: string;
};

export const initialState: AppState = {
  products: defaultProductsCatalog,
  cart: [],
  weeklyList: [],
  coupons: [],
  appliedCoupon: '',
  orders: [],
  banners: [],
  stories: defaultStories,
  showcase: defaultShowcaseConfig,
  categoryImages: {},
  branchImages: {},
  badges: [],
  notices: [],
  registered: false,
  verifiedCustomerIdentifier: '',
  name: 'ضيف الرشيدي',
  contact: '',
  points: 0,
  loyalty: false,
  pointValue: 0,
  earnRate: 0,
  specialEarnRate: 0,
  minPoints: 0,
  branch: 'فرع كامب شيزار',
  fontScale: 1,
  addressBook: [],
  deliveryLocation: emptyDeliveryLocation,
  themeMode: 'system',
  storeStatus: defaultStoreStatus,
};

const cloudStateFields = ['cart', 'weeklyList', 'branch', 'fontScale', 'addressBook', 'deliveryLocation', 'themeMode'] as const;
const LOCAL_STORAGE_KEY = '@alrashidi_local_cart_cache_v2';
const PRODUCTS_CACHE_KEY = '@alrashidi_cached_products_v2';

export async function saveProductsCache(products: Product[]): Promise<void> {
  if (!Array.isArray(products) || !products.length) return;
  try {
    await AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
  } catch (e) {
    console.warn('Failed to cache products to AsyncStorage', e);
  }
}

export async function loadCachedProducts(): Promise<Product[]> {
  try {
    const raw = await AsyncStorage.getItem(PRODUCTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to read cached products from AsyncStorage', e);
  }
  return defaultProductsCatalog;
}

export async function saveLocalCache(state: AppState): Promise<void> {
  try {
    const dataToSave = {
      cart: state.cart || [],
      weeklyList: state.weeklyList || [],
      branch: state.branch || initialState.branch,
      fontScale: state.fontScale || 1,
      addressBook: state.addressBook || [],
      deliveryLocation: state.deliveryLocation || emptyDeliveryLocation,
      themeMode: state.themeMode || 'system',
      stories: state.stories || defaultStories,
      showcase: state.showcase || defaultShowcaseConfig,
      orders: (state.orders || []).slice(0, 50),
      notices: (state.notices || []).slice(0, 30),
    };
    await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    if (Array.isArray(state.products) && state.products.length > 0) {
      await saveProductsCache(state.products);
    }
  } catch (e) {
    console.warn('Failed to save local cache to AsyncStorage', e);
  }
}

export async function loadState(): Promise<AppState> {
  let localData: any = {};
  let cachedProducts: Product[] = defaultProductsCatalog;
  try {
    const [rawState, rawProducts] = await Promise.all([
      AsyncStorage.getItem(LOCAL_STORAGE_KEY),
      AsyncStorage.getItem(PRODUCTS_CACHE_KEY),
    ]);
    if (rawState) localData = JSON.parse(rawState);
    if (rawProducts) {
      const parsed = JSON.parse(rawProducts);
      if (Array.isArray(parsed) && parsed.length > 0) cachedProducts = parsed;
    }
  } catch (e) {
    console.warn('Failed to read local cache from AsyncStorage', e);
  }

  const baseState: AppState = {
    ...initialState,
    products: cachedProducts,
    cart: Array.isArray(localData.cart) ? localData.cart : [],
    weeklyList: Array.isArray(localData.weeklyList) ? localData.weeklyList : [],
    branch: typeof localData.branch === 'string' ? localData.branch : initialState.branch,
    fontScale: typeof localData.fontScale === 'number' ? localData.fontScale : 1,
    addressBook: Array.isArray(localData.addressBook)
      ? localData.addressBook.filter((x: unknown): x is string => typeof x === 'string')
      : [],
    deliveryLocation:
      localData.deliveryLocation && typeof localData.deliveryLocation === 'object'
        ? { ...emptyDeliveryLocation, ...localData.deliveryLocation }
        : emptyDeliveryLocation,
    themeMode: localData.themeMode === 'light' || localData.themeMode === 'dark' ? localData.themeMode : 'system',
    stories: Array.isArray(localData.stories) && localData.stories.length > 0 ? localData.stories : defaultStories,
    showcase: localData.showcase && typeof localData.showcase === 'object' && localData.showcase.preset1 ? localData.showcase : defaultShowcaseConfig,
    orders: Array.isArray(localData.orders) ? localData.orders : [],
    notices: Array.isArray(localData.notices) ? localData.notices : [],
  };

  if (!isFirebaseConfigured || !firestore) return baseState;
  try { await auth?.authStateReady(); } catch {}
  const uid = auth?.currentUser?.uid;
  if (!uid) return baseState;

  try {
    const snapshot = await getDoc(doc(firestore, 'user_app_state', uid));
    const saved = snapshot.exists() ? snapshot.data() : {};
    const firebaseUser = auth?.currentUser;
    const profile = firebaseUser?.email ? await findExistingCustomer(firebaseUser.email).catch(() => null) : null;
    const mergedState: AppState = {
      ...baseState,
      registered: Boolean(profile),
      verifiedCustomerIdentifier: profile?.loginIdentifier || '',
      name: profile?.name || 'ضيف الرشيدي',
      contact: profile?.contact || '',
      points: profile?.points || 0,
      cart: Array.isArray(saved.cart) && saved.cart.length ? saved.cart : baseState.cart,
      weeklyList: Array.isArray(saved.weeklyList) && saved.weeklyList.length ? saved.weeklyList : baseState.weeklyList,
      branch: typeof saved.branch === 'string' ? saved.branch : baseState.branch,
      fontScale: typeof saved.fontScale === 'number' ? saved.fontScale : baseState.fontScale,
      addressBook:
        Array.isArray(saved.addressBook) && saved.addressBook.length
          ? saved.addressBook.filter((x: unknown): x is string => typeof x === 'string')
          : baseState.addressBook,
      deliveryLocation:
        saved.deliveryLocation && typeof saved.deliveryLocation === 'object'
          ? { ...emptyDeliveryLocation, ...saved.deliveryLocation }
          : baseState.deliveryLocation,
      themeMode: saved.themeMode === 'light' || saved.themeMode === 'dark' ? saved.themeMode : baseState.themeMode,
    };
    await saveLocalCache(mergedState);
    return mergedState;
  } catch {
    return baseState;
  }
}

export async function saveState(state: AppState): Promise<void> {
  // Always persist to local device storage unconditionally
  await saveLocalCache(state);

  // Sync to Firestore if authenticated
  if (isFirebaseConfigured && firestore) {
    const uid = auth?.currentUser?.uid;
    if (uid) {
      try {
        const cloudState = Object.fromEntries(cloudStateFields.map((field) => [field, state[field]]));
        await setDoc(doc(firestore, 'user_app_state', uid), { ...cloudState, updatedAt: Date.now() }, { merge: true });
      } catch (err) {
        console.warn('Cloud saveState skipped or failed', err);
      }
    }
  }
}
