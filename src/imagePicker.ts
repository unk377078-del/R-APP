import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { addMediaToCloudLibrary, uploadImageToCloud } from './cloudMedia';

/**
 * Lets the user pick an image from device, automatically compresses it to HD Web resolution,
 * uploads it directly to Cloud CDN, registers it in Firestore Cloud Media Library,
 * and returns the permanent HTTPS URL.
 */
export async function pickCompressedImage(
  imageName?: string,
  type: 'product' | 'banner' | 'branch' | 'category' | 'story' | 'showcase' | 'general' = 'general'
): Promise<string | undefined> {
  const selection = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    allowsMultipleSelection: false,
    quality: 0.9,
  });
  if (selection.canceled || !selection.assets?.[0]?.uri) return undefined;

  // Compress to optimal web display size (800px width, 0.75 quality)
  const manipulated = await manipulateAsync(
    selection.assets[0].uri,
    [{ resize: { width: 600 } }],
    {
      compress: 0.65,
      format: SaveFormat.JPEG,
      base64: true,
    }
  );

  if (!manipulated.base64) {
    throw new Error('تعذر معالجة الصورة المختارة.');
  }

  // Upload immediately to Cloud CDN
  const { url } = await uploadImageToCloud(manipulated.base64, imageName);

  // Register in Cloud Media Library Firestore
  await addMediaToCloudLibrary({
    name: imageName || `صورة مرفوعة ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
    url,
    type,
  }).catch((err) => {
    console.warn('Could not record to media library, but image is uploaded:', err);
  });

  return url;
}

export const pickAndUploadToCloud = pickCompressedImage;
