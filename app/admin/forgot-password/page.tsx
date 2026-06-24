import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { headers } from "next/headers";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import {
  Box,
  Button,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { requestPasswordReset } from "@/app/admin/forgot-password/actions";

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 48,
    borderRadius: "4px",
    bgcolor: "var(--vx-input-bg)",
    color: "var(--vx-text-primary)",
    "& fieldset": { borderColor: "var(--vx-input-border)" },
    "&:hover fieldset": { borderColor: "var(--vx-primary)" },
    "&.Mui-focused fieldset": { borderColor: "var(--vx-primary)", borderWidth: 2 },
    "&.Mui-focused": { boxShadow: "0 0 0 3px rgba(25,118,210,0.16)" }
  },
  "& .MuiInputBase-input": {
    fontSize: 14,
    color: "var(--vx-text-primary)",
    "&::placeholder": { color: "var(--vx-text-disabled)", opacity: 1 }
  }
};

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const params = await searchParams;
  const sent = params.sent === "1";
  const hasError = params.error === "missing";

  return (
    <Box
      component="main"
      className="admin-login"
      data-theme="dark"
      suppressHydrationWarning
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "var(--vx-bg)",
        color: "var(--vx-text-primary)",
        fontFamily: "var(--vx-font-family)"
      }}
    >
      <script
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('vitrix-admin-theme');if(t==='light'||t==='dark'){document.currentScript.parentElement.dataset.theme=t;}}catch(e){}})();`
        }}
      />

      <Stack sx={{ position: "absolute", top: 32, right: 40 }}>
        <AdminThemeToggle />
      </Stack>

      <Box
        sx={{
          width: "min(420px, calc(100% - 56px))",
          py: 6,
          px: 4,
          borderRadius: "16px",
          border: "1px solid var(--vx-border)",
          bgcolor: "var(--vx-surface)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)"
        }}
      >
        {/* Icon */}
        <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
          <Box
            sx={{
              width: 52, height: 52, borderRadius: "14px", display: "grid", placeItems: "center",
              background: "var(--vx-gradient-brand)",
              boxShadow: "0 8px 24px rgba(25,118,210,0.25)"
            }}
          >
            <LockResetOutlinedIcon sx={{ fontSize: 26, color: "#fff" }} />
          </Box>
        </Box>

        <Typography
          component="h1"
          sx={{ mb: 1, textAlign: "center", fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em" }}
        >
          Password dimenticata?
        </Typography>

        <Typography
          sx={{ mb: 4, textAlign: "center", fontSize: 13.5, color: "var(--vx-text-secondary)", lineHeight: 1.6 }}
        >
          {sent
            ? "Email inviata. Controlla la tua casella di posta per il link di reset."
            : "Inserisci la tua email e ti invieremo un link per reimpostare la password."}
        </Typography>

        {!sent && (
          <Box component="form" action={requestPasswordReset}>
            <Typography
              component="label"
              htmlFor="email"
              sx={{ mb: 1, display: "block", color: "var(--vx-text-primary)", fontSize: 13, fontWeight: 700 }}
            >
              Email
            </Typography>
            <TextField
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nome@azienda.com"
              required
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineOutlinedIcon sx={{ fontSize: 18, color: "var(--vx-text-muted)" }} />
                    </InputAdornment>
                  )
                }
              }}
              sx={{ ...textFieldSx, mb: 1 }}
            />

            {hasError && (
              <Typography sx={{ mb: 2, color: "var(--vx-danger)", fontSize: 13, fontWeight: 700 }}>
                Inserisci un indirizzo email valido.
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              sx={{
                mt: 2, height: 48, borderRadius: "10px",
                background: "var(--vx-gradient-brand)", color: "#fff",
                fontSize: 15, fontWeight: 700, textTransform: "none",
                boxShadow: "0 4px 14px rgba(25,118,210,0.28)",
                "&:hover": { filter: "brightness(1.06)", transform: "translateY(-1px)" },
                transition: "all 180ms cubic-bezier(0.22,1,0.36,1)"
              }}
            >
              Invia link di reset
            </Button>
          </Box>
        )}

        <Stack direction="row" sx={{ justifyContent: "center", mt: 3 }}>
          <Link
            href="/admin/login"
            underline="none"
            sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "var(--vx-primary)", fontSize: 13, fontWeight: 700 }}
          >
            <ArrowBackIcon sx={{ fontSize: 16 }} />
            Torna al login
          </Link>
        </Stack>
      </Box>
    </Box>
  );
}
