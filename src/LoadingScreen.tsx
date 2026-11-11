import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StatusBar, StyleSheet, View } from 'react-native';
import { C } from './theme';
import { Txt } from './ui';
import { images } from './nativeAssets';

interface LoadingScreenProps {
  message?: string;
  onComplete?: () => void;
}

export function LoadingScreen({ message = 'لحظات ونجهّز طلبك…', onComplete }: LoadingScreenProps) {
  const sloganPart1 = 'سهل تبقى فرارجي';
  const sloganPart2 = ' · صعب تبقى الرشيدي';
  const fullSlogan = sloganPart1 + sloganPart2;

  const [typedCount, setTypedCount] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    // 1. Gentle continuous pulse on Rooster brand emblem
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 2. Smooth progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: onComplete ? 650 : 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // 3. Fast, snappy typewriter effect
    let currentIdx = 0;
    const typeInterval = setInterval(() => {
      currentIdx += 2;
      setTypedCount(Math.min(currentIdx, fullSlogan.length));

      if (currentIdx >= fullSlogan.length) {
        clearInterval(typeInterval);
        // Snappy reading hold (350ms) so the launch feels instant and responsive
        if (completeRef.current) {
          setTimeout(() => {
            completeRef.current?.();
          }, 350);
        }
      }
    }, 16);

    return () => {
      pulseLoop.stop();
      clearInterval(typeInterval);
    };
  }, []);

  // Split typed text between part 1 (white) and part 2 (golden brand accent)
  const part1Typed = sloganPart1.slice(0, Math.min(typedCount, sloganPart1.length));
  const part2Typed =
    typedCount > sloganPart1.length
      ? sloganPart2.slice(0, typedCount - sloganPart1.length)
      : '';

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['6%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Decorative Brand Background Glow */}
      <View style={styles.glowCircle} pointerEvents="none" />

      {/* Alexandria Heritage Tag */}
      <View style={styles.heritageTag}>
        <Txt style={styles.heritageText}>الإسكندرية · منذ ١٩٦٠</Txt>
      </View>

      {/* Animated Brand Emblem Badge */}
      <Animated.View style={[styles.logoWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.logoBorder}>
          <Image
            source={images['brand-logo']}
            resizeMode="cover"
            style={styles.logoImage}
          />
        </View>
      </Animated.View>

      {/* Brand Title */}
      <View style={styles.titleRow}>
        <Txt style={styles.brandTitle}>طيور الرشيدي</Txt>
        <View style={styles.freshBadge}>
          <Txt style={styles.freshBadgeText}>فريش</Txt>
        </View>
      </View>

      {/* Famous Brand Slogan Container */}
      <View style={styles.sloganCard}>
        <View style={styles.sloganRow}>
          <Txt style={styles.sloganPart1}>{part1Typed}</Txt>
          {part2Typed ? <Txt style={styles.sloganPart2}>{part2Typed}</Txt> : null}
        </View>
        <View style={styles.goldDivider} />
      </View>

      {/* Loading Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarTrack} accessibilityRole="progressbar">
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
        <Txt style={styles.statusMessage}>{message}</Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#0A192F', // Official deep Alexandria royal navy
  },
  glowCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
  },
  heritageTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 20,
  },
  heritageText: {
    color: '#E2E8F0',
    fontSize: 12.5,
    fontWeight: '700',
  },
  logoWrapper: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#0E2F65',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 16,
  },
  logoBorder: {
    width: 98,
    height: 98,
    borderRadius: 49,
    borderWidth: 2.5,
    borderColor: '#F59E0B',
    padding: 2,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 27,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  freshBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    marginStart: 8,
  },
  freshBadgeText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 13,
    color: '#0A192F',
    fontWeight: '900',
  },
  sloganCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 4,
    marginBottom: 22,
  },
  sloganRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  sloganPart1: {
    fontFamily: 'ArefRuqaa_700Bold',
    fontSize: 21,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sloganPart2: {
    fontFamily: 'ArefRuqaa_700Bold',
    fontSize: 21,
    fontWeight: '700',
    color: '#FCD34D', // Radiant gold
    textAlign: 'center',
  },
  goldDivider: {
    height: 2.5,
    width: 44,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    marginTop: 6,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 260,
    alignItems: 'center',
  },
  progressBarTrack: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 6,
  },
  statusMessage: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '600',
  },
});
