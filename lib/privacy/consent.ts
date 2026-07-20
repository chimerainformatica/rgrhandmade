import { isPrivacyCategoryEnabled, type ConsentChoices, type ConsentReceipt, type PrivacyCategoryId, type PrivacyConfig } from "@/lib/privacy/types";

export const PRIVACY_COOKIE_NAME = "rgr_privacy_consent";
export const OPEN_PRIVACY_SETTINGS_EVENT = "rgr:open-privacy-settings";

const CATEGORY_IDS: PrivacyCategoryId[] = ["necessary", "preferences", "analytics", "marketing"];

export const REJECT_OPTIONAL_CHOICES: ConsentChoices = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
};

export const ACCEPT_ALL_CHOICES: ConsentChoices = {
  necessary: true,
  preferences: true,
  analytics: true,
  marketing: true,
};

export function choicesForPrivacyConfig(config: PrivacyConfig, choices: ConsentChoices): ConsentChoices {
  return {
    necessary: true,
    preferences: isPrivacyCategoryEnabled(config, "preferences") && choices.preferences,
    analytics: isPrivacyCategoryEnabled(config, "analytics") && choices.analytics,
    marketing: isPrivacyCategoryEnabled(config, "marketing") && choices.marketing,
  };
}

export function normalizeConsentChoices(value: unknown): ConsentChoices | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Partial<Record<PrivacyCategoryId, unknown>>;
  if (CATEGORY_IDS.some((id) => id !== "necessary" && typeof input[id] !== "boolean")) return null;
  return {
    necessary: true,
    preferences: input.preferences === true,
    analytics: input.analytics === true,
    marketing: input.marketing === true,
  };
}

export function parseConsentCookie(value: string | undefined): ConsentReceipt | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<ConsentReceipt>;
    const choices = normalizeConsentChoices(parsed.choices);
    if (!choices || typeof parsed.receiptId !== "string" || typeof parsed.version !== "number" || typeof parsed.expiresAt !== "string") return null;
    if (Number.isNaN(Date.parse(parsed.expiresAt)) || Date.parse(parsed.expiresAt) <= Date.now()) return null;
    return { receiptId: parsed.receiptId, version: parsed.version, expiresAt: parsed.expiresAt, choices };
  } catch {
    return null;
  }
}

export function serializeConsentCookie(receipt: ConsentReceipt, maxAgeSeconds: number, secure: boolean) {
  const value = encodeURIComponent(JSON.stringify(receipt));
  return `${PRIVACY_COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure ? "; Secure" : ""}`;
}
