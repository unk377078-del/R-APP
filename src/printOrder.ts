import { Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Order } from './models';

export function generateOrderInvoiceHtml(order: Order): string {
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' })
    : '—';
  const orderTime = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const isPickup = (order.address || '').includes('فرع') && !(order.address || '').includes('·');
  const channelText = isPickup ? `استلام من ${order.address}` : 'توصيل منزلي سريّع';

  const itemsHtml = (order.items || []).map((item, index) => {
    let prepDetails = item.selectedPrep || '';
    if (item.selectedSubOption) prepDetails += prepDetails ? ` — ${item.selectedSubOption}` : item.selectedSubOption;

    return `
      <div class="item-block">
        <div class="item-header">
          <span class="item-num">#${index + 1}</span>
          <span class="item-name">${item.name}</span>
        </div>
        <div class="item-line">
          الكمية المطلوبة: <strong>${item.quantity} ${item.unit || 'كيلو'}</strong>
          ${item.size ? `<span class="item-size">· حجم: <strong>${item.size}</strong></span>` : ''}
        </div>
        ${prepDetails ? `
          <div class="item-prep">
            ✂️ <strong>التجهيز:</strong> ${prepDetails}
          </div>
        ` : ''}
        ${item.note ? `
          <div class="item-note">
            ⚠ <strong>ملاحظة الصنف:</strong> ${item.note}
          </div>
        ` : ''}
        <div class="item-weight-box">
          <span>الوزن الصافي بالميزان:</span>
          <span class="weight-line">[ ........................ كجم ]</span>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>بون تجهيز وميزان طلب #${order.orderNumber || order.id} - طيور الرشيدي</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 2mm 3mm;
    }
    @media print {
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        color: #000 !important;
        width: 76mm !important;
        max-width: 76mm !important;
        font-size: 12.5px !important;
      }
      .no-print { display: none !important; }
      .thermal-receipt {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      .item-block {
        page-break-inside: avoid;
      }
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, 'Cairo', Arial, sans-serif;
      margin: 12px auto;
      width: 76mm;
      max-width: 320px;
      direction: rtl;
      text-align: right;
      color: #000;
      background: #f1f5f9;
      font-size: 13px;
      line-height: 1.45;
    }
    .thermal-receipt {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 12px 10px;
      margin: 0 auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .receipt-header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .brand-title {
      font-size: 21px;
      font-weight: 900;
      margin: 0;
      color: #000;
    }
    .brand-subtitle {
      font-size: 11.5px;
      font-weight: 700;
      margin-top: 2px;
      color: #111;
    }
    .order-badge {
      display: inline-block;
      margin-top: 6px;
      padding: 4px 12px;
      border: 2px solid #000;
      border-radius: 6px;
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }
    .receipt-meta {
      border-bottom: 1.5px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
      font-size: 12px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
    }
    .meta-label {
      font-weight: bold;
      color: #000;
    }
    .meta-val {
      font-weight: normal;
      color: #000;
      text-align: left;
      max-width: 65%;
      word-break: break-word;
    }
    .note-box {
      border: 1.5px dashed #000;
      padding: 6px 8px;
      border-radius: 4px;
      margin: 6px 0;
      font-weight: bold;
      font-size: 11.5px;
      background: #fafafa;
    }
    .section-title {
      font-size: 13.5px;
      font-weight: 900;
      text-align: center;
      background: #000;
      color: #fff;
      padding: 4px 0;
      margin: 8px 0;
      border-radius: 3px;
    }
    .item-block {
      border-bottom: 1px dashed #000;
      padding: 8px 0;
    }
    .item-header {
      display: flex;
      align-items: center;
      justifyContent: flex-start;
      gap: 6px;
      margin-bottom: 3px;
    }
    .item-num {
      font-weight: 900;
      font-size: 14px;
    }
    .item-name {
      font-size: 15px;
      font-weight: 900;
      color: #000;
    }
    .item-line {
      font-size: 12.5px;
      margin: 2px 0;
    }
    .item-size {
      margin-right: 4px;
    }
    .item-prep {
      font-size: 12px;
      margin: 3px 0;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 3px 6px;
      border-radius: 4px;
      color: #000;
    }
    .item-note {
      font-size: 11.5px;
      margin: 3px 0;
      color: #000;
    }
    .item-weight-box {
      margin-top: 6px;
      padding-top: 5px;
      border-top: 1px dotted #888;
      display: flex;
      justifyContent: space-between;
      align-items: center;
      font-size: 12px;
      font-weight: bold;
    }
    .weight-line {
      font-family: monospace;
      letter-spacing: 1px;
    }
    .prep-summary {
      border-top: 1.5px dashed #000;
      border-bottom: 1.5px dashed #000;
      padding: 8px 0;
      margin: 10px 0;
      text-align: center;
    }
    .prep-notice {
      font-weight: 900;
      font-size: 12px;
      line-height: 1.5;
    }
    .signatures {
      display: flex;
      justify-content: space-around;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px dotted #888;
      font-weight: bold;
      font-size: 11.5px;
    }
    .receipt-footer {
      text-align: center;
      margin-top: 6px;
      font-size: 11px;
      color: #333;
    }
    .print-actions {
      text-align: center;
      margin-bottom: 10px;
    }
    .btn-print {
      width: 100%;
      background: #174a9c;
      color: #fff;
      border: none;
      padding: 10px 14px;
      border-radius: 8px;
      font-weight: 900;
      font-size: 14px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="print-actions no-print">
    <button class="btn-print" onclick="window.print()">🖨️ طباعة بون التجهيز الآن (Xprinter 80mm)</button>
  </div>

  <div class="thermal-receipt">
    {/* Receipt Header */}
    <div class="receipt-header">
      <h1 class="brand-title">طيور الرشيدي 🍗</h1>
      <div class="brand-subtitle">بون تجهيز وميزان الدواجن الطازجة</div>
      <div class="order-badge">طلب #${order.orderNumber || order.id}</div>
    </div>

    {/* Order & Customer Metadata */}
    <div class="receipt-meta">
      <div class="meta-row">
        <span class="meta-label">التاريخ والوقت:</span>
        <span class="meta-val">${orderDate} — ${orderTime}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">العميل:</span>
        <span class="meta-val"><strong>${order.customer || 'عميل'}</strong></span>
      </div>
      <div class="meta-row">
        <span class="meta-label">الهاتف:</span>
        <span class="meta-val" dir="ltr">${order.phone || '—'}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">قناة الاستلام:</span>
        <span class="meta-val"><strong>${channelText}</strong></span>
      </div>
      <div class="meta-row">
        <span class="meta-label">الموعد:</span>
        <span class="meta-val">${order.schedule || 'فوري'}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">العنوان:</span>
        <span class="meta-val">${order.address || 'استلام من الفرع'}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">طريقة الدفع:</span>
        <span class="meta-val">${order.payment || 'كاش عند الاستلام'}</span>
      </div>
      ${order.note ? `
        <div class="note-box">
          ⚠ ملاحظات عامة للطلب: ${order.note}
        </div>
      ` : ''}
    </div>

    {/* Items Section Header */}
    <div class="section-title">
      أصناف التجهيز والتقطيع (${order.items?.length || 0})
    </div>

    {/* Items List */}
    <div class="items-container">
      ${itemsHtml}
    </div>

    {/* Prep Summary & Signature - NO PRICES, SCALE WEIGHT DETERMINATION */}
    <div class="prep-summary">
      <div class="prep-notice">
        ✦ بون تجهيز وتحضير داخلي ✦<br>
        الحساب النهائي يُحدد بالوزن الصافي الدقيق بالميزان
      </div>
      <div class="signatures">
        <div>تجهيز: ....................</div>
        <div>ميزان: ....................</div>
      </div>
    </div>

    {/* Footer */}
    <div class="receipt-footer">
      طيور الرشيدي · الإسكندرية منذ ١٩٦٠<br>
      خدمة العملاء: 01223381405 · شكراً لثقتكم!
    </div>
  </div>
</body>
</html>`;
}

export async function printFullOrder(order: Order): Promise<void> {
  const html = generateOrderInvoiceHtml(order);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const printWindow = window.open('', '_blank', 'width=420,height=750');
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

  // Mobile / Fallback clipboard & thermal printer share
  try {
    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' })
      : '—';
    const orderTime = order.createdAt
      ? new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      : '—';
    const isPickup = (order.address || '').includes('فرع') && !(order.address || '').includes('·');
    const channelText = isPickup ? `استلام من ${order.address}` : 'توصيل منزلي';

    const textSlip = [
      `================================`,
      `        طيور الرشيدي 🍗        `,
      `    بون تجهيز وميزان الدواجن    `,
      `================================`,
      `طلب رقم: #${order.orderNumber || order.id}`,
      `التاريخ: ${orderDate} - ${orderTime}`,
      `الاستلام: ${channelText} · ${order.schedule || 'فوري'}`,
      `العميل: ${order.customer || 'عميل'}`,
      `الهاتف: ${order.phone || '—'}`,
      `العنوان: ${order.address || 'استلام من الفرع'}`,
      `طريقة الدفع: ${order.payment || 'كاش عند الاستلام'}`,
      order.note ? `⚠ ملاحظات العميل: ${order.note}` : null,
      `--------------------------------`,
      `قائمة الأصناف للتجهيز والوزن:`,
      `--------------------------------`,
      ...(order.items || []).map((it, i) => [
        `[${i + 1}] ${it.name}`,
        `   • الكمية: ${it.quantity} ${it.unit || 'كيلو'}${it.size ? ` (حجم: ${it.size})` : ''}`,
        it.selectedPrep ? `   • التجهيز: ${it.selectedPrep}${it.selectedSubOption ? ` — ${it.selectedSubOption}` : ''}` : null,
        it.note ? `   • ملاحظة الصنف: ${it.note}` : null,
        `   [ الوزن الفعلي الصافي: ........... كجم ]`,
      ].filter(Boolean).join('\n')),
      `--------------------------------`,
      `✦ الحساب بالوزن الدقيق الصافي بالميزان ✦`,
      `تجهيز: ............  ميزان: ............`,
      `طيور الرشيدي · الإسكندرية منذ ١٩٦٠`,
      `================================`,
    ].filter(Boolean).join('\n');

    await Clipboard.setStringAsync(textSlip);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    Alert.alert(
      'بون التجهيز والميزان (Xprinter 80mm) 🖨️',
      'تم تجهيز ونسخ بون الأصناف والميزان بنجاح بدون أسعار، وهو جاهز للطباعة المباشرة على طابعة البون الحرارية أو عبر طابعات البلوتوث.'
    );
  } catch (e: any) {
    Alert.alert('طباعة البون', e?.message || 'تعذر استدعاء الطباعة');
  }
}
