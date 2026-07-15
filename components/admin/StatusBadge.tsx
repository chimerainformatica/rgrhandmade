"use client";
import { Box } from "@mui/material";

type StatusKey = "published" | "draft" | "fiera" | "press" | string;

const CONFIG: Record<string, { bg: string; color: string; label: string; pulse?: boolean }> = {
  published: { bg: "rgba(46,125,50,0.10)",  color: "#2E7D32", label: "Pubblicato" },
  draft:     { bg: "rgba(237,108,2,0.10)",  color: "#ED6C02", label: "Bozza", pulse: true },
  event:     { bg: "rgba(14,165,233,0.10)", color: "#0284C7", label: "Evento" },
  fiera:     { bg: "rgba(25,118,210,0.10)", color: "#1565C0", label: "Fiera" },
  press:     { bg: "rgba(108,92,231,0.12)", color: "#6C5CE7", label: "Press" },
  publication: { bg: "rgba(184,146,84,0.16)", color: "#9A6F2E", label: "Pubblicazione" },
};

export function StatusBadge({ status, size = "sm" }: { status: StatusKey; size?: "xs" | "sm" }) {
  const cfg = CONFIG[status] ?? { bg: "rgba(100,116,139,0.10)", color: "#475569", label: status };
  const fontSize = size === "xs" ? 11 : 12;
  const px = size === "xs" ? "6px" : "8px";
  const py = size === "xs" ? "2px" : "3px";

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        px,
        py,
        borderRadius: "20px",
        bgcolor: cfg.bg,
        color: cfg.color,
        fontSize,
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: "nowrap",
        letterSpacing: "0.02em"
      }}
    >
      <Box
        component="span"
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: cfg.color,
          flexShrink: 0,
          ...(cfg.pulse && {
            animation: "vx-pulse 2s ease-in-out infinite",
            "@keyframes vx-pulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.35 }
            }
          })
        }}
      />
      {cfg.label}
    </Box>
  );
}
