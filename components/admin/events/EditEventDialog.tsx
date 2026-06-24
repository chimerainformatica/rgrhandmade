"use client";

import { useEffect, useMemo, useState } from "react";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { EventCategoryRow } from "@/lib/vitrix/event-categories";
import type { VtxEventRow, VitrixPressType } from "@/lib/vitrix/types";
import { fieldSx, iconBtnSx } from "@/lib/admin-theme";

export type EventFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  type: VitrixPressType;
  category: string;
  venue: string;
  event_date: string;
  event_start_at: string;
  event_end_at: string;
  lang: string;
  status: "draft" | "published";
  description: string;
  content: string;
  tags: string;
  main_image_url: string;
  image_alt: string;
  image_position: string;
  cta_label: string;
  cta_url: string;
  cta_target: "_self" | "_blank";
  is_featured: boolean;
  sort_order: number;
  widget_id: string;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  robots_index: boolean;
  robots_follow: boolean;
};

type FormErrors = Partial<Record<keyof EventFormValues | "main_image", string>>;

type Props = {
  open: boolean;
  mode: "create" | "edit";
  event: VtxEventRow | null;
  value: EventFormValues;
  categories: EventCategoryRow[];
  imageFile: File | null;
  saving: boolean;
  onChange: (value: EventFormValues) => void;
  onImageFileChange: (file: File | null) => void;
  onClose: () => void;
  onSave: (value: EventFormValues) => Promise<void> | void;
  onDelete: (event: VtxEventRow) => void;
};

const objectPositionPresets = [
  ["50% 50%", "Centro"],
  ["25% 50%", "Sinistra"],
  ["75% 50%", "Destra"],
  ["50% 25%", "Alto"],
  ["50% 75%", "Basso"],
];

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function isValidHttpUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sectionTitle(index: number, title: string) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
      <Box sx={{ width: 22, height: 22, display: "grid", placeItems: "center", borderRadius: "7px", bgcolor: "var(--vx-primary)", color: "#fff", fontSize: 12, fontWeight: 800 }}>
        {index}
      </Box>
      <Typography sx={{ fontSize: 13, fontWeight: 800, color: "var(--vx-text-primary)" }}>
        {title}
      </Typography>
    </Stack>
  );
}

function fieldError(errors: FormErrors, key: keyof EventFormValues) {
  return Boolean(errors[key]);
}

function helper(errors: FormErrors, key: keyof EventFormValues, fallback?: string) {
  return errors[key] || fallback || " ";
}

export function EditEventDialog({
  open,
  mode,
  event,
  value,
  categories,
  imageFile,
  saving,
  onChange,
  onImageFileChange,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [errors, setErrors] = useState<FormErrors>({});
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const previewImage = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    return value.main_image_url;
  }, [imageFile, value.main_image_url]);

  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) URL.revokeObjectURL(previewImage);
    };
  }, [previewImage]);

  useEffect(() => {
    if (open) {
      setErrors({});
      setDirty(false);
      setConfirmClose(false);
      setConfirmDelete(false);
    }
  }, [open, event?.id]);

  function update(patch: Partial<EventFormValues>) {
    onChange({ ...value, ...patch });
    setDirty(true);
  }

  function validate(current: EventFormValues) {
    const next: FormErrors = {};
    if (!current.title.trim()) next.title = "Titolo obbligatorio.";
    if (current.title.length > 180) next.title = "Massimo 180 caratteri.";
    if (!current.slug.trim()) next.slug = "Slug SEO obbligatorio.";
    if (!current.widget_id.trim()) next.widget_id = "Widget associato obbligatorio.";
    if (!current.type) next.type = "Tipo obbligatorio.";
    if (!current.status) next.status = "Stato obbligatorio.";
    if (!current.event_date.trim()) next.event_date = "Data label obbligatoria.";
    if (current.excerpt.length > 180) next.excerpt = "Massimo 180 caratteri.";
    if (current.seo_description.length > 160) next.seo_description = "Massimo 160 caratteri.";
    if (current.cta_url && !isValidHttpUrl(current.cta_url)) next.cta_url = "Inserisci un URL valido.";
    if (current.canonical_url && !isValidHttpUrl(current.canonical_url)) next.canonical_url = "Inserisci un URL valido.";
    if (current.status === "published" && !current.main_image_url.trim() && !imageFile) {
      next.main_image = "Per pubblicare serve una immagine principale o un upload.";
    }
    if (current.event_start_at && current.event_end_at && new Date(current.event_end_at) < new Date(current.event_start_at)) {
      next.event_end_at = "La fine non puo precedere l'inizio.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    const candidate = value.slug.trim() ? value : { ...value, slug: slugify(value.title) };
    if (candidate !== value) onChange(candidate);
    if (!validate(candidate)) return;
    await onSave(candidate);
    setDirty(false);
  }

  function requestClose() {
    if (dirty && !saving) {
      setConfirmClose(true);
      return;
    }
    onClose();
  }

  const formColumn = (
    <Stack spacing={2.25}>
      <Paper sx={{ p: 2, border: "1px solid var(--vx-border)", borderRadius: "12px", boxShadow: "none" }}>
        {sectionTitle(1, "Dati principali")}
        <Stack spacing={1.75}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5}>
            <TextField label="Titolo *" value={value.title} onChange={(e) => update({ title: e.target.value, slug: value.slug || slugify(e.target.value) })} error={fieldError(errors, "title")} helperText={helper(errors, "title", `${value.title.length}/180`)} fullWidth sx={fieldSx} />
            <TextField label="Slug SEO *" value={value.slug} onChange={(e) => update({ slug: slugify(e.target.value) })} error={fieldError(errors, "slug")} helperText={helper(errors, "slug")} fullWidth sx={fieldSx} />
            <TextField label="Widget associato *" value={value.widget_id} onChange={(e) => update({ widget_id: e.target.value })} error={fieldError(errors, "widget_id")} helperText={helper(errors, "widget_id")} fullWidth sx={fieldSx} />
          </Stack>
          <TextField label="Descrizione breve / excerpt" value={value.excerpt} onChange={(e) => update({ excerpt: e.target.value })} error={fieldError(errors, "excerpt")} helperText={helper(errors, "excerpt", `${value.excerpt.length}/180`)} fullWidth multiline minRows={2} slotProps={{ htmlInput: { maxLength: 180 } }} sx={fieldSx} />
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, border: "1px solid var(--vx-border)", borderRadius: "12px", boxShadow: "none" }}>
        {sectionTitle(2, "Scheduling & location")}
        <Stack spacing={1.75}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5}>
            <TextField select label="Tipo *" value={value.type} onChange={(e) => update({ type: e.target.value as VitrixPressType })} error={fieldError(errors, "type")} helperText={helper(errors, "type")} fullWidth sx={fieldSx}>
              <MenuItem value="event">Evento</MenuItem>
              <MenuItem value="fiera">Fiera</MenuItem>
              <MenuItem value="press">Press</MenuItem>
            </TextField>
            <TextField select label="Stato *" value={value.status} onChange={(e) => update({ status: e.target.value as "draft" | "published" })} error={fieldError(errors, "status")} helperText={helper(errors, "status")} fullWidth sx={fieldSx}>
              <MenuItem value="draft">Bozza</MenuItem>
              <MenuItem value="published">Pubblicato</MenuItem>
            </TextField>
            <TextField label="Ordinamento" type="number" value={value.sort_order} onChange={(e) => update({ sort_order: Number(e.target.value) })} sx={fieldSx} />
          </Stack>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5}>
            <TextField label="Luogo / venue" value={value.venue} onChange={(e) => update({ venue: e.target.value })} fullWidth sx={fieldSx} />
            <TextField label="Data label *" value={value.event_date} onChange={(e) => update({ event_date: e.target.value })} error={fieldError(errors, "event_date")} helperText={helper(errors, "event_date")} fullWidth placeholder="es. Marzo 2026" sx={fieldSx} />
          </Stack>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5}>
            <TextField label="Inizio evento" type="datetime-local" value={value.event_start_at} onChange={(e) => update({ event_start_at: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} sx={fieldSx} />
            <TextField label="Fine evento" type="datetime-local" value={value.event_end_at} onChange={(e) => update({ event_end_at: e.target.value })} error={fieldError(errors, "event_end_at")} helperText={helper(errors, "event_end_at")} fullWidth slotProps={{ inputLabel: { shrink: true } }} sx={fieldSx} />
          </Stack>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5}>
            <Autocomplete
              freeSolo
              options={categories.map((category) => category.name)}
              value={value.category || ""}
              onChange={(_, next) => update({ category: typeof next === "string" ? next : next ?? "" })}
              onInputChange={(_, next) => update({ category: next })}
              fullWidth
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categoria"
                  helperText="Scegli una categoria esistente o scrivine una nuova."
                  sx={fieldSx}
                />
              )}
            />
            <TextField label="Tag" value={value.tags} onChange={(e) => update({ tags: e.target.value })} fullWidth placeholder="artigianato, fiera, press" sx={fieldSx} />
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, border: "1px solid var(--vx-border)", borderRadius: "12px", boxShadow: "none" }}>
        {sectionTitle(3, "Contenuto")}
        <Stack spacing={1.75}>
          <TextField label="Descrizione" value={value.description} onChange={(e) => update({ description: e.target.value })} fullWidth multiline minRows={3} helperText={`${value.description.length}/1000`} sx={fieldSx} />
          <TextField label="Contenuto completo" value={value.content} onChange={(e) => update({ content: e.target.value })} fullWidth multiline minRows={4} helperText={`${value.content.length}/5000`} sx={fieldSx} />
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, border: "1px solid var(--vx-border)", borderRadius: "12px", boxShadow: "none" }}>
        {sectionTitle(4, "Media hero")}
        <Stack spacing={1.75}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5}>
            <TextField label="URL immagine principale" value={value.main_image_url} onChange={(e) => update({ main_image_url: e.target.value })} error={Boolean(errors.main_image)} helperText={errors.main_image || " "} fullWidth sx={fieldSx} />
            <TextField label="Alt immagine" value={value.image_alt} onChange={(e) => update({ image_alt: e.target.value })} fullWidth sx={fieldSx} />
            <TextField select label="Object position" value={value.image_position} onChange={(e) => update({ image_position: e.target.value })} sx={fieldSx}>
              {objectPositionPresets.map(([position, label]) => <MenuItem key={position} value={position}>{label} ({position})</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
            <Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />} sx={{ textTransform: "none", borderRadius: "8px", borderColor: "var(--vx-border)", color: "var(--vx-text-secondary)" }}>
              Carica immagine WebP
              <input hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => { const file = e.target.files?.[0] ?? null; onImageFileChange(file); setDirty(true); if (file) update({ image_alt: value.image_alt || value.title }); }} />
            </Button>
            <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>
              {imageFile ? `${imageFile.name} - conversione WebP al salvataggio` : "JPG, PNG, WebP o AVIF. Max 10MB."}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, border: "1px solid var(--vx-border)", borderRadius: "12px", boxShadow: "none" }}>
        {sectionTitle(5, "CTA")}
        <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5}>
          <TextField label="CTA label" value={value.cta_label} onChange={(e) => update({ cta_label: e.target.value })} fullWidth sx={fieldSx} />
          <TextField label="CTA URL" value={value.cta_url} onChange={(e) => update({ cta_url: e.target.value })} error={fieldError(errors, "cta_url")} helperText={helper(errors, "cta_url")} fullWidth sx={fieldSx} />
          <TextField select label="Target" value={value.cta_target} onChange={(e) => update({ cta_target: e.target.value as "_self" | "_blank" })} sx={fieldSx}>
            <MenuItem value="_self">Stessa pagina</MenuItem>
            <MenuItem value="_blank">Nuova finestra</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, border: "1px solid var(--vx-border)", borderRadius: "12px", boxShadow: "none" }}>
        {sectionTitle(6, "SEO & visibilita")}
        <Stack spacing={1.75}>
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
            <FormControlLabel control={<Switch checked={value.is_featured} onChange={(e) => update({ is_featured: e.target.checked })} />} label="In evidenza" />
            <FormControlLabel control={<Switch checked={value.robots_index} onChange={(e) => update({ robots_index: e.target.checked })} />} label="Robots index" />
            <FormControlLabel control={<Switch checked={value.robots_follow} onChange={(e) => update({ robots_follow: e.target.checked })} />} label="Robots follow" />
          </Stack>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5}>
            <TextField label="SEO title" value={value.seo_title} onChange={(e) => update({ seo_title: e.target.value })} fullWidth sx={fieldSx} />
            <TextField label="Canonical URL" value={value.canonical_url} onChange={(e) => update({ canonical_url: e.target.value })} error={fieldError(errors, "canonical_url")} helperText={helper(errors, "canonical_url")} fullWidth sx={fieldSx} />
          </Stack>
          <TextField label="SEO description" value={value.seo_description} onChange={(e) => update({ seo_description: e.target.value })} error={fieldError(errors, "seo_description")} helperText={helper(errors, "seo_description", `${value.seo_description.length}/160`)} fullWidth multiline minRows={2} slotProps={{ htmlInput: { maxLength: 160 } }} sx={fieldSx} />
        </Stack>
      </Paper>
    </Stack>
  );

  const previewColumn = (
    <Stack spacing={2} sx={{ position: { lg: "sticky" }, top: { lg: 16 }, alignSelf: "flex-start" }}>
      <Paper sx={{ border: "1px solid var(--vx-border)", borderRadius: "14px", overflow: "hidden", boxShadow: "none", bgcolor: "var(--vx-surface)" }}>
        <Box sx={{ aspectRatio: "16 / 9", bgcolor: "var(--vx-surface-muted)", position: "relative" }}>
          {previewImage ? (
            <Box component="img" src={previewImage} alt={value.image_alt || value.title || "Anteprima evento"} sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: value.image_position }} />
          ) : (
            <Box sx={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--vx-text-muted)", fontSize: 12 }}>
              Anteprima immagine hero
            </Box>
          )}
          {(previewImage || imageFile) && (
            <IconButton size="small" aria-label="Rimuovi immagine" onClick={() => { onImageFileChange(null); update({ main_image_url: "" }); }} sx={{ position: "absolute", top: 8, right: 8, bgcolor: "rgba(255,255,255,.9)", "&:hover": { bgcolor: "#fff" } }}>
              <CloseOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={0.75} sx={{ mb: 1, flexWrap: "wrap" }}>
            <Chip size="small" label={value.type || "Evento"} sx={{ height: 22, fontSize: 11, bgcolor: "var(--vx-primary-soft)", color: "var(--vx-primary)" }} />
            <Chip size="small" label={value.status === "published" ? "Pubblicato" : "Bozza"} sx={{ height: 22, fontSize: 11 }} />
            {value.is_featured && <Chip size="small" label="In evidenza" sx={{ height: 22, fontSize: 11 }} />}
          </Stack>
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: "var(--vx-text-primary)", mb: 0.5 }}>
            {value.title || "Titolo evento"}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "var(--vx-text-secondary)", mb: 1.25 }}>
            {value.excerpt || value.description || "Descrizione breve visibile nella card del frontend."}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>
            {value.event_date || "Data label"}{value.venue ? ` · ${value.venue}` : ""}
          </Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, border: "1px solid var(--vx-border)", borderRadius: "14px", boxShadow: "none" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: "var(--vx-text-primary)", mb: 1.5 }}>
          Informazioni
        </Typography>
        <Stack spacing={1}>
          {[
            ["Slug", value.slug || "-"],
            ["Widget", value.widget_id || "-"],
            ["Categoria", value.category || "-"],
            ["Lingua", value.lang.toUpperCase()],
            ["Robots", `${value.robots_index ? "index" : "noindex"}, ${value.robots_follow ? "follow" : "nofollow"}`],
          ].map(([label, text]) => (
            <Stack key={label} direction="row" spacing={1} sx={{ justifyContent: "space-between", gap: 2 }}>
              <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>{label}</Typography>
              <Typography sx={{ fontSize: 12, color: "var(--vx-text-secondary)", textAlign: "right", overflowWrap: "anywhere" }}>{text}</Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );

  return (
    <>
      <Dialog open={open} onClose={requestClose} fullScreen={fullScreen} maxWidth="xl" fullWidth sx={{ zIndex: 1400 }} slotProps={{ paper: { sx: { bgcolor: "var(--vx-bg)", color: "var(--vx-text-primary)", borderRadius: fullScreen ? 0 : "16px", overflow: "hidden" } } }}>
        <DialogTitle sx={{ p: 0, borderBottom: "1px solid var(--vx-border)", bgcolor: "var(--vx-surface)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: { xs: 2, md: 3 }, py: 2, width: "100%" }}>
            <Box sx={{ p: 0.8, borderRadius: "9px", bgcolor: "var(--vx-primary-soft)", color: "var(--vx-primary)", display: "flex" }}>
              <ArticleOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 800 }}>{mode === "edit" ? "Modifica evento" : "Aggiungi evento"}</Typography>
              <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>Aggiorna contenuti, media, SEO e visibilita.</Typography>
            </Box>
            {mode === "edit" && event && (
              <Button size="small" color="error" startIcon={<DeleteOutlinedIcon />} onClick={() => setConfirmDelete(true)} sx={{ display: { xs: "none", sm: "inline-flex" }, textTransform: "none", borderRadius: "8px" }}>
                Elimina evento
              </Button>
            )}
            <IconButton size="small" onClick={requestClose} sx={iconBtnSx("default")} aria-label="Chiudi dialog evento">
              <CloseOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, md: 3 }, overflowY: "auto" }}>
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
              Controlla i campi evidenziati prima di salvare.
            </Alert>
          )}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.85fr) minmax(320px, 1fr)" }, gap: 2.5, alignItems: "start" }}>
            {formColumn}
            {previewColumn}
          </Box>
        </DialogContent>

        <Divider sx={{ borderColor: "var(--vx-border)" }} />
        <DialogActions sx={{ px: { xs: 2, md: 3 }, py: 2, gap: 1, bgcolor: "var(--vx-surface)", position: "sticky", bottom: 0, zIndex: 2 }}>
          <Button onClick={requestClose} sx={{ textTransform: "none", fontSize: 13, color: "var(--vx-text-secondary)", borderRadius: "8px", borderColor: "var(--vx-border)" }} variant="outlined">
            Annulla
          </Button>
          <Button onClick={save} disabled={saving} variant="contained" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null} sx={{ textTransform: "none", fontSize: 13, fontWeight: 700, borderRadius: "8px", background: "var(--vx-gradient-brand)", boxShadow: "none" }}>
            {saving ? "Salvataggio..." : mode === "edit" ? "Salva modifiche" : "Crea evento"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmClose} onClose={() => setConfirmClose(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Modifiche non salvate</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14 }}>Chiudendo il dialog perderai le modifiche non salvate.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClose(false)} sx={{ textTransform: "none" }}>Continua modifica</Button>
          <Button onClick={() => { setConfirmClose(false); onClose(); }} color="error" variant="contained" sx={{ textTransform: "none" }}>Chiudi senza salvare</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Elimina evento</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14 }}>Vuoi eliminare definitivamente &quot;{event?.title}&quot;?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} sx={{ textTransform: "none" }}>Annulla</Button>
          <Button onClick={() => { if (event) onDelete(event); setConfirmDelete(false); }} color="error" variant="contained" startIcon={<DeleteOutlinedIcon />} sx={{ textTransform: "none" }}>Elimina</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
