import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import { Alert,Animated,Image,Modal,Platform,Pressable,ScrollView,StyleSheet,View,useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg,{Defs,LinearGradient,Path,Rect,Stop} from 'react-native-svg';
import { AppState,DeliveryLocation,emptyDeliveryLocation } from './store';
import { C,s,fontRuqaaBold } from './theme';
import { branchDetails,getBranchImageSource,images } from './nativeAssets';
import { Product, RashidiShowcaseConfig, ShowcaseCard, defaultShowcaseConfig } from './models';
import { Button,Field,ProductCard,ProductGridSkeleton,Txt } from './ui';
import { FastImage, prefetchImages } from './FastImage';
import { cloudImages, allCloudImageUrls } from './cloudAssets';
import { detectAddress } from './LocationManager';
import { AppFooter } from './LegalScreens';
import { defaultProductsCatalog } from './productCatalog';
import { StoriesBar } from './StoriesBar';
import { isNoticeRead } from './notificationsStorage';
import { MarqueeOffers } from './MarqueeOffers';



const categories=[
  {title:'الدواجن',category:'فراخ',image:'chicken',emoji:'🍗'},
  {title:'بانيه وشيش',category:'أجزاء دواجن',image:'panee',emoji:'🍢'},
  {title:'متبلات شيف',category:'متبلات',image:'shish',emoji:'🍢'},
  {title:'البط البلدي',category:'بط',image:'duck',emoji:'🦆'},
  {title:'حمام وسمان',category:'حمام وسمان',image:'pigeon',emoji:'🐦'},
  {title:'رومي مزارع',category:'رومي',image:'drumsticks',emoji:'🦃'},
  {title:'أرانب وأخرى',category:'أخرى وأرانب',image:'wings',emoji:'🐇'},
];
const SectionTitle=({title,onMore}:{title:string;onMore?:()=>void})=><View style={[s.row,{paddingHorizontal:16,marginBottom:10}]}><Txt style={{fontFamily:fontRuqaaBold,fontSize:23,fontWeight:'700',textAlign:'right',color:C.navy}}>{title}</Txt><Pressable accessibilityRole="button" accessibilityLabel={`عرض كل منتجات ${title}`} onPress={onMore} style={{minHeight:44,flexDirection:'row-reverse',alignItems:'center',gap:6,paddingHorizontal:14,paddingVertical:8,borderRadius:16,backgroundColor:C.action,elevation:3}}><Txt style={{color:C.actionText,fontSize:14,fontWeight:'900'}}>عرض الكل</Txt><Ionicons name="chevron-back" size={16} color={C.actionText}/></Pressable></View>;

export function HomeScreen({state,setState,notify,onTab,onCategory,onProduct,onAdd,branch,setBranch,delivery,setDelivery,onNotice,onBranches,deliveryLocation=emptyDeliveryLocation,onDeliveryLocationChange,activeScheme='light',onThemeToggle,onTerms,onPrivacy,onCart,cartCount=0}:any){
 const [locationPicker,setLocationPicker]=useState(false);const [locationDraft,setLocationDraft]=useState<DeliveryLocation>(deliveryLocation);const [locationBusy,setLocationBusy]=useState(false);
 const validBanners = (state.banners || []).filter((b: any) => b.active !== false && b.isActive !== false).map((b: any, idx: number) => {
   const hasCustomUri = typeof b.imageUri === 'string' && 
     b.imageUri.trim().length > 10 && 
     !b.imageUri.startsWith('content://') && 
     !b.imageUri.startsWith('file://') &&
     (b.imageUri.startsWith('http') || b.imageUri.startsWith('data:image/'));

   if (hasCustomUri) {
     return { ...b, imageUri: b.imageUri.trim() };
   }

   if (b.image && images[b.image]) {
     return { ...b, image: b.image, imageUri: undefined };
   }

   const title = (b.title || '') + ' ' + (b.subtitle || '');
   const isMarinated = /تتبيل|شيش|مشوي|عرض/i.test(title) || idx % 2 === 1;
   const defaultImageKey = isMarinated ? 'hero-marinated' : 'hero-chicken';

   return {
     ...b,
     image: defaultImageKey,
     imageUri: undefined,
   };
 });
 const banners = validBanners.length ? validBanners : [
  { id: 'b1', title: 'دواجن طازجة يومياً', subtitle: 'ذبح وتجهيز فوري بأعلى معايير النظافة والجودة', image: 'hero-chicken', active: true },
  { id: 'b2', title: 'أشهى التتبيلات والشيش', subtitle: 'جاهزة للطهي والشواء بتتبيلة الرشيدي الخاصة', image: 'hero-marinated', active: true },
 ];
 const activeProducts=(state.products&&state.products.length>0)?state.products:defaultProductsCatalog;
 const featured=useMemo(()=>activeProducts.filter((p:Product)=>p.featured||p.badge||p.category==='فراخ'||p.category==='أجزاء دواجن').slice(0,6),[activeProducts]);
 const offers=useMemo(()=>activeProducts.filter((p:Product)=>p.offer||p.badge?.includes('عرض')).slice(0,6),[activeProducts]);
 const grid=useMemo(()=>{const marked=activeProducts.filter((p:Product)=>p.featured);return (marked.length?marked:activeProducts.filter((p:Product)=>p.offer||p.badge)).slice(0,4)},[activeProducts]);
 const handleStoryAction=(story:any)=>{
  if(story.actionType==='category'){
   onCategory(story.actionValue||'فراخ');
  }else if(story.actionType==='branch'){
   onBranches?.();
  }else{
   onTab('menu');
  }
 };
 const setMode=(x:string)=>setDelivery(x.includes('استلام')?'استلام من الفرع':'توصيل للمنزل');
 const goCategory=(category:string)=>onCategory(category);
 const openLocationPicker=()=>{setLocationDraft(deliveryLocation||emptyDeliveryLocation);setLocationPicker(true)};
 const useCurrentLocation=async()=>{setLocationBusy(true);try{const detected=await detectAddress();setLocationDraft((prev:any)=>({...prev,zone:detected.zone,coords:detected.coords}));Alert.alert('تم تحديد منطقتك 📍',`المنطقة: ${detected.zone}\nيرجى كتابة اسم الشارع ورقم العقار.`)}catch(e:any){Alert.alert('تعذر تحديد المنطقة',e?.message||'اكتب منطقتك والعنوان يدوياً أو حاول مرة أخرى.')}finally{setLocationBusy(false)}};
 const saveDeliveryLocation=()=>{const fullAddress=locationDraft.fullAddress||[locationDraft.zone,locationDraft.street,locationDraft.building].filter(Boolean).join('، ');if(!locationDraft.zone&&!locationDraft.street&&!locationDraft.building&&!locationDraft.coords){Alert.alert('الموقع مطلوب','حدد موقعك بالـ GPS أو اكتب المنطقة والشارع.');return}onDeliveryLocationChange?.({...locationDraft,fullAddress});setLocationPicker(false)};
 const locationLabel=[deliveryLocation.zone,deliveryLocation.street,deliveryLocation.building].filter(Boolean).join('، ')||deliveryLocation.fullAddress||'حدد موقع التوصيل';
 const unreadNoticesCount = useMemo(() => (state.notices || []).filter((n: any) => !n.read && !isNoticeRead(n.id)).length, [state.notices]);
 const getInCartQty = (productId: string) => {
   return (state.cart || []).reduce((sum: number, line: any) => line.productId === productId ? sum + line.quantity : sum, 0);
 };
  return <ScrollView contentContainerStyle={{paddingBottom:24,alignItems:'center'}} showsVerticalScrollIndicator={false}>
  <View style={{width:'100%',maxWidth:680}}>
   {/* Branded home header inspired by the reference, using Rashidi colors. */}
   <View style={{marginHorizontal:8,marginTop:6,paddingHorizontal:16,paddingTop:13,paddingBottom:23,backgroundColor:activeScheme==='dark'?'#1B2633':'#FBE9B8',borderRadius:32,borderWidth:1,borderTopWidth:3,borderTopColor:C.gold,borderBottomWidth:0,borderBottomColor:'transparent',borderColor:activeScheme==='dark'?'#344252':'#E8BE52',overflow:'hidden',elevation:2}}>
    <View pointerEvents="none" style={{position:'absolute',right:66,top:-54,width:190,height:190,borderRadius:95,borderWidth:1.5,borderColor:activeScheme==='dark'?'rgba(244,201,92,0.4)':'rgba(193,145,38,0.38)'}}/><View pointerEvents="none" style={{position:'absolute',right:86,top:-34,width:150,height:150,borderRadius:75,borderWidth:1,borderColor:activeScheme==='dark'?'rgba(244,201,92,0.34)':'rgba(193,145,38,0.32)'}}/><View pointerEvents="none" style={{position:'absolute',right:106,top:-14,width:110,height:110,borderRadius:55,borderWidth:1,borderColor:activeScheme==='dark'?'rgba(244,201,92,0.28)':'rgba(193,145,38,0.28)'}}/>
    <View style={[s.row,{marginBottom:14}]}>
     <View style={{flexDirection:'row-reverse',alignItems:'center',flex:1,gap:10}}><FastImage source={images['brand-logo']} priority="high" style={{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:C.action}}/><Txt style={{fontFamily:fontRuqaaBold,fontSize:25,color:activeScheme==='dark'?'#FFFFFF':C.navy,fontWeight:'700',textAlign:'right',lineHeight:34}}>طيور الرشيدي</Txt></View>
     <View style={[s.row,{gap:6}]}>
      <Pressable accessibilityRole="button" accessibilityLabel={activeScheme==='dark'?'تفعيل الوضع الفاتح':'تفعيل الوضع الليلي'} onPress={onThemeToggle} style={[headerAction,{backgroundColor:activeScheme==='dark'?'#FFFFFF16':'#FFFFFFB8',borderColor:activeScheme==='dark'?'#FFFFFF40':'#FFFFFF'}]}><Ionicons name={activeScheme==='dark'?'sunny':'moon'} size={20} color={activeScheme==='dark'?'#FDE047':'#1E293B'}/></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="الإشعارات" onPress={onNotice} style={[headerAction,{backgroundColor:activeScheme==='dark'?'#FFFFFF16':'#FFFFFFB8',borderColor:activeScheme==='dark'?'#FFFFFF40':'#FFFFFF'}]}><Ionicons name="notifications" size={20} color={activeScheme==='dark'?'#FDE047':'#D97706'}/>{unreadNoticesCount>0&&<View style={badge}><Txt style={{fontSize:9,color:C.white,fontWeight:'900'}}>{unreadNoticesCount}</Txt></View>}</Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="حساب العميل" onPress={()=>onTab('account')} style={[headerAction,{backgroundColor:activeScheme==='dark'?'#FFFFFF16':'#FFFFFFB8',borderColor:activeScheme==='dark'?'#FFFFFF40':'#FFFFFF'}]}><Ionicons name="person-circle" size={22} color={activeScheme==='dark'?'#60A5FA':'#1E40AF'}/></Pressable>
     </View>
   </View>
    <View style={{backgroundColor:activeScheme==='dark'?'rgba(36, 52, 73, 0.85)':'rgba(255, 255, 255, 0.90)',borderWidth:1,borderColor:activeScheme==='dark'?'#3B4B60':'#F1F4F8',borderTopColor:activeScheme==='dark'?'rgba(255,255,255,0.20)':'rgba(255,255,255,0.95)',borderRadius:20,paddingHorizontal:12,paddingVertical:9,elevation:2,...(Platform.OS==='web'?{backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'}:{})}}>
     <Pressable accessibilityRole="button" accessibilityLabel="تحديد موقع التوصيل" onPress={openLocationPicker} style={[s.row,{justifyContent:'space-between',minHeight:32,marginBottom:8}]}><View style={{flexDirection:'row-reverse',alignItems:'center',gap:8,flex:1}}><View style={{width:29,height:29,borderRadius:15,backgroundColor:'rgba(225,29,72,0.14)',alignItems:'center',justifyContent:'center'}}><Ionicons name="location" size={19} color="#E11D48"/></View><View style={{alignItems:'flex-end',flex:1}}><Txt style={{color:C.navy,fontSize:10,fontWeight:'800',textAlign:'right'}}>التوصيل إلى</Txt><View style={{flexDirection:'row-reverse',alignItems:'center',gap:3}}><Txt numberOfLines={1} style={{fontSize:12,fontWeight:'800',maxWidth:'92%',color:C.ink,textAlign:'right'}}>{locationLabel}</Txt><Ionicons name="chevron-down" size={14} color={C.muted}/></View></View></View><Txt style={{color:C.muted,fontSize:10}}>حدد موقعك</Txt></Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel="البحث عن المنتجات" onPress={()=>onTab('menu')} style={{height:42,borderRadius:14,backgroundColor:activeScheme==='dark'?'rgba(23, 34, 48, 0.80)':'rgba(245, 247, 250, 0.85)',alignItems:'center',flexDirection:'row-reverse',gap:9,paddingHorizontal:12,borderWidth:1,borderColor:activeScheme==='dark'?'#34445A':'#E7EBF0',borderTopColor:activeScheme==='dark'?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.95)'}}><Ionicons name="search" size={19} color={C.action}/><Txt style={{fontSize:12,color:C.muted,textAlign:'right',flex:1}}>بتدور على إيه؟ ابحث عن منتجك</Txt></Pressable>
   </View>
    <View pointerEvents="none" style={{position:'absolute',left:0,right:0,bottom:-18,height:36}}><Svg width="100%" height="100%" viewBox="0 0 440 36" preserveAspectRatio="none"><Path d="M0 6 C24 6 24 15 48 15 C72 15 72 3 96 3 C120 3 120 12 144 12 C168 12 168 1 192 1 C216 1 216 10 240 10 C264 10 264 5 288 5 C312 5 312 14 336 14 C360 14 360 2 384 2 C408 2 408 10 432 10 L440 10 L440 36 L0 36 Z" fill={C.background}/><Path d="M0 6 C24 6 24 15 48 15 C72 15 72 3 96 3 C120 3 120 12 144 12 C168 12 168 1 192 1 C216 1 216 10 240 10 C264 10 264 5 288 5 C312 5 312 14 336 14 C360 14 360 2 384 2 C408 2 408 10 432 10 L440 10" fill="none" stroke={activeScheme==='dark'?'rgba(244,201,92,0.82)':'#E8BE52'} strokeWidth={1.5}/></Svg></View>
   </View>

   {state.storeStatus&&!state.storeStatus.isOpen&&<View style={{marginHorizontal:16,marginTop:12,backgroundColor:activeScheme==='dark'?'#2D1A1A':'#FEF2F2',borderWidth:1.5,borderColor:C.red,borderRadius:18,padding:14,flexDirection:'row-reverse',alignItems:'center',gap:12,elevation:3}}><View style={{width:40,height:40,borderRadius:20,backgroundColor:'rgba(214,40,50,0.14)',alignItems:'center',justifyContent:'center'}}><Ionicons name="time" size={24} color={C.red}/></View><View style={{flex:1,alignItems:'flex-end'}}><Txt style={{fontSize:14,fontWeight:'900',color:C.red,textAlign:'right'}}>المتجر مغلق مؤقتاً</Txt><Txt style={{fontSize:11,color:activeScheme==='dark'?'#FCA5A5':'#991B1B',marginTop:2,textAlign:'right'}}>{state.storeStatus.message||'نعتذر عن استقبال الطلبات في الوقت الحالي'}</Txt>{!!state.storeStatus.nextOpenTime&&<Txt style={{fontSize:11,fontWeight:'800',color:C.navy,marginTop:4,textAlign:'right'}}>موعد فتح استقبال الطلبات: {state.storeStatus.nextOpenTime}</Txt>}</View></View>}

   {/* Native two-way red delivery/pickup capsule */}
   <View style={{marginHorizontal:16,marginTop:3,backgroundColor:C.surface,borderWidth:1,borderColor:C.border,borderTopColor:activeScheme==='dark'?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.95)',borderBottomColor:activeScheme==='dark'?'rgba(255,255,255,0.05)':'rgba(226,232,240,0.7)',borderRadius:30,padding:4,elevation:2,flexDirection:'row-reverse',gap:6,...(Platform.OS==='web'?{backdropFilter:'blur(20px) saturate(180%)',WebkitBackdropFilter:'blur(20px) saturate(180%)'}:{})}}>{[{label:'توصيل للمنزل',icon:'bicycle'},{label:'استلام من الفرع',icon:'storefront'}].map(({label,icon})=>{const selected=(label.includes('استلام')&&delivery.includes('استلام'))||(!label.includes('استلام')&&delivery.includes('توصيل'));return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected}} key={label} onPress={()=>setMode(label)} style={{flex:1,height:46,borderRadius:24,backgroundColor:selected?C.action:'transparent',alignItems:'center',justifyContent:'center',flexDirection:'row-reverse',gap:7,shadowColor:selected?C.action:'transparent',shadowOffset:{width:0,height:3},shadowOpacity:selected?0.35:0,shadowRadius:6,elevation:selected?2:0}}><Ionicons name={icon as any} size={18} color={selected?C.actionText:C.muted}/><Txt style={{fontSize:12,fontWeight:selected?'900':'600',color:selected?C.actionText:C.muted}}>{label}</Txt></Pressable>})}</View>

   <StoriesBar stories={state.stories||[]} activeScheme={activeScheme} onAction={handleStoryAction}/>

   <RashidiCollageShowcase showcase={state.showcase} onOpen={()=>onTab('menu')} onCategory={onCategory} activeScheme={activeScheme}/>

   {/* Native squircle category strip */}
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingTop:18,paddingBottom:2,gap:14,flexDirection:'row-reverse'}}>{categories.map(c=>{const selected=state.categoryImages?.[c.category];const localKey=selected||c.image;const localImg=images[localKey];const source=selected?.startsWith('data:')||selected?.startsWith('http')?{uri:selected}:localImg||(cloudImages[localKey]?{uri:cloudImages[localKey]}:images.chicken);return <Pressable accessibilityRole="button" accessibilityLabel={`تصنيف ${c.title}`} key={c.category} onPress={()=>goCategory(c.category)} style={{width:70,minHeight:104,alignItems:'center'}}><View style={[s.card,{width:66,height:66,borderRadius:20,padding:5,marginBottom:0,alignItems:'center',justifyContent:'center',overflow:'hidden'}]}>{source?<FastImage source={source} contentFit="cover" style={{width:'100%',height:'100%',borderRadius:15}}/>:<View style={{flex:1,alignItems:'center',justifyContent:'center'}}><Ionicons name="image-outline" size={24} color={C.muted}/></View>}</View><Txt numberOfLines={2} style={{fontSize:10,fontWeight:'800',textAlign:'center',marginTop:6,lineHeight:14,color:C.ink}}>{c.title}</Txt></Pressable>})}</ScrollView>

   {/* Distinctive Interactive Offers Deals Section 🔥 (Above الأكثر طلباً) */}
   <MarqueeOffers
     state={state}
     activeProducts={activeProducts}
     onProduct={onProduct}
     onAdd={onAdd}
     activeScheme={activeScheme}
     onMore={()=>{if(onCategory)onCategory('عروض التوفير');else onTab('menu');}}
   />

   {/* Horizontal popular product cards like ModernGridProductCard */}
   <View style={{marginTop:14}}><SectionTitle title="الأكثر طلباً" onMore={()=>onTab('menu')}/></View>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,gap:14,flexDirection:'row-reverse'}}>{featured.map((p:Product)=><ProductCard key={p.id} product={p} compact inCartQty={getInCartQty(p.id)} onPress={()=>onProduct(p)} onAdd={()=>onProduct(p)}/>)}</ScrollView>

   {/* Native white rewards card with red emblem */}
   <Pressable onPress={()=>onTab('rewards')} style={[s.card,{marginHorizontal:16,marginTop:18,padding:14,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between'}]}><View style={{flexDirection:'row-reverse',alignItems:'center',flex:1,gap:10}}><View style={{width:44,height:44,borderRadius:22,backgroundColor:C.action,alignItems:'center',justifyContent:'center'}}><Ionicons name="star" size={21} color={C.actionText}/></View><View style={{flex:1,alignItems:'flex-end'}}><Txt style={{fontFamily:fontRuqaaBold,fontSize:21,color:C.navy,fontWeight:'700',textAlign:'right'}}>مكافآت طيور الرشيدي</Txt><Txt style={{fontSize:10,color:C.muted,textAlign:'right'}}>اجمع نقاط مع كل طلب واستبدلها بخصومات حصرية!</Txt></View></View><View style={{borderRadius:20,backgroundColor:state.registered?C.action:C.gold,paddingHorizontal:12,paddingVertical:8}}><Txt style={{fontSize:10,fontWeight:'900',color:state.registered?C.actionText:C.ink}}>{state.registered?`نقاطك: ${state.points}`:'سجّل لتفعيل النقط'}</Txt></View></Pressable>

   {/* Native featured 2-column section */}
   <View style={{marginTop:17}}><SectionTitle title="اختيارات مميزة" onMore={()=>onTab('menu')}/>{grid.length>0?(<View style={{paddingHorizontal:16,flexDirection:'row-reverse',flexWrap:'wrap',justifyContent:'space-between'}}>{grid.map((p:Product)=><ProductCard key={p.id} product={p} inCartQty={getInCartQty(p.id)} onPress={()=>onProduct(p)} onAdd={()=>onProduct(p)}/>)}</View>):(<View style={{paddingHorizontal:16}}><ProductGridSkeleton count={4}/></View>)}</View>

{/* Branch heritage card */}
   <View style={[s.card,{marginHorizontal:16,marginTop:18,marginBottom:10,padding:15}]}><View style={[s.row,{marginBottom:10}]}><Txt style={{fontFamily:fontRuqaaBold,fontSize:22,fontWeight:'700',color:C.navy,textAlign:'right'}}>فروعنا في الإسكندرية</Txt><Pressable onPress={onBranches} style={{minHeight:40,justifyContent:'center'}}><View style={{flexDirection:'row-reverse',alignItems:'center',gap:3}}><Txt style={{fontSize:11,color:C.red,fontWeight:'900'}}>كل الفروع والخريطة</Txt><Ionicons name="chevron-back" size={14} color={C.red}/></View></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10,flexDirection:'row-reverse'}}>{branchDetails.map(b=><Pressable key={b.name} onPress={()=>setBranch(b.name)} style={{width:205,borderRadius:16,backgroundColor:C.surfaceAlt,borderWidth:1,borderColor:C.border,overflow:'hidden'}}><FastImage source={getBranchImageSource(b, state.branchImages)} contentFit="cover" style={{width:205,height:96}}/><View style={{padding:10,alignItems:'flex-end'}}><Txt numberOfLines={1} style={{fontWeight:'900',fontSize:13,color:C.navy,textAlign:'right'}}>{b.name}</Txt><Txt numberOfLines={1} style={{fontSize:10.5,color:C.muted,marginTop:2,textAlign:'right'}}>{b.phone}</Txt></View></Pressable>)}</ScrollView></View>
   <AppFooter onTerms={onTerms} onPrivacy={onPrivacy}/>
  </View>
   <Modal visible={locationPicker} transparent animationType="slide" onRequestClose={()=>setLocationPicker(false)}><View style={{flex:1,justifyContent:'flex-end',backgroundColor:'#0007'}}><Pressable accessibilityRole="button" accessibilityLabel="إغلاق تحديد الموقع" onPress={()=>setLocationPicker(false)} style={StyleSheet.absoluteFill}/><View style={{backgroundColor:C.solidSurface,borderTopLeftRadius:28,borderTopRightRadius:28,padding:20,paddingBottom:28,maxHeight:'88%',borderWidth:1,borderColor:C.border}}><View style={[s.row,{marginBottom:8}]}><Txt style={{fontSize:20,fontWeight:'900',color:C.navy}}>موقع التوصيل</Txt><Pressable accessibilityRole="button" accessibilityLabel="إغلاق" onPress={()=>setLocationPicker(false)} style={{width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:22,backgroundColor:C.surfaceAlt,borderWidth:1,borderColor:C.border}}><Ionicons name="close" size={20} color={C.navy}/></Pressable></View><Txt style={s.small}>حدد موقعك بدقة؛ سنضيفه تلقائياً إلى عنوان الطلب عند إتمام الشراء.</Txt><Button title={locationBusy?'جارٍ تحديد منطقتك…':'تحديد منطقتي بالـ GPS 📍'} disabled={locationBusy} onPress={useCurrentLocation} style={{marginTop:12,marginBottom:8}}/>{!!locationDraft.coords&&<Txt style={[s.small,{color:C.green,marginBottom:8}]}>تم تحديد الموقع · {locationDraft.coords}</Txt>}<Field label="المنطقة" value={locationDraft.zone} onChangeText={(zone:string)=>setLocationDraft(x=>({...x,zone}))} placeholder="مثال: سموحة أو كامب شيزار"/><Field label="الشارع" value={locationDraft.street} onChangeText={(street:string)=>setLocationDraft(x=>({...x,street}))} placeholder="اسم الشارع أو أقرب علامة مميزة"/><Field label="رقم العقار أو الشقة" value={locationDraft.building} onChangeText={(building:string)=>setLocationDraft(x=>({...x,building}))} placeholder="رقم العقار، الدور، الشقة"/><Button title="حفظ موقع التوصيل" onPress={saveDeliveryLocation} style={{marginTop:8}}/></View></View></Modal>
 </ScrollView>
}

interface RashidiCollageShowcaseProps {
  showcase?: RashidiShowcaseConfig;
  banners?: any[];
  onOpen: () => void;
  onCategory?: (category: string) => void;
  activeScheme?: 'light' | 'dark';
}

function getShowcaseImage(card?: ShowcaseCard, fallbackKey = 'story-fresh-chicken') {
  if (!card) {
    return images[fallbackKey] || (cloudImages[fallbackKey] ? { uri: cloudImages[fallbackKey] } : images.chicken);
  }
  if (card.image && images[card.image]) {
    return images[card.image];
  }
  if (card.imageUrl && card.imageUrl.startsWith('http')) {
    return { uri: card.imageUrl };
  }
  if (card.imageUri && (card.imageUri.startsWith('http') || card.imageUri.startsWith('data:image/'))) {
    return { uri: card.imageUri };
  }
  if (card.image && cloudImages[card.image]) {
    return { uri: cloudImages[card.image] };
  }
  return images[fallbackKey] || (cloudImages[fallbackKey] ? { uri: cloudImages[fallbackKey] } : images.chicken);
}

export function RashidiCollageShowcase({
  showcase,
  onOpen,
  onCategory,
  activeScheme = 'light',
}: RashidiCollageShowcaseProps) {
  const cfg = showcase || defaultShowcaseConfig;
  const preset1 = cfg.preset1 || defaultShowcaseConfig.preset1;
  const preset2 = cfg.preset2 || defaultShowcaseConfig.preset2;
  const autoRotate = cfg.autoRotate !== false;
  const intervalSeconds = typeof cfg.intervalSeconds === 'number' && cfg.intervalSeconds > 0 ? cfg.intervalSeconds : 5.5;

  const { width: windowWidth } = useWindowDimensions();
  const screenWidth = Math.min(windowWidth, 680) - 32;
  const [width, setWidth] = useState(screenWidth);
  const [activeTab, setActiveTab] = useState<'fresh' | 'baladi'>('fresh');
  const activeTabRef = useRef<'fresh' | 'baladi'>('fresh');
  activeTabRef.current = activeTab;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Responsive bento container sizing (fills 100% width cleanly)
  const bentoHeight = Math.max(250, Math.min(Math.round(width * 0.70), 310));

  // Silky smooth crossfade transition
  const switchTab = useCallback((nextTab: 'fresh' | 'baladi') => {
    if (nextTab === activeTabRef.current) return;
    Animated.timing(fadeAnim, {
      toValue: 0.15,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setActiveTab(nextTab);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  // Smooth automatic rotation if enabled
  useEffect(() => {
    if (!autoRotate) return;
    const timer = setInterval(() => {
      const next = activeTabRef.current === 'fresh' ? 'baladi' : 'fresh';
      switchTab(next);
    }, Math.max(3000, Math.round(intervalSeconds * 1000)));
    return () => clearInterval(timer);
  }, [switchTab, autoRotate, intervalSeconds]);

  const handleCardPress = (cat: string) => {
    if (onCategory) {
      onCategory(cat);
    } else {
      onOpen();
    }
  };

  const isFresh = activeTab === 'fresh';
  const currentPreset = isFresh ? preset1 : preset2;
  const heroCard = currentPreset.heroCard;
  const upperCard = currentPreset.upperCard;
  const lowerCard = currentPreset.lowerCard;

  const heroImgSource = getShowcaseImage(heroCard, isFresh ? 'story-fresh-chicken' : 'story-baladi-poultry');
  const upperImgSource = getShowcaseImage(upperCard, isFresh ? 'story-shish-tawook' : 'product-burger');
  const lowerImgSource = getShowcaseImage(lowerCard, isFresh ? 'story-fresh-panee' : 'product-marinated-shawerma');

  return (
    <View
      onLayout={(event) => {
        const layoutWidth = event.nativeEvent.layout.width;
        if (layoutWidth > 0 && Math.abs(layoutWidth - width) > 2) {
          setWidth(layoutWidth);
        }
      }}
      style={{
        marginHorizontal: 16,
        marginTop: 14,
        marginBottom: 6,
      }}>
      {/* Top Editorial Showcase Header */}
      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 10,
          paddingHorizontal: 2,
        }}>
        <View style={{ alignItems: 'flex-end', flexShrink: 1, minWidth: 160 }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
            <Txt
              style={{
                fontFamily: fontRuqaaBold,
                fontSize: 22,
                color: activeScheme === 'dark' ? '#FFFFFF' : C.navy,
                fontWeight: '700',
                textAlign: 'right',
                lineHeight: 28,
              }}>
              {cfg.title || 'سفرة الرشيدي'}
            </Txt>
            <View
              style={{
                backgroundColor: 'rgba(225, 29, 72, 0.12)',
                borderRadius: 8,
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderWidth: 1,
                borderColor: 'rgba(225, 29, 72, 0.25)',
              }}>
              <Txt style={{ fontSize: 9.5, fontWeight: '900', color: C.action }}>
                {cfg.badge || 'مختارات اليوم'}
              </Txt>
            </View>
          </View>
          <Txt numberOfLines={1} style={{ fontSize: 10.5, color: C.muted, marginTop: 1, textAlign: 'right' }}>
            {cfg.subtitle || 'طازجة يومياً من المزرعة والمذبح مباشرة'}
          </Txt>
        </View>

        {/* Tab Segment Controls */}
        <View
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            backgroundColor: activeScheme === 'dark' ? 'rgba(30, 41, 59, 0.75)' : '#F1F5F9',
            padding: 3,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: activeScheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            gap: 3,
            flexShrink: 0,
          }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={preset1.label || 'دواجن ومتبلات'}
            onPress={() => switchTab('fresh')}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 11,
              backgroundColor: isFresh ? C.action : 'transparent',
            }}>
            <Txt
              style={{
                fontSize: 11,
                fontWeight: '900',
                color: isFresh ? C.actionText : C.muted,
              }}>
              {preset1.label || 'دواجن ومتبلات'}
            </Txt>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={preset2.label || 'بط وبلدي'}
            onPress={() => switchTab('baladi')}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 11,
              backgroundColor: !isFresh ? C.action : 'transparent',
            }}>
            <Txt
              style={{
                fontSize: 11,
                fontWeight: '900',
                color: !isFresh ? C.actionText : C.muted,
              }}>
              {preset2.label || 'بط وبلدي'}
            </Txt>
          </Pressable>
        </View>
      </View>

      {/* Bento Grid Container */}
      <Animated.View
        style={{
          width: '100%',
          height: bentoHeight,
          flexDirection: 'row-reverse',
          gap: 10,
          opacity: fadeAnim,
        }}>
        {/* Right Column: Hero Anchor Card (56% width) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={heroCard.title}
          onPress={() => handleCardPress(heroCard.category || 'فراخ')}
          style={({ pressed }) => [
            {
              flex: 1.25,
              height: '100%',
              borderRadius: 20,
              overflow: 'hidden',
              backgroundColor: '#0B172C',
              borderWidth: 1,
              borderColor: activeScheme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.16,
              shadowRadius: 8,
              opacity: pressed ? 0.94 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            },
          ]}>
          <FastImage
            source={heroImgSource}
            contentFit="cover"
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
          />

          {/* SVG Smooth Gradient Scrim */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg height="100%" width="100%">
              <Defs>
                <LinearGradient id="heroGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#0B172C" stopOpacity="0.30" />
                  <Stop offset="40%" stopColor="#0B172C" stopOpacity="0.10" />
                  <Stop offset="65%" stopColor="#0B172C" stopOpacity="0.75" />
                  <Stop offset="100%" stopColor="#0B172C" stopOpacity="0.96" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroGrad)" />
            </Svg>
          </View>

          {/* Top Floating Glass Capsule */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              backgroundColor: 'rgba(11, 23, 44, 0.72)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.20)',
              paddingHorizontal: 8,
              paddingVertical: 3.5,
              flexDirection: 'row-reverse',
              alignItems: 'center',
              gap: 4,
            }}>
            <Ionicons name={isFresh ? 'sparkles' : 'shield-checkmark'} size={11} color={isFresh ? '#FFD700' : '#34D399'} />
            <Txt style={{ color: '#FFFFFF', fontSize: 9.5, fontWeight: '900' }}>
              {heroCard.badge || (isFresh ? 'طازة فجر اليوم' : 'بلدي فلاحي')}
            </Txt>
          </View>

          {/* Bottom Card Content */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              left: 0,
              paddingHorizontal: width < 360 ? 9 : 12,
              paddingBottom: width < 360 ? 9 : 12,
              alignItems: 'flex-end',
            }}>
            <Txt
              numberOfLines={1}
              style={{
                fontFamily: fontRuqaaBold,
                fontSize: Math.min(21, Math.max(16, Math.round(width * 0.052))),
                color: '#FFFFFF',
                fontWeight: '700',
                textAlign: 'right',
                lineHeight: 26,
              }}>
              {heroCard.title}
            </Txt>
            {!!heroCard.subtitle && (
              <Txt
                numberOfLines={1}
                style={{
                  fontSize: 10.5,
                  fontWeight: '800',
                  color: '#FDE047',
                  marginTop: 2,
                  textAlign: 'right',
                }}>
                {heroCard.subtitle}
              </Txt>
            )}
            {!!heroCard.note && (
              <Txt
                numberOfLines={1}
                style={{
                  fontSize: 9,
                  fontWeight: '700',
                  color: '#94A3B8',
                  marginTop: 2,
                  marginBottom: 7,
                  textAlign: 'right',
                }}>
                {heroCard.note}
              </Txt>
            )}
            <View
              style={{
                backgroundColor: C.action,
                borderRadius: 10,
                paddingHorizontal: 11,
                paddingVertical: 5,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 5,
                elevation: 2,
              }}>
              <Txt style={{ color: C.actionText, fontSize: 11, fontWeight: '900' }}>
                {heroCard.btnText || 'اطلب الآن'}
              </Txt>
              <Ionicons name="arrow-back" size={12} color={C.actionText} />
            </View>
          </View>
        </Pressable>

        {/* Left Column: Stacked Secondary Cards (44% width via flex) */}
        <View style={{ flex: 1, height: '100%', justifyContent: 'space-between', gap: 10 }}>
          {/* Upper Secondary Card */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={upperCard.title}
            onPress={() => handleCardPress(upperCard.category || 'متبلات')}
            style={({ pressed }) => [
              {
                width: '100%',
                flex: 1,
                borderRadius: 18,
                overflow: 'hidden',
                backgroundColor: '#0B172C',
                borderWidth: 1,
                borderColor: activeScheme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
                elevation: 3,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.14,
                shadowRadius: 6,
                opacity: pressed ? 0.94 : 1,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              },
            ]}>
            <FastImage
              source={upperImgSource}
              contentFit="cover"
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
            />
            {/* SVG Gradient */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <Svg height="100%" width="100%">
                <Defs>
                  <LinearGradient id="upperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#0B172C" stopOpacity="0.25" />
                    <Stop offset="45%" stopColor="#0B172C" stopOpacity="0.20" />
                    <Stop offset="75%" stopColor="#0B172C" stopOpacity="0.85" />
                    <Stop offset="100%" stopColor="#0B172C" stopOpacity="0.96" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#upperGrad)" />
              </Svg>
            </View>

            {/* Top Tag Pill */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 7,
                right: 7,
                backgroundColor: 'rgba(11, 23, 44, 0.72)',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.20)',
                paddingHorizontal: 6,
                paddingVertical: 2.5,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 3,
              }}>
              <Ionicons name={isFresh ? 'flame' : 'star'} size={10} color={isFresh ? '#FB7185' : '#FBBF24'} />
              <Txt style={{ color: '#FFFFFF', fontSize: 8.5, fontWeight: '900' }}>
                {upperCard.badge || (isFresh ? 'تتبيلات الشيف' : 'تجهيز فاخر')}
              </Txt>
            </View>

            {/* Content at Bottom */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                left: 0,
                paddingHorizontal: 9,
                paddingBottom: 8,
                alignItems: 'flex-end',
              }}>
              <View
                style={{
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}>
                <Txt
                  numberOfLines={1}
                  style={{
                    fontFamily: fontRuqaaBold,
                    fontSize: 16,
                    color: '#FFFFFF',
                    fontWeight: '700',
                    textAlign: 'right',
                    lineHeight: 20,
                  }}>
                  {upperCard.title}
                </Txt>
                <Ionicons name="chevron-back" size={13} color="rgba(255, 255, 255, 0.7)" />
              </View>
              {!!upperCard.subtitle && (
                <Txt
                  numberOfLines={1}
                  style={{
                    fontSize: 9.5,
                    fontWeight: '700',
                    color: '#FECDD3',
                    marginTop: 1,
                    textAlign: 'right',
                  }}>
                  {upperCard.subtitle}
                </Txt>
              )}
            </View>
          </Pressable>

          {/* Lower Secondary Card */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={lowerCard.title}
            onPress={() => handleCardPress(lowerCard.category || 'أجزاء دواجن')}
            style={({ pressed }) => [
              {
                width: '100%',
                flex: 1,
                borderRadius: 18,
                overflow: 'hidden',
                backgroundColor: '#0B172C',
                borderWidth: 1,
                borderColor: activeScheme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
                elevation: 3,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.14,
                shadowRadius: 6,
                opacity: pressed ? 0.94 : 1,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              },
            ]}>
            <FastImage
              source={lowerImgSource}
              contentFit="cover"
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
            />
            {/* SVG Gradient */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <Svg height="100%" width="100%">
                <Defs>
                  <LinearGradient id="lowerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#0B172C" stopOpacity="0.25" />
                    <Stop offset="45%" stopColor="#0B172C" stopOpacity="0.20" />
                    <Stop offset="75%" stopColor="#0B172C" stopOpacity="0.85" />
                    <Stop offset="100%" stopColor="#0B172C" stopOpacity="0.96" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#lowerGrad)" />
              </Svg>
            </View>

            {/* Top Tag Pill */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 7,
                right: 7,
                backgroundColor: 'rgba(11, 23, 44, 0.72)',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.20)',
                paddingHorizontal: 6,
                paddingVertical: 2.5,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 3,
              }}>
              <Ionicons name={isFresh ? 'ribbon' : 'flash'} size={10} color={isFresh ? '#38BDF8' : '#F472B6'} />
              <Txt style={{ color: '#FFFFFF', fontSize: 8.5, fontWeight: '900' }}>
                {lowerCard.badge || (isFresh ? 'الأكثر طلباً' : 'سريع التحضير')}
              </Txt>
            </View>

            {/* Content at Bottom */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                left: 0,
                paddingHorizontal: 9,
                paddingBottom: 8,
                alignItems: 'flex-end',
              }}>
              <View
                style={{
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}>
                <Txt
                  numberOfLines={1}
                  style={{
                    fontFamily: fontRuqaaBold,
                    fontSize: 16,
                    color: '#FFFFFF',
                    fontWeight: '700',
                    textAlign: 'right',
                    lineHeight: 20,
                  }}>
                  {lowerCard.title}
                </Txt>
                <Ionicons name="chevron-back" size={13} color="rgba(255, 255, 255, 0.7)" />
              </View>
              {!!lowerCard.subtitle && (
                <Txt
                  numberOfLines={1}
                  style={{
                    fontSize: 9.5,
                    fontWeight: '700',
                    color: '#BAE6FD',
                    marginTop: 1,
                    textAlign: 'right',
                  }}>
                  {lowerCard.subtitle}
                </Txt>
              )}
            </View>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

export const HeroCarousel = RashidiCollageShowcase;

const headerAction:any={width:38,height:38,borderRadius:19,backgroundColor:'rgba(255,255,255,0.13)',borderWidth:1,borderColor:'rgba(255,255,255,0.28)',alignItems:'center',justifyContent:'center'};
const badge:any={position:'absolute',top:-2,right:-1,minWidth:17,height:17,borderRadius:9,backgroundColor:C.red,alignItems:'center',justifyContent:'center'};


