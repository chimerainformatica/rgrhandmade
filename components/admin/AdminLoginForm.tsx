"use client";

import { useActionState, useEffect, useRef } from "react";
import { Alert, Box, Divider, Link, Stack, TextField, Typography } from "@mui/material";
import { LoginSubmitButton } from "@/components/admin/LoginSubmitButton";
import { VitrixLogo } from "@/components/admin/VitrixLogo";
import { initialSignInState, signIn } from "@/app/admin/login/actions";

type AdminLoginFormProps = {
  isConfigured: boolean;
  next: string;
  successMessage?: string | null;
  /** Errore arrivato via querystring (es. redirect da requireVitrixAccess). */
  queryError?: string | null;
  defaultEmail?: string;
  defaultPassword?: string;
  devDemo?: { email: string; password: string } | null;
};

export function AdminLoginForm({
  isConfigured,
  next,
  successMessage = null,
  queryError = null,
  defaultEmail,
  defaultPassword,
  devDemo = null
}: AdminLoginFormProps) {
  const [state, formAction, isPending] = useActionState(signIn, initialSignInState);
  const errorRef = useRef<HTMLDivElement>(null);
  // L'esito dell'ultimo tentativo prevale sull'errore che ci ha portati qui.
  const error = state.error ?? queryError;

  // Un errore che compare sotto la piega passerebbe inosservato: lo portiamo in vista.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [error]);

  return (
    <Box
      component="form"
      action={formAction}
      noValidate
      sx={{
        width: "min(420px, calc(100% - 56px))",
        minHeight: "100vh",
        mx: "auto",
        pt: { xs: 14, lg: "160px" },
        pb: 5,
        display: "grid",
        alignContent: "start"
      }}
    >
      <input type="hidden" name="next" value={next} />

      <VitrixLogo centered />

      <Typography
        component="h2"
        sx={{
          mt: 5.5,
          mb: 1.25,
          textAlign: "center",
          fontSize: 24,
          lineHeight: 1.22,
          fontWeight: 800,
          letterSpacing: "-0.01em"
        }}
      >
        Accedi a{" "}
        <Box component="span" sx={{ color: "var(--vx-violet)" }}>
          Vitrix CMS
        </Box>
      </Typography>

      <Typography
        sx={{
          mb: 4.5,
          maxWidth: 340,
          mx: "auto",
          textAlign: "center",
          color: "var(--vx-text-secondary)",
          fontSize: 13.5,
          lineHeight: 1.6
        }}
      >
        {isConfigured
          ? "Gestisci contenuti, collezioni, media e moduli da un'unica piattaforma."
          : "Configura Supabase per abilitare il login reale."}
      </Typography>

      <TextField
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="nome@azienda.com"
        defaultValue={defaultEmail}
        required
        disabled={isPending}
        error={Boolean(error)}
        fullWidth
        variant="outlined"
        size="medium"
        sx={{ mb: 2.5 }}
      />

      <TextField
        id="password"
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        defaultValue={defaultPassword}
        required
        disabled={isPending}
        error={Boolean(error)}
        fullWidth
        variant="outlined"
        size="medium"
        sx={{ mb: 3 }}
      />

      {successMessage && (
        <Alert severity="success" variant="outlined" sx={{ mb: 2, fontSize: 13 }}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert
          ref={errorRef}
          severity="error"
          variant="outlined"
          role="alert"
          aria-live="assertive"
          sx={{ mb: 2, fontSize: 13, alignItems: "flex-start" }}
        >
          {error}
        </Alert>
      )}

      <LoginSubmitButton disabled={!isConfigured} pending={isPending} />

      {devDemo?.email && (
        <Box
          sx={{
            mt: 2.5,
            p: "10px 14px",
            borderRadius: "8px",
            border: "1px dashed var(--vx-border)",
            bgcolor: "var(--vx-surface-muted)"
          }}
        >
          <Typography sx={{ mb: 0.5, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--vx-text-muted)" }}>
            Demo · solo in locale
          </Typography>
          <Typography sx={{ fontSize: 12, color: "var(--vx-text-secondary)", fontFamily: "monospace" }}>
            {devDemo.email} · {devDemo.password}
          </Typography>
        </Box>
      )}

      <Stack component="footer" spacing={1.75} sx={{ mt: "auto", pt: 10, alignItems: "center" }}>
        <Typography sx={{ color: "var(--vx-text-muted)", fontSize: 12 }}>
          © 2026 Vitrix CMS · Tutti i diritti riservati.
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Link href="/admin/login" underline="none" sx={{ color: "var(--vx-text-muted)", fontSize: 12 }}>
            Privacy Policy
          </Link>
          <Divider orientation="vertical" flexItem sx={{ borderColor: "var(--vx-border)" }} />
          <Link href="/admin/login" underline="none" sx={{ color: "var(--vx-text-muted)", fontSize: 12 }}>
            Termini di servizio
          </Link>
        </Stack>
      </Stack>
    </Box>
  );
}
