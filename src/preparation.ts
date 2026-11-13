import { PrepGroup, Product } from './models';

export const birdPrepGroups: PrepGroup[] = [
  { type: 'WHOLE', label: 'سليم', subOptions: [] },
  {
    type: 'CUT',
    label: 'تقطيع',
    subOptions: [
      '4 قطع — مقطعة 4 قطع (للشوربة وصواني الفرن)',
      '8 قطع — مقطعة 8 قطع (للشوي والتحمير السريع)',
      'بالعرض — الصدر لوحده والوراك لوحدها',
      'بالطول — مقسومة نصفين متساويين بالطول',
    ],
  },
  {
    type: 'DEBONED',
    label: 'خلي',
    subOptions: [
      'شيش — بدون جلد وبدون عظم (جاهز للشيش أو القلي)',
      'بالجلد — بدون عظم مع بقاء الجلد (للحشو والتحمير)',
    ],
  },
  {
    type: 'SKINNED',
    label: 'سلخ',
    subOptions: [
      'سليم — فرخة كاملة منزوعة الجلد تماماً',
      '4 قطع — 4 قطع منزوعة الجلد خفيفة للدايت',
      '8 قطع — 8 قطع منزوعة الجلد للشوربة والخضار',
    ],
  },
];

export const birdPrepText = birdPrepGroups
  .map((group) => group.subOptions.length ? `${group.label}:${group.subOptions.join(',')}` : group.label)
  .join('; ');

export function getProductPrepGroups(product: Product): PrepGroup[] {
  const isWholeBird = product.category === 'فراخ' || product.category === 'بط';
  const configured = product.prepGroups || [];
  const hasDetailedBirdOptions = configured.some((group) =>
    group.subOptions.some((option) => option.includes('بدون ') || option.includes('الفرخة على') || option.includes('الصدر لوحده')),
  );

  if (isWholeBird && !hasDetailedBirdOptions) {
    return birdPrepGroups.map((group) => ({ ...group, subOptions: [...group.subOptions] }));
  }
  if (configured.length) return configured;
  if (isWholeBird) return birdPrepGroups.map((group) => ({ ...group, subOptions: [...group.subOptions] }));
  if (product.category === 'متبلات') {
    return [{ type: 'READY', label: 'تجهيز المتبلات', subOptions: ['جاهز للطهي', 'تتبيلة حارة', 'تقطيع حسب الطلب'] }];
  }
  return [{ type: 'CLEAN', label: 'تجهيز وتنظيف', subOptions: [] }];
}
