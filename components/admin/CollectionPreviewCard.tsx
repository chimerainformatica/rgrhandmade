"use client";

import { Box, Typography, ToggleButtonGroup, ToggleButton } from "@mui/material";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import FullscreenOutlinedIcon from "@mui/icons-material/FullscreenOutlined";
import type { VitrixCatalogueRow } from "@/lib/vitrix/types";

export type PreviewMode = "compact" | "expanded";

interface CollectionPreviewCardProps {
  imageUrl: string | null;
  refCode: string;
  title: string;
  description: string;
  category: string;
  imgPosition: string;
  lang: "it" | "en";
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
}

const previewCardSx = {
  bgcolor: "#faf8f4",
  borderRadius: "14px",
  border: "1px solid #e0d6c8",
  p: 2.5,
  transition: "all 0.25s ease",
};

const imageContainerSx = (mode: PreviewMode) => ({
  position: "relative" as const,
  width: "100%",
  aspectRatio: mode === "compact" ? "4/5" : "3/4",
  overflow: "hidden",
  bgcolor: "#d5cfc8",
  borderRadius: "10px",
  mb: 1.5,
});

const gradientOverlaySx = {
  position: "absolute" as const,
  inset: 0,
  background: "linear-gradient(0deg, rgba(23,20,17,0.85) 0%, rgba(23,20,17,0.35) 50%, rgba(23,20,17,0) 70%)",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "flex-end",
  p: 2.5,
};

const CATEGORY_LABELS: Record<string, { it: string; en: string }> = {
  Anelli: { it: "Anelli", en: "Rings" },
  Bracciali: { it: "Bracciali", en: "Bracelets" },
  Collane: { it: "Collane", en: "Necklaces" },
  Orecchini: { it: "Orecchini", en: "Earrings" },
  Parure: { it: "Parure", en: "Parure" },
};

function itemCategoryLabel(category: string, lang: "it" | "en"): string {
  return CATEGORY_LABELS[category]?.[lang] ?? category;
}

export default function CollectionPreviewCard({
  imageUrl,
  refCode,
  title,
  description,
  category,
  imgPosition,
  lang,
  mode,
  onModeChange,
}: CollectionPreviewCardProps) {
  const catLabel = itemCategoryLabel(category, lang);
  const ctaLabel = lang === "it" ? "Anteprima" : "Preview";
  const hasImage = imageUrl && imageUrl.startsWith("http");

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "var(--vx-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Anteprima
        </Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && onModeChange(v)}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              border: "1px solid var(--vx-border)",
              color: "var(--vx-text-muted)",
              fontSize: 12,
              textTransform: "none",
              px: 1.5,
              py: 0.5,
              "&.Mui-selected": {
                bgcolor: "var(--vx-primary-soft)",
                color: "var(--vx-primary)",
                borderColor: "var(--vx-primary)",
              },
            },
          }}
        >
          <ToggleButton value="compact"><ViewSidebarOutlinedIcon sx={{ fontSize: 14, mr: 0.5 }} />Composto</ToggleButton>
          <ToggleButton value="expanded"><FullscreenOutlinedIcon sx={{ fontSize: 14, mr: 0.5 }} />Espanso</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ ...previewCardSx, maxWidth: mode === "expanded" ? 480 : 380 }}>
        {/* Image area */}
        <Box sx={imageContainerSx(mode)}>
          {hasImage ? (
            <>
              <Box
                component="img"
                src={imageUrl!}
                alt={title || "Preview"}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: imgPosition || "center",
                }}
              />
              <Box sx={gradientOverlaySx}>
                {refCode && (
                  <Typography
                    sx={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.22em", color: "#c8a87c", mb: 0.5 }}
                  >
                    {refCode}
                  </Typography>
                )}
                <Typography
                  sx={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: mode === "compact" ? 20 : 26,
                    color: "#faf8f4",
                    lineHeight: 1.15,
                    fontWeight: 500,
                  }}
                >
                  {catLabel || category || "Categoria"}
                </Typography>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    mt: 1,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#c8a87c",
                  }}
                >
                  {ctaLabel}
                  <Box component="span" sx={{ fontSize: 12, lineHeight: 1 }}>→</Box>
                </Box>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#b8aaa0",
                fontSize: 13,
                fontStyle: "italic",
              }}
            >
              {lang === "it" ? "Nessuna immagine" : "No image"}
            </Box>
          )}
        </Box>

        {/* Footer */}
        {refCode && (
          <Typography sx={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", color: "#b8946a", mb: 0.3 }}>
            {refCode}
          </Typography>
        )}
        <Typography
          sx={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: mode === "compact" ? 17 : 21,
            color: "#1a1713",
            lineHeight: 1.2,
          }}
        >
          {title || (lang === "it" ? "Titolo" : "Title")}
        </Typography>
      </Box>
    </Box>
  );
}
