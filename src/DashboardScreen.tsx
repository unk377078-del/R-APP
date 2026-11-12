import React,{useEffect,useMemo,useRef,useState} from 'react';
import { Alert,Image,Linking,Modal,Platform,Pressable,ScrollView,StyleSheet,View } from 'react-native';
import { AppNotice,AppStory,BadgeOption,Banner,CartLine,Coupon,Order,Product,categories as productCategories,isOrderPending,RashidiShowcaseConfig,ShowcaseCard,ShowcasePreset,defaultShowcaseConfig } from './models';
import { AppState,defaultStories } from './store';
import { C,fontRuqaaBold,s } from './theme';
import { branchDetails,getBranchImageSource,images,productImageKeys } from './nativeAssets';
import { pickCompressedImage, pickAndUploadToCloud } from './imagePicker';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FastImage } from './FastImage';
import { fetchCloudMediaLibrary, addMediaToCloudLibrary, deleteMediaFromCloudLibrary, CloudMediaItem } from './cloudMedia';
import { refreshFirestoreData, subscribeOrders, saveShowcaseToFirestore, saveStoriesToFirestore } from './firebaseStore';
import { changeAdminPassword } from './adminAuth';
import { Button,Chip,Field,ScreenTitle,Txt,formatItemNaturalTitle } from './ui';
import { birdPrepGroups,birdPrepText } from './preparation';
import { playNewOrderSound } from './soundAlert';
import { DashboardChartsTab, SummaryCharts } from './DashboardCharts';
import { printFullOrder } from './printOrder';
const money=(n:number)=>`${Math.round(n)} ج.م`;
function confirmAction(title:string,message:string,onConfirm:()=>void){if(Platform.OS==='web'){if(typeof window!=='undefined'&&typeof window.confirm==='function'){if(window.confirm(`${title}\n\n${message}`))onConfirm()}else{onConfirm()}}else{Alert.alert(title,message,[{text:'إلغاء',style:'cancel'},{text:'حذف',style:'destructive',onPress:onConfirm}])}}
const tabs=['الملخص','الرسوم البيانية','المنتجات','عروض التوفير 🔥','مكتبة السحابة ☁️','سفرة الرشيدي 🍗','الستوريز ⭐','الأقسام','الفروع','الرئيسية','الطلبات','العملاء','الولاء','الشارات','البث','الكوبونات','كلمة مرور الإدارة'];
const completedOrder=(order:Order)=>/تم التسليم|مكتمل/.test(order.status);
function buildCustomerInsights(orders:Order[]){
 const customers=new Map<string,{id:string;name:string;phone:string;email:string;orders:Order[];lastPurchase:number;spent:number;products:Map<string,number>}>();
 orders.filter(completedOrder).forEach(order=>{
  const phone=String(order.phone||'').replace(/\D/g,'');const email=String(order.email||'').trim().toLowerCase();
  const id=order.customerDocumentId||phone||email||order.id;let customer=customers.get(id);
  if(!customer){customer={id,name:order.customer||'عميل',phone:order.phone||'',email:order.email||'',orders:[],lastPurchase:0,spent:0,products:new Map()};customers.set(id,customer)}
  customer.orders.push(order);customer.lastPurchase=Math.max(customer.lastPurchase,order.createdAt);customer.spent+=order.total;
  order.items.forEach(line=>customer.products.set(line.name,(customer.products.get(line.name)||0)+line.quantity));
  if((!customer.name||customer.name==='عميل')&&order.customer)customer.name=order.customer;
  if(!customer.phone&&order.phone)customer.phone=order.phone;if(!customer.email&&order.email)customer.email=order.email;
 });
 return [...customers.values()].map(customer=>({...customer,topProducts:[...customer.products.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3)})).sort((a,b)=>b.lastPurchase-a.lastPurchase);
}
function Toggle({label,value,onChange}:any){return <Pressable onPress={()=>onChange(!value)} style={[s.row,{paddingVertical:8,minHeight:44}]}><Txt style={{color:value?C.green:C.muted,fontWeight:'900'}}>{value?'● مفعّل':'○ متوقف'}</Txt><Txt style={{fontWeight:'700'}}>{label}</Txt></Pressable>}

function DistributeMediaModal({
  item,
  visible,
  onClose,
  state,
  setState,
  notify,
  onProductChange,
  onBannersChange,
  onStoriesChange,
  onCategoryImagesChange,
  onBranchImagesChange,
}: {
  item: CloudMediaItem | null;
  visible: boolean;
  onClose: () => void;
  state: AppState;
  setState: any;
  notify: (msg: string) => void;
  onProductChange?: (product: Product) => void;
  onBannersChange?: (banners: Banner[]) => void;
  onStoriesChange?: (stories: AppStory[]) => void;
  onCategoryImagesChange?: (images: Record<string, string>) => void;
  onBranchImagesChange?: (images: Record<string, string>) => void;
}) {
  const [distributeTab, setDistributeTab] = useState<'banner' | 'story' | 'category' | 'branch' | 'product'>('banner');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [storySubtitle, setStorySubtitle] = useState('');
  const [storyBadge, setStoryBadge] = useState('طازة');
  const [storyCategory, setStoryCategory] = useState('فراخ');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    if (item) {
      setBannerTitle(item.name || 'عرض حصري');
      setBannerSubtitle('طازج يومياً بأعلى جودة');
      setStoryTitle(item.name || 'طازة اليوم');
      setStorySubtitle('مقدمة خصيصاً من طيور الرشيدي');
      setProductSearch('');
    }
  }, [item]);

  if (!item) return null;

  const storiesList: AppStory[] = state.stories && state.stories.length > 0 ? state.stories : defaultStories;

  const handleSetExistingStory = (storyId: string) => {
    const nextStories = storiesList.map((s: AppStory) =>
      s.id === storyId ? { ...s, imageUri: item.url } : s
    );
    setState((curr: AppState) => ({ ...curr, stories: nextStories }));
    onStoriesChange?.(nextStories);
    notify(`⭐ تم ربط الصورة بالستوري بنجاح`);
    onClose();
  };

  const handleCreateNewStory = () => {
    const newStory: AppStory = {
      id: `story-${Date.now()}`,
      title: storyTitle.trim() || item.name || 'طازة اليوم',
      subtitle: storySubtitle.trim(),
      description: storySubtitle.trim() || 'عرض حصري طازج من طيور الرشيدي',
      icon: 'sparkles',
      gradientColors: ['#DC2626', '#F59E0B'],
      badge: storyBadge.trim(),
      actionType: 'category',
      actionValue: storyCategory,
      imageUri: item.url,
      active: true,
      createdAt: Date.now(),
    };
    const nextStories = [...storiesList, newStory];
    setState((curr: AppState) => ({ ...curr, stories: nextStories }));
    onStoriesChange?.(nextStories);
    notify(`⭐ تم إنشاء الستوري «${newStory.title}» بالصورة بنجاح`);
    onClose();
  };

  const handleSetBanner = () => {
    const newBanner: Banner = {
      id: `b${Date.now()}`,
      title: bannerTitle.trim() || item.name,
      subtitle: bannerSubtitle.trim(),
      emoji: '🎉',
      color: '#1B2633',
      imageUri: item.url,
      active: true,
    };
    const nextBanners = [...state.banners, newBanner];
    setState((curr: AppState) => ({ ...curr, banners: nextBanners }));
    onBannersChange?.(nextBanners);
    notify(`🌟 تمت إضافة «${newBanner.title}» إلى بانرات الواجهة بنجاح`);
    onClose();
  };

  const handleSetCategory = (catName: string) => {
    const nextCategories = { ...(state.categoryImages || {}), [catName]: item.url };
    setState((curr: AppState) => ({ ...curr, categoryImages: nextCategories }));
    onCategoryImagesChange?.(nextCategories);
    notify(`📁 تم تعيين الصورة لقسم «${catName}» في الرئيسية`);
    onClose();
  };

  const handleSetBranch = (branchName: string) => {
    const nextBranches = { ...(state.branchImages || {}), [branchName]: item.url };
    setState((curr: AppState) => ({ ...curr, branchImages: nextBranches }));
    onBranchImagesChange?.(nextBranches);
    notify(`🏬 تم تعيين الصورة لـ «${branchName}»`);
    onClose();
  };

  const handleSetProduct = (product: Product) => {
    const updated = { ...product, imageUri: item.url };
    setState((curr: AppState) => ({
      ...curr,
      products: curr.products.map((p: Product) => (p.id === product.id ? updated : p)),
    }));
    onProductChange?.(updated);
    notify(`🍗 تم تعيين الصورة لمنتج «${product.name}»`);
    onClose();
  };

  const filteredProducts = state.products.filter(
    (p: Product) =>
      !productSearch.trim() ||
      p.name.toLowerCase().includes(productSearch.trim().toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.trim().toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={{
            backgroundColor: C.solidSurface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '90%',
            padding: 18,
            borderWidth: 1,
            borderColor: C.border,
          }}>
          <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }]}>
            <Pressable
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: C.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Txt style={{ fontSize: 16, fontWeight: '900', color: C.navy }}>✕</Txt>
            </Pressable>
            <View style={{ alignItems: 'flex-end', flex: 1, marginStart: 12 }}>
              <Txt style={{ fontWeight: '900', fontSize: 17, color: C.navy }}>🚀 توزيع واستخدام الصورة في التطبيق</Txt>
              <Txt numberOfLines={1} style={[s.small, { color: C.action }]}>
                {item.name}
              </Txt>
            </View>
          </View>

          <View
            style={{
              height: 110,
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: C.navy,
              borderWidth: 1,
              borderColor: C.border,
              marginBottom: 12,
            }}>
            <FastImage source={{ uri: item.url }} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
            {[
              { id: 'banner', label: '🌟 بانر رئيسي' },
              { id: 'story', label: '⭐ ستوري بالرئيسية' },
              { id: 'category', label: '📁 قسم بالرئيسية' },
              { id: 'branch', label: '🏬 فرع' },
              { id: 'product', label: '🍗 منتج من القائمة' },
            ].map((t) => (
              <Chip
                key={t.id}
                label={t.label}
                selected={distributeTab === t.id}
                onPress={() => setDistributeTab(t.id as any)}
              />
            ))}
          </ScrollView>

          <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
            {distributeTab === 'banner' && (
              <View style={{ gap: 8 }}>
                <Txt style={{ fontWeight: '900', color: C.navy, fontSize: 15 }}>🌟 إضافة الصورة كبانر في السلايدر الرئيسي</Txt>
                <Field label="عنوان البانر" value={bannerTitle} onChangeText={setBannerTitle} placeholder="مثال: عروض نهاية الأسبوع" />
                <Field label="الوصف الترويجي" value={bannerSubtitle} onChangeText={setBannerSubtitle} placeholder="خصم ١٠٪ على جميع منتجات التتبيلة" />
                <Button title="➕ تثبيت في السلايدر الرئيسي الآن" onPress={handleSetBanner} style={{ marginTop: 4 }} />
              </View>
            )}

            {distributeTab === 'story' && (
              <View style={{ gap: 8 }}>
                <Txt style={{ fontWeight: '900', color: C.navy, fontSize: 15 }}>⭐ تعيين أو إنشاء ستوري بالرئيسية بهذه الصورة</Txt>
                {storiesList.length > 0 && (
                  <View style={{ marginBottom: 6 }}>
                    <Txt style={[s.small, { marginBottom: 6, fontWeight: '800' }]}>ربط الصورة بستوري موجودة حالياً:</Txt>
                    <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 }}>
                      {storiesList.map((st) => (
                        <Pressable
                          key={st.id}
                          onPress={() => handleSetExistingStory(st.id)}
                          style={{
                            backgroundColor: C.surfaceAlt,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: C.border,
                            flexDirection: 'row-reverse',
                            alignItems: 'center',
                            gap: 6,
                          }}>
                          <Txt style={{ fontWeight: '800', color: C.navy, fontSize: 12 }}>{st.title}</Txt>
                          <Txt style={{ color: C.action, fontSize: 11 }}>ربط ➔</Txt>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
                <View style={{ borderTopWidth: 1, borderColor: C.line, paddingTop: 8, gap: 6 }}>
                  <Txt style={[s.small, { fontWeight: '900', color: C.navy }]}>أو إنشاء ستوري جديدة كلياً بهذه الصورة:</Txt>
                  <Field label="عنوان الستوري" value={storyTitle} onChangeText={setStoryTitle} placeholder="مثال: دجاج متبل طازج" />
                  <Field label="الوصف السريع" value={storySubtitle} onChangeText={setStorySubtitle} placeholder="خصم خاص وتوصيل فوري" />
                  <Field label="الشارة الصغيرة (Badge)" value={storyBadge} onChangeText={setStoryBadge} placeholder="طازة، جديد، توفير" />
                  <Button title="✨ إنشاء الستوري وإضافتها للرئيسية فوراً" onPress={handleCreateNewStory} style={{ marginTop: 4, backgroundColor: C.action }} />
                </View>
              </View>
            )}

            {distributeTab === 'category' && (
              <View style={{ gap: 8 }}>
                <Txt style={{ fontWeight: '900', color: C.navy, fontSize: 15 }}>📁 اختر القسم لتثبيت هذه الصورة عليه في الرئيسية:</Txt>
                <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {productCategories
                    .filter((c: string) => c !== 'الكل')
                    .map((cat: string) => (
                      <Pressable
                        key={cat}
                        onPress={() => handleSetCategory(cat)}
                        style={{
                          backgroundColor: C.surfaceAlt,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: C.border,
                          flexDirection: 'row-reverse',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                        <Txt style={{ fontWeight: '800', color: C.navy }}>{cat}</Txt>
                        <Txt style={{ color: C.action, fontSize: 12 }}>➔</Txt>
                      </Pressable>
                    ))}
                </View>
              </View>
            )}

            {distributeTab === 'branch' && (
              <View style={{ gap: 8 }}>
                <Txt style={{ fontWeight: '900', color: C.navy, fontSize: 15 }}>🏬 اختر الفرع لتعيين هذه الصورة له:</Txt>
                <View style={{ gap: 8, marginTop: 4 }}>
                  {branchDetails.map((b) => (
                    <Pressable
                      key={b.name}
                      onPress={() => handleSetBranch(b.name)}
                      style={[
                        s.row,
                        {
                          backgroundColor: C.surfaceAlt,
                          padding: 12,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: C.border,
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        },
                      ]}>
                      <View style={{ backgroundColor: C.action, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Txt style={{ color: C.actionText, fontWeight: '900', fontSize: 11 }}>تعيين للفرع ➔</Txt>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Txt style={{ fontWeight: '900', color: C.navy }}>{b.name}</Txt>
                        <Txt style={[s.small, { fontSize: 10 }]}>{b.address}</Txt>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {distributeTab === 'product' && (
              <View style={{ gap: 8 }}>
                <Txt style={{ fontWeight: '900', color: C.navy, fontSize: 15 }}>🍗 اختر المنتج الذي تريد تعيين هذه الصورة له:</Txt>
                <Field label="بحث في المنتجات" value={productSearch} onChangeText={setProductSearch} placeholder="ابحث باسم المنتج…" />
                <View style={{ gap: 6, marginTop: 4 }}>
                  {filteredProducts.slice(0, 20).map((prod: Product) => (
                    <Pressable
                      key={prod.id}
                      onPress={() => handleSetProduct(prod)}
                      style={[
                        s.row,
                        {
                          backgroundColor: C.surfaceAlt,
                          padding: 8,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: C.border,
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        },
                      ]}>
                      <View style={{ backgroundColor: C.action, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Txt style={{ color: C.actionText, fontWeight: '900', fontSize: 11 }}>اختيار ➔</Txt>
                      </View>
                      <View style={{ flex: 1, alignItems: 'flex-end', marginHorizontal: 8 }}>
                        <Txt numberOfLines={1} style={{ fontWeight: '800', color: C.navy, fontSize: 12 }}>
                          {prod.name}
                        </Txt>
                        <Txt style={[s.small, { fontSize: 10 }]}>
                          {money(prod.price)} · {prod.category}
                        </Txt>
                      </View>
                      <View style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', backgroundColor: C.surface }}>
                        <Image
                          source={prod.imageUri ? { uri: prod.imageUri } : images[prod.image || 'chicken'] || images.chicken}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function CloudMediaPickerModal({
  visible,
  onClose,
  onSelect,
  title = 'اختيار صورة من السحابة',
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
}) {
  const [items, setItems] = useState<CloudMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('الكل');

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchCloudMediaLibrary()
        .then(setItems)
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const handleUploadNew = async () => {
    setUploading(true);
    try {
      const url = await pickAndUploadToCloud();
      if (url) {
        onSelect(url);
        onClose();
      }
    } catch (e: any) {
      Alert.alert('تعذر الرفع', e?.message);
    } finally {
      setUploading(false);
    }
  };

  const filtered = items.filter((item) => {
    const matchType =
      filterType === 'الكل' ||
      (filterType === 'منتجات' && item.type === 'product') ||
      (filterType === 'بانرات' && item.type === 'banner') ||
      (filterType === 'فروع' && item.type === 'branch') || (filterType === 'ستوريز' && item.type === 'story');
    const matchSearch = !search.trim() || item.name.toLowerCase().includes(search.trim().toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={{
            backgroundColor: C.solidSurface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '88%',
            padding: 18,
            borderWidth: 1,
            borderColor: C.border,
          }}>
          <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }]}>
            <Pressable
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: C.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Txt style={{ fontSize: 16, fontWeight: '900', color: C.navy }}>✕</Txt>
            </Pressable>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt style={{ fontWeight: '900', fontSize: 17, color: C.navy }}>{title}</Txt>
              <Txt style={s.small}>اضغط على أي صورة لاختيارها مباشرة</Txt>
            </View>
          </View>

          <Button
            title={uploading ? 'جارٍ رفع الصورة للسحابة…' : '📷 اختيار صورة من الجهاز ورفعها للسحابة فوراً'}
            disabled={uploading}
            onPress={handleUploadNew}
            style={{ backgroundColor: C.action, marginBottom: 8 }}
          />

          <Field label="بحث في صور السحابة" value={search} onChangeText={setSearch} placeholder="ابحث باسم الصورة…" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
            {['الكل', 'منتجات', 'بانرات', 'فروع', 'ستوريز'].map((t) => (
              <Chip key={t} label={t} selected={filterType === t} onPress={() => setFilterType(t)} />
            ))}
          </ScrollView>

          <ScrollView
            style={{ maxHeight: 360, marginTop: 8 }}
            contentContainerStyle={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, paddingBottom: 20 }}>
            {filtered.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  onSelect(item.url);
                  onClose();
                }}
                style={{
                  width: '31%',
                  borderRadius: 14,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: C.border,
                  backgroundColor: C.surfaceAlt,
                  padding: 4,
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    width: '100%',
                    height: 75,
                    borderRadius: 10,
                    overflow: 'hidden',
                    backgroundColor: C.surface,
                    marginBottom: 4,
                  }}>
                  <FastImage source={{ uri: item.url }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                </View>
                <Txt numberOfLines={1} style={{ fontSize: 10, fontWeight: '800', textAlign: 'center', color: C.navy }}>
                  {item.name}
                </Txt>
                <Txt style={{ fontSize: 8, color: C.action, fontWeight: '700', marginTop: 1 }}>اختيار ➔</Txt>
              </Pressable>
            ))}
            {!filtered.length && (
              <View style={{ width: '100%', padding: 20, alignItems: 'center' }}>
                <Txt style={{ color: C.muted, textAlign: 'center' }}>
                  {loading ? 'جارٍ تحميل الصور…' : 'لا توجد صور مطابقة في المكتبة'}
                </Txt>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function MediaLibraryTab({
  notify,
  state,
  setState,
  onProductChange,
  onBannersChange,
  onStoriesChange,
  onCategoryImagesChange,
  onBranchImagesChange,
}: {
  notify: (msg: string) => void;
  state?: AppState;
  setState?: any;
  onProductChange?: (product: Product) => void;
  onBannersChange?: (banners: Banner[]) => void;
  onStoriesChange?: (stories: AppStory[]) => void;
  onCategoryImagesChange?: (images: Record<string, string>) => void;
  onBranchImagesChange?: (images: Record<string, string>) => void;
}) {
  const [items, setItems] = useState<CloudMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newImageName, setNewImageName] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [filterType, setFilterType] = useState('الكل');
  const [search, setSearch] = useState('');
  const [selectedItemForDistribute, setSelectedItemForDistribute] = useState<CloudMediaItem | null>(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const data = await fetchCloudMediaLibrary();
      setItems(data);
    } catch {
      notify('تعذر تحميل مكتبة الصور السحابية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleUploadFromPhone = async () => {
    setUploading(true);
    try {
      const url = await pickAndUploadToCloud(newImageName.trim() || undefined, 'product');
      if (url) {
        notify('⚡ تم رفع الصورة بنجاح إلى السحابة');
        const optimisticItem: CloudMediaItem = {
          id: `media_${Date.now()}`,
          name: newImageName.trim() || 'صورة سحابية جديدة',
          url,
          key: '',
          type: 'product',
          uploadedAt: Date.now(),
        };
        setItems((prev) => [optimisticItem, ...prev.filter((x) => x.id !== optimisticItem.id)]);
        setNewImageName('');
        await loadMedia();
      }
    } catch (err: any) {
      Alert.alert('تعذر رفع الصورة', err?.message || 'حاول مرة أخرى');
    } finally {
      setUploading(false);
    }
  };

  const handleAddByUrl = async () => {
    if (!newImageUrl.trim().startsWith('http')) {
      return Alert.alert('رابط غير صحيح', 'أدخل رابط صورة سحابي يبدأ بـ https://');
    }
    try {
      await addMediaToCloudLibrary({
        name: newImageName.trim() || 'صورة سحابية جديدة',
        url: newImageUrl.trim(),
        type: 'general',
      });
      notify('تمت إضافة الصورة إلى المكتبة السحابية');
      const addedItem: CloudMediaItem = {
        id: `media_${Date.now()}`,
        name: newImageName.trim() || 'صورة سحابية جديدة',
        url: newImageUrl.trim(),
        key: '',
        type: 'general',
        uploadedAt: Date.now(),
      };
      setItems((prev) => [addedItem, ...prev.filter((x) => x.id !== addedItem.id)]);
      setNewImageName('');
      setNewImageUrl('');
      await loadMedia();
    } catch (err: any) {
      Alert.alert('تعذر الإضافة', err?.message);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('حذف من المكتبة', `هل تريد إزالة صورة «${name}» من المكتبة السحابية؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMediaFromCloudLibrary(id);
            setItems((curr) => curr.filter((x) => x.id !== id));
            notify('تم حذف الصورة من المكتبة');
          } catch {
            notify('تعذر الحذف');
          }
        },
      },
    ]);
  };

  const filtered = items.filter((item) => {
    const matchType =
      filterType === 'الكل' ||
      (filterType === 'منتجات' && item.type === 'product') ||
      (filterType === 'بانرات' && item.type === 'banner') ||
      (filterType === 'فروع' && item.type === 'branch') || (filterType === 'ستوريز' && item.type === 'story');
    const matchSearch = !search.trim() || item.name.toLowerCase().includes(search.trim().toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <>
      <ScreenTitle
        title="مكتبة الصور السحابية (Cloud Media Library)"
        subtitle="ارفع الصور هنا بضغطة واحدة، ووزعها على المنتجات والبانرات والأقسام والفروع فوراً عبر Cloudflare CDN"
      />

      <View style={s.card}>
        <Txt style={{ fontWeight: '900', fontSize: 16, color: C.navy, marginBottom: 4 }}>
          🚀 رفع صورة جديدة إلى السحابة فوراً
        </Txt>
        <Txt style={[s.small, { marginBottom: 10 }]}>
          اختر صورة من تليفونك، سيقوم التطبيق بضغطها ورفعها فوراً إلى شبكة التوزيع السحابية وحفظها في المكتبة لتوزيعها في أي مكان في الموقع.
        </Txt>
        <Field
          label="اسم الصورة أو المنتج (مثال: بانيه دجاج طازج)"
          value={newImageName}
          onChangeText={setNewImageName}
          placeholder="اكتب اسماً للصورة"
        />
        <Button
          title={uploading ? 'جارٍ الضغط والرفع للسحابة ⚡…' : '📷 اختيار صورة من الجهاز ورفعها للسحابة فوراً'}
          disabled={uploading}
          onPress={handleUploadFromPhone}
          style={{ backgroundColor: C.action, marginTop: 6 }}
        />

        <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: C.line }}>
          <Txt style={{ fontWeight: '800', fontSize: 13, color: C.muted, marginBottom: 4 }}>
            أو إضافة صورة برابط مباشر (URL)
          </Txt>
          <Field
            label="رابط الصورة السحابي (URL)"
            value={newImageUrl}
            onChangeText={setNewImageUrl}
            placeholder="https://.../chicken.webp"
          />
          {!!newImageUrl && (
            <Button title="إضافة الرابط للمكتبة" secondary onPress={handleAddByUrl} style={{ marginTop: 4 }} />
          )}
        </View>
      </View>

      <View style={s.card}>
        <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }]}>
          <Button title="تحديث 🔄" secondary onPress={loadMedia} />
          <View style={{ alignItems: 'flex-end' }}>
            <Txt style={{ fontWeight: '900', fontSize: 16, color: C.navy }}>معرض الصور السحابية</Txt>
            <Txt style={s.small}>{items.length} صورة سحابية متاحة عبر CDN</Txt>
          </View>
        </View>

        <Field label="بحث في صور المكتبة" value={search} onChangeText={setSearch} placeholder="ابحث باسم الصورة…" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 6 }}>
          {['الكل', 'منتجات', 'بانرات', 'فروع', 'ستوريز'].map((t) => (
            <Chip key={t} label={t} selected={filterType === t} onPress={() => setFilterType(t)} />
          ))}
        </ScrollView>
      </View>

      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, paddingHorizontal: 4 }}>
        {filtered.map((item) => (
          <View
            key={item.id}
            style={[
              s.card,
              {
                width: '48%',
                padding: 8,
                alignItems: 'center',
                marginBottom: 8,
                borderRadius: 16,
              },
            ]}>
            <View
              style={{
                width: '100%',
                height: 110,
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: C.surfaceAlt,
                borderWidth: 1,
                borderColor: C.border,
                marginBottom: 6,
              }}>
              <FastImage source={{ uri: item.url }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
            </View>
            <Txt numberOfLines={1} style={{ fontWeight: '800', fontSize: 13, color: C.navy, textAlign: 'center', width: '100%' }}>
              {item.name}
            </Txt>
            <Txt numberOfLines={1} style={[s.small, { fontSize: 9, color: C.muted, marginVertical: 2 }]}>
              {item.key || 'سحابي'}
            </Txt>

            {/* Main Distribution Button */}
            {state && (
              <Pressable
                onPress={() => setSelectedItemForDistribute(item)}
                style={{
                  backgroundColor: C.action,
                  width: '100%',
                  paddingVertical: 7,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 4,
                  marginBottom: 6,
                }}>
                <Txt style={{ color: C.actionText, fontWeight: '900', fontSize: 11 }}>🚀 توزيع واستخدام الصورة</Txt>
              </Pressable>
            )}

            <View style={[s.row, { width: '100%', justifyContent: 'space-between' }]}>
              <Pressable
                onPress={() => handleDelete(item.id, item.name)}
                style={{ padding: 4, minHeight: 32, justifyContent: 'center' }}>
                <Txt style={{ color: C.red, fontSize: 11, fontWeight: '700' }}>حذف</Txt>
              </Pressable>
              <Pressable
                onPress={async () => {
                  await Clipboard.setStringAsync(item.url);
                  notify('تم نسخ رابط الصورة');
                }}
                style={{ backgroundColor: C.surfaceAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                <Txt style={{ color: C.navy, fontSize: 11, fontWeight: '800' }}>📋 نسخ</Txt>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      {/* Distribution Modal */}
      {state && (
        <DistributeMediaModal
          item={selectedItemForDistribute}
          visible={!!selectedItemForDistribute}
          onClose={() => setSelectedItemForDistribute(null)}
          state={state}
          setState={setState}
          notify={notify}
          onProductChange={onProductChange}
          onBannersChange={onBannersChange}
          onStoriesChange={onStoriesChange}
          onCategoryImagesChange={onCategoryImagesChange}
          onBranchImagesChange={onBranchImagesChange}
        />
      )}
    </>
  );
}

export function DashboardScreen({state,setState,notify,onClose,firebaseStatus='offline',initialTab='الملخص',onProductChange,onProductDelete,onBannersChange,onShowcaseChange,onStoriesChange,onCategoryImagesChange,onBranchImagesChange,onBadgesChange,onLoyaltyChange,onOrderStatus,onCouponChange,onCouponDelete,onBroadcast,onStoreStatusChange}:any){const [cloudOrders,setCloudOrders]=useState<Order[]>([]);const contentScroll=useRef<any>(null);useEffect(()=>{return subscribeOrders('',true,(orders)=>{setCloudOrders(orders);setState((curr:AppState)=>{const map=new Map<string,Order>();(curr.orders||[]).forEach(o=>map.set(String(o.id),o));orders.forEach(o=>{const existing=map.get(String(o.id));if(!existing||(o.updatedAt||o.createdAt||0)>=(existing.updatedAt||existing.createdAt||0)){map.set(String(o.id),o)}});return{...curr,orders:Array.from(map.values()).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))}})},()=>notify('تعذر تحميل الطلبات من السحابة'))},[]);const previousOrderIdsRef=useRef<Set<string>|null>(null);useEffect(()=>{if(!cloudOrders.length)return;if(previousOrderIdsRef.current===null){previousOrderIdsRef.current=new Set(cloudOrders.map(o=>o.id));return}const previous=previousOrderIdsRef.current;const newOrders=cloudOrders.filter(o=>!previous.has(o.id));if(newOrders.length>0){playNewOrderSound();notify(`🔔 وصل طلب جديد: #${newOrders[0].id} بقيمة ${money(newOrders[0].total)}`)}previousOrderIdsRef.current=new Set(cloudOrders.map(o=>o.id))},[cloudOrders]);const [storeIsOpen,setStoreIsOpen]=useState(state.storeStatus?.isOpen??true);const [storeMessage,setStoreMessage]=useState(state.storeStatus?.message||'');const [storeNextOpen,setStoreNextOpen]=useState(state.storeStatus?.nextOpenTime||'');const [savingStatus,setSavingStatus]=useState(false);useEffect(()=>{if(state.storeStatus){setStoreIsOpen(state.storeStatus.isOpen);setStoreMessage(state.storeStatus.message||'');setStoreNextOpen(state.storeStatus.nextOpenTime||'')}},[state.storeStatus]);const saveStatus=async()=>{setSavingStatus(true);const newStatus={isOpen:storeIsOpen,message:storeMessage.trim()||(storeIsOpen?'المتجر مفتوح ويستقبل طلباتكم الآن':'نعتذر، المتجر مغلق مؤقتاً لضغط العمل.'),nextOpenTime:storeNextOpen.trim()};setState((current:AppState)=>({...current,storeStatus:newStatus}));try{await onStoreStatusChange?.(newStatus);notify(storeIsOpen?'تم فتح المتجر واستقبال الطلبات':'تم تفعيل إغلاق المتجر مؤقتاً')}catch(e:any){Alert.alert('تعذر الحفظ',e?.message||'تحقق من الاتصال')}finally{setSavingStatus(false)}};const [tab,setTab]=useState(initialTab||'الملخص');
  const [cloudPickerConfig, setCloudPickerConfig] = useState<{ visible: boolean; title: string; onSelect: (url: string) => void }>({ visible: false, title: '', onSelect: () => {} });
  const openCloudPicker = (title: string, onSelect: (url: string) => void) => { setCloudPickerConfig({ visible: true, title, onSelect }); };
 useEffect(()=>{if(initialTab)setTab(initialTab)},[initialTab]);const openTab=(next:string)=>{setTab(next);requestAnimationFrame(()=>contentScroll.current?.scrollTo({y:0,animated:true}))};const [name,setName]=useState('');const [price,setPrice]=useState('');const [category,setCategory]=useState('فراخ');const [newProductImageUri,setNewProductImageUri]=useState('');const [productSearch,setProductSearch]=useState('');const [productFilter,setProductFilter]=useState('الكل');const [bannerTitle,setBannerTitle]=useState('');const [bannerSubtitle,setBannerSubtitle]=useState('');const [bannerImage,setBannerImage]=useState('hero-chicken');const [bannerImageUri,setBannerImageUri]=useState('');const [code,setCode]=useState('');const [value,setValue]=useState('10');const [minimum,setMinimum]=useState('200');const [maxDiscount,setMaxDiscount]=useState('');const [maxUses,setMaxUses]=useState('');const [orderFilter,setOrderFilter]=useState('الكل');const [orderSearch,setOrderSearch]=useState('');const [orderTimeFilter,setOrderTimeFilter]=useState<'all'|'today'|'7d'>('all');const [customerFilter,setCustomerFilter]=useState('الكل');const [customerSearch,setCustomerSearch]=useState('');const [type,setType]=useState<'percent'|'fixed'>('percent');const [duration,setDuration]=useState('3');const [popup,setPopup]=useState(false);const [broadcast,setBroadcast]=useState('');const [broadcastCoupon,setBroadcastCoupon]=useState('');const [sendingBroadcast,setSendingBroadcast]=useState(false);const [syncing,setSyncing]=useState(false);const [badgeName,setBadgeName]=useState('');const [badgeColor,setBadgeColor]=useState('#237A57');const [currentAdminPassword,setCurrentAdminPassword]=useState('');const [newAdminPassword,setNewAdminPassword]=useState('');const [confirmAdminPassword,setConfirmAdminPassword]=useState('');const [savingAdminPassword,setSavingAdminPassword]=useState(false);const addProduct=()=>{if(!name.trim()||!Number(price))return Alert.alert('بيانات ناقصة','اكتب اسم المنتج وسعراً صحيحاً.');const p:Product={id:`p${Date.now()}`,name:name.trim(),category,price:Number(price),unit:'للكيلو',emoji:'',prepGroups:category==='فراخ'||category==='بط'?birdPrepGroups:[{type:'WHOLE',label:'سليم',subOptions:[]},{type:'CUT',label:'تقطيع',subOptions:['4 قطع','8 قطع','بالطول','بالعرض']}],image:category==='بط'?'duck':category==='حمام وسمان'?'pigeon':category==='متبلات'?'shish':'chicken',imageUri:newProductImageUri.trim()||undefined,available:true,stock:20};setState((x:AppState)=>({...x,products:[p,...x.products]}));onProductChange?.(p);setName('');setPrice('');setNewProductImageUri('');notify('تمت إضافة المنتج')};const addCoupon=()=>{const days=Number(duration);const usageLimit=maxUses.trim()?Number(maxUses):undefined;if(!code.trim()||!Number.isFinite(Number(minimum))||Number(minimum)<0||!Number.isFinite(Number(value))||Number(value)<=0||!Number.isFinite(days)||days<=0||(type==='percent'&&Number(value)>100)||(type==='percent'&&maxDiscount.trim()&&(!Number.isFinite(Number(maxDiscount))||Number(maxDiscount)<=0))||(maxUses.trim()&&(!Number.isInteger(Number(maxUses))||Number(maxUses)<=0)))return Alert.alert('بيانات غير صحيحة','أدخل كوداً وخصماً صحيحاً، ومدة بالأيام، وحد استخدام صحيحاً أو اتركه فارغاً بلا حد.');if(state.coupons.some((c:Coupon)=>c.code===code.trim().toUpperCase()))return Alert.alert('الكود موجود','اختر كوداً مختلفاً.');const c:Coupon={code:code.trim().toUpperCase(),type,value:Number(value),minimum:Number(minimum)||0,maxDiscount:type==='percent'?Number(maxDiscount)||undefined:undefined,maxUses:usageLimit,expiresAt:Date.now()+days*86400000,active:true,uses:0,popup};setState((x:AppState)=>({...x,coupons:[c,...x.coupons],notices:popup?[{id:`n${Date.now()}`,title:'كوبون جديد',message:`استخدم ${c.code} واحصل على خصم`,kind:'promo',createdAt:Date.now(),target:'rewards'},...x.notices]:x.notices}));onCouponChange?.(c);notify('تم إنشاء الكوبون');setCode('');setMaxDiscount('');setMaxUses('')};const addNotice=(title:string,message:string,target='home')=>{const n:AppNotice={id:`n${Date.now()}`,title,message,kind:'promo',createdAt:Date.now(),target};setState((x:AppState)=>({...x,notices:[n,...x.notices]}));notify('تم بث الإشعار داخل هذا الجهاز')};const setStatus = async (id: string, status: string, targetPhone = '', targetEmail = '', docId = '') => {
  const strId = String(id);
  const now = Date.now();
  setCloudOrders((prev) =>
    prev.map((o) => (String(o.docId || o.id) === strId || String(o.id) === strId ? { ...o, status, updatedAt: now } : o))
  );
  const n: AppNotice = {
    id: `n${now}`,
    title: `تحديث طلب #${strId}`,
    message: `حالة طلبك الآن: ${status}`,
    kind: 'order',
    createdAt: now,
    target: 'orders',
  };
  setState((x: AppState) => {
    const map = new Map<string, Order>();
    (x.orders || []).forEach((o: Order) => map.set(String(o.id), o));
    const target = map.get(strId) || (x.orders || []).find((o: Order) => String(o.docId) === strId) || cloudOrders.find((o: Order) => String(o.docId || o.id) === strId || String(o.id) === strId);
    if (target) {
      map.set(String(target.id), { ...target, status, updatedAt: now });
    }
    return {
      ...x,
      orders: Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
      notices: [n, ...(x.notices || [])],
    };
  });
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  if (status === 'جاري التجهيز') {
    notify(`🍗 تم تأكيد استلام الطلب #${strId} وبدء التجهيز`);
  } else if (status === 'خرج للتوصيل') {
    notify(`🛵 تم تسليم الطلب #${strId} للمندوب (خرج للتوصيل)`);
  } else if (status === 'تم التسليم') {
    notify(`✅ تم تأكيد اكتمال وتسليم الطلب #${strId}`);
  } else {
    notify(`✅ تم تحديث الطلب #${strId} إلى «${status}»`);
  }
  try {
    if (onOrderStatus) {
      await onOrderStatus(docId || strId, status, targetPhone, targetEmail);
    }
  } catch (err: any) {
    console.warn('Sync order status error:', err);
  }
};
const expires = (c: Coupon) => Math.max(0, Math.ceil((c.expiresAt - Date.now()) / 86400000));
const sortedOrders = useMemo(() => {
  const map = new Map<string, Order>();
  (state.orders || []).forEach((o: Order) => {
    if (o && o.id) map.set(String(o.id), o);
  });
  cloudOrders.forEach((o: Order) => {
    if (!o || !o.id) return;
    const key = String(o.id);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, o);
    } else {
      const localTime = existing.updatedAt || existing.createdAt || 0;
      const cloudTime = o.updatedAt || o.createdAt || 0;
      if (cloudTime >= localTime) {
        map.set(key, o);
      }
    }
  });
  return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}, [cloudOrders, state.orders]);
const orders = sortedOrders;
const pendingOrdersCount = useMemo(() => orders.filter((o: Order) => isOrderPending(o?.status)).length, [orders]);
const orderCounts = useMemo(() => ({
  all: orders.length,
  pending: pendingOrdersCount,
  prep: orders.filter((o: Order) => o?.status === 'جاري التجهيز').length,
  delivering: orders.filter((o: Order) => o?.status === 'خرج للتوصيل').length,
  delivered: orders.filter((o: Order) => /تم التسليم|مكتمل/.test(o?.status)).length,
  cancelled: orders.filter((o: Order) => o?.status === 'ملغي').length,
}), [orders, pendingOrdersCount]);
const filteredOrdersList = useMemo(() => {
  const now = Date.now();
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const startOfToday = d.getTime();
  const sevenDaysAgo = now - 7 * 86400000;
  return orders.filter((o: Order) => {
    if (orderFilter !== 'الكل') {
      if (orderFilter === 'قيد المراجعة والتجهيز') {
        if (!isOrderPending(o.status)) return false;
      } else if (orderFilter === 'تم التسليم') {
        if (!/تم التسليم|مكتمل/.test(o.status)) return false;
      } else if (o.status !== orderFilter) {
        return false;
      }
    }
    if (orderTimeFilter === 'today' && (o.createdAt || 0) < startOfToday) return false;
    if (orderTimeFilter === '7d' && (o.createdAt || 0) < sevenDaysAgo) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.trim().toLowerCase();
      const matchId = String(o.id || '').toLowerCase().includes(q);
      const matchCust = String(o.customer || '').toLowerCase().includes(q);
      const matchPhone = String(o.phone || '').toLowerCase().includes(q);
      const matchAddr = String(o.address || '').toLowerCase().includes(q);
      const matchItems = (o.items || []).some((it: any) => (it.name || '').toLowerCase().includes(q));
      if (!matchId && !matchCust && !matchPhone && !matchAddr && !matchItems) return false;
    }
    return true;
  });
}, [orders, orderFilter, orderTimeFilter, orderSearch]);
const deliveredOrders=orders.filter((order:Order)=>/تم التسليم|مكتمل/.test(order.status));const customerInsights=buildCustomerInsights(orders);const activeCustomers=customerInsights.filter(customer=>Date.now()-customer.lastPurchase<30*86400000);const inactiveCustomerInsights=customerInsights.filter(customer=>Date.now()-customer.lastPurchase>=30*86400000);const productPopularity=new Map<string,number>();deliveredOrders.forEach((order:Order)=>order.items.forEach((line:CartLine)=>productPopularity.set(line.name,(productPopularity.get(line.name)||0)+line.quantity)));const popularProducts=[...productPopularity.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);const visibleCustomers=customerInsights.filter(customer=>{const active=Date.now()-customer.lastPurchase<30*86400000;const segmentMatch=customerFilter==='الكل'||(customerFilter==='نشط'&&active)||(customerFilter==='خامل'&&!active);const query=customerSearch.trim().toLowerCase();const text=[customer.name,customer.phone,customer.email,...customer.topProducts.map(([product])=>product)].join(' ').toLowerCase();return segmentMatch&&(!query||text.includes(query))});const revenue=deliveredOrders.reduce((sum:number,order:Order)=>sum+order.total,0);const averageOrder=deliveredOrders.length?revenue/deliveredOrders.length:0;const latestCustomerOrders=new Map<string,Order>();orders.filter((order:Order)=>!!order.customerDocumentId).forEach((order:Order)=>{const previous=latestCustomerOrders.get(order.customerDocumentId!);if(!previous||order.createdAt>previous.createdAt)latestCustomerOrders.set(order.customerDocumentId!,order)});const inactiveCustomers=[...latestCustomerOrders.values()].filter((order:Order)=>/تم التسليم|مكتمل/.test(order.status)&&Date.now()-order.createdAt>=30*86400000);const createInactiveCoupon=()=>{const eligibleCustomerIds=inactiveCustomers.map((order:Order)=>order.customerDocumentId!).filter(Boolean);if(!eligibleCustomerIds.length)return Alert.alert('لا يوجد عملاء مؤهلون','لا توجد حسابات لها طلب مكتمل منذ ٣٠ يوماً أو أكثر.');const coupon:Coupon={code:`RETURN${Date.now().toString().slice(-5)}`,type:'percent',value:10,minimum:200,maxDiscount:50,expiresAt:Date.now()+7*86400000,active:true,uses:0,popup:false,eligibleCustomerIds};setState((current:AppState)=>({...current,coupons:[coupon,...current.coupons]}));onCouponChange?.(coupon);notify(`تم إنشاء كوبون عودة لـ ${eligibleCustomerIds.length} عميل`)};const featuredCount=state.products.filter((product:Product)=>product.featured).length;const setFeatured=(product:Product)=>{if(!product.featured&&featuredCount>=8)return Alert.alert('اكتمل عدد المنتجات المميزة','يمكن تثبيت ٨ منتجات كحد أقصى في شبكة الرئيسية.');const updated={...product,featured:!product.featured};setState((current:AppState)=>({...current,products:current.products.map((item:Product)=>item.id===product.id?updated:item)}));onProductChange?.(updated)};
 return <View style={{flex:1,minHeight:0}}><ScrollView horizontal style={{flexGrow:0,flexShrink:0,height:58}} nestedScrollEnabled showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal:12,paddingVertical:6,gap:6,alignItems:'center'}}>{tabs.map(x=>{
  const isOrders=x==='الطلبات';
  const chipLabel=isOrders&&pendingOrdersCount>0?`الطلبات (${pendingOrdersCount} 🔔)`:x;
  return <Chip key={x} label={chipLabel} selected={tab===x} onPress={()=>openTab(x)}/>;
})}</ScrollView><ScrollView ref={contentScroll} style={{flex:1,minHeight:0}} contentContainerStyle={[s.scroll,{flexGrow:1,paddingBottom:48}]} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled" nestedScrollEnabled keyboardDismissMode="on-drag">
 {tab==='كلمة مرور الإدارة'&&<><ScreenTitle title="تغيير كلمة مرور الإدارة" subtitle="يُعاد التحقق من كلمة المرور الحالية سحابياً قبل حفظ التغيير"/><View style={s.card}><Field label="كلمة المرور الحالية" value={currentAdminPassword} onChangeText={setCurrentAdminPassword} secureTextEntry/><Field label="كلمة المرور الجديدة" value={newAdminPassword} onChangeText={setNewAdminPassword} secureTextEntry/><Field label="تأكيد كلمة المرور الجديدة" value={confirmAdminPassword} onChangeText={setConfirmAdminPassword} secureTextEntry/><Button title={savingAdminPassword?'جارٍ التحديث…':'حفظ كلمة المرور الجديدة'} disabled={savingAdminPassword} onPress={async()=>{if(!currentAdminPassword||!newAdminPassword||!confirmAdminPassword)return Alert.alert('بيانات ناقصة','أكمل كلمات المرور الثلاث.');if(newAdminPassword!==confirmAdminPassword)return Alert.alert('تأكيد غير مطابق','تأكد من كتابة كلمة المرور الجديدة نفسها مرتين.');setSavingAdminPassword(true);try{await changeAdminPassword(currentAdminPassword,newAdminPassword);setCurrentAdminPassword('');setNewAdminPassword('');setConfirmAdminPassword('');Alert.alert('تم التحديث','تم تغيير كلمة مرور المدير بنجاح.')}catch(error:any){Alert.alert('تعذر تغيير كلمة المرور',error?.message||'حاول مرة أخرى.')}finally{setSavingAdminPassword(false)}}}/></View></>}
 {tab==='الملخص'&&<><ScreenTitle title="ملخص المتجر" subtitle="مؤشرات المبيعات والطلبات وتوفر المنتجات"/><SummaryCharts orders={orders} onOpenAnalytics={()=>openTab('الرسوم البيانية')}/><View style={[s.card,{borderColor:storeIsOpen?'rgba(35,122,87,0.3)':'rgba(214,40,50,0.35)',borderWidth:1.5}]}><View style={[s.row,{marginBottom:8}]}><View style={{backgroundColor:storeIsOpen?'rgba(35,122,87,0.12)':'rgba(214,40,50,0.12)',paddingHorizontal:12,paddingVertical:5,borderRadius:20}}><Txt style={{color:storeIsOpen?C.green:C.red,fontWeight:'900',fontSize:13}}>{storeIsOpen?'● مفتوح لاستقبال الطلبات':'● مغلق مؤقتاً'}</Txt></View><Txt style={{fontSize:17,fontWeight:'900',color:C.navy}}>حالة المتجر واستقبال الطلبات</Txt></View><Toggle label={storeIsOpen?'المتجر يستقبل طلبات جديدة الآن':'المتجر مغلق مؤقتاً والطلبات موقوفة'} value={storeIsOpen} onChange={setStoreIsOpen}/>{!storeIsOpen&&<View style={{marginTop:8}}><Field label="رسالة التنبيه للعملاء عند الإغلاق" value={storeMessage} onChangeText={setStoreMessage} placeholder="نعتذر عن استقبال الطلبات مؤقتاً لضغط العمل"/><Field label="موعد استئناف الطلبات (اختياري)" value={storeNextOpen} onChangeText={setStoreNextOpen} placeholder="مثال: غداً الساعة ١١:٠٠ صباحاً"/></View>}<Button title={savingStatus?'جارٍ الحفظ…':'حفظ حالة المتجر السحابية'} disabled={savingStatus} onPress={saveStatus} style={{marginTop:8}}/></View><View style={[s.card,s.row,{justifyContent:'space-between',alignItems:'center'}]}><Button title="🔊 تجربة رنة التنبيه" secondary onPress={()=>playNewOrderSound()}/><View style={{alignItems:'flex-end'}}><Txt style={{fontWeight:'900',fontSize:15}}>تنبيه صوتي للطلبات الجديدة</Txt><Txt style={s.small}>يرن تلقائياً عند وصول طلب جديد</Txt></View></View><View style={[s.row,{flexWrap:'wrap',justifyContent:'flex-end'}]}>{[["إيرادات الطلبات المكتملة",money(revenue)],["متوسط الطلب المكتمل",money(averageOrder)],["إجمالي الطلبات",orders.length],["منتجات متاحة",state.products.filter((product:Product)=>product.available).length],["نفد مؤقتاً",state.products.filter((product:Product)=>!product.available).length]].map(([label,value]:any)=><View key={label} style={[s.card,{width:'47%',minHeight:88,justifyContent:'center'}]}><Txt style={{fontSize:20,fontWeight:'900',color:C.navy}}>{value}</Txt><Txt style={s.small}>{label}</Txt></View>)}</View><ScreenTitle title="حالات الطلبات" subtitle="توزيع الطلبات الحالية حسب حالتها"/><View style={[s.row,{flexWrap:'wrap',justifyContent:'flex-end'}]}>{["قيد المراجعة والتجهيز","جاري التجهيز","خرج للتوصيل","تم التسليم","ملغي"].map((status:string)=>{const count=orders.filter((order:Order)=>order.status===status).length;return <View key={status} style={[s.card,{width:'47%',padding:12}]}><Txt style={{fontSize:18,fontWeight:'900',color:status==="ملغي"?C.red:C.navy}}>{count}</Txt><Txt style={s.small}>{status}</Txt></View>})}</View><Button title="عرض الطلبات" secondary onPress={()=>openTab('الطلبات')}/></>}
 {tab==='الرسوم البيانية'&&<DashboardChartsTab orders={orders} products={state.products} onTabChange={openTab}/>}
 {tab==='الأقسام'&&<><ScreenTitle title="إدارة الأقسام" subtitle="تحديث وتخصيص صور الفئات في الصفحة الرئيسية"/>{productCategories.filter((item:string)=>item!=='الكل').map((categoryName:string)=>{const count=state.products.filter((product:Product)=>product.category===categoryName).length;const selectedImage=state.categoryImages?.[categoryName];const displaySource=selectedImage?.startsWith('http')||selectedImage?.startsWith('data:')?{uri:selectedImage}:images[selectedImage||'chicken'];return <View key={categoryName} style={s.card}><View style={s.row}><Txt style={{fontWeight:'900'}}>{count} منتج</Txt><Txt style={{fontWeight:'800',color:C.navy}}>{categoryName}</Txt></View><View style={{flexDirection:'row-reverse',alignItems:'center',gap:12,marginVertical:8,padding:10,backgroundColor:C.surfaceAlt,borderRadius:16,borderWidth:1,borderColor:C.border}}><View style={{width:66,height:66,borderRadius:20,overflow:'hidden',backgroundColor:C.surface,borderWidth:1,borderColor:C.action,alignItems:'center',justifyContent:'center'}}>{displaySource?<Image source={displaySource} resizeMode="cover" style={{width:'100%',height:'100%'}}/>:<Txt style={{color:C.muted,fontSize:10}}>بلا صورة</Txt>}</View><View style={{flex:1,alignItems:'flex-end'}}><Txt style={{fontWeight:'800',fontSize:13,color:C.navy}}>المعاينة كما تظهر في الصفحة الرئيسية</Txt><Txt style={s.small}>{selectedImage?(selectedImage.startsWith('data:')?'صورة مخصصة من الجهاز':selectedImage.startsWith('http')?'رابط مباشر URL':`أيقونة (${selectedImage})`):'الأيقونة الافتراضية'}</Txt></View></View><Txt style={{fontWeight:'700',fontSize:12,color:C.navy,marginTop:4}}>أيقونة من صور المتجر الجاهزة</Txt><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,marginTop:6}}>{['chicken','duck','pigeon','panee','shish','wings','drumsticks',...productImageKeys.slice(0,10)].map((imageKey:string)=><Pressable key={imageKey} accessibilityRole="button" onPress={()=>{const next={...(state.categoryImages||{}),[categoryName]:imageKey};setState((current:AppState)=>({...current,categoryImages:next}));onCategoryImagesChange?.(next);notify(`تم تحديث صورة قسم ${categoryName}`)}} style={{width:58,height:58,borderRadius:12,overflow:'hidden',borderWidth:selectedImage===imageKey?2:1,borderColor:selectedImage===imageKey?C.red:C.line}}><Image source={images[imageKey]} resizeMode="cover" style={{width:'100%',height:'100%'}}/></Pressable>)}</ScrollView><Field label="أو رابط مباشر لصورة القسم (URL)" value={selectedImage?.startsWith('http')?selectedImage:''} onChangeText={(url:string)=>{const next={...(state.categoryImages||{}),[categoryName]:url.trim()};setState((current:AppState)=>({...current,categoryImages:next}));onCategoryImagesChange?.(next)}} placeholder="https://.../category.png"/>{(selectedImage?.startsWith('http')||selectedImage?.startsWith('data:'))&&<Pressable onPress={()=>{const next={...(state.categoryImages||{})};delete next[categoryName];setState((current:AppState)=>({...current,categoryImages:next}));onCategoryImagesChange?.(next);notify(`تمت استعادة أيقونة قسم ${categoryName}`)}} style={{paddingVertical:4,marginBottom:4}}><Txt style={{color:C.red,fontSize:11,fontWeight:'700'}}>إزالة الصورة المخصصة والعودة للأيقونة الافتراضية</Txt></Pressable>}<Button title="☁️ اختيار من مكتبة السحابة" secondary onPress={()=>openCloudPicker(`اختيار صورة لقسم ${categoryName}`, (url: string)=>{const next={...(state.categoryImages||{}),[categoryName]:url};setState((curr:any)=>({...curr,categoryImages:next}));onCategoryImagesChange?.(next);notify(`تم تحديث صورة قسم ${categoryName}`);})} style={{marginBottom:8}}/><Button title="⚡ رفع صورة للقسم للسحابة فوراً" onPress={async()=>{try{const url=await pickAndUploadToCloud(categoryName,"category");if(url){const next={...(state.categoryImages||{}),[categoryName]:url};setState((current:AppState)=>({...current,categoryImages:next}));onCategoryImagesChange?.(next);notify(`تم رفع وتحديث صورة قسم ${categoryName}`)}}catch(e:any){Alert.alert("تعذر الرفع",e?.message)}}} style={{backgroundColor:C.action,marginBottom:8}}/>
   <Button title="اختيار صورة من الجهاز" secondary onPress={async()=>{try{const uri=await pickCompressedImage();if(uri){const next={...(state.categoryImages||{}),[categoryName]:uri};setState((current:AppState)=>({...current,categoryImages:next}));onCategoryImagesChange?.(next);notify(`تم تحديث صورة قسم ${categoryName}`)}}catch(error:any){Alert.alert("تعذر تجهيز الصورة",error?.message||"اختر صورة أخرى.")}}}/></View>})}</>}
 {tab==='الفروع'&&<><ScreenTitle title="إدارة صور الفروع" subtitle="تحديث وتخصيص صور الفروع في أسفل الصفحة الرئيسية وصفحة الفروع"/>{branchDetails.map((branch)=>{const currentCustom=state.branchImages?.[branch.name]||state.branchImages?.[branch.image];const displaySource=getBranchImageSource(branch,state.branchImages);return <View key={branch.name} style={s.card}><View style={s.row}><View style={{backgroundColor:C.action,borderRadius:8,paddingHorizontal:8,paddingVertical:3}}><Txt style={{color:C.actionText,fontWeight:'900',fontSize:11}}>{branch.tag}</Txt></View><Txt style={{fontWeight:'900',fontSize:16,color:C.navy}}>{branch.name}</Txt></View><Txt style={[s.small,{marginTop:2,marginBottom:8}]}>{branch.address} · {branch.phone}</Txt><View style={{borderRadius:16,overflow:'hidden',backgroundColor:C.surfaceAlt,borderWidth:1,borderColor:C.border,marginBottom:10}}><Image source={displaySource} resizeMode="cover" style={{width:'100%',height:140}}/><View style={{padding:8,backgroundColor:C.surface,flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center'}}><Txt style={{fontSize:11,fontWeight:'800',color:C.navy}}>المعاينة الحالية للفرع</Txt><Txt style={[s.small,{fontSize:10}]}>{currentCustom?(currentCustom.startsWith('data:')?'صورة مرفوعة من الجهاز':currentCustom.startsWith('http')?'رابط مباشر URL':`صورة (${currentCustom})`):'الصورة الافتراضية'}</Txt></View></View><Txt style={{fontWeight:'700',fontSize:12,color:C.navy,marginTop:4}}>اختيار من صور المتجر الجاهزة</Txt><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,marginTop:6,marginBottom:10}}>{['branch-camp','branch-smouha','branch-bahary','hero-chicken','hero-marinated','brand-logo'].map((imageKey:string)=><Pressable key={imageKey} accessibilityRole="button" onPress={()=>{const next={...(state.branchImages||{}),[branch.name]:imageKey};setState((current:AppState)=>({...current,branchImages:next}));onBranchImagesChange?.(next);notify(`تم تحديث صورة ${branch.name}`)}} style={{width:74,height:54,borderRadius:10,overflow:'hidden',borderWidth:currentCustom===imageKey?2:1,borderColor:currentCustom===imageKey?C.red:C.line}}><Image source={images[imageKey]} resizeMode="cover" style={{width:'100%',height:'100%'}}/></Pressable>)}</ScrollView><Button title="☁️ اختيار من مكتبة السحابة" secondary onPress={()=>openCloudPicker(`اختيار صورة لـ ${branch.name}`, (url: string)=>{const next={...(state.branchImages||{}),[branch.name]:url};setState((curr:any)=>({...curr,branchImages:next}));onBranchImagesChange?.(next);notify(`تم تحديث صورة ${branch.name}`);})} style={{marginBottom:8}}/><Button title="⚡ رفع صورة الفرع للسحابة فوراً" onPress={async()=>{try{const url=await pickAndUploadToCloud(branch.name,"branch");if(url){const next={...(state.branchImages||{}),[branch.name]:url};setState((curr:any)=>({...curr,branchImages:next}));onBranchImagesChange?.(next);notify(`تم رفع وتحديث صورة ${branch.name}`)}}catch(e:any){Alert.alert("تعذر الرفع",e?.message)}}} style={{backgroundColor:C.action,marginBottom:8}}/>
   <Field label="أو رابط مباشر لصورة الفرع (URL)" value={currentCustom?.startsWith('http')?currentCustom:''} onChangeText={(url:string)=>{const next={...(state.branchImages||{}),[branch.name]:url.trim()};setState((current:AppState)=>({...current,branchImages:next}));onBranchImagesChange?.(next)}} placeholder="https://.../branch.jpg"/>{!!currentCustom&&<Pressable onPress={()=>{const next={...(state.branchImages||{})};delete next[branch.name];delete next[branch.image];setState((current:AppState)=>({...current,branchImages:next}));onBranchImagesChange?.(next);notify(`تمت استعادة الصورة الافتراضية لـ ${branch.name}`)}} style={{paddingVertical:6,marginBottom:6}}><Txt style={{color:C.red,fontSize:12,fontWeight:'800'}}>إزالة الصورة المخصصة والعودة للافتراضية</Txt></Pressable>}<Button title="اختيار صورة من الجهاز" secondary onPress={async()=>{try{const uri=await pickCompressedImage();if(uri){const next={...(state.branchImages||{}),[branch.name]:uri};setState((current:AppState)=>({...current,branchImages:next}));onBranchImagesChange?.(next);notify(`تم تحديث صورة ${branch.name}`)}}catch(error:any){Alert.alert("تعذر تجهيز الصورة",error?.message||"اختر صورة أخرى.")}}}/></View>})}</>}
 {tab==='عروض التوفير 🔥'&&<OffersManagerTab state={state} setState={setState} onProductChange={onProductChange} notify={notify}/>}
 {tab==='الرئيسية'&&<><ScreenTitle title="منتجات شبكة الرئيسية" subtitle={`${featuredCount} من ٨ منتجات مثبتة`}/>{state.products.map((product:Product)=><View key={product.id} style={[s.card,s.row]}><Toggle label="إظهار في الشبكة الرئيسية" value={!!product.featured} onChange={()=>setFeatured(product)}/><View style={{flex:1,alignItems:'flex-end'}}><Txt style={{fontWeight:'900'}}>{product.name}</Txt><Txt style={s.small}>{money(product.price)}</Txt></View></View>)}</>}
 <View style={[s.card,s.row,{paddingVertical:10,marginBottom:4}]}><Txt style={{color:firebaseStatus==='connected'?C.green:firebaseStatus==='error'?C.red:C.muted,fontWeight:'800'}}>{firebaseStatus==='connected'?'● متصل بالسحابة المركزية':firebaseStatus==='connecting'?'◌ جارٍ الاتصال بالسحابة…':firebaseStatus==='error'?'! تعذّر الاتصال أو لم تسمح القواعد بالقراءة':'○ السحابة غير مهيأة؛ البيانات محلية'}</Txt><Txt style={s.small}>قاعدة المنتجات</Txt></View><Button title={syncing ? "جارٍ التحديث…" : "مزامنة الآن"} secondary disabled={syncing} onPress={async()=>{setSyncing(true);try{await refreshFirestoreData();notify("تم تحديث البيانات السحابية")}catch{notify("تعذرت المزامنة. تحقق من الاتصال بالسحابة")}finally{setSyncing(false)}}}/> 
 {(tab==='مكتبة السحابة ☁️'||tab==='مكتبة الصور')&&<MediaLibraryTab notify={notify} state={state} setState={setState} onProductChange={onProductChange} onBannersChange={onBannersChange} onStoriesChange={onStoriesChange} onCategoryImagesChange={onCategoryImagesChange} onBranchImagesChange={onBranchImagesChange}/>}
 {tab==='المنتجات'&&<><ScreenTitle title="إدارة المنتجات" subtitle={`${state.products.length} منتج`}/><View style={s.card}><Txt style={{fontWeight:'900',fontSize:17}}>إضافة منتج</Txt><Field label="اسم المنتج" value={name} onChangeText={setName} placeholder="مثال: صدور دجاج"/><Field label="السعر بالجنيه" value={price} onChangeText={setPrice} placeholder="180" keyboardType="numeric"/><Button title="⚡ رفع صورة للمنتج من التليفون للسحابة فوراً" secondary onPress={async()=>{try{const url=await pickAndUploadToCloud(name||"منتج جديد","product");if(url){setNewProductImageUri(url);Alert.alert("تم الرفع السحابي ⚡","تم رفع الصورة للسحابة وربطها بالمنتج.")}}catch(e:any){Alert.alert("تعذر الرفع",e?.message)}}} style={{marginBottom:8}}/>
   <Button title="☁️ اختيار من مكتبة السحابة" secondary onPress={()=>openCloudPicker('اختيار صورة للمنتج الجديد', setNewProductImageUri)} style={{marginBottom:8}}/><Field label="رابط صورة المنتج (URL) - اختياري" value={newProductImageUri} onChangeText={setNewProductImageUri} placeholder="https://.../chicken.jpg"/><ScrollView horizontal>{['فراخ','بط','رومي','حمام وسمان','متبلات','أجزاء دواجن','أخرى وأرانب'].map(x=><Chip key={x} label={x} selected={category===x} onPress={()=>setCategory(x)}/>)}</ScrollView><Button title="إضافة المنتج" onPress={addProduct}/><ScrollView horizontal showsHorizontalScrollIndicator={false}>{["الكل",...productCategories.filter((item:string)=>item!=="الكل")].map((item:string)=><Chip key={item} label={item} selected={productFilter===item} onPress={()=>setProductFilter(item)}/>)}</ScrollView><Field label="بحث بالاسم أو الوصف" value={productSearch} onChangeText={setProductSearch} placeholder="اكتب اسم المنتج أو وصفه"/></View>{state.products.filter((p:Product)=>(productFilter==="الكل"||p.category===productFilter)&&(!productSearch.trim()||p.name.toLowerCase().includes(productSearch.trim().toLowerCase())||(p.subtitle||'').toLowerCase().includes(productSearch.trim().toLowerCase()))).map((p:Product)=><ProductAdmin key={p.id} badges={state.badges||[]} product={p} onPickCloud={(onSelect: (url: string) => void) => openCloudPicker('اختيار صورة للمنتج من السحابة', onSelect)} onChange={(updated:Product)=>{setState((x:AppState)=>({...x,products:x.products.map(y=>y.id===p.id?updated:y)}));onProductChange?.(updated)}} onDelete={()=>confirmAction('حذف المنتج',`هل أنت متأكد من حذف «${p.name}» نهائياً؟`,()=>{setState((x:AppState)=>({...x,products:x.products.filter(y=>y.id!==p.id)}));onProductDelete?.(p.id);notify(`تم حذف «${p.name}»`)})}/>)}</>}
 {tab==='العملاء'&&<><ScreenTitle title="تحليل العملاء" subtitle="نشاط العملاء وتفضيلات الشراء من الطلبات المكتملة"/><View style={[s.row,{flexWrap:'wrap',justifyContent:'flex-end'}]}>{[["إجمالي العملاء",customerInsights.length],["نشطون · آخر ٣٠ يوماً",activeCustomers.length],["خاملون · ٣٠ يوماً فأكثر",inactiveCustomerInsights.length]].map(([label,value]:any)=><View key={label} style={[s.card,{width:'31%',minHeight:88,justifyContent:'center',alignItems:'center'}]}><Txt style={{fontSize:20,fontWeight:'900',color:C.navy}}>{value}</Txt><Txt style={[s.small,{textAlign:'center'}]}>{label}</Txt></View>)}</View><View style={s.card}><Txt style={{fontSize:17,fontWeight:'900',color:C.navy}}>المنتجات الأكثر شراءً</Txt><Txt style={[s.small,{marginTop:4,marginBottom:8}]}>حسب الكميات في الطلبات المكتملة</Txt>{popularProducts.length?popularProducts.map(([product,quantity],index)=><View key={product} style={[s.row,{paddingVertical:7,borderBottomWidth:index===popularProducts.length-1?0:1,borderColor:C.border}]}><Txt style={{color:C.navy,fontWeight:'900'}}>{quantity} قطعة/وحدة</Txt><Txt style={{flex:1,textAlign:'right'}}>{index+1}. {product}</Txt></View>):<Txt style={s.small}>لا توجد مشتريات مكتملة بعد.</Txt>}</View><View style={s.card}><Field label="ابحث باسم العميل أو رقمه أو المنتج المفضل" value={customerSearch} onChangeText={setCustomerSearch} placeholder="اسم العميل أو المنتج"/><View style={[s.row,{justifyContent:'flex-end',flexWrap:'wrap'}]}>{['الكل','نشط','خامل'].map(segment=><Chip key={segment} label={segment==='الكل'?'كل العملاء':segment==='نشط'?'النشطون':'الخاملون'} selected={customerFilter===segment} onPress={()=>setCustomerFilter(segment)}/>)}</View></View>{visibleCustomers.length?visibleCustomers.map(customer=><View key={customer.id} style={s.card}><View style={[s.row,{alignItems:'flex-start'}]}><View style={{flex:1}}><Txt style={{fontSize:16,fontWeight:'900',color:C.navy}}>{customer.name}</Txt><Txt style={s.small}>{customer.phone||customer.email||'بيانات التواصل غير متاحة'}</Txt><Txt style={[s.small,{marginTop:4}]}>آخر شراء: {new Date(customer.lastPurchase).toLocaleDateString('ar-EG')} · {customer.orders.length} طلب مكتمل · إجمالي {money(customer.spent)}</Txt></View><View style={{backgroundColor:Date.now()-customer.lastPurchase<30*86400000?'rgba(35,122,87,0.12)':'rgba(217,119,6,0.12)',paddingHorizontal:10,paddingVertical:6,borderRadius:20}}><Txt style={{fontWeight:'900',color:Date.now()-customer.lastPurchase<30*86400000?C.green:'#B45309'}}>{Date.now()-customer.lastPurchase<30*86400000?'نشط':'خامل'}</Txt></View></View><Txt style={{fontWeight:'900',marginTop:10,color:C.navy}}>الأكثر شراءً</Txt><Txt style={s.small}>{customer.topProducts.length?customer.topProducts.map(([product,quantity])=>`${product} (${quantity})`).join(' · '):'لا توجد تفاصيل منتجات'}</Txt></View>):<View style={s.card}><Txt style={{textAlign:'center',color:C.muted}}>لا يوجد عملاء مطابقون. تظهر هنا بيانات العملاء المرتبطة بطلبات مكتملة.</Txt></View>}</>}
 {tab==='الطلبات'&&<>
  <ScreenTitle title="متابعة وإدارة الطلبات" subtitle="فرز وبحث ذكي، تحديث الحالة بنقرة واحدة، وتواصل مباشر عبر واتساب" />

  {/* Real-Time Pending Alert Banner */}
  {orderCounts.pending > 0 && (
    <View style={[s.card, { backgroundColor: 'rgba(35,122,87,0.1)', borderColor: C.green, borderWidth: 1.5, marginBottom: 12 }]}>
      <View style={[s.row, { alignItems: 'center' }]}>
        <Pressable
          onPress={() => setOrderFilter('قيد المراجعة والتجهيز')}
          style={{ backgroundColor: C.green, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 }}
        >
          <Txt style={{ color: C.white, fontWeight: '900', fontSize: 12 }}>عرض الجديدة ({orderCounts.pending}) ➔</Txt>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'flex-end', marginEnd: 10 }}>
          <Txt style={{ color: C.green, fontWeight: '900', fontSize: 16 }}>🚨 يوجد {orderCounts.pending} طلب جديد بانتظار الاستلام!</Txt>
          <Txt style={s.small}>اضغط «استلام وبدء التجهيز» لبدء التنفيذ وتحديث حالة الطلب للعميل</Txt>
        </View>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(35,122,87,0.2)', alignItems: 'center', justifyContent: 'center' }}>
          <Txt style={{ fontSize: 20 }}>🔔</Txt>
        </View>
      </View>
    </View>
  )}

  {/* Search & Period Filter Control Card */}
  <View style={[s.card, { padding: 12, marginBottom: 10 }]}>
    <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }]}>
      <Button title="🔊 رنة التنبيه" secondary onPress={() => playNewOrderSound()} style={{ paddingVertical: 6, paddingHorizontal: 10 }} />
      <View style={{ flexDirection: 'row-reverse', gap: 6, alignItems: 'center' }}>
        <Chip label="كل الفترات" selected={orderTimeFilter === 'all'} onPress={() => setOrderTimeFilter('all')} />
        <Chip label="طلبات اليوم ⚡" selected={orderTimeFilter === 'today'} onPress={() => setOrderTimeFilter('today')} />
        <Chip label="آخر ٧ أيام" selected={orderTimeFilter === '7d'} onPress={() => setOrderTimeFilter('7d')} />
      </View>
    </View>

    {/* Instant Search Bar */}
    <View style={{ position: 'relative' }}>
      <Field
        label="البحث في الطلبات"
        value={orderSearch}
        onChangeText={setOrderSearch}
        placeholder="رقم الطلب (مثال: 1005)، اسم العميل، الهاتف، المنطقة أو الصنف..."
      />
      {!!orderSearch && (
        <Pressable
          onPress={() => setOrderSearch('')}
          style={{
            position: 'absolute',
            left: 10,
            bottom: 16,
            backgroundColor: C.surfaceAlt,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <Txt style={{ fontSize: 11, color: C.red, fontWeight: '800' }}>مسح ✕</Txt>
        </Pressable>
      )}
    </View>

    {/* Active Filters Summary & Clear button */}
    {(orderSearch.trim() || orderFilter !== 'الكل' || orderTimeFilter !== 'all') && (
      <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: C.line }]}>
        <Pressable
          onPress={() => {
            setOrderFilter('الكل');
            setOrderTimeFilter('all');
            setOrderSearch('');
          }}
          style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, backgroundColor: 'rgba(214,40,50,0.1)' }}
        >
          <Txt style={{ color: C.red, fontWeight: '900', fontSize: 11 }}>إلغاء جميع الفلاتر ✕</Txt>
        </Pressable>
        <Txt style={[s.small, { color: C.muted }]}>
          عرض <Txt style={{ fontWeight: '900', color: C.navy }}>{filteredOrdersList.length}</Txt> من أصل {orders.length} طلب
        </Txt>
      </View>
    )}
  </View>

  {/* Interactive Status Pills Horizontal Bar */}
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, justifyContent: 'flex-end', paddingBottom: 10 }}>
    {[
      { key: 'الكل', label: `الكل (${orderCounts.all})` },
      { key: 'قيد المراجعة والتجهيز', label: `🚨 جديدة (${orderCounts.pending})` },
      { key: 'جاري التجهيز', label: `🔪 تجهيز (${orderCounts.prep})` },
      { key: 'خرج للتوصيل', label: `🛵 في الطريق (${orderCounts.delivering})` },
      { key: 'تم التسليم', label: `✅ مكتملة (${orderCounts.delivered})` },
      { key: 'ملغي', label: `❌ ملغية (${orderCounts.cancelled})` },
    ].map((tabItem) => (
      <Chip
        key={tabItem.key}
        label={tabItem.label}
        selected={orderFilter === tabItem.key}
        onPress={() => setOrderFilter(tabItem.key)}
      />
    ))}
  </ScrollView>

  {/* Orders List or Empty State */}
  {!orders.length ? (
    <View style={[s.card, { paddingVertical: 24, alignItems: 'center' }]}>
      <Txt style={{ fontSize: 32, marginBottom: 8 }}>📦</Txt>
      <Txt style={{ fontSize: 16, fontWeight: '900', color: C.navy }}>لا توجد طلبات مسجلة بعد</Txt>
      <Txt style={[s.small, { textAlign: 'center', marginTop: 4 }]}>ستظهر الطلبات الجديدة هنا فور إرسالها من العملاء عبر التطبيق أو المتجر السحابي.</Txt>
    </View>
  ) : !filteredOrdersList.length ? (
    <View style={[s.card, { paddingVertical: 24, alignItems: 'center' }]}>
      <Txt style={{ fontSize: 28, marginBottom: 8 }}>🔍</Txt>
      <Txt style={{ fontSize: 15, fontWeight: '900', color: C.navy }}>لا توجد طلبات مطابقة للبحث أو الفلتر المحدد</Txt>
      <Pressable
        onPress={() => {
          setOrderFilter('الكل');
          setOrderTimeFilter('all');
          setOrderSearch('');
        }}
        style={{ marginTop: 12, backgroundColor: C.navy, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
      >
        <Txt style={{ color: C.white, fontWeight: '900', fontSize: 12 }}>عرض كل الطلبات</Txt>
      </Pressable>
    </View>
  ) : (
    filteredOrdersList.map((order: Order) => (
      <OrderAdmin
        key={order.id}
        order={order}
        onStatus={(status: string) => setStatus(order.id, status, order.phone, order.email, order.docId)}
      />
    ))
  )}
 </>}
 {(tab==='سفرة الرشيدي 🍗'||tab==='سفرة الرشيدي'||tab==='البانرات')&&<ShowcaseAdminTab state={state} setState={setState} notify={notify} onShowcaseChange={onShowcaseChange} openCloudPicker={openCloudPicker}/>}
  {tab==='الستوريز ⭐'&&<StoriesAdminTab state={state} setState={setState} notify={notify} onStoriesChange={onStoriesChange} openCloudPicker={openCloudPicker}/>}
 {tab==='الشارات'&&<><ScreenTitle title="إدارة الشارات التسويقية" subtitle="أنشئ شارات بألوان البراند واربطها بالمنتجات"/><View style={s.card}><Field label="اسم الشارة" value={badgeName} onChangeText={setBadgeName} placeholder="مثال: طازج يومياً"/><View style={[s.row,{justifyContent:'flex-end',gap:8,marginVertical:8}]}>{['#237A57','#1E3A8A','#DC2626','#D97706','#663399','#168A83'].map((color:string)=><Pressable key={color} accessibilityRole="button" accessibilityLabel="لون الشارة" onPress={()=>setBadgeColor(color)} style={{width:36,height:36,borderRadius:18,backgroundColor:color,borderWidth:badgeColor===color?3:1,borderColor:badgeColor===color?C.ink:C.line}}/>)}</View><Button title="إضافة الشارة" onPress={()=>{const name=badgeName.trim();if(!name)return Alert.alert('اسم الشارة مطلوب','اكتب اسم الشارة أولاً.');if((state.badges||[]).some((item:BadgeOption)=>item.name===name))return Alert.alert('الشارة موجودة','اختر اسماً مختلفاً.');const next=[...(state.badges||[]),{name,color:badgeColor}];setState((current:AppState)=>({...current,badges:next}));onBadgesChange?.(next);setBadgeName('')}}/></View>{(state.badges||[]).map((badge:BadgeOption)=><View key={badge.name} style={[s.card,s.row]}><Pressable onPress={()=>confirmAction('حذف الشارة',`حذف الشارة «${badge.name}»؟`,()=>{const next=(state.badges||[]).filter((item:BadgeOption)=>item.name!==badge.name);setState((current:AppState)=>({...current,badges:next}));onBadgesChange?.(next);notify('تم حذف الشارة')})} style={{padding:10,minHeight:44,justifyContent:'center'}}><Txt style={{color:C.red,fontWeight:'800'}}>حذف</Txt></Pressable><View style={{backgroundColor:badge.color,borderRadius:14,paddingHorizontal:12,paddingVertical:7}}><Txt style={{color:C.white,fontWeight:'900'}}>{badge.name}</Txt></View></View>)}</>}
 {tab==='الولاء'&&<LoyaltySettings state={state} setState={setState} onSave={onLoyaltyChange} notify={notify}/>}
 {tab==='البث'&&<><ScreenTitle title="إشعارات العملاء" subtitle="معاينة وبث رسائل العروض والطلبات"/><View style={s.card}><Field label="عنوان الإشعار" value={name} onChangeText={setName} placeholder="عرض جديد من الرشيدي"/><Field label="نص الإشعار" value={broadcast} onChangeText={setBroadcast} placeholder="اكتب تفاصيل العرض أو تحديث الطلب…"/><Field label="كود الخصم (اختياري)" value={broadcastCoupon} onChangeText={setBroadcastCoupon} placeholder="RASHIDI10"/><Button title="معاينة" secondary onPress={()=>Alert.alert(name||'الرشيدي ماركت',broadcast||'رسالة العرض')}/><Button title={sendingBroadcast?'جارٍ الإرسال…':'بث الإشعار الآن'} disabled={sendingBroadcast} onPress={async()=>{if(!broadcast.trim())return Alert.alert('رسالة ناقصة','اكتب نص الإشعار قبل الإرسال.');setSendingBroadcast(true);try{const id=`promo_${Date.now()}`;if(onBroadcast)await onBroadcast(id,name||'الرشيدي ماركت',broadcast,broadcastCoupon.trim());else addNotice(name||'الرشيدي ماركت',broadcast);setName('');setBroadcast('');setBroadcastCoupon('');notify('تم بث الإشعار للعملاء')}catch{notify('تعذر بث الإشعار. تحقق من الاتصال بالسحابة.')}finally{setSendingBroadcast(false)}}} style={{marginTop:8}}/><Txt style={[s.small,{marginTop:9}]}>يُحفظ الإشعار سحابياً ويظهر لمستخدمي التطبيق أثناء فتحه. إشعار الهاتف عند إغلاق التطبيق يتطلب خدمة Push وخلفية.</Txt></View><Txt style={s.section}>إشعارات آخر ٢٤ ساعة</Txt>{state.notices.map((n:AppNotice)=><View key={n.id} style={s.card}><Txt style={{fontWeight:'900'}}>{n.title}</Txt><Txt style={s.small}>{n.message}</Txt><Txt style={s.small}>{new Date(n.createdAt).toLocaleString('ar-EG')}</Txt></View>)}</>}
 {tab==='الكوبونات'&&<><ScreenTitle title="إدارة أكواد الخصم" subtitle="أنشئ الكوبونات وراقب صلاحيتها واستخدامها"/><View style={s.card}><Txt style={{fontWeight:"900",fontSize:16,color:C.navy}}>قسيمة للعملاء غير النشطين</Txt><Txt style={[s.small,{marginTop:5,marginBottom:8}]}>عدد العملاء الذين لم يطلبوا منذ ٣٠ يوماً: {inactiveCustomers.length}. ينشئ كوداً بخصم ١٠٪، بحد أقصى ٥٠ ج.م، صالحاً لمدة ٧ أيام ومتاحاً لحساباتهم فقط.</Txt><Button title="إنشاء كوبون عودة للعملاء المؤهلين" secondary onPress={createInactiveCoupon}/></View><View style={[s.row,{flexWrap:'wrap',justifyContent:'flex-end'}]}>{[['إجمالي',state.coupons.length],['نشطة',state.coupons.filter((c:Coupon)=>c.active&&c.expiresAt>Date.now()&&(!c.maxUses||c.uses<c.maxUses)).length],['منتهية',state.coupons.filter((c:Coupon)=>c.expiresAt<=Date.now()).length]].map(([l,n]:any)=><View key={l} style={[s.card,{width:'31%',alignItems:'center',padding:10}]}><Txt style={{fontSize:20,fontWeight:'900',color:C.navy}}>{n}</Txt><Txt style={s.small}>{l}</Txt></View>)}</View><View style={s.card}><Txt style={{fontSize:17,fontWeight:'900'}}>إنشاء كوبون جديد</Txt><View style={[s.row,{gap:8}]}><Button title="توليد" secondary onPress={()=>setCode(`RASHIDI${Math.floor(100+Math.random()*900)}`)} style={{marginTop:8}}/><View style={{flex:1}}><Field label="الكود (أو أنشئ كوداً)" value={code} onChangeText={setCode} placeholder="RASHIDI20"/></View></View><View style={[s.row,{justifyContent:'flex-end'}]}><Chip label="نسبة مئوية %" selected={type==='percent'} onPress={()=>setType('percent')}/><Chip label="مبلغ ثابت (EGP)" selected={type==='fixed'} onPress={()=>setType('fixed')}/></View><Field label="قيمة الخصم" value={value} onChangeText={setValue} keyboardType="numeric"/><Field label="الحد الأدنى للطلب" value={minimum} onChangeText={setMinimum} keyboardType="numeric"/>{type==='percent'&&<Field label="أقصى خصم للكوبون النسبي (اختياري)" value={maxDiscount} onChangeText={setMaxDiscount} keyboardType="numeric"/>}<Field label="مدة الكوبون بالأيام" value={duration} onChangeText={setDuration} keyboardType="numeric"/><View style={[s.row,{justifyContent:'flex-end',marginVertical:8}]}>{[["1","٢٤ ساعة"],["3","٣ أيام"],["7","٧ أيام"],["30","٣٠ يوم"]].map(([d,l]:any)=><Chip key={d} label={l} selected={duration===d} onPress={()=>setDuration(d)}/>)}</View><Field label="الحد الأقصى لعدد الاستخدامات (اختياري)" value={maxUses} onChangeText={setMaxUses} keyboardType="numeric" placeholder="اتركه فارغاً لاستخدام غير محدود"/><Toggle label="بث إشعار منبثق فوري بهذا الكود" value={popup} onChange={setPopup}/><Button title="إنشاء الكوبون" onPress={addCoupon} style={{marginTop:8}}/></View><Txt style={s.section}>الكوبونات الحالية</Txt>{state.coupons.map((c:Coupon)=><View key={c.code} style={s.card}><View style={s.row}><Pressable onPress={()=>confirmAction('حذف الكوبون',`حذف الكوبون «${c.code}»؟`,()=>{setState((x:AppState)=>({...x,coupons:x.coupons.filter(y=>y.code!==c.code)}));onCouponDelete?.(c.code);notify('تم حذف الكوبون')})} style={{minWidth:50,minHeight:44,justifyContent:'center'}}><Txt style={{color:C.red}}>حذف</Txt></Pressable><Toggle label={c.active?'نشط':'متوقف'} value={c.active} onChange={(v:boolean)=>{setState((x:AppState)=>({...x,coupons:x.coupons.map(y=>y.code===c.code?{...y,active:v}:y)}));onCouponChange?.({...c,active:v})}}/><View style={{flex:1}}><Txt style={{fontWeight:'900',color:C.navy}}>{c.code}</Txt><Txt style={s.small}>{c.type==='percent'?`${c.value}%`:`${money(c.value)}`} خصم · الحد الأدنى {money(c.minimum)}</Txt><Txt style={s.small}>{c.expiresAt>Date.now()?`متبقي ${expires(c)} يوم`:'منتهي'} · الاستخدام {c.uses} من {c.maxUses||'غير محدود'}</Txt></View></View></View>)}</>}
 </ScrollView><CloudMediaPickerModal visible={cloudPickerConfig.visible} title={cloudPickerConfig.title} onSelect={cloudPickerConfig.onSelect} onClose={() => setCloudPickerConfig(prev => ({ ...prev, visible: false }))} /></View>}
function LoyaltySettings({state,setState,onSave,notify}:any){const [earnRate,setEarnRate]=useState(String(state.earnRate));const [specialEarnRate,setSpecialEarnRate]=useState(String(state.specialEarnRate));const [pointValue,setPointValue]=useState(String(state.pointValue));const [minPoints,setMinPoints]=useState(String(state.minPoints));useEffect(()=>{setEarnRate(String(state.earnRate));setSpecialEarnRate(String(state.specialEarnRate));setPointValue(String(state.pointValue));setMinPoints(String(state.minPoints))},[state.earnRate,state.specialEarnRate,state.pointValue,state.minPoints]);const rate=Number(earnRate);const specialRate=Number(specialEarnRate);const pointValueNumber=Number(pointValue)||0;const minimum=Number(minPoints);const integerText=(value:string)=>value.replace(/[٠-٩]/g,digit=>String(digit.charCodeAt(0)-1632)).replace(/[۰-۹]/g,digit=>String(digit.charCodeAt(0)-1776)).replace(/[^0-9]/g,'');const save=()=>{if(!Number.isInteger(rate)||rate<=0||!Number.isInteger(specialRate)||specialRate<0||pointValueNumber<=0||!Number.isInteger(minimum)||minimum<=0)return Alert.alert('إعدادات غير صالحة','اكتب أعداداً صحيحة للنقاط والحد الأدنى، وقيمة موجبة لقيمة النقطة.');setState((current:AppState)=>({...current,earnRate:rate,specialEarnRate:specialRate,pointValue:pointValueNumber,minPoints:minimum}));Promise.resolve(onSave?.({enabled:state.loyalty,pointValue:pointValueNumber,earnRate:rate,specialEarnRate:specialRate,minPoints:minimum})).then(()=>notify('تم حفظ إعدادات الولاء')).catch(()=>{})};return <><ScreenTitle title="إعدادات برنامج الولاء" subtitle="تحكم في كسب النقاط وقيمتها النقدية"/><View style={s.card}><Toggle label="تفعيل برنامج الولاء" value={state.loyalty} onChange={(value:boolean)=>setState((current:AppState)=>({...current,loyalty:value}))}/><Field label="النقاط لكل وحدة من المنتج العادي" value={earnRate} onChangeText={(value:string)=>setEarnRate(integerText(value))} keyboardType="numeric"/><Field label="النقاط لكل وحدة من الأصناف الخاصة" value={specialEarnRate} onChangeText={(value:string)=>setSpecialEarnRate(integerText(value))} keyboardType="numeric"/><Txt style={[s.small,{marginBottom:10}]}>الأصناف الخاصة: صدور بالعظم، الكبدة، القوانص، الدبابيس، المفروم، الفخايد، الوراك بالعظم، الأجنحة والمشكل.</Txt><Field label="قيمة النقطة الواحدة بالجنيه" value={pointValue} onChangeText={setPointValue} keyboardType="numeric"/><Field label="الحد الأدنى للنقاط للاستبدال" value={minPoints} onChangeText={(value:string)=>setMinPoints(integerText(value))} keyboardType="numeric"/><View style={{backgroundColor:C.surfaceAlt,borderRadius:16,padding:14,marginTop:4}}><Txt style={{fontWeight:'900',color:C.navy}}>معاينة الإعدادات</Txt><Txt style={{fontSize:12,color:C.muted,marginTop:5}}>المنتج العادي: {Number.isInteger(rate)?rate:0} نقطة · الأصناف الخاصة: {Number.isInteger(specialRate)?specialRate:0} نقطة لكل وحدة</Txt><Txt style={{fontWeight:'900',color:C.green,marginTop:8}}>كل {pointValueNumber>0?Math.round(1/pointValueNumber):'—'} نقطة = ١ جنيه · رصيدك الحالي يساوي {money(state.points*pointValueNumber)}</Txt></View><Button title="حفظ إعدادات الولاء" onPress={save} style={{marginTop:10}}/></View></>}

function BannerAdminRow({banner,onUpdate,onDelete,onPickCloud}:any){
 const [editing,setEditing]=useState(false);
 const [title,setTitle]=useState(banner.title);
 const [subtitle,setSubtitle]=useState(banner.subtitle||'');
 const [imageUri,setImageUri]=useState(banner.imageUri||'');
 return <View style={s.card}>
  <View style={s.row}>
   <Pressable onPress={onDelete} style={{minWidth:50,minHeight:44,justifyContent:'center'}}><Txt style={{color:C.red}}>حذف</Txt></Pressable>
   <Pressable onPress={()=>setEditing((x:boolean)=>!x)} style={{padding:8,minHeight:44,justifyContent:'center'}}><Txt style={{color:C.blue,fontWeight:'800'}}>{editing?'إلغاء':'تعديل'}</Txt></Pressable>
   <Toggle label="ظاهر" value={banner.active} onChange={(v:boolean)=>onUpdate({...banner,active:v})}/>
   <View style={{flex:1,alignItems:'flex-end'}}><Txt style={{fontWeight:'900'}}>{banner.title}</Txt><Txt style={s.small}>{banner.subtitle}</Txt></View>
   <View style={{width:48,height:36,borderRadius:8,overflow:'hidden',backgroundColor:C.navy,marginStart:6}}><Image source={banner.imageUri?{uri:banner.imageUri}:images[banner.image]||images['hero-chicken']} resizeMode="cover" style={{width:'100%',height:'100%'}}/></View>
  </View>
  {editing&&<View style={{marginTop:10,borderTopWidth:1,borderColor:C.line,paddingTop:10}}>
   <Field label="عنوان البانر" value={title} onChangeText={setTitle}/>
   <Field label="الوصف" value={subtitle} onChangeText={setSubtitle}/>
   <Button title="☁️ اختيار من مكتبة السحابة" secondary onPress={()=>onPickCloud?.(setImageUri)} style={{marginBottom:8}}/><Field label="رابط مباشر لصورة البانر (URL)" value={imageUri} onChangeText={setImageUri} placeholder="https://.../banner.jpg"/>
   {!!imageUri&&<Pressable onPress={()=>setImageUri('')} style={{paddingVertical:3,marginBottom:4}}><Txt style={{color:C.red,fontSize:11,fontWeight:'700'}}>إزالة الرابط المخصص</Txt></Pressable>}
   <Button title="⚡ رفع صورة البانر للسحابة فوراً" onPress={async()=>{try{const url=await pickAndUploadToCloud(title||banner.title,"banner");if(url){setImageUri(url);Alert.alert("تم الرفع السحابي ⚡","تم رفع صورة البانر للسحابة بنجاح.")}}catch(e:any){Alert.alert("تعذر الرفع",e?.message)}}} style={{backgroundColor:C.action,marginBottom:8}}/>
    <Button title="اختيار صورة من الجهاز" secondary onPress={async()=>{try{const uri=await pickCompressedImage();if(uri)setImageUri(uri)}catch(e:any){Alert.alert('تعذر تجهيز الصورة',e?.message)}}}/>
   {!!imageUri&&<View style={{height:90,marginVertical:8,borderRadius:8,overflow:'hidden',backgroundColor:C.navy,justifyContent:'center',alignItems:'center'}}><Image source={{uri:imageUri}} resizeMode="contain" style={{width:'100%',height:'100%'}}/></View>}
   <Button title="حفظ تعديل البانر" onPress={()=>{onUpdate({...banner,title:title.trim()||banner.title,subtitle:subtitle.trim(),imageUri:imageUri.trim()||undefined});setEditing(false)}} style={{marginTop:8}}/>
  </View>}
 </View>;
}

function OrderAdmin({ order, onStatus }: any) {
  const [expanded, setExpanded] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);

  const isPending = isOrderPending(order.status) || order.status === 'قيد المراجعة والتجهيز';
  const isPreparing = order.status === 'جاري التجهيز';
  const isDelivering = order.status === 'خرج للتوصيل';
  const isDelivered = /تم التسليم|مكتمل/.test(order.status);
  const isCancelled = order.status === 'ملغي';

  const orderTime = order.createdAt ? new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '';
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG') : '';
  const minutesAgo = Math.floor((Date.now() - (order.createdAt || Date.now())) / 60000);

  const isPickup = (order.address || '').includes('فرع') && !(order.address || '').includes('·');
  const channelBadge = isPickup ? '🏪 استلام من الفرع' : '🛵 توصيل منزلي';

  const handleAction = async (nextStatus: string) => {
    if (loadingStatus) return;
    setLoadingStatus(nextStatus);
    try {
      await onStatus(nextStatus);
    } finally {
      setLoadingStatus(null);
    }
  };

  const copyPreparationSlip = async () => {
    const itemsText = (order.items || [])
      .map((item: any, i: number) => {
        let prepStr = item.selectedPrep || '';
        if (item.selectedSubOption) prepStr += ` (${item.selectedSubOption})`;
        if (item.size && item.size !== 'عادي') prepStr += ` [حجم: ${item.size}]`;
        let line = `- ${formatItemNaturalTitle(item)}`;
        if (prepStr) line += `\n   ✂ التجهيز: ${prepStr}`;
        if (item.note) line += `\n   ⚠ ملاحظة: ${item.note}`;
        return line;
      })
      .join('\n');

    const slip = [
      `🍗 بون تجهيز - طيور الرشيدي 🍗`,
      `رقم الطلب: #${order.id}`,
      `العميل: ${order.customer || 'عميل'}`,
      `الهاتف: ${order.phone || '—'}`,
      `القناة: ${channelBadge}`,
      `العنوان: ${order.address || 'استلام من الفرع'}`,
      `طريقة الدفع: ${order.payment || 'كاش'}`,
      `موعد الاستلام: ${order.schedule || 'فوري'}`,
      order.note ? `ملاحظات عامة: ${order.note}` : null,
      `--------------------------------`,
      `الأصناف المطلوبة (${order.items?.length || 0}):`,
      itemsText,
      `--------------------------------`,
      `قيمة المنتجات: ${money(order.subtotal)}`,
      order.discount > 0 ? `الخصم: ${money(order.discount)}` : null,
      order.deliveryFee ? `التوصيل: ${money(order.deliveryFee)}` : null,
      `الإجمالي: ${money(order.total)}`,
      `* الحساب النهائي بالوزن عند الاستلام`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await Clipboard.setStringAsync(slip);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      Alert.alert('تم نسخ البون 📋', 'تم نسخ بون تجهيز الطلب بالكامل للحافظة، يمكنك لصقه الآن في واتساب أو إرساله للمجهز أو الطابعة.');
    } catch (e: any) {
      Alert.alert('تعذر النسخ', e?.message || 'حاول مرة أخرى');
    }
  };

  const openCustomerWhatsApp = () => {
    const rawPhone = String(order.phone || '').replace(/\D/g, '');
    let phone = rawPhone;
    if (phone.startsWith('01')) {
      phone = '20' + phone.slice(1);
    } else if (!phone.startsWith('20') && phone.length === 10) {
      phone = '20' + phone;
    }

    const itemsSummary = (order.items || [])
      .map((it: any) => `• ${formatItemNaturalTitle(it)}${it.selectedPrep ? ` - ${it.selectedPrep}` : ''}`)
      .join('\n');

    const text = `السلام عليكم ورحمة الله أستاذ ${order.customer || ''} 🌸
مع حضرتك إدارة طيور الرشيدي بخصوص طلبكم رقم #${order.id}:
${itemsSummary}
📍 العنوان: ${order.address || 'استلام من الفرع'}
💰 الإجمالي: ${money(order.total)} (الحساب النهائي بالوزن عند الاستلام)

حالة طلبكم الآن: «${order.status}». نحن بخدمتكم دائماً لأي استفسار!`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('واتساب', 'تعذر فتح تطبيق واتساب مباشرة. تأكد من وجود التطبيق.');
    });
  };

  return (
    <View
      style={[
        s.card,
        isPending && { borderColor: C.green, borderWidth: 2, backgroundColor: 'rgba(35,122,87,0.03)' },
        isPreparing && { borderColor: '#1E3A8A', borderWidth: 1.5 },
        isDelivering && { borderColor: '#4F46E5', borderWidth: 1.5 },
      ]}
    >
      {/* Top Header Row */}
      <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={{ alignItems: 'flex-start' }}>
          <Txt style={{ fontWeight: '900', fontSize: 19, color: C.navy }}>{money(order.total)}</Txt>
          <Txt style={[s.small, { fontSize: 10, color: C.muted }]}>الحساب بالوزن</Txt>
        </View>

        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
          <Txt style={{ fontWeight: '900', color: C.navy, fontSize: 17 }}>طلب #{order.id}</Txt>
          {isPending && (
            <View style={{ backgroundColor: C.green, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
              <Txt style={{ color: C.white, fontWeight: '900', fontSize: 11 }}>جديد ⚡</Txt>
            </View>
          )}
          <View style={{ backgroundColor: isPickup ? 'rgba(23,74,156,0.12)' : 'rgba(35,122,87,0.12)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 }}>
            <Txt style={{ color: isPickup ? C.navy : C.green, fontWeight: '800', fontSize: 10 }}>{channelBadge}</Txt>
          </View>
        </View>
      </View>

      {/* Customer Info & Time */}
      <View style={{ marginTop: 8, paddingBottom: 8, borderBottomWidth: 1, borderColor: C.line, gap: 3 }}>
        <Txt style={[s.small, { textAlign: 'right' }]}>
          العميل: <Txt style={{ fontWeight: '800', color: C.navy }}>{order.customer || 'عميل'}</Txt> · {order.phone || '—'}{order.email ? ` · ${order.email}` : ''}
        </Txt>
        <Txt style={[s.small, { textAlign: 'right', color: C.muted }]}>
          التوقيت: {orderDate} {orderTime} ({minutesAgo < 1 ? 'وصل للتو ⚡' : minutesAgo < 60 ? `منذ ${minutesAgo} دقيقة` : `منذ ${Math.floor(minutesAgo / 60)} ساعة`})
        </Txt>
        <Txt style={{ textAlign: 'right', color: C.ink, marginTop: 2, fontSize: 12 }}>
          📍 العنوان: <Txt style={{ fontWeight: '700' }}>{order.address || 'استلام من الفرع'}</Txt>
        </Txt>
        <Txt style={[s.small, { textAlign: 'right', color: C.muted }]}>
          طريقة الدفع: <Txt style={{ fontWeight: '700', color: C.ink }}>{order.payment}</Txt> · موعد الاستلام: <Txt style={{ fontWeight: '700', color: C.ink }}>{order.schedule}</Txt>
        </Txt>
      </View>

      {/* Quick Communication & Print Toolbar */}
      <View style={[s.row, { gap: 6, marginVertical: 8, justifyContent: 'space-between' }]}>
        <Pressable
          onPress={copyPreparationSlip}
          style={({ pressed }) => [
            {
              flex: 1,
              backgroundColor: C.surfaceAlt,
              borderWidth: 1,
              borderColor: C.border,
              paddingVertical: 7,
              paddingHorizontal: 6,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Txt style={{ fontSize: 11, fontWeight: '800', color: C.navy }}>📋 نسخ البون</Txt>
        </Pressable>

        <Pressable
          onPress={openCustomerWhatsApp}
          style={({ pressed }) => [
            {
              flex: 1,
              backgroundColor: '#DCFCE7',
              borderWidth: 1,
              borderColor: '#86EFAC',
              paddingVertical: 7,
              paddingHorizontal: 6,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Txt style={{ fontSize: 11, fontWeight: '800', color: '#15803D' }}>💬 واتساب</Txt>
        </Pressable>

        <Pressable
          onPress={() => Linking.openURL(`tel:${order.phone || ''}`)}
          style={({ pressed }) => [
            {
              flex: 1,
              backgroundColor: '#EFF6FF',
              borderWidth: 1,
              borderColor: '#BFDBFE',
              paddingVertical: 7,
              paddingHorizontal: 6,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Txt style={{ fontSize: 11, fontWeight: '800', color: '#1D4ED8' }}>📞 اتصال</Txt>
        </Pressable>

        <Pressable
          onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(order.address)}`).catch(() => Alert.alert('العنوان', order.address))}
          style={({ pressed }) => [
            {
              flex: 0.8,
              backgroundColor: C.surfaceAlt,
              borderWidth: 1,
              borderColor: C.border,
              paddingVertical: 7,
              paddingHorizontal: 4,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Txt style={{ fontSize: 11, fontWeight: '800', color: C.navy }}>📍 الخريطة</Txt>
        </Pressable>
      </View>

      {/* Primary Manager Action Progression Button */}
      {isPending && (
        <View style={{ marginVertical: 6 }}>
          <Pressable
            disabled={!!loadingStatus}
            onPress={() => handleAction('جاري التجهيز')}
            style={({ pressed }) => [
              {
                backgroundColor: C.green,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loadingStatus === 'جاري التجهيز' ? 0.7 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Txt style={{ color: C.white, fontWeight: '900', fontSize: 14 }}>
              {loadingStatus === 'جاري التجهيز' ? 'جارٍ استلام الطلب وبدء التجهيز…' : '📥 استلام الطلب وبدء التجهيز ➔'}
            </Txt>
          </Pressable>
        </View>
      )}

      {isPreparing && (
        <View style={{ marginVertical: 6 }}>
          <Pressable
            disabled={!!loadingStatus}
            onPress={() => handleAction('خرج للتوصيل')}
            style={({ pressed }) => [
              {
                backgroundColor: '#1E3A8A',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loadingStatus === 'خرج للتوصيل' ? 0.7 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Txt style={{ color: C.white, fontWeight: '900', fontSize: 14 }}>
              {loadingStatus === 'خرج للتوصيل' ? 'جارٍ تسليم الطلب للمندوب…' : '🛵 تسليم للمندوب (خرج للتوصيل) ➔'}
            </Txt>
          </Pressable>
        </View>
      )}

      {isDelivering && (
        <View style={{ marginVertical: 6 }}>
          <Pressable
            disabled={!!loadingStatus}
            onPress={() => handleAction('تم التسليم')}
            style={({ pressed }) => [
              {
                backgroundColor: '#059669',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loadingStatus === 'تم التسليم' ? 0.7 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Txt style={{ color: C.white, fontWeight: '900', fontSize: 14 }}>
              {loadingStatus === 'تم التسليم' ? 'جارٍ تأكيد اكتمال الطلب…' : '✅ تأكيد اكتمال وتسليم الطلب للعميل'}
            </Txt>
          </Pressable>
        </View>
      )}

      {isDelivered && (
        <View style={{ marginVertical: 4, paddingVertical: 6, backgroundColor: 'rgba(5,150,105,0.1)', borderRadius: 10, alignItems: 'center' }}>
          <Txt style={{ color: '#059669', fontWeight: '900', fontSize: 13 }}>✓ تم تسليم الطلب للعميل بنجاح</Txt>
        </View>
      )}

      {/* Manual Status Selector */}
      <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderColor: C.line }}>
        <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }]}>
          <View
            style={{
              backgroundColor: isPending ? 'rgba(35,122,87,0.15)' : isPreparing ? 'rgba(30,58,138,0.12)' : isDelivered ? 'rgba(5,150,105,0.15)' : isCancelled ? 'rgba(214,40,50,0.12)' : 'rgba(217,119,6,0.12)',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 10,
            }}
          >
            <Txt style={{ fontWeight: '900', fontSize: 11, color: isPending ? C.green : isPreparing ? '#1E3A8A' : isDelivered ? '#059669' : isCancelled ? C.red : '#B45309' }}>
              {order.status}
            </Txt>
          </View>
          <Txt style={[s.small, { fontSize: 11 }]}>الحالة الحالية والتعديل اليدوي:</Txt>
        </View>

        <View style={[s.row, { flexWrap: 'wrap', justifyContent: 'flex-end', gap: 4 }]}>
          {['قيد المراجعة والتجهيز', 'جاري التجهيز', 'خرج للتوصيل', 'تم التسليم', 'ملغي'].map((status: string) => (
            <Chip
              key={status}
              label={status}
              selected={order.status === status}
              onPress={() => {
                if (order.status !== status && !loadingStatus) handleAction(status);
              }}
            />
          ))}
        </View>
      </View>

      {/* Toggle Expand Items */}
      <Pressable
        onPress={() => setExpanded((value) => !value)}
        style={{
          marginTop: 8,
          paddingVertical: 8,
          backgroundColor: C.surfaceAlt,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Txt style={{ color: C.navy, fontWeight: '800', fontSize: 12 }}>
          {expanded ? '▲ إخفاء تفاصيل الأصناف والملاحظات' : `▼ عرض أصناف الطلب (${order.items?.length || 0}) والملاحظات`}
        </Txt>
      </Pressable>

      {/* Expanded Items & Breakdown */}
      {expanded && (
        <View style={{ borderTopWidth: 1, borderColor: C.line, paddingTop: 10, marginTop: 8 }}>
          <Txt style={{ fontWeight: '900', marginBottom: 6, textAlign: 'right' }}>أصناف الطلب (${order.items?.length || 0}):</Txt>
          {order.items.map((item: any, index: number) => (
            <View key={item.id || index} style={{ paddingVertical: 7, borderBottomWidth: 1, borderColor: C.line }}>
              <Txt style={{ fontWeight: '800', textAlign: 'right', fontSize: 14 }}>
                - {formatItemNaturalTitle(item)}
              </Txt>
              {!!item.selectedPrep && (
                <Txt style={[s.small, { textAlign: 'right', color: C.green, fontWeight: '700' }]}>
                  ✂ التجهيز: {item.selectedPrep}
                  {item.selectedSubOption ? ` · ${item.selectedSubOption}` : ''}
                </Txt>
              )}
              {!!item.note && <Txt style={[s.small, { textAlign: 'right', color: C.gold, fontWeight: '700' }]}>ملاحظة خاصة: {item.note}</Txt>}
              <Txt style={[s.small, { textAlign: 'right', fontWeight: '700' }]}>{money(item.price * item.quantity)}</Txt>
            </View>
          ))}
          <View style={{ marginTop: 8, gap: 4, alignItems: 'flex-end' }}>
            <Txt>قيمة المنتجات: {money(order.subtotal)}</Txt>
            {order.couponCode ? <Txt>الكوبون: {order.couponCode}</Txt> : null}
            {order.discount > 0 && <Txt style={{ color: C.green }}>إجمالي الخصم: {money(order.discount)}</Txt>}
            <Txt>رسوم التوصيل: {money(order.deliveryFee || 0)}</Txt>
            <Txt style={{ fontWeight: '900', fontSize: 16, color: C.navy }}>الإجمالي المطلوب: {money(order.total)}</Txt>
            {order.pointsUsed ? <Txt style={s.small}>نقاط مستخدمة: {order.pointsUsed}</Txt> : null}
            {order.pointsEarned ? <Txt style={s.small}>نقاط متوقعة بعد التسليم: {order.pointsEarned}</Txt> : null}
            {!!order.note && <Txt style={{ color: C.red, fontWeight: '700', marginTop: 4 }}>ملاحظات العميل: {order.note}</Txt>}
          </View>
        </View>
      )}
      {/* Thermal Receipt Print Button */}
      <Pressable
        onPress={() => printFullOrder(order)}
        style={({ pressed }) => [
          {
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 7,
            paddingHorizontal: 16,
            marginTop: 8,
            borderRadius: 10,
            backgroundColor: 'rgba(23,74,156,0.08)',
            alignSelf: 'center',
            borderWidth: 1.2,
            borderColor: C.blue,
            opacity: pressed ? 0.6 : 1,
          },
        ]}
      >
        <Ionicons name="receipt-outline" size={15} color={C.blue} />
        <Txt style={{ fontSize: 12, color: C.blue, fontWeight: '900' }}>
          طباعة بون التجهيز (Xprinter 80mm) 🖨️
        </Txt>
      </Pressable>
    </View>
  );
}
function ProductAdmin({product,onChange,onDelete,badges=[],onPickCloud}:any){
 const [editing,setEditing]=useState(false);
 const [name,setName]=useState(product.name);
 const [subtitle,setSubtitle]=useState(product.subtitle||'');
 const [price,setPrice]=useState(String(product.price));
 const [originalPrice,setOriginalPrice]=useState(String(product.originalPrice||''));
 const [piecePrice,setPiecePrice]=useState(String(product.piecePrice||''));
 const [originalPiecePrice,setOriginalPiecePrice]=useState(String(product.originalPiecePrice||''));
 const [badge,setBadge]=useState(product.badge||'');const [badgeColor,setBadgeColor]=useState(product.badgeColor||'#237A57');
 const [weightNote,setWeightNote]=useState(product.weightNote||'');
 const [available,setAvailable]=useState(Boolean(product.available));
 const [sizes,setSizes]=useState((product.sizes||[]).join(', '));const [hasSizes,setHasSizes]=useState(Boolean(product.sizes?.length));
 const isWholeBird=product.category==='فراخ'||product.category==='بط';
 const initialPrepText=Array.isArray(product.prepGroups)?product.prepGroups.map((group:any)=>group.subOptions?.length?`${group.label}:${group.subOptions.join(',')}`:group.label).join('; '):(isWholeBird?birdPrepText:'');
 const [prepText,setPrepText]=useState(initialPrepText);
 const [category,setCategory]=useState(product.category);
 const [image,setImage]=useState(product.image||'chicken');const [imageUri,setImageUri]=useState(product.imageUri||'');
 const [unit,setUnit]=useState(product.unit||'كيلو');
 const [allowKilo,setAllowKilo]=useState(product.allowSellingByKilo!==false);
 const [allowPiece,setAllowPiece]=useState(Boolean(product.allowSellingByPiece));
 const [allowHalf,setAllowHalf]=useState(product.allowHalfUnit!==false);
 const [featured,setFeatured]=useState(Boolean(product.featured));
 const [offer,setOffer]=useState(Boolean(product.offer));
 const [offerDescription,setOfferDescription]=useState(product.offerDescription||'');
 const categories=productCategories.filter((item:string)=>item!=='الكل');
 const imagesList=['chicken','duck','pigeon','panee','shish','wings','drumsticks',...productImageKeys];
 const save=()=>{
  const prepGroups=prepText.trim()?prepText.split(';').map((part:string)=>part.trim()).filter(Boolean).map((entry:string)=>{
   const parts=entry.split(':');const label=parts.shift()?.trim()||'تجهيز';const subOptions=parts.join(':').split(',').map((item:string)=>item.trim()).filter(Boolean);
   const type=label.includes('تقطيع')?'CUT':label.includes('خلي')?'DEBONED':label.includes('سلخ')?'SKINNED':label.includes('نصف')?'HALF_LENGTHWISE':label.includes('تنظيف')?'CLEAN':label.includes('متبل')?'READY':'WHOLE';
   return {type,label,subOptions};
  }):[];
  onChange({...product,name:name.trim()||product.name,subtitle:subtitle.trim(),category,price:Number(price)||product.price,originalPrice:Number(originalPrice)||undefined,piecePrice:Number(piecePrice)||undefined,originalPiecePrice:Number(originalPiecePrice)||undefined,badge:badge.trim()||undefined,badgeColor,weightNote:weightNote.trim(),sizes:hasSizes?sizes.split(',').map((item:string)=>item.trim()).filter(Boolean):[],prepGroups,allowSellingByKilo:allowKilo,allowSellingByPiece:allowPiece,allowHalfUnit:allowHalf,unit:unit.trim()||'كيلو',featured,offer,offerDescription:offerDescription.trim()||undefined,image,imageUri,available});
  setEditing(false);
 };
 return <View style={s.card}>
  <View style={s.row}>
   <Pressable onPress={onDelete} style={{minWidth:44,minHeight:44,justifyContent:'center'}}><Txt style={{color:C.red}}>حذف</Txt></Pressable>
   <Pressable onPress={()=>{const next=!product.available;setAvailable(next);onChange({...product,available:next})}} style={{minWidth:70,minHeight:44,justifyContent:'center'}}><Txt style={{color:product.available?C.green:C.red,fontSize:12,fontWeight:'800'}}>{product.available?'متوفر':'نفد'}</Txt></Pressable>
   <Pressable onPress={()=>setEditing(value=>!value)} style={{minWidth:44,minHeight:44,justifyContent:'center'}}><Txt style={{color:C.blue}}>تعديل</Txt></Pressable>
   <View style={{flex:1,flexDirection:'row-reverse',alignItems:'center',gap:10}}><Image accessibilityLabel={`صورة ${product.name}`} source={product.imageUri?{uri:product.imageUri}:images[product.image]||images.chicken} resizeMode="cover" style={{width:56,height:56,borderRadius:12,backgroundColor:C.line}}/><View style={{flex:1,alignItems:'flex-end'}}><Txt style={{fontWeight:'800'}}>{product.name}</Txt><Txt style={s.small}>{money(product.price)} · الوحدة: {product.unit||'كيلو'}{product.piecePrice?` · ${money(product.piecePrice)} للقطعة`:''} · {product.available?'متوفر للطلب':'نفد مؤقتاً'} · {product.badge||'بلا شارة'}</Txt></View></View>
  </View>
  {editing&&<View style={{marginTop:8}}>
   <Field label="اسم المنتج" value={name} onChangeText={setName}/><Field label="الوصف المختصر" value={subtitle} onChangeText={setSubtitle}/>
   <Txt style={{fontWeight:'800',marginTop:4}}>القسم</Txt><ScrollView horizontal showsHorizontalScrollIndicator={false}>{categories.map((item:string)=><Chip key={item} label={item} selected={category===item} onPress={()=>setCategory(item)}/>)}</ScrollView>
   <Field label="سعر الكيلو الحالي" value={price} onChangeText={setPrice} keyboardType="decimal-pad"/><Field label="سعر الكيلو قبل الخصم" value={originalPrice} onChangeText={setOriginalPrice} keyboardType="decimal-pad"/>
   <Field label="سعر القطعة" value={piecePrice} onChangeText={setPiecePrice} keyboardType="decimal-pad"/><Field label="سعر القطعة قبل الخصم" value={originalPiecePrice} onChangeText={setOriginalPiecePrice} keyboardType="decimal-pad"/>
   <Toggle label="السماح بالبيع بالكيلو" value={allowKilo} onChange={setAllowKilo}/><Toggle label="السماح بالبيع بالقطعة" value={allowPiece} onChange={setAllowPiece}/><Toggle label="السماح بنصف الكيلو" value={allowHalf} onChange={setAllowHalf}/>
   <Txt style={{fontWeight:'800',marginTop:8}}>اسم الوحدة للمنتج</Txt>
   <Txt style={s.small}>اختر وحدة أو اكتب اسماً مخصصاً (كيلو، قطعة، طبق، جوز، فرخة، علبة…):</Txt>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:6,paddingVertical:6}}>
    {['كيلو','قطعة','طبق','جوز','طائر','فرخة','علبة','كيس','درزن'].map((presetUnit:string)=><Chip key={presetUnit} label={presetUnit} selected={unit===presetUnit} onPress={()=>setUnit(presetUnit)}/>)}
   </ScrollView>
   <Field label="اسم الوحدة مخصصاً (مثال: كيلو، قطعة، طبق، جوز…)" value={unit} onChangeText={setUnit} placeholder="كيلو، قطعة، طبق…"/>
   <Toggle label="المنتج متاح للطلب" value={available} onChange={setAvailable}/><Field label="شارة المنتج" value={badge} onChangeText={setBadge} placeholder="طازج اليوم، الأكثر طلباً، توفير"/><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingVertical:8}}>{badges.map((item:BadgeOption)=><Pressable key={item.name} onPress={()=>{setBadge(item.name);setBadgeColor(item.color)}} style={{backgroundColor:item.color,borderRadius:12,paddingHorizontal:10,paddingVertical:7,borderWidth:badge===item.name?2:0,borderColor:C.ink}}><Txt style={{color:C.white,fontWeight:"900"}}>{item.name}</Txt></Pressable>)}</ScrollView><Field label="ملاحظة الوزن والتسعير" value={weightNote} onChangeText={setWeightNote} placeholder="الوزن تقريبي والحساب بعد الوزن الفعلي"/><Toggle label="تفعيل اختيار الأوزان/الأحجام لهذا المنتج" value={hasSizes} onChange={setHasSizes}/>{hasSizes&&<Field label="الأوزان المتاحة، افصل بينها بفاصلة" value={sizes} onChangeText={setSizes} placeholder="1.2 كجم، 1.5 كجم، 2 كجم"/>}
   <View style={{marginTop:8,marginBottom:4}}>
    <Txt style={{fontWeight:'800',marginBottom:4}}>خيارات التجهيز والتقطيع</Txt>
    <Txt style={s.small}>اختر نموذجاً جاهزاً بضغطة واحدة، أو اكتب خيارات مخصصة، أو اضغط «بدون خيارات» لإزالتها تماماً:</Txt>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:6,paddingVertical:6}}>
     <Pressable onPress={()=>setPrepText('')} style={{backgroundColor:!prepText.trim()?C.red:'#FEE2E2',paddingHorizontal:10,paddingVertical:6,borderRadius:10}}><Txt style={{color:!prepText.trim()?C.white:C.red,fontSize:11,fontWeight:'900'}}>🚫 بدون خيارات (إلغاء التجهيزات)</Txt></Pressable>
     <Pressable onPress={()=>setPrepText(birdPrepText)} style={{backgroundColor:C.surfaceAlt,paddingHorizontal:10,paddingVertical:6,borderRadius:10,borderWidth:1,borderColor:C.border}}><Txt style={{color:C.navy,fontSize:11,fontWeight:'700'}}>🍗 دواجن كاملة</Txt></Pressable>
     <Pressable onPress={()=>setPrepText('سليم; تقطيع:شرائح بانيه رقيقة,قطع شيش,مكعبات طهي; مفروم:ناعم,خشن')} style={{backgroundColor:C.surfaceAlt,paddingHorizontal:10,paddingVertical:6,borderRadius:10,borderWidth:1,borderColor:C.border}}><Txt style={{color:C.navy,fontSize:11,fontWeight:'700'}}>🥩 بانيه وشيش ومفروم</Txt></Pressable>
     <Pressable onPress={()=>setPrepText('سليم (تنظيف كامل); تقطيع:نصفين بالطول,4 قطع,8 قطع')} style={{backgroundColor:C.surfaceAlt,paddingHorizontal:10,paddingVertical:6,borderRadius:10,borderWidth:1,borderColor:C.border}}><Txt style={{color:C.navy,fontSize:11,fontWeight:'700'}}>🦆 بط وأرانب وحمام</Txt></Pressable>
     <Pressable onPress={()=>setPrepText('تجهيز وتنظيف:تنظيف كامل جاهز للطهي,تتبيلة خاصة')} style={{backgroundColor:C.surfaceAlt,paddingHorizontal:10,paddingVertical:6,borderRadius:10,borderWidth:1,borderColor:C.border}}><Txt style={{color:C.navy,fontSize:11,fontWeight:'700'}}>✨ تنظيف وتتبيل فقط</Txt></Pressable>
    </ScrollView>
    <Field label="نص خيارات التجهيز (افصل الطرق بـ ; والخيارات بـ ,)" value={prepText} onChangeText={setPrepText} placeholder="سليم; تقطيع:4 قطع,8 قطع; خلي:شيش طاووق"/>
    {!prepText.trim()&&<View style={{backgroundColor:'rgba(35,122,87,0.1)',padding:8,borderRadius:8,marginTop:-4,marginBottom:6}}><Txt style={{color:C.green,fontSize:11,fontWeight:'800'}}>✓ لا توجد خيارات تجهيز - سيتم إضافة المنتج للسلة بسعره مباشرة دون طلب اختيار طريقة تجهيز.</Txt></View>}
   </View>
   <Txt style={{fontWeight:'800',marginTop:8}}>صورة من مكتبة المتجر</Txt><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,marginTop:6}}>{imagesList.map((key:string)=><Pressable key={key} accessibilityRole="button" accessibilityLabel={`اختيار صورة ${key.replace(/^product-/,'')}`} onPress={()=>{setImage(key);setImageUri('')}} style={{width:76,height:88,borderRadius:13,overflow:'hidden',alignItems:'center',borderWidth:image===key?2:1,borderColor:image===key?C.red:'#E2E8F0',padding:3}}><Image source={images[key]} resizeMode="cover" style={{width:64,height:60,borderRadius:9}}/><Txt numberOfLines={1} style={{fontSize:8,fontWeight:'700',width:'100%',textAlign:'center',marginTop:3}}>{key.replace(/^product-/,'')}</Txt></Pressable>)}</ScrollView>
   <Button title="⚡ رفع صورة جديدة لهذا الصنف للسحابة فوراً" onPress={async()=>{try{const url=await pickAndUploadToCloud(name||product.name,"product");if(url){setImageUri(url);Alert.alert("تم الرفع السحابي ⚡","تم رفع الصورة للسحابة وربطها بالمنتج وحفظها في المكتبة.")}}catch(e:any){Alert.alert("تعذر الرفع",e?.message)}}} style={{backgroundColor:C.action,marginBottom:8}}/>
   <Button title="☁️ اختيار من مكتبة السحابة" secondary onPress={()=>onPickCloud?.(setImageUri)} style={{marginBottom:8}}/><Field label="أو رابط مباشر لصورة المنتج (URL)" value={imageUri} onChangeText={setImageUri} placeholder="https://.../product.jpg"/>
   {!!imageUri&&<Pressable onPress={()=>setImageUri('')} style={{paddingVertical:4,marginBottom:6}}><Txt style={{color:C.red,fontSize:11,fontWeight:'700'}}>إزالة الرابط المخصص والعودة لأيقونة المتجر</Txt></Pressable>}
   <Button title="اختيار صورة من الجهاز" secondary onPress={async()=>{try{const uri=await pickCompressedImage();if(uri)setImageUri(uri)}catch(error:any){Alert.alert("تعذر تجهيز الصورة",error?.message||"اختر صورة أخرى.")}}}/>
   <View style={{height:120,marginVertical:8,alignItems:"center",justifyContent:"center",backgroundColor:C.surfaceAlt,borderRadius:12,borderWidth:1,borderColor:C.border,overflow:'hidden'}}><Image source={imageUri?{uri:imageUri}:images[image]||images.chicken} resizeMode="contain" style={{width:"100%",height:"100%"}}/></View>
   <Toggle label="تثبيت في شبكة الرئيسية" value={featured} onChange={setFeatured}/><Toggle label="عرض خاص" value={offer} onChange={setOffer}/>{offer&&<Field label="وصف العرض المختصر (يظهر على الكارت)" value={offerDescription} onChangeText={setOfferDescription} placeholder="اكتب تفاصيل أو وصف العرض..."/>}<Button title="حفظ جميع التعديلات" onPress={save}/>
  </View>}
 </View>;
}


function OffersManagerTab({ state, setState, onProductChange, notify }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // Explicit offers sorted by offerOrder
  const offers = useMemo(() => {
    return state.products
      .filter((p: Product) => p.offer === true)
      .sort((a: Product, b: Product) => (a.offerOrder ?? 999) - (b.offerOrder ?? 999));
  }, [state.products]);

  // Non-offer products for adding
  const nonOffers = useMemo(() => {
    return state.products.filter((p: Product) => {
      const notInOffers = !p.offer;
      const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
      const matchesSearch = !searchTerm.trim() || (p.name || '').includes(searchTerm.trim());
      return notInOffers && matchesCategory && matchesSearch;
    });
  }, [state.products, selectedCategory, searchTerm]);

  const moveOffer = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= offers.length) return;
    const reordered = [...offers];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const orderMap = new Map<string, number>();
    reordered.forEach((p, idx) => {
      orderMap.set(p.id, idx + 1);
    });

    const updatedProducts = state.products.map((p: Product) => {
      if (orderMap.has(p.id)) {
        const nextOrder = orderMap.get(p.id)!;
        return { ...p, offerOrder: nextOrder };
      }
      return p;
    });

    setState((cur: AppState) => ({ ...cur, products: updatedProducts }));
    reordered.forEach((p, idx) => {
      onProductChange?.({ ...p, offerOrder: idx + 1 });
    });
    notify?.('تم تحديث ترتيب العروض بنجاح ⚡');
  };

  const addProductToOffers = (p: Product) => {
    const nextOrder = offers.length + 1;
    const updated = {
      ...p,
      offer: true,
      offerOrder: nextOrder,
      badge: p.badge || 'عرض خاص 🔥',
      offerDescription: p.offerDescription || p.subtitle || 'طازج ومجهز خصيصاً على طلبك',
    };

    const updatedProducts = state.products.map((prod: Product) =>
      prod.id === p.id ? updated : prod
    );

    setState((cur: AppState) => ({ ...cur, products: updatedProducts }));
    onProductChange?.(updated);
    notify?.(`تمت إضافة «${p.name}» إلى قائمة العروض بالترتيب #${nextOrder}`);
  };

  const removeOffer = (p: Product) => {
    const updated = { ...p, offer: false, offerOrder: undefined };
    const updatedProducts = state.products.map((prod: Product) =>
      prod.id === p.id ? updated : prod
    );

    setState((cur: AppState) => ({ ...cur, products: updatedProducts }));
    onProductChange?.(updated);
    notify?.(`تمت إزالة «${p.name}» من العروض`);
  };

  const updateOfferField = (productId: string, field: 'badge' | 'offerDescription', value: string) => {
    const updatedProducts = state.products.map((p: Product) => {
      if (p.id === productId) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setState((cur: AppState) => ({ ...cur, products: updatedProducts }));
    const target = updatedProducts.find((p: Product) => p.id === productId);
    if (target) onProductChange?.(target);
  };

  return (
    <>
      <ScreenTitle
        title="إدارة وترتيب عروض التوفير"
        subtitle={`${offers.length} عروض مفعّلة تظهر في سكشن العروض أعلى الأكثر طلباً بالتسلسل المحدد أدناه`}
      />

      {/* Overview Note */}
      <View style={[s.card, { backgroundColor: 'rgba(245,158,11,0.08)', borderColor: '#F59E0B', borderWidth: 1.5, marginBottom: 12 }]}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.2)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="flame" size={22} color="#D97706" />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Txt style={{ color: '#B45309', fontWeight: '900', fontSize: 14 }}>تحكم كامل في سكشن عروض الصفحة الرئيسية</Txt>
            <Txt style={[s.small, { color: C.ink, marginTop: 2 }]}>
              استخدم أزرار «⬆️ تقديم» و «⬇️ تأخير» لترتيب ظهور المنتجات من اليمين إلى اليسار للعميل، واكتب وصف العرض الذي يظهر على الكارت الكبير مباشرة.
            </Txt>
          </View>
        </View>
      </View>

      {/* Current Active Offers List */}
      <View style={{ marginBottom: 16 }}>
        <Txt style={{ fontFamily: 'Rubik_700Bold', fontSize: 16, fontWeight: '900', color: C.navy, marginBottom: 8, textAlign: 'right' }}>
          الترتيب الحالي للعروض ({offers.length} منتج)
        </Txt>

        {offers.length === 0 ? (
          <View style={[s.card, { padding: 18, alignItems: 'center' }]}>
            <Txt style={{ color: C.muted, fontWeight: '700', textAlign: 'center' }}>
              لا توجد عروض مفعّلة حالياً. اختر من قائمة المنتجات بالأسفل لإضافتها إلى شريط العروض فوراً.
            </Txt>
          </View>
        ) : (
          offers.map((product: Product, index: number) => {
            const isFirst = index === 0;
            const isLast = index === offers.length - 1;

            return (
              <View
                key={product.id}
                style={[
                  s.card,
                  {
                    borderWidth: 1.5,
                    borderColor: '#F59E0B',
                    padding: 12,
                    marginBottom: 10,
                  },
                ]}>
                {/* Header Row: Rank badge, Reorder arrows & Remove */}
                <View
                  style={[
                    s.row,
                    {
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottomWidth: 1,
                      borderColor: C.border,
                      paddingBottom: 8,
                      marginBottom: 8,
                    },
                  ]}>
                  {/* Reorder Buttons & Delete */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Pressable
                      onPress={() => removeOffer(product)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: '#FEE2E2',
                      }}>
                      <Txt style={{ color: '#DC2626', fontSize: 11, fontWeight: '800' }}>❌ إزالة</Txt>
                    </Pressable>

                    <Pressable
                      disabled={isLast}
                      onPress={() => moveOffer(index, index + 1)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: isLast ? C.surfaceAlt : 'rgba(23,74,156,0.1)',
                        opacity: isLast ? 0.4 : 1,
                      }}>
                      <Txt style={{ color: C.action, fontSize: 12, fontWeight: '900' }}>⬇️ تأخير</Txt>
                    </Pressable>

                    <Pressable
                      disabled={isFirst}
                      onPress={() => moveOffer(index, index - 1)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: isFirst ? C.surfaceAlt : 'rgba(23,74,156,0.1)',
                        opacity: isFirst ? 0.4 : 1,
                      }}>
                      <Txt style={{ color: C.action, fontSize: 12, fontWeight: '900' }}>⬆️ تقديم</Txt>
                    </Pressable>
                  </View>

                  {/* Position Badge & Product Title */}
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        backgroundColor: '#D97706',
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}>
                      <Txt style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>
                        الترتيب #${index + 1}
                      </Txt>
                    </View>
                    <Txt style={{ fontWeight: '900', fontSize: 15, color: C.navy }}>
                      {product.name}
                    </Txt>
                  </View>
                </View>

                {/* Offer Fields: Badge & Custom Offer Description */}
                <View style={{ gap: 6 }}>
                  <Field
                    label="شارة العرض (تظهر في أعلى الصورة)"
                    value={product.badge || ''}
                    onChangeText={(text: string) => updateOfferField(product.id, 'badge', text)}
                    placeholder="مثال: عرض خاص 🔥 أو تتبيلة الشيف 🍢"
                  />
                  <Field
                    label="وصف العرض المختصر (يظهر على كارت العرض الكبير)"
                    value={product.offerDescription || product.subtitle || ''}
                    onChangeText={(text: string) => updateOfferField(product.id, 'offerDescription', text)}
                    placeholder="اكتب وصف العرض هنا (مثال: طازج ومتبل بخلطة خاصة، ذبح وتنظيف فوري)"
                  />
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Add New Product to Offers Section */}
      <View style={[s.card, { marginTop: 8 }]}>
        <Txt style={{ fontFamily: 'Rubik_700Bold', fontSize: 16, fontWeight: '900', color: C.navy, marginBottom: 4, textAlign: 'right' }}>
          ➕ إضافة منتج جديد لقائمة العروض
        </Txt>
        <Txt style={[s.small, { marginBottom: 8 }]}>
          اختر من أصناف المتجر لإضافته فوراً إلى شريط العروض بالصفحة الرئيسية:
        </Txt>

        <Field
          label="بحث في المنتجات المتاحة"
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="ابحث بالاسم (مثال: شيش، بانيه، بط...)"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 6, flexDirection: 'row-reverse' }}>
          {['الكل', 'فراخ', 'بط', 'رومي', 'حمام وسمان', 'متبلات', 'أجزاء دواجن'].map((cat: string) => (
            <Chip
              key={cat}
              label={cat}
              selected={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
            />
          ))}
        </ScrollView>

        <View style={{ gap: 8, marginTop: 6, maxHeight: 320 }}>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
            {nonOffers.slice(0, 15).map((p: Product) => (
              <View
                key={p.id}
                style={[
                  s.row,
                  {
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    borderBottomWidth: 1,
                    borderColor: C.border,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  },
                ]}>
                <Pressable
                  onPress={() => addProductToOffers(p)}
                  style={{
                    backgroundColor: '#059669',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}>
                  <Txt style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>+ إضافة للعروض</Txt>
                </Pressable>

                <View style={{ alignItems: 'flex-end', flex: 1, marginEnd: 10 }}>
                  <Txt style={{ fontWeight: '800', fontSize: 13, color: C.navy }}>{p.name}</Txt>
                  <Txt style={[s.small, { color: C.muted }]}>{p.category} · {p.subtitle || 'بدون وصف'}</Txt>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </>
  );
}

function StoriesAdminTab({
  state,
  setState,
  notify,
  onStoriesChange,
  openCloudPicker,
}: {
  state: AppState;
  setState: any;
  notify: (msg: string) => void;
  onStoriesChange?: (stories: AppStory[]) => void;
  openCloudPicker: (title: string, onSelect: (url: string) => void) => void;
}) {
  const stories: AppStory[] = state.stories && state.stories.length > 0 ? state.stories : defaultStories;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('طازة');
  const [icon, setIcon] = useState('flame');
  const [colorIndex, setColorIndex] = useState(0);
  const [actionType, setActionType] = useState<'category' | 'promo' | 'branch' | 'info'>('category');
  const [actionValue, setActionValue] = useState('فراخ');
  const [imageUri, setImageUri] = useState('');
  const [savingCloud, setSavingCloud] = useState(false);

  const storyColorThemes: [string, string][] = [
    ['#DC2626', '#F59E0B'],
    ['#D97706', '#EA580C'],
    ['#7C3AED', '#DB2777'],
    ['#2563EB', '#0284C7'],
    ['#059669', '#10B981'],
  ];

  const storyIconsList = [
    { name: 'flame', label: 'طازة 🔥' },
    { name: 'restaurant', label: 'شيف 🍴' },
    { name: 'gift', label: 'عروض 🎁' },
    { name: 'location', label: 'فروع 📍' },
    { name: 'shield-checkmark', label: 'نظافة 🛡️' },
    { name: 'star', label: 'مميز ⭐' },
    { name: 'ribbon', label: 'جودة 🎀' },
    { name: 'sparkles', label: 'حصري ✨' },
    { name: 'time', label: 'سريع ⏱️' },
  ];

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setDescription('');
    setBadge('طازة');
    setIcon('flame');
    setColorIndex(0);
    setActionType('category');
    setActionValue('فراخ');
    setImageUri('');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      return Alert.alert('بيانات ناقصة', 'يرجى كتابة عنوان الستوري (الاسم الظاهر أسفل الدائرة في الرئيسية).');
    }
    const selectedTheme = storyColorThemes[colorIndex] || storyColorThemes[0];

    let updated: AppStory[];
    if (editingId) {
      updated = stories.map((s) =>
        s.id === editingId
          ? {
              ...s,
              title: title.trim(),
              subtitle: subtitle.trim(),
              description: description.trim() || subtitle.trim() || 'عرض حصري من طيور الرشيدي',
              badge: badge.trim(),
              icon,
              gradientColors: selectedTheme,
              actionType,
              actionValue: actionValue.trim(),
              imageUri: imageUri.trim() || undefined,
            }
          : s
      );
      notify('تم تحديث الستوري بنجاح ⭐');
    } else {
      const newStory: AppStory = {
        id: `story-${Date.now()}`,
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: description.trim() || subtitle.trim() || 'عرض حصري من طيور الرشيدي',
        badge: badge.trim(),
        icon,
        gradientColors: selectedTheme,
        actionType,
        actionValue: actionValue.trim(),
        imageUri: imageUri.trim() || undefined,
        active: true,
        createdAt: Date.now(),
      };
      updated = [...stories, newStory];
      notify('تمت إضافة الستوري بنجاح ⭐');
    }

    setState((curr: AppState) => ({ ...curr, stories: updated }));
    onStoriesChange?.(updated);
    try {
      await saveStoriesToFirestore(updated);
    } catch {}
    resetForm();
  };

  const handleToggle = async (id: string) => {
    const updated = stories.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    setState((curr: AppState) => ({ ...curr, stories: updated }));
    onStoriesChange?.(updated);
    try {
      await saveStoriesToFirestore(updated);
    } catch {}
    notify('تم تحديث حالة الظهور');
  };

  const handleDelete = (id: string, storyTitle: string) => {
    confirmAction('حذف الستوري', `هل تريد حذف «${storyTitle || 'هذه الستوري'}» نهائياً؟`, async () => {
      const updated = stories.filter((s) => s.id !== id);
      setState((curr: AppState) => ({ ...curr, stories: updated }));
      onStoriesChange?.(updated);
      try {
        await saveStoriesToFirestore(updated);
      } catch {}
      notify('تم حذف الستوري');
      if (editingId === id) resetForm();
    });
  };

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const next = [...stories];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setState((curr: AppState) => ({ ...curr, stories: next }));
    onStoriesChange?.(next);
    try {
      await saveStoriesToFirestore(next);
    } catch {}
    notify('تم تقديم ترتيب الستوري ⬆️');
  };

  const handleMoveDown = async (index: number) => {
    if (index >= stories.length - 1) return;
    const next = [...stories];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setState((curr: AppState) => ({ ...curr, stories: next }));
    onStoriesChange?.(next);
    try {
      await saveStoriesToFirestore(next);
    } catch {}
    notify('تم تأخير ترتيب الستوري ⬇️');
  };

  const handleManualCloudSave = async () => {
    setSavingCloud(true);
    try {
      await saveStoriesToFirestore(stories);
      onStoriesChange?.(stories);
      notify('تمت مزامنة جميع الستوريز سحابياً بنجاح 💾');
      Alert.alert('تم الحفظ السحابي ✅', 'تم حفظ وتحديث جميع الستوريز لكل العملاء على التطبيق فوراً.');
    } catch (e: any) {
      Alert.alert('تعذر الحفظ السحابي', e?.message || 'تحقق من اتصال الإنترنت.');
    } finally {
      setSavingCloud(false);
    }
  };

  const handleResetDefaults = () => {
    confirmAction(
      'استعادة الستوريز الأصلية',
      'هل تريد استعادة قائمة الستوريز الافتراضية الأصلية لطيور الرشيدي مع أسمائها وصورها الأصلية؟',
      async () => {
        setState((curr: AppState) => ({ ...curr, stories: defaultStories }));
        onStoriesChange?.(defaultStories);
        try {
          await saveStoriesToFirestore(defaultStories);
        } catch {}
        notify('تمت استعادة الستوريز الافتراضية بنجاح 🔄');
        resetForm();
      }
    );
  };

  const startEdit = (s: AppStory) => {
    setEditingId(s.id);
    setTitle(s.title || '');
    setSubtitle(s.subtitle || '');
    setDescription(s.description || '');
    setBadge(s.badge || '');
    setIcon(s.icon || 'flame');
    setActionType(s.actionType || 'category');
    setActionValue(s.actionValue || '');
    setImageUri(s.imageUri || '');
    const cIdx = storyColorThemes.findIndex((c) => c[0] === s.gradientColors?.[0]);
    setColorIndex(cIdx >= 0 ? cIdx : 0);
  };

  const activeCount = stories.filter((s) => s.active !== false).length;

  return (
    <>
      <ScreenTitle
        title="إدارة الستوريز وقصص المتجر ⭐"
        subtitle="تحكم بالقصص الترويجية والدوائر الملونة المعروضة أعلى الصفحة الرئيسية للعملاء بكل سهولة وتنظيم"
      />

      {/* Top Quick Action Bar */}
      <View style={[s.card, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', padding: 14, marginBottom: 16 }]}>
        <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.green }} />
            <Txt style={{ fontWeight: '900', color: C.navy, fontSize: 13.5 }}>
              الستوريز النشطة: {activeCount} من {stories.length}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="حفظ سحابي للستوريز"
              onPress={handleManualCloudSave}
              style={{
                backgroundColor: C.navy,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 7,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 5,
              }}>
              <Ionicons name="cloud-upload" size={15} color="#FFFFFF" />
              <Txt style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 11.5 }}>
                {savingCloud ? 'جاري الحفظ...' : 'حفظ سحابي 💾'}
              </Txt>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="استعادة الافتراضي"
              onPress={handleResetDefaults}
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#CBD5E1',
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 7,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Txt style={{ color: C.muted, fontWeight: '800', fontSize: 11 }}>استعادة الافتراضي 🔄</Txt>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Main Editor Card */}
      <View style={[s.card, { borderColor: editingId ? C.blue : C.border, borderWidth: editingId ? 2 : 1 }]}>
        <View style={[s.row, { justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderColor: C.line, paddingBottom: 10 }]}>
          {editingId ? (
            <Pressable onPress={resetForm} style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#FEE2E2', borderRadius: 8 }}>
              <Txt style={{ color: C.red, fontWeight: '800', fontSize: 12 }}>إلغاء التعديل ✕</Txt>
            </Pressable>
          ) : (
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#FEF3C7', borderRadius: 8 }}>
              <Txt style={{ color: '#92400E', fontWeight: '800', fontSize: 11 }}>ستوري جديدة ✨</Txt>
            </View>
          )}
          <Txt style={{ fontWeight: '900', fontSize: 17, color: editingId ? C.blue : C.navy }}>
            {editingId ? '✏️ تعديل بيانات الستوري المحددة' : '✨ إضافة ستوري مميزة جديدة'}
          </Txt>
        </View>

        {/* Section 1: Titles & Texts */}
        <View style={{ marginBottom: 14 }}>
          <Txt style={{ fontWeight: '900', fontSize: 14, color: C.navy, marginBottom: 8 }}>
            ١. العناوين والنصوص الخارجية والداخلية
          </Txt>

          <Field
            label="العنوان الخارجي (الاسم الظاهر أسفل الدائرة في الرئيسية) ⭐"
            value={title}
            onChangeText={setTitle}
            placeholder="مثال: طازة اليوم، تتبيلات الشيف، بانيه التوفير، عروض خاصة"
          />
          <Txt style={{ fontSize: 11, color: C.muted, marginTop: -6, marginBottom: 10, textAlign: 'right' }}>
            💡 هذا هو الاسم الرئيسي الذي يظهر مباشرة أسفل دائرة الستوري لجميع العملاء في الصفحة الرئيسية.
          </Txt>

          <Field
            label="العنوان الفرعي (Subtitle - يظهر باللون الذهبي داخل الستوري)"
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="مثال: ذبح صباحي فجر اليوم، تتبيلة فاخرة جاهزة للشوي"
          />

          <Field
            label="الشارة الصغيرة (Badge - علامة مميزة أعلى الستوري)"
            value={badge}
            onChangeText={setBadge}
            placeholder="مثال: طازة، تتبيلة الشيف، جديد، خصم 10%"
          />

          <Field
            label="التفاصيل الكاملة لشاشة العرض (Description)"
            value={description}
            onChangeText={setDescription}
            placeholder="اكتب نبذة شيقة يقرأها العميل عند الضغط على الستوري..."
          />
        </View>

        {/* Section 2: Story Image with Live Preview */}
        <View style={{ marginBottom: 16, borderTopWidth: 1, borderColor: C.line, paddingTop: 12 }}>
          <Txt style={{ fontWeight: '900', fontSize: 14, color: C.navy, marginBottom: 8 }}>
            ٢. صورة الستوري مع المعاينة المباشرة
          </Txt>

          {/* Live Preview Display */}
          <View
            style={{
              padding: 14,
              backgroundColor: C.surfaceAlt,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: C.border,
              alignItems: 'center',
              marginBottom: 12,
            }}>
            <Txt style={[s.small, { marginBottom: 10, fontWeight: '800', color: C.navy }]}>
              👁️ معاينة كيف ستظهر الستوري للعميل:
            </Txt>

            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 20, width: '100%' }}>
              {/* Preview Circle with External Title */}
              <View style={{ alignItems: 'center', width: 90 }}>
                <View
                  style={{
                    width: 66,
                    height: 66,
                    borderRadius: 33,
                    borderWidth: 2.5,
                    borderColor: storyColorThemes[colorIndex]?.[0] || C.action,
                    padding: 2.5,
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: storyColorThemes[colorIndex]?.[0] || C.action,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                    elevation: 4,
                  }}>
                  {imageUri ? (
                    <FastImage
                      source={{ uri: imageUri }}
                      resizeMode="cover"
                      style={{ width: '100%', height: '100%', borderRadius: 28 }}
                    />
                  ) : (
                    <Ionicons name={(icon as any) || 'flame'} size={28} color={storyColorThemes[colorIndex]?.[0] || C.action} />
                  )}
                </View>
                {/* External title pill preview */}
                <View
                  style={{
                    marginTop: 5,
                    paddingHorizontal: 7,
                    paddingVertical: 2.5,
                    borderRadius: 10,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    elevation: 1,
                    maxWidth: 88,
                  }}>
                  <Txt numberOfLines={1} style={{ fontSize: 10.5, fontWeight: '900', color: C.navy, textAlign: 'center' }}>
                    {title.trim() || 'اسم الستوري'}
                  </Txt>
                </View>
                <Txt style={{ fontSize: 9.5, color: C.muted, marginTop: 3 }}>أسفل الدائرة</Txt>
              </View>

              {/* Preview 9:16 Full Story Card */}
              <View style={{ alignItems: 'center', flex: 1, maxWidth: 160 }}>
                <View
                  style={{
                    width: '100%',
                    height: 105,
                    borderRadius: 14,
                    overflow: 'hidden',
                    borderWidth: 1.5,
                    borderColor: 'rgba(0,0,0,0.15)',
                    backgroundColor: '#0F172A',
                    justifyContent: 'space-between',
                    padding: 8,
                  }}>
                  {imageUri ? (
                    <FastImage
                      source={{ uri: imageUri }}
                      resizeMode="cover"
                      style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
                    />
                  ) : null}
                  <View style={{ alignSelf: 'flex-end', backgroundColor: storyColorThemes[colorIndex]?.[0] || C.action, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6 }}>
                    <Txt style={{ color: '#FFFFFF', fontSize: 8.5, fontWeight: '900' }}>{badge || 'شارة'}</Txt>
                  </View>
                  <View>
                    <Txt numberOfLines={1} style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>
                      {title.trim() || 'العنوان'}
                    </Txt>
                    <Txt numberOfLines={1} style={{ color: '#FCD34D', fontSize: 9, fontWeight: '700' }}>
                      {subtitle.trim() || 'الوصف المختصر'}
                    </Txt>
                  </View>
                </View>
                <Txt style={{ fontSize: 9.5, color: C.muted, marginTop: 3 }}>داخل شاشة العرض</Txt>
              </View>
            </View>

            {!!imageUri && (
              <Pressable onPress={() => setImageUri('')} style={{ marginTop: 8, paddingVertical: 4 }}>
                <Txt style={{ color: C.red, fontSize: 11, fontWeight: '800' }}>مسح الصورة المخصصة ✕</Txt>
              </Pressable>
            )}
          </View>

          {/* Image Selection Buttons */}
          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="رفع صورة للسحابة"
              onPress={async () => {
                try {
                  const url = await pickAndUploadToCloud(title || 'story', 'story');
                  if (url) {
                    setImageUri(url);
                    Alert.alert('تم الرفع السحابي ⚡', 'تم رفع الصورة للسحابة وربطها بالستوري وحفظها بنجاح.');
                  }
                } catch (e: any) {
                  Alert.alert('تعذر الرفع', e?.message);
                }
              }}
              style={{
                backgroundColor: C.action,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 9,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 6,
                flex: 1,
                minWidth: 130,
                justifyContent: 'center',
              }}>
              <Ionicons name="flash" size={16} color="#FFFFFF" />
              <Txt style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>رفع صورة للسحابة ⚡</Txt>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="مكتبة السحابة"
              onPress={() => openCloudPicker('اختيار صورة للستوري من السحابة', setImageUri)}
              style={{
                backgroundColor: C.surfaceAlt,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 9,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 6,
                flex: 1,
                minWidth: 130,
                justifyContent: 'center',
              }}>
              <Ionicons name="cloud-outline" size={16} color={C.navy} />
              <Txt style={{ color: C.navy, fontWeight: '800', fontSize: 12 }}>مكتبة السحابة ☁️</Txt>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="صورة من الجهاز"
              onPress={async () => {
                try {
                  const uri = await pickCompressedImage();
                  if (uri) setImageUri(uri);
                } catch (error: any) {
                  Alert.alert('تعذر تجهيز الصورة', error?.message || 'اختر صورة أخرى.');
                }
              }}
              style={{
                backgroundColor: C.surfaceAlt,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 9,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 6,
                flex: 1,
                minWidth: 130,
                justifyContent: 'center',
              }}>
              <Ionicons name="image-outline" size={16} color={C.navy} />
              <Txt style={{ color: C.navy, fontWeight: '800', fontSize: 12 }}>من الجهاز 📱</Txt>
            </Pressable>
          </View>

          <Field
            label="أو رابط مباشر لصورة الستوري (URL)"
            value={imageUri}
            onChangeText={setImageUri}
            placeholder="https://.../story.jpg"
          />
        </View>

        {/* Section 3: Action & Appearance */}
        <View style={{ marginBottom: 14, borderTopWidth: 1, borderColor: C.line, paddingTop: 12 }}>
          <Txt style={{ fontWeight: '900', fontSize: 14, color: C.navy, marginBottom: 8 }}>
            ٣. الإجراء عند الضغط والألوان والأيقونة
          </Txt>

          <Txt style={[s.small, { fontWeight: '800', marginBottom: 4 }]}>ماذا يحدث عند ضغط العميل على زر الستوري؟</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
            {[
              { key: 'category', label: 'فتح قسم من القائمة' },
              { key: 'promo', label: 'كوبون خصم' },
              { key: 'branch', label: 'عرض الفروع' },
              { key: 'info', label: 'معلومات عامة' },
            ].map((act) => (
              <Chip
                key={act.key}
                label={act.label}
                selected={actionType === act.key}
                onPress={() => setActionType(act.key as any)}
              />
            ))}
          </ScrollView>

          {actionType === 'category' ? (
            <View style={{ marginTop: 8 }}>
              <Txt style={[s.small, { marginBottom: 4 }]}>اختر القسم المستهدف:</Txt>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {['فراخ', 'متبلات', 'بط', 'أجزاء دواجن', 'حمام وسمان', 'رومي', 'أخرى وأرانب'].map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    selected={actionValue === cat}
                    onPress={() => setActionValue(cat)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : actionType === 'promo' ? (
            <Field
              label="كود الخصم المراد تفعيله"
              value={actionValue}
              onChangeText={setActionValue}
              placeholder="مثال: SAVE10"
            />
          ) : null}

          <Txt style={[s.small, { fontWeight: '800', marginTop: 10, marginBottom: 6 }]}>طابع ولون دائرة الستوري:</Txt>
          <View style={[s.row, { justifyContent: 'flex-end', gap: 10, marginBottom: 10 }]}>
            {storyColorThemes.map(([c1, c2], idx) => (
              <Pressable
                key={c1}
                accessibilityRole="button"
                accessibilityLabel={`لون ${idx + 1}`}
                onPress={() => setColorIndex(idx)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: c1,
                  borderWidth: colorIndex === idx ? 3.5 : 1.5,
                  borderColor: colorIndex === idx ? '#1E293B' : '#CBD5E1',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: c2 }} />
              </Pressable>
            ))}
          </View>

          <Txt style={[s.small, { fontWeight: '800', marginBottom: 4 }]}>أيقونة الستوري (تظهر إذا لم تكن هناك صورة):</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
            {storyIconsList.map((ic) => (
              <Chip
                key={ic.name}
                label={ic.label}
                selected={icon === ic.name}
                onPress={() => setIcon(ic.name)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Save Button */}
        <Button
          title={editingId ? 'حفظ تعديلات الستوري وحفظ سحابي 💾' : 'إضافة الستوري للرئيسية وحفظ سحابي 🚀'}
          onPress={handleSave}
          style={{ backgroundColor: C.action, marginTop: 8 }}
        />
      </View>

      {/* Section 4: Current Stories List with Reordering */}
      <View style={{ marginTop: 22, marginBottom: 8, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt style={{ fontFamily: fontRuqaaBold, fontSize: 20, fontWeight: '700', color: C.navy }}>
          الستوريز الحالية بالرئيسية ({stories.length})
        </Txt>
        <Txt style={{ fontSize: 11, color: C.muted }}>
          استخدم ⬆️ ⬇️ لإعادة الترتيب
        </Txt>
      </View>

      {stories.map((st, index) => {
        const isCurrentlyEditing = editingId === st.id;
        const ringCol = st.gradientColors?.[0] || C.action;
        return (
          <View
            key={st.id}
            style={[
              s.card,
              {
                borderColor: isCurrentlyEditing ? C.blue : C.border,
                borderWidth: isCurrentlyEditing ? 2 : 1,
                backgroundColor: isCurrentlyEditing ? '#F0F9FF' : C.surface,
                marginBottom: 10,
              },
            ]}>
            <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, flex: 1 }}>
                {/* Index badge */}
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: C.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: C.border,
                  }}>
                  <Txt style={{ fontSize: 11, fontWeight: '900', color: C.navy }}>#{index + 1}</Txt>
                </View>

                {/* Thumbnail circle */}
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    borderWidth: 2.5,
                    borderColor: ringCol,
                    backgroundColor: '#FFF7ED',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                  {st.imageUri ? (
                    <FastImage source={{ uri: st.imageUri }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Ionicons name={(st.icon as any) || 'flame'} size={24} color={ringCol} />
                  )}
                </View>

                {/* Details */}
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Txt style={{ fontWeight: '900', fontSize: 16, color: C.navy }}>
                      {st.title || 'بدون عنوان'}
                    </Txt>
                    {!!st.badge && (
                      <View
                        style={{
                          backgroundColor: ringCol,
                          borderRadius: 8,
                          paddingHorizontal: 7,
                          paddingVertical: 1.5,
                        }}>
                        <Txt style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: '900' }}>{st.badge}</Txt>
                      </View>
                    )}
                  </View>

                  <Txt numberOfLines={1} style={[s.small, { marginTop: 2, color: C.muted }]}>
                    {st.subtitle || st.description}
                  </Txt>

                  <Txt style={{ fontSize: 10, color: C.blue, fontWeight: '700', marginTop: 3 }}>
                    العنوان الخارجي: «{st.title || 'بدون عنوان'}»
                  </Txt>
                </View>
              </View>

              {/* Visibility Toggle */}
              <Toggle label={st.active !== false ? 'ظاهر' : 'مخفي'} value={st.active !== false} onChange={() => handleToggle(st.id)} />
            </View>

            {/* Actions & Reordering Controls Row */}
            <View
              style={[
                s.row,
                {
                  marginTop: 10,
                  borderTopWidth: 1,
                  borderColor: C.line,
                  paddingTop: 8,
                  justifyContent: 'space-between',
                },
              ]}>
              {/* Order Arrows */}
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="تقديم الترتيب للأمام"
                  disabled={index === 0}
                  onPress={() => handleMoveUp(index)}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: 8,
                    backgroundColor: index === 0 ? '#F1F5F9' : C.surfaceAlt,
                    borderWidth: 1,
                    borderColor: C.border,
                    opacity: index === 0 ? 0.4 : 1,
                  }}>
                  <Txt style={{ fontSize: 11, fontWeight: '800', color: C.navy }}>⬆️ تقديم</Txt>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="تأخير الترتيب للخلف"
                  disabled={index === stories.length - 1}
                  onPress={() => handleMoveDown(index)}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: 8,
                    backgroundColor: index === stories.length - 1 ? '#F1F5F9' : C.surfaceAlt,
                    borderWidth: 1,
                    borderColor: C.border,
                    opacity: index === stories.length - 1 ? 0.4 : 1,
                  }}>
                  <Txt style={{ fontSize: 11, fontWeight: '800', color: C.navy }}>⬇️ تأخير</Txt>
                </Pressable>
              </View>

              {/* Edit and Delete Buttons */}
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 14 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="تعديل الستوري"
                  onPress={() => startEdit(st)}
                  style={{ minHeight: 36, justifyContent: 'center', paddingHorizontal: 6 }}>
                  <Txt style={{ color: C.blue, fontWeight: '900', fontSize: 13 }}>
                    {isCurrentlyEditing ? 'جارٍ التعديل ✏️' : 'تعديل ✏️'}
                  </Txt>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="حذف الستوري"
                  onPress={() => handleDelete(st.id, st.title)}
                  style={{ minHeight: 36, justifyContent: 'center', paddingHorizontal: 6 }}>
                  <Txt style={{ color: C.red, fontWeight: '800', fontSize: 13 }}>حذف 🗑️</Txt>
                </Pressable>
              </View>
            </View>
          </View>
        );
      })}
    </>
  );
}





function ShowcaseAdminTab({
  state,
  setState,
  notify,
  onShowcaseChange,
  openCloudPicker,
}: {
  state: AppState;
  setState: any;
  notify: (msg: string) => void;
  onShowcaseChange?: (config: RashidiShowcaseConfig) => void;
  openCloudPicker: (title: string, onSelect: (url: string) => void) => void;
}) {
  const currentConfig: RashidiShowcaseConfig = state.showcase || defaultShowcaseConfig;
  const [activePreset, setActivePreset] = useState<'preset1' | 'preset2'>('preset1');
  const [activeCardKey, setActiveCardKey] = useState<'heroCard' | 'upperCard' | 'lowerCard'>('heroCard');
  const [saving, setSaving] = useState(false);

  const preset = currentConfig[activePreset] || defaultShowcaseConfig[activePreset];
  const card = preset[activeCardKey] || defaultShowcaseConfig[activePreset][activeCardKey];

  const updateConfig = (updater: (prev: RashidiShowcaseConfig) => RashidiShowcaseConfig) => {
    const next = updater(currentConfig);
    setState((curr: AppState) => ({ ...curr, showcase: next }));
    onShowcaseChange?.(next);
  };

  const handleSaveCloud = async () => {
    setSaving(true);
    try {
      await saveShowcaseToFirestore(currentConfig);
      notify('تم حفظ إعدادات سفرة الرشيدي في السحابة بنجاح 💾');
      Alert.alert('تم الحفظ في السحابة ✅', 'تم حفظ كل تفاصيل سفرة الرشيدي وتحديثها لجميع عملاء التطبيق فوراً.');
    } catch (e: any) {
      Alert.alert('تعذر الحفظ السحابي', e?.message || 'تحقق من اتصال الإنترنت.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    confirmAction(
      'استعادة الإعدادات الأصلية',
      'هل أنت متأكد من استعادة التصميم والنصوص والصور الأصلية لسفرة الرشيدي؟',
      () => {
        updateConfig(() => defaultShowcaseConfig);
        notify('تمت استعادة الإعدادات الأصلية لسفرة الرشيدي 🔄');
      }
    );
  };

  const updateActiveCard = (field: keyof ShowcaseCard, value: any) => {
    updateConfig((prev) => ({
      ...prev,
      [activePreset]: {
        ...prev[activePreset],
        [activeCardKey]: {
          ...prev[activePreset][activeCardKey],
          [field]: value,
        },
      },
    }));
  };

  const resolveImageSource = (img: string | undefined) => {
    if (!img) return images['hero-chicken'];
    if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) {
      return { uri: img };
    }
    return images[img] || images['hero-chicken'];
  };

  const showcasePresetImages = [
    { key: 'story-fresh-chicken', label: 'دجاج فريش طازج' },
    { key: 'story-shish-tawook', label: 'شيش طاووق ومتبلات' },
    { key: 'story-fresh-panee', label: 'بانيه وفيليه صدور' },
    { key: 'story-baladi-poultry', label: 'بط وحمام بلدي' },
    { key: 'product-burger', label: 'برجر وكفتة دواجن' },
    { key: 'product-marinated-shawerma', label: 'شاورما دجاج متبلة' },
    { key: 'hero-chicken', label: 'شيف ودواجن كاملة' },
    { key: 'hero-marinated', label: 'طبق متبلات مشوي' },
    { key: 'chicken', label: 'دجاجة كاملة مجهزة' },
    { key: 'duck', label: 'بط طازج نظيف' },
    { key: 'pigeon', label: 'حمام وسمان' },
    { key: 'panee', label: 'قطع بانيه' },
    { key: 'shish', label: 'أسياخ شيش' },
    { key: 'wings', label: 'أجنحة متبلة' },
    { key: 'drumsticks', label: 'دبابيس طازجة' },
  ];

  return (
    <>
      <ScreenTitle
        title="إدارة سفرة الرشيدي 🍗"
        subtitle="تحكم كامل 100% في نصوص وبطاقات وصور وتوقيت سفرة الرشيدي"
      />

      {/* Cloud Save & Reset Actions Card */}
      <View style={[s.card, { borderColor: '#B45309', borderWidth: 1.5, backgroundColor: 'rgba(217,119,6,0.04)' }]}>
        <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }]}>
          <View style={{ backgroundColor: 'rgba(217,119,6,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
            <Txt style={{ color: '#B45309', fontWeight: '900', fontSize: 13 }}>لوحة تحكم كولاج الرئيسية</Txt>
          </View>
          <Txt style={{ fontSize: 16, fontWeight: '900', color: C.navy }}>سفرة الرشيدي</Txt>
        </View>
        <Txt style={[s.small, { marginBottom: 12 }]}>
          التعديلات تُحفظ محلياً فوراً، واضغط الزر أدناه لمزامنتها مع السحابة المركزية ليراها كل العملاء فور فتح التطبيق.
        </Txt>

        <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button
              title={saving ? 'جارٍ الحفظ…' : '💾 حفظ في السحابة'}
              onPress={handleSaveCloud}
              disabled={saving}
              style={{ backgroundColor: '#237A57' }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="🔄 استعادة الأصلي"
              secondary
              onPress={handleResetDefaults}
            />
          </View>
        </View>
      </View>

      {/* Section Global Settings */}
      <View style={s.card}>
        <Txt style={{ fontSize: 17, fontWeight: '900', color: C.navy, marginBottom: 10 }}>
          ⚙️ إعدادات قسم السفرة الرئيسي
        </Txt>

        <Field
          label="عنوان السيكشن الرئيسي"
          value={currentConfig.title}
          onChangeText={(val: string) => updateConfig((prev) => ({ ...prev, title: val }))}
          placeholder="سفرة الرشيدي"
        />

        <Field
          label="الوصف الترويجي أسفل العنوان"
          value={currentConfig.subtitle}
          onChangeText={(val: string) => updateConfig((prev) => ({ ...prev, subtitle: val }))}
          placeholder="طازجة يومياً من المزرعة والمذبح مباشرة"
        />

        <Field
          label="الشارة العلوية (Badge)"
          value={currentConfig.badge}
          onChangeText={(val: string) => updateConfig((prev) => ({ ...prev, badge: val }))}
          placeholder="مختارات اليوم"
        />

        <Toggle
          label="التبديل التلقائي بين المجموعتين (Smooth Auto-Cycle)"
          value={currentConfig.autoRotate}
          onChange={(val: boolean) => updateConfig((prev) => ({ ...prev, autoRotate: val }))}
        />

        {currentConfig.autoRotate && (
          <View style={{ marginTop: 6 }}>
            <Txt style={[s.small, { fontWeight: '800', color: C.navy, marginBottom: 6 }]}>
              ⏱️ مدة العرض لكل مجموعة قبل التبديل:
            </Txt>
            <View style={[s.row, { justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }]}>
              {[
                { sec: 3.5, label: '3.5 ثانية (سريع)' },
                { sec: 5.5, label: '5.5 ثانية (مثالي)' },
                { sec: 8, label: '8 ثوانٍ (هادئ)' },
                { sec: 12, label: '12 ثانية (مطول)' },
              ].map((item) => (
                <Chip
                  key={item.sec}
                  label={item.label}
                  selected={Math.abs(currentConfig.intervalSeconds - item.sec) < 0.2}
                  onPress={() => updateConfig((prev) => ({ ...prev, intervalSeconds: item.sec }))}
                />
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Preset / Group Selector */}
      <View style={s.card}>
        <Txt style={{ fontSize: 17, fontWeight: '900', color: C.navy, marginBottom: 8 }}>
          🍱 اختر المجموعة لتعديل بطاقاتها (Tabs)
        </Txt>

        <View style={[s.row, { justifyContent: 'center', gap: 12, marginVertical: 8 }]}>
          <Chip
            label={`1️⃣ ${currentConfig.preset1.label || 'المجموعة الأولى'}`}
            selected={activePreset === 'preset1'}
            onPress={() => setActivePreset('preset1')}
          />
          <Chip
            label={`2️⃣ ${currentConfig.preset2.label || 'المجموعة الثانية'}`}
            selected={activePreset === 'preset2'}
            onPress={() => setActivePreset('preset2')}
          />
        </View>

        <Field
          label={`اسم تاب (${activePreset === 'preset1' ? 'المجموعة الأولى' : 'المجموعة الثانية'}) كما يظهر للمستخدم`}
          value={preset.label}
          onChangeText={(val: string) => {
            updateConfig((prev) => ({
              ...prev,
              [activePreset]: {
                ...prev[activePreset],
                label: val,
              },
            }));
          }}
          placeholder={activePreset === 'preset1' ? 'دواجن ومتبلات' : 'بط وبلدي'}
        />
      </View>

      {/* Card Selector within Group */}
      <View style={s.card}>
        <Txt style={{ fontSize: 17, fontWeight: '900', color: C.navy, marginBottom: 6 }}>
          🃏 بطاقات مجموعة «{preset.label}»
        </Txt>
        <Txt style={[s.small, { marginBottom: 12 }]}>
          اختر البطاقة التي تريد تعديل نصوصها وصورتها ورابطها:
        </Txt>

        <View style={[s.row, { justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap', marginBottom: 16 }]}>
          <Chip
            label="🌟 البطاقة الكبرى (Hero)"
            selected={activeCardKey === 'heroCard'}
            onPress={() => setActiveCardKey('heroCard')}
          />
          <Chip
            label="🥩 البطاقة العلوية (Upper)"
            selected={activeCardKey === 'upperCard'}
            onPress={() => setActiveCardKey('upperCard')}
          />
          <Chip
            label="🍗 البطاقة السفلية (Lower)"
            selected={activeCardKey === 'lowerCard'}
            onPress={() => setActiveCardKey('lowerCard')}
          />
        </View>

        {/* Live Mini Preview Box */}
        <View
          style={{
            backgroundColor: '#07162C',
            borderRadius: 16,
            padding: 12,
            borderWidth: 1.5,
            borderColor: '#F59E0B',
            marginBottom: 16,
            overflow: 'hidden',
          }}>
          <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }]}>
            <View style={{ backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Txt style={{ color: '#FCD34D', fontSize: 11, fontWeight: '900' }}>معاينة حية للبطاقة 👁️</Txt>
            </View>
            <Txt style={{ color: '#93C5FD', fontSize: 12, fontWeight: '800' }}>
              {activeCardKey === 'heroCard' ? 'البطاقة الكبرى' : activeCardKey === 'upperCard' ? 'البطاقة العلوية' : 'البطاقة السفلية'}
            </Txt>
          </View>

          <View style={{ flexDirection: 'row-reverse', gap: 12, alignItems: 'center' }}>
            <View style={{ width: 84, height: 84, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0A2540', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
              <Image source={resolveImageSource(card.image)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              {!!card.badge && (
                <View style={{ backgroundColor: '#DC2626', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 4 }}>
                  <Txt style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{card.badge}</Txt>
                </View>
              )}
              <Txt style={{ color: '#fff', fontSize: 15, fontWeight: '900' }}>{card.title || 'عنوان البطاقة'}</Txt>
              <Txt style={{ color: '#E2E8F0', fontSize: 12, marginTop: 2 }}>{card.subtitle || 'وصف البطاقة'}</Txt>
              {activeCardKey === 'heroCard' && !!card.note && (
                <Txt style={{ color: '#FCD34D', fontSize: 11, marginTop: 3 }}>✨ {card.note}</Txt>
              )}
              {activeCardKey === 'heroCard' && (
                <View style={{ marginTop: 6, backgroundColor: '#DC2626', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Txt style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{card.btnText || 'اطلب الآن'}</Txt>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Card Fields */}
        <Field
          label="عنوان البطاقة"
          value={card.title}
          onChangeText={(val: string) => updateActiveCard('title', val)}
          placeholder="مثال: طازة من المزرعة"
        />

        <Field
          label="الوصف الفرعي للبطاقة"
          value={card.subtitle}
          onChangeText={(val: string) => updateActiveCard('subtitle', val)}
          placeholder="مثال: دواجن كاملة ومقطعة بأعلى جودة"
        />

        <Field
          label="الشارة المكتوبة على البطاقة (Badge)"
          value={card.badge || ''}
          onChangeText={(val: string) => updateActiveCard('badge', val)}
          placeholder="مثال: طازة فجر اليوم"
        />

        {activeCardKey === 'heroCard' && (
          <>
            <Field
              label="الملاحظة البارزة (Note)"
              value={card.note || ''}
              onChangeText={(val: string) => updateActiveCard('note', val)}
              placeholder="مثال: تنظيف يدوي وتقطيع حسب رغبتك"
            />
            <Field
              label="نص زر الطلب السريع (Button Text)"
              value={card.btnText || ''}
              onChangeText={(val: string) => updateActiveCard('btnText', val)}
              placeholder="مثال: اطلب الطازج"
            />
          </>
        )}

        {/* Category Link */}
        <Txt style={[s.small, { fontWeight: '800', color: C.navy, marginTop: 8, marginBottom: 6 }]}>
          🏷️ عند ضغط العميل على البطاقة، يفتح قسم:
        </Txt>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
          {productCategories.map((cat: string) => (
            <Chip
              key={cat}
              label={cat}
              selected={(card.category || 'فراخ') === cat}
              onPress={() => updateActiveCard('category', cat)}
            />
          ))}
        </ScrollView>

        {/* Image Customization */}
        <Txt style={{ fontSize: 15, fontWeight: '900', color: C.navy, marginTop: 10, marginBottom: 4 }}>
          🖼️ صورة البطاقة
        </Txt>
        <Txt style={[s.small, { marginBottom: 8 }]}>
          اختر من تصوير الرشيدي الاحترافي، أو اختر من السحابة، أو ارفع صورة جديدة من هاتفك:
        </Txt>

        {/* Preset Thumbnails Carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4, marginBottom: 10 }}>
          {showcasePresetImages.map((item) => {
            const isSelected = card.image === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => updateActiveCard('image', item.key)}
                style={{
                  width: 90,
                  alignItems: 'center',
                  padding: 4,
                  borderRadius: 12,
                  borderWidth: isSelected ? 2.5 : 1,
                  borderColor: isSelected ? C.red : C.line,
                  backgroundColor: isSelected ? 'rgba(220,38,38,0.06)' : C.surface,
                }}>
                <View style={{ width: 80, height: 60, borderRadius: 8, overflow: 'hidden', backgroundColor: '#0E2F65', marginBottom: 4 }}>
                  <Image source={images[item.key] || images['hero-chicken']} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
                <Txt numberOfLines={1} style={{ fontSize: 10, fontWeight: isSelected ? '900' : '700', color: isSelected ? C.red : C.ink }}>
                  {item.label}
                </Txt>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Cloud Media Picker */}
        <Button
          title="☁️ اختيار صورة من مكتبة السحابة"
          secondary
          onPress={() =>
            openCloudPicker(`اختيار صورة لبطاقة (${card.title || 'سفرة الرشيدي'})`, (url: string) => {
              updateActiveCard('image', url);
              notify('تم تحديث صورة البطاقة من السحابة');
            })
          }
          style={{ marginBottom: 8 }}
        />

        {/* Instant Phone Upload */}
        <Button
          title="⚡ رفع صورة جديدة للسحابة وربطها فوراً"
          onPress={async () => {
            try {
              const url = await pickAndUploadToCloud(card.title || 'showcase_card', 'showcase');
              if (url) {
                updateActiveCard('image', url);
                notify('تم رفع الصورة للسحابة وربطها بالبطاقة بنجاح ⚡');
                Alert.alert('تم الرفع بنجاح ⚡', 'تم رفع الصورة وحفظها بالسحابة وربطها فوراً بهذه البطاقة.');
              }
            } catch (e: any) {
              Alert.alert('تعذر الرفع', e?.message || 'حاول مرة أخرى');
            }
          }}
          style={{ backgroundColor: C.action, marginBottom: 8 }}
        />

        {/* Local Pick */}
        <Button
          title="اختيار صورة من الجهاز محلياً"
          secondary
          onPress={async () => {
            try {
              const uri = await pickCompressedImage();
              if (uri) {
                updateActiveCard('image', uri);
                notify('تم اختيار الصورة من الجهاز');
              }
            } catch (e: any) {
              Alert.alert('تعذر تجهيز الصورة', e?.message || 'اختر صورة أخرى');
            }
          }}
          style={{ marginBottom: 8 }}
        />

        {/* Direct URL */}
        <Field
          label="أو رابط صورة مباشر (URL)"
          value={card.image?.startsWith('http') ? card.image : ''}
          onChangeText={(url: string) => updateActiveCard('image', url.trim())}
          placeholder="https://.../chicken-dish.jpg"
        />

        {(card.image?.startsWith('http') || card.image?.startsWith('data:')) && (
          <Pressable
            onPress={() => {
              const defaultKey = activeCardKey === 'heroCard'
                ? (activePreset === 'preset1' ? 'story-fresh-chicken' : 'story-baladi-poultry')
                : (activeCardKey === 'upperCard' ? 'story-shish-tawook' : 'story-fresh-panee');
              updateActiveCard('image', defaultKey);
              notify('تمت استعادة الصورة الافتراضية للبطاقة');
            }}
            style={{ paddingVertical: 4, marginBottom: 8 }}>
            <Txt style={{ color: C.red, fontSize: 12, fontWeight: '800' }}>
              إزالة الصورة المخصصة والعودة للصورة الجاهزة الأصلية ↺
            </Txt>
          </Pressable>
        )}
      </View>
    </>
  );
}
