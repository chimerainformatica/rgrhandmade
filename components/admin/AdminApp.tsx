"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import StyleOutlinedIcon from "@mui/icons-material/StyleOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import FileOpenOutlinedIcon from "@mui/icons-material/FileOpenOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import WidgetsOutlinedIcon from "@mui/icons-material/WidgetsOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import { usePathname } from "next/navigation";
import { AdminLoadingBoundary } from "@/components/admin/AdminLoadingBoundary";
import { CollectionsPanel as MediaGalleryPanel } from "@/components/admin/MediaGalleryPanel";
import { EventsPanel } from "@/components/admin/EventsPanel";
import { SiteCataloguePanel } from "@/components/admin/SiteCataloguePanel";
import { VitrixLoader } from "@/components/admin/VitrixLoader";
import { WidgetsModule } from "@/components/admin/WidgetsModule";
import type { AdminModuleId } from "@/lib/admin-modules";
import type { VitrixUser } from "@/lib/vitrix/auth";
import type { VitrixBootstrap, VitrixLogFile, VitrixModuleRow, VitrixSiteSettings } from "@/lib/vitrix/types";

/* ── constants ─────────────────────────────────────────────── */
const SESSION_KEY = "rgr-admin-session";
const DEMO_USER = "admin@rgrhandmade.it";
const DEMO_PASSWORD = "rgrdemo";
const ALLOW_DEMO_LOGIN = process.env.NODE_ENV !== "production";
const SIDEBAR_W = 64;

/* ── module metadata ─────────────────────────────────────────── */
const moduleIcons: Record<AdminModuleId, React.ElementType> = {
  dashboard: DashboardOutlinedIcon,
  catalogue: StyleOutlinedIcon,
  events: ArticleOutlinedIcon,
  media: PhotoLibraryOutlinedIcon,
  settings: SettingsOutlinedIcon,
  widgets: WidgetsOutlinedIcon
};

const moduleMeta: Record<AdminModuleId, { title: string; eyebrow: string }> = {
  dashboard: { title: "Dashboard", eyebrow: "Vitrix Core" },
  catalogue: { title: "Catalogo", eyebrow: "Asset" },
  events: { title: "Eventi", eyebrow: "Contenuti" },
  media: { title: "Media", eyebrow: "Asset" },
  settings: { title: "Impostazioni", eyebrow: "SEO e manutenzione" },
  widgets: { title: "Widgets", eyebrow: "Contenuti" }
};

/* ── shared sx helpers ──────────────────────────────────────── */
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--vx-input-bg)",
    color: "var(--vx-text-primary)",
    "& fieldset": { borderColor: "var(--vx-input-border)" },
    "&:hover fieldset": { borderColor: "var(--vx-primary)" },
    "&.Mui-focused fieldset": { borderColor: "var(--vx-primary)", borderWidth: 2 },
    "&.Mui-focused": { boxShadow: "0 0 0 3px rgba(25,118,210,0.14)" }
  },
  "& .MuiInputLabel-root": { color: "var(--vx-text-muted)", fontSize: 13 },
  "& .MuiInputLabel-root.Mui-focused": { color: "var(--vx-primary)" },
  "& .MuiInputBase-input": { fontSize: 14, color: "var(--vx-text-primary)" }
};

const cardSx = {
  p: 3,
  bgcolor: "var(--vx-surface)",
  border: "1px solid var(--vx-border)",
  borderRadius: "12px",
  boxShadow: "none"
};

const modulePageSx = {
  width: "100%",
  minHeight: "calc(100vh - 56px)",
  p: { xs: 2, md: 3, lg: 4 },
  boxSizing: "border-box"
};

/* ── helpers ─────────────────────────────────────────────────── */
type LogPayload = { open: VitrixLogFile[]; resolved: VitrixLogFile[]; all: VitrixLogFile[] };

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : "Operazione non riuscita.");
  return body as T;
}

/* ── motion transition ───────────────────────────────────────── */
const pageTrans = { duration: 0.22, ease: "easeOut" as const };
const pageExit  = { duration: 0.14, ease: "easeIn" as const };

/* ── VitrixMark (welcome panel) ──────────────────────────────── */
function VitrixMark({ size = 56 }: { size?: number }) {
  return (
    <Box sx={{
      width: size, height: size, display: "grid", placeItems: "center",
      borderRadius: `${Math.round(size * 0.25)}px ${Math.round(size * 0.09)}px ${Math.round(size * 0.25)}px ${Math.round(size * 0.09)}px`,
      background: "var(--vx-gradient-brand)",
      color: "#fff", fontSize: size * 0.57, fontWeight: 900, lineHeight: 1,
      transform: "skewX(-11deg)", flexShrink: 0,
      boxShadow: "0 8px 32px rgba(46,196,241,0.22)"
    }}>
      V
    </Box>
  );
}

/* ════════════════════════════════════════════════════════════
   ADMIN APP — main export
   ════════════════════════════════════════════════════════════ */
export function AdminApp({
  user,
  bootstrap,
  initialModule = "dashboard",
}: {
  user: VitrixUser | null;
  bootstrap: VitrixBootstrap;
  initialModule?: AdminModuleId;
}) {
  const pathname = usePathname();
  const [logged, setLogged] = useState(Boolean(user));
  const [hydrated, setHydrated] = useState(false);
  const [shellTheme] = useState<string>(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem("vitrix-admin-theme") ?? "light";
  });
  const [activeModule, setActiveModule] = useState<AdminModuleId>(initialModule);
  const [navigatingModule, setNavigatingModule] = useState<AdminModuleId | null>(null);

  const isMobile = useMediaQuery("(max-width: 860px)");

  const isSuperadmin = Boolean(user?.permissions.includes("vitrix.superadmin"));
  const modules = bootstrap.modules;
  const userInitials = (user?.email ?? "GL").substring(0, 2).toUpperCase();

  useEffect(() => {
    setLogged(Boolean(user) || (ALLOW_DEMO_LOGIN && localStorage.getItem(SESSION_KEY) === "demo"));
    setHydrated(true);
  }, [user]);

  // Sync data-theme to document.body so MUI Dialog portals (outside the admin-shell div)
  // can resolve the CSS variables (--vx-surface, --vx-input-bg, etc.)
  useEffect(() => {
    document.body.setAttribute("data-theme", shellTheme);
    return () => { document.body.removeAttribute("data-theme"); };
  }, [shellTheme]);

  useEffect(() => {
    if (!modules.some((m) => m.id === activeModule)) {
      setActiveModule(modules[0]?.id ?? "dashboard");
    }
  }, [activeModule, modules]);

  useEffect(() => {
    setActiveModule(initialModule);
  }, [initialModule]);

  useEffect(() => {
    const moduleFromPath = pathname?.match(/^\/admin\/([^/?#]+)/)?.[1];
    if (moduleFromPath && modules.some((m) => m.id === moduleFromPath)) {
      setActiveModule(moduleFromPath as AdminModuleId);
      setNavigatingModule(null);
    }
  }, [modules, pathname]);

  function handleLogin(email: string, password: string) {
    if (!ALLOW_DEMO_LOGIN) return false;
    if (email.trim().toLowerCase() !== DEMO_USER || password !== DEMO_PASSWORD) return false;
    localStorage.setItem(SESSION_KEY, "demo");
    setLogged(true);
    return true;
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    setLogged(false);
  }

  if (!hydrated) {
    return (
      <Box className="admin-loading" sx={{ minHeight: "100vh", bgcolor: "var(--vx-bg)", display: "grid", placeItems: "center" }} data-theme={shellTheme}>
        <VitrixLoader label="Avvio Vitrix" />
      </Box>
    );
  }
  if (!logged) return <AdminLoginFallback onLogin={handleLogin} allowDemo={ALLOW_DEMO_LOGIN} />;

  return (
    <Box
      className="admin-shell"
      data-theme={shellTheme}
      suppressHydrationWarning
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : `${SIDEBAR_W}px 1fr`,
        bgcolor: "var(--vx-bg)",
        color: "var(--vx-text-primary)",
        fontFamily: "var(--vx-font-family)"
      }}
    >
      {/* ── SIDEBAR ── */}
      <Box
        component="aside"
        sx={{
          display: "flex",
          flexDirection: isMobile ? "row" : "column",
          alignItems: "center",
          py: isMobile ? 0 : 1.5,
          px: isMobile ? 1.5 : 0,
          gap: 0.5,
          bgcolor: "var(--vx-surface)",
          borderRight: isMobile ? "none" : "1px solid var(--vx-border)",
          borderBottom: isMobile ? "1px solid var(--vx-border)" : "none",
          position: isMobile ? "sticky" : "sticky",
          top: 0,
          height: isMobile ? "auto" : "100vh",
          zIndex: 200,
          overflowX: isMobile ? "auto" : "visible",
          width: isMobile ? "100%" : `${SIDEBAR_W}px`,
          justifyContent: isMobile ? "space-between" : "flex-start"
        }}
      >
        {/* Nav icons */}
        {modules.map((mod) => {
          const Icon = moduleIcons[mod.id] ?? DashboardOutlinedIcon;
          const isActive = mod.id === activeModule;
          return (
            <Tooltip key={mod.id} title={mod.label} placement="right" arrow>
              <IconButton
                component={Link}
                href={`/admin/${mod.id}`}
                onClick={() => {
                  if (mod.id !== activeModule) setNavigatingModule(mod.id);
                  setActiveModule(mod.id);
                }}
                aria-label={mod.label}
                sx={{
                  width: 40, height: 40, borderRadius: "10px",
                  color: isActive ? "var(--vx-primary)" : "var(--vx-text-muted)",
                  bgcolor: isActive ? "var(--vx-primary-soft)" : "transparent",
                  "&:hover": { bgcolor: isActive ? "var(--vx-primary-soft)" : "var(--vx-surface-muted)", color: isActive ? "var(--vx-primary)" : "var(--vx-text-secondary)" },
                  transition: "all 180ms ease"
                }}
              >
                <Icon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          );
        })}

        {/* Bottom utility */}
        <Box sx={{ mt: isMobile ? 0 : "auto", display: "flex", flexDirection: isMobile ? "row" : "column", gap: 0.5 }}>
          {user ? (
            <Tooltip title="Esci" placement="right" arrow>
              <Box component="form" action="/admin/logout" method="post">
                <IconButton type="submit" aria-label="Esci" sx={{ width: 40, height: 40, borderRadius: "10px", color: "var(--vx-text-muted)", "&:hover": { bgcolor: "var(--vx-danger-soft)", color: "var(--vx-danger)" } }}>
                  <LogoutOutlinedIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
            </Tooltip>
          ) : (
            <Tooltip title="Esci (demo)" placement="right" arrow>
              <IconButton onClick={handleLogout} aria-label="Esci" sx={{ width: 40, height: 40, borderRadius: "10px", color: "var(--vx-text-muted)", "&:hover": { bgcolor: "var(--vx-danger-soft)", color: "var(--vx-danger)" } }}>
                <LogoutOutlinedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ── MAIN ── */}
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Topbar */}
        <Box
          component="header"
          sx={{
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            gap: 1,
            bgcolor: "var(--vx-surface)",
            borderBottom: "1px solid var(--vx-border)",
            position: isMobile ? "static" : "sticky",
            top: 0,
            zIndex: 100,
            backdropFilter: "blur(16px)"
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box>
              <Typography component="span" sx={{ display: "block", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--vx-text-muted)", fontWeight: 700 }}>
                {moduleMeta[activeModule].eyebrow}
              </Typography>
              <Typography component="h1" sx={{ m: 0, fontSize: 18, fontWeight: 700, color: "var(--vx-text-primary)" }}>
                {moduleMeta[activeModule].title}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Tooltip title={user?.email ?? "Utente demo"} arrow>
              <Avatar sx={{ width: 38, height: 38, fontSize: 14, fontWeight: 700, bgcolor: "var(--vx-gradient-brand)", color: "#fff" }}>
                {userInitials}
              </Avatar>
            </Tooltip>
          </Stack>
        </Box>

        {/* Content */}
        <Box component="main" sx={{ flex: 1, overflow: "auto", width: "100%", minWidth: 0 }}>
          {navigatingModule && (
            <Box
              aria-hidden="true"
              sx={{
                position: "sticky",
                top: 0,
                height: 2,
                bgcolor: "var(--vx-primary)",
                zIndex: 120,
                animation: "vitrix-admin-route-progress 900ms ease-in-out infinite",
                "@keyframes vitrix-admin-route-progress": {
                  "0%": { transform: "translateX(-100%)", opacity: 0.35 },
                  "50%": { transform: "translateX(0%)", opacity: 1 },
                  "100%": { transform: "translateX(100%)", opacity: 0.35 },
                },
              }}
            />
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: pageTrans }}
              exit={{ opacity: 0, y: -6, transition: pageExit }}
              style={{ height: "100%", width: "100%" }}
            >
              <ModuleBody moduleId={activeModule} user={user} bootstrap={bootstrap} isSuperadmin={isSuperadmin} />
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}

/* ── ModuleBody ─────────────────────────────────────────────── */
function ModuleBody({
  moduleId,
  user,
  bootstrap,
  isSuperadmin
}: {
  moduleId: AdminModuleId;
  user: VitrixUser | null;
  bootstrap: VitrixBootstrap;
  isSuperadmin: boolean;
}) {
  if (moduleId === "dashboard") return <DashboardPanel />;
  if (moduleId === "settings") {
    const canManage = !user || isSuperadmin || Boolean(user.permissions.includes("vitrix.settings.manage"));
    return <SettingsModule bootstrap={bootstrap} canManage={canManage} />;
  }
  if (moduleId === "catalogue") {
    return <SiteCataloguePanel />;
  }
  if (moduleId === "events") {
    return <EventsPanel />;
  }
  if (moduleId === "media") {
    return <MediaGalleryPanel />;
  }
  if (moduleId === "widgets") {
    return <WidgetsModule />;
  }

  const fallbackMeta = moduleMeta[moduleId as AdminModuleId] ?? moduleMeta.dashboard;

  return (
    <Box sx={modulePageSx}>
      <Paper sx={cardSx}>
        <Typography variant="overline" sx={{ color: "var(--vx-text-muted)", letterSpacing: "0.12em" }}>
          {fallbackMeta.eyebrow}
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.5, mb: 2, fontWeight: 700, color: "var(--vx-text-primary)" }}>
          {fallbackMeta.title}
        </Typography>
        <Typography sx={{ color: "var(--vx-text-secondary)", fontSize: 14 }}>
          Modulo abilitato e pronto per essere collegato alle schermate operative dedicate.
        </Typography>
      </Paper>
    </Box>
  );
}

/* ── DashboardPanel ─────────────────────────────────────────── */
function DashboardPanel() {
  return (
    <Box
      sx={{
        ...modulePageSx,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        p: { xs: 3, md: 5, lg: 6 },
        textAlign: "center"
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <VitrixMark size={56} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "var(--vx-text-primary)", mt: 1 }}
        >
          Benvenuto in{" "}
          <Box component="span" sx={{ color: "var(--vx-violet)" }}>Vitrix CMS</Box>
        </Typography>
        <Typography
          sx={{ mt: 1, color: "var(--vx-text-secondary)", fontSize: 14, lineHeight: 1.7, maxWidth: 360, mx: "auto" }}
        >
          La tua piattaforma è pronta per aiutarti a gestire contenuti, media e moduli in modo semplice e potente.
        </Typography>
      </motion.div>
    </Box>
  );
}

type ToastState = { type: "success" | "error"; msg: string } | null;
type ToastFn = (type: "success" | "error", msg: string) => void;

/* ── SettingsModule ─────────────────────────────────────────── */
function SettingsModule({ bootstrap, canManage }: { bootstrap: VitrixBootstrap; canManage: boolean }) {
  const [tab, setTab] = useState(0);
  const [settings, setSettings] = useState<VitrixSiteSettings>(bootstrap.settings);
  const [toast, setToast] = useState<ToastState>(null);
  const [busy, setBusy] = useState(false);

  const notify: ToastFn = (type, msg) => setToast({ type, msg });

  const tabs = [
    { label: "SEO", icon: <SearchOutlinedIcon sx={{ fontSize: 16 }} /> },
    { label: "CTX Language", icon: <ArticleOutlinedIcon sx={{ fontSize: 16 }} /> },
    { label: "Moduli", icon: <SettingsOutlinedIcon sx={{ fontSize: 16 }} /> },
    { label: "Favicon", icon: <UploadOutlinedIcon sx={{ fontSize: 16 }} /> },
    { label: "Manutenzione", icon: <BuildOutlinedIcon sx={{ fontSize: 16 }} /> },
    { label: "Log errori", icon: <FileOpenOutlinedIcon sx={{ fontSize: 16 }} /> }
  ];

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const body = await apiJson<{ settings: VitrixSiteSettings }>("/api/vitrix/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      setSettings(body.settings);
      notify("success", "Impostazioni salvate.");
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Salvataggio non riuscito.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={modulePageSx}>
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={toast?.type ?? "info"} onClose={() => setToast(null)} variant="filled" sx={{ width: "100%" }}>
          {toast?.msg}
        </Alert>
      </Snackbar>

      <Typography variant="overline" sx={{ color: "var(--vx-text-muted)", letterSpacing: "0.12em" }}>
        SEO e manutenzione
      </Typography>
      <Typography variant="h5" sx={{ mt: 0.5, mb: 3, fontWeight: 700, color: "var(--vx-text-primary)" }}>
        Impostazioni
      </Typography>

      <Paper sx={{ ...cardSx, p: 0, overflow: "hidden" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            px: 2,
            borderBottom: "1px solid var(--vx-border)",
            "& .MuiTab-root": { fontSize: 13, fontWeight: 600, color: "var(--vx-text-muted)", textTransform: "none", minHeight: 48, gap: 0.75 },
            "& .MuiTab-root.Mui-selected": { color: "var(--vx-primary)" },
            "& .MuiTabs-indicator": { backgroundColor: "var(--vx-primary)" }
          }}
        >
          {tabs.map((t, i) => (
            <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && <SeoPanel settings={settings} setSettings={setSettings} onSubmit={saveSettings} busy={busy} canManage={canManage} />}
          {tab === 1 && <LanguagePanel settings={settings} setSettings={setSettings} onSubmit={saveSettings} busy={busy} canManage={canManage} />}
          {tab === 2 && <ModulesPanel canManage={canManage} notify={notify} />}
          {tab === 3 && <FaviconPanel settings={settings} setSettings={setSettings} canManage={canManage} notify={notify} />}
          {tab === 4 && <MaintenancePanel canManage={canManage} notify={notify} />}
          {tab === 5 && <LogsPanel canManage={canManage} initialOpen={bootstrap.logsSummary?.open ?? 0} notify={notify} />}
        </Box>
      </Paper>
    </Box>
  );
}

/* ── SeoPanel ────────────────────────────────────────────────── */
function SeoPanel({
  settings, setSettings, onSubmit, busy, canManage
}: {
  settings: VitrixSiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<VitrixSiteSettings>>;
  onSubmit: (e: React.FormEvent) => void;
  busy: boolean;
  canManage: boolean;
}) {
  function update<K extends keyof VitrixSiteSettings>(key: K, value: VitrixSiteSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2.5 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <TextField label="Nome sito" size="small" value={settings.site_name} onChange={(e) => update("site_name", e.target.value)} disabled={!canManage} fullWidth sx={fieldSx} />
        <TextField label="Canonical URL" size="small" value={settings.canonical_url} onChange={(e) => update("canonical_url", e.target.value)} disabled={!canManage} fullWidth sx={fieldSx} />
        <TextField label="SEO title" size="small" value={settings.seo_title} onChange={(e) => update("seo_title", e.target.value)} disabled={!canManage} fullWidth sx={fieldSx} />
        <TextField label="OpenGraph title" size="small" value={settings.og_title} onChange={(e) => update("og_title", e.target.value)} disabled={!canManage} fullWidth sx={fieldSx} />
        <TextField label="Meta description" size="small" value={settings.seo_description} onChange={(e) => update("seo_description", e.target.value)} disabled={!canManage} fullWidth multiline rows={3} sx={{ ...fieldSx, gridColumn: "1 / -1" }} />
        <TextField label="OpenGraph description" size="small" value={settings.og_description} onChange={(e) => update("og_description", e.target.value)} disabled={!canManage} fullWidth multiline rows={3} sx={{ ...fieldSx, gridColumn: "1 / -1" }} />
        <TextField label="OpenGraph image URL" size="small" value={settings.og_image ?? ""} onChange={(e) => update("og_image", e.target.value || null)} disabled={!canManage} fullWidth sx={{ ...fieldSx, gridColumn: "1 / -1" }} />
      </Box>

      <Stack direction="row" spacing={2}>
        <FormControlLabel
          control={<Switch checked={settings.robots_index} onChange={(e) => update("robots_index", e.target.checked)} disabled={!canManage} size="small" sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--vx-primary)" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "var(--vx-primary)" } }} />}
          label={<Typography sx={{ fontSize: 13, color: "var(--vx-text-secondary)" }}>Indicizza sito</Typography>}
        />
        <FormControlLabel
          control={<Switch checked={settings.robots_follow} onChange={(e) => update("robots_follow", e.target.checked)} disabled={!canManage} size="small" sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--vx-primary)" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "var(--vx-primary)" } }} />}
          label={<Typography sx={{ fontSize: 13, color: "var(--vx-text-secondary)" }}>Segui link</Typography>}
        />
      </Stack>

      <Box>
        <Button
          type="submit"
          variant="contained"
          disabled={busy || !canManage}
          startIcon={busy ? <CircularProgress size={15} color="inherit" /> : <SaveOutlinedIcon />}
          sx={{
            height: 40, px: 3, borderRadius: "8px", textTransform: "none", fontWeight: 700, fontSize: 13,
            background: "var(--vx-gradient-brand)", boxShadow: "none",
            "&:hover": { filter: "brightness(1.06)", boxShadow: "0 4px 14px rgba(25,118,210,0.28)" }
          }}
        >
          Salva SEO
        </Button>
      </Box>
    </Box>
  );
}

/* ── FaviconPanel ────────────────────────────────────────────── */
function LanguagePanel({
  settings, setSettings, onSubmit, busy, canManage
}: {
  settings: VitrixSiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<VitrixSiteSettings>>;
  onSubmit: (e: React.FormEvent) => void;
  busy: boolean;
  canManage: boolean;
}) {
  function update(value: "it" | "en") {
    setSettings((s) => ({ ...s, default_language: value }));
  }

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ display: "grid", gap: 2.5 }}>
      <Typography sx={{ fontSize: 14, color: "var(--vx-text-secondary)", lineHeight: 1.7 }}>
        CTX Language gestisce la lingua iniziale della landing page. Il visitatore potra comunque cambiarla dal selettore in testata.
      </Typography>
      <Stack direction="row" spacing={2}>
        {(["it", "en"] as const).map((lang) => (
          <Button
            key={lang}
            type="button"
            variant={settings.default_language === lang ? "contained" : "outlined"}
            disabled={!canManage}
            onClick={() => update(lang)}
            sx={{
              height: 40,
              px: 3,
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: 13,
              boxShadow: "none",
              ...(settings.default_language === lang
                ? { background: "var(--vx-gradient-brand)" }
                : { borderColor: "var(--vx-border)", color: "var(--vx-text-primary)" })
            }}
          >
            {lang === "it" ? "Italiano" : "English"}
          </Button>
        ))}
      </Stack>
      <Box>
        <Button
          type="submit"
          variant="contained"
          disabled={busy || !canManage}
          startIcon={busy ? <CircularProgress size={15} color="inherit" /> : <SaveOutlinedIcon />}
          sx={{
            height: 40, px: 3, borderRadius: "8px", textTransform: "none", fontWeight: 700, fontSize: 13,
            background: "var(--vx-gradient-brand)", boxShadow: "none",
            "&:hover": { filter: "brightness(1.06)", boxShadow: "0 4px 14px rgba(25,118,210,0.28)" }
          }}
        >
          Salva CTX Language
        </Button>
      </Box>
    </Box>
  );
}

function ModulesPanel({ canManage, notify }: { canManage: boolean; notify: ToastFn }) {
  const [modules, setModules] = useState<VitrixModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadModules = useCallback(async () => {
    setLoading(true);
    try {
      const body = await apiJson<{ modules: VitrixModuleRow[] }>("/api/vitrix/modules");
      setModules(body.modules);
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Caricamento moduli non riuscito.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  async function toggleModule(module: VitrixModuleRow, enabled: boolean) {
    setSavingId(module.id);
    try {
      const body = await apiJson<{ module: VitrixModuleRow }>("/api/vitrix/modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: module.id, enabled })
      });
      setModules((rows) => rows.map((row) => row.id === body.module.id ? body.module : row));
      notify("success", enabled ? "Modulo abilitato." : "Modulo disabilitato.");
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Aggiornamento modulo non riuscito.");
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => { loadModules(); }, [loadModules]);

  if (loading) return <AdminLoadingBoundary label="Caricamento moduli" framed />;

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Typography sx={{ fontSize: 14, color: "var(--vx-text-secondary)", lineHeight: 1.7 }}>
        Abilita o disabilita le voci operative del pannello. Dashboard e Impostazioni restano sempre attive.
      </Typography>
      <Box sx={{ border: "1px solid var(--vx-border)", borderRadius: "8px", overflow: "hidden", bgcolor: "var(--vx-surface)" }}>
        {modules.map((module) => {
          const locked = module.id === "dashboard" || module.id === "settings";
          return (
            <Stack
              key={module.id}
              direction="row"
              spacing={2}
              sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, borderBottom: "1px solid var(--vx-border)", "&:last-child": { borderBottom: 0 } }}
            >
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--vx-text-primary)" }}>{module.label}</Typography>
                <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>
                  {module.description}
                </Typography>
              </Box>
              <Switch
                checked={module.enabled}
                disabled={!canManage || locked || savingId === module.id}
                onChange={(e) => toggleModule(module, e.target.checked)}
                size="small"
                sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "var(--vx-primary)" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "var(--vx-primary)" } }}
              />
            </Stack>
          );
        })}
      </Box>
    </Box>
  );
}

function FaviconPanel({
  settings, setSettings, canManage, notify
}: {
  settings: VitrixSiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<VitrixSiteSettings>>;
  canManage: boolean;
  notify: ToastFn;
}) {
  const [busy, setBusy] = useState(false);

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const body = await apiJson<{ settings: VitrixSiteSettings }>("/api/vitrix/settings/favicon", { method: "POST", body: formData });
      setSettings(body.settings);
      notify("success", "Favicon aggiornata.");
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Upload non riuscito.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", p: 2, borderRadius: "8px", border: "1px solid var(--vx-border)", bgcolor: "var(--vx-surface-muted)" }}>
        <Box sx={{ width: 48, height: 48, borderRadius: "8px", border: "1px solid var(--vx-border)", display: "grid", placeItems: "center", bgcolor: "var(--vx-surface)", overflow: "hidden" }}>
          {settings.favicon_path ? <Box component="img" src={settings.favicon_path} alt="" sx={{ width: 32, height: 32, objectFit: "contain" }} /> : <UploadOutlinedIcon sx={{ fontSize: 20, color: "var(--vx-text-muted)" }} />}
        </Box>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--vx-text-primary)" }}>
            {settings.favicon_path ?? "Nessuna favicon configurata"}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>
            Formati: ico, png, svg, jpg, webp · Max 512KB
          </Typography>
        </Box>
      </Stack>
      <Box>
        <Button
          component="label"
          variant="outlined"
          disabled={busy || !canManage}
          startIcon={busy ? <CircularProgress size={15} /> : <UploadOutlinedIcon />}
          sx={{ height: 40, px: 3, borderRadius: "8px", textTransform: "none", fontWeight: 600, fontSize: 13, borderColor: "var(--vx-border)", color: "var(--vx-text-primary)", "&:hover": { borderColor: "var(--vx-primary)", color: "var(--vx-primary)", bgcolor: "var(--vx-primary-soft)" } }}
        >
          Carica favicon
          <input type="file" accept=".ico,.png,.svg,.jpg,.jpeg,.webp" onChange={upload} hidden />
        </Button>
      </Box>
    </Box>
  );
}

/* ── MaintenancePanel ────────────────────────────────────────── */
function MaintenancePanel({ canManage, notify }: { canManage: boolean; notify: ToastFn }) {
  const [busy, setBusy] = useState(false);

  async function clearCache() {
    setBusy(true);
    try {
      const body = await apiJson<{ clearedAt: string }>("/api/vitrix/settings/cache/clear", { method: "POST" });
      notify("success", `Cache pulita alle ${new Date(body.clearedAt).toLocaleTimeString("it-IT")}.`);
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Pulizia cache non riuscita.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Typography sx={{ fontSize: 14, color: "var(--vx-text-secondary)", lineHeight: 1.7 }}>
        Invalida la cache applicativa di homepage, metadata, robots, sitemap e admin senza toccare i file build.
      </Typography>
      <Box>
        <Button
          variant="outlined"
          onClick={clearCache}
          disabled={busy || !canManage}
          startIcon={busy ? <CircularProgress size={15} /> : <RefreshOutlinedIcon />}
          sx={{ height: 40, px: 3, borderRadius: "8px", textTransform: "none", fontWeight: 600, fontSize: 13, borderColor: "var(--vx-border)", color: "var(--vx-text-primary)", "&:hover": { borderColor: "var(--vx-primary)", color: "var(--vx-primary)", bgcolor: "var(--vx-primary-soft)" } }}
        >
          Pulisci cache sito
        </Button>
      </Box>
    </Box>
  );
}

/* ── LogsPanel ───────────────────────────────────────────────── */
function LogsPanel({ canManage, initialOpen, notify }: { canManage: boolean; initialOpen: number; notify: ToastFn }) {
  const [logs, setLogs] = useState<LogPayload>({ open: [], resolved: [], all: [] });
  const [selected, setSelected] = useState<VitrixLogFile | null>(null);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const openLogs = useMemo(() => logs.open, [logs.open]);

  async function loadLogs() {
    setBusy(true);
    try {
      const body = await apiJson<LogPayload>("/api/vitrix/logs");
      const first = body.open[0] ?? body.resolved[0] ?? null;
      setLogs(body);
      setSelected(first);
      if (first) {
        const d = await apiJson<{ content: string }>(`/api/vitrix/logs/${encodeURIComponent(first.name)}?status=${first.status}`);
        setContent(d.content);
      } else {
        setContent("");
      }
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Caricamento log non riuscito.");
    } finally {
      setBusy(false);
    }
  }

  async function readLog(log: VitrixLogFile) {
    setSelected(log);
    setContent("");
    try {
      const d = await apiJson<{ content: string }>(`/api/vitrix/logs/${encodeURIComponent(log.name)}?status=${log.status}`);
      setContent(d.content);
    } catch (e) {
      setContent(e instanceof Error ? e.message : "Log non disponibile.");
    }
  }

  async function resolveSelected() {
    if (!selected || selected.status !== "open") return;
    setBusy(true);
    try {
      await apiJson(`/api/vitrix/logs/${encodeURIComponent(selected.name)}/resolve`, { method: "POST" });
      notify("success", "Log spostato tra i risolti.");
      setSelected(null);
      setContent("");
      await loadLogs();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Risoluzione non riuscita.");
    } finally {
      setBusy(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadLogs(); }, []);

  return (
    <Box sx={{ display: "grid", gap: 2 }}>

      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Button size="small" variant="outlined" onClick={loadLogs} disabled={busy || !canManage}
          startIcon={busy ? <CircularProgress size={14} /> : <RefreshOutlinedIcon />}
          sx={{ borderRadius: "8px", textTransform: "none", fontSize: 12, borderColor: "var(--vx-border)", color: "var(--vx-text-secondary)" }}>
          Aggiorna
        </Button>
        <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>
          {openLogs.length} aperti · {logs.resolved.length} risolti · {initialOpen} al bootstrap
        </Typography>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 2, minHeight: 320 }}>
        {/* Log list */}
        <Box sx={{ border: "1px solid var(--vx-border)", borderRadius: "8px", overflow: "auto", bgcolor: "var(--vx-surface)" }}>
          {[...logs.open, ...logs.resolved].length === 0 ? (
            <Typography sx={{ p: 2, fontSize: 13, color: "var(--vx-text-muted)" }}>
              Nessun file .log trovato in storage/logs.
            </Typography>
          ) : (
            [...logs.open, ...logs.resolved].map((log) => {
              const isSelected = selected?.name === log.name && selected?.status === log.status;
              return (
                <Box
                  key={`${log.status}-${log.name}`}
                  component="button"
                  type="button"
                  onClick={() => readLog(log)}
                  sx={{
                    width: "100%", textAlign: "left", px: 1.5, py: 1.25, border: 0, cursor: "pointer",
                    borderBottom: "1px solid var(--vx-border)",
                    bgcolor: isSelected ? "var(--vx-primary-soft)" : "transparent",
                    "&:hover": { bgcolor: isSelected ? "var(--vx-primary-soft)" : "var(--vx-surface-muted)" },
                    display: "flex", alignItems: "flex-start", gap: 1
                  }}
                >
                  {log.status === "open"
                    ? <ErrorOutlinedIcon sx={{ fontSize: 15, color: "var(--vx-danger)", mt: "2px", flexShrink: 0 }} />
                    : <CheckCircleOutlinedIcon sx={{ fontSize: 15, color: "var(--vx-success)", mt: "2px", flexShrink: 0 }} />}
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "var(--vx-text-primary)", lineHeight: 1.3 }}>{log.name}</Typography>
                    <Typography sx={{ fontSize: 11, color: "var(--vx-text-muted)" }}>{new Date(log.modified_at).toLocaleString("it-IT")}</Typography>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>

        {/* Log detail */}
        <Box sx={{ border: "1px solid var(--vx-border)", borderRadius: "8px", display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "var(--vx-surface)" }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1, borderBottom: "1px solid var(--vx-border)" }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--vx-text-primary)" }}>
              {selected?.name ?? "Seleziona un log"}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={resolveSelected}
              disabled={!selected || selected.status !== "open" || busy || !canManage}
              startIcon={<CheckCircleOutlinedIcon />}
              sx={{ borderRadius: "6px", textTransform: "none", fontSize: 11, borderColor: "var(--vx-border)", color: "var(--vx-text-secondary)" }}
            >
              Segna risolto
            </Button>
          </Stack>
          <Box component="pre" sx={{ flex: 1, m: 0, p: 2, fontSize: 12, lineHeight: 1.6, color: "var(--vx-text-secondary)", overflow: "auto", fontFamily: "monospace" }}>
            {content || "Il contenuto del log verrà mostrato qui."}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/* ── AdminLoginFallback (dev only) ───────────────────────────── */
function AdminLoginFallback({ onLogin, allowDemo }: { onLogin: (email: string, password: string) => boolean; allowDemo: boolean }) {
  const [email, setEmail] = useState(DEMO_USER);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!onLogin(email, password)) setError("Accesso demo non disponibile.");
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "var(--vx-bg)", fontFamily: "var(--vx-font-family)" }} data-theme="light">
      <Paper sx={{ ...cardSx, width: "min(400px, calc(100% - 48px))", p: 4 }}>
        <Stack spacing={0.5} sx={{ alignItems: "center", mb: 4 }}>
          <VitrixMark size={44} />
          <Typography variant="overline" sx={{ color: "var(--vx-text-muted)", fontSize: 10, letterSpacing: "0.14em" }}>
            Dev fallback · solo in locale
          </Typography>
        </Stack>

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: "var(--vx-text-primary)" }}>Accedi</Typography>
        <Typography sx={{ fontSize: 13, color: "var(--vx-text-secondary)", mb: 3, lineHeight: 1.6 }}>
          {allowDemo ? "Demo disponibile solo in sviluppo. In produzione usa Supabase Auth." : "Configura Supabase Auth."}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

        <Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 2 }}>
          <TextField label="Email" type="email" size="small" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" fullWidth sx={fieldSx} />
          <TextField label="Password" type="password" size="small" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" fullWidth sx={fieldSx} />
          <Button
            type="submit"
            variant="contained"
            disabled={!allowDemo}
            fullWidth
            sx={{ height: 44, borderRadius: "8px", textTransform: "none", fontWeight: 700, background: "var(--vx-gradient-brand)", boxShadow: "none", "&:hover": { filter: "brightness(1.06)", boxShadow: "0 4px 14px rgba(25,118,210,0.28)" } }}
          >
            Accedi
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
