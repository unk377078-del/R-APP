import React,{useEffect,useState} from 'react';
import { Alert,Pressable,ScrollView,View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { AppState,DeliveryLocation,emptyDeliveryLocation } from './store';
import { CartLine, Product } from './models';
import { detectAddress } from './LocationManager';
import { cartSubtotal,findValidCoupon } from './ViewModels';
import { C,s } from './theme';
import { Button,Chip,Field,ScreenTitle,Txt,displayUnit } from './ui';
import { alexandriaAreas } from './nativeAssets';
const money=(x:number)=>`${Math.round(x)} ج.م`;
const deliverySlots=[{start:11,label:'من 11 صباحاً إلى 12 ظهراً'},{start:12,label:'من 12 إلى 1 ظهراً'},{start:13,label:'من 1 إلى 2 ظهراً'},{start:14,label:'من 2 إلى 3 عصراً'},{start:15,label:'من 3 إلى 4 عصراً'}];
export function CartScreen({state,setState,onCheckout,branch,delivery,deliveryLocation=emptyDeliveryLocation,onDeliveryLocationChange,onAuth,onEdit}:any){const initialLocation:DeliveryLocation=deliveryLocation||emptyDeliveryLocation;const [clockNow,setClockNow]=useState(Date.now());const cairoHour=Number(new Intl.DateTimeFormat('en-US',{timeZone:'Africa/Cairo',hour:'2-digit',hourCycle:'h23'}).format(new Date(clockNow)));const reservedForTomorrow=cairoHour>=16;const availableSlots=deliverySlots.filter(item=>reservedForTomorrow||cairoHour<11||item.start>=cairoHour);const [code,setCode]=useState(state.appliedCoupon||'');const [applied,setApplied]=useState('');const [discount,setDiscount]=useState(0);const [redeem,setRedeem]=useState(false);const [zone,setZone]=useState(initialLocation.zone);const [street,setStreet]=useState(initialLocation.street);const [building,setBuilding]=useState(initialLocation.building);const [coords,setCoords]=useState(initialLocation.coords);const [gpsAddress,setGpsAddress]=useState(initialLocation.fullAddress);const [busy,setBusy]=useState(false);const [formError,setFormError]=useState('');const [deliveryTimingMode,setDeliveryTimingMode]=useState<'standard_2_3h'|'scheduled'>('standard_2_3h');
 const [slot,setSlot]=useState(availableSlots[0]?.label||deliverySlots[0].label);const [payment,setPayment]=useState('الدفع عند الاستلام');const [note,setNote]=useState('');const [customer,setCustomer]=useState(state.name==='ضيف الرشيدي'?'':state.name);const [phone,setPhone]=useState(state.contact.includes('@')?'':state.contact);const subtotal=cartSubtotal(state.cart);const isStoreClosed=Boolean(state.storeStatus&&!state.storeStatus.isOpen);const unavailableProduct=state.cart.find((line:CartLine)=>!state.products.find((product:any)=>product.id===line.productId)?.available);const pointsDiscount=redeem&&state.registered&&state.loyalty?Math.min(Math.max(0,subtotal-discount),state.points*state.pointValue):0;const total=Math.max(0,subtotal-discount-pointsDiscount);const customerDocumentId=state.contact.includes('@')?state.contact.toLowerCase().replace(/[+ -]/g,''):state.contact.replace(/[+ -]/g,'');
 useEffect(()=>{const timer=setInterval(()=>setClockNow(Date.now()),60000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{setSlot(previous=>availableSlots.some(item=>item.label===previous)?previous:(availableSlots[0]?.label||deliverySlots[0].label))},[reservedForTomorrow,availableSlots[0]?.label]);
 useEffect(()=>{const location:DeliveryLocation=deliveryLocation||emptyDeliveryLocation;setZone(location.zone);setStreet(location.street);setBuilding(location.building);setCoords(location.coords);setGpsAddress(location.fullAddress)},[deliveryLocation]);
 useEffect(()=>{if(state.appliedCoupon&&!applied&&subtotal>0){const r=findValidCoupon(state.coupons,state.appliedCoupon,subtotal,customerDocumentId);if(!r.error&&r.coupon){setApplied(r.coupon.code);setDiscount(r.discount)}}},[state.appliedCoupon,subtotal]);
 const gps=async()=>{setBusy(true);try{const a=await detectAddress();setZone(a.zone);setCoords(a.coords);onDeliveryLocationChange?.({zone:a.zone,street,building,coords:a.coords,fullAddress:a.zone});await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);Alert.alert('تم تحديد منطقتك بنجاح 📍',`المنطقة: ${a.zone}\nيرجى كتابة اسم الشارع ورقم العقار لتأكيد التوصيل بدقة.`)}catch(e:any){Alert.alert('تعذر تحديد المنطقة',e.message||'يرجى اختيار منطقتك من القائمة وكتابة العنوان يدوياً.')}finally{setBusy(false)}};
 const apply=()=>{const r=findValidCoupon(state.coupons,code,subtotal,customerDocumentId);if(r.error){setApplied('');setDiscount(0);Alert.alert('تعذر تطبيق الكوبون',r.error)}else{setApplied(r.coupon!.code);setDiscount(r.discount);Alert.alert('تم تطبيق الكوبون','تم تفعيل الكوبون بنجاح، وسيطبق الخصم على إجمالي طلبك بالوزن عند الاستلام!')}};
 const qty=(line:CartLine,direction:number)=>{const step=line.unit==='للكيلو' ? 0.5 : 1;setState((x:AppState)=>({...x,cart:x.cart.map(l=>l.id===line.id?{...l,quantity:Math.max(step,Math.round((l.quantity+direction*step)*2)/2)}:l)}))};
 const submit=async()=>{
  if(isStoreClosed){setFormError(state.storeStatus?.message||'المتجر مغلق مؤقتاً ولا يستقبل طلبات جديدة حالياً.');return}
  if(!state.cart.length){setFormError('سلتك فارغة. أضف منتجاً قبل تأكيد الطلب.');return}
  if(unavailableProduct){setFormError(`المنتج ${unavailableProduct.name} نفد حالياً. احذفه من السلة للمتابعة.`);return}
  if(!customer.trim()){setFormError('أدخل اسم العميل بالكامل للمتابعة وتأكيد الطلب.');return}
  if(!phone.trim()){setFormError('أدخل رقم الهاتف للتأكيد، ثم اضغط تأكيد الطلب مرة أخرى.');return}
  if(delivery.includes('توصيل')){const missingAddress=[!zone.trim()?'المنطقة':null,!street.trim()?'اسم الشارع':null,!building.trim()?'رقم العقار':null].filter(Boolean);if(missingAddress.length){setFormError(`أكمل بيانات عنوان التوصيل: ${missingAddress.join('، ')}.`);return}}
  setFormError('');
  const addressParts=[zone,street,building].map(value=>value.trim()).filter(Boolean);
  const fullAddress=addressParts.join('، ');
  const location={zone:zone.trim(),street:street.trim(),building:building.trim(),coords,fullAddress};
  onDeliveryLocationChange?.(location);
  setBusy(true);
  try{
   await onCheckout({subtotal,discount,pointsDiscount,total,address:fullAddress,zone,street,building,coords,fullAddress,payment,schedule:deliveryTimingMode==='standard_2_3h'?(reservedForTomorrow?'بكرة (خلال ساعتين إلى ٣ ساعات)':'اليوم (خلال ساعتين إلى ٣ ساعات)'):`${reservedForTomorrow?'بكرة':'اليوم'} · ${slot}`,note,coupon:applied,customer:customer||'عميل الرشيدي',phone});
  }catch(error){setFormError('تعذر إرسال الطلب الآن. تحقق من الاتصال وحاول مرة أخرى.')}
  finally{setBusy(false)}
 };

 return <ScrollView contentContainerStyle={s.scroll}><ScreenTitle title="السلة وإتمام الطلب" subtitle={`${state.cart.length} منتجات · ${delivery} · ${branch}`}/>{(!!state.cart.length||!!state.weeklyList.length)&&<View style={s.card}><Txt style={{fontSize:16,fontWeight:'900',color:C.navy}}>قائمتي الأسبوعية</Txt><Txt style={[s.small,{marginTop:5}]}>{state.weeklyList.length?`قائمة محفوظة فيها ${state.weeklyList.length} أصناف.`:'احفظ مشترياتك المعتادة لتضيفها للسلة بسهولة كل أسبوع.'}</Txt><View style={[s.row,{justifyContent:'flex-start',flexWrap:'wrap',gap:8,marginTop:8}]}><Button title="حفظ السلة كقائمة أسبوعية" secondary disabled={!state.cart.length} onPress={()=>{setState((current:AppState)=>({...current,weeklyList:current.cart.map((line:any)=>({...line,options:[...line.options]}))}));Alert.alert('تم الحفظ','حفظنا السلة كقائمتك الأسبوعية على هذا الجهاز.')}}/><Button title="إضافة قائمتي للسلة" disabled={!state.weeklyList.length} onPress={()=>{const lines=state.weeklyList.filter((line:any)=>state.products.find((product:Product)=>product.id===line.productId)?.available).map((line:any,index:number)=>({...line,id:`weekly-${Date.now()}-${index}`,options:[...line.options]}));if(!lines.length)return Alert.alert('القائمة غير متاحة','لا توجد منتجات محفوظة متاحة الآن.');setState((current:AppState)=>({...current,cart:[...current.cart,...lines]}));Alert.alert('تمت الإضافة',`أضفنا ${lines.length} أصناف متاحة إلى السلة.`)}}/></View></View>}{!!unavailableProduct&&<View accessibilityRole="alert" style={[s.card,{backgroundColor:'rgba(214,40,50,0.08)',borderColor:'rgba(214,40,50,0.2)'}]}><Txt style={{color:C.red,fontWeight:'900'}}>المنتج {unavailableProduct.name} نفد مؤقتاً</Txt><Txt style={s.small}>احذفه من السلة للمتابعة، أو انتظر عودته للتوفر.</Txt></View>}
 {!state.cart.length?<View style={[s.card,{alignItems:'center',padding:34}]}><Ionicons name="bag-handle-outline" size={44} color={C.blue}/><Txt style={{fontSize:19,fontWeight:'900',marginTop:12}}>سلتك لسه فاضية</Txt><Txt style={s.small}>تصفح القائمة وأضف منتجاتك</Txt></View>:state.cart.map((line:CartLine)=><View key={line.id} style={s.card}><View style={[s.row,{alignItems:'flex-start'}]}><View style={{flex:1,marginHorizontal:8}}><Txt style={{fontWeight:'900',fontSize:17,color:C.navy}}>{line.name}</Txt><Txt style={s.small}>{line.size!=='عادي'?`الحجم ${line.size} · ` :''}{`${line.quantity} ${line.unit==='للكيلو'?'كجم':line.unit==='للقطعة'?'قطعة':displayUnit(line.unit)}`}</Txt></View><View style={{flexDirection:'row',alignItems:'center',gap:4}}><Pressable accessibilityRole="button" accessibilityLabel={`تعديل ${line.name}`} onPress={()=>onEdit?.(line)} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:'rgba(23,74,156,0.09)'}}><Ionicons name="create-outline" size={20} color={C.blue}/><Txt style={{fontSize:10,color:C.blue,fontWeight:'800'}}>تعديل</Txt></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`حذف ${line.name} من السلة`} onPress={()=>setState((x:AppState)=>({...x,cart:x.cart.filter(l=>l.id!==line.id)}))} style={{minWidth:42,minHeight:44,alignItems:'center',justifyContent:'center'}}><Ionicons name="trash-outline" size={19} color={C.red}/></Pressable></View></View>{!!line.options.length&&<Txt style={[s.small,{marginTop:8}]}>التجهيز: {line.options.join('، ')}</Txt>}{!!line.note&&<Txt style={[s.small,{marginTop:4}]}>ملاحظة: {line.note}</Txt>}<View style={[s.row,{marginTop:10}]}><View style={[s.row,{gap:10}]}><Pressable accessibilityRole="button" accessibilityLabel="تقليل الكمية" onPress={()=>qty(line,-1)} style={{width:44,height:44,alignItems:'center',justifyContent:'center',backgroundColor:C.surfaceAlt,borderRadius:15,borderWidth:1,borderColor:C.border}}><Ionicons name="remove" size={20} color={C.navy}/></Pressable><Txt style={{fontWeight:'900'}}>{line.quantity} {line.unit==='للكيلو'?'كجم':line.unit==='للقطعة'?'قطعة':line.unit}</Txt><Pressable accessibilityRole="button" accessibilityLabel="زيادة الكمية" onPress={()=>qty(line,1)} style={{width:44,height:44,alignItems:'center',justifyContent:'center',backgroundColor:C.surfaceAlt,borderRadius:15,borderWidth:1,borderColor:C.border}}><Ionicons name="add" size={20} color={C.navy}/></Pressable></View></View></View>)}
 <View style={s.card}><Txt style={{fontSize:17,fontWeight:'900',color:C.navy}}>بيانات العميل</Txt><Field label="الاسم بالكامل (مطلوب)" value={customer} onChangeText={(v:string)=>{setCustomer(v);setFormError('')}} placeholder="الاسم بالكامل"/><Field label="رقم الهاتف للتأكيد (مطلوب)" value={phone} onChangeText={(value:string)=>{setPhone(value);setFormError('')}} placeholder="01xxxxxxxxx" keyboardType="phone-pad"/></View>
 {delivery.includes('توصيل')&&<View style={s.card}><Txt style={{fontSize:17,fontWeight:'900',color:C.navy}}>عنوان التوصيل</Txt><Button title={busy?'جارٍ تحديد منطقتك…':'تحديد منطقتي بالـ GPS 📍'} onPress={gps} style={{marginTop:10}}/><Txt style={[s.small,{marginTop:4,marginBottom:6,color:C.muted}]}>يحدد الـ GPS منطقتك فقط، ويكتب العميل اسم الشارع ورقم العقار بدقة لضمان سرعة التوصيل.</Txt><Field label="المنطقة في الإسكندرية (مطلوب)" value={zone} onChangeText={(value:string)=>{setZone(value);setFormError('')}} placeholder="كامب شيزار، سموحة، لوران، ميامي…"/><ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:6}}>{alexandriaAreas.map(a=><Chip key={a} label={a} selected={zone===a} onPress={()=>setZone(a)}/>)}</ScrollView><Field label="اسم الشارع (مطلوب)" value={street} onChangeText={setStreet} placeholder="شارع بورسعيد، شارع إقبال…"/><Field label="رقم العقار (مطلوب)" value={building} onChangeText={setBuilding} placeholder="عمارة رقم / فيلا"/>{!!coords&&<Txt style={s.small}>إحداثيات الموقع: {coords}</Txt>}{state.registered&&state.addressBook.length>0&&<ScrollView horizontal>{state.addressBook.map((a:string)=><Chip key={a} label={a} onPress={()=>{setStreet(a)}}/>)}</ScrollView>}</View>}
 <View style={s.card}><Txt style={{fontSize:17,fontWeight:'900',color:C.navy}}>كود الخصم</Txt><View style={[s.row,{gap:8,marginTop:8}]}><View style={{flex:1}}><Field value={code} onChangeText={setCode} placeholder="اكتب كود الكوبون"/></View><Button title="تطبيق" onPress={apply} style={{paddingVertical:10,paddingHorizontal:18}}/></View>{!!applied&&<Txt style={{color:C.green,fontWeight:'700'}}>✓ تم تفعيل الكوبون {applied} بنجاح · يخصم من الإجمالي عند التجهيز والاستلام</Txt>}</View>
 {state.registered&&state.loyalty&&state.points>=state.minPoints&&<Pressable onPress={()=>setRedeem(x=>!x)} style={[s.card,s.row,{minHeight:52}]}><Txt style={{color:redeem?C.green:C.muted,fontWeight:'900'}}>{redeem?'✓':'○'}</Txt><Txt style={{fontWeight:'700'}}>استبدل {state.points} نقطة مكافآت · يخصم من طلبك عند الاستلام</Txt></Pressable>}
 <View style={s.card}><Txt style={{fontWeight:'900',fontSize:17,color:C.navy}}>موعد الاستلام أو التوصيل</Txt><Txt style={[s.small,{marginTop:4,marginBottom:10}]}>{reservedForTomorrow?'طلبك بعد الساعة ٤ مساءً، لذلك سيتم حجزه لبكرة.':'اختر ما يناسبك: تسليم قياسي سريع أو حجز ميعاد محدد.'}</Txt>

<View style={{flexDirection:'row-reverse',gap:8,marginBottom:12}}>
  <Pressable accessibilityRole="button" accessibilityLabel="تسليم خلال ساعتين إلى ٣ ساعات" onPress={()=>setDeliveryTimingMode('standard_2_3h')} style={{flex:1,paddingVertical:12,paddingHorizontal:10,borderRadius:16,borderWidth:2,borderColor:deliveryTimingMode==='standard_2_3h'?C.green:C.border,backgroundColor:deliveryTimingMode==='standard_2_3h'?'rgba(35,122,87,0.1)':C.surface,alignItems:'center',justifyContent:'center'}}>
    <View style={{flexDirection:'row-reverse',alignItems:'center',gap:6}}>
      <Ionicons name={deliveryTimingMode==='standard_2_3h'?"radio-button-on":"radio-button-off"} size={18} color={deliveryTimingMode==='standard_2_3h'?C.green:C.muted}/>
      <Txt style={{fontWeight:'900',fontSize:13,color:deliveryTimingMode==='standard_2_3h'?C.green:C.navy,textAlign:'center'}}>خلال ساعتين لـ ٣ ساعات</Txt>
    </View>
    <Txt style={[s.small,{fontSize:10,marginTop:3,textAlign:'center',color:deliveryTimingMode==='standard_2_3h'?C.ink:C.muted}]}>التسليم الطبيعي المعتاد ⚡</Txt>
  </Pressable>

  <Pressable accessibilityRole="button" accessibilityLabel="التسليم على ميعاد محدد" onPress={()=>setDeliveryTimingMode('scheduled')} style={{flex:1,paddingVertical:12,paddingHorizontal:10,borderRadius:16,borderWidth:2,borderColor:deliveryTimingMode==='scheduled'?C.green:C.border,backgroundColor:deliveryTimingMode==='scheduled'?'rgba(35,122,87,0.1)':C.surface,alignItems:'center',justifyContent:'center'}}>
    <View style={{flexDirection:'row-reverse',alignItems:'center',gap:6}}>
      <Ionicons name={deliveryTimingMode==='scheduled'?"radio-button-on":"radio-button-off"} size={18} color={deliveryTimingMode==='scheduled'?C.green:C.muted}/>
      <Txt style={{fontWeight:'900',fontSize:13,color:deliveryTimingMode==='scheduled'?C.green:C.navy,textAlign:'center'}}>على ميعاد محدد</Txt>
    </View>
    <Txt style={[s.small,{fontSize:10,marginTop:3,textAlign:'center',color:deliveryTimingMode==='scheduled'?C.ink:C.muted}]}>اختيار من المواعيد المحددة 🕒</Txt>
  </Pressable>
</View>

{deliveryTimingMode==='standard_2_3h'?(
  <View style={{backgroundColor:'rgba(35,122,87,0.08)',padding:12,borderRadius:14,borderWidth:1,borderColor:'rgba(35,122,87,0.2)',marginBottom:8}}>
    <View style={{flexDirection:'row-reverse',alignItems:'center',gap:8}}>
      <Txt style={{fontSize:20}}>⚡</Txt>
      <View style={{flex:1,alignItems:'flex-end'}}>
        <Txt style={{fontWeight:'900',color:C.green,fontSize:13}}>التسليم الطبيعي: خلال ساعتين إلى ٣ ساعات</Txt>
        <Txt style={[s.small,{marginTop:2,lineHeight:17}]}>{reservedForTomorrow?'سيتم تجهيز طلبك وتوصيله غداً طازجاً خلال ساعتين إلى ٣ ساعات من فتح المتجر.':'يتم تجهيز طلبك طازجاً وتوصيله لعنوانك خلال ساعتين إلى ٣ ساعات من لحظة تأكيد الطلب.'}</Txt>
      </View>
    </View>
  </View>
):(
  <View style={{marginBottom:8}}>
    <Txt style={{fontWeight:'800',fontSize:13,color:C.navy,marginBottom:6,textAlign:'right'}}>المواعيد المتاحة للتوصيل:</Txt>
    <View style={[s.row,{flexWrap:'wrap',justifyContent:'flex-end',gap:6}]}>
      {availableSlots.map(item=><Chip key={item.label} label={item.label} selected={slot===item.label} onPress={()=>setSlot(item.label)}/>)}
    </View>
  </View>
)}

<View style={{backgroundColor:C.surfaceAlt,paddingHorizontal:12,paddingVertical:8,borderRadius:12,marginTop:4,marginBottom:4}}>
  <Txt style={{fontWeight:'800',fontSize:13,color:C.navy,textAlign:'right'}}>
    موعد التسليم المعتمد: <Txt style={{fontWeight:'900',color:C.action}}>{deliveryTimingMode==='standard_2_3h'?(reservedForTomorrow?'بكرة (خلال ساعتين إلى ٣ ساعات)':'اليوم (خلال ساعتين إلى ٣ ساعات)'):`${reservedForTomorrow?'بكرة':'اليوم'} · ${slot}`}</Txt>
  </Txt>
</View>

<Txt style={{fontWeight:'900',marginTop:16,color:C.navy}}>طريقة الدفع</Txt><View style={[s.row,{marginTop:8}]}>{['الدفع عند الاستلام','InstaPay'].map(x=><Chip key={x} label={x} selected={payment===x} onPress={()=>setPayment(x)}/>)}</View>{payment==='InstaPay'&&<Txt style={[s.small,{marginTop:9}]}>يُرجى التحويل عند تأكيد الطلب. سيتم إرسال بيانات التحويل من الفرع.</Txt>}<Field label="ملاحظات على الطلب" value={note} onChangeText={setNote} placeholder="أي تعليمات إضافية للتوصيل أو التجهيز"/></View> {!!formError&&<View accessibilityRole="alert" style={[s.card,{flexDirection:'row',alignItems:'center',gap:9,backgroundColor:'rgba(214,40,50,0.08)',borderColor:'rgba(214,40,50,0.2)'}]}><Ionicons name="alert-circle-outline" size={21} color={C.red}/><Txt style={{flex:1,color:C.red,fontWeight:'800',fontSize:13}}>{formError}</Txt></View>}
 {isStoreClosed&&<View accessibilityRole="alert" style={[s.card,{backgroundColor:'rgba(214,40,50,0.08)',borderColor:'rgba(214,40,50,0.2)'}]}><View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:4}}><Ionicons name="pause-circle" size={20} color={C.red}/><Txt style={{color:C.red,fontWeight:'900',fontSize:15}}>المتجر مغلق مؤقتاً</Txt></View><Txt style={[s.small,{color:C.navy}]}>{state.storeStatus?.message||'نعتذر عن استقبال الطلبات في الوقت الحالي.'}</Txt>{!!state.storeStatus?.nextOpenTime&&<Txt style={[s.small,{fontWeight:'700',marginTop:4,color:C.blue}]}>موعد استئناف العمل: {state.storeStatus.nextOpenTime}</Txt>}</View>}
 <View style={[s.card,{backgroundColor:'rgba(23,74,156,0.06)',borderColor:'rgba(23,74,156,0.22)',borderWidth:1.5}]}>
   <View style={{flexDirection:'row-reverse',alignItems:'center',gap:10}}>
     <Txt style={{fontSize:22}}>⚖️</Txt>
     <View style={{flex:1,alignItems:'flex-end'}}>
       <Txt style={{fontWeight:'900',fontSize:14,color:C.navy}}>الحساب النهائي بالوزن عند الاستلام</Txt>
       <Txt style={[s.small,{marginTop:3,lineHeight:18,textAlign:'right',color:C.ink}]}>
         نظراً لأن الطيور تذبح وتنظف وتجهز طازجة فور طلبك، فإن الحساب النهائي يتم بالوزن الفعلي الصافي على الميزان عند الاستلام أو التوصيل.
       </Txt>
     </View>
   </View>
 </View>
 <View style={s.card}><Button title={isStoreClosed?(state.storeStatus?.message||'المتجر مغلق مؤقتاً'):unavailableProduct?`${unavailableProduct.name} نفد مؤقتاً`:busy?'جارٍ حفظ الطلب…':'تأكيد الطلب'} disabled={busy||!!unavailableProduct||isStoreClosed} onPress={submit}/>{!state.registered&&<Pressable onPress={onAuth} style={{padding:12,alignItems:'center'}}><Txt style={{color:C.blue}}>سجل حساباً لتجمع نقاطاً مع طلبك القادم</Txt></Pressable>}</View>
 </ScrollView>}


