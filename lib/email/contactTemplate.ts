/**
 * Template email per il form contatti del sito pubblico RGR Handmade.
 * Restituisce subject + corpo HTML (table-based, compatibile Gmail/Outlook)
 * e una versione testuale di fallback.
 */

export type ContactPayload = {
  nome: string;
  azienda_o_referente?: string;
  email: string;
  telefono?: string;
  messaggio: string;
  privacy?: string;
};

// Palette RGR
const COLORS = {
  warmBlack: "#171411",
  panel: "#1f1a16",
  gold: "#b89254",
  goldLight: "#d8be82",
  ivory: "#f7f2ea",
  ivoryMuted: "rgba(247,242,234,0.62)",
  line: "rgba(247,242,234,0.12)",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  }).format(date);
}

type Row = { label: string; value: string; isMessage?: boolean };

function buildRows(data: ContactPayload): Row[] {
  const rows: Row[] = [
    { label: "Nome", value: data.nome },
    { label: "Email", value: data.email },
  ];
  if (data.azienda_o_referente?.trim()) {
    rows.push({ label: "Azienda / referente", value: data.azienda_o_referente.trim() });
  }
  if (data.telefono?.trim()) {
    rows.push({ label: "Telefono", value: data.telefono.trim() });
  }
  rows.push({ label: "Messaggio", value: data.messaggio, isMessage: true });
  return rows;
}

export function renderContactEmail(data: ContactPayload, opts?: { siteName?: string; siteUrl?: string }) {
  const siteName = opts?.siteName || "RGR Handmade";
  const siteUrl = opts?.siteUrl || "https://www.rgrhandmade.it";
  const sentAt = formatDate(new Date());
  const rows = buildRows(data);

  const subject = `Nuova richiesta dal sito — ${data.nome}`;

  // ── Versione testuale (fallback) ────────────────────────────
  const text = [
    `Nuova richiesta dal form contatti di ${siteName}`,
    "",
    ...rows.map((r) => `${r.label}: ${r.value}`),
    "",
    data.privacy ? `Consenso privacy: ${data.privacy}` : "Consenso privacy: —",
    `Ricevuto il: ${sentAt}`,
    "",
    `— Inviato automaticamente da ${siteUrl}`,
  ].join("\n");

  // ── Versione HTML (table-based) ─────────────────────────────
  const rowsHtml = rows
    .map((r) => {
      const safeValue = escapeHtml(r.value).replace(/\r?\n/g, "<br />");
      const valueCell = r.isMessage
        ? `<div style="white-space:pre-wrap;line-height:1.6;color:${COLORS.ivory};font-size:15px;">${safeValue}</div>`
        : `<span style="color:${COLORS.ivory};font-size:15px;">${safeValue}</span>`;
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid ${COLORS.line};vertical-align:top;width:170px;">
            <span style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:${COLORS.goldLight};font-weight:bold;">${escapeHtml(
              r.label,
            )}</span>
          </td>
          <td style="padding:14px 0;border-bottom:1px solid ${COLORS.line};vertical-align:top;font-family:Arial,Helvetica,sans-serif;">
            ${valueCell}
          </td>
        </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0d0b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0d0b;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:${COLORS.warmBlack};border:1px solid ${COLORS.line};">
          <!-- Header -->
          <tr>
            <td style="padding:30px 36px 22px;border-bottom:1px solid ${COLORS.line};">
              <div style="height:2px;width:46px;background-color:${COLORS.gold};margin-bottom:18px;"></div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;color:${COLORS.ivory};letter-spacing:0.5px;">${escapeHtml(
                siteName,
              )}</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:${COLORS.goldLight};margin-top:6px;">Nuova richiesta dal sito</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:14px 36px 26px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${rowsHtml}
              </table>
            </td>
          </tr>
          <!-- Meta -->
          <tr>
            <td style="padding:0 36px 28px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:${COLORS.ivoryMuted};">
                Consenso privacy: ${data.privacy ? escapeHtml(data.privacy) : "—"}<br />
                Ricevuto il: ${escapeHtml(sentAt)}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:18px 36px 24px;border-top:1px solid ${COLORS.line};background-color:${COLORS.panel};">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${COLORS.ivoryMuted};">
                Email generata automaticamente dal form contatti di
                <a href="${escapeHtml(siteUrl)}" style="color:${COLORS.goldLight};text-decoration:none;">${escapeHtml(
                  siteUrl.replace(/^https?:\/\//, ""),
                )}</a>. Rispondi a questa email per ricontattare direttamente il mittente.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
