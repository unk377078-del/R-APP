import React from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { branchDetails, getBranchImageSource, images } from './nativeAssets';
import { pickCompressedImage } from './imagePicker';
import { C, s } from './theme';
import { Button, ScreenTitle, Txt } from './ui';
import { FastImage } from './FastImage';

function openMap(branch: typeof branchDetails[number]) {
  const query = branch.latitude && branch.longitude
    ? `${branch.latitude},${branch.longitude}`
    : branch.address;
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`)
    .catch(() => {});
}

export function BranchesScreen({ state, setState, onBranchImagesChange, notify, adminAuthenticated }: any) {
  return <ScrollView contentContainerStyle={s.scroll}>
    <ScreenTitle title="فروع طيور الرشيدي بالإسكندرية" subtitle="تواصل مباشرة أو افتح موقع الفرع على خرائط Google" />
    <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
      <FastImage source={getBranchImageSource(branchDetails[0], state?.branchImages)} contentFit="cover" style={{ width: '100%', height: 150 }} />
      <View style={{ padding: 15 }}>
        <Txt style={{ fontWeight: '900', fontSize: 16, color: C.navy }}>المقر الرئيسي · كامب شيزار</Txt>
        <Txt style={[s.small, { marginTop: 6 }]}>{branchDetails[0].locationAddress}</Txt>
        <Button title="افتح موقعنا على خرائط Google" onPress={() => openMap(branchDetails[0])} style={{ marginTop: 12 }} />
      </View>
    </View>
    {branchDetails.map(branch => <View key={branch.name} style={[s.card, { padding: 0, overflow: 'hidden' }]}>
      <FastImage source={getBranchImageSource(branch, state?.branchImages)} contentFit="cover" style={{ width: '100%', height: 132 }} />
      <View style={{ padding: 14 }}>
        <View style={[s.row, { marginBottom: 8 }]}>
          <Txt style={{ fontWeight: '900', fontSize: 16, color: C.navy }}>{branch.name}</Txt>
          <Txt style={{ color: C.red, fontWeight: '900' }}>{branch.tag}</Txt>
        </View>
        <Txt style={s.small}>{branch.address}</Txt>
        <Txt style={[s.small, { marginTop: 6 }]}>موبايل: {branch.mobiles}</Txt>
        {branch.landline !== '—' && <Txt style={[s.small, { marginTop: 4 }]}>أرضي: {branch.landline}</Txt>}
        <Txt style={[s.small, { marginTop: 4 }]}>مواعيد العمل: يومياً من ٨ صباحاً إلى ١٠ مساءً</Txt>
        <View style={[s.row, { marginTop: 12, gap: 8 }]}>
          <Pressable onPress={() => Linking.openURL(`https://wa.me/${branch.whatsapp}`).catch(() => {})} style={[s.button, { flex: 1, backgroundColor: '#168344' }]}>
            <Txt style={s.buttonText}>واتساب</Txt>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(`tel:${branch.phone}`).catch(() => {})} style={[s.button, { flex: 1, backgroundColor: C.navy }]}>
            <Txt style={s.buttonText}>اتصال {branch.phone}</Txt>
          </Pressable>
        </View>
        <Pressable onPress={() => openMap(branch)} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 5 }}>
          <Txt style={{ color: C.blue, fontWeight: '800' }}>الاتجاهات على الخريطة ↗</Txt>
        </Pressable>
        {adminAuthenticated && (
          <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: C.line }}>
            <Pressable onPress={async () => {
              try {
                const uri = await pickCompressedImage();
                if (uri) {
                  const next = { ...(state?.branchImages || {}), [branch.name]: uri };
                  setState?.((c: any) => ({ ...c, branchImages: next }));
                  onBranchImagesChange?.(next);
                  notify?.(`تم تحديث صورة ${branch.name}`);
                }
              } catch (e: any) {
                Alert.alert('تعذر اختيار الصورة', e?.message || 'اختر صورة أخرى');
              }
            }} style={[s.button, { backgroundColor: C.action, minHeight: 40 }]}>
              <Txt style={[s.buttonText, { color: C.actionText, fontSize: 13 }]}>📷 تغيير صورة الفرع</Txt>
            </Pressable>
            {!!(state?.branchImages?.[branch.name] || state?.branchImages?.[branch.image]) && (
              <Pressable onPress={() => {
                const next = { ...(state?.branchImages || {}) };
                delete next[branch.name];
                delete next[branch.image];
                setState?.((c: any) => ({ ...c, branchImages: next }));
                onBranchImagesChange?.(next);
                notify?.(`تمت استعادة الصورة الأصلية لـ ${branch.name}`);
              }} style={{ alignItems: 'center', paddingVertical: 6, marginTop: 4 }}>
                <Txt style={{ color: C.red, fontSize: 11, fontWeight: '700' }}>استعادة الصورة الأصلية للفرع</Txt>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>)}
    <View style={[s.card, { borderColor: C.gold }]}>
      <Txt style={{ textAlign: 'center', fontWeight: '900', color: C.navy }}>الخط الساخن الموحد للفروع</Txt>
      <Pressable onPress={() => Linking.openURL('tel:01223381405').catch(() => {})} style={{ minHeight: 50, alignItems: 'center', justifyContent: 'center' }}>
        <Txt style={{ color: C.red, fontWeight: '900', fontSize: 20 }}>01223381405 · اتصال مباشر</Txt>
      </Pressable>
    </View>
  </ScrollView>;
}
