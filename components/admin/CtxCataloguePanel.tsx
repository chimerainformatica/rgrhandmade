"use client";

import { useEffect, useState } from "react";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import CheckBoxOutlineBlankOutlinedIcon from "@mui/icons-material/CheckBoxOutlineBlankOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import type { VtxCatalogueConfig } from "@/lib/vitrix/types";
import { DEFAULT_VTX_CATALOGUE_CONFIG } from "@/lib/vitrix/types";
import { cardSx, fieldSx, selectSx } from "@/lib/admin-theme";

/* ── constants ─────────────────────────────────────────────── */
const API_URL = "/api/vitrix/widget-settings/vtx_catalogue";
const LEGACY_API_URL = "/api/vitrix/widget-settings/ctx_catalogue";
const ALL_CATEGORIES = ["Anelli", "Bracciali", "Collane", "Orecchini"];

const switchSx = {
  "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--vx-primary)" },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "var(--vx-primary)" }
};

const toggleBtnSx = {
  "& .MuiToggleButton-root": {
    px: 1.5, py: 0.5, fontSize: 11, fontWeight: 700,
    color: "var(--vx-text-muted)", border: "1px solid var(--vx-border)",
    "&.Mui-selected": { bgcolor: "var(--vx-primary-soft)", color: "var(--vx-primary)", borderColor: "var(--vx-primary)" }
  }
};

const switchLabelSx = { fontSize: 13, color: "var(--vx-text-secondary)" };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--vx-text-muted)" }}>
      {children}
    </Typography>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════ */
export function VtxCataloguePanel() {
  const [config, setConfig]           = useState<VtxCatalogueConfig>(DEFAULT_VTX_CATALOGUE_CONFIG);
  const [savedConfig, setSavedConfig] = useState<VtxCatalogueConfig>(DEFAULT_VTX_CATALOGUE_CONFIG);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [editLang, setEditLang]       = useState<"it" | "en">("it");
  const [toast, setToast] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({ open: false, msg: "", severity: "success" });

  const hasUnsaved = JSON.stringify(config) !== JSON.stringify(savedConfig);

  /* Load */
  useEffect(() => {
    fetch(API_URL, { credentials: "include" })
      .then(r => r.json())
      .then(async d => {
        let nextConfig = d.config as VtxCatalogueConfig | null;

        if (!nextConfig) {
          const legacyRes = await fetch(LEGACY_API_URL, { credentials: "include" });
          const legacyData = await legacyRes.json();
          nextConfig = legacyData.config as VtxCatalogueConfig | null;
        }

        if (nextConfig) {
          setConfig(nextConfig);
          setSavedConfig(nextConfig);
        }
      })
      .catch(err => console.error("[VTX] load error:", err))
      .finally(() => setLoading(false));
  }, []);

  function updateBilingual(field: "eyebrow" | "title_pre" | "title_em" | "lede" | "cta_label", value: string) {
    setConfig(prev => ({ ...prev, [field]: { ...prev[field], [editLang]: value } }));
  }

  function toggleCategory(cat: string) {
    setConfig(prev => {
      const has = prev.visible_categories.includes(cat);
      return { ...prev, visible_categories: has ? prev.visible_categories.filter(c => c !== cat) : [...prev.visible_categories, cat] };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(config)
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Errore");
      setSavedConfig(config);
      setToast({ open: true, msg: "Modifiche salvate.", severity: "success" });
    } catch (err) {
      setToast({ open: true, msg: err instanceof Error ? err.message : "Errore nel salvataggio.", severity: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 1.5 }}>
        <CircularProgress size={22} sx={{ color: "var(--vx-primary)" }} />
        <Typography sx={{ fontSize: 13, color: "var(--vx-text-muted)" }}>Caricamento...</Typography>
      </Box>
    );
  }

  const L = editLang.toUpperCase();

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 980 }}>
      <Paper sx={{ ...cardSx }}>
        <Stack spacing={2.5}>

          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: "var(--vx-text-primary)" }}>
                VTX Catalogue
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: 13, color: "var(--vx-text-muted)" }}>
                Configura la sezione pubblica &quot;Le Collezioni&quot; (#catalogue): testi, navigazione, opzioni e CTA.
              </Typography>
            </Box>
            <Button
              component="a"
              href="/#catalogue"
              target="_blank"
              size="small"
              startIcon={<OpenInNewOutlinedIcon sx={{ fontSize: 15 }} />}
              variant="outlined"
              sx={{ fontSize: 12, textTransform: "none", color: "var(--vx-text-secondary)", borderColor: "var(--vx-border)", borderRadius: "8px", "&:hover": { borderColor: "var(--vx-primary)", color: "var(--vx-primary)" } }}
            >
              Apri sito
            </Button>
          </Box>

          {/* Visibilità */}
          <Box>
            <SectionLabel>Visibilità</SectionLabel>
            <FormControlLabel
              sx={{ mt: 0.5 }}
              control={<Switch checked={config.enabled} onChange={e => setConfig(p => ({ ...p, enabled: e.target.checked }))} size="small" sx={switchSx} />}
              label={<Typography sx={switchLabelSx}>Sezione abilitata</Typography>}
            />
          </Box>

          {/* Sorgente */}
          <Box>
            <SectionLabel>Sorgente</SectionLabel>
            <TextField
              sx={{ ...fieldSx, mt: 1 }}
              label="Slug catalogo selezionato"
              value={config.catalogue_slug}
              onChange={e => setConfig(p => ({ ...p, catalogue_slug: e.target.value }))}
              fullWidth
              size="small"
              helperText="Inserisci lo slug della collection da usare come sorgente dei tab e delle immagini."
            />
          </Box>

          {/* Testi */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
              <SectionLabel>Testi [{L}]</SectionLabel>
              <ToggleButtonGroup value={editLang} exclusive onChange={(_, v) => v && setEditLang(v)} size="small" sx={toggleBtnSx}>
                <ToggleButton value="it">IT</ToggleButton>
                <ToggleButton value="en">EN</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Stack spacing={1.5} sx={{ mt: 1.5 }}>
              <TextField label="Eyebrow" value={config.eyebrow[editLang]} onChange={e => updateBilingual("eyebrow", e.target.value)} fullWidth size="small" sx={fieldSx} />
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField label="Titolo (prima parte)" value={config.title_pre[editLang]} onChange={e => updateBilingual("title_pre", e.target.value)} fullWidth size="small" sx={fieldSx} />
                <TextField label="Titolo (corsivo dorato)" value={config.title_em[editLang]} onChange={e => updateBilingual("title_em", e.target.value)} fullWidth size="small" sx={fieldSx} />
              </Stack>
              <TextField label="Lede" value={config.lede[editLang]} onChange={e => updateBilingual("lede", e.target.value)} fullWidth size="small" multiline rows={2} sx={fieldSx} />
            </Stack>
          </Box>

          {/* Navigazione a tab */}
          <Box>
            <SectionLabel>Navigazione a tab</SectionLabel>
            <FormControlLabel
              sx={{ mt: 0.5 }}
              control={<Switch checked={config.show_filters} onChange={e => setConfig(p => ({ ...p, show_filters: e.target.checked }))} size="small" sx={switchSx} />}
              label={<Typography sx={switchLabelSx}>Mostra navigazione a tab nel front</Typography>}
            />
            {config.show_filters && (
              <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ mt: 1.5, alignItems: { md: "flex-start" } }}>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)", mb: 0.75 }}>Categorie visibili</Typography>
                  <FormGroup sx={{ gap: 0.25 }} row>
                    {ALL_CATEGORIES.map(cat => (
                      <FormControlLabel
                        key={cat}
                        control={
                          <Checkbox
                            checked={config.visible_categories.includes(cat)}
                            onChange={() => toggleCategory(cat)}
                            size="small"
                            icon={<CheckBoxOutlineBlankOutlinedIcon sx={{ fontSize: 18, color: "var(--vx-text-muted)" }} />}
                            checkedIcon={<CheckBoxOutlinedIcon sx={{ fontSize: 18, color: "var(--vx-primary)" }} />}
                          />
                        }
                        label={<Typography sx={switchLabelSx}>{cat}</Typography>}
                      />
                    ))}
                  </FormGroup>
                </Box>
                <Box sx={{ minWidth: 220 }}>
                  <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)", mb: 0.75 }}>Tab default</Typography>
                  <Select value={config.default_tab} onChange={e => setConfig(p => ({ ...p, default_tab: Number(e.target.value) }))} size="small" fullWidth sx={selectSx}>
                    <MenuItem value={0}>0 — Tutte / All</MenuItem>
                    {config.visible_categories.map((cat, i) => <MenuItem key={cat} value={i + 1}>{i + 1} — {cat}</MenuItem>)}
                  </Select>
                </Box>
              </Stack>
            )}
          </Box>

          {/* Opzioni display */}
          <Box>
            <SectionLabel>Opzioni display</SectionLabel>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 1, alignItems: { md: "center" } }}>
              <TextField
                label="Limite elementi (0 = tutti)" type="number"
                value={config.items_limit}
                onChange={e => setConfig(p => ({ ...p, items_limit: Math.max(0, parseInt(e.target.value) || 0) }))}
                size="small" sx={{ ...fieldSx, maxWidth: { md: 220 } }}
              />
              <FormControlLabel
                control={<Switch checked={config.show_ref_badge} onChange={e => setConfig(p => ({ ...p, show_ref_badge: e.target.checked }))} size="small" sx={switchSx} />}
                label={<Typography sx={switchLabelSx}>Mostra badge No (es. No 016)</Typography>}
              />
            </Stack>
          </Box>

          {/* Bottone CTA */}
          <Box>
            <SectionLabel>Bottone CTA</SectionLabel>
            <Stack spacing={1.5} sx={{ mt: 0.5 }}>
              <FormControlLabel
                control={<Switch checked={config.show_cta} onChange={e => setConfig(p => ({ ...p, show_cta: e.target.checked }))} size="small" sx={switchSx} />}
                label={<Typography sx={switchLabelSx}>Mostra bottone</Typography>}
              />
              {config.show_cta && (
                <TextField label={`Label CTA [${L}]`} value={config.cta_label[editLang]} onChange={e => updateBilingual("cta_label", e.target.value)} fullWidth size="small" sx={fieldSx} />
              )}
            </Stack>
          </Box>

          {/* Salvataggio */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--vx-border)", pt: 2.5 }}>
            <Button
              onClick={handleSave}
              disabled={saving}
              startIcon={saving
                ? <CircularProgress size={14} color="inherit" />
                : hasUnsaved
                  ? <FiberManualRecordIcon sx={{ fontSize: "10px !important", color: "#f59e0b" }} />
                  : <SaveOutlinedIcon sx={{ fontSize: 16 }} />
              }
              variant="contained"
              sx={{
                fontSize: 13, fontWeight: 700, textTransform: "none", borderRadius: "8px", px: 2.5,
                bgcolor: hasUnsaved ? "var(--vx-primary)" : "var(--vx-surface-muted)",
                color: hasUnsaved ? "#fff" : "var(--vx-text-secondary)",
                boxShadow: "none",
                "&:hover": { bgcolor: "var(--vx-primary)", color: "#fff", boxShadow: "none" }
              }}
            >
              {saving ? "Salvataggio..." : hasUnsaved ? "Salva modifiche" : "Salvato"}
            </Button>
          </Box>

        </Stack>
      </Paper>

      {/* Toast */}
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast(t => ({ ...t, open: false }))} sx={{ fontSize: 13 }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export const CtxCataloguePanel = VtxCataloguePanel;
