import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { AdminModuleId } from "@/lib/admin-modules";

export type VitrixLicenseStatus = "active" | "trial" | "expired" | "suspended" | "missing";

export type VitrixLicenseState = {
  siteId: string;
  status: VitrixLicenseStatus;
  plan: string | null;
  enabledModules: AdminModuleId[];
  expiresAt: string | null;
  lastCheckedAt: string | null;
  lastError: string | null;
  source: "remote" | "cache" | "local";
};

type LicenseResponse = {
  status?: string;
  plan?: string | null;
  enabledModules?: string[];
  expiresAt?: string | null;
};

const ACTIVE_STATUSES: VitrixLicenseStatus[] = ["active", "trial"];
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const ADMIN_MODULE_IDS = ["dashboard", "catalogue", "events", "media", "settings", "widgets"];

function getLicenseConfig() {
  return {
    apiUrl: process.env.CHIMERA_LICENSE_API_URL,
    siteId: process.env.CHIMERA_LICENSE_SITE_ID ?? "",
    secret: process.env.CHIMERA_LICENSE_SECRET,
    domain: process.env.NEXT_PUBLIC_SITE_URL ?? ""
  };
}

function emptyLicense(lastError: string | null, source: VitrixLicenseState["source"] = "local"): VitrixLicenseState {
  return {
    siteId: getLicenseConfig().siteId,
    status: "missing",
    plan: null,
    enabledModules: [],
    expiresAt: null,
    lastCheckedAt: null,
    lastError,
    source
  };
}

function normalizeStatus(value: unknown): VitrixLicenseStatus {
  if (value === "active" || value === "trial" || value === "expired" || value === "suspended" || value === "missing") {
    return value;
  }
  return "missing";
}

function normalizeModules(value: unknown): AdminModuleId[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((module) => String(module) === "press" ? "events" : String(module))
    .filter((module): module is AdminModuleId => ADMIN_MODULE_IDS.includes(module));
}

function signatureFor(payload: { siteId: string; domain: string; timestamp: string }, secret: string) {
  return createHmac("sha256", secret)
    .update(`${payload.siteId}.${payload.domain}.${payload.timestamp}`)
    .digest("hex");
}

function hasUnexpiredAccess(license: Pick<VitrixLicenseState, "status" | "expiresAt">) {
  if (!ACTIVE_STATUSES.includes(license.status)) return false;
  if (!license.expiresAt) return true;
  return new Date(license.expiresAt).getTime() > Date.now();
}

function isFreshCache(license: Pick<VitrixLicenseState, "lastCheckedAt">) {
  if (!license.lastCheckedAt) return false;
  return Date.now() - new Date(license.lastCheckedAt).getTime() <= CACHE_TTL_MS;
}

async function readCachedLicense(): Promise<VitrixLicenseState | null> {
  const config = getSupabaseConfig();

  if (!config.hasServiceRole) return null;

  try {
    const { siteId } = getLicenseConfig();
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("vitrix_license_state").select("*").eq("site_id", siteId).maybeSingle();

    if (error || !data) return null;

    return {
      siteId: data.site_id,
      status: normalizeStatus(data.status),
      plan: data.plan ?? null,
      enabledModules: normalizeModules(data.enabled_modules),
      expiresAt: data.expires_at ?? null,
      lastCheckedAt: data.last_checked_at ?? null,
      lastError: data.last_error ?? null,
      source: "cache"
    };
  } catch {
    return null;
  }
}

async function writeCachedLicense(license: VitrixLicenseState) {
  const config = getSupabaseConfig();

  if (!config.hasServiceRole) return;

  try {
    const supabase = createAdminClient();
    await supabase.from("vitrix_license_state").upsert(
      {
        site_id: license.siteId,
        status: license.status,
        plan: license.plan,
        enabled_modules: license.enabledModules,
        expires_at: license.expiresAt,
        last_checked_at: license.lastCheckedAt,
        last_error: license.lastError,
        updated_at: new Date().toISOString()
      },
      { onConflict: "site_id" }
    );
  } catch {
    // non bloccante — cache write failure non deve fermare l'app
  }
}

export function isLicenseValidForCustomer(license: VitrixLicenseState) {
  return hasUnexpiredAccess(license);
}

export function canAccessVitrixWithLicense(userPermissions: string[], license: VitrixLicenseState) {
  if (userPermissions.includes("vitrix.superadmin")) return true;
  return isLicenseValidForCustomer(license);
}

export function isModuleLicensed(moduleId: AdminModuleId, license: VitrixLicenseState, userPermissions: string[]) {
  if (userPermissions.includes("vitrix.superadmin")) return true;
  if (!isLicenseValidForCustomer(license)) return false;
  return license.enabledModules.includes(moduleId);
}

export async function getLicenseStatus(): Promise<VitrixLicenseState> {
  const config = getLicenseConfig();
  const cached = await readCachedLicense();

  // ✅ In development, usa cache senza fetch remoto (velocissimo)
  if (process.env.NODE_ENV === "development" && cached) {
    return cached;
  }

  if (!config.apiUrl || !config.secret) {
    if (cached && hasUnexpiredAccess(cached)) return cached;
    return emptyLicense("Licenza Chimera non configurata.");
  }

  const timestamp = new Date().toISOString();
  const payload = {
    siteId: config.siteId,
    domain: config.domain,
    timestamp,
    signature: signatureFor({ siteId: config.siteId, domain: config.domain, timestamp }, config.secret)
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(`${config.apiUrl.replace(/\/$/, "")}/api/licenses/verify`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`License server returned ${response.status}`);
    }

    const body = (await response.json()) as LicenseResponse;
    const remote: VitrixLicenseState = {
      siteId: config.siteId,
      status: normalizeStatus(body.status),
      plan: body.plan ?? null,
      enabledModules: normalizeModules(body.enabledModules),
      expiresAt: body.expiresAt ?? null,
      lastCheckedAt: timestamp,
      lastError: null,
      source: "remote"
    };

    await writeCachedLicense(remote);
    return remote;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore verifica licenza.";

    if (cached && hasUnexpiredAccess(cached) && isFreshCache(cached)) {
      return {
        ...cached,
        lastError: message
      };
    }

    const missing = emptyLicense(message, cached ? "cache" : "local");
    await writeCachedLicense(missing);
    return missing;
  }
}

export function verifyLicenseWebhookSignature(
  payload: { siteId: string; domain: string; timestamp: string },
  signature: string,
  secret: string
) {
  const expected = signatureFor(payload, secret);
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);
}
