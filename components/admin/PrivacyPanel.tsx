"use client";

import { useEffect, useState } from "react";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined";
import KeyboardArrowUpOutlinedIcon from "@mui/icons-material/KeyboardArrowUpOutlined";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControlLabel, IconButton, MenuItem, Paper, Snackbar, Stack, Switch as MuiSwitch, Tab, Tabs,
  TextField, Tooltip, Typography, useMediaQuery, useTheme, type SwitchProps,
} from "@mui/material";
import { fieldSx } from "@/lib/admin-theme";
import {
  DEFAULT_PRIVACY_CONFIG, PRIVACY_CATEGORY_IDS, isConsentMaterialChange, isProtectedPrivacyService,
  textFor, validatePrivacyConfigInput, type BilingualText, type PrivacyCategoryId, type PrivacyConfig,
  type PrivacyLang, type PrivacyPolicySection, type PrivacyService,
} from "@/lib/privacy/types";

type HistoryRow = { revision: number; consent_version: number; published_at: string; requires_renewal: boolean };
type AdminState = { draft: PrivacyConfig; published: PrivacyConfig; history: HistoryRow[]; consentCount: number; publishedRevision: number; updatedAt: string | null; publishedAt?: string | null };
type Toast = { open: boolean; message: string; severity: "success" | "error" };
type EditorState = { kind: "section"; index: number | null; value: PrivacyPolicySection } | { kind: "service"; index: number | null; value: PrivacyService };
type DeleteState = { kind: "section" | "service"; index: number; label: string } | null;

const cardSx = { p: { xs: 2, md: 3 }, border: "1px solid var(--vx-border)", borderRadius: "12px", bgcolor: "var(--vx-surface)", boxShadow: "none" };
const listCardSx = { p: 2, border: "1px solid var(--vx-border)", borderRadius: "12px", bgcolor: "var(--vx-surface-soft)", boxShadow: "none" };
const snapshot = (value: PrivacyConfig) => JSON.stringify(value);
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

function Switch({ inputProps, ...props }: SwitchProps & { inputProps?: { "aria-label"?: string } }) {
  return <MuiSwitch {...props} slotProps={{ input: inputProps }} />;
}
const reorder = <T extends { sortOrder: number }>(items: T[], from: number, to: number) => {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next.map((entry, index) => ({ ...entry, sortOrder: index }));
};

function BiFields({ label, value, onChange, multiline = false }: { label: string; value: BilingualText; onChange: (value: BilingualText) => void; multiline?: boolean }) {
  return <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
    <TextField fullWidth required label={`${label} IT`} value={value.it} onChange={(event) => onChange({ ...value, it: event.target.value })} multiline={multiline} minRows={multiline ? 3 : undefined} sx={fieldSx} />
    <TextField fullWidth required label={`${label} EN`} value={value.en} onChange={(event) => onChange({ ...value, en: event.target.value })} multiline={multiline} minRows={multiline ? 3 : undefined} sx={fieldSx} />
  </Stack>;
}

function RowActions({ index, length, onMove, onEdit, onDuplicate, onDelete, deleteDisabled = false }: { index: number; length: number; onMove: (to: number) => void; onEdit: () => void; onDuplicate: () => void; onDelete: () => void; deleteDisabled?: boolean }) {
  return <Stack direction="row" spacing={0.25}>
    <Tooltip title="Sposta su"><span><IconButton size="small" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Sposta su"><KeyboardArrowUpOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
    <Tooltip title="Sposta giu"><span><IconButton size="small" disabled={index === length - 1} onClick={() => onMove(index + 1)} aria-label="Sposta giu"><KeyboardArrowDownOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
    <Tooltip title="Modifica"><IconButton size="small" onClick={onEdit} aria-label="Modifica"><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
    <Tooltip title="Duplica"><IconButton size="small" onClick={onDuplicate} aria-label="Duplica"><ContentCopyOutlinedIcon fontSize="small" /></IconButton></Tooltip>
    <Tooltip title={deleteDisabled ? "Elemento protetto" : "Elimina"}><span><IconButton size="small" color="error" disabled={deleteDisabled} onClick={onDelete} aria-label="Elimina"><DeleteOutlineOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
  </Stack>;
}

function Preview({ config }: { config: PrivacyConfig }) {
  const [lang, setLang] = useState<PrivacyLang>("it");
  const [preferences, setPreferences] = useState(false);
  const categories = config.categories.filter((item) => item.enabled).sort((a, b) => a.sortOrder - b.sortOrder);
  return <Box sx={{ minHeight: 480, p: { xs: 1.5, md: 3 }, borderRadius: "16px", position: "relative", overflow: "hidden", bgcolor: "#171411", backgroundImage: "radial-gradient(circle at 15% 10%, rgba(184,146,84,.22), transparent 34%), linear-gradient(145deg,#171411,#0d0b09)" }}>
    <Stack direction="row" spacing={1} sx={{ mb: 3 }}>{(["it", "en"] as PrivacyLang[]).map((item) => <Button key={item} size="small" variant={lang === item ? "contained" : "outlined"} onClick={() => setLang(item)}>{item.toUpperCase()}</Button>)}</Stack>
    <Box sx={{ position: "absolute", inset: preferences ? { xs: 0, md: "24px 24px 24px auto" } : { xs: "auto 12px 12px", md: "auto 24px 24px" }, width: preferences ? { xs: "100%", md: 440 } : "auto", maxWidth: preferences ? "100%" : 760, bgcolor: "#f7f2ea", color: "#171411", border: "1px solid rgba(184,146,84,.45)", boxShadow: "0 24px 80px rgba(0,0,0,.38)", p: { xs: 2.25, md: 3 }, overflow: "auto" }}>
      <Typography sx={{ fontFamily: "var(--font-cormorant)", fontSize: 30, lineHeight: 1.05 }}>{textFor(preferences ? config.banner.settingsTitle : config.banner.title, lang)}</Typography>
      {!preferences ? <><Typography sx={{ mt: 1.5, fontSize: 13.5, lineHeight: 1.65, color: "#655d53" }}>{textFor(config.banner.description, lang)}</Typography><Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 2.5 }}><Button variant="contained">{textFor(config.banner.acceptAll, lang)}</Button><Button variant="outlined">{textFor(config.banner.rejectAll, lang)}</Button><Button onClick={() => setPreferences(true)}>{textFor(config.banner.customize, lang)}</Button></Stack></> : <Stack spacing={1.25} sx={{ mt: 2.5 }}>{categories.map((category) => <Box key={category.id} sx={{ p: 1.5, border: "1px solid rgba(23,20,17,.12)", bgcolor: "rgba(184,146,84,.08)" }}><Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}><Box><Typography sx={{ fontWeight: 800, fontSize: 14 }}>{textFor(category.label, lang)}</Typography><Typography sx={{ fontSize: 11.5, color: "#71685e" }}>{textFor(category.description, lang)}</Typography></Box><Switch checked={category.required} disabled={category.required} /></Stack></Box>)}<Button variant="contained" onClick={() => setPreferences(false)}>{textFor(config.banner.save, lang)}</Button></Stack>}
    </Box>
  </Box>;
}

export function PrivacyPanel({ canManage }: { canManage: boolean }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [state, setState] = useState<AdminState | null>(null);
  const [config, setConfig] = useState<PrivacyConfig>(DEFAULT_PRIVACY_CONFIG);
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot(DEFAULT_PRIVACY_CONFIG));
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [toast, setToast] = useState<Toast>({ open: false, message: "", severity: "success" });
  const dirty = snapshot(config) !== savedSnapshot;

  async function load() {
    try {
      const response = await fetch("/api/vitrix/privacy");
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Caricamento non riuscito.");
      setState(body); setConfig(body.draft); setSavedSnapshot(snapshot(body.draft));
    } catch (error) { setToast({ open: true, severity: "error", message: error instanceof Error ? error.message : "Caricamento non riuscito." }); }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save(showToast = true) {
    const errors = validatePrivacyConfigInput(config);
    if (errors.length) { setToast({ open: true, severity: "error", message: errors[0] }); return false; }
    setSaving(true);
    try {
      const response = await fetch("/api/vitrix/privacy", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Salvataggio non riuscito.");
      setConfig(body.config); setSavedSnapshot(snapshot(body.config));
      if (showToast) setToast({ open: true, severity: "success", message: "Bozza privacy salvata." });
      return true;
    } catch (error) { setToast({ open: true, severity: "error", message: error instanceof Error ? error.message : "Salvataggio non riuscito." }); return false; }
    finally { setSaving(false); }
  }

  async function publish() {
    setConfirmPublish(false); setPublishing(true);
    try {
      if (!await save(false)) return;
      const response = await fetch("/api/vitrix/privacy/publish", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Pubblicazione non riuscita.");
      setToast({ open: true, severity: "success", message: body.requiresRenewal ? "Pubblicato: agli utenti sara richiesta una nuova scelta." : "Nuova revisione pubblicata." });
      await load();
    } catch (error) { setToast({ open: true, severity: "error", message: error instanceof Error ? error.message : "Pubblicazione non riuscita." }); }
    finally { setPublishing(false); }
  }

  function requestPublish() {
    if (state && isConsentMaterialChange(state.published, config)) setConfirmPublish(true);
    else void publish();
  }

  function saveEditor() {
    if (!editor) return;
    let next = config;
    if (editor.kind === "section") {
      next = { ...config, privacyPolicy: { ...config.privacyPolicy, sections: editor.index === null ? [...config.privacyPolicy.sections, { ...editor.value, sortOrder: config.privacyPolicy.sections.length }] : config.privacyPolicy.sections.map((item, index) => index === editor.index ? editor.value : item) } };
    } else {
      next = { ...config, services: editor.index === null ? [...config.services, { ...editor.value, sortOrder: config.services.length }] : config.services.map((item, index) => index === editor.index ? editor.value : item) };
    }
    const errors = validatePrivacyConfigInput(next);
    if (errors.length) { setToast({ open: true, severity: "error", message: errors[0] }); return; }
    setConfig(next); setEditor(null);
  }

  function confirmDelete() {
    if (!deleteState) return;
    if (deleteState.kind === "section") setConfig((current) => ({ ...current, privacyPolicy: { ...current.privacyPolicy, sections: current.privacyPolicy.sections.filter((_item, index) => index !== deleteState.index).map((item, index) => ({ ...item, sortOrder: index })) } }));
    else setConfig((current) => ({ ...current, services: current.services.filter((_item, index) => index !== deleteState.index).map((item, index) => ({ ...item, sortOrder: index })) }));
    setDeleteState(null);
  }

  if (!canManage) return <Box sx={{ p: 3 }}><Alert severity="warning">Non hai il permesso per gestire privacy e cookie.</Alert></Box>;
  if (!state) return <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}><CircularProgress size={24} /></Box>;

  return <Box sx={{ p: { xs: 2, md: 3, lg: 4 }, maxWidth: 1220 }}>
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3, justifyContent: "space-between", alignItems: { md: "center" } }}>
      <Box><Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><ShieldOutlinedIcon color="primary" /><Typography component="h2" sx={{ fontSize: 22, fontWeight: 800 }}>Privacy & Cookie</Typography>{dirty && <Chip size="small" color="warning" label="Modifiche non salvate" />}</Stack><Typography sx={{ mt: .5, color: "var(--vx-text-muted)", fontSize: 13 }}>Revisione {state.publishedRevision} · versione consenso {state.published.version} · {state.consentCount} ricevute</Typography></Box>
      <Stack direction="row" spacing={1}><Button variant="outlined" disabled={!dirty || saving || publishing} startIcon={saving ? <CircularProgress size={14} /> : <SaveOutlinedIcon />} onClick={() => void save()}>Salva bozza</Button><Button variant="contained" disabled={saving || publishing} startIcon={publishing ? <CircularProgress size={14} color="inherit" /> : <PublishOutlinedIcon />} onClick={requestPublish}>Pubblica</Button></Stack>
    </Stack>

    <Paper sx={{ ...cardSx, p: 0, overflow: "hidden" }}>
      <Tabs value={tab} onChange={(_event, value) => setTab(value)} variant="scrollable" scrollButtons="auto" sx={{ px: 1, borderBottom: "1px solid var(--vx-border)" }}><Tab label="Anagrafica" /><Tab label="Testi" /><Tab label="Categorie" /><Tab label="Servizi" /><Tab label="Connettori" /><Tab label="Anteprima" /><Tab label="Registro" /></Tabs>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {tab === 0 && <Stack spacing={2}><Alert severity="info">Dati verificati sulla visura camerale ordinaria del 05/06/2026.</Alert><TextField label="Denominazione ufficiale" value={config.legal.legalName} onChange={(e) => setConfig((p) => ({ ...p, legal: { ...p.legal, legalName: e.target.value } }))} fullWidth sx={fieldSx} /><Stack direction={{ xs: "column", md: "row" }} spacing={2}><TextField label="Forma giuridica" value={config.legal.legalForm} onChange={(e) => setConfig((p) => ({ ...p, legal: { ...p.legal, legalForm: e.target.value } }))} fullWidth sx={fieldSx} /><TextField label="Attivita" value={config.legal.activity} onChange={(e) => setConfig((p) => ({ ...p, legal: { ...p.legal, activity: e.target.value } }))} fullWidth sx={fieldSx} /><TextField label="ATECO" value={config.legal.ateco} onChange={(e) => setConfig((p) => ({ ...p, legal: { ...p.legal, ateco: e.target.value } }))} fullWidth sx={fieldSx} /></Stack><Stack direction={{ xs: "column", md: "row" }} spacing={2}><TextField label="Codice fiscale" value={config.legal.taxCode} onChange={(e) => setConfig((p) => ({ ...p, legal: { ...p.legal, taxCode: e.target.value } }))} fullWidth sx={fieldSx} /><TextField label="Partita IVA" value={config.legal.vatNumber} onChange={(e) => setConfig((p) => ({ ...p, legal: { ...p.legal, vatNumber: e.target.value } }))} fullWidth sx={fieldSx} /><TextField label="REA" value={config.legal.rea} onChange={(e) => setConfig((p) => ({ ...p, legal: { ...p.legal, rea: e.target.value } }))} fullWidth sx={fieldSx} /></Stack><TextField label="Indirizzo" value={config.legal.address} onChange={(e) => setConfig((p) => ({ ...p, legal: { ...p.legal, address: e.target.value } }))} fullWidth sx={fieldSx} /><Stack direction={{ xs: "column", md: "row" }} spacing={2}>{(["postalCode", "city", "province", "country"] as const).map((key) => <TextField key={key} label={{ postalCode: "CAP", city: "Citta", province: "Provincia", country: "Paese" }[key]} value={config.legal[key]} onChange={(e) => setConfig((p) => ({ ...p, legal: { ...p.legal, [key]: e.target.value } }))} fullWidth sx={fieldSx} />)}</Stack><Stack direction={{ xs: "column", md: "row" }} spacing={2}><TextField label="Email privacy" type="email" value={config.legal.privacyEmail} onChange={(e) => setConfig((p) => ({ ...p, legal: { ...p.legal, privacyEmail: e.target.value } }))} fullWidth sx={fieldSx} /><TextField label="PEC" type="email" value={config.legal.pec} onChange={(e) => setConfig((p) => ({ ...p, legal: { ...p.legal, pec: e.target.value } }))} fullWidth sx={fieldSx} /><TextField label="Telefono" value={config.legal.phone} onChange={(e) => setConfig((p) => ({ ...p, legal: { ...p.legal, phone: e.target.value } }))} fullWidth sx={fieldSx} /></Stack><Stack direction={{ xs: "column", md: "row" }} spacing={2}><TextField type="number" label="Validita consenso (giorni)" value={config.consentValidityDays} onChange={(e) => setConfig((p) => ({ ...p, consentValidityDays: Number(e.target.value) }))} fullWidth sx={fieldSx} /><TextField type="number" label="Conservazione ricevute (mesi)" value={config.receiptRetentionMonths} onChange={(e) => setConfig((p) => ({ ...p, receiptRetentionMonths: Number(e.target.value) }))} fullWidth sx={fieldSx} /></Stack></Stack>}

        {tab === 1 && <Stack spacing={3}><Typography sx={{ fontWeight: 800 }}>Banner e preferenze</Typography><BiFields label="Titolo banner" value={config.banner.title} onChange={(value) => setConfig((p) => ({ ...p, banner: { ...p.banner, title: value } }))} /><BiFields label="Descrizione banner" value={config.banner.description} multiline onChange={(value) => setConfig((p) => ({ ...p, banner: { ...p.banner, description: value } }))} />{(["acceptAll", "rejectAll", "customize", "save", "settingsTitle"] as const).map((key) => <BiFields key={key} label={{ acceptAll: "Accetta tutti", rejectAll: "Rifiuta tutti", customize: "Personalizza", save: "Salva", settingsTitle: "Titolo preferenze" }[key]} value={config.banner[key]} onChange={(value) => setConfig((p) => ({ ...p, banner: { ...p.banner, [key]: value } }))} />)}<Divider /><Typography sx={{ fontWeight: 800 }}>Informative</Typography><BiFields label="Titolo privacy" value={config.privacyPolicy.title} onChange={(value) => setConfig((p) => ({ ...p, privacyPolicy: { ...p.privacyPolicy, title: value } }))} /><BiFields label="Introduzione privacy" value={config.privacyPolicy.intro} multiline onChange={(value) => setConfig((p) => ({ ...p, privacyPolicy: { ...p.privacyPolicy, intro: value } }))} /><Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}><Typography sx={{ fontWeight: 800 }}>Sezioni privacy</Typography><Button startIcon={<AddOutlinedIcon />} onClick={() => setEditor({ kind: "section", index: null, value: { id: newId("section"), title: { it: "Nuova sezione", en: "New section" }, body: { it: "", en: "" }, enabled: true, sortOrder: config.privacyPolicy.sections.length } })}>Aggiungi</Button></Stack>{config.privacyPolicy.sections.map((section, index) => <Paper key={section.id} sx={listCardSx}><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}><Switch checked={section.enabled} onChange={(e) => setConfig((p) => ({ ...p, privacyPolicy: { ...p.privacyPolicy, sections: p.privacyPolicy.sections.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: e.target.checked } : item) } }))} inputProps={{ "aria-label": `Abilita ${section.title.it}` }} /><Box sx={{ flex: 1, minWidth: 0 }}><Typography sx={{ fontWeight: 800 }}>{section.title.it}</Typography><Typography sx={{ color: "var(--vx-text-muted)", fontSize: 12 }}>{section.id} · {section.enabled ? "Pubblicata" : "Disabilitata"}</Typography></Box><RowActions index={index} length={config.privacyPolicy.sections.length} onMove={(to) => setConfig((p) => ({ ...p, privacyPolicy: { ...p.privacyPolicy, sections: reorder(p.privacyPolicy.sections, index, to) } }))} onEdit={() => setEditor({ kind: "section", index, value: structuredClone(section) })} onDuplicate={() => setConfig((p) => ({ ...p, privacyPolicy: { ...p.privacyPolicy, sections: [...p.privacyPolicy.sections, { ...structuredClone(section), id: newId("section"), title: { it: `${section.title.it} (copia)`, en: `${section.title.en} (copy)` }, sortOrder: p.privacyPolicy.sections.length }] } }))} onDelete={() => setDeleteState({ kind: "section", index, label: section.title.it })} /></Stack></Paper>)}<Divider /><BiFields label="Titolo cookie policy" value={config.cookiePolicy.title} onChange={(value) => setConfig((p) => ({ ...p, cookiePolicy: { ...p.cookiePolicy, title: value } }))} /><BiFields label="Introduzione cookie policy" value={config.cookiePolicy.intro} multiline onChange={(value) => setConfig((p) => ({ ...p, cookiePolicy: { ...p.cookiePolicy, intro: value } }))} /></Stack>}

        {tab === 2 && <Stack spacing={2}><Alert severity="info">Le quattro categorie sono standard. Necessari resta sempre attiva; le altre possono essere disabilitate senza perdere servizi e connettori configurati.</Alert>{config.categories.map((category, index) => <Paper key={category.id} sx={listCardSx}><Stack spacing={2}><Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}><FormControlLabel sx={{ flex: 1 }} control={<Switch checked={category.enabled} disabled={category.required} onChange={(e) => setConfig((p) => ({ ...p, categories: p.categories.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: e.target.checked } : item) }))} />} label={<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><Typography sx={{ fontWeight: 800 }}>{category.label.it}</Typography>{category.required && <Chip size="small" label="Obbligatoria" />}</Stack>} /><Stack direction="row"><IconButton disabled={index === 0} onClick={() => setConfig((p) => ({ ...p, categories: reorder(p.categories, index, index - 1) }))} aria-label="Sposta categoria su"><KeyboardArrowUpOutlinedIcon /></IconButton><IconButton disabled={index === config.categories.length - 1} onClick={() => setConfig((p) => ({ ...p, categories: reorder(p.categories, index, index + 1) }))} aria-label="Sposta categoria giu"><KeyboardArrowDownOutlinedIcon /></IconButton></Stack></Stack><BiFields label="Nome" value={category.label} onChange={(value) => setConfig((p) => ({ ...p, categories: p.categories.map((item, itemIndex) => itemIndex === index ? { ...item, label: value } : item) }))} /><BiFields label="Descrizione" value={category.description} multiline onChange={(value) => setConfig((p) => ({ ...p, categories: p.categories.map((item, itemIndex) => itemIndex === index ? { ...item, description: value } : item) }))} /></Stack></Paper>)}</Stack>}

        {tab === 3 && <Stack spacing={2}><Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}><Box><Typography sx={{ fontWeight: 800 }}>Servizi cookie e tecnologie</Typography><Typography sx={{ color: "var(--vx-text-muted)", fontSize: 12 }}>I servizi protetti sono sincronizzati con le funzionalita tecniche del sito.</Typography></Box><Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => setEditor({ kind: "service", index: null, value: { id: newId("service"), name: "Nuovo servizio", provider: "", category: "preferences", purpose: { it: "", en: "" }, storage: "", duration: { it: "", en: "" }, policyUrl: "https://", active: false, sortOrder: config.services.length } })}>Aggiungi servizio</Button></Stack>{config.services.map((service, index) => { const protectedItem = isProtectedPrivacyService(service.id); return <Paper key={service.id} sx={listCardSx}><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}><Switch checked={service.active} disabled={protectedItem} onChange={(e) => setConfig((p) => ({ ...p, services: p.services.map((item, itemIndex) => itemIndex === index ? { ...item, active: e.target.checked } : item) }))} inputProps={{ "aria-label": `Abilita ${service.name}` }} /><Box sx={{ flex: 1, minWidth: 0 }}><Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}><Typography sx={{ fontWeight: 800 }}>{service.name}</Typography><Chip size="small" label={service.category} />{protectedItem && <Chip size="small" color="info" label={service.id === "cloudflare-turnstile" ? "Sincronizzato" : "Protetto"} />}</Stack><Typography sx={{ color: "var(--vx-text-muted)", fontSize: 12 }}>{service.provider} · {service.id}</Typography></Box><RowActions index={index} length={config.services.length} onMove={(to) => setConfig((p) => ({ ...p, services: reorder(p.services, index, to) }))} onEdit={() => setEditor({ kind: "service", index, value: structuredClone(service) })} onDuplicate={() => setConfig((p) => ({ ...p, services: [...p.services, { ...structuredClone(service), id: newId("service"), name: `${service.name} (copia)`, active: false, sortOrder: p.services.length }] }))} onDelete={() => setDeleteState({ kind: "service", index, label: service.name })} deleteDisabled={protectedItem} /></Stack></Paper>; })}</Stack>}

        {tab === 4 && <Stack spacing={2.5}><Alert severity={config.connectors.ga4.enabled || config.connectors.metaPixel.enabled ? "warning" : "success"}>{config.connectors.ga4.enabled || config.connectors.metaPixel.enabled ? "Sono configurati servizi non tecnici: il banner verra mostrato quando la categoria associata e attiva." : "I connettori opzionali sono disattivati."}</Alert><Paper sx={listCardSx}><Stack spacing={1.5}><FormControlLabel control={<Switch checked={config.connectors.ga4.enabled} onChange={(e) => setConfig((p) => ({ ...p, connectors: { ...p.connectors, ga4: { ...p.connectors.ga4, enabled: e.target.checked } } }))} />} label="Google Analytics 4" /><TextField label="Measurement ID (G-...)" value={config.connectors.ga4.measurementId} onChange={(e) => setConfig((p) => ({ ...p, connectors: { ...p.connectors, ga4: { ...p.connectors.ga4, measurementId: e.target.value } } }))} fullWidth sx={fieldSx} /></Stack></Paper><Paper sx={listCardSx}><Stack spacing={1.5}><FormControlLabel control={<Switch checked={config.connectors.metaPixel.enabled} onChange={(e) => setConfig((p) => ({ ...p, connectors: { ...p.connectors, metaPixel: { ...p.connectors.metaPixel, enabled: e.target.checked } } }))} />} label="Meta Pixel" /><TextField label="Pixel ID" value={config.connectors.metaPixel.pixelId} onChange={(e) => setConfig((p) => ({ ...p, connectors: { ...p.connectors, metaPixel: { ...p.connectors.metaPixel, pixelId: e.target.value } } }))} fullWidth sx={fieldSx} /></Stack></Paper></Stack>}
        {tab === 5 && <Preview config={config} />}
        {tab === 6 && <Stack spacing={2}><Paper sx={listCardSx}><Typography sx={{ fontSize: 32, fontWeight: 800 }}>{state.consentCount}</Typography><Typography sx={{ color: "var(--vx-text-muted)" }}>Ricevute pseudonime registrate</Typography></Paper>{state.history.length === 0 ? <Alert severity="info">Nessuna revisione pubblicata.</Alert> : state.history.map((item) => <Paper key={item.revision} sx={listCardSx}><Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between" }}><Typography sx={{ fontWeight: 800 }}>Revisione {item.revision} · consenso v{item.consent_version}</Typography><Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>{new Date(item.published_at).toLocaleString("it-IT")}</Typography></Stack>{item.requires_renewal && <Typography sx={{ mt: .5, color: "var(--vx-warning)", fontSize: 12 }}>Ha richiesto una nuova scelta agli utenti.</Typography>}</Paper>)}</Stack>}
      </Box>
    </Paper>

    <Dialog open={Boolean(editor)} onClose={() => setEditor(null)} fullScreen={fullScreen} fullWidth maxWidth="md"><DialogTitle>{editor?.index === null ? "Aggiungi" : "Modifica"} {editor?.kind === "section" ? "sezione" : "servizio"}</DialogTitle><DialogContent dividers>{editor?.kind === "section" && <Stack spacing={2} sx={{ pt: 1 }}><TextField label="ID stabile" value={editor.value.id} disabled={editor.index !== null} sx={fieldSx} /><FormControlLabel control={<Switch checked={editor.value.enabled} onChange={(e) => setEditor({ ...editor, value: { ...editor.value, enabled: e.target.checked } })} />} label="Sezione attiva" /><BiFields label="Titolo" value={editor.value.title} onChange={(value) => setEditor({ ...editor, value: { ...editor.value, title: value } })} /><BiFields label="Testo" value={editor.value.body} multiline onChange={(value) => setEditor({ ...editor, value: { ...editor.value, body: value } })} /></Stack>}{editor?.kind === "service" && <Stack spacing={2} sx={{ pt: 1 }}><Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField fullWidth label="ID stabile" value={editor.value.id} disabled={editor.index !== null} sx={fieldSx} /><TextField select fullWidth label="Categoria" value={editor.value.category} disabled={isProtectedPrivacyService(editor.value.id)} onChange={(e) => setEditor({ ...editor, value: { ...editor.value, category: e.target.value as PrivacyCategoryId } })} sx={fieldSx}>{PRIVACY_CATEGORY_IDS.map((id) => <MenuItem key={id} value={id}>{id}</MenuItem>)}</TextField></Stack><FormControlLabel control={<Switch checked={editor.value.active} disabled={isProtectedPrivacyService(editor.value.id)} onChange={(e) => setEditor({ ...editor, value: { ...editor.value, active: e.target.checked } })} />} label="Servizio attivo" /><Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField fullWidth required label="Nome" value={editor.value.name} onChange={(e) => setEditor({ ...editor, value: { ...editor.value, name: e.target.value } })} sx={fieldSx} /><TextField fullWidth required label="Provider" value={editor.value.provider} onChange={(e) => setEditor({ ...editor, value: { ...editor.value, provider: e.target.value } })} sx={fieldSx} /></Stack><BiFields label="Finalita" value={editor.value.purpose} multiline onChange={(value) => setEditor({ ...editor, value: { ...editor.value, purpose: value } })} /><Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField fullWidth required label="Cookie / storage" value={editor.value.storage} onChange={(e) => setEditor({ ...editor, value: { ...editor.value, storage: e.target.value } })} sx={fieldSx} /><TextField fullWidth required label="Policy URL" value={editor.value.policyUrl} onChange={(e) => setEditor({ ...editor, value: { ...editor.value, policyUrl: e.target.value } })} sx={fieldSx} /></Stack><BiFields label="Durata" value={editor.value.duration} onChange={(value) => setEditor({ ...editor, value: { ...editor.value, duration: value } })} /></Stack>}</DialogContent><DialogActions><Button onClick={() => setEditor(null)}>Annulla</Button><Button variant="contained" onClick={saveEditor}>Conferma</Button></DialogActions></Dialog>
    <Dialog open={Boolean(deleteState)} onClose={() => setDeleteState(null)}><DialogTitle>Eliminare “{deleteState?.label}”?</DialogTitle><DialogContent><Typography sx={{ color: "var(--vx-text-secondary)" }}>L’elemento verra rimosso dalla bozza. Le versioni gia pubblicate resteranno nello storico.</Typography></DialogContent><DialogActions><Button onClick={() => setDeleteState(null)}>Annulla</Button><Button color="error" variant="contained" onClick={confirmDelete}>Elimina</Button></DialogActions></Dialog>
    <Dialog open={confirmPublish} onClose={() => setConfirmPublish(false)}><DialogTitle>Pubblicare una modifica sostanziale?</DialogTitle><DialogContent><Alert severity="warning">Categorie, servizi, finalita o connettori sono cambiati. I consensi precedenti verranno invalidati e gli utenti dovranno scegliere di nuovo.</Alert></DialogContent><DialogActions><Button onClick={() => setConfirmPublish(false)}>Annulla</Button><Button variant="contained" onClick={() => void publish()}>Pubblica e rinnova</Button></DialogActions></Dialog>
    <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast((p) => ({ ...p, open: false }))}><Alert severity={toast.severity} variant="filled">{toast.message}</Alert></Snackbar>
  </Box>;
}
