import { redirect } from "next/navigation";
import { requireVitrixUser } from "@/lib/vitrix/auth";
import { getSupabaseConfig } from "@/lib/supabase/config";

export default async function AdminPage() {
  const config = getSupabaseConfig();
  const user = await requireVitrixUser();

  if (!user && config.isConfigured && process.env.NODE_ENV === "production") {
    redirect("/admin/login");
  }

  redirect("/admin/dashboard");
}
