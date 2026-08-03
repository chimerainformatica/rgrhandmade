import { Box, Stack, Typography } from "@mui/material";

/** Logotipo Vitrix CMS, condiviso tra la hero e il form di login. */
export function VitrixLogo({ centered = false }: { centered?: boolean }) {
  return (
    <Stack
      direction="row"
      spacing={0.75}
      sx={{ width: "max-content", justifySelf: centered ? "center" : "auto", alignItems: "center" }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          fontSize: 19,
          fontWeight: 900,
          lineHeight: 1,
          transform: "skewX(-11deg)",
          borderRadius: "7px 2px 7px 2px",
          background: "var(--vx-gradient-brand)",
          flexShrink: 0
        }}
      >
        V
      </Box>
      <Typography
        component="strong"
        sx={{ color: "var(--vx-text-primary)", fontSize: 27, fontWeight: 800, lineHeight: 1 }}
      >
        ITRIX
      </Typography>
      <Typography
        component="small"
        sx={{ ml: 0.2, color: "var(--vx-violet)", fontSize: 12, fontWeight: 800, lineHeight: 1, alignSelf: "flex-end", mb: "3px" }}
      >
        CMS
      </Typography>
    </Stack>
  );
}
