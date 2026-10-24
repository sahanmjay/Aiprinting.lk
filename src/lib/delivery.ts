import { DeliveryMethod, DeliveryRule } from '../types';

export interface DeliveryCalculationResult {
  deliveryCharge: number;
  matchedRule?: DeliveryRule;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Calculates total delivery quantity (parcels) across all order items.
 * Each item has a `quantity` (e.g. 1 package / 2 sets), defaulting to 1.
 * When the item's category has a pieces-per-parcel size (e.g. 500 visiting cards),
 * each package counts as ceil(quantityCount / size) parcels, so 1,000 cards = 2 parcels.
 */
export function calculateTotalItemQuantity(
  items: Array<{ quantity?: number; quantityCount?: number; product?: { categoryId: string } }> = [],
  parcelSizes: Record<string, number> = {}
): number {
  return items.reduce((sum, item) => {
    const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
    const size = item.product ? parcelSizes[item.product.categoryId] : 0;
    const parcels = size > 0 && item.quantityCount ? Math.ceil(item.quantityCount / size) : 1;
    return sum + qty * parcels;
  }, 0);
}

/**
 * Calculates delivery charge based on delivery method and total item quantity.
 * - Customer Pickup is always Rs. 0.00.
 * - Delivery looks up the configured quantity range rule.
 * - If no range matches, marks result as invalid with a descriptive error message.
 */
export function calculateDeliveryCharge(
  deliveryMethod: DeliveryMethod,
  totalQuantity: number,
  rules: DeliveryRule[] = [],
  fallbackFee: number = 0
): DeliveryCalculationResult {
  if (deliveryMethod === 'pickup') {
    return {
      deliveryCharge: 0,
      isValid: true,
    };
  }

  if (totalQuantity <= 0) {
    return {
      deliveryCharge: 0,
      isValid: true,
    };
  }

  if (!rules || rules.length === 0) {
    // If no rules configured at all, fallback to the base flat fee
    return {
      deliveryCharge: fallbackFee,
      isValid: true,
    };
  }

  // Find matching range
  const matched = rules.find((r) => totalQuantity >= r.minQty && totalQuantity <= r.maxQty);
  if (matched) {
    return {
      deliveryCharge: matched.charge,
      matchedRule: matched,
      isValid: true,
    };
  }

  return {
    deliveryCharge: 0,
    isValid: false,
    errorMessage: `No delivery charge rule matches a total quantity of ${totalQuantity} ${
      totalQuantity === 1 ? 'item' : 'items'
    }. Please select Customer Pickup or contact us for a custom rate.`,
  };
}

/**
 * Validates a list of delivery rules to prevent negative values, min > max,
 * and overlapping quantity ranges.
 * Returns null if all rules are valid, or an error message string if invalid.
 */
export function validateDeliveryRules(rules: DeliveryRule[]): string | null {
  if (!rules || rules.length === 0) {
    return 'At least one delivery charge rule is required.';
  }

  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    if (typeof r.minQty !== 'number' || isNaN(r.minQty) || r.minQty < 1) {
      return `Rule #${i + 1}: Minimum quantity must be 1 or greater.`;
    }
    if (typeof r.maxQty !== 'number' || isNaN(r.maxQty) || r.maxQty < r.minQty) {
      return `Rule #${i + 1}: Maximum quantity (${r.maxQty}) cannot be less than minimum quantity (${r.minQty}).`;
    }
    if (typeof r.charge !== 'number' || isNaN(r.charge) || r.charge < 0) {
      return `Rule #${i + 1}: Delivery charge cannot be negative.`;
    }
  }

  // Check for overlapping ranges between rules
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const a = rules[i];
      const b = rules[j];
      const overlapStart = Math.max(a.minQty, b.minQty);
      const overlapEnd = Math.min(a.maxQty, b.maxQty);
      if (overlapStart <= overlapEnd) {
        return `Overlapping quantity ranges detected: Range ${a.minQty}–${a.maxQty} overlaps with Range ${b.minQty}–${b.maxQty}.`;
      }
    }
  }

  return null;
}
