import type { ReactNode } from "react";
import { headers } from "next/headers";
import BoltIcon from "@mui/icons-material/Bolt";
import ExtensionIcon from "@mui/icons-material/Extension";
import SecurityIcon from "@mui/icons-material/Security";
import { Box, Stack, Typography } from "@mui/material";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { VitrixLogo } from "@/components/admin/VitrixLogo";
import { getSupabaseConfig } from "@/lib/supabase/config";

const successMessages: Record<string, string> = {
  "1": "Password reimpostata con successo. Accedi con la nuova password."
};

/** Errori generati altrove e passati via querystring (vedi requireVitrixAccess). */
const queryErrorMessages: Record<string, string> = {
  forbidden: "Questo utente non ha i permessi per accedere a Vitrix."
};

const isDev = process.env.NODE_ENV === "development";
const devAdmin = isDev
  ? { email: process.env.VITRIX_SUPERADMIN_EMAIL ?? "", password: process.env.VITRIX_SUPERADMIN_PASSWORD ?? "" }
  : null;
const devDemo = isDev
  ? { email: process.env.DEV_DEMO_EMAIL, password: process.env.DEV_DEMO_PASSWORD }
  : null;

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string; reset?: string }>;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const params = await searchParams;
  const config = getSupabaseConfig();
  const success = params.reset ? successMessages[params.reset] : null;
  const queryError = params.error ? queryErrorMessages[params.error] ?? null : null;

  return (
    <Box
      component="main"
      className="admin-login"
      data-theme="dark"
      suppressHydrationWarning
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1.78fr minmax(420px, 0.78fr)" },
        bgcolor: "var(--vx-bg)",
        color: "var(--vx-text-primary)",
        fontFamily: "var(--vx-font-family)"
      }}
    >
      {/* Script bloccante: legge localStorage prima del paint, evita il flash dark→light */}
      <script
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('vitrix-admin-theme');if(t==='light'||t==='dark'){document.currentScript.parentElement.dataset.theme=t;}}catch(e){}})();`
        }}
      />
      {/* ── LEFT — visual area ── */}
      <Box
        component="section"
        className="admin-login-hero-section"
        sx={{
          position: "relative",
          minHeight: { xs: 480, lg: "100vh" },
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          overflow: "hidden",
          bgcolor: "#070D1C",
          ".admin-login[data-theme='light'] &": { bgcolor: "#F7F9FC" }
        }}
      >
        {/* Video — light mode only */}
        <Box
          component="video"
          src="/assets/vitrix/bg-hero-vetrix.webm"
          autoPlay
          muted
          loop
          playsInline
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center right",
            display: "none",
            ".admin-login[data-theme='light'] &": { display: "block" }
          }}
        />
        {/* Background image — dark mode only */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundSize: "cover",
            backgroundPosition: "center right",
            ".admin-login[data-theme='dark'] &": {
              backgroundImage: "url('/assets/vitrix/hero-image-bg-login-dark.png')"
            }
          }}
        />
        {/* Overlay: crea area leggibile a sinistra, mostra dashboard a destra */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background: "linear-gradient(90deg, rgba(7,13,28,0.97) 0%, rgba(7,13,28,0.90) 32%, rgba(7,13,28,0.55) 52%, transparent 75%)",
            ".admin-login[data-theme='light'] &": {
              background: "linear-gradient(90deg, rgba(247,249,252,0.98) 0%, rgba(247,249,252,0.92) 32%, rgba(247,249,252,0.60) 52%, transparent 75%)"
            }
          }}
        />

        {/* Hero text content */}
        <Stack
          sx={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            maxWidth: "54%",
            p: "52px 0 52px 56px",
            justifyContent: "center",
            gap: 0
          }}
        >
          <VitrixLogo />

          <Typography
            component="h1"
            sx={{
              mt: 5,
              mb: 2,
              fontSize: { lg: 34, xl: 40 },
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#F8FAFC",
              ".admin-login[data-theme='light'] &": { color: "var(--vx-text-primary)" }
            }}
          >
            Il CMS moderno.
            <br />
            <Box component="span" sx={{ color: "var(--vx-primary)" }}>
              Costruito per prestazioni reali.
            </Box>
          </Typography>

          <Typography
            sx={{
              mb: 5,
              maxWidth: 340,
              fontSize: 14,
              lineHeight: 1.7,
              color: "rgba(248,250,252,0.70)",
              ".admin-login[data-theme='light'] &": { color: "var(--vx-text-secondary)" }
            }}
          >
            Gestisci contenuti, media e moduli con un pannello progettato per la velocità — senza compromessi sulla semplicità.
          </Typography>

          {/* Feature pills */}
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1.5 }}>
            <HeroFeature icon={<BoltIcon sx={{ fontSize: 15 }} />} title="Veloce" desc="Caricamenti sub-secondo" />
            <HeroFeature icon={<ExtensionIcon sx={{ fontSize: 15 }} />} title="Modulare" desc="Componenti riutilizzabili" />
            <HeroFeature icon={<SecurityIcon sx={{ fontSize: 15 }} />} title="Sicuro" desc="Auth + RBAC integrati" />
          </Stack>

          {/* Bottom badges */}
          <Stack direction="row" spacing={1.5} sx={{ mt: "auto", pt: 6 }}>
            <HeroBadge label="🇮🇹 Made in Italy" />
            <HeroBadge label="⚡ Performance by design" />
          </Stack>
        </Stack>
      </Box>

      {/* ── RIGHT — login panel ── */}
      <Box
        component="section"
        sx={{
          position: "relative",
          minHeight: "100vh",
          borderLeft: { lg: "1px solid var(--vx-border)" },
          bgcolor: "var(--vx-surface)"
        }}
      >
        {/* Top controls */}
        <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 32, right: 40, zIndex: 2 }}>
          <AdminThemeToggle />
        </Stack>

        {/* Form */}
        <AdminLoginForm
          isConfigured={config.isConfigured}
          next={params.next ?? "/admin"}
          successMessage={success}
          queryError={queryError}
          defaultEmail={devAdmin?.email}
          defaultPassword={devAdmin?.password}
          devDemo={devDemo?.email && devDemo.password ? { email: devDemo.email, password: devDemo.password } : null}
        />
      </Box>
    </Box>
  );
}

function HeroFeature({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: "flex-start",
        px: 1.5,
        py: 1.25,
        borderRadius: "10px",
        border: "1px solid rgba(148,163,184,0.18)",
        bgcolor: "rgba(255,255,255,0.05)",
        ".admin-login[data-theme='light'] &": {
          border: "1px solid rgba(15,23,42,0.10)",
          bgcolor: "rgba(15,23,42,0.04)"
        }
      }}
    >
      <Box
        sx={{
          mt: "1px",
          color: "var(--vx-cyan)",
          ".admin-login[data-theme='light'] &": { color: "var(--vx-primary)" }
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3, color: "#F8FAFC", ".admin-login[data-theme='light'] &": { color: "var(--vx-text-primary)" } }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 11, lineHeight: 1.4, color: "rgba(248,250,252,0.55)", ".admin-login[data-theme='light'] &": { color: "var(--vx-text-muted)" } }}>
          {desc}
        </Typography>
      </Box>
    </Stack>
  );
}

function HeroBadge({ label }: { label: string }) {
  return (
    <Box
      sx={{
        px: 1.5,
        py: 0.75,
        borderRadius: "20px",
        border: "1px solid rgba(148,163,184,0.20)",
        bgcolor: "rgba(255,255,255,0.06)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
        color: "rgba(248,250,252,0.65)",
        ".admin-login[data-theme='light'] &": {
          border: "1px solid rgba(15,23,42,0.12)",
          bgcolor: "rgba(15,23,42,0.05)",
          color: "var(--vx-text-secondary)"
        }
      }}
    >
      {label}
    </Box>
  );
}
