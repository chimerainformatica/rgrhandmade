"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { vitrixTheme } from "@/lib/vitrix-theme";

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={vitrixTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
