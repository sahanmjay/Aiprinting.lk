import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Building2,
  Banknote,
  UploadCloud,
  FileCheck,
  X,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { uploadFile } from '../lib/supabase';
import { formatLKR, formatItemPrice, isValidSriLankanPhone } from '../lib/formatters';
import { SRI_LANKA_DISTRICTS } from '../data/seedData';
import { PaymentMethod } from '../types';

export const CheckoutPage: React.FC = () => {
  const { cart, cartSubtotal, cartTotal, siteSettings, createOrder, customer } = useStore();
  const navigate = useNavigate();

  // Form Fields
  const [customerName, setCustomerName] = useState(customer?.name ?? '');
  const [customerEmail, setCustomerEmail] = useState(customer?.email ?? '');
  const [customerPhone, setCustomerPhone] = useState(customer?.phone ?? '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('Colombo');
  const [specialInstructions, setSpecialInstructions] = useState('');
  // Items without a price yet are confirmed by staff first, so they can't be paid by card now
  const hasPriceToConfirm = cart.some((i) => i.priceToConfirm);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(hasPriceToConfirm ? 'cod' : 'payhere');

  // Bank Transfer slip upload state
  const [bankSlipName, setBankSlipName] = useState<string>('');
  const [bankSlipUrl, setBankSlipUrl] = useState<string>('');

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If cart is empty, redirect
  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#0F1B2D]">No items in checkout</h2>
        <p className="text-xs text-slate-500">Please add items to your cart before proceeding to checkout.</p>
        <button
          onClick={() => navigate('/shop')}
          className="px-5 py-2.5 bg-[#0F1B2D] text-white text-xs font-bold rounded"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const handleBankSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setBankSlipName(`Uploading ${file.name}…`);
    try {
      setBankSlipUrl(await uploadFile('artwork-uploads', file));
      setBankSlipName(file.name);
    } catch (err) {
      console.error('Bank slip upload failed:', err);
      setBankSlipName('');
      alert('Could not upload the bank slip. Please try again, or WhatsApp it to us after ordering.');
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.name = 'Full name is required';
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      errs.email = 'Valid email address is required';
    }
    if (!customerPhone.trim() || !isValidSriLankanPhone(customerPhone)) {
      errs.phone = 'Valid Sri Lankan mobile or landline required (e.g. 077 323 3533)';
    }
    if (!deliveryAddress.trim()) errs.address = 'Street address is required';
    if (!city.trim()) errs.city = 'City / Postal town is required';
    if (!district) errs.district = 'District selection is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // The server signs the payment (merchant secret never reaches the browser), then we POST to PayHere.
  const redirectToPayHere = async (orderId: string) => {
    const res = await fetch('/api/payhere-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) {
      // The order is saved; send the customer to it so they can pay another way.
      alert('Your order was saved, but online payment could not be started. We will contact you, or you can pay by bank transfer.');
      navigate(`/order-confirmation/${orderId}`);
      return;
    }
    const { action, fields } = (await res.json()) as { action: string; fields: Record<string, string> };
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    for (const [name, value] of Object.entries(fields)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createOrder({
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        city,
        district,
        subtotal: cartSubtotal,
        deliveryFee: siteSettings.deliveryFee,
        addonTotal: cart.reduce(
          (sum, i) => sum + i.selectedAddons.reduce((s, a) => s + a.price, 0),
          0
        ),
        total: cartTotal,
        paymentMethod,
        // Only staff (or a verified gateway callback) can mark an order paid
        paymentStatus: bankSlipUrl ? 'verification_needed' : 'pending',
        orderStatus: 'new',
        bankSlipName,
        bankSlipUrl,
        specialInstructions,
        items: cart,
      });

      if (paymentMethod === 'payhere') {
        await redirectToPayHere(order.id);
        return; // browser is leaving for PayHere
      }
      navigate(`/order-confirmation/${order.id}`);
    } catch (err) {
      console.error('Failed to submit order:', err);
      alert('Sorry, we could not place your order. Please try again, or order via WhatsApp.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-[#E6E0D6] pb-4">
        <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">
          Express Checkout
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1B2D]">
          Single-Page Guest Checkout
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          No mandatory registration required. Fill in your delivery details below.
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (Customer & Delivery & Payment) */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: CONTACT INFORMATION */}
          <div className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#0F1B2D] flex items-center gap-2 border-b border-[#E6E0D6] pb-2">
              <span className="w-5 h-5 rounded-full bg-[#0F1B2D] text-white text-[11px] flex items-center justify-center font-bold">1</span>
              <span>Contact Information</span>
            </h3>

            {customer ? (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2.5">
                Signed in as <strong>{customer.email}</strong> — this order will appear under My Account.
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Have an account?{' '}
                <Link to="/account" className="text-[#D6342C] font-semibold hover:underline">
                  Sign in
                </Link>{' '}
                to keep all your orders in one place — or just continue as a guest.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dinushka Wimalaratne"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={`w-full p-2.5 bg-[#FAF8F5] border rounded focus:bg-white focus:outline-hidden ${
                    errors.name ? 'border-red-500' : 'border-[#E6E0D6]'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-[11px]">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Sri Lankan Mobile / Phone *</label>
                <input
                  type="tel"
                  placeholder="e.g. 077 323 3533"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className={`w-full p-2.5 bg-[#FAF8F5] border rounded focus:bg-white focus:outline-hidden ${
                    errors.phone ? 'border-red-500' : 'border-[#E6E0D6]'
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-[11px]">{errors.phone}</p>}
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-700">Email Address (For Invoices & Pre-press Proof) *</label>
                <input
                  type="email"
                  placeholder="e.g. yourname@company.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className={`w-full p-2.5 bg-[#FAF8F5] border rounded focus:bg-white focus:outline-hidden ${
                    errors.email ? 'border-red-500' : 'border-[#E6E0D6]'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-[11px]">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* STEP 2: DELIVERY ADDRESS */}
          <div className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#0F1B2D] flex items-center gap-2 border-b border-[#E6E0D6] pb-2">
              <span className="w-5 h-5 rounded-full bg-[#0F1B2D] text-white text-[11px] flex items-center justify-center font-bold">2</span>
              <span>Delivery Details (All 25 Districts)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-700">Street Address & Premises *</label>
                <input
                  type="text"
                  placeholder="e.g. 11/A Gangarama Road, Werahara"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className={`w-full p-2.5 bg-[#FAF8F5] border rounded focus:bg-white focus:outline-hidden ${
                    errors.address ? 'border-red-500' : 'border-[#E6E0D6]'
                  }`}
                />
                {errors.address && <p className="text-red-500 text-[11px]">{errors.address}</p>}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">City / Postal Town *</label>
                <input
                  type="text"
                  placeholder="e.g. Boralesgamuwa"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`w-full p-2.5 bg-[#FAF8F5] border rounded focus:bg-white focus:outline-hidden ${
                    errors.city ? 'border-red-500' : 'border-[#E6E0D6]'
                  }`}
                />
                {errors.city && <p className="text-red-500 text-[11px]">{errors.city}</p>}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">District *</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden font-medium"
                >
                  {SRI_LANKA_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist} District
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-700">Delivery Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Near supermarket junction, call upon arrival"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* STEP 3: PAYMENT METHOD */}
          <div className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#0F1B2D] flex items-center gap-2 border-b border-[#E6E0D6] pb-2">
              <span className="w-5 h-5 rounded-full bg-[#0F1B2D] text-white text-[11px] flex items-center justify-center font-bold">3</span>
              <span>Payment Method</span>
            </h3>

            <div className="space-y-3">
              {hasPriceToConfirm && (
                <p className="p-3 text-xs bg-amber-50 border border-amber-300 text-amber-900 rounded">
                  Some items are <strong>price to be confirmed</strong>. We&apos;ll contact you with the final total
                  before printing, so online card payment isn&apos;t available for this order.
                </p>
              )}

              {/* PayHere Option */}
              <label
                hidden={hasPriceToConfirm}
                className={`p-4 rounded border block cursor-pointer transition-all ${
                  paymentMethod === 'payhere'
                    ? 'border-[#0F1B2D] bg-[#0F1B2D]/5 font-semibold text-[#0F1B2D]'
                    : 'border-[#E6E0D6] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'payhere'}
                      onChange={() => setPaymentMethod('payhere')}
                      className="mt-1 accent-[#0F1B2D]"
                    />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-[#D6342C]" />
                        <span>PayHere (Cards & Online Banking)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Instant automated payment verification via Visa, MasterCard, Genie, and Frimi.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                    Fastest
                  </span>
                </div>
              </label>

              {/* Bank Transfer Option */}
              <label
                className={`p-4 rounded border block cursor-pointer transition-all ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-[#0F1B2D] bg-[#0F1B2D]/5 font-semibold text-[#0F1B2D]'
                    : 'border-[#E6E0D6] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={() => setPaymentMethod('bank_transfer')}
                    className="mt-1 accent-[#0F1B2D]"
                  />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#0F1B2D]" />
                      <span>Direct Bank Transfer / CDM Deposit</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Deposit to our Commercial Bank account and upload your deposit slip or transfer receipt below.
                    </p>
                  </div>
                </div>

                {/* Account Details Box & Slip Upload */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="mt-4 pt-3 border-t border-[#E6E0D6] space-y-3 text-xs bg-white p-3.5 rounded border">
                    <div className="font-bold text-[#0F1B2D] text-xs">
                      Official Bank Account Details:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                      <div><strong>Bank:</strong> {siteSettings.bankDetails.bankName}</div>
                      <div><strong>Branch:</strong> {siteSettings.bankDetails.branch}</div>
                      <div><strong>Account Name:</strong> {siteSettings.bankDetails.accountName}</div>
                      <div><strong>Account Number:</strong> {siteSettings.bankDetails.accountNumber}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <span className="block font-bold text-slate-700 text-xs">
                        Upload Transfer Slip (Optional now, can also be sent via WhatsApp):
                      </span>
                      {bankSlipName ? (
                        <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-xs">
                          <span className="flex items-center gap-1.5">
                            <FileCheck className="w-4 h-4" />
                            {bankSlipName}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setBankSlipName('');
                              setBankSlipUrl('');
                            }}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-[#E6E0D6] hover:border-[#0F1B2D] rounded p-3 block text-center cursor-pointer bg-[#FAF8F5]">
                          <UploadCloud className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                          <span className="text-xs font-semibold text-[#0F1B2D]">Choose slip image / PDF</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={handleBankSlipUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </label>

              {/* COD Option */}
              <label
                className={`p-4 rounded border block cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-[#0F1B2D] bg-[#0F1B2D]/5 font-semibold text-[#0F1B2D]'
                    : 'border-[#E6E0D6] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 accent-[#0F1B2D]"
                  />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span>Cash on Delivery (COD)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pay cash to courier upon package inspection at your delivery address.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Sticky Order Summary */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-5 sticky top-24">
            <h3 className="font-bold text-sm text-[#0F1B2D] border-b border-[#E6E0D6] pb-3 uppercase tracking-wider">
              Order Summary ({cart.length} items)
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="text-xs space-y-0.5 border-b border-slate-100 pb-2">
                  <div className="flex justify-between font-bold text-[#0F1B2D]">
                    <span className="truncate pr-2">{item.product.name}</span>
                    <span>{formatItemPrice(item)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {item.selectedOptions.map((o) => o.valueLabel).join(' · ')}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs pt-2 border-t border-[#E6E0D6]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold">{formatLKR(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Island-Wide Delivery</span>
                <span className="font-semibold">{formatLKR(siteSettings.deliveryFee)}</span>
              </div>
              <div className="pt-2 border-t border-[#E6E0D6] flex justify-between items-baseline font-bold text-base text-[#0F1B2D]">
                <span>{hasPriceToConfirm ? 'Total so far' : 'Total Amount Due'}</span>
                <span className="text-[#D6342C] text-lg">{formatLKR(cartTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#D6342C] hover:bg-[#B8251E] disabled:bg-slate-400 text-white font-bold text-xs rounded transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Order...' : `Place Order (${formatLKR(cartTotal)})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Commercial Guarantee · Pre-press Proof Sent</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
