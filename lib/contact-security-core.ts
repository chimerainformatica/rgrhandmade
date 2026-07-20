import { createHash } from "node:crypto";

export function getClientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return headers.get("x-nf-client-connection-ip") || headers.get("cf-connecting-ip") || forwarded || "unknown";
}

export function hashClientIp(ip: string, salt: string) {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function isAllowedContactOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";

  const allowedOrigins = [process.env.NEXT_PUBLIC_SITE_URL, process.env.CONTACT_ALLOWED_ORIGINS]
    .filter(Boolean)
    .flatMap((value) => value!.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return allowedOrigins.includes(origin);
}
