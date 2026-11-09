import { PrepGroup, Product } from './models';

export const birdPrepGroups: PrepGroup[] = [
  { type: 'WHOLE', label: 'سليم', subOptions: [] },
  {
    type: 'CUT',
    label: 'تقطيع',
    subOptions: [
      'بالعرض — الصدر لوحده والوراك لوحدها',
      'بالطول — كل صدر وكل ورك مقسوم بالطول',
      '8 قطع — الفرخة على 8 قطع',
      '4 قطع — الفرخة على 4 قطع',
    ],
  },
  {
    type: 'DEBONED',
    label: 'خلي',
    subOptions: ['شيش — بدون جلد وبدون عظم', 'بالجلد — بدون عظم فقط'],
  },
  {
    type: 'SKINNED',
    label: 'سلخ',
    subOptions: [
      'سليم — بدون الجلد والفرخة سليمة',
      '4 قطع — بدون الجلد والفرخة على 4 قطع',
      '8 قطع — بدون الجلد والفرخة على 8 قطع',
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
