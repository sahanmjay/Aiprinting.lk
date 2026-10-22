import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck, Truck, ChevronLeft, Store, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatLKR, formatItemPrice } from '../lib/formatters';

export const CartPage: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateCartItemQuantity,
    cartTotalQuantity,
    cartSubtotal,
    cartDeliveryFee,
    cartDeliveryCalculation,
    cartTotal,
    deliveryMethod,
    setDeliveryMethod,
  } = useStore();
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
            Shopping Cart ({cart.length} {cart.length === 1 ? 'line' : 'lines'} · {cartTotalQuantity} {cartTotalQuantity === 1 ? 'item' : 'items'})
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
                      Unit price: {formatLKR(item.unitPrice)} / piece
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-600">Quantity:</span>
                      <div className="inline-flex items-center border border-[#E6E0D6] rounded bg-[#FAF8F5]">
                        <button
                          type="button"
                          onClick={() => updateCartItemQuantity(item.id, (item.quantity ?? 1) - 1)}
                          disabled={(item.quantity ?? 1) <= 1}
                          className="px-2.5 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity ?? 1}
                          onChange={(e) => updateCartItemQuantity(item.id, parseInt(e.target.value, 10) || 1)}
                          className="w-11 text-center text-xs font-bold text-[#0F1B2D] py-0.5 bg-white border-x border-[#E6E0D6] focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => updateCartItemQuantity(item.id, (item.quantity ?? 1) + 1)}
                          className="px-2.5 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        ({(item.quantity ?? 1)} × {item.selectedOptions.find((o) => /quantity|set/i.test(o.groupName))?.valueLabel || 'set'})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right sm:self-start">
                  <div className="text-lg font-bold text-[#0F1B2D]">
                    {formatItemPrice(item)}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-xs text-red-600 hover:underline inline-flex items-center gap-1 mt-1 font-semibold"
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
                    ? `Design Service (+${formatLKR(
                        item.selectedAddons?.find((a) => a.id === 'addon-design')?.price ??
                          item.product?.artworkFee ??
                          500
                      )})`
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
          <h3 className="font-bold text-base text-[#0F1B2D] border-b border-[#E6E0D6] pb-3 uppercase tracking-wider">
            Order Summary
          </h3>

          {/* Delivery Method Selection Toggle */}
          <div className="space-y-1.5">
            <span className="font-bold text-xs text-[#0F1B2D] block">Delivery Method:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod('delivery')}
                className={`p-3 rounded border text-left transition-all ${
                  deliveryMethod === 'delivery'
                    ? 'border-[#0F1B2D] bg-[#0F1B2D]/5 font-bold text-[#0F1B2D] ring-1 ring-[#0F1B2D]'
                    : 'border-[#E6E0D6] text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#D6342C]" />
                  <span className="text-xs">Delivery</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal block mt-1">Courier to your door</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                className={`p-3 rounded border text-left transition-all ${
                  deliveryMethod === 'pickup'
                    ? 'border-[#0F1B2D] bg-[#0F1B2D]/5 font-bold text-[#0F1B2D] ring-1 ring-[#0F1B2D]'
                    : 'border-[#E6E0D6] text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs">Pickup</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold block mt-1">FREE · Werahara Shop</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 text-xs pt-1">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">{formatLKR(cartSubtotal)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Total Item Quantity</span>
              <span className="font-semibold text-slate-900">{cartTotalQuantity} {cartTotalQuantity === 1 ? 'item' : 'items'}</span>
            </div>

            <div className="flex justify-between text-slate-600 items-baseline">
              <span className="flex items-center gap-1">
                {deliveryMethod === 'pickup' ? (
                  <>
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Customer Pickup</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-3.5 h-3.5 text-[#D6342C]" />
                    <span>Delivery Charge</span>
                  </>
                )}
              </span>
              <span className="font-semibold text-slate-900">
                {deliveryMethod === 'pickup' ? (
                  <span className="text-emerald-700 font-bold">Rs. 0.00 (Free)</span>
                ) : cartDeliveryCalculation.isValid ? (
                  formatLKR(cartDeliveryFee)
                ) : (
                  <span className="text-red-600 font-bold">Rate Unavailable</span>
                )}
              </span>
            </div>

            {deliveryMethod === 'delivery' && cartDeliveryCalculation.matchedRule && (
              <div className="text-[11px] text-slate-500 bg-[#FAF8F5] p-2 rounded border border-[#E6E0D6]">
                Applied Tier: {cartDeliveryCalculation.matchedRule.minQty}–{cartDeliveryCalculation.matchedRule.maxQty} items @ {formatLKR(cartDeliveryCalculation.matchedRule.charge)}
              </div>
            )}

            {deliveryMethod === 'delivery' && !cartDeliveryCalculation.isValid && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{cartDeliveryCalculation.errorMessage}</span>
              </div>
            )}

            <div className="pt-3 border-t border-[#E6E0D6] flex justify-between items-baseline">
              <span className="text-sm font-bold text-[#0F1B2D]">Total Due (LKR)</span>
              <span className="text-xl font-bold text-[#D6342C]">{formatLKR(cartTotal)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            disabled={deliveryMethod === 'delivery' && !cartDeliveryCalculation.isValid}
            className="w-full py-3.5 bg-[#D6342C] hover:bg-[#B8251E] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Proceed to Checkout</span>
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

