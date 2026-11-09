import React,{useEffect,useRef,useState} from 'react';
import { Image,StatusBar,View } from 'react-native';
import { C } from './theme';
import { Txt } from './ui';
import { images } from './nativeAssets';

export function LoadingScreen({message='لحظات ونجهّز طلبك…',onComplete}:any){
 const slogan='سهل تبقى فرارجي · صعب تبقى الرشيدي';
 const [typed,setTyped]=useState(0);
 const completeRef=useRef(onComplete);completeRef.current=onComplete;
 useEffect(()=>{let position=0;const timer=setInterval(()=>{if(position>=slogan.length){clearInterval(timer);completeRef.current?.();return}position+=3;setTyped(Math.min(position,slogan.length))},20);return()=>clearInterval(timer)},[]);
 const isDark=C.background==='#0B111A'||C.cream==='#0F172A'||C.cream==='#141C26';
 return <View style={{flex:1,minHeight:280,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:C.cream}}>
  <StatusBar barStyle={isDark?'light-content':'dark-content'}/>
  <View style={{width:104,height:104,borderRadius:52,backgroundColor:C.solidSurface,borderWidth:1,borderColor:C.border,padding:5,alignItems:'center',justifyContent:'center',elevation:5,shadowColor:C.navy,shadowOffset:{width:0,height:3},shadowOpacity:0.1,shadowRadius:12}}>
   <Image source={images['brand-logo']} resizeMode="contain" style={{width:'100%',height:'100%',borderRadius:48}}/>
  </View>
  <Txt style={{fontFamily:'Rubik_700Bold',fontSize:22,color:C.navy,marginTop:15}}>طيور الرشيدي</Txt>
  <Txt style={{fontSize:13,color:C.muted,marginTop:3,marginBottom:16}}>{message}</Txt>
  <View style={{width:'100%',maxWidth:330,alignItems:'center',marginTop:4}}>
   <Txt style={{fontFamily:'ArefRuqaa_700Bold',fontSize:22,fontWeight:'700',color:C.navy,textAlign:'center',lineHeight:34,minHeight:38}}>{slogan.slice(0,typed)}</Txt>
   <View accessibilityRole="progressbar" style={{height:6,width:'100%',backgroundColor:C.line,borderRadius:5,overflow:'hidden',marginTop:13}}><View style={{height:'100%',width:`${Math.max(3,Math.round(typed/slogan.length*100))}%`,backgroundColor:C.gold,borderRadius:5}}/></View>
  </View>
 </View>;
}
