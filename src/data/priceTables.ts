import { OptionGroup, PriceMatrixCell } from '../types';

// Product options and prices imported from the previous aiprinting.lk WooCommerce shop (24 Sep 2026).
// Only visiting cards, carbonized bill books and PVC ID cards had real price lists there — every
// other product showed a single placeholder price, so those tables list the real options without
// prices ("price on request") until staff enter them in Admin → Prices.
export interface PriceTable {
  rowName: string; // first option, e.g. "Paper Stock"
  colName: string; // second option, e.g. "Quantity"
  rows: string[];
  cols: string[];
  /** prices[row][col] in LKR; null = not offered. Omitted = no prices yet (price on request). */
  prices?: (number | null)[][];
}

export const PRICE_TABLES: Record<string, PriceTable> = {
  'prod-vc-double': {
    rowName: 'Paper Stock',
    colName: 'Quantity',
    rows: [
      '260gsm Art Board (Gloss Finish)',
      '300gsm Art Board (Gloss Finish)',
      '280gsm Ivory Board (Matte Finish)',
      '300gsm Ice Blink White (Prestige White)',
      '250gsm Ice Gold Board (Metallic Finish)',
      '300gsm Ice Gold Board (Metallic Finish)',
      '300gsm Ice Silver Board (Metallic Finish)',
      '250gsm Conqueror Brilliant White Laid (Ribbed Texture)',
    ],
    cols: ['100 Cards', '200 Cards', '300 Cards', '400 Cards', '500 Cards', '600 Cards', '700 Cards', '800 Cards', '900 Cards', '1,000 Cards', '2,000 Cards', '3,000 Cards', '4,000 Cards', '5,000 Cards'],
    prices: [
      [1300, 2600, 3600, 4800, 6000, 7200, 8400, 9600, 10800, 12000, 24000, 36000, 48000, 55000],
      [1400, 2800, 3900, 5200, 6500, 7800, 9100, 10400, 11700, 13000, 26000, 39000, 52000, 60000],
      [1500, 3000, 4200, 5600, 7000, 8400, 9800, 11200, 12600, 14000, 28000, 42000, 56000, 65000],
      [1700, 3400, 4800, 6400, 8000, 9600, 11200, 12800, 14400, 16000, 32000, 48000, 64000, 75000],
      [2400, 4800, null, null, null, null, null, null, null, null, null, null, null, null],
      [1900, 3800, 5400, 7200, 9000, 10800, 12600, 14400, 16200, 18000, 36000, 54000, 72000, 85000],
      [2600, 5200, null, null, 6000, null, null, null, null, null, null, null, null, null],
      [2200, 4400, 6600, 8800, 11000, 13200, 15400, 17600, 19800, 22000, 44000, 66000, 88000, 105000],
    ],
  },
  'prod-vc-single': {
    rowName: 'Paper Stock',
    colName: 'Quantity',
    rows: [
      '260gsm Art Board (Gloss Finish)',
      '300gsm Art Board (Gloss Finish)',
      '280gsm Ivory Board (Matte Finish)',
      '300gsm Ice Blink White (Prestige White)',
      '250gsm Ice Gold Board (Metallic Finish)',
      '300gsm Ice Gold Board (Metallic Finish)',
      '300gsm Ice Silver Board (Metallic Finish)',
      '250gsm Conqueror Brilliant White Laid (Ribbed Texture)',
    ],
    cols: ['100 Cards', '200 Cards', '300 Cards', '400 Cards', '500 Cards', '600 Cards', '700 Cards', '800 Cards', '900 Cards', '1,000 Cards', '2,000 Cards', '3,000 Cards', '4,000 Cards', '5,000 Cards'],
    prices: [
      [1000, 2000, 2700, 3600, 4500, 5400, 6300, 7200, 8100, 9000, 18000, 27000, 36000, 40000],
      [1100, 2200, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 20000, 30000, 40000, 45000],
      [1200, 2400, 3300, 4400, 5500, 6600, 7700, 8800, 9900, 11000, 22000, 33000, 44000, 50000],
      [1400, 2800, 3900, 5200, 6500, 7800, 9100, 10400, 11700, 13000, 26000, 39000, 52000, 60000],
      [2100, 4200, 4200, 5600, 6500, 7800, 9100, 10400, 11700, 13000, 26000, 39000, 52000, 65000],
      [1600, 3200, 4500, 6000, 7500, 9000, 10500, 12000, 13500, 15000, 30000, 45000, 60000, 70000],
      [2300, 4600, 5400, 6800, 8000, 9600, 11200, 12800, 14400, 16000, 32000, 45000, 60000, 70000],
      [2000, 4000, 5700, 7600, 9500, 11400, 13300, 15200, 17100, 19000, 38000, 57000, 76000, 90000],
    ],
  },
  'prod-bill-ncr': {
    rowName: 'Size',
    colName: 'Books & Copies',
    rows: [
      'A4 (210 × 297 mm)',
      'A5 (148 × 210 mm)',
    ],
    cols: ['2 Books · Duplicate (2-ply)', '2 Books · Triplicate (3-ply)', '6 Books · Duplicate (2-ply)', '6 Books · Triplicate (3-ply)', '10 Books · Duplicate (2-ply)', '10 Books · Triplicate (3-ply)'],
    prices: [
      [7000, 9000, 10320, 12840, 13600, 18400],
      [3500, 5250, 8700, 10080, 10500, 12600],
    ],
  },
  'prod-bill-non-ncr': {
    rowName: 'Size',
    colName: 'Books & Copies',
    rows: [
      'A4 (210 × 297 mm)',
      'A5 (148 × 210 mm)',
    ],
    cols: ['2 Books · Duplicate (2-ply)', '2 Books · Triplicate (3-ply)', '6 Books · Duplicate (2-ply)', '6 Books · Triplicate (3-ply)', '10 Books · Duplicate (2-ply)', '10 Books · Triplicate (3-ply)'],
  },
  'prod-posters': {
    rowName: 'Size & Paper',
    colName: 'Quantity',
    rows: [
      'A3 · 85gsm Art Paper (Coated)',
      'A3 · 120gsm Art Paper (Coated)',
      '17 × 22 in · 85gsm Art Paper (Coated)',
      '17 × 22 in · 120gsm Art Paper (Coated)',
    ],
    cols: ['500 Posters', '1,000 Posters', '2,000 Posters', '3,000 Posters', '4,000 Posters', '5,000 Posters'],
  },
  'prod-letterheads': {
    rowName: 'Paper',
    colName: 'Quantity',
    rows: [
      '80gsm Bank Paper (Uncoated)',
      '100gsm Bank Paper (Uncoated)',
      '120gsm Bank Paper (Classier)',
      '100gsm Conqueror Brilliant White Laid (Ribbed Texture)',
      '100gsm Conqueror Laid Vellum',
    ],
    cols: ['50 Letterheads', '100 Letterheads', '250 Letterheads', '500 Letterheads', '1,000 Letterheads', '2,000 Letterheads'],
  },
  'prod-leaflets-single': {
    rowName: 'Size & Paper',
    colName: 'Quantity',
    rows: [
      'A5 · 120gsm Art Paper (Coated)',
      'A5 · 150gsm Art Paper (Coated)',
      'A4 · 120gsm Art Paper (Coated)',
      'A4 · 150gsm Art Paper (Coated)',
    ],
    cols: ['50 Leaflets', '100 Leaflets', '200 Leaflets', '250 Leaflets', '500 Leaflets', '1,000 Leaflets', '2,000 Leaflets', '3,000 Leaflets', '4,000 Leaflets', '5,000 Leaflets', '6,000 Leaflets', '7,000 Leaflets', '8,000 Leaflets', '9,000 Leaflets', '10,000 Leaflets', '20,000 Leaflets'],
  },
  'prod-leaflets-double': {
    rowName: 'Size & Paper',
    colName: 'Quantity',
    rows: [
      'A5 · 120gsm Art Paper (Coated)',
      'A5 · 150gsm Art Paper (Coated)',
      'A4 · 120gsm Art Paper (Coated)',
      'A4 · 150gsm Art Paper (Coated)',
    ],
    cols: ['50 Leaflets', '100 Leaflets', '200 Leaflets', '250 Leaflets', '500 Leaflets', '1,000 Leaflets', '2,000 Leaflets', '3,000 Leaflets', '4,000 Leaflets', '5,000 Leaflets', '6,000 Leaflets', '7,000 Leaflets', '8,000 Leaflets', '9,000 Leaflets', '10,000 Leaflets', '20,000 Leaflets'],
  },
  'prod-invitations-single': {
    rowName: 'Paper',
    colName: 'Quantity',
    rows: [
      '260gsm Art Board (Gloss Finish)',
      '280gsm Ivory Board (Matte Finish)',
      '300gsm Ice Blink White (Prestige White)',
      '250gsm Ice Gold Board (Metallic Finish)',
      '300gsm Ice Gold Board (Metallic Finish)',
      '300gsm Ice Silver Board (Metallic Finish)',
      '300gsm White Gold Board (Metallic Finish)',
    ],
    cols: ['50 Cards', '50 Cards + Envelopes', '100 Cards', '100 Cards + Envelopes', '200 Cards', '200 Cards + Envelopes'],
  },
  'prod-invitations-folded': {
    rowName: 'Paper',
    colName: 'Quantity',
    rows: [
      '260gsm Art Board (Gloss Finish)',
      '280gsm Ivory Board (Matte Finish)',
      '300gsm Ice Blink White (Prestige White)',
      '250gsm Ice Gold Board (Metallic Finish)',
      '300gsm Ice Gold Board (Metallic Finish)',
      '300gsm Ice Silver Board (Metallic Finish)',
      '300gsm White Gold Board (Metallic Finish)',
    ],
    cols: ['50 Cards (folded)', '50 Cards (folded) + Envelopes', '100 Cards (folded)', '100 Cards (folded) + Envelopes', '200 Cards (folded)', '200 Cards (folded) + Envelopes'],
  },
  'prod-certificates': {
    rowName: 'Paper',
    colName: 'Quantity',
    rows: [
      '260gsm Art Board (Gloss Finish)',
      '300gsm Art Board (Gloss Finish)',
      '280gsm Ivory Board (Matte Finish)',
      '300gsm Ice Blink White (Prestige White)',
      '250gsm Ice Gold Board (Metallic Finish)',
      '300gsm Ice Gold Board (Metallic Finish)',
      '300gsm Ice Silver Board (Metallic Finish)',
      '300gsm White Gold Board (Metallic Finish)',
      '250gsm Conqueror Brilliant White Laid (Ribbed Texture)',
    ],
    cols: ['25 Certificates', '50 Certificates', '75 Certificates', '100 Certificates', '250 Certificates', '500 Certificates', '750 Certificates', '1,000 Certificates'],
  },
  'prod-colour-print': {
    rowName: 'Paper',
    colName: 'Quantity',
    rows: [
      '120gsm Matt Art Paper',
      '150gsm Matt Art Paper',
      '260gsm Art Board (Gloss Finish)',
      '300gsm Art Board (Gloss Finish)',
      '280gsm Ivory Board (Matte Finish)',
      '300gsm Ice Blink White (Prestige White)',
      '250gsm Ice Gold Board (Metallic Finish)',
      '300gsm Ice Gold Board (Metallic Finish)',
      '300gsm Ice Silver Board (Metallic Finish)',
      '300gsm White Gold Board (Metallic Finish)',
      '250gsm Conqueror Brilliant White Laid (Ribbed Texture)',
    ],
    cols: ['10 Prints', '25 Prints', '50 Prints', '75 Prints', '100 Prints', '150 Prints', '200 Prints'],
  },
  'prod-laser-single': {
    rowName: 'Size & Paper',
    colName: 'Quantity',
    rows: [
      'A4 · 70gsm Bank Paper',
      'A3 · 70gsm Bank Paper',
    ],
    cols: ['50 Pages', '75 Pages', '100 Pages', '250 Pages', '500 Pages', '750 Pages', '1,000 Pages', '2,000 Pages', '5,000 Pages'],
  },
  'prod-laser-double': {
    rowName: 'Size & Paper',
    colName: 'Quantity',
    rows: [
      'A4 · 70gsm Bank Paper',
      'A3 · 70gsm Bank Paper',
    ],
    cols: ['50 Pages', '75 Pages', '100 Pages', '250 Pages', '500 Pages', '750 Pages', '1,000 Pages', '2,000 Pages', '5,000 Pages'],
  },
  'prod-stickers-colour': {
    rowName: 'Sticker Paper',
    colName: 'Quantity',
    rows: [
      '10 × 15 in Gloss Sticker Sheet',
      '10 × 15 in Matt Sticker Sheet',
    ],
    cols: ['10 Sheets', '25 Sheets', '50 Sheets', '75 Sheets', '100 Sheets', '500 Sheets', '1,000 Sheets'],
  },
  'prod-stickers-bw': {
    rowName: 'Sticker Paper',
    colName: 'Quantity',
    rows: [
      '10 × 15 in Gloss Sticker Sheet',
      '10 × 15 in Matt Sticker Sheet',
    ],
    cols: ['10 Sheets', '25 Sheets', '50 Sheets', '75 Sheets', '100 Sheets', '200 Sheets', '500 Sheets', '1,000 Sheets'],
  },
  'prod-pvc-id': {
    rowName: 'Card',
    colName: 'Quantity',
    rows: [
      'PVC Card (86 × 54 mm)',
    ],
    cols: ['1 Card', '5 Cards', '10 Cards', '25 Cards', '50 Cards', '100 Cards'],
    prices: [
      [1000, 5000, 10000, 25000, 50000, 100000],
    ],
  },
};

// Stable option ids from labels, e.g. "260gsm Art Board (Gloss Finish)" -> "260gsm-art-board-gloss-finish"
export const optionId = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const finishOf = (label: string) =>
  /metallic/i.test(label) ? 'metallic' : /matt/i.test(label) ? 'matte' : /gloss/i.test(label) ? 'gloss' : /laid|ribbed|vellum/i.test(label) ? 'ribbed' : undefined;

export function tableOptionGroups(productId: string, t: PriceTable): OptionGroup[] {
  const group = (key: 'a' | 'b', name: string, labels: string[], order: number): OptionGroup => ({
    id: `grp-${productId}-${key}`,
    productId,
    name,
    inputType: 'select',
    isRequired: true,
    sortOrder: order,
    values: labels.map((label, idx) => ({
      id: optionId(label),
      groupId: `grp-${productId}-${key}`,
      label,
      sortOrder: idx + 1,
      isActive: true,
      finishType: key === 'a' ? finishOf(label) : undefined,
    })),
  });
  return [group('a', t.rowName, t.rows, 1), group('b', t.colName, t.cols, 2)];
}

export function tablePriceCells(productId: string, t: PriceTable): PriceMatrixCell[] {
  const cells: PriceMatrixCell[] = [];
  t.prices?.forEach((row, r) =>
    row.forEach((price, c) => {
      if (price == null) return;
      const a = optionId(t.rows[r]);
      const b = optionId(t.cols[c]);
      cells.push({ id: `pm-${productId}-${a}-${b}`, productId, optionValueA: a, optionValueB: b, price, isActive: true });
    })
  );
  return cells;
}
