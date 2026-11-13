import React,{createContext,useContext,useEffect,useRef} from 'react';
import { Animated, Easing, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Product } from './models';
import { C,s,isDarkMode } from './theme';
import { images } from './nativeAssets';
import { FastImage } from './FastImage';
import { cloudImages, toCdnUrl } from './cloudAssets';

export const FontScaleContext=createContext(1);

export function displayUnit(unit:string=''):string{
  if(!unit)return 'كيلو';
  const clean=unit.trim();
  if(/^(للكيلو|كيلو|الكيلو|بالكيلو|kilo)$/i.test(clean))return 'كيلو';
  if(/^(للقطعة|قطعة|القطعة|بالقطعة|piece)$/i.test(clean))return 'قطعة';
  if(/^(للجوز|جوز|الجوز|بالجوز|pair)$/i.test(clean))return 'جوز';
  if(/^(للطبق|طبق|الطبق|بالطبق|plate)$/i.test(clean))return 'طبق';
  if(/^(للطائر|طائر|الطائر|بالطائر|bird)$/i.test(clean))return 'طائر';
  if(/^(للكرتونة|كرتونة|كرتونه|الكرتونة|الكرتونه|بالكرتونة|carton)$/i.test(clean))return 'كرتونة';
  return clean.replace(/^(لل|بال|ال|ل)/,'')||clean;
}

export function formatItemNaturalTitle(item: { name?: string; quantity?: number | string; unit?: string; size?: string }): string {
  if (!item) return '';
  const numQty = Number(item.quantity);
  const qty = (!isNaN(numQty) && numQty > 0)
    ? (Number.isInteger(numQty) ? String(numQty) : String(numQty))
    : (item.quantity || 1);

  const rawUnit = (item.unit || '').trim();
  const cleanName = (item.name || '').trim();
  const rawSize = (item.size || '').trim();

  // Omit default/standard size indicators like 'عادي', 'Standard', 'standard'
  const isDefaultSize = !rawSize || /^(عادي|standard|الافتراضي)$/i.test(rawSize);
  const sizeSuffix = !isDefaultSize ? ` (${rawSize})` : '';

  // 1. Kilo units (للكيلو, كيلو, كجم, ك, KILO, kilo) -> "1.5 كيلو شيش"
  if (/^(للكيلو|كيلو|كجم|ك|kilo)$/i.test(rawUnit)) {
    return `${qty} كيلو ${cleanName}${sizeSuffix}`;
  }

  // 2. Pairs (للجوز, جوز, pair) -> "1.5 جوز حمام"
  if (/^(للجوز|جوز|الجوز|بالجوز|pair)$/i.test(rawUnit)) {
    return `${qty} جوز ${cleanName}${sizeSuffix}`;
  }

  // 3. Cartons / Trays (كرتونة, للكرتونة, طبق, للطبق) -> "1.5 كرتونة بيض" / "1.5 طبق كبد وقوانص"
  if (/^(الكرتونة|كرتونة|كرتونه|للكرتونة|للكرتونه|بالكرتونة|carton)$/i.test(rawUnit)) {
    return `${qty} كرتونة ${cleanName}${sizeSuffix}`;
  }
  if (/^(الطبق|للطبق|طبق|بالطبق|plate)$/i.test(rawUnit)) {
    return `${qty} طبق ${cleanName}${sizeSuffix}`;
  }

  // 4. Count / Pieces / Items (للقطعة, قطعة, عدد, دبابيس) -> "عدد 8 دبوس" / "1.5 قطعة"
  if (/^(للقطعة|قطعة|قطع|عدد|حبة|piece)$/i.test(rawUnit)) {
    const isFractional = !Number.isInteger(numQty);
    return isFractional ? `${qty} قطعة ${cleanName}${sizeSuffix}` : `عدد ${qty} ${cleanName}${sizeSuffix}`;
  }

  // 5. Birds / Chickens / Ducks (للطائر, طائر, دجاجة, فرخة, بطة) -> "عدد 1 فرخة بيضاء"
  if (/^(للطائر|طائر|دجاجة|فرخة|بطة|bird)$/i.test(rawUnit)) {
    return `عدد ${qty} ${cleanName}${sizeSuffix}`;
  }

  // Fallback: If unit is empty or contains عدد
  if (!rawUnit || /عدد/i.test(rawUnit)) {
    return `عدد ${qty} ${cleanName}${sizeSuffix}`;
  }

  return `${qty} ${displayUnit(rawUnit)} ${cleanName}${sizeSuffix}`;
}

export function getProductImageSource(product: any): any {
  if (!product) return images.chicken;
  const uri = typeof product.imageUri === 'string' && product.imageUri.trim().length > 5 ? product.imageUri.trim() : null;
  const url = typeof product.imageUrl === 'string' && product.imageUrl.trim().length > 5 ? product.imageUrl.trim() : null;
  if (uri) return { uri: toCdnUrl(uri, 450) };
  if (url) return { uri: toCdnUrl(url, 450) };

  const key = product.image || '';
  if (images[key]) return images[key];
  if (cloudImages[key]) return { uri: toCdnUrl(cloudImages[key], 450) };

  const prefixed = `product-${key}`;
  if (images[prefixed]) return images[prefixed];
  if (cloudImages[prefixed]) return { uri: toCdnUrl(cloudImages[prefixed], 450) };

  const stripped = key.replace(/^product-/, '');
  if (images[stripped]) return images[stripped];
  if (cloudImages[stripped]) return { uri: toCdnUrl(cloudImages[stripped], 450) };

  // Smart semantic fallback by product name and category
  const name = product.name || '';
  if (/بيض أحمر|بيض احمر/.test(name)) return { uri: toCdnUrl(cloudImages['product-red-eggs'], 450) };
  if (/بيض/.test(name)) return { uri: toCdnUrl(cloudImages['product-eggs-bldi'], 450) };
  if (/سمن/.test(name)) return { uri: toCdnUrl(cloudImages['product-smna'], 450) };
  if (/حمام/.test(name)) return images.pigeon || { uri: toCdnUrl(cloudImages['product-pigeon'], 450) };
  if (/سمان/.test(name)) return { uri: toCdnUrl(cloudImages['product-quail'], 450) };
  if (/بط/.test(name) || product.category === 'بط') return images.duck || { uri: toCdnUrl(cloudImages['product-duck-fallahi'], 450) };
  if (/رومي/.test(name) || product.category === 'رومي') return { uri: toCdnUrl(cloudImages['product-rosto-turkey'], 450) };
  if (/دبوس|دبابيس/.test(name)) return images.drumsticks || { uri: toCdnUrl(cloudImages['drumsticks'], 450) };
  if (/جناح|أجنحة|اجنحة/.test(name)) return images.wings || { uri: toCdnUrl(cloudImages['product-wing'], 450) };
  if (/شيش/.test(name)) return images.shish || { uri: toCdnUrl(cloudImages['product-shish'], 450) };
  if (/بانيه|بانية|فيليه/.test(name)) return images.panee || { uri: toCdnUrl(cloudImages['product-panee'], 450) };
  if (/كبد|قوانص/.test(name)) return { uri: toCdnUrl(cloudImages['product-liver'], 450) };
  if (/أرانب|ارانب/.test(name)) return { uri: toCdnUrl(cloudImages['product-rabbit'], 450) };
  if (/برجر/.test(name)) return { uri: toCdnUrl(cloudImages['product-burger'], 450) };
  if (/كفتة|كفته/.test(name)) return { uri: toCdnUrl(cloudImages['product-kofta-chicken'], 450) };
  if (/ستربس|استربس/.test(name)) return { uri: toCdnUrl(cloudImages['product-strips'], 450) };

  return images.chicken;
}

function withoutEmoji(value:any):any{
  if(typeof value==='string')return value.replace(/[\u{1F000}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu,'');
  if(Array.isArray(value))return value.map(withoutEmoji);
  return value;
}

export function Txt({children,style,...props}:any){
  const scale=useContext(FontScaleContext);
  const flat=StyleSheet.flatten(style)||{};
  const weight=flat.fontWeight==='bold'?700:Number(flat.fontWeight)||400;
  const isHeading=weight>=700&&Number(flat.fontSize)>=20;
  const displayWeight=isHeading?weight:Math.min(weight,500);

  let defaultFamily='Rubik_400Regular';
  if(displayWeight>=800) defaultFamily='Rubik_900Black';
  else if(displayWeight>=700) defaultFamily='Rubik_700Bold';
  else if(displayWeight>=500) defaultFamily='Rubik_500Medium';

  const rawFamily=flat.fontFamily||defaultFamily;
  const isRuqaa=rawFamily.includes('Aref')||rawFamily.includes('Ruqaa');
  const chosenFamily=Platform.OS==='web'&&isRuqaa?"'Aref Ruqaa', 'ArefRuqaa_700Bold', serif":rawFamily;
  const isNamedVariant=chosenFamily.includes('_');

  const webSmoothing=Platform.OS==='web'?{WebkitFontSmoothing:'antialiased',MozOsxFontSmoothing:'grayscale'}:{};
  const textAlign=flat.textAlign||'right';

  // Android font engine fails if a font family containing the weight has synthetic fontWeight applied.
  const resolvedFontWeight=Platform.OS==='android'&&isNamedVariant ? undefined : (flat.fontWeight||displayWeight);

  let ruqaaExtraStyle: any = null;
  if (isRuqaa) {
    const isDarkTheme = isDarkMode();
    const rawColor = String(flat.color || (isDarkTheme ? '#F8FAFC' : '#0F172A')).trim().toLowerCase();
    const isLightText =
      rawColor === '#ffffff' ||
      rawColor === '#fff' ||
      rawColor === '#f8fafc' ||
      rawColor === '#f1f5f9' ||
      rawColor === '#e2eefe' ||
      rawColor === '#fde047' ||
      rawColor.startsWith('rgba(255') ||
      rawColor.startsWith('rgba(248') ||
      (isDarkTheme && !flat.color);

    ruqaaExtraStyle = {
      ...(Platform.OS === 'web'
        ? {
            WebkitTextStroke: flat.WebkitTextStroke || (isDarkTheme
              ? (isLightText ? '0.55px rgba(245, 201, 92, 0.60)' : '0.55px rgba(245, 201, 92, 0.75)')
              : (isLightText ? '0.65px rgba(14, 47, 101, 0.75)' : '0.45px rgba(217, 119, 6, 0.42)')),
            paintOrder: 'stroke fill',
          }
        : {}),
      textShadowColor: flat.textShadowColor || (isDarkTheme
        ? (isLightText ? 'rgba(0, 0, 0, 0.85)' : 'rgba(245, 201, 92, 0.35)')
        : (isLightText ? 'rgba(0, 0, 0, 0.45)' : 'rgba(217, 119, 6, 0.22)')),
      textShadowOffset: flat.textShadowOffset || { width: 0, height: isDarkTheme ? 1.5 : 1 },
      textShadowRadius: flat.textShadowRadius !== undefined ? flat.textShadowRadius : (isDarkTheme ? 2.5 : 1.5),
    };
  }

  return (
    <Text
      {...props}
      style={[
        {color:C.ink},
        webSmoothing,
        style,
        flat.fontSize?{fontSize:flat.fontSize*scale}:null,
        {
          fontFamily:chosenFamily,
          fontWeight:resolvedFontWeight,
          textAlign,
          writingDirection:'rtl',
        },
        ruqaaExtraStyle,
      ]}
    >
      {withoutEmoji(children)}
    </Text>
  );
}

export function Button({title,onPress,secondary=false,disabled=false,style}:any){
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={()=>{Haptics.selectionAsync().catch(()=>{});onPress?.()}}
      style={[s.button,secondary&&{backgroundColor:C.surfaceAlt},disabled&&{opacity:0.55},style]}
    >
      <Txt style={[s.buttonText,secondary&&{color:C.navy}]}>{title}</Txt>
    </Pressable>
  );
}

export function Field({label,value,onChangeText,placeholder,keyboardType,secureTextEntry,passwordVisibilityToggle,passwordVisible,onTogglePassword}:any){
  return (
    <View style={{marginBottom:10}}>
      {label&&<Txt style={{fontWeight:'700',textAlign:'right',marginBottom:3}}>{label}</Txt>}
      <View style={{position:'relative'}}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9AA3B2"
          keyboardType={keyboardType}
          secureTextEntry={passwordVisibilityToggle?!passwordVisible:secureTextEntry}
          style={[s.input,passwordVisibilityToggle&&{paddingLeft:52}]}
        />
        {passwordVisibilityToggle&&(
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible?'إخفاء كلمة المرور':'إظهار كلمة المرور'}
            onPress={onTogglePassword}
            style={{position:'absolute',left:6,top:6,width:44,height:44,alignItems:'center',justifyContent:'center'}}
          >
            <Ionicons name={passwordVisible?'eye-off-outline':'eye-outline'} size={21} color={C.muted}/>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function Chip({label,selected,onPress}:any){
  return (
    <Pressable
      onPress={()=>{Haptics.selectionAsync().catch(()=>{});onPress?.()}}
      style={[s.pill,selected&&{backgroundColor:C.action}]}
    >
      <Txt style={[s.pillText,selected&&{color:C.actionText}]}>{label}</Txt>
    </Pressable>
  );
}

export function ScreenTitle({title,subtitle}:any){
  return (
    <View style={{marginBottom:16,alignItems:'flex-end',width:'100%'}}>
      <Txt style={[s.title,{textAlign:'right'}]}>{title}</Txt>
      {subtitle&&<Txt style={[s.subtitle,{textAlign:'right',marginTop:4}]}>{subtitle}</Txt>}
      <View style={{width:42,height:3,borderRadius:3,backgroundColor:C.gold,marginTop:8,alignSelf:'flex-end'}}/>
    </View>
  );
}

export function ProductCard({product,onPress,onAdd,compact=false,inCartQty=0}:any){
  const {width}=useWindowDimensions();
  const isSmallScreen=width<360;
  const buttonSize=compact?(isSmallScreen?32:36):(isSmallScreen?36:40);
  const cardPadding=isSmallScreen?8:11;
  const cardScale=useRef(new Animated.Value(1)).current;
  const btnScale=useRef(new Animated.Value(1)).current;

  const handlePressIn=()=>{
    Animated.spring(cardScale,{toValue:0.965,speed:30,bounciness:3,useNativeDriver:true}).start();
  };
  const handlePressOut=()=>{
    Animated.spring(cardScale,{toValue:1,speed:24,bounciness:6,useNativeDriver:true}).start();
  };

  const handleBtnPress=()=>{
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(()=>{});
    Animated.sequence([
      Animated.timing(btnScale,{toValue:0.85,duration:70,useNativeDriver:true}),
      Animated.spring(btnScale,{toValue:1,speed:22,bounciness:7,useNativeDriver:true}),
    ]).start();
    if(product.priceOnCall) onPress?.();
    else onAdd?.();
  };

  const isOffer = product.offer || (product.badge && /عرض|توفير|خصم|وفر/i.test(product.badge));
  const badgeBg = product.badgeColor || (isOffer ? '#DC2626' : '#15803D');

  return (
    <Animated.View style={{width:compact?(isSmallScreen?150:168):'48%',transform:[{scale:cardScale}],marginBottom:10}}>
      <View style={[s.card,{width:'100%',padding:cardPadding,borderRadius:20,elevation:compact?3:2,marginBottom:0}]}>
        <Pressable
          accessibilityRole="button"
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={()=>{
            Haptics.selectionAsync().catch(()=>{});
            onPress?.();
          }}>
          {/* Product Image Frame (Clean Studio Light & Shadow) */}
          <View
            style={{
              height: compact ? (isSmallScreen ? 100 : 110) : (isSmallScreen ? 110 : 122),
              backgroundColor: isDarkMode() ? '#172234' : '#FFFFFF',
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 6,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: isDarkMode() ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              position: 'relative',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDarkMode() ? 0.3 : 0.04,
              shadowRadius: 3,
              elevation: 2,
            }}>
            <FastImage
              source={getProductImageSource(product)}
              fallbackSource={images.chicken}
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
            />

            {/* In-Cart Pill Badge */}
            {inCartQty > 0 && (
              <View style={{position:'absolute',top:7,left:7,backgroundColor:'#15803D',paddingHorizontal:7,paddingVertical:3,borderRadius:10,flexDirection:'row-reverse',alignItems:'center',gap:3,zIndex:3,borderWidth:1,borderColor:'#FFFFFF',elevation:3}}>
                <Ionicons name="cart" size={11} color="#FFFFFF"/>
                <Txt style={{color:'#FFFFFF',fontSize:9.5,fontWeight:'900'}}>{inCartQty}</Txt>
              </View>
            )}

            {/* Floating Top-Right Marketing Badge */}
            {product.badge && product.available && (
              <View style={{position:'absolute',top:7,right:7,backgroundColor:badgeBg,paddingHorizontal:8,paddingVertical:3.5,borderRadius:10,zIndex:3,borderWidth:1,borderColor:'rgba(255,255,255,0.45)',shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.25,shadowRadius:4,elevation:3}}>
                <Txt style={{color:'#FFFFFF',fontSize:9,fontWeight:'900'}}>{product.badge}</Txt>
              </View>
            )}

            {/* Out of Stock Frosted Overlay */}
            {!product.available && (
              <View style={[StyleSheet.absoluteFill,{backgroundColor:'rgba(15,23,42,0.65)',alignItems:'center',justifyContent:'center',zIndex:4}]}>
                <View style={{backgroundColor:C.red,paddingHorizontal:9,paddingVertical:4,borderRadius:10,borderWidth:1,borderColor:'#FFFFFF'}}>
                  <Txt style={{color:C.white,fontSize:9.5,fontWeight:'900'}}>نفد مؤقتاً</Txt>
                </View>
              </View>
            )}
          </View>

          {/* Product Typography */}
          <Txt
            style={{
              fontFamily: 'Rubik_700Bold',
              fontWeight: '900',
              fontSize: isSmallScreen ? 13 : 14.5,
              lineHeight: 18,
              color: C.navy,
              textAlign: 'right',
              width: '100%',
            }}
            numberOfLines={2}>
            {product.name}
          </Txt>
          {!!product.subtitle?.trim() && (
            <Txt
              style={{
                fontSize: isSmallScreen ? 10 : 11,
                color: C.muted,
                lineHeight: 14,
                textAlign: 'right',
                width: '100%',
                marginTop: 2,
              }}
              numberOfLines={2}>
              {product.subtitle.trim()}
            </Txt>
          )}
        </Pressable>

        {/* Pricing & Call-to-Action Bar */}
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:5,width:'100%'}}>
          <View style={{alignItems:'flex-start'}}>
            <Txt style={{fontSize:isSmallScreen?13.5:15,fontWeight:'900',color:C.action,textAlign:'right'}}>
              {product.unit==='للقطعة'&&product.piecePrice?`${product.piecePrice} ج.م`:`${product.price} ج.م`}
            </Txt>
          </View>

          <Animated.View style={{transform:[{scale:btnScale}]}}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={product.available?'أضف '+product.name+' للسلة':'نفد مؤقتاً'}
              onPress={handleBtnPress}
              disabled={!product.available}
              style={{
                backgroundColor:product.available?(inCartQty>0?'#15803D':C.action):C.line,
                width:buttonSize,
                height:buttonSize,
                borderRadius:buttonSize/2,
                alignItems:'center',
                justifyContent:'center',
                shadowColor:C.action,
                shadowOffset:{width:0,height:3},
                shadowOpacity:product.available?0.3:0,
                shadowRadius:5,
                elevation:product.available?3:0
              }}
            >
              {product.available?(
                <Ionicons name={product.priceOnCall?'call-outline':(inCartQty>0?'checkmark':'add')} size={compact?19:21} color={C.actionText}/>
              ):(
                <Txt style={{color:C.muted,fontSize:8,fontWeight:'900'}}>نفد</Txt>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

export function ProductListCard({product,onPress,onAdd,inCartQty=0}:any){
  const {width}=useWindowDimensions();
  const isSmallScreen=width<360;
  const imageSize=isSmallScreen?76:84;
  const cardScale=useRef(new Animated.Value(1)).current;
  const btnScale=useRef(new Animated.Value(1)).current;

  const handlePressIn=()=>{
    Animated.spring(cardScale,{toValue:0.975,speed:30,bounciness:3,useNativeDriver:true}).start();
  };
  const handlePressOut=()=>{
    Animated.spring(cardScale,{toValue:1,speed:24,bounciness:6,useNativeDriver:true}).start();
  };

  const handleBtnPress=()=>{
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(()=>{});
    Animated.sequence([
      Animated.timing(btnScale,{toValue:0.85,duration:70,useNativeDriver:true}),
      Animated.spring(btnScale,{toValue:1,speed:22,bounciness:7,useNativeDriver:true}),
    ]).start();
    if(product.priceOnCall) onPress?.();
    else if(onAdd) onAdd();
    else onPress?.();
  };

  const isOffer = product.offer || (product.badge && /عرض|توفير|خصم|وفر/i.test(product.badge));
  const badgeBg = product.badgeColor || (isOffer ? '#DC2626' : '#15803D');

  return (
    <Animated.View style={{width:'100%',transform:[{scale:cardScale}]}}>
      <Pressable
        accessibilityRole="button"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={()=>{
          Haptics.selectionAsync().catch(()=>{});
          onPress?.();
        }}
        style={[s.card,{padding:10,flexDirection:'row-reverse',alignItems:'center',minHeight:product.subtitle?.trim()?102:82,marginBottom:0,borderRadius:20}]}>
        {/* Image Frame (Studio Clean Light & Shadow) */}
        <View
          style={{
            width: imageSize,
            height: imageSize,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDarkMode() ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            overflow: 'hidden',
            backgroundColor: isDarkMode() ? '#172234' : '#FFFFFF',
            flexShrink: 0,
            position: 'relative',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDarkMode() ? 0.3 : 0.04,
            shadowRadius: 3,
            elevation: 2,
          }}>
          <FastImage
            source={getProductImageSource(product)}
            fallbackSource={images.chicken}
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
          />

          {inCartQty > 0 && (
            <View style={{position:'absolute',top:5,left:5,backgroundColor:'#15803D',paddingHorizontal:6,paddingVertical:2.5,borderRadius:9,flexDirection:'row-reverse',alignItems:'center',gap:3,zIndex:2,borderWidth:1,borderColor:'#FFFFFF'}}>
              <Ionicons name="cart" size={10} color="#FFFFFF"/>
              <Txt style={{color:'#FFFFFF',fontSize:9,fontWeight:'900'}}>{inCartQty}</Txt>
            </View>
          )}

          {!product.available && (
            <View style={[StyleSheet.absoluteFill,{backgroundColor:'rgba(15,23,42,0.65)',alignItems:'center',justifyContent:'center',zIndex:3}]}>
              <View style={{backgroundColor:C.red,paddingHorizontal:7,paddingVertical:3,borderRadius:8}}>
                <Txt style={{color:C.white,fontSize:9,fontWeight:'900'}}>نفد</Txt>
              </View>
            </View>
          )}
        </View>

        {/* Content Info */}
        <View style={{flex:1,marginEnd:12,alignItems:'flex-end',justifyContent:'center'}}>
          {product.badge && product.available && (
            <View style={{backgroundColor:badgeBg,paddingHorizontal:8,paddingVertical:3,borderRadius:8,marginBottom:4,borderWidth:1,borderColor:'rgba(255,255,255,0.4)'}}>
              <Txt style={{fontSize:9,color:C.white,fontWeight:'900',textAlign:'right'}}>
                {product.badge}
              </Txt>
            </View>
          )}

          <Txt numberOfLines={1} style={{fontFamily:'Rubik_700Bold',fontSize:isSmallScreen?15:16.5,fontWeight:'900',color:C.navy,textAlign:'right',width:'100%'}}>
            {product.name}
          </Txt>
          {!!product.subtitle?.trim() && (
            <Txt numberOfLines={2} style={{fontSize:isSmallScreen?10.5:11.5,color:C.muted,lineHeight:15,marginTop:2,textAlign:'right',width:'100%'}}>
              {product.subtitle.trim()}
            </Txt>
          )}

          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',width:'100%',marginTop:4}}>
            <View style={{alignItems:'flex-start'}}>
              <Txt style={{fontSize:isSmallScreen?14.5:16.5,fontWeight:'900',color:C.action,textAlign:'right'}}>
                {product.unit==='للقطعة'&&product.piecePrice?`${product.piecePrice} ج.م`:`${product.price} ج.م`}
              </Txt>
            </View>

            <Animated.View style={{transform:[{scale:btnScale}]}}>
              <Pressable
                accessibilityRole="button"
                onPress={handleBtnPress}
                disabled={!product.available}
                style={{
                  width:36,
                  height:36,
                  borderRadius:18,
                  backgroundColor:product.available?(inCartQty>0?'#15803D':C.action):C.line,
                  alignItems:'center',
                  justifyContent:'center',
                  shadowColor:C.action,
                  shadowOffset:{width:0,height:2},
                  shadowOpacity:product.available?0.3:0,
                  shadowRadius:4,
                  elevation:product.available?2:0
                }}>
                <Ionicons name={product.priceOnCall?'call-outline':(inCartQty>0?'checkmark':'add')} size={20} color={C.actionText}/>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function SkeletonBox({width,height,borderRadius=8,style}:any){
  const opacity=useRef(new Animated.Value(0.35)).current;
  useEffect(()=>{
    const animation=Animated.loop(
      Animated.sequence([
        Animated.timing(opacity,{toValue:0.85,duration:700,easing:Easing.inOut(Easing.ease),useNativeDriver:true}),
        Animated.timing(opacity,{toValue:0.35,duration:700,easing:Easing.inOut(Easing.ease),useNativeDriver:true})
      ])
    );
    animation.start();
    return()=>animation.stop();
  },[opacity]);
  return <Animated.View style={[{width,height,borderRadius,backgroundColor:C.line,opacity},style]}/>;
}

export function ProductListSkeleton({count=4}:{count?:number}){
  return (
    <View style={{gap:12}}>
      {Array.from({length:count}).map((_,index)=>(
        <View key={index} style={[s.card,{padding:10,flexDirection:'row-reverse',alignItems:'center',minHeight:84,marginBottom:0}]}>
          <SkeletonBox width={80} height={80} borderRadius={16}/>
          <View style={{flex:1,marginEnd:12,alignItems:'flex-end',gap:6}}>
            <SkeletonBox width={55} height={15} borderRadius={6}/>
            <SkeletonBox width="75%" height={18} borderRadius={6}/>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',width:'100%',marginTop:4}}>
              <SkeletonBox width={70} height={18} borderRadius={4}/>
              <SkeletonBox width={32} height={32} borderRadius={16}/>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export function ProductGridSkeleton({count=4}:{count?:number}){
  return (
    <View style={{flexDirection:'row-reverse',flexWrap:'wrap',justifyContent:'space-between'}}>
      {Array.from({length:count}).map((_,index)=>(
        <View key={index} style={[s.card,{width:'48%',padding:10,marginBottom:10,borderRadius:20}]}>
          <SkeletonBox width="100%" height={116} borderRadius={16} style={{marginBottom:6}}/>
          <SkeletonBox width="75%" height={18} borderRadius={6} style={{marginBottom:6,alignSelf:'flex-end'}}/>
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:4,width:'100%'}}>
            <SkeletonBox width={60} height={18} borderRadius={6}/>
            <SkeletonBox width={36} height={36} borderRadius={18}/>
          </View>
        </View>
      ))}
    </View>
  );
}

export function StoriesBarSkeleton({count=5}:{count?:number}){
  return (
    <View style={{marginTop:14,marginBottom:8}}>
      <View style={{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',paddingHorizontal:18,marginBottom:10}}>
        <SkeletonBox width={120} height={20} borderRadius={6}/>
        <SkeletonBox width={75} height={20} borderRadius={10}/>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingVertical:4,flexDirection:'row-reverse',gap:14}}>
        {Array.from({length:count}).map((_,index)=>(
          <View key={index} style={{alignItems:'center',minWidth:72}}>
            <SkeletonBox width={70} height={70} borderRadius={35} style={{marginBottom:7}}/>
            <SkeletonBox width={48} height={18} borderRadius={9}/>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function CategoryStripSkeleton({count=6}:{count?:number}){
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingTop:18,paddingBottom:2,gap:14,flexDirection:'row-reverse'}}>
      {Array.from({length:count}).map((_,index)=>(
        <View key={index} style={{width:70,minHeight:104,alignItems:'center'}}>
          <SkeletonBox width={66} height={66} borderRadius={20} style={{marginBottom:6}}/>
          <SkeletonBox width={50} height={12} borderRadius={4}/>
        </View>
      ))}
    </ScrollView>
  );
}
