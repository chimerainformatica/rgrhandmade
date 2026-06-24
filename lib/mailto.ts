export function openEmailDraft(
  recipient: string,
  fields: FormData,
  subject?: string,
) {
  const body = Array.from(fields.entries())
    .filter(([, value]) => typeof value === "string" && value.trim())
    .map(([name, value]) => `${name}: ${String(value).trim()}`)
    .join("\n\n");

  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);

  const query = params.toString();
  window.location.href = `mailto:${recipient}${query ? `?${query}` : ""}`;
}
