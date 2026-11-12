import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CartLine, Product } from './models';
import { C, isDarkMode, s } from './theme';
import { Button, Chip, Field, Txt, displayUnit } from './ui';
import { getProductPrepGroups } from './preparation';
import { images } from './nativeAssets';
import { FastImage } from './FastImage';
import { cloudImages } from './cloudAssets';

const money = (n: number) => `${Math.round(n)} ج.م`;

export function ProductCustomizationSheet({ product, onAdd, initialLine }: any) {
  const [qty, setQty] = useState<number>(initialLine?.quantity ?? 1);
  const [size, setSize] = useState<string>(initialLine?.size || product.sizes?.[0] || 'عادي');
  const [unit, setUnit] = useState<string>(initialLine?.unit || product.unit);
  const [selectedPrep, setSelectedPrep] = useState<string>('');
  const [selectedSubOption, setSelectedSubOption] = useState<string>(initialLine?.selectedSubOption || '');
  const [note, setNote] = useState<string>(initialLine?.note || '');
  const [prepInfo, setPrepInfo] = useState<{ label: string; description: string } | null>(null);

  const step = unit === 'للكيلو' && product.allowHalfUnit !== false ? 0.5 : 1;

  const defaults =
    product.category === 'فراخ' || product.category === 'بط'
      ? getProductPrepGroups(product)
      : product.category === 'متبلات'
      ? [{ type: 'READY', label: 'تجهيز المتبلات', subOptions: ['جاهز للطهي', 'تتبيلة حارة', 'تقطيع حسب الطلب'] }]
      : [{ type: 'CLEAN', label: 'تجهيز وتنظيف', subOptions: [] }];

  const groups = Array.isArray(product.prepGroups)
    ? product.prepGroups
    : product.prepOptions?.length
    ? (() => {
        const cut: string[] = [];
        const debone: string[] = [];
        const other: any[] = [];
        product.prepOptions.forEach((raw: string) => {
          const x = raw.trim();
          if (/^(4|8)\s*قطع$|بالطول|بالعرض|مقطع/.test(x)) {
            cut.push(x.replace(/^مقطع\s*/, '').trim());
          } else if (/خلي|شيش|بانيه|مفروم/.test(x)) {
            debone.push(x.replace(/^خلي\s*/, ''));
          } else if (/سليم/.test(x)) {
            other.push({ type: 'WHOLE', label: x, subOptions: [] });
          } else if (/سلخ/.test(x)) {
            other.push({ type: 'SKINNED', label: 'سلخ', subOptions: [] });
          } else if (/نصف/.test(x)) {
            other.push({ type: 'HALF_LENGTHWISE', label: x, subOptions: [] });
          }
        });
        return [
          ...other,
          ...(cut.length ? [{ type: 'CUT', label: 'تقطيع', subOptions: cut }] : []),
          ...(debone.length ? [{ type: 'DEBONED', label: 'خلي', subOptions: debone }] : []),
        ];
      })()
    : defaults;

  useEffect(() => {
    const first = groups[0];
    const savedPrep = initialLine?.selectedPrep || initialLine?.options?.[0];
    const matched = groups.find((group: any) => group.label === savedPrep || group.type === savedPrep);
    const savedSub = initialLine?.selectedSubOption || initialLine?.options?.[1] || '';
    const matchedSub = matched?.subOptions?.find(
      (option: string) => option === savedSub || option.startsWith(`${savedSub} —`) || savedSub.startsWith(`${option} —`)
    );
    setSelectedPrep(matched?.type || first?.type || '');
    setSelectedSubOption(matchedSub || matched?.subOptions?.[0] || first?.subOptions?.[0] || '');
    setQty(initialLine?.quantity ?? 1);
    setUnit(initialLine?.unit || product.unit);
    setSize(initialLine?.size || product.sizes?.[0] || 'عادي');
    setNote(initialLine?.note || '');
  }, [product.id, initialLine?.id]);

  const activeGroup = groups.find((g: any) => g.type === selectedPrep);
  const selectedOption = activeGroup?.subOptions?.find((option: string) => option === selectedSubOption) || '';
  const selectedLabel = selectedOption.split(' — ')[0] || selectedSubOption;
  const selection = selectedPrep ? [activeGroup?.label || selectedPrep, ...(selectedLabel ? [selectedLabel] : [])] : [];
  const unitPrice = unit === 'للقطعة' && product.piecePrice ? product.piecePrice : product.price;

  const hasCustomUri = typeof product.imageUri === 'string' && product.imageUri.trim().length > 5;
  const hasCustomUrl = typeof product.imageUrl === 'string' && product.imageUrl.trim().length > 5;
  const localImg = images[product.image];
  const productImgSource = hasCustomUri
    ? { uri: product.imageUri.trim() }
    : hasCustomUrl
    ? { uri: product.imageUrl.trim() }
    : localImg || (cloudImages[product.image] ? { uri: cloudImages[product.image] } : images.chicken);

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: 24 }]}>
        <View style={[s.card, { alignItems: 'center', padding: 20 }]}>
          <View style={{ width: '100%', height: 180, borderRadius: 18, overflow: 'hidden', backgroundColor: C.surfaceAlt, marginBottom: 12 }}>
            <FastImage
              source={productImgSource}
              fallbackSource={images.chicken}
              contentFit="cover"
              style={{ width: '100%', height: '100%' }}
            />
          </View>
          {product.badge && <Txt style={{ color: C.green, fontWeight: '800', textAlign: 'center' }}>{product.badge}</Txt>}
          {!product.available && (
            <Txt style={{ color: C.red, fontWeight: '900', marginTop: 6, textAlign: 'center' }}>نفد مؤقتاً</Txt>
          )}
          <Txt
            style={{
              fontFamily: 'Rubik_700Bold',
              fontSize: 22,
              fontWeight: '900',
              marginTop: 6,
              color: C.navy,
              textAlign: 'center',
            }}>
            {product.name}
          </Txt>
          <Txt style={{ color: C.action, fontWeight: '900', marginTop: 4, textAlign: 'center', fontSize: 17 }}>
            {product.unit === 'للقطعة' && product.piecePrice ? `${product.piecePrice} ج.م` : `${product.price} ج.م`}
          </Txt>
          {!!product.subtitle?.trim() && (
            <Txt style={[s.small, { textAlign: 'center', marginTop: 2 }]}>{product.subtitle.trim()}</Txt>
          )}
          {!!product.weightNote && (
            <Txt style={[s.small, { marginTop: 4, color: C.muted, textAlign: 'center' }]}>{product.weightNote}</Txt>
          )}
        </View>

        <Txt style={s.section}>
          {unit === 'للكيلو' && product.allowHalfUnit !== false ? 'الكمية · بخطوة نصف كيلو' : 'الكمية'}
        </Txt>
        <View
          style={[
            s.card,
            { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 16 },
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="زيادة الكمية"
            onPress={() => setQty((x) => x + step)}
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 14,
              backgroundColor: 'rgba(214,40,50,0.1)',
            }}>
            <Ionicons name="add" size={22} color={C.red} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Txt style={{ fontSize: 22, fontWeight: '900', color: C.navy }}>{`${qty} ${
              unit === 'للكيلو' ? 'كجم' : unit === 'للقطعة' ? 'قطعة' : displayUnit(unit)
            }`}</Txt>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="تقليل الكمية"
            onPress={() => setQty((x) => Math.max(step, Math.round((x - step) * 2) / 2))}
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 14,
              backgroundColor: C.surfaceAlt,
            }}>
            <Ionicons name="remove" size={22} color={C.navy} />
          </Pressable>
        </View>

        {product.allowSellingByKilo !== false && product.allowSellingByPiece !== false && (
          <>
            <Txt style={s.section}>طريقة البيع</Txt>
            <View style={[s.card, { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, padding: 12 }]}>
              {['للكيلو', 'للقطعة'].map((x: string) => (
                <Chip key={x} label={x === 'للكيلو' ? 'بالكيلو' : 'بالقطعة'} selected={unit === x} onPress={() => { setUnit(x); setQty(1); }} />
              ))}
            </View>
          </>
        )}

        {product.sizes && product.sizes.length > 0 && (
          <>
            <Txt style={s.section}>اختيار الحجم</Txt>
            <View style={[s.card, { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, padding: 12 }]}>
              {product.sizes.map((x: string) => (
                <Chip key={x} label={x} selected={size === x} onPress={() => setSize(x)} />
              ))}
            </View>
          </>
        )}

        {groups.length > 0 && (
          <Txt style={[s.small, { marginBottom: 8, textAlign: 'right' }]}>
            اختر طريقة واحدة، ثم اختر التفصيلة إن كانت متاحة.
          </Txt>
        )}
        {groups.map((group: any) => {
          const active = selectedPrep === group.type;
          const isDark = isDarkMode();
          const activeBg = isDark ? 'rgba(21,128,61,0.22)' : '#F0FDF4';
          const icon =
            group.type === 'WHOLE'
              ? 'cube-outline'
              : group.type === 'CUT'
              ? 'cut'
              : group.type === 'DEBONED'
              ? 'restaurant'
              : group.type === 'SKINNED'
              ? 'sparkles'
              : 'shield-checkmark-outline';

          return (
            <View
              key={group.type}
              style={[
                s.card,
                {
                  padding: 0,
                  overflow: 'hidden',
                  borderColor: active ? C.green : C.border,
                  backgroundColor: active ? activeBg : C.surface,
                },
              ]}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setSelectedPrep(group.type);
                  const firstOpt = group.subOptions?.[0] || '';
                  setSelectedSubOption(firstOpt);
                  if (firstOpt) {
                    const [optLabel, optDesc] = firstOpt.split(' — ');
                    if (optDesc) setPrepInfo({ label: optLabel, description: optDesc });
                  }
                }}
                style={{
                  minHeight: 64,
                  paddingHorizontal: 15,
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  gap: 12,
                }}>
                <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={23} color={active ? C.green : C.muted} />
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active ? (isDark ? 'rgba(21,128,61,0.3)' : '#DCFCE7') : C.surfaceAlt,
                  }}>
                  <Ionicons name={icon as any} size={20} color={active ? C.green : C.navy} />
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Txt style={{ fontWeight: '900', fontSize: 15.5, color: active ? C.green : C.ink, textAlign: 'right' }}>
                    {group.label}
                  </Txt>
                  <Txt style={{ fontSize: 10, color: C.muted, textAlign: 'right' }}>
                    {group.subOptions?.length ? group.subOptions.length + ' اختيارات متاحة' : 'تجهيز أساسي'}
                  </Txt>
                </View>
              </Pressable>

              {active && !!group.subOptions?.length && (
                <View style={{ borderTopWidth: 1, borderColor: isDark ? 'rgba(21,128,61,0.2)' : '#DCFCE7', padding: 12 }}>
                  <Txt style={{ fontSize: 11, fontWeight: '900', color: C.navy, marginBottom: 8, textAlign: 'right' }}>
                    حدد التفصيلة المطلوبة (اضغط لعرض الشرح)
                  </Txt>
                  <View style={{ flexDirection: 'column', gap: 8 }}>
                    {group.subOptions.map((option: string) => {
                      const chosen = selectedSubOption === option;
                      const [optLabel, optDesc] = option.split(' — ');
                      return (
                        <Pressable
                          key={option}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: chosen }}
                          onPress={() => {
                            setSelectedSubOption(option);
                            if (optDesc) {
                              setPrepInfo({ label: optLabel, description: optDesc });
                            }
                          }}
                          style={{
                            minHeight: 46,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 14,
                            borderWidth: 1.5,
                            borderColor: chosen ? C.green : C.border,
                            backgroundColor: chosen ? C.green : C.surfaceAlt,
                            flexDirection: 'row-reverse',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                          <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <Txt
                              style={{
                                fontSize: 13,
                                fontWeight: chosen ? '900' : '700',
                                color: chosen ? C.white : C.ink,
                                textAlign: 'right',
                              }}>
                              {optLabel}
                            </Txt>
                            {!!optDesc && (
                              <Txt
                                style={{
                                  fontSize: 10.5,
                                  marginTop: 2,
                                  color: chosen ? 'rgba(255,255,255,0.88)' : C.muted,
                                  textAlign: 'right',
                                }}>
                                {optDesc}
                              </Txt>
                            )}
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {!!optDesc && (
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`شرح تفصيلة ${optLabel}`}
                                hitSlop={8}
                                onPress={() => setPrepInfo({ label: optLabel, description: optDesc })}>
                                <Ionicons
                                  name="information-circle-outline"
                                  size={19}
                                  color={chosen ? 'rgba(255,255,255,0.9)' : C.navy}
                                />
                              </Pressable>
                            )}
                            {chosen && <Ionicons name="checkmark-circle" size={18} color={C.white} />}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          );
        })}

        <Field label="ملاحظات الطبخ والتغليف" value={note} onChangeText={setNote} placeholder="مثال: تقطيع صغير، تغليف منفصل…" />
      </ScrollView>

      {/* Sticky Bottom Action Bar with Total */}
      <View
        style={{
          paddingHorizontal: 18,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 24 : 14,
          backgroundColor: C.solidSurface,
          borderTopWidth: 1,
          borderColor: C.border,
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        }}>
        <View style={{ alignItems: 'flex-end', flex: 1, paddingStart: 8 }}>
          <Txt style={{ fontSize: 16, fontWeight: '900', color: C.navy, textAlign: 'right' }}>
            {unit === 'للقطعة' && product.piecePrice ? `${product.piecePrice} ج.م` : `${product.price} ج.م`}
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          {!product.available ? (
            <Button title="نفد مؤقتاً" disabled />
          ) : product.priceOnCall ? (
            <Button title="اتصل للطلب" secondary onPress={() => Linking.openURL('tel:01223381405')} />
          ) : (
            <Button
              title={initialLine ? 'حفظ التعديلات' : 'أضف للسلة'}
              onPress={() => onAdd(qty, size, selection, note, unit, selectedPrep, selectedSubOption)}
            />
          )}
        </View>
      </View>

      {prepInfo && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(13,28,50,0.65)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 22,
            zIndex: 9999,
          }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="إغلاق الشرح"
            onPress={() => setPrepInfo(null)}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          />
          <View
            style={[
              s.card,
              {
                width: '100%',
                maxWidth: 400,
                padding: 22,
                borderRadius: 24,
                elevation: 20,
                borderWidth: 1.5,
                borderColor: C.gold,
                backgroundColor: C.solidSurface,
                alignItems: 'center',
              },
            ]}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: 'rgba(245,158,11,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}>
              <Ionicons name="information-circle" size={28} color={C.gold} />
            </View>
            <Txt style={{ fontSize: 19, fontWeight: '900', color: C.navy, marginBottom: 8, textAlign: 'center' }}>
              تفصيلة {prepInfo.label}
            </Txt>
            <Txt style={{ fontSize: 15, lineHeight: 24, color: C.ink, textAlign: 'center', marginBottom: 16 }}>
              {prepInfo.description}
            </Txt>
            <Button title="تمام" onPress={() => setPrepInfo(null)} style={{ width: '100%' }} />
          </View>
        </View>
      )}
    </View>
  );
}
