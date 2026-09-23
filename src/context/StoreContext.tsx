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
  OrderStatus,
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
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getOrderById: (orderId: string) => Order | undefined;
  getOrderByNumber: (orderNumber: string) => Order | undefined;

  // Quotes
  createQuote: (quoteData: Omit<Quotation, 'id' | 'quoteNumber' | 'status' | 'createdAt'>) => Promise<Quotation>;
  updateQuoteStatus: (quoteId: string, status: QuoteStatus, adminNotes?: string, quotedAmount?: number) => void;

  // Contact
  sendContactMessage: (msg: Omit<ContactMessage, 'id' | 'isRead' | 'createdAt'>) => Promise<void>;
  markMessageRead: (msgId: string) => void;

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
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage or Seeds
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('aiprint_products');
    return saved ? JSON.parse(saved) : SEED_PRODUCTS;
  });

  const [categories] = useState<Category[]>(SEED_CATEGORIES);

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('aiprint_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SITE_SETTINGS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('aiprint_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('aiprint_orders');
    if (saved) return JSON.parse(saved);
    // Initial dummy order for demonstration
    return [
      {
        id: 'ord-demo-1',
        orderNumber: 'AIP-2026-0042',
        customerName: 'Roshan Samarajeewa',
        customerEmail: 'roshan.s@example.com',
        customerPhone: '077 412 9087',
        deliveryAddress: '45/2 Havelock Road',
        city: 'Colombo 05',
        district: 'Colombo',
        subtotal: 4800,
        deliveryFee: 400,
        addonTotal: 0,
        total: 5200,
        paymentMethod: 'payhere',
        paymentStatus: 'paid',
        orderStatus: 'in_production',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          {
            id: 'item-demo-1',
            productId: 'prod-vc-double',
            product: SEED_PRODUCTS[0],
            selectedOptions: [
              { groupName: 'Paper Stock', valueLabel: '300gsm Art Board (Gloss Finish)', valueId: 'paper-300-art' },
              { groupName: 'Quantity', valueLabel: '500 Cards', valueId: 'qty-500' },
            ],
            quantityCount: 500,
            unitPrice: 9.6,
            itemPrice: 4800,
            selectedAddons: [],
            artworkType: 'own',
            artworkFiles: [{ slot: 1, fileName: 'front-artwork-final.pdf', fileSize: 1240000, fileType: 'application/pdf' }],
            lineTotal: 4800,
          },
        ],
      },
    ];
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem('aiprint_quotes');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'qt-demo-1',
            quoteNumber: 'QT-2026-0012',
            name: 'Malik Jayawardena',
            email: 'malik@jayaprint.lk',
            phone: '071 889 2311',
            company: 'Lanka Logistics Ltd',
            productType: 'Carbonized (NCR) Bill Books',
            quantity: '150 Books (3-part, sequential numbering from 5001)',
            specifications: 'Custom SVAT invoice format, black and red ink on white/pink/yellow carbonless paper.',
            status: 'new',
            createdAt: new Date().toISOString(),
          },
        ];
  });

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() => {
    const saved = localStorage.getItem('aiprint_messages');
    return saved ? JSON.parse(saved) : [];
  });

  // Price matrix keyed by productId
  const [priceMatrix, setPriceMatrix] = useState<Record<string, PriceMatrixCell[]>>(() => {
    const saved = localStorage.getItem('aiprint_price_matrix');
    if (saved) return JSON.parse(saved);
    return {
      'prod-vc-double': generateCardPriceMatrix('prod-vc-double', true),
      'prod-vc-single': generateCardPriceMatrix('prod-vc-single', false),
    };
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('aiprint_admin_auth') === 'true';
  });

  // Persist changes
  useEffect(() => {
    localStorage.setItem('aiprint_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('aiprint_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('aiprint_quotes', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('aiprint_price_matrix', JSON.stringify(priceMatrix));
  }, [priceMatrix]);

  useEffect(() => {
    localStorage.setItem('aiprint_settings', JSON.stringify(siteSettings));
  }, [siteSettings]);

  useEffect(() => {
    localStorage.setItem('aiprint_products', JSON.stringify(products));
  }, [products]);

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
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: status, updatedAt: new Date().toISOString() } : o))
    );
  };

  const getOrderById = (orderId: string) => orders.find((o) => o.id === orderId);
  const getOrderByNumber = (orderNumber: string) =>
    orders.find((o) => o.orderNumber.toLowerCase() === orderNumber.toLowerCase().trim());

  // Quotations
  const createQuote = async (
    quoteData: Omit<Quotation, 'id' | 'quoteNumber' | 'status' | 'createdAt'>
  ): Promise<Quotation> => {
    const newQuote: Quotation = {
      ...quoteData,
      id: `quote-${Date.now()}`,
      quoteNumber: generateQuoteNumber(),
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    setQuotations((prev) => [newQuote, ...prev]);
    return newQuote;
  };

  const updateQuoteStatus = (
    quoteId: string,
    status: QuoteStatus,
    adminNotes?: string,
    quotedAmount?: number
  ) => {
    setQuotations((prev) =>
      prev.map((q) =>
        q.id === quoteId
          ? {
              ...q,
              status,
              ...(adminNotes !== undefined ? { adminNotes } : {}),
              ...(quotedAmount !== undefined ? { quotedAmount } : {}),
            }
          : q
      )
    );
  };

  // Contact
  const sendContactMessage = async (msg: Omit<ContactMessage, 'id' | 'isRead' | 'createdAt'>) => {
    const newMsg: ContactMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setContactMessages((prev) => [newMsg, ...prev]);
  };

  const markMessageRead = (msgId: string) => {
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

  const loginAdmin = (password: string): boolean => {
    // Default master password for initial administrative setup
    if (password === 'admin123' || password === 'aiprint2026') {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('aiprint_admin_auth', 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('aiprint_admin_auth');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        siteSettings,
        cart,
        orders,
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
        updateOrderStatus,
        getOrderById,
        getOrderByNumber,
        createQuote,
        updateQuoteStatus,
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
