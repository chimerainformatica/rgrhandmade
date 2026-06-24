import { createAdminClient } from "@/lib/supabase/admin";
import type { VitrixMediaFile } from "@/lib/vitrix/types";

const BUCKET = "vitrix-media";

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "video/mp4", "video/webm",
  "audio/mpeg", "audio/ogg",
  "application/zip",
  "text/plain", "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
}

function uniqueName(original: string): string {
  const ext = original.includes(".") ? original.slice(original.lastIndexOf(".")) : "";
  const base = original.includes(".") ? original.slice(0, original.lastIndexOf(".")) : original;
  return `${sanitizeFilename(base)}_${Date.now()}${ext}`;
}

export async function listMediaFiles(): Promise<VitrixMediaFile[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).list("", { limit: 500, sortBy: { column: "created_at", order: "desc" } });

  if (error || !data) return [];

  const publicUrl = (name: string) =>
    supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;

  return data
    .filter((f) => f.name && !f.name.endsWith("/"))
    .map((f) => {
      const ext = f.name.includes(".") ? f.name.slice(f.name.lastIndexOf(".") + 1).toLowerCase() : "";
      return {
        name: f.name,
        url: publicUrl(f.name),
        size: f.metadata?.size ?? 0,
        type: ext,
        created_at: f.created_at ?? new Date().toISOString()
      };
    });
}

export async function saveMediaFile(file: Blob, originalName: string): Promise<VitrixMediaFile> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(`Tipo file non supportato: ${file.type}`);
  }
  if (file.size > MAX_SIZE) {
    throw new Error("File troppo grande. Massimo 50 MB.");
  }

  const supabase = createAdminClient();
  const filename = uniqueName(originalName);
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
    contentType: file.type,
    upsert: false
  });

  if (error) throw new Error(`Upload fallito: ${error.message}`);

  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".") + 1).toLowerCase() : "";
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);

  return {
    name: filename,
    url: urlData.publicUrl,
    size: file.size,
    type: ext,
    created_at: new Date().toISOString()
  };
}

export async function deleteMediaFile(filename: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(BUCKET).remove([filename]);
  return !error;
}
