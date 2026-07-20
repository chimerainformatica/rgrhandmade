import "server-only";

export { getClientIp, hashClientIp, isAllowedContactOrigin } from "@/lib/contact-security-core";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const CONTACT_RATE_LIMIT = {
  maxRequests: 5,
  windowSeconds: 60 * 60,
} as const;

type TurnstileVerification = {
  success?: boolean;
};

export async function verifyTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { configured: false, valid: false };

  const body = new URLSearchParams({ secret, response: token });
  if (ip !== "unknown") body.set("remoteip", ip);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8_000),
    });
    const result = (await response.json()) as TurnstileVerification;
    return { configured: true, valid: response.ok && result.success === true };
  } catch {
    return { configured: true, valid: false };
  }
}
