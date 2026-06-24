/**
 * Genera uno slug URL-safe da una stringa (titolo).
 * Rimuove accenti, abbassa il case, sostituisce i non-alfanumerici con trattini.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // rimuove i segni diacritici
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
