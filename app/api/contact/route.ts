import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { site } from "@/lib/content";
import {
  CONTACT_RATE_LIMIT,
  getClientIp,
  hashClientIp,
  isAllowedContactOrigin,
  verifyTurnstile,
} from "@/lib/contact-security";
import { renderContactEmail } from "@/lib/email/contactTemplate";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";

const MAX_LENGTHS = {
  name: 120,
  company: 160,
  email: 254,
  phone: 40,
  message: 3000
};

type ContactPayload = {
  name?: unknown;
  company?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  privacy?: unknown;
  website?: unknown;
  startedAt?: unknown;
  turnstileToken?: unknown;
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000\r\n]/g, " ").trim().slice(0, maxLength);
}

function cleanMessage(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, MAX_LENGTHS.message);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isPhone(value: string) {
  return !value || /^[+\d\s()./-]{6,40}$/.test(value);
}

function parseRecipients(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  if (!isAllowedContactOrigin(request)) {
    return NextResponse.json({ error: "Origine della richiesta non autorizzata." }, { status: 403 });
  }

  let payload: ContactPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const honeypot = cleanText(payload.website, 120);
  if (honeypot) return NextResponse.json({ ok: true });

  const startedAt = typeof payload.startedAt === "number" ? payload.startedAt : Number(payload.startedAt);
  if (Number.isFinite(startedAt) && Date.now() - startedAt < 2500) {
    return NextResponse.json({ error: "Invio troppo rapido." }, { status: 400 });
  }

  const name = cleanText(payload.name, MAX_LENGTHS.name);
  const company = cleanText(payload.company, MAX_LENGTHS.company);
  const email = cleanText(payload.email, MAX_LENGTHS.email).toLowerCase();
  const phone = cleanText(payload.phone, MAX_LENGTHS.phone);
  const message = cleanMessage(payload.message);
  const privacyAccepted = payload.privacy === true || payload.privacy === "true" || payload.privacy === "Presa visione" || payload.privacy === "Accettata";

  if (!name || !email || !message || !privacyAccepted) {
    return NextResponse.json({ error: "Compila tutti i campi obbligatori." }, { status: 400 });
  }

  if (!isEmail(email)) {
    return NextResponse.json({ error: "Inserisci un indirizzo email valido." }, { status: 400 });
  }

  if (!isPhone(phone)) {
    return NextResponse.json({ error: "Inserisci un numero di telefono valido." }, { status: 400 });
  }

  const ip = getClientIp(request.headers);
  const turnstileEnabled = process.env.TURNSTILE_ENABLED === "true";
  if (turnstileEnabled) {
    const token = cleanText(payload.turnstileToken, 2048);
    const verification = await verifyTurnstile(token, ip);
    if (!verification.configured) {
      console.error("Turnstile is enabled but not configured");
      return NextResponse.json({ error: "Servizio di verifica temporaneamente non disponibile." }, { status: 503 });
    }
    if (!verification.valid) {
      return NextResponse.json({ error: "Verifica anti-spam non valida o scaduta. Riprova." }, { status: 400 });
    }
  }

  const rateLimitSalt = process.env.CONTACT_RATE_LIMIT_SALT;
  if (!supabaseServer || !rateLimitSalt) {
    if (process.env.NODE_ENV === "production") {
      console.error("Contact form rate limit is not configured");
      return NextResponse.json({ error: "Servizio di invio temporaneamente non disponibile." }, { status: 503 });
    }
  } else {
    const { data, error } = await supabaseServer.rpc("consume_contact_form_rate_limit", {
      p_client_hash: hashClientIp(ip, rateLimitSalt),
      p_max_requests: CONTACT_RATE_LIMIT.maxRequests,
      p_window_seconds: CONTACT_RATE_LIMIT.windowSeconds,
    });
    const rateLimit = (data as { allowed: boolean; retry_after_seconds: number }[] | null)?.[0];

    if (error || !rateLimit) {
      console.error("Contact form rate-limit error", error?.message ?? "No result");
      return NextResponse.json({ error: "Servizio di invio temporaneamente non disponibile." }, { status: 503 });
    }
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Hai raggiunto il limite di invii. Riprova piu tardi." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retry_after_seconds) } },
      );
    }
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = parseRecipients(process.env.CONTACT_TO);
  const cc = parseRecipients(process.env.CONTACT_CC);

  if (!host || !user || !pass || to.length === 0) {
    console.error("Contact email is not configured", {
      hasHost: Boolean(host),
      hasUser: Boolean(user),
      hasPass: Boolean(pass),
      hasTo: to.length > 0
    });
    return NextResponse.json({ error: "Servizio email non configurato." }, { status: 503 });
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const from = cleanText(process.env.CONTACT_FROM, 254) || `"${site.name} — Sito" <${user}>`;

  const { subject, html, text } = renderContactEmail(
    {
      nome: name,
      azienda_o_referente: company,
      email,
      telefono: phone,
      messaggio: message,
      privacy: "Presa visione dell'informativa privacy"
    },
    { siteName: site.name, siteUrl: site.url }
  );

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from,
      to,
      cc: cc.length > 0 ? cc : undefined,
      replyTo: `"${name}" <${email}>`,
      subject,
      text,
      html
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact email delivery error", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Invio email non riuscito." }, { status: 502 });
  }
}
