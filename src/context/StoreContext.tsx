import React, { createContext, useContext, useState, useEffect } from 'react';
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
} from '../types';
import {
  SEED_PRODUCTS,
  SEED_CATEGORIES,
  DEFAULT_SITE_SETTINGS,
  SEED_PRICE_MATRIX,
} from '../data/seedData';
import { generateOrderNumber, generateQuoteNumber } from '../lib/formatters';
import { supabase, toRow, fromRow } from '../lib/supabase';

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
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartTotal: number;

  // Ordering
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => Promise<Order>;
  updateOrder: (orderId: string, changes: Partial<Pick<Order, 'orderStatus' | 'paymentStatus'>>) => Promise<void>;
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
  deleteProduct: (productId: string) => void;
  duplicateProduct: (productId: string) => Product | undefined;
  updateSiteSettings: (newSettings: Partial<SiteSettings>) => void;
  loginAdmin: (username: string, password: string) => Promise<string | null>; // null = success, else error message
  logoutAdmin: () => Promise<void>;
  refreshAdminData: () => Promise<void>;
  savePriceMatrix: () => Promise<string | null>; // null = saved, else error message

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
const PRODUCTS_KEY = 'aiprint_products_v3';

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

// Supabase Auth needs an email, so admin usernames map to an internal address (no mail is ever sent).
const ADMIN_EMAIL_DOMAIN = 'admin.aiprintingsolutions.com';

// Postgres unique violation — a random order/quote number collided, so retry with a new one.
const UNIQUE_VIOLATION = '23505';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage or Seeds
  const [products, setProducts] = useState<Product[]>(() => load(PRODUCTS_KEY, () => SEED_PRODUCTS));

  const [categories] = useState<Category[]>(SEED_CATEGORIES);

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => load('aiprint_settings', () => DEFAULT_SITE_SETTINGS));

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

  // Prices saved by staff in the admin panel override the built-in defaults for every visitor
  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'price_matrix')
      .maybeSingle()
      .then(({ data }) => {
        // Merge per product so products never saved by staff keep their built-in prices
        if (data?.value) setPriceMatrix((prev) => ({ ...prev, ...(data.value as Record<string, PriceMatrixCell[]>) }));
      });
  }, []);

  const savePriceMatrix = async (): Promise<string | null> => {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'price_matrix', value: priceMatrix, updated_at: new Date().toISOString() });
    return error ? error.message : null;
  };
  useEffect(() => save('aiprint_settings', siteSettings), [siteSettings]);
  useEffect(() => save(PRODUCTS_KEY, products), [products]);

  // Session: any signed-in Supabase user is a customer; admins are also listed in admin_users
  useEffect(() => {
    const check = async () => {
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

  // Cart helper functions
  const addToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.length;
  const cartSubtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const cartTotal = cart.length > 0 ? cartSubtotal + siteSettings.deliveryFee : 0;

  // Order Placement
  const createOrder = async (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<Order> => {
    const now = new Date().toISOString();
    // Strip in-browser image previews; the real files are already in Storage (storagePath).
    const items = orderData.items.map((item) => ({
      ...item,
      artworkFiles: item.artworkFiles.map(({ previewUrl: _p, dataUrl: _d, ...file }) => file),
    }));
    const newOrder: Order = {
      ...orderData,
      items,
      id: `ord-${crypto.randomUUID()}`,
      userId: customer?.id,
      orderNumber: '',
      createdAt: now,
      updatedAt: now,
    };
    for (let attempt = 1; ; attempt++) {
      newOrder.orderNumber = generateOrderNumber();
      const { error } = await supabase.from('orders').insert(toRow(newOrder));
      if (!error) break;
      if (error.code !== UNIQUE_VIOLATION || attempt === 3) throw error;
    }
    setOrders((prev) => [newOrder, ...prev]);
    if (customer) setCustomerOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const updateOrder = async (orderId: string, changes: Partial<Pick<Order, 'orderStatus' | 'paymentStatus'>>) => {
    const patch = { ...changes, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('orders').update(toRow(patch)).eq('id', orderId);
    if (error) {
      alert(`Could not update order: ${error.message}`);
      return;
    }
    setAdminOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)));
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
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
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
    setProducts((prev) => [cloned, ...prev]);
    return cloned;
  };

  const updateSiteSettings = (newSettings: Partial<SiteSettings>) => {
    setSiteSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const loginAdmin = async (username: string, password: string): Promise<string | null> => {
    const email = `${username.trim().toLowerCase()}@${ADMIN_EMAIL_DOMAIN}`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message === 'Invalid login credentials' ? 'Wrong username or password.' : error.message;
    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');
    if (rpcError || isAdmin !== true) {
      await supabase.auth.signOut();
      return rpcError
        ? `Signed in, but the admin check failed (${rpcError.message}). Has supabase/schema.sql been run?`
        : 'This account is not an administrator.';
    }
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
        clearCart,
        cartCount,
        cartSubtotal,
        cartTotal,
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
        deleteProduct,
        duplicateProduct,
        updateSiteSettings,
        loginAdmin,
        logoutAdmin,
        refreshAdminData,
        savePriceMatrix,
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
