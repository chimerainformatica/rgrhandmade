"use client";

import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { IconButton } from "@mui/material";
import { useEffect, useState } from "react";

type AdminTheme = "light" | "dark";

const STORAGE_KEY = "vitrix-admin-theme";

function applyTheme(theme: AdminTheme) {
  document.querySelectorAll<HTMLElement>(".admin-shell, .admin-login").forEach((element) => {
    element.dataset.theme = theme;
  });
}

export function AdminThemeToggle() {
  const [theme, setTheme] = useState<AdminTheme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    applyTheme(theme);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleTheme() {
    const nextTheme: AdminTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <IconButton
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Attiva tema scuro" : "Attiva tema chiaro"}
      title={theme === "light" ? "Tema scuro" : "Tema chiaro"}
      sx={{
        width: 42,
        height: 42,
        border: "1px solid var(--vx-border)",
        borderRadius: "12px",
        bgcolor: "var(--vx-surface)",
        color: "var(--vx-text-muted)",
        boxShadow: "var(--vx-shadow-sm)",
        "&:hover": {
          bgcolor: "var(--vx-primary-soft)",
          color: "var(--vx-primary)"
        }
      }}
    >
      {theme === "light" ? <DarkModeOutlinedIcon fontSize="small" /> : <LightModeOutlinedIcon fontSize="small" />}
    </IconButton>
  );
}
