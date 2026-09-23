import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

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

// Postgres columns are snake_case, app types are camelCase (top-level keys only; jsonb stays as-is).
export const toRow = (obj: object) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase()), v === '' ? null : v])
  );

export const fromRow = <T,>(row: Record<string, unknown>): T =>
  Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v ?? undefined])
  ) as T;
