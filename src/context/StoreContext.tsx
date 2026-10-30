import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Product,
  Category,
  CartItem,
  Order,
  Customer,
  RegisteredCustomer,
  Quotation,
  ContactMessage,
  SiteSettings,
  PriceMatrixCell,
  QuoteStatus,
  DeliveryMethod,
} from '../types';
import {
  SEED_PRODUCTS,
  SEED_CATEGORIES,
  DEFAULT_SITE_SETTINGS,
  SEED_PRICE_MATRIX,
} from '../data/seedData';
import { generateOrderNumber, generateQuoteNumber } from '../lib/formatters';
import { supabase, toRow, fromRow } from '../lib/supabase';
import { calculateTotalItemQuantity, calculateDeliveryCharge } from '../lib/delivery';
import { mergeProducts, withDefaults, SavedProducts } from '../lib/pricing';

interface StoreContextType {
  products: Product[];
  categories: Category[];
  siteSettings: SiteSettings;
  cart: CartItem[];
  orders: Order[];
  quotations: Quotation[];
  contactMessages: ContactMessage[];
  registeredCustomers: RegisteredCustomer[]; // admin only
  priceMatrix: Record<string, PriceMatrixCell[]>; // keyed by productId
  isAdminLoggedIn: boolean;

  // Cart operations
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotalQuantity: number;
  cartSubtotal: number;
  cartDeliveryFee: number;
  cartTotal: number;
  deliveryMethod: DeliveryMethod;
  setDeliveryMethod: (method: DeliveryMethod) => void;

  // Ordering
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => Promise<Order>;
  updateOrder: (orderId: string, changes: Partial<Order>) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<boolean>; // admin only; true = deleted
  getOrderById: (orderId: string) => Order | undefined;
  trackOrder: (orderNumber: string, phone: string) => Promise<Order | null>;

  // Quotes
  createQuote: (quoteData: Omit<Quotation, 'id' | 'quoteNumber' | 'status' | 'createdAt'>) => Promise<Quotation>;
  updateQuoteStatus: (quoteId: string, status: QuoteStatus, adminNotes?: string, quotedAmount?: number) => Promise<void>;
  trackQuote: (quoteNumber: string, phone: string) => Promise<Quotation | null>;

  // Contact
  sendContactMessage: (msg: Omit<ContactMessage, 'id' | 'isRead' | 'createdAt'>) => Promise<void>;
  markMessageRead: (msgId: string) => Promise<void>;

  // Price Grid Admin Features
  getPriceForOptions: (productId: string, rowId: string, colId?: string) => number; // 0 = not priced
  getFromPrice: (productId: string) => number; // lowest price; 0 = price on request
  updatePriceCell: (productId: string, rowId: string, colId: string, newPrice: number | null) => void; // null = remove
  bulkAdjustGridPrices: (productId: string, percentIncrease: number) => void;
  exportGridCSV: (productId: string) => string;
  importGridCSV: (productId: string, csvText: string) => boolean;

  // Product & Settings Admin
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (updated: Product) => void;
  updateMultipleProducts: (updatedList: Product[]) => void;
  deleteProduct: (productId: string) => void;
  duplicateProduct: (productId: string) => Product | undefined;
  updateSiteSettings: (newSettings: Partial<SiteSettings>) => Promise<string | null>; // null = saved for every visitor
  loginAdmin: (email: string, password: string) => Promise<string | null>; // null = password ok, 2-step code next
  startAdminMfa: () => Promise<AdminMfa>; // throws on failure
  verifyAdminMfa: (factorId: string, code: string) => Promise<string | null>; // null = signed in as admin
  logoutAdmin: () => Promise<void>;
  refreshAdminData: () => Promise<void>;
  savePriceMatrix: () => Promise<string | null>; // null = saved, else error message
  saveProducts: () => Promise<string | null>;

  // Customer accounts (Supabase Auth, email + password)
  customer: Customer | null;
  customerOrders: Order[];
  isPasswordRecovery: boolean; // opened a "reset password" email link
  signUpCustomer: (d: { name: string; email: string; phone: string; password: string }) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signInCustomer: (email: string, password: string) => Promise<string | null>;
  signOutCustomer: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<string | null>;
  setNewPassword: (password: string) => Promise<string | null>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Bump when SEED_PRODUCTS changes so browsers drop their stale saved copy.
const PRODUCTS_KEY = 'aiprint_products_v6';

// Corrupt or missing localStorage must never blank the whole site.
function load<T>(key: string, fallback: () => T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback();
  } catch {
    return fallback();
  }
}

// A full or blocked localStorage (e.g. large artwork previews) must not crash the app.
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Could not save ${key} to localStorage`, e);
  }
}

// Admin 2-step login: an existing authenticator (factorId only) or a new one to scan (qrCode + secret).
export type AdminMfa = { factorId: string; qrCode?: string; secret?: string };

// Staff are signed out after this long without any activity on the site.
const ADMIN_IDLE_MS = 30 * 60_000;
const ADMIN_ACTIVE_KEY = 'aiprint_admin_active'; // last activity time only — never decides who is admin

// Postgres unique violation — a random order/quote number collided, so retry with a new one.
const UNIQUE_VIOLATION = '23505';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage or Seeds
  const [products, setProducts] = useState<Product[]>(() => load(PRODUCTS_KEY, () => SEED_PRODUCTS));
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => withDefaults(load('aiprint_settings', () => DEFAULT_SITE_SETTINGS)));

  // Dynamic categories whose images stay auto-synced with catalogue products (or siteSettings override)
  const categories = useMemo<Category[]>(() => {
    return SEED_CATEGORIES.map((cat) => {
      const explicit = siteSettings.categoryImages?.[cat.id] || siteSettings.categoryImages?.[cat.slug];
      if (explicit) {
        return { ...cat, imageUrl: explicit };
      }

      const catProducts = products.filter((p) => p.categoryId === cat.id || p.categoryId === cat.slug);

      const activeProducts = catProducts
        .filter((p) => p.isActive && p.images && p.images.length > 0 && p.images[0]?.imageUrl)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      const anyProducts = catProducts
        .filter((p) => p.images && p.images.length > 0 && p.images[0]?.imageUrl)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      // Prefer products with a real non-placeholder photo if available
      const primaryProduct =
        activeProducts.find((p) => !p.images[0].imageUrl.includes('placeholder')) ||
        activeProducts[0] ||
        anyProducts.find((p) => !p.images[0].imageUrl.includes('placeholder')) ||
        anyProducts[0];

      const liveImage = primaryProduct?.images?.[0]?.imageUrl;

      return {
        ...cat,
        imageUrl: liveImage || cat.imageUrl,
      };
    });
  }, [products, siteSettings.categoryImages]);
  const [removedProductIds, setRemovedProductIds] = useState<string[]>([]);

  const [cart, setCart] = useState<CartItem[]>(() => load('aiprint_cart', () => []));

  // The customer's own orders (for the confirmation page) stay in this browser
  const [orders, setOrders] = useState<Order[]>(() => load('aiprint_orders', () => []));

  // Admin data lives in Supabase
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [registeredCustomers, setRegisteredCustomers] = useState<RegisteredCustomer[]>([]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  // Price matrix keyed by productId
  const [priceMatrix, setPriceMatrix] = useState<Record<string, PriceMatrixCell[]>>(SEED_PRICE_MATRIX);

  // Persist changes
  useEffect(() => save('aiprint_cart', cart), [cart]);
  useEffect(() => save('aiprint_orders', orders), [orders]);

  // Prices, settings and products saved by staff in the admin panel override the built-in defaults for every
  // visitor; the browser copy in localStorage only gives a fast first paint.
  useEffect(() => {
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['price_matrix', 'settings', 'products'])
      .then(({ data }) => {
        for (const row of data ?? []) {
          // Merge per product so products never saved by staff keep their built-in prices
          if (row.key === 'price_matrix') setPriceMatrix((prev) => ({ ...prev, ...(row.value as Record<string, PriceMatrixCell[]>) }));
          if (row.key === 'settings') setSiteSettings(withDefaults(row.value as Partial<SiteSettings>));
          if (row.key === 'products') {
            setRemovedProductIds((row.value as SavedProducts).removed);
            setProducts(mergeProducts(row.value as SavedProducts));
          }
        }
      });
  }, []);

  const saveShared = async (key: string, value: unknown): Promise<string | null> => {
    const { error } = await supabase.from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() });
    return error ? error.message : null;
  };

  const savePriceMatrix = () => saveShared('price_matrix', priceMatrix);

  // Admin product changes go live for everyone straight away
  const publishProducts = (list: Product[], removed = removedProductIds) => {
    setProducts(list);
    setRemovedProductIds(removed);
    saveShared('products', { list, removed }).then((err) => err && alert(`Product change not published: ${err}`));
  };
  useEffect(() => save('aiprint_settings', siteSettings), [siteSettings]);
  useEffect(() => save(PRODUCTS_KEY, products), [products]);

  // Session: any signed-in Supabase user is a customer; admins are also listed in admin_users and
  // must have passed the authenticator code (aal2). The database enforces the same rule in is_admin().
  useEffect(() => {
    const check = async () => {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel !== 'aal2') return setIsAdminLoggedIn(false);
      const { data } = await supabase.rpc('is_admin');
      setIsAdminLoggedIn(data === true);
    };
    const toCustomer = (user?: User | null): Customer | null =>
      user
        ? { id: user.id, email: user.email ?? '', name: user.user_metadata?.full_name ?? '', phone: user.user_metadata?.phone ?? '' }
        : null;
    supabase.auth.getSession().then(({ data }) => setCustomer(toCustomer(data.session?.user)));
    check();
    // Supabase warns against awaiting its own calls inside this callback, so defer the check.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setCustomer(toCustomer(session?.user));
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      setTimeout(check, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // A signed-in customer's own orders (row level security only returns their rows)
  const customerId = customer?.id;
  useEffect(() => {
    if (!customerId) {
      setCustomerOrders([]);
      return;
    }
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', customerId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Could not load your orders:', error);
        setCustomerOrders((data ?? []).map((row) => fromRow<Order>(row)));
      });
  }, [customerId]);

  const signUpCustomer = async (d: { name: string; email: string; phone: string; password: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email: d.email.trim().toLowerCase(),
      password: d.password,
      options: { data: { full_name: d.name.trim(), phone: d.phone.trim() }, emailRedirectTo: `${window.location.origin}/account` },
    });
    if (error) {
      const message = /already registered|already exists/i.test(error.message)
        ? 'An account with this email already exists — please sign in instead.'
        : error.message;
      return { error: message, needsConfirmation: false };
    }
    return { error: null, needsConfirmation: !data.session }; // no session = "confirm your email" is switched on
  };

  const signInCustomer = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (!error) return null;
    if (error.message === 'Invalid login credentials') return 'Wrong email or password.';
    if (/not confirmed/i.test(error.message)) return 'Please confirm your email first — check your inbox for the link we sent.';
    return error.message;
  };

  const sendPasswordReset = async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/account` });
    return error ? error.message : null;
  };

  const setNewPassword = async (password: string): Promise<string | null> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setIsPasswordRecovery(false);
    return error ? error.message : null;
  };

  const refreshAdminData = async () => {
    const [o, q, m, c] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('quotations').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
    ]);
    for (const res of [o, q, m, c]) if (res.error) console.error('Admin data load failed:', res.error);
    setAdminOrders((o.data ?? []).map((row) => fromRow<Order>(row)));
    setQuotations((q.data ?? []).map((row) => fromRow<Quotation>(row)));
    setContactMessages((m.data ?? []).map((row) => fromRow<ContactMessage>(row)));
    setRegisteredCustomers((c.data ?? []).map((row) => fromRow<RegisteredCustomer>(row)));
  };

  useEffect(() => {
    if (isAdminLoggedIn) refreshAdminData();
  }, [isAdminLoggedIn]);

  // Idle sign-out. The last-activity time is stored so a closed tab, a sleeping laptop or another tab
  // still counts: coming back after 30 minutes signs out straight away.
  useEffect(() => {
    if (!isAdminLoggedIn) return;
    let last = load(ADMIN_ACTIVE_KEY, () => Date.now());
    const touch = () => {
      if (Date.now() - last < 10_000) return; // throttle storage writes
      last = Date.now();
      save(ADMIN_ACTIVE_KEY, last);
    };
    const expire = () => {
      last = Math.max(last, load(ADMIN_ACTIVE_KEY, () => last));
      if (Date.now() - last > ADMIN_IDLE_MS) logoutAdmin();
    };
    expire();
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const timer = setInterval(expire, 30_000);
    return () => {
      clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, touch));
    };
  }, [isAdminLoggedIn]);

  // Delivery Method state
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(() => load('aiprint_delivery_method', () => 'delivery'));
  useEffect(() => save('aiprint_delivery_method', deliveryMethod), [deliveryMethod]);

  // Cart helper functions
  const addToCart = (item: CartItem) => {
    const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
    setCart((prev) => [...prev, { ...item, quantity: qty }]);
  };

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const validQty = Math.max(1, Math.floor(quantity || 1));
        const singleUnitBase = item.itemPrice + item.selectedAddons.reduce((s, a) => s + a.price, 0);
        return {
          ...item,
          quantity: validQty,
          lineTotal: item.priceToConfirm ? 0 : singleUnitBase * validQty,
        };
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.length;
  const cartTotalQuantity = useMemo(() => calculateTotalItemQuantity(cart), [cart]);

  const cartDeliveryFee = useMemo(
    () => calculateDeliveryCharge(deliveryMethod, cart, siteSettings.deliveryFee, siteSettings.deliveryCombineMode),
    [deliveryMethod, cart, siteSettings.deliveryFee, siteSettings.deliveryCombineMode]
  );
  const cartSubtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const cartTotal = cart.length > 0 ? cartSubtotal + cartDeliveryFee : 0;

  // Order Placement
  const createOrder = async (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<Order> => {
    const now = new Date().toISOString();
    // Strip in-browser image previews; the real files are already in Storage (storagePath).
    const items = orderData.items.map((item) => ({
      ...item,
      quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
      artworkFiles: item.artworkFiles.map(({ previewUrl: _p, dataUrl: _d, ...file }) => file),
    }));
    const totalQuantity = orderData.totalQuantity ?? calculateTotalItemQuantity(items);
    const newOrder: Order = {
      ...orderData,
      deliveryMethod: orderData.deliveryMethod ?? deliveryMethod,
      totalQuantity,
      items,
      id: `ord-${crypto.randomUUID()}`,
      userId: customer?.id,
      orderNumber: '',
      createdAt: now,
      updatedAt: now,
    };
    for (let attempt = 1; ; attempt++) {
      newOrder.orderNumber = generateOrderNumber();
      const row = toRow(newOrder);
      let res = await supabase.from('orders').insert(row);
      if (res.error && res.error.message && /column .* does not exist/i.test(res.error.message)) {
        // Fallback for live database if migration was not run yet
        delete (row as any).delivery_method;
        delete (row as any).total_quantity;
        delete (row as any).discount_total;
        res = await supabase.from('orders').insert(row);
      }
      if (!res.error) break;
      if (res.error.code !== UNIQUE_VIOLATION || attempt === 3) throw res.error;
    }
    setOrders((prev) => [newOrder, ...prev]);
    if (customer) setCustomerOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const updateOrder = async (orderId: string, changes: Partial<Order>) => {
    const patch = { ...changes, updatedAt: new Date().toISOString() };
    const row = toRow(patch);
    let { error } = await supabase.from('orders').update(row).eq('id', orderId);
    if (error && error.message && /column .* does not exist/i.test(error.message)) {
      delete (row as any).delivery_method;
      delete (row as any).total_quantity;
      delete (row as any).discount_total;
      const retry = await supabase.from('orders').update(row).eq('id', orderId);
      error = retry.error;
    }
    if (error) {
      alert(`Could not update order: ${error.message}`);
      return;
    }
    // Admin marked it paid: the server checks it is a bank transfer and emails the customer once.
    if (changes.paymentStatus === 'paid') {
      supabase.auth.getSession().then(({ data }) =>
        fetch('/api/admin/verify-payment-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
          body: JSON.stringify({ orderId }),
        })
      ).catch((e) => console.error('Payment verified email failed:', e));
    }
    setAdminOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
    setCustomerOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
  };

  const deleteOrder = async (orderId: string): Promise<boolean> => {
    // RLS turns a refused delete into "0 rows", not an error, so ask for the deleted row back
    const { data, error } = await supabase.from('orders').delete().eq('id', orderId).select('id');
    if (error || !data?.length) {
      alert(`Could not delete order: ${error?.message ?? 'not allowed — please sign in again'}`);
      return false;
    }
    setAdminOrders((prev) => prev.filter((o) => o.id !== orderId));
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setCustomerOrders((prev) => prev.filter((o) => o.id !== orderId));
    return true;
  };

  const getOrderById = (orderId: string) => orders.find((o) => o.id === orderId);

  const trackOrder = async (orderNumber: string, phone: string): Promise<Order | null> => {
    const { data, error } = await supabase.rpc('track_order', {
      p_order_number: orderNumber,
      p_phone: phone,
    });
    if (error) throw error;
    return data?.[0] ? fromRow<Order>(data[0]) : null;
  };

  // Quotations
  const createQuote = async (
    quoteData: Omit<Quotation, 'id' | 'quoteNumber' | 'status' | 'createdAt'>
  ): Promise<Quotation> => {
    const newQuote: Quotation = {
      ...quoteData,
      id: `quote-${crypto.randomUUID()}`,
      quoteNumber: '',
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    for (let attempt = 1; ; attempt++) {
      newQuote.quoteNumber = generateQuoteNumber();
      const { error } = await supabase.from('quotations').insert(toRow(newQuote));
      if (!error) break;
      if (error.code !== UNIQUE_VIOLATION || attempt === 3) throw error;
    }
    return newQuote;
  };

  const updateQuoteStatus = async (
    quoteId: string,
    status: QuoteStatus,
    adminNotes?: string,
    quotedAmount?: number
  ) => {
    const changes = {
      status,
      ...(adminNotes !== undefined ? { adminNotes } : {}),
      ...(quotedAmount !== undefined ? { quotedAmount, quotedAt: new Date().toISOString() } : {}),
    };
    const { error } = await supabase.from('quotations').update(toRow(changes)).eq('id', quoteId);
    if (error) {
      alert(`Could not update quote: ${error.message}`);
      return;
    }
    setQuotations((prev) => prev.map((q) => (q.id === quoteId ? { ...q, ...changes } : q)));
  };

  // Customer quote lookup: needs the quote number AND the phone used on the request
  const trackQuote = async (quoteNumber: string, phone: string): Promise<Quotation | null> => {
    const { data, error } = await supabase.rpc('track_quote', {
      p_quote_number: quoteNumber,
      p_phone: phone,
    });
    if (error) throw error;
    return data?.[0] ? fromRow<Quotation>(data[0]) : null;
  };

  // Contact
  const sendContactMessage = async (msg: Omit<ContactMessage, 'id' | 'isRead' | 'createdAt'>) => {
    const newMsg: ContactMessage = {
      ...msg,
      id: `msg-${crypto.randomUUID()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('contact_messages').insert(toRow(newMsg));
    if (error) throw error;
  };

  const markMessageRead = async (msgId: string) => {
    const { error } = await supabase.from('contact_messages').update({ is_read: true }).eq('id', msgId);
    if (error) {
      alert(`Could not update message: ${error.message}`);
      return;
    }
    setContactMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, isRead: true } : m)));
  };

  // Price Matrix Calculation & Administration
  const getPriceForOptions = (productId: string, rowId: string, colId?: string): number => {
    const match = priceMatrix[productId]?.find((c) => c.optionValueA === rowId && (!colId || c.optionValueB === colId));
    return match ? match.price : 0;
  };

  const getFromPrice = (productId: string): number => {
    const cells = priceMatrix[productId] ?? [];
    return cells.length ? Math.min(...cells.map((c) => c.price)) : 0;
  };

  const updatePriceCell = (productId: string, rowId: string, colId: string, newPrice: number | null) => {
    setPriceMatrix((prev) => {
      const others = (prev[productId] || []).filter((c) => !(c.optionValueA === rowId && c.optionValueB === colId));
      if (newPrice == null) return { ...prev, [productId]: others };
      const cell: PriceMatrixCell = {
        id: `pm-${productId}-${rowId}-${colId}`,
        productId,
        optionValueA: rowId,
        optionValueB: colId,
        price: Math.max(0, newPrice),
        isActive: true,
      };
      return { ...prev, [productId]: [...others, cell] };
    });
  };

  const bulkAdjustGridPrices = (productId: string, percentIncrease: number) => {
    setPriceMatrix((prev) => {
      const currentCells = prev[productId] || [];
      const updated = currentCells.map((c) => {
        const factor = 1 + percentIncrease / 100;
        const newPrice = Math.round((c.price * factor) / 50) * 50; // Round to nearest 50 LKR
        return { ...c, price: newPrice };
      });
      return { ...prev, [productId]: updated };
    });
  };

  // CSV: first column = the product's first option (e.g. paper), one column per second option (e.g. quantity).
  // Empty cell = not offered / price on request.
  const exportGridCSV = (productId: string): string => {
    const product = products.find((p) => p.id === productId);
    const [rowGroup, colGroup] = product?.optionGroups ?? [];
    if (!rowGroup || !colGroup) return '';
    const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [[q(rowGroup.name), ...colGroup.values.map((v) => q(v.label))].join(',')];
    for (const row of rowGroup.values) {
      const cells = colGroup.values.map((col) => String(getPriceForOptions(productId, row.id, col.id) || ''));
      lines.push([q(row.label), ...cells].join(','));
    }
    return lines.join('\n');
  };

  const importGridCSV = (productId: string, csvText: string): boolean => {
    const product = products.find((p) => p.id === productId);
    const [rowGroup, colGroup] = product?.optionGroups ?? [];
    if (!rowGroup || !colGroup) return false;
    const parseLine = (line: string) => {
      const out: string[] = [];
      let cur = '';
      let quoted = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (quoted) {
          if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
          else if (ch === '"') quoted = false;
          else cur += ch;
        } else if (ch === '"') quoted = true;
        else if (ch === ',') { out.push(cur); cur = ''; }
        else cur += ch;
      }
      out.push(cur);
      return out.map((v) => v.trim());
    };
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return false;
    const header = parseLine(lines[0]);
    const colIds = header.slice(1).map((label) => colGroup.values.find((v) => v.label.toLowerCase() === label.toLowerCase())?.id);
    if (colIds.every((id) => !id)) return false;
    let matched = 0;
    for (const line of lines.slice(1)) {
      const parts = parseLine(line);
      const row = rowGroup.values.find((v) => v.label.toLowerCase() === parts[0].toLowerCase());
      if (!row) continue;
      matched++;
      colIds.forEach((colId, i) => {
        if (!colId) return;
        const value = parts[i + 1] ?? '';
        const price = parseFloat(value.replace(/,/g, ''));
        updatePriceCell(productId, row.id, colId, value === '' || isNaN(price) ? null : price);
      });
    }
    return matched > 0;
  };

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    publishProducts([newProduct, ...products]);
    return newProduct;
  };

  const updateProduct = (updated: Product) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? updated : p));
      save(PRODUCTS_KEY, next);
      saveShared('products', { list: next, removed: removedProductIds }).then((err) => err && console.warn(err));
      return next;
    });
  };

  const updateMultipleProducts = (updatedList: Product[]) => {
    setProducts((prev) => {
      const map = new Map(updatedList.map((p) => [p.id, p]));
      const next = prev.map((p) => map.get(p.id) || p);
      save(PRODUCTS_KEY, next);
      saveShared('products', { list: next, removed: removedProductIds }).then((err) => err && console.warn(err));
      return next;
    });
  };

  const saveProducts = () => saveShared('products', { list: products, removed: removedProductIds });

  const deleteProduct = (productId: string) => {
    publishProducts(products.filter((p) => p.id !== productId), [...removedProductIds, productId]);
  };

  const duplicateProduct = (productId: string): Product | undefined => {
    const orig = products.find((p) => p.id === productId);
    if (!orig) return undefined;
    const cloned: Product = {
      ...orig,
      id: `prod-${Date.now()}`,
      name: `${orig.name} (Copy)`,
      slug: `${orig.slug}-copy-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    };
    publishProducts([cloned, ...products]);
    return cloned;
  };

  const updateSiteSettings = (newSettings: Partial<SiteSettings>) => {
    const next = { ...siteSettings, ...newSettings };
    setSiteSettings(next);
    return saveShared('settings', next);
  };

  // Step 1: password. One generic message for every failure so the form never confirms an email or password.
  const loginAdmin = async (email: string, password: string): Promise<string | null> => {
    const INVALID = 'Invalid email or password.';
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error || !data.user) return INVALID;
    // is_admin() needs the 2-step code, so check the admin_users row itself (RLS shows a user only their own row)
    const { data: row } = await supabase.from('admin_users').select('id').eq('id', data.user.id).maybeSingle();
    if (!row) {
      await supabase.auth.signOut();
      return INVALID;
    }
    return null;
  };

  // Step 2a: the admin's verified authenticator, or a fresh one to scan on first login.
  const startAdminMfa = async (): Promise<AdminMfa> => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    if (data.totp[0]) return { factorId: data.totp[0].id }; // totp lists verified factors only
    // A setup abandoned half-way leaves an unverified factor; remove it before starting again
    for (const f of data.all) {
      if (f.factor_type === 'totp' && f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Admin authenticator' });
    if (enrollError) throw enrollError;
    return { factorId: enrolled.id, qrCode: enrolled.totp.qr_code, secret: enrolled.totp.secret };
  };

  // Step 2b: the 6-digit code raises the session to aal2, which is what is_admin() requires.
  const verifyAdminMfa = async (factorId: string, code: string): Promise<string | null> => {
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\s/g, '') });
    if (error) return 'Invalid code. Please try again.';
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (isAdmin !== true) {
      await supabase.auth.signOut();
      return 'Invalid email or password.';
    }
    save(ADMIN_ACTIVE_KEY, Date.now()); // a fresh login starts a fresh idle timer
    setIsAdminLoggedIn(true);
    return null;
  };

  // One sign-out for staff and customers (it is the same Supabase session)
  const logoutAdmin = async () => {
    await supabase.auth.signOut();
    setIsPasswordRecovery(false);
    setIsAdminLoggedIn(false);
    setAdminOrders([]);
    setQuotations([]);
    setContactMessages([]);
    setRegisteredCustomers([]);
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        siteSettings,
        cart,
        orders: isAdminLoggedIn ? adminOrders : orders,
        quotations,
        contactMessages,
        registeredCustomers,
        priceMatrix,
        isAdminLoggedIn,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        cartCount,
        cartTotalQuantity,
        cartSubtotal,
        cartDeliveryFee,
        cartTotal,
        deliveryMethod,
        setDeliveryMethod,
        createOrder,
        updateOrder,
        getOrderById,
        trackOrder,
        createQuote,
        updateQuoteStatus,
        trackQuote,
        sendContactMessage,
        markMessageRead,
        getPriceForOptions,
        getFromPrice,
        updatePriceCell,
        bulkAdjustGridPrices,
        exportGridCSV,
        importGridCSV,
        addProduct,
        updateProduct,
        updateMultipleProducts,
        deleteProduct,
        duplicateProduct,
        updateSiteSettings,
        deleteOrder,
        loginAdmin,
        startAdminMfa,
        verifyAdminMfa,
        logoutAdmin,
        refreshAdminData,
        savePriceMatrix,
        saveProducts,
        customer,
        customerOrders,
        isPasswordRecovery,
        signUpCustomer,
        signInCustomer,
        signOutCustomer: logoutAdmin,
        sendPasswordReset,
        setNewPassword,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
