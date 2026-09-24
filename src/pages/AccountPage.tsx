import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, AlertCircle, LogIn, UserPlus, LogOut, KeyRound, CheckCircle2, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatLKR, formatItemPrice } from '../lib/formatters';
import { Order } from '../types';

const inputClass =
  'w-full p-2.5 text-xs bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden focus:border-[#0F1B2D]';
// Stricter than the browser's check: requires a real-looking domain, e.g. name@gmail.com
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim());

const primaryButton =
  'w-full py-2.5 bg-[#0F1B2D] hover:bg-[#182A45] text-white text-xs font-bold rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-60';

const getStatusBadge = (status: string) => {
  const styles: Record<string, [string, string]> = {
    new: ['bg-blue-100 text-blue-800', 'New Order'],
    confirmed: ['bg-indigo-100 text-indigo-800', 'Confirmed'],
    in_production: ['bg-amber-100 text-amber-800', 'In Production'],
    ready: ['bg-purple-100 text-purple-800', 'Ready to Dispatch'],
    delivered: ['bg-emerald-100 text-emerald-800', 'Delivered'],
    cancelled: ['bg-red-100 text-red-800', 'Cancelled'],
  };
  const [cls, label] = styles[status] ?? ['bg-slate-100 text-slate-800', status];
  return <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${cls}`}>{label}</span>;
};

const OrderDetail: React.FC<{ order: Order }> = ({ order }) => {
  const step = (done: boolean) =>
    `p-3 rounded border ${done ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'}`;
  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#E6E0D6] shadow-xs space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#E6E0D6] pb-4">
        <div>
          <div className="text-[10px] text-slate-400 uppercase font-bold">Order Number</div>
          <div className="text-xl font-bold font-mono text-[#0F1B2D]">{order.orderNumber}</div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(order.orderStatus)}
          <span className="text-xs text-slate-500">Placed: {new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
        <div className={step(order.orderStatus !== 'cancelled')}>1. Order Placed</div>
        <div className={step(['confirmed', 'in_production', 'ready', 'delivered'].includes(order.orderStatus))}>2. Prepress Proof</div>
        <div className={step(['in_production', 'ready', 'delivered'].includes(order.orderStatus))}>3. In Production</div>
        <div className={step(['ready', 'delivered'].includes(order.orderStatus))}>4. Dispatched</div>
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-4">
        <div className="font-bold text-xs text-[#0F1B2D] uppercase">Job Items</div>
        {order.items.map((item) => (
          <div key={item.id} className="p-3 bg-[#FAF8F5] rounded border border-slate-200 flex justify-between items-center text-xs">
            <div>
              <div className="font-bold text-[#0F1B2D]">{item.product.name}</div>
              <div className="text-slate-500 text-[11px]">{item.selectedOptions.map((o) => o.valueLabel).join(' · ')}</div>
            </div>
            <div className="font-bold text-[#0F1B2D]">{formatItemPrice(item)}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-baseline border-t border-[#E6E0D6] pt-3 text-xs">
        <span className="text-slate-500">Total (including delivery):</span>
        <span className="text-base font-bold text-[#D6342C]">{formatLKR(order.total)}</span>
      </div>
    </div>
  );
};

const OrderList: React.FC<{ orders: Order[]; onOpen: (o: Order) => void }> = ({ orders, onOpen }) => (
  <div className="space-y-3">
    {orders.map((o) => (
      <button
        key={o.id}
        onClick={() => onOpen(o)}
        className="w-full text-left bg-white p-4 rounded border border-[#E6E0D6] hover:border-[#0F1B2D] transition-colors flex justify-between items-center gap-3 text-xs"
      >
        <div>
          <div className="font-mono font-bold text-[#0F1B2D]">{o.orderNumber}</div>
          <div className="text-slate-500 text-[11px]">
            {o.items.map((i) => i.product.name).join(', ')} · {new Date(o.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-bold text-[#0F1B2D]">{formatLKR(o.total)}</span>
          {getStatusBadge(o.orderStatus)}
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </button>
    ))}
  </div>
);

// ---------- Sign in / register (like the old site's My Account page) ----------
const SignInOrRegister: React.FC = () => {
  const { signInCustomer, signUpCustomer, sendPasswordReset } = useStore();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [confirmSentTo, setConfirmSentTo] = useState<string | null>(null);

  const [busy, setBusy] = useState<'login' | 'register' | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(loginEmail)) {
      setLoginError('Please enter a valid email address, e.g. name@gmail.com');
      return;
    }
    setBusy('login');
    setLoginError(null);
    if (isResetMode) {
      const error = await sendPasswordReset(loginEmail);
      if (error) setLoginError(error);
      else setResetSent(true);
    } else {
      setLoginError(await signInCustomer(loginEmail, loginPassword));
    }
    setBusy(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(regEmail)) {
      setRegError('Please enter a valid email address, e.g. name@gmail.com');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    setBusy('register');
    setRegError(null);
    const { error, needsConfirmation } = await signUpCustomer({ name: regName, email: regEmail, phone: regPhone, password: regPassword });
    setBusy(null);
    if (error) setRegError(error);
    else if (needsConfirmation) setConfirmSentTo(regEmail.trim());
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Login */}
      <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-4 text-xs">
        <h2 className="flex items-center gap-2 text-base font-bold text-[#0F1B2D]">
          {isResetMode ? <KeyRound className="w-4 h-4 text-[#D6342C]" /> : <LogIn className="w-4 h-4 text-[#D6342C]" />}
          {isResetMode ? 'Reset your password' : 'Sign in'}
        </h2>

        {resetSent ? (
          <p role="status" className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded">
            If an account exists for {loginEmail}, we have emailed a link to set a new password.
          </p>
        ) : (
          <>
            <div className="space-y-1">
              <label htmlFor="login-email" className="font-bold text-slate-700">Email *</label>
              <input id="login-email" type="email" autoComplete="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputClass} />
            </div>
            {!isResetMode && (
              <div className="space-y-1">
                <label htmlFor="login-password" className="font-bold text-slate-700">Password *</label>
                <input id="login-password" type="password" autoComplete="current-password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={inputClass} />
              </div>
            )}
            {loginError && <p role="alert" className="text-red-600">{loginError}</p>}
            <button type="submit" disabled={busy === 'login'} className={primaryButton}>
              {busy === 'login' ? 'Please wait…' : isResetMode ? 'Email me a reset link' : 'Sign In'}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => {
            setIsResetMode(!isResetMode);
            setResetSent(false);
            setLoginError(null);
          }}
          className="text-[#D6342C] font-semibold hover:underline"
        >
          {isResetMode ? '← Back to sign in' : 'Forgot your password?'}
        </button>
      </form>

      {/* Register */}
      <form onSubmit={handleRegister} className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-4 text-xs">
        <h2 className="flex items-center gap-2 text-base font-bold text-[#0F1B2D]">
          <UserPlus className="w-4 h-4 text-[#D6342C]" />
          Create an account
        </h2>
        {confirmSentTo ? (
          <p role="status" className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded flex gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Almost done! We sent a confirmation link to <strong>{confirmSentTo}</strong>. Click it to activate your account, then sign in.
            </span>
          </p>
        ) : (
          <>
            <p className="text-slate-500">See all your orders in one place and check out faster.</p>
            <div className="space-y-1">
              <label htmlFor="reg-name" className="font-bold text-slate-700">Full name *</label>
              <input id="reg-name" autoComplete="name" required value={regName} onChange={(e) => setRegName(e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="reg-email" className="font-bold text-slate-700">Email *</label>
                <input id="reg-email" type="email" autoComplete="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label htmlFor="reg-phone" className="font-bold text-slate-700">Mobile</label>
                <input id="reg-phone" type="tel" autoComplete="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="07X XXX XXXX" className={inputClass} />
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="reg-password" className="font-bold text-slate-700">Password * (at least 6 characters)</label>
              <input id="reg-password" type="password" autoComplete="new-password" required minLength={6} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className={inputClass} />
            </div>
            {regError && <p role="alert" className="text-red-600">{regError}</p>}
            <button type="submit" disabled={busy === 'register'} className={primaryButton}>
              {busy === 'register' ? 'Creating account…' : 'Create Account'}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

// ---------- Set a new password (after clicking the email link) ----------
const SetNewPassword: React.FC = () => {
  const { setNewPassword } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (password.length < 6) return setError('Password must be at least 6 characters.');
        setBusy(true);
        setError(await setNewPassword(password));
        setBusy(false);
      }}
      className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-4 text-xs max-w-md"
    >
      <h2 className="flex items-center gap-2 text-base font-bold text-[#0F1B2D]">
        <KeyRound className="w-4 h-4 text-[#D6342C]" />
        Choose a new password
      </h2>
      <input type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} aria-label="New password" className={inputClass} />
      {error && <p role="alert" className="text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className={primaryButton}>
        {busy ? 'Saving…' : 'Save New Password'}
      </button>
    </form>
  );
};

export const AccountPage: React.FC = () => {
  const { orders, trackOrder, customer, customerOrders, isPasswordRecovery, signOutCustomer } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [openOrder, setOpenOrder] = useState<Order | null>(null);

  const lookup = async (orderNumber: string, phone: string) => {
    setIsSearching(true);
    try {
      setSearchedOrder(await trackOrder(orderNumber, phone));
    } catch (err) {
      console.error('Order lookup failed:', err);
      setSearchedOrder(null);
    } finally {
      setHasSearched(true);
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !phoneQuery.trim()) return;
    lookup(searchQuery.trim(), phoneQuery.trim());
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div className="border-b border-[#E6E0D6] pb-4 space-y-1">
        <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">My Account</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1B2D]">
          {isPasswordRecovery ? 'Set a new password' : customer ? `Welcome${customer.name ? `, ${customer.name}` : ''}!` : 'Sign in or create an account'}
        </h1>
      </div>

      {isPasswordRecovery ? (
        <SetNewPassword />
      ) : customer ? (
        <div className="space-y-6">
          {/* Profile */}
          <div className="bg-white p-5 rounded-lg border border-[#E6E0D6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0F1B2D] text-white flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-[#0F1B2D]">{customer.name || customer.email}</div>
                <div className="text-slate-500">
                  {customer.email}
                  {customer.phone && ` · ${customer.phone}`}
                </div>
              </div>
            </div>
            <button
              onClick={signOutCustomer}
              className="px-4 py-2 border border-[#0F1B2D] text-[#0F1B2D] font-semibold rounded hover:bg-slate-50 flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>

          {/* My orders */}
          <div className="space-y-3">
            <h2 className="font-bold text-sm text-[#0F1B2D] uppercase tracking-wider">My Orders ({customerOrders.length})</h2>
            {customerOrders.length === 0 ? (
              <div className="bg-white p-6 rounded-lg border border-[#E6E0D6] text-xs text-slate-500">
                No orders yet — orders you place while signed in appear here.{' '}
                <Link to="/shop" className="text-[#D6342C] font-semibold hover:underline">
                  Browse products →
                </Link>
              </div>
            ) : (
              <OrderList orders={customerOrders} onOpen={setOpenOrder} />
            )}
            {openOrder && <OrderDetail order={openOrder} />}
          </div>
        </div>
      ) : (
        <SignInOrRegister />
      )}

      {/* Guest order tracking (also works for orders placed before signing up) */}
      {!isPasswordRecovery && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-bold text-sm text-[#0F1B2D] uppercase tracking-wider">Track an order</h2>
            <p className="text-xs text-slate-500">Enter your order number and the phone number used at checkout.</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs max-w-xl">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  aria-label="Order number"
                  placeholder="e.g. AIP-2026-014218"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden font-mono uppercase"
                />
              </div>
              <input
                type="tel"
                aria-label="Phone number"
                placeholder="Phone number"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                className="sm:w-40 px-3 py-2.5 text-xs bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 bg-[#0F1B2D] hover:bg-[#182A45] text-white text-xs font-bold rounded transition-colors disabled:opacity-60"
              >
                {isSearching ? 'Searching…' : 'Track Status'}
              </button>
            </form>
          </div>

          {hasSearched &&
            (searchedOrder ? (
              <OrderDetail order={searchedOrder} />
            ) : (
              <div className="p-6 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No order found for "{searchQuery}" with that phone number. Please check both and try again.</span>
              </div>
            ))}

          {/* Guests: orders placed from this device */}
          {!customer && orders.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-xs text-[#0F1B2D] uppercase tracking-wider">Orders from this device ({orders.length})</h3>
              <OrderList
                orders={orders}
                onOpen={(o) => {
                  setSearchQuery(o.orderNumber);
                  setPhoneQuery(o.customerPhone);
                  lookup(o.orderNumber, o.customerPhone);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
