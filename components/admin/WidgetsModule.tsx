"use client";

import { useState } from "react";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CollectionsOutlinedIcon from "@mui/icons-material/CollectionsOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import WidgetsOutlinedIcon from "@mui/icons-material/WidgetsOutlined";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Typography
} from "@mui/material";
import { VtxCataloguePanel } from "@/components/admin/VtxCataloguePanel";
import { VtxEventsPanel } from "@/components/admin/VtxEventsPanel";

type WidgetEntry = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: "active" | "coming-soon";
  sectionId: string;
};

const WIDGETS: WidgetEntry[] = [
  {
    id: "vtx_catalogue",
    label: "VTX Catalogue",
    description: "Sezione \"Le Collezioni\" - griglia con filtri, preview modal, testi e CTA configurabili.",
    icon: CollectionsOutlinedIcon,
    status: "active",
    sectionId: "catalogue",
  },
  {
    id: "vtx_events",
    label: "VTX Eventi",
    description: "Sezione \"Eventi\" - eventi, press e fiere con featured, filtri, CTA e SEO per singolo post.",
    icon: EventOutlinedIcon,
    status: "active",
    sectionId: "news",
  },
];

const cardSx = {
  bgcolor: "var(--vx-surface)",
  border: "1px solid var(--vx-border)",
  borderRadius: "12px",
  boxShadow: "none",
  transition: "border-color 180ms ease, box-shadow 180ms ease",
  "&:hover": {
    borderColor: "var(--vx-primary)",
    boxShadow: "0 0 0 3px rgba(25,118,210,0.08)"
  }
};

export function WidgetsModule() {
  const [active, setActive] = useState<string | null>(null);

  /* ── Widget detail ── */
  if (active === "vtx_catalogue") {
    return (
      <Box sx={{ width: "100%", minHeight: "calc(100vh - 56px)" }}>
        {/* Mini-topbar inside the module */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 3,
            py: 1.5,
            borderBottom: "1px solid var(--vx-border)",
            bgcolor: "var(--vx-surface)",
            position: "sticky",
            top: 56,
            zIndex: 10
          }}
        >
          <Button
            startIcon={<ArrowBackOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={() => setActive(null)}
            size="small"
            sx={{ fontSize: 12, color: "var(--vx-text-secondary)", "&:hover": { color: "var(--vx-primary)" } }}
          >
            Widgets
          </Button>
          <Typography sx={{ color: "var(--vx-text-muted)", fontSize: 13 }}>/</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--vx-text-primary)" }}>VTX Catalogue</Typography>
        </Box>
        <VtxCataloguePanel />
      </Box>
    );
  }

  if (active === "vtx_events") {
    return (
      <Box sx={{ width: "100%", minHeight: "calc(100vh - 56px)" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 3,
            py: 1.5,
            borderBottom: "1px solid var(--vx-border)",
            bgcolor: "var(--vx-surface)",
            position: "sticky",
            top: 56,
            zIndex: 10
          }}
        >
          <Button
            startIcon={<ArrowBackOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={() => setActive(null)}
            size="small"
            sx={{ fontSize: 12, color: "var(--vx-text-secondary)", "&:hover": { color: "var(--vx-primary)" } }}
          >
            Widgets
          </Button>
          <Typography sx={{ color: "var(--vx-text-muted)", fontSize: 13 }}>/</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--vx-text-primary)" }}>VTX Eventi</Typography>
        </Box>
        <VtxEventsPanel />
      </Box>
    );
  }

  /* ── Widget list ── */
  return (
    <Box sx={{ width: "100%", minHeight: "calc(100vh - 56px)", p: { xs: 2, md: 3, lg: 4 } }}>
      {/* Page header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 4, gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <WidgetsOutlinedIcon sx={{ fontSize: 18, color: "var(--vx-primary)" }} />
            <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--vx-text-muted)" }}>
              Contenuti
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--vx-text-primary)", fontSize: 22, mb: 0.5 }}>
            Widgets
          </Typography>
          <Typography sx={{ fontSize: 13, color: "var(--vx-text-muted)", maxWidth: 540 }}>
            Configura le sezioni della homepage. Ogni widget è collegato a una sezione specifica del sito — le modifiche si riflettono in tempo reale.
          </Typography>
        </Box>
        <Button
          component="a"
          href="/#catalogue"
          target="_blank"
          size="small"
          startIcon={<OpenInNewOutlinedIcon sx={{ fontSize: 15 }} />}
          variant="outlined"
          sx={{ fontSize: 12, color: "var(--vx-text-secondary)", borderColor: "var(--vx-border)", borderRadius: "8px", "&:hover": { borderColor: "var(--vx-primary)", color: "var(--vx-primary)" } }}
        >
          Vedi homepage
        </Button>
      </Box>

      {/* Widget cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 2 }}>
        {WIDGETS.map((w) => {
          const Icon = w.icon;
          return (
            <Card key={w.id} sx={cardSx}>
              <CardActionArea
                onClick={() => w.status === "active" && setActive(w.id)}
                disabled={w.status !== "active"}
                sx={{ height: "100%", "&.Mui-disabled": { opacity: 0.55 } }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
                    <Box sx={{ width: 42, height: 42, borderRadius: "10px", bgcolor: "var(--vx-primary-soft)", display: "grid", placeItems: "center" }}>
                      <Icon sx={{ fontSize: 22, color: "var(--vx-primary)" }} />
                    </Box>
                    {w.status === "coming-soon" ? (
                      <Chip label="In arrivo" size="small" sx={{ height: 20, fontSize: 10, bgcolor: "var(--vx-surface-muted)", color: "var(--vx-text-muted)", fontWeight: 600 }} />
                    ) : (
                      <Chip label="Attivo" size="small" sx={{ height: 20, fontSize: 10, bgcolor: "var(--vx-success-soft, #e6f4ea)", color: "var(--vx-success, #2e7d32)", fontWeight: 700 }} />
                    )}
                  </Box>

                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: "var(--vx-text-primary)", mb: 0.75 }}>
                    {w.label}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: "var(--vx-text-muted)", lineHeight: 1.55 }}>
                    {w.description}
                  </Typography>

                  {w.status === "active" && (
                    <Typography sx={{ mt: 2, fontSize: 11, color: "var(--vx-primary)", fontWeight: 600, letterSpacing: "0.1em" }}>
                      Configura →
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
