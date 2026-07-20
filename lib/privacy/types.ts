export type PrivacyLang = "it" | "en";
export type PrivacyCategoryId = "necessary" | "preferences" | "analytics" | "marketing";

export type BilingualText = {
  it: string;
  en: string;
};

export type PrivacyLegalProfile = {
  legalName: string;
  legalForm: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  taxCode: string;
  vatNumber: string;
  rea: string;
  pec: string;
  privacyEmail: string;
  phone: string;
  activity: string;
  ateco: string;
};

export type PrivacyCategory = {
  id: PrivacyCategoryId;
  label: BilingualText;
  description: BilingualText;
  required: boolean;
  enabled: boolean;
  sortOrder: number;
};

export type PrivacyService = {
  id: string;
  name: string;
  provider: string;
  category: PrivacyCategoryId;
  purpose: BilingualText;
  storage: string;
  duration: BilingualText;
  policyUrl: string;
  active: boolean;
  sortOrder: number;
};

export type PrivacyPolicySection = {
  id: string;
  title: BilingualText;
  body: BilingualText;
  enabled: boolean;
  sortOrder: number;
};

export type PrivacyConfig = {
  version: number;
  consentValidityDays: number;
  receiptRetentionMonths: number;
  legal: PrivacyLegalProfile;
  banner: {
    title: BilingualText;
    description: BilingualText;
    acceptAll: BilingualText;
    rejectAll: BilingualText;
    customize: BilingualText;
    save: BilingualText;
    settingsTitle: BilingualText;
  };
  privacyPolicy: {
    title: BilingualText;
    intro: BilingualText;
    sections: PrivacyPolicySection[];
  };
  cookiePolicy: {
    title: BilingualText;
    intro: BilingualText;
  };
  categories: PrivacyCategory[];
  services: PrivacyService[];
  connectors: {
    ga4: { enabled: boolean; measurementId: string };
    metaPixel: { enabled: boolean; pixelId: string };
  };
};

export type ConsentChoices = Record<PrivacyCategoryId, boolean>;

export type ConsentReceipt = {
  receiptId: string;
  version: number;
  choices: ConsentChoices;
  expiresAt: string;
};

const bi = (it: string, en: string): BilingualText => ({ it, en });

export const DEFAULT_PRIVACY_CONFIG: PrivacyConfig = {
  version: 1,
  consentValidityDays: 180,
  receiptRetentionMonths: 24,
  legal: {
    legalName: "R.G.R. DI GALLASTRONI ROSSELLA & C. S.N.C.",
    legalForm: "Societa in nome collettivo",
    address: "Via Piero Calamandrei 253/A11",
    postalCode: "52100",
    city: "Arezzo",
    province: "AR",
    country: "Italia",
    taxCode: "01358780516",
    vatNumber: "01358780516",
    rea: "AR - 100364",
    pec: "rgrhandmade@pec.it",
    privacyEmail: "info@rgrhandmade.it",
    phone: "+39 0575 299101",
    activity: "Lavorazione di oggetti preziosi",
    ateco: "32.12.20",
  },
  banner: {
    title: bi("La tua privacy, con chiarezza.", "Your privacy, clearly."),
    description: bi(
      "Usiamo strumenti tecnici necessari al funzionamento del sito e, solo con il tuo consenso, servizi di misurazione o marketing.",
      "We use technical tools required for the website and, only with your consent, measurement or marketing services.",
    ),
    acceptAll: bi("Accetta tutti", "Accept all"),
    rejectAll: bi("Rifiuta tutti", "Reject all"),
    customize: bi("Personalizza", "Customize"),
    save: bi("Salva preferenze", "Save preferences"),
    settingsTitle: bi("Preferenze privacy", "Privacy preferences"),
  },
  privacyPolicy: {
    title: bi("Informativa privacy", "Privacy notice"),
    intro: bi(
      "Informativa resa ai sensi dell'art. 13 del Regolamento (UE) 2016/679 per gli utenti del sito e per le richieste inviate tramite la form di contatto.",
      "Notice provided under Article 13 of Regulation (EU) 2016/679 for website users and requests submitted through the contact form.",
    ),
    sections: [
      {
        id: "controller",
        title: bi("Titolare del trattamento", "Data controller"),
        body: bi(
          "Il titolare e {{legalName}}, con sede in {{fullAddress}}, C.F. e P. IVA {{vatNumber}}, REA {{rea}}. Per esercitare i diritti privacy: {{privacyEmail}}. Domicilio digitale/PEC: {{pec}}.",
          "The controller is {{legalName}}, registered at {{fullAddress}}, tax and VAT number {{vatNumber}}, REA {{rea}}. Privacy contact: {{privacyEmail}}. Certified email: {{pec}}.",
        ), enabled: true, sortOrder: 0,
      },
      {
        id: "data-purpose",
        title: bi("Dati, finalita e base giuridica", "Data, purposes and legal basis"),
        body: bi(
          "Trattiamo dati di navigazione e, quando ci contatti, nome, recapiti, eventuale azienda e contenuto del messaggio. I dati servono a garantire sicurezza e funzionamento del sito e a rispondere alle richieste. Le basi giuridiche sono le misure precontrattuali richieste dall'interessato, gli obblighi di legge e il legittimo interesse alla sicurezza dei sistemi.",
          "We process browsing data and, when you contact us, your name, contact details, company where provided, and message content. Data is used to operate and secure the website and answer requests. Legal bases are pre-contractual steps requested by you, legal obligations, and our legitimate interest in system security.",
        ), enabled: true, sortOrder: 1,
      },
      {
        id: "recipients",
        title: bi("Destinatari e trasferimenti", "Recipients and transfers"),
        body: bi(
          "I dati possono essere trattati da personale autorizzato e fornitori di hosting, email, infrastruttura, protezione anti-abuso e servizi digitali, nominati responsabili ove previsto. Gli eventuali trasferimenti fuori dallo SEE avvengono con le garanzie previste dal GDPR.",
          "Data may be processed by authorized staff and hosting, email, infrastructure, anti-abuse and digital-service providers, appointed as processors where required. Transfers outside the EEA rely on safeguards required by the GDPR.",
        ), enabled: true, sortOrder: 2,
      },
      {
        id: "retention",
        title: bi("Conservazione", "Retention"),
        body: bi(
          "Le richieste di contatto sono conservate per il tempo necessario alla gestione e non oltre 24 mesi dall'ultima comunicazione, salvo obblighi di legge o necessita di tutela. Le preferenze cookie durano 180 giorni; le ricevute pseudonime sono conservate per 24 mesi.",
          "Contact requests are retained only as long as needed and no longer than 24 months from the last communication, unless required by law or to protect legal rights. Cookie preferences last 180 days; pseudonymous receipts are retained for 24 months.",
        ), enabled: true, sortOrder: 3,
      },
      {
        id: "rights",
        title: bi("Diritti", "Your rights"),
        body: bi(
          "Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilita e opposizione nei casi previsti dagli artt. 15-22 GDPR scrivendo a {{privacyEmail}}. Puoi inoltre proporre reclamo al Garante per la protezione dei dati personali.",
          "You may request access, correction, erasure, restriction, portability and objection under Articles 15-22 GDPR by writing to {{privacyEmail}}. You may also lodge a complaint with the Italian Data Protection Authority.",
        ), enabled: true, sortOrder: 4,
      },
    ],
  },
  cookiePolicy: {
    title: bi("Cookie policy", "Cookie policy"),
    intro: bi(
      "Questa pagina descrive cookie e strumenti analoghi utilizzati dal sito. Gli strumenti non tecnici restano disattivati finche non esprimi una scelta.",
      "This page describes cookies and similar tools used by the website. Non-technical tools remain disabled until you make a choice.",
    ),
  },
  categories: [
    { id: "necessary", label: bi("Necessari", "Necessary"), description: bi("Sicurezza, preferenze privacy e funzioni essenziali.", "Security, privacy preferences and essential functions."), required: true, enabled: true, sortOrder: 0 },
    { id: "preferences", label: bi("Preferenze", "Preferences"), description: bi("Memorizzano scelte che personalizzano funzioni non essenziali.", "Remember choices that customize non-essential features."), required: false, enabled: true, sortOrder: 1 },
    { id: "analytics", label: bi("Misurazione", "Measurement"), description: bi("Ci aiutano a capire in forma statistica come viene usato il sito.", "Help us understand statistically how the site is used."), required: false, enabled: true, sortOrder: 2 },
    { id: "marketing", label: bi("Marketing", "Marketing"), description: bi("Misurano campagne e consentono comunicazioni pubblicitarie personalizzate.", "Measure campaigns and enable personalized advertising."), required: false, enabled: true, sortOrder: 3 },
  ],
  services: [
    {
      id: "privacy-consent",
      name: "RGR Privacy Preferences",
      provider: "R.G.R. Handmade",
      category: "necessary",
      purpose: bi("Memorizza e documenta le preferenze privacy.", "Stores and documents privacy preferences."),
      storage: "rgr_privacy_consent",
      duration: bi("180 giorni", "180 days"),
      policyUrl: "/cookie-policy",
      active: true,
      sortOrder: 0,
    },
    {
      id: "cloudflare-turnstile",
      name: "Cloudflare Turnstile",
      provider: "Cloudflare, Inc.",
      category: "necessary",
      purpose: bi("Protegge la form di contatto da invii automatizzati e abusi.", "Protects the contact form from automated submissions and abuse."),
      storage: "Dati tecnici di sicurezza",
      duration: bi("Limitata alla verifica", "Limited to verification"),
      policyUrl: "https://www.cloudflare.com/privacypolicy/",
      active: true,
      sortOrder: 1,
    },
  ],
  connectors: {
    ga4: { enabled: false, measurementId: "" },
    metaPixel: { enabled: false, pixelId: "" },
  },
};

export const PRIVACY_CATEGORY_IDS: PrivacyCategoryId[] = ["necessary", "preferences", "analytics", "marketing"];
export const PROTECTED_PRIVACY_SERVICE_IDS = new Set(["privacy-consent", "cloudflare-turnstile"]);
const SAFE_ID_RE = /^[a-z][a-z0-9-]{1,63}$/;
const UNSAFE_CONTENT_RE = /<[^>]*>|(?:javascript|data):/i;
const MAX_SECTIONS = 30;
const MAX_SERVICES = 50;
const clean = (value: unknown, fallback: string, max = 5000) => typeof value === "string" ? value.trim().slice(0, max) : fallback;
const bool = (value: unknown, fallback: boolean) => typeof value === "boolean" ? value : fallback;
const numberInRange = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
};
const normalizeBi = (value: unknown, fallback: BilingualText): BilingualText => {
  const input = value && typeof value === "object" ? value as Partial<BilingualText> : {};
  return { it: clean(input.it, fallback.it), en: clean(input.en, fallback.en) };
};

const normalizeSortOrder = (value: unknown, fallback: number) => numberInRange(value, fallback, 0, 999);
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isSafePolicyUrl = (value: string) => (value.startsWith("/") && !value.startsWith("//")) || (() => {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
})();

export function isProtectedPrivacyService(id: string) {
  return PROTECTED_PRIVACY_SERVICE_IDS.has(id);
}

export function isPrivacyCategoryEnabled(config: PrivacyConfig, id: PrivacyCategoryId) {
  return config.categories.some((category) => category.id === id && category.enabled);
}

export function validatePrivacyConfigInput(value: unknown): string[] {
  if (!isRecord(value)) return ["Configurazione non valida."];
  const errors: string[] = [];
  const sections = isRecord(value.privacyPolicy) && Array.isArray(value.privacyPolicy.sections) ? value.privacyPolicy.sections : null;
  const services = Array.isArray(value.services) ? value.services : null;
  const categories = Array.isArray(value.categories) ? value.categories : null;

  if (!sections || sections.length < 1 || sections.length > MAX_SECTIONS) errors.push(`Le sezioni devono essere comprese tra 1 e ${MAX_SECTIONS}.`);
  if (!services || services.length < 2 || services.length > MAX_SERVICES) errors.push(`I servizi devono essere compresi tra 2 e ${MAX_SERVICES}.`);
  if (!categories || categories.length !== PRIVACY_CATEGORY_IDS.length) errors.push("Le quattro categorie standard sono obbligatorie.");

  const ids = (items: unknown[] | null) => items?.map((item) => isRecord(item) && typeof item.id === "string" ? item.id : "") ?? [];
  const sectionIds = ids(sections);
  const serviceIds = ids(services);
  const categoryIds = ids(categories);
  if (sectionIds.some((id) => !SAFE_ID_RE.test(id)) || new Set(sectionIds).size !== sectionIds.length) errors.push("Gli ID delle sezioni devono essere univoci e validi.");
  if (serviceIds.some((id) => !SAFE_ID_RE.test(id)) || new Set(serviceIds).size !== serviceIds.length) errors.push("Gli ID dei servizi devono essere univoci e validi.");
  if (new Set(categoryIds).size !== PRIVACY_CATEGORY_IDS.length || PRIVACY_CATEGORY_IDS.some((id) => !categoryIds.includes(id))) errors.push("Le categorie standard non possono essere create o eliminate.");
  if (!serviceIds.includes("privacy-consent") || !serviceIds.includes("cloudflare-turnstile")) errors.push("I servizi tecnici protetti sono obbligatori.");

  const inspectText = (input: unknown) => {
    if (typeof input === "string" && input.length > 5000) errors.push("Un contenuto supera il limite di 5.000 caratteri.");
    else if (typeof input === "string" && UNSAFE_CONTENT_RE.test(input)) errors.push("HTML, script e protocolli attivi non sono consentiti.");
    else if (Array.isArray(input)) input.forEach(inspectText);
    else if (isRecord(input)) Object.values(input).forEach(inspectText);
  };
  inspectText(value);

  const requiredBi = (input: unknown) => isRecord(input) && typeof input.it === "string" && input.it.trim().length > 0 && typeof input.en === "string" && input.en.trim().length > 0;
  sections?.forEach((section) => {
    if (!isRecord(section) || !requiredBi(section.title) || !requiredBi(section.body)) errors.push("Titolo e testo IT/EN sono obbligatori per ogni sezione.");
  });
  categories?.forEach((category) => {
    if (!isRecord(category) || !requiredBi(category.label) || !requiredBi(category.description)) errors.push("Nome e descrizione IT/EN sono obbligatori per ogni categoria.");
  });

  services?.forEach((service) => {
    if (!isRecord(service)) return errors.push("Servizio non valido.");
    if (typeof service.name !== "string" || !service.name.trim() || service.name.length > 120 || typeof service.provider !== "string" || !service.provider.trim() || service.provider.length > 120) errors.push("Nome e provider sono obbligatori e non possono superare 120 caratteri.");
    if (!requiredBi(service.purpose) || !requiredBi(service.duration) || typeof service.storage !== "string" || !service.storage.trim()) errors.push("Finalita, durata e storage sono obbligatori per ogni servizio.");
    if (!PRIVACY_CATEGORY_IDS.includes(service.category as PrivacyCategoryId)) errors.push("Categoria servizio non valida.");
    if (typeof service.policyUrl !== "string" || !isSafePolicyUrl(service.policyUrl.trim())) errors.push("Ogni servizio deve avere una Policy URL interna o HTTPS valida.");
    if (service.id === "privacy-consent" && (service.active !== true || service.category !== "necessary")) errors.push("Il servizio di consenso deve restare attivo e necessario.");
    if (service.id === "cloudflare-turnstile" && service.category !== "necessary") errors.push("Turnstile deve restare nella categoria Necessari.");
  });

  return [...new Set(errors)].slice(0, 12);
}

export function normalizePrivacyConfig(value: unknown, forcedVersion?: number): PrivacyConfig {
  const input = value && typeof value === "object" ? value as Partial<PrivacyConfig> : {};
  const legal = input.legal ?? {} as Partial<PrivacyLegalProfile>;
  const banner = input.banner ?? {} as Partial<PrivacyConfig["banner"]>;
  const privacyPolicy = input.privacyPolicy ?? {} as Partial<PrivacyConfig["privacyPolicy"]>;
  const cookiePolicy = input.cookiePolicy ?? {} as Partial<PrivacyConfig["cookiePolicy"]>;
  const connectors = input.connectors ?? {} as Partial<PrivacyConfig["connectors"]>;
  const ga4 = connectors.ga4 ?? {} as Partial<PrivacyConfig["connectors"]["ga4"]>;
  const metaPixel = connectors.metaPixel ?? {} as Partial<PrivacyConfig["connectors"]["metaPixel"]>;

  const normalized: PrivacyConfig = {
    ...DEFAULT_PRIVACY_CONFIG,
    version: forcedVersion ?? numberInRange(input.version, DEFAULT_PRIVACY_CONFIG.version, 1, 1_000_000),
    consentValidityDays: numberInRange(input.consentValidityDays, 180, 30, 365),
    receiptRetentionMonths: numberInRange(input.receiptRetentionMonths, 24, 6, 60),
    legal: Object.fromEntries(Object.entries(DEFAULT_PRIVACY_CONFIG.legal).map(([key, fallback]) => [key, clean(legal[key as keyof PrivacyLegalProfile], fallback, 300)])) as unknown as PrivacyLegalProfile,
    banner: Object.fromEntries(Object.entries(DEFAULT_PRIVACY_CONFIG.banner).map(([key, fallback]) => [key, normalizeBi(banner[key as keyof typeof banner], fallback)])) as PrivacyConfig["banner"],
    privacyPolicy: {
      title: normalizeBi(privacyPolicy.title, DEFAULT_PRIVACY_CONFIG.privacyPolicy.title),
      intro: normalizeBi(privacyPolicy.intro, DEFAULT_PRIVACY_CONFIG.privacyPolicy.intro),
      sections: (Array.isArray(privacyPolicy.sections) && privacyPolicy.sections.length ? privacyPolicy.sections : DEFAULT_PRIVACY_CONFIG.privacyPolicy.sections)
        .slice(0, MAX_SECTIONS)
        .map((section, index) => ({
          id: clean(section?.id, `section-${index + 1}`, 64).toLowerCase(),
          title: normalizeBi(section?.title, bi("Nuova sezione", "New section")),
          body: normalizeBi(section?.body, bi("Contenuto della sezione.", "Section content.")),
          enabled: bool(section?.enabled, true),
          sortOrder: normalizeSortOrder(section?.sortOrder, index),
        })).sort((a, b) => a.sortOrder - b.sortOrder),
    },
    cookiePolicy: {
      title: normalizeBi(cookiePolicy.title, DEFAULT_PRIVACY_CONFIG.cookiePolicy.title),
      intro: normalizeBi(cookiePolicy.intro, DEFAULT_PRIVACY_CONFIG.cookiePolicy.intro),
    },
    categories: DEFAULT_PRIVACY_CONFIG.categories.map((fallback, index) => {
      const category = Array.isArray(input.categories) ? input.categories.find((item) => item?.id === fallback.id) : undefined;
      return { ...fallback, label: normalizeBi(category?.label, fallback.label), description: normalizeBi(category?.description, fallback.description), required: fallback.required, enabled: fallback.required ? true : bool(category?.enabled, true), sortOrder: normalizeSortOrder(category?.sortOrder, index) };
    }).sort((a, b) => a.sortOrder - b.sortOrder),
    services: (() => {
      const inputServices = Array.isArray(input.services) ? input.services : [];
      const protectedServices = DEFAULT_PRIVACY_CONFIG.services.map((fallback, index) => {
        const service = inputServices.find((item) => item?.id === fallback.id);
        return { ...fallback, name: clean(service?.name, fallback.name, 120), provider: clean(service?.provider, fallback.provider, 120), active: fallback.id === "privacy-consent" ? true : bool(service?.active, fallback.active), purpose: normalizeBi(service?.purpose, fallback.purpose), storage: clean(service?.storage, fallback.storage, 300), duration: normalizeBi(service?.duration, fallback.duration), policyUrl: clean(service?.policyUrl, fallback.policyUrl, 500), sortOrder: normalizeSortOrder(service?.sortOrder, index) };
      });
      const customServices = inputServices.filter((service) => service && !PROTECTED_PRIVACY_SERVICE_IDS.has(service.id)).slice(0, MAX_SERVICES - protectedServices.length).map((service, index) => ({
        id: clean(service.id, `service-${index + 1}`, 64).toLowerCase(),
        name: clean(service.name, "Nuovo servizio", 120),
        provider: clean(service.provider, "Provider", 120),
        category: PRIVACY_CATEGORY_IDS.includes(service.category) ? service.category : "preferences" as PrivacyCategoryId,
        purpose: normalizeBi(service.purpose, bi("Finalita del servizio.", "Service purpose.")),
        storage: clean(service.storage, "Nessuna archiviazione dichiarata", 300),
        duration: normalizeBi(service.duration, bi("Da definire", "To be defined")),
        policyUrl: clean(service.policyUrl, "/cookie-policy", 500),
        active: bool(service.active, false),
        sortOrder: normalizeSortOrder(service.sortOrder, protectedServices.length + index),
      }));
      return [...protectedServices, ...customServices].sort((a, b) => a.sortOrder - b.sortOrder);
    })(),
    connectors: {
      ga4: { enabled: bool(ga4.enabled, false), measurementId: clean(ga4.measurementId, "", 32).toUpperCase() },
      metaPixel: { enabled: bool(metaPixel.enabled, false), pixelId: clean(metaPixel.pixelId, "", 32) },
    },
  };

  if (normalized.connectors.ga4.enabled && !/^G-[A-Z0-9]{4,20}$/.test(normalized.connectors.ga4.measurementId)) normalized.connectors.ga4.enabled = false;
  if (normalized.connectors.metaPixel.enabled && !/^\d{5,25}$/.test(normalized.connectors.metaPixel.pixelId)) normalized.connectors.metaPixel.enabled = false;
  return normalized;
}

export function hasOptionalPrivacyServices(config: PrivacyConfig) {
  return (config.connectors.ga4.enabled && isPrivacyCategoryEnabled(config, "analytics")) || (config.connectors.metaPixel.enabled && isPrivacyCategoryEnabled(config, "marketing")) || config.services.some((service) => service.active && service.category !== "necessary" && isPrivacyCategoryEnabled(config, service.category));
}

export function isConsentMaterialChange(previous: PrivacyConfig, next: PrivacyConfig) {
  const material = (config: PrivacyConfig) => ({
    categories: config.categories.map(({ id, required, enabled }) => ({ id, required, enabled })).sort((a, b) => a.id.localeCompare(b.id)),
    services: config.services
      .filter((service) => service.category !== "necessary")
      .map(({ id, category, active, purpose, storage, duration, policyUrl }) => ({ id, category, active, purpose, storage, duration, policyUrl }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    connectors: config.connectors,
  });
  return JSON.stringify(material(previous)) !== JSON.stringify(material(next));
}

export function getConfiguredPrivacyServices(config: PrivacyConfig): PrivacyService[] {
  const services = config.services.filter((service) => service.active && isPrivacyCategoryEnabled(config, service.category));
  if (config.connectors.ga4.enabled && isPrivacyCategoryEnabled(config, "analytics")) {
    services.push({
      id: "google-analytics-4", name: "Google Analytics 4", provider: "Google Ireland Limited", category: "analytics",
      purpose: bi("Misurazione statistica dell'utilizzo del sito.", "Statistical measurement of website usage."),
      storage: "_ga, _ga_*", duration: bi("Fino a 24 mesi", "Up to 24 months"), policyUrl: "https://policies.google.com/privacy", active: true, sortOrder: 900,
    });
  }
  if (config.connectors.metaPixel.enabled && isPrivacyCategoryEnabled(config, "marketing")) {
    services.push({
      id: "meta-pixel", name: "Meta Pixel", provider: "Meta Platforms Ireland Limited", category: "marketing",
      purpose: bi("Misurazione delle campagne e pubblicita personalizzata.", "Campaign measurement and personalized advertising."),
      storage: "_fbp", duration: bi("Fino a 90 giorni", "Up to 90 days"), policyUrl: "https://www.facebook.com/privacy/policy/", active: true, sortOrder: 901,
    });
  }
  return services;
}

export function textFor(value: BilingualText, lang: PrivacyLang) {
  return value[lang] || value.it;
}

export function interpolateLegalText(value: string, legal: PrivacyLegalProfile) {
  const fullAddress = `${legal.address}, ${legal.postalCode} ${legal.city} (${legal.province}), ${legal.country}`;
  return value.replace(/{{(\w+)}}/g, (_match, key: string) => key === "fullAddress" ? fullAddress : String(legal[key as keyof PrivacyLegalProfile] ?? ""));
}
