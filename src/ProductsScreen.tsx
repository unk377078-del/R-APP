import React,{useEffect,useMemo,useRef,useState} from 'react';
import { Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { categories, Product } from './models';
import { AppState } from './store';
import { C, fontRuqaaBold, s, isDarkMode } from './theme';
import { Button, ProductListCard, ProductListSkeleton, Txt } from './ui';
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

  const isDark = isDarkMode();

  return (
    <ScrollView
      stickyHeaderIndices={[1]}
      contentContainerStyle={{ paddingBottom: 28, alignItems: 'center' }}
      showsVerticalScrollIndicator={false}>
      {/* 0. Top Header & Search Area */}
      <View style={{ width: '100%', maxWidth: 680, paddingTop: 12 }}>
        <View style={[s.row, { paddingHorizontal: 16, marginBottom: 8 }]}>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt style={{ fontFamily: fontRuqaaBold, fontSize: 26, lineHeight: 34, fontWeight: '700', color: C.navy, textAlign: 'right' }}>
              قائمة طيور الرشيدي
            </Txt>
            <Txt style={{ fontSize: 11, color: C.muted, textAlign: 'right', marginTop: 2 }}>
              دواجن، بط، حمام، متبلات طازجة مذبوحة يومياً
            </Txt>
          </View>
          <View style={{ backgroundColor: C.surfaceAlt, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5, borderWidth: 1, borderColor: C.border }}>
            <Txt style={{ fontSize: 11, fontWeight: '900', color: C.gold }}>طازة يومياً</Txt>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
          <TextInput
            ref={searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث عن فراخ، بط، رومي، بانيه، حمام، متبلات..."
            placeholderTextColor={C.muted}
            style={[s.input, { height: 48, borderRadius: 24, paddingHorizontal: 18, elevation: 2, textAlign: 'right', writingDirection: 'rtl' }]}
          />
        </View>
      </View>

      {/* 1. STICKY CATEGORIES BAR (Pins to top when scrolling) */}
      <View
        style={{
          width: '100%',
          backgroundColor: isDark ? '#0D1C32' : C.background,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 5,
          elevation: 5,
          paddingVertical: 7,
          zIndex: 999,
          ...(Platform.OS === 'web'
            ? {
                position: 'sticky' as any,
                top: 0,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }
            : {}),
        }}>
        <View style={{ width: '100%', maxWidth: 680, alignSelf: 'center' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 2,
              gap: 8,
              flexDirection: 'row-reverse',
              alignItems: 'center',
            }}>
            {filterCategories.map((c) => {
              const isSelected = filter === c || (c === 'عروض التوفير 🔥' && isOfferFilter);
              return (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setFilter(c === 'عروض التوفير 🔥' ? 'عروض التوفير' : c);
                  }}
                  style={[
                    s.pill,
                    {
                      marginRight: 0,
                      paddingHorizontal: 15,
                      paddingVertical: 7.5,
                      borderRadius: 22,
                      backgroundColor: isSelected ? C.action : (isDark ? '#1E293B' : C.solidSurface),
                      borderColor: isSelected ? C.action : (isDark ? '#334155' : C.border),
                      shadowColor: isSelected ? C.action : '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isSelected ? 0.35 : 0.04,
                      shadowRadius: 4,
                      elevation: isSelected ? 3 : 1,
                    },
                  ]}>
                  <Txt
                    style={{
                      fontSize: 12.5,
                      fontWeight: isSelected ? '900' : '700',
                      color: isSelected ? C.actionText : (isDark ? '#E2E8F0' : C.ink),
                    }}>
                    {c}
                  </Txt>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* 2. Main Products Content */}
      <View style={{ width: '100%', maxWidth: 680, paddingTop: 8 }}>
        <View style={[s.row, { paddingHorizontal: 16, paddingVertical: 4, marginBottom: 8 }]}>
          <Txt style={{ fontFamily: 'Rubik_700Bold', fontSize: 20, fontWeight: '900', color: C.navy, textAlign: 'right' }}>
            {isOfferFilter ? 'عروض التوفير الحصرية 🔥' : filter}
          </Txt>
          <Txt style={{ fontSize: 12, color: C.muted }}>{products.length} صنف متاح</Txt>
        </View>

        {isFiltering || (!products.length && activeProducts.length === 0) ? (
          <View style={{ paddingHorizontal: 16 }}>
            <ProductListSkeleton count={5} />
          </View>
        ) : products.length > 0 ? (
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            {products.map((p: Product) => (
              <ProductListCard
                key={p.id}
                product={p}
                inCartQty={getInCartQty(p.id)}
                onPress={() => onProduct(p)}
                onAdd={() => onAdd?.(p)}
              />
            ))}
          </View>
        ) : (
          <View style={[s.card, { margin: 20, alignItems: 'center', padding: 30 }]}>
            <Txt style={{ fontFamily: 'Rubik_700Bold', fontSize: 18, fontWeight: '900', color: C.navy, textAlign: 'center' }}>
              لا توجد منتجات مطابقة للبحث
            </Txt>
            <Txt style={{ fontSize: 12, color: C.muted, marginTop: 6, textAlign: 'center' }}>
              جرّب البحث باسم صنف آخر أو اختر قسماً مختلفاً من الأعلى
            </Txt>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
