import { createClient } from '@supabase/supabase-js';

// The anon key is public by design (it ships in the browser bundle); Row Level Security in
// supabase/schema.sql is what protects the data. Env vars override these defaults.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://enrdcnhpvpcoiipkfaad.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucmRjbmhwdnBjb2lpcGtmYWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjgwODUsImV4cCI6MjEwNTc0NDA4NX0.wJxXwCPSLC2B5V6pe-jEKVK-7LNotFC1mOv0OV26wpY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type FileBucket = 'artwork-uploads' | 'quote-attachments';

// Customer uploads go to private buckets; returns the storage path to save on the order/quote.
export async function uploadFile(bucket: FileBucket, file: File): Promise<string> {
  const path = `${crypto.randomUUID()}/${file.name.replace(/[^\w.-]+/g, '_')}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  return path;
}

// Admin only: private files are opened through a short-lived signed URL.
export async function openStoredFile(bucket: FileBucket, path: string) {
  const win = window.open('', '_blank'); // open before the await so popup blockers allow it
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 600);
  if (error || !data) {
    win?.close();
    alert(`Could not open file: ${error?.message ?? 'unknown error'}`);
    return;
  }
  if (win) win.location.href = data.signedUrl;
}

export type ImageBucket = 'product-images' | 'site-assets';
const PUBLIC_URL = /\/storage\/v1\/object\/public\/(product-images|site-assets)\/(.+)$/;

// Recommended upload sizes, shown next to each admin upload box (the browser shrinks anything bigger).
export const IMAGE_GUIDE = {
  product: { maxSize: 1200, hint: 'Best: 1200 × 900 px (4:3 landscape), JPG or PNG. Larger photos are shrunk automatically.' },
  banner: { maxSize: 1920, hint: 'Best: 1920 × 1080 px (16:9). Keep the subject on the right half; the headline covers the left.' },
  logo: { maxSize: 600, hint: 'Best: 400 × 200 px PNG or SVG with a transparent background.' },
} as const;

// Admin only: shrinks the image in the browser (WebP ~80%) so Storage holds a small copy instead of a
// multi-MB camera file, then returns its public URL. Logos keep their transparent background.
export async function uploadImage(
  file: File,
  { bucket = 'product-images', maxSize = 1200 }: { bucket?: ImageBucket; maxSize?: number } = {}
): Promise<string> {
  const img = new Image();
  img.src = URL.createObjectURL(file); // <img> also decodes SVG logos, unlike createImageBitmap
  try {
    await img.decode();
  } finally {
    URL.revokeObjectURL(img.src);
  }
  const w = img.naturalWidth || maxSize;
  const h = img.naturalHeight || Math.round(maxSize / 2);
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const toBlob = (type: string) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, type, 0.8));
  let blob = await toBlob('image/webp');
  // Browsers without WebP encoding: PNG keeps logo transparency, JPEG keeps photos small
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(bucket === 'site-assets' ? 'image/png' : 'image/jpeg');
  if (!blob) throw new Error('Could not read this image');
  const ext = blob.type.split('/')[1].replace('jpeg', 'jpg');
  const path = `${bucket === 'product-images' ? 'products' : 'site'}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: blob.type, cacheControl: '31536000' });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

// Frees the Storage space of an image we uploaded; ignores built-in /images/... files and outside links.
export async function deleteUploadedImage(url: string | undefined) {
  const m = url?.match(PUBLIC_URL);
  if (!m) return;
  const { error } = await supabase.storage.from(m[1]).remove([decodeURIComponent(m[2])]);
  if (error) console.warn('Could not delete old image', error);
}

// Admin only: saves a private file under its original name (signed URL sent as an attachment).
export async function downloadStoredFile(bucket: FileBucket, path: string, fileName: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 600, { download: fileName });
  if (error || !data) {
    alert(`Could not download file: ${error?.message ?? 'unknown error'}`);
    return;
  }
  window.location.href = data.signedUrl;
}

// Postgres columns are snake_case, app types are camelCase (top-level keys only; jsonb stays as-is).
export const toRow = (obj: object) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase()), v === '' ? null : v])
  );

export const fromRow = <T,>(row: Record<string, unknown>): T =>
  Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v ?? undefined])
  ) as T;
