"use client";

import { Box, Stack, Typography } from "@mui/material";
import { DotmTriangle13 } from "@/components/ui/dotm-triangle-13";

type VitrixLoaderProps = {
  label?: string;
  compact?: boolean;
};

export function VitrixLoader({ label = "Caricamento", compact = false }: VitrixLoaderProps) {
  return (
    <Stack
      role="status"
      aria-live="polite"
      spacing={compact ? 1 : 1.5}
      sx={{
        alignItems: "center",
        justifyContent: "center",
        py: compact ? 3 : 6,
        color: "var(--vx-primary)"
      }}
    >
      <Box
        sx={{
          width: compact ? 38 : 52,
          height: compact ? 38 : 52,
          display: "grid",
          placeItems: "center",
          borderRadius: "12px",
          bgcolor: "var(--vx-primary-soft)"
        }}
      >
        <DotmTriangle13
          size={compact ? 24 : 32}
          dotSize={compact ? 4.8 : 6.2}
          color="var(--vx-primary)"
          bloom
          halo={0.12}
          ariaLabel={label}
        />
      </Box>
      {label && (
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--vx-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {label}
        </Typography>
      )}
    </Stack>
  );
}
