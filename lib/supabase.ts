import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabaseBrowserConfig = Boolean(supabaseUrl && supabaseAnonKey);

// Client browser (usa anon key - pubblica)
export const supabaseBrowser = hasSupabaseBrowserConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// Server client (usa service role key - segreta)
export const supabaseServer = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  : null;

// Helper per ottenere dati da tabella
export async function getTableData<T>(
  table: string,
  filters?: Record<string, string | number | boolean>,
): Promise<T[]> {
  if (!supabaseBrowser) return [];

  let query = supabaseBrowser.from(table).select("*");

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`);
  return data as T[];
}

// Helper per singola riga
export async function getTableRow<T>(
  table: string,
  id: string | number,
): Promise<T> {
  if (!supabaseBrowser) throw new Error("Supabase browser client is not configured");

  const { data, error } = await supabaseBrowser
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(`Failed to fetch from ${table}: ${error.message}`);
  return data as T;
}

// Auth Functions
export async function signInWithOAuth(provider: "google" | "github") {
  if (!supabaseBrowser) throw new Error("Supabase browser client is not configured");

  const { data, error } = await supabaseBrowser.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw new Error(`OAuth error: ${error.message}`);
  return data;
}

export async function signOut() {
  if (!supabaseBrowser) throw new Error("Supabase browser client is not configured");

  const { error } = await supabaseBrowser.auth.signOut();
  if (error) throw new Error(`Sign out error: ${error.message}`);
}

export async function getSession() {
  if (!supabaseBrowser) return null;

  const {
    data: { session },
    error,
  } = await supabaseBrowser.auth.getSession();
  if (error) throw new Error(`Session error: ${error.message}`);
  return session;
}

export async function getCurrentUser() {
  if (!supabaseBrowser) return null;

  const {
    data: { user },
    error,
  } = await supabaseBrowser.auth.getUser();
  if (error) throw new Error(`User error: ${error.message}`);
  return user;
}
