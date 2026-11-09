import cloudImagesData from './cloudImages.json';

export const cloudImages: Record<string, string> = cloudImagesData as Record<string, string>;

/**
 * Transforms an image URL into a high-speed Cloudflare-cached WebP CDN URL.
 * Automatically resizes and compresses on edge servers near Egypt (Cairo/Alexandria/Frankfurt).
 */
export function toCdnUrl(url: string | undefined | null, width = 380, quality = 82): string {
  if (!url || typeof url !== 'string') return '';
  if (!url.startsWith('http')) return url;
  if (url.includes('images.weserv.nl')) return url;
  // If it's an iili.io image, accelerate via Cloudflare Edge CDN proxy with WebP conversion
  if (url.includes('iili.io/')) {
    const rawPath = url.replace(/^https?:\/\//, '');
    return `https://images.weserv.nl/?url=${encodeURIComponent(rawPath)}&w=${width}&output=webp&q=${quality}`;
  }
  return url;
}

/**
 * Returns the permanent HTTPS Cloud CDN URL for any given asset key.
 */
export function getCloudImageUrl(key: string | undefined | null, width = 380): string | undefined {
  if (!key) return undefined;
  if (key.startsWith('http')) return toCdnUrl(key, width);
  const raw = cloudImages[key];
  return raw ? toCdnUrl(raw, width) : undefined;
}

/**
 * Returns an Image source object with Cloud CDN URI: { uri: 'https://...' }
 */
export function getCloudImageSource(
  keyOrUri: any,
  fallbackKey: string = 'chicken',
  width = 380
): { uri: string } {
  if (!keyOrUri) {
    const fallbackUrl = cloudImages[fallbackKey] || cloudImages['chicken'];
    return { uri: toCdnUrl(fallbackUrl, width) };
  }

  if (typeof keyOrUri === 'string') {
    if (keyOrUri.startsWith('http') || keyOrUri.startsWith('data:')) {
      return { uri: toCdnUrl(keyOrUri, width) };
    }
    const cloudUrl = cloudImages[keyOrUri];
    if (cloudUrl) {
      return { uri: toCdnUrl(cloudUrl, width) };
    }
  } else if (typeof keyOrUri === 'object' && keyOrUri.uri) {
    return { ...keyOrUri, uri: toCdnUrl(keyOrUri.uri, width) };
  }

  // Fallback to chicken cloud CDN
  const defaultUrl = cloudImages[fallbackKey] || cloudImages['chicken'];
  return { uri: toCdnUrl(defaultUrl, width) };
}

/**
 * All cloud image URLs for pre-fetching into disk and memory cache.
 */
export const allCloudImageUrls: string[] = Object.values(cloudImages)
  .filter((url): url is string => typeof url === 'string' && url.startsWith('http'))
  .map((url) => toCdnUrl(url, 380));
