import React from 'react';
import { Image, Linking, Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { C, s } from './theme';
import { ScreenTitle, Txt } from './ui';
import { images } from './nativeAssets';

export function AppFooter({ onTerms, onPrivacy }: { onTerms?: () => void; onPrivacy?: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4, paddingHorizontal: 16, marginTop: 6 }}>
      {/* Brand logo separator */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <View style={{ width: 42, height: 1, backgroundColor: C.line }} />
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={images['brand-logo']} style={{ width: 22, height: 22, borderRadius: 11 }} resizeMode="cover" />
        </View>
        <View style={{ width: 42, height: 1, backgroundColor: C.line }} />
      </View>

      {/* Policy Links */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="الشروط والأحكام" onPress={onTerms} style={{ paddingVertical: 4, paddingHorizontal: 8 }}>
          <Txt style={{ fontSize: 11.5, fontWeight: '800', color: C.blue, textDecorationLine: 'underline' }}>
            الشروط والأحكام
          </Txt>
        </Pressable>
        <Txt style={{ color: C.muted, fontSize: 11.5 }}>•</Txt>
        <Pressable accessibilityRole="button" accessibilityLabel="سياسة الخصوصية" onPress={onPrivacy} style={{ paddingVertical: 4, paddingHorizontal: 8 }}>
          <Txt style={{ fontSize: 11.5, fontWeight: '800', color: C.blue, textDecorationLine: 'underline' }}>
            سياسة الخصوصية
          </Txt>
        </Pressable>
      </View>

      {/* Copyright info */}
      <Txt style={{ fontSize: 10.5, color: C.muted, textAlign: 'center', fontWeight: '700' }}>
        جميع الحقوق محفوظة © {new Date().getFullYear()} طيور الرشيدي · الإسكندرية
      </Txt>
      <Txt style={{ fontSize: 9.5, color: C.muted, textAlign: 'center', marginTop: 3 }}>
        أصل الدواجن الطازجة والتجهيز الفوري بالإسكندرية منذ عام ١٩٦٠
      </Txt>

      {/* Developer Credit */}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Designed by Ahmed Elsayed"
        onPress={() => Linking.openURL('https://github.com/ahmeed1743')}
        style={{ marginTop: 4, paddingVertical: 2, paddingHorizontal: 8 }}>
        <Txt style={{ fontSize: 9, color: C.muted, fontWeight: '600', letterSpacing: 0.2 }}>
          Designed by Ahmed Elsayed
        </Txt>
      </Pressable>
    </View>
  );
}

export function TermsScreen() {
  const terms = [
    {
      title: '١. قبول الشروط وطبيعة الخدمة',
      text: 'باستخدامك لتطبيق «طيور الرشيدي»، فإنك توافق على الالتزام بكافة الشروط والأحكام الموضحة هنا. يُقدم التطبيق خدمة طلب وشراء وتوصيل الدواجن والطيور الطازجة والمتبلات وتجهيزها داخل محافظة الإسكندرية.',
    },
    {
      title: '٢. جودة المنتجات والتسعير والوزن',
      text: 'جميع الطيور المتاحة مذبوحة ومجهزة طازجة يومياً وفقاً لأعلى معايير السلامة والنظافة. تُحسب أسعار الدواجن وفقاً للوزن القائم أو الوزن الصافي المحدد في تفاصيل كل منتج، ويخضع الوزن الفعلي للتدقيق أثناء تجهيز الطلب بالفرع قبل التوصيل.',
    },
    {
      title: '٣. التوصيل ومواعيد العمل',
      text: 'تتم عمليات التوصيل والاستلام يومياً من الساعة ١١:٠٠ صباحاً وحتى ٤:٠٠ عصراً في مختلف أحياء ومناطق الإسكندرية. الطلبات المسجلة بعد الساعة ٤:٠٠ عصراً يتم جدولتها تلقائياً لتجهيزها وتسليمها في اليوم التالي.',
    },
    {
      title: '٤. سياسة التعديل والإلغاء',
      text: 'يحق للعميل تعديل أو إلغاء الطلب طالما كانت حالته «قيد المراجعة». بمجرد انتقال الطلب إلى حالة «جاري التجهيز» أو «خرج للتوصيل»، يتعذر الإلغاء حرصاً على سلامة وجودة تجهيز الطيور الطازجة المخصصة لطلبك.',
    },
    {
      title: '٥. طرق الدفع وبرنامج المكافآت',
      text: 'يتاح الدفع نقداً عند الاستلام أو إلكترونياً عبر InstaPay. يتم احتساب نقاط الولاء تلقائياً للحسابات المسجلة وفق الشروط المعلنة بالمتجر، ولا يجوز استبدال النقاط بمبالغ نقدية خارج نطاق خصومات التطبيق.',
    },
    {
      title: '٦. حقوق الملكية الفكرية',
      text: 'كافة العلامات التجارية، والشعارات، والنصوص، والصور الخاصة بـ «طيور الرشيدي» محمية بموجب قوانين الملكية الفكرية المعمول بها في جمهورية مصر العربية، ولا يجوز نسخها أو استخدامها دون إذن كتابي مسبق.',
    },
  ];

  return (
    <ScrollView contentContainerStyle={s.scroll}>
      <ScreenTitle title="الشروط والأحكام" subtitle="شروط استخدام خدمة وتطبيق طيور الرشيدي" />
      <View style={[s.card, { padding: 16, marginBottom: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Ionicons name="shield-checkmark-outline" size={24} color={C.green} />
          <Txt style={{ fontSize: 16, fontWeight: '900', color: C.navy }}>التزامنا تجاه عملائنا</Txt>
        </View>
        <Txt style={[s.small, { lineHeight: 22 }]}>
          نلتزم في طيور الرشيدي بتقديم تجربة تسوق آمنة وسهلة، ونضمن وصول مشترياتك بأعلى معايير النظافة والالتزام بمواعيد التوصيل المحددة.
        </Txt>
      </View>
      {terms.map((item, idx) => (
        <View key={idx} style={s.card}>
          <Txt style={{ fontSize: 15, fontWeight: '900', color: C.navy, marginBottom: 6 }}>{item.title}</Txt>
          <Txt style={{ fontSize: 13, lineHeight: 22, color: C.ink }}>{item.text}</Txt>
        </View>
      ))}
      <View style={[s.card, { alignItems: 'center', padding: 18 }]}>
        <Txt style={{ fontSize: 12, color: C.muted, textAlign: 'center' }}>
          لأي استفسار يخص الشروط والأحكام، تواصل مع خدمة العملاء عبر واتساب أو الاتصال على 01223381405.
        </Txt>
      </View>
    </ScrollView>
  );
}

export function PrivacyScreen() {
  const policies = [
    {
      title: '١. البيانات التي نجمعها',
      text: 'نجمع فقط البيانات الضرورية لتنفيذ طلبك بدقة، مثل: الاسم، رقم الهاتف، وعنوان التوصيل أو الموقع الجغرافي (GPS) لتحديد الفرع الأقرب وخدمة التوصيل السريع.',
    },
    {
      title: '٢. كيفية استخدام بياناتك',
      text: 'تُستخدم بياناتك فقط لمعالجة وتأكيد الطلبات، وإشعارك بحالة الطلب، وتحسين تجربتك داخل التطبيق، وحساب نقاط برنامج الولاء للعملاء المسجلين.',
    },
    {
      title: '٣. سرية وأمان المعلومات',
      text: 'نلتزم بحماية بياناتك الشخصية باستخدام بنية تحتية سحابية مشفرة ومؤمنة وفق أعلى معايير أمان المعلومات وحماية البيانات الرقمية. لا نقوم إطلاقاً ببيع أو تأجير أو مشاركة بياناتك مع أي أطراف خارجية لأغراض إعلانية.',
    },
    {
      title: '٤. التخزين المحلي على الهاتف',
      text: 'يحفظ التطبيق عناصر سلتك والعناوين الأخيرة في ذاكرة جهازك المحلية (AsyncStorage) لتتمكن من العودة واستكمال طلبك في أي وقت دون فقدان البيانات.',
    },
    {
      title: '٥. التحكم في بياناتك وحذف الحساب',
      text: 'يمكنك في أي وقت تعديل بياناتك الشخصية من صفحة «حسابي»، أو طلب حذف حسابك وبياناتك نهائياً بضغطة واحدة من خلال زر «حذف الحساب» المتاح في التطبيق.',
    },
  ];

  return (
    <ScrollView contentContainerStyle={s.scroll}>
      <ScreenTitle title="سياسة الخصوصية" subtitle="كيف نحمي ونحافظ على بياناتك وخصوصيتك" />
      <View style={[s.card, { padding: 16, marginBottom: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Ionicons name="lock-closed-outline" size={24} color={C.blue} />
          <Txt style={{ fontSize: 16, fontWeight: '900', color: C.navy }}>خصوصيتك أولويتنا</Txt>
        </View>
        <Txt style={[s.small, { lineHeight: 22 }]}>
          نحن في «طيور الرشيدي» ندرك أهمية خصوصية بياناتك ونتعامل مع معلوماتك الشخصية بمنتهى الأمان والسرية التامة وفق المعايير العالمية.
        </Txt>
      </View>
      {policies.map((item, idx) => (
        <View key={idx} style={s.card}>
          <Txt style={{ fontSize: 15, fontWeight: '900', color: C.navy, marginBottom: 6 }}>{item.title}</Txt>
          <Txt style={{ fontSize: 13, lineHeight: 22, color: C.ink }}>{item.text}</Txt>
        </View>
      ))}
      <View style={[s.card, { alignItems: 'center', padding: 18 }]}>
        <Txt style={{ fontSize: 12, color: C.muted, textAlign: 'center' }}>
          آخر تحديث لسياسة الخصوصية: {new Date().getFullYear()} · طيور الرشيدي · الإسكندرية
        </Txt>
      </View>
    </ScrollView>
  );
}
