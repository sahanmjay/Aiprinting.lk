// Run: node scripts/test_delivery.mjs  (Node 22.18+/24 runs the .ts import directly)
import assert from 'node:assert/strict';
import {
  calculateDeliveryCharge as charge,
  calculateItemDeliveryFee as itemFee,
  parseQuantityLabel,
  validateDeliveryConfig,
} from '../src/lib/delivery.ts';

const BASE = 400;
const base = { flatFee: 0, exactQtyRates: [], rangeTiers: [] };
const item = (deliveryConfig, quantityCount, quantity = 1) => ({ quantity, quantityCount, product: { deliveryConfig } });

const cards = { ...base, mode: 'exact_qty', exactQtyRates: [{ qty: 100, fee: 300 }, { qty: 500, fee: 400 }, { qty: 1000, fee: 600 }] };
const books = { ...base, mode: 'range_tiers', rangeTiers: [{ minQty: 1, maxQty: 5, fee: 250 }, { minQty: 6, maxQty: 10, fee: 400 }, { minQty: 11, maxQty: 50, fee: 750 }] };
const flat = { ...base, mode: 'flat', flatFee: 400 };

// No config = store base fee
assert.equal(itemFee(item(undefined, 1000), BASE), 400);

// Flat: once per line, or × packages when flatPerUnit
assert.equal(itemFee(item(flat, 1000, 3), BASE), 400);
assert.equal(itemFee(item({ ...flat, flatPerUnit: true }, 1000, 3), BASE), 1200);

// Exact quantity, × packages; unmatched = product fallback, else store base
assert.equal(itemFee(item(cards, 100), BASE), 300);
assert.equal(itemFee(item(cards, 1000), BASE), 600);
assert.equal(itemFee(item(cards, 1000, 2), BASE), 1200);
assert.equal(itemFee(item(cards, 2000), BASE), 400);
assert.equal(itemFee(item({ ...cards, fallbackFee: 900 }, 2000), BASE), 900);

// Range tiers on total pieces (printed qty × packages), boundaries inclusive
assert.equal(itemFee(item(books, 5), BASE), 250);
assert.equal(itemFee(item(books, 6), BASE), 400);
assert.equal(itemFee(item(books, 10, 2), BASE), 750);
assert.equal(itemFee(item(books, 51), BASE), 400);

// Cart combining: 1000 cards (600) + 10 books (400) + 20 books (750)
const cart = [item(cards, 1000), item(books, 10), item(books, 20)];
assert.equal(charge('delivery', cart, BASE, 'sum'), 1750);
assert.equal(charge('delivery', cart, BASE, 'highest'), 750);
assert.equal(charge('delivery', cart, BASE, 'highest_plus_extra'), 750 + 200 + 0); // others add only their excess over 400
assert.equal(charge('delivery', cart, BASE), 950); // default mode
assert.equal(charge('pickup', cart, BASE, 'sum'), 0);
assert.equal(charge('delivery', [], BASE), 0);

// Quantity label parsing matches the product page
assert.equal(parseQuantityLabel('1,000 Cards'), 1000);
assert.equal(parseQuantityLabel('10 Books · Duplicate (2-ply)'), 10);
assert.equal(parseQuantityLabel('Standard'), 100);

// Validation
assert.equal(validateDeliveryConfig(cards), null);
assert.equal(validateDeliveryConfig(books), null);
assert.match(validateDeliveryConfig({ ...books, rangeTiers: [{ minQty: 1, maxQty: 10, fee: 1 }, { minQty: 8, maxQty: 20, fee: 1 }] }), /Overlapping/);
assert.match(validateDeliveryConfig({ ...books, rangeTiers: [{ minQty: 10, maxQty: 5, fee: 1 }] }), /maximum cannot be less/);
assert.match(validateDeliveryConfig({ ...cards, exactQtyRates: [{ qty: 100, fee: 1 }, { qty: 100, fee: 2 }] }), /listed twice/);
assert.match(validateDeliveryConfig({ ...flat, flatFee: -1 }), /negative/);

// Size-specific fees: A4 and A5 of one product, size found by the selected option id
const sizeGroup = { values: [{ id: 'a4', label: 'A4 (210 × 297 mm)' }, { id: 'a5', label: 'A5 · 120gsm Art Paper' }, { id: 'dl', label: 'DL' }] };
const bySize = {
  ...cards,
  hasSizeSpecificFees: true,
  variantDeliveryConfigs: {
    A5: { ...cards, exactQtyRates: [{ qty: 1000, fee: 400 }] },
    A4: { ...books, rangeTiers: [{ minQty: 1, maxQty: 10, fee: 500 }] },
  },
};
const sized = (config, valueId, quantityCount, quantity = 1) => ({
  quantity,
  quantityCount,
  product: { deliveryConfig: config, optionGroups: [sizeGroup] },
  selectedOptions: [{ valueId }],
});
assert.equal(itemFee(sized(bySize, 'a5', 1000), BASE), 400);
assert.equal(itemFee(sized(bySize, 'a4', 10), BASE), 500);
assert.equal(itemFee(sized(bySize, 'a4', 1000), BASE), 400); // no A4 tier for 1000 = fallback
assert.equal(itemFee(sized(bySize, 'dl', 1000), BASE), 600); // no size = product rates
assert.equal(itemFee(sized({ ...bySize, hasSizeSpecificFees: false }, 'a5', 1000), BASE), 600); // switched off
assert.equal(charge('courier', [sized(bySize, 'a4', 10), sized(bySize, 'a5', 1000)], BASE), 500 + 0);
assert.match(validateDeliveryConfig({ ...bySize, variantDeliveryConfigs: { A4: { ...flat, flatFee: -1 } } }), /^A4: .*negative/);
assert.equal(validateDeliveryConfig({ ...bySize, hasSizeSpecificFees: false, variantDeliveryConfigs: { A4: { ...flat, flatFee: -1 } } }), null);

console.log('All delivery tests passed.');
