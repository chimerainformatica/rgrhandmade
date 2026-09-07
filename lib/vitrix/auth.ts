import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { isManagedUserDisabled } from "@/lib/vitrix/users-core";

export type VitrixRole = "superadmin" | "owner" | "admin" | "editor" | "viewer";

export type VitrixUser = {
  id: string;
  email: string;
  roles: VitrixRole[];
  permissions: string[];
};

export async function getCurrentVitrixUser(): Promise<VitrixUser | null> {
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user?.email || isManagedUserDisabled(user.banned_until)) {
    return null;
  }

  if (!config.hasServiceRole) {
    return {
      id: user.id,
      email: user.email,
      roles: ["viewer"],
      permissions: ["vitrix.read"]
    };
  }

  const admin = createAdminClient();
  const { data: roleRows } = await admin
    .from("vitrix_user_roles")
    .select("role:vitrix_roles(name, vitrix_role_permissions(permission:vitrix_permissions(key)))")
    .eq("user_id", user.id);

  const roles = new Set<VitrixRole>();
  const permissions = new Set<string>();

  roleRows?.forEach((row) => {
    const role = row.role as { name?: VitrixRole; vitrix_role_permissions?: Array<{ permission?: { key?: string } }> } | null;
    if (role?.name) roles.add(role.name);
    role?.vitrix_role_permissions?.forEach((entry) => {
      if (entry.permission?.key) permissions.add(entry.permission.key);
    });
  });

  return {
    id: user.id,
    email: user.email,
    roles: Array.from(roles),
    permissions: Array.from(permissions)
  };
}

export async function requireVitrixUser(requiredPermission = "vitrix.read") {
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    return null;
  }

  const user = await getCurrentVitrixUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (!user.permissions.includes(requiredPermission)) {
    redirect("/admin/login?error=forbidden");
  }

  return user;
}
