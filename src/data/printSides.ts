export type Sides = 'single' | 'double';

// Products sold as one listing with a single / double side choice. Each side keeps its own product and
// price table; only `listed` shows in the shop, the other side is hidden (isActive: false) and reached
// through the switch on the product page.
export interface SidePair {
  single: string;
  double: string;
  listed: Sides;
  labels?: Partial<Record<Sides, string>>; // short hint under each choice
}

export const SIDE_PAIRS: SidePair[] = [
  { single: 'prod-vc-single', double: 'prod-vc-double', listed: 'double' },
  { single: 'prod-leaflets-single', double: 'prod-leaflets-double', listed: 'single' },
  {
    single: 'prod-invitations-single',
    double: 'prod-invitations-folded',
    listed: 'single',
    labels: { single: 'Flat card, printed on the front', double: 'Folded card, printed both sides' },
  },
  { single: 'prod-laser-single', double: 'prod-laser-double', listed: 'single' },
  { single: 'prod-colour-print', double: 'prod-colour-print-double', listed: 'single' },
  { single: 'prod-pvc-id', double: 'prod-pvc-id-double', listed: 'single' },
];

// Printed on one side only: customers upload a front artwork file only.
export const SINGLE_SIDE_ONLY = new Set([
  'prod-bill-ncr',
  'prod-bill-non-ncr',
  'prod-letterheads',
  'prod-posters',
  'prod-stickers-colour',
  'prod-stickers-bw',
  'prod-certificates',
  'prod-envelopes',
]);

export const SIDES_LABEL: Record<Sides, string> = {
  single: 'Single side (front only)',
  double: 'Double side (front & back)',
};

// Which side a product prints, and its pair if the customer can switch. Unknown products (added in the
// admin panel) return side null and keep both upload slots.
export function sidesOf(productId: string): { side: Sides | null; pair?: SidePair } {
  const pair = SIDE_PAIRS.find((p) => p.single === productId || p.double === productId);
  if (pair) return { side: pair.single === productId ? 'single' : 'double', pair };
  return { side: SINGLE_SIDE_ONLY.has(productId) ? 'single' : null };
}
