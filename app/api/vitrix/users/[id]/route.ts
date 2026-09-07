import { NextResponse } from "next/server";
import { isAllowedContactOrigin } from "@/lib/contact-security";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { requireVitrixApiPermission } from "@/lib/vitrix/api";
import {
  canAccessUserManagement,
  canAssignManagedRole,
  canManageTargetUser,
  getManagedUserErrorStatus,
  isManagedUserId,
  parseManagedUserStatusInput,
  parseUpdateManagedUserInput,
  toManagedUserRow,
  type ManagedUserRole,
} from "@/lib/vitrix/users-core";
import { setSingleManagedUserRole } from "@/lib/vitrix/users-server";

type RouteContext = { params: Promise<{ id: string }> };

async function authorizeTarget(id: string) {
  const guard = await requireVitrixApiPermission("users.manage");
  if ("response" in guard) return { response: guard.response };
  if (!guard.user || !canAccessUserManagement(guard.user.roles)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (!getSupabaseConfig().hasServiceRole) {
    return { response: NextResponse.json({ error: "Supabase service role non configurato." }, { status: 503 }) };
  }
  if (!isManagedUserId(id)) {
    return { response: NextResponse.json({ error: "Identificativo utente non valido." }, { status: 400 }) };
  }

  const supabase = createAdminClient();
  const [authUser, roleRows] = await Promise.all([
    supabase.auth.admin.getUserById(id),
    supabase.from("vitrix_user_roles").select("role:vitrix_roles(name)").eq("user_id", id),
  ]);

  if (authUser.error || !authUser.data.user) {
    return { response: NextResponse.json({ error: "Utente non trovato." }, { status: 404 }) };
  }
  if (roleRows.error) {
    return { response: NextResponse.json({ error: roleRows.error.message }, { status: 500 }) };
  }

  const roles = (roleRows.data ?? [])
    .map((entry) => (entry.role as { name?: ManagedUserRole } | null)?.name)
    .filter((role): role is ManagedUserRole => Boolean(role));

  if (!canManageTargetUser(guard.user.roles, guard.user.id, { id, roles })) {
    return { response: NextResponse.json({ error: "Non puoi modificare questo utente." }, { status: 403 }) };
  }

  return { supabase, actor: guard.user, authUser: authUser.data.user, role: roles[0] ?? null };
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isAllowedContactOrigin(request)) {
    return NextResponse.json({ error: "Origine non autorizzata." }, { status: 403 });
  }

  const { id } = await context.params;
  const authorized = await authorizeTarget(id);
  if ("response" in authorized) return authorized.response;

  const body = await request.json().catch(() => null);
  if (body && typeof body === "object" && "enabled" in body) {
    const parsedStatus = parseManagedUserStatusInput(body);
    if (!parsedStatus.ok) return NextResponse.json({ error: parsedStatus.error }, { status: 400 });

    const result = await authorized.supabase.auth.admin.updateUserById(id, {
      ban_duration: parsedStatus.value.enabled ? "none" : "876000h",
    });
    if (result.error || !result.data.user) {
      return NextResponse.json({ error: result.error?.message ?? "Aggiornamento stato non riuscito." }, { status: 500 });
    }
    return NextResponse.json({ user: toManagedUserRow(result.data.user, authorized.role) });
  }

  const parsed = parseUpdateManagedUserInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!canAssignManagedRole(authorized.actor.roles, parsed.value.role)) {
    return NextResponse.json({ error: "Non puoi assegnare questo ruolo." }, { status: 403 });
  }

  const roleChanged = parsed.value.role !== authorized.role;
  if (roleChanged) {
    const roleResult = await setSingleManagedUserRole(authorized.supabase, id, parsed.value.role);
    if (roleResult.error) {
      return NextResponse.json({ error: "Aggiornamento ruolo non riuscito." }, { status: 500 });
    }
  }

  const updated = await authorized.supabase.auth.admin.updateUserById(id, {
    email: parsed.value.email,
    email_confirm: true,
    ...(parsed.value.password ? { password: parsed.value.password } : {}),
  });

  if (updated.error || !updated.data.user) {
    if (roleChanged) {
      await setSingleManagedUserRole(authorized.supabase, id, authorized.role);
    }
    return NextResponse.json(
      { error: updated.error?.message ?? "Aggiornamento utente non riuscito." },
      { status: getManagedUserErrorStatus(updated.error) },
    );
  }

  return NextResponse.json({ user: toManagedUserRow(updated.data.user, parsed.value.role) });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isAllowedContactOrigin(request)) {
    return NextResponse.json({ error: "Origine non autorizzata." }, { status: 403 });
  }

  const { id } = await context.params;
  const authorized = await authorizeTarget(id);
  if ("response" in authorized) return authorized.response;

  const deleted = await authorized.supabase.auth.admin.deleteUser(id);
  if (deleted.error) {
    return NextResponse.json({ error: deleted.error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
