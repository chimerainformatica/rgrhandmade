import assert from "node:assert/strict";
import test from "node:test";
import { getClientIp, hashClientIp, isAllowedContactOrigin } from "@/lib/contact-security-core";

test("uses the provider IP header before a forwarded header", () => {
  const headers = new Headers({
    "x-nf-client-connection-ip": "203.0.113.10",
    "x-forwarded-for": "198.51.100.10, 198.51.100.11",
  });

  assert.equal(getClientIp(headers), "203.0.113.10");
});

test("hashes client IPs deterministically without exposing the original value", () => {
  const hash = hashClientIp("203.0.113.10", "test-salt");

  assert.equal(hash.length, 64);
  assert.notEqual(hash, "203.0.113.10");
  assert.equal(hash, hashClientIp("203.0.113.10", "test-salt"));
  assert.notEqual(hash, hashClientIp("203.0.113.10", "another-salt"));
});

test("accepts only configured browser origins in production", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const previousAdditionalOrigins = process.env.CONTACT_ALLOWED_ORIGINS;
  const environment = process.env as Record<string, string | undefined>;
  environment.NODE_ENV = "production";
  process.env.NEXT_PUBLIC_SITE_URL = "https://www.rgrhandmade.it";
  process.env.CONTACT_ALLOWED_ORIGINS = "https://deploy-preview-1--rgr.netlify.app";

  try {
    assert.equal(isAllowedContactOrigin(new Request("https://www.rgrhandmade.it/api/contact", { headers: { origin: "https://www.rgrhandmade.it" } })), true);
    assert.equal(isAllowedContactOrigin(new Request("https://www.rgrhandmade.it/api/contact", { headers: { origin: "https://attacker.example" } })), false);
    assert.equal(isAllowedContactOrigin(new Request("https://www.rgrhandmade.it/api/contact")), false);
  } finally {
    environment.NODE_ENV = previousNodeEnv;
    process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
    process.env.CONTACT_ALLOWED_ORIGINS = previousAdditionalOrigins;
  }
});
