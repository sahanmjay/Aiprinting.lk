import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  Store,
  MapPin,
  CreditCard,
  Building2,
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
import type { PricedOrder } from '../lib/pricing';

export const CheckoutPage: React.FC = () => {
  const { cart, cartSubtotal, cartTotal, siteSettings, createOrder, updateOrder, customer, deliveryMethod, setDeliveryMethod, cartTotalQuantity, cartDeliveryFee } = useStore();
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(hasPriceToConfirm ? 'bank_transfer' : 'payhere');

  // Bank Transfer slip upload state
  const [bankSlipName, setBankSlipName] = useState<string>('');
  const [bankSlipUrl, setBankSlipUrl] = useState<string>('');
  const [accountCopied, setAccountCopied] = useState(false);

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
    if (deliveryMethod === 'delivery') {
      if (!deliveryAddress.trim()) errs.address = 'Street address is required';
      if (!city.trim()) errs.city = 'City / Postal town is required';
      if (!district) errs.district = 'District selection is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // The server re-prices the order and signs the payment (merchant secret never reaches the browser),
  // then we POST to PayHere. It only signs the total the customer has seen.
  const redirectToPayHere = async (orderId: string, expectedTotal: number) => {
    const res = await fetch('/api/payhere-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, expectedTotal }),
    });
    if (!res.ok) {
      // The order is saved; send the customer to it so they can pay another way.
      alert('Your order was saved, but online payment could not be started. We will contact you, or you can pay by bank transfer.');
      navigate(`/order-confirmation/${orderId}`);
      return;
    }
    const data = (await res.json()) as PricedOrder & { priceChanged?: boolean; action: string; fields: Record<string, string> };
    if (data.priceChanged) {
      // Keep this browser's copy of the order in step with the corrected total (the server already saved it)
      const { subtotal, deliveryFee, addonTotal, total } = data;
      updateOrder(orderId, { subtotal, deliveryFee, addonTotal, total });
      const ok = window.confirm(
        `Price updated to ${formatLKR(data.total)} (you saw ${formatLKR(expectedTotal)}), using our current prices.\n\nPay ${formatLKR(data.total)} with PayHere now?`
      );
      if (ok) return redirectToPayHere(orderId, data.total);
      alert(`Your order is saved with the updated total of ${formatLKR(data.total)}. You can pay by bank transfer or contact us.`);
      navigate(`/order-confirmation/${orderId}`);
      return;
    }
    const { action, fields } = data;
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
        deliveryMethod,
        totalQuantity: cartTotalQuantity,
        deliveryAddress:
          deliveryMethod === 'pickup'
            ? deliveryAddress.trim() || 'Store Pickup: 11/A Gangarama Road, Werahara'
            : deliveryAddress,
        city: deliveryMethod === 'pickup' ? city.trim() || 'Boralesgamuwa' : city,
        district: deliveryMethod === 'pickup' ? district || 'Colombo' : district,
        subtotal: cartSubtotal,
        deliveryFee: cartDeliveryFee,
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
        await redirectToPayHere(order.id, cartTotal);
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

          {/* STEP 2: DELIVERY METHOD & DETAILS */}
          <div className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-5">
            <div className="border-b border-[#E6E0D6] pb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#0F1B2D] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0F1B2D] text-white text-[11px] flex items-center justify-center font-bold">2</span>
                <span>Delivery Method & Destination</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Choose between doorstep courier delivery across Sri Lanka or free shop collection from Boralesgamuwa.
              </p>
            </div>

            {/* Delivery Method Choice Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryMethod('delivery')}
                className={`p-4 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                  deliveryMethod === 'delivery'
                    ? 'border-[#0F1B2D] bg-[#0F1B2D]/5 ring-2 ring-[#0F1B2D]'
                    : 'border-[#E6E0D6] bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0F1B2D] flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#D6342C]" />
                      Courier Delivery
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                      Island-Wide
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Delivered directly to your address in any of the 25 districts.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">Delivery Charge:</span>
                  <span className="font-bold text-[#0F1B2D]">
                    {formatLKR(cartDeliveryFee)}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                className={`p-4 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                  deliveryMethod === 'pickup'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600'
                    : 'border-[#E6E0D6] bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0F1B2D] flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-emerald-600" />
                      Customer Pickup
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                      Free Rs. 0.00
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Collect for free directly from our shop in Boralesgamuwa.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">Pickup Fee:</span>
                  <span className="font-bold text-emerald-700">Rs. 0.00 (Free)</span>
                </div>
              </button>
            </div>

            {deliveryMethod === 'pickup' ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-slate-700 text-xs">
                    <div className="font-bold text-sm text-[#0F1B2D]">Ai Printing Solutions — Shop Collection</div>
                    <div><strong>Address:</strong> 11/A Gangarama Road, Werahara, Boralesgamuwa</div>
                    <div className="text-[11px] text-slate-600">
                      <strong>Collection Hours:</strong> Monday – Saturday: 8:30 AM – 6:30 PM (Closed on Poya & Sundays)
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <strong>Contact:</strong> Hotline {siteSettings.hotline} · Landline {siteSettings.landline}
                    </div>
                    <div className="text-[11px] text-emerald-800 font-semibold pt-1">
                      ✓ Delivery charge is automatically set to Rs. 0.00. We will notify you by SMS / WhatsApp once your prints are boxed and ready for collection.
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/60">
                  <label className="font-bold text-slate-700 block mb-1">
                    Collection Notes / Person Collecting (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. My driver / colleague will collect, vehicle WP CAA-1234"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full p-2.5 bg-white border border-emerald-300 rounded focus:outline-hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-[#FAF8F5] border border-[#E6E0D6] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#D6342C]" />
                    <span className="text-slate-700">
                      Order Quantity: <strong>{cartTotalQuantity} unit(s)</strong>
                    </span>
                  </div>
                  <span className="text-slate-600 font-semibold">
                    Delivery Fee: {formatLKR(cartDeliveryFee)}
                  </span>
                </div>

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
            )}
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
                  before printing, so online card payment isn&apos;t available for this order. Please pay by bank
                  transfer once we confirm the total.
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
                    <div className="rounded-lg border border-[#E6E0D6] bg-[#FAF8F5] p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      {siteSettings.bankDetails.logoUrl && (
                        <img
                          src={siteSettings.bankDetails.logoUrl}
                          alt={siteSettings.bankDetails.bankName}
                          className="h-10 w-auto max-w-[160px] object-contain shrink-0 self-start sm:self-center"
                        />
                      )}
                      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px] text-slate-700 min-w-0">
                        <dt className="text-slate-500">Bank</dt>
                        <dd className="font-semibold text-[#0F1B2D]">{siteSettings.bankDetails.bankName}</dd>
                        <dt className="text-slate-500">Branch</dt>
                        <dd className="font-semibold text-[#0F1B2D]">{siteSettings.bankDetails.branch}</dd>
                        <dt className="text-slate-500">Account name</dt>
                        <dd className="font-semibold text-[#0F1B2D]">{siteSettings.bankDetails.accountName}</dd>
                        <dt className="text-slate-500">Account no.</dt>
                        <dd className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#0F1B2D] tracking-wide">{siteSettings.bankDetails.accountNumber}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault(); // inside the payment <label>
                              navigator.clipboard?.writeText(siteSettings.bankDetails.accountNumber.replace(/\s+/g, ''));
                              setAccountCopied(true);
                              setTimeout(() => setAccountCopied(false), 2000);
                            }}
                            className="px-1.5 py-0.5 rounded border border-[#E6E0D6] bg-white text-[10px] font-semibold text-slate-600 hover:border-[#0F1B2D]"
                          >
                            {accountCopied ? 'Copied ✓' : 'Copy'}
                          </button>
                        </dd>
                      </dl>
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
                <span>Items Subtotal</span>
                <span className="font-semibold">{formatLKR(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Item Quantity</span>
                <span className="font-semibold">{cartTotalQuantity} unit(s)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>
                  {deliveryMethod === 'pickup' ? 'Customer Pickup' : 'Courier Delivery'}
                </span>
                <span className={`font-semibold ${deliveryMethod === 'pickup' ? 'text-emerald-700' : ''}`}>
                  {deliveryMethod === 'pickup' ? 'Rs. 0.00 (Free)' : formatLKR(cartDeliveryFee)}
                </span>
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
