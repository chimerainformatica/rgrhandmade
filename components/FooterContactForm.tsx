"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Arrow } from "@/components/Brand";
import { GoldLine } from "@/components/ui/GoldLine";
import { SuccessDialog } from "@/components/SuccessDialog";
import { site } from "@/lib/content";
import { openEmailDraft } from "@/lib/mailto";

type FooterContactCopy = {
  eyebrow: string;
  title: string;
  lede: string;
  contactTitle: string;
  formTitle: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
  messagePlaceholder: string;
  privacyBefore: string;
  privacyLink: string;
  privacyAfter: string;
  privacyHref: string;
  submit: string;
  sending: string;
  success: string;
  error: string;
  note: string;
};

type FooterContactFormProps = {
  copy: FooterContactCopy;
  imageSrc: string;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    theme: "dark";
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const fieldClass =
  "min-h-12 w-full border border-white/12 bg-[#201b17] px-4 font-sans text-[14px] text-ivory outline-none transition-colors duration-200 placeholder:text-ivory/30 focus:border-gold/80 focus:bg-[#262018]";
const labelClass = "grid gap-2";
const labelTextClass =
  "font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-light";
export function FooterContactForm({ copy, imageSrc }: FooterContactFormProps) {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const startedAt = useRef(Date.now());
  const turnstileContainer = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [lastDraft, setLastDraft] = useState<FormData | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    if (!turnstileSiteKey || !turnstileReady || !turnstileContainer.current || !window.turnstile) return;

    const widgetId = window.turnstile.render(turnstileContainer.current, {
      sitekey: turnstileSiteKey,
      theme: "dark",
      callback: setTurnstileToken,
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
    turnstileWidgetId.current = widgetId;

    return () => {
      window.turnstile?.remove(widgetId);
      turnstileWidgetId.current = null;
    };
  }, [turnstileReady, turnstileSiteKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if (turnstileSiteKey && !turnstileToken) {
      setStatus("error");
      setError("Completa la verifica anti-spam prima di inviare il messaggio.");
      return;
    }

    setStatus("sending");
    setError("");
    setLastDraft(data);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("nome"),
          company: data.get("azienda_o_referente"),
          email: data.get("email"),
          phone: data.get("telefono"),
          message: data.get("messaggio"),
          privacy: data.get("privacy"),
          website: data.get("website"),
          startedAt: Number(data.get("startedAt")),
          turnstileToken,
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Invio email non riuscito.");
      }

      form.reset();
      startedAt.current = Date.now();
      setLastDraft(null);
      setTurnstileToken("");
      if (turnstileWidgetId.current) window.turnstile?.reset(turnstileWidgetId.current);
      setStatus("sent");
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : "Invio email non riuscito.");
    }
  }

  function handleMailtoFallback() {
    if (lastDraft) openEmailDraft(site.email, lastDraft, "RGR Handmade - Richiesta dal sito");
  }

  return (
    <>
      <SuccessDialog
        isOpen={status === "sent"}
        title={copy.success.split(".")[0] || "Email inviata!"}
        message={copy.success || "Il tuo messaggio è stato inviato con successo. Ti contatteremo presto."}
        onClose={() => setStatus("idle")}
      />
      <div className="relative overflow-hidden border border-gold/24 bg-[#171411] shadow-[0_34px_120px_rgba(0,0,0,0.32)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-12 left-[42%] w-px bg-gradient-to-b from-transparent via-gold/18 to-transparent max-lg:hidden" />

      <div className="grid grid-cols-[0.78fr_1.22fr] max-lg:grid-cols-1">
        <aside className="relative grid content-between gap-10 p-10 pr-12 max-[640px]:gap-7 max-[640px]:p-6">
          <div>
            <div className="mb-6 flex items-center gap-3.5">
              <GoldLine onDark />
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-light">
                {copy.eyebrow}
              </span>
            </div>
            <h3 className="m-0 max-w-[10ch] font-serif text-[clamp(38px,12vw,72px)] font-normal leading-[0.96] text-ivory">
              {copy.title}
            </h3>
            <p className="mt-6 max-w-[430px] text-[15px] leading-[1.75] text-ivory/62">
              {copy.lede}
            </p>
          </div>

          <figure className="relative m-0 mt-2 overflow-hidden border border-gold/20 bg-gold/10">
            <img
              src={imageSrc}
              alt=""
              aria-hidden="true"
              className="aspect-[4/3] w-full object-cover object-[68%_35%]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-warm-black/45 via-transparent to-transparent" />
          </figure>

          <div className="grid gap-4 border-t border-white/10 pt-7">
            <p className="m-0 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
              {copy.contactTitle}
            </p>
            <div className="grid gap-3">
              <a
                href={`tel:${site.phone.replace(/\s+/g, "")}`}
                className="group grid gap-1 border border-gold/18 bg-gold/8 px-5 py-4 transition-colors hover:border-gold/55 hover:bg-gold/12"
              >
                <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory/42">
                  {copy.phone}
                </span>
                <span className="font-serif text-[clamp(24px,4vw,34px)] leading-none text-ivory transition-colors group-hover:text-gold-light">
                  {site.phone}
                </span>
              </a>
              <a
                href={`mailto:${site.email}`}
                className="group grid gap-1 border border-gold/18 bg-gold/8 px-5 py-4 transition-colors hover:border-gold/55 hover:bg-gold/12"
              >
                <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory/42">
                  {copy.email}
                </span>
                <span className="break-all font-sans text-[18px] font-semibold leading-tight text-ivory transition-colors group-hover:text-gold-light">
                  {site.email}
                </span>
              </a>
            </div>
          </div>
        </aside>

        <div className="grid content-start gap-7 bg-[#1b1714] p-10 max-[640px]:gap-6 max-[640px]:p-5">
          <p className="m-0 max-w-[720px] font-serif text-[clamp(24px,3vw,36px)] leading-[1.15] text-ivory">
            {copy.formTitle}
          </p>

          <form onSubmit={handleSubmit} className="grid gap-4">
            {turnstileSiteKey && (
              <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                strategy="afterInteractive"
                onLoad={() => setTurnstileReady(true)}
              />
            )}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <input type="hidden" name="startedAt" value={startedAt.current} />
            <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
              <label className={labelClass}>
                <span className={labelTextClass}>{copy.name}</span>
                <input name="nome" autoComplete="name" required className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span className={labelTextClass}>
                  {copy.company}
                </span>
                <input name="azienda_o_referente" autoComplete="organization" className={fieldClass} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
              <label className={labelClass}>
                <span className={labelTextClass}>{copy.email}</span>
                <input name="email" type="email" autoComplete="email" required className={fieldClass} />
              </label>
              <label className={labelClass}>
                <span className={labelTextClass}>{copy.phone}</span>
                <input name="telefono" type="tel" autoComplete="tel" className={fieldClass} />
              </label>
            </div>

            <label className={labelClass}>
              <span className={labelTextClass}>{copy.message}</span>
              <textarea
                name="messaggio"
                required
                rows={5}
                placeholder={copy.messagePlaceholder}
                className="min-h-[136px] resize-y border border-white/12 bg-[#201b17] px-4 py-3.5 font-sans text-[14px] leading-[1.6] text-ivory outline-none transition-colors duration-200 placeholder:text-ivory/30 focus:border-gold/80 focus:bg-[#262018]"
              />
            </label>

            <label className="flex items-start gap-3 text-[11.5px] leading-[1.55] text-ivory/46">
              <input
                name="privacy"
                type="checkbox"
                required
                value="Presa visione"
                className="mt-0.5 h-5 w-5 shrink-0 accent-gold"
              />
              <span>
                {copy.privacyBefore}{" "}
                <a
                  href={copy.privacyHref}
                  className="text-gold-light underline decoration-gold/55 underline-offset-4 transition-colors hover:text-gold focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  {copy.privacyLink}
                </a>{" "}
                {copy.privacyAfter}
              </span>
            </label>

            {turnstileSiteKey && (
              <div className="min-h-[65px]" ref={turnstileContainer} aria-label="Verifica anti-spam" />
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3">
              <button
                type="submit"
                disabled={status === "sending" || Boolean(turnstileSiteKey && !turnstileToken)}
                className="inline-flex min-h-11 items-center justify-center gap-3 rounded-full border border-gold bg-gold px-7 py-3.5 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-warm-black transition-all duration-300 hover:-translate-y-px hover:border-gold-light hover:bg-gold-light max-[420px]:w-full"
              >
                {status === "sending" ? copy.sending : copy.submit} <Arrow size={12} />
              </button>
              {status === "error" && lastDraft && (
                <button
                  type="button"
                  onClick={handleMailtoFallback}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-ivory/28 px-6 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory/78 transition-colors hover:border-gold/80 hover:text-gold-light max-[420px]:w-full"
                >
                  Apri email
                </button>
              )}
              <p className="m-0 max-w-[360px] text-[12px] leading-[1.5] text-ivory/42">
                {status === "sent" ? copy.success : status === "error" ? error || copy.error : copy.note}
              </p>
            </div>
          </form>
        </div>
      </div>
      </div>
    </>
  );
}
