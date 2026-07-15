"use client";

import { useEffect, useState } from "react";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography
} from "@mui/material";
import { DEFAULT_VTX_EVENTS_CONFIG, normalizeVtxEventsConfig, type VtxEventsConfig } from "@/lib/vitrix/types";
import { fieldSx } from "@/lib/admin-theme";

type ToastState = { open: boolean; message: string; severity: "success" | "error" };

export function VtxEventsPanel() {
  const [config, setConfig] = useState<VtxEventsConfig>(DEFAULT_VTX_EVENTS_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>({ open: false, message: "", severity: "success" });

  useEffect(() => {
    let active = true;
    fetch("/api/vitrix/widget-settings/vtx_events")
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        setConfig(normalizeVtxEventsConfig(json.config));
      })
      .catch(() => setToast({ open: true, message: "Errore nel caricamento configurazione.", severity: "error" }))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/vitrix/widget-settings/vtx_events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Errore salvataggio.");
      setConfig(normalizeVtxEventsConfig(json.config ?? config));
      setToast({ open: true, message: "Widget Eventi aggiornato.", severity: "success" });
    } catch (err) {
      setToast({ open: true, message: err instanceof Error ? err.message : "Errore salvataggio.", severity: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: 320, display: "grid", placeItems: "center" }}>
        <CircularProgress size={22} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 980 }}>
      <Paper sx={{ p: 3, bgcolor: "var(--vx-surface)", border: "1px solid var(--vx-border)", borderRadius: "12px", boxShadow: "none" }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "var(--vx-text-primary)" }}>
              Widget Eventi
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 13, color: "var(--vx-text-muted)" }}>
              Configura la sezione pubblica #news e il numero di eventi mostrati in homepage.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Nome widget" value={config.name} onChange={(e) => setConfig((p) => ({ ...p, name: e.target.value }))} fullWidth sx={fieldSx} />
            <TextField label="Section ID" value={config.section_id} onChange={(e) => setConfig((p) => ({ ...p, section_id: e.target.value }))} sx={fieldSx} />
            <TextField label="Posizione" type="number" value={config.position} onChange={(e) => setConfig((p) => ({ ...p, position: Number(e.target.value) }))} sx={fieldSx} />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Titolo IT" value={config.title.it} onChange={(e) => setConfig((p) => ({ ...p, title: { ...p.title, it: e.target.value } }))} fullWidth sx={fieldSx} />
            <TextField label="Titolo EN" value={config.title.en} onChange={(e) => setConfig((p) => ({ ...p, title: { ...p.title, en: e.target.value } }))} fullWidth sx={fieldSx} />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Descrizione IT" value={config.description.it} onChange={(e) => setConfig((p) => ({ ...p, description: { ...p.description, it: e.target.value } }))} fullWidth multiline minRows={2} sx={fieldSx} />
            <TextField label="Descrizione EN" value={config.description.en} onChange={(e) => setConfig((p) => ({ ...p, description: { ...p.description, en: e.target.value } }))} fullWidth multiline minRows={2} sx={fieldSx} />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField select label="Layout" value={config.layout} onChange={(e) => setConfig((p) => ({ ...p, layout: e.target.value as VtxEventsConfig["layout"] }))} fullWidth sx={fieldSx}>
              <MenuItem value="featured-grid">Featured grid</MenuItem>
              <MenuItem value="cards">Cards</MenuItem>
            </TextField>
            <TextField select label="Ordinamento" value={config.sort} onChange={(e) => setConfig((p) => ({ ...p, sort: e.target.value as VtxEventsConfig["sort"] }))} fullWidth sx={fieldSx}>
              <MenuItem value="featured_then_date_desc">Featured + data desc</MenuItem>
              <MenuItem value="date_desc">Data desc</MenuItem>
              <MenuItem value="manual">Manuale</MenuItem>
            </TextField>
            <TextField label="Limite eventi" type="number" value={config.items_limit} onChange={(e) => setConfig((p) => ({ ...p, items_limit: Number(e.target.value) }))} sx={fieldSx} />
          </Stack>

          <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap" }}>
            <FormControlLabel control={<Switch checked={config.enabled} onChange={(e) => setConfig((p) => ({ ...p, enabled: e.target.checked }))} />} label="Abilitato" />
            <FormControlLabel control={<Switch checked={config.show_filters} onChange={(e) => setConfig((p) => ({ ...p, show_filters: e.target.checked }))} />} label="Mostra filtri" />
            <FormControlLabel control={<Switch checked={config.featured_first} onChange={(e) => setConfig((p) => ({ ...p, featured_first: e.target.checked }))} />} label="Featured prima" />
          </Stack>

          <Box sx={{ p: 2.5, border: "1px solid var(--vx-border)", borderRadius: "12px", bgcolor: "var(--vx-surface-soft)" }}>
            <Stack spacing={2.25}>
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 800, color: "var(--vx-text-primary)" }}>
                    Sezione Pubblicazioni
                  </Typography>
                  <Typography sx={{ mt: 0.35, fontSize: 12.5, color: "var(--vx-text-muted)" }}>
                    Griglia separata di copertine verticali, senza pagine dettaglio.
                  </Typography>
                </Box>
                <FormControlLabel
                  control={<Switch checked={config.publications.enabled} onChange={(e) => setConfig((p) => ({ ...p, publications: { ...p.publications, enabled: e.target.checked } }))} />}
                  label="Abilitata"
                />
              </Box>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Section ID" value={config.publications.section_id} onChange={(e) => setConfig((p) => ({ ...p, publications: { ...p.publications, section_id: e.target.value } }))} fullWidth sx={fieldSx} />
                <TextField label="Limite pubblicazioni" type="number" value={config.publications.items_limit} onChange={(e) => setConfig((p) => ({ ...p, publications: { ...p.publications, items_limit: Math.max(1, Number(e.target.value)) } }))} sx={fieldSx} />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Titolo pubblicazioni IT" value={config.publications.title.it} onChange={(e) => setConfig((p) => ({ ...p, publications: { ...p.publications, title: { ...p.publications.title, it: e.target.value } } }))} fullWidth sx={fieldSx} />
                <TextField label="Titolo pubblicazioni EN" value={config.publications.title.en} onChange={(e) => setConfig((p) => ({ ...p, publications: { ...p.publications, title: { ...p.publications.title, en: e.target.value } } }))} fullWidth sx={fieldSx} />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Descrizione pubblicazioni IT" value={config.publications.description.it} onChange={(e) => setConfig((p) => ({ ...p, publications: { ...p.publications, description: { ...p.publications.description, it: e.target.value } } }))} fullWidth multiline minRows={2} sx={fieldSx} />
                <TextField label="Descrizione pubblicazioni EN" value={config.publications.description.en} onChange={(e) => setConfig((p) => ({ ...p, publications: { ...p.publications, description: { ...p.publications.description, en: e.target.value } } }))} fullWidth multiline minRows={2} sx={fieldSx} />
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={handleSave} disabled={saving} variant="contained" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveOutlinedIcon />} sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 700 }}>
              {saving ? "Salvataggio..." : "Salva configurazione"}
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Snackbar open={toast.open} autoHideDuration={3500} onClose={() => setToast((p) => ({ ...p, open: false }))}>
        <Alert severity={toast.severity} variant="filled" sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
