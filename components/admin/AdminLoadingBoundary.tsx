"use client";

import { Box, Paper } from "@mui/material";
import { VitrixLoader } from "@/components/admin/VitrixLoader";

type AdminLoadingBoundaryProps = {
  label: string;
  minHeight?: number;
  framed?: boolean;
};

export function AdminLoadingBoundary({ label, minHeight = 280, framed = false }: AdminLoadingBoundaryProps) {
  const content = (
    <Box sx={{ minHeight, display: "grid", placeItems: "center", width: "100%" }}>
      <VitrixLoader label={label} />
    </Box>
  );

  if (!framed) return content;

  return (
    <Paper sx={{ bgcolor: "var(--vx-surface)", border: "1px solid var(--vx-border)", borderRadius: "12px", boxShadow: "none", overflow: "hidden" }}>
      {content}
    </Paper>
  );
}
