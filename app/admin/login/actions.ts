"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { SignInState } from "@/app/admin/login/state";

// NOTA: questo file e "use server", quindi puo esportare SOLO funzioni async.
// Tipi e costanti stanno in ./state.ts — vedi il commento li.

function safeAdminPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/admin";
  if (!value.startsWith("/") || value.startsWith("//")) return "/admin";
  if (!value.startsWith("/admin")) return "/admin";
  if (value.startsWith("/admin/login")) return "/admin";
  return value;
}

/**
 * Traduce l'errore Supabase in un messaggio utile.
 * Distingue i problemi di configurazione (chiavi errate) da quelli di credenziali:
 * entrambi arrivano qui, ma richiedono azioni opposte da parte di chi legge.
 */
function describeAuthError(error: { message?: string; status?: number; code?: string }): string {
  const message = error.message ?? "";
  const status = error.status ?? 0;
  const code = error.code ?? "";

  if (status === 401 || /invalid api key/i.test(message)) {
    return "Configurazione non valida: la chiave Supabase dell'ambiente e errata o revocata. Le credenziali non sono state verificate.";
  }
  if (status === 429 || code === "over_request_rate_limit") {
    return "Troppi tentativi di accesso. Attendi qualche minuto e riprova.";
  }
  if (code === "email_not_confirmed") {
    return "Email non confermata. Conferma l'indirizzo prima di accedere.";
  }
  if (code === "invalid_credentials" || status === 400) {
    return "Email o password non corrette.";
  }
  if (status >= 500) {
    return "Servizio di autenticazione non raggiungibile. Riprova tra poco.";
  }
  return message || "Accesso non riuscito. Riprova.";
}

export async function signIn(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeAdminPath(formData.get("next"));

  if (!email || !password) {
    return { error: "Inserisci email e password." };
  }

  if (!getSupabaseConfig().isConfigured) {
    return { error: "Supabase non e configurato per questo ambiente. Controlla le variabili NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: describeAuthError(error) };
    }
  } catch {
    // Errori di rete o client Supabase non inizializzabile: senza questo catch
    // l'utente vedrebbe la error page di Next invece di un messaggio nel form.
    // redirect() sta fuori dal try, quindi qui non passa mai la sua eccezione.
    return { error: "Impossibile contattare il servizio di autenticazione. Verifica la connessione e riprova." };
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
