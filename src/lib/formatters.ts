/**
 * Format currency strictly as LKR: "Rs. 1,300.00"
 * (Never use the රු glyph as per design specifications)
 */
export function formatLKR(amount: number): string {
  const formatted = new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Rs. ${formatted}`;
}

/**
 * Format compact LKR without cents if exact: "Rs. 1,300"
 */
export function formatLKRCompact(amount: number): string {
  const formatted = new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `Rs. ${formatted}`;
}

/**
 * Generates human readable order number e.g. AIP-2026-014218
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `AIP-${year}-${randomNum}`;
}

/**
 * Generates human readable quote number e.g. QT-2026-008921
 */
export function generateQuoteNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `QT-${year}-${randomNum}`;
}

/**
 * Validate Sri Lankan telephone number:
 * Matches formats like: 0773233533, 077 323 3533, +94773233533, 0112150859
 */
export function isValidSriLankanPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const slRegex = /^(?:0|94|\+94)?(?:7[0-9]|11|21|23|24|25|26|27|31|32|33|34|35|36|37|38|41|45|47|51|52|54|55|57|63|65|66|67|81)[0-9]{7}$/;
  return slRegex.test(cleaned);
}

/**
 * Generates direct WhatsApp chat URL with pre-filled message
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '').replace(/^0/, '94'); // 0771234567 -> 94771234567
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Format bytes to readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/** Line price for cart/order items; items without a price show "Price to be confirmed". */
export function formatItemPrice(item: { lineTotal: number; priceToConfirm?: boolean }): string {
  return item.priceToConfirm ? 'Price to be confirmed' : formatLKR(item.lineTotal);
}
