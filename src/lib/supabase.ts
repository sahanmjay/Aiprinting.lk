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

// Postgres columns are snake_case, app types are camelCase (top-level keys only; jsonb stays as-is).
export const toRow = (obj: object) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase()), v === '' ? null : v])
  );

export const fromRow = <T,>(row: Record<string, unknown>): T =>
  Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v ?? undefined])
  ) as T;
