import type { DeliveryCombineMode, DeliveryMethod, DeliveryRates, Product, ProductDeliveryConfig } from '../types';

type DeliveryItem = {
  quantity?: number;
  quantityCount: number;
  product: Pick<Product, 'deliveryConfig' | 'optionGroups'>;
  selectedOptions?: { valueId: string }[];
};

// Paper size in an option label ("A5 · 120gsm Art Paper" -> "A5")
export const sizeOfLabel = (label: string): string | undefined => label.match(/\bA\d\b/)?.[0];

// Distinct paper sizes offered by a product's options, e.g. ["A4", "A5"]
export const productSizes = (product: Pick<Product, 'optionGroups'>): string[] => [
  ...new Set((product.optionGroups ?? []).flatMap((g) => g.values.map((v) => sizeOfLabel(v.label)).filter((s): s is string => !!s))),
];

// Size of the option the customer picked, looked up by id in the product (not the label the cart sent)
const selectedSize = (item: DeliveryItem): string | undefined => {
  const ids = new Set((item.selectedOptions ?? []).map((o) => o.valueId));
  for (const g of item.product.optionGroups ?? []) {
    const v = g.values.find((x) => ids.has(x.id));
    const size = v && sizeOfLabel(v.label);
    if (size) return size;
  }
};

const packages = (item: { quantity?: number }) =>
  typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;

// Printed pieces in a quantity option label ("1,000 Cards" -> 1000); no number = 100
export const parseQuantityLabel = (label: string): number => {
  const match = label.replace(/,/g, '').match(/\d+/);
  return match ? parseInt(match[0], 10) : 100;
};

/**
 * Calculates total item quantity across all order items.
 * Each item has a `quantity` (e.g. 1 package / 2 sets), defaulting to 1.
 */
export function calculateTotalItemQuantity(items: Array<{ quantity?: number }> = []): number {
  return items.reduce((sum, item) => sum + packages(item), 0);
}

/**
 * Delivery fee for one cart line, from its product's delivery config:
 * - flat: flatFee once, or × packages when flatPerUnit
 * - exact_qty: fee of the rate whose qty equals the printed quantity, × packages
 * - range_tiers: fee of the tier containing printed quantity × packages
 * With size-specific fees, the selected size's rates are used (a size without its own rates uses the product's).
 * No config, or no matching rate/tier = fallback fee.
 */
export function calculateItemDeliveryFee(item: DeliveryItem, storeFallbackFee: number): number {
  const config = item.product.deliveryConfig;
  if (!config) return storeFallbackFee;
  const fallback = config.fallbackFee ?? storeFallbackFee;
  const size = config.hasSizeSpecificFees ? selectedSize(item) : undefined;
  const c: DeliveryRates = (size && config.variantDeliveryConfigs?.[size]) || config;
  const n = packages(item);
  if (c.mode === 'flat') return c.flatFee * (c.flatPerUnit ? n : 1);
  if (c.mode === 'exact_qty') {
    const rate = c.exactQtyRates.find((r) => r.qty === item.quantityCount);
    return rate ? rate.fee * n : fallback;
  }
  const total = item.quantityCount * n;
  const tier = c.rangeTiers.find((t) => total >= t.minQty && total <= t.maxQty);
  return tier ? tier.fee : fallback;
}

/**
 * Order delivery charge. Customer Pickup is always Rs. 0.00.
 * Several products ship as one parcel, so by default ('highest_plus_extra') the highest product fee is charged
 * and every other product adds only what its fee exceeds the base courier fee by (its extra weight).
 */
export function calculateDeliveryCharge(
  deliveryMethod: DeliveryMethod,
  items: DeliveryItem[],
  baseFee: number,
  combine: DeliveryCombineMode = 'highest_plus_extra'
): number {
  if (deliveryMethod === 'pickup' || items.length === 0) return 0;
  const fees = items.map((i) => calculateItemDeliveryFee(i, baseFee)).sort((a, b) => b - a);
  if (combine === 'sum') return fees.reduce((s, f) => s + f, 0);
  if (combine === 'highest') return fees[0];
  return fees[0] + fees.slice(1).reduce((s, f) => s + Math.max(0, f - baseFee), 0);
}

/**
 * Validates a product's delivery config: no negative fees, min ≤ max, no overlapping ranges, no duplicate exact quantities.
 * Returns null if valid, or an error message.
 */
const bad = (n: number) => typeof n !== 'number' || isNaN(n) || n < 0;

export function validateDeliveryConfig(c: ProductDeliveryConfig): string | null {
  if (c.fallbackFee !== undefined && bad(c.fallbackFee)) return 'Fallback delivery fee cannot be negative.';
  if (c.hasSizeSpecificFees) {
    for (const [size, rates] of Object.entries(c.variantDeliveryConfigs ?? {})) {
      const error = validateRates(rates);
      if (error) return `${size}: ${error}`;
    }
  }
  return validateRates(c);
}

function validateRates(c: DeliveryRates): string | null {
  if (c.mode === 'flat' && bad(c.flatFee)) return 'Flat delivery fee cannot be negative.';

  if (c.mode === 'exact_qty') {
    if (c.exactQtyRates.length === 0) return 'Add at least one quantity rate.';
    for (const r of c.exactQtyRates) {
      if (!(r.qty >= 1)) return 'Each quantity must be 1 or greater.';
      if (bad(r.fee)) return `Qty ${r.qty}: delivery fee cannot be negative.`;
    }
    const qtys = c.exactQtyRates.map((r) => r.qty);
    const dup = qtys.find((q, i) => qtys.indexOf(q) !== i);
    if (dup !== undefined) return `Quantity ${dup} is listed twice.`;
  }

  if (c.mode === 'range_tiers') {
    if (c.rangeTiers.length === 0) return 'Add at least one quantity range.';
    for (const t of c.rangeTiers) {
      if (!(t.minQty >= 1)) return 'Minimum quantity must be 1 or greater.';
      if (!(t.maxQty >= t.minQty)) return `Range ${t.minQty}–${t.maxQty}: maximum cannot be less than minimum.`;
      if (bad(t.fee)) return `Range ${t.minQty}–${t.maxQty}: delivery fee cannot be negative.`;
    }
    for (let i = 0; i < c.rangeTiers.length; i++) {
      for (let j = i + 1; j < c.rangeTiers.length; j++) {
        const a = c.rangeTiers[i];
        const b = c.rangeTiers[j];
        if (Math.max(a.minQty, b.minQty) <= Math.min(a.maxQty, b.maxQty)) {
          return `Overlapping ranges: ${a.minQty}–${a.maxQty} and ${b.minQty}–${b.maxQty}.`;
        }
      }
    }
  }

  return null;
}
