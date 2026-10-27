export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
}

export interface OptionValue {
  id: string;
  groupId: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  textureHint?: string;
  finishType?: 'gloss' | 'matte' | 'metallic' | 'ribbed' | 'standard';
}

export interface OptionGroup {
  id: string;
  productId: string;
  name: string; // e.g. "Paper", "Quantity", "Size", "Lamination"
  inputType: 'select' | 'radio';
  isRequired: boolean;
  sortOrder: number;
  values: OptionValue[];
}

export interface PriceMatrixCell {
  id: string;
  productId: string;
  optionValueA: string; // e.g. Paper optionValue id
  optionValueB?: string; // e.g. Quantity optionValue id
  price: number;
  isActive: boolean;
}

export interface Addon {
  id: string;
  productId: string;
  name: string; // e.g. "Artwork design"
  price: number;
  isDefault: boolean;
  description: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  categoryId: string;
  categoryName?: string;
  basePrice: number;
  isVariable: boolean;
  isFeatured: boolean;
  isHot: boolean;
  deliveryNote: string;
  sizeNote: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  images: ProductImage[];
  optionGroups?: OptionGroup[];
  addons?: Addon[];
  specs?: Record<string, string>;
  artworkFee?: number; // fee added when customer selects "Design it for me" (defaults to 500)
  hasArtworkOption?: boolean; // whether to offer "Design it for me" option on this product (defaults to true)
  deliveryConfig?: ProductDeliveryConfig; // unset = store fallback delivery fee
}

// How this product's courier fee is worked out. Quantities are printed pieces (e.g. 1000 cards).
export interface DeliveryRates {
  mode: 'flat' | 'exact_qty' | 'range_tiers';
  flatFee: number;
  flatPerUnit?: boolean; // flat fee × packages ordered, instead of once per cart line
  exactQtyRates: { qty: number; fee: number }[]; // fee per package of exactly `qty` pieces
  rangeTiers: { minQty: number; maxQty: number; fee: number }[];
}

export interface ProductDeliveryConfig extends DeliveryRates {
  fallbackFee?: number; // no rate/tier matches; unset = store fallback fee
  hasSizeSpecificFees?: boolean;
  variantDeliveryConfigs?: Record<string, DeliveryRates>; // keyed by paper size ("A4", "A5"); a size without one uses the rates above
}

export interface CartItemOption {
  groupName: string;
  valueLabel: string;
  valueId: string;
}

export interface UploadedArtwork {
  slot: 1 | 2;
  fileName: string;
  fileSize: number;
  fileType: string;
  dataUrl?: string;
  previewUrl?: string;
  storagePath?: string; // path in the 'artwork-uploads' bucket
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  selectedOptions: CartItemOption[];
  quantity?: number; // order quantity / packages count (defaults to 1)
  quantityCount: number; // actual units printed (e.g. 1000 cards)
  unitPrice: number; // price per single piece in LKR
  itemPrice: number; // base print price for quantity selection
  selectedAddons: Addon[];
  artworkType: 'own' | 'design'; // "I have artwork" (Rs. 0) | "Design it for me" (Rs. 500)
  artworkFiles: UploadedArtwork[];
  specialInstructions?: string;
  lineTotal: number;
  priceToConfirm?: boolean; // product had no price yet — staff confirm it before printing
}

export type DeliveryMethod = 'delivery' | 'pickup';

// How per-product fees combine for a cart with several products
export type DeliveryCombineMode = 'highest_plus_extra' | 'highest' | 'sum';

export type OrderStatus = 'new' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled';
export type PaymentMethod = 'payhere' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'paid' | 'verification_needed' | 'failed';

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
}

// A row of public.customers (admin Customers tab)
export interface RegisteredCustomer {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  userId?: string; // set when the customer was signed in
  orderNumber: string; // e.g. AIP-2026-0142
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod?: DeliveryMethod; // 'delivery' | 'pickup' (defaults to 'delivery')
  deliveryAddress: string;
  city: string;
  district: string;
  totalQuantity?: number; // total item quantity in order
  subtotal: number;
  deliveryFee: number;
  discountTotal?: number; // discounts applied
  addonTotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  bankSlipUrl?: string; // storage path in the 'artwork-uploads' bucket
  bankSlipName?: string;
  specialInstructions?: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export type QuoteStatus = 'new' | 'quoted' | 'won' | 'lost';

export interface Quotation {
  id: string;
  quoteNumber: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  productType: string;
  quantity: string;
  specifications: string;
  deadline?: string;
  attachmentName?: string;
  attachmentUrl?: string; // storage path in the 'quote-attachments' bucket
  status: QuoteStatus;
  adminNotes?: string;
  quotedAmount?: number;
  quotedAt?: string; // when staff priced it; the quotation is valid from this date
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  customerName: string;
  customerTitle: string;
  content: string;
  avatarUrl?: string;
  rating: number;
  isPublished: boolean;
  sortOrder: number;
}

export interface ClientLogo {
  id: string;
  companyName: string;
  logoUrl: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  linkedin: string;
}

// Homepage pop-up for seasonal greetings / offers. Change `id` to show a new campaign to visitors who dismissed the last one.
export interface PromoSettings {
  isActive: boolean;
  id: string;
  title: string;
  message: string;
  imageUrl: string; // empty = text-only
  ctaText: string; // empty = no button
  ctaLink: string;
  dismissExpiryDays: number; // 0 = show again next visit (new browser session)
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  address: string;
  hotline: string;
  landline: string;
  whatsapp: string;
  email: string;
  artworkEmail: string;
  hoursWeekday: string;
  hoursSaturday: string;
  hoursSunday: string;
  deliveryFee: number;
  deliveryCombineMode?: DeliveryCombineMode; // defaults to 'highest_plus_extra'
  defaultArtworkFee?: number; // store-wide default fee for "Design it for me" (defaults to 500)
  announcementText: string;
  promo?: PromoSettings;
  bankDetails: {
    bankName: string;
    branch: string;
    accountName: string;
    accountNumber: string;
    logoUrl: string; // shown on the checkout bank-transfer box
  };
  socialLinks: SocialLinks; // empty = icon shown without a link
  elfsightReviewsId: string; // Elfsight Google Reviews widget id; empty hides the reviews section
  clientLogos: ClientLogo[];
  heroBackgrounds: Record<string, string>; // hero slide productId -> uploaded background (else the built-in photo)
  categoryImages?: Record<string, string>; // categoryId -> custom uploaded cover image (else auto-synced from catalogue)
  gtmId: string;
  metaPixelId: string;
}

