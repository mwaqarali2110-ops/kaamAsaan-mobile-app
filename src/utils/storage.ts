import { supabase } from '@/lib/supabase';

export const normalizePublicStorageUrl = (bucket: string, value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  let path = trimmed.replace(/^\/+/, '');
  path = path.replace(/^storage\/v1\/object\/public\//, '');
  if (path.startsWith(`${bucket}/`)) path = path.slice(bucket.length + 1);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};
