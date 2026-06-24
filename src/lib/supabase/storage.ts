import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { SupportedMediaType } from "@/lib/claude/parser";

export const DOCUMENTS_BUCKET = "documents";

const EXT: Record<SupportedMediaType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

type Client = SupabaseClient<Database>;

/** Uploads an original document to `documents/{userId}/{uuid}.{ext}`. */
export async function uploadDocument(
  supabase: Client,
  userId: string,
  file: { bytes: ArrayBuffer; mediaType: SupportedMediaType },
): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.${EXT[file.mediaType]}`;
  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file.bytes, { contentType: file.mediaType, upsert: false });
  if (error) throw new Error(`Upload non riuscito: ${error.message}`);
  return path;
}

/** Short-lived signed URL for a private document (bucket is not public). */
export async function getSignedUrl(
  supabase: Client,
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const { data } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  return data?.signedUrl ?? null;
}

/** Removes every document stored under a user's folder (GDPR deletion). */
export async function deleteAllUserDocuments(
  supabase: Client,
  userId: string,
): Promise<void> {
  const { data: list } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .list(userId, { limit: 1000 });
  if (!list?.length) return;
  const paths = list.map((f) => `${userId}/${f.name}`);
  await supabase.storage.from(DOCUMENTS_BUCKET).remove(paths);
}
