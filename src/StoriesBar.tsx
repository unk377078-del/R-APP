import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { AppStory } from './models';
import { C, fontRuqaaBold, s } from './theme';
import { StoriesBarSkeleton, Txt } from './ui';
import { FastImage, prefetchImages } from './FastImage';
import { images } from './nativeAssets';
import { cloudImages } from './cloudAssets';

export function getStoryImage(story: any) {
  if (!story) {
    return images['story-fresh-chicken'] || (cloudImages['story-fresh-chicken'] ? { uri: cloudImages['story-fresh-chicken'] } : images.chicken);
  }
  if (story.image && images[story.image]) {
    return images[story.image];
  }
  if (story.imageUri && (story.imageUri.startsWith('http') || story.imageUri.startsWith('data:'))) {
    return { uri: story.imageUri };
  }
  if (story.imageUrl && (story.imageUrl.startsWith('http') || story.imageUrl.startsWith('data:'))) {
    return { uri: story.imageUrl };
  }
  if (story.image && cloudImages[story.image]) {
    return { uri: cloudImages[story.image] };
  }
  const id = String(story.id || '').toLowerCase();
  const title = String(story.title || '').toLowerCase();
  const desc = String(story.description || '').toLowerCase();
  const full = id + ' ' + title + ' ' + desc;
  if (/شيش|متبل|تتبيل|marinated/.test(full)) {
    return images['story-shish-tawook'] || (cloudImages['story-shish-tawook'] ? { uri: cloudImages['story-shish-tawook'] } : images.chicken);
  }
  if (/بانيه|صدور|offers|فيليه/.test(full)) {
    return images['story-fresh-panee'] || (cloudImages['story-fresh-panee'] ? { uri: cloudImages['story-fresh-panee'] } : images.chicken);
  }
  if (/بط|حمام|سمان|نظافة|quality/.test(full)) {
    return images['story-baladi-poultry'] || (cloudImages['story-baladi-poultry'] ? { uri: cloudImages['story-baladi-poultry'] } : images.chicken);
  }
  if (/فرع|فروع|إسكندرية|branch/.test(full)) {
    return images['story-alex-branch'] || (cloudImages['story-alex-branch'] ? { uri: cloudImages['story-alex-branch'] } : images.chicken);
  }
  if (/ذبح|طاز|فراخ|fresh/.test(full)) {
    return images['story-fresh-chicken'] || (cloudImages['story-fresh-chicken'] ? { uri: cloudImages['story-fresh-chicken'] } : images.chicken);
  }
  return images['story-fresh-chicken'] || (cloudImages['story-fresh-chicken'] ? { uri: cloudImages['story-fresh-chicken'] } : images.chicken);
}

interface StoriesBarProps {
  stories: AppStory[];
  onAction?: (story: AppStory) => void;
  activeScheme?: 'light' | 'dark';
}

function getStoryPillWord(story: any, index: number): string {
  const full = (String(story?.id || '') + ' ' + String(story?.title || '') + ' ' + String(story?.badge || '') + ' ' + String(story?.description || '')).toLowerCase();
  if (/شيش|متبل|تتبيل|marinated/.test(full)) return 'تتبيلات';
  if (/بانيه|صدور|offers|فيليه/.test(full)) return 'بانيه';
  if (/فرع|فروع|إسكندرية|branch/.test(full)) return 'فروعنا';
  if (/بط|حمام|سمان|نظافة|بلدي/.test(full)) return 'بلدي';
  if (/طاز|فراخ|ذبح|fresh/.test(full)) return 'طازة';
  switch (index) {
    case 0:
      return 'طازة';
    case 1:
      return 'تتبيلات';
    case 2:
      return 'بانيه';
    case 3:
      return 'فروعنا';
    case 4:
      return 'بلدي';
    default:
      return 'عروض';
  }
}

export function StoriesBar({ stories, onAction, activeScheme = 'light' }: StoriesBarProps) {
  const activeStories = (stories || []).filter((s) => s.active !== false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Pre-fetch all story images into memory & disk cache for instantaneous loading
  useEffect(() => {
    const urls = activeStories
      .map((s) => {
        const src = getStoryImage(s);
        return (src as any)?.uri;
      })
      .filter((u): u is string => typeof u === 'string' && u.startsWith('http'));
    if (urls.length) {
      prefetchImages(urls).catch(() => {});
    }
  }, [activeStories]);

  if (!activeStories.length) return <StoriesBarSkeleton />;

  const isDark = activeScheme === 'dark';

  return (
    <View
      style={{
        marginTop: 14,
        marginBottom: 8,
      }}>
      {/* Sleek Header */}
      <View
        style={{
          width: '100%',
          paddingHorizontal: 16,
          marginBottom: 10,
        }}>
        <Txt
          style={{
            width: '100%',
            textAlign: 'right',
            writingDirection: 'rtl',
            alignSelf: 'stretch',
            fontFamily: fontRuqaaBold,
            fontSize: 23,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : C.navy,
            letterSpacing: 0.3,
            textShadowColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(23, 74, 156, 0.28)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
            ...(Platform.OS === 'web'
              ? {
                  textAlign: 'right' as any,
                  direction: 'rtl' as any,
                  display: 'block' as any,
                  width: '100%',
                  WebkitTextStroke: isDark ? '0.3px #FFFFFF' : '0.4px #174A9C',
                  textShadow: isDark
                    ? '0 2px 8px rgba(0,0,0,0.7)'
                    : '0 2px 6px rgba(23, 74, 156, 0.22)',
                }
              : {}),
          }}>
          يوميات الرشيدي
        </Txt>
      </View>

      {/* Horizontal Stories Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 4,
          flexDirection: 'row-reverse',
          alignItems: 'center',
          gap: 14,
        }}>
        {activeStories.map((story, index) => (
          <StoryCircleItem
            key={story.id || index}
            story={story}
            index={index}
            activeScheme={activeScheme}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setViewerIndex(index);
            }}
          />
        ))}
      </ScrollView>

      {viewerIndex !== null && (
        <StoryViewerModal
          visible={viewerIndex !== null}
          stories={activeStories}
          initialIndex={viewerIndex}
          activeScheme={activeScheme}
          onClose={() => setViewerIndex(null)}
          onAction={(story) => {
            setViewerIndex(null);
            onAction?.(story);
          }}
        />
      )}
    </View>
  );
}

function StoryCircleItem({
  story,
  index = 0,
  activeScheme,
  onPress,
}: {
  story: AppStory;
  index?: number;
  activeScheme: 'light' | 'dark';
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const imageSource = getStoryImage(story);
  const isDark = activeScheme === 'dark';
  const pillWord = getStoryPillWord(story, index);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.93, speed: 28, bounciness: 4, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, speed: 24, bounciness: 6, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`ستوري: ${pillWord}`}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={{ alignItems: 'center', minWidth: 72 }}>
        {/* Glowing Instagram-style Story Ring */}
        <View
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            padding: 2.4,
            borderWidth: 2.4,
            borderColor: C.action,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? '#141F2E' : '#FFFFFF',
            shadowColor: C.action,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 4,
          }}>
          {/* Inner Gap Ring */}
          <View
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 31,
              borderWidth: 2,
              borderColor: isDark ? '#0F172A' : '#FFFFFF',
              overflow: 'hidden',
              backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <View pointerEvents="none" style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="sparkles" size={16} color={isDark ? '#334155' : '#CBD5E1'} />
            </View>
            <FastImage
              source={imageSource}
              fallbackSource={images['story-fresh-chicken'] || images['chicken']}
              contentFit="cover"
              resizeMode="cover"
              priority="high"
              style={{ width: '100%', height: '100%' }}
            />
          </View>
        </View>

        {/* Smart One-Word Pill Capsule */}
        <View
          style={[
            {
              marginTop: 7,
              paddingHorizontal: 10,
              paddingVertical: 3.5,
              borderRadius: 11,
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.88)' : 'rgba(255, 255, 255, 0.95)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(226, 232, 240, 0.95)',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 1.5 },
              shadowOpacity: isDark ? 0.3 : 0.06,
              shadowRadius: 3,
              elevation: 1.5,
            },
            Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                } as any)
              : {},
          ]}>
          <Txt
            numberOfLines={1}
            style={{
              fontSize: 11,
              fontWeight: '800',
              color: isDark ? '#FFFFFF' : C.navy,
              textAlign: 'center',
            }}>
            {pillWord}
          </Txt>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const STORY_DURATION_MS = 5500;

function StoryViewerModal({
  visible,
  stories,
  initialIndex,
  activeScheme,
  onClose,
  onAction,
}: {
  visible: boolean;
  stories: AppStory[];
  initialIndex: number;
  activeScheme: 'light' | 'dark';
  onClose: () => void;
  onAction: (story: AppStory) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [likedStories, setLikedStories] = useState<Record<string, boolean>>({});
  const progressAnim = useRef(new Animated.Value(0)).current;
  const isPaused = useRef(false);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const currentStory = stories[currentIndex] || stories[0];
  const nextStory = currentIndex < stories.length - 1 ? stories[currentIndex + 1] : null;
  const prevStory = currentIndex > 0 ? stories[currentIndex - 1] : null;

  const storyImageSource = getStoryImage(currentStory);
  const storyKey = currentStory?.id || String(currentIndex);
  const isLiked = !!likedStories[storyKey];

  const startStoryProgress = () => {
    progressAnim.setValue(0);
    if (animationRef.current) animationRef.current.stop();

    animationRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    animationRef.current.start(({ finished }) => {
      if (finished && !isPaused.current) {
        goToNextStory();
      }
    });
  };

  useEffect(() => {
    startStoryProgress();

    // Proactively pre-fetch next & previous stories for zero-latency instant transitions
    const toPreload: string[] = [];
    if (nextStory) {
      const nextSrc = getStoryImage(nextStory);
      const uri = (nextSrc as any)?.uri;
      if (typeof uri === 'string' && uri.startsWith('http')) toPreload.push(uri);
    }
    if (prevStory) {
      const prevSrc = getStoryImage(prevStory);
      const uri = (prevSrc as any)?.uri;
      if (typeof uri === 'string' && uri.startsWith('http')) toPreload.push(uri);
    }
    if (toPreload.length) {
      prefetchImages(toPreload).catch(() => {});
    }

    return () => {
      if (animationRef.current) animationRef.current.stop();
    };
  }, [currentIndex]);

  const goToNextStory = () => {
    if (currentIndex < stories.length - 1) {
      Haptics.selectionAsync().catch(() => {});
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  const goToPrevStory = () => {
    if (currentIndex > 0) {
      Haptics.selectionAsync().catch(() => {});
      setCurrentIndex((i) => i - 1);
    } else {
      progressAnim.setValue(0);
      startStoryProgress();
    }
  };

  const handleHoldStart = () => {
    isPaused.current = true;
    if (animationRef.current) animationRef.current.stop();
  };

  const handleHoldEnd = () => {
    if (!isPaused.current) return;
    isPaused.current = false;
    const currentVal = (progressAnim as any)._value || 0;
    const remainingTime = Math.max(500, STORY_DURATION_MS * (1 - currentVal));

    animationRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingTime,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animationRef.current.start(({ finished }) => {
      if (finished && !isPaused.current) goToNextStory();
    });
  };

  const handleToggleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLikedStories((prev) => ({
      ...prev,
      [storyKey]: !isLiked,
    }));
  };

  const getActionTitle = (story: AppStory) => {
    switch (story.actionType) {
      case 'category':
        return `تصفح قسم ${story.actionValue || 'المنتجات'} ➔`;
      case 'promo':
        return `استخدام الكوبون (${story.actionValue || 'الخصم'}) ➔`;
      case 'branch':
        return `عرض فروعنا ومواعيد العمل ➔`;
      case 'info':
      default:
        return `اطلب الآن من طيور الرشيدي ➔`;
    }
  };

  const getStoryTimestamp = (story: AppStory, index: number) => {
    const now = Date.now();
    let timeMs = story?.createdAt || (story as any)?.updatedAt;

    // If no recent timestamp within last 24h, stagger realistically relative to actual current time
    if (!timeMs || typeof timeMs !== 'number' || timeMs > now || (now - timeMs) > 24 * 3600 * 1000) {
      const hoursAgo = Math.max(0.3, (stories.length - index) * 1.2);
      timeMs = now - Math.round(hoursAgo * 3600 * 1000);
    }

    const diffMs = Math.max(0, now - timeMs);
    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (3600 * 1000));

    if (diffMinutes < 1) return 'الآن';
    if (diffMinutes === 1) return 'منذ دقيقة';
    if (diffMinutes === 2) return 'منذ دقيقتين';
    if (diffMinutes < 11) return `منذ ${diffMinutes} دقائق`;
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    if (diffHours === 1) return 'منذ ساعة';
    if (diffHours === 2) return 'منذ ساعتين';
    if (diffHours < 6) return `منذ ${diffHours} ساعات`;

    // Real dynamic clock time: e.g. "اليوم 1:30 م"
    const d = new Date(timeMs);
    const h = d.getHours();
    const period = h >= 12 ? 'م' : 'ص';
    const displayHour = h % 12 || 12;
    const m = String(d.getMinutes()).padStart(2, '0');
    return `اليوم ${displayHour}:${m} ${period}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        {/* Fullscreen Blurred Backdrop */}
        <BlurView
          intensity={85}
          tint="dark"
          style={[
            StyleSheet.absoluteFill,
            Platform.OS === 'web'
              ? ({ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' } as any)
              : {},
          ]}
        />

        {/* Story Main Screen (Full bleed 9:16 authentic frame) */}
        <View
          style={{
            width: '100%',
            maxWidth: 480,
            height: Platform.OS === 'web' ? '96%' : '100%',
            borderRadius: Platform.OS === 'web' ? 24 : 0,
            overflow: 'hidden',
            backgroundColor: '#0A0F1D',
            position: 'relative',
            justifyContent: 'space-between',
          }}>
          {/* REAL STORY PHOTOGRAPHY FILLING 100% FULL SIZE & SAME UNIFORM DIMENSIONS */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              backgroundColor: '#0A0F1D',
            }}>
            {/* Ambient atmospheric gradient backdrop matching story palette */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: currentStory.gradientColors?.[0] || '#1B2633',
                  opacity: 0.40,
                },
              ]}
            />

            {/* Main Full-Size Hero Story Image: 100% Uncropped & Uniform Standardized Dimensions */}
            <FastImage
              source={storyImageSource}
              fallbackSource={images['story-fresh-chicken'] || images['hero-chicken']}
              contentFit="contain"
              resizeMode="contain"
              priority="high"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
              }}
            />
          </View>

          {/* Top Shadow Gradient for header controls */}
          <View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 120,
                backgroundColor: 'rgba(0,0,0,0.35)',
              },
              Platform.OS === 'web'
                ? ({
                    backgroundImage:
                      'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 65%, transparent 100%)',
                  } as any)
                : {},
            ]}
          />

          {/* Bottom Shadow Gradient for caption and action */}
          <View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 220,
                backgroundColor: 'rgba(0,0,0,0.45)',
              },
              Platform.OS === 'web'
                ? ({
                    backgroundImage:
                      'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 65%, transparent 100%)',
                  } as any)
                : {},
            ]}
          />

          {/* TOP CONTROLS & HEADER */}
          <View
            style={{
              paddingTop: Platform.OS === 'ios' ? 48 : 28,
              paddingHorizontal: 14,
              zIndex: 30,
            }}>
            {/* Progress Bars */}
            <View style={{ flexDirection: 'row', gap: 5, marginBottom: 10 }}>
              {stories.map((st, idx) => {
                let widthRatio: any = 0;
                if (idx < currentIndex) widthRatio = '100%';
                else if (idx === currentIndex) {
                  widthRatio = progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  });
                } else {
                  widthRatio = '0%';
                }
                return (
                  <View
                    key={st.id || idx}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 1.5,
                      backgroundColor: 'rgba(255, 255, 255, 0.35)',
                      overflow: 'hidden',
                    }}>
                    <Animated.View
                      style={{
                        height: '100%',
                        width: widthRatio,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 1.5,
                      }}
                    />
                  </View>
                );
              })}
            </View>

            {/* Profile Bar Header */}
            <View
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              {/* Brand Profile Capsule */}
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 9 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    borderWidth: 1.5,
                    borderColor: C.action,
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                  }}>
                  <FastImage
                    source={images['brand-logo']}
                    contentFit="cover"
                    resizeMode="cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
                    <Txt style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13.5 }}>طيور الرشيدي</Txt>
                    <Ionicons name="checkmark-circle" size={13} color="#3B82F6" />
                  </View>
                  <Txt style={{ color: 'rgba(255, 255, 255, 0.82)', fontSize: 11 }}>
                    {currentIndex + 1} من {stories.length}
                  </Txt>
                </View>
              </View>

              {/* Close Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="إغلاق الستوري"
                onPress={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.30)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Adjacent Stories Quick Switch Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 8,
              }}>
              {prevStory ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="القصة السابقة"
                  onPress={goToPrevStory}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: 'rgba(0, 0, 0, 0.40)',
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 12,
                    borderWidth: 0.8,
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    maxWidth: '48%',
                  }}>
                  <Ionicons name="arrow-back" size={12} color="#FDE047" />
                  <Txt numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 10.5, fontWeight: '700' }}>
                    السابق
                  </Txt>
                </Pressable>
              ) : (
                <View style={{ width: 10 }} />
              )}

              {nextStory ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="القصة التالية"
                  onPress={goToNextStory}
                  style={{
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: 'rgba(0, 0, 0, 0.40)',
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 12,
                    borderWidth: 0.8,
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    maxWidth: '48%',
                  }}>
                  <Ionicons name="arrow-forward" size={12} color="#FDE047" />
                  <Txt numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 10.5, fontWeight: '700' }}>
                    التالي
                  </Txt>
                </Pressable>
              ) : (
                <View style={{ width: 10 }} />
              )}
            </View>
          </View>

          {/* MIDDLE INTERACTIVE TOUCH NAVIGATION (Tap Right for Next, Tap Left for Prev, Hold to Pause) */}
          <View style={{ flex: 1, position: 'relative' }}>
            <Pressable
              onPressIn={handleHoldStart}
              onPressOut={handleHoldEnd}
              style={[StyleSheet.absoluteFill, { flexDirection: 'row', zIndex: 10 }]}>
              {/* Left half -> Previous Story */}
              <Pressable
                onPress={goToPrevStory}
                style={{ flex: 1 }}
                accessibilityRole="button"
                accessibilityLabel="القصة السابقة"
              />
              {/* Right half -> Next Story */}
              <Pressable
                onPress={goToNextStory}
                style={{ flex: 1 }}
                accessibilityRole="button"
                accessibilityLabel="القصة التالية"
              />
            </Pressable>

            {/* Side Floating Next/Prev Arrow Indicators */}
            {nextStory && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="القصة التالية"
                onPress={goToNextStory}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: [{ translateY: -18 }],
                  zIndex: 20,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </Pressable>
            )}

            {prevStory && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="القصة السابقة"
                onPress={goToPrevStory}
                style={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: [{ translateY: -18 }],
                  zIndex: 20,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              </Pressable>
            )}
          </View>

          {/* BOTTOM STORY CAPTION & ACTION (AUTHENTIC INSTAGRAM STORY STYLE) */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: Platform.OS === 'ios' ? 36 : 22,
              zIndex: 30,
            }}>
            {/* Tag / Badge */}
            {!!currentStory.badge && (
              <View
                style={{
                  alignSelf: 'flex-end',
                  backgroundColor: '#E11D48',
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 10,
                  marginBottom: 8,
                }}>
                <Txt style={{ color: '#FFFFFF', fontSize: 10.5, fontWeight: '900' }}>
                  {currentStory.badge}
                </Txt>
              </View>
            )}

            {/* Natural Arabic Story Description */}
            <Txt
              style={{
                color: '#F8FAFC',
                fontSize: 14,
                lineHeight: 21,
                fontWeight: '600',
                textAlign: 'right',
                marginBottom: 14,
                textShadowColor: 'rgba(0, 0, 0, 0.85)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}>
              {currentStory.description}
            </Txt>

            {/* Action Buttons Row */}
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
              {/* Direct CTA Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={getActionTitle(currentStory)}
                onPress={() => onAction(currentStory)}
                style={{
                  flex: 1,
                  height: 48,
                  backgroundColor: '#E11D48',
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row-reverse',
                  gap: 6,
                  elevation: 4,
                  shadowColor: '#E11D48',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                }}>
                <Txt style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13.5 }}>
                  {getActionTitle(currentStory)}
                </Txt>
              </Pressable>

              {/* Heart Reaction Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isLiked ? 'إلغاء الإعجاب' : 'أعجبني هذا العرض'}
                onPress={handleToggleLike}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: isLiked ? '#E11D48' : 'rgba(255, 255, 255, 0.15)',
                  borderWidth: 1,
                  borderColor: isLiked ? '#E11D48' : 'rgba(255, 255, 255, 0.30)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
