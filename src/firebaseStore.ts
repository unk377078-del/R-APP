import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, query, runTransaction, setDoc, updateDoc, where } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { AppNotice, AppStory, BadgeOption, Banner, CartLine, Order, PrepGroup, Product, RashidiShowcaseConfig } from './models';
import { StoreStatus } from './store';
import { auth, firestore, isFirebaseConfigured, storage } from './firebase';
import { uploadImageToCloud } from './cloudMedia';
import { isNoticeCleared, isNoticeRead } from './notificationsStorage';

const categoryLabels: Record<string, string> = {
  ALL: 'الكل', CHICKEN: 'فراخ', DUCK: 'بط', TURKEY: 'رومي',
  PIGEON_QUAIL: 'حمام وسمان', MARINATED: 'متبلات', CUTS: 'أجزاء دواجن', OTHER: 'أخرى وأرانب',
};
const unitLabels: Record<string, string> = {
  KILO: 'للكيلو', PIECE: 'للقطعة', PAIR: 'للجوز', PLATE: 'للطبق', BIRD: 'للطائر',
};
const imageNames: Record<string, string> = {
  prod_chicken_whole: 'chicken', prod_duck: 'duck', prod_hamam: 'pigeon',
  prod_panee: 'panee', prod_shish: 'shish', prod_wings: 'wings', prod_drumsticks: 'drumsticks',
};

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

async function uploadDataImageIfNeeded(value: string | undefined, path: string): Promise<string> {
  if (!value) return '';
  if (value.startsWith('http') || value.startsWith('data:image/')) return value;
  try {
    const { url } = await uploadImageToCloud(value, path.replace(/\//g, '_'));
    if (url) return url;
  } catch (e) {
    console.warn('uploadDataImageIfNeeded fallback:', e);
  }
  return value;
}

export async function refreshFirestoreData(): Promise<void> {
  if (!firestore || !isFirebaseConfigured) throw new Error('الخادم السحابي غير متاح حالياً');
  await Promise.all([
    getDocs(collection(firestore, 'products')),
    getDocs(collection(firestore, 'orders')),
    getDocs(collection(firestore, 'promotional_broadcasts')),
    getDoc(doc(firestore, 'app_settings', 'hero_banners')),
    getDoc(doc(firestore, 'app_settings', 'loyalty_config')),
    getDoc(doc(firestore, 'app_settings', 'category_images')),
    getDoc(doc(firestore, 'app_settings', 'branch_images')),
  ]);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function mapFirestoreProduct(id: string, data: Record<string, unknown>, previous?: Product): Product | null {
  if (typeof data.name !== 'string' || !data.name.trim()) return null;
  const categoryKey = String(data.category || 'CHICKEN').toUpperCase();
  const unitKey = String(data.defaultUnit || 'KILO').toUpperCase();
  const rawPrepOptions = Array.isArray(data.prepOptions) ? data.prepOptions : [];
  const hasFirestorePrep = rawPrepOptions.length > 0;
  const prepGroups: PrepGroup[] = hasFirestorePrep
    ? (rawPrepOptions as unknown[]).flatMap((item: unknown): PrepGroup[] => {
        if (!item || typeof item !== 'object') return [];
        const option = item as { type?: unknown; subOptions?: unknown };
        const type = typeof option.type === 'string' ? option.type : '';
        const subOptions = stringArray(option.subOptions);
        const labels: Record<string, string> = {
          WHOLE: 'سليم', CUT: 'تقطيع', DEBONED: 'خلي', SKINNED: 'سلخ', HALF_LENGTHWISE: 'نصف بالطول',
        };
        return type ? [{ type, label: labels[type] || type, subOptions }] : [];
      })
    : (previous?.prepGroups || []);
  const legacyPrep = hasFirestorePrep ? stringArray(rawPrepOptions) : (previous?.prepOptions || []);
  const imageName = typeof data.imageResName === 'string' ? data.imageResName : '';
  const isPriceOnCall = Boolean(data.isPriceOnCall) || typeof data.price !== 'number';
  const remotePrice = numberOr(data.price, previous?.price ?? 0);

  return {
    ...previous,
    id,
    name: data.name,
    category: categoryLabels[categoryKey] || categoryKey,
    subtitle: typeof data.subtitle === 'string' ? data.subtitle : previous?.subtitle,
    weightNote: typeof data.weightNote === 'string' ? data.weightNote : previous?.weightNote,
    price: remotePrice,
    piecePrice: numberOr(data.pricePerPiece, numberOr(data.piecePrice, previous?.piecePrice ?? 0)) || undefined,
    originalPrice: numberOr(data.originalPrice, previous?.originalPrice ?? 0) || undefined,
    originalPiecePrice: numberOr(data.originalPiecePrice, previous?.originalPiecePrice ?? 0) || undefined,
    unit: (() => {
      const allowK = typeof data.allowSellingByKilo === 'boolean' ? data.allowSellingByKilo : (unitKey === 'KILO' || stringArray(data.supportedUnits).includes('KILO'));
      const u = typeof data.unit === 'string' && data.unit.trim() ? data.unit.trim() : (unitLabels[unitKey] || previous?.unit || 'كيلو');
      return (!allowK && /^(للكيلو|كيلو|كجم|ك)$/i.test(u)) ? 'للقطعة' : u;
    })(),
    emoji: previous?.emoji || '🍗',
    image: (typeof data.image === 'string' && data.image) ? data.image : (imageNames[imageName] || (imageName ? imageName : undefined) || previous?.image || 'chicken'),
    imageUri: typeof data.imageUri === 'string' ? data.imageUri : previous?.imageUri,
    badge: typeof data.badge === 'string' && data.badge ? data.badge : undefined,
    badgeColor: typeof data.badgeColor === 'string' ? data.badgeColor : previous?.badgeColor,
    available: typeof data.isAvailable === 'boolean' ? data.isAvailable : (typeof data.available === 'boolean' ? data.available : true),
    // Android's shared product schema has no stock field. Keep device stock intact.
    stock: numberOr(data.stock, previous?.stock ?? 20),
    sizes: stringArray(data.availableSizes).length ? stringArray(data.availableSizes) : previous?.sizes,
    prepOptions: legacyPrep,
    prepGroups: prepGroups,
    allowHalfUnit: typeof data.allowHalfUnit === 'boolean' ? data.allowHalfUnit : previous?.allowHalfUnit,
    allowSellingByKilo: typeof data.allowSellingByKilo === 'boolean' ? data.allowSellingByKilo : unitKey === 'KILO' || stringArray(data.supportedUnits).includes('KILO'),
    allowSellingByPiece: typeof data.allowSellingByPiece === 'boolean' ? data.allowSellingByPiece : stringArray(data.supportedUnits).includes('PIECE'),
    priceOnCall: isPriceOnCall,
    featured: Boolean(data.isFeaturedInGrid ?? data.featured ?? previous?.featured),
    offer: Boolean(data.isOffer ?? data.offer ?? previous?.offer),
  };
}

export function subscribeProducts(
  onProducts: (products: Product[]) => void,
  onError: (error: Error) => void,
): Unsubscribe | undefined {
  if (!firestore || !isFirebaseConfigured) return undefined;
  return onSnapshot(collection(firestore, 'products'), (snapshot) => {
    const products = snapshot.docs
      .map((item) => mapFirestoreProduct(item.id, item.data()))
      .filter((item): item is Product => item !== null);
    onProducts(products);
  }, (error) => onError(error));
}

export function subscribeAppSettings(onChange: (settings: {
  banners?: Banner[];
  stories?: AppStory[];
  showcase?: RashidiShowcaseConfig;
  categoryImages?: Record<string, string>;
  branchImages?: Record<string, string>;
  badges?: BadgeOption[];
  loyalty?: { enabled: boolean; pointValue: number; earnRate: number; specialEarnRate: number; minPoints: number }; storeStatus?: StoreStatus;
}) => void, onError: (error: Error) => void): Unsubscribe | undefined {
  if (!firestore || !isFirebaseConfigured) return undefined;
  const stops = [
    onSnapshot(doc(firestore, 'app_settings', 'showcase'), (snapshot) => {
      if (!snapshot.exists()) return;
      const raw = snapshot.data();
      if (raw && typeof raw === 'object' && raw.preset1) {
        onChange({ showcase: raw as RashidiShowcaseConfig });
      }
    }, onError),
    onSnapshot(doc(firestore, 'app_settings', 'hero_banners'), (snapshot) => {
      const raw = snapshot.data()?.banners;
      if (!Array.isArray(raw)) return;
      const banners = raw.flatMap((item): Banner[] => {
        if (!item || typeof item !== 'object') return [];
        const value = item as Record<string, unknown>;
        if (typeof value.id !== 'string' || typeof value.title !== 'string') return [];
        return [{
          id: value.id,
          title: value.title,
          subtitle: typeof value.subtitle === 'string' ? value.subtitle : '',
          emoji: '🎉',
          color: '#0E2F65',
          image: typeof value.image === 'string' ? value.image : undefined,
          imageUri: typeof value.imageUri === 'string' ? value.imageUri : undefined,
          active: typeof value.isActive === 'boolean' ? value.isActive : true,
        }];
      });
      onChange({ banners });
    }, onError),
    onSnapshot(doc(firestore, 'app_settings', 'app_stories'), (snapshot) => {
      const raw = snapshot.data()?.stories;
      if (!Array.isArray(raw)) return;
      const stories = raw.flatMap((item): AppStory[] => {
        if (!item || typeof item !== 'object') return [];
        const v = item as Record<string, any>;
        if (typeof v.id !== 'string' || typeof v.title !== 'string') return [];
        return [{
          id: v.id,
          title: v.title,
          subtitle: typeof v.subtitle === 'string' ? v.subtitle : '',
          icon: typeof v.icon === 'string' ? v.icon : 'flame',
          imageUrl: typeof v.imageUrl === 'string' ? v.imageUrl : undefined,
          imageUri: typeof v.imageUri === 'string' ? v.imageUri : undefined,
          gradientColors: Array.isArray(v.gradientColors) && v.gradientColors.length >= 2 ? [v.gradientColors[0], v.gradientColors[1]] : ['#DC2626', '#F59E0B'],
          badge: typeof v.badge === 'string' ? v.badge : undefined,
          actionType: v.actionType || 'category',
          actionValue: typeof v.actionValue === 'string' ? v.actionValue : '',
          description: typeof v.description === 'string' ? v.description : '',
          active: typeof v.active === 'boolean' ? v.active : true,
          createdAt: typeof v.createdAt === 'number' ? v.createdAt : Date.now(),
        }];
      });
      onChange({ stories });
    }, onError),
    onSnapshot(doc(firestore, 'app_settings', 'loyalty_config'), (snapshot) => {
      if (!snapshot.exists()) return;
      const value = snapshot.data();
      onChange({ loyalty: {
        enabled: typeof value.isEnabled === 'boolean' ? value.isEnabled : true,
        pointValue: numberOr(value.pointValueEgp, 0.5),
        earnRate: Math.max(0, Math.floor(numberOr(value.pointsPerProductUnit, numberOr(value.pointsPerHundredEgp, 10)))),
        specialEarnRate: Math.max(0, Math.floor(numberOr(value.specialPointsPerProductUnit, 5))),
        minPoints: numberOr(value.minPointsToRedeem, 50),
      } });
    }, onError),
    onSnapshot(doc(firestore, 'app_settings', 'category_images'), (snapshot) => {
      const raw = snapshot.data()?.images;
      if (!raw || typeof raw !== 'object') return;
      const categoryImages = Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
      onChange({ categoryImages });
    }, onError),
    onSnapshot(doc(firestore, 'app_settings', 'branch_images'), (snapshot) => {
      const raw = snapshot.data()?.images;
      if (!raw || typeof raw !== 'object') return;
      const branchImages = Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
      onChange({ branchImages });
    }, onError),
    onSnapshot(doc(firestore, 'app_settings', 'available_badges'), (snapshot) => {
      const raw = snapshot.data()?.badges;
      if (!Array.isArray(raw)) return;
      const badges = raw.flatMap((item): BadgeOption[] => {
        if (typeof item === 'string') return [{ name: item, color: '#237A57' }];
        if (!item || typeof item !== 'object') return [];
        const value = item as Record<string, unknown>;
        return typeof value.name === 'string' ? [{ name: value.name, color: typeof value.color === 'string' ? value.color : '#237A57' }] : [];
      });
      onChange({ badges });
    }, onError),
    onSnapshot(doc(firestore, 'app_settings', 'store_status'), (snapshot) => {
      const data = snapshot.data();
      if (data) {
        onChange({
          storeStatus: {
            isOpen: typeof data.isOpen === 'boolean' ? data.isOpen : true,
            message: typeof data.message === 'string' ? data.message : 'نستقبل طلباتكم يومياً للتوصيل والاستلام',
            nextOpenTime: typeof data.nextOpenTime === 'string' ? data.nextOpenTime : '١١ صباحاً',
          }
        });
      }
    }, onError),
  ];
  return () => stops.forEach((stop) => stop());
}

function orderItemToFirestore(item: CartLine, categoryLabel?: string) {
  const category = Object.entries(categoryLabels).find(([, label]) => label === categoryLabel)?.[0] || categoryLabel || '';
  const rawUnit = (item.unit || '').trim();
  let unitKey = 'KILO';

  if (/^(للقطعة|قطعة|قطع|بالقطعة|عدد|حبة|piece)$/i.test(rawUnit)) {
    unitKey = 'PIECE';
  } else if (/^(للطائر|طائر|دجاجة|فرخة|بطة|أرنب|ارنب|bird)$/i.test(rawUnit)) {
    unitKey = 'PIECE';
  } else if (/^(للجوز|جوز|الجوز|بالجوز|pair)$/i.test(rawUnit)) {
    unitKey = 'PAIR';
  } else if (/^(للطبق|طبق|الطبق|بالطبق|plate|كرتونة|كرتونه|الكرتونة|للكرتونة|carton)$/i.test(rawUnit)) {
    unitKey = 'PLATE';
  } else if (/^(للكيلو|كيلو|كجم|ك|kilo)$/i.test(rawUnit)) {
    if (/حي|طائر/.test(item.name || '') && item.size && !/^(عادي|standard|الافتراضي)$/i.test(item.size)) {
      unitKey = 'PIECE';
    } else {
      unitKey = 'KILO';
    }
  } else {
    if (/حي|طائر/.test(item.name || '') || (item.size && !/^(عادي|standard|الافتراضي)$/i.test(item.size))) {
      unitKey = 'PIECE';
    } else {
      unitKey = Object.entries(unitLabels).find(([, label]) => label === item.unit)?.[0] || 'KILO';
    }
  }

  return {
    cartItemId: item.id,
    productId: item.productId,
    productName: item.name,
    productCategory: category,
    price: item.price,
    quantity: item.quantity,
    unit: unitKey,
    selectedSize: item.size || '',
    selectedPrep: item.selectedPrep || item.options?.[0] || '',
    selectedSubOption: item.selectedSubOption || item.options?.[1] || '',
    specialNotes: item.note || '',
  };
}

export async function saveOrderToFirestore(order: Order, branchName: string, products: Product[]): Promise<void> {
  if (!firestore || !isFirebaseConfigured) throw new Error('Firebase Web App settings are missing');
  const isPickup = order.address === branchName;
  const payment = /instapay/i.test(order.payment) ? 'INSTAPAY' : /بطاقة|فيزا|الكتروني|إلكتروني/i.test(order.payment) ? 'CARD' : 'CASH';
  const orderRef = doc(firestore, 'orders', order.id);
  const orderNumber = order.orderNumber || (parseInt(order.id, 10) > 0 ? parseInt(order.id, 10) : undefined);
  const orderData = {
    orderId: order.id,
    orderNumber: orderNumber || null,
    displayId: String(order.id),
    ownerUid: auth?.currentUser?.uid || '',
    customerName: order.customer,
    customerPhone: order.phone,
    customerEmail: order.email || '',
    customerDocumentId: order.customerDocumentId || '',
    deliveryMethod: isPickup ? 'BRANCH_PICKUP' : 'HOME_DELIVERY',
    branchName: isPickup ? branchName : '',
    area: isPickup ? '' : order.addressDetails?.zone || order.address,
    street: isPickup ? '' : order.addressDetails?.street || '',
    buildingInfo: isPickup ? '' : order.addressDetails?.building || '',
    formattedAddress: isPickup ? '' : order.addressDetails?.fullAddress || '',
    latitude: isPickup ? null : Number(order.addressDetails?.coords.split(',')[0]) || null,
    longitude: isPickup ? null : Number(order.addressDetails?.coords.split(',')[1]) || null,
    deliveryTimeSlot: order.schedule,
    paymentMethod: payment,
    generalNotes: order.note,
    subtotal: order.subtotal,
    discount: Math.max(0, order.discount - (order.loyaltyDiscountAmount || 0)),
    deliveryFee: Math.max(0, order.deliveryFee || 0),
    total: order.total,
    usedLoyaltyPoints: (order.pointsUsed || 0) > 0,
    pointsUsed: Math.floor(numberOr(order.pointsUsed, 0)),
    loyaltyDiscountAmount: order.loyaltyDiscountAmount || 0,
        pointsEarned: Math.floor(numberOr(order.pointsEarned, 0)),
    couponCode: order.couponCode || '',
    timestamp: new Date(order.createdAt).toISOString(),
    status: order.status,
    createdAt: order.createdAt,
    items: order.items.map((item) => orderItemToFirestore(item, products.find((product) => product.id === item.productId)?.category)),
    source: 'expo-app',
  };
  if ((order.pointsUsed && order.customerDocumentId) || order.couponCode) {
    const userRef = order.pointsUsed && order.customerDocumentId ? doc(firestore, 'users', order.customerDocumentId) : undefined;
    const couponRef = order.couponCode ? doc(firestore, 'promotional_broadcasts', order.couponCode.toUpperCase()) : undefined;
    await runTransaction(firestore, async (transaction) => {
      const existingOrder = await transaction.get(orderRef);
      if (existingOrder.exists()) throw new Error('Order ID already exists');
      let currentPoints = 0;
      if (userRef) {
        const userSnapshot = await transaction.get(userRef);
        if (!userSnapshot.exists() || String(userSnapshot.data().role || '').toUpperCase() !== 'CUSTOMER') throw new Error('Customer loyalty profile was not found');
        currentPoints = Math.floor(numberOr(userSnapshot.data().loyaltyPoints, 0));
        if (currentPoints < Math.floor(order.pointsUsed!)) throw new Error('Customer loyalty balance changed; refresh and try again');
      }
      let couponUses: number | undefined;
      if (couponRef) {
        const couponSnapshot = await transaction.get(couponRef);
        if (!couponSnapshot.exists() || !couponSnapshot.data().type) throw new Error('الكوبون لم يعد متاحاً؛ احذفه من السلة وحاول مرة أخرى');
        const couponData = couponSnapshot.data();
        const eligibleCustomerIds = Array.isArray(couponData.eligibleCustomerIds) ? couponData.eligibleCustomerIds.filter((id): id is string => typeof id === 'string') : [];
        if (eligibleCustomerIds.length && !eligibleCustomerIds.includes(order.customerDocumentId || '')) throw new Error('هذا الكوبون مخصص لحساب عميل آخر');
        couponUses = numberOr(couponData.uses, 0);
        const maxUses = numberOr(couponData.maxUses, 0);
        if (couponData.isActive === false || numberOr(couponData.expiresAt, 0) <= Date.now() || (maxUses > 0 && couponUses >= maxUses)) throw new Error('انتهت صلاحية الكوبون أو وصل إلى الحد الأقصى للاستخدام');
      }
      if (userRef) transaction.set(userRef, { loyaltyPoints: Math.max(0, currentPoints - Math.floor(order.pointsUsed!)) }, { merge: true });
      if (couponRef && couponUses !== undefined) transaction.set(couponRef, { uses: couponUses + 1, updatedAt: Date.now() }, { merge: true });
      transaction.set(orderRef, orderData);
    });
  } else {
    await setDoc(orderRef, orderData);
  }
}

const firestoreCategories: Record<string, string> = {
  'فراخ':'CHICKEN', 'بط':'DUCK', 'رومي':'TURKEY', 'حمام وسمان':'PIGEON_QUAIL',
  'متبلات':'MARINATED', 'أجزاء دواجن':'CUTS', 'أخرى وأرانب':'OTHER',
};
const firestoreUnits: Record<string, string> = { 'للكيلو':'KILO', 'للقطعة':'PIECE', 'للجوز':'PAIR', 'للطبق':'PLATE', 'للطائر':'BIRD' };
const prepCodes: Record<string, string> = { 'سليم':'WHOLE', 'تقطيع':'CUT', 'مقطع':'CUT', 'خلي':'DEBONED', 'سلخ':'SKINNED', 'نصف بالطول':'HALF_LENGTHWISE' };

export async function saveProductToFirestore(product: Product): Promise<void> {
  if (!firestore || !isFirebaseConfigured) throw new Error('الخادم السحابي غير متاح حالياً');
  const imageUri=await uploadDataImageIfNeeded(product.imageUri,`products/${product.id}/image.jpg`);
  const groups = product.prepGroups || [];
  const prepOptions = groups.map((group) => ({
    type: prepCodes[group.label] || group.type,
    subOptions: group.subOptions || [],
  }));
  const supportedUnits = [product.allowSellingByKilo !== false ? 'KILO' : '', product.allowSellingByPiece ? 'PIECE' : ''].filter(Boolean);
  await setDoc(doc(firestore, 'products', product.id), {
    name: product.name,
    category: firestoreCategories[product.category] || product.category,
    subtitle: product.subtitle || '',
    weightNote: product.weightNote || '',
    price: product.price,
    pricePerPiece: product.piecePrice ?? null,
    originalPrice: product.originalPrice ?? null,
    originalPiecePrice: product.originalPiecePrice ?? null,
    unit: product.unit || 'كيلو',
    defaultUnit: firestoreUnits[product.unit] || 'KILO',
    supportedUnits,
    isAvailable: product.available,
    stock: product.stock,
    availableSizes: product.sizes || [],
    prepOptions,
    image: product.image || 'chicken',
    imageResName: Object.entries(imageNames).find(([, name]) => name === product.image)?.[0] || product.image || '',
    imageUri,
    badge: product.badge || '',
    badgeColor: product.badgeColor || '',
    isFeaturedInGrid: Boolean(product.featured),
    isOffer: Boolean(product.offer),
    isPriceOnCall: Boolean(product.priceOnCall),
    allowHalfUnit: product.allowHalfUnit !== false,
    allowSellingByKilo: product.allowSellingByKilo !== false,
    allowSellingByPiece: Boolean(product.allowSellingByPiece),
  }, { merge: true });
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  if (!firestore || !isFirebaseConfigured) throw new Error('الخادم السحابي غير متاح حالياً');
  await deleteDoc(doc(firestore, 'products', productId));
}

export async function saveCouponToFirestore(coupon: import('./models').Coupon): Promise<void> {
  if (!firestore || !isFirebaseConfigured) throw new Error('الخادم السحابي غير متاح حالياً');
  await setDoc(doc(firestore, 'promotional_broadcasts', coupon.code), {
    code: coupon.code, type: coupon.type, value: coupon.value, minimum: coupon.minimum, maxDiscount: coupon.maxDiscount || 0, maxUses: coupon.maxUses || 0,
    expiresAt: coupon.expiresAt, isActive: coupon.active, uses: coupon.uses, popup: coupon.popup, eligibleCustomerIds: coupon.eligibleCustomerIds || [],
    updatedAt: Date.now(),
  }, { merge: true });
}

export async function deleteCouponFromFirestore(code: string): Promise<void> {
  if (!firestore || !isFirebaseConfigured) throw new Error('الخادم السحابي غير متاح حالياً');
  await deleteDoc(doc(firestore, 'promotional_broadcasts', code));
}

export async function saveShowcaseToFirestore(config: RashidiShowcaseConfig): Promise<void> {
  if (!firestore || !isFirebaseConfigured) throw new Error('الخادم السحابي غير متاح حالياً');
  await setDoc(doc(firestore, 'app_settings', 'showcase'), {
    ...config,
    updatedAt: Date.now(),
  }, { merge: true });
}

export async function saveBannersToFirestore(banners: Banner[]): Promise<void> {
  if (!firestore || !isFirebaseConfigured) throw new Error('الخادم السحابي غير متاح حالياً');
  const cloudBanners=await Promise.all(banners.map(async({id,title,subtitle,image,imageUri,active})=>({id,title,subtitle,image:image||'',imageUri:await uploadDataImageIfNeeded(imageUri,`banners/${id}/image.jpg`),isActive:active})));
  await setDoc(doc(firestore, 'app_settings', 'hero_banners'), {
    banners: cloudBanners,
    updatedAt: Date.now(),
  }, { merge: true });
}

export async function saveStoriesToFirestore(stories: AppStory[]): Promise<void> {
  if (!firestore || !isFirebaseConfigured) throw new Error('الخادم السحابي غير متاح حالياً');
  const cloudStories = await Promise.all(stories.map(async (story) => ({
    ...story,
    imageUri: story.imageUri ? await uploadDataImageIfNeeded(story.imageUri, `stories/${story.id}/image.jpg`) : '',
    updatedAt: Date.now(),
  })));
  await setDoc(doc(firestore, 'app_settings', 'app_stories'), {
    stories: cloudStories,
    updatedAt: Date.now(),
  }, { merge: true });
}

export async function saveCategoryImagesToFirestore(images: Record<string, string>): Promise<void> {
  if (!firestore || !isFirebaseConfigured) throw new Error('الخادم السحابي غير متاح حالياً');
  const cloudImages=Object.fromEntries(await Promise.all(Object.entries(images).map(async([category,image])=>[category,await uploadDataImageIfNeeded(image,`categories/${encodeURIComponent(category)}/image.jpg`)] as const)));
  await setDoc(doc(firestore, 'app_settings', 'category_images'), { images:cloudImages, updatedAt: Date.now() }, { merge: true });
}

export async function saveBranchImagesToFirestore(images: Record<string, string>): Promise<void> {
  if (!firestore || !isFirebaseConfigured) throw new Error('الخادم السحابي غير متاح حالياً');
  const cloudImages = Object.fromEntries(await Promise.all(Object.entries(images).map(async ([branchName, image]) => [branchName, await uploadDataImageIfNeeded(image, `branches/${encodeURIComponent(branchName)}/image.jpg`)] as const)));
  await setDoc(doc(firestore, 'app_settings', 'branch_images'), { images: cloudImages, updatedAt: Date.now() }, { merge: true });
}

export async function saveBadgesToFirestore(badges: BadgeOption[]): Promise<void> {
  if (!firestore || !isFirebaseConfigured) throw new Error('الخادم السحابي غير متاح حالياً');
  await setDoc(doc(firestore, 'app_settings', 'available_badges'), { badges, updatedAt: Date.now() }, { merge: true });
}

export async function saveStoreStatusToFirestore(status: StoreStatus): Promise<void> {
  if (!firestore || !isFirebaseConfigured) throw new Error('الخادم السحابي غير متاح حالياً');
  await setDoc(doc(firestore!, 'app_settings', 'store_status'), {
    ...status,
    updatedAt: Date.now(),
  }, { merge: true });
}

export async function saveLoyaltyToFirestore(settings: { enabled: boolean; pointValue: number; earnRate: number; specialEarnRate: number; minPoints: number }): Promise<void> {
  if (!firestore || !isFirebaseConfigured) throw new Error('الخادم السحابي غير متاح حالياً');
  await setDoc(doc(firestore, 'app_settings', 'loyalty_config'), {
    isEnabled: settings.enabled,
    pointValueEgp: settings.pointValue,
    pointsPerProductUnit: Math.floor(settings.earnRate),
    specialPointsPerProductUnit: Math.floor(settings.specialEarnRate),
    pointsPerHundredEgp: Math.floor(settings.earnRate),
    minPointsToRedeem: settings.minPoints,
    updatedAt: Date.now(),
  }, { merge: true });
}

export async function updateFirestoreOrderStatus(orderId: string, status: string, targetPhone = '', targetEmail = ''): Promise<void> {
  if (!firestore || !isFirebaseConfigured || !orderId) return;
  const createdAt = Date.now();

  // 1. Locate the actual Firestore document: try direct docId first
  let orderRef = doc(firestore, 'orders', orderId);
  let orderSnapshot = await getDoc(orderRef);

  if (!orderSnapshot.exists()) {
    // If not found by direct docId, look up by orderNumber, displayId, or orderId field
    const num = parseInt(orderId, 10);
    let q = query(collection(firestore, 'orders'), where('displayId', '==', orderId), limit(1));
    let snap = await getDocs(q);
    if (snap.empty && !isNaN(num) && num > 0) {
      q = query(collection(firestore, 'orders'), where('orderNumber', '==', num), limit(1));
      snap = await getDocs(q);
    }
    if (snap.empty) {
      q = query(collection(firestore, 'orders'), where('orderId', '==', orderId), limit(1));
      snap = await getDocs(q);
    }
    if (!snap.empty) {
      orderRef = snap.docs[0].ref;
      orderSnapshot = snap.docs[0];
    } else {
      console.warn(`Order ${orderId} does not exist in Firestore. Aborting update to prevent creating ghost order.`);
      return;
    }
  }

  let ownerUid = '';
  const shouldAwardPoints = /تم التسليم|مكتمل/.test(status);

  if (shouldAwardPoints) {
    try {
      await runTransaction(firestore, async (transaction) => {
        const txSnap = await transaction.get(orderRef);
        if (!txSnap.exists()) return;
        const order = txSnap.data() || {};
        ownerUid = String(order.ownerUid || '');
        let userRef: typeof orderRef | undefined;
        let currentPoints = 0;
        let isCustomer = false;
        const email = String(order.customerEmail || targetEmail || '').trim().toLowerCase();
        const customerDocumentId = String(order.customerDocumentId || email.replace(/[+ -]/g, ''));
        const earnedPoints = Math.max(0, Math.floor(numberOr(order.pointsEarned, 0)));
        const shouldAward = !order.pointsAwardedAt && earnedPoints > 0;
        if (shouldAward && customerDocumentId) {
          userRef = doc(firestore!, 'users', customerDocumentId);
          const userSnapshot = await transaction.get(userRef);
          isCustomer = userSnapshot.exists() && String(userSnapshot.data().role || '').toUpperCase() === 'CUSTOMER';
          currentPoints = Math.floor(numberOr(userSnapshot.data()?.loyaltyPoints, 0));
        }
        transaction.update(orderRef, { status, updatedAt: createdAt });
        if (userRef && isCustomer) {
          transaction.set(userRef, { loyaltyPoints: currentPoints + earnedPoints }, { merge: true });
          transaction.update(orderRef, { pointsAwardedAt: createdAt });
        }
      });
    } catch (txErr) {
      console.warn('Points transaction fallback to direct updateDoc:', txErr);
      await updateDoc(orderRef, { status, updatedAt: createdAt });
    }
  } else {
    await updateDoc(orderRef, { status, updatedAt: createdAt });
  }

  try {
    await setDoc(doc(firestore!, 'notifications', `order_${orderId}_${createdAt}`), {
      id: `order_${orderId}_${createdAt}`,
      orderId,
      targetPhone,
      targetEmail: targetEmail.toLowerCase(),
      ownerUid,
      title: `تحديث طلب طيور الرشيدي #${orderId}`,
      message: `تم تحديث حالة طلبك إلى: ${status}`,
      type: 'order_status',
      status,
      createdAt,
    }, { merge: true });
  } catch (notifErr) {
    console.warn('Optional notification write error:', notifErr);
  }
}

export function subscribeOrders(ownerUid: string, isAdmin: boolean, onOrders: (orders: Order[]) => void, onError: (error: Error) => void): Unsubscribe | undefined {
  if (!firestore || !isFirebaseConfigured) return undefined;
  if(!isAdmin&&!ownerUid)return undefined;
  const ordersQuery=isAdmin?collection(firestore,'orders'):query(collection(firestore,'orders'),where('ownerUid','==',ownerUid));
  return onSnapshot(ordersQuery, (snapshot) => {
    const orders = snapshot.docs.flatMap((item): Order[] => {
      const data = item.data();
      // CRITICAL: Filter out any corrupt or ghost documents that have no customer and no items!
      const hasCustomer = Boolean(data.customerName || data.customer || data.customerPhone || data.phone);
      const hasItems = Array.isArray(data.items) && data.items.length > 0;
      if (!hasCustomer && !hasItems) {
        return [];
      }

      const items = Array.isArray(data.items) ? data.items.flatMap((raw: any, index: number): CartLine[] => {
        if (!raw || typeof raw !== 'object') return [];
        const rawUnitUpper = String(raw.unit || '').toUpperCase();
        let itemUnit = unitLabels[rawUnitUpper] || raw.unit || 'للكيلو';
        const pName = String(raw.productName || raw.name || '');
        const pSize = String(raw.selectedSize || '');
        const hasBirdSize = pSize && !/^(عادي|standard|الافتراضي)$/i.test(pSize);
        const isLiveOrBird = /حي|طائر كامل/.test(pName);
        if ((hasBirdSize || isLiveOrBird) && (itemUnit === 'للكيلو' || rawUnitUpper === 'KILO')) {
          itemUnit = 'للقطعة';
        }
        return [{
          id: String(raw.cartItemId || `${item.id}-${index}`), productId: String(raw.productId || ''),
          name: pName || 'منتج', price: numberOr(raw.price, 0),
          unit: itemUnit, emoji: '',
          quantity: numberOr(raw.quantity, 1), size: pSize,
          options: [raw.selectedPrep, raw.selectedSubOption].filter((x): x is string => typeof x === 'string' && Boolean(x)),
          selectedPrep: typeof raw.selectedPrep === 'string' ? raw.selectedPrep : '',
          selectedSubOption: typeof raw.selectedSubOption === 'string' ? raw.selectedSubOption : '',
          note: String(raw.specialNotes || ''),
        }];
      }) : [];
      const orderNum = numberOr(data.orderNumber, 0);
      const displayId = orderNum > 0 ? String(orderNum) : String(data.displayId || data.orderId || item.id);
      return [{
        id: displayId,
        docId: item.id,
        orderNumber: orderNum > 0 ? orderNum : undefined,
        total: numberOr(data.total, 0), subtotal: numberOr(data.subtotal, 0),
        discount: numberOr(data.discount, 0) + numberOr(data.loyaltyDiscountAmount, 0),
        pointsUsed: Math.floor(numberOr(data.pointsUsed, 0)), loyaltyDiscountAmount: numberOr(data.loyaltyDiscountAmount, 0),
        pointsEarned: Math.floor(numberOr(data.pointsEarned, 0)), couponCode: String(data.couponCode || ''), deliveryFee: numberOr(data.deliveryFee, 0),
        customerDocumentId: String(data.customerDocumentId || ''),
        status: String(data.status || '').trim() === 'قيد الانتظار' || !data.status ? 'قيد المراجعة والتجهيز' : String(data.status),
        createdAt: numberOr(data.createdAt, Date.parse(String(data.timestamp || '')) || Date.now()),
        customer: String(data.customerName || data.customer || ''), phone: String(data.customerPhone || data.phone || ''), email: String(data.customerEmail || data.email || ''), items,
        address: [data.area, data.street, data.buildingInfo].filter((part) => typeof part === 'string' && part).join('، ') + (data.formattedAddress ? ` · ${data.formattedAddress}` : '') || String(data.branchName || ''), payment: String(data.paymentMethod || '') === 'INSTAPAY' ? 'InstaPay' : String(data.paymentMethod || ''),
        schedule: String(data.deliveryTimeSlot || ''), note: String(data.generalNotes || ''),
      }];
    });
    orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    onOrders(orders);
  }, onError);
}

export function subscribeCoupons(onCoupons: (coupons: import('./models').Coupon[]) => void, onError: (error: Error) => void): Unsubscribe | undefined {
  if (!firestore || !isFirebaseConfigured) return undefined;
  return onSnapshot(collection(firestore, 'promotional_broadcasts'), (snapshot) => {
    const coupons = snapshot.docs.flatMap((item) => {
      const value = item.data();
      if (typeof value.code !== 'string' || (value.type !== 'percent' && value.type !== 'fixed')) return [];
      return [{
        code: value.code,
        type: value.type,
        value: numberOr(value.value, 0),
        minimum: numberOr(value.minimum, 0),
        maxDiscount: numberOr(value.maxDiscount, 0) || undefined,
        maxUses: numberOr(value.maxUses, 0) || undefined,
        expiresAt: numberOr(value.expiresAt, 0),
        active: typeof value.isActive === 'boolean' ? value.isActive : true,
        uses: numberOr(value.uses, 0),
        popup: Boolean(value.popup),
        eligibleCustomerIds: Array.isArray(value.eligibleCustomerIds) ? value.eligibleCustomerIds.filter((id): id is string => typeof id === 'string') : undefined,
      }];
    });
    onCoupons(coupons);
  }, onError);
}

export async function broadcastPromotionToFirestore(id: string, title: string, message: string, couponCode = ''): Promise<void> {
  if (!firestore || !isFirebaseConfigured) throw new Error('الخادم السحابي غير متاح حالياً');
  const data = { id, title, message, type: 'promotional', couponCode: couponCode.trim().toUpperCase(), targetTopic: 'all_users', status: 'SENT', createdAt: Date.now() };
  await Promise.all([
    setDoc(doc(firestore, 'promotional_broadcasts', id), data),
    setDoc(doc(firestore, 'notifications', id), data),
  ]);
}

function normalizeNotificationPhone(value: string): string {
  const digits = value.replace(/\D/g, '').replace(/^00/, '');
  if (digits.startsWith('20') && digits.length === 12) return `0${digits.slice(2)}`;
  return digits;
}

export function subscribeCustomerNotifications(
  ownerUid: string,
  onNotice: (notice: AppNotice, isLive: boolean) => void,
  onError: (error: Error) => void,
  customerPhone = '',
  customerEmail = '',
): Unsubscribe | undefined {
  if (!firestore || !isFirebaseConfigured) return undefined;
  const subscribedAt = Date.now();
  const normPhone = normalizeNotificationPhone(customerPhone);
  const normEmail = customerEmail.trim().toLowerCase();

  const handleSnapshot = (snapshot: any) => {
    snapshot.docChanges().forEach((change: any) => {
      if (change.type !== 'added') return;
      const value = change.doc.data();
      const createdAt = numberOr(value.createdAt, 0);
      if (createdAt < Date.now() - 86400000 || typeof value.id !== 'string' || typeof value.title !== 'string' || typeof value.message !== 'string') return;
      if (isNoticeCleared(value.id)) return;

      const isBroadcast = value.targetTopic === 'all_users';
      const matchesUid = ownerUid && value.ownerUid === ownerUid;
      const matchesPhone = normPhone && value.targetPhone && normalizeNotificationPhone(value.targetPhone) === normPhone;
      const matchesEmail = normEmail && value.targetEmail && String(value.targetEmail).trim().toLowerCase() === normEmail;

      if (!isBroadcast && !matchesUid && !matchesPhone && !matchesEmail) return;

      const isLive = createdAt >= subscribedAt - 12000;
      const read = isNoticeRead(value.id) || !isLive;
      onNotice({
        id: value.id,
        title: value.title,
        message: value.couponCode ? `${value.message}\nكود الخصم: ${value.couponCode}` : value.message,
        kind: value.type === 'order_status' ? 'order' : 'promo',
        createdAt,
        target: value.type === 'order_status' ? 'orders' : 'home',
        read,
      }, isLive);
    });
  };

  const stops = [
    onSnapshot(query(collection(firestore, 'notifications'), where('targetTopic', '==', 'all_users')), handleSnapshot, onError),
  ];
  if (ownerUid) {
    stops.push(onSnapshot(query(collection(firestore, 'notifications'), where('ownerUid', '==', ownerUid)), handleSnapshot, onError));
  }
  return () => stops.forEach((stop) => stop());
}

export function subscribeCustomerPoints(uid: string, onPoints: (points: number) => void, onError: (error: Error) => void): Unsubscribe | undefined {
  if (!firestore || !isFirebaseConfigured || !uid.trim()) return undefined;
  return onSnapshot(doc(firestore,'users',uid), (snapshot) => {
    if (!snapshot.exists() || String(snapshot.data().role || '').toUpperCase() !== 'CUSTOMER') return;
    onPoints(Math.max(0, Math.floor(numberOr(snapshot.data().loyaltyPoints, 0))));
  }, onError);
}

export function subscribePromotionalBroadcasts(onNotice: (notice: AppNotice) => void, onError: (error: Error) => void): Unsubscribe | undefined {
  if (!firestore || !isFirebaseConfigured) return undefined;
  const subscribedAt = Date.now();
  return onSnapshot(collection(firestore, 'promotional_broadcasts'), (snapshot) => {
    snapshot.docChanges().forEach((change: any) => {
      if (change.type !== 'added') return;
      const value = change.doc.data();
      if (value.type !== 'promotional' || typeof value.id !== 'string' || typeof value.title !== 'string' || typeof value.message !== 'string') return;
      const createdAt = numberOr(value.createdAt, 0);
      if (createdAt < subscribedAt) return;
      onNotice({ id: value.id, title: value.title, message: value.message, kind: 'promo', createdAt, target: 'home' });
    });
  }, onError);
}

export async function getNextOrderSequence(existingOrders: Order[] = []): Promise<{ id: string; orderNumber: number }> {
  let highest = 1000;

  // 1. Scan memory/state existing orders
  if (Array.isArray(existingOrders)) {
    for (const o of existingOrders) {
      const num = o.orderNumber || parseInt(String(o.id).replace(/\D/g, ''), 10);
      if (num && num >= 1000 && num < 100000 && num > highest) {
        highest = num;
      }
    }
  }

  // 2. Check local AsyncStorage
  try {
    const cached = await AsyncStorage.getItem('@alrashidi_last_order_seq');
    if (cached) {
      const num = parseInt(cached, 10);
      if (num && num >= 1000 && num > highest) highest = num;
    }
  } catch {}

  // 3. Check Firestore central order_sequence document
  if (firestore && isFirebaseConfigured) {
    try {
      const seqDoc = await getDoc(doc(firestore, 'app_settings', 'order_sequence'));
      if (seqDoc.exists()) {
        const cloudSeq = numberOr(seqDoc.data()?.nextOrderNumber, 0);
        if (cloudSeq > highest) {
          highest = cloudSeq - 1;
        }
      }
    } catch (e) {
      console.warn('Could not read cloud order sequence, using local highest', e);
    }
  }

  const nextNumber = highest + 1;

  // Update AsyncStorage
  try {
    await AsyncStorage.setItem('@alrashidi_last_order_seq', String(nextNumber));
  } catch {}

  // Update Firestore counter in background (safe, merge true)
  if (firestore && isFirebaseConfigured) {
    setDoc(doc(firestore, 'app_settings', 'order_sequence'), {
      nextOrderNumber: nextNumber + 1,
      lastOrderNumber: nextNumber,
      updatedAt: Date.now(),
    }, { merge: true }).catch(() => {});
  }

  return { id: String(nextNumber), orderNumber: nextNumber };
}

export const saveNoticeToFirestore = broadcastPromotionToFirestore;
export const saveLoyaltySettingsToFirestore = saveLoyaltyToFirestore;

