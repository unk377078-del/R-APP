import React, { useMemo, useRef } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { C, s, fontRuqaaBold } from './theme';
import { Product } from './models';
import { FastImage } from './FastImage';
import { images } from './nativeAssets';
import { cloudImages, toCdnUrl } from './cloudAssets';
import { Txt } from './ui';

interface MarqueeOffersProps {
  state: any;
  activeProducts: Product[];
  onProduct: (p: Product) => void;
  onAdd: (p: Product) => void;
  activeScheme?: 'light' | 'dark';
  onMore?: () => void;
}

function resolveProductImage(p: Product) {
  if (p.imageUri && (p.imageUri.startsWith('http') || p.imageUri.startsWith('data:image/'))) {
    return { uri: p.imageUri };
  }
  if (p.image && images[p.image]) {
    return images[p.image];
  }
  if (p.image && cloudImages[p.image]) {
    return { uri: toCdnUrl(cloudImages[p.image], 420) };
  }
  const fallbackKey = 'product-' + p.id.replace('prod_', '');
  if (cloudImages[fallbackKey]) {
    return { uri: toCdnUrl(cloudImages[fallbackKey], 420) };
  }
  return images.chicken;
}

// Generous, taller card dimensions for comfortable multi-line offer text
const CARD_WIDTH = 320;
const CARD_HEIGHT = 170;
const CARD_GAP = 14;
const CARD_STEP = CARD_WIDTH + CARD_GAP; // 334px

export function MarqueeOffers({
  state,
  activeProducts,
  onProduct,
  onAdd,
  activeScheme = 'light',
  onMore,
}: MarqueeOffersProps) {
  const isDark = activeScheme === 'dark';
  const scrollRef = useRef<any>(null);
  const scrollXRef = useRef(0);

  // Filter & sort offers according to manager's custom dashboard order
  const deals = useMemo(() => {
    const explicitOffers = activeProducts.filter(
      (p: Product) => p.available !== false && p.offer === true
    );

    if (explicitOffers.length > 0) {
      return [...explicitOffers].sort((a, b) => (a.offerOrder ?? 999) - (b.offerOrder ?? 999));
    }

    // Default curated fallback if manager hasn't explicitly toggled any offer yet
    return activeProducts
      .filter(
        (p: Product) =>
          p.available !== false &&
          (p.badge ||
            p.category === 'متبلات' ||
            p.category === 'فراخ' ||
            p.featured)
      )
      .slice(0, 8);
  }, [activeProducts]);

  const getInCartQty = (productId: string) => {
    return (state.cart || []).reduce(
      (sum: number, line: any) => (line.productId === productId ? sum + line.quantity : sum),
      0
    );
  };

  const handleScroll = (e: any) => {
    scrollXRef.current = e.nativeEvent.contentOffset.x;
  };

  // Robust Next & Previous navigation that works on both Web (RTL DOM) and native mobile
  const scrollNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (Platform.OS === 'web') {
      try {
        const node: any = scrollRef.current?.getScrollableNode?.() || scrollRef.current;
        if (node) {
          if (typeof node.scrollBy === 'function') {
            node.scrollBy({ left: -CARD_STEP, behavior: 'smooth' });
            return;
          }
          node.scrollLeft -= CARD_STEP;
          return;
        }
      } catch {}
    }

    const next = scrollXRef.current + CARD_STEP;
    scrollRef.current?.scrollTo({ x: next, animated: true });
    scrollXRef.current = next;
  };

  const scrollPrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (Platform.OS === 'web') {
      try {
        const node: any = scrollRef.current?.getScrollableNode?.() || scrollRef.current;
        if (node) {
          if (typeof node.scrollBy === 'function') {
            node.scrollBy({ left: CARD_STEP, behavior: 'smooth' });
            return;
          }
          node.scrollLeft += CARD_STEP;
          return;
        }
      } catch {}
    }

    const prev = Math.max(0, scrollXRef.current - CARD_STEP);
    scrollRef.current?.scrollTo({ x: prev, animated: true });
    scrollXRef.current = prev;
  };

  if (!deals.length) return null;

  return (
    <View
      style={{
        marginTop: 18,
        marginBottom: 10,
        paddingVertical: 14,
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.55)' : '#F8FAFC',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: isDark ? 'rgba(23, 74, 156, 0.35)' : 'rgba(23, 74, 156, 0.18)',
        position: 'relative',
      }}>
      {/* ── Section Title Bar & Navigation Controls ── */}
      <View
        style={[
          s.row,
          {
            paddingHorizontal: 16,
            marginBottom: 12,
            justifyContent: 'space-between',
            alignItems: 'center',
          },
        ]}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isDark ? 'rgba(23, 74, 156, 0.25)' : 'rgba(23, 74, 156, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(23, 74, 156, 0.25)',
            }}>
            <Ionicons name="pricetag" size={18} color={C.action} />
          </View>
          <View style={{ alignItems: 'flex-start' }}>
            <Txt
              style={{
                fontFamily: fontRuqaaBold,
                fontSize: 23,
                fontWeight: '700',
                textAlign: 'right',
                color: C.navy,
                lineHeight: 28,
              }}>
              عروض التوفير الحصرية
            </Txt>
            <Txt style={{ fontSize: 10.5, color: isDark ? '#93C5FD' : C.action, fontWeight: '800' }}>
              ● مرر يميناً ويساراً لتصفح العروض
            </Txt>
          </View>
        </View>

        {/* View All & Quick Header Arrows */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
          {onMore && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="عرض كل منتجات العروض"
              onPress={onMore}
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 14,
                backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(23,74,156,0.08)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(23,74,156,0.18)',
              }}>
              <Txt style={{ fontSize: 12, fontWeight: '800', color: C.action }}>عرض الكل</Txt>
              <Ionicons name="chevron-back" size={13} color={C.action} />
            </Pressable>
          )}

          {/* Mini Header Arrows */}
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="العرض السابق"
              onPress={scrollPrev}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : C.action,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="chevron-forward" size={15} color={C.action} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="العرض التالي"
              onPress={scrollNext}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : C.action,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="chevron-back" size={15} color={C.action} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* ── Horizontal Interactive Carousel Container ── */}
      <View style={{ position: 'relative', width: '100%' }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="normal"
          contentContainerStyle={{
            paddingHorizontal: 22,
            gap: CARD_GAP,
            flexDirection: 'row-reverse',
            paddingVertical: 6,
          }}>
          {deals.map((p: Product, index: number) => {
            const inCart = getInCartQty(p.id);
            const imgSrc = resolveProductImage(p);
            const offerText = p.offerDescription || p.subtitle || 'ذبح وتنظيف فوري طازج على طلبك بأعلى معايير الجودة والنظافة';

            return (
              <Pressable
                key={`${p.id}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`عرض ${p.name}`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onProduct(p);
                }}
                style={{
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  borderRadius: 24,
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderWidth: 2,
                  borderColor: isDark ? 'rgba(23, 74, 156, 0.65)' : C.action,
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  padding: 12,
                  gap: 12,
                  elevation: 6,
                  shadowColor: C.action,
                  shadowOpacity: 0.16,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 6 },
                  ...(Platform.OS === 'web'
                    ? {
                        boxShadow: '0 8px 24px rgba(23,74,156,0.14)',
                      }
                    : {}),
                }}>
                {/* Right Side: Large Prominent Food Thumbnail with Royal Blue Badge */}
                <View
                  style={{
                    width: 116,
                    height: 144,
                    borderRadius: 18,
                    overflow: 'hidden',
                    backgroundColor: C.surfaceAlt,
                    position: 'relative',
                  }}>
                  <FastImage
                    source={imgSrc}
                    contentFit="cover"
                    style={{ width: '100%', height: '100%' }}
                  />

                  {/* App Royal Blue Offer Badge Tag */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      backgroundColor: C.action,
                      borderRadius: 8,
                      paddingHorizontal: 6.5,
                      paddingVertical: 2.5,
                      elevation: 3,
                    }}>
                    <Txt style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: '900' }}>
                      {p.badge || 'عرض خاص'}
                    </Txt>
                  </View>
                </View>

                {/* Left Side: Rich Information, Price, Offer Description & Scale Assurance */}
                <View
                  style={{
                    flex: 1,
                    height: 144,
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}>
                  <View style={{ width: '100%' }}>
                    {/* Category / Quality Pill Tag in Royal Blue */}
                    <View
                      style={{
                        backgroundColor: isDark ? 'rgba(23,74,156,0.25)' : 'rgba(23,74,156,0.08)',
                        borderRadius: 7,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        alignSelf: 'flex-start',
                        marginBottom: 4,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(23,74,156,0.45)' : 'rgba(23,74,156,0.25)',
                      }}>
                      <Txt
                        style={{
                          fontSize: 9.5,
                          fontWeight: '800',
                          color: isDark ? '#93C5FD' : C.action,
                        }}>
                        {p.category === 'متبلات'
                          ? 'تتبيلة الشيف 🍢'
                          : p.category === 'فراخ'
                          ? 'طازج مزارع 🍗'
                          : 'تجهيز فوري فاخر ✨'}
                      </Txt>
                    </View>

                    {/* Product Name (Bold & Large) */}
                    <Txt
                      numberOfLines={1}
                      style={{
                        fontFamily: 'Rubik_700Bold',
                        fontSize: 15,
                        fontWeight: '900',
                        color: C.navy,
                        textAlign: 'right',
                        width: '100%',
                      }}>
                      {p.name}
                    </Txt>

                    {/* Multi-line Offer Description with ample height */}
                    <Txt
                      numberOfLines={3}
                      style={{
                        fontSize: 10.5,
                        lineHeight: 15.5,
                        color: isDark ? '#CBD5E1' : '#475569',
                        marginTop: 4,
                        textAlign: 'right',
                        width: '100%',
                      }}>
                      {offerText}
                    </Txt>
                  </View>

                  {/* Pricing Bar & Action Button */}
                  <View
                    style={{
                      flexDirection: 'row-reverse',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      marginTop: 4,
                    }}>
                    <View style={{ alignItems: 'flex-start' }}>
                      <Txt style={{ fontSize: 15, color: C.action, fontWeight: '900', textAlign: 'right' }}>
                        {p.unit === 'للقطعة' && p.piecePrice ? `${p.piecePrice} ج.م` : `${p.price} ج.م`}
                      </Txt>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`إضافة ${p.name}`}
                      onPress={(e) => {
                        e.stopPropagation();
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        onAdd(p);
                      }}
                      style={{
                        backgroundColor: inCart > 0 ? '#059669' : C.action,
                        borderRadius: 10,
                        paddingHorizontal: 11,
                        paddingVertical: 7,
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        gap: 4,
                        elevation: 2,
                      }}>
                      <Ionicons
                        name={inCart > 0 ? 'checkmark' : 'add'}
                        size={13}
                        color="#FFFFFF"
                      />
                      <Txt style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>
                        {inCart > 0 ? `في السلة (${inCart})` : 'أضف +'}
                      </Txt>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Overlay Floating Arrow Buttons (Mounted AFTER ScrollView to guarantee clicks) ── */}
        <View
          pointerEvents="box-none"
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: 'center',
              zIndex: 9999,
              elevation: 12,
            },
          ]}>
          {/* Left Arrow Button (التالي ◀) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="العرض التالي"
            onPress={scrollNext}
            style={({ pressed }) => ({
              position: 'absolute',
              left: 6,
              top: '50%',
              marginTop: -22,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderWidth: 2,
              borderColor: C.action,
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 10,
              shadowColor: C.action,
              shadowOpacity: 0.35,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              transform: [{ scale: pressed ? 0.92 : 1 }],
              zIndex: 10000,
              cursor: 'pointer',
            })}>
            <Ionicons name="chevron-back" size={22} color={C.action} />
          </Pressable>

          {/* Right Arrow Button (السابق ▶) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="العرض السابق"
            onPress={scrollPrev}
            style={({ pressed }) => ({
              position: 'absolute',
              right: 6,
              top: '50%',
              marginTop: -22,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderWidth: 2,
              borderColor: C.action,
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 10,
              shadowColor: C.action,
              shadowOpacity: 0.35,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              transform: [{ scale: pressed ? 0.92 : 1 }],
              zIndex: 10000,
              cursor: 'pointer',
            })}>
            <Ionicons name="chevron-forward" size={22} color={C.action} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
