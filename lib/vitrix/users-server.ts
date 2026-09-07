import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { ManagedUserRole } from "@/lib/vitrix/users-core";

type RoleUpdateResult = { error: PostgrestError | null };

function isMissingRoleFunction(error: PostgrestError): boolean {
  return error.code === "PGRST202" || /schema cache|vitrix_set_single_user_role/i.test(error.message);
}

export async function setSingleManagedUserRole(
  supabase: SupabaseClient,
  userId: string,
  role: ManagedUserRole | null,
): Promise<RoleUpdateResult> {
  const rpcResult = await supabase.rpc("vitrix_set_single_user_role", {
    p_user_id: userId,
    p_role_name: role,
  });

  if (!rpcResult.error) return { error: null };
  if (!isMissingRoleFunction(rpcResult.error)) return { error: rpcResult.error };

  let roleId: string | null = null;
  if (role) {
    const selectedRole = await supabase.from("vitrix_roles").select("id").eq("name", role).single();
    if (selectedRole.error) return { error: selectedRole.error };
    roleId = selectedRole.data.id;
  }

  const deleted = await supabase.from("vitrix_user_roles").delete().eq("user_id", userId);
  if (deleted.error) return { error: deleted.error };
  if (!roleId) return { error: null };

  const inserted = await supabase.from("vitrix_user_roles").insert({ user_id: userId, role_id: roleId });
  return { error: inserted.error };
}
