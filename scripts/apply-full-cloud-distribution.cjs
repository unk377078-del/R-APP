const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/DashboardScreen.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Replace the old MediaLibraryTab with the enhanced DistributeMediaModal, CloudMediaPickerModal, and new MediaLibraryTab
const oldMediaTabStart = "function MediaLibraryTab({ notify }: { notify: (msg: string) => void }) {";
const oldMediaTabEnd = "export function DashboardScreen({state,setState,notify,onClose,firebaseStatus='offline',initialTab='الملخص'";

const newComponentsCode = `function DistributeMediaModal({
  item,
  visible,
  onClose,
  state,
  setState,
  notify,
  onProductChange,
  onBannersChange,
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
  onCategoryImagesChange?: (images: Record<string, string>) => void;
  onBranchImagesChange?: (images: Record<string, string>) => void;
}) {
  const [distributeTab, setDistributeTab] = useState<'banner' | 'category' | 'branch' | 'product'>('banner');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    if (item) {
      setBannerTitle(item.name || 'عرض حصري');
      setBannerSubtitle('طازج يومياً بأعلى جودة');
      setProductSearch('');
    }
  }, [item]);

  if (!item) return null;

  const handleSetBanner = () => {
    const newBanner: Banner = {
      id: \`b\${Date.now()}\`,
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
    notify(\`🌟 تمت إضافة «\${newBanner.title}» إلى بانرات الواجهة بنجاح\`);
    onClose();
  };

  const handleSetCategory = (catName: string) => {
    const nextCategories = { ...(state.categoryImages || {}), [catName]: item.url };
    setState((curr: AppState) => ({ ...curr, categoryImages: nextCategories }));
    onCategoryImagesChange?.(nextCategories);
    notify(\`📁 تم تعيين الصورة لقسم «\${catName}» في الرئيسية\`);
    onClose();
  };

  const handleSetBranch = (branchName: string) => {
    const nextBranches = { ...(state.branchImages || {}), [branchName]: item.url };
    setState((curr: AppState) => ({ ...curr, branchImages: nextBranches }));
    onBranchImagesChange?.(nextBranches);
    notify(\`🏬 تم تعيين الصورة لـ «\${branchName}»\`);
    onClose();
  };

  const handleSetProduct = (product: Product) => {
    const updated = { ...product, imageUri: item.url };
    setState((curr: AppState) => ({
      ...curr,
      products: curr.products.map((p: Product) => (p.id === product.id ? updated : p)),
    }));
    onProductChange?.(updated);
    notify(\`🍗 تم تعيين الصورة لمنتج «\${product.name}»\`);
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
                          source={prod.imageUri ? { uri: prod.imageUri } : images[prod.image] || images.chicken}
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
      (filterType === 'فروع' && item.type === 'branch');
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
            {['الكل', 'منتجات', 'بانرات', 'فروع'].map((t) => (
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
  onCategoryImagesChange,
  onBranchImagesChange,
}: {
  notify: (msg: string) => void;
  state?: AppState;
  setState?: any;
  onProductChange?: (product: Product) => void;
  onBannersChange?: (banners: Banner[]) => void;
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
      setNewImageName('');
      setNewImageUrl('');
      await loadMedia();
    } catch (err: any) {
      Alert.alert('تعذر الإضافة', err?.message);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('حذف من المكتبة', \`هل تريد إزالة صورة «\${name}» من المكتبة السحابية؟\`, [
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
      (filterType === 'فروع' && item.type === 'branch');
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
          {['الكل', 'منتجات', 'بانرات', 'فروع'].map((t) => (
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
          onCategoryImagesChange={onCategoryImagesChange}
          onBranchImagesChange={onBranchImagesChange}
        />
      )}
    </>
  );
}

`;

const startIdx = code.indexOf(oldMediaTabStart);
const endIdx = code.indexOf(oldMediaTabEnd);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find start or end index for MediaLibraryTab replacement");
  console.log("startIdx:", startIdx, "endIdx:", endIdx);
  process.exit(1);
}

code = code.slice(0, startIdx) + newComponentsCode + code.slice(endIdx);

// Now in DashboardScreen:
// 1. Add cloudPickerConfig state right after const [tab,setTab]=useState(initialTab||'الملخص');
const targetAfterTab = "const [tab,setTab]=useState(initialTab||'الملخص');";
const cloudPickerStateCode = `const [tab,setTab]=useState(initialTab||'الملخص');
  const [cloudPickerConfig, setCloudPickerConfig] = useState<{ visible: boolean; title: string; onSelect: (url: string) => void }>({ visible: false, title: '', onSelect: () => {} });
  const openCloudPicker = (title: string, onSelect: (url: string) => void) => { setCloudPickerConfig({ visible: true, title, onSelect }); };`;

code = code.replace(targetAfterTab, cloudPickerStateCode);

// 2. Update MediaLibraryTab call
code = code.replace(
  "{tab==='مكتبة الصور'&&<MediaLibraryTab notify={notify}/>}",
  "{(tab==='مكتبة السحابة ☁️'||tab==='مكتبة الصور')&&<MediaLibraryTab notify={notify} state={state} setState={setState} onProductChange={onProductChange} onBannersChange={onBannersChange} onCategoryImagesChange={onCategoryImagesChange} onBranchImagesChange={onBranchImagesChange}/>}"
);

// 3. Add cloud pick button when adding product
code = code.replace(
  "<Field label=\"رابط صورة المنتج (URL) - اختياري\" value={newProductImageUri} onChangeText={setNewProductImageUri} placeholder=\"https://.../chicken.jpg\"/>",
  "<Button title=\"☁️ اختيار من مكتبة السحابة\" secondary onPress={()=>openCloudPicker('اختيار صورة للمنتج الجديد', setNewProductImageUri)} style={{marginBottom:8}}/><Field label=\"رابط صورة المنتج (URL) - اختياري\" value={newProductImageUri} onChangeText={setNewProductImageUri} placeholder=\"https://.../chicken.jpg\"/>"
);

// 4. Update ProductAdmin invocation to pass onPickCloud
code = code.replace(
  "badges={state.badges||[]} product={p}",
  "badges={state.badges||[]} product={p} onPickCloud={(onSelect: (url: string) => void) => openCloudPicker('اختيار صورة للمنتج من السحابة', onSelect)}"
);

// 5. Update ProductAdmin definition and add cloud button
code = code.replace(
  "function ProductAdmin({product,onChange,onDelete,badges=[]}:any){",
  "function ProductAdmin({product,onChange,onDelete,badges=[],onPickCloud}:any){"
);

code = code.replace(
  "<Field label=\"أو رابط مباشر لصورة المنتج (URL)\" value={imageUri} onChangeText={setImageUri} placeholder=\"https://.../product.jpg\"/>",
  "<Button title=\"☁️ اختيار من مكتبة السحابة\" secondary onPress={()=>onPickCloud?.(setImageUri)} style={{marginBottom:8}}/><Field label=\"أو رابط مباشر لصورة المنتج (URL)\" value={imageUri} onChangeText={setImageUri} placeholder=\"https://.../product.jpg\"/>"
);

// 6. Add cloud pick button when adding banner
code = code.replace(
  "<Field label=\"أو رابط مباشر لصورة البانر (URL)\" value={bannerImageUri} onChangeText={setBannerImageUri} placeholder=\"https://.../banner.jpg\"/>",
  "<Button title=\"☁️ اختيار من مكتبة السحابة\" secondary onPress={()=>openCloudPicker('اختيار صورة للبانر الجديد', setBannerImageUri)} style={{marginBottom:8}}/><Field label=\"أو رابط مباشر لصورة البانر (URL)\" value={bannerImageUri} onChangeText={setBannerImageUri} placeholder=\"https://.../banner.jpg\"/>"
);

// 7. Update BannerAdminRow invocation and definition
code = code.replace(
  "banner={b} onUpdate={(updated:Banner)=>",
  "banner={b} onPickCloud={(onSelect: (url: string) => void) => openCloudPicker('اختيار صورة للبانر من السحابة', onSelect)} onUpdate={(updated:Banner)=>"
);

code = code.replace(
  "function BannerAdminRow({banner,onUpdate,onDelete}:any){",
  "function BannerAdminRow({banner,onUpdate,onDelete,onPickCloud}:any){"
);

code = code.replace(
  "<Field label=\"رابط مباشر لصورة البانر (URL)\" value={imageUri} onChangeText={setImageUri} placeholder=\"https://.../banner.jpg\"/>",
  "<Button title=\"☁️ اختيار من مكتبة السحابة\" secondary onPress={()=>onPickCloud?.(setImageUri)} style={{marginBottom:8}}/><Field label=\"رابط مباشر لصورة البانر (URL)\" value={imageUri} onChangeText={setImageUri} placeholder=\"https://.../banner.jpg\"/>"
);

// 8. Add cloud button for categories
code = code.replace(
  "<Button title=\"⚡ رفع صورة للقسم للسحابة فوراً\"",
  "<Button title=\"☁️ اختيار من مكتبة السحابة\" secondary onPress={()=>openCloudPicker(`اختيار صورة لقسم ${categoryName}`, (url: string)=>{const next={...(state.categoryImages||{}),[categoryName]:url};setState((curr:any)=>({...curr,categoryImages:next}));onCategoryImagesChange?.(next);notify(`تم تحديث صورة قسم ${categoryName}`);})} style={{marginBottom:8}}/><Button title=\"⚡ رفع صورة للقسم للسحابة فوراً\""
);

// 9. Add cloud button for branches
code = code.replace(
  "<Button title=\"⚡ رفع صورة الفرع للسحابة فوراً\"",
  "<Button title=\"☁️ اختيار من مكتبة السحابة\" secondary onPress={()=>openCloudPicker(`اختيار صورة لـ ${branch.name}`, (url: string)=>{const next={...(state.branchImages||{}),[branch.name]:url};setState((curr:any)=>({...curr,branchImages:next}));onBranchImagesChange?.(next);notify(`تم تحديث صورة ${branch.name}`);})} style={{marginBottom:8}}/><Button title=\"⚡ رفع صورة الفرع للسحابة فوراً\""
);

// 10. Render CloudMediaPickerModal at the end of DashboardScreen
const endOfDashboardScreen = "</ScrollView></View>}";
const endWithModal = `</ScrollView><CloudMediaPickerModal visible={cloudPickerConfig.visible} title={cloudPickerConfig.title} onSelect={cloudPickerConfig.onSelect} onClose={() => setCloudPickerConfig(prev => ({ ...prev, visible: false }))} /></View>}`;

code = code.replace(endOfDashboardScreen, endWithModal);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully applied full cloud media distribution to DashboardScreen!');
