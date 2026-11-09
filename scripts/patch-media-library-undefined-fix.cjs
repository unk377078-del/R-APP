const fs = require('fs');
const path = require('path');

// 1. Fix src/cloudMedia.ts
const cloudMediaPath = path.join(__dirname, '../src/cloudMedia.ts');
let cloudMedia = fs.readFileSync(cloudMediaPath, 'utf8');

const targetAddMedia = `export async function addMediaToCloudLibrary(item: Omit<CloudMediaItem, 'id' | 'uploadedAt'>): Promise<CloudMediaItem> {
  if (!firestore || !isFirebaseConfigured) throw new Error('Firebase غير متصل.');
  
  const snap = await getDoc(doc(firestore, 'app_settings', 'media_library'));
  const currentItems: CloudMediaItem[] = snap.exists() && Array.isArray(snap.data()?.items) ? snap.data().items : [];
  
  const newItem: CloudMediaItem = {
    id: \`media_\${Date.now()}\`,
    name: (item.name || 'صورة سحابية').trim(),
    url: (item.url || '').trim(),
    key: item.key || '',
    type: item.type || 'general',
    uploadedAt: Date.now(),
  };

  const updatedItems = [newItem, ...currentItems].map((x) => ({
    id: x.id || \`media_\${Date.now()}\`,
    name: (x.name || 'صورة').trim(),
    url: (x.url || '').trim(),
    key: x.key || '',
    type: x.type || 'general',
    uploadedAt: typeof x.uploadedAt === 'number' ? x.uploadedAt : Date.now(),
  }));

  await setDoc(doc(firestore, 'app_settings', 'media_library'), {
    items: updatedItems,
    updatedAt: Date.now(),
    total: updatedItems.length,
  }, { merge: true });

  return newItem;
}`;

const oldAddMediaStart = "export async function addMediaToCloudLibrary(";
const oldDeleteMediaStart = "export async function deleteMediaFromCloudLibrary(";

const addIdx = cloudMedia.indexOf(oldAddMediaStart);
const delIdx = cloudMedia.indexOf(oldDeleteMediaStart);

if (addIdx !== -1 && delIdx !== -1) {
  cloudMedia = cloudMedia.slice(0, addIdx) + targetAddMedia + '\n\n/**\n * Deletes an item from the cloud media library in Firestore.\n */\n' + cloudMedia.slice(delIdx);
  fs.writeFileSync(cloudMediaPath, cloudMedia, 'utf8');
  console.log('✅ 1. cloudMedia.ts addMediaToCloudLibrary sanitized (no undefined fields)');
} else {
  console.error('Failed to locate addMediaToCloudLibrary in cloudMedia.ts');
  process.exit(1);
}

// 2. Fix src/DashboardScreen.tsx with optimistic state update
const dashPath = path.join(__dirname, '../src/DashboardScreen.tsx');
let dash = fs.readFileSync(dashPath, 'utf8');

dash = dash.replace(
  "        notify('⚡ تم رفع الصورة بنجاح إلى السحابة');\n        setNewImageName('');\n        await loadMedia();",
  `        notify('⚡ تم رفع الصورة بنجاح إلى السحابة');
        const optimisticItem: CloudMediaItem = {
          id: \`media_\${Date.now()}\`,
          name: newImageName.trim() || 'صورة سحابية جديدة',
          url,
          key: '',
          type: 'product',
          uploadedAt: Date.now(),
        };
        setItems((prev) => [optimisticItem, ...prev.filter((x) => x.id !== optimisticItem.id)]);
        setNewImageName('');
        await loadMedia();`
);

dash = dash.replace(
  "      notify('تمت إضافة الصورة إلى المكتبة السحابية');\n      setNewImageName('');\n      setNewImageUrl('');\n      await loadMedia();",
  `      notify('تمت إضافة الصورة إلى المكتبة السحابية');
      const addedItem: CloudMediaItem = {
        id: \`media_\${Date.now()}\`,
        name: newImageName.trim() || 'صورة سحابية جديدة',
        url: newImageUrl.trim(),
        key: '',
        type: 'general',
        uploadedAt: Date.now(),
      };
      setItems((prev) => [addedItem, ...prev.filter((x) => x.id !== addedItem.id)]);
      setNewImageName('');
      setNewImageUrl('');
      await loadMedia();`
);

fs.writeFileSync(dashPath, dash, 'utf8');
console.log('✅ 2. DashboardScreen.tsx updated with optimistic instant rendering');
