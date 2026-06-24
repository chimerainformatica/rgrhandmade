import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { headers } from "next/headers";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  Button,
  InputAdornment,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { updatePassword } from "@/app/admin/reset-password/actions";

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

const errorMessages: Record<string, string> = {
  short: "La password deve essere di almeno 8 caratteri.",
  mismatch: "Le password non corrispondono.",
  failed: "Impossibile aggiornare la password. Il link potrebbe essere scaduto."
};

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const params = await searchParams;
  const error = params.error ? errorMessages[params.error] : null;

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
          Nuova password
        </Typography>

        <Typography
          sx={{ mb: 4, textAlign: "center", fontSize: 13.5, color: "var(--vx-text-secondary)", lineHeight: 1.6 }}
        >
          Scegli una nuova password per il tuo account Vitrix.
        </Typography>

        <Box component="form" action={updatePassword}>
          <Typography
            component="label"
            htmlFor="password"
            sx={{ mb: 1, display: "block", color: "var(--vx-text-primary)", fontSize: 13, fontWeight: 700 }}
          >
            Nuova password
          </Typography>
          <TextField
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimo 8 caratteri"
            required
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ fontSize: 18, color: "var(--vx-text-muted)" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <VisibilityOutlinedIcon sx={{ fontSize: 18, color: "var(--vx-text-muted)", cursor: "pointer" }} />
                  </InputAdornment>
                )
              }
            }}
            sx={{ ...textFieldSx, mb: 2.5 }}
          />

          <Typography
            component="label"
            htmlFor="confirm"
            sx={{ mb: 1, display: "block", color: "var(--vx-text-primary)", fontSize: 13, fontWeight: 700 }}
          >
            Conferma password
          </Typography>
          <TextField
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Ripeti la password"
            required
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ fontSize: 18, color: "var(--vx-text-muted)" }} />
                  </InputAdornment>
                )
              }
            }}
            sx={{ ...textFieldSx, mb: 1 }}
          />

          {error && (
            <Typography sx={{ mb: 2, color: "var(--vx-danger)", fontSize: 13, fontWeight: 700 }}>
              {error}
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
            Aggiorna password
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
