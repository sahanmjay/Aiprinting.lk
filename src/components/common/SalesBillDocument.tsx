import React, { useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { formatLKR, formatItemPrice } from '../../lib/formatters';
import { calculateTotalItemQuantity } from '../../lib/delivery';
import { Order, SiteSettings } from '../../types';
import logoMark from '../../assets/logo-mark.png';

export const SalesBillDocument: React.FC<{ order: Order; settings: SiteSettings }> = ({
  order,
  settings,
}) => {
  const isPickup = order.deliveryMethod === 'pickup';
  const totalItemQty = order.totalQuantity || calculateTotalItemQuantity(order.items);
  const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return createPortal(
    <div className="sales-bill-doc hidden print:block text-[#2B2B2B] text-[12px] leading-relaxed">
      {/* Letterhead */}
      <div className="flex justify-between items-start border-b-4 border-[#0F1B2D] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <img src={logoMark} alt="" width={44} height={44} className="w-11 h-11 rounded-lg" />
            <div className="text-2xl font-bold text-[#0F1B2D]">
              {settings.siteName}
              <span className="text-[#D6342C]">.</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-600 mt-1">{settings.address}</div>
          <div className="text-[11px] text-slate-600">
            Hotline {settings.hotline} · Landline {settings.landline} · {settings.email}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold tracking-widest text-[#D6342C]">
            SALES BILL / INVOICE
          </div>
          <div className="font-mono font-bold text-base text-[#0F1B2D] mt-1">{order.orderNumber}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Date: <strong>{fmtDate(order.createdAt)}</strong>
          </div>
        </div>
      </div>

      {/* Customer & Delivery Method Details */}
      <div className="grid grid-cols-2 gap-6 py-5 border-b border-slate-200">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Billed To
          </div>
          <div className="font-bold text-sm text-[#0F1B2D]">{order.customerName}</div>
          <div className="text-[11px] text-slate-700">Phone: {order.customerPhone}</div>
          <div className="text-[11px] text-slate-700">Email: {order.customerEmail}</div>
        </div>

        <div className="bg-[#FAF8F5] p-3 rounded-sm border border-[#E6E0D6]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Delivery Method & Destination
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                isPickup
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-blue-100 text-blue-900 border border-blue-300'
              }`}
            >
              {isPickup ? '🏬 Customer Pickup (Shop Collection)' : '🚚 Island-Wide Courier Delivery'}
            </span>
          </div>

          {isPickup ? (
            <div className="text-[11px] text-slate-700 space-y-0.5">
              <div>
                <strong>Collection Location:</strong> {settings.address}
              </div>
              <div className="text-slate-500">
                Opening Hours: Mon–Sat 8:30 AM – 6:30 PM (Call: {settings.hotline})
              </div>
              <div className="text-emerald-700 font-semibold">Delivery Charge: Rs. 0.00 (Free Pickup)</div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-700 space-y-0.5">
              <div>
                <strong>Address:</strong> {order.deliveryAddress}, {order.city}
              </div>
              <div>
                <strong>District:</strong> {order.district} District
              </div>
              <div className="text-slate-500">Dispatched via standard courier service (1–2 days)</div>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="py-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y-2 border-[#0F1B2D] text-left text-[10px] uppercase tracking-wider">
              <th className="py-2 pr-2 w-8">#</th>
              <th className="py-2 pr-2">Item & Print Specifications</th>
              <th className="py-2 pr-2 text-center w-20">Quantity</th>
              <th className="py-2 pr-2 text-right w-28">Unit Price</th>
              <th className="py-2 text-right w-28">Total (LKR)</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => {
              const qty = item.quantity ?? 1;
              const unitPrice = item.unitPrice ?? (item.lineTotal ? item.lineTotal / qty : 0);
              const lineTotal = item.lineTotal ?? unitPrice * qty;

              return (
                <tr key={i} className="border-b border-slate-300 align-top">
                  <td className="py-2.5 pr-2 font-mono text-[11px]">{i + 1}</td>
                  <td className="py-2.5 pr-2">
                    <div className="font-bold text-[#0F1B2D]">{item.product.name}</div>
                    <div className="text-[11px] text-slate-600">
                      {item.selectedOptions.map((o) => `${o.groupName}: ${o.valueLabel}`).join(' · ')}
                    </div>
                    {item.artworkType === 'design' && (
                      <div className="text-[10px] text-amber-800 font-medium mt-0.5">
                        • Pre-press Graphic Design Service included
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 pr-2 text-center font-bold text-slate-700 whitespace-nowrap">
                    {qty}
                  </td>
                  <td className="py-2.5 pr-2 text-right whitespace-nowrap">
                    {unitPrice > 0 ? formatLKR(unitPrice) : 'To be confirmed'}
                  </td>
                  <td className="py-2.5 text-right font-bold text-[#0F1B2D] whitespace-nowrap">
                    {formatLKR(lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals & Financial Breakdown */}
      <div className="flex justify-between items-start pt-3 border-t border-slate-200">
        <div className="max-w-xs space-y-2 text-[11px] text-slate-600">
          <div>
            <strong>Payment Method:</strong>{' '}
            <span className="uppercase font-semibold text-[#0F1B2D]">
              {order.paymentMethod.replace('_', ' ')}
            </span>{' '}
            ({order.paymentStatus})
          </div>
          {order.specialInstructions && (
            <div>
              <strong>Order Notes:</strong> {order.specialInstructions}
            </div>
          )}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[10px]">
            <strong>Bank Account for Payments:</strong>
            <div>
              {settings.bankDetails.bankName} · {settings.bankDetails.branch}
            </div>
            <div>A/C: {settings.bankDetails.accountNumber} ({settings.bankDetails.accountName})</div>
          </div>
        </div>

        <div className="w-72 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-700">
            <span>Total Item Quantity</span>
            <span className="font-bold">{totalItemQty} unit(s)</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Items Subtotal</span>
            <span className="font-semibold">{formatLKR(order.subtotal)}</span>
          </div>

          <div className="flex justify-between text-slate-700">
            <span>
              Delivery Charge{' '}
              <span className="text-[10px] text-slate-500">
                ({isPickup ? 'Customer Pickup' : `Courier · ${totalItemQty} items`})
              </span>
            </span>
            <span className={`font-semibold ${isPickup ? 'text-emerald-700' : ''}`}>
              {isPickup ? 'Rs. 0.00' : formatLKR(order.deliveryFee)}
            </span>
          </div>

          {order.discountTotal && order.discountTotal > 0 ? (
            <div className="flex justify-between text-emerald-700">
              <span>Discounts Applied</span>
              <span>- {formatLKR(order.discountTotal)}</span>
            </div>
          ) : null}

          <div className="flex justify-between border-t-2 border-[#0F1B2D] pt-2 text-sm font-bold text-[#0F1B2D]">
            <span>Final Total Due</span>
            <span className="text-base text-[#D6342C]">{formatLKR(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Bill Footer */}
      <div className="mt-8 pt-3 border-t border-slate-300 text-[10px] text-slate-500 space-y-1">
        <div className="flex justify-between items-center">
          <div>Ai Printing Solutions · 11/A Gangarama Road, Werahara, Boralesgamuwa</div>
          <div>Thank you for choosing Ai Printing Solutions!</div>
        </div>
        <div className="text-center text-[9.5px] text-slate-400 pt-1">
          This is an official computer-generated sales bill and is valid without physical signature.
        </div>
      </div>
    </div>,
    document.body
  );
};

export function useSalesBillPrint(settings: SiteSettings) {
  const [order, setOrder] = useState<Order | null>(null);

  const printSalesBill = (nextOrder: Order) => {
    flushSync(() => setOrder(nextOrder));
    const prevTitle = document.title;
    document.title = `Sales Bill ${nextOrder.orderNumber} - ${settings.siteName}`;
    document.body.classList.add('printing-bill');
    window.addEventListener(
      'afterprint',
      () => {
        document.body.classList.remove('printing-bill');
        document.title = prevTitle;
      },
      { once: true }
    );
    window.print();
  };

  return {
    printSalesBill,
    salesBillDoc: order && <SalesBillDocument order={order} settings={settings} />,
  };
}
