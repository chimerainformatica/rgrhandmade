"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeAdminPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/admin";
  if (!value.startsWith("/") || value.startsWith("//")) return "/admin";
  if (!value.startsWith("/admin")) return "/admin";
  if (value.startsWith("/admin/login")) return "/admin";
  return value;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeAdminPath(formData.get("next"));

  if (!email || !password) {
    redirect("/admin/login?error=missing");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/admin/login?error=invalid");
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
