/**
 * Helper immagini condivisi per i widget frontend (catalogue, events…).
 * Costruisce URL ottimizzati via Supabase Image Transformation
 * (`/storage/v1/render/image/...`) per un caricamento rapido, con fallback
 * agli URL pubblici / asset locali.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
export const IMAGE_BUCKET = "vitrix-media";

export type ImageSize = { width: number; height: number; quality: number };

/** Misure standard riusate dai widget. */
export const THUMBNAIL_SIZE: ImageSize = { width: 720, height: 960, quality: 68 };
/** Copertine pubblicazioni in griglia: leggibili anche su display 2x. */
export const PUBLICATION_CARD_SIZE: ImageSize = { width: 1080, height: 1440, quality: 88 };
export const PREVIEW_SIZE: ImageSize = { width: 1600, height: 2133, quality: 88 };
/** Misura "wide" per cover editoriali (16:9). */
export const COVER_SIZE: ImageSize = { width: 1280, height: 720, quality: 78 };
/** Risoluzione full per l'immagine zoom dell'anteprima */
export const ZOOM_SIZE: ImageSize = { width: 2400, height: 3200, quality: 95 };

export function buildSupabaseRenderUrl(storagePath: string, size: ImageSize, resize: "cover" | "contain" = "cover"): string | null {
  if (!SUPABASE_URL) return null;
  const normalizedPath = storagePath.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  return `${SUPABASE_URL}/storage/v1/render/image/public/${IMAGE_BUCKET}/${normalizedPath}?width=${size.width}&height=${size.height}&quality=${size.quality}&resize=${resize}`;
}

export function buildSupabasePublicUrl(storagePath: string): string | null {
  if (!SUPABASE_URL) return null;
  const normalizedPath = storagePath.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${normalizedPath}`;
}

export function extractStoragePath(value: string): string | null {
  const publicMarker = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
  const renderMarker = `/storage/v1/render/image/public/${IMAGE_BUCKET}/`;
  const publicIndex = value.indexOf(publicMarker);
  if (publicIndex >= 0) return value.slice(publicIndex + publicMarker.length).split("?")[0];
  const renderIndex = value.indexOf(renderMarker);
  if (renderIndex >= 0) return value.slice(renderIndex + renderMarker.length).split("?")[0];
  if (value.startsWith(`${IMAGE_BUCKET}/`)) return value.slice(IMAGE_BUCKET.length + 1);
  const legacyIndex = value.indexOf("collections/");
  if (legacyIndex >= 0) return value.slice(legacyIndex);
  return null;
}

export function getImageSrc(path: string | null, size: ImageSize): string | null {
  const value = path?.trim();
  if (!value) return null;
  if (value.startsWith("http")) {
    const storagePath = extractStoragePath(value);
    return storagePath ? buildSupabaseRenderUrl(storagePath, size) ?? value : value;
  }
  if (value.startsWith("/")) return value;

  const storagePath = extractStoragePath(value);
  if (storagePath) return buildSupabaseRenderUrl(storagePath, size) ?? value;

  return `/assets/rgr/${value}`;
}

export function getThumbnailImageUrl(path: string | null): string | null {
  return getImageSrc(path, THUMBNAIL_SIZE);
}

export function getPublicationCardImageUrl(path: string | null): string | null {
  return getImageSrc(path, PUBLICATION_CARD_SIZE);
}

export function getPreviewImageUrl(path: string | null): string | null {
  return getImageSrc(path, PREVIEW_SIZE);
}

export function getZoomImageUrl(path: string | null): string | null {
  const value = path?.trim();
  if (!value) return null;
  if (value.startsWith("http")) {
    const storagePath = extractStoragePath(value);
    return storagePath ? buildSupabasePublicUrl(storagePath) ?? value.split("?")[0] : value;
  }
  if (value.startsWith("/")) return value;
  const storagePath = extractStoragePath(value);
  if (storagePath) return buildSupabasePublicUrl(storagePath) ?? value;
  return `/assets/rgr/${value}`;
}

export function getCoverImageUrl(path: string | null): string | null {
  return getImageSrc(path, COVER_SIZE);
}

/** Precarica un'immagine (per evitare flash durante i reveal). Risolve sempre. */
export function preloadImage(src: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}
