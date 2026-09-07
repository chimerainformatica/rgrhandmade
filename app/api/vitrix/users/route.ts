import { NextResponse } from "next/server";
import { isAllowedContactOrigin } from "@/lib/contact-security";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import {
  canAccessUserManagement,
  canAssignManagedRole,
  getManagedUserErrorStatus,
  parseCreateManagedUserInput,
  toManagedUserRow,
  type ManagedUserRole,
} from "@/lib/vitrix/users-core";
import { setSingleManagedUserRole } from "@/lib/vitrix/users-server";

export const dynamic = "force-dynamic";

function serviceUnavailable() {
  return NextResponse.json({ error: "Supabase service role non configurato." }, { status: 503 });
}

export async function GET() {
  const guard = await requireVitrixApiPermission("users.manage");
  if ("response" in guard) return guard.response;
  if (!guard.user || !canAccessUserManagement(guard.user.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!getSupabaseConfig().hasServiceRole) return serviceUnavailable();

  const supabase = createAdminClient();
  const [authUsers, userRoles] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase.from("vitrix_user_roles").select("user_id, role:vitrix_roles(name)"),
  ]);

  if (authUsers.error || userRoles.error) {
    return NextResponse.json({ error: authUsers.error?.message ?? userRoles.error?.message ?? "Impossibile caricare gli utenti." }, { status: 500 });
  }

  const roles = new Map<string, ManagedUserRole>();
  userRoles.data?.forEach((entry) => {
    const role = entry.role as { name?: ManagedUserRole } | null;
    if (role?.name && !roles.has(entry.user_id)) roles.set(entry.user_id, role.name);
  });

  const users = authUsers.data.users
    .map((user) => toManagedUserRow(user, roles.get(user.id) ?? null))
    .sort((left, right) => left.email.localeCompare(right.email, "it"));

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  if (!isAllowedContactOrigin(request)) {
    return NextResponse.json({ error: "Origine non autorizzata." }, { status: 403 });
  }

  const guard = await requireVitrixApiPermission("users.manage");
  if ("response" in guard) return guard.response;
  if (!guard.user || !canAccessUserManagement(guard.user.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!getSupabaseConfig().hasServiceRole) return serviceUnavailable();

  const parsed = parseCreateManagedUserInput(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!canAssignManagedRole(guard.user.roles, parsed.value.role)) {
    return NextResponse.json({ error: "Non puoi assegnare questo ruolo." }, { status: 403 });
  }

  const supabase = createAdminClient();
  const created = await supabase.auth.admin.createUser({
    email: parsed.value.email,
    password: parsed.value.password!,
    email_confirm: true,
  });

  if (created.error || !created.data.user) {
    return NextResponse.json(
      { error: created.error?.message ?? "Creazione utente non riuscita." },
      { status: getManagedUserErrorStatus(created.error) },
    );
  }

  const roleResult = await setSingleManagedUserRole(supabase, created.data.user.id, parsed.value.role);

  if (roleResult.error) {
    await supabase.auth.admin.deleteUser(created.data.user.id);
    return NextResponse.json({ error: "Creazione annullata: assegnazione ruolo non riuscita." }, { status: 500 });
  }

  return NextResponse.json({ user: toManagedUserRow(created.data.user, parsed.value.role) }, { status: 201 });
}
