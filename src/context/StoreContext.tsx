import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Category,
  CartItem,
  Order,
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
  generateCardPriceMatrix,
  VISITING_CARD_PAPERS,
  VISITING_CARD_QUANTITIES,
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
  getPriceForOptions: (productId: string, paperId: string, qtyId?: string) => number;
  updatePriceCell: (productId: string, paperId: string, qtyId: string, newPrice: number) => void;
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
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Bump when SEED_PRODUCTS changes so browsers drop their stale saved copy.
const PRODUCTS_KEY = 'aiprint_products_v2';

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
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Price matrix keyed by productId
  const [priceMatrix, setPriceMatrix] = useState<Record<string, PriceMatrixCell[]>>(() => load('aiprint_price_matrix', () => ({
    'prod-vc-double': generateCardPriceMatrix('prod-vc-double', true),
    'prod-vc-single': generateCardPriceMatrix('prod-vc-single', false),
  })));

  // Persist changes
  useEffect(() => save('aiprint_cart', cart), [cart]);
  useEffect(() => save('aiprint_orders', orders), [orders]);
  useEffect(() => save('aiprint_price_matrix', priceMatrix), [priceMatrix]);
  useEffect(() => save('aiprint_settings', siteSettings), [siteSettings]);
  useEffect(() => save(PRODUCTS_KEY, products), [products]);

  // Admin session: a Supabase Auth user who is listed in admin_users
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.rpc('is_admin');
      setIsAdminLoggedIn(data === true);
    };
    check();
    // Supabase warns against awaiting its own calls inside this callback, so defer the check.
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setTimeout(check, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshAdminData = async () => {
    const [o, q, m] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('quotations').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
    ]);
    for (const res of [o, q, m]) if (res.error) console.error('Admin data load failed:', res.error);
    setAdminOrders((o.data ?? []).map((row) => fromRow<Order>(row)));
    setQuotations((q.data ?? []).map((row) => fromRow<Quotation>(row)));
    setContactMessages((m.data ?? []).map((row) => fromRow<ContactMessage>(row)));
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
  const cartTotal = cartSubtotal > 0 ? cartSubtotal + siteSettings.deliveryFee : 0;

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
  const getPriceForOptions = (productId: string, paperId: string, qtyId?: string): number => {
    const matrix = priceMatrix[productId];
    if (!matrix || matrix.length === 0) {
      // Fallback base
      const prod = products.find((p) => p.id === productId);
      return prod ? prod.basePrice : 1000;
    }
    const match = matrix.find((c) => c.optionValueA === paperId && (!qtyId || c.optionValueB === qtyId));
    return match ? match.price : 1000;
  };

  const updatePriceCell = (productId: string, paperId: string, qtyId: string, newPrice: number) => {
    setPriceMatrix((prev) => {
      const currentCells = prev[productId] || [];
      const updated = currentCells.map((c) =>
        c.optionValueA === paperId && c.optionValueB === qtyId ? { ...c, price: Math.max(0, newPrice) } : c
      );
      return { ...prev, [productId]: updated };
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

  const exportGridCSV = (productId: string): string => {
    const matrix = priceMatrix[productId] || [];
    // Header: Paper Stock, 100, 200, 300, ...
    const headers = ['Paper Stock', ...VISITING_CARD_QUANTITIES.map((q) => q.label)];
    const rows: string[] = [headers.join(',')];

    for (const paper of VISITING_CARD_PAPERS) {
      const rowVals: (string | number)[] = [`"${paper.label}"`];
      for (const qty of VISITING_CARD_QUANTITIES) {
        const cell = matrix.find((c) => c.optionValueA === paper.id && c.optionValueB === qty.id);
        rowVals.push(cell ? cell.price : 0);
      }
      rows.push(rowVals.join(','));
    }
    return rows.join('\n');
  };

  const importGridCSV = (productId: string, csvText: string): boolean => {
    try {
      const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) return false;
      // Parse rows
      const matrix = [...(priceMatrix[productId] || [])];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length < 2) continue;
        const paperLabel = parts[0].replace(/"/g, '').trim();
        const paper = VISITING_CARD_PAPERS.find((p) => p.label.toLowerCase() === paperLabel.toLowerCase());
        if (!paper) continue;

        for (let qIdx = 0; qIdx < VISITING_CARD_QUANTITIES.length; qIdx++) {
          const qty = VISITING_CARD_QUANTITIES[qIdx];
          const valStr = parts[qIdx + 1];
          if (valStr) {
            const price = parseFloat(valStr);
            if (!isNaN(price)) {
              const cellIdx = matrix.findIndex(
                (c) => c.optionValueA === paper.id && c.optionValueB === qty.id
              );
              if (cellIdx >= 0) {
                matrix[cellIdx].price = price;
              }
            }
          }
        }
      }
      setPriceMatrix((prev) => ({ ...prev, [productId]: matrix }));
      return true;
    } catch (e) {
      console.error('Failed to import CSV:', e);
      return false;
    }
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

  const logoutAdmin = async () => {
    await supabase.auth.signOut();
    setIsAdminLoggedIn(false);
    setAdminOrders([]);
    setQuotations([]);
    setContactMessages([]);
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
