import React from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { images } from './nativeAssets';
import { cloudImages } from './cloudAssets';
import { FastImage } from './FastImage';
import { C, s } from './theme';
import { ScreenTitle, Txt } from './ui';

const pillars = [
  ['ذبح يومي طازج', 'تجهيز الطلب حسب اختيار العميل ووقت الاستلام.'],
  ['اختيارات متنوعة', 'فراخ وبط ورومي وحمام وسمان ومتبلات وأجزاء دواجن.'],
  ['خدمة محلية', 'ثلاثة فروع في الإسكندرية لخدمة العملاء والتواصل المباشر.'],
];

export function AboutScreen() {
  return <ScrollView contentContainerStyle={s.scroll}>
    <View style={[s.card, { alignItems: 'center', padding: 22 }]}>
      <FastImage source={images['brand-logo']} priority="high" style={{ width: 98, height: 98, borderRadius: 49, borderWidth: 2, borderColor: C.gold }} />
      <Txt style={{ fontSize: 23, color: C.red, fontWeight: '900', marginTop: 12 }}>طيور الرشيدي</Txt>
      <Txt style={{ color: C.gold, fontWeight: '800', marginTop: 4 }}>الجودة والأصالة في الإسكندرية منذ ١٩٦٠</Txt>
    </View>
    <ScreenTitle title="قصتنا" subtitle="طيور الرشيدي · الإسكندرية" />
    <View style={s.card}>
      <Txt style={{ fontSize: 13, lineHeight: 23 }}>
        انطلقت مسيرة محلات طيور الرشيدي في مدينة الإسكندرية بهدف تقديم دواجن طازجة بأعلى درجات الأمان الغذائي والنظافة. نعتمد على الذبح اليومي واختيار السلالات وتجهيز الطلبات لتناسب احتياجات البيوت والمطاعم السكندرية.
      </Txt>
    </View>
    {pillars.map(([title, description]) => <View key={title} style={[s.card, { borderRightWidth: 4, borderRightColor: C.red }]}>
      <Txt style={{ fontWeight: '900', color: C.navy, fontSize: 15 }}>{title}</Txt>
      <Txt style={[s.small, { lineHeight: 20, marginTop: 5 }]}>{description}</Txt>
    </View>)}
    <View style={[s.card, { alignItems: 'center', padding: 12, marginTop: 8 }]}>
      <Txt style={{ fontWeight: '800', color: C.muted, fontSize: 11 }}>تطوير وتصميم التطبيق</Txt>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Designed by Ahmed Elsayed"
        onPress={() => Linking.openURL('https://github.com/ahmeed1743')}
        style={{ marginTop: 4, paddingVertical: 4, paddingHorizontal: 8 }}>
        <Txt style={{ color: C.navy, fontWeight: '800', fontSize: 11, letterSpacing: 0.2 }}>
          Designed by Ahmed Elsayed
        </Txt>
      </Pressable>
    </View>
  </ScrollView>;
}
