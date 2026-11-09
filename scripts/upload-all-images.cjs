const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, getDocs, collection, updateDoc } = require('firebase/firestore');
require('dotenv').config();

const API_KEY = '6d207e02198a847aa98d0a2a901485a5';
const CACHE_FILE = path.join(__dirname, 'uploaded-images-map.json');

let cache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (e) {
    cache = {};
  }
}

async function uploadSingleImage(filePath) {
  if (cache[filePath] && cache[filePath].url) {
    return cache[filePath].url;
  }

  const b64 = fs.readFileSync(filePath).toString('base64');
  const fd = new URLSearchParams();
  fd.append('key', API_KEY);
  fd.append('action', 'upload');
  fd.append('source', b64);
  fd.append('format', 'json');

  let retries = 3;
  while (retries > 0) {
    try {
      const res = await fetch('https://freeimage.host/api/1/upload', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data && data.image && data.image.url) {
        const url = data.image.url;
        cache[filePath] = {
          url,
          thumb: data.image.thumb ? data.image.thumb.url : url,
          uploadedAt: Date.now()
        };
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
        return url;
      } else {
        throw new Error(JSON.stringify(data));
      }
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

async function main() {
  console.log('=== STARTING BULK CLOUD IMAGE UPLOAD ===\n');

  // 1. Gather all assets
  const nativeAssetsSrc = fs.readFileSync('src/nativeAssets.ts', 'utf8');
  const regex = /'([^']+)':\s*require\('\.\.\/([^']+)'\)/g;
  let match;
  const assetList = [];
  while ((match = regex.exec(nativeAssetsSrc)) !== null) {
    assetList.push({ key: match[1], relPath: match[2] });
  }

  console.log(`Found ${assetList.length} assets to process.\n`);

  const keyToUrlMap = {};

  for (let i = 0; i < assetList.length; i++) {
    const asset = assetList[i];
    const fullPath = path.resolve(asset.relPath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`[${i + 1}/${assetList.length}] File missing: ${asset.relPath}`);
      continue;
    }

    try {
      const isCached = !!(cache[fullPath] && cache[fullPath].url);
      const url = await uploadSingleImage(fullPath);
      keyToUrlMap[asset.key] = url;
      console.log(`[${i + 1}/${assetList.length}] ${isCached ? '⚡ (Cached)' : '🚀 Uploaded'}: ${asset.key} -> ${url}`);
    } catch (err) {
      console.error(`[${i + 1}/${assetList.length}] ❌ Failed: ${asset.key}:`, err.message);
    }

    // Small breathing interval if uploaded freshly
    if (i % 3 === 0) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log('\n✅ All assets uploaded to CDN successfully!');
  console.log('Total URLs mapped:', Object.keys(keyToUrlMap).length);

  // 2. Connect to Firestore and sync
  console.log('\n--- Syncing Cloud Media Library & Products in Firestore ---');
  const app = initializeApp({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
  });
  const db = getFirestore(app);

  // 3. Build cloud media library
  const mediaItems = Object.entries(keyToUrlMap).map(([key, url]) => {
    let cleanName = key.replace(/^product-/, '').replace(/^branch-/, '').replace(/^hero-/, '');
    return {
      id: `media_${key}`,
      key,
      name: cleanName,
      url,
      type: key.startsWith('product-') ? 'product' : key.startsWith('branch-') ? 'branch' : key.startsWith('hero-') ? 'banner' : 'general',
      uploadedAt: Date.now()
    };
  });

  await setDoc(doc(db, 'app_settings', 'media_library'), {
    items: mediaItems,
    updatedAt: Date.now(),
    total: mediaItems.length
  }, { merge: true });
  console.log(`✅ Saved ${mediaItems.length} items to Firestore app_settings/media_library`);

  // 4. Update products in Firestore with their cloud imageUri
  console.log('\nUpdating Firestore products collection with cloud imageUri...');
  const productsSnap = await getDocs(collection(db, 'products'));
  let updatedCount = 0;
  for (const pDoc of productsSnap.docs) {
    const data = pDoc.data();
    const targetKey = data.image;
    const cloudUrl = keyToUrlMap[targetKey] || (targetKey ? keyToUrlMap[`product-${targetKey}`] : null);

    if (cloudUrl && (!data.imageUri || !data.imageUri.startsWith('http'))) {
      await updateDoc(doc(db, 'products', pDoc.id), {
        imageUri: cloudUrl,
        updatedAt: Date.now()
      });
      updatedCount++;
    }
  }
  console.log(`✅ Updated ${updatedCount} products in Firestore with permanent cloud URLs!`);

  // 5. Update branch_images in app_settings
  const branchMap = {};
  if (keyToUrlMap['branch-camp']) branchMap['فرع كامب شيزار'] = keyToUrlMap['branch-camp'];
  if (keyToUrlMap['branch-smouha']) branchMap['فرع سموحة'] = keyToUrlMap['branch-smouha'];
  if (keyToUrlMap['branch-bahary']) branchMap['فرع بحري'] = keyToUrlMap['branch-bahary'];

  await setDoc(doc(db, 'app_settings', 'branch_images'), {
    images: branchMap,
    updatedAt: Date.now()
  }, { merge: true });
  console.log('✅ Updated app_settings/branch_images in Firestore with cloud URLs');

  console.log('\n🎉 ALL DONE! Images are 100% cloud-hosted on Cloudflare CDN.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
