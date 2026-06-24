"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!password || password.length < 8) {
    redirect("/admin/reset-password?error=short");
  }

  if (password !== confirm) {
    redirect("/admin/reset-password?error=mismatch");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/admin/reset-password?error=failed");
  }

  redirect("/admin/login?reset=1");
}
