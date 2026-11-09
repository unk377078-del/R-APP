import React,{useEffect,useMemo,useRef,useState} from 'react';
import { Pressable,ScrollView,TextInput,View } from 'react-native';
import { categories,Product } from './models';
import { AppState } from './store';
import { C,fontRuqaaBold,s } from './theme';
import { Button,ProductListCard,ProductListSkeleton,Txt } from './ui';
import { defaultProductsCatalog } from './productCatalog';

export function ProductsScreen({state,setState,onProduct,onAdd,filter,setFilter,search,setSearch,searchFocusRequest=0}:any){
  const searchInput=useRef<any>(null);
  const [debounced,setDebounced]=useState(search);
  const [isFiltering,setIsFiltering]=useState(false);

  useEffect(()=>{
    const timer=setTimeout(()=>setDebounced(search),220);
    return ()=>clearTimeout(timer);
  },[search]);

  useEffect(()=>{
    setIsFiltering(true);
    const timer=setTimeout(()=>setIsFiltering(false),160);
    return ()=>clearTimeout(timer);
  },[filter,debounced]);

  useEffect(()=>{
    if(searchFocusRequest)searchInput.current?.focus();
  },[searchFocusRequest]);

  const activeProducts = (state.products && state.products.length > 0) ? state.products : defaultProductsCatalog;

  const isOfferFilter = filter === 'عروض' || filter === 'عروض التوفير' || filter === 'عروض التوفير 🔥';

  const filterCategories = useMemo(() => {
    return ['الكل', 'عروض التوفير 🔥', ...categories.filter(c => c !== 'الكل')];
  }, []);

  const products=useMemo(()=>{
    return activeProducts.filter((p:Product)=>{
      const matchesSearch =
        (p.name||'').includes(debounced.trim()) ||
        (p.subtitle||'').includes(debounced.trim()) ||
        (p.offerDescription||'').includes(debounced.trim());
      if (!matchesSearch) return false;

      if (isOfferFilter) {
        return (
          p.available !== false &&
          (p.offer === true ||
            (p.badge && (p.badge.includes('عرض') || p.badge.includes('توفير') || p.badge.includes('تتبيلة'))) ||
            p.category === 'متبلات' ||
            p.featured)
        );
      }

      return filter==='الكل'||p.category===filter;
    }).sort((a: Product, b: Product) => {
      if (isOfferFilter) {
        return (a.offerOrder ?? 999) - (b.offerOrder ?? 999);
      }
      return 0;
    });
  },[activeProducts,debounced,filter,isOfferFilter]);

  const getInCartQty = (productId: string) => {
    return (state?.cart || []).reduce((sum: number, line: any) => line.productId === productId ? sum + line.quantity : sum, 0);
  };

  const restoreCatalog = () => {
    setState?.((current: AppState) => ({
      ...current,
      products: defaultProductsCatalog,
    }));
  };

  return (
    <ScrollView contentContainerStyle={{paddingBottom:24,alignItems:'center'}} showsVerticalScrollIndicator={false}>
      <View style={{width:'100%',maxWidth:680,paddingTop:12}}>
        <View style={[s.row,{paddingHorizontal:16,marginBottom:8}]}>
          <View style={{alignItems:'flex-end'}}>
            <Txt style={{fontFamily:fontRuqaaBold,fontSize:26,lineHeight:34,fontWeight:'700',color:C.navy,textAlign:'right'}}>قائمة طيور الرشيدي</Txt>
            <Txt style={{fontSize:11,color:C.muted,textAlign:'right',marginTop:2}}>دواجن، بط، حمام، متبلات طازجة مذبوحة يومياً</Txt>
          </View>
          <View style={{backgroundColor:C.surfaceAlt,borderRadius:20,paddingHorizontal:11,paddingVertical:5,borderWidth:1,borderColor:C.border}}>
            <Txt style={{fontSize:11,fontWeight:'900',color:C.gold}}>طازة يومياً</Txt>
          </View>
        </View>

        <View style={{paddingHorizontal:16}}>
          <TextInput
            ref={searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث عن فراخ، بط، رومي، بانيه، حمام، متبلات..."
            placeholderTextColor={C.muted}
            style={[s.input,{height:50,borderRadius:25,paddingHorizontal:18,marginTop:4,elevation:2,textAlign:'right',writingDirection:'rtl'}]}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingVertical:10,gap:8,flexDirection:'row-reverse'}}>
          {filterCategories.map(c=>{
            const isSelected = filter === c || (c === 'عروض التوفير 🔥' && isOfferFilter);
            return (
              <Pressable
                key={c}
                onPress={()=>setFilter(c === 'عروض التوفير 🔥' ? 'عروض التوفير' : c)}
                style={[s.pill,{marginRight:0,backgroundColor:isSelected?C.action:C.surface,borderColor:isSelected?C.action:C.border}]}
              >
                <Txt style={{fontSize:12,fontWeight:isSelected?'900':'700',color:isSelected?C.actionText:C.ink}}>{c}</Txt>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={[s.row,{paddingHorizontal:16,paddingVertical:4,marginBottom:6}]}>
          <Txt style={{fontFamily:'Rubik_700Bold',fontSize:20,fontWeight:'900',color:C.navy,textAlign:'right'}}>
            {isOfferFilter ? 'عروض التوفير الحصرية 🔥' : filter}
          </Txt>
          <Txt style={{fontSize:12,color:C.muted}}>{products.length} صنف متاح</Txt>
        </View>

        {isFiltering || (!products.length && activeProducts.length === 0) ? (
          <View style={{paddingHorizontal:16}}>
            <ProductListSkeleton count={5}/>
          </View>
        ) : products.length > 0 ? (
          <View style={{paddingHorizontal:16,gap:12}}>
            {products.map((p:Product)=><ProductListCard key={p.id} product={p} inCartQty={getInCartQty(p.id)} onPress={()=>onProduct(p)} onAdd={()=>onAdd?.(p)}/>)}
          </View>
        ) : (
          <View style={[s.card,{margin:20,alignItems:'center',padding:30}]}>
            <Txt style={{fontFamily:'Rubik_700Bold',fontSize:18,fontWeight:'900',color:C.navy,textAlign:'center'}}>لا توجد منتجات مطابقة للبحث</Txt>
            <Txt style={{fontSize:12,color:C.muted,marginTop:6,textAlign:'center'}}>جرّب البحث باسم صنف آخر أو اختر قسماً مختلفاً من الأعلى</Txt>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
