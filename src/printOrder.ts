import { Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Order } from './models';
import { formatItemNaturalTitle } from './ui';

/**
 * Filter out default whole/intact preparations so "سليم" is NOT printed on the receipt.
 * Only print preparation if it involves actual cutting, deboning, skinning, or mincing.
 */
function getPrintablePrep(selectedPrep?: string, selectedSubOption?: string): string {
  let prep = (selectedPrep || '').trim();
  const sub = (selectedSubOption || '').trim();
  if (sub) {
    prep += prep ? ` — ${sub}` : sub;
  }
  if (!prep) return '';

  // If it's standard whole poultry without any custom cut/skin/debones, omit it
  const isPureWhole = /^(سليم|WHOLE|كامل|كاملة)(\s*[\(—\-].*[\)]?)?$/i.test(prep);
  const hasCustomCutOrWork = /قطع|تقطيع|مقطع|خلي|مخلى|مخلي|سلخ|مسلوخ|مفروم|بانيه|شيش|نصف|تبل|تتبيل/i.test(prep);

  if (isPureWhole && !hasCustomCutOrWork) {
    return '';
  }

  return prep;
}

export function generateOrderInvoiceHtml(order: Order): string {
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' })
    : '—';
  const orderTime = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const isPickup = (order.address || '').includes('فرع') && !(order.address || '').includes('·');
  const channelText = isPickup ? `استلام: ${order.address}` : 'توصيل منزلي';

  const itemsHtml = (order.items || []).map((item) => {
    const prepDetails = getPrintablePrep(item.selectedPrep, item.selectedSubOption);

    return `
      <div class="item-row">
        <div class="item-top">
          <span class="item-title"><strong>- ${formatItemNaturalTitle(item)}</strong></span>
        </div>
        ${prepDetails ? `<div class="item-prep">✂️ التجهيز: ${prepDetails}</div>` : ''}
        ${item.note ? `<div class="item-note">⚠ ملاحظة: ${item.note}</div>` : ''}
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>بون #${order.orderNumber || order.id} - طيور الرشيدي</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 1mm 2mm;
    }
    @media print {
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        color: #000 !important;
        width: 76mm !important;
        max-width: 76mm !important;
        font-size: 11.5px !important;
      }
      .no-print { display: none !important; }
      .thermal-receipt {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      .item-row {
        page-break-inside: avoid;
      }
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, 'Cairo', Arial, sans-serif;
      margin: 8px auto;
      width: 76mm;
      max-width: 310px;
      direction: rtl;
      text-align: right;
      color: #000;
      background: #f1f5f9;
      font-size: 12px;
      line-height: 1.35;
    }
    .thermal-receipt {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 8px 6px;
      margin: 0 auto;
    }
    /* Compact Header */
    .receipt-header {
      border-bottom: 1.5px dashed #000;
      padding-bottom: 5px;
      margin-bottom: 5px;
    }
    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-name {
      font-size: 17px;
      font-weight: 900;
      color: #000;
    }
    .order-badge {
      font-size: 14px;
      font-weight: 900;
      background: #000;
      color: #fff;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .header-sub {
      font-size: 10.5px;
      color: #222;
      margin-top: 2px;
      display: flex;
      justify-content: space-between;
    }
    /* Compact 2-Column Info Table */
    .info-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
      margin-bottom: 5px;
      border-bottom: 1px dashed #000;
      padding-bottom: 4px;
    }
    .info-table td {
      padding: 2px 0;
      vertical-align: top;
    }
    .lbl {
      font-weight: bold;
      color: #000;
      margin-left: 3px;
    }
    .val-left {
      text-align: left;
    }
    .order-address {
      font-size: 11px;
      line-height: 1.25;
      padding-top: 1px;
    }
    .order-note-row {
      background: #f8fafc;
      border: 1px dashed #000;
      padding: 3px 5px;
      margin-top: 3px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: bold;
    }
    /* Items Section */
    .section-title {
      font-size: 12px;
      font-weight: 900;
      text-align: center;
      margin: 3px 0 4px 0;
      letter-spacing: 0.5px;
    }
    .items-container {
      border-top: 1px dashed #000;
    }
    .item-row {
      border-bottom: 1px dotted #666;
      padding: 5px 0;
    }
    .item-row:last-child {
      border-bottom: none;
    }
    .item-top {
      display: flex;
      justify-content: flex-start;
      align-items: baseline;
      font-size: 13.5px;
    }
    .item-title {
      font-weight: 900;
      color: #000;
    }
    .item-prep {
      font-size: 11.5px;
      font-weight: bold;
      color: #111;
      margin-top: 2px;
      padding-right: 8px;
    }
    .item-note {
      font-size: 10.5px;
      color: #222;
      margin-top: 1px;
      padding-right: 8px;
    }
    .receipt-cutoff {
      border-bottom: 2px dashed #000;
      margin-top: 8px;
    }
    .print-actions {
      text-align: center;
      margin-bottom: 8px;
    }
    .btn-print {
      width: 100%;
      background: #174a9c;
      color: #fff;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      font-weight: 900;
      font-size: 13.5px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="print-actions no-print">
    <button class="btn-print" onclick="window.print()">🖨️ طباعة بون التجهيز الآن (Xprinter 80mm)</button>
  </div>

  <div class="thermal-receipt">
    <!-- Compact Header -->
    <div class="receipt-header">
      <div class="header-main">
        <span class="brand-name">طيور الرشيدي 🍗</span>
        <span class="order-badge">طلب #${order.orderNumber || order.id}</span>
      </div>
      <div class="header-sub">
        <span>بون تجهيز الطلب</span>
        <span>${orderDate} · ${orderTime}</span>
      </div>
    </div>

    <!-- Compact Info Grid -->
    <table class="info-table">
      <tr>
        <td><span class="lbl">العميل:</span><strong>${order.customer || 'عميل'}</strong></td>
        <td class="val-left"><span class="lbl">هاتف:</span><strong dir="ltr">${order.phone || '—'}</strong></td>
      </tr>
      <tr>
        <td><span class="lbl">الطلب:</span>${channelText}</td>
        <td class="val-left"><span class="lbl">الموعد:</span>${order.schedule || 'فوري'}</td>
      </tr>
      ${order.address && !isPickup ? `
      <tr>
        <td colspan="2" class="order-address"><span class="lbl">العنوان:</span>${order.address}</td>
      </tr>
      ` : ''}
      <tr>
        <td colspan="2"><span class="lbl">الدفع:</span>${order.payment || 'كاش عند الاستلام'}</td>
      </tr>
      ${order.note ? `
      <tr>
        <td colspan="2">
          <div class="order-note-row">⚠ ملاحظة: ${order.note}</div>
        </td>
      </tr>
      ` : ''}
    </table>

    <!-- Items Section Header -->
    <div class="section-title">أصناف التجهيز (${order.items?.length || 0})</div>

    <!-- Items List -->
    <div class="items-container">
      ${itemsHtml}
    </div>

    <!-- Clean Cutoff Border -->
    <div class="receipt-cutoff"></div>
  </div>
</body>
</html>`;
}

export async function printFullOrder(order: Order): Promise<void> {
  const html = generateOrderInvoiceHtml(order);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const printWindow = window.open('', '_blank', 'width=380,height=600');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 300);
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
        }, 250);
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
    const channelText = isPickup ? `استلام: ${order.address}` : 'توصيل منزلي';

    const textSlip = [
      `=== طيور الرشيدي 🍗 ===`,
      `طلب #${order.orderNumber || order.id} [${orderDate} ${orderTime}]`,
      `العميل: ${order.customer || 'عميل'} | ${order.phone || '—'}`,
      `الطلب: ${channelText} · ${order.schedule || 'فوري'}`,
      order.address && !isPickup ? `العنوان: ${order.address}` : null,
      order.note ? `ملاحظة: ${order.note}` : null,
      `--------------------------------`,
      `الأصناف والتجهيز:`,
      ...(order.items || []).map((it) => {
        const prep = getPrintablePrep(it.selectedPrep, it.selectedSubOption);
        return [
          `- ${formatItemNaturalTitle(it)}`,
          prep ? `   ✂️ التجهيز: ${prep}` : null,
          it.note ? `   ⚠ ملاحظة: ${it.note}` : null,
        ].filter(Boolean).join('\n');
      }),
      `================================`,
    ].filter(Boolean).join('\n');

    await Clipboard.setStringAsync(textSlip);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    Alert.alert(
      'بون تجهيز الطلب (Xprinter 80mm) 🖨️',
      'تم تجهيز ونسخ بون الأصناف بنجاح بدون أسعار، وهو جاهز للطباعة المباشرة على طابعة البون الحرارية.'
    );
  } catch (e: any) {
    Alert.alert('طباعة البون', e?.message || 'تعذر استدعاء الطباعة');
  }
}
