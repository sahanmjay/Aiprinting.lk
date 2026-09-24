import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck, FileCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatLKR, formatItemPrice } from '../../lib/formatters';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, cartSubtotal, cartTotal, siteSettings } = useStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="animate-in slide-in-from-right duration-300 w-screen max-w-md bg-[#FAF8F5] border-l border-[#E6E0D6] shadow-2xl flex flex-col">
          {/* Top Header */}
          <div className="p-4 border-b border-[#E6E0D6] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D6342C]" />
              <h3 className="font-bold text-[#0F1B2D] text-base">Your Print Cart</h3>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-[#0F1B2D] mb-1">Your cart is empty</h4>
                <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
                  Configure your business cards, bill books or custom prints to add items to your cart.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/shop');
                  }}
                  className="px-4 py-2 bg-[#0F1B2D] text-white text-xs font-semibold rounded hover:bg-[#182A45] transition-colors"
                >
                  Browse Catalogue
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3.5 rounded border border-[#E6E0D6] shadow-xs relative space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#0F1B2D] leading-snug">
                        {item.product.name}
                      </h4>
                      <div className="text-xs text-[#D6342C] font-semibold mt-0.5">
                        {formatItemPrice(item)}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Selected Options Badges */}
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {item.selectedOptions.map((opt, idx) => (
                      <span
                        key={idx}
                        className="bg-[#FAF8F5] border border-[#E6E0D6] text-slate-700 px-2 py-0.5 rounded"
                      >
                        <strong>{opt.groupName}:</strong> {opt.valueLabel}
                      </span>
                    ))}
                  </div>

                  {/* Artwork status */}
                  <div className="text-[11px] flex items-center gap-1.5 text-slate-600 pt-1 border-t border-slate-100">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {item.artworkType === 'design'
                        ? 'Design Service Requested (+Rs. 500)'
                        : `${item.artworkFiles.length} file(s) attached`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Subtotal & Checkout */}
          {cart.length > 0 && (
            <div className="p-4 bg-white border-t border-[#E6E0D6] space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">{formatLKR(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Island-Wide Delivery</span>
                  <span className="font-semibold text-slate-800">
                    {formatLKR(siteSettings.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#0F1B2D] pt-2 border-t border-[#E6E0D6]">
                  <span>Total (LKR)</span>
                  <span className="text-[#D6342C]">{formatLKR(cartTotal)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    navigate('/cart');
                  }}
                  className="w-full py-2.5 px-3 border border-[#0F1B2D] text-[#0F1B2D] text-xs font-semibold rounded hover:bg-slate-50 transition-colors"
                >
                  View Cart
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/checkout');
                  }}
                  className="w-full py-2.5 px-3 bg-[#D6342C] hover:bg-[#B8251E] text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Satisfaction or Free Reprint Guarantee</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
