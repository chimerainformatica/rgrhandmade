"use client";

import { useEffect, useState } from "react";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import CheckBoxOutlineBlankOutlinedIcon from "@mui/icons-material/CheckBoxOutlineBlankOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Drawer,
  FormControlLabel,
  FormGroup,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from "@mui/material";
import type { VtxCatalogueConfig } from "@/lib/vitrix/types";
import { DEFAULT_VTX_CATALOGUE_CONFIG } from "@/lib/vitrix/types";

/* ── constants ─────────────────────────────────────────────── */
const API_URL = "/api/vitrix/widget-settings/vtx_catalogue";
const LEGACY_API_URL = "/api/vitrix/widget-settings/ctx_catalogue";
const ALL_CATEGORIES = ["Anelli", "Bracciali", "Collane", "Orecchini"];
const DRAWER_WIDTH = 360;
const DRAWER_KEY = "vitrix-vtx-drawer";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--vx-input-bg)",
    color: "var(--vx-text-primary)",
    "& fieldset": { borderColor: "var(--vx-input-border)" },
    "&:hover fieldset": { borderColor: "var(--vx-primary)" },
    "&.Mui-focused fieldset": { borderColor: "var(--vx-primary)", borderWidth: 2 }
  },
  "& .MuiInputLabel-root": { color: "var(--vx-text-muted)", fontSize: 12 },
  "& .MuiInputLabel-root.Mui-focused": { color: "var(--vx-primary)" },
  "& .MuiInputBase-input": { fontSize: 13, color: "var(--vx-text-primary)" }
};

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--vx-text-muted)", mb: 1.5, mt: 2.5 }}>
      {children}
    </Typography>
  );
}

/* ── Preview component ──────────────────────────────────────── */
function CataloguePreview({ config, lang }: { config: VtxCatalogueConfig; lang: "it" | "en" }) {
  const CATEGORY_LABELS: Record<string, { it: string; en: string }> = {
    Anelli:    { it: "Anelli",    en: "Rings" },
    Bracciali: { it: "Bracciali", en: "Bracelets" },
    Collane:   { it: "Collane",   en: "Necklaces" },
    Orecchini: { it: "Orecchini", en: "Earrings" },
  };

  const tabs = [
    { key: "all", label: lang === "it" ? "Tutte" : "All" },
    ...(config.show_filters ? config.visible_categories.map(c => ({ key: c, label: CATEGORY_LABELS[c]?.[lang] ?? c })) : [])
  ];

  const MOCK_CARDS = [
    { ref: "No 016", title: "Spirale",      category: "Anelli" },
    { ref: "No 015", title: "Trama",        category: "Bracciali" },
    { ref: "No 014", title: "Riflesso",     category: "Collane" },
    { ref: "No 013", title: "Architettura", category: "Orecchini" },
  ];

  if (!config.enabled) {
    return (
      <Box sx={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography sx={{ fontSize: 13, fontStyle: "italic", color: "var(--vx-text-muted)" }}>
          Sezione disabilitata — non visibile nel sito.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ background: "#FAF8F4", p: "40px 48px", fontFamily: "'Cormorant Garamond', Georgia, serif", minHeight: 420 }}>
      {/* Eyebrow */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Box sx={{ width: 32, height: 1, bgcolor: "#B8946A" }} />
        <Typography sx={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "#B8946A" }}>
          {config.eyebrow[lang]}
        </Typography>
      </Box>

      {/* Title */}
      <Typography sx={{ fontSize: 32, fontWeight: 400, lineHeight: 1.05, mb: 1, color: "#1A1713" }}>
        {config.title_pre[lang]}{" "}
        <em style={{ fontStyle: "italic", color: "#B8946A" }}>{config.title_em[lang]}</em>
      </Typography>

      {/* Lede */}
      <Typography sx={{ fontFamily: "'Manrope', sans-serif", fontSize: 12.5, color: "#8C7B6B", lineHeight: 1.65, mb: 3, maxWidth: 480 }}>
        {config.lede[lang]}
      </Typography>

      {/* Tabs */}
      {config.show_filters && tabs.length > 1 && (
        <Box sx={{ display: "flex", gap: 1, mb: 3.5, flexWrap: "wrap" }}>
          {tabs.map((tab, i) => (
            <Box key={tab.key} sx={{
              px: 2, py: 0.75, borderRadius: 999, border: "1px solid",
              borderColor: i === config.default_tab ? "#1A1713" : "#D8D0C6",
              bgcolor: i === config.default_tab ? "#1A1713" : "transparent",
              color: i === config.default_tab ? "#FAF8F4" : "#8C7B6B",
              fontFamily: "'Manrope', sans-serif", fontSize: 10,
              letterSpacing: "0.16em", textTransform: "uppercase"
            }}>
              {tab.label}
            </Box>
          ))}
        </Box>
      )}

      {/* Collection / grid preview */}
      {!config.show_filters ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "1.05fr 1.1fr", gap: 1.25 }}>
          <Box sx={{ minHeight: 280, bgcolor: "#D5CFC8", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,18,16,0.64), transparent 62%)" }} />
            <Box sx={{ position: "absolute", left: 22, bottom: 22 }}>
              <Typography sx={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C0A16F", mb: 1 }}>
                Collection RGR
              </Typography>
              <Typography sx={{ fontSize: 36, fontStyle: "italic", lineHeight: 1, color: "#fff" }}>
                Parure
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
            {MOCK_CARDS.map(card => (
              <Box key={card.ref} sx={{ minHeight: 132, bgcolor: "#F6EFE5", border: "1px solid #D8C8B4", p: 1.5, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <Box sx={{ flex: 1, bgcolor: "#fff", display: "grid", placeItems: "center", mb: 1 }}>
                  <Typography sx={{ fontSize: 30, color: "#1A1713", opacity: 0.08, fontStyle: "italic" }}>{card.title[0]}</Typography>
                </Box>
                <Typography sx={{ fontFamily: "'Manrope', sans-serif", fontSize: 9, color: "#B8946A", letterSpacing: "0.18em", textTransform: "uppercase" }}>{card.category}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
          {MOCK_CARDS.map(card => (
            <Box key={card.ref}>
              <Box sx={{ aspectRatio: "3/4", bgcolor: "#D5CFC8", borderRadius: "2px", mb: 1, position: "relative", overflow: "hidden" }}>
                {config.show_ref_badge && (
                  <Box sx={{ position: "absolute", top: 6, left: 6, px: 1, py: 0.5, borderRadius: 999, bgcolor: "rgba(250,248,244,0.9)", border: "1px solid rgba(0,0,0,0.1)", fontSize: 9, fontStyle: "italic", color: "#1A1713" }}>
                    {card.ref}
                  </Box>
                )}
                <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: 0.07 }}>
                  <Typography sx={{ fontSize: 48, color: "#1A1713", fontStyle: "italic" }}>{card.title[0]}</Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: 14, fontWeight: 400, color: "#1A1713", lineHeight: 1.3 }}>{card.title}</Typography>
              <Typography sx={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, color: "#8C7B6B", letterSpacing: "0.18em", textTransform: "uppercase", mt: 0.5 }}>{card.category}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* CTA */}
      {config.show_cta && (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Box sx={{ px: 4, py: 1.5, borderRadius: 999, border: "1px solid #1A1713", fontFamily: "'Manrope', sans-serif", fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "#1A1713" }}>
            {config.cta_label[lang]} {"→"}
          </Box>
        </Box>
      )}
    </Box>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════ */
export function VtxCataloguePanel() {
  const [config, setConfig]         = useState<VtxCatalogueConfig>(DEFAULT_VTX_CATALOGUE_CONFIG);
  const [savedConfig, setSavedConfig] = useState<VtxCatalogueConfig>(DEFAULT_VTX_CATALOGUE_CONFIG);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [editLang, setEditLang]     = useState<"it" | "en">("it");
  const [previewLang, setPreviewLang] = useState<"it" | "en">("it");
  const [drawerOpen, setDrawerOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(DRAWER_KEY) !== "closed";
  });
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

  /* Drawer state persistence */
  function toggleDrawer() {
    setDrawerOpen(prev => {
      const next = !prev;
      localStorage.setItem(DRAWER_KEY, next ? "open" : "closed");
      return next;
    });
  }

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

  return (
    <Box sx={{ display: "flex", minHeight: "calc(100vh - 56px)", position: "relative", overflow: "hidden" }}>

      {/* ── LEFT DRAWER ─────────────────────────────────────────── */}
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          transition: "width 0.25s ease",
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            position: "relative",
            height: "calc(100vh - 56px)",
            border: "none",
            borderRight: "1px solid var(--vx-border)",
            bgcolor: "var(--vx-surface)",
            overflow: "auto",
            boxSizing: "border-box"
          }
        }}
      >
        {/* Drawer header */}
        <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid var(--vx-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--vx-text-muted)" }}>
            Impostazioni
          </Typography>
          <ToggleButtonGroup value={editLang} exclusive onChange={(_, v) => v && setEditLang(v)} size="small" sx={toggleBtnSx}>
            <ToggleButton value="it">IT</ToggleButton>
            <ToggleButton value="en">EN</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Drawer body */}
        <Box sx={{ px: 2.5, pb: 4 }}>

          {/* Lang hint */}
          <Box sx={{ mt: 2, mb: 0.5, px: 1.5, py: 1, borderRadius: "8px", bgcolor: "var(--vx-primary-soft)", display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 11, color: "var(--vx-primary)", fontWeight: 600 }}>
              Stai modificando in {editLang.toUpperCase()}
            </Typography>
            <Typography sx={{ fontSize: 11, color: "var(--vx-text-muted)" }}>
              — cambia per tradurre
            </Typography>
          </Box>

          {/* Visibility */}
          <SectionLabel>Visibilita</SectionLabel>
          <FormControlLabel
            control={<Switch checked={config.enabled} onChange={e => setConfig(p => ({ ...p, enabled: e.target.checked }))} size="small" sx={switchSx} />}
            label={<Typography sx={{ fontSize: 13, color: "var(--vx-text-secondary)" }}>Sezione abilitata</Typography>}
          />

          {/* Texts */}
          <SectionLabel>Testi [{editLang.toUpperCase()}]</SectionLabel>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <TextField
              label="Slug catalogo selezionato"
              value={config.catalogue_slug}
              onChange={e => setConfig(p => ({ ...p, catalogue_slug: e.target.value }))}
              fullWidth
              size="small"
              sx={fieldSx}
              helperText="Inserisci lo slug della collection da usare come sorgente dei tab e delle immagini."
            />
            <TextField label="Eyebrow" value={config.eyebrow[editLang]} onChange={e => updateBilingual("eyebrow", e.target.value)} fullWidth size="small" sx={fieldSx} />
            <TextField label="Titolo (prima parte)" value={config.title_pre[editLang]} onChange={e => updateBilingual("title_pre", e.target.value)} fullWidth size="small" sx={fieldSx} />
            <TextField label="Titolo (corsivo dorato)" value={config.title_em[editLang]} onChange={e => updateBilingual("title_em", e.target.value)} fullWidth size="small" sx={fieldSx} />
            <TextField label="Lede" value={config.lede[editLang]} onChange={e => updateBilingual("lede", e.target.value)} fullWidth size="small" multiline rows={2} sx={fieldSx} />
          </Box>

          {/* Tab navigation */}
          <SectionLabel>Navigazione a tab</SectionLabel>
          <FormControlLabel
            control={<Switch checked={config.show_filters} onChange={e => setConfig(p => ({ ...p, show_filters: e.target.checked }))} size="small" sx={switchSx} />}
            label={<Typography sx={{ fontSize: 13, color: "var(--vx-text-secondary)" }}>Mostra navigazione a tab nel front</Typography>}
          />
          {config.show_filters && (
            <Box sx={{ mt: 1.5 }}>
              <FormGroup sx={{ gap: 0.25 }}>
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
                    label={<Typography sx={{ fontSize: 13, color: "var(--vx-text-secondary)" }}>{cat}</Typography>}
                  />
                ))}
              </FormGroup>
              <Box sx={{ mt: 1.5 }}>
                <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)", mb: 0.75 }}>Tab default</Typography>
                <Select value={config.default_tab} onChange={e => setConfig(p => ({ ...p, default_tab: Number(e.target.value) }))} size="small" fullWidth
                  sx={{ fontSize: 13, color: "var(--vx-text-primary)", bgcolor: "var(--vx-input-bg)", "& fieldset": { borderColor: "var(--vx-input-border)" } }}>
                  <MenuItem value={0}>0 — Tutte / All</MenuItem>
                  {config.visible_categories.map((cat, i) => <MenuItem key={cat} value={i + 1}>{i + 1} — {cat}</MenuItem>)}
                </Select>
              </Box>
            </Box>
          )}

          {/* Options */}
          <SectionLabel>Opzioni display</SectionLabel>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <TextField
              label="Limite elementi (0 = tutti)" type="number"
              value={config.items_limit}
              onChange={e => setConfig(p => ({ ...p, items_limit: Math.max(0, parseInt(e.target.value) || 0) }))}
              fullWidth size="small" sx={fieldSx}
            />
            <FormControlLabel
              control={<Switch checked={config.show_ref_badge} onChange={e => setConfig(p => ({ ...p, show_ref_badge: e.target.checked }))} size="small" sx={switchSx} />}
              label={<Typography sx={{ fontSize: 13, color: "var(--vx-text-secondary)" }}>Mostra badge No (es. No 016)</Typography>}
            />
          </Box>

          {/* CTA */}
          <SectionLabel>Bottone CTA</SectionLabel>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <FormControlLabel
              control={<Switch checked={config.show_cta} onChange={e => setConfig(p => ({ ...p, show_cta: e.target.checked }))} size="small" sx={switchSx} />}
              label={<Typography sx={{ fontSize: 13, color: "var(--vx-text-secondary)" }}>Mostra bottone</Typography>}
            />
            {config.show_cta && (
              <TextField label={`Label CTA [${editLang.toUpperCase()}]`} value={config.cta_label[editLang]} onChange={e => updateBilingual("cta_label", e.target.value)} fullWidth size="small" sx={fieldSx} />
            )}
          </Box>
        </Box>
      </Drawer>

      {/* ── MAIN AREA ───────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, transition: "all 0.25s ease" }}>

        {/* Internal topbar */}
        <Box sx={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          px: 2.5, height: 52, borderBottom: "1px solid var(--vx-border)",
          bgcolor: "var(--vx-surface)", flexShrink: 0, gap: 2
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Tooltip title={drawerOpen ? "Chiudi impostazioni" : "Apri impostazioni"} arrow>
              <IconButton onClick={toggleDrawer} size="small" sx={{ color: drawerOpen ? "var(--vx-primary)" : "var(--vx-text-muted)", bgcolor: drawerOpen ? "var(--vx-primary-soft)" : "transparent", borderRadius: "8px", width: 32, height: 32, "&:hover": { bgcolor: "var(--vx-surface-muted)" } }}>
                <TuneOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Box>
              <Typography sx={{ fontSize: 11, color: "var(--vx-text-muted)", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700 }}>VTX Widget</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: "var(--vx-text-primary)", lineHeight: 1.2 }}>VTX Collection</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Tooltip title="Apri sito" arrow>
              <IconButton component="a" href="/#catalogue" target="_blank" size="small"
                sx={{ color: "var(--vx-text-muted)", borderRadius: "8px", width: 32, height: 32, "&:hover": { bgcolor: "var(--vx-surface-muted)", color: "var(--vx-text-primary)" } }}>
                <OpenInNewOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
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
              size="small"
              sx={{
                fontSize: 12, fontWeight: 600, borderRadius: "8px", px: 2,
                bgcolor: hasUnsaved ? "var(--vx-primary)" : "var(--vx-surface-muted)",
                color: hasUnsaved ? "#fff" : "var(--vx-text-secondary)",
                boxShadow: "none",
                "&:hover": { bgcolor: "var(--vx-primary)", color: "#fff", boxShadow: "none" }
              }}
            >
              {saving ? "Salvataggio..." : hasUnsaved ? "Salva modifiche" : "Salvato"}
            </Button>
          </Box>
        </Box>

        {/* Preview area */}
        <Box sx={{ flex: 1, overflow: "auto", bgcolor: "var(--vx-bg)" }}>
          <Box sx={{ p: 3 }}>
            {/* Preview header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--vx-text-muted)" }}>
                  Anteprima
                </Typography>
                <Chip label="live" size="small" sx={{ height: 18, fontSize: 10, bgcolor: "#e6f4ea", color: "#2e7d32", fontWeight: 700 }} />
              </Box>
              <ToggleButtonGroup value={previewLang} exclusive onChange={(_, v) => v && setPreviewLang(v)} size="small" sx={toggleBtnSx}>
                <ToggleButton value="it">IT</ToggleButton>
                <ToggleButton value="en">EN</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Preview card */}
            <Box sx={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--vx-border)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <CataloguePreview config={config} lang={previewLang} />
            </Box>

            <Typography sx={{ mt: 1.5, fontSize: 11, color: "var(--vx-text-muted)", textAlign: "center" }}>
              Anteprima con dati mock — le card reali vengono da Catalogue
            </Typography>
          </Box>
        </Box>
      </Box>

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
