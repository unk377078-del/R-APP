import React from 'react';
import { Image, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { C } from './theme';
import { Txt } from './ui';
import { images } from './nativeAssets';
import { FastImage } from './FastImage';
import { cloudImages, toCdnUrl } from './cloudAssets';

const loginHeroSource = images['story-raw-chicken'] || { uri: toCdnUrl(cloudImages['story-raw-chicken'], 600) };

export function LoginScreen({ onGuest, onLogin, onRegister }: any) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isDesktop = width >= 600;
  const isShortPhone = !isDesktop && height < 720;
  const heroHeight = isDesktop
    ? 290
    : isShortPhone
    ? Math.min(255, Math.max(Math.round(height * 0.34), 220))
    : Math.min(320, Math.max(Math.round(height * 0.38), 275));

  // Shared Hero Content
  const renderHeroContent = () => (
    <View
      style={{
        height: heroHeight,
        backgroundColor: C.navy,
        justifyContent: 'space-between',
        paddingHorizontal: 22,
        paddingTop: isDesktop ? 20 : Math.max(insets.top + 10, 20),
        paddingBottom: isDesktop ? 26 : 40,
        overflow: 'hidden',
        borderBottomLeftRadius: isDesktop ? 0 : 36,
        borderBottomRightRadius: isDesktop ? 0 : 36,
      }}>
      <FastImage
        source={loginHeroSource}
        priority="high"
        contentFit="cover"
        resizeMode="cover"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: heroHeight }}
      />
      {/* Subtle gradient dark overlays for maximum legibility */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(7, 19, 38, 0.44)',
        }}
      />
      <Svg
        pointerEvents="none"
        width="100%"
        height={160}
        viewBox="0 0 440 150"
        preserveAspectRatio="none"
        style={{ position: 'absolute', left: 0, bottom: 0 }}>
        <Path d="M0 60 C90 24 150 6 220 6 C290 6 350 24 440 60 L440 150 L0 150 Z" fill="rgba(3,9,19,0.76)" />
      </Svg>

      {/* Top Pill: Alexandria Badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.22)',
            borderWidth: 1.2,
            borderColor: 'rgba(255,255,255,0.55)',
            borderRadius: 22,
            paddingHorizontal: 14,
            paddingVertical: 6,
          }}>
          <Txt style={{ color: C.white, fontSize: 13, fontWeight: '800' }}>الإسكندرية · منذ ١٩٦٠</Txt>
        </View>
      </View>

      {/* Center Brand Identity */}
      <View style={{ alignItems: 'center', paddingBottom: 4 }}>
        <View
          style={{
            width: isShortPhone ? 64 : 76,
            height: isShortPhone ? 64 : 76,
            borderRadius: isShortPhone ? 32 : 38,
            borderWidth: 2.5,
            borderColor: C.gold,
            padding: 3,
            backgroundColor: C.white,
            elevation: 8,
            marginBottom: isShortPhone ? 7 : 10,
          }}>
          <Image
            source={images['brand-logo']}
            resizeMode="cover"
            style={{ width: '100%', height: '100%', borderRadius: 35 }}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Txt style={{ fontFamily: 'Rubik_700Bold', fontSize: isShortPhone ? 25 : 29, fontWeight: '900', color: C.white }}>
            طيور الرشيدي
          </Txt>
          <View
            style={{
              backgroundColor: C.gold,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 2.5,
              marginStart: 8,
            }}>
            <Txt style={{ fontSize: 13, fontFamily: 'Rubik_700Bold', color: C.navy }}>فريش</Txt>
          </View>
        </View>
        <Txt style={{ fontSize: 14.5, color: '#F1F5F9', fontWeight: '700', textAlign: 'center', marginTop: 4 }}>
          طازج كل يوم، وتجهيز على طلبك
        </Txt>
        <View
          style={{
            backgroundColor: 'rgba(217, 119, 6, 0.16)',
            borderWidth: 1.2,
            borderColor: 'rgba(245, 158, 11, 0.45)',
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingVertical: 6,
            marginTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}>
          <Txt style={{ fontFamily: 'ArefRuqaa_700Bold', fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>
            سهل تبقى فرارجي
          </Txt>
          <Txt style={{ fontFamily: 'ArefRuqaa_700Bold', fontSize: 20, fontWeight: '700', color: '#FCD34D' }}>
            · صعب تبقى الرشيدي
          </Txt>
        </View>
      </View>
    </View>
  );

  // Shared Action Card Elements
  const renderActionForm = () => (
    <View>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Txt style={{ fontFamily: 'Rubik_700Bold', fontSize: 24, fontWeight: '900', color: C.navy, textAlign: 'center' }}>
          أهلاً بك في عائلة الرشيدي
        </Txt>
        <Txt style={{ fontSize: 14.5, color: C.muted, marginTop: 5, textAlign: 'center', lineHeight: 22 }}>
          دواجن طازجة وتجهيز فوري بجودة تثق بها
        </Txt>
      </View>

      {/* Primary Action Button: Register */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="إنشاء حساب جديد"
        onPress={onRegister}
        style={{
          minHeight: 56,
          borderRadius: 16,
          backgroundColor: C.action,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          elevation: 4,
          shadowColor: C.action,
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        }}>
        <Ionicons name="arrow-forward" size={21} color={C.actionText} />
        <Txt style={{ color: C.actionText, fontWeight: '900', fontSize: 16.5 }}>ابدأ الآن · إنشاء حساب</Txt>
      </Pressable>

      {/* Secondary Action Button: Login */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="تسجيل الدخول بحساب موجود"
        onPress={onLogin}
        style={{
          minHeight: 52,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: C.inputBorder,
          backgroundColor: C.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 9,
          marginTop: 12,
        }}>
        <Ionicons name="person-outline" size={20} color={C.blue} />
        <Txt style={{ color: C.ink, fontWeight: '800', fontSize: 15.5 }}>تسجيل الدخول بحساب موجود</Txt>
      </Pressable>

      {/* Guest Divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 14 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
        <Txt style={{ fontSize: 13, color: C.muted, marginHorizontal: 12, fontWeight: '700' }}>أو تصفح قبل التسجيل</Txt>
        <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
      </View>

      {/* Guest Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="المتابعة كضيف"
        onPress={onGuest}
        style={{
          minHeight: 48,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          borderRadius: 14,
          backgroundColor: 'rgba(23,74,156,0.08)',
        }}>
        <Ionicons name="bag-handle-outline" size={19} color={C.blue} />
        <Txt style={{ fontSize: 15, color: C.blue, fontWeight: '900' }}>المتابعة كضيف</Txt>
      </Pressable>
      <Txt style={{ fontSize: 12.5, color: C.muted, textAlign: 'center', lineHeight: 19, marginTop: 9 }}>
        يمكنك الطلب كضيف دون إنشاء حساب. تسجيل الدخول متاح للحسابات المفعّلة.
      </Txt>
    </View>
  );

  const renderTrustBadges = (inCard = false) => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: inCard ? 18 : 18,
        paddingHorizontal: 12,
      }}>
      {[
        { icon: 'location-outline', label: 'توصيل داخل الإسكندرية' },
        { icon: 'cut-outline', label: 'تجهيز حسب طلبك' },
      ].map(({ icon, label }) => (
        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={icon as any} size={17} color={C.muted} />
          <Txt style={{ fontSize: 12.5, color: C.muted, fontWeight: '700' }}>{label}</Txt>
        </View>
      ))}
    </View>
  );

  // Desktop / Tablet Layout: Centered Elegant Card
  if (isDesktop) {
    return (
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: C.background,
          paddingVertical: 42,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}>
        <View
          style={{
            width: '100%',
            maxWidth: 560,
            borderRadius: 32,
            overflow: 'hidden',
            backgroundColor: C.surface,
            borderWidth: 1.2,
            borderColor: 'rgba(23,74,156,0.14)',
            elevation: 14,
            shadowColor: '#071326',
            shadowOpacity: 0.18,
            shadowRadius: 32,
            shadowOffset: { width: 0, height: 14 },
            ...(Platform.OS === 'web'
              ? {
                  boxShadow: '0 28px 68px rgba(15,35,70,0.14), 0 10px 28px rgba(15,35,70,0.06)',
                }
              : {}),
          }}>
          {renderHeroContent()}
          <View style={{ paddingHorizontal: 28, paddingTop: 24, paddingBottom: 24 }}>
            {renderActionForm()}
            {renderTrustBadges(true)}
          </View>
        </View>

        {/* Elegant Desktop Brand Footer */}
        <View style={{ marginTop: 22, alignItems: 'center' }}>
          <Txt style={{ fontSize: 13, color: C.muted, fontWeight: '700', textAlign: 'center' }}>
            طيور الرشيدي · الإسكندرية منذ ١٩٦٠ · الجودة والأصل
          </Txt>
        </View>
      </ScrollView>
    );
  }

  // Mobile Layout: Full Bleed Edge-to-Edge Hero with Floating Card
  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        backgroundColor: C.background,
        paddingBottom: Math.max(insets.bottom + 20, 28),
      }}
      showsVerticalScrollIndicator={false}>
      <View style={{ width: '100%', maxWidth: 520, flex: 1 }}>
        {renderHeroContent()}

        {/* Floating Action Card */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: -22,
            backgroundColor: C.surface,
            borderRadius: 28,
            borderWidth: 1.2,
            borderColor: C.border,
            paddingHorizontal: 22,
            paddingTop: 22,
            paddingBottom: 20,
            elevation: 10,
            shadowColor: C.navy,
            shadowOpacity: 0.14,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
          }}>
          {renderActionForm()}
        </View>

        {/* Feature Badges Footer */}
        {renderTrustBadges(false)}
      </View>
    </ScrollView>
  );
}
