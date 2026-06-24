"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/admin/forgot-password?error=missing");
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  // Passa da /auth/callback per scambiare il code PKCE e creare la sessione,
  // poi redirige a /admin/reset-password dove updateUser() trova la sessione.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/admin/reset-password`
  });

  // Non rivelare se l'email esiste o meno per sicurezza
  redirect("/admin/forgot-password?sent=1");
}
