"use client";

import { Box } from "@mui/material";

type FlagProps = { width?: number; height?: number; label?: string };

const flagFrameSx = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 22,
  borderRadius: "6px",
  bgcolor: "rgba(255,255,255,0.72)",
  border: "1px solid var(--vx-border)",
  boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
  overflow: "hidden"
};

export function ItalianFlag({ width = 20, height = 14, label = "Italiano" }: FlagProps) {
  return (
    <Box component="span" role="img" aria-label={label} sx={flagFrameSx}>
      <svg viewBox="0 0 3 2" width={width} height={height} preserveAspectRatio="none" aria-hidden>
        <rect width="1" height="2" x="0" y="0" fill="#009246" />
        <rect width="1" height="2" x="1" y="0" fill="#F1F2F1" />
        <rect width="1" height="2" x="2" y="0" fill="#CE2B37" />
      </svg>
    </Box>
  );
}

export function UKFlag({ width = 20, height = 14, label = "English" }: FlagProps) {
  return (
    <Box component="span" role="img" aria-label={label} sx={flagFrameSx}>
      <svg viewBox="0 0 60 30" width={width} height={height} preserveAspectRatio="none" aria-hidden>
        <rect width="60" height="30" fill="#012169" />
        <g fill="#fff">
          <polygon points="0,0 60,30 60,25 5,0" />
          <polygon points="60,0 0,30 0,25 55,0" />
        </g>
        <g fill="#C8102E">
          <polygon points="0,0 60,30 60,27 3,0" />
          <polygon points="60,0 0,30 0,27 57,0" />
          <rect x="25" y="0" width="10" height="30" />
          <rect x="0" y="10" width="60" height="10" />
        </g>
      </svg>
    </Box>
  );
}
