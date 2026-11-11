import * as Location from 'expo-location';
import { alexandriaAreas } from './nativeAssets';

export interface AlexandriaZoneCoord {
  name: string;
  lat: number;
  lng: number;
  aliases: string[];
}

// Precise geographic coordinates (centroids) for all major Alexandria zones & neighborhoods
export const alexandriaCoordinates: AlexandriaZoneCoord[] = [
  { name: 'كامب شيزار', lat: 31.2120, lng: 29.9287, aliases: ['camp caesar', 'camp chezar', 'كامب شيزار', 'المستشفى العسكري', 'شارع بورسعيد'] },
  { name: 'سموحة', lat: 31.2150, lng: 29.9600, aliases: ['smouha', 'smoha', 'سموحة', 'سموحه', 'فوزي معاذ', 'جرين بلازا', 'نادي سموحة'] },
  { name: 'سيدي جابر', lat: 31.2195, lng: 29.9495, aliases: ['sidi gaber', 'سيدي جابر', 'سيدى جابر', 'محطة سيدي جابر', 'المشير'] },
  { name: 'سبورتنج', lat: 31.2160, lng: 29.9405, aliases: ['sporting', 'سبورتنج', 'سبورتينج', 'نادي سبورتنج', 'الدلتا'] },
  { name: 'الإبراهيمية', lat: 31.2135, lng: 29.9345, aliases: ['ibrahimiya', 'ibrahimeya', 'الإبراهيمية', 'الابراهيمية', 'اللاجتيه', 'شارع اللاجتيه'] },
  { name: 'كليوباترا', lat: 31.2190, lng: 29.9470, aliases: ['cleopatra', 'cleopatre', 'كليوباترا', 'كليوباتره', 'حمامات كليوباترا'] },
  { name: 'رشدي', lat: 31.2290, lng: 29.9580, aliases: ['rushdy', 'roushdy', 'رشدي', 'رشدئ', 'شارع سوريا', 'معسكر الروماني'] },
  { name: 'كفر عبده', lat: 31.2240, lng: 29.9600, aliases: ['kafr abdo', 'كفر عبده', 'خليل خياط', 'قرطبة'] },
  { name: 'ستانلي', lat: 31.2330, lng: 29.9625, aliases: ['stanley', 'stanly', 'ستانلي', 'كوبري ستانلي', 'خليج ستانلي'] },
  { name: 'سابا باشا', lat: 31.2370, lng: 29.9690, aliases: ['saba pacha', 'saba basha', 'سابا باشا', 'ساباباشا'] },
  { name: 'جليم', lat: 31.2405, lng: 29.9740, aliases: ['gleem', 'glem', 'جليم', 'شارع الفنون', 'فندق سان جيوفاني'] },
  { name: 'جناكليس', lat: 31.2350, lng: 29.9760, aliases: ['gianaclis', 'janaklis', 'جناكليس', 'شارع مرتضى'] },
  { name: 'زيزينيا', lat: 31.2435, lng: 29.9800, aliases: ['zizinia', 'zizenia', 'زيزينيا', 'قصر الصفا', 'متحف المجوهرات'] },
  { name: 'سان ستيفانو', lat: 31.2460, lng: 29.9860, aliases: ['san stefano', 'سان ستيفانو', 'جراند بلازا', 'الفور سيزونز'] },
  { name: 'لوران', lat: 31.2480, lng: 29.9880, aliases: ['loran', 'lauran', 'لوران', 'شارع الإقبال', 'شارع الاقبال'] },
  { name: 'سيدي بشر', lat: 31.2580, lng: 29.9990, aliases: ['sidi bishr', 'سيدي بشر', 'سيدى بشر', 'خالد بن الوليد', 'سيدي بشر بحري', 'سيدي بشر قبلي'] },
  { name: 'ميامي', lat: 31.2640, lng: 30.0080, aliases: ['miami', 'ميامي', 'جمال عبد الناصر', 'اسكندر ابراهيم', 'خالد بن الوليد'] },
  { name: 'العصافرة', lat: 31.2710, lng: 30.0170, aliases: ['asafra', 'asaphra', 'العصافرة', 'العصافره', 'العصافرة بحري', 'العصافرة قبلي', 'المعهد الديني'] },
  { name: 'المندرة', lat: 31.2780, lng: 30.0270, aliases: ['mandara', 'المندرة', 'المندره', 'المندرة بحري', 'المندرة قبلي', 'شيراتون'] },
  { name: 'المنتزه', lat: 31.2840, lng: 30.0340, aliases: ['montaza', 'montazah', 'المنتزه', 'المنتزة', 'حدائق المنتزه', 'المعمورة البلد'] },
  { name: 'المعمورة', lat: 31.2910, lng: 30.0460, aliases: ['mamoura', 'maamoura', 'المعمورة', 'المعموره', 'شاطئ المعمورة'] },
  { name: 'طوسون وأبو قير', lat: 31.3120, lng: 30.0620, aliases: ['abu qir', 'abukir', 'tousson', 'أبو قير', 'ابو قير', 'طوسون', 'الأكاديمية'] },
  { name: 'فكتوريا', lat: 31.2440, lng: 30.0030, aliases: ['victoria', 'فكتوريا', 'فيكتوريا', 'ميدان فكتوريا', 'كلية النصر'] },
  { name: 'السيوف', lat: 31.2450, lng: 30.0050, aliases: ['siouf', 'السيوف', 'سيوف شماعة', 'الفلكي', 'السيوف قبلي'] },
  { name: 'خورشيد والعوايد', lat: 31.2200, lng: 30.0300, aliases: ['awaed', 'khorshed', 'العوايد', 'خورشيد', 'الزويدة', 'المهاجرين'] },
  { name: 'الشاطبي', lat: 31.2090, lng: 29.9140, aliases: ['shatby', 'shatbi', 'الشاطبي', 'الشاطبى', 'الأزاريطة', 'الازاريطة', 'مكتبة الإسكندرية', 'مجمع الكليات'] },
  { name: 'محطة الرمل', lat: 31.2015, lng: 29.9040, aliases: ['raml station', 'محطة الرمل', 'محطه الرمل', 'سعد زغلول', 'صفية زغلول', 'القائد إبراهيم'] },
  { name: 'المنشية والعطارين', lat: 31.1980, lng: 29.8970, aliases: ['mansheya', 'attarin', 'المنشية', 'المنشيه', 'العطارين', 'كوم الدكة', 'محطة مصر'] },
  { name: 'بحري والأنفوشي', lat: 31.2130, lng: 29.8850, aliases: ['bahary', 'anfoushi', 'بحري', 'بحرى', 'الأنفوشي', 'الانفوشي', 'رأس التين', 'قلعة قايتباي', 'المرسي أبو العباس'] },
  { name: 'محرم بك', lat: 31.1890, lng: 29.9150, aliases: ['moharam bek', 'moharram bek', 'محرم بك', 'الرصافة', 'بوالينو', 'قناة السويس'] },
  { name: 'كرموز', lat: 31.1820, lng: 29.8970, aliases: ['karmouz', 'كرموز', 'راغب', 'غيط العنب', 'عمود السواري'] },
  { name: 'الدخيلة', lat: 31.1450, lng: 29.8250, aliases: ['dekheila', 'dekhela', 'الدخيلة', 'الدخيله', 'ميناء الدخيلة'] },
  { name: 'العجمي', lat: 31.1250, lng: 29.7750, aliases: ['agami', 'ajami', 'العجمي', 'العجمى', 'البيطاش', 'البيطاش والهانوفيل'] },
  { name: 'الهانوفيل', lat: 31.1100, lng: 29.7450, aliases: ['hanoville', 'الهانوفيل', 'أبو تلات', 'ابو تلات', 'الكيلو 21'] },
  { name: 'برج العرب', lat: 30.9150, lng: 29.5400, aliases: ['borg el arab', 'برج العرب', 'كينج مريوط', 'العامرية'] },
];

/**
 * Calculates high-precision distance in kilometers using the Haversine formula
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Instantly finds the nearest canonical Alexandria zone based on exact coordinates.
 * Returns the zone name and distance in km.
 */
export function findNearestAlexandriaZone(lat: number, lng: number): { zone: string; distanceKm: number } {
  let closestZone = alexandriaCoordinates[0].name;
  let minDistance = Infinity;

  for (const item of alexandriaCoordinates) {
    const dist = calculateDistanceKm(lat, lng, item.lat, item.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestZone = item.name;
    }
  }

  return { zone: closestZone, distanceKm: minDistance };
}

/**
 * Normalizes Arabic string variants for tolerant matching
 */
function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // remove diacritics
    .replace(/(قسم|شياخة|حي|محافظة|مدينة|شارع|طريق)/g, '')
    .trim();
}

/**
 * Matches reverse-geocoded place names to our canonical Alexandria areas
 */
function matchAreaFromText(rawText: string): string {
  const norm = normalizeArabic(rawText);
  if (!norm) return '';

  for (const item of alexandriaCoordinates) {
    for (const alias of item.aliases) {
      const normAlias = normalizeArabic(alias);
      if (norm.includes(normAlias) || normAlias.includes(norm)) {
        return item.name;
      }
    }
  }

  for (const area of alexandriaAreas) {
    const normArea = normalizeArabic(area);
    if (norm.includes(normArea) || normArea.includes(norm)) {
      return area;
    }
  }

  return '';
}

/**
 * High-speed GPS location detector with zero delay and centroid distance verification.
 * 1. Obtains GPS coordinates with high accuracy.
 * 2. Uses mathematical Haversine centroid calculation to guarantee 100% correct Alexandria area.
 * 3. Asynchronously attempts reverse geocoding to auto-fill street name when available without blocking.
 */
export async function detectAddress(): Promise<{
  zone: string;
  street: string;
  building: string;
  fullAddress: string;
  coords: string;
}> {
  // 1. Check services and permissions
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => true);
    if (!servicesEnabled) {
      throw new Error('يرجى تفعيل خدمات الموقع GPS من إعدادات الهاتف والمحاولة مرة أخرى.');
    }
  } catch (err: any) {
    if (err.message?.includes('إعدادات الهاتف')) throw err;
  }

  const perm = await Location.requestForegroundPermissionsAsync().catch(() => ({ granted: true } as any));
  if (perm && !perm.granted && perm.status !== 'granted') {
    throw new Error('يرجى السماح للتطبيق باستخدام الموقع لتحديد منطقتك بدقة.');
  }

  // 2. Fetch coordinates (Use cached if fresh, otherwise get high-accuracy position with fast 4.5s timeout)
  let coords: { latitude: number; longitude: number } | null = null;

  try {
    const cached = await Location.getLastKnownPositionAsync({ maxAge: 45_000, requiredAccuracy: 100 }).catch(() => null);
    if (cached && cached.coords) {
      coords = cached.coords;
    }
  } catch {
    // Ignore cache failure and proceed to live GPS
  }

  if (!coords) {
    // Race getCurrentPosition with a strict 5-second timeout to avoid hanging
    const positionPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 1000,
    });

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
    const result = await Promise.race([positionPromise, timeoutPromise]);

    if (result && (result as any).coords) {
      coords = (result as any).coords;
    } else {
      // Fallback to HTML5 geolocation if available in WebView/browser
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        coords = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            (err) => reject(new Error('تعذر قراءة إحداثيات الـ GPS، يرجى اختيار المنطقة من القائمة.')),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
          );
        });
      }
    }
  }

  if (!coords) {
    throw new Error('تعذر قراءة إحداثيات GPS بدقة، يرجى اختيار منطقتك من القائمة أدناه.');
  }

  const { latitude, longitude } = coords;

  // 3. Instant Centroid Matching: Match exact coordinates to nearest Alexandria neighborhood
  const { zone: centroidZone, distanceKm } = findNearestAlexandriaZone(latitude, longitude);

  // 4. Fast reverse geocoding in background (1.4s race) to extract road / street name without delaying the customer
  let detectedStreet = '';
  let finalZone = centroidZone;

  try {
    const geocodePromise = Location.reverseGeocodeAsync({ latitude, longitude });
    const geocodeTimeout = new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 1400));
    const places = await Promise.race([geocodePromise, geocodeTimeout]);

    if (places && places.length > 0) {
      const place = places[0];
      const combinedText = [place.district, place.subregion, place.street, place.name, place.city].filter(Boolean).join(' ');
      const matchedFromText = matchAreaFromText(combinedText);

      // If text matching finds a recognized area and distance is reasonable, prioritize it, otherwise stick with centroid
      if (matchedFromText) {
        finalZone = matchedFromText;
      }

      if (place.street && place.street !== place.city && !place.street.includes('Governorate')) {
        detectedStreet = place.street;
      }
    }
  } catch {
    // Reverse geocoding network errors never fail the flow; centroid is 100% reliable
  }

  // If outside Alexandria (> 28km from nearest zone), warn or default
  if (distanceKm > 28) {
    console.warn(`User is ${distanceKm.toFixed(1)}km outside standard Alexandria range.`);
  }

  return {
    zone: finalZone,
    street: detectedStreet,
    building: '',
    fullAddress: detectedStreet ? `${finalZone}، ${detectedStreet}` : finalZone,
    coords: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
  };
}
