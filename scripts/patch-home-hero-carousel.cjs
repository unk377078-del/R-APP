const fs = require('fs');
const path = require('path');

const homePath = path.join(__dirname, '../src/HomeScreen.tsx');
let code = fs.readFileSync(homePath, 'utf8');

const heroCarouselStart = "function HeroCarousel({banners,onOpen}:{banners:any[];onOpen:()=>void}){";
const heroCarouselEnd = "const headerAction:any={width:38,height:38,borderRadius:19,backgroundColor:'rgba(255,255,255,0.13)',borderWidth:1,borderColor:'rgba(255,255,255,0.28)',alignItems:'center',justifyContent:'center'};";

const newHeroCarousel = `function HeroCarousel({ banners, onOpen }: { banners: any[]; onOpen: () => void }) {
  const { width: windowWidth } = useWindowDimensions();
  const initialWidth = Math.max(300, Math.min(windowWidth - 32, 640));
  const [width, setWidth] = useState(initialWidth);
  const bannerHeight = Math.max(180, Math.round(width * 768 / 1376));

  const fallback = [
    { id: 'b1', title: 'دواجن طازجة يومياً', subtitle: 'ذبح وتجهيز فوري بأعلى معايير النظافة والجودة', image: 'hero-chicken', imageUri: 'https://iili.io/n8fb3sp.jpg' },
    { id: 'b2', title: 'أشهى التتبيلات والشيش', subtitle: 'جاهزة للطهي والشواء بتتبيلة الرشيدي الخاصة', image: 'hero-marinated', imageUri: 'https://iili.io/n8fbTX4.jpg' },
  ];

  const slides = useMemo(() => {
    const list = (banners && banners.length ? banners : fallback).filter((b: any) => b.active !== false && b.isActive !== false);
    return list.length ? list : fallback;
  }, [banners]);

  const [activeSlide, setActiveSlide] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<any>(null);
  const activeSlideRef = useRef(0);
  activeSlideRef.current = activeSlide;

  // Safe programmatic scroll helper that works seamlessly on Native and Web
  const scrollToSlide = (index: number, animated = true) => {
    if (!width || index < 0 || index >= slides.length) return;
    const targetX = width * index;
    if (scrollRef.current) {
      if (typeof scrollRef.current.scrollTo === 'function') {
        scrollRef.current.scrollTo({ x: targetX, animated });
      }
      const node = scrollRef.current.getScrollableNode?.() || scrollRef.current;
      if (node && typeof node.scrollTo === 'function') {
        try {
          node.scrollTo({ left: targetX, behavior: animated ? 'smooth' : 'auto' });
        } catch {}
      }
    }
    setActiveSlide(index);
  };

  // Continuous rock-solid auto-scroll: cycles every 6 seconds without freezing
  useEffect(() => {
    if (slides.length < 2 || !width) return;

    const interval = setInterval(() => {
      const nextIndex = (activeSlideRef.current + 1) % slides.length;
      scrollToSlide(nextIndex, true);
    }, 6000);

    return () => clearInterval(interval);
  }, [width, slides.length]);

  const onScrollHandler = (event: any) => {
    if (!width || slides.length < 2) return;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.min(Math.max(0, Math.round(offset / width)), slides.length - 1);
    if (index !== activeSlide) {
      setActiveSlide(index);
    }
  };

  return (
    <View
      onLayout={(event) => {
        const layoutWidth = event.nativeEvent.layout.width;
        if (layoutWidth > 0 && Math.abs(layoutWidth - width) > 2) {
          setWidth(layoutWidth);
        }
      }}
      style={{
        alignSelf: 'stretch',
        height: bannerHeight,
        marginHorizontal: 16,
        marginTop: 14,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: C.navy,
        borderWidth: 1.5,
        borderColor: 'rgba(232, 173, 35, 0.4)',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      }}>
      <ScrollView
        ref={scrollRef}
        style={{ width: '100%', height: '100%' }}
        horizontal
        pagingEnabled
        snapToInterval={width || initialWidth}
        decelerationRate="fast"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={32}
        onMomentumScrollEnd={onScrollHandler}
        onScroll={onScrollHandler}>
        {slides.map((banner: any, index: number) => {
          const imageKey = String(banner.id || index);
          const hasValidUri =
            typeof banner.imageUri === 'string' &&
            banner.imageUri.trim().length > 10 &&
            (banner.imageUri.startsWith('http') || banner.imageUri.startsWith('data:image/')) &&
            !failedImages[imageKey];

          const imageSource = hasValidUri
            ? { uri: banner.imageUri }
            : images[banner.image || 'hero-chicken'] || images['hero-chicken'];

          return (
            <Pressable
              key={\`\${imageKey}-\${index}\`}
              accessibilityRole="button"
              accessibilityLabel={banner.title || 'فتح قائمة العروض'}
              onPress={onOpen}
              style={{
                width: width || initialWidth,
                height: bannerHeight,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: C.navy,
              }}>
              {/* Blur backdrop for depth */}
              <FastImage
                source={imageSource}
                onError={() => setFailedImages((current) => ({ ...current, [imageKey]: true }))}
                resizeMode="cover"
                style={[StyleSheet.absoluteFill, { opacity: 0.45, transform: [{ scale: 1.08 }] }]}
              />
              <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFill} />

              {/* Main Banner Image */}
              <FastImage
                source={imageSource}
                onError={() => setFailedImages((current) => ({ ...current, [imageKey]: true }))}
                resizeMode="cover"
                style={{ width: '100%', height: '100%' }}
              />

              {/* Top Banner Tag / Badge */}
              <View
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 14,
                  backgroundColor: 'rgba(214, 40, 50, 0.92)',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.35)',
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  gap: 4,
                }}>
                <Ionicons name="sparkles" size={11} color="#FFD700" />
                <Txt style={{ color: C.white, fontSize: 10.5, fontWeight: '900' }}>
                  {index % 2 === 0 ? 'عرض خاص' : 'طازج يومياً'}
                </Txt>
              </View>

              {/* Enhanced Banner Title & Subtitle Card */}
              {(banner.title || banner.subtitle) && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    left: 12,
                    backgroundColor: 'rgba(11, 23, 44, 0.9)',
                    borderRadius: 18,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderWidth: 1.2,
                    borderColor: 'rgba(244, 201, 92, 0.5)',
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.35,
                    shadowRadius: 5,
                  }}>
                  {/* Right side: Titles */}
                  <View style={{ flex: 1, alignItems: 'flex-end', marginStart: 8 }}>
                    {!!banner.title && (
                      <Txt
                        numberOfLines={1}
                        style={{
                          color: C.white,
                          fontFamily: 'Rubik_700Bold',
                          fontWeight: '900',
                          fontSize: 16,
                          textAlign: 'right',
                        }}>
                        {banner.title}
                      </Txt>
                    )}
                    {!!banner.subtitle && (
                      <Txt
                        numberOfLines={1}
                        style={{
                          color: '#FDE047',
                          fontSize: 11.5,
                          fontWeight: '700',
                          textAlign: 'right',
                          marginTop: 2,
                        }}>
                        {banner.subtitle}
                      </Txt>
                    )}
                  </View>

                  {/* Left side: Action Button */}
                  <View
                    style={{
                      backgroundColor: C.action,
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      flexDirection: 'row-reverse',
                      alignItems: 'center',
                      gap: 4,
                      elevation: 2,
                    }}>
                    <Txt style={{ color: C.actionText, fontWeight: '900', fontSize: 11 }}>اطلب الآن</Txt>
                    <Ionicons name="arrow-back" size={12} color={C.actionText} />
                  </View>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Pagination Dots at bottom center of the banner */}
      {slides.length > 1 && (
        <View
          style={{
            position: 'absolute',
            bottom: 66,
            alignSelf: 'center',
            flexDirection: 'row',
            gap: 5,
            backgroundColor: 'rgba(5, 14, 28, 0.65)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.2)',
          }}>
          {slides.map((_: any, index: number) => (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={\`الانتقال للشريحة \${index + 1}\`}
              onPress={() => scrollToSlide(index, true)}>
              <View
                style={{
                  width: index === activeSlide ? 18 : 6,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: index === activeSlide ? C.gold : 'rgba(255, 255, 255, 0.45)',
                }}
              />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

`;

const startIdx = code.indexOf(heroCarouselStart);
const endIdx = code.indexOf(heroCarouselEnd);

if (startIdx !== -1 && endIdx !== -1) {
  code = code.slice(0, startIdx) + newHeroCarousel + code.slice(endIdx);
  fs.writeFileSync(homePath, code, 'utf8');
  console.log('✅ HomeScreen HeroCarousel successfully updated!');
} else {
  console.error('Could not find start or end index for HeroCarousel');
  process.exit(1);
}
