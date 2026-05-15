import { createClient } from "@/lib/supabase/client";

const BUCKET = "book-assets";

// Signed URLs last ~10 years. Illustrations are not private data — if we ever
// switch the bucket to public, swap createSignedUrl for getPublicUrl here.
const SIGNED_URL_EXPIRY = 315_360_000;

async function signedUrl(path: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadIllustration(
  userId: string,
  bookId: string,
  pageId: string,
  file: File,
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${userId}/${bookId}/pages/${pageId}/outline.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;

  return signedUrl(path);
}

export async function uploadCover(
  userId: string,
  bookId: string,
  file: File,
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${bookId}/cover.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;

  return signedUrl(path);
}

export async function uploadElementsJson(
  userId: string,
  bookId: string,
  pageId: string,
  data: object,
): Promise<string> {
  const supabase = createClient();
  const path = `${userId}/${bookId}/pages/${pageId}/elements.json`;
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: "application/json" });
  if (error) throw error;

  return signedUrl(path);
}
