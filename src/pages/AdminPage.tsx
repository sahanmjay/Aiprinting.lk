import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Grid,
  FileText,
  Settings as SettingsIcon,
  Package,
  Layers,
  Lock,
  LogOut,
  Download,
  Upload,
  Percent,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  FileCheck,
  Save,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Search,
  ExternalLink,
  Mail,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatLKR, getWhatsAppUrl } from '../lib/formatters';
import { openStoredFile } from '../lib/supabase';
import {
  VISITING_CARD_PAPERS,
  VISITING_CARD_QUANTITIES,
} from '../data/seedData';
import { OrderStatus, PaymentStatus, QuoteStatus, Order, Product } from '../types';

// "delivered" is the completed state (kept as the DB value; shown to staff as Completed)
const ORDER_STATUS: Record<OrderStatus, { label: string; badge: string }> = {
  new: { label: 'New', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  confirmed: { label: 'Confirmed', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  in_production: { label: 'In Production', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  ready: { label: 'Ready to Dispatch', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  delivered: { label: 'Completed', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  cancelled: { label: 'Cancelled', badge: 'bg-red-100 text-red-800 border-red-200' },
};
const PAYMENT_STATUS: Record<PaymentStatus, { label: string; badge: string }> = {
  pending: { label: 'Unpaid', badge: 'bg-slate-100 text-slate-700' },
  verification_needed: { label: 'Check slip', badge: 'bg-amber-100 text-amber-800' },
  paid: { label: 'Paid', badge: 'bg-emerald-100 text-emerald-800' },
  failed: { label: 'Failed', badge: 'bg-red-100 text-red-800' },
};
const ACTIVE_STATUSES: OrderStatus[] = ['new', 'confirmed', 'in_production', 'ready'];
const DAY_MS = 86400000;

export const AdminPage: React.FC = () => {
  const {
    orders,
    quotations,
    products,
    categories,
    siteSettings,
    priceMatrix,
    isAdminLoggedIn,
    loginAdmin,
    logoutAdmin,
    updateOrder,
    updateQuoteStatus,
    contactMessages,
    markMessageRead,
    refreshAdminData,
    savePriceMatrix,
    updatePriceCell,
    bulkAdjustGridPrices,
    exportGridCSV,
    importGridCSV,
    addProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    updateSiteSettings,
  } = useStore();

  // Authentication State
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'orders' | 'pricegrid' | 'products' | 'quotes' | 'messages' | 'settings'
  >('dashboard');

  // Orders Tab State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<'all' | 'unpaid' | PaymentStatus>('all');
  const [orderDateFilter, setOrderDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');

  // Price Grid Editor State
  const [selectedGridProduct, setSelectedGridProduct] = useState<'prod-vc-double' | 'prod-vc-single'>(
    'prod-vc-double'
  );
  const [gridPaperId, setGridPaperId] = useState<string>(VISITING_CARD_PAPERS[0].id);
  const [pricesDirty, setPricesDirty] = useState(false);
  const [isSavingPrices, setIsSavingPrices] = useState(false);
  const [bulkPercentInput, setBulkPercentInput] = useState<number>(5);
  const [gridSaveToast, setGridSaveToast] = useState<boolean>(false);
  const [csvUploadText, setCsvUploadText] = useState<string>('');
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);

  // Site Settings Tab State
  const [settingsForm, setSettingsForm] = useState(siteSettings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Products Management State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    categoryId: 'cat-visiting-cards',
    basePrice: 1000,
    shortDescription: '',
    longDescription: '',
    imageUrl: '',
    deliveryNote: 'Island-wide delivery within 1–2 days, Rs. 400 extra.',
    sizeNote: '',
    isHot: false,
    isFeatured: false,
    isActive: true,
    isVariable: true,
  });

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      slug: '',
      categoryId: categories[0]?.id || 'cat-visiting-cards',
      basePrice: 1000,
      shortDescription: '',
      longDescription: '',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=85',
      deliveryNote: 'Island-wide delivery within 1–2 days, Rs. 400 extra.',
      sizeNote: '',
      isHot: false,
      isFeatured: false,
      isActive: true,
      isVariable: true,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      slug: p.slug,
      categoryId: p.categoryId,
      basePrice: p.basePrice,
      shortDescription: p.shortDescription,
      longDescription: p.longDescription,
      imageUrl: p.images[0]?.imageUrl || '',
      deliveryNote: p.deliveryNote,
      sizeNote: p.sizeNote || '',
      isHot: p.isHot,
      isFeatured: p.isFeatured,
      isActive: p.isActive,
      isVariable: p.isVariable,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    const category = categories.find((c) => c.id === productForm.categoryId);
    const slug =
      productForm.slug.trim() ||
      productForm.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name: productForm.name,
        slug,
        categoryId: productForm.categoryId,
        categoryName: category?.name,
        basePrice: productForm.basePrice,
        shortDescription: productForm.shortDescription,
        longDescription: productForm.longDescription,
        deliveryNote: productForm.deliveryNote,
        sizeNote: productForm.sizeNote,
        isHot: productForm.isHot,
        isFeatured: productForm.isFeatured,
        isActive: productForm.isActive,
        isVariable: productForm.isVariable,
        images: [
          {
            id: editingProduct.images[0]?.id || `img-${Date.now()}`,
            productId: editingProduct.id,
            imageUrl:
              productForm.imageUrl ||
              'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=85',
            altText: productForm.name,
            sortOrder: 1,
            isPrimary: true,
          },
          ...editingProduct.images.slice(1),
        ],
      };
      updateProduct(updated);
    } else {
      addProduct({
        name: productForm.name,
        slug,
        categoryId: productForm.categoryId,
        categoryName: category?.name,
        basePrice: productForm.basePrice,
        shortDescription: productForm.shortDescription,
        longDescription: productForm.longDescription,
        deliveryNote: productForm.deliveryNote,
        sizeNote: productForm.sizeNote,
        isHot: productForm.isHot,
        isFeatured: productForm.isFeatured,
        isActive: productForm.isActive,
        isVariable: productForm.isVariable,
        sortOrder: products.length + 1,
        images: [
          {
            id: `img-${Date.now()}`,
            productId: `prod-temp`,
            imageUrl:
              productForm.imageUrl ||
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=85',
            altText: productForm.name,
            sortOrder: 1,
            isPrimary: true,
          },
        ],
        optionGroups: [
          {
            id: `grp-paper-${Date.now()}`,
            productId: `prod-temp`,
            name: 'Paper Stock / Material',
            inputType: 'select',
            isRequired: true,
            sortOrder: 1,
            values: VISITING_CARD_PAPERS.map((p, idx) => ({
              id: p.id,
              groupId: `grp-paper-${Date.now()}`,
              label: p.label,
              sortOrder: idx + 1,
              isActive: true,
              finishType: p.finishType,
            })),
          },
          {
            id: `grp-qty-${Date.now()}`,
            productId: `prod-temp`,
            name: 'Quantity',
            inputType: 'select',
            isRequired: true,
            sortOrder: 2,
            values: VISITING_CARD_QUANTITIES.map((q, idx) => ({
              id: q.id,
              groupId: `grp-qty-${Date.now()}`,
              label: q.label,
              sortOrder: idx + 1,
              isActive: true,
            })),
          },
        ],
      });
    }
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (productId: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteProduct(productId);
    }
  };

  const handleDuplicateProduct = (productId: string) => {
    const copy = duplicateProduct(productId);
    if (copy) {
      alert(`Product duplicated successfully as "${copy.name}"!`);
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white p-8 rounded-lg border border-[#E6E0D6] shadow-md space-y-6 text-center">
          <div className="w-14 h-14 rounded-full bg-[#0F1B2D] text-white flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-[#D6342C]" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#0F1B2D]">Staff Administration Portal</h1>
            <p className="text-xs text-slate-500">
              Enter authorized administrator credentials to manage print orders, price grids, and catalogue.
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSigningIn(true);
              setAuthError(await loginAdmin(usernameInput.trim(), passwordInput));
              setIsSigningIn(false);
            }}
            className="space-y-4 text-xs text-left"
          >
            <div className="space-y-1">
              <label htmlFor="admin-username" className="font-bold text-slate-700">Username</label>
              <input
                id="admin-username"
                type="text"
                autoCapitalize="none"
                spellCheck={false}
                autoComplete="username"
                required
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setAuthError(null);
                }}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="admin-password" className="font-bold text-slate-700">Password</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setAuthError(null);
                }}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
              />
              {authError && <p role="alert" className="text-red-500 text-[11px]">{authError}</p>}
            </div>

            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full py-3 bg-[#0F1B2D] hover:bg-[#182A45] text-white font-bold text-xs rounded transition-colors shadow-sm disabled:opacity-60"
            >
              {isSigningIn ? 'Signing in…' : 'Sign In to Admin Portal'}
            </button>
          </form>

          <div className="text-[11px] text-slate-400">
            Protected under internal pre-press security policies.
          </div>
        </div>
      </div>
    );
  }

  // Filter orders
  const searchText = orderSearch.trim().toLowerCase();
  const searchDigits = searchText.replace(/\D/g, '');
  const since = {
    all: 0,
    today: new Date().setHours(0, 0, 0, 0),
    '7d': Date.now() - 7 * DAY_MS,
    '30d': Date.now() - 30 * DAY_MS,
  }[orderDateFilter];

  const filteredOrders = orders.filter((o) => {
    const matchStatus =
      orderStatusFilter === 'all' ||
      (orderStatusFilter === 'active' ? ACTIVE_STATUSES.includes(o.orderStatus) : o.orderStatus === orderStatusFilter);
    const matchPayment =
      orderPaymentFilter === 'all' ||
      (orderPaymentFilter === 'unpaid' ? o.paymentStatus !== 'paid' : o.paymentStatus === orderPaymentFilter);
    const matchDate = new Date(o.createdAt).getTime() >= since;
    const matchSearch =
      !searchText ||
      [o.orderNumber, o.customerName, o.customerEmail, o.city, o.district, ...o.items.map((i) => i.product.name)].some(
        (v) => v?.toLowerCase().includes(searchText)
      ) ||
      (searchDigits.length >= 3 && o.customerPhone.replace(/\D/g, '').includes(searchDigits));
    return matchStatus && matchPayment && matchDate && matchSearch;
  });
  const filteredTotal = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const statusCount = (status: string) =>
    status === 'all'
      ? orders.length
      : status === 'active'
        ? orders.filter((o) => ACTIVE_STATUSES.includes(o.orderStatus)).length
        : orders.filter((o) => o.orderStatus === status).length;

  // One click to finish an order; offers to record the payment at the same time.
  const completeOrder = async (o: Order) => {
    const markPaid =
      o.paymentStatus !== 'paid' &&
      window.confirm(
        `Completing ${o.orderNumber}.\n\nHas the customer paid ${formatLKR(o.total)}?\nOK = also mark as PAID\nCancel = complete without changing payment`
      );
    const changes = { orderStatus: 'delivered' as OrderStatus, ...(markPaid ? { paymentStatus: 'paid' as PaymentStatus } : {}) };
    await updateOrder(o.id, changes);
    if (selectedOrder?.id === o.id) setSelectedOrder({ ...o, ...changes });
  };

  const orderWhatsAppUrl = (o: Order) =>
    getWhatsAppUrl(
      o.customerPhone,
      `Hi ${o.customerName}, this is Ai Printing Solutions about your order ${o.orderNumber} (${formatLKR(o.total)}). Current status: ${ORDER_STATUS[o.orderStatus].label}.`
    );

  const exportOrdersCSV = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Order #', 'Date', 'Customer', 'Phone', 'Email', 'City', 'District', 'Items', 'Payment Method', 'Payment Status', 'Order Status', 'Total (LKR)'],
      ...filteredOrders.map((o) => [
        o.orderNumber,
        new Date(o.createdAt).toLocaleDateString('en-GB'),
        o.customerName,
        o.customerPhone,
        o.customerEmail,
        o.city,
        o.district,
        o.items.map((i) => i.product.name).join('; '),
        o.paymentMethod.replace('_', ' '),
        PAYMENT_STATUS[o.paymentStatus].label,
        ORDER_STATUS[o.orderStatus].label,
        o.total,
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculation for dashboard stats
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrdersCount = orders.filter((o) => ['new', 'confirmed'].includes(o.orderStatus)).length;
  const pendingQuotesCount = quotations.filter((q) => q.status === 'new').length;

  const gridPrice = (paperId: string, qtyId: string) =>
    priceMatrix[selectedGridProduct]?.find((c) => c.optionValueA === paperId && c.optionValueB === qtyId)?.price ?? 0;

  const setGridPrice = (paperId: string, qtyId: string, price: number) => {
    updatePriceCell(selectedGridProduct, paperId, qtyId, price);
    setPricesDirty(true);
  };

  // Raise (or lower, with a negative number) prices by a percentage, rounded to the nearest Rs. 50
  const applyPercent = (scope: 'paper' | 'all') => {
    if (!bulkPercentInput) return;
    const direction = bulkPercentInput > 0 ? 'Increase' : 'Decrease';
    const target = scope === 'all' ? 'ALL papers' : 'this paper';
    if (!confirm(`${direction} prices of ${target} by ${Math.abs(bulkPercentInput)}%?\nPrices are rounded to the nearest Rs. 50.`)) return;
    if (scope === 'all') {
      bulkAdjustGridPrices(selectedGridProduct, bulkPercentInput);
    } else {
      for (const qty of VISITING_CARD_QUANTITIES) {
        const price = gridPrice(gridPaperId, qty.id);
        updatePriceCell(selectedGridProduct, gridPaperId, qty.id, Math.round((price * (1 + bulkPercentInput / 100)) / 50) * 50);
      }
    }
    setPricesDirty(true);
  };

  const handleSavePrices = async () => {
    setIsSavingPrices(true);
    const error = await savePriceMatrix();
    setIsSavingPrices(false);
    if (error) {
      alert(`Could not save prices: ${error}`);
      return;
    }
    setPricesDirty(false);
    setGridSaveToast(true);
    setTimeout(() => setGridSaveToast(false), 3000);
  };

  const handleExportCSV = () => {
    const csvContent = exportGridCSV(selectedGridProduct);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedGridProduct}-price-grid.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSVSubmit = () => {
    if (!csvUploadText.trim()) return;
    const success = importGridCSV(selectedGridProduct, csvUploadText);
    if (success) {
      setPricesDirty(true);
      alert('CSV imported. Press "Save Prices" to publish the new prices.');
      setShowCsvModal(false);
      setCsvUploadText('');
    } else {
      alert('Failed to parse CSV. Please ensure columns match paper stocks and quantities.');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings(settingsForm);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Admin Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[#0F1B2D] text-white p-4 sm:p-6 rounded-lg shadow-sm">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#D6342C]">
            Backoffice Management Portal
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Ai Printing Solutions Admin
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300 hidden sm:inline">
            Logged in as Staff Administrator
          </span>
          <button
            onClick={async () => {
              setIsRefreshing(true);
              await refreshAdminData();
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={logoutAdmin}
            className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-[#E6E0D6] gap-2 sm:gap-4 overflow-x-auto pb-1 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-white border-t-2 border-[#D6342C] text-[#0F1B2D] shadow-xs'
              : 'text-slate-600 hover:text-[#0F1B2D]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t transition-colors relative ${
            activeTab === 'orders'
              ? 'bg-white border-t-2 border-[#D6342C] text-[#0F1B2D] shadow-xs'
              : 'text-slate-600 hover:text-[#0F1B2D]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders ({orders.length})</span>
          {pendingOrdersCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-[#D6342C]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('pricegrid')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t transition-colors ${
            activeTab === 'pricegrid'
              ? 'bg-white border-t-2 border-[#D6342C] text-[#0F1B2D] shadow-xs'
              : 'text-slate-600 hover:text-[#0F1B2D]'
          }`}
        >
          <Grid className="w-4 h-4 text-[#D6342C]" />
          <span>Card Prices</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t transition-colors ${
            activeTab === 'products'
              ? 'bg-white border-t-2 border-[#D6342C] text-[#0F1B2D] shadow-xs'
              : 'text-slate-600 hover:text-[#0F1B2D]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t transition-colors ${
            activeTab === 'quotes'
              ? 'bg-white border-t-2 border-[#D6342C] text-[#0F1B2D] shadow-xs'
              : 'text-slate-600 hover:text-[#0F1B2D]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Quotations ({quotations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t transition-colors ${
            activeTab === 'messages'
              ? 'bg-white border-t-2 border-[#D6342C] text-[#0F1B2D] shadow-xs'
              : 'text-slate-600 hover:text-[#0F1B2D]'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Messages ({contactMessages.length})</span>
          {contactMessages.some((m) => !m.isRead) && <span className="w-2 h-2 rounded-full bg-[#D6342C]" />}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t transition-colors ${
            activeTab === 'settings'
              ? 'bg-white border-t-2 border-[#D6342C] text-[#0F1B2D] shadow-xs'
              : 'text-slate-600 hover:text-[#0F1B2D]'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Site Settings</span>
        </button>
      </div>

      {(activeTab === 'products' || activeTab === 'settings') && (
        <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded">
          Changes on this tab are saved in this browser only and are not yet stored in the database.
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DASHBOARD OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-lg border border-[#E6E0D6] shadow-xs space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Orders Logged
              </div>
              <div className="text-3xl font-bold text-[#0F1B2D]">{orders.length}</div>
              <div className="text-[11px] text-emerald-600 font-semibold">
                {pendingOrdersCount} orders in queue
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-[#E6E0D6] shadow-xs space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Processed Revenue
              </div>
              <div className="text-3xl font-bold text-[#D6342C]">{formatLKR(totalRevenue)}</div>
              <div className="text-[11px] text-slate-500">Excluding cancelled orders</div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-[#E6E0D6] shadow-xs space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pending Quotations
              </div>
              <div className="text-3xl font-bold text-amber-600">{pendingQuotesCount}</div>
              <div className="text-[11px] text-slate-500">Awaiting prepress estimate</div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-[#E6E0D6] shadow-xs space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Active Catalog Lines
              </div>
              <div className="text-3xl font-bold text-[#0F1B2D]">{products.length}</div>
              <div className="text-[11px] text-slate-500">{categories.length} Categories</div>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-[#E6E0D6] pb-3">
              <h3 className="font-bold text-sm text-[#0F1B2D] uppercase tracking-wider">
                Recent Orders Feed
              </h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-[#D6342C] hover:underline"
              >
                View all orders &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                    <th className="py-2">Order #</th>
                    <th className="py-2">Customer</th>
                    <th className="py-2">District</th>
                    <th className="py-2">Total</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-mono font-bold text-[#0F1B2D]">{o.orderNumber}</td>
                      <td className="py-2.5 font-semibold text-slate-800">{o.customerName}</td>
                      <td className="py-2.5 text-slate-600">{o.district}</td>
                      <td className="py-2.5 font-bold text-[#0F1B2D]">{formatLKR(o.total)}</td>
                      <td className="py-2.5 uppercase font-semibold text-[10px] text-slate-700">
                        {o.orderStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ORDERS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Status tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-semibold">
            {[
              ['all', 'All'],
              ['active', 'Active'],
              ['new', 'New'],
              ['confirmed', 'Confirmed'],
              ['in_production', 'In Production'],
              ['ready', 'Ready'],
              ['delivered', 'Completed'],
              ['cancelled', 'Cancelled'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setOrderStatusFilter(value)}
                className={`shrink-0 px-3 py-1.5 rounded-full border transition-colors ${
                  orderStatusFilter === value
                    ? 'bg-[#0F1B2D] text-white border-[#0F1B2D]'
                    : 'bg-white text-slate-600 border-[#E6E0D6] hover:border-[#0F1B2D]'
                }`}
              >
                {label} <span className="opacity-70">({statusCount(value)})</span>
              </button>
            ))}
          </div>

          {/* Search + filters */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 bg-white p-4 rounded-lg border border-[#E6E0D6] text-xs">
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Search order #, name, phone, email, city or product…"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-8 pr-2 py-2 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
              />
            </div>
            <select
              aria-label="Payment filter"
              value={orderPaymentFilter}
              onChange={(e) => setOrderPaymentFilter(e.target.value as typeof orderPaymentFilter)}
              className="p-2 bg-[#FAF8F5] border border-[#E6E0D6] rounded font-medium"
            >
              <option value="all">All payments</option>
              <option value="unpaid">Not paid yet</option>
              <option value="verification_needed">Slip to check</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
            <select
              aria-label="Date filter"
              value={orderDateFilter}
              onChange={(e) => setOrderDateFilter(e.target.value as typeof orderDateFilter)}
              className="p-2 bg-[#FAF8F5] border border-[#E6E0D6] rounded font-medium"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <button
              onClick={exportOrdersCSV}
              disabled={filteredOrders.length === 0}
              className="px-3 py-2 border border-[#0F1B2D] text-[#0F1B2D] font-semibold rounded flex items-center justify-center gap-1.5 hover:bg-slate-50 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong className="text-[#0F1B2D]">{filteredOrders.length}</strong> of {orders.length} orders ·
            Value <strong className="text-[#0F1B2D]">{formatLKR(filteredTotal)}</strong>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg border border-[#E6E0D6] shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E6E0D6] text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No orders match these filters.
                    </td>
                  </tr>
                )}
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 align-top">
                    <td className="p-3">
                      <div className="font-mono font-bold text-[#0F1B2D]">{o.orderNumber}</div>
                      <div className="text-[11px] text-slate-500">{new Date(o.createdAt).toLocaleDateString('en-GB')}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-[#0F1B2D]">{o.customerName}</div>
                      <div className="text-[11px] text-slate-500">{o.customerPhone} · {o.city}</div>
                    </td>
                    <td className="p-3 max-w-[180px]">
                      <div className="truncate text-slate-700" title={o.items.map((i) => i.product.name).join(', ')}>
                        {o.items[0]?.product.name ?? '—'}
                      </div>
                      {o.items.length > 1 && <div className="text-[11px] text-slate-400">+{o.items.length - 1} more</div>}
                    </td>
                    <td className="p-3">
                      <div className="uppercase text-[11px] font-semibold text-slate-700">{o.paymentMethod.replace('_', ' ')}</div>
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${PAYMENT_STATUS[o.paymentStatus].badge}`}>
                        {PAYMENT_STATUS[o.paymentStatus].label}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[#D6342C] whitespace-nowrap">{formatLKR(o.total)}</td>
                    <td className="p-3">
                      <select
                        aria-label={`Status of ${o.orderNumber}`}
                        value={o.orderStatus}
                        onChange={(e) => updateOrder(o.id, { orderStatus: e.target.value as OrderStatus })}
                        className={`p-1 text-[11px] font-bold uppercase rounded border ${ORDER_STATUS[o.orderStatus].badge}`}
                      >
                        {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((st) => (
                          <option key={st} value={st} className="bg-white text-slate-800">
                            {ORDER_STATUS[st].label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {ACTIVE_STATUSES.includes(o.orderStatus) && (
                          <button
                            onClick={() => completeOrder(o)}
                            title="Mark this order as completed"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Complete
                          </button>
                        )}
                        <a
                          href={orderWhatsAppUrl(o)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp customer"
                          aria-label={`WhatsApp ${o.customerName}`}
                          className="p-1.5 rounded border border-[#25D366]/40 text-[#128C7E] hover:bg-[#25D366]/10"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-2.5 py-1 bg-[#0F1B2D] text-white text-[11px] font-semibold rounded hover:bg-[#182A45]"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selected Order Detail Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
                <div className="flex justify-between items-center border-b border-[#E6E0D6] pb-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Order Details</span>
                    <h3 className="text-xl font-bold font-mono text-[#0F1B2D]">
                      {selectedOrder.orderNumber}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><strong>Customer:</strong> {selectedOrder.customerName}</div>
                  <div><strong>Phone:</strong> {selectedOrder.customerPhone}</div>
                  <div><strong>Email:</strong> {selectedOrder.customerEmail}</div>
                  <div><strong>Delivery Address:</strong> {selectedOrder.deliveryAddress}, {selectedOrder.city} ({selectedOrder.district})</div>
                  <div><strong>Payment Method:</strong> {selectedOrder.paymentMethod.replace('_', ' ')}</div>
                  <div><strong>Order Status:</strong> {ORDER_STATUS[selectedOrder.orderStatus].label}</div>
                  <label className="flex items-center gap-2">
                    <strong>Payment Status:</strong>
                    <select
                      value={selectedOrder.paymentStatus}
                      onChange={(e) => {
                        const paymentStatus = e.target.value as PaymentStatus;
                        updateOrder(selectedOrder.id, { paymentStatus });
                        setSelectedOrder({ ...selectedOrder, paymentStatus });
                      }}
                      className="p-1 text-[11px] font-bold uppercase rounded border border-slate-300 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="verification_needed">Verify Slip</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                    </select>
                  </label>
                  {selectedOrder.bankSlipUrl && (
                    <button
                      onClick={() => openStoredFile('artwork-uploads', selectedOrder.bankSlipUrl!)}
                      className="flex items-center gap-1 text-left text-[#D6342C] font-semibold hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View bank slip ({selectedOrder.bankSlipName || 'file'})
                    </button>
                  )}
                  {selectedOrder.specialInstructions && (
                    <div className="col-span-2"><strong>Instructions:</strong> {selectedOrder.specialInstructions}</div>
                  )}
                </div>

                {/* Items & Artwork */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-xs uppercase text-slate-500">Configured Items & Artwork</h4>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#FAF8F5] rounded border border-[#E6E0D6] text-xs space-y-2">
                      <div className="flex justify-between font-bold text-[#0F1B2D]">
                        <span>{item.product.name}</span>
                        <span>{formatLKR(item.lineTotal)}</span>
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        {item.selectedOptions.map((o) => `${o.groupName}: ${o.valueLabel}`).join(' · ')}
                      </div>
                      {item.artworkFiles.length > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="font-bold text-[11px] text-slate-700 block">Uploaded Artwork Files:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.artworkFiles.map((art, fIdx) => (
                              <button
                                key={fIdx}
                                disabled={!art.storagePath}
                                onClick={() => art.storagePath && openStoredFile('artwork-uploads', art.storagePath)}
                                title={art.storagePath ? 'Open file' : 'File was not uploaded'}
                                className="px-2 py-1 bg-white border border-slate-300 rounded text-[10px] flex items-center gap-1 font-mono enabled:hover:border-[#0F1B2D] disabled:opacity-60"
                              >
                                <FileCheck className="w-3 h-3 text-emerald-600" />
                                {art.fileName}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-[#E6E0D6]">
                  <a
                    href={orderWhatsAppUrl(selectedOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-[#25D366]/50 text-[#128C7E] text-xs font-bold rounded flex items-center gap-1.5 hover:bg-[#25D366]/10"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Customer
                  </a>
                  {ACTIVE_STATUSES.includes(selectedOrder.orderStatus) && (
                    <button
                      onClick={() => completeOrder(selectedOrder)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Complete
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 bg-[#0F1B2D] text-white text-xs font-bold rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PRICE GRID EDITOR (Prompt 5 Critical Feature) */}
      {/* ========================================================================= */}
      {activeTab === 'pricegrid' && (
        <div className="space-y-5">
          {/* Header: card type + save */}
          <div className="bg-white p-5 rounded-lg border border-[#E6E0D6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F1B2D]">Visiting Card Prices</h3>
              <p className="text-xs text-slate-500">Choose a paper, change its prices, then press Save.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded border border-[#E6E0D6] p-0.5 bg-[#FAF8F5]">
                {(
                  [
                    ['prod-vc-double', 'Double Sided'],
                    ['prod-vc-single', 'Single Sided'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedGridProduct(id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                      selectedGridProduct === id ? 'bg-[#0F1B2D] text-white' : 'text-slate-600 hover:text-[#0F1B2D]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSavePrices}
                disabled={!pricesDirty || isSavingPrices}
                className="px-4 py-2 bg-[#D6342C] hover:bg-[#B8251E] text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSavingPrices ? 'Saving…' : pricesDirty ? 'Save Prices' : 'All Saved'}
              </button>
            </div>
          </div>

          {pricesDirty && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded">
              You have unsaved changes. Customers still see the old prices until you press <strong>Save Prices</strong>.
            </div>
          )}
          {gridSaveToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Prices saved. Customers now see the new prices.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Step 1: paper */}
            <div className="lg:col-span-4 bg-white rounded-lg border border-[#E6E0D6] shadow-xs overflow-hidden">
              <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-[#E6E0D6]">
                1. Choose paper
              </div>
              {VISITING_CARD_PAPERS.map((paper) => {
                const isSelected = gridPaperId === paper.id;
                return (
                  <button
                    key={paper.id}
                    onClick={() => setGridPaperId(paper.id)}
                    className={`w-full text-left px-4 py-2.5 text-xs border-b border-[#F0EBE1] last:border-0 flex justify-between items-center gap-3 transition-colors ${
                      isSelected ? 'bg-[#0F1B2D] text-white' : 'text-[#0F1B2D] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span className="font-semibold">{paper.label}</span>
                    <span className={`shrink-0 text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      from {formatLKR(gridPrice(paper.id, VISITING_CARD_QUANTITIES[0].id))}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Step 2: prices for that paper */}
            <div className="lg:col-span-8 bg-white rounded-lg border border-[#E6E0D6] shadow-xs overflow-hidden">
              <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-[#E6E0D6]">
                2. Set prices — {VISITING_CARD_PAPERS.find((p) => p.id === gridPaperId)?.label}
              </div>
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase text-slate-500 bg-[#FAF8F5]">
                  <tr>
                    <th className="px-4 py-2 text-left">Quantity</th>
                    <th className="px-4 py-2 text-left">Price (Rs.)</th>
                    <th className="px-4 py-2 text-right">Per card</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {VISITING_CARD_QUANTITIES.map((qty) => {
                    const price = gridPrice(gridPaperId, qty.id);
                    return (
                      <tr key={qty.id} className="hover:bg-[#FAF8F5]">
                        <td className="px-4 py-1.5 font-semibold text-[#0F1B2D]">{qty.label}</td>
                        <td className="px-4 py-1.5">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            aria-label={`Price for ${qty.label}`}
                            value={price}
                            onChange={(e) => setGridPrice(gridPaperId, qty.id, parseFloat(e.target.value) || 0)}
                            className="w-32 p-1.5 font-bold text-slate-800 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:border-[#0F1B2D] outline-hidden"
                          />
                        </td>
                        <td className="px-4 py-1.5 text-right text-slate-500">{formatLKR(price / qty.count)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Quick percentage change */}
              <div className="p-4 border-t border-[#E6E0D6] bg-[#FAF8F5] flex flex-wrap items-center gap-2 text-xs">
                <Percent className="w-4 h-4 text-[#D6342C]" />
                <span className="font-bold text-slate-700">Change prices by</span>
                <input
                  type="number"
                  aria-label="Percentage change"
                  value={bulkPercentInput}
                  onChange={(e) => setBulkPercentInput(parseFloat(e.target.value) || 0)}
                  className="w-16 p-1.5 text-center font-bold border border-[#E6E0D6] rounded bg-white"
                />
                <span className="font-bold text-slate-700">%</span>
                <button
                  onClick={() => applyPercent('paper')}
                  className="px-3 py-1.5 bg-white border border-[#0F1B2D] text-[#0F1B2D] font-semibold rounded hover:bg-slate-50"
                >
                  This paper
                </button>
                <button
                  onClick={() => applyPercent('all')}
                  className="px-3 py-1.5 bg-[#0F1B2D] text-white font-semibold rounded hover:bg-[#182A45]"
                >
                  All papers
                </button>
                <span className="text-slate-400">Use a minus number to lower prices, e.g. -5</span>
              </div>
            </div>
          </div>

          {/* Spreadsheet tools, out of the way */}
          <details className="bg-white rounded-lg border border-[#E6E0D6] text-xs">
            <summary className="cursor-pointer px-4 py-3 font-semibold text-slate-600">
              Spreadsheet import / export (advanced)
            </summary>
            <div className="px-4 pb-4 flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 border border-[#0F1B2D] text-[#0F1B2D] font-semibold rounded hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                onClick={() => setShowCsvModal(true)}
                className="px-3 py-1.5 bg-[#0F1B2D] text-white font-semibold rounded hover:bg-[#182A45] flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Import CSV
              </button>
              <span className="text-slate-400">Edit all 126 prices in Excel, then paste them back.</span>
            </div>
          </details>

          {/* CSV Import Modal */}
          {showCsvModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-[#E6E0D6] pb-2">
                  <h4 className="font-bold text-sm text-[#0F1B2D]">
                    Import CSV to {selectedGridProduct} Matrix
                  </h4>
                  <button
                    onClick={() => setShowCsvModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Paste comma-separated spreadsheet values. Header must include paper stock followed by quantities (100, 200, ...).
                </p>
                <textarea
                  rows={8}
                  placeholder="Paste CSV contents here..."
                  value={csvUploadText}
                  onChange={(e) => setCsvUploadText(e.target.value)}
                  className="w-full p-2 text-xs bg-[#FAF8F5] border border-[#E6E0D6] rounded font-mono"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowCsvModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 border border-slate-300 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportCSVSubmit}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#0F1B2D] hover:bg-[#182A45] rounded"
                  >
                    Apply CSV Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PRODUCTS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Top Control Bar */}
          <div className="bg-white p-5 rounded-lg border border-[#E6E0D6] shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">
                Product Catalogue Manager
              </div>
              <h3 className="text-xl font-bold text-[#0F1B2D]">
                Commercial Products ({products.length})
              </h3>
            </div>

            <button
              onClick={handleOpenAddProduct}
              className="px-4 py-2.5 bg-[#D6342C] hover:bg-[#B8251E] text-white text-xs font-bold rounded flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg border border-[#E6E0D6]">
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by title, description..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 whitespace-nowrap">Filter category:</span>
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="p-2 text-xs bg-[#FAF8F5] border border-[#E6E0D6] rounded font-medium"
              >
                <option value="all">All Categories ({products.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products
              .filter((p) => {
                const matchCat =
                  productCategoryFilter === 'all' || p.categoryId === productCategoryFilter;
                const matchSearch =
                  !productSearch.trim() ||
                  p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                  p.shortDescription.toLowerCase().includes(productSearch.toLowerCase());
                return matchCat && matchSearch;
              })
              .map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-lg border border-[#E6E0D6] shadow-xs overflow-hidden flex flex-col justify-between group hover:border-[#0F1B2D] transition-colors"
                >
                  <div>
                    {/* Thumbnail & Badges */}
                    <div className="relative aspect-16/9 bg-slate-100 overflow-hidden border-b border-[#E6E0D6]">
                      <img
                        src={p.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=85'}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 flex gap-1">
                        {p.isHot && (
                          <span className="px-2 py-0.5 bg-[#D6342C] text-white font-bold text-[9px] uppercase rounded shadow-xs">
                            HOT
                          </span>
                        )}
                        {p.isFeatured && (
                          <span className="px-2 py-0.5 bg-[#0F1B2D] text-white font-bold text-[9px] uppercase rounded shadow-xs">
                            FEATURED
                          </span>
                        )}
                        {!p.isActive && (
                          <span className="px-2 py-0.5 bg-red-600 text-white font-bold text-[9px] uppercase rounded shadow-xs">
                            INACTIVE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {p.categoryName || 'General'}
                        </span>
                        <span className="text-xs font-bold text-[#0F1B2D]">
                          From {formatLKR(p.basePrice)}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-[#0F1B2D] leading-snug">
                        {p.name}
                      </h4>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {p.shortDescription}
                      </p>

                      <div className="text-[10px] text-slate-400 font-mono pt-1">
                        slug: /{p.slug}
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="p-3 bg-[#FAF8F5] border-t border-[#E6E0D6] flex items-center justify-between gap-2 text-xs">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenEditProduct(p)}
                        className="px-2.5 py-1.5 bg-[#0F1B2D] hover:bg-[#182A45] text-white font-bold text-[11px] rounded flex items-center gap-1 transition-colors"
                        title="Edit all product fields"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDuplicateProduct(p.id)}
                        className="p-1.5 border border-slate-300 hover:bg-white text-slate-700 rounded transition-colors"
                        title="Duplicate Product"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="p-1.5 border border-slate-300 hover:bg-red-50 text-red-600 rounded transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <a
                      href={`/product/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-[#0F1B2D] hover:text-[#D6342C] flex items-center gap-1"
                    >
                      <span>Storefront</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
          </div>

          {/* ADD / EDIT PRODUCT MODAL */}
          {isProductModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b border-[#E6E0D6] pb-3">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#D6342C]">
                      {editingProduct ? 'Update Catalogue' : 'New Listing'}
                    </div>
                    <h3 className="text-xl font-bold text-[#0F1B2D]">
                      {editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Commercial Product'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsProductModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Product Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Die-Cut Vinyl Label Stickers"
                        value={productForm.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setProductForm((prev) => ({
                            ...prev,
                            name,
                            // auto-generate slug if adding new product
                            ...(!editingProduct
                              ? {
                                  slug: name
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/(^-|-$)/g, ''),
                                }
                              : {}),
                          }));
                        }}
                        className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">URL Slug *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. die-cut-vinyl-stickers"
                        value={productForm.slug}
                        onChange={(e) =>
                          setProductForm({ ...productForm, slug: e.target.value.toLowerCase() })
                        }
                        className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Category *</label>
                      <select
                        value={productForm.categoryId}
                        onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                        className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded font-medium"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Base / Starting Price (LKR) *</label>
                      <input
                        type="number"
                        step="50"
                        required
                        placeholder="e.g. 1000"
                        value={productForm.basePrice}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            basePrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden font-bold"
                      />
                    </div>
                  </div>

                  {/* Image URL & Preset Pickers */}
                  <div className="space-y-1.5 pt-1">
                    <label className="font-bold text-slate-700">Primary Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={productForm.imageUrl}
                        onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                        className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
                      />
                      {productForm.imageUrl && (
                        <div className="w-10 h-10 rounded border border-slate-300 overflow-hidden shrink-0 bg-slate-100">
                          <img
                            src={productForm.imageUrl}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    {/* Preset Image Quick Selector */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400">Sample Presets:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm({
                            ...productForm,
                            imageUrl:
                              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=85',
                          })
                        }
                        className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                      >
                        Stickers
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm({
                            ...productForm,
                            imageUrl:
                              'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=85',
                          })
                        }
                        className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                      >
                        Bill Books
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm({
                            ...productForm,
                            imageUrl:
                              'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=85',
                          })
                        }
                        className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                      >
                        Visiting Cards
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm({
                            ...productForm,
                            imageUrl:
                              'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=85',
                          })
                        }
                        className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                      >
                        Posters
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm({
                            ...productForm,
                            imageUrl:
                              'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=85',
                          })
                        }
                        className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                      >
                        Letterheads
                      </button>
                    </div>
                  </div>

                  {/* Short Description */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Short Description (Catalog Summary)</label>
                    <input
                      type="text"
                      placeholder="Brief one-line highlight of the product..."
                      value={productForm.shortDescription}
                      onChange={(e) =>
                        setProductForm({ ...productForm, shortDescription: e.target.value })
                      }
                      className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  {/* Long Description */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Detailed Description</label>
                    <textarea
                      rows={3}
                      placeholder="Full commercial details, finish specifications, paper grades..."
                      value={productForm.longDescription}
                      onChange={(e) =>
                        setProductForm({ ...productForm, longDescription: e.target.value })
                      }
                      className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  {/* Delivery & Size Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Delivery Note</label>
                      <input
                        type="text"
                        value={productForm.deliveryNote}
                        onChange={(e) =>
                          setProductForm({ ...productForm, deliveryNote: e.target.value })
                        }
                        className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Size & Special Finishes Note</label>
                      <input
                        type="text"
                        placeholder="e.g. Standard sizes or custom dimensions..."
                        value={productForm.sizeNote}
                        onChange={(e) =>
                          setProductForm({ ...productForm, sizeNote: e.target.value })
                        }
                        className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
                      />
                    </div>
                  </div>

                  {/* Checkbox Flags */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={productForm.isHot}
                        onChange={(e) =>
                          setProductForm({ ...productForm, isHot: e.target.checked })
                        }
                        className="accent-[#D6342C]"
                      />
                      <span>Hot Item</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={productForm.isFeatured}
                        onChange={(e) =>
                          setProductForm({ ...productForm, isFeatured: e.target.checked })
                        }
                        className="accent-[#0F1B2D]"
                      />
                      <span>Featured</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={productForm.isActive}
                        onChange={(e) =>
                          setProductForm({ ...productForm, isActive: e.target.checked })
                        }
                        className="accent-emerald-600"
                      />
                      <span>Active</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={productForm.isVariable}
                        onChange={(e) =>
                          setProductForm({ ...productForm, isVariable: e.target.checked })
                        }
                        className="accent-[#0F1B2D]"
                      />
                      <span>Variable Pricing</span>
                    </label>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-[#E6E0D6]">
                    <button
                      type="button"
                      onClick={() => setIsProductModalOpen(false)}
                      className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#D6342C] hover:bg-[#B8251E] text-white font-bold rounded flex items-center gap-2 shadow-sm transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. QUOTATIONS PIPELINE */}
      {/* ========================================================================= */}
      {activeTab === 'quotes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-[#E6E0D6] shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E6E0D6] text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Quote #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Product & Qty</th>
                  <th className="p-3">Specifications</th>
                  <th className="p-3">Price (LKR, incl. delivery)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-[#0F1B2D]">{q.quoteNumber}</td>
                    <td className="p-3 text-slate-500">{new Date(q.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="font-bold text-[#0F1B2D]">{q.name}</div>
                      <div className="text-[11px] text-slate-500">{q.phone} · {q.email}</div>
                      {q.company && <div className="text-[10px] text-slate-400">{q.company}</div>}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{q.productType}</div>
                      <div className="text-slate-500">{q.quantity}</div>
                    </td>
                    <td className="p-3 max-w-xs text-slate-600">
                      <div className="truncate" title={q.specifications}>{q.specifications}</div>
                      {q.deadline && <div className="text-[10px] text-slate-400">Needed by {q.deadline}</div>}
                      {q.attachmentUrl && (
                        <button
                          onClick={() => openStoredFile('quote-attachments', q.attachmentUrl!)}
                          className="mt-1 flex items-center gap-1 text-[11px] text-[#D6342C] font-semibold hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {q.attachmentName || 'Attachment'}
                        </button>
                      )}
                    </td>
                    <td className="p-3 space-y-1">
                      {/* Saving a price marks the quote "quoted"; the customer can then download it at /quote */}
                      <input
                        key={q.quotedAmount ?? 'unpriced'}
                        type="number"
                        min="0"
                        step="any"
                        defaultValue={q.quotedAmount ?? ''}
                        placeholder="Enter price"
                        aria-label={`Price for ${q.quoteNumber}`}
                        onBlur={(e) => {
                          if (e.target.value === '') return;
                          const price = Number(e.target.value);
                          if (price === q.quotedAmount || price < 0) return;
                          updateQuoteStatus(q.id, q.status === 'new' ? 'quoted' : q.status, undefined, price);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        className="w-28 p-1 text-[11px] rounded border border-slate-300 bg-white"
                      />
                      {q.quotedAmount != null && (
                        <a
                          href={getWhatsAppUrl(
                            q.phone,
                            `Hi ${q.name}, your quotation ${q.quoteNumber} from Ai Printing Solutions is ready: ${formatLKR(q.quotedAmount)}.\n\nDownload the official quotation (PDF) at ${window.location.origin}/quote using your quotation number and phone number.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-[#128C7E] font-semibold hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Send to customer
                        </a>
                      )}
                    </td>
                    <td className="p-3">
                      <select
                        value={q.status}
                        onChange={(e) => updateQuoteStatus(q.id, e.target.value as QuoteStatus)}
                        className="p-1 text-[11px] font-bold uppercase rounded border border-slate-300 bg-white"
                      >
                        <option value="new">New</option>
                        <option value="quoted">Quoted</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-3">
          {contactMessages.length === 0 && (
            <div className="bg-white p-8 rounded-lg border border-[#E6E0D6] text-center text-xs text-slate-500">
              No contact messages yet.
            </div>
          )}
          {contactMessages.map((m) => (
            <div
              key={m.id}
              className={`bg-white p-4 rounded-lg border shadow-xs text-xs space-y-2 ${
                m.isRead ? 'border-[#E6E0D6]' : 'border-[#D6342C]/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <div>
                  <div className="font-bold text-sm text-[#0F1B2D]">{m.subject}</div>
                  <div className="text-slate-500">
                    {m.name} · <a href={`mailto:${m.email}`} className="hover:underline">{m.email}</a>
                    {m.phone && <> · <a href={`tel:${m.phone}`} className="hover:underline">{m.phone}</a></>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-400">{new Date(m.createdAt).toLocaleString()}</span>
                  {m.isRead ? (
                    <span className="text-emerald-700 font-semibold">Read</span>
                  ) : (
                    <button
                      onClick={() => markMessageRead(m.id)}
                      className="px-2.5 py-1 bg-[#0F1B2D] text-white text-[11px] font-semibold rounded hover:bg-[#182A45]"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{m.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SITE SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 sm:p-8 rounded-lg border border-[#E6E0D6] shadow-xs space-y-6 max-w-3xl">
          <div className="border-b border-[#E6E0D6] pb-3">
            <h3 className="text-base font-bold text-[#0F1B2D] uppercase tracking-wider">
              Global Platform Settings
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Changes updated here immediately update the website headers, footers, delivery fees, and order dispatch notifications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Official Hotline Number</label>
              <input
                type="text"
                value={settingsForm.hotline}
                onChange={(e) => setSettingsForm({ ...settingsForm, hotline: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Landline Number</label>
              <input
                type="text"
                value={settingsForm.landline}
                onChange={(e) => setSettingsForm({ ...settingsForm, landline: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">WhatsApp Hotline Number</label>
              <input
                type="text"
                value={settingsForm.whatsapp}
                onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Standard Island-Wide Delivery Fee (LKR)</label>
              <input
                type="number"
                value={settingsForm.deliveryFee}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, deliveryFee: parseFloat(e.target.value) || 0 })
                }
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">General Contact Email</label>
              <input
                type="email"
                value={settingsForm.email}
                onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Artwork Submissions Email</label>
              <input
                type="email"
                value={settingsForm.artworkEmail}
                onChange={(e) => setSettingsForm({ ...settingsForm, artworkEmail: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700">Top Announcement Bar Text</label>
              <input
                type="text"
                value={settingsForm.announcementText}
                onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="submit"
              className="px-6 py-3 bg-[#0F1B2D] hover:bg-[#182A45] text-white text-xs font-bold rounded flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>

            {settingsSaved && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Settings saved successfully!
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
