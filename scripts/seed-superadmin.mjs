import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");

    if (!process.env[key]) process.env[key] = value;
  }
}

async function findUserByEmail(supabase, email) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  loadDotEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = (process.env.VITRIX_SUPERADMIN_EMAIL || "l.santos@chimerainformatica.com").trim().toLowerCase();
  const password = process.env.VITRIX_SUPERADMIN_PASSWORD;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!password) {
    throw new Error(
      "Missing VITRIX_SUPERADMIN_PASSWORD. Le credenziali non stanno piu nei file .env: passale inline\n" +
      "  VITRIX_SUPERADMIN_EMAIL=... VITRIX_SUPERADMIN_PASSWORD=... npm run seed:superadmin"
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const existingUser = await findUserByEmail(supabase, email);
  const userResult = existingUser
    ? await supabase.auth.admin.updateUserById(existingUser.id, { password, email_confirm: true })
    : await supabase.auth.admin.createUser({ email, password, email_confirm: true });

  if (userResult.error) throw userResult.error;

  const userId = userResult.data.user.id;
  const { data: role, error: roleError } = await supabase
    .from("vitrix_roles")
    .select("id")
    .eq("name", "superadmin")
    .single();

  if (roleError) throw roleError;

  const { error: assignError } = await supabase
    .from("vitrix_user_roles")
    .upsert({ user_id: userId, role_id: role.id }, { onConflict: "user_id,role_id" });

  if (assignError) throw assignError;

  console.log(`Superadmin ready: ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
