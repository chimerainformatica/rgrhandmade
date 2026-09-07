import { notFound, redirect } from "next/navigation";
import { AdminApp } from "@/components/admin/AdminApp";
import { requireVitrixUser } from "@/lib/vitrix/auth";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getVitrixBootstrap } from "@/lib/vitrix/repository";
import { getDefaultAdminModuleId, isAdminModuleId } from "@/lib/admin-modules";
import { canAccessUserManagement } from "@/lib/vitrix/users-core";

export default async function AdminModulePage({ params }: { params: Promise<{ module: string }> }) {
  const config = getSupabaseConfig();
  const user = await requireVitrixUser();
  const { module } = await params;

  if (!user && config.isConfigured && process.env.NODE_ENV === "production") {
    redirect("/admin/login");
  }

  if (module === "press") {
    redirect("/admin/events");
  }

  if (!isAdminModuleId(module)) {
    if (module === "") {
      redirect(`/admin/${getDefaultAdminModuleId()}`);
    }
    notFound();
  }

  if (module === "users" && (!user || !canAccessUserManagement(user.roles))) {
    notFound();
  }

  const bootstrap = await getVitrixBootstrap(user);
  return <AdminApp user={user} bootstrap={bootstrap} initialModule={module} />;
}
