import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    neutral: Palette["primary"];
    soft: Palette["primary"];
  }
  interface PaletteOptions {
    neutral?: PaletteOptions["primary"];
    soft?: PaletteOptions["primary"];
  }
}

export const vitrixTheme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#1976d2", light: "#42a5f5", dark: "#1565c0" },
        neutral: { main: "#64748b", light: "#94a3b8", dark: "#475569" },
        soft: { main: "#e8f0fe", light: "#f0f4ff", dark: "#d0d8e8" },
        background: { default: "var(--vx-bg)", paper: "var(--vx-surface)" },
        text: { primary: "var(--vx-text-primary)", secondary: "var(--vx-text-secondary)" },
        divider: "var(--vx-border)",
      },
    },
  },
  typography: {
    fontFamily: "var(--vx-font-family)",
    fontSize: 14,
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          fontFamily: "var(--vx-font-family)",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        slotProps: {
          backdrop: {
            sx: { backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" },
          },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          "&:first-of-type": { paddingTop: 20 },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});
