import React, { useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, MessageCircle, PackageCheck, Printer, ArrowRight, Download, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatLKR, getWhatsAppUrl } from '../lib/formatters';
import confetti from 'canvas-confetti';

export const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getOrderById, siteSettings } = useStore();

  const order = getOrderById(id || '');
  // Set by the PayHere return_url / cancel_url
  const payment = useSearchParams()[0].get('payment');

  useEffect(() => {
    // Fire celebratory confetti on load
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0F1B2D', '#D6342C', '#00A3E0', '#FFD100'],
      });
    } catch {
      // safe fallback
    }
  }, []);

  if (!order) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#0F1B2D]">Order Details Loaded</h2>
        <p className="text-xs text-slate-600">
          Thank you for your order. If your session was refreshed, search your order using your order number on the account page.
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 bg-[#0F1B2D] text-white text-xs font-bold rounded"
        >
          Return to Homepage
        </Link>
      </div>
    );
  }

  const followUpWhatsAppMsg = `Hi Ai Printing Solutions! I've placed order *${order.orderNumber}* for ${order.customerName}.\n\nTotal: ${formatLKR(order.total)} (${order.paymentMethod.toUpperCase()})\nCould you please confirm the digital proof and production schedule? Thank you!`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
      {payment === 'return' && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm rounded">
          <strong>Payment submitted.</strong> PayHere is confirming it with us — your order will show as paid shortly.
        </div>
      )}
      {payment === 'cancelled' && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 text-sm rounded">
          <strong>Online payment was cancelled.</strong> Your order is saved — you can pay by bank transfer, or WhatsApp us and we will help.
        </div>
      )}

      {/* Top Success Banner */}
      <div className="bg-white rounded-lg border-2 border-emerald-500/40 p-8 text-center space-y-4 shadow-sm relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Order Received & Confirmed
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0F1B2D]">
            Thank You, {order.customerName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Your print order has been registered into our prepress production queue. An automated confirmation has been logged.
          </p>
        </div>

        {/* Order Number Box */}
        <div className="inline-block bg-[#FAF8F5] border border-[#E6E0D6] px-6 py-3 rounded-lg">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Your Official Order Number
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#D6342C] tracking-wide font-mono mt-0.5">
            {order.orderNumber}
          </div>
        </div>

        {/* WhatsApp Follow-up CTA */}
        <div className="pt-2 max-w-md mx-auto">
          <a
            href={getWhatsAppUrl(siteSettings.whatsapp, followUpWhatsAppMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Connect on WhatsApp for Quick Proofing</span>
          </a>
        </div>
      </div>

      {/* Order Details & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer & Delivery Summary */}
        <div className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#0F1B2D] border-b border-[#E6E0D6] pb-2 uppercase tracking-wider">
            Delivery Information
          </h3>

          <div className="space-y-2 text-xs text-slate-700">
            <div><strong>Recipient:</strong> {order.customerName}</div>
            <div><strong>Telephone:</strong> {order.customerPhone}</div>
            <div><strong>Email:</strong> {order.customerEmail}</div>
            <div><strong>Delivery Address:</strong> {order.deliveryAddress}, {order.city}</div>
            <div><strong>District:</strong> {order.district} District</div>
            <div><strong>Estimated Delivery:</strong> 1–2 Working Days (Courier Dispatch)</div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Payment Selected:</span>{' '}
            <strong className="uppercase text-[#0F1B2D]">{order.paymentMethod.replace('_', ' ')}</strong>{' '}
            ({order.paymentStatus})
          </div>
        </div>

        {/* Production Pipeline Indicator */}
        <div className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#0F1B2D] border-b border-[#E6E0D6] pb-2 uppercase tracking-wider flex items-center justify-between">
            <span>Production Workflow</span>
            <Clock className="w-4 h-4 text-[#D6342C]" />
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-700 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>1. Order Placed & Logged</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span>2. Pre-Press File Inspection & Proofing</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span>3. Commercial Press Printing & Die Cutting</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span>4. Quality Packing & Courier Dispatch</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 leading-relaxed">
            * Have high-res artwork over 25MB? Send it to <strong>{siteSettings.artworkEmail}</strong> mentioning <strong>{order.orderNumber}</strong> in the subject line.
          </p>
        </div>
      </div>

      {/* Ordered Items Breakdown */}
      <div className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-[#0F1B2D] border-b border-[#E6E0D6] pb-2 uppercase tracking-wider">
          Items in this Order
        </h3>

        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 flex justify-between items-start text-xs">
              <div className="space-y-1">
                <div className="font-bold text-[#0F1B2D] text-sm">{item.product.name}</div>
                <div className="text-slate-600">
                  {item.selectedOptions.map((o) => `${o.groupName}: ${o.valueLabel}`).join(' · ')}
                </div>
                <div className="text-[11px] text-slate-500">
                  {item.artworkType === 'design'
                    ? 'Artwork Design Service (+Rs. 500)'
                    : `${item.artworkFiles.length} file(s) attached`}
                </div>
              </div>

              <div className="text-right font-bold text-sm text-[#0F1B2D]">
                {formatLKR(item.lineTotal)}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#E6E0D6] space-y-1 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span>{formatLKR(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Delivery Fee:</span>
            <span>{formatLKR(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-[#0F1B2D] pt-2 border-t border-[#E6E0D6]">
            <span>Total Paid / Due:</span>
            <span className="text-[#D6342C]">{formatLKR(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <Link
          to="/shop"
          className="px-6 py-2.5 bg-[#0F1B2D] text-white text-xs font-bold rounded hover:bg-[#182A45] transition-colors"
        >
          Explore More Products
        </Link>
      </div>
    </div>
  );
};
