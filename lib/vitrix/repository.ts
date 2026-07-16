import { adminModules } from "@/lib/admin-modules";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { listVitrixLogs } from "@/lib/vitrix/logs";
import { DEFAULT_SITE_SETTINGS, getSiteSettings } from "@/lib/vitrix/settings";
import type { VitrixBootstrap, VitrixModuleRow } from "@/lib/vitrix/types";
import type { VitrixUser } from "@/lib/vitrix/auth";
import type { VitrixLicenseState } from "@/lib/vitrix/license";

const DISABLED_LICENSE_STATE: VitrixLicenseState = {
  siteId: process.env.CHIMERA_LICENSE_SITE_ID ?? "",
  status: "active",
  plan: "disabled-runtime",
  enabledModules: ["dashboard", "catalogue", "events", "media", "settings", "widgets"],
  expiresAt: null,
  lastCheckedAt: null,
  lastError: null,
  source: "local",
};

function normalizeModuleRow(row: VitrixModuleRow | (Omit<VitrixModuleRow, "id"> & { id: string })): VitrixModuleRow | null {
  const id = row.id === "press" ? "events" : row.id;
  if (id !== "dashboard" && id !== "catalogue" && id !== "events" && id !== "media" && id !== "settings" && id !== "widgets") {
    return null;
  }
  return {
    ...row,
    id,
    label: id === "events" ? "Eventi" : row.label,
    description: id === "events" ? "Gestione eventi, fiere, press e contenuti editoriali." : row.description,
  };
}

function localModules(): VitrixModuleRow[] {
  return adminModules.map((module, index) => ({
    id: module.id,
    label: module.label,
    description: module.description,
    enabled: module.enabled,
    sort_order: index,
  }));
}

export function getLocalVitrixBootstrap(): VitrixBootstrap {
  return {
    source: "local",
    connected: false,
    license: DISABLED_LICENSE_STATE,
    modules: localModules(),
    settings: DEFAULT_SITE_SETTINGS,
    catalogue: [],
    press: [],
    roles: [
      { id: "superadmin", name: "superadmin", label: "Superadmin Chimera" },
      { id: "owner", name: "owner", label: "Owner" },
      { id: "admin", name: "admin", label: "Amministratore" },
      { id: "editor", name: "editor", label: "Editor" },
      { id: "viewer", name: "viewer", label: "Viewer" },
    ],
    permissions: [
      {
        id: "vitrix.read",
        key: "vitrix.read",
        label: "Accesso al pannello Vitrix",
      },
    ],
    users: [],
  };
}

export async function getVitrixBootstrap(
  _user?: VitrixUser | null,
): Promise<VitrixBootstrap> {
  void _user;
  // ✅ In development, usa fallback locale istantaneamente (dev speed boost)
  if (process.env.NODE_ENV === "development") {
    const settings = await getSiteSettings().catch(() => DEFAULT_SITE_SETTINGS);
    const logs = await listVitrixLogs().catch(() => ({
      open: [],
      resolved: [],
      all: [],
    }));
    return {
      ...getLocalVitrixBootstrap(),
      license: DISABLED_LICENSE_STATE,
      settings,
      logsSummary: { open: logs.open.length, resolved: logs.resolved.length },
    };
  }

  const config = getSupabaseConfig();
  const [settings, logs] = await Promise.all([
    getSiteSettings(),
    listVitrixLogs().catch(() => ({ open: [], resolved: [], all: [] })),
  ]);

  if (!config.hasServiceRole) {
    return {
      ...getLocalVitrixBootstrap(),
      license: DISABLED_LICENSE_STATE,
      settings,
      logsSummary: { open: logs.open.length, resolved: logs.resolved.length },
    };
  }

  try {
    const supabase = createAdminClient();
    const [
      modules,
      catalogue,
      press,
      roles,
      permissions,
      userRoles,
      authUsers,
    ] = await Promise.all([
      supabase
        .from("vitrix_modules")
        .select("id,label,description,enabled,sort_order")
        .order("sort_order"),
      supabase
        .from("catalogue")
        .select(
          "id,translation_group_id,parent_translation_group_id,ref,title,description,category,img_path,img_position,lang,status,sort_order,item_type,parent_id,parure_id,created_at",
        )
        .order("sort_order"),
      supabase
        .from("news")
        .select("id,category,venue,title,event_date,type,lang,status"),
      supabase.from("vitrix_roles").select("id,name,label").order("label"),
      supabase.from("vitrix_permissions").select("id,key,label").order("key"),
      supabase
        .from("vitrix_user_roles")
        .select("user_id, role:vitrix_roles(name)"),
      supabase.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    if (
      modules.error ||
      roles.error ||
      permissions.error ||
      userRoles.error ||
      authUsers.error
    ) {
      return getLocalVitrixBootstrap();
    }

    const roleMap = new Map<string, string[]>();
    userRoles.data?.forEach((row) => {
      const role = row.role as { name?: string } | null;
      if (!role?.name) return;
      roleMap.set(row.user_id, [
        ...(roleMap.get(row.user_id) ?? []),
        role.name,
      ]);
    });

    return {
      source: "supabase",
      connected: true,
      license: DISABLED_LICENSE_STATE,
      settings,
      logsSummary: { open: logs.open.length, resolved: logs.resolved.length },
      modules: ((modules.data ?? []) as (Omit<VitrixModuleRow, "id"> & { id: string })[])
        .map(normalizeModuleRow)
        .filter((module): module is VitrixModuleRow => Boolean(module))
        .filter((module) => module.enabled),
      catalogue: (catalogue.data ?? []) as VitrixBootstrap["catalogue"],
      press: (press.data ?? []) as VitrixBootstrap["press"],
      roles: roles.data,
      permissions: permissions.data,
      users: authUsers.data.users.map((user) => ({
        id: user.id,
        email: user.email ?? "email non disponibile",
        roles: roleMap.get(user.id) ?? [],
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
      })),
    };
  } catch {
    return {
      ...getLocalVitrixBootstrap(),
      license: DISABLED_LICENSE_STATE,
      settings,
      logsSummary: { open: logs.open.length, resolved: logs.resolved.length },
    };
  }
}
