"use client";

import { Button, CircularProgress } from "@mui/material";
import { useFormStatus } from "react-dom";

type LoginSubmitButtonProps = {
  disabled?: boolean;
  /**
   * Stato di caricamento dell'azione. Se omesso si usa useFormStatus.
   * Passarlo esplicitamente e piu affidabile: useFormStatus torna a false
   * appena l'azione risponde, mentre il redirect di successo e ancora in corso.
   */
  pending?: boolean;
};

export function LoginSubmitButton({ disabled = false, pending }: LoginSubmitButtonProps) {
  const status = useFormStatus();
  const isPending = pending ?? status.pending;

  return (
    <Button
      type="submit"
      disabled={disabled || isPending}
      variant="contained"
      size="large"
      fullWidth
      aria-busy={isPending}
      startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : null}
      sx={
        // Senza questo il bottone disabilitato sbiadisce e sembra rotto,
        // invece di comunicare "sto lavorando".
        isPending
          ? { "&.Mui-disabled": { bgcolor: "var(--vx-primary)", color: "#fff", opacity: 0.85 } }
          : {}
      }
    >
      {isPending ? "Accesso in corso..." : "Accedi"}
    </Button>
  );
}
