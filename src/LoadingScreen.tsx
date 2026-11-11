import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StatusBar, StyleSheet, View } from 'react-native';
import { C } from './theme';
import { Txt } from './ui';
import { images } from './nativeAssets';

interface LoadingScreenProps {
  message?: string;
  onComplete?: () => void;
}

export function LoadingScreen({ message = 'نجهّز التطبيق…', onComplete }: LoadingScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0.1)).current;
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    // 1. Instant smooth fade-in of the entire screen and slogan (180ms)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // 2. Gentle continuous pulse on Rooster emblem
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Fast, snappy progress bar animation (380ms)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: onComplete ? 380 : 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // 4. Quick, smooth transition after user clearly sees the slogan (400ms total)
    if (completeRef.current) {
      const timer = setTimeout(() => {
        completeRef.current?.();
      }, 420);
      return () => {
        pulseLoop.stop();
        clearTimeout(timer);
      };
    }

    return () => {
      pulseLoop.stop();
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['12%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Decorative Brand Background Glow */}
      <View style={styles.glowCircle} pointerEvents="none" />

      <Animated.View style={[styles.contentWrapper, { opacity: fadeAnim }]}>
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

        {/* Famous Brand Slogan - Displayed Completely & Instantly */}
        <View style={styles.sloganCard}>
          <View style={styles.sloganLinesBox}>
            <Txt style={styles.sloganLine1Text}>سهل تبقى فرارجي</Txt>
            <View style={styles.sloganLine2Row}>
              <Txt style={styles.sloganStar}>✦ </Txt>
              <Txt style={styles.sloganLine2Text}>صعب تبقى الرشيدي</Txt>
            </View>
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A192F', // Official deep Alexandria royal navy
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
  },
  heritageTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 20,
  },
  heritageText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  logoWrapper: {
    width: 112,
    height: 112,
    borderRadius: 56,
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
    width: 102,
    height: 102,
    borderRadius: 51,
    borderWidth: 2.5,
    borderColor: '#F59E0B',
    padding: 2,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  brandTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  freshBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
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
    maxWidth: 320,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 26,
  },
  sloganLinesBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 74,
  },
  sloganLine1Text: {
    fontFamily: 'ArefRuqaa_700Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
  },
  sloganLine2Row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sloganStar: {
    fontFamily: 'ArefRuqaa_700Bold',
    fontSize: 17,
    color: '#F59E0B',
    marginEnd: 4,
  },
  sloganLine2Text: {
    fontFamily: 'ArefRuqaa_700Bold',
    fontSize: 23,
    fontWeight: '700',
    color: '#FCD34D', // Radiant gold
    textAlign: 'center',
  },
  goldDivider: {
    height: 3,
    width: 48,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    marginTop: 8,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 240,
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
