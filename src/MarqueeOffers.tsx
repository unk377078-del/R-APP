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
import { Txt, getProductImageSource } from './ui';

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

// Generous, comfortable card dimensions for offers
const CARD_WIDTH = 320;
const CARD_HEIGHT = 156;
const CARD_GAP = 14;
const CARD_STEP = CARD_WIDTH + CARD_GAP;

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
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="العرض السابق"
              onPress={scrollPrev}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : C.action,
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 2,
              }}>
              <Ionicons name="chevron-forward" size={16} color={C.action} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="العرض التالي"
              onPress={scrollNext}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : C.action,
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 2,
              }}>
              <Ionicons name="chevron-back" size={16} color={C.action} />
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
            paddingHorizontal: 16,
            gap: CARD_GAP,
            flexDirection: 'row-reverse',
            paddingVertical: 6,
          }}>
          {deals.map((p: Product, index: number) => {
            const inCart = getInCartQty(p.id);
            const isOfferDiscount = Boolean(p.originalPrice && p.originalPrice > p.price);
            const savingsAmount = isOfferDiscount ? Math.round(p.originalPrice! - p.price) : 0;
            const savingsBadgeText = p.badge
              ? p.badge
              : isOfferDiscount
              ? `وفر ${savingsAmount} ج.م`
              : 'عرض خاص';
            const offerText = p.offerDescription?.trim() || p.subtitle?.trim() || 'طازج ومجهز يومياً بأعلى جودة';

            return (
              <Pressable
                key={`${p.id}-${index}`}
                accessibilityLabel={`عرض ${p.name}`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onProduct(p);
                }}
                style={{
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  borderRadius: 22,
                  backgroundColor: isDark ? '#162231' : '#FFFFFF',
                  borderWidth: 1.5,
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(23, 74, 156, 0.16)',
                  borderTopColor: isDark ? 'rgba(96, 165, 250, 0.5)' : 'rgba(23, 74, 156, 0.30)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 11,
                  gap: 12,
                  elevation: 4,
                  shadowColor: isDark ? '#000000' : '#0E2F65',
                  shadowOpacity: isDark ? 0.35 : 0.07,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  ...(Platform.OS === 'web'
                    ? {
                        boxShadow: isDark
                          ? '0 6px 18px rgba(0,0,0,0.3)'
                          : '0 6px 18px rgba(23,74,156,0.07)',
                      }
                    : {}),
                }}>
                {/* 1. Product Image Frame (Studio Clean Light & Shadow) */}
                <View
                  style={{
                    width: 124,
                    height: 134,
                    borderRadius: 16,
                    overflow: 'hidden',
                    backgroundColor: isDark ? '#172234' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    position: 'relative',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isDark ? 0.3 : 0.04,
                    shadowRadius: 3,
                    elevation: 2,
                  }}>
                  <FastImage
                    source={getProductImageSource(p)}
                    fallbackSource={images.chicken}
                    contentFit="cover"
                    style={{ width: '100%', height: '100%' }}
                  />

                  {/* Savings / Special Offer Badge */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      backgroundColor: isOfferDiscount ? '#DC2626' : C.action,
                      borderRadius: 8,
                      paddingHorizontal: 7,
                      paddingVertical: 2.5,
                      elevation: 3,
                    }}>
                    <Txt style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: '900' }}>
                      {savingsBadgeText}
                    </Txt>
                  </View>
                </View>

                {/* 2. Details Column (Title, Tag, Subtitle, Price & Button) */}
                <View
                  style={{
                    flex: 1,
                    height: 134,
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}>
                  <View style={{ width: '100%' }}>
                    {/* Category / Quality Tag */}
                    <View
                      style={{
                        backgroundColor: isDark ? 'rgba(23,74,156,0.25)' : 'rgba(23,74,156,0.08)',
                        borderRadius: 7,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        alignSelf: 'flex-start',
                        marginBottom: 4,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(23,74,156,0.45)' : 'rgba(23,74,156,0.20)',
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
                          : p.category === 'بط'
                          ? 'بط بلدي فاخر 🦆'
                          : 'تجهيز فوري فاخر ✨'}
                      </Txt>
                    </View>

                    {/* Product Name */}
                    <Txt
                      numberOfLines={1}
                      style={{
                        fontFamily: 'Rubik_700Bold',
                        fontSize: 15.5,
                        fontWeight: '900',
                        color: C.navy,
                        textAlign: 'right',
                        width: '100%',
                      }}>
                      {p.name}
                    </Txt>

                    {/* Subtitle / Offer Description */}
                    <Txt
                      numberOfLines={1}
                      style={{
                        fontSize: 10.5,
                        lineHeight: 15,
                        color: isDark ? '#94A3B8' : '#64748B',
                        marginTop: 3,
                        textAlign: 'right',
                        width: '100%',
                      }}>
                      {offerText}
                    </Txt>
                  </View>

                  {/* Pricing Bar & Action Button */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      marginTop: 4,
                    }}>
                    {/* Price and Original Price (Strikethrough) */}
                    <View style={{ alignItems: 'flex-start' }}>
                      <Txt style={{ fontSize: 16, color: C.action, fontWeight: '900', textAlign: 'right' }}>
                        {p.unit === 'للقطعة' && p.piecePrice ? `${p.piecePrice} ج.م` : `${p.price} ج.م`}
                      </Txt>
                      {isOfferDiscount && (
                        <Txt
                          style={{
                            fontSize: 10.5,
                            color: C.muted,
                            textDecorationLine: 'line-through',
                            textAlign: 'right',
                            marginTop: 1,
                          }}>
                          {`${p.originalPrice} ج.م`}
                        </Txt>
                      )}
                    </View>

                    {/* Add to Cart Button (CLEAN SINGLE PLUS - NO DUPLICATE ++) */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`إضافة ${p.name}`}
                      onPress={(e) => {
                        e.stopPropagation();
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        onAdd(p);
                      }}
                      style={{
                        backgroundColor: inCart > 0 ? '#15803D' : C.action,
                        borderRadius: 11,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        elevation: 2,
                        shadowColor: inCart > 0 ? '#15803D' : C.action,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                      }}>
                      <Ionicons
                        name={inCart > 0 ? 'checkmark' : 'add'}
                        size={14}
                        color="#FFFFFF"
                      />
                      <Txt style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '900' }}>
                        {inCart > 0 ? `في السلة (${inCart})` : 'أضف'}
                      </Txt>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
