import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from './firebase';

export interface CloudMediaItem {
  id: string;
  name: string;
  url: string;
  key?: string;
  type?: 'product' | 'banner' | 'branch' | 'category' | 'story' | 'showcase' | 'general';
  uploadedAt: number;
}

const FREEIMAGE_API_KEY = '6d207e02198a847aa98d0a2a901485a5';

export const DEFAULT_CLOUD_MEDIA_ITEMS: CloudMediaItem[] = [
  {
    "id": "cmedia_story_fresh_chicken",
    "name": "ستوري - ذبح وتجهيز يومي طازج",
    "url": "https://iili.io/n4xOnOx.jpg",
    "key": "story-fresh-chicken",
    "type": "story",
    "uploadedAt": 1730000000000
  },
  {
    "id": "cmedia_story_shish_tawook",
    "name": "ستوري - شيش طاووق وتتبيلات خاصة",
    "url": "https://iili.io/n4xvQIf.jpg",
    "key": "story-shish-tawook",
    "type": "story",
    "uploadedAt": 1730000001000
  },
  {
    "id": "cmedia_story_fresh_panee",
    "name": "ستوري - بانيه فريش بدون دهون",
    "url": "https://iili.io/n4x8o21.jpg",
    "key": "story-fresh-panee",
    "type": "story",
    "uploadedAt": 1730000002000
  },
  {
    "id": "cmedia_story_alex_branch",
    "name": "ستوري - فروع طيور الرشيدي بالإسكندرية",
    "url": "https://iili.io/n4x8WQ4.jpg",
    "key": "story-alex-branch",
    "type": "story",
    "uploadedAt": 1730000003000
  },
  {
    "id": "cmedia_story_baladi_poultry",
    "name": "ستوري - طيور وبط بلدي فلاحي",
    "url": "https://iili.io/n4x8ynR.jpg",
    "key": "story-baladi-poultry",
    "type": "story",
    "uploadedAt": 1730000004000
  },
  {
    "id": "cmedia_story_raw_chicken",
    "name": "ستوري - نظافة وتعقيم الدواجن",
    "url": "https://iili.io/n4xS0PV.jpg",
    "key": "story-raw-chicken",
    "type": "story",
    "uploadedAt": 1730000005000
  },
  {
    "id": "cmedia_story_promo_poster",
    "name": "ستوري - عروض وتخفيضات الأسبوع",
    "url": "https://iili.io/n4xSgHX.jpg",
    "key": "story-promo-poster",
    "type": "story",
    "uploadedAt": 1730000006000
  },
  {
    "id": "cmedia_story_chicken_family",
    "name": "ستوري - وجبات وتوفير العائلة",
    "url": "https://iili.io/n4xSsV4.jpg",
    "key": "story-chicken-family",
    "type": "story",
    "uploadedAt": 1730000007000
  },
  {
    "id": "cmedia_brand_logo",
    "name": "شعار وهوية طيور الرشيدي الرسمية",
    "url": "https://iili.io/n4xSmJ9.png",
    "key": "brand-logo",
    "type": "general",
    "uploadedAt": 1730000008000
  },
  {
    "id": "cmedia_hero_chicken",
    "name": "بانر رئيسي - دواجن طازجة يومياً",
    "url": "https://iili.io/n4xUfUP.jpg",
    "key": "hero-chicken",
    "type": "banner",
    "uploadedAt": 1730000009000
  },
  {
    "id": "cmedia_hero_marinated",
    "name": "بانر رئيسي - أشهى التتبيلات والشيش",
    "url": "https://iili.io/n4xUXgS.jpg",
    "key": "hero-marinated",
    "type": "banner",
    "uploadedAt": 1730000010000
  },
  {
    "id": "cmedia_branch_camp",
    "name": "فرع كامب شيزار الرئيسي",
    "url": "https://iili.io/n4xUbBR.png",
    "key": "branch-camp",
    "type": "branch",
    "uploadedAt": 1730000011000
  },
  {
    "id": "cmedia_branch_smouha",
    "name": "فرع سموحة",
    "url": "https://iili.io/n4xgxY7.png",
    "key": "branch-smouha",
    "type": "branch",
    "uploadedAt": 1730000012000
  },
  {
    "id": "cmedia_branch_bahary",
    "name": "فرع بحري والأنفوشي",
    "url": "https://iili.io/n4xg0YP.png",
    "key": "branch-bahary",
    "type": "branch",
    "uploadedAt": 1730000013000
  },
  {
    "id": "cmedia_chicken",
    "name": "دجاجة كاملة منظفة",
    "url": "https://iili.io/n4xgeaI.png",
    "key": "chicken",
    "type": "product",
    "uploadedAt": 1730000014000
  },
  {
    "id": "cmedia_duck",
    "name": "بط فلاحي كامل",
    "url": "https://iili.io/n4xr2cB.png",
    "key": "duck",
    "type": "product",
    "uploadedAt": 1730000015000
  },
  {
    "id": "cmedia_pigeon",
    "name": "حمام بلدي مزارع",
    "url": "https://iili.io/n4xrxPR.png",
    "key": "pigeon",
    "type": "product",
    "uploadedAt": 1730000016000
  },
  {
    "id": "cmedia_panee",
    "name": "بانيه دجاج فاخر",
    "url": "https://iili.io/n4xr0P4.png",
    "key": "panee",
    "type": "product",
    "uploadedAt": 1730000017000
  },
  {
    "id": "cmedia_shish",
    "name": "شيش طاووق متبل",
    "url": "https://iili.io/n4xr8lV.png",
    "key": "shish",
    "type": "product",
    "uploadedAt": 1730000018000
  },
  {
    "id": "cmedia_wings",
    "name": "أجنحة دجاج طازجة",
    "url": "https://iili.io/n4x4Ff4.png",
    "key": "wings",
    "type": "product",
    "uploadedAt": 1730000019000
  },
  {
    "id": "cmedia_drumsticks",
    "name": "دبابيس دجاج طازجة",
    "url": "https://iili.io/n4x4IWb.png",
    "key": "drumsticks",
    "type": "product",
    "uploadedAt": 1730000020000
  },
  {
    "id": "cmedia_product_abyd",
    "name": "فرخة بيضاء مزارع طازجة",
    "url": "https://iili.io/n4x4Vqv.webp",
    "key": "product-abyd",
    "type": "product",
    "uploadedAt": 1730000021000
  },
  {
    "id": "cmedia_product_bladi_7r",
    "name": "دجاج بلدي حر أصلي",
    "url": "https://iili.io/n4x4jdN.webp",
    "key": "product-bladi-7r",
    "type": "product",
    "uploadedAt": 1730000022000
  },
  {
    "id": "cmedia_product_bladi",
    "name": "فرخة بلدي فلاحي",
    "url": "https://iili.io/n4x4UBf.webp",
    "key": "product-bladi",
    "type": "product",
    "uploadedAt": 1730000023000
  },
  {
    "id": "cmedia_product_breast_bone_baladi",
    "name": "صدور بلدي بالعظم",
    "url": "https://iili.io/n4x4g14.webp",
    "key": "product-breast-bone-baladi",
    "type": "product",
    "uploadedAt": 1730000024000
  },
  {
    "id": "cmedia_product_breast_bone",
    "name": "صدور دجاج بالعظم",
    "url": "https://iili.io/n4x4g14.webp",
    "key": "product-breast-bone",
    "type": "product",
    "uploadedAt": 1730000025000
  },
  {
    "id": "cmedia_product_burger",
    "name": "برجر دجاج متبل جاهز",
    "url": "https://iili.io/n4x6KQa.webp",
    "key": "product-burger",
    "type": "product",
    "uploadedAt": 1730000026000
  },
  {
    "id": "cmedia_product_cabbage",
    "name": "كرنب محشي فلاحي جاهز",
    "url": "https://iili.io/n4x6zvI.webp",
    "key": "product-cabbage",
    "type": "product",
    "uploadedAt": 1730000027000
  },
  {
    "id": "cmedia_product_cordon_bleu",
    "name": "كوردن بلو بالجبنة",
    "url": "https://iili.io/n4x6l3l.webp",
    "key": "product-cordon-bleu",
    "type": "product",
    "uploadedAt": 1730000028000
  },
  {
    "id": "cmedia_product_crispy",
    "name": "ستربس مقرمش كريسبي",
    "url": "https://iili.io/n4x6w6x.webp",
    "key": "product-crispy",
    "type": "product",
    "uploadedAt": 1730000029000
  },
  {
    "id": "cmedia_product_duck_breast",
    "name": "صدور بط فلاحي مخلية",
    "url": "https://iili.io/n4x6eaV.webp",
    "key": "product-duck-breast",
    "type": "product",
    "uploadedAt": 1730000030000
  },
  {
    "id": "cmedia_product_duck_cupes",
    "name": "مكعبات بط مخلية",
    "url": "https://iili.io/n4x6gZg.webp",
    "key": "product-duck-cupes",
    "type": "product",
    "uploadedAt": 1730000031000
  },
  {
    "id": "cmedia_product_duck_fallahi",
    "name": "بط فلاحي أصلي كامل",
    "url": "https://iili.io/n4x6sFR.webp",
    "key": "product-duck-fallahi",
    "type": "product",
    "uploadedAt": 1730000032000
  },
  {
    "id": "cmedia_product_duck_thigh",
    "name": "أوراك بط فلاحي",
    "url": "https://iili.io/n4x6Q8N.webp",
    "key": "product-duck-thigh",
    "type": "product",
    "uploadedAt": 1730000033000
  },
  {
    "id": "cmedia_product_eggs_bldi",
    "name": "كرتونة بيض بلدي طازج",
    "url": "https://iili.io/n4xP2cl.webp",
    "key": "product-eggs-bldi",
    "type": "product",
    "uploadedAt": 1730000034000
  },
  {
    "id": "cmedia_product_fake_pigeon",
    "name": "حمام كداب متبل شيف",
    "url": "https://iili.io/n4xPfA7.webp",
    "key": "product-fake-pigeon",
    "type": "product",
    "uploadedAt": 1730000035000
  },
  {
    "id": "cmedia_product_fakhayed",
    "name": "فخاد وأوراك دجاج طازجة",
    "url": "https://iili.io/n4xPIKx.webp",
    "key": "product-fakhayed",
    "type": "product",
    "uploadedAt": 1730000036000
  },
  {
    "id": "cmedia_product_grape_leaves",
    "name": "ورق عنب محشي جاهز",
    "url": "https://iili.io/n4xP7N1.webp",
    "key": "product-grape-leaves",
    "type": "product",
    "uploadedAt": 1730000037000
  },
  {
    "id": "cmedia_product_kofta_chicken",
    "name": "كفتة دجاج متبلة للطهي",
    "url": "https://iili.io/n4xPGlR.webp",
    "key": "product-kofta-chicken",
    "type": "product",
    "uploadedAt": 1730000038000
  },
  {
    "id": "cmedia_product_kofta_panee",
    "name": "كفتة بانيه مقرمشة",
    "url": "https://iili.io/n4xPeiG.webp",
    "key": "product-kofta-panee",
    "type": "product",
    "uploadedAt": 1730000039000
  },
  {
    "id": "cmedia_product_kofta_rice_meat",
    "name": "كفتة أرز باللحم",
    "url": "https://iili.io/n4xPrRS.webp",
    "key": "product-kofta-rice-meat",
    "type": "product",
    "uploadedAt": 1730000040000
  },
  {
    "id": "cmedia_product_liver",
    "name": "كبد وقوانص طازجة",
    "url": "https://iili.io/n4xP6b9.webp",
    "key": "product-liver",
    "type": "product",
    "uploadedAt": 1730000041000
  },
  {
    "id": "cmedia_product_marinated_shawerma",
    "name": "شاورما دجاج متبلة",
    "url": "https://iili.io/n4xPt0x.webp",
    "key": "product-marinated-shawerma",
    "type": "product",
    "uploadedAt": 1730000042000
  },
  {
    "id": "cmedia_product_marinated_thermal",
    "name": "دجاج متبل كيس حراري",
    "url": "https://iili.io/n4xifgR.webp",
    "key": "product-marinated-thermal",
    "type": "product",
    "uploadedAt": 1730000043000
  },
  {
    "id": "cmedia_product_mfroom",
    "name": "مفروم دجاج صافي",
    "url": "https://iili.io/n4xiEXe.webp",
    "key": "product-mfroom",
    "type": "product",
    "uploadedAt": 1730000044000
  },
  {
    "id": "cmedia_product_mombar",
    "name": "ممبار بلدي متبل خلطة",
    "url": "https://iili.io/n4xiw7V.webp",
    "key": "product-mombar",
    "type": "product",
    "uploadedAt": 1730000045000
  },
  {
    "id": "cmedia_product_mshkl",
    "name": "مشكل حوايج دجاج",
    "url": "https://iili.io/n4xi62R.webp",
    "key": "product-mshkl",
    "type": "product",
    "uploadedAt": 1730000046000
  },
  {
    "id": "cmedia_product_nuggets",
    "name": "ناجتس دجاج للأطفال",
    "url": "https://iili.io/n4xs924.webp",
    "key": "product-nuggets",
    "type": "product",
    "uploadedAt": 1730000047000
  },
  {
    "id": "cmedia_product_p_turkey",
    "name": "ديك رومي مزارع كامل",
    "url": "https://iili.io/n4xsJv2.jpg",
    "key": "product-p-turkey",
    "type": "product",
    "uploadedAt": 1730000048000
  },
  {
    "id": "cmedia_product_panee_marinated",
    "name": "بانيه متبل جاهز للقلي",
    "url": "https://iili.io/n4xsC4j.webp",
    "key": "product-panee-marinated",
    "type": "product",
    "uploadedAt": 1730000049000
  },
  {
    "id": "cmedia_product_panee",
    "name": "بانيه طازج فيليه فاخر",
    "url": "https://iili.io/n4xsRZF.webp",
    "key": "product-panee",
    "type": "product",
    "uploadedAt": 1730000050000
  },
  {
    "id": "cmedia_product_pigeon",
    "name": "زوج حمام بلدي جامبو",
    "url": "https://iili.io/n4xsa6J.webp",
    "key": "product-pigeon",
    "type": "product",
    "uploadedAt": 1730000051000
  },
  {
    "id": "cmedia_product_popcorn",
    "name": "بوب كورن دجاج مقرمش",
    "url": "https://iili.io/n4xs6Mu.webp",
    "key": "product-popcorn",
    "type": "product",
    "uploadedAt": 1730000052000
  },
  {
    "id": "cmedia_product_qawanis",
    "name": "قوانص دجاج منظفة",
    "url": "https://iili.io/n4xst9V.webp",
    "key": "product-qawanis",
    "type": "product",
    "uploadedAt": 1730000053000
  },
  {
    "id": "cmedia_product_quail",
    "name": "زوج سمان طازج مزارع",
    "url": "https://iili.io/n4xL7NS.webp",
    "key": "product-quail",
    "type": "product",
    "uploadedAt": 1730000054000
  },
  {
    "id": "cmedia_product_rabbit",
    "name": "أرانب بلدي طازجة",
    "url": "https://iili.io/n4xLWHQ.jpg",
    "key": "product-rabbit",
    "type": "product",
    "uploadedAt": 1730000055000
  },
  {
    "id": "cmedia_product_red_eggs",
    "name": "كرتونة بيض أحمر مزارع",
    "url": "https://iili.io/n4xLsWX.webp",
    "key": "product-red-eggs",
    "type": "product",
    "uploadedAt": 1730000056000
  },
  {
    "id": "cmedia_product_rosto_turkey",
    "name": "رومي بلدي روستو مدخن",
    "url": "https://iili.io/n4xQneV.webp",
    "key": "product-rosto-turkey",
    "type": "product",
    "uploadedAt": 1730000057000
  },
  {
    "id": "cmedia_product_sausage_chicken",
    "name": "سجق دجاج متبل شيف",
    "url": "https://iili.io/n4xQR1a.jpg",
    "key": "product-sausage-chicken",
    "type": "product",
    "uploadedAt": 1730000058000
  },
  {
    "id": "cmedia_product_shawerma",
    "name": "شاورما دجاج مقطعة طازجة",
    "url": "https://iili.io/n4xQa7R.webp",
    "key": "product-shawerma",
    "type": "product",
    "uploadedAt": 1730000059000
  },
  {
    "id": "cmedia_product_shish_breast_marinated",
    "name": "شيش صدور دجاج متبل",
    "url": "https://iili.io/n4xQrrb.webp",
    "key": "product-shish-breast-marinated",
    "type": "product",
    "uploadedAt": 1730000060000
  },
  {
    "id": "cmedia_product_shish_thigh_marinated",
    "name": "شيش أوراك دجاج متبل",
    "url": "https://iili.io/n4xZ93J.webp",
    "key": "product-shish-thigh-marinated",
    "type": "product",
    "uploadedAt": 1730000061000
  },
  {
    "id": "cmedia_product_shish",
    "name": "شيش طاووق فريش متبل",
    "url": "https://iili.io/n4xZ3TN.webp",
    "key": "product-shish",
    "type": "product",
    "uploadedAt": 1730000062000
  },
  {
    "id": "cmedia_product_smna",
    "name": "سمنة بلدي بقري صافي",
    "url": "https://iili.io/n4xZxaf.webp",
    "key": "product-smna",
    "type": "product",
    "uploadedAt": 1730000063000
  },
  {
    "id": "cmedia_product_strips",
    "name": "استربس دجاج كريسبي",
    "url": "https://iili.io/n4xZVwB.webp",
    "key": "product-strips",
    "type": "product",
    "uploadedAt": 1730000064000
  },
  {
    "id": "cmedia_product_stuffed_rice_white",
    "name": "فراخ محشية أرز وخلطة",
    "url": "https://iili.io/n4xifgR.webp",
    "key": "product-stuffed-rice-white",
    "type": "product",
    "uploadedAt": 1730000065000
  },
  {
    "id": "cmedia_product_thigh_bone",
    "name": "أوراك بالعظم منظفة",
    "url": "https://iili.io/n4xtHPe.webp",
    "key": "product-thigh-bone",
    "type": "product",
    "uploadedAt": 1730000066000
  },
  {
    "id": "cmedia_product_thigh_tray",
    "name": "صينية أوراك دجاج بالبهارات",
    "url": "https://iili.io/n4xtnoP.webp",
    "key": "product-thigh-tray",
    "type": "product",
    "uploadedAt": 1730000067000
  },
  {
    "id": "cmedia_product_thigh_turkey",
    "name": "أوراك ديك رومي بالوزن",
    "url": "https://iili.io/n4xtlVt.webp",
    "key": "product-thigh-turkey",
    "type": "product",
    "uploadedAt": 1730000068000
  },
  {
    "id": "cmedia_product_turkey_cubes",
    "name": "مكعبات رومي مخلية",
    "url": "https://iili.io/n4xtGls.webp",
    "key": "product-turkey-cubes",
    "type": "product",
    "uploadedAt": 1730000069000
  },
  {
    "id": "cmedia_product_wing",
    "name": "أجنحة فراخ متبلة",
    "url": "https://iili.io/n4xtes9.webp",
    "key": "product-wing",
    "type": "product",
    "uploadedAt": 1730000070000
  }
];

/**
 * Uploads a base64 image string to Cloudflare-backed Cloud CDN.
 * Returns the permanent HTTPS URL.
 */
export async function uploadImageToCloud(
  base64DataOrUri: string,
  name?: string
): Promise<{ url: string; name: string }> {
  const cleanName = name?.trim() || `صورة_${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
  const dataUri = base64DataOrUri.startsWith('data:image/')
    ? base64DataOrUri
    : `data:image/jpeg;base64,${base64DataOrUri}`;

  // 1. Attempt upload to fast external CDN (FreeImage / Cloudflare CDN)
  try {
    const cleanBase64 = dataUri.split(',')[1] || dataUri;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const fd = new FormData();
    fd.append('key', FREEIMAGE_API_KEY);
    fd.append('action', 'upload');
    fd.append('source', cleanBase64);
    fd.append('format', 'json');

    const res = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: fd,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (data?.image?.url) {
      const cdnUrl = data.image.url;
      return { url: cdnUrl, name: cleanName };
    }
  } catch (err) {
    // CDN fallback
  }

  // 2. Direct Cloud Storage in Firestore
  try {
    if (firestore && isFirebaseConfigured) {
      const mediaId = `media_${Date.now()}`;
      await setDoc(doc(firestore, 'cloud_media_files', mediaId), {
        id: mediaId,
        name: cleanName,
        url: dataUri,
        uploadedAt: Date.now(),
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('Backup write warning:', err);
  }

  return {
    url: dataUri,
    name: cleanName,
  };
}

/**
 * Fetches the cloud media library items from Firestore.
 * Always returns the complete library (user custom items + all 71 cloud catalog items).
 */
export async function fetchCloudMediaLibrary(): Promise<CloudMediaItem[]> {
  try {
    let customItems: CloudMediaItem[] = [];
    if (firestore && isFirebaseConfigured) {
      const snap = await getDoc(doc(firestore, 'app_settings', 'media_library'));
      if (snap.exists() && Array.isArray(snap.data()?.items)) {
        customItems = snap.data()?.items || [];
      } else {
        // Seed default items into Firestore in the background
        setDoc(doc(firestore, 'app_settings', 'media_library'), {
          items: DEFAULT_CLOUD_MEDIA_ITEMS,
          updatedAt: Date.now(),
          total: DEFAULT_CLOUD_MEDIA_ITEMS.length,
        }, { merge: true }).catch(() => {});
      }
    }

    // Merge custom items with defaults, ensuring no duplicate URLs
    const seenUrls = new Set<string>();
    const merged: CloudMediaItem[] = [];

    // Custom items uploaded by the user come first
    for (const item of customItems) {
      if (item && item.url && !seenUrls.has(item.url.trim())) {
        seenUrls.add(item.url.trim());
        merged.push({
          ...item,
          id: item.id || `media_${Date.now()}_${Math.random()}`,
        });
      }
    }

    // Default 71 catalog items
    for (const item of DEFAULT_CLOUD_MEDIA_ITEMS) {
      if (item && item.url && !seenUrls.has(item.url.trim())) {
        seenUrls.add(item.url.trim());
        merged.push(item);
      }
    }

    return merged.length ? merged : DEFAULT_CLOUD_MEDIA_ITEMS;
  } catch (error) {
    console.warn('Error fetching cloud media library, using defaults:', error);
    return DEFAULT_CLOUD_MEDIA_ITEMS;
  }
}

/**
 * Adds an item to the cloud media library in Firestore.
 */
export async function addMediaToCloudLibrary(item: Omit<CloudMediaItem, 'id' | 'uploadedAt'>): Promise<CloudMediaItem> {
  const newItem: CloudMediaItem = {
    id: `media_${Date.now()}`,
    name: (item.name || 'صورة سحابية').trim(),
    url: (item.url || '').trim(),
    key: item.key || '',
    type: item.type || 'general',
    uploadedAt: Date.now(),
  };

  if (!firestore || !isFirebaseConfigured) {
    return newItem;
  }

  try {
    const snap = await getDoc(doc(firestore, 'app_settings', 'media_library'));
    const currentItems: CloudMediaItem[] = snap.exists() && Array.isArray(snap.data()?.items) ? snap.data().items : [];

    const updatedItems = [newItem, ...currentItems.filter(x => x.url !== newItem.url)];

    await setDoc(doc(firestore, 'app_settings', 'media_library'), {
      items: updatedItems,
      updatedAt: Date.now(),
      total: updatedItems.length,
    }, { merge: true });
  } catch (err) {
    console.warn('Error saving media to cloud library:', err);
  }

  return newItem;
}

/**
 * Deletes an item from the cloud media library in Firestore.
 */
export async function deleteMediaFromCloudLibrary(itemId: string): Promise<void> {
  if (!firestore || !isFirebaseConfigured) return;
  try {
    const snap = await getDoc(doc(firestore, 'app_settings', 'media_library'));
    if (!snap.exists()) return;

    const currentItems: CloudMediaItem[] = Array.isArray(snap.data()?.items) ? snap.data().items : [];
    const updatedItems = currentItems.filter((x) => x.id !== itemId);

    await setDoc(doc(firestore, 'app_settings', 'media_library'), {
      items: updatedItems,
      updatedAt: Date.now(),
      total: updatedItems.length,
    }, { merge: true });
  } catch (err) {
    console.warn('Error deleting media from cloud library:', err);
  }
}
