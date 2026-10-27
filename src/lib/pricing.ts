// Order pricing shared by the storefront and the server (api/_pricing.js is bundled from this file).
// Keep it free of React / window / browser APIs: it runs inside the Vercel function too.
import type { CartItem, DeliveryMethod, OptionGroup, PriceMatrixCell, Product, SiteSettings } from '../types';
import { DEFAULT_SITE_SETTINGS, SEED_PRICE_MATRIX, SEED_PRODUCTS } from '../data/seedData';
import { calculateDeliveryCharge, parseQuantityLabel } from './delivery';

export type SavedProducts = { list: Product[]; removed: string[] };

export interface Catalogue {
  products: Product[];
  priceMatrix: Record<string, PriceMatrixCell[]>;
  settings: SiteSettings;
}

// Saved copies from before a field existed get the default for it.
export const withDefaults = (saved: Partial<SiteSettings>): SiteSettings => ({
  ...DEFAULT_SITE_SETTINGS,
  ...saved,
  bankDetails: { ...DEFAULT_SITE_SETTINGS.bankDetails, ...saved.bankDetails },
  socialLinks: { ...DEFAULT_SITE_SETTINGS.socialLinks, ...saved.socialLinks },
  clientLogos: saved.clientLogos && saved.clientLogos.length > 0 ? saved.clientLogos : DEFAULT_SITE_SETTINGS.clientLogos,
  heroBackgrounds: { ...DEFAULT_SITE_SETTINGS.heroBackgrounds, ...saved.heroBackgrounds },
  categoryImages: { ...(DEFAULT_SITE_SETTINGS.categoryImages ?? {}), ...(saved.categoryImages ?? {}) },
});

// Staff's saved product list wins; built-in products added later (never saved or deleted by staff) are appended.
// ponytail: later edits to a built-in product that staff already saved don't reach visitors; per-field merge if needed.
export const mergeProducts = ({ list, removed }: SavedProducts): Product[] => [
  ...list,
  ...SEED_PRODUCTS.filter((p) => !removed.includes(p.id) && !list.some((x) => x.id === p.id)),
];

// The same merge the storefront applies to the 'price_matrix' / 'settings' / 'products' rows of site_settings.
export function buildCatalogue(rows: Array<{ key: string; value: unknown }>): Catalogue {
  const row = (key: string) => rows.find((r) => r.key === key)?.value;
  const saved = row('products') as SavedProducts | undefined;
  return {
    products: saved ? mergeProducts(saved) : SEED_PRODUCTS,
    priceMatrix: { ...SEED_PRICE_MATRIX, ...((row('price_matrix') as Record<string, PriceMatrixCell[]>) ?? {}) },
    settings: withDefaults((row('settings') as Partial<SiteSettings>) ?? {}),
  };
}

// Print price for one package of the chosen paper × quantity (0 = combination not priced).
export function optionPrice(product: Product, matrix: Catalogue['priceMatrix'], paperId: string, qtyId: string): number {
  if (!product.isVariable) return product.basePrice;
  if (!paperId || !qtyId) return 0;
  return matrix[product.id]?.find((c) => c.optionValueA === paperId && c.optionValueB === qtyId)?.price ?? 0;
}

// "Design it for me" fee for one package.
export function designFee(product: Product, settings: SiteSettings, artworkType: 'own' | 'design'): number {
  if (product.hasArtworkOption === false || artworkType !== 'design') return 0;
  return product.artworkFee ?? settings.defaultArtworkFee ?? 500;
}

export interface PricedOrder {
  subtotal: number;
  deliveryFee: number;
  addonTotal: number;
  total: number;
}

type PricingItem = Pick<CartItem, 'productId' | 'selectedOptions' | 'quantity' | 'artworkType'>;

const MAX_PACKAGES = 1000;

/**
 * Prices an order from the catalogue only; client prices and product snapshots are ignored.
 * Throws when a line can't be priced (unknown product, unpriced option, bad quantity).
 */
export function priceOrder(items: PricingItem[], deliveryMethod: DeliveryMethod, cat: Catalogue): PricedOrder {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Order has no items');
  let subtotal = 0;
  let addonTotal = 0;
  const lines = items.map((item) => {
    // Not filtered on isActive: the hidden single/double-sided twin of a product is still sold (printSides.ts)
    const product = cat.products.find((p) => p.id === item.productId);
    if (!product) throw new Error(`Unknown product ${item.productId}`);
    if (!(cat.priceMatrix[product.id]?.length > 0)) throw new Error(`${product.name} has no price yet`);

    const chosen = (group?: OptionGroup) =>
      group?.values.find((v) => item.selectedOptions?.some((o) => o.valueId === v.id));
    const paper = chosen(product.optionGroups?.[0]);
    const qty = chosen(product.optionGroups?.[1]);
    const base = optionPrice(product, cat.priceMatrix, paper?.id ?? '', qty?.id ?? '');
    if (base <= 0) throw new Error(`${product.name}: selected options are not priced`);

    const packages = item.quantity ?? 1;
    if (!Number.isInteger(packages) || packages < 1 || packages > MAX_PACKAGES) throw new Error(`${product.name}: invalid quantity`);

    const fee = designFee(product, cat.settings, item.artworkType);
    subtotal += (base + fee) * packages;
    addonTotal += fee;
    return {
      product,
      selectedOptions: paper ? [{ valueId: paper.id }] : [],
      quantity: packages,
      quantityCount: qty ? parseQuantityLabel(qty.label) : 100,
    };
  });
  const deliveryFee = calculateDeliveryCharge(deliveryMethod, lines, cat.settings.deliveryFee, cat.settings.deliveryCombineMode);
  return { subtotal, deliveryFee, addonTotal, total: subtotal + deliveryFee };
}
