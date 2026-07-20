"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ShieldCheck, X } from "lucide-react";
import { ACCEPT_ALL_CHOICES, OPEN_PRIVACY_SETTINGS_EVENT, PRIVACY_COOKIE_NAME, REJECT_OPTIONAL_CHOICES, choicesForPrivacyConfig, parseConsentCookie, serializeConsentCookie } from "@/lib/privacy/consent";
import { getConfiguredPrivacyServices, hasOptionalPrivacyServices, textFor, type ConsentChoices, type ConsentReceipt, type PrivacyCategoryId, type PrivacyConfig, type PrivacyLang } from "@/lib/privacy/types";
import { PrivacyConnectors } from "@/components/privacy/PrivacyConnectors";

function readConsentCookie() {
  const value = document.cookie.split("; ").find((item) => item.startsWith(`${PRIVACY_COOKIE_NAME}=`))?.slice(PRIVACY_COOKIE_NAME.length + 1);
  return parseConsentCookie(value);
}

export function PrivacyManager({ config, lang }: { config: PrivacyConfig; lang: PrivacyLang }) {
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const optionalServices = hasOptionalPrivacyServices(config) || previewEnabled;
  const [receipt, setReceipt] = useState<ConsentReceipt | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState<ConsentChoices>(REJECT_OPTIONAL_CHOICES);
  const [expanded, setExpanded] = useState<PrivacyCategoryId | null>("necessary");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPreviewEnabled(process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).get("privacy-preview") === "1");
  }, []);

  useEffect(() => {
    const stored = readConsentCookie();
    const valid = stored?.version === config.version ? stored : null;
    setReceipt(valid);
    setDraft(valid?.choices ?? REJECT_OPTIONAL_CHOICES);
    setShowBanner(optionalServices && !valid);
    if (window.location.hash === "#cookie-settings") setShowSettings(true);

    const open = () => setShowSettings(true);
    window.addEventListener(OPEN_PRIVACY_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_PRIVACY_SETTINGS_EVENT, open);
  }, [config.version, optionalServices]);

  function closeSettings() {
    setShowSettings(false);
    if (window.location.hash === "#cookie-settings") history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }

  useEffect(() => {
    if (!showSettings || !dialogRef.current) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled])'));
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSettings(false);
        if (window.location.hash === "#cookie-settings") history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; previous?.focus(); };
  }, [showSettings]);

  async function persist(choices: ConsentChoices) {
    const receiptId = receipt?.receiptId ?? crypto.randomUUID();
    const expiresAt = new Date(Date.now() + config.consentValidityDays * 86_400_000).toISOString();
    const next: ConsentReceipt = { receiptId, version: config.version, choices: choicesForPrivacyConfig(config, choices), expiresAt };
    document.cookie = serializeConsentCookie(next, config.consentValidityDays * 86_400, window.location.protocol === "https:");
    setReceipt(next); setDraft(next.choices); setShowBanner(false); closeSettings();
    try {
      const response = await fetch("/api/privacy/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
      const result = await response.json().catch(() => null) as { expiresAt?: string } | null;
      if (response.ok && result?.expiresAt) {
        const confirmed = { ...next, expiresAt: result.expiresAt };
        document.cookie = serializeConsentCookie(confirmed, config.consentValidityDays * 86_400, window.location.protocol === "https:");
        setReceipt(confirmed);
      }
    } catch { /* The first-party cookie remains the local consent record. */ }
  }

  const services = getConfiguredPrivacyServices(config);
  const linkClass = "text-gold-light underline decoration-gold/50 underline-offset-4 hover:text-gold";
  return (
    <>
      <PrivacyConnectors config={config} choices={receipt?.choices ?? null} />
      {showBanner && (
        <section role="dialog" aria-label={textFor(config.banner.title, lang)} className="fixed inset-x-3 bottom-3 z-[500] mx-auto max-w-[940px] border border-gold/45 bg-[#171411]/[0.98] p-5 text-ivory shadow-[0_30px_100px_rgba(0,0,0,.55)] backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
          <button type="button" aria-label={lang === "it" ? "Chiudi e rifiuta i cookie opzionali" : "Close and reject optional cookies"} onClick={() => void persist(REJECT_OPTIONAL_CHOICES)} className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full border border-white/15 text-ivory/70 hover:border-gold hover:text-gold-light"><X size={18} /></button>
          <div className="grid gap-5 pr-10 md:grid-cols-[1fr_auto] md:items-end md:pr-0">
            <div><div className="mb-3 flex items-center gap-3 text-gold-light"><ShieldCheck size={18} /><span className="font-sans text-[10px] font-bold uppercase tracking-[.22em]">Privacy R.G.R.</span></div><h2 className="font-serif text-[30px] leading-none sm:text-[38px]">{textFor(config.banner.title, lang)}</h2><p className="mt-3 max-w-[650px] font-sans text-[13px] leading-6 text-ivory/65">{textFor(config.banner.description, lang)} <a href={`/cookie-policy?lang=${lang}`} className={linkClass}>{lang === "it" ? "Cookie policy" : "Cookie policy"}</a>.</p></div>
            <div className="grid min-w-[210px] gap-2"><button onClick={() => void persist(ACCEPT_ALL_CHOICES)} className="min-h-11 rounded-full border border-gold bg-gold px-5 font-sans text-[11px] font-bold uppercase tracking-[.12em] text-warm-black hover:bg-gold-light">{textFor(config.banner.acceptAll, lang)}</button><button onClick={() => void persist(REJECT_OPTIONAL_CHOICES)} className="min-h-11 rounded-full border border-gold px-5 font-sans text-[11px] font-bold uppercase tracking-[.12em] text-gold-light hover:bg-gold hover:text-warm-black">{textFor(config.banner.rejectAll, lang)}</button><button onClick={() => setShowSettings(true)} className="min-h-11 rounded-full border border-gold px-5 font-sans text-[11px] font-bold uppercase tracking-[.12em] text-gold-light hover:bg-gold hover:text-warm-black">{textFor(config.banner.customize, lang)}</button></div>
          </div>
        </section>
      )}
      {showSettings && (
        <div className="fixed inset-0 z-[600] bg-black/65 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) closeSettings(); }}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="privacy-settings-title" className="absolute inset-0 ml-auto flex w-full max-w-[560px] flex-col border-l border-gold/35 bg-[#f7f2ea] text-warm-black shadow-[-30px_0_100px_rgba(0,0,0,.42)] sm:inset-y-4 sm:right-4 sm:max-h-[calc(100vh-2rem)] sm:rounded-l-[28px] sm:border sm:rounded-r-sm">
            <header className="flex items-start justify-between gap-5 border-b border-warm-black/10 px-5 py-5 sm:px-7"><div><p className="font-sans text-[10px] font-bold uppercase tracking-[.22em] text-gold">R.G.R. Handmade</p><h2 id="privacy-settings-title" className="mt-1 font-serif text-[34px] leading-none">{textFor(config.banner.settingsTitle, lang)}</h2></div><button onClick={closeSettings} aria-label={lang === "it" ? "Chiudi preferenze" : "Close preferences"} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-warm-black/20 hover:border-gold"><X size={19} /></button></header>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
              <p className="font-sans text-[13px] leading-6 text-dark-brown/75">{textFor(config.banner.description, lang)}</p>
              <div className="mt-6 grid gap-3">
                {config.categories.filter((category) => category.enabled).sort((a, b) => a.sortOrder - b.sortOrder).map((category) => {
                  const categoryServices = services.filter((service) => service.category === category.id);
                  return <section key={category.id} className="overflow-hidden border border-warm-black/10 bg-white/50"><div className="flex min-h-[76px] items-center gap-3 p-4"><button aria-label={`${expanded === category.id ? "Chiudi" : "Apri"} ${textFor(category.label, lang)}`} aria-expanded={expanded === category.id} onClick={() => setExpanded(expanded === category.id ? null : category.id)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-warm-black/5"><ChevronDown size={16} className={`transition-transform ${expanded === category.id ? "rotate-180" : ""}`} /></button><button onClick={() => setExpanded(expanded === category.id ? null : category.id)} className="min-w-0 flex-1 text-left"><span className="block font-sans text-[14px] font-extrabold">{textFor(category.label, lang)}</span><span className="mt-1 block font-sans text-[11px] leading-4 text-dark-brown/65">{textFor(category.description, lang)}</span></button><label className="relative inline-flex h-7 w-12 shrink-0 items-center"><span className="sr-only">{textFor(category.label, lang)}</span><input type="checkbox" className="peer sr-only" checked={category.required || draft[category.id]} disabled={category.required} onChange={(e) => setDraft((current) => ({ ...current, [category.id]: e.target.checked, necessary: true }))} /><span className="absolute inset-0 rounded-full bg-warm-black/20 transition peer-checked:bg-gold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold" /><span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" /></label></div>{expanded === category.id && <div className="border-t border-warm-black/10 px-4 py-4">{categoryServices.length ? <ul className="grid gap-3">{categoryServices.map((service) => <li key={service.id} className="font-sans text-[11.5px] leading-5"><div className="font-bold">{service.name} · {service.provider}</div><div className="text-dark-brown/65">{textFor(service.purpose, lang)} · {textFor(service.duration, lang)}</div><a href={service.policyUrl} target={service.policyUrl.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="text-gold underline underline-offset-2">Policy</a></li>)}</ul> : <p className="font-sans text-[11.5px] text-dark-brown/60">{lang === "it" ? "Nessun servizio attivo in questa categoria." : "No active services in this category."}</p>}</div>}</section>;
                })}
              </div>
              <p className="mt-6 font-sans text-[11.5px] leading-5 text-dark-brown/65">{lang === "it" ? "Puoi modificare queste preferenze in qualsiasi momento." : "You can change these preferences at any time."} <a href={`/privacy-policy?lang=${lang}`} className="text-gold underline underline-offset-2">Privacy policy</a>.</p>
            </div>
            <footer className="grid gap-2 border-t border-warm-black/10 bg-[#efe8dd] p-4 sm:grid-cols-2 sm:p-5"><button onClick={() => void persist(REJECT_OPTIONAL_CHOICES)} className="min-h-12 rounded-full border border-warm-black px-5 font-sans text-[11px] font-bold uppercase tracking-[.12em]">{textFor(config.banner.rejectAll, lang)}</button><button onClick={() => void persist(draft)} className="min-h-12 rounded-full border border-gold bg-gold px-5 font-sans text-[11px] font-bold uppercase tracking-[.12em] text-warm-black">{textFor(config.banner.save, lang)}</button></footer>
          </div>
        </div>
      )}
    </>
  );
}
