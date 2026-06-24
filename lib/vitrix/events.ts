import type { VitrixPressType } from "@/lib/vitrix/types";

export const EVENT_TYPES: VitrixPressType[] = ["event", "fiera", "press"];
export const EVENT_STATUSES = ["draft", "published"] as const;

type EventStatus = (typeof EVENT_STATUSES)[number];

export type EventInput = Record<string, unknown>;

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function trimString(value: unknown): string | null {
  if (typeof value !== "string") return value == null ? null : String(value);
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function boolValue(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") return ["1", "true", "on", "yes"].includes(value.toLowerCase());
  return fallback;
}

function intValue(value: unknown, fallback = 0): number {
  if (value === "" || value == null) return fallback;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function tagsValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  if (typeof value !== "string") return [];
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function excerptFrom(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}

export function inputFromFormData(formData: FormData): EventInput {
  const input: EventInput = {};
  formData.forEach((value, key) => {
    if (value instanceof File) return;
    input[key] = value;
  });
  return input;
}

export function normalizeEventPayload(input: EventInput, existingSlug?: string | null) {
  const title = trimString(input.title);
  const type = EVENT_TYPES.includes(input.type as VitrixPressType) ? input.type as VitrixPressType : "event";
  const status = EVENT_STATUSES.includes(input.status as EventStatus) ? input.status as EventStatus : "draft";
  const description = trimString(input.description);
  const content = trimString(input.content) ?? trimString(input.body);
  const excerpt = trimString(input.excerpt) ?? excerptFrom(description) ?? excerptFrom(content);
  const slug = trimString(input.slug) ?? existingSlug ?? (title ? slugify(title) : null);
  const eventDateLabel = trimString(input.event_date_label) ?? trimString(input.event_date);
  const mainImageUrl = trimString(input.main_image_url) ?? trimString(input.cover_image);

  return {
    title,
    slug,
    type,
    category: trimString(input.category) ?? type,
    venue: trimString(input.venue),
    event_date: trimString(input.event_date),
    lang: trimString(input.lang) ?? "it",
    status,
    description,
    excerpt,
    content,
    body: content,
    tags: tagsValue(input.tags),
    event_start_at: trimString(input.event_start_at),
    event_end_at: trimString(input.event_end_at),
    event_date_label: eventDateLabel,
    main_image_path: trimString(input.main_image_path),
    main_image_url: mainImageUrl,
    cover_image: mainImageUrl,
    og_image_path: trimString(input.og_image_path),
    og_image_url: trimString(input.og_image_url),
    image_alt: trimString(input.image_alt) ?? title,
    image_position: trimString(input.image_position) ?? "50% 50%",
    cta_label: trimString(input.cta_label),
    cta_url: trimString(input.cta_url),
    cta_target: trimString(input.cta_target) === "_blank" ? "_blank" : "_self",
    is_featured: boolValue(input.is_featured, false),
    sort_order: intValue(input.sort_order, 0),
    widget_id: trimString(input.widget_id) ?? "vtx_events",
    seo_title: trimString(input.seo_title) ?? title,
    seo_description: trimString(input.seo_description) ?? excerpt,
    canonical_url: trimString(input.canonical_url),
    robots_index: boolValue(input.robots_index, true),
    robots_follow: boolValue(input.robots_follow, true),
    published_at: status === "published" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
}

export function validateEventPayload(payload: ReturnType<typeof normalizeEventPayload>) {
  if (!payload.title || payload.title.length < 3) return "Il titolo e obbligatorio e deve avere almeno 3 caratteri.";
  if (!payload.slug) return "Lo slug e obbligatorio.";
  if (!payload.type) return "Il tipo evento e obbligatorio.";
  if (payload.status === "published") {
    if (!payload.category) return "La categoria e obbligatoria per pubblicare.";
    if (!payload.excerpt) return "La descrizione breve e obbligatoria per pubblicare.";
  }
  if (payload.event_start_at && payload.event_end_at) {
    const start = Date.parse(payload.event_start_at);
    const end = Date.parse(payload.event_end_at);
    if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
      return "La data fine evento non puo precedere la data inizio.";
    }
  }
  return null;
}
