import assert from "node:assert/strict";
import test from "node:test";

type ConfigModule = typeof import("./config");

async function loadConfig(): Promise<Partial<ConfigModule>> {
  return import("./config").catch(() => ({}));
}

test("il modulo e inerte senza license id", async () => {
  delete process.env.NEXT_PUBLIC_LEGALBLINK_LICENSE_ID;
  delete process.env.NEXT_PUBLIC_LEGALBLINK_DOCUMENT_SET_ID;
  const mod = await loadConfig();

  assert.equal(mod.isLegalBlinkEnabled?.(), false);
  assert.equal(mod.getLoaderAttributes?.(), null);
  assert.equal(mod.getDocumentUrl?.("privacy", "it"), null);
});

test("costruisce gli attributi del loader quando la licenza e presente", async () => {
  process.env.NEXT_PUBLIC_LEGALBLINK_LICENSE_ID = "test-license";
  const mod = await loadConfig();

  assert.deepEqual(mod.getLoaderAttributes?.(), {
    src: "https://app.legalblink.it/api/scripts/cmp/loader.js",
    licenseId: "test-license",
    blockingMode: "auto",
    consentMode: "true",
  });
});

test("costruisce gli URL dei documenti per lingua", async () => {
  process.env.NEXT_PUBLIC_LEGALBLINK_DOCUMENT_SET_ID = "set-123";
  const mod = await loadConfig();
  const base = "https://app.legalblink.it/api/documents/set-123";

  assert.equal(
    mod.getDocumentUrl?.("privacy", "it"),
    `${base}/privacy-policy-per-siti-web-o-e-commerce-it`,
  );
  assert.equal(mod.getDocumentUrl?.("cookie", "en"), `${base}/cookie-policy-en`);
});

test("codifica l'apostrofo nello slug delle condizioni d'uso", async () => {
  process.env.NEXT_PUBLIC_LEGALBLINK_DOCUMENT_SET_ID = "set-123";
  const mod = await loadConfig();

  const url = mod.getDocumentUrl?.("terms", "it");
  assert.ok(url?.includes("condizioni-d%27uso-del-sito-it"), url);
  assert.ok(!url?.includes("'"), "l'apostrofo grezzo non deve comparire nell'URL");
});

test("nessun documento pubblicabile punta al DSAR, che e a uso interno", async () => {
  process.env.NEXT_PUBLIC_LEGALBLINK_DOCUMENT_SET_ID = "set-123";
  const mod = await loadConfig();

  // Il DSAR di LegalBlink e il modulo con cui il titolare gestisce una singola
  // richiesta ricevuta: contiene i dati del richiedente e valutazioni interne.
  // Nessuna rotta pubblica deve poterlo servire.
  for (const doc of ["privacy", "cookie", "terms"] as const) {
    for (const lang of ["it", "en"] as const) {
      const url = mod.getDocumentUrl?.(doc, lang);
      assert.ok(url, `${doc}/${lang} deve produrre un URL`);
      assert.ok(!url.includes("dsar"), `${doc}/${lang} non deve puntare al DSAR: ${url}`);
    }
  }
});
