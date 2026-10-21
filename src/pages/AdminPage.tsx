import React, { useEffect, useRef, useState } from 'react';
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
  Users,
  ExternalLink,
  Mail,
  RefreshCw,
  MessageCircle,
  ChevronUp,
  ChevronDown,
  GripVertical,
  ArrowUpDown,
  Palette,
  Check,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatLKR, formatItemPrice, getWhatsAppUrl } from '../lib/formatters';
import { openStoredFile, downloadStoredFile, uploadImage, deleteUploadedImage, IMAGE_GUIDE } from '../lib/supabase';
import { HERO_SLIDES } from '../components/home/HeroShowcase';
import { DEFAULT_SITE_SETTINGS } from '../data/seedData';
import { tableOptionGroups, optionId, finishOf } from '../data/priceTables';
import { OrderStatus, PaymentStatus, QuoteStatus, Order, Product, SiteSettings, SocialLinks, OptionValue } from '../types';

const MAX_PRODUCT_PHOTOS = 4;

// Small "Upload" button around a hidden file input (images only)
const UploadButton: React.FC<{ busy: boolean; label: string; onFile: (file: File) => void }> = ({ busy, label, onFile }) => (
  <label
    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold text-white cursor-pointer transition-colors ${
      busy ? 'bg-slate-400 pointer-events-none' : 'bg-[#0F1B2D] hover:bg-[#182A45]'
    }`}
  >
    {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
    {busy ? 'Uploading…' : label}
    <input
      type="file"
      accept="image/*"
      className="sr-only"
      disabled={busy}
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) onFile(file);
      }}
    />
  </label>
);

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
    registeredCustomers,
    markMessageRead,
    refreshAdminData,
    savePriceMatrix,
    updatePriceCell,
    getFromPrice,
    bulkAdjustGridPrices,
    exportGridCSV,
    importGridCSV,
    addProduct,
    updateProduct,
    updateMultipleProducts,
    deleteProduct,
    duplicateProduct,
    updateSiteSettings,
    saveProducts,
  } = useStore();

  // Authentication State
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'orders' | 'pricegrid' | 'products' | 'quotes' | 'messages' | 'customers' | 'settings'
  >('dashboard');

  // Orders Tab State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<'all' | 'unpaid' | PaymentStatus>('all');
  const [orderDateFilter, setOrderDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');

  // Price Grid Editor State
  const [selectedGridProduct, setSelectedGridProduct] = useState<string>('prod-vc-double');
  const [gridPaperId, setGridPaperId] = useState<string>('');
  const [pricesDirty, setPricesDirty] = useState(false);
  const [isSavingPrices, setIsSavingPrices] = useState(false);
  const [bulkPercentInput, setBulkPercentInput] = useState<number>(5);
  const [gridSaveToast, setGridSaveToast] = useState<boolean>(false);
  const [csvUploadText, setCsvUploadText] = useState<string>('');
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [newStockLabel, setNewStockLabel] = useState('');
  const [newStockFinish, setNewStockFinish] = useState<'auto' | 'gloss' | 'matte' | 'metallic' | 'ribbed' | 'standard'>('auto');
  const [newStockAtTop, setNewStockAtTop] = useState(false);
  const [alsoSyncSingleSidedStock, setAlsoSyncSingleSidedStock] = useState(true);
  const [showAddQty, setShowAddQty] = useState(false);
  const [newQtyLabel, setNewQtyLabel] = useState('');
  const [autoSortNewQty, setAutoSortNewQty] = useState(true);
  const [alsoSyncSingleSidedQty, setAlsoSyncSingleSidedQty] = useState(true);

  // Drag-and-drop state for paper stocks and quantity tiers
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null);
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [dragOverColIndex, setDragOverColIndex] = useState<number | null>(null);

  // Inline editing state for paper stock names
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockName, setEditingStockName] = useState('');

  // Site Settings Tab State
  const [settingsForm, setSettingsForm] = useState(siteSettings);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  useEffect(() => {
    if (!settingsDirty) setSettingsForm(siteSettings); // settings arrive from Supabase after the first paint
  }, [siteSettings, settingsDirty]);
  const editSettings = (patch: Partial<SiteSettings>) => {
    setSettingsDirty(true);
    setSettingsForm((f) => ({ ...f, ...patch }));
  };
  const editBank = (patch: Partial<SiteSettings['bankDetails']>) => editSettings({ bankDetails: { ...settingsForm.bankDetails, ...patch } });
  const editSocial = (patch: Partial<SocialLinks>) => editSettings({ socialLinks: { ...settingsForm.socialLinks, ...patch } });

  // Website images (hero banners, client logos, bank logo) are saved the moment they are uploaded or removed;
  // the replaced file is deleted from Storage to keep it small.
  const [imageBusy, setImageBusy] = useState<string | null>(null);
  const [newLogoName, setNewLogoName] = useState('');
  const saveImageSetting = async (
    busyKey: string,
    file: File,
    maxSize: number,
    patch: (url: string) => Partial<SiteSettings>,
    oldUrl?: string
  ) => {
    setImageBusy(busyKey);
    try {
      const url = await uploadImage(file, { bucket: 'site-assets', maxSize });
      const err = await updateSiteSettings(patch(url));
      if (err) {
        deleteUploadedImage(url);
        alert(`Could not save: ${err}`);
      } else deleteUploadedImage(oldUrl);
    } catch (err) {
      alert(`Upload failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setImageBusy(null);
    }
  };
  const removeImageSetting = async (patch: Partial<SiteSettings>, oldUrl?: string) => {
    const err = await updateSiteSettings(patch);
    if (err) alert(`Could not save: ${err}`);
    else deleteUploadedImage(oldUrl);
  };

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
    imageUrls: [] as string[], // first = main photo
    deliveryNote: 'Island-wide delivery within 1–2 days, Rs. 400 extra.',
    sizeNote: '',
    isHot: false,
    isFeatured: false,
    isActive: true,
    isVariable: true,
    artworkFee: 500,
    hasArtworkOption: true,
    setAsCategoryCover: true,
  });

  // Photos uploaded while the editor is open; the ones not kept are removed again to save Storage space
  const pendingUploads = useRef<string[]>([]);
  const [photoLink, setPhotoLink] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const imageInUse = (url: string, exceptProductId?: string) =>
    products.some((p) => p.id !== exceptProductId && p.images.some((i) => i.imageUrl === url));

  const photosFull = productForm.imageUrls.length >= MAX_PRODUCT_PHOTOS;
  const addProductPhoto = (url: string) =>
    setProductForm((f) =>
      !url || f.imageUrls.includes(url) || f.imageUrls.length >= MAX_PRODUCT_PHOTOS ? f : { ...f, imageUrls: [...f.imageUrls, url] }
    );
  const removeProductPhoto = (url: string) => setProductForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((u) => u !== url) }));
  const makeMainPhoto = (url: string) => setProductForm((f) => ({ ...f, imageUrls: [url, ...f.imageUrls.filter((u) => u !== url)] }));

  const handleUploadProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])].slice(0, MAX_PRODUCT_PHOTOS - productForm.imageUrls.length);
    e.target.value = '';
    if (!files.length) return;
    setImageUploading(true);
    try {
      for (const file of files) {
        const url = await uploadImage(file);
        pendingUploads.current.push(url);
        addProductPhoto(url);
      }
    } catch (err) {
      alert(`Upload failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setImageUploading(false);
    }
  };

  const productImages = (productId: string, urls: string[], alt: string) =>
    (urls.length ? urls : ['/images/products/placeholder.webp']).map((imageUrl, i) => ({
      id: `img-${productId}-${Date.now()}-${i + 1}`,
      productId,
      imageUrl,
      altText: alt,
      sortOrder: i + 1,
      isPrimary: i === 0,
    }));

  const closeProductModal = (keptUrls: string[] = []) => {
    pendingUploads.current.filter((u) => !keptUrls.includes(u)).forEach((u) => deleteUploadedImage(u));
    pendingUploads.current = [];
    setIsProductModalOpen(false);
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      slug: '',
      categoryId: categories[0]?.id || 'cat-visiting-cards',
      basePrice: 1000,
      shortDescription: '',
      longDescription: '',
      imageUrls: [],
      deliveryNote: 'Island-wide delivery within 1–2 days, Rs. 400 extra.',
      sizeNote: '',
      isHot: false,
      isFeatured: false,
      isActive: true,
      isVariable: true,
      artworkFee: siteSettings.defaultArtworkFee ?? 500,
      hasArtworkOption: true,
      setAsCategoryCover: true,
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
      imageUrls: p.images.map((i) => i.imageUrl),
      deliveryNote: p.deliveryNote,
      sizeNote: p.sizeNote || '',
      isHot: p.isHot,
      isFeatured: p.isFeatured,
      isActive: p.isActive,
      isVariable: p.isVariable,
      artworkFee: p.artworkFee ?? siteSettings.defaultArtworkFee ?? 500,
      hasArtworkOption: p.hasArtworkOption ?? true,
      setAsCategoryCover: true,
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
        artworkFee: productForm.artworkFee,
        hasArtworkOption: productForm.hasArtworkOption,
        images: productImages(editingProduct.id, productForm.imageUrls, productForm.name),
      };
      updateProduct(updated);
      editingProduct.images
        .map((i) => i.imageUrl)
        .filter((u) => !productForm.imageUrls.includes(u) && !imageInUse(u, editingProduct.id))
        .forEach((u) => deleteUploadedImage(u));
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
        artworkFee: productForm.artworkFee,
        hasArtworkOption: productForm.hasArtworkOption,
        sortOrder: products.length + 1,
        images: productImages('prod-temp', productForm.imageUrls, productForm.name),
        // Starts as "price on request"; edit its options/prices under Admin → Prices
        optionGroups: tableOptionGroups(`prod-new-${Date.now()}`, {
          rowName: 'Option',
          colName: 'Quantity',
          rows: ['Standard'],
          cols: ['100', '250', '500', '1,000'],
        }),
      });
    }

    if (productForm.setAsCategoryCover && productForm.imageUrls[0]) {
      updateSiteSettings({
        categoryImages: {
          ...(siteSettings.categoryImages || {}),
          [productForm.categoryId]: productForm.imageUrls[0],
        },
      });
    }

    closeProductModal(productForm.imageUrls);
  };

  const handleDeleteProduct = (productId: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      const urls = products.find((p) => p.id === productId)?.images.map((i) => i.imageUrl) ?? [];
      deleteProduct(productId);
      urls.filter((u) => !imageInUse(u, productId)).forEach((u) => deleteUploadedImage(u));
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

  // Price editor works on any product: rows = its first option (e.g. paper), columns = its second (e.g. quantity)
  const gridProduct = products.find((p) => p.id === selectedGridProduct);
  const gridRows = gridProduct?.optionGroups?.[0]?.values ?? [];
  const gridCols = gridProduct?.optionGroups?.[1]?.values ?? [];
  const activeRowId = gridRows.some((v) => v.id === gridPaperId) ? gridPaperId : (gridRows[0]?.id ?? '');
  const unitCount = (label: string) => Number((label.replace(/,/g, '').match(/\d+/) || [0])[0]);

  const gridPrice = (rowId: string, colId: string) =>
    priceMatrix[selectedGridProduct]?.find((c) => c.optionValueA === rowId && c.optionValueB === colId)?.price;

  const rowFromPrice = (rowId: string) => {
    const prices = gridCols.map((c) => gridPrice(rowId, c.id)).filter((p): p is number => p != null);
    return prices.length ? Math.min(...prices) : null;
  };

  const setGridPrice = (rowId: string, colId: string, price: number | null) => {
    updatePriceCell(selectedGridProduct, rowId, colId, price);
    setPricesDirty(true);
  };

  // Raise (or lower, with a negative number) prices by a percentage, rounded to the nearest Rs. 50
  const applyPercent = (scope: 'paper' | 'all') => {
    if (!bulkPercentInput) return;
    const direction = bulkPercentInput > 0 ? 'Increase' : 'Decrease';
    const target = scope === 'all' ? `ALL options of ${gridProduct?.name}` : 'this option';
    if (!confirm(`${direction} prices of ${target} by ${Math.abs(bulkPercentInput)}%?\nPrices are rounded to the nearest Rs. 50.`)) return;
    if (scope === 'all') {
      bulkAdjustGridPrices(selectedGridProduct, bulkPercentInput);
    } else {
      for (const col of gridCols) {
        const price = gridPrice(activeRowId, col.id);
        if (price == null) continue;
        updatePriceCell(selectedGridProduct, activeRowId, col.id, Math.round((price * (1 + bulkPercentInput / 100)) / 50) * 50);
      }
    }
    setPricesDirty(true);
  };

  const handleAddPaperStock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gridProduct || !gridProduct.optionGroups?.[0]) return;
    const label = newStockLabel.trim();
    if (!label) {
      alert('Please enter a paper stock name.');
      return;
    }
    if (gridRows.some((r) => r.label.toLowerCase() === label.toLowerCase())) {
      alert(`A paper stock named "${label}" already exists.`);
      return;
    }

    let id = optionId(label);
    if (!id) id = `stock-${Date.now()}`;
    if (gridRows.some((r) => r.id === id)) {
      id = `${id}-${Date.now().toString().slice(-4)}`;
    }

    const finishType =
      newStockFinish === 'auto'
        ? (/metallic/i.test(label)
            ? 'metallic'
            : /matt/i.test(label)
            ? 'matte'
            : /gloss/i.test(label)
            ? 'gloss'
            : /laid|ribbed|vellum/i.test(label)
            ? 'ribbed'
            : undefined)
        : newStockFinish === 'standard'
        ? undefined
        : newStockFinish;

    const newOption: OptionValue = {
      id,
      groupId: gridProduct.optionGroups[0].id,
      label,
      sortOrder: gridRows.length + 1,
      isActive: true,
      finishType,
    };

    let newValues = [...gridRows];
    if (newStockAtTop) {
      newValues.unshift(newOption);
    } else {
      newValues.push(newOption);
    }
    newValues = newValues.map((v, idx) => ({ ...v, sortOrder: idx + 1 }));

    const updatedGroups = [...gridProduct.optionGroups];
    updatedGroups[0] = {
      ...updatedGroups[0],
      values: newValues,
    };

    updateProduct({
      ...gridProduct,
      optionGroups: updatedGroups,
    });

    if (alsoSyncSingleSidedStock && selectedGridProduct === 'prod-vc-double') {
      const singleProduct = products.find((p) => p.id === 'prod-vc-single');
      if (singleProduct?.optionGroups?.[0]) {
        const singleGroups = [...singleProduct.optionGroups];
        const singleRows = singleGroups[0].values ?? [];
        if (!singleRows.some((r) => r.label.toLowerCase() === label.toLowerCase())) {
          let updatedSingleRows = [...singleRows];
          if (newStockAtTop) {
            updatedSingleRows.unshift({ ...newOption, groupId: singleGroups[0].id });
          } else {
            updatedSingleRows.push({ ...newOption, groupId: singleGroups[0].id });
          }
          singleGroups[0] = {
            ...singleGroups[0],
            values: updatedSingleRows.map((v, idx) => ({ ...v, sortOrder: idx + 1 })),
          };
          updateProduct({ ...singleProduct, optionGroups: singleGroups });
        }
      }
    }

    setGridPaperId(id);
    setNewStockLabel('');
    setNewStockAtTop(false);
    setShowAddStock(false);
    setPricesDirty(true);
  };

  const handleDeletePaperStock = (rowId: string, rowLabel: string) => {
    if (!gridProduct || !gridProduct.optionGroups?.[0]) return;
    if (gridRows.length <= 1) {
      alert('A product must have at least one stock option.');
      return;
    }
    if (
      !confirm(
        `Are you sure you want to remove paper stock "${rowLabel}"?\nAny configured prices for this stock will be permanently removed.`
      )
    ) {
      return;
    }

    const updatedGroups = [...gridProduct.optionGroups];
    const newValues = updatedGroups[0].values.filter((v) => v.id !== rowId);
    updatedGroups[0] = {
      ...updatedGroups[0],
      values: newValues.map((v, idx) => ({ ...v, sortOrder: idx + 1 })),
    };

    updateProduct({
      ...gridProduct,
      optionGroups: updatedGroups,
    });

    if (activeRowId === rowId) {
      setGridPaperId(newValues[0]?.id ?? '');
    }
    setPricesDirty(true);
  };

  const handleStartEditStock = (row: OptionValue) => {
    setEditingStockId(row.id);
    setEditingStockName(row.label);
  };

  const handleCancelEditStock = () => {
    setEditingStockId(null);
    setEditingStockName('');
  };

  const handleSaveStockName = (rowId: string, oldLabel: string) => {
    if (!gridProduct || !gridProduct.optionGroups?.[0]) return;
    const trimmed = editingStockName.trim();
    if (!trimmed || trimmed === oldLabel) {
      setEditingStockId(null);
      setEditingStockName('');
      return;
    }

    if (gridRows.some((r) => r.id !== rowId && r.label.toLowerCase() === trimmed.toLowerCase())) {
      alert(`A paper stock named "${trimmed}" already exists.`);
      return;
    }

    const updatedRows = gridRows.map((r) => {
      if (r.id === rowId) {
        return {
          ...r,
          label: trimmed,
          finishType: finishOf(trimmed) || r.finishType,
        };
      }
      return r;
    });

    const updatedGroups = [...gridProduct.optionGroups];
    updatedGroups[0] = {
      ...updatedGroups[0],
      values: updatedRows,
    };

    const toUpdate: Product[] = [
      {
        ...gridProduct,
        optionGroups: updatedGroups,
      },
    ];

    if (selectedGridProduct === 'prod-vc-double') {
      const singleProduct = products.find((p) => p.id === 'prod-vc-single');
      if (singleProduct?.optionGroups?.[0]) {
        const singleGroups = [...singleProduct.optionGroups];
        const singleRows = singleGroups[0].values.map((r) => {
          if (r.id === rowId || r.label.toLowerCase() === oldLabel.toLowerCase()) {
            return {
              ...r,
              label: trimmed,
              finishType: finishOf(trimmed) || r.finishType,
            };
          }
          return r;
        });
        singleGroups[0] = {
          ...singleGroups[0],
          values: singleRows,
        };
        toUpdate.push({ ...singleProduct, optionGroups: singleGroups });
      }
    }

    updateMultipleProducts(toUpdate);
    setPricesDirty(true);
    setEditingStockId(null);
    setEditingStockName('');
  };

  const handleReorderPaperStock = (fromIndex: number, toIndex: number) => {
    if (!gridProduct || !gridProduct.optionGroups?.[0]) return;
    if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= gridRows.length || toIndex < 0 || toIndex >= gridRows.length) return;

    const values = [...gridRows];
    const [moved] = values.splice(fromIndex, 1);
    values.splice(toIndex, 0, moved);

    const reordered = values.map((val, idx) => ({ ...val, sortOrder: idx + 1 }));

    const updatedGroups = [...gridProduct.optionGroups];
    updatedGroups[0] = {
      ...updatedGroups[0],
      values: reordered,
    };

    const toUpdate: Product[] = [
      {
        ...gridProduct,
        optionGroups: updatedGroups,
      },
    ];

    if (selectedGridProduct === 'prod-vc-double') {
      const singleProduct = products.find((p) => p.id === 'prod-vc-single');
      if (singleProduct?.optionGroups?.[0]) {
        const singleGroups = [...singleProduct.optionGroups];
        const singleValues = [...singleGroups[0].values];
        const orderMap = new Map<string, number>();
        reordered.forEach((v, idx) => {
          orderMap.set(v.id, idx);
          orderMap.set(v.label.toLowerCase(), idx);
        });
        singleValues.sort((a, b) => {
          const idxA = orderMap.get(a.id) ?? orderMap.get(a.label.toLowerCase()) ?? 999;
          const idxB = orderMap.get(b.id) ?? orderMap.get(b.label.toLowerCase()) ?? 999;
          return idxA - idxB;
        });
        singleGroups[0] = {
          ...singleGroups[0],
          values: singleValues.map((v, i) => ({ ...v, sortOrder: i + 1 })),
        };
        toUpdate.push({ ...singleProduct, optionGroups: singleGroups });
      }
    }

    updateMultipleProducts(toUpdate);
    setPricesDirty(true);
  };

  const handleMovePaperStock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    handleReorderPaperStock(index, targetIndex);
  };

  const handleSortPapersAlphabetically = () => {
    if (!gridProduct || !gridProduct.optionGroups?.[0] || gridRows.length <= 1) return;
    const sorted = [...gridRows].sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' })
    );
    const reordered = sorted.map((val, idx) => ({ ...val, sortOrder: idx + 1 }));
    const updatedGroups = [...gridProduct.optionGroups];
    updatedGroups[0] = {
      ...updatedGroups[0],
      values: reordered,
    };
    const toUpdate: Product[] = [
      {
        ...gridProduct,
        optionGroups: updatedGroups,
      },
    ];
    if (selectedGridProduct === 'prod-vc-double') {
      const singleProduct = products.find((p) => p.id === 'prod-vc-single');
      if (singleProduct?.optionGroups?.[0]) {
        const singleGroups = [...singleProduct.optionGroups];
        const singleValues = [...singleGroups[0].values];
        const orderMap = new Map<string, number>();
        reordered.forEach((v, idx) => {
          orderMap.set(v.id, idx);
          orderMap.set(v.label.toLowerCase(), idx);
        });
        singleValues.sort((a, b) => {
          const idxA = orderMap.get(a.id) ?? orderMap.get(a.label.toLowerCase()) ?? 999;
          const idxB = orderMap.get(b.id) ?? orderMap.get(b.label.toLowerCase()) ?? 999;
          return idxA - idxB;
        });
        singleGroups[0] = {
          ...singleGroups[0],
          values: singleValues.map((v, i) => ({ ...v, sortOrder: i + 1 })),
        };
        toUpdate.push({ ...singleProduct, optionGroups: singleGroups });
      }
    }
    updateMultipleProducts(toUpdate);
    setPricesDirty(true);
  };

  const handleAddQuantityTier = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gridProduct || !gridProduct.optionGroups?.[1]) return;
    const label = newQtyLabel.trim();
    if (!label) {
      alert('Please enter a card set / quantity label (e.g. 6,000 Cards).');
      return;
    }
    if (gridCols.some((c) => c.label.toLowerCase() === label.toLowerCase())) {
      alert(`A card set / quantity option named "${label}" already exists.`);
      return;
    }

    let id = optionId(label);
    if (!id) id = `qty-${Date.now()}`;
    if (gridCols.some((c) => c.id === id)) {
      id = `${id}-${Date.now().toString().slice(-4)}`;
    }

    const newOption: OptionValue = {
      id,
      groupId: gridProduct.optionGroups[1].id,
      label,
      sortOrder: gridCols.length + 1,
      isActive: true,
    };

    let newValues = [...gridCols];
    if (autoSortNewQty) {
      const newUnits = unitCount(label);
      if (newUnits > 0) {
        const foundIdx = newValues.findIndex((v) => {
          const u = unitCount(v.label);
          return u > 0 && u > newUnits;
        });
        if (foundIdx !== -1) {
          newValues.splice(foundIdx, 0, newOption);
        } else {
          newValues.push(newOption);
        }
      } else {
        newValues.push(newOption);
      }
    } else {
      newValues.push(newOption);
    }

    newValues = newValues.map((v, idx) => ({ ...v, sortOrder: idx + 1 }));

    const updatedGroups = [...gridProduct.optionGroups];
    updatedGroups[1] = {
      ...updatedGroups[1],
      values: newValues,
    };

    updateProduct({
      ...gridProduct,
      optionGroups: updatedGroups,
    });

    if (alsoSyncSingleSidedQty && selectedGridProduct === 'prod-vc-double') {
      const singleProduct = products.find((p) => p.id === 'prod-vc-single');
      if (singleProduct?.optionGroups?.[1]) {
        const singleGroups = [...singleProduct.optionGroups];
        const singleCols = singleGroups[1].values ?? [];
        if (!singleCols.some((c) => c.label.toLowerCase() === label.toLowerCase())) {
          let updatedSingleCols = [...singleCols];
          if (autoSortNewQty) {
            const newUnits = unitCount(label);
            if (newUnits > 0) {
              const foundIdx = updatedSingleCols.findIndex((v) => {
                const u = unitCount(v.label);
                return u > 0 && u > newUnits;
              });
              if (foundIdx !== -1) {
                updatedSingleCols.splice(foundIdx, 0, { ...newOption, groupId: singleGroups[1].id });
              } else {
                updatedSingleCols.push({ ...newOption, groupId: singleGroups[1].id });
              }
            } else {
              updatedSingleCols.push({ ...newOption, groupId: singleGroups[1].id });
            }
          } else {
            updatedSingleCols.push({ ...newOption, groupId: singleGroups[1].id });
          }
          singleGroups[1] = {
            ...singleGroups[1],
            values: updatedSingleCols.map((v, idx) => ({ ...v, sortOrder: idx + 1 })),
          };
          updateProduct({ ...singleProduct, optionGroups: singleGroups });
        }
      }
    }

    setNewQtyLabel('');
    setShowAddQty(false);
    setPricesDirty(true);
  };

  const handleDeleteQuantityTier = (colId: string, colLabel: string) => {
    if (!gridProduct || !gridProduct.optionGroups?.[1]) return;
    if (gridCols.length <= 1) {
      alert('A product must have at least one quantity / card set tier.');
      return;
    }
    if (
      !confirm(
        `Are you sure you want to remove "${colLabel}"?\nAny configured prices for this tier will be removed.`
      )
    ) {
      return;
    }

    const updatedGroups = [...gridProduct.optionGroups];
    updatedGroups[1] = {
      ...updatedGroups[1],
      values: updatedGroups[1].values.filter((v) => v.id !== colId).map((v, idx) => ({ ...v, sortOrder: idx + 1 })),
    };

    updateProduct({
      ...gridProduct,
      optionGroups: updatedGroups,
    });
    setPricesDirty(true);
  };

  const handleReorderQuantityTier = (fromIndex: number, toIndex: number) => {
    if (!gridProduct || !gridProduct.optionGroups?.[1]) return;
    if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= gridCols.length || toIndex < 0 || toIndex >= gridCols.length) return;

    const values = [...gridCols];
    const [moved] = values.splice(fromIndex, 1);
    values.splice(toIndex, 0, moved);

    const reordered = values.map((val, idx) => ({ ...val, sortOrder: idx + 1 }));

    const updatedGroups = [...gridProduct.optionGroups];
    updatedGroups[1] = {
      ...updatedGroups[1],
      values: reordered,
    };

    const toUpdate: Product[] = [
      {
        ...gridProduct,
        optionGroups: updatedGroups,
      },
    ];

    if (selectedGridProduct === 'prod-vc-double') {
      const singleProduct = products.find((p) => p.id === 'prod-vc-single');
      if (singleProduct?.optionGroups?.[1]) {
        const singleGroups = [...singleProduct.optionGroups];
        const singleValues = [...singleGroups[1].values];
        const orderMap = new Map<string, number>();
        reordered.forEach((v, idx) => {
          orderMap.set(v.id, idx);
          orderMap.set(v.label.toLowerCase(), idx);
        });
        singleValues.sort((a, b) => {
          const idxA = orderMap.get(a.id) ?? orderMap.get(a.label.toLowerCase()) ?? 999;
          const idxB = orderMap.get(b.id) ?? orderMap.get(b.label.toLowerCase()) ?? 999;
          return idxA - idxB;
        });
        singleGroups[1] = {
          ...singleGroups[1],
          values: singleValues.map((v, i) => ({ ...v, sortOrder: i + 1 })),
        };
        toUpdate.push({ ...singleProduct, optionGroups: singleGroups });
      }
    }

    updateMultipleProducts(toUpdate);
    setPricesDirty(true);
  };

  const handleMoveQuantityTier = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    handleReorderQuantityTier(index, targetIndex);
  };

  const handleSortQuantitiesAscending = () => {
    if (!gridProduct || !gridProduct.optionGroups?.[1] || gridCols.length <= 1) return;

    const sorted = [...gridCols].sort((a, b) => {
      const uA = unitCount(a.label);
      const uB = unitCount(b.label);
      if (uA > 0 && uB > 0 && uA !== uB) return uA - uB;
      return a.label.localeCompare(b.label, undefined, { numeric: true });
    });

    const reordered = sorted.map((val, idx) => ({ ...val, sortOrder: idx + 1 }));

    const updatedGroups = [...gridProduct.optionGroups];
    updatedGroups[1] = {
      ...updatedGroups[1],
      values: reordered,
    };

    const toUpdate: Product[] = [
      {
        ...gridProduct,
        optionGroups: updatedGroups,
      },
    ];

    if (selectedGridProduct === 'prod-vc-double') {
      const singleProduct = products.find((p) => p.id === 'prod-vc-single');
      if (singleProduct?.optionGroups?.[1]) {
        const singleGroups = [...singleProduct.optionGroups];
        const singleValues = [...singleGroups[1].values];
        const orderMap = new Map<string, number>();
        reordered.forEach((v, idx) => {
          orderMap.set(v.id, idx);
          orderMap.set(v.label.toLowerCase(), idx);
        });
        singleValues.sort((a, b) => {
          const idxA = orderMap.get(a.id) ?? orderMap.get(a.label.toLowerCase()) ?? 999;
          const idxB = orderMap.get(b.id) ?? orderMap.get(b.label.toLowerCase()) ?? 999;
          return idxA - idxB;
        });
        singleGroups[1] = {
          ...singleGroups[1],
          values: singleValues.map((v, i) => ({ ...v, sortOrder: i + 1 })),
        };
        toUpdate.push({ ...singleProduct, optionGroups: singleGroups });
      }
    }

    updateMultipleProducts(toUpdate);
    setPricesDirty(true);
  };

  const handleSavePrices = async () => {
    setIsSavingPrices(true);
    const [error, prodError] = await Promise.all([
      savePriceMatrix(),
      saveProducts(),
    ]);
    setIsSavingPrices(false);
    if (error || prodError) {
      alert(`Could not save: ${error || prodError}`);
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    // Images are managed separately (saved on upload), so only the text fields are taken from the form
    const { clientLogos, heroBackgrounds, ...text } = settingsForm;
    const pasted = text.elfsightReviewsId.match(/elfsight-app-([\w-]+)/); // staff may paste the whole embed code
    const err = await updateSiteSettings({
      ...text,
      elfsightReviewsId: pasted ? pasted[1] : text.elfsightReviewsId.trim(),
      bankDetails: { ...text.bankDetails, logoUrl: siteSettings.bankDetails.logoUrl },
    });
    setSettingsError(err ?? '');
    if (err) return;
    setSettingsDirty(false);
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
          <span>Prices</span>
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
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t transition-colors ${
            activeTab === 'customers'
              ? 'bg-white border-t-2 border-[#D6342C] text-[#0F1B2D] shadow-xs'
              : 'text-slate-600 hover:text-[#0F1B2D]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customers ({registeredCustomers.length})</span>
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
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openStoredFile('artwork-uploads', selectedOrder.bankSlipUrl!)}
                        className="flex items-center gap-1 text-left text-[#D6342C] font-semibold hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View bank slip ({selectedOrder.bankSlipName || 'file'})
                      </button>
                      <button
                        onClick={() => downloadStoredFile('artwork-uploads', selectedOrder.bankSlipUrl!, selectedOrder.bankSlipName || 'bank-slip')}
                        className="flex items-center gap-1 text-[#0F1B2D] font-semibold hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </div>
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
                        <span>{formatItemPrice(item)}</span>
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        {item.selectedOptions.map((o) => `${o.groupName}: ${o.valueLabel}`).join(' · ')}
                      </div>
                      {item.artworkType === 'design' && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                          <Palette className="w-3 h-3 text-[#D6342C]" />
                          <span>
                            Design Service (+{formatLKR(item.selectedAddons?.find((a) => a.id === 'addon-design')?.price ?? item.product?.artworkFee ?? 500)})
                          </span>
                        </div>
                      )}
                      {item.artworkFiles.length > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="font-bold text-[11px] text-slate-700 block">Uploaded Artwork Files:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.artworkFiles.map((art, fIdx) => (
                              <div key={fIdx} className="flex items-stretch bg-white border border-slate-300 rounded text-[10px] overflow-hidden">
                                <button
                                  disabled={!art.storagePath}
                                  onClick={() => art.storagePath && openStoredFile('artwork-uploads', art.storagePath)}
                                  title={art.storagePath ? 'Open file in a new tab' : 'File was not uploaded'}
                                  className="px-2 py-1 flex items-center gap-1 font-mono enabled:hover:bg-slate-50 disabled:opacity-60"
                                >
                                  <FileCheck className="w-3 h-3 text-emerald-600" />
                                  <span className="font-sans font-semibold text-slate-500">{art.slot === 2 ? 'Back:' : 'Front:'}</span>
                                  {art.fileName}
                                </button>
                                {art.storagePath && (
                                  <button
                                    onClick={() => downloadStoredFile('artwork-uploads', art.storagePath!, art.fileName)}
                                    title="Download file"
                                    aria-label={`Download ${art.fileName}`}
                                    className="px-2 border-l border-slate-300 flex items-center gap-1 font-semibold text-[#0F1B2D] hover:bg-[#0F1B2D] hover:text-white transition-colors"
                                  >
                                    <Download className="w-3 h-3" />
                                    Download
                                  </button>
                                )}
                              </div>
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
          {/* Header: product + save */}
          <div className="bg-white p-5 rounded-lg border border-[#E6E0D6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F1B2D]">Product Prices</h3>
              <p className="text-xs text-slate-500">
                Choose a product and option, type the prices, then press Save. Leave a price empty if it is not
                offered. Products with no prices show <strong>Price on request</strong> to customers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                aria-label="Product"
                value={selectedGridProduct}
                onChange={(e) => setSelectedGridProduct(e.target.value)}
                className="p-2 text-xs font-semibold bg-[#FAF8F5] border border-[#E6E0D6] rounded max-w-[260px]"
              >
                {products
                  .filter((p) => (p.optionGroups?.length ?? 0) >= 2)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {getFromPrice(p.id) ? '' : ' — on request'}
                    </option>
                  ))}
              </select>
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

          {/* Artwork Design Pricing Strip for Selected Product */}
          <div className="bg-white p-4 rounded-lg border border-[#E6E0D6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[#0F1B2D] text-white flex items-center justify-center shrink-0">
                <Palette className="w-4 h-4 text-[#D6342C]" />
              </div>
              <div>
                <div className="font-bold text-[#0F1B2D] flex items-center gap-2">
                  <span>Artwork Design Charge — {gridProduct?.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    &quot;Design it for me&quot; option
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Fee added to the customer&apos;s total when choosing &quot;Design it for me&quot; for this product.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={gridProduct?.hasArtworkOption !== false}
                  onChange={(e) => {
                    if (!gridProduct) return;
                    updateProduct({
                      ...gridProduct,
                      hasArtworkOption: e.target.checked,
                    });
                    setPricesDirty(true);
                  }}
                  className="rounded border-[#E6E0D6] text-[#0F1B2D]"
                />
                <span>Offer Artwork Service</span>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700">Fee (Rs.):</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  disabled={gridProduct?.hasArtworkOption === false}
                  value={gridProduct?.artworkFee ?? siteSettings.defaultArtworkFee ?? 500}
                  onChange={(e) => {
                    if (!gridProduct) return;
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    updateProduct({
                      ...gridProduct,
                      artworkFee: val,
                    });
                    setPricesDirty(true);
                  }}
                  className="w-28 p-1.5 font-bold text-slate-800 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:border-[#0F1B2D] outline-hidden disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Step 1: first option (paper / size ...) */}
            <div className="lg:col-span-4 bg-white rounded-lg border border-[#E6E0D6] shadow-xs overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-[#E6E0D6] flex justify-between items-center bg-[#FAF8F5]">
                <span className="truncate">1. Choose {gridProduct?.optionGroups?.[0]?.name ?? 'option'} ({gridRows.length})</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {gridRows.length > 1 && (
                    <button
                      type="button"
                      onClick={handleSortPapersAlphabetically}
                      className="px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-white border border-[#E6E0D6] hover:border-[#0F1B2D] hover:text-[#0F1B2D] rounded flex items-center gap-1 transition-colors shadow-2xs"
                      title="Sort options alphabetically (A to Z)"
                    >
                      <ArrowUpDown className="w-3 h-3 text-[#D6342C]" />
                      <span>A→Z</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowAddStock(!showAddStock)}
                    className="px-2 py-1 text-[11px] font-bold text-[#0F1B2D] hover:bg-[#E6E0D6]/60 rounded flex items-center gap-1 transition-colors"
                    title="Add new paper stock"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D6342C]" />
                    <span>{showAddStock ? 'Close' : 'Add Stock'}</span>
                  </button>
                </div>
              </div>

              {/* Add Stock Form */}
              {showAddStock && (
                <form
                  onSubmit={handleAddPaperStock}
                  className="p-3 bg-amber-50/50 border-b border-amber-200/70 space-y-2 text-xs"
                >
                  <div className="font-bold text-[#0F1B2D] text-[11px] flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-[#D6342C]" />
                    <span>Add New {gridProduct?.optionGroups?.[0]?.name ?? 'Paper Stock'}</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. 350gsm Pearl White (Metallic Finish)"
                      value={newStockLabel}
                      onChange={(e) => setNewStockLabel(e.target.value)}
                      className="w-full p-2 text-xs bg-white border border-[#E6E0D6] rounded focus:border-[#0F1B2D] outline-hidden font-medium"
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Finish type</label>
                      <select
                        value={newStockFinish}
                        onChange={(e) => setNewStockFinish(e.target.value as any)}
                        className="w-full p-1.5 text-xs bg-white border border-[#E6E0D6] rounded font-medium"
                      >
                        <option value="auto">Auto-detect from name</option>
                        <option value="gloss">Gloss</option>
                        <option value="matte">Matte</option>
                        <option value="metallic">Metallic</option>
                        <option value="ribbed">Ribbed / Textured</option>
                        <option value="standard">Standard / Uncoated</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-1.5 px-3 bg-[#0F1B2D] hover:bg-[#182A45] text-white font-bold text-xs rounded transition-colors"
                      >
                        Add to List
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 pt-0.5">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newStockAtTop}
                        onChange={(e) => setNewStockAtTop(e.target.checked)}
                        className="rounded border-[#E6E0D6] text-[#0F1B2D]"
                      />
                      <span>Insert at top of list (default is bottom)</span>
                    </label>
                    {selectedGridProduct === 'prod-vc-double' && (
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={alsoSyncSingleSidedStock}
                          onChange={(e) => setAlsoSyncSingleSidedStock(e.target.checked)}
                          className="rounded border-[#E6E0D6] text-[#0F1B2D]"
                        />
                        <span>Also add to Single Sided Visiting Cards</span>
                      </label>
                    )}
                  </div>
                </form>
              )}

              {/* Rows List */}
              <div className="divide-y divide-[#F0EBE1] overflow-y-auto max-h-[520px]">
                {gridRows.map((row, index) => {
                  const isSelected = activeRowId === row.id;
                  const from = rowFromPrice(row.id);
                  const isDragOver = dragOverRowIndex === index;
                  const isDragging = draggedRowIndex === index;
                  const isEditing = editingStockId === row.id;
                  return (
                    <div
                      key={row.id}
                      draggable={!isEditing}
                      onDragStart={(e) => {
                        if (isEditing) return;
                        setDraggedRowIndex(index);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', String(index));
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverRowIndex !== index) {
                          setDragOverRowIndex(index);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverRowIndex === index) {
                          setDragOverRowIndex(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const rawIndex = e.dataTransfer.getData('text/plain');
                        const fromIndex = rawIndex !== '' && !isNaN(Number(rawIndex)) ? Number(rawIndex) : draggedRowIndex;
                        if (fromIndex !== null && fromIndex !== index) {
                          handleReorderPaperStock(fromIndex, index);
                        }
                        setDraggedRowIndex(null);
                        setDragOverRowIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedRowIndex(null);
                        setDragOverRowIndex(null);
                      }}
                      className={`group w-full text-left px-3 py-2 text-xs flex justify-between items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected ? 'bg-[#0F1B2D] text-white' : 'text-[#0F1B2D] hover:bg-[#FAF8F5]'
                      } ${isDragOver ? 'border-t-2 border-[#D6342C] bg-amber-50/50' : ''} ${
                        isDragging ? 'opacity-40' : ''
                      }`}
                      onClick={() => {
                        if (!isEditing) setGridPaperId(row.id);
                      }}
                    >
                      <div
                        className={`cursor-grab active:cursor-grabbing p-0.5 rounded ${
                          isSelected ? 'text-slate-400 group-hover:text-white' : 'text-slate-300 group-hover:text-slate-500'
                        }`}
                        title="Drag up or down to reorder"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      {isEditing ? (
                        <div
                          className="flex items-center gap-1.5 flex-1 min-w-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            autoFocus
                            value={editingStockName}
                            onChange={(e) => setEditingStockName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveStockName(row.id, row.label);
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                handleCancelEditStock();
                              }
                            }}
                            onBlur={() => {
                              handleSaveStockName(row.id, row.label);
                            }}
                            className="flex-1 min-w-0 px-2 py-0.5 text-xs text-[#0F1B2D] bg-white border border-[#0F1B2D] rounded shadow-inner font-semibold outline-hidden"
                          />
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSaveStockName(row.id, row.label);
                            }}
                            title="Save name (Enter)"
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleCancelEditStock();
                            }}
                            title="Cancel (Esc)"
                            className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span
                            className="font-semibold truncate flex-1 select-none"
                            title={`${row.label} (Double-click or click pencil to rename)`}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              handleStartEditStock(row);
                            }}
                          >
                            {row.label}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                              {from != null ? `from ${formatLKR(from)}` : 'no prices'}
                            </span>
                            {/* Rename pencil button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditStock(row);
                              }}
                              title="Rename paper stock"
                              className={`p-1 rounded transition-colors ${
                                isSelected
                                  ? 'text-slate-300 hover:text-white hover:bg-white/20'
                                  : 'text-slate-400 hover:text-[#0F1B2D] hover:bg-slate-200'
                              }`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {/* Move Up / Down controls */}
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMovePaperStock(index, 'up');
                                }}
                                title="Move up"
                                className={`p-1 rounded transition-colors disabled:opacity-20 disabled:hover:bg-transparent ${
                                  isSelected
                                    ? 'text-slate-300 hover:text-white hover:bg-white/20'
                                    : 'text-slate-400 hover:text-[#0F1B2D] hover:bg-slate-200'
                                }`}
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={index === gridRows.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMovePaperStock(index, 'down');
                                }}
                                title="Move down"
                                className={`p-1 rounded transition-colors disabled:opacity-20 disabled:hover:bg-transparent ${
                                  isSelected
                                    ? 'text-slate-300 hover:text-white hover:bg-white/20'
                                    : 'text-slate-400 hover:text-[#0F1B2D] hover:bg-slate-200'
                                }`}
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePaperStock(row.id, row.label);
                              }}
                              title={`Delete ${row.label}`}
                              className={`p-1 rounded hover:bg-red-500/20 transition-opacity ${
                                isSelected ? 'text-red-300 hover:text-red-100' : 'text-slate-400 hover:text-red-600'
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick-Add Trigger */}
              {!showAddStock && (
                <button
                  type="button"
                  onClick={() => setShowAddStock(true)}
                  className="w-full p-2.5 bg-[#FAF8F5] hover:bg-[#F0EBE1] text-[#0F1B2D] font-bold text-xs border-t border-[#E6E0D6] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D6342C]" />
                  <span>+ Add New {gridProduct?.optionGroups?.[0]?.name ?? 'Paper Stock'}</span>
                </button>
              )}
            </div>

            {/* Step 2: prices for that option */}
            <div className="lg:col-span-8 bg-white rounded-lg border border-[#E6E0D6] shadow-xs overflow-hidden">
              <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-[#E6E0D6] flex justify-between items-center bg-[#FAF8F5]">
                <span className="truncate pr-2">2. Set prices — {gridRows.find((r) => r.id === activeRowId)?.label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {gridCols.length > 1 && (
                    <button
                      type="button"
                      onClick={handleSortQuantitiesAscending}
                      className="px-2 py-1 text-[11px] font-bold text-slate-700 bg-white border border-[#E6E0D6] hover:border-[#0F1B2D] hover:text-[#0F1B2D] rounded flex items-center gap-1 transition-colors shadow-2xs"
                      title="Sort all quantities numerically from lowest to highest"
                    >
                      <ArrowUpDown className="w-3 h-3 text-[#D6342C]" />
                      <span>Sort Low → High</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowAddQty(!showAddQty)}
                    className="px-2 py-1 text-[11px] font-bold text-[#0F1B2D] hover:bg-[#E6E0D6]/60 rounded flex items-center gap-1 transition-colors shrink-0"
                    title="Add new card set / quantity tier"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D6342C]" />
                    <span>{showAddQty ? 'Close' : 'Add Card Set / Quantity'}</span>
                  </button>
                </div>
              </div>

              {/* Add Quantity / Card Set Form */}
              {showAddQty && (
                <form
                  onSubmit={handleAddQuantityTier}
                  className="p-3 bg-amber-50/50 border-b border-amber-200/70 space-y-2 text-xs"
                >
                  <div className="font-bold text-[#0F1B2D] text-[11px] flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-[#D6342C]" />
                    <span>Add New {gridProduct?.optionGroups?.[1]?.name ?? 'Card Set / Quantity'} Tier</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 6,000 Cards or 10,000 Cards"
                      value={newQtyLabel}
                      onChange={(e) => setNewQtyLabel(e.target.value)}
                      className="flex-1 p-2 text-xs bg-white border border-[#E6E0D6] rounded focus:border-[#0F1B2D] outline-hidden font-medium"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="py-2 px-4 bg-[#0F1B2D] hover:bg-[#182A45] text-white font-bold text-xs rounded transition-colors whitespace-nowrap"
                    >
                      Add Tier
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-0.5">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoSortNewQty}
                        onChange={(e) => setAutoSortNewQty(e.target.checked)}
                        className="rounded border-[#E6E0D6] text-[#0F1B2D]"
                      />
                      <span>Insert in numerical order (recommended)</span>
                    </label>
                    {selectedGridProduct === 'prod-vc-double' && (
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={alsoSyncSingleSidedQty}
                          onChange={(e) => setAlsoSyncSingleSidedQty(e.target.checked)}
                          className="rounded border-[#E6E0D6] text-[#0F1B2D]"
                        />
                        <span>Also add to Single Sided Visiting Cards</span>
                      </label>
                    )}
                  </div>
                  {/* Suggestions for quick adding */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-amber-200/40">
                    <span className="text-[10px] text-slate-500">Quick suggestions:</span>
                    {['6,000 Cards', '7,000 Cards', '8,000 Cards', '10,000 Cards', '50 Cards', '250 Cards', '15,000 Cards']
                      .filter((s) => !gridCols.some((c) => c.label.toLowerCase() === s.toLowerCase()))
                      .slice(0, 5)
                      .map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setNewQtyLabel(suggestion)}
                          className="px-2 py-0.5 bg-white border border-[#E6E0D6] hover:border-[#0F1B2D] rounded text-[10px] font-medium text-slate-700"
                        >
                          + {suggestion}
                        </button>
                      ))}
                  </div>
                </form>
              )}

              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase text-slate-500 bg-[#FAF8F5]">
                  <tr>
                    <th className="w-7 px-2 py-2 text-center" title="Drag to reorder"></th>
                    <th className="px-4 py-2 text-left">{gridProduct?.optionGroups?.[1]?.name ?? 'Quantity'}</th>
                    <th className="px-4 py-2 text-left">Price (Rs.)</th>
                    <th className="px-4 py-2 text-right">Per unit</th>
                    <th className="px-2 py-2 text-center w-24">Order / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gridCols.map((col, colIdx) => {
                    const price = gridPrice(activeRowId, col.id);
                    const units = unitCount(col.label);
                    const isDragOver = dragOverColIndex === colIdx;
                    const isDragging = draggedColIndex === colIdx;
                    return (
                      <tr
                        key={col.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedColIndex(colIdx);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', String(colIdx));
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverColIndex !== colIdx) {
                            setDragOverColIndex(colIdx);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverColIndex === colIdx) {
                            setDragOverColIndex(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedColIndex !== null && draggedColIndex !== colIdx) {
                            handleReorderQuantityTier(draggedColIndex, colIdx);
                          }
                          setDraggedColIndex(null);
                          setDragOverColIndex(null);
                        }}
                        onDragEnd={() => {
                          setDraggedColIndex(null);
                          setDragOverColIndex(null);
                        }}
                        className={`hover:bg-[#FAF8F5] group transition-colors ${
                          isDragOver ? 'border-t-2 border-[#D6342C] bg-amber-50/50' : ''
                        } ${isDragging ? 'opacity-40' : ''}`}
                      >
                        <td className="px-2 py-1.5 text-center text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-3.5 h-3.5 mx-auto" />
                        </td>
                        <td className="px-4 py-1.5 font-semibold text-[#0F1B2D]">{col.label}</td>
                        <td className="px-4 py-1.5">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            placeholder="Not offered"
                            aria-label={`Price for ${col.label}`}
                            value={price ?? ''}
                            onChange={(e) =>
                              setGridPrice(activeRowId, col.id, e.target.value === '' ? null : parseFloat(e.target.value) || 0)
                            }
                            className="w-32 p-1.5 font-bold text-slate-800 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:border-[#0F1B2D] outline-hidden"
                          />
                        </td>
                        <td className="px-4 py-1.5 text-right text-slate-500">
                          {price != null && units > 0 ? formatLKR(price / units) : '—'}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              type="button"
                              disabled={colIdx === 0}
                              onClick={() => handleMoveQuantityTier(colIdx, 'up')}
                              title="Move up"
                              className="p-1 rounded text-slate-400 hover:text-[#0F1B2D] hover:bg-slate-200 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={colIdx === gridCols.length - 1}
                              onClick={() => handleMoveQuantityTier(colIdx, 'down')}
                              title="Move down"
                              className="p-1 rounded text-slate-400 hover:text-[#0F1B2D] hover:bg-slate-200 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuantityTier(col.id, col.label)}
                              title={`Delete ${col.label}`}
                              className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Bottom Quick-Add for Quantity / Card Set */}
              {!showAddQty && (
                <div className="px-4 py-2.5 bg-[#FAF8F5]/80 border-t border-[#E6E0D6] flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setShowAddQty(true)}
                    className="text-xs font-bold text-[#D6342C] hover:underline flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add New {gridProduct?.optionGroups?.[1]?.name ?? 'Card Set / Quantity'} Tier</span>
                  </button>
                  <div className="flex items-center gap-3">
                    {gridCols.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSortQuantitiesAscending}
                        className="text-[11px] font-semibold text-slate-600 hover:text-[#0F1B2D] flex items-center gap-1"
                        title="Sort all quantities from lowest to highest"
                      >
                        <ArrowUpDown className="w-3 h-3 text-[#D6342C]" />
                        <span>Sort Low → High</span>
                      </button>
                    )}
                    <span className="text-[10px] text-slate-400">Total {gridCols.length} quantity tiers</span>
                  </div>
                </div>
              )}

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
                  This option
                </button>
                <button
                  onClick={() => applyPercent('all')}
                  className="px-3 py-1.5 bg-[#0F1B2D] text-white font-semibold rounded hover:bg-[#182A45]"
                >
                  All options
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
              <span className="text-slate-400">Edit this product's whole price table in Excel, then paste it back.</span>
            </div>
          </details>

          {/* CSV Import Modal */}
          {showCsvModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-[#E6E0D6] pb-2">
                  <h4 className="font-bold text-sm text-[#0F1B2D]">
                    Import CSV prices for {gridProduct?.name}
                  </h4>
                  <button
                    onClick={() => setShowCsvModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Paste the CSV exported above (after editing). First column = option names, header row = quantities. Leave a cell empty for "not offered".
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
                        src={p.images[0]?.imageUrl || '/images/products/placeholder.webp'}
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
                          {getFromPrice(p.id) ? `From ${formatLKR(getFromPrice(p.id))}` : 'Price on request'}
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
                    onClick={() => closeProductModal()}
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

                  {/* Product photos (up to MAX_PRODUCT_PHOTOS; the first is the main photo) */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-baseline justify-between">
                      <label className="font-bold text-slate-700">Product Photos</label>
                      <span className="text-[10px] text-slate-500">
                        {productForm.imageUrls.length} of {MAX_PRODUCT_PHOTOS} · first photo is the main one
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {productForm.imageUrls.map((url, i) => (
                        <div key={url} className="relative aspect-4/3 rounded border border-[#E6E0D6] overflow-hidden bg-slate-100 group">
                          <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                          {i === 0 ? (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#0F1B2D] text-white text-[9px] font-bold uppercase">Main</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => makeMainPhoto(url)}
                              className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-white/90 text-[#0F1B2D] text-[9px] font-bold hover:bg-white"
                            >
                              Make main
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeProductPhoto(url)}
                            aria-label={`Remove photo ${i + 1}`}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-slate-600 hover:text-red-600 flex items-center justify-center"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {!photosFull && (
                        <label
                          className={`aspect-4/3 rounded border-2 border-dashed flex flex-col items-center justify-center gap-1 text-[11px] font-semibold cursor-pointer transition-colors ${
                            imageUploading ? 'border-slate-300 text-slate-400 pointer-events-none' : 'border-[#E6E0D6] text-[#0F1B2D] hover:border-[#0F1B2D]'
                          }`}
                        >
                          {imageUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          {imageUploading ? 'Uploading…' : 'Upload photos'}
                          <input type="file" accept="image/*" multiple className="sr-only" onChange={handleUploadProductImage} disabled={imageUploading} />
                        </label>
                      )}
                    </div>

                    {photosFull ? (
                      <p className="text-[11px] text-amber-700">Maximum {MAX_PRODUCT_PHOTOS} photos. Remove one to add another.</p>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Or paste an image link: /images/products/... or https://..."
                            value={photoLink}
                            onChange={(e) => setPhotoLink(e.target.value)}
                            className="w-full p-2 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
                          />
                          <button
                            type="button"
                            disabled={!photoLink.trim()}
                            onClick={() => {
                              addProductPhoto(photoLink.trim());
                              setPhotoLink('');
                            }}
                            className="shrink-0 px-3 rounded border border-[#0F1B2D] text-[#0F1B2D] font-semibold disabled:opacity-40"
                          >
                            Add
                          </button>
                        </div>
                        {/* Real photo presets (files in public/images/products) */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[10px] text-slate-400">Our photos:</span>
                          {[
                            ['Visiting Cards', 'visiting-cards/1'],
                            ['Bill Books', 'bill-books/2'],
                            ['Leaflets', 'leaflets/4'],
                            ['Invitations', 'invitations/4'],
                            ['Letterheads', 'letterheads/1'],
                            ['Certificates', 'certificates/1'],
                            ['Stickers', 'stickers/4'],
                            ['Envelopes', 'envelopes/2'],
                          ].map(([label, photo]) => (
                            <button
                              key={photo}
                              type="button"
                              onClick={() => addProductPhoto(`/images/products/${photo}.webp`)}
                              className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    <p className="text-[10px] text-slate-400">
                      {IMAGE_GUIDE.product.hint} Stored copies are usually under 300 KB, and removed uploads are deleted when you save.
                    </p>

                    {/* Homepage Category Cover Sync */}
                    <div className="pt-2 border-t border-[#E6E0D6]/60">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.setAsCategoryCover}
                          onChange={(e) => setProductForm((f) => ({ ...f, setAsCategoryCover: e.target.checked }))}
                          className="rounded border-[#E6E0D6] text-[#0F1B2D]"
                        />
                        <span>
                          Sync as Homepage category cover photo for <strong>{categories.find((c) => c.id === productForm.categoryId)?.name || 'this category'}</strong>
                        </span>
                      </label>
                      <p className="text-[10px] text-slate-400 ml-5 mt-0.5">
                        The first photo will automatically display on the homepage "Shop by Category" card.
                      </p>
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

                  {/* Artwork Design Service Settings for this product */}
                  <div className="p-3.5 bg-amber-50/60 rounded border border-amber-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                        <input
                          type="checkbox"
                          checked={productForm.hasArtworkOption}
                          onChange={(e) =>
                            setProductForm({ ...productForm, hasArtworkOption: e.target.checked })
                          }
                          className="accent-[#0F1B2D]"
                        />
                        <span>Offer &quot;Design it for me&quot; Artwork Service</span>
                      </label>
                    </div>
                    {productForm.hasArtworkOption && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <label className="font-semibold text-slate-700">Artwork Design Charge:</label>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-600">Rs.</span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={productForm.artworkFee}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                artworkFee: Math.max(0, parseFloat(e.target.value) || 0),
                              })
                            }
                            className="w-28 p-1.5 font-bold text-slate-800 bg-white border border-[#E6E0D6] rounded focus:border-[#0F1B2D] outline-hidden"
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">(Added when customer selects &quot;Design it for me&quot;)</span>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-[#E6E0D6]">
                    <button
                      type="button"
                      onClick={() => closeProductModal()}
                      className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={imageUploading}
                      className="px-6 py-2.5 bg-[#D6342C] hover:bg-[#B8251E] disabled:opacity-50 text-white font-bold rounded flex items-center gap-2 shadow-sm transition-colors"
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
                        <div className="mt-1 flex items-center gap-2 text-[11px]">
                          <button
                            onClick={() => openStoredFile('quote-attachments', q.attachmentUrl!)}
                            className="flex items-center gap-1 text-[#D6342C] font-semibold hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {q.attachmentName || 'Attachment'}
                          </button>
                          <button
                            onClick={() => downloadStoredFile('quote-attachments', q.attachmentUrl!, q.attachmentName || 'attachment')}
                            title="Download file"
                            aria-label={`Download ${q.attachmentName || 'attachment'}`}
                            className="text-[#0F1B2D] hover:text-[#D6342C]"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-[#E6E0D6] text-xs">
            <div className="relative flex-grow max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Search name, email or phone…"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-8 pr-2 py-2 bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden"
              />
            </div>
            <span className="text-slate-500">
              <strong className="text-[#0F1B2D]">{registeredCustomers.length}</strong> registered customers
            </span>
          </div>

          <div className="bg-white rounded-lg border border-[#E6E0D6] shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E6E0D6] text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registeredCustomers
                  .filter((c) => {
                    const q = customerSearch.trim().toLowerCase();
                    return !q || [c.fullName, c.email, c.phone].some((v) => v?.toLowerCase().includes(q));
                  })
                  .map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-[#0F1B2D]">{c.fullName || '—'}</td>
                      <td className="p-3">
                        <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>
                      </td>
                      <td className="p-3">
                        {c.phone ? (
                          <a href={getWhatsAppUrl(c.phone, `Hi ${c.fullName || ''}, this is Ai Printing Solutions.`)} target="_blank" rel="noopener noreferrer" className="text-[#128C7E] hover:underline">
                            {c.phone}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3">{orders.filter((o) => o.userId === c.id).length}</td>
                      <td className="p-3 text-slate-500">{new Date(c.createdAt).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                {registeredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">No registered customers yet.</td>
                  </tr>
                )}
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
                onChange={(e) => editSettings({ hotline: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Landline Number</label>
              <input
                type="text"
                value={settingsForm.landline}
                onChange={(e) => editSettings({ landline: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">WhatsApp Hotline Number</label>
              <input
                type="text"
                value={settingsForm.whatsapp}
                onChange={(e) => editSettings({ whatsapp: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Standard Island-Wide Delivery Fee (LKR)</label>
              <input
                type="number"
                value={settingsForm.deliveryFee}
                onChange={(e) =>
                  editSettings({ deliveryFee: parseFloat(e.target.value) || 0 })
                }
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Default Artwork Design Fee (LKR)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={settingsForm.defaultArtworkFee ?? 500}
                onChange={(e) =>
                  editSettings({ defaultArtworkFee: Math.max(0, parseFloat(e.target.value) || 0) })
                }
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded font-bold"
              />
              <p className="text-[11px] text-slate-500">Store-wide default fee for &quot;Design it for me&quot; when not customized on a product.</p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">General Contact Email</label>
              <input
                type="email"
                value={settingsForm.email}
                onChange={(e) => editSettings({ email: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Artwork Submissions Email</label>
              <input
                type="email"
                value={settingsForm.artworkEmail}
                onChange={(e) => editSettings({ artworkEmail: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700">Top Announcement Bar Text</label>
              <input
                type="text"
                value={settingsForm.announcementText}
                onChange={(e) => editSettings({ announcementText: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-[#E6E0D6]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F1B2D]">Bank Transfer Details</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Shown to customers at checkout when they choose bank transfer.</p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Bank Name</label>
              <input
                type="text"
                value={settingsForm.bankDetails.bankName}
                onChange={(e) => editBank({ bankName: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Branch</label>
              <input
                type="text"
                value={settingsForm.bankDetails.branch}
                onChange={(e) => editBank({ branch: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Account Name</label>
              <input
                type="text"
                value={settingsForm.bankDetails.accountName}
                onChange={(e) => editBank({ accountName: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Account Number</label>
              <input
                type="text"
                value={settingsForm.bankDetails.accountNumber}
                onChange={(e) => editBank({ accountNumber: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded font-mono"
              />
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-[#E6E0D6]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F1B2D]">Social Media Links</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Paste each page address. Icons without a link are shown greyed out.</p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Facebook</label>
              <input
                type="text"
                placeholder="https://facebook.com/yourpage"
                value={settingsForm.socialLinks.facebook}
                onChange={(e) => editSocial({ facebook: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Instagram</label>
              <input
                type="text"
                placeholder="https://instagram.com/yourpage"
                value={settingsForm.socialLinks.instagram}
                onChange={(e) => editSocial({ instagram: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">YouTube</label>
              <input
                type="text"
                placeholder="https://youtube.com/@yourchannel"
                value={settingsForm.socialLinks.youtube}
                onChange={(e) => editSocial({ youtube: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>


            <div className="space-y-1">
              <label className="font-bold text-slate-700">LinkedIn</label>
              <input
                type="text"
                placeholder="https://linkedin.com/yourpage"
                value={settingsForm.socialLinks.linkedin}
                onChange={(e) => editSocial({ linkedin: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-[#E6E0D6]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F1B2D]">Google Reviews (Elfsight)</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Paste the Elfsight install code or just the widget id. Leave empty to hide the reviews section.</p>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700">Elfsight Widget ID or Install Code</label>
              <input
                type="text"
                placeholder="elfsight-app-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={settingsForm.elfsightReviewsId}
                onChange={(e) => editSettings({ elfsightReviewsId: e.target.value })}
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E6E0D6] rounded font-mono"
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
            {settingsError && <span className="text-xs font-bold text-red-600">Not saved: {settingsError}</span>}
          </div>
        </form>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#E6E0D6] shadow-xs space-y-8 max-w-3xl text-xs">
          <div className="border-b border-[#E6E0D6] pb-3">
            <h3 className="text-base font-bold text-[#0F1B2D] uppercase tracking-wider">Website Images</h3>
            <p className="text-xs text-slate-500 mt-1">
              Changes here go live as soon as an image is uploaded or removed. Images are shrunk in your browser before upload.
            </p>
          </div>

          {/* Hero banners */}
          <section className="space-y-3">
            <div>
              <h4 className="font-bold text-[#0F1B2D] uppercase tracking-wider">Homepage Hero Banners</h4>
              <p className="text-[11px] text-slate-500">{IMAGE_GUIDE.banner.hint} One banner per featured product.</p>
            </div>
            <ul className="space-y-2">
              {HERO_SLIDES.map((slide) => {
                const custom = siteSettings.heroBackgrounds[slide.productId];
                const name = products.find((p) => p.id === slide.productId)?.name ?? slide.productId;
                return (
                  <li key={slide.productId} className="flex items-center gap-3 p-2 rounded border border-[#E6E0D6]">
                    <img src={custom || slide.background} alt="" className="w-28 h-16 object-cover rounded bg-slate-100 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#0F1B2D] truncate">{name}</div>
                      <div className="text-[10px] text-slate-500">{custom ? 'Your uploaded banner' : 'Built-in photo'}</div>
                    </div>
                    <UploadButton
                      busy={imageBusy === `hero-${slide.productId}`}
                      label={custom ? 'Replace' : 'Upload'}
                      onFile={(file) =>
                        saveImageSetting(
                          `hero-${slide.productId}`,
                          file,
                          IMAGE_GUIDE.banner.maxSize,
                          (url) => ({ heroBackgrounds: { ...siteSettings.heroBackgrounds, [slide.productId]: url } }),
                          custom
                        )
                      }
                    />
                    {custom && (
                      <button
                        type="button"
                        onClick={() => {
                          const rest = { ...siteSettings.heroBackgrounds };
                          delete rest[slide.productId];
                          removeImageSetting({ heroBackgrounds: rest }, custom);
                        }}
                        className="text-slate-500 hover:text-red-600 text-[11px] font-semibold"
                      >
                        Use built-in
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Homepage Category Covers */}
          <section className="space-y-3">
            <div>
              <h4 className="font-bold text-[#0F1B2D] uppercase tracking-wider">Homepage Category Covers</h4>
              <p className="text-[11px] text-slate-500">
                Shown in the "Shop by Category" grid on the homepage. By default, each card auto-syncs with the primary photo of the product in the catalogue. You can also upload a dedicated cover photo here.
              </p>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => {
                const custom = siteSettings.categoryImages?.[cat.id];
                return (
                  <li key={cat.id} className="p-3 rounded border border-[#E6E0D6] flex flex-col justify-between gap-2.5 bg-[#FAF8F5]">
                    <div className="flex items-center gap-3">
                      <img src={cat.imageUrl} alt={cat.name} className="w-16 h-12 object-cover rounded border border-[#E6E0D6] bg-slate-100 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[#0F1B2D] text-xs truncate">{cat.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {custom ? 'Custom cover uploaded' : 'Auto-synced from catalogue'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#E6E0D6]/60">
                      <UploadButton
                        busy={imageBusy === `cat-${cat.id}`}
                        label={custom ? 'Replace' : 'Upload'}
                        onFile={(file) =>
                          saveImageSetting(
                            `cat-${cat.id}`,
                            file,
                            IMAGE_GUIDE.product.maxSize,
                            (url) => ({ categoryImages: { ...(siteSettings.categoryImages || {}), [cat.id]: url } }),
                            custom
                          )
                        }
                      />
                      {custom && (
                        <button
                          type="button"
                          onClick={() => {
                            const rest = { ...(siteSettings.categoryImages || {}) };
                            delete rest[cat.id];
                            removeImageSetting({ categoryImages: rest }, custom);
                          }}
                          className="text-slate-500 hover:text-red-600 text-[10px] font-semibold"
                        >
                          Reset to catalogue photo
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Client logos */}
          <section className="space-y-3">
            <div>
              <h4 className="font-bold text-[#0F1B2D] uppercase tracking-wider">Our Clients — Logos</h4>
              <p className="text-[11px] text-slate-500">
                {IMAGE_GUIDE.logo.hint} The "Our Clients" section appears on the homepage once at least one logo is added.
              </p>
            </div>
            {siteSettings.clientLogos.length > 0 && (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {siteSettings.clientLogos.map((logo) => (
                  <li key={logo.id} className="p-2 rounded border border-[#E6E0D6] flex flex-col items-center gap-1.5">
                    <img src={logo.logoUrl} alt={logo.companyName} className="h-12 max-w-full object-contain" />
                    <div className="font-semibold text-[#0F1B2D] text-center truncate w-full">{logo.companyName}</div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm(`Remove the ${logo.companyName} logo?`)) return;
                        removeImageSetting({ clientLogos: siteSettings.clientLogos.filter((l) => l.id !== logo.id) }, logo.logoUrl);
                      }}
                      className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={newLogoName}
                onChange={(e) => setNewLogoName(e.target.value)}
                placeholder="Client / company name"
                className="flex-1 min-w-[180px] p-2 bg-[#FAF8F5] border border-[#E6E0D6] rounded"
              />
              {newLogoName.trim() ? (
                <UploadButton
                  busy={imageBusy === 'logo'}
                  label="Upload logo"
                  onFile={(file) =>
                    saveImageSetting('logo', file, IMAGE_GUIDE.logo.maxSize, (url) => ({
                      clientLogos: [
                        ...siteSettings.clientLogos,
                        { id: `logo-${Date.now()}`, companyName: newLogoName.trim(), logoUrl: url, sortOrder: siteSettings.clientLogos.length + 1, isActive: true },
                      ],
                    })).then(() => setNewLogoName(''))
                  }
                />
              ) : (
                <span className="text-[11px] text-slate-400">Type the company name, then upload its logo.</span>
              )}
            </div>
          </section>

          {/* Bank logo */}
          <section className="space-y-3">
            <div>
              <h4 className="font-bold text-[#0F1B2D] uppercase tracking-wider">Bank Logo (Checkout)</h4>
              <p className="text-[11px] text-slate-500">{IMAGE_GUIDE.logo.hint}</p>
            </div>
            <div className="flex items-center gap-3 p-2 rounded border border-[#E6E0D6]">
              {siteSettings.bankDetails.logoUrl ? (
                <img src={siteSettings.bankDetails.logoUrl} alt="" className="h-10 w-auto max-w-[160px] object-contain shrink-0" />
              ) : (
                <span className="text-slate-400">No logo</span>
              )}
              <div className="flex-1" />
              <UploadButton
                busy={imageBusy === 'bank'}
                label="Replace"
                onFile={(file) =>
                  saveImageSetting(
                    'bank',
                    file,
                    IMAGE_GUIDE.logo.maxSize,
                    (url) => ({ bankDetails: { ...siteSettings.bankDetails, logoUrl: url } }),
                    siteSettings.bankDetails.logoUrl
                  )
                }
              />
              {siteSettings.bankDetails.logoUrl !== DEFAULT_SITE_SETTINGS.bankDetails.logoUrl && (
                <button
                  type="button"
                  onClick={() =>
                    removeImageSetting(
                      { bankDetails: { ...siteSettings.bankDetails, logoUrl: DEFAULT_SITE_SETTINGS.bankDetails.logoUrl } },
                      siteSettings.bankDetails.logoUrl
                    )
                  }
                  className="text-slate-500 hover:text-red-600 text-[11px] font-semibold"
                >
                  Use built-in
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
