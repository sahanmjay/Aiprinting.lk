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
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatLKR } from '../lib/formatters';
import {
  VISITING_CARD_PAPERS,
  VISITING_CARD_QUANTITIES,
} from '../data/seedData';
import { OrderStatus, QuoteStatus, Order, Product } from '../types';

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
    updateOrderStatus,
    updateQuoteStatus,
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
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'orders' | 'pricegrid' | 'products' | 'quotes' | 'settings'
  >('dashboard');

  // Orders Tab State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');

  // Price Grid Editor State
  const [selectedGridProduct, setSelectedGridProduct] = useState<'prod-vc-double' | 'prod-vc-single'>(
    'prod-vc-double'
  );
  const [bulkPercentInput, setBulkPercentInput] = useState<number>(8); // Default 8% increase tool
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
            onSubmit={(e) => {
              e.preventDefault();
              const ok = loginAdmin(passwordInput);
              if (!ok) setAuthError(true);
            }}
            className="space-y-4 text-xs text-left"
          >
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Access Key / Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setAuthError(false);
                }}
                placeholder="Enter password (default: admin123)"
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
              />
              {authError && (
                <p className="text-red-500 text-[11px]">Invalid master password. Please re-enter.</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0F1B2D] hover:bg-[#182A45] text-white font-bold text-xs rounded transition-colors shadow-sm"
            >
              Sign In to Admin Portal
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
  const filteredOrders = orders.filter((o) => {
    const matchStatus = orderStatusFilter === 'all' || o.orderStatus === orderStatusFilter;
    const matchSearch =
      !orderSearch.trim() ||
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerPhone.includes(orderSearch);
    return matchStatus && matchSearch;
  });

  // Calculation for dashboard stats
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrdersCount = orders.filter((o) => ['new', 'confirmed'].includes(o.orderStatus)).length;
  const pendingQuotesCount = quotations.filter((q) => q.status === 'new').length;

  const handleBulkPercent = () => {
    if (isNaN(bulkPercentInput)) return;
    if (confirm(`Are you sure you want to apply a ${bulkPercentInput}% price adjustment across all 126 cells of this grid?`)) {
      bulkAdjustGridPrices(selectedGridProduct, bulkPercentInput);
      setGridSaveToast(true);
      setTimeout(() => setGridSaveToast(false), 3000);
    }
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
      alert('CSV successfully imported into price matrix!');
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
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Ai Printing Solutions Admin
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300 hidden sm:inline">
            Logged in as Staff Administrator
          </span>
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
          <span>Price Grid Editor (126-Cells)</span>
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
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-lg border border-[#E6E0D6]">
            <input
              type="text"
              placeholder="Search by order #, customer name, phone..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="p-2 text-xs bg-[#FAF8F5] border border-[#E6E0D6] rounded w-full sm:w-80 focus:outline-hidden"
            />

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Status filter:</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="p-2 text-xs bg-[#FAF8F5] border border-[#E6E0D6] rounded font-medium"
              >
                <option value="all">All Statuses ({orders.length})</option>
                <option value="new">New</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_production">In Production</option>
                <option value="ready">Ready to Dispatch</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg border border-[#E6E0D6] shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E6E0D6] text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-[#0F1B2D]">{o.orderNumber}</td>
                    <td className="p-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="font-bold text-[#0F1B2D]">{o.customerName}</div>
                      <div className="text-[11px] text-slate-500">{o.customerPhone}</div>
                    </td>
                    <td className="p-3 uppercase text-[11px] font-semibold text-slate-700">
                      {o.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="p-3 font-bold text-[#D6342C]">{formatLKR(o.total)}</td>
                    <td className="p-3">
                      <select
                        value={o.orderStatus}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                        className="p-1 text-[11px] font-bold uppercase rounded border border-slate-300 bg-white"
                      >
                        <option value="new">New</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_production">In Production</option>
                        <option value="ready">Ready</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="px-2.5 py-1 bg-[#0F1B2D] text-white text-[11px] font-semibold rounded hover:bg-[#182A45]"
                      >
                        Details
                      </button>
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
                  <div><strong>Payment Method:</strong> {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})</div>
                  <div><strong>Order Status:</strong> {selectedOrder.orderStatus}</div>
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
                          <div className="flex gap-2 mt-1">
                            {item.artworkFiles.map((art, fIdx) => (
                              <span key={fIdx} className="px-2 py-1 bg-white border border-slate-300 rounded text-[10px] flex items-center gap-1 font-mono">
                                <FileCheck className="w-3 h-3 text-emerald-600" />
                                {art.fileName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-[#E6E0D6]">
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
        <div className="space-y-6">
          {/* Top Controls Bar */}
          <div className="bg-white p-6 rounded-lg border border-[#E6E0D6] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">
                  Live Spreadsheet Grid
                </div>
                <h3 className="text-xl font-bold text-[#0F1B2D]">
                  Visiting Cards Pricing Matrix (9 Paper Boards × 14 Quantities = 126 Cells)
                </h3>
              </div>

              {/* Product Switcher */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedGridProduct('prod-vc-double')}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                    selectedGridProduct === 'prod-vc-double'
                      ? 'bg-[#0F1B2D] text-white'
                      : 'bg-[#FAF8F5] text-slate-700 border border-slate-200'
                  }`}
                >
                  Double Sided Cards
                </button>
                <button
                  onClick={() => setSelectedGridProduct('prod-vc-single')}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                    selectedGridProduct === 'prod-vc-single'
                      ? 'bg-[#0F1B2D] text-white'
                      : 'bg-[#FAF8F5] text-slate-700 border border-slate-200'
                  }`}
                >
                  Single Sided Cards
                </button>
              </div>
            </div>

            {/* Bulk Markup & CSV Tools */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E6E0D6]">
              {/* Bulk % increase tool (e.g. +8% client requirement) */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Bulk Percentage Adjustment:
                </span>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={bulkPercentInput}
                    onChange={(e) => setBulkPercentInput(parseFloat(e.target.value) || 0)}
                    className="w-16 p-1.5 text-xs border border-[#0F1B2D] rounded-l text-center font-bold"
                  />
                  <span className="bg-slate-100 border-y border-r border-[#0F1B2D] px-2 py-1.5 text-xs font-bold text-slate-700">
                    %
                  </span>
                </div>
                <button
                  onClick={handleBulkPercent}
                  className="px-3 py-1.5 bg-[#D6342C] hover:bg-[#B8251E] text-white text-xs font-bold rounded transition-colors flex items-center gap-1"
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Apply Across Entire 126 Grid</span>
                </button>
              </div>

              {/* CSV Import/Export */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 border border-[#0F1B2D] text-[#0F1B2D] text-xs font-semibold rounded hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setShowCsvModal(true)}
                  className="px-3 py-1.5 bg-[#0F1B2D] text-white text-xs font-semibold rounded hover:bg-[#182A45] flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import CSV</span>
                </button>
              </div>
            </div>

            {gridSaveToast && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Price matrix recalculation applied and live in storefront!</span>
              </div>
            )}
          </div>

          {/* SPREADSHEET MATRIX TABLE */}
          <div className="bg-white rounded-lg border border-[#E6E0D6] shadow-xs overflow-x-auto max-h-[600px] relative">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0F1B2D] text-white sticky top-0 z-20">
                <tr>
                  <th className="p-2.5 font-bold uppercase text-[10px] tracking-wider border border-[#1E2E46] sticky left-0 bg-[#0F1B2D] min-w-[200px]">
                    Paper Board Option
                  </th>
                  {VISITING_CARD_QUANTITIES.map((q) => (
                    <th
                      key={q.id}
                      className="p-2.5 font-bold uppercase text-[10px] tracking-wider border border-[#1E2E46] text-center min-w-[90px]"
                    >
                      {q.count} Cards
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VISITING_CARD_PAPERS.map((paper, pIdx) => (
                  <tr
                    key={paper.id}
                    className={pIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]'}
                  >
                    {/* Paper Label (Sticky Left) */}
                    <td className="p-2.5 font-semibold text-[#0F1B2D] border border-[#E6E0D6] sticky left-0 bg-inherit shadow-xs">
                      <div>{paper.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal capitalize">
                        {paper.finishType}
                      </div>
                    </td>

                    {/* Quantity Cells */}
                    {VISITING_CARD_QUANTITIES.map((qty) => {
                      const cells = priceMatrix[selectedGridProduct] || [];
                      const cell = cells.find(
                        (c) => c.optionValueA === paper.id && c.optionValueB === qty.id
                      );
                      const currentPrice = cell ? cell.price : 0;

                      return (
                        <td
                          key={qty.id}
                          className="p-1 border border-[#E6E0D6] text-center hover:bg-amber-50/70 transition-colors"
                        >
                          <input
                            type="number"
                            step="50"
                            value={currentPrice}
                            onChange={(e) =>
                              updatePriceCell(
                                selectedGridProduct,
                                paper.id,
                                qty.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full p-1.5 text-center text-xs font-bold text-slate-800 bg-transparent hover:bg-white focus:bg-white focus:ring-1 focus:ring-[#0F1B2D] rounded outline-hidden"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                    <td className="p-3 max-w-xs truncate text-slate-600" title={q.specifications}>
                      {q.specifications}
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
