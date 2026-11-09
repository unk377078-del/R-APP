import * as Location from 'expo-location';
import { alexandriaAreas } from './nativeAssets';

const alexandriaAliases: Record<string, string> = {
  'camp caesar': 'كامب شيزار',
  'camp chezar': 'كامب شيزار',
  'smouha': 'سموحة',
  'smoha': 'سموحة',
  'sidi gaber': 'سيدي جابر',
  'sidi bishr': 'سيدي بشر',
  'miami': 'ميامي',
  'loran': 'لوران',
  'lauran': 'لوران',
  'gleem': 'جليم',
  'glem': 'جليم',
  'rushdy': 'رشدي',
  'stanley': 'ستانلي',
  'ibrahimiya': 'الإبراهيمية',
  'cleopatra': 'كليوباترا',
  'cleopatre': 'كليوباترا',
  'zizinia': 'زيزينيا',
  'saba pacha': 'سابا باشا',
  'victoria': 'فكتوريا',
  'asafra': 'العصافرة',
  'mandara': 'المندرة',
  'siouf': 'السيوف',
  'moharam bek': 'محرم بك',
  'moharram bek': 'محرم بك',
  'shatby': 'الشاطبي',
  'bahary': 'بحري والأنفوشي',
  'anfoushi': 'بحري والأنفوشي',
  'mansheya': 'المنشية والعطارين',
  'attarin': 'المنشية والعطارين',
  'gianaclis': 'جناكليس',
  'agami': 'العجمي',
  'dekheila': 'الدخيلة',
};

function matchAlexandriaArea(parts: string[]): string {
  const normalized = parts.filter(Boolean).join(' ').toLowerCase();
  for (const [alias, canonical] of Object.entries(alexandriaAliases)) {
    if (normalized.includes(alias)) return canonical;
  }
  return alexandriaAreas.find((area) => normalized.includes(area.toLowerCase())) || '';
}

export async function detectAddress() {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) throw new Error('فعّل خدمات الموقع GPS من إعدادات الهاتف ثم حاول مرة أخرى.');
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error('اسمح للتطبيق باستخدام الموقع أثناء الطلب من إعدادات الهاتف.');

  const cached = await Location.getLastKnownPositionAsync({ maxAge: 30_000, requiredAccuracy: 60 }).catch(() => null);
  const position = cached || await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
    mayShowUserSettingsDialog: true,
  });

  const places = await Location.reverseGeocodeAsync(position.coords);
  const place = places[0];
  const parts = [place?.district, place?.subregion, place?.street, place?.name, place?.city, place?.region].filter((x): x is string => Boolean(x));
  const zone = matchAlexandriaArea(parts) || place?.district || place?.subregion || 'الإسكندرية';

  // GPS intentionally identifies ONLY the neighborhood/area (المنطقة فقط).
  // The customer must manually type their street and building number for delivery accuracy.
  return {
    zone,
    street: '',
    building: '',
    fullAddress: zone,
    coords: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
  };
}
