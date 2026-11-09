import { Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Order } from './models';

const money = (n: number) => `${Math.round(n).toLocaleString('ar-EG')} ج.م`;

export function generateOrderInvoiceHtml(order: Order): string {
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const orderTime = order.createdAt ? new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—';
  const isPickup = (order.address || '').includes('فرع') && !(order.address || '').includes('·');
  const channelText = isPickup ? `استلام من ${order.address}` : 'توصيل منزلي سريّع';

  const itemsRows = (order.items || []).map((item, index) => {
    let prepDetails = item.selectedPrep || 'سليم';
    if (item.selectedSubOption) prepDetails += ` (${item.selectedSubOption})`;
    if (item.size) prepDetails += ` · حجم: ${item.size}`;
    const itemTotal = Math.round(item.price * item.quantity);

    return `
      <tr>
        <td style="text-align: center; font-weight: bold; padding: 7px 4px; border-bottom: 1px dashed #cbd5e1;">${index + 1}</td>
        <td style="padding: 7px 6px; border-bottom: 1px dashed #cbd5e1; font-weight: bold; color: #0f172a;">
          ${item.name}
          ${prepDetails ? `<div style="font-size: 11px; color: #2563eb; font-weight: normal; margin-top: 2px;">✂ التجهيز: ${prepDetails}</div>` : ''}
          ${item.note ? `<div style="font-size: 11px; color: #d97706; font-weight: normal; margin-top: 2px;">⚠ ملاحظة: ${item.note}</div>` : ''}
        </td>
        <td style="text-align: center; padding: 7px 4px; border-bottom: 1px dashed #cbd5e1; font-weight: bold;">
          ${item.quantity} ${item.unit || 'كيلو'}
        </td>
        <td style="text-align: center; padding: 7px 4px; border-bottom: 1px dashed #cbd5e1; color: #475569;">
          ${Math.round(item.price)}
        </td>
        <td style="text-align: left; padding: 7px 6px; border-bottom: 1px dashed #cbd5e1; font-weight: 900; color: #0f172a;">
          ${itemTotal.toLocaleString('ar-EG')} ج.م
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>فاتورة طلب #${order.id} - طيور الرشيدي</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    @media print {
      body { margin: 0; background: #fff !important; }
      .no-print { display: none !important; }
      .invoice-container { box-shadow: none !important; border: 1px solid #94a3b8 !important; }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, 'Rubik', sans-serif;
      margin: 20px auto;
      max-width: 780px;
      direction: rtl;
      text-align: right;
      color: #0f172a;
      background: #f8fafc;
      font-size: 13px;
      line-height: 1.5;
    }
    .invoice-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    .header {
      border-bottom: 2px solid #174a9c;
      padding-bottom: 14px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      color: #174a9c;
      margin: 0;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 3px;
    }
    .invoice-badge {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 6px 14px;
      border-radius: 8px;
      text-align: left;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 18px;
    }
    .info-item {
      margin: 3px 0;
    }
    .info-label {
      color: #64748b;
      font-size: 11px;
    }
    .info-val {
      font-weight: bold;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
    }
    th {
      background: #f1f5f9;
      color: #1e293b;
      font-size: 12px;
      font-weight: 900;
      padding: 9px 6px;
      border-bottom: 2px solid #cbd5e1;
    }
    .totals-box {
      margin-right: auto;
      width: 280px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 13px;
    }
    .total-grand {
      border-top: 2px dashed #cbd5e1;
      margin-top: 6px;
      padding-top: 8px;
      font-weight: 900;
      font-size: 16px;
      color: #174a9c;
    }
    .notice {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 10px 14px;
      color: #92400e;
      font-size: 11px;
      font-weight: bold;
      margin-top: 14px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      margin-top: 20px;
      padding-top: 12px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
    .print-actions {
      text-align: center;
      margin-bottom: 16px;
    }
    .btn-print {
      background: #174a9c;
      color: #fff;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="print-actions no-print">
    <button class="btn-print" onclick="window.print()">🖨️ طباعة الفاتورة الآن (Print)</button>
  </div>

  <div class="invoice-container">
    <div class="header">
      <div>
        <h1 class="brand-title">محل طيور الرشيدي 🍗</h1>
        <div class="brand-sub">أصل الدواجن الطازجة بالإسكندرية · جودة وتجهيز فوري منذ 1960</div>
      </div>
      <div class="invoice-badge">
        <div style="font-size: 18px; font-weight: 900; color: #174a9c;">طلب #${order.id}</div>
        <div style="font-size: 11px; color: #64748b;">${orderDate} - ${orderTime}</div>
      </div>
    </div>

    <div class="info-grid">
      <div>
        <div class="info-item"><span class="info-label">العميل:</span> <span class="info-val">${order.customer || 'عميل'}</span></div>
        <div class="info-item"><span class="info-label">الهاتف:</span> <span class="info-val">${order.phone || '—'}</span></div>
        <div class="info-item"><span class="info-label">العنوان:</span> <span class="info-val">${order.address || 'استلام من الفرع'}</span></div>
      </div>
      <div>
        <div class="info-item"><span class="info-label">قناة الطلب:</span> <span class="info-val">${channelText}</span></div>
        <div class="info-item"><span class="info-label">طريقة الدفع:</span> <span class="info-val">${order.payment || 'كاش عند الاستلام'}</span></div>
        <div class="info-item"><span class="info-label">موعد الاستلام:</span> <span class="info-val">${order.schedule || 'فوري'}</span></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 35px; text-align: center;">#</th>
          <th>الصنف والتجهيز</th>
          <th style="width: 80px; text-align: center;">الكمية</th>
          <th style="width: 75px; text-align: center;">سعر الكيلو</th>
          <th style="width: 95px; text-align: left;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
      <div style="flex: 1;">
        ${order.note ? `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; font-size: 12px;">
            <span style="font-weight: bold; color: #b45309;">ملاحظات خاصة من العميل:</span>
            <div style="margin-top: 3px; color: #334155;">${order.note}</div>
          </div>
        ` : ''}
        <div class="notice">
          ⚠ تنبيه: الأسعار تقريبية بناءً على الوزن المطلوب، ويتم الحساب النهائي بالوزن الفعلي الدقيق بالميزان عند التجهيز والتسليم.
        </div>
      </div>

      <div class="totals-box">
        <div class="total-row">
          <span style="color: #64748b;">قيمة المنتجات:</span>
          <span>${money(order.subtotal)}</span>
        </div>
        ${order.discount > 0 ? `
          <div class="total-row" style="color: #15803d;">
            <span>الخصم${order.couponCode ? ` (${order.couponCode})` : ''}:</span>
            <span>-${money(order.discount)}</span>
          </div>
        ` : ''}
        ${order.deliveryFee ? `
          <div class="total-row">
            <span style="color: #64748b;">خدمة التوصيل:</span>
            <span>+${money(order.deliveryFee)}</span>
          </div>
        ` : ''}
        <div class="total-row total-grand">
          <span>الإجمالي المطلوب:</span>
          <span>${money(order.total)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      طيور الرشيدي · الإسكندرية (كامب شيزار · سموحة · بحري) · خدمة العملاء: 01221111111 · شكراً لثقتكم واختياركم لنا!
    </div>
  </div>
</body>
</html>`;
}

export async function printFullOrder(order: Order): Promise<void> {
  const html = generateOrderInvoiceHtml(order);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=900');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 350);
        return;
      }
    } catch (e) {
      console.warn('Web popup blocked, falling back to iframe print', e);
    }

    // Fallback using invisible iframe
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        iframe.contentWindow?.focus();
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 2000);
        }, 300);
        return;
      }
    } catch (err) {
      console.warn('Iframe print failed', err);
    }
  }

  // Mobile / Fallback clipboard & share
  try {
    const textSlip = [
      `=== فاتورة طلب كاملة - طيور الرشيدي ===`,
      `طلب رقم: #${order.id}`,
      `العميل: ${order.customer || 'عميل'} (${order.phone || '—'})`,
      `العنوان: ${order.address || 'استلام من الفرع'}`,
      `الموعد: ${order.schedule} · طريقة الدفع: ${order.payment}`,
      `---------------------------------`,
      ...(order.items || []).map((it, i) => `${i + 1}. ${it.name} - ${it.quantity} ${it.unit} (${Math.round(it.price * it.quantity)} ج.م)\n   التجهيز: ${it.selectedPrep || 'سليم'}${it.selectedSubOption ? ` (${it.selectedSubOption})` : ''}`),
      `---------------------------------`,
      `قيمة المنتجات: ${money(order.subtotal)}`,
      order.discount > 0 ? `الخصم: -${money(order.discount)}` : null,
      order.deliveryFee ? `التوصيل: +${money(order.deliveryFee)}` : null,
      `الإجمالي النهائي: ${money(order.total)}`,
      `* الحساب النهائي بالوزن عند الاستلام`,
    ].filter(Boolean).join('\n');

    await Clipboard.setStringAsync(textSlip);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    Alert.alert('فاتورة الطلب الكاملة 🖨️', 'تم تجهيز ونسخ الفاتورة الكاملة للحافظة بنجاح، ويمكنك إرسالها للطابعة أو مشاركتها عبر واتساب.');
  } catch (e: any) {
    Alert.alert('طباعة الفاتورة', e?.message || 'تعذر استدعاء الطباعة');
  }
}
