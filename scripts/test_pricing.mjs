// Run: node scripts/test_pricing.mjs
// Prices 5 sample orders with the server bundle (api/_pricing.js) against totals worked out by hand
// from src/data/priceTables.ts — the same numbers the product page / cart show.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCatalogue, priceOrder } from '../api/_pricing.js';
import { bundlePricing } from './bundle-pricing.mjs';

// The committed bundle must match src/lib/pricing.ts
assert.equal(readFileSync(new URL('../api/_pricing.js', import.meta.url), 'utf8'), await bundlePricing(false), 'api/_pricing.js is stale: run npm run build');

const seed = buildCatalogue([]); // built-in prices, Rs. 400 base delivery, 'highest_plus_extra'
const line = (productId, paper, qty, artworkType = 'own', quantity = 1) => ({
  productId,
  quantity,
  artworkType,
  selectedOptions: [{ valueId: paper }, { valueId: qty }],
});
const VC2 = 'prod-vc-double', VC1 = 'prod-vc-single', NCR = 'prod-bill-ncr';

// 1. Double-sided cards, 260gsm Art Board × 1,000 → 12,000 + delivery 400
assert.deepEqual(priceOrder([line(VC2, '260gsm-art-board-gloss-finish', '1-000-cards')], 'delivery', seed),
  { subtotal: 12000, deliveryFee: 400, addonTotal: 0, total: 12400 });

// 2. 300gsm Ice Gold × 500, "Design it for me" (500), 2 packages → (9,000 + 500) × 2 + 400
assert.deepEqual(priceOrder([line(VC2, '300gsm-ice-gold-board-metallic-finish', '500-cards', 'design', 2)], 'delivery', seed),
  { subtotal: 19000, deliveryFee: 400, addonTotal: 500, total: 19400 });

// 3. NCR bill books A5 × 10 Books Triplicate, customer pickup → 12,600 + 0
assert.deepEqual(priceOrder([line(NCR, 'a5-148-210-mm', '10-books-triplicate-3-ply')], 'pickup', seed),
  { subtotal: 12600, deliveryFee: 0, addonTotal: 0, total: 12600 });

// 4. Mixed cart: single-sided 280gsm Ivory × 100 + design (1,200 + 500) and 3 × NCR A4 2 Books Duplicate (7,000)
//    → 1,700 + 21,000; delivery = highest 400 + nothing extra
assert.deepEqual(
  priceOrder([line(VC1, '280gsm-ivory-board-matte-finish', '100-cards', 'design'), line(NCR, 'a4-210-297-mm', '2-books-duplicate-2-ply', 'own', 3)], 'delivery', seed),
  { subtotal: 22700, deliveryFee: 400, addonTotal: 500, total: 23100 }
);

// 5. Staff-edited prices + per-product delivery + 'sum' mode, as saved in site_settings:
//    260gsm × 1,000 re-priced to 12,500 with exact-qty delivery 1000 → 600; NCR A4 6 Books Duplicate 10,320 (base 400)
const vc2 = seed.products.find((p) => p.id === VC2);
const staff = buildCatalogue([
  { key: 'price_matrix', value: { [VC2]: seed.priceMatrix[VC2].map((c) => (c.optionValueA === '260gsm-art-board-gloss-finish' && c.optionValueB === '1-000-cards' ? { ...c, price: 12500 } : c)) } },
  { key: 'products', value: { removed: [], list: [{ ...vc2, deliveryConfig: { mode: 'exact_qty', flatFee: 0, rangeTiers: [], exactQtyRates: [{ qty: 1000, fee: 600 }] } }] } },
  { key: 'settings', value: { deliveryCombineMode: 'sum' } },
]);
assert.deepEqual(
  priceOrder([line(VC2, '260gsm-art-board-gloss-finish', '1-000-cards'), line(NCR, 'a4-210-297-mm', '6-books-duplicate-2-ply')], 'delivery', staff),
  { subtotal: 22820, deliveryFee: 1000, addonTotal: 0, total: 23820 }
);

// Tampered / invalid lines are refused, never priced at 0
// Size-specific delivery: NCR A4 range 1–10 → 650, A5 → 350; the size comes from the option id, not the label the browser sent
const ncr = seed.products.find((p) => p.id === NCR);
const tiers = (fee) => ({ mode: 'range_tiers', flatFee: 0, exactQtyRates: [], rangeTiers: [{ minQty: 1, maxQty: 10, fee }] });
const sized = buildCatalogue([
  { key: 'products', value: { removed: [], list: [{ ...ncr, deliveryConfig: { ...tiers(400), hasSizeSpecificFees: true, variantDeliveryConfigs: { A4: tiers(650), A5: tiers(350) } } }] } },
]);
assert.equal(priceOrder([line(NCR, 'a4-210-297-mm', '2-books-duplicate-2-ply')], 'delivery', sized).deliveryFee, 650);
assert.equal(priceOrder([line(NCR, 'a5-148-210-mm', '2-books-duplicate-2-ply')], 'delivery', sized).deliveryFee, 350);

assert.throws(() => priceOrder([line('prod-nope', 'x', 'y')], 'delivery', seed), /Unknown product/);
assert.throws(() => priceOrder([line(VC2, '250gsm-ice-gold-board-metallic-finish', '300-cards')], 'delivery', seed), /not priced/); // null cell
assert.throws(() => priceOrder([line('prod-posters', 'a3-85gsm-art-paper-coated', '500-posters')], 'delivery', seed), /no price yet/);
assert.throws(() => priceOrder([line(VC2, '260gsm-art-board-gloss-finish', '100-cards', 'own', 0)], 'delivery', seed), /invalid quantity/);
assert.throws(() => priceOrder([line(VC2, '260gsm-art-board-gloss-finish', '100-cards', 'own', 1.5)], 'delivery', seed), /invalid quantity/);
assert.throws(() => priceOrder([], 'delivery', seed), /no items/);

console.log('All pricing tests passed (5 sample orders + tamper cases).');
