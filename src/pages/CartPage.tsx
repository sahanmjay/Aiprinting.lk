import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck, FileCheck, Truck, ChevronLeft } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatLKR, formatItemPrice } from '../lib/formatters';

export const CartPage: React.FC = () => {
  const { cart, removeFromCart, cartSubtotal, cartTotal, siteSettings } = useStore();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-white border border-[#E6E0D6] flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1B2D]">Your Print Cart is Empty</h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            You haven't configured any print items yet. Explore our commercial visiting cards, bill books, and marketing materials.
          </p>
        </div>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F1B2D] hover:bg-[#182A45] text-white font-bold text-xs rounded transition-colors shadow-sm"
        >
          <span>Browse Print Catalogue</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-[#E6E0D6] pb-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">
            Review Order
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1B2D]">
            Shopping Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
          </h1>
        </div>
        <Link
          to="/shop"
          className="text-xs font-semibold text-slate-600 hover:text-[#0F1B2D] flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-lg border border-[#E6E0D6] shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex gap-4 items-start">
                  <div className="w-20 h-20 rounded bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                    <img
                      src={item.product.images[0]?.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-[#0F1B2D] leading-snug">
                      {item.product.name}
                    </h3>
                    <div className="text-xs text-slate-500 font-medium">
                      Unit price: {formatLKR(item.unitPrice)} / card
                    </div>
                  </div>
                </div>

                <div className="text-right sm:self-start">
                  <div className="text-lg font-bold text-[#0F1B2D]">
                    {formatItemPrice(item)}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-xs text-red-600 hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* Selected Options Tag Matrix */}
              <div className="bg-[#FAF8F5] p-3 rounded border border-[#E6E0D6] flex flex-wrap gap-2 text-xs">
                {item.selectedOptions.map((opt, idx) => (
                  <span
                    key={idx}
                    className="bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-700"
                  >
                    <strong className="text-[#0F1B2D]">{opt.groupName}:</strong> {opt.valueLabel}
                  </span>
                ))}
                <span className="bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-700">
                  <strong className="text-[#0F1B2D]">Artwork:</strong>{' '}
                  {item.artworkType === 'design'
                    ? 'Design Service (+Rs. 500)'
                    : `${item.artworkFiles.length} file(s) attached`}
                </span>
              </div>

              {/* Special instructions display */}
              {item.specialInstructions && (
                <div className="text-[11px] text-slate-600 italic bg-amber-50/60 p-2 rounded border border-amber-200/50">
                  <strong>Notes:</strong> {item.specialInstructions}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Order Summary Box */}
        <div className="lg:col-span-4 bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-6">
          <h3 className="font-bold text-base text-[#0F1B2D] border-b border-[#E6E0D6] pb-3">
            Order Summary
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">{formatLKR(cartSubtotal)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#D6342C]" />
                <span>Island-Wide Delivery (1–2 Days)</span>
              </span>
              <span className="font-semibold text-slate-900">
                {formatLKR(siteSettings.deliveryFee)}
              </span>
            </div>

            <div className="pt-3 border-t border-[#E6E0D6] flex justify-between items-baseline">
              <span className="text-sm font-bold text-[#0F1B2D]">Total Due (LKR)</span>
              <span className="text-xl font-bold text-[#D6342C]">{formatLKR(cartTotal)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-3.5 bg-[#D6342C] hover:bg-[#B8251E] text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Proceed to Single-Page Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="p-3 bg-[#FAF8F5] rounded border border-[#E6E0D6] space-y-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-[#0F1B2D]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Commercial Guarantee</span>
            </div>
            <p>
              Pre-press digital proofs sent for WhatsApp approval before printing starts. 100% reprint or refund guarantee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
