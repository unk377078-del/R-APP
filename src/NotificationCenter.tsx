import React, { useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { C, fontRuqaaBold, s } from './theme';
import { AppNotice } from './models';
import { Button, Txt } from './ui';
import { requestNotificationPermission, triggerDeviceNotification } from './systemNotifications';

interface NotificationCenterProps {
  state: any;
  onOpen: (notice: AppNotice) => void;
  onClear: () => void;
  onDeleteNotice?: (id: string) => void;
  onExplore?: () => void;
}

export function NotificationCenter({
  state,
  onOpen,
  onClear,
  onDeleteNotice,
  onExplore,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'orders' | 'promo'>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const notices: AppNotice[] = state.notices || [];

  const filteredNotices = useMemo(() => {
    if (filter === 'all') return notices;
    if (filter === 'orders') {
      return notices.filter(
        (n) => n.kind === 'order' || n.target === 'orders' || /طلب|تجهيز|توصيل|تسليم/i.test(n.title + ' ' + n.message)
      );
    }
    if (filter === 'promo') {
      return notices.filter(
        (n) => n.kind === 'promo' || n.target === 'rewards' || /خصم|كوبون|عرض|مكافأة|نقط/i.test(n.title + ' ' + n.message)
      );
    }
    return notices;
  }, [notices, filter]);

  const confirmClearAll = () => {
    if (!notices.length) return;
    setShowClearConfirm(true);
  };

  const getNoticeTheme = (n: AppNotice) => {
    const text = (n.title + ' ' + n.message).toLowerCase();
    if (text.includes('تم التسليم') || text.includes('تسليم')) {
      return {
        icon: 'checkmark-circle' as const,
        iconColor: '#16A34A',
        iconBg: 'rgba(22, 163, 74, 0.12)',
        tag: 'تم التسليم',
        tagColor: '#16A34A',
        tagBg: 'rgba(22, 163, 74, 0.10)',
        actionLabel: 'تفاصيل الطلب',
      };
    }
    if (text.includes('خرج للتوصيل') || text.includes('توصيل') || text.includes('في الطريق')) {
      return {
        icon: 'bicycle' as const,
        iconColor: '#EA580C',
        iconBg: 'rgba(234, 88, 12, 0.12)',
        tag: 'في الطريق إليك',
        tagColor: '#EA580C',
        tagBg: 'rgba(234, 88, 12, 0.10)',
        actionLabel: 'متابعة مسار التوصيل',
      };
    }
    if (text.includes('جاري التجهيز') || text.includes('تجهيز') || text.includes('المطبخ')) {
      return {
        icon: 'restaurant' as const,
        iconColor: '#D97706',
        iconBg: 'rgba(217, 119, 6, 0.14)',
        tag: 'قيد التجهيز الفوري',
        tagColor: '#D97706',
        tagBg: 'rgba(217, 119, 6, 0.10)',
        actionLabel: 'متابعة الطلب',
      };
    }
    if (text.includes('استلام') || text.includes('طلب جديد') || text.includes('مراجعة') || n.kind === 'order' || n.target === 'orders') {
      return {
        icon: 'cube' as const,
        iconColor: '#2563EB',
        iconBg: 'rgba(37, 99, 235, 0.12)',
        tag: 'تحديث الطلب',
        tagColor: '#2563EB',
        tagBg: 'rgba(37, 99, 235, 0.10)',
        actionLabel: 'عرض الطلبات',
      };
    }
    if (text.includes('كوبون') || text.includes('خصم') || text.includes('هدية') || text.includes('مكافأة') || n.target === 'rewards') {
      return {
        icon: 'gift' as const,
        iconColor: '#DC2626',
        iconBg: 'rgba(220, 38, 38, 0.12)',
        tag: 'عرض خاص وكوبون',
        tagColor: '#DC2626',
        tagBg: 'rgba(220, 38, 38, 0.10)',
        actionLabel: 'استخدام الكوبون',
      };
    }
    return {
      icon: 'sparkles' as const,
      iconColor: '#CA8A04',
      iconBg: 'rgba(202, 138, 4, 0.14)',
      tag: 'إشعار طيور الرشيدي',
      tagColor: '#CA8A04',
      tagBg: 'rgba(202, 138, 4, 0.10)',
      actionLabel: 'عرض التفاصيل',
    };
  };

  const formatRelativeTime = (timestamp: number) => {
    if (!timestamp) return 'الآن';
    const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSeconds < 60) return 'منذ لحظات';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return new Date(timestamp).toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 36 }}>
      {/* Header Info & Actions */}
      <View
        style={{
          flexDirection: 'row-reverse',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          paddingHorizontal: 4,
        }}>
        <View style={{ alignItems: 'flex-end' }}>
          <Txt style={{ fontFamily: fontRuqaaBold, fontSize: 21, lineHeight: 28, fontWeight: '700', color: C.navy }}>
            صندوق التنبيهات
          </Txt>
          <Txt style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {notices.length > 0 ? `${notices.length} إشعار مسجل` : 'لا توجد تنبيهات جديدة'}
          </Txt>
        </View>

        {notices.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="مسح جميع الإشعارات"
            onPress={confirmClearAll}
            style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 14,
              backgroundColor: 'rgba(220, 38, 38, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(220, 38, 38, 0.22)',
            }}>
            <Ionicons name="trash-bin-outline" size={15} color={C.red} />
            <Txt style={{ color: C.red, fontSize: 11, fontWeight: '800' }}>مسح الكل</Txt>
          </Pressable>
        )}
      </View>

      {/* Filter Tabs */}
      {notices.length > 0 && (
        <View
          style={{
            flexDirection: 'row-reverse',
            backgroundColor: C.surface,
            borderRadius: 20,
            padding: 4,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: C.border,
            gap: 6,
          }}>
          {[
            { id: 'all' as const, label: 'الكل', icon: 'apps' },
            { id: 'orders' as const, label: 'الطلبات', icon: 'receipt' },
            { id: 'promo' as const, label: 'العروض والكوبونات', icon: 'gift' },
          ].map((tab) => {
            const active = filter === tab.id;
            return (
              <Pressable
                key={tab.id}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
                onPress={() => setFilter(tab.id)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor: active ? C.action : 'transparent',
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}>
                <Ionicons
                  name={tab.icon as any}
                  size={14}
                  color={active ? C.actionText : C.muted}
                />
                <Txt
                  style={{
                    fontSize: 11,
                    fontWeight: active ? '900' : '700',
                    color: active ? C.actionText : C.muted,
                  }}>
                  {tab.label}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Empty State */}
      {filteredNotices.length === 0 && (
        <View
          style={{
            backgroundColor: C.surface,
            borderRadius: 26,
            padding: 28,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: C.border,
            marginTop: 20,
            elevation: 2,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 10,
          }}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: 'rgba(244, 201, 92, 0.22)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              borderWidth: 1.5,
              borderColor: 'rgba(244, 201, 92, 0.5)',
            }}>
            <Ionicons name="notifications-off-outline" size={36} color="#D97706" />
          </View>
          <Txt
            style={{
              fontFamily: 'Rubik_700Bold',
              fontSize: 17,
              fontWeight: '900',
              color: C.navy,
              textAlign: 'center',
              marginBottom: 6,
            }}>
            صندوق التنبيهات هادئ حالياً
          </Txt>
          <Txt
            style={{
              fontSize: 12,
              color: C.muted,
              textAlign: 'center',
              lineHeight: 20,
              maxWidth: 290,
              marginBottom: 20,
            }}>
            ستصلك هنا إشعارات فورية بكل جديد بخصوص حالة تجهيز طلباتك، مسار التوصيل، وأقوى عروض طيور الرشيدي.
          </Txt>
          {onExplore && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="تصفح العروض والمنتجات"
              onPress={onExplore}
              style={{
                backgroundColor: C.action,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 16,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 6,
              }}>
              <Ionicons name="sparkles" size={15} color={C.actionText} />
              <Txt style={{ color: C.actionText, fontWeight: '900', fontSize: 13 }}>تصفح قائمة طيور الرشيدي</Txt>
            </Pressable>
          )}
        </View>
      )}

      {/* Notification Cards List */}
      <View style={{ gap: 12 }}>
        {filteredNotices.map((n) => {
          const theme = getNoticeTheme(n);
          return (
            <Pressable
              key={n.id}
              accessibilityRole="button"
              accessibilityLabel={`فتح الإشعار: ${n.title}`}
              onPress={() => onOpen(n)}
              style={({ pressed }) => [
                {
                  backgroundColor: C.surface,
                  borderRadius: 20,
                  padding: 15,
                  borderWidth: 1,
                  borderColor: C.border,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 6,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12 }}>
                {/* Visual Icon Badge */}
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: theme.iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(0,0,0,0.06)',
                  }}>
                  <Ionicons name={theme.icon} size={22} color={theme.iconColor} />
                </View>

                {/* Content */}
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  {/* Top Meta: Tag and Time */}
                  <View
                    style={{
                      flexDirection: 'row-reverse',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      marginBottom: 6,
                    }}>
                    <View
                      style={{
                        backgroundColor: theme.tagBg,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 8,
                      }}>
                      <Txt style={{ fontSize: 9.5, fontWeight: '800', color: theme.tagColor }}>
                        {theme.tag}
                      </Txt>
                    </View>

                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="time-outline" size={11} color={C.muted} />
                      <Txt style={{ fontSize: 10, color: C.muted, fontWeight: '600' }}>
                        {formatRelativeTime(n.createdAt)}
                      </Txt>
                    </View>
                  </View>

                  {/* Title */}
                  <Txt
                    style={{
                      fontFamily: 'Rubik_700Bold',
                      fontSize: 14.5,
                      fontWeight: '900',
                      color: C.navy,
                      textAlign: 'right',
                      marginBottom: 4,
                    }}>
                    {n.title}
                  </Txt>

                  {/* Message Body */}
                  <Txt
                    style={{
                      fontSize: 12,
                      color: C.ink,
                      textAlign: 'right',
                      lineHeight: 18,
                    }}>
                    {n.message}
                  </Txt>

                  {/* Bottom Action Footer */}
                  <View
                    style={{
                      flexDirection: 'row-reverse',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      marginTop: 12,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: C.line,
                    }}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
                      <Txt style={{ fontSize: 11, fontWeight: '900', color: theme.iconColor }}>
                        {theme.actionLabel}
                      </Txt>
                      <Ionicons name="arrow-back" size={12} color={theme.iconColor} />
                    </View>

                    {onDeleteNotice && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="حذف هذا الإشعار"
                        onPress={(e) => {
                          e.stopPropagation();
                          onDeleteNotice(n.id);
                        }}
                        hitSlop={8}
                        style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={15} color={C.muted} />
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Confirmation Modal for Clear All (Works 100% on Web & Mobile) */}
      <Modal
        visible={showClearConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearConfirm(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(11, 23, 44, 0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
          <View
            style={{
              width: '100%',
              maxWidth: 380,
              backgroundColor: C.surface,
              borderRadius: 24,
              padding: 22,
              borderWidth: 1,
              borderColor: C.border,
              alignItems: 'center',
              elevation: 12,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowOffset: { width: 0, height: 6 },
              shadowRadius: 16,
            }}>
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: 'rgba(220, 38, 38, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
                borderWidth: 1,
                borderColor: 'rgba(220, 38, 38, 0.25)',
              }}>
              <Ionicons name="trash" size={28} color={C.red} />
            </View>

            <Txt
              style={{
                fontFamily: 'Rubik_700Bold',
                fontSize: 18,
                fontWeight: '900',
                color: C.navy,
                textAlign: 'center',
                marginBottom: 8,
              }}>
              مسح جميع الإشعارات؟
            </Txt>

            <Txt
              style={{
                fontSize: 13,
                color: C.muted,
                textAlign: 'center',
                lineHeight: 20,
                marginBottom: 20,
              }}>
              سيتم حذف كافة التنبيهات من صندوق الإشعارات نهائياً. لن تتمكن من استرجاعها بعد المسح.
            </Txt>

            <View style={{ width: '100%', gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="تأكيد مسح الكل"
                onPress={() => {
                  setShowClearConfirm(false);
                  onClear();
                }}
                style={{
                  backgroundColor: C.red,
                  height: 46,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  elevation: 2,
                }}>
                <Txt style={{ color: C.white, fontWeight: '900', fontSize: 14 }}>نعم، مسح جميع الإشعارات</Txt>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="إلغاء"
                onPress={() => setShowClearConfirm(false)}
                style={{
                  backgroundColor: C.background,
                  height: 44,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: C.border,
                }}>
                <Txt style={{ color: C.ink, fontWeight: '800', fontSize: 13 }}>تراجع وإلغاء</Txt>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
