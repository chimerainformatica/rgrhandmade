import type { VitrixRole } from "@/lib/vitrix/auth";

export const MANAGED_USER_ROLES = ["superadmin", "owner", "admin", "editor", "viewer"] as const;

export type ManagedUserRole = (typeof MANAGED_USER_ROLES)[number];

export type ManagedUserInput = {
  email: string;
  password?: string;
  role: ManagedUserRole;
};

export type ManagedUserInputResult =
  | { ok: true; value: ManagedUserInput }
  | { ok: false; error: string };

export type ManagedUserRow = {
  id: string;
  email: string;
  role: ManagedUserRole | null;
  roles: ManagedUserRole[];
  enabled: boolean;
  created_at: string | null;
  last_sign_in_at: string | null;
  banned_until: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isManagedUserRole(value: unknown): value is ManagedUserRole {
  return typeof value === "string" && MANAGED_USER_ROLES.includes(value as ManagedUserRole);
}

function parseBaseInput(input: unknown, requirePassword: boolean): ManagedUserInputResult {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Dati utente non validi." };
  }

  const record = input as Record<string, unknown>;
  const email = typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const password = typeof record.password === "string" ? record.password : "";

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Inserisci un indirizzo e-mail valido." };
  }
  if ((requirePassword || password.length > 0) && password.length < 8) {
    return { ok: false, error: "La password deve contenere almeno 8 caratteri." };
  }
  if (!isManagedUserRole(record.role)) {
    return { ok: false, error: "Ruolo utente non valido." };
  }

  return {
    ok: true,
    value: {
      email,
      ...(password ? { password } : {}),
      role: record.role,
    },
  };
}

export function parseCreateManagedUserInput(input: unknown): ManagedUserInputResult {
  return parseBaseInput(input, true);
}

export function parseUpdateManagedUserInput(input: unknown): ManagedUserInputResult {
  return parseBaseInput(input, false);
}

export function isManagedUserDisabled(bannedUntil: string | null | undefined, now = new Date()): boolean {
  if (!bannedUntil) return false;
  const bannedUntilTimestamp = Date.parse(bannedUntil);
  return Number.isFinite(bannedUntilTimestamp) && bannedUntilTimestamp > now.getTime();
}

export function canAccessUserManagement(roles: readonly VitrixRole[]): boolean {
  return roles.includes("superadmin") || roles.includes("owner");
}

export function canAssignManagedRole(actorRoles: readonly VitrixRole[], role: ManagedUserRole): boolean {
  if (actorRoles.includes("superadmin")) return true;
  return actorRoles.includes("owner") && (role === "admin" || role === "editor" || role === "viewer");
}

export function canManageTargetUser(
  actorRoles: readonly VitrixRole[],
  actorId: string,
  target: { id: string; roles: readonly string[] },
): boolean {
  if (actorId === target.id) return false;
  if (actorRoles.includes("superadmin")) return true;
  if (!actorRoles.includes("owner")) return false;
  return !target.roles.some((role) => role === "owner" || role === "superadmin");
}

export function parseManagedUserStatusInput(input: unknown):
  | { ok: true; value: { enabled: boolean } }
  | { ok: false; error: string } {
  if (!input || typeof input !== "object" || typeof (input as Record<string, unknown>).enabled !== "boolean") {
    return { ok: false, error: "Stato utente non valido." };
  }
  return { ok: true, value: { enabled: (input as { enabled: boolean }).enabled } };
}

export function toManagedUserRow(
  user: {
    id: string;
    email?: string;
    created_at?: string;
    last_sign_in_at?: string | null;
    banned_until?: string | null;
  },
  role: ManagedUserRole | null,
  now = new Date(),
): ManagedUserRow {
  const bannedUntil = user.banned_until ?? null;
  return {
    id: user.id,
    email: user.email ?? "e-mail non disponibile",
    role,
    roles: role ? [role] : [],
    enabled: !isManagedUserDisabled(bannedUntil, now),
    created_at: user.created_at ?? null,
    last_sign_in_at: user.last_sign_in_at ?? null,
    banned_until: bannedUntil,
  };
}

export function isManagedUserId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function getManagedUserErrorStatus(error: { code?: string; message?: string; status?: number } | null | undefined): number {
  const duplicate = error?.code === "email_exists" || error?.code === "user_already_exists" || /already exists|already registered/i.test(error?.message ?? "");
  return duplicate ? 409 : 500;
}
