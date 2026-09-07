import assert from "node:assert/strict";
import test from "node:test";

type UsersCoreModule = typeof import("./users-core");

async function loadUsersCore(): Promise<Partial<UsersCoreModule>> {
  return import("./users-core").catch(() => ({}));
}

test("normalizes valid user creation data", async () => {
  const core = await loadUsersCore();

  assert.deepEqual(
    core.parseCreateManagedUserInput?.({
      email: "  Editor@Example.COM ",
      password: "password-temporanea",
      role: "editor",
    }),
    {
      ok: true,
      value: {
        email: "editor@example.com",
        password: "password-temporanea",
        role: "editor",
      },
    },
  );
});

test("rejects invalid creation data", async () => {
  const core = await loadUsersCore();

  assert.deepEqual(core.parseCreateManagedUserInput?.({ email: "non-email", password: "breve", role: "editor" }), {
    ok: false,
    error: "Inserisci un indirizzo e-mail valido.",
  });
  assert.deepEqual(core.parseCreateManagedUserInput?.({ email: "viewer@example.com", password: "password-temporanea", role: "root" }), {
    ok: false,
    error: "Ruolo utente non valido.",
  });
});

test("accepts an optional password when updating a user", async () => {
  const core = await loadUsersCore();

  assert.deepEqual(core.parseUpdateManagedUserInput?.({ email: "OWNER@example.com", password: "", role: "owner" }), {
    ok: true,
    value: { email: "owner@example.com", role: "owner" },
  });
  assert.deepEqual(core.parseUpdateManagedUserInput?.({ email: "owner@example.com", password: "short", role: "owner" }), {
    ok: false,
    error: "La password deve contenere almeno 8 caratteri.",
  });
});

test("derives disabled state only from a future ban", async () => {
  const core = await loadUsersCore();
  const now = new Date("2026-08-04T10:00:00.000Z");

  assert.equal(core.isManagedUserDisabled?.("2126-08-04T10:00:00.000Z", now), true);
  assert.equal(core.isManagedUserDisabled?.("2025-08-04T10:00:00.000Z", now), false);
  assert.equal(core.isManagedUserDisabled?.(null, now), false);
});

test("allows only owners and superadmins to access user management", async () => {
  const core = await loadUsersCore();

  assert.equal(core.canAccessUserManagement?.(["owner"]), true);
  assert.equal(core.canAccessUserManagement?.(["superadmin"]), true);
  assert.equal(core.canAccessUserManagement?.(["admin"]), false);
});

test("enforces the protected user hierarchy", async () => {
  const core = await loadUsersCore();

  assert.equal(core.canManageTargetUser?.(["owner"], "actor", { id: "viewer", roles: ["viewer"] }), true);
  assert.equal(core.canManageTargetUser?.(["owner"], "actor", { id: "owner", roles: ["owner"] }), false);
  assert.equal(core.canManageTargetUser?.(["owner"], "actor", { id: "super", roles: ["superadmin"] }), false);
  assert.equal(core.canManageTargetUser?.(["superadmin"], "actor", { id: "owner", roles: ["owner"] }), true);
  assert.equal(core.canManageTargetUser?.(["superadmin"], "actor", { id: "actor", roles: ["viewer"] }), false);

  assert.equal(core.canAssignManagedRole?.(["owner"], "admin"), true);
  assert.equal(core.canAssignManagedRole?.(["owner"], "owner"), false);
  assert.equal(core.canAssignManagedRole?.(["superadmin"], "superadmin"), true);
});

test("normalizes the explicit enabled state payload", async () => {
  const core = await loadUsersCore();

  assert.deepEqual(core.parseManagedUserStatusInput?.({ enabled: false }), { ok: true, value: { enabled: false } });
  assert.deepEqual(core.parseManagedUserStatusInput?.({ enabled: "false" }), {
    ok: false,
    error: "Stato utente non valido.",
  });
});

test("maps an auth user and its single role to the API contract", async () => {
  const core = await loadUsersCore();

  assert.deepEqual(
    core.toManagedUserRow?.(
      {
        id: "user-id",
        email: "user@example.com",
        created_at: "2026-08-01T10:00:00.000Z",
        last_sign_in_at: null,
        banned_until: "2126-08-01T10:00:00.000Z",
      },
      "editor",
      new Date("2026-08-04T10:00:00.000Z"),
    ),
    {
      id: "user-id",
      email: "user@example.com",
      role: "editor",
      roles: ["editor"],
      enabled: false,
      created_at: "2026-08-01T10:00:00.000Z",
      last_sign_in_at: null,
      banned_until: "2126-08-01T10:00:00.000Z",
    },
  );
});

test("maps duplicate auth errors to conflict and validates user identifiers", async () => {
  const core = await loadUsersCore();

  assert.equal(core.getManagedUserErrorStatus?.({ code: "email_exists", status: 422 }), 409);
  assert.equal(core.getManagedUserErrorStatus?.({ message: "A user with this email already exists" }), 409);
  assert.equal(core.getManagedUserErrorStatus?.({ status: 503 }), 500);
  assert.equal(core.isManagedUserId?.("f6f3cb44-8447-4e77-96e7-741134955957"), true);
  assert.equal(core.isManagedUserId?.("not-a-user-id"), false);
});
