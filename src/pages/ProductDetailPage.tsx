import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  Users,
  MessageCircle,
  ShoppingBag,
  Flame,
  UploadCloud,
  FileCheck,
  X,
  Check,
  Layers,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { uploadFile } from '../lib/supabase';
import { formatLKR, getWhatsAppUrl, formatFileSize } from '../lib/formatters';
import { UploadedArtwork, CartItem, Product } from '../types';
import { RegistrationMark } from '../components/common/RegistrationMark';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { products, getPriceForOptions, addToCart, siteSettings } = useStore();

  const product = useMemo(() => {
    return products.find((p) => p.slug === slug) || products[0];
  }, [products, slug]);

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Configurator selections
  // Option Group 1: typically Paper Stock
  const paperGroup = product.optionGroups?.[0];
  const [selectedPaperId, setSelectedPaperId] = useState<string>(
    paperGroup?.values[0]?.id || ''
  );

  // Option Group 2: typically Quantity
  const qtyGroup = product.optionGroups?.[1];
  const [selectedQtyId, setSelectedQtyId] = useState<string>(
    qtyGroup?.values[0]?.id || ''
  );

  // Artwork selection
  const [artworkType, setArtworkType] = useState<'own' | 'design'>('own');
  const [artworkFiles, setArtworkFiles] = useState<UploadedArtwork[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Active Tab below the fold
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'delivery'>('description');
  const [addedToast, setAddedToast] = useState(false);

  // Price Calculation
  const selectedPaper = paperGroup?.values.find((v) => v.id === selectedPaperId);
  const selectedQty = qtyGroup?.values.find((v) => v.id === selectedQtyId);

  // Extract quantity number (e.g. "1,000 Cards" -> 1000)
  const quantityCount = useMemo(() => {
    if (!selectedQty) return 100;
    const match = selectedQty.label.replace(/,/g, '').match(/\d+/);
    return match ? parseInt(match[0], 10) : 100;
  }, [selectedQty]);

  const baseOptionPrice = useMemo(() => {
    if (!product.isVariable) return product.basePrice;
    if (!selectedPaperId || !selectedQtyId) return 0;
    return getPriceForOptions(product.id, selectedPaperId, selectedQtyId);
  }, [product, selectedPaperId, selectedQtyId, getPriceForOptions]);

  const designFee = artworkType === 'design' ? 500 : 0;
  const totalPrice = baseOptionPrice + designFee;
  const unitPrice = quantityCount > 0 ? totalPrice / quantityCount : 0;

  // Artwork goes straight to Supabase Storage; the cart keeps only the storage path.
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    try {
      const storagePath = await uploadFile('artwork-uploads', file);
      setArtworkFiles((prev) => [
        ...prev.filter((f) => f.slot !== slot),
        { slot, fileName: file.name, fileSize: file.size, fileType: file.type, storagePath },
      ]);
    } catch (err) {
      console.error('Artwork upload failed:', err);
      alert('Could not upload your artwork. Please try again, or email it to us after placing the order.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeArtworkFile = (slot: 1 | 2) => {
    setArtworkFiles((prev) => prev.filter((f) => f.slot !== slot));
  };

  // Add to Cart
  const handleAddToCart = () => {
    const selectedOptionsList = [];
    if (paperGroup && selectedPaper) {
      selectedOptionsList.push({
        groupName: paperGroup.name,
        valueLabel: selectedPaper.label,
        valueId: selectedPaper.id,
      });
    }
    if (qtyGroup && selectedQty) {
      selectedOptionsList.push({
        groupName: qtyGroup.name,
        valueLabel: selectedQty.label,
        valueId: selectedQty.id,
      });
    }

    const newItem: CartItem = {
      id: `cart-${Date.now()}`,
      productId: product.id,
      product,
      selectedOptions: selectedOptionsList,
      quantityCount,
      unitPrice,
      itemPrice: baseOptionPrice,
      selectedAddons:
        artworkType === 'design'
          ? [
              {
                id: 'addon-design',
                productId: product.id,
                name: 'Professional Artwork Design',
                price: 500,
                isDefault: false,
                description: 'In-house graphic design layout',
              },
            ]
          : [],
      artworkType,
      artworkFiles,
      specialInstructions,
      lineTotal: totalPrice,
    };

    addToCart(newItem);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  // Build WhatsApp pre-filled configuration message
  const whatsappMessage = useMemo(() => {
    let msg = `Hi Ai Printing Solutions! I'd like to order:\n\n*Product:* ${product.name}\n`;
    if (selectedPaper) msg += `*Paper Stock:* ${selectedPaper.label}\n`;
    if (selectedQty) msg += `*Quantity:* ${selectedQty.label}\n`;
    msg += `*Artwork Option:* ${artworkType === 'design' ? 'Design it for me (+Rs. 500)' : 'I have artwork'}\n`;
    msg += `*Estimated Total:* ${formatLKR(totalPrice)} (excl. delivery)\n`;
    if (specialInstructions) msg += `*Notes:* ${specialInstructions}\n`;
    msg += `\nPlease confirm production turnaround. Thank you!`;
    return msg;
  }, [product, selectedPaper, selectedQty, artworkType, totalPrice, specialInstructions]);

  // Related products
  const relatedProducts = products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-[#0F1B2D]">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to="/shop" className="hover:text-[#0F1B2D]">Shop</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to={`/shop/${product.categoryId.replace('cat-', '')}`} className="hover:text-[#0F1B2D]">
          {product.categoryName || 'Catalogue'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[#0F1B2D] font-semibold truncate max-w-[200px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* Main Configurator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* LEFT COLUMN: IMAGE GALLERY */}
        <div className="lg:col-span-6 space-y-4">
          {/* Primary View */}
          <div className="relative rounded-lg overflow-hidden border border-[#E6E0D6] bg-white aspect-4/3 group">
            <img
              src={product.images[selectedImageIndex]?.imageUrl || product.images[0]?.imageUrl}
              alt={product.images[selectedImageIndex]?.altText || product.name}
              className="w-full h-full object-cover"
              loading="eager"
            />

            {/* Hot Badge */}
            {product.isHot && (
              <span className="absolute top-3 left-3 bg-[#D6342C] text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded shadow-sm flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current" />
                Hot
              </span>
            )}

            {/* Lightbox trigger */}
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-[#0F1B2D] p-2 rounded-full shadow-md backdrop-blur-xs transition-colors"
              title="View fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnail Strip */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-16 rounded overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImageIndex === idx ? 'border-[#D6342C] shadow-xs' : 'border-[#E6E0D6] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.imageUrl} alt={img.altText} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Size & Spec note callout */}
          {product.sizeNote && (
            <div className="p-3.5 bg-white border border-[#E6E0D6] rounded text-xs text-slate-600 space-y-1">
              <div className="font-bold text-[#0F1B2D] flex items-center gap-1.5">
                <RegistrationMark size={14} />
                <span>Standard Dimensions & Special Finishes:</span>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-500">{product.sizeNote}</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: INTERACTIVE CONFIGURATOR */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-lg border border-[#E6E0D6] shadow-xs space-y-6">
          {/* Title & Category Header */}
          <div className="space-y-1.5 border-b border-[#E6E0D6] pb-4">
            <div className="text-xs font-bold uppercase tracking-widest text-[#D6342C]">
              {product.categoryName}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1B2D] tracking-tight leading-tight">
              {product.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {product.shortDescription}
            </p>
          </div>

          {/* LIVE PRICE DISPLAY (Prompt 4 Highlight) */}
          <div className="bg-[#FAF8F5] p-4 rounded border border-[#E6E0D6] flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Instant Price
              </div>
              {selectedPaperId && selectedQtyId ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-[#0F1B2D]">
                    {formatLKR(totalPrice)}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    · {formatLKR(unitPrice)} per item
                  </span>
                </div>
              ) : (
                <div className="text-sm font-semibold text-slate-500">
                  Select options to see price
                </div>
              )}
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                Live Matrix Active
              </span>
            </div>
          </div>

          {/* CONFIGURATOR CONTROLS */}
          <div className="space-y-4">
            {/* Paper Stock Dropdown */}
            {paperGroup && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="paper-stock-select" className="font-bold text-[#0F1B2D]">
                    1. Select {paperGroup.name}:
                  </label>
                  {selectedPaper && (
                    <span className="text-[11px] font-medium text-slate-500">
                      Finish: <span className="capitalize text-[#D6342C] font-semibold">{selectedPaper.finishType || 'Standard'}</span>
                    </span>
                  )}
                </div>
                <select
                  id="paper-stock-select"
                  value={selectedPaperId}
                  onChange={(e) => setSelectedPaperId(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-white border border-[#0F1B2D] rounded font-medium text-[#0F1B2D] focus:ring-1 focus:ring-[#0F1B2D] focus:outline-hidden"
                >
                  {paperGroup.values.map((val) => (
                    <option key={val.id} value={val.id}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity Dropdown */}
            {qtyGroup && (
              <div className="space-y-1.5">
                <label htmlFor="quantity-select" className="block text-xs font-bold text-[#0F1B2D]">
                  2. Select {qtyGroup.name}:
                </label>
                <select
                  id="quantity-select"
                  value={selectedQtyId}
                  onChange={(e) => setSelectedQtyId(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-white border border-[#0F1B2D] rounded font-medium text-[#0F1B2D] focus:ring-1 focus:ring-[#0F1B2D] focus:outline-hidden"
                >
                  {qtyGroup.values.map((val) => (
                    <option key={val.id} value={val.id}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Artwork Radio Selection */}
            <div className="space-y-2 pt-1">
              <span className="block text-xs font-bold text-[#0F1B2D]">
                3. Artwork Preparation:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  className={`p-3 rounded border text-xs cursor-pointer flex items-center justify-between transition-all ${
                    artworkType === 'own'
                      ? 'border-[#0F1B2D] bg-[#0F1B2D]/5 font-semibold text-[#0F1B2D]'
                      : 'border-[#E6E0D6] text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="artworkChoice"
                      checked={artworkType === 'own'}
                      onChange={() => setArtworkType('own')}
                      className="accent-[#0F1B2D]"
                    />
                    <span>I have print-ready artwork</span>
                  </div>
                  <span className="text-slate-500 font-bold">Rs. 0</span>
                </label>

                <label
                  className={`p-3 rounded border text-xs cursor-pointer flex items-center justify-between transition-all ${
                    artworkType === 'design'
                      ? 'border-[#D6342C] bg-[#D6342C]/5 font-semibold text-[#D6342C]'
                      : 'border-[#E6E0D6] text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="artworkChoice"
                      checked={artworkType === 'design'}
                      onChange={() => setArtworkType('design')}
                      className="accent-[#D6342C]"
                    />
                    <span>Design it for me</span>
                  </div>
                  <span className="font-bold text-[#D6342C]">+Rs. 500</span>
                </label>
              </div>
            </div>

            {/* FILE UPLOAD (Dual Slots, max 128MB, progress & preview) */}
            {artworkType === 'own' && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#0F1B2D]">
                    Upload Artwork Files (Front / Back):
                  </span>
                  <span className="text-[11px] text-slate-500">
                    PDF, AI, PSD, CDR, TIFF, PNG, JPG
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Slot 1: Front Artwork */}
                  <div className="border-2 border-dashed border-[#E6E0D6] hover:border-[#0F1B2D] rounded p-3 text-center bg-[#FAF8F5] transition-colors relative">
                    {artworkFiles.find((f) => f.slot === 1) ? (
                      <div className="space-y-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5" /> Slot 1: Front
                          </span>
                          <button
                            type="button"
                            onClick={() => removeArtworkFile(1)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {artworkFiles.find((f) => f.slot === 1)?.fileName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formatFileSize(artworkFiles.find((f) => f.slot === 1)?.fileSize || 0)}
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="block text-xs font-semibold text-[#0F1B2D]">
                          Front Artwork (Slot 1)
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          Click or drag file here
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.ai,.psd,.cdr,.tiff,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileUpload(e, 1)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Slot 2: Back Artwork */}
                  <div className="border-2 border-dashed border-[#E6E0D6] hover:border-[#0F1B2D] rounded p-3 text-center bg-[#FAF8F5] transition-colors relative">
                    {artworkFiles.find((f) => f.slot === 2) ? (
                      <div className="space-y-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5" /> Slot 2: Back
                          </span>
                          <button
                            type="button"
                            onClick={() => removeArtworkFile(2)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {artworkFiles.find((f) => f.slot === 2)?.fileName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formatFileSize(artworkFiles.find((f) => f.slot === 2)?.fileSize || 0)}
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="block text-xs font-semibold text-[#0F1B2D]">
                          Back Artwork (Slot 2)
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          Optional for single-side
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.ai,.psd,.cdr,.tiff,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileUpload(e, 2)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {isUploading && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#0F1B2D]" />
                    <span>Processing file upload...</span>
                  </div>
                )}

                {/* Important notice required in prompt */}
                <p className="text-[11px] text-slate-500 italic">
                  * File over 25MB? Email it to{' '}
                  <a href={`mailto:${siteSettings.artworkEmail}`} className="text-[#0F1B2D] underline font-medium">
                    {siteSettings.artworkEmail}
                  </a>{' '}
                  with your order number after placing your order.
                </p>
              </div>
            )}

            {/* Special Instructions */}
            <div className="space-y-1 pt-1">
              <label htmlFor="special-instructions" className="block text-xs font-bold text-[#0F1B2D]">
                Special Instructions (Optional):
              </label>
              <textarea
                id="special-instructions"
                rows={2}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Specify curved corner radius, foil stamp color, starting numbering..."
                className="w-full p-2 text-xs bg-[#FAF8F5] border border-[#E6E0D6] rounded focus:bg-white focus:outline-hidden focus:border-[#0F1B2D]"
              />
            </div>
          </div>

          {/* CTAs: Add to Cart & WhatsApp */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isUploading}
              className="w-full py-3.5 px-4 bg-[#D6342C] hover:bg-[#B8251E] text-white font-bold text-sm rounded shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-99 disabled:opacity-60 disabled:cursor-wait"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart ({formatLKR(totalPrice)})</span>
            </button>

            <a
              href={getWhatsAppUrl(siteSettings.whatsapp, whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Order Directly on WhatsApp</span>
            </a>

            {addedToast && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded font-medium flex items-center justify-between animate-in fade-in">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Item added to cart successfully!
                </span>
                <Link to="/cart" className="underline font-bold">
                  View Cart
                </Link>
              </div>
            )}
          </div>

          {/* TRUST ROW */}
          <div className="pt-4 border-t border-[#E6E0D6] grid grid-cols-3 gap-2 text-center text-[11px] text-slate-600">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Money-Back Guarantee</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Truck className="w-4 h-4 text-[#0F1B2D]" />
              <span>Island-Wide 1–2 Days</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Users className="w-4 h-4 text-[#D6342C]" />
              <span>1000+ Happy Clients</span>
            </div>
          </div>
        </div>
      </div>

      {/* BELOW THE FOLD: TABBED SPECS & DESCRIPTION */}
      <div className="bg-white rounded-lg border border-[#E6E0D6] p-6 sm:p-8 space-y-6">
        {/* Tab Headers */}
        <div className="flex border-b border-[#E6E0D6] gap-6 text-sm">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 font-bold transition-colors relative ${
              activeTab === 'description' ? 'text-[#D6342C]' : 'text-slate-500 hover:text-[#0F1B2D]'
            }`}
          >
            Product Description
            {activeTab === 'description' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D6342C]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 font-bold transition-colors relative ${
              activeTab === 'specs' ? 'text-[#D6342C]' : 'text-slate-500 hover:text-[#0F1B2D]'
            }`}
          >
            Technical Specifications
            {activeTab === 'specs' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D6342C]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('delivery')}
            className={`pb-3 font-bold transition-colors relative ${
              activeTab === 'delivery' ? 'text-[#D6342C]' : 'text-slate-500 hover:text-[#0F1B2D]'
            }`}
          >
            Delivery & Payment
            {activeTab === 'delivery' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D6342C]" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          {activeTab === 'description' && (
            <div className="space-y-4">
              <p>{product.longDescription}</p>
              <p>
                Printed using high-grade Japanese digital offset presses and calibrated spectrophotometers to ensure razor-sharp microscopic detail and exceptional CMYK gamut rendition.
              </p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                {product.specs ? (
                  Object.entries(product.specs).map(([k, v]) => (
                    <div key={k} className="p-2.5 bg-[#FAF8F5] rounded border border-[#E6E0D6]">
                      <div className="text-[11px] font-bold text-slate-500 uppercase">{k}</div>
                      <div className="font-semibold text-[#0F1B2D] mt-0.5">{v}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">Standard offset 300 DPI specifications apply.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-3">
              <p>
                <strong>Island-Wide Doorstep Delivery:</strong> We partner with premier courier networks covering all 25 districts of Sri Lanka. Flat fee of <strong>{formatLKR(siteSettings.deliveryFee)}</strong> is added to your cart.
              </p>
              <p>
                <strong>Payment Methods:</strong> Pay securely online via PayHere (Credit/Debit Card), Bank Transfer directly to our Commercial Bank account with receipt upload, or Cash on Delivery.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E6E0D6] pb-3">
            <h3 className="font-bold text-lg text-[#0F1B2D]">Related Print Products</h3>
            <Link to="/shop" className="text-xs font-bold text-[#D6342C] hover:underline">
              View all &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedProducts.map((rel) => (
              <Link
                key={rel.id}
                to={`/product/${rel.slug}`}
                className="bg-white p-4 rounded border border-[#E6E0D6] hover:shadow-md transition-all flex items-center gap-4 group"
              >
                <div className="w-16 h-16 rounded overflow-hidden bg-slate-100 shrink-0">
                  <img src={rel.images[0]?.imageUrl} alt={rel.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#0F1B2D] group-hover:text-[#D6342C] transition-colors leading-snug">
                    {rel.name}
                  </h4>
                  <div className="text-xs font-semibold text-slate-500 mt-1">
                    From {formatLKR(rel.basePrice)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded">
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 text-white bg-black/60 p-2 rounded-full hover:bg-black"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={product.images[selectedImageIndex]?.imageUrl}
              alt={product.name}
              className="max-h-[85vh] w-auto mx-auto object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};
