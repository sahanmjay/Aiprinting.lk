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
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  selectedOptions: CartItemOption[];
  quantityCount: number; // actual units printed (e.g. 1000 cards)
  unitPrice: number; // price per single piece in LKR
  itemPrice: number; // base print price for quantity selection
  selectedAddons: Addon[];
  artworkType: 'own' | 'design'; // "I have artwork" (Rs. 0) | "Design it for me" (Rs. 500)
  artworkFiles: UploadedArtwork[];
  specialInstructions?: string;
  lineTotal: number;
}

export type OrderStatus = 'new' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled';
export type PaymentMethod = 'payhere' | 'bank_transfer' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'verification_needed' | 'failed';

export interface Order {
  id: string;
  orderNumber: string; // e.g. AIP-2026-0142
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  district: string;
  subtotal: number;
  deliveryFee: number;
  addonTotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  bankSlipUrl?: string;
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
  attachmentUrl?: string;
  status: QuoteStatus;
  adminNotes?: string;
  quotedAmount?: number;
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
  announcementText: string;
  bankDetails: {
    bankName: string;
    branch: string;
    accountName: string;
    accountNumber: string;
  };
  gtmId: string;
  metaPixelId: string;
}
