export type PrepGroup = { type:string; label:string; subOptions:string[] };
export type BadgeOption = { name:string; color:string };
export type Product = { id:string; name:string; category:string; subtitle?:string; weightNote?:string; price:number; piecePrice?:number; unit:string; emoji:string; image?:string; imageUri?:string; badge?:string; badgeColor?:string; available:boolean; stock:number; sizes?:string[]; prepOptions?:string[]; prepGroups?:PrepGroup[]; allowHalfUnit?:boolean; allowSellingByKilo?:boolean; allowSellingByPiece?:boolean; priceOnCall?:boolean; featured?:boolean; offer?:boolean; offerOrder?:number; offerDescription?:string; originalPrice?:number; originalPiecePrice?:number };
export type CartLine = { id:string; productId:string; name:string; price:number; unit:string; emoji:string; quantity:number; size:string; options:string[]; selectedPrep?:string; selectedSubOption?:string; note:string };
export type Coupon = { code:string; type:'percent'|'fixed'; value:number; minimum:number; maxDiscount?:number; maxUses?:number; expiresAt:number; active:boolean; uses:number; popup:boolean; eligibleCustomerIds?:string[] };
export type Order = { id:string; docId?:string; orderNumber?:number; total:number; subtotal:number; discount:number; pointsUsed?:number; loyaltyDiscountAmount?:number; pointsEarned?:number; couponCode?:string; deliveryFee?:number; customerDocumentId?:string; status:string; createdAt:number; updatedAt?:number; customer:string; phone:string; email?:string; items:CartLine[]; address:string; addressDetails?:{zone:string;street:string;building:string;coords:string;fullAddress:string}; payment:string; schedule:string; note:string };
export type Banner = { id:string; title:string; subtitle:string; emoji:string; color:string; image?:string; imageUri?:string; active:boolean };
export type AppNotice = { id:string; title:string; message:string; kind:'promo'|'order'; createdAt:number; target:string; read?:boolean };
export type AppStory = {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  image?: string;
  imageUrl?: string;
  imageUri?: string;
  gradientColors: [string, string];
  badge?: string;
  actionType: 'category' | 'promo' | 'branch' | 'info';
  actionValue?: string;
  description: string;
  active: boolean;
  createdAt?: number;
};
export type ShowcaseCard = {
  id: string;
  title: string;
  subtitle: string;
  note?: string;
  badge: string;
  btnText?: string;
  category: string;
  image?: string;
  imageUri?: string;
  imageUrl?: string;
};

export type ShowcasePreset = {
  id: string;
  label: string;
  heroCard: ShowcaseCard;
  upperCard: ShowcaseCard;
  lowerCard: ShowcaseCard;
};

export type RashidiShowcaseConfig = {
  title: string;
  subtitle: string;
  badge: string;
  autoRotate: boolean;
  intervalSeconds: number;
  preset1: ShowcasePreset;
  preset2: ShowcasePreset;
};

export const defaultShowcaseConfig: RashidiShowcaseConfig = {
  title: 'سفرة الرشيدي',
  subtitle: 'طازجة يومياً من المزرعة والمذبح مباشرة',
  badge: 'مختارات اليوم',
  autoRotate: true,
  intervalSeconds: 5.5,
  preset1: {
    id: 'fresh',
    label: 'دواجن ومتبلات',
    heroCard: {
      id: 'fresh-hero',
      title: 'طازة من المزرعة',
      subtitle: 'دواجن كاملة ومقطعة بأعلى جودة',
      note: 'تنظيف يدوي وتقطيع حسب رغبتك',
      badge: 'طازة فجر اليوم',
      btnText: 'اطلب الطازج',
      category: 'فراخ',
      image: 'story-fresh-chicken',
      imageUrl: 'https://iili.io/n4xOnOx.jpg',
    },
    upperCard: {
      id: 'fresh-upper',
      title: 'شيش ومشاوي',
      subtitle: 'متبل جاهز للشوي',
      badge: 'تتبيلات الشيف',
      category: 'متبلات',
      image: 'story-shish-tawook',
      imageUrl: 'https://iili.io/n4xvQIf.jpg',
    },
    lowerCard: {
      id: 'fresh-lower',
      title: 'بانيه وفيليه فاخر',
      subtitle: 'صدور صافية بدون عظم',
      badge: 'الأكثر طلباً',
      category: 'أجزاء دواجن',
      image: 'story-fresh-panee',
      imageUrl: 'https://iili.io/n4x8o21.jpg',
    },
  },
  preset2: {
    id: 'baladi',
    label: 'بط وبلدي',
    heroCard: {
      id: 'baladi-hero',
      title: 'خير البط والبلدي',
      subtitle: 'بط فلاحي وحمام بلدي مغذى طبيعياً',
      note: 'تربية نظيفة وطعم فلاحي أصيل',
      badge: 'بلدي فلاحي أصلي',
      btnText: 'اطلب البلدي',
      category: 'بط',
      image: 'story-baladi-poultry',
      imageUrl: 'https://iili.io/n4x8ynR.jpg',
    },
    upperCard: {
      id: 'baladi-upper',
      title: 'برجر وكوردون بلو',
      subtitle: 'مفروم ناعم جاهز للطهي',
      badge: 'تجهيز منزلي',
      category: 'متبلات',
      image: 'product-burger',
      imageUrl: 'https://iili.io/n4x6KQa.webp',
    },
    lowerCard: {
      id: 'baladi-lower',
      title: 'شاورما وقطع متبلة',
      subtitle: 'تتبيلة شاورما خاصة',
      badge: 'سريع التحضير',
      category: 'متبلات',
      image: 'product-marinated-shawerma',
      imageUrl: 'https://iili.io/n4xPt0x.webp',
    },
  },
};

export const categories=['الكل','فراخ','بط','رومي','حمام وسمان','متبلات','أجزاء دواجن','أخرى وأرانب'];
export const branches=['فرع كامب شيزار','فرع سموحة','فرع بحري'];

export function isOrderPending(status: string | undefined): boolean {
  if (!status) return false;
  const s = String(status).trim();
  if (/تم التسليم|مكتمل|جاري التجهيز|خرج للتوصيل|ملغي/.test(s)) return false;
  return /قيد المراجعة|قيد الانتظار|جديد|pending/i.test(s);
}
