import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { images } from './nativeAssets';
import { toCdnUrl } from './cloudAssets';

export interface FastImageProps {
  source: any;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  contentFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  accessibilityLabel?: string;
  onError?: () => void;
  onLoad?: (event?: any) => void;
  priority?: 'low' | 'normal' | 'high';
  fallbackSource?: any;
}

export function FastImage({
  source,
  style,
  resizeMode = 'cover',
  contentFit,
  accessibilityLabel,
  onError,
  onLoad,
  priority = 'high',
  fallbackSource,
}: FastImageProps) {
  const [retryWithOriginal, setRetryWithOriginal] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
    setRetryWithOriginal(false);
  }, [source]);

  // Normalize resizeMode to expo-image contentFit
  const fit = contentFit || (resizeMode === 'contain' ? 'contain' : resizeMode === 'stretch' ? 'fill' : 'cover');

  // Resolve source with cloud CDN acceleration
  let resolvedSource = source;
  if (source && typeof source === 'object' && typeof source.uri === 'string') {
    if (retryWithOriginal) {
      // Revert to raw unproxied URL if CDN had any hiccup
      resolvedSource = { uri: source.uri.replace(/^https:\/\/images\.weserv\.nl\/\?url=([^&]+).*$/, 'https://$1') };
    } else {
      resolvedSource = { uri: toCdnUrl(source.uri, 400) };
    }
  }

  const effectiveSource = (!hasError && resolvedSource) ? resolvedSource : (fallbackSource || images.chicken);

  return (
    <ExpoImage
      source={effectiveSource}
      style={style}
      contentFit={fit}
      accessibilityLabel={accessibilityLabel}
      transition={160}
      cachePolicy="memory-disk"
      priority={priority}
      onError={() => {
        if (!retryWithOriginal && source?.uri) {
          setRetryWithOriginal(true);
        } else {
          setHasError(true);
          onError?.();
        }
      }}
      onLoad={onLoad}
    />
  );
}

/**
 * Pre-fetches an array of image URLs to disk & memory cache.
 */
export async function prefetchImages(urls: (string | undefined | null)[]): Promise<void> {
  const validUrls = urls
    .filter((u): u is string => typeof u === 'string' && u.startsWith('http'))
    .map((u) => toCdnUrl(u, 400));
  if (!validUrls.length) return;
  try {
    await Promise.allSettled(validUrls.map((url) => ExpoImage.prefetch(url, 'memory-disk')));
  } catch (error) {
    console.warn('Pre-fetching images warning:', error);
  }
}
