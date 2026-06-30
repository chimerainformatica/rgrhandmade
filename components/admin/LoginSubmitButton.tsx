"use client";

import { Button, CircularProgress } from "@mui/material";
import { useFormStatus } from "react-dom";

type LoginSubmitButtonProps = {
  disabled?: boolean;
};

export function LoginSubmitButton({ disabled = false }: LoginSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      variant="contained"
      size="large"
      fullWidth
      startIcon={pending ? <CircularProgress size={16} color="inherit" /> : null}
    >
      {pending ? "Accesso in corso…" : "Accedi"}
    </Button>
  );
}
