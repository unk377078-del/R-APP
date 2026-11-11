import AsyncStorage from '@react-native-async-storage/async-storage';
import React,{useEffect,useRef,useState} from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { Alert,Animated,BackHandler,Easing,Image,Linking,Modal,Pressable,ScrollView,StatusBar,Text,View,I18nManager,Platform,useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useFonts } from 'expo-font';
import { ArefRuqaa_400Regular,ArefRuqaa_700Bold } from '@expo-google-fonts/aref-ruqaa';
import { Rubik_400Regular,Rubik_500Medium,Rubik_700Bold,Rubik_900Black } from '@expo-google-fonts/rubik';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { AppNotice,AppStory,CartLine,Order,Product,isOrderPending } from './src/models';
import { initialState,AppState,loadState,saveState,saveProductsCache } from './src/store';
import { defaultProductsCatalog } from './src/productCatalog';
import { playNewOrderSound } from './src/soundAlert';
import { C,fontRuqaaBold,s,setColorScheme } from './src/theme';
import { calculateEarnedPoints,toCartLine } from './src/ViewModels';
import { getProductPrepGroups } from './src/preparation';
import { AccountScreen } from './src/AccountScreen';
import { BranchesScreen } from './src/BranchesScreen';
import { AboutScreen } from './src/AboutScreen';
import { LoginScreen } from './src/LoginScreen';
import { LoadingScreen } from './src/LoadingScreen';
import { AppFooter, PrivacyScreen, TermsScreen } from './src/LegalScreens';
import { createCustomerAccount, deleteCustomerAccount, normalizePhone, signInExistingCustomer, signOutCustomer } from './src/customerAuth';
import { ADMIN_EMAIL, signInAdmin, signOutAdmin } from './src/adminAuth';
import { CartScreen } from './src/CartScreen';
import { prefetchImages } from './src/FastImage';
import { allCloudImageUrls } from './src/cloudAssets';
import { DashboardScreen } from './src/DashboardScreen';
import { HomeScreen } from './src/HomeScreen';
import { ProductsScreen } from './src/ProductsScreen';
import { RewardsScreen } from './src/RewardsScreen';
import { NotificationCenter } from './src/NotificationCenter';
import { Button,Chip,Field,FontScaleContext,ScreenTitle,Txt,displayUnit } from './src/ui';
import { branchDetails,images } from './src/nativeAssets';
import { auth,isFirebaseConfigured } from './src/firebase';
import { deleteCouponFromFirestore, deleteProductFromFirestore, saveBadgesToFirestore, saveBannersToFirestore, saveStoriesToFirestore, saveShowcaseToFirestore, saveCategoryImagesToFirestore, saveBranchImagesToFirestore, saveCouponToFirestore, saveLoyaltyToFirestore, saveOrderToFirestore, saveProductToFirestore, saveStoreStatusToFirestore, subscribeAppSettings, subscribeCoupons, subscribeOrders, subscribeProducts, subscribeCustomerNotifications, subscribeCustomerPoints, updateFirestoreOrderStatus, broadcastPromotionToFirestore, getNextOrderSequence } from './src/firebaseStore';
import { RashidiShowcaseConfig } from './src/models';
import { initNotificationsStorage, isNoticeCleared, isNoticeRead, markAllNoticesAsCleared, markNoticeAsCleared, markNoticeAsRead } from './src/notificationsStorage';
import { ProductCustomizationSheet } from './src/ProductCustomizationSheet';
import { requestNotificationPermission, triggerDeviceNotification } from './src/systemNotifications';

type Tab='home'|'menu'|'rewards'|'account';
type ModalName='none'|'cart'|'product'|'editCart'|'auth'|'admin'|'orders'|'notifications'|'branches'|'about'|'terms'|'privacy';
type AuthMode='register'|'login'|'edit';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);
if(Platform.OS==='web'&&typeof document!=='undefined'){
 document.documentElement.dir='rtl';
 document.documentElement.lang='ar';
 if(!document.getElementById('rashidi-google-fonts')){
  const link=document.createElement('link');
  link.id='rashidi-google-fonts';
  link.rel='stylesheet';
  link.href='https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Rubik:wght@400;500;700;900&family=Cairo:wght@400;600;700;900&display=swap';
  document.head.appendChild(link);
 }
 if(!document.getElementById('rashidi-rtl-style')){
  const style=document.createElement('style');
  style.id='rashidi-rtl-style';
  style.innerHTML='html,body,#root,#root>div{direction:rtl!important;text-align:right!important;font-family:Rubik,Cairo,sans-serif!important;}input,textarea{direction:rtl!important;text-align:right!important;}';
  document.head.appendChild(style);
 }
}
const money=(n:number)=>`${Math.round(n)} ج.م`;
const touch=()=>Haptics.selectionAsync().catch(()=>{});

class AppErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
 constructor(props: any) {
  super(props);
  this.state = { hasError: false, error: null };
 }
 static getDerivedStateFromError(error: any) {
  return { hasError: true, error };
 }
 componentDidCatch(error: any, errorInfo: any) {
  console.warn('Root ErrorBoundary caught:', error, errorInfo);
 }
 render() {
  if (this.state.hasError) {
   return (
    <View style={{flex: 1, backgroundColor: '#0e2f65', alignItems: 'center', justifyContent: 'center', padding: 24}}>
     <Text style={{color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 12}}>طيور الرشيدي</Text>
     <Text style={{color: '#F8F6F0', fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22}}>نعتذر، حدث خطأ أثناء تشغيل الصفحة. اضغط بالأسفل لإعادة المحاولة.</Text>
     <Pressable onPress={() => this.setState({hasError: false, error: null})} style={{backgroundColor: '#D97706', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14}}>
      <Text style={{color: '#fff', fontSize: 16, fontWeight: '700'}}>إعادة المحاولة</Text>
     </Pressable>
    </View>
   );
  }
  return this.props.children;
 }
}

export default function App(){
 const deviceScheme=useColorScheme();
 const [fontsLoaded,fontError]=useFonts({
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_700Bold,
  Rubik_900Black,
  ArefRuqaa_400Regular,
  ArefRuqaa_700Bold,
  'Rubik': Rubik_400Regular,
  'Rubik-Regular': Rubik_400Regular,
  'Rubik-Medium': Rubik_500Medium,
  'Rubik-Bold': Rubik_700Bold,
  'Rubik-Black': Rubik_900Black,
  'ArefRuqaa': ArefRuqaa_400Regular,
  'ArefRuqaa-Bold': ArefRuqaa_700Bold,
  ...Ionicons.font
 });
 const [loadedState,setLoadedState]=useState<AppState|null>(null);
 const [introComplete,setIntroComplete]=useState(false);
 const [fontTimeoutPassed,setFontTimeoutPassed]=useState(false);

 useEffect(()=>{
  loadState().then(s=>setLoadedState(s)).catch(()=>setLoadedState(initialState));
  // Ultra-fast font timeout for instant launch
  const timer=setTimeout(()=>setFontTimeoutPassed(true), 150);
  return ()=>clearTimeout(timer);
 },[]);

 const fontsReady=fontsLoaded||Boolean(fontError)||fontTimeoutPassed;
 const activeScheme=(loadedState?.themeMode||'system')==='system'?(deviceScheme==='dark'?'dark':'light'):(loadedState?.themeMode||'light');
 setColorScheme(activeScheme as any);

 if(!fontsReady||!introComplete||!loadedState)return <LoadingScreen message="نجهّز التطبيق…" onComplete={()=>setIntroComplete(true)}/>;
 return (
  <SafeAreaProvider>
   <AppErrorBoundary>
    <AppContent initialLoadedState={loadedState}/>
   </AppErrorBoundary>
  </SafeAreaProvider>
 );
}
function AppContent({initialLoadedState}:any){
 const [state,setState]=useState<AppState>(initialLoadedState||initialState);const [loaded,setLoaded]=useState(Boolean(initialLoadedState));const [firebaseStatus,setFirebaseStatus]=useState<'offline'|'connecting'|'connected'|'error'>(isFirebaseConfigured?'connecting':'offline');const [entered,setEntered]=useState(false);const [adminAuthenticated,setAdminAuthenticated]=useState(false);const [tab,setTab]=useState<Tab>('home');const [modal,setModal]=useState<ModalName>('none');const [modalReturnTo,setModalReturnTo]=useState<ModalName>('none');const [product,setProduct]=useState<Product|null>(null);const [editingLine,setEditingLine]=useState<CartLine|null>(null);const [authMode,setAuthMode]=useState<AuthMode>('register');const [delivery,setDelivery]=useState('توصيل للمنزل');const [branch,setBranch]=useState(initialLoadedState?.branch||initialState.branch);const [search,setSearch]=useState('');const [searchFocusRequest,setSearchFocusRequest]=useState(0);const [filter,setFilter]=useState('الكل');const [toast,setToast]=useState('');const [popup,setPopup]=useState<AppNotice|null>(null);const notified=useRef('');
 const [adminDashboardTab,setAdminDashboardTab]=useState<string>('الملخص');
 const [adminNewOrderBanner,setAdminNewOrderBanner]=useState<Order|null>(null);
 const [showNotificationPrompt,setShowNotificationPrompt]=useState(false);
 const prevAdminOrderIdsRef=useRef<Set<string>|null>(null);
 const [flyingProduct,setFlyingProduct]=useState<Product|null>(null);
 const flyAnim=useRef(new Animated.Value(0)).current;
 const cartBounce=useRef(new Animated.Value(1)).current;
 const triggerFlyToCart=(p:Product)=>{
  setFlyingProduct(p);
  flyAnim.setValue(0);
  Animated.timing(flyAnim,{toValue:1,duration:650,easing:Easing.bezier(0.18,0.89,0.32,1),useNativeDriver:true}).start(({finished})=>{
   if(finished){
    setFlyingProduct(null);
    Animated.sequence([
     Animated.timing(cartBounce,{toValue:1.35,duration:110,useNativeDriver:true}),
     Animated.spring(cartBounce,{toValue:1,friction:3.5,tension:50,useNativeDriver:true})
    ]).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});
   }
  });
 };
 const deviceScheme=useColorScheme();const activeScheme=state.themeMode==='system'?(deviceScheme==='dark'?'dark':'light'):state.themeMode;setColorScheme(activeScheme);
 useEffect(()=>{
   initNotificationsStorage().catch(()=>{});
   requestNotificationPermission().catch(()=>{});
   AsyncStorage.getItem('@rashidi_notif_prompt_seen').then((seen)=>{
     if(!seen){
       const t=setTimeout(()=>setShowNotificationPrompt(true), 1200);
       return ()=>clearTimeout(t);
     }
   }).catch(()=>{});
 },[]);
 useEffect(()=>{if(!initialLoadedState){loadState().then(x=>{setState(x);setBranch(x.branch)}).catch(()=>setFirebaseStatus('error')).finally(()=>setLoaded(true))}},[initialLoadedState]);
 useEffect(()=>{if(!auth)return;return onAuthStateChanged(auth,user=>{const isAdmin=user?.email?.toLowerCase()===ADMIN_EMAIL;setAdminAuthenticated(isAdmin);if(user)setEntered(true)})},[]);
 useEffect(()=>{if(loaded&&isFirebaseConfigured&&auth?.currentUser&&auth.currentUser.email?.toLowerCase()!==ADMIN_EMAIL)saveState(state).catch(()=>setFirebaseStatus('error'))},[state,loaded,auth?.currentUser?.uid]);
 useEffect(()=>{
  if(!loaded)return;
  const safetyTimer=setTimeout(()=>{
   setState(current=>{
    if(!current.products||!current.products.length){
     return {...current,products:defaultProductsCatalog};
    }
    return current;
   });
  },2500);

  if(!isFirebaseConfigured)return ()=>clearTimeout(safetyTimer);
  setFirebaseStatus('connecting');
  const stopProducts=subscribeProducts((remoteProducts)=>{
   clearTimeout(safetyTimer);
   if(remoteProducts.length){
    const urls = remoteProducts.map(p => p.imageUri).filter((u): u is string => typeof u === 'string');
    prefetchImages(urls);
    setState(current=>{
     const updated=remoteProducts.map(remote=>{
      const local=current.products.find(item=>item.id===remote.id);
      return {...local,...remote,emoji:local?.emoji??remote.emoji,image:remote.image??local?.image};
     });
     saveProductsCache(updated).catch(()=>{});
     return {...current,products:updated};
    });
   }
   setFirebaseStatus('connected');
  },()=>{
   clearTimeout(safetyTimer);
   setFirebaseStatus('error');
   setState(current=>{
    if(!current.products||!current.products.length){
     return {...current,products:defaultProductsCatalog};
    }
    return current;
   });
  });
  const stopCoupons=subscribeCoupons((remoteCoupons)=>setState(current=>({...current,coupons:remoteCoupons})),()=>setFirebaseStatus('error'));
  const stopNotifications=subscribeCustomerNotifications(auth?.currentUser?.uid||'',(notice:AppNotice,isLive:boolean)=>{
   setState(current=>{
    if(current.notices.some(item=>item.id===notice.id))return current;
    return {...current,notices:[notice,...current.notices]};
   });
   triggerDeviceNotification({
    title: notice.title,
    body: notice.message,
    channelId: notice.kind==='order'?'orders':'promotions',
    data: { id: notice.id, target: notice.target },
   }).catch(()=>{});
   if(isLive&&!isNoticeRead(notice.id)&&!isNoticeCleared(notice.id)){
    setPopup(notice);
   }
  },()=>setFirebaseStatus('error'),state.contact||'',state.email||'');
  const stopSettings=subscribeAppSettings((settings)=>{
   setState(current=>({
    ...current,
    ...(settings.storeStatus?{storeStatus:settings.storeStatus}:{}),
    ...(settings.loyalty?{loyalty:settings.loyalty.enabled,pointValue:settings.loyalty.pointValue,earnRate:settings.loyalty.earnRate,specialEarnRate:settings.loyalty.specialEarnRate,minPoints:settings.loyalty.minPoints}:{}),
    ...(settings.categoryImages?{categoryImages:settings.categoryImages}:{}),
    ...(settings.branchImages?{branchImages:settings.branchImages}:{}),
    ...(settings.badges?{badges:settings.badges}:{}),
    ...(settings.banners?{banners:settings.banners.map(banner=>{const old=current.banners.find(item=>item.id===banner.id);return {...old,...banner,image:banner.imageUri?undefined:banner.image??old?.image,imageUri:banner.imageUri??old?.imageUri}})}:{}),
    ...(settings.stories&&settings.stories.length?{stories:settings.stories}:{}),
    ...(settings.showcase?{showcase:settings.showcase}:{}),
   }));
  },()=>setFirebaseStatus('error'));
  return ()=>{clearTimeout(safetyTimer);stopProducts?.();stopSettings?.();stopCoupons?.();stopNotifications?.()};
 },[loaded,entered,state.contact,auth?.currentUser?.uid]);
 useEffect(() => {
  if (!loaded) return;
  const uid = auth?.currentUser?.uid || '';
  if (!adminAuthenticated && !uid) return;
  return subscribeOrders(uid, adminAuthenticated, (orders) => {
    const sorted = [...orders].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    setState((current) => {
      const map = new Map<string, Order>();
      (current.orders || []).forEach((o) => map.set(String(o.id), o));
      sorted.forEach((o) => {
        const existing = map.get(String(o.id));
        if (!existing || (o.updatedAt || o.createdAt || 0) >= (existing.updatedAt || existing.createdAt || 0)) {
          map.set(String(o.id), o);
        }
      });
      return {
        ...current,
        orders: Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
      };
    });
  }, (err) => {
    console.warn('App subscribeOrders error:', err);
    setFirebaseStatus('error');
  });
 }, [loaded, adminAuthenticated, auth?.currentUser?.uid]);
 useEffect(()=>{if(!loaded||!state.registered||!auth?.currentUser?.uid)return;return subscribeCustomerPoints(auth.currentUser.uid,(points)=>setState(current=>current.points===points?current:{...current,points}),()=>setFirebaseStatus('error'))},[loaded,state.registered,auth?.currentUser?.uid]);
 useEffect(()=>{if(!loaded)return;const purge=()=>setState(x=>({...x,notices:x.notices.filter(n=>Date.now()-n.createdAt<86400000)}));const timer=setInterval(purge,86400000);return()=>clearInterval(timer)},[loaded]);
 useEffect(()=>{
  if(modal==='notifications'&&state.notices&&state.notices.length>0){
   state.notices.forEach((n:any)=>markNoticeAsRead(n.id));
   if(state.notices.some((n:any)=>!n.read)){
    setState((curr:any)=>({
     ...curr,
     notices:(curr.notices||[]).map((n:any)=>({...n,read:true}))
    }));
   }
  }
 },[modal]);
 useEffect(()=>{
  if(!loaded||!adminAuthenticated||!state.orders||!state.orders.length)return;
  if(prevAdminOrderIdsRef.current===null){
    prevAdminOrderIdsRef.current=new Set(state.orders.map(o=>o.id));
    return;
  }
  const prev=prevAdminOrderIdsRef.current;
  const newIncoming=state.orders.filter(o=>!prev.has(o.id));
  if(newIncoming.length>0){
    const latest=newIncoming[0];
    playNewOrderSound();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});
    triggerDeviceNotification({
      title: 'طلب جديد في طيور الرشيدي! 🍗',
      body: 'طلب جديد #' + (latest.orderNumber || latest.id) + ' من ' + (latest.customer || 'عميل') + ' بمبلغ ' + Math.round(latest.total) + ' ج.م',
      channelId: 'orders',
      data: { orderId: latest.id },
    }).catch(()=>{});
    setAdminNewOrderBanner(latest);
    notify(`🔔 وصل طلب جديد: #${latest.id} بقيمة ${Math.round(latest.total)} ج.م`);
  }
  prevAdminOrderIdsRef.current=new Set(state.orders.map(o=>o.id));
 },[state.orders,adminAuthenticated,loaded]);

 const notify=(message:string)=>{setToast(message);setTimeout(()=>setToast(''),4500)};
 const addToCart=(p:Product,q=1,size='عادي',options:string[]=[],note='',unit=p.unit,selectedPrep='',selectedSubOption='')=>{if(!p.available)return Alert.alert('نفذ مؤقتاً','هذا المنتج غير متاح حالياً.');const prepLabels:Record<string,string>={WHOLE:'سليم',CUT:'تقطيع',DEBONED:'خلي',SKINNED:'سلخ',HALF_LENGTHWISE:'نصف بالطول'};const line={...toCartLine(p,q,size,options,note,unit),selectedPrep:prepLabels[selectedPrep]||selectedPrep,selectedSubOption};setState(x=>({...x,cart:[...x.cart,line]}));triggerFlyToCart(p);notify('تمت الإضافة إلى السلة');Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{})};
 const editCartLine=(lineId:string,p:Product,q:number,size:string,options:string[],note:string,unit:string,selectedPrep:string,selectedSubOption:string)=>{const prepLabels:Record<string,string>={WHOLE:'سليم',CUT:'تقطيع',DEBONED:'خلي',SKINNED:'سلخ',HALF_LENGTHWISE:'نصف بالطول'};const updated={...toCartLine(p,q,size,options,note,unit),id:lineId,selectedPrep:prepLabels[selectedPrep]||selectedPrep,selectedSubOption};setState(x=>({...x,cart:x.cart.map(line=>line.id===lineId?updated:line)}));setEditingLine(null);setModal('cart');notify('تم تحديث الصنف في السلة')};
 const openAuth=(mode:AuthMode='register',returnTo:ModalName='none')=>{setAuthMode(mode);setModalReturnTo(returnTo);setModal('auth')};
 const closeAdmin=()=>setModal('none');
 const logoutAdmin=()=>{signOutAdmin().catch(()=>{});setAdminAuthenticated(false);setModal('none')};
 const goBack=()=>{if(modal==='admin'){closeAdmin();return}if(modal==='editCart'){setModal('cart');return}if(modal==='auth'){setModal(modalReturnTo);setModalReturnTo('none');return}setModal('none')};
 const goTab=(next:Tab)=>{touch();setTab(next);setModal('none')};
 const openSearch=()=>{touch();setTab('menu');setModal('none');setSearchFocusRequest(request=>request+1)};
 const closePopup=()=>{if(popup)markNoticeAsRead(popup.id);setPopup(null)};
 const openNotice=(n:AppNotice)=>{if(n?.id)markNoticeAsRead(n.id);closePopup();if(n.target==='orders'){setModal('orders')}else if(n.target==='rewards'){setModal('none');setTab('rewards')}else{setModal('none');setTab('home')}};

 useEffect(() => {
  const handleBack = () => {
   if (showNotificationPrompt) {
    setShowNotificationPrompt(false);
    return 'handled';
   }
   if (popup) {
    setPopup(null);
    return 'handled';
   }
   if (modal !== 'none') {
    goBack();
    return 'handled';
   }
   if (tab !== 'home') {
    setTab('home');
    return 'handled';
   }
   return 'exit';
  };

  if (typeof window !== 'undefined') {
   (window as any).handleAndroidBack = handleBack;
  }

  const sub = BackHandler.addEventListener('hardwareBackPress', () => {
   const res = handleBack();
   return res === 'handled';
  });

  return () => {
   sub.remove();
   if (typeof window !== 'undefined') {
    delete (window as any).handleAndroidBack;
   }
  };
 }, [modal, tab, popup, showNotificationPrompt, modalReturnTo]);
 const checkout=async(data:any)=>{if(state.storeStatus&&!state.storeStatus.isOpen){Alert.alert('المتجر مغلق مؤقتاً',`${state.storeStatus.message}\nموعد الفتح: ${state.storeStatus.nextOpenTime}`);return}if(!isFirebaseConfigured){Alert.alert('الاتصال غير متاح','لا يمكن تأكيد الطلب من دون الاتصال بقاعدة البيانات السحابية.');return}if(!auth?.currentUser&&auth){try{await signInAnonymously(auth)}catch(e:any){console.warn('Anonymous checkout sign-in failed',e?.code)}}if(!auth?.currentUser){Alert.alert('تسجيل الدخول مطلوب','لتأكيد طلبك وحفظه في السحابة، يُرجى تسجيل الدخول أو إنشاء حساب جديد.',[{text:'إلغاء',style:'cancel'},{text:'تسجيل حساب',onPress:()=>openAuth('register','cart')}]);return}const items:CartLine[]=state.cart;if(items.some(line=>!state.products.find(p=>p.id===line.productId)?.available)){Alert.alert('منتج نفد','يوجد منتج في السلة أصبح غير متاح. احذفه من السلة ثم أعد تأكيد الطلب.');return}const redeemPoints=data.pointsDiscount&&state.pointValue>0?Math.ceil(data.pointsDiscount/state.pointValue):0;const newPoints=state.registered&&state.loyalty?calculateEarnedPoints(items,state.products,state.earnRate,state.specialEarnRate):0;const { id: nextOrderId, orderNumber: nextOrderNum } = await getNextOrderSequence(state.orders);
    const cleanAddress = delivery.includes('استلام')
      ? branch
      : (data.fullAddress || data.address || [data.zone, data.street, data.building].filter(Boolean).join(' · '));
    const finalOrderAddress = `${cleanAddress}${data.coords ? ` · GPS ${data.coords}` : ''}`;
    const order={id:nextOrderId,orderNumber:nextOrderNum,total:data.total,subtotal:data.subtotal,discount:data.discount+data.pointsDiscount,pointsUsed:redeemPoints,loyaltyDiscountAmount:data.pointsDiscount,pointsEarned:newPoints,couponCode:data.coupon||'',deliveryFee:0,customerDocumentId:state.registered?auth.currentUser.uid:'',status:'قيد المراجعة والتجهيز',createdAt:Date.now(),customer:data.customer||state.name,phone:data.phone||state.contact,email:state.registered&&state.contact.includes('@')?state.contact.toLowerCase():'',items,address:finalOrderAddress,addressDetails:{zone:data.zone||'',street:data.street||'',building:data.building||'',coords:data.coords||'',fullAddress:cleanAddress},payment:data.payment,schedule:data.schedule,note:data.note};try{await saveOrderToFirestore(order,branch,state.products);setFirebaseStatus('connected')}catch(error){console.warn('Cloud order write failed',error);setFirebaseStatus('error');notify('تعذر تأكيد الطلب سحابياً. لم يتم تفريغ السلة.');Alert.alert('تعذر إرسال الطلب','تعذر تأكيد الطلب عبر الخادم السحابي حالياً. يرجى التحقق من اتصال الإنترنت ثم إعادة المحاولة. تم الاحتفاظ بمحتويات السلة.');return}const notice:AppNotice={id:`n${Date.now()}`,title:'تم استلام طلبك',message:`طلب #${order.id} قيد المراجعة والتجهيز`,kind:'order',createdAt:Date.now(),target:'orders'};setState(x=>({...x,cart:[],orders:[order,...x.orders],points:Math.max(0,x.points-redeemPoints),coupons:x.coupons.map(c=>c.code===data.coupon?{...c,uses:c.uses+1}:c),notices:[notice,...x.notices]}));Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});notify(`تم تأكيد طلبك رقم #${order.id}`);
triggerDeviceNotification({
  title: 'تم استلام طلبك #' + nextOrderNum + ' بنجاح! 🍗',
  body: 'شكراً لطلبك من طيور الرشيدي. جاري التجهيز طازجاً فوراً، والحساب بالوزن الدقيق عند الاستلام.',
  channelId: 'orders',
  data: { orderId: nextOrderId },
}).catch(()=>{});Alert.alert('تم استلام طلبك بنجاح! 🍗',`رقم طلبك: #${order.orderNumber || order.id}\n${data.schedule}\nالحساب بالوزن الدقيق الصافي عند الاستلام.`,[{text:'متابعة حالة الطلب 📋',onPress:()=>setModal('orders')},{text:'الرئيسية',onPress:()=>setModal('none')}]);};
 const cartCount=state.cart.length;
 if(!loaded)return <LoadingScreen/>;
 const enterAsGuest=async()=>{try{if(isFirebaseConfigured&&auth){await signInAnonymously(auth).catch((error:any)=>{if(error?.code!=='auth/admin-restricted-operation'){console.warn('Firebase Anonymous Auth not enabled or failed:',error?.code)}})}const cloudState=await loadState();setState({...cloudState,themeMode:'system'});setBranch(cloudState.branch)}catch(error){console.warn('Guest mode init error:',error)}finally{setEntered(true)}};
 if(!entered&&!state.registered)return <View style={s.screen}><StatusBar barStyle="light-content" /><LoginScreen onGuest={enterAsGuest} onLogin={()=>{setEntered(true);openAuth('login')}} onRegister={()=>{setEntered(true);openAuth('register')}}/></View>;
 const current=tab==='home'?<HomeScreen state={state} setState={setState} notify={notify} onTab={goTab} onCart={()=>setModal('cart')} cartCount={cartCount} activeScheme={activeScheme} onThemeToggle={()=>setState(x=>({...x,themeMode:activeScheme==='dark'?'light':'dark'}))} onCategory={(c:string)=>{setFilter(c);setTab('menu')}} onProduct={(p:Product)=>{setProduct(p);setModal('product')}} onAdd={(p:Product)=>addToCart(p)} branch={branch} setBranch={(b:string)=>{setBranch(b);setState(x=>({...x,branch:b}))}} delivery={delivery} setDelivery={setDelivery} deliveryLocation={state.deliveryLocation} onDeliveryLocationChange={(location:any)=>setState(x=>({...x,deliveryLocation:location}))} onNotice={()=>setModal('notifications')} onBranches={()=>setModal('branches')} onTerms={()=>setModal('terms')} onPrivacy={()=>setModal('privacy')}/>:tab==='menu'?<ProductsScreen state={state} setState={setState} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} searchFocusRequest={searchFocusRequest} onProduct={(p:Product)=>{setProduct(p);setModal('product')}} onAdd={(p:Product)=>addToCart(p)}/>:tab==='rewards'?<RewardsScreen state={state} onRegister={openAuth} onCopy={async(code:string)=>{await Clipboard.setStringAsync(code);notify(`تم نسخ الكود ${code}`)}}/>:<AccountScreen state={state} setState={setState} adminAuthenticated={adminAuthenticated} onAdminDashboard={()=>setModal('admin')} onAdminLogout={logoutAdmin} onLogout={async()=>{await signOutCustomer().catch(()=>{});try{if(auth)await signInAnonymously(auth);const cloudState=await loadState();setState(cloudState)}catch{setState(initialState);setEntered(false)}}} onDeleteAccount={async()=>{try{await deleteCustomerAccount();setState(initialState);setAdminAuthenticated(false);setEntered(false);Alert.alert('تم حذف الحساب','حُذفت بيانات الحساب وأزيلت بيانات التعريف من سجلات الطلبات المحفوظة.')}catch(error:any){Alert.alert('تعذر حذف الحساب',error?.message||'حاول مرة أخرى بعد تسجيل الدخول.')}}} onAuth={()=>openAuth(state.registered?'edit':'register')} onBranch={(b:string)=>{setBranch(b);setState(x=>({...x,branch:b}));notify(`تم اختيار ${b}`)}} onOrders={()=>setModal('orders')} onBranchList={()=>setModal('branches')} onAbout={()=>setModal('about')} onTerms={()=>setModal('terms')} onPrivacy={()=>setModal('privacy')}/>;
 return <FontScaleContext.Provider value={state.fontScale}><SafeAreaView style={s.screen}><StatusBar barStyle={activeScheme==='dark'?'light-content':'dark-content'}/><View style={{flex:1}}><TransitionScreen key={tab}>{current}</TransitionScreen></View>
 <View style={{height:82,alignItems:'center',justifyContent:'center',backgroundColor:'transparent',paddingHorizontal:12,paddingBottom:5}}><BlurView intensity={activeScheme==='dark'?55:75} tint={activeScheme==='dark'?'dark':'light'} style={{width:'100%',maxWidth:560,height:64,borderWidth:1.2,borderColor:C.border,borderTopColor:activeScheme==='dark'?'rgba(255,255,255,0.28)':'rgba(255,255,255,0.95)',borderBottomColor:activeScheme==='dark'?'rgba(255,255,255,0.05)':'rgba(226,232,240,0.7)',borderRadius:32,overflow:'hidden',elevation:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:8,backgroundColor:C.surface,...(Platform.OS==='web'?{backdropFilter:'blur(24px) saturate(190%)',WebkitBackdropFilter:'blur(24px) saturate(190%)'}:{})}}>
  <TabButton icon="home" label="الرئيسية" activeColor="#1E40AF" activeBg="rgba(30,64,175,0.14)" active={tab==='home'} onPress={()=>goTab('home')}/>
  <TabButton icon="restaurant" label="القائمة" activeColor="#DC2626" activeBg="rgba(220,38,38,0.14)" active={tab==='menu'} onPress={()=>goTab('menu')}/>
  <TabButton icon="search" label={"بحث"} activeColor="#0284C7" activeBg="rgba(2,132,199,0.14)" active={false} onPress={openSearch}/>
  <View style={{width:52,flexShrink:0}}/>
  <TabButton icon="gift" label="المكافآت" color="#D97706" activeColor="#D97706" activeBg="rgba(217,119,6,0.16)" active={tab==='rewards'} onPress={()=>goTab('rewards')}/>
  <TabButton icon="logo-whatsapp" label="واتساب" color="#16A34A" activeColor="#16A34A" activeBg="rgba(22,163,74,0.16)" active={false} onPress={()=>{touch();Linking.openURL('https://wa.me/'+(branchDetails.find(item=>item.name===state.branch)?.whatsapp||'201223381405')).catch(()=>notify('تعذر فتح واتساب'))}}/>
  {(()=>{
   const pendingCount=adminAuthenticated?(state.orders||[]).filter((o:any)=>isOrderPending(o?.status)).length:0;
   return <View style={{position:'relative',flex:1}}>
     <TabButton icon={adminAuthenticated?"shield-checkmark":"person"} label={adminAuthenticated?"الإدارة":"حسابي"} color={adminAuthenticated?"#DC2626":undefined} activeColor={adminAuthenticated?"#DC2626":"#2563EB"} activeBg={adminAuthenticated?"rgba(220,38,38,0.16)":"rgba(37,99,235,0.14)"} active={tab==='account'} onPress={()=>goTab('account')}/>
     {pendingCount>0&&<View style={{position:'absolute',top:4,right:'25%',backgroundColor:C.red,minWidth:18,height:18,borderRadius:9,alignItems:'center',justifyContent:'center',borderWidth:1.5,borderColor:C.surface,elevation:4}}><Txt style={{color:C.white,fontSize:10,fontWeight:'900'}}>{pendingCount}</Txt></View>}
   </View>;
  })()}
 </BlurView><Animated.View style={{position:'absolute',top:10,alignSelf:'center',zIndex:2,transform:[{scale:cartBounce}]}}><Pressable accessibilityRole="button" accessibilityLabel="سلة المشتريات" onPress={()=>{touch();setModal('cart')}} style={{backgroundColor:C.action,width:56,height:56,borderRadius:28,alignItems:'center',justifyContent:'center',borderWidth:3,borderColor:C.border,elevation:12}}><Ionicons name="cart" size={26} color={C.actionText}/>{cartCount>0&&<View style={{position:'absolute',top:-1,right:-1,backgroundColor:C.solidSurface,minWidth:19,height:19,borderRadius:10,alignItems:'center',justifyContent:'center'}}><Txt style={{color:C.navy,fontSize:10,fontWeight:'900'}}>{cartCount}</Txt></View>}</Pressable></Animated.View></View>
 {flyingProduct&&(
  <Animated.View pointerEvents="none" style={{position:'absolute',alignSelf:'center',bottom:48,zIndex:999,transform:[{translateY:flyAnim.interpolate({inputRange:[0,0.25,0.75,1],outputRange:[-320,-270,-70,0]})},{translateX:flyAnim.interpolate({inputRange:[0,0.3,0.7,1],outputRange:[0,36,-12,0]})},{scale:flyAnim.interpolate({inputRange:[0,0.25,0.75,1],outputRange:[0.4,1.25,0.85,0.15]})},{rotate:flyAnim.interpolate({inputRange:[0,0.5,1],outputRange:['0deg','-10deg','6deg']})}],opacity:flyAnim.interpolate({inputRange:[0,0.15,0.85,1],outputRange:[0,1,1,0]})}}>
   <View style={{backgroundColor:C.action,borderRadius:22,paddingHorizontal:13,paddingVertical:7,flexDirection:'row-reverse',alignItems:'center',gap:6,borderWidth:2,borderColor:'#FFFFFF',shadowColor:C.action,shadowOffset:{width:0,height:8},shadowOpacity:0.45,shadowRadius:12,elevation:12}}>
    <Ionicons name="cart" size={17} color="#FFFFFF"/>
    <Txt style={{color:'#FFFFFF',fontWeight:'900',fontSize:12.5}}>+1 {flyingProduct.name}</Txt>
   </View>
  </Animated.View>
 )}
 {!!toast&&<View style={{position:'absolute',bottom:88,alignSelf:'center',backgroundColor:C.navy,paddingVertical:12,paddingHorizontal:18,borderRadius:24}}><Txt style={{color:C.white,fontWeight:'700'}}>{toast}</Txt></View>}
 {popup&&<Popup notice={popup} onPress={()=>openNotice(popup)} onClose={closePopup}/>}
 <Modal visible={modal!=='none'} animationType="slide" presentationStyle={modal==='admin'?'fullScreen':'pageSheet'} onRequestClose={goBack}><SafeAreaView style={{flex:1,backgroundColor:C.cream}}><View style={{paddingHorizontal:16,paddingVertical:12,backgroundColor:C.solidSurface,borderBottomWidth:1,borderColor:C.border,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Pressable accessibilityRole="button" accessibilityLabel="إغلاق" onPress={goBack} style={{minWidth:44,minHeight:44,justifyContent:'center',alignItems:'flex-start'}}><Ionicons name="close" size={24} color={C.muted}/></Pressable><Txt style={{fontFamily:fontRuqaaBold,fontWeight:'700',fontSize:22,lineHeight:30,color:C.navy,textAlign:'center'}}>{modal==='terms'?'الشروط والأحكام':modal==='privacy'?'سياسة الخصوصية':modal==='product'?'تخصيص المنتج':modal==='editCart'?'تعديل الصنف':modal==='cart'?'السلة وإتمام الطلب':modal==='auth'?'حسابك':modal==='admin'?'لوحة إدارة الرشيدي':modal==='orders'?'متابعة الطلبات':modal==='notifications'?'الإشعارات':modal==='branches'?'فروعنا':modal==='about'?'عن طيور الرشيدي':'الرشيدي'}</Txt><View style={{width:44}}/></View>
 {modal==='product'&&product&&<ProductCustomizationSheet product={product} onAdd={(q:number,size:string,opts:string[],note:string,unit:string,prep:string,subOption:string)=>{addToCart(product,q,size,opts,note,unit,prep,subOption);setModal('none')}}/>}
 {modal==='editCart'&&product&&editingLine&&<ProductCustomizationSheet product={product} initialLine={editingLine} onAdd={(q:number,size:string,opts:string[],note:string,unit:string,prep:string,subOption:string)=>editCartLine(editingLine.id,product,q,size,opts,note,unit,prep,subOption)}/>}
  {modal==='cart'&&<CartScreen state={state} setState={setState} onCheckout={checkout} branch={branch} delivery={delivery} deliveryLocation={state.deliveryLocation} onDeliveryLocationChange={(location:any)=>setState(x=>({...x,deliveryLocation:location}))} onAuth={()=>openAuth('register','cart')} onEdit={(line:CartLine)=>{const selectedProduct=state.products.find(item=>item.id===line.productId);if(!selectedProduct){Alert.alert('تعذر تعديل الصنف','المنتج غير موجود في القائمة الحالية.');return}setProduct(selectedProduct);setEditingLine(line);setModal('editCart')}}/>}
 {modal==='auth'&&<AuthScreen mode={authMode} onMode={setAuthMode} onClose={()=>setModal('none')} onAdminLogin={async(email:string,password:string)=>{await signInAdmin(email,password);setAdminAuthenticated(true);setModal('admin')}} state={state} setState={setState} notify={notify}/>}
 {modal==='admin'&&adminAuthenticated&&<DashboardScreen state={state} setState={setState} notify={notify} onClose={closeAdmin} firebaseStatus={firebaseStatus} initialTab={adminDashboardTab} onProductChange={(p:Product)=>saveProductToFirestore(p).then(()=>setFirebaseStatus('connected')).catch(()=>{setFirebaseStatus('error');notify('تعذر حفظ المنتج سحابياً')})} onProductDelete={(id:string)=>deleteProductFromFirestore(id).then(()=>setFirebaseStatus('connected')).catch(()=>{setFirebaseStatus('error');notify('تعذر حذف المنتج سحابياً')})} onBannersChange={(b:any[])=>saveBannersToFirestore(b).then(()=>setFirebaseStatus('connected')).catch(()=>{setFirebaseStatus('error');notify('تعذر حفظ البانرات سحابياً')})} onShowcaseChange={(config:RashidiShowcaseConfig)=>saveShowcaseToFirestore(config).then(()=>setFirebaseStatus('connected')).catch(()=>{setFirebaseStatus('error');notify('تعذر حفظ إعدادات سفرة الرشيدي سحابياً')})} onStoriesChange={(stories:any[])=>saveStoriesToFirestore(stories).then(()=>setFirebaseStatus('connected')).catch(()=>{setFirebaseStatus('error');notify('تعذر حفظ الستوريز سحابياً')})} onCategoryImagesChange={(images:Record<string,string>)=>saveCategoryImagesToFirestore(images).then(()=>setFirebaseStatus('connected')).catch(()=>{setFirebaseStatus('error');notify('تعذر حفظ صور الأقسام سحابياً')})} onBranchImagesChange={(images:Record<string,string>)=>saveBranchImagesToFirestore(images).then(()=>setFirebaseStatus('connected')).catch(()=>{setFirebaseStatus('error');notify('تعذر حفظ صور الفروع سحابياً')})} onBadgesChange={(badges:any[])=>saveBadgesToFirestore(badges).then(()=>setFirebaseStatus('connected')).catch(()=>{setFirebaseStatus('error');notify('تعذر حفظ الشارات سحابياً')})} onLoyaltyChange={(v:any)=>saveLoyaltyToFirestore(v).then(()=>setFirebaseStatus('connected')).catch((error)=>{setFirebaseStatus('error');notify('تعذر حفظ إعدادات الولاء سحابياً');throw error})} onOrderStatus={(id:string,status:string,phone:string,email:string)=>updateFirestoreOrderStatus(id,status,phone,email).then(()=>setFirebaseStatus('connected')).catch(()=>{setFirebaseStatus('error');notify('تعذر حفظ حالة الطلب سحابياً')})} onCouponChange={(c:any)=>saveCouponToFirestore(c).then(()=>setFirebaseStatus('connected')).catch(()=>{setFirebaseStatus('error');notify('تعذر حفظ الكوبون سحابياً')})} onCouponDelete={(code:string)=>deleteCouponFromFirestore(code).then(()=>setFirebaseStatus('connected')).catch(()=>{setFirebaseStatus('error');notify('تعذر حذف الكوبون سحابياً')})} onBroadcast={(id:string,title:string,message:string,couponCode:string)=>broadcastPromotionToFirestore(id,title,message,couponCode).then(()=>setFirebaseStatus('connected')).catch((error)=>{setFirebaseStatus('error');throw error})} onStoreStatusChange={(s:any)=>saveStoreStatusToFirestore(s).then(()=>notify('تم تحديث حالة استقبال الطلبات')).catch(()=>notify('تعذر حفظ حالة المتجر'))}/>}
 {modal==='orders'&&<OrdersScreen state={state} registered={state.registered} onRepeat={(order:any)=>{const lines:CartLine[]=order.items.filter((line:CartLine)=>state.products.find(x=>x.id===line.productId)?.available).map((line:CartLine)=>({...line,id:`repeat-${Date.now()}-${Math.random()}`,options:[...line.options]}));if(!lines.length)return Alert.alert('المنتجات غير متاحة','لا توجد منتجات من هذا الطلب متاحة حالياً.');setState(x=>({...x,cart:[...x.cart,...lines]}));setModal('cart');notify('أعدنا المنتجات المتاحة إلى السلة')}}/>}
 {modal==='notifications'&&<NotificationCenter state={state} onOpen={openNotice} onClear={()=>{const allIds=(state.notices||[]).map((n:any)=>n.id);markAllNoticesAsCleared(allIds);setState((x:any)=>({...x,notices:[]}));notify('تم مسح جميع الإشعارات بنجاح')}} onDeleteNotice={(id:string)=>{markNoticeAsCleared(id);setState((x:any)=>({...x,notices:(x.notices||[]).filter((n:any)=>n.id!==id)}));notify('تم حذف الإشعار')}} onExplore={()=>{setModal('none');setTab('menu')}}/>}
 {modal==='branches'&&<BranchesScreen state={state} setState={setState} onBranchImagesChange={(images:Record<string,string>)=>saveBranchImagesToFirestore(images).then(()=>setFirebaseStatus('connected')).catch(()=>{setFirebaseStatus('error');notify('تعذر حفظ صور الفروع سحابياً')})} notify={notify} adminAuthenticated={adminAuthenticated}/>}
 {modal==='about'&&<AboutScreen/>}{modal==='terms'&&<TermsScreen/>}{modal==='privacy'&&<PrivacyScreen/>}
 </SafeAreaView></Modal>
 <Modal visible={showNotificationPrompt} transparent animationType="fade">
   <View style={{flex:1,backgroundColor:'rgba(15,23,42,0.68)',justifyContent:'center',alignItems:'center',padding:20}}>
     <View style={{backgroundColor:C.surface,borderRadius:24,padding:22,width:'100%',maxWidth:360,alignItems:'center',elevation:10,shadowColor:'#000',shadowOffset:{width:0,height:8},shadowOpacity:0.25,shadowRadius:16,borderWidth:1,borderColor:C.border}}>
       <View style={{width:64,height:64,borderRadius:32,backgroundColor:'rgba(23,74,156,0.12)',alignItems:'center',justifyContent:'center',marginBottom:14}}>
         <Ionicons name="notifications" size={32} color={C.action}/>
       </View>
       <Txt style={{fontSize:18,fontWeight:'900',color:C.navy,textAlign:'center',marginBottom:8}}>
         تفعيل إشعارات طيور الرشيدي 🍗
       </Txt>
       <Txt style={{fontSize:13,color:C.ink,textAlign:'center',lineHeight:21,marginBottom:20}}>
         هل توافق على السماح للتطبيق بإرسال إشعارات وتنبيهات مباشرة على جهازك لمتابعة حالة طلبك لحظة بلحظة وأقوى عروض التوفير؟
       </Txt>
       <View style={{width:'100%',gap:10}}>
         <Button
           title="موافق، تفعيل الإشعارات الآن ✅"
           onPress={async () => {
             setShowNotificationPrompt(false);
             await AsyncStorage.setItem('@rashidi_notif_prompt_seen', 'true').catch(()=>{});
             await requestNotificationPermission();
             await triggerDeviceNotification({
               title: 'طيور الرشيدي 🍗',
               body: 'تم تفعيل إشعارات هاتفك بنجاح! ستصلك هنا تنبيهات الطلبات والعروض فوراً.',
               channelId: 'default',
             }).catch(()=>{});
             notify('تم تفعيل إشعارات الهاتف بنجاح');
           }}
         />
         <Button
           title="لاحقاً"
           secondary
           onPress={async () => {
             setShowNotificationPrompt(false);
             await AsyncStorage.setItem('@rashidi_notif_prompt_seen', 'true').catch(()=>{});
           }}
         />
       </View>
     </View>
   </View>
 </Modal></SafeAreaView></FontScaleContext.Provider>;
}
function TransitionScreen({children}:any){const progress=useRef(new Animated.Value(0)).current;useEffect(()=>{progress.setValue(0);const animation=Animated.timing(progress,{toValue:1,duration:260,easing:Easing.out(Easing.cubic),useNativeDriver:true});animation.start();return()=>animation.stop()},[progress]);return <Animated.View style={{flex:1,opacity:progress,transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[8,0]})}]}}>{children}</Animated.View>}
function TabButton({icon,label,active,onPress,color,activeColor,activeBg}:any){
  const scale=useRef(new Animated.Value(active?1.08:1)).current;
  useEffect(()=>{
    Animated.spring(scale,{toValue:active?1.08:1,useNativeDriver:true,speed:24,bounciness:4}).start();
  },[active,scale]);
  const c = active ? (activeColor || C.blue) : (color || C.muted);
  const bg = active ? (activeBg || 'rgba(23,74,156,0.14)') : 'transparent';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{selected:active}}
      onPress={onPress}
      style={{flex:1,alignItems:'center',justifyContent:'center',minHeight:50}}>
      <Animated.View
        style={{
          borderRadius:16,
          backgroundColor:bg,
          paddingHorizontal: active ? 10 : 6,
          paddingVertical: active ? 3.5 : 5,
          alignItems: 'center',
          justifyContent: 'center',
          transform:[{scale}]
        }}>
        <Ionicons name={icon} size={active ? 21 : 23} color={c}/>
      </Animated.View>
      {active && (
        <Txt numberOfLines={1} style={{fontSize:9.5,color:c,fontWeight:'900',textAlign:'center',marginTop:2}}>
          {label}
        </Txt>
      )}
    </Pressable>
  );
}

function AuthScreen({mode,onMode,onClose,onAdminLogin,state,setState,notify}:any){
 const [name,setName]=useState(state.registered?state.name:'');
 const [phone,setPhone]=useState(state.registered?state.contact:'');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [confirmPassword,setConfirmPassword]=useState('');
 const [passwordVisible,setPasswordVisible]=useState(false);
 const [confirmPasswordVisible,setConfirmPasswordVisible]=useState(false);
 const [submitting,setSubmitting]=useState(false);
 const [error,setError]=useState('');
 const submit=async()=>{
  if(mode==='edit'){
   const cleanPhone=normalizePhone(phone);
   if(!cleanPhone){setError('أدخل رقم الهاتف.');return}
   if(!/^01[0125]\d{8}$/.test(cleanPhone)&&!/^\d{10,14}$/.test(cleanPhone)){setError('أدخل رقم هاتف مصري صحيح (مثال: 01012345678).');return}
   const updated={...state,name:name.trim()||cleanPhone,contact:cleanPhone};
   await saveState(updated);setState(updated);notify('تم تحديث بيانات الحساب');onClose();return;
  }
  if(mode==='register'){
   const cleanPhone=normalizePhone(phone);
   if(!name.trim()||!cleanPhone||!password||!confirmPassword){setError('أكمل الاسم ورقم الهاتف وكلمتي المرور.');return}
   if(!/^01[0125]\d{8}$/.test(cleanPhone)&&!/^\d{10,14}$/.test(cleanPhone)){setError('أدخل رقم هاتف صحيح (مثال: 01012345678 مكون من ١١ رقماً).');return}
   if(password!==confirmPassword){setError('كلمتا المرور غير متطابقتين.');return}
   if(password.length<6){setError('كلمة المرور يجب ألا تقل عن ٦ أحرف.');return}
   setError('');setSubmitting(true);
   try{
    const profile=await createCustomerAccount(name,cleanPhone,password,email);
    const updated={...state,registered:true,verifiedCustomerIdentifier:profile.loginIdentifier,name:profile.name,contact:profile.contact,points:profile.points};
    await saveState(updated);setState(updated);notify('تم إنشاء حسابك وتسجيل الدخول بنجاح');onClose();
   }catch(e:any){setError(e?.message||'تعذر إنشاء الحساب. حاول مرة أخرى.')}
   finally{setSubmitting(false)}
   return;
  }
  const identifier=phone.trim();
  if(!identifier||!password){setError('أدخل رقم الهاتف وكلمة المرور.');return}
  setError('');setSubmitting(true);
  try{
   if(identifier.toLowerCase()===ADMIN_EMAIL){
    await onAdminLogin(identifier,password);
    notify('تم تسجيل دخول الإدارة');
    return;
   }
   const profile=await signInExistingCustomer(identifier,password);
   const cloudState=await loadState();
   const updated={...cloudState,registered:true,verifiedCustomerIdentifier:profile.loginIdentifier,name:profile.name,contact:profile.contact,points:profile.points};
   await saveState(updated);setState(updated);notify('تم تسجيل الدخول بنجاح');onClose();
  }catch(e:any){setError(e?.message||'تعذر تسجيل الدخول. تأكد من رقم الهاتف وكلمة المرور.')}
  finally{setSubmitting(false)}
 };
 if(submitting)return <LoadingScreen message={mode==='register'?'جارٍ إنشاء الحساب برقم الهاتف…':'جارٍ التحقق من الحساب…'}/>;
  return (
    <ScrollView contentContainerStyle={[s.scroll, { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 }]}>
      <View style={{ width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 12 }}>
        <Txt style={{ fontFamily: 'Rubik_700Bold', fontSize: 27, fontWeight: '900', marginBottom: 8, color: C.navy }}>
          {mode === 'edit' ? 'تعديل بيانات الحساب' : mode === 'register' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
        </Txt>
        <Txt style={{ fontSize: 14.5, color: C.muted, lineHeight: 22, marginBottom: 18 }}>
          {mode === 'edit'
            ? 'حدّث بيانات التواصل ورقم هاتفك المسجل على هذا الجهاز.'
            : mode === 'register'
            ? 'سجّل رقم هاتفك لإنشاء حسابك والاستفادة من نقاط المكافآت وسهولة تكرار الطلبات.'
            : 'أدخل رقم الهاتف (أو البريد) وكلمة المرور للدخول إلى حسابك.'}
        </Txt>
        {(mode === 'edit' || mode === 'register') && (
          <Field label="الاسم بالكامل" value={name} onChangeText={setName} placeholder="اسم العميل" />
        )}
        <Field
          label={mode === 'edit' ? 'رقم الهاتف' : mode === 'register' ? 'رقم الهاتف (أساسي للطلب)' : 'رقم الهاتف أو البريد'}
          value={phone}
          onChangeText={setPhone}
          placeholder="01xxxxxxxxx"
          keyboardType="phone-pad"
        />
        {mode === 'register' && (
          <Field
            label="البريد الإلكتروني (اختياري)"
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com (اختياري)"
            keyboardType="email-address"
          />
        )}
        {mode !== 'edit' && (
          <Field
            label="كلمة المرور"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            passwordVisibilityToggle
            passwordVisible={passwordVisible}
            onTogglePassword={() => setPasswordVisible((x: any) => !x)}
          />
        )}
        {mode === 'register' && (
          <Field
            label="تأكيد كلمة المرور"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="أعد كتابة كلمة المرور"
            passwordVisibilityToggle
            passwordVisible={confirmPasswordVisible}
            onTogglePassword={() => setConfirmPasswordVisible((x: any) => !x)}
          />
        )}
        {!!error && (
          <View
            accessibilityRole="alert"
            style={[
              s.card,
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: 'rgba(214,40,50,0.08)',
                borderColor: 'rgba(214,40,50,0.2)',
                paddingVertical: 12,
                marginVertical: 10,
              },
            ]}>
            <Ionicons name="alert-circle-outline" size={22} color={C.red} />
            <Txt style={{ flex: 1, color: C.red, fontWeight: '800', fontSize: 14 }}>{error}</Txt>
          </View>
        )}
        <View style={{ marginTop: 8 }}>
          <Button
            title={mode === 'edit' ? 'حفظ البيانات' : mode === 'register' ? 'إنشاء الحساب برقم الهاتف' : 'تسجيل الدخول'}
            onPress={submit}
          />
        </View>
        {mode !== 'edit' && (
          <Button
            title={mode === 'register' ? 'لدي حساب بالفعل · تسجيل الدخول' : 'إنشاء حساب جديد برقم الهاتف'}
            secondary
            onPress={() => onMode(mode === 'register' ? 'login' : 'register')}
            style={{ marginTop: 12 }}
          />
        )}
        {mode === 'login' && (
          <Button title="متابعة كضيف دون تسجيل" secondary onPress={onClose} style={{ marginTop: 12 }} />
        )}
        <Txt style={{ fontSize: 13.5, color: C.muted, marginTop: 18, textAlign: 'center', lineHeight: 21 }}>
          {mode === 'edit'
            ? ''
            : mode === 'register'
            ? 'يُسجل حسابك برقم الهاتف لحفظ طلباتك وعناوينك ونقاط المكافآت.'
            : 'سجّل الدخول برقم هاتفك المسجل مسبقاً.'}
        </Txt>
      </View>
    </ScrollView>
  );
}
function OrdersScreen({state,registered,onRepeat}:any){
  const sortedOrders = [...(state.orders||[])].sort((a:any,b:any)=>(b.createdAt||0)-(a.createdAt||0));
  return <ScrollView contentContainerStyle={s.scroll}>{!sortedOrders.length?<View style={[s.card,{alignItems:'center',padding:32}]}><Txt style={{fontSize:38}}>📦</Txt><Txt style={{fontWeight:'900',marginTop:10}}>لا توجد طلبات حتى الآن</Txt></View>:sortedOrders.map((o:any)=>{
    const isPending=isOrderPending(o?.status);
    const isPreparing=o.status==='جاري التجهيز';
    const isDelivering=o.status==='خرج للتوصيل';
    const isDelivered=/تم التسليم|مكتمل/.test(o.status);
    const isCancelled=o.status==='ملغي';
    const statusColor=isPending?C.gold:isPreparing?C.blue:isDelivering?'#7C3AED':isDelivered?C.green:C.red;
    return <View key={o.id} style={[s.card,isPending&&{borderColor:C.gold,borderWidth:1.5}]}>
      <View style={s.row}>
        <Txt style={{fontWeight:'900',color:C.navy,fontSize:16}}>طلب #{o.id}</Txt>
        <View style={{backgroundColor:`${statusColor}18`,paddingHorizontal:10,paddingVertical:4,borderRadius:12}}>
          <Txt style={{fontWeight:'900',fontSize:12,color:statusColor}}>{o.status}</Txt>
        </View>
      </View>
      <Txt style={[s.small,{marginTop:4}]}>{new Date(o.createdAt).toLocaleString('ar-EG')}</Txt>
      <Txt style={{marginTop:8,fontWeight:'900',color:C.action,fontSize:13}}>⚖️ الحساب النهائي بالوزن عند الاستلام</Txt>
      <Txt style={[s.small,{marginTop:6}]}>{o.items.map((i:CartLine)=>`${i.name} × ${i.quantity}`).join('، ')}</Txt>
      <Txt style={[s.small,{marginTop:5}]}>العنوان: {o.address} · {o.payment} · {o.schedule}</Txt>
      {registered&&<Button title="إعادة الطلب" secondary onPress={()=>onRepeat(o)} style={{marginTop:10}}/>}
    </View>;
  })}</ScrollView>;
}
function Popup({notice,onPress,onClose}:any){const progress=useRef(new Animated.Value(0)).current;const entrance=useRef(new Animated.Value(0)).current;useEffect(()=>{progress.setValue(0);entrance.setValue(0);Animated.parallel([Animated.timing(progress,{toValue:1,duration:3000,useNativeDriver:false}),Animated.spring(entrance,{toValue:1,useNativeDriver:true,speed:20,bounciness:5})]).start();const timer=setTimeout(onClose,3000);return()=>clearTimeout(timer)},[notice.id]);return <Animated.View style={{position:'absolute',top:12,left:14,right:14,zIndex:10,elevation:12,opacity:entrance,transform:[{translateY:entrance.interpolate({inputRange:[0,1],outputRange:[-14,0]})}]}}><Pressable onPress={onPress} style={{backgroundColor:C.surface,borderRadius:20,padding:13,borderWidth:1.5,borderColor:C.gold,shadowColor:'#152B4C',shadowOpacity:0.18,shadowRadius:14,shadowOffset:{width:0,height:6}}}><View style={[s.row,{alignItems:'center'}]}><View style={{width:48,height:48,borderRadius:17,backgroundColor:'#FFF1C9',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#F2D98E'}}><Text style={{fontSize:23}}>{notice.kind==='order'?'📦':'🎁'}</Text><View style={{position:'absolute',top:3,right:3,width:10,height:10,borderRadius:5,backgroundColor:C.gold,borderWidth:1,borderColor:C.surface}}/></View><View style={{flex:1,marginHorizontal:10,alignItems:'flex-start'}}><Txt style={{fontSize:10,color:C.gold,fontWeight:'700',textAlign:'right'}}>إشعار جديد</Txt><Txt style={{fontSize:14,color:C.navy,fontWeight:'900',marginTop:2,textAlign:'right'}}>{notice.title}</Txt></View><Pressable onPress={(e:any)=>{e.stopPropagation();onClose()}} accessibilityRole="button" accessibilityLabel="إغلاق الإشعار" style={{width:34,height:34,borderRadius:17,backgroundColor:C.background,alignItems:'center',justifyContent:'center'}}><Ionicons name="close" size={18} color={C.muted}/></Pressable></View><Txt style={{fontSize:12,color:C.ink,marginTop:8,textAlign:'right',lineHeight:19}}>{notice.message}</Txt><View style={{height:4,backgroundColor:C.line,marginTop:10,borderRadius:3,overflow:'hidden'}}><Animated.View style={{height:4,backgroundColor:C.action,width:progress.interpolate({inputRange:[0,1],outputRange:['100%','0%']})}}/></View></Pressable></Animated.View>}








