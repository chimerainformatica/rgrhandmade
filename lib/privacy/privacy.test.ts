import assert from "node:assert/strict";
import test from "node:test";
import { ACCEPT_ALL_CHOICES, parseConsentCookie, serializeConsentCookie } from "./consent";
import { DEFAULT_PRIVACY_CONFIG, getConfiguredPrivacyServices, hasOptionalPrivacyServices, isConsentMaterialChange, normalizePrivacyConfig, validatePrivacyConfigInput } from "./types";

test("the default configuration contains only necessary services", () => {
  assert.equal(hasOptionalPrivacyServices(DEFAULT_PRIVACY_CONFIG), false);
});

test("invalid connector identifiers cannot activate external scripts", () => {
  const config = normalizePrivacyConfig({ connectors: { ga4: { enabled: true, measurementId: "<script>" }, metaPixel: { enabled: true, pixelId: "abc" } } });
  assert.equal(config.connectors.ga4.enabled, false);
  assert.equal(config.connectors.metaPixel.enabled, false);
});

test("valid connector identifiers activate optional services", () => {
  const config = normalizePrivacyConfig({ connectors: { ga4: { enabled: true, measurementId: "g-abcd1234" }, metaPixel: { enabled: true, pixelId: "1234567890" } } });
  assert.equal(config.connectors.ga4.measurementId, "G-ABCD1234");
  assert.equal(config.connectors.ga4.enabled, true);
  assert.equal(config.connectors.metaPixel.enabled, true);
  assert.equal(hasOptionalPrivacyServices(config), true);
});

test("editorial changes do not invalidate consent", () => {
  const edited = normalizePrivacyConfig({ ...DEFAULT_PRIVACY_CONFIG, banner: { ...DEFAULT_PRIVACY_CONFIG.banner, title: { it: "Titolo corretto", en: "Corrected title" } } });
  assert.equal(isConsentMaterialChange(DEFAULT_PRIVACY_CONFIG, edited), false);
});

test("service purpose and connector changes invalidate consent", () => {
  const previous = structuredClone(DEFAULT_PRIVACY_CONFIG);
  previous.services.push({ id: "preference-service", name: "Preference", provider: "Provider", category: "preferences", purpose: { it: "Finalita", en: "Purpose" }, storage: "preference", duration: { it: "30 giorni", en: "30 days" }, policyUrl: "https://example.com/privacy", active: true, sortOrder: 2 });
  const changedPurpose = structuredClone(previous);
  changedPurpose.services[2].purpose.it = "Nuova finalita";
  assert.equal(isConsentMaterialChange(previous, changedPurpose), true);
  const enabledConnector = normalizePrivacyConfig({ ...DEFAULT_PRIVACY_CONFIG, connectors: { ...DEFAULT_PRIVACY_CONFIG.connectors, ga4: { enabled: true, measurementId: "G-ABCD1234" } } });
  assert.equal(isConsentMaterialChange(DEFAULT_PRIVACY_CONFIG, enabledConnector), true);
});

test("consent cookies round-trip and reject expired values", () => {
  const receipt = { receiptId: "f6f3cb44-8447-4e77-96e7-741134955957", version: 2, choices: ACCEPT_ALL_CHOICES, expiresAt: new Date(Date.now() + 60_000).toISOString() };
  const serialized = serializeConsentCookie(receipt, 60, true);
  const value = serialized.match(/^rgr_privacy_consent=([^;]+)/)?.[1];
  assert.deepEqual(parseConsentCookie(value), receipt);
  assert.equal(parseConsentCookie(encodeURIComponent(JSON.stringify({ ...receipt, expiresAt: new Date(Date.now() - 1).toISOString() }))), null);
});

test("custom sections and services survive normalization and retain order", () => {
  const input = structuredClone(DEFAULT_PRIVACY_CONFIG);
  input.privacyPolicy.sections.push({ id: "custom-rights", title: { it: "Titolo", en: "Title" }, body: { it: "Testo", en: "Text" }, enabled: true, sortOrder: 1 });
  input.services.push({ id: "custom-service", name: "Custom", provider: "Provider", category: "preferences", purpose: { it: "Finalita", en: "Purpose" }, storage: "custom_cookie", duration: { it: "30 giorni", en: "30 days" }, policyUrl: "https://example.com/privacy", active: true, sortOrder: 2 });
  const normalized = normalizePrivacyConfig(input);
  assert.equal(normalized.privacyPolicy.sections.some((section) => section.id === "custom-rights"), true);
  assert.equal(normalized.services.some((service) => service.id === "custom-service"), true);
  assert.equal(validatePrivacyConfigInput(normalized).length, 0);
});

test("validation rejects markup, unsafe URLs, duplicates and removal of protected services", () => {
  const markup = structuredClone(DEFAULT_PRIVACY_CONFIG);
  markup.privacyPolicy.sections[0].body.it = "<script>alert(1)</script>";
  assert.match(validatePrivacyConfigInput(markup).join(" "), /HTML/);
  const duplicate = structuredClone(DEFAULT_PRIVACY_CONFIG);
  duplicate.services.push({ ...structuredClone(duplicate.services[0]) });
  assert.match(validatePrivacyConfigInput(duplicate).join(" "), /univoci/);
  const removed = structuredClone(DEFAULT_PRIVACY_CONFIG);
  removed.services = removed.services.filter((service) => service.id !== "privacy-consent");
  assert.match(validatePrivacyConfigInput(removed).join(" "), /protetti/);
  const unsafeUrl = structuredClone(DEFAULT_PRIVACY_CONFIG);
  unsafeUrl.services[0].policyUrl = "javascript:alert(1)";
  assert.match(validatePrivacyConfigInput(unsafeUrl).join(" "), /HTML|Policy URL/);
});

test("disabled categories suppress their services and connectors", () => {
  const input = structuredClone(DEFAULT_PRIVACY_CONFIG);
  input.categories.find((category) => category.id === "analytics")!.enabled = false;
  input.connectors.ga4 = { enabled: true, measurementId: "G-ABCD1234" };
  input.services.push({ id: "analytics-custom", name: "Analytics", provider: "Provider", category: "analytics", purpose: { it: "Statistiche", en: "Statistics" }, storage: "stats", duration: { it: "30 giorni", en: "30 days" }, policyUrl: "https://example.com/privacy", active: true, sortOrder: 2 });
  const normalized = normalizePrivacyConfig(input);
  assert.equal(hasOptionalPrivacyServices(normalized), false);
  assert.equal(getConfiguredPrivacyServices(normalized).some((service) => service.category === "analytics"), false);
});

test("reordering does not invalidate consent", () => {
  const reordered = structuredClone(DEFAULT_PRIVACY_CONFIG);
  reordered.categories.reverse();
  reordered.services.reverse();
  assert.equal(isConsentMaterialChange(DEFAULT_PRIVACY_CONFIG, reordered), false);
});

test("technical service synchronization does not invalidate consent", () => {
  const synchronized = structuredClone(DEFAULT_PRIVACY_CONFIG);
  synchronized.services.find((service) => service.id === "cloudflare-turnstile")!.active = false;
  assert.equal(isConsentMaterialChange(DEFAULT_PRIVACY_CONFIG, synchronized), false);
});
