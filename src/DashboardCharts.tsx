import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polyline, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { CartLine, isOrderPending, Order, Product } from './models';
import { C, s } from './theme';
import { Chip, ScreenTitle, Txt } from './ui';

const money = (n: number) => `${Math.round(n).toLocaleString('ar-EG')} ج.م`;
const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

type TimeRange = '7d' | '30d' | 'all';
type ChartTypeFilter = 'all' | 'line' | 'pie' | 'scatter' | 'bar';

interface ChartProps {
  orders: Order[];
  products: Product[];
  onTabChange?: (tab: string) => void;
}

function isOrderCompleted(order: Order): boolean {
  return /تم التسليم|مكتمل/.test(order.status);
}

// Sample demo orders for preview when store has no live orders yet
const sampleDemoOrders: Order[] = [
  { id: 'R101', total: 640, subtotal: 640, discount: 0, status: 'تم التسليم', createdAt: Date.now() - 6 * 86400000, customer: 'محمد علي', phone: '01221111111', items: [{ id: '1', productId: 'p1', name: 'فراخ بيضاء بلدي', price: 180, unit: 'للكيلو', emoji: '🍗', quantity: 2, size: 'عادي', options: [], note: '' }, { id: '2', productId: 'p2', name: 'بانيه طازج فاخر', price: 280, unit: 'للكيلو', emoji: '🍢', quantity: 1, size: 'عادي', options: [], note: '' }], address: 'فرع كامب شيزار', payment: 'CASH', schedule: 'فوري', note: '' },
  { id: 'R102', total: 950, subtotal: 950, discount: 50, status: 'تم التسليم', createdAt: Date.now() - 5 * 86400000, customer: 'أحمد إبراهيم', phone: '01222222222', items: [{ id: '3', productId: 'p3', name: 'شيش طاووق متبل', price: 290, unit: 'للكيلو', emoji: '🍢', quantity: 2, size: 'عادي', options: [], note: '' }, { id: '4', productId: 'p4', name: 'بط بلدي فلاحي', price: 370, unit: 'للكيلو', emoji: '🦆', quantity: 1, size: 'عادي', options: [], note: '' }], address: 'سموحة · شارع فوزي معاذ', payment: 'InstaPay', schedule: 'مسائي', note: '' },
  { id: 'R103', total: 420, subtotal: 420, discount: 0, status: 'تم التسليم', createdAt: Date.now() - 4 * 86400000, customer: 'محمود حسن', phone: '01223333333', items: [{ id: '5', productId: 'p5', name: 'دبابيس فراخ طازجة', price: 210, unit: 'للكيلو', emoji: '🍗', quantity: 2, size: 'عادي', options: [], note: '' }], address: 'فرع سموحة', payment: 'CASH', schedule: 'صباحي', note: '' },
  { id: 'R104', total: 1120, subtotal: 1120, discount: 0, status: 'تم التسليم', createdAt: Date.now() - 3 * 86400000, customer: 'كريم عادل', phone: '01224444444', items: [{ id: '6', productId: 'p1', name: 'فراخ بيضاء بلدي', price: 180, unit: 'للكيلو', emoji: '🍗', quantity: 3, size: 'عادي', options: [], note: '' }, { id: '7', productId: 'p2', name: 'بانيه طازج فاخر', price: 280, unit: 'للكيلو', emoji: '🍢', quantity: 2, size: 'عادي', options: [], note: '' }], address: 'جناكليس · طريق الحرية', payment: 'CASH', schedule: 'فوري', note: '' },
  { id: 'R105', total: 780, subtotal: 780, discount: 30, status: 'تم التسليم', createdAt: Date.now() - 2 * 86400000, customer: 'سارة يوسف', phone: '01225555555', items: [{ id: '8', productId: 'p6', name: 'حمام بلدي مزارع', price: 260, unit: 'للجوز', emoji: '🐦', quantity: 3, size: 'عادي', options: [], note: '' }], address: 'فرع بحري', payment: 'InstaPay', schedule: 'مسائي', note: '' },
  { id: 'R106', total: 1350, subtotal: 1350, discount: 0, status: 'تم التسليم', createdAt: Date.now() - 1 * 86400000, customer: 'طارق مصطفى', phone: '01226666666', items: [{ id: '9', productId: 'p2', name: 'بانيه طازج فاخر', price: 280, unit: 'للكيلو', emoji: '🍢', quantity: 3, size: 'عادي', options: [], note: '' }, { id: '10', productId: 'p3', name: 'شيش طاووق متبل', price: 290, unit: 'للكيلو', emoji: '🍢', quantity: 1.5, size: 'عادي', options: [], note: '' }, { id: '11', productId: 'p5', name: 'دبابيس فراخ طازجة', price: 210, unit: 'للكيلو', emoji: '🍗', quantity: 1, size: 'عادي', options: [], note: '' }], address: 'لوران · شارع الإقبال', payment: 'CARD', schedule: 'فوري', note: '' },
  { id: 'R107', total: 890, subtotal: 890, discount: 40, status: 'تم التسليم', createdAt: Date.now() - 2 * 3600000, customer: 'ياسين فتحي', phone: '01227777777', items: [{ id: '12', productId: 'p1', name: 'فراخ بيضاء بلدي', price: 180, unit: 'للكيلو', emoji: '🍗', quantity: 2, size: 'عادي', options: [], note: '' }, { id: '13', productId: 'p4', name: 'بط بلدي فلاحي', price: 370, unit: 'للكيلو', emoji: '🦆', quantity: 1, size: 'عادي', options: [], note: '' }], address: 'فرع كامب شيزار', payment: 'CASH', schedule: 'فوري', note: '' },
  { id: 'R108', total: 520, subtotal: 520, discount: 0, status: 'جاري التجهيز', createdAt: Date.now() - 1800000, customer: 'عمر خالد', phone: '01228888888', items: [{ id: '14', productId: 'p3', name: 'شيش طاووق متبل', price: 260, unit: 'للكيلو', emoji: '🍢', quantity: 2, size: 'عادي', options: [], note: '' }], address: 'سيدي بشر · بحري', payment: 'InstaPay', schedule: 'فوري', note: '' },
  { id: 'R109', total: 340, subtotal: 340, discount: 0, status: 'خرج للتوصيل', createdAt: Date.now() - 3600000, customer: 'هشام سعيد', phone: '01229999999', items: [{ id: '15', productId: 'p5', name: 'أجنحة دجاج طازجة', price: 170, unit: 'للكيلو', emoji: '🍗', quantity: 2, size: 'عادي', options: [], note: '' }], address: 'فرع سموحة', payment: 'CASH', schedule: 'فوري', note: '' },
];

export function DashboardChartsTab({ orders, products }: ChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [chartTypeFilter, setChartTypeFilter] = useState<ChartTypeFilter>('all');
  const [useDemoIfEmpty, setUseDemoIfEmpty] = useState(true);
  const [sortTopBy, setSortTopBy] = useState<'qty' | 'revenue'>('revenue');

  // Chart-specific view modes
  const [lineDays, setLineDays] = useState<7 | 14 | 30>(7);
  const [lineMetric, setLineMetric] = useState<'revenue' | 'orders'>('revenue');
  const [pieMode, setPieMode] = useState<'category' | 'branch'>('category');
  const [scatterMode, setScatterMode] = useState<'time' | 'basket'>('time');

  const hasLiveOrders = orders.length > 0;
  const activeOrders = useMemo(() => {
    if (!hasLiveOrders && useDemoIfEmpty) return sampleDemoOrders;
    return orders;
  }, [orders, hasLiveOrders, useDemoIfEmpty]);

  // Filter orders by selected time range
  const { filteredOrders, previousPeriodOrders } = useMemo(() => {
    const now = Date.now();
    const dayMs = 86400000;

    if (timeRange === '7d') {
      const periodMs = 7 * dayMs;
      const current = activeOrders.filter((o) => o.createdAt >= now - periodMs);
      const previous = activeOrders.filter((o) => o.createdAt >= now - 2 * periodMs && o.createdAt < now - periodMs);
      return { filteredOrders: current, previousPeriodOrders: previous };
    }
    if (timeRange === '30d') {
      const periodMs = 30 * dayMs;
      const current = activeOrders.filter((o) => o.createdAt >= now - periodMs);
      const previous = activeOrders.filter((o) => o.createdAt >= now - 2 * periodMs && o.createdAt < now - periodMs);
      return { filteredOrders: current, previousPeriodOrders: previous };
    }
    return { filteredOrders: activeOrders, previousPeriodOrders: [] };
  }, [activeOrders, timeRange]);

  // Delivered orders for sales calculations
  const delivered = useMemo(() => filteredOrders.filter(isOrderCompleted), [filteredOrders]);
  const prevDelivered = useMemo(() => previousPeriodOrders.filter(isOrderCompleted), [previousPeriodOrders]);

  const totalRevenue = useMemo(() => delivered.reduce((sum, o) => sum + o.total, 0), [delivered]);
  const prevRevenue = useMemo(() => prevDelivered.reduce((sum, o) => sum + o.total, 0), [prevDelivered]);

  // Growth comparison calculation
  const revenueGrowth = useMemo(() => {
    if (prevRevenue === 0) return totalRevenue > 0 ? 100 : 0;
    return Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);
  }, [totalRevenue, prevRevenue]);

  const avgOrderValue = delivered.length > 0 ? Math.round(totalRevenue / delivered.length) : 0;
  const completionRate = filteredOrders.length > 0 ? Math.round((delivered.length / filteredOrders.length) * 100) : 0;

  // 1. Continuous Line Chart Calculation (7, 14, or 30 days)
  const lineStats = useMemo(() => {
    const days = lineDays;
    const result: { label: string; dateStr: string; revenue: number; orderCount: number; isToday: boolean }[] = [];
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    for (let i = days - 1; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 86400000);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0).getTime();
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59).getTime();

      const dayOrders = delivered.filter((o) => o.createdAt >= startOfDay && o.createdAt <= endOfDay);
      const dayRev = dayOrders.reduce((sum, o) => sum + o.total, 0);

      result.push({
        label: i === 0 ? 'اليوم' : i === 1 ? 'أمس' : days <= 7 ? dayNames[targetDate.getDay()] : `${targetDate.getDate()}/${targetDate.getMonth() + 1}`,
        dateStr: `${targetDate.getDate()}/${targetDate.getMonth() + 1}`,
        revenue: dayRev,
        orderCount: dayOrders.length,
        isToday: i === 0,
      });
    }
    return result;
  }, [delivered, lineDays]);

  const lineMaxVal = useMemo(() => {
    if (lineMetric === 'revenue') {
      return Math.max(...lineStats.map((d) => d.revenue), 100);
    }
    return Math.max(...lineStats.map((d) => d.orderCount), 4);
  }, [lineStats, lineMetric]);

  const linePathData = useMemo(() => {
    const W = 320;
    const H = 145;
    const padX = 26;
    const padY = 22;
    const uW = W - 2 * padX;
    const uH = H - 2 * padY;

    const points = lineStats.map((d, i) => {
      const val = lineMetric === 'revenue' ? d.revenue : d.orderCount;
      const x = padX + (i * uW) / Math.max(lineStats.length - 1, 1);
      const y = H - padY - (val / (lineMaxVal || 1)) * uH;
      return { x, y, val, d };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${H - padY} L ${points[0].x.toFixed(1)} ${H - padY} Z`;

    const maxPoint = points.reduce((best, cur) => (cur.val > best.val ? cur : best), points[0] || { x: 0, y: 0, val: 0 });

    return { points, linePath, areaPath, W, H, padX, padY, maxPoint };
  }, [lineStats, lineMetric, lineMaxVal]);

  // 2. Category & Branch Breakdown for Pie Chart
  const branchBreakdown = useMemo(() => {
    const branches = [
      { key: 'camp', name: 'فرع كامب شيزار', color: C.navy, revenue: 0, count: 0 },
      { key: 'smouha', name: 'فرع سموحة', color: C.action, revenue: 0, count: 0 },
      { key: 'bahary', name: 'فرع بحري', color: '#D97706', revenue: 0, count: 0 },
      { key: 'delivery', name: 'توصيل للمنزل 🛵', color: C.green, revenue: 0, count: 0 },
    ];

    delivered.forEach((order) => {
      const addr = order.address || '';
      let matched = false;
      if (addr.includes('كامب شيزار') && (addr.includes('فرع') || !addr.includes('·'))) {
        branches[0].revenue += order.total;
        branches[0].count += 1;
        matched = true;
      } else if (addr.includes('سموحة') && (addr.includes('فرع') || !addr.includes('·'))) {
        branches[1].revenue += order.total;
        branches[1].count += 1;
        matched = true;
      } else if (addr.includes('بحري') && (addr.includes('فرع') || !addr.includes('·'))) {
        branches[2].revenue += order.total;
        branches[2].count += 1;
        matched = true;
      }

      if (!matched) {
        branches[3].revenue += order.total;
        branches[3].count += 1;
      }
    });

    const total = branches.reduce((sum, b) => sum + b.revenue, 0) || 1;
    return branches.map((b) => ({ ...b, sharePercent: Math.round((b.revenue / total) * 100) }));
  }, [delivered]);

  const pieData = useMemo(() => {
    const r = 70;
    const circ = 2 * Math.PI * r;

    if (pieMode === 'branch') {
      const total = branchBreakdown.reduce((s, b) => s + b.revenue, 0) || 1;
      let acc = 0;
      const slices = branchBreakdown.map((b) => {
        const pct = b.revenue / total;
        const dash = pct * circ;
        const offset = acc;
        acc += dash;
        return {
          label: b.name,
          value: b.revenue,
          count: b.count,
          color: b.color,
          percent: b.sharePercent,
          dash,
          offset,
        };
      });
      return { slices, total, circ, r };
    }

    // Category mode
    const catMap = new Map<string, { label: string; value: number; color: string; count: number }>();
    const colors = ['#174A9C', '#237A57', '#E8AD23', '#8B5CF6', '#EC4899', '#06B6D4'];

    const getCat = (name: string) => {
      if (name.includes('بانيه') || name.includes('متبل') || name.includes('شيش') || name.includes('ستربس') || name.includes('كفتة') || name.includes('برجر')) {
        return 'بانيه ومتبلات';
      }
      if (name.includes('بط')) return 'بط فلاحي';
      if (name.includes('حمام') || name.includes('سمان')) return 'حمام وسمان';
      if (name.includes('دبابيس') || name.includes('أجنحة') || name.includes('وراك') || name.includes('كبدة')) {
        return 'أجزاء وتقطيعات';
      }
      if (name.includes('رومي') || name.includes('أرانب')) return 'رومي وأرانب';
      return 'فراخ بيضاء وبلدي';
    };

    delivered.forEach((order) => {
      order.items.forEach((item) => {
        const cat = getCat(item.name);
        const existing = catMap.get(cat) || { label: cat, value: 0, color: '#174A9C', count: 0 };
        existing.value += item.price * item.quantity;
        existing.count += 1;
        catMap.set(cat, existing);
      });
    });

    const list = Array.from(catMap.values());
    list.sort((a, b) => b.value - a.value);
    list.forEach((item, idx) => {
      item.color = colors[idx % colors.length];
    });

    const total = list.reduce((s, x) => s + x.value, 0) || 1;
    let acc = 0;
    const slices = list.map((item) => {
      const pct = item.value / total;
      const dash = pct * circ;
      const offset = acc;
      acc += dash;
      return {
        ...item,
        percent: Math.round(pct * 100),
        dash,
        offset,
      };
    });

    return { slices, total, circ, r };
  }, [delivered, branchBreakdown, pieMode]);

  // 3. Scatter Plot Data Calculation
  const scatterData = useMemo(() => {
    const W = 320;
    const H = 165;
    const padX = 35;
    const padY = 24;
    const uW = W - 2 * padX;
    const uH = H - 2 * padY;

    const maxTotal = Math.max(...activeOrders.map((o) => o.total), 900);
    const maxItems = Math.max(...activeOrders.map((o) => o.items?.length || 1), 6);

    const minHour = 9;
    const maxHour = 23;

    const points = activeOrders.map((order) => {
      const d = new Date(order.createdAt || Date.now());
      const hourFloat = Math.min(Math.max(d.getHours() + d.getMinutes() / 60, minHour), maxHour);
      const itemCount = (order.items || []).length;

      let x = 0;
      if (scatterMode === 'time') {
        x = padX + ((hourFloat - minHour) / (maxHour - minHour)) * uW;
      } else {
        x = padX + ((itemCount - 1) / Math.max(maxItems - 1, 1)) * uW;
      }

      const y = H - padY - (order.total / maxTotal) * uH;

      let color = '#059669'; // Delivered
      if (order.status === 'جاري التجهيز') color = '#1E3A8A';
      else if (order.status === 'خرج للتوصيل') color = '#4F46E5';
      else if (isOrderPending(order.status)) color = '#D97706';
      else if (order.status === 'ملغي') color = '#DC2626';

      const radius = 4 + Math.min(itemCount * 1.2, 5);

      return {
        x: Math.round(x),
        y: Math.round(y),
        color,
        radius,
        order,
        hourStr: `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`,
      };
    });

    const avgY = H - padY - (avgOrderValue / (maxTotal || 1)) * uH;

    return { points, W, H, padX, padY, maxTotal, avgY };
  }, [activeOrders, scatterMode, avgOrderValue]);

  // 4. Daily Bar Stats for Bar comparison
  const dailyBarStats = useMemo(() => {
    const days = 7;
    const result: { label: string; dateStr: string; revenue: number; orderCount: number; isToday: boolean }[] = [];
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    for (let i = days - 1; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 86400000);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0).getTime();
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59).getTime();

      const dayOrders = delivered.filter((o) => o.createdAt >= startOfDay && o.createdAt <= endOfDay);
      const dayRev = dayOrders.reduce((sum, o) => sum + o.total, 0);

      result.push({
        label: i === 0 ? 'اليوم' : i === 1 ? 'أمس' : dayNames[targetDate.getDay()],
        dateStr: `${targetDate.getDate()}/${targetDate.getMonth() + 1}`,
        revenue: dayRev,
        orderCount: dayOrders.length,
        isToday: i === 0,
      });
    }
    return result;
  }, [delivered]);

  const maxDailyRevenue = Math.max(...dailyBarStats.map((d) => d.revenue), 100);

  // Best-selling products breakdown
  const topProducts = useMemo(() => {
    const productMap = new Map<string, { name: string; quantity: number; revenue: number; unit: string; ordersCount: number }>();

    delivered.forEach((order) => {
      order.items.forEach((item: CartLine) => {
        const key = item.name.trim();
        const existing = productMap.get(key) || { name: key, quantity: 0, revenue: 0, unit: item.unit || 'للكيلو', ordersCount: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
        existing.ordersCount += 1;
        productMap.set(key, existing);
      });
    });

    const list = Array.from(productMap.values());
    if (sortTopBy === 'revenue') {
      list.sort((a, b) => b.revenue - a.revenue);
    } else {
      list.sort((a, b) => b.quantity - a.quantity);
    }
    return list.slice(0, 8);
  }, [delivered, sortTopBy]);

  const topProductsMax = Math.max(...topProducts.map((p) => (sortTopBy === 'revenue' ? p.revenue : p.quantity)), 1);

  // Order status distribution
  const statusStats = useMemo(() => {
    const statuses = [
      { key: 'تم التسليم', label: 'تم التسليم', color: C.green },
      { key: 'خرج للتوصيل', label: 'خرج للتوصيل', color: C.blue },
      { key: 'جاري التجهيز', label: 'جاري التجهيز', color: C.gold },
      { key: 'قيد المراجعة والتجهيز', label: 'قيد المراجعة', color: '#D97706' },
      { key: 'ملغي', label: 'ملغي', color: C.red },
    ];

    const total = filteredOrders.length || 1;
    return statuses.map((st) => {
      const count = filteredOrders.filter((o) => o.status === st.key).length;
      return {
        ...st,
        count,
        percent: Math.round((count / total) * 100),
      };
    });
  }, [filteredOrders]);

  // Payment methods share
  const paymentStats = useMemo(() => {
    const payments = [
      { key: 'CASH', label: 'كاش عند الاستلام', color: C.green, count: 0, amount: 0 },
      { key: 'INSTAPAY', label: 'InstaPay فوري', color: '#8B5CF6', count: 0, amount: 0 },
      { key: 'CARD', label: 'بطاقة بنكية', color: C.blue, count: 0, amount: 0 },
    ];

    delivered.forEach((order) => {
      const p = String(order.payment || '').toUpperCase();
      if (p.includes('INSTAPAY')) {
        payments[1].count += 1;
        payments[1].amount += order.total;
      } else if (p.includes('CARD') || p.includes('فيزا') || p.includes('بطاقة')) {
        payments[2].count += 1;
        payments[2].amount += order.total;
      } else {
        payments[0].count += 1;
        payments[0].amount += order.total;
      }
    });

    const total = delivered.length || 1;
    return payments.map((pm) => ({ ...pm, percent: Math.round((pm.count / total) * 100) }));
  }, [delivered]);

  return (
    <View style={{ gap: 14 }}>
      <ScreenTitle
        title="الرسوم البيانية والتحليلات الشاملة"
        subtitle="تقارير دقيقة تشمل المخطط الخطي (Line)، الدائري (Pie)، التشتت (Scatter)، والأعمدة (Bar)"
      />

      {/* Demo data badge toggle when no live orders */}
      {!hasLiveOrders && (
        <View style={[s.card, s.row, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
          <Pressable
            onPress={() => setUseDemoIfEmpty((v) => !v)}
            style={{ backgroundColor: '#D97706', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
          >
            <Txt style={{ color: C.white, fontWeight: '900', fontSize: 11 }}>
              {useDemoIfEmpty ? 'إخفاء البيانات التوضيحية' : 'إظهار معاينة توضيحية'}
            </Txt>
          </Pressable>
          <View style={{ flex: 1, alignItems: 'flex-end', marginEnd: 8 }}>
            <Txt style={{ fontWeight: '900', color: '#92400E', fontSize: 13 }}>وضع المعاينة التوضيحية</Txt>
            <Txt style={[s.small, { color: '#B45309' }]}>تظهر الرسوم بأمثلة واقعية حتى وصول أول طلبات سحابية حقيقية.</Txt>
          </View>
        </View>
      )}

      {/* Time range selector */}
      <View style={[s.row, { justifyContent: 'flex-end', gap: 8 }]}>
        <Chip label="آخر ٧ أيام" selected={timeRange === '7d'} onPress={() => setTimeRange('7d')} />
        <Chip label="آخر ٣٠ يوماً" selected={timeRange === '30d'} onPress={() => setTimeRange('30d')} />
        <Chip label="كل الفترات" selected={timeRange === 'all'} onPress={() => setTimeRange('all')} />
      </View>

      {/* Chart Type Filter Chips (Line, Pie, Scatter, Bar, All) */}
      <View style={{ marginBottom: 2 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, justifyContent: 'flex-end' }}>
          {[
            { key: 'all', label: '📊 جميع التقارير' },
            { key: 'line', label: '📈 منحنى خطي (Line)' },
            { key: 'pie', label: '🥧 رسم دائري (Pie)' },
            { key: 'scatter', label: '🎯 مخطط التشتت (Scatter)' },
            { key: 'bar', label: '📊 مقارنة الأعمدة (Bar)' },
          ].map((ct) => (
            <Chip
              key={ct.key}
              label={ct.label}
              selected={chartTypeFilter === ct.key}
              onPress={() => setChartTypeFilter(ct.key as ChartTypeFilter)}
            />
          ))}
        </ScrollView>
      </View>

      {/* 4 KPI Summary Cards with comparison */}
      <View style={[s.row, { flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }]}>
        <View style={[s.card, { width: '48%', minHeight: 110, padding: 14, justifyContent: 'space-between' }]}>
          <View style={[s.row, { alignItems: 'flex-start' }]}>
            {timeRange !== 'all' && (
              <View
                style={{
                  backgroundColor: revenueGrowth >= 0 ? 'rgba(35,122,87,0.14)' : 'rgba(214,40,50,0.14)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}
              >
                <Txt style={{ color: revenueGrowth >= 0 ? C.green : C.red, fontWeight: '900', fontSize: 11 }}>
                  {revenueGrowth >= 0 ? `▲ +${revenueGrowth}%` : `▼ ${revenueGrowth}%`}
                </Txt>
              </View>
            )}
            <Txt style={s.small}>إجمالي المبيعات</Txt>
          </View>
          <Txt style={{ fontSize: 22, fontWeight: '900', color: C.navy, textAlign: 'right' }}>{money(totalRevenue)}</Txt>
          <Txt style={[s.small, { fontSize: 10, color: C.muted }]}>
            {timeRange === '7d' ? 'مقارنة بالأسبوع السابق' : timeRange === '30d' ? 'مقارنة بالشهر السابق' : 'منذ بداية النشاط'}
          </Txt>
        </View>

        <View style={[s.card, { width: '48%', minHeight: 110, padding: 14, justifyContent: 'space-between' }]}>
          <View style={[s.row, { alignItems: 'flex-start' }]}>
            <View style={{ backgroundColor: 'rgba(23,74,156,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Txt style={{ color: C.blue, fontWeight: '900', fontSize: 11 }}>{filteredOrders.length} إجمالي</Txt>
            </View>
            <Txt style={s.small}>الطلبات المكتملة</Txt>
          </View>
          <Txt style={{ fontSize: 22, fontWeight: '900', color: C.navy, textAlign: 'right' }}>
            {delivered.length} <Txt style={{ fontSize: 14, color: C.muted }}>طلب</Txt>
          </Txt>
          <Txt style={[s.small, { fontSize: 10, color: C.muted }]}>نسبة الإنجاز: {completionRate}%</Txt>
        </View>

        <View style={[s.card, { width: '48%', minHeight: 110, padding: 14, justifyContent: 'space-between' }]}>
          <Txt style={[s.small, { textAlign: 'right' }]}>متوسط قيمة الطلب (AOV)</Txt>
          <Txt style={{ fontSize: 22, fontWeight: '900', color: C.navy, textAlign: 'right' }}>{money(avgOrderValue)}</Txt>
          <Txt style={[s.small, { fontSize: 10, color: C.muted }]}>متوسط سلة المشتريات للطلب</Txt>
        </View>

        <View style={[s.card, { width: '48%', minHeight: 110, padding: 14, justifyContent: 'space-between' }]}>
          <Txt style={[s.small, { textAlign: 'right' }]}>نسبة تسليم الطلبات</Txt>
          <Txt style={{ fontSize: 22, fontWeight: '900', color: completionRate >= 80 ? C.green : C.action, textAlign: 'right' }}>
            {completionRate}%
          </Txt>
          <Txt style={[s.small, { fontSize: 10, color: C.muted }]}>
            {filteredOrders.filter((o) => o.status === 'ملغي').length} طلبات ملغاة
          </Txt>
        </View>
      </View>

      {/* ============================================================== */}
      {/* 1. LINE CHART (الرسم البياني الخطي - منحنى اتجاه المبيعات) */}
      {/* ============================================================== */}
      {(chartTypeFilter === 'all' || chartTypeFilter === 'line') && (
        <View style={s.card}>
          <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }]}>
            {/* Days switcher */}
            <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
              <Chip label="٧ أيام" selected={lineDays === 7} onPress={() => setLineDays(7)} />
              <Chip label="١٤ يوماً" selected={lineDays === 14} onPress={() => setLineDays(14)} />
              <Chip label="٣٠ يوماً" selected={lineDays === 30} onPress={() => setLineDays(30)} />
            </View>

            {/* Metric switcher */}
            <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
              <Pressable
                onPress={() => setLineMetric('revenue')}
                style={{
                  backgroundColor: lineMetric === 'revenue' ? C.navy : C.surfaceAlt,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                }}
              >
                <Txt style={{ fontSize: 11, fontWeight: '900', color: lineMetric === 'revenue' ? C.white : C.muted }}>
                  💰 مبيعات (ج.م)
                </Txt>
              </Pressable>
              <Pressable
                onPress={() => setLineMetric('orders')}
                style={{
                  backgroundColor: lineMetric === 'orders' ? C.navy : C.surfaceAlt,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                }}
              >
                <Txt style={{ fontSize: 11, fontWeight: '900', color: lineMetric === 'orders' ? C.white : C.muted }}>
                  📦 طلبات
                </Txt>
              </Pressable>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
            <Txt style={{ fontSize: 17, fontWeight: '900', color: C.navy }}>📈 الرسم البياني الخطي: منحنى حركة المبيعات (Line Chart)</Txt>
            <Txt style={s.small}>تتبع الاتجاه والنمو الزمني عبر مسار خطي بياني متصل</Txt>
          </View>

          {/* SVG Line Chart */}
          <View style={{ backgroundColor: C.surfaceAlt, borderRadius: 14, paddingVertical: 12, alignItems: 'center' }}>
            <Svg width="100%" height={linePathData.H} viewBox={`0 0 ${linePathData.W} ${linePathData.H}`}>
              <Defs>
                <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={C.navy} stopOpacity="0.35" />
                  <Stop offset="100%" stopColor={C.navy} stopOpacity="0.0" />
                </LinearGradient>
              </Defs>

              {/* Grid Lines */}
              {[0.25, 0.5, 0.75].map((ratio, idx) => {
                const y = linePathData.padY + (linePathData.H - 2 * linePathData.padY) * ratio;
                return (
                  <Line
                    key={idx}
                    x1={linePathData.padX}
                    y1={y}
                    x2={linePathData.W - linePathData.padX}
                    y2={y}
                    stroke="rgba(148,163,184,0.3)"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                );
              })}

              {/* Area fill */}
              <Path d={linePathData.areaPath} fill="url(#lineGrad)" />

              {/* Main Line */}
              <Path d={linePathData.linePath} fill="none" stroke={C.navy} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {/* Data points */}
              {linePathData.points.map((p, idx) => {
                const isPeak = p === linePathData.maxPoint && p.val > 0;
                return (
                  <G key={idx}>
                    <Circle
                      cx={p.x}
                      cy={p.y}
                      r={isPeak ? 5.5 : 4}
                      fill={isPeak ? C.action : C.navy}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </G>
                );
              })}
            </Svg>

            {/* X-axis labels row */}
            <View style={{ width: '100%', flexDirection: 'row-reverse', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 4 }}>
              {lineStats.map((item, idx) => (
                <View key={idx} style={{ alignItems: 'center' }}>
                  <Txt style={{ fontSize: lineDays <= 7 ? 9 : 8, fontWeight: item.isToday ? '900' : '700', color: item.isToday ? C.action : C.ink }}>
                    {item.label}
                  </Txt>
                  {lineDays <= 7 && <Txt style={{ fontSize: 7, color: C.muted }}>{item.dateStr}</Txt>}
                </View>
              ))}
            </View>
          </View>

          {/* Quick Summary Pill Bar */}
          <View style={[s.row, { justifyContent: 'space-between', gap: 8, marginTop: 10 }]}>
            <View style={{ flex: 1, backgroundColor: C.surfaceAlt, padding: 8, borderRadius: 10, alignItems: 'center' }}>
              <Txt style={[s.small, { fontSize: 10 }]}>أعلى نقطة بالمنحنى</Txt>
              <Txt style={{ fontWeight: '900', fontSize: 13, color: C.action, marginTop: 2 }}>
                {lineMetric === 'revenue' ? money(linePathData.maxPoint.val) : `${linePathData.maxPoint.val} طلب`}
              </Txt>
            </View>
            <View style={{ flex: 1, backgroundColor: C.surfaceAlt, padding: 8, borderRadius: 10, alignItems: 'center' }}>
              <Txt style={[s.small, { fontSize: 10 }]}>المتوسط اليومي</Txt>
              <Txt style={{ fontWeight: '900', fontSize: 13, color: C.navy, marginTop: 2 }}>
                {lineMetric === 'revenue' ? money(Math.round(totalRevenue / lineDays)) : `${(delivered.length / lineDays).toFixed(1)} طلب/يوم`}
              </Txt>
            </View>
            <View style={{ flex: 1, backgroundColor: C.surfaceAlt, padding: 8, borderRadius: 10, alignItems: 'center' }}>
              <Txt style={[s.small, { fontSize: 10 }]}>معدل النمو</Txt>
              <Txt style={{ fontWeight: '900', fontSize: 13, color: revenueGrowth >= 0 ? C.green : C.red, marginTop: 2 }}>
                {revenueGrowth >= 0 ? `+${revenueGrowth}%` : `${revenueGrowth}%`}
              </Txt>
            </View>
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* 2. PIE CHART (الرسم البياني الدائري - Donut / Pie Chart) */}
      {/* ============================================================== */}
      {(chartTypeFilter === 'all' || chartTypeFilter === 'pie') && (
        <View style={s.card}>
          <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }]}>
            {/* Toggle Category / Branch */}
            <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
              <Chip label="📁 أقسام الدواجن" selected={pieMode === 'category'} onPress={() => setPieMode('category')} />
              <Chip label="🏬 الفروع والتوصيل" selected={pieMode === 'branch'} onPress={() => setPieMode('branch')} />
            </View>
            <Txt style={{ fontSize: 12, color: C.muted }}>مخطط الحصص</Txt>
          </View>

          <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
            <Txt style={{ fontSize: 17, fontWeight: '900', color: C.navy }}>🥧 الرسم البياني الدائري: توزيع حصص المبيعات (Pie Chart)</Txt>
            <Txt style={s.small}>
              {pieMode === 'category' ? 'نسب مبيعات كل فئة من الدواجن والمتبلات والطيور' : 'نسب إيرادات منافذ البيع وفروع الإسكندرية والتوصيل'}
            </Txt>
          </View>

          {/* SVG Pie / Donut Chart */}
          <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative', marginVertical: 8 }}>
            <Svg width={220} height={220} viewBox="0 0 220 220">
              <G transform="rotate(-90 110 110)">
                {pieData.slices.map((slice, idx) => (
                  <Circle
                    key={idx}
                    cx={110}
                    cy={110}
                    r={pieData.r}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={26}
                    strokeDasharray={`${slice.dash} ${pieData.circ}`}
                    strokeDashoffset={-slice.offset}
                    strokeLinecap="butt"
                  />
                ))}
              </G>
            </Svg>

            {/* Inner Center Label */}
            <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
              <Txt style={{ fontSize: 16, fontWeight: '900', color: C.navy }}>{money(pieData.total)}</Txt>
              <Txt style={[s.small, { fontSize: 10, color: C.muted }]}>إجمالي المبيعات</Txt>
            </View>
          </View>

          {/* Legend Grid */}
          <View style={{ gap: 8, marginTop: 10 }}>
            {pieData.slices.map((slice, idx) => (
              <View
                key={idx}
                style={[
                  s.row,
                  {
                    padding: 9,
                    backgroundColor: C.surfaceAlt,
                    borderRadius: 12,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: C.border,
                  },
                ]}
              >
                <View style={{ alignItems: 'flex-start' }}>
                  <Txt style={{ fontWeight: '900', fontSize: 13, color: C.navy }}>{money(slice.value)}</Txt>
                  <Txt style={[s.small, { fontSize: 10, color: C.action, fontWeight: '800' }]}>{slice.percent}% من الإجمالي</Txt>
                </View>

                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: slice.color }} />
                  <View style={{ alignItems: 'flex-end' }}>
                    <Txt style={{ fontWeight: '900', fontSize: 13, color: C.ink }}>{slice.label}</Txt>
                    <Txt style={[s.small, { fontSize: 10 }]}>{slice.count} مبيعات مسجلة</Txt>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* 3. SCATTER CHART (مخطط التشتت - Scatter Plot) */}
      {/* ============================================================== */}
      {(chartTypeFilter === 'all' || chartTypeFilter === 'scatter') && (
        <View style={s.card}>
          <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }]}>
            {/* Scatter metric toggle */}
            <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
              <Chip label="⏰ ساعات اليوم" selected={scatterMode === 'time'} onPress={() => setScatterMode('time')} />
              <Chip label="🛒 عدد الأصناف" selected={scatterMode === 'basket'} onPress={() => setScatterMode('basket')} />
            </View>
            <Txt style={{ fontSize: 12, color: C.muted }}>كثافة التوزيع</Txt>
          </View>

          <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
            <Txt style={{ fontSize: 17, fontWeight: '900', color: C.navy }}>🎯 مخطط التشتت: كثافة وتوزيع الطلبات (Scatter Plot)</Txt>
            <Txt style={s.small}>
              {scatterMode === 'time'
                ? 'توزيع قيمة الطلبات عبر ساعات اليوم من الصباح للمساء لاكتشاف فترات الذروة'
                : 'توزيع قيمة الطلب مقابل عدد أصناف السلة لاكتشاف كثافة المشتريات'}
            </Txt>
          </View>

          {/* SVG Scatter Plot */}
          <View style={{ backgroundColor: C.surfaceAlt, borderRadius: 14, paddingVertical: 12, alignItems: 'center' }}>
            <Svg width="100%" height={scatterData.H} viewBox={`0 0 ${scatterData.W} ${scatterData.H}`}>
              {/* Horizontal Grid lines */}
              {[0.25, 0.5, 0.75].map((ratio, idx) => {
                const y = scatterData.padY + (scatterData.H - 2 * scatterData.padY) * ratio;
                return (
                  <Line
                    key={idx}
                    x1={scatterData.padX}
                    y1={y}
                    x2={scatterData.W - scatterData.padX}
                    y2={y}
                    stroke="rgba(148,163,184,0.3)"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                );
              })}

              {/* Average Order Value dashed line */}
              <Line
                x1={scatterData.padX}
                y1={scatterData.avgY}
                x2={scatterData.W - scatterData.padX}
                y2={scatterData.avgY}
                stroke={C.action}
                strokeWidth="1.5"
                strokeDasharray="5,3"
              />

              {/* Data points (Orders) */}
              {scatterData.points.map((pt, idx) => (
                <G key={idx}>
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={pt.radius}
                    fill={pt.color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    opacity={0.88}
                  />
                </G>
              ))}
            </Svg>

            {/* X-axis labels */}
            <View style={{ width: '100%', flexDirection: 'row-reverse', justifyContent: 'space-between', paddingHorizontal: 28, marginTop: 4 }}>
              {scatterMode === 'time' ? (
                <>
                  <Txt style={{ fontSize: 9, color: C.muted }}>09:00 ص</Txt>
                  <Txt style={{ fontSize: 9, color: C.muted }}>01:00 م</Txt>
                  <Txt style={{ fontSize: 9, color: C.muted }}>05:00 م</Txt>
                  <Txt style={{ fontSize: 9, color: C.muted }}>09:00 م</Txt>
                  <Txt style={{ fontSize: 9, color: C.muted }}>11:00 م</Txt>
                </>
              ) : (
                <>
                  <Txt style={{ fontSize: 9, color: C.muted }}>صنف واحد</Txt>
                  <Txt style={{ fontSize: 9, color: C.muted }}>٣ أصناف</Txt>
                  <Txt style={{ fontSize: 9, color: C.muted }}>٥ أصناف</Txt>
                  <Txt style={{ fontSize: 9, color: C.muted }}>٧+ أصناف</Txt>
                </>
              )}
            </View>
          </View>

          {/* Scatter Chart Insights & Legend */}
          <View style={{ gap: 8, marginTop: 10 }}>
            {/* Insight Callout */}
            <View style={{ backgroundColor: 'rgba(23,74,156,0.06)', borderColor: 'rgba(23,74,156,0.2)', borderWidth: 1, borderRadius: 10, padding: 10 }}>
              <Txt style={{ fontWeight: '900', fontSize: 12, color: C.navy, textAlign: 'right' }}>
                💡 تحليل الذروة والتشتت الإحصائي:
              </Txt>
              <Txt style={[s.small, { marginTop: 3, lineHeight: 18 }]}>
                تتركز معظم الطلبات عالية القيمة بين الساعة 01:00 ظهراً و 07:00 مساءً. الخط المتقطع باللون الذهبي يوضح متوسط سلة المشتريات ({money(avgOrderValue)}).
              </Txt>
            </View>

            {/* Status Color Guide */}
            <View style={[s.row, { justifyContent: 'space-around', flexWrap: 'wrap', gap: 6 }]}>
              {[
                { label: 'تم التسليم', color: '#059669' },
                { label: 'جاري التجهيز', color: '#1E3A8A' },
                { label: 'خرج للتوصيل', color: '#4F46E5' },
                { label: 'قيد المراجعة', color: '#D97706' },
                { label: 'ملغي', color: '#DC2626' },
              ].map((lg) => (
                <View key={lg.label} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: lg.color }} />
                  <Txt style={{ fontSize: 11, color: C.ink }}>{lg.label}</Txt>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* 4. BAR CHART (مقارنة المبيعات اليومية بالأعمدة) */}
      {/* ============================================================== */}
      {(chartTypeFilter === 'all' || chartTypeFilter === 'bar') && (
        <View style={s.card}>
          <View style={[s.row, { marginBottom: 12 }]}>
            <View style={{ backgroundColor: 'rgba(232,173,35,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
              <Txt style={{ color: C.navy, fontWeight: '900', fontSize: 11 }}>
                معدل يومي: {money(Math.round(totalRevenue / 7))}
              </Txt>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt style={{ fontSize: 17, fontWeight: '900', color: C.navy }}>📊 رسم الأعمدة: مبيعات الأيام الـ ٧ الأخيرة (Bar Chart)</Txt>
              <Txt style={s.small}>توزيع إيرادات المبيعات اليومية ومقارنتها بالأعمدة البيانية</Txt>
            </View>
          </View>

          {/* Visual Bar Columns */}
          <View style={{ height: 180, flexDirection: 'row-reverse', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 6, paddingTop: 24, paddingBottom: 6 }}>
            {dailyBarStats.map((day, idx) => {
              const barHeight = Math.max(12, Math.round((day.revenue / maxDailyRevenue) * 125));
              return (
                <View key={idx} style={{ flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <Txt style={{ fontSize: 9, fontWeight: '800', color: day.isToday ? C.action : C.muted, marginBottom: 4, textAlign: 'center' }}>
                    {day.revenue > 0 ? Math.round(day.revenue) : '—'}
                  </Txt>
                  <View
                    style={{
                      width: '74%',
                      height: barHeight,
                      backgroundColor: day.isToday ? C.action : day.revenue > 0 ? C.navy : 'rgba(200,200,200,0.3)',
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}
                  />
                  <Txt style={{ fontSize: 10, fontWeight: day.isToday ? '900' : '700', color: day.isToday ? C.action : C.ink, marginTop: 6 }}>
                    {day.label}
                  </Txt>
                  <Txt style={{ fontSize: 8, color: C.muted }}>{day.dateStr}</Txt>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Best-Selling Products Breakdown (الأصناف الأكثر مبيعاً) */}
      <View style={s.card}>
        <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }]}>
          <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
            <Chip label="حسب الإيرادات" selected={sortTopBy === 'revenue'} onPress={() => setSortTopBy('revenue')} />
            <Chip label="حسب الكميات" selected={sortTopBy === 'qty'} onPress={() => setSortTopBy('qty')} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt style={{ fontSize: 17, fontWeight: '900', color: C.navy }}>🍗 الأصناف الأكثر مبيعاً</Txt>
            <Txt style={s.small}>ترتيب المنتجات وفق حجم الإقبال والطلب</Txt>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          {topProducts.length === 0 ? (
            <Txt style={{ textAlign: 'center', color: C.muted, paddingVertical: 16 }}>لا توجد طلبات مكتملة كافية بعد لإظهار الترتيب.</Txt>
          ) : (
            topProducts.map((p, idx) => (
              <View key={p.name} style={{ gap: 4 }}>
                <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                  <Txt style={{ fontWeight: '900', fontSize: 13, color: C.navy }}>
                    {money(p.revenue)} · <Txt style={{ fontSize: 11, color: C.muted }}>{p.quantity} {p.unit}</Txt>
                  </Txt>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: idx === 0 ? '#FEF3C7' : idx === 1 ? '#E0E7FF' : C.surfaceAlt,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Txt style={{ fontSize: 11, fontWeight: '900', color: idx === 0 ? '#D97706' : idx === 1 ? C.navy : C.muted }}>
                        #{idx + 1}
                      </Txt>
                    </View>
                    <Txt style={{ fontWeight: '800', fontSize: 13, color: C.ink }}>{p.name}</Txt>
                  </View>
                </View>
                <View style={{ height: 7, backgroundColor: C.surfaceAlt, borderRadius: 4, overflow: 'hidden', flexDirection: 'row-reverse' }}>
                  <View
                    style={{
                      width: `${Math.round(((sortTopBy === 'revenue' ? p.revenue : p.quantity) / topProductsMax) * 100)}%`,
                      height: '100%',
                      backgroundColor: idx === 0 ? C.action : C.navy,
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Branch & Delivery Performance Comparison */}
      <View style={s.card}>
        <View style={[s.row, { marginBottom: 12 }]}>
          <Txt style={{ fontSize: 12, color: C.muted }}>مبيعات واستلام الفروع</Txt>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt style={{ fontSize: 17, fontWeight: '900', color: C.navy }}>مقارنة أداء الفروع والتوصيل</Txt>
            <Txt style={s.small}>توزيع حجم المبيعات بين فروع الإسكندرية والتوصيل المنزلي</Txt>
          </View>
        </View>

        <View style={{ height: 14, borderRadius: 7, overflow: 'hidden', flexDirection: 'row-reverse', backgroundColor: C.surfaceAlt, marginBottom: 14 }}>
          {branchBreakdown.map((b) => (
            <View
              key={b.name}
              style={{
                width: `${Math.max(b.sharePercent, b.revenue > 0 ? 3 : 0)}%`,
                height: '100%',
                backgroundColor: b.color,
              }}
            />
          ))}
        </View>

        <View style={{ gap: 8 }}>
          {branchBreakdown.map((branch) => (
            <View
              key={branch.name}
              style={[
                s.row,
                {
                  padding: 10,
                  backgroundColor: C.surfaceAlt,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: C.border,
                },
              ]}
            >
              <View style={{ alignItems: 'flex-start' }}>
                <Txt style={{ fontWeight: '900', fontSize: 13, color: C.navy }}>{money(branch.revenue)}</Txt>
                <Txt style={[s.small, { fontSize: 10 }]}>{branch.count} طلبات مكتملة</Txt>
              </View>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: branch.color }} />
                <View style={{ alignItems: 'flex-end' }}>
                  <Txt style={{ fontWeight: '900', fontSize: 13, color: C.navy }}>{branch.name}</Txt>
                  <Txt style={[s.small, { fontSize: 10, fontWeight: '700', color: C.action }]}>
                    {branch.sharePercent}% من الإيرادات
                  </Txt>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Order Status Distribution */}
      <View style={s.card}>
        <View style={[s.row, { marginBottom: 10 }]}>
          <Txt style={{ fontSize: 12, color: C.muted }}>إجمالي {filteredOrders.length} طلب</Txt>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt style={{ fontSize: 17, fontWeight: '900', color: C.navy }}>توزيع حالات الطلبات</Txt>
            <Txt style={s.small}>متابعة مسار معالجة الطلبات ونسب الإنجاز</Txt>
          </View>
        </View>

        <View style={{ height: 12, borderRadius: 6, overflow: 'hidden', flexDirection: 'row-reverse', backgroundColor: C.surfaceAlt, marginBottom: 12 }}>
          {statusStats.map((st) => (
            <View
              key={st.key}
              style={{
                width: `${Math.max(st.percent, st.count > 0 ? 3 : 0)}%`,
                height: '100%',
                backgroundColor: st.color,
              }}
            />
          ))}
        </View>

        <View style={[s.row, { flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }]}>
          {statusStats.map((st) => (
            <View
              key={st.key}
              style={{
                width: '48%',
                padding: 10,
                borderRadius: 12,
                backgroundColor: C.surfaceAlt,
                borderWidth: 1,
                borderColor: C.border,
                flexDirection: 'row-reverse',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: st.color }} />
                <Txt style={{ fontWeight: '800', fontSize: 12, color: C.navy }}>{st.label}</Txt>
              </View>
              <Txt style={{ fontWeight: '900', fontSize: 12, color: C.ink }}>
                {st.count} <Txt style={{ fontSize: 10, color: C.muted }}>({st.percent}%)</Txt>
              </Txt>
            </View>
          ))}
        </View>
      </View>

      {/* Payment Methods Analysis */}
      <View style={s.card}>
        <View style={[s.row, { marginBottom: 10 }]}>
          <Txt style={{ fontSize: 12, color: C.muted }}>خيارات الدفع</Txt>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt style={{ fontSize: 17, fontWeight: '900', color: C.navy }}>طرق الدفع المفضلة لدى العملاء</Txt>
            <Txt style={s.small}>تفضيلات الدفع عند إتمام الطلب</Txt>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          {paymentStats.map((pm) => (
            <View key={pm.key} style={{ gap: 4 }}>
              <View style={[s.row, { justifyContent: 'space-between' }]}>
                <Txt style={{ fontWeight: '900', fontSize: 12, color: C.navy }}>
                  {money(pm.amount)} · <Txt style={{ color: C.muted }}>{pm.count} طلب</Txt>
                </Txt>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: pm.color }} />
                  <Txt style={{ fontWeight: '900', fontSize: 13, color: C.ink }}>{pm.label}</Txt>
                </View>
              </View>
              <View style={{ height: 7, backgroundColor: C.surfaceAlt, borderRadius: 4, overflow: 'hidden', flexDirection: 'row-reverse' }}>
                <View style={{ width: `${pm.percent}%`, height: '100%', backgroundColor: pm.color, borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// Enhanced Summary Charts for the Main Summary Tab (صفحة الملخص المحسّنة)
export function SummaryCharts({ orders, onOpenAnalytics }: { orders: Order[]; onOpenAnalytics: () => void }) {
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');
  const [chartDays, setChartDays] = useState<7 | 14>(7);
  const [summaryVisualMode, setSummaryVisualMode] = useState<'bar' | 'line' | 'pie'>('bar');

  const delivered = useMemo(() => orders.filter(isOrderCompleted), [orders]);
  const hasLiveOrders = orders.length > 0;
  const activeOrders = hasLiveOrders ? orders : sampleDemoOrders;
  const activeDelivered = hasLiveOrders ? delivered : sampleDemoOrders.filter(isOrderCompleted);

  // Total Revenue of active delivered orders
  const totalRevenue = useMemo(() => activeDelivered.reduce((sum, o) => sum + o.total, 0), [activeDelivered]);

  // Today & Yesterday snapshot
  const { todayRev, todayOrders, yesterdayRev, yesterdayOrders } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
    const startOfYesterday = startOfToday - 86400000;

    const tOrders = activeOrders.filter((o) => o.createdAt >= startOfToday);
    const tDelivered = tOrders.filter(isOrderCompleted);
    const yOrders = activeOrders.filter((o) => o.createdAt >= startOfYesterday && o.createdAt < startOfToday);
    const yDelivered = yOrders.filter(isOrderCompleted);

    return {
      todayRev: tDelivered.reduce((sum, o) => sum + o.total, 0),
      todayOrders: tOrders.length,
      yesterdayRev: yDelivered.reduce((sum, o) => sum + o.total, 0),
      yesterdayOrders: yOrders.length,
    };
  }, [activeOrders]);

  // Daily breakdown for selected days (7 or 14)
  const dailyStats = useMemo(() => {
    const result: { label: string; dateStr: string; revenue: number; orderCount: number; isToday: boolean }[] = [];
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    for (let i = chartDays - 1; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 86400000);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0).getTime();
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59).getTime();

      const dayOrders = activeDelivered.filter((o) => o.createdAt >= startOfDay && o.createdAt <= endOfDay);
      const dayRev = dayOrders.reduce((sum, o) => sum + o.total, 0);

      result.push({
        label: i === 0 ? 'اليوم' : i === 1 ? 'أمس' : chartDays === 7 ? dayNames[targetDate.getDay()] : dayNames[targetDate.getDay()].slice(0, 3),
        dateStr: `${targetDate.getDate()}/${targetDate.getMonth() + 1}`,
        revenue: dayRev,
        orderCount: dayOrders.length,
        isToday: i === 0,
      });
    }
    return result;
  }, [activeDelivered, chartDays]);

  const maxVal = useMemo(() => {
    if (chartMetric === 'revenue') {
      return Math.max(...dailyStats.map((d) => d.revenue), 100);
    }
    return Math.max(...dailyStats.map((d) => d.orderCount), 4);
  }, [dailyStats, chartMetric]);

  // Top 5 Best-Selling Products
  const topProducts = useMemo(() => {
    const productMap = new Map<string, { name: string; quantity: number; revenue: number; unit: string }>();

    activeDelivered.forEach((order) => {
      order.items.forEach((item: CartLine) => {
        const key = item.name.trim();
        const existing = productMap.get(key) || { name: key, quantity: 0, revenue: 0, unit: item.unit || 'للكيلو' };
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
        productMap.set(key, existing);
      });
    });

    const list = Array.from(productMap.values());
    list.sort((a, b) => b.revenue - a.revenue);
    const top5 = list.slice(0, 5);
    const maxRev = top5.length > 0 ? top5[0].revenue : 1;
    return top5.map((p, idx) => ({
      ...p,
      rank: idx + 1,
      percent: Math.round((p.revenue / (totalRevenue || 1)) * 100),
      relativeBar: Math.round((p.revenue / maxRev) * 100),
    }));
  }, [activeDelivered, totalRevenue]);

  // Branch & Delivery sales breakdown
  const branchBreakdown = useMemo(() => {
    const branches = [
      { key: 'camp', name: 'فرع كامب شيزار', color: C.navy, revenue: 0, count: 0 },
      { key: 'smouha', name: 'فرع سموحة', color: C.action, revenue: 0, count: 0 },
      { key: 'bahary', name: 'فرع بحري', color: '#D97706', revenue: 0, count: 0 },
      { key: 'delivery', name: 'توصيل للمنزل 🛵', color: C.green, revenue: 0, count: 0 },
    ];

    activeDelivered.forEach((order) => {
      const addr = order.address || '';
      let matched = false;
      if (addr.includes('كامب شيزار') && (addr.includes('فرع') || !addr.includes('·'))) {
        branches[0].revenue += order.total;
        branches[0].count += 1;
        matched = true;
      } else if (addr.includes('سموحة') && (addr.includes('فرع') || !addr.includes('·'))) {
        branches[1].revenue += order.total;
        branches[1].count += 1;
        matched = true;
      } else if (addr.includes('بحري') && (addr.includes('فرع') || !addr.includes('·'))) {
        branches[2].revenue += order.total;
        branches[2].count += 1;
        matched = true;
      }

      if (!matched) {
        branches[3].revenue += order.total;
        branches[3].count += 1;
      }
    });

    const total = branches.reduce((sum, b) => sum + b.revenue, 0) || 1;
    return branches.map((b) => ({ ...b, sharePercent: Math.round((b.revenue / total) * 100) }));
  }, [activeDelivered]);

  // Mini Line Chart Paths
  const miniLineData = useMemo(() => {
    const W = 310;
    const H = 140;
    const padX = 24;
    const padY = 20;
    const uW = W - 2 * padX;
    const uH = H - 2 * padY;

    const points = dailyStats.map((d, i) => {
      const val = chartMetric === 'revenue' ? d.revenue : d.orderCount;
      const x = padX + (i * uW) / Math.max(dailyStats.length - 1, 1);
      const y = H - padY - (val / (maxVal || 1)) * uH;
      return { x, y, val, d };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${H - padY} L ${points[0].x.toFixed(1)} ${H - padY} Z`;

    return { points, linePath, areaPath, W, H, padX, padY };
  }, [dailyStats, chartMetric, maxVal]);

  // Mini Pie Slices
  const miniPieSlices = useMemo(() => {
    const total = branchBreakdown.reduce((s, b) => s + b.revenue, 0) || 1;
    const r = 60;
    const circ = 2 * Math.PI * r;
    let acc = 0;
    return branchBreakdown.map((b) => {
      const pct = b.revenue / total;
      const dash = pct * circ;
      const offset = acc;
      acc += dash;
      return {
        label: b.name,
        color: b.color,
        value: b.revenue,
        percent: b.sharePercent,
        dash,
        offset,
        circ,
        r,
      };
    });
  }, [branchBreakdown]);

  // Status Funnel (مسار معالجة الطلبات)
  const funnelSteps = useMemo(() => {
    const total = activeOrders.length || 1;
    const steps = [
      { key: 'pending', label: 'قيد المراجعة', icon: '⏳', color: '#D97706', count: activeOrders.filter((o) => isOrderPending(o.status)).length },
      { key: 'prep', label: 'جاري التجهيز', icon: '🔪', color: '#1E3A8A', count: activeOrders.filter((o) => o.status === 'جاري التجهيز').length },
      { key: 'delivering', label: 'خرج للتوصيل', icon: '🛵', color: '#4F46E5', count: activeOrders.filter((o) => o.status === 'خرج للتوصيل').length },
      { key: 'delivered', label: 'تم التسليم', icon: '✅', color: '#059669', count: activeOrders.filter((o) => isOrderCompleted(o)).length },
    ];
    return steps.map((s) => ({ ...s, percent: Math.round((s.count / total) * 100) }));
  }, [activeOrders]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const list = [
      { label: 'كاش عند الاستلام', key: 'cash', color: C.green, count: 0, amount: 0 },
      { label: 'InstaPay فوري', key: 'instapay', color: '#8B5CF6', count: 0, amount: 0 },
      { label: 'بطاقة بنكية', key: 'card', color: C.blue, count: 0, amount: 0 },
    ];
    activeDelivered.forEach((o) => {
      const p = String(o.payment || '').toUpperCase();
      if (p.includes('INSTAPAY')) {
        list[1].count++;
        list[1].amount += o.total;
      } else if (p.includes('CARD') || p.includes('فيزا') || p.includes('بطاقة')) {
        list[2].count++;
        list[2].amount += o.total;
      } else {
        list[0].count++;
        list[0].amount += o.total;
      }
    });
    const total = activeDelivered.length || 1;
    return list.map((item) => ({ ...item, percent: Math.round((item.count / total) * 100) }));
  }, [activeDelivered]);

  return (
    <View style={{ gap: 12 }}>
      {/* 1. Header Card with Today's Live Pulse & Quick Switch */}
      <View style={s.card}>
        <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }]}>
          <Pressable
            onPress={onOpenAnalytics}
            style={({ pressed }) => [
              {
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 5,
                backgroundColor: C.navy,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 14,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Txt style={{ color: C.white, fontWeight: '900', fontSize: 12 }}>الرسوم الموسعة ↗</Txt>
          </Pressable>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt style={{ fontSize: 18, fontWeight: '900', color: C.navy }}>لوحة مؤشرات المبيعات والرسوم البيانية</Txt>
            <Txt style={s.small}>متابعة حية للمبيعات، الأصناف، والفروع</Txt>
          </View>
        </View>

        {/* Today vs Yesterday Ribbon */}
        <View style={[s.row, { gap: 10, justifyContent: 'space-between' }]}>
          <View style={{ flex: 1, backgroundColor: 'rgba(35,122,87,0.08)', borderColor: 'rgba(35,122,87,0.3)', borderWidth: 1, borderRadius: 14, padding: 12 }}>
            <Txt style={[s.small, { color: C.green, fontWeight: '800' }]}>مبيعات اليوم ⚡</Txt>
            <Txt style={{ fontSize: 19, fontWeight: '900', color: C.navy, marginTop: 2 }}>{money(todayRev)}</Txt>
            <Txt style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{todayOrders} طلب مسجل</Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: C.surfaceAlt, borderColor: C.border, borderWidth: 1, borderRadius: 14, padding: 12 }}>
            <Txt style={[s.small, { color: C.muted, fontWeight: '800' }]}>مبيعات أمس</Txt>
            <Txt style={{ fontSize: 19, fontWeight: '900', color: C.ink, marginTop: 2 }}>{money(yesterdayRev)}</Txt>
            <Txt style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{yesterdayOrders} طلب مسجل</Txt>
          </View>
        </View>
      </View>

      {/* 2. Interactive Chart Card with Visual Switcher (Bar / Line / Pie) */}
      <View style={s.card}>
        <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }]}>
          {/* Days selector */}
          <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
            <Chip label="٧ أيام" selected={chartDays === 7} onPress={() => setChartDays(7)} />
            <Chip label="١٤ يوماً" selected={chartDays === 14} onPress={() => setChartDays(14)} />
          </View>

          {/* Chart format switcher */}
          <View style={{ flexDirection: 'row-reverse', gap: 4 }}>
            <Pressable
              onPress={() => setSummaryVisualMode('bar')}
              style={{
                backgroundColor: summaryVisualMode === 'bar' ? C.navy : C.surfaceAlt,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Txt style={{ fontSize: 11, fontWeight: '900', color: summaryVisualMode === 'bar' ? C.white : C.muted }}>📊 أعمدة</Txt>
            </Pressable>
            <Pressable
              onPress={() => setSummaryVisualMode('line')}
              style={{
                backgroundColor: summaryVisualMode === 'line' ? C.navy : C.surfaceAlt,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Txt style={{ fontSize: 11, fontWeight: '900', color: summaryVisualMode === 'line' ? C.white : C.muted }}>📈 خطي</Txt>
            </Pressable>
            <Pressable
              onPress={() => setSummaryVisualMode('pie')}
              style={{
                backgroundColor: summaryVisualMode === 'pie' ? C.navy : C.surfaceAlt,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Txt style={{ fontSize: 11, fontWeight: '900', color: summaryVisualMode === 'pie' ? C.white : C.muted }}>🥧 دائري</Txt>
            </Pressable>
          </View>
        </View>

        <View style={{ alignItems: 'flex-end', marginBottom: 10 }}>
          <Txt style={{ fontSize: 15, fontWeight: '900', color: C.navy }}>
            {summaryVisualMode === 'line'
              ? '📈 منحنى المبيعات الخطي (Line Chart)'
              : summaryVisualMode === 'pie'
              ? '🥧 توزيع الحصص الدائري (Pie Chart)'
              : `حركة المبيعات اليومية (إجمالي: ${money(totalRevenue)})`}
          </Txt>
          <Txt style={[s.small, { fontSize: 11 }]}>
            {summaryVisualMode === 'pie' ? 'توزيع مبيعات منافذ وفروع الإسكندرية والتوصيل' : 'متابعة حركة الإيرادات اليومية وتوزيع القمم الشرائية'}
          </Txt>
        </View>

        {/* Dynamic Display based on selected visual mode */}
        {summaryVisualMode === 'line' ? (
          <View style={{ backgroundColor: C.surfaceAlt, borderRadius: 14, paddingVertical: 10, alignItems: 'center' }}>
            <Svg width="100%" height={miniLineData.H} viewBox={`0 0 ${miniLineData.W} ${miniLineData.H}`}>
              <Defs>
                <LinearGradient id="miniLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={C.navy} stopOpacity="0.35" />
                  <Stop offset="100%" stopColor={C.navy} stopOpacity="0.0" />
                </LinearGradient>
              </Defs>
              <Path d={miniLineData.areaPath} fill="url(#miniLineGrad)" />
              <Path d={miniLineData.linePath} fill="none" stroke={C.navy} strokeWidth="3" strokeLinecap="round" />
              {miniLineData.points.map((p, idx) => (
                <Circle key={idx} cx={p.x} cy={p.y} r={p.d.isToday ? 5 : 3.5} fill={p.d.isToday ? C.action : C.navy} stroke="#fff" strokeWidth="1.5" />
              ))}
            </Svg>
            <View style={{ width: '100%', flexDirection: 'row-reverse', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 4 }}>
              {dailyStats.map((d, i) => (
                <Txt key={i} style={{ fontSize: chartDays === 7 ? 9 : 8, fontWeight: d.isToday ? '900' : '600', color: d.isToday ? C.action : C.muted }}>
                  {d.label}
                </Txt>
              ))}
            </View>
          </View>
        ) : summaryVisualMode === 'pie' ? (
          <View style={{ backgroundColor: C.surfaceAlt, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
            <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Svg width={180} height={180} viewBox="0 0 180 180">
                <G transform="rotate(-90 90 90)">
                  {miniPieSlices.map((s, idx) => (
                    <Circle
                      key={idx}
                      cx={90}
                      cy={90}
                      r={s.r}
                      fill="transparent"
                      stroke={s.color}
                      strokeWidth={22}
                      strokeDasharray={`${s.dash} ${s.circ}`}
                      strokeDashoffset={-s.offset}
                    />
                  ))}
                </G>
              </Svg>
              <View style={{ position: 'absolute', alignItems: 'center' }}>
                <Txt style={{ fontWeight: '900', fontSize: 14, color: C.navy }}>{money(totalRevenue)}</Txt>
                <Txt style={[s.small, { fontSize: 9 }]}>مبيعات الفروع</Txt>
              </View>
            </View>

            {/* Quick legend */}
            <View style={[s.row, { flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 10, paddingHorizontal: 8 }]}>
              {miniPieSlices.map((s, idx) => (
                <View key={idx} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: '#fff', borderRadius: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
                  <Txt style={{ fontSize: 10, fontWeight: '700', color: C.ink }}>{s.label} ({s.percent}%)</Txt>
                </View>
              ))}
            </View>
          </View>
        ) : (
          /* Default: Bar chart columns */
          <View
            style={{
              height: 155,
              flexDirection: 'row-reverse',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              paddingHorizontal: 4,
              paddingTop: 24,
              paddingBottom: 6,
              backgroundColor: C.surfaceAlt,
              borderRadius: 14,
            }}
          >
            {dailyStats.map((day, idx) => {
              const currentVal = chartMetric === 'revenue' ? day.revenue : day.orderCount;
              const barHeight = Math.max(8, Math.round((currentVal / (maxVal || 1)) * 95));
              return (
                <View key={idx} style={{ flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <Txt
                    style={{
                      fontSize: 8,
                      fontWeight: '900',
                      color: day.isToday ? C.action : currentVal > 0 ? C.navy : C.muted,
                      marginBottom: 3,
                      textAlign: 'center',
                    }}
                  >
                    {chartMetric === 'revenue' ? (day.revenue > 0 ? `${Math.round(day.revenue)}` : '—') : day.orderCount > 0 ? day.orderCount : '—'}
                  </Txt>
                  <View
                    style={{
                      width: chartDays === 7 ? '65%' : '75%',
                      height: barHeight,
                      backgroundColor: day.isToday ? C.action : currentVal > 0 ? C.navy : 'rgba(150,150,150,0.2)',
                      borderRadius: 6,
                    }}
                  />
                  <Txt
                    style={{
                      fontSize: chartDays === 7 ? 10 : 8,
                      fontWeight: day.isToday ? '900' : '700',
                      color: day.isToday ? C.action : C.ink,
                      marginTop: 5,
                    }}
                  >
                    {day.label}
                  </Txt>
                  <Txt style={{ fontSize: 7, color: C.muted }}>{day.dateStr}</Txt>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* 3. Top 5 Best-Selling Products Leaderboard (الأصناف الأكثر طلباً ومبيعاً) */}
      <View style={s.card}>
        <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }]}>
          <Txt style={{ fontSize: 11, color: C.muted }}>أعلى ٥ أصناف</Txt>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt style={{ fontSize: 16, fontWeight: '900', color: C.navy }}>🍗 الأصناف الأكثر طلباً ومبيعاً</Txt>
            <Txt style={s.small}>ترتيب المنتجات وفق الإيرادات المحققة</Txt>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          {topProducts.length === 0 ? (
            <Txt style={{ textAlign: 'center', color: C.muted, paddingVertical: 12 }}>لا توجد بيانات مبيعات كافية بعد</Txt>
          ) : (
            topProducts.map((p) => (
              <View key={p.name} style={{ gap: 4 }}>
                <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                  <Txt style={{ fontWeight: '900', fontSize: 13, color: C.navy }}>
                    {money(p.revenue)} <Txt style={{ fontSize: 11, color: C.muted }}>({p.percent}%)</Txt>
                  </Txt>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: p.rank === 1 ? '#FEF3C7' : C.surfaceAlt,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Txt style={{ fontSize: 11, fontWeight: '900', color: p.rank === 1 ? '#D97706' : C.ink }}>
                        #{p.rank}
                      </Txt>
                    </View>
                    <Txt style={{ fontWeight: '800', fontSize: 13, color: C.ink }}>{p.name}</Txt>
                    <Txt style={{ fontSize: 11, color: C.muted }}>· {p.quantity} {p.unit}</Txt>
                  </View>
                </View>
                <View style={{ height: 7, backgroundColor: C.surfaceAlt, borderRadius: 4, overflow: 'hidden', flexDirection: 'row-reverse' }}>
                  <View
                    style={{
                      width: `${p.relativeBar}%`,
                      height: '100%',
                      backgroundColor: p.rank === 1 ? C.action : C.navy,
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* 4. Branch & Delivery Performance Breakdown */}
      <View style={s.card}>
        <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }]}>
          <Txt style={{ fontSize: 11, color: C.muted }}>٤ قنوات بيع</Txt>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt style={{ fontSize: 16, fontWeight: '900', color: C.navy }}>🏬 توزيع المبيعات: الفروع والتوصيل</Txt>
            <Txt style={s.small}>حصة كل فرع والتوصيل المنزلي من إجمالي المبيعات</Txt>
          </View>
        </View>

        <View style={{ height: 12, borderRadius: 6, overflow: 'hidden', flexDirection: 'row-reverse', backgroundColor: C.surfaceAlt, marginBottom: 12 }}>
          {branchBreakdown.map((b) => (
            <View
              key={b.key}
              style={{
                width: `${Math.max(b.sharePercent, b.count > 0 ? 4 : 0)}%`,
                height: '100%',
                backgroundColor: b.color,
              }}
            />
          ))}
        </View>

        <View style={[s.row, { flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }]}>
          {branchBreakdown.map((b) => (
            <View
              key={b.key}
              style={{
                width: '48%',
                padding: 10,
                borderRadius: 12,
                backgroundColor: C.surfaceAlt,
                borderWidth: 1,
                borderColor: C.border,
                gap: 4,
              }}
            >
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: b.color }} />
                <Txt style={{ fontWeight: '800', fontSize: 12, color: C.navy }}>{b.name}</Txt>
              </View>
              <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                <Txt style={{ fontSize: 11, color: C.muted }}>{b.count} طلب</Txt>
                <Txt style={{ fontWeight: '900', fontSize: 13, color: C.ink }}>{money(b.revenue)}</Txt>
              </View>
              <Txt style={{ fontSize: 10, color: C.action, textAlign: 'right', fontWeight: '800' }}>
                الحصة: {b.sharePercent}%
              </Txt>
            </View>
          ))}
        </View>
      </View>

      {/* 5. Order Fulfillment Pipeline */}
      <View style={s.card}>
        <View style={{ alignItems: 'flex-end', marginBottom: 10 }}>
          <Txt style={{ fontSize: 16, fontWeight: '900', color: C.navy }}>🔄 مسار معالجة الطلبات الحالية</Txt>
          <Txt style={s.small}>متابعة فورية لتوزيع الطلبات عبر مراحل التنفيذ</Txt>
        </View>

        <View style={[s.row, { gap: 6, justifyContent: 'space-between' }]}>
          {funnelSteps.map((step) => (
            <View
              key={step.key}
              style={{
                flex: 1,
                backgroundColor: C.surfaceAlt,
                borderTopWidth: 3,
                borderColor: step.color,
                borderRadius: 10,
                paddingVertical: 8,
                paddingHorizontal: 4,
                alignItems: 'center',
              }}
            >
              <Txt style={{ fontSize: 15 }}>{step.icon}</Txt>
              <Txt style={{ fontSize: 16, fontWeight: '900', color: step.color, marginTop: 2 }}>{step.count}</Txt>
              <Txt style={{ fontSize: 10, fontWeight: '800', color: C.navy, textAlign: 'center', marginTop: 1 }}>{step.label}</Txt>
              <Txt style={{ fontSize: 9, color: C.muted }}>{step.percent}%</Txt>
            </View>
          ))}
        </View>
      </View>

      {/* 6. Payment Methods Breakdown */}
      <View style={s.card}>
        <View style={{ alignItems: 'flex-end', marginBottom: 10 }}>
          <Txt style={{ fontSize: 16, fontWeight: '900', color: C.navy }}>💳 تفضيلات الدفع</Txt>
          <Txt style={s.small}>مقارنة الدفع نقداً وفورياً عبر InstaPay والبطاقات</Txt>
        </View>

        <View style={{ gap: 8 }}>
          {paymentBreakdown.map((pm) => (
            <View key={pm.key} style={{ gap: 4 }}>
              <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                <Txt style={{ fontWeight: '900', fontSize: 12, color: C.navy }}>
                  {money(pm.amount)} · <Txt style={{ color: C.muted }}>{pm.count} طلب</Txt>
                </Txt>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: pm.color }} />
                  <Txt style={{ fontWeight: '800', fontSize: 12, color: C.ink }}>{pm.label}</Txt>
                </View>
              </View>
              <View style={{ height: 6, backgroundColor: C.surfaceAlt, borderRadius: 3, overflow: 'hidden', flexDirection: 'row-reverse' }}>
                <View style={{ width: `${pm.percent}%`, height: '100%', backgroundColor: pm.color, borderRadius: 3 }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
