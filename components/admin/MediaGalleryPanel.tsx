"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { dialogPaperSx } from "@/lib/admin-theme";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SortIcon from "@mui/icons-material/Sort";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import ViewModuleOutlinedIcon from "@mui/icons-material/ViewModuleOutlined";
import { useEffect, useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import type { MediaCollection, MediaCollectionItem, VitrixMediaFile } from "@/lib/vitrix/types";
import { ImageCropDialog } from "./ImageCropDialog";
import { VitrixLoader } from "./VitrixLoader";
import { AdminLoadingBoundary } from "@/components/admin/AdminLoadingBoundary";

/* ── sx helpers ──────────────────────────────────────────────────── */
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--vx-input-bg)",
    color: "var(--vx-text-primary)",
    "& fieldset": { borderColor: "var(--vx-input-border)" },
    "&:hover fieldset": { borderColor: "var(--vx-primary)" },
    "&.Mui-focused fieldset": { borderColor: "var(--vx-primary)" }
  },
  "& .MuiInputLabel-root": { color: "var(--vx-text-muted)", fontSize: 13 },
  "& .MuiInputBase-input": { fontSize: 13, color: "var(--vx-text-primary)" }
};

function createWebpFile(blob: Blob, namePrefix: string) {
  return new File([blob], `${namePrefix}-${crypto.randomUUID()}.webp`, { type: "image/webp" });
}

function statusBadge(status: "published" | "draft") {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.25,
        borderRadius: "12px",
        fontSize: 12,
        fontWeight: 600,
        bgcolor: status === "published" ? "rgba(46,125,50,0.1)" : "rgba(237,108,2,0.1)",
        color: status === "published" ? "#2E7D32" : "#E65100"
      }}
    >
      <Box
        component="span"
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: status === "published" ? "#2E7D32" : "#ED6C02",
          display: "inline-block"
        }}
      />
      {status === "published" ? "Pubblicato" : "Bozza"}
    </Box>
  );
}

function categoryBadge(cat: string) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        px: 1,
        py: 0.25,
        borderRadius: "4px",
        fontSize: 12,
        fontWeight: 600,
        bgcolor: "var(--vx-primary-soft)",
        color: "var(--vx-primary)"
      }}
    >
      {cat}
    </Box>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/* ════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ════════════════════════════════════════════════════════════════ */
export function CollectionsPanel() {
  const [collections, setCollections] = useState<MediaCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<MediaCollection | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);

  const notify = (type: "success" | "error", msg: string) => setToast({ type, msg });

  useEffect(() => { loadCollections(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadCollections() {
    setLoading(true);
    try {
      const res = await fetch("/api/vitrix/collections?count=true");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCollections(data.collections || []);
    } catch {
      notify("error", "Errore nel caricamento delle collections.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCollection(id: string) {
    try {
      const res = await fetch(`/api/vitrix/collections/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      notify("success", "Collection eliminata.");
      if (selectedCollection?.id === id) setSelectedCollection(null);
      await loadCollections();
    } catch {
      notify("error", "Errore durante l'eliminazione.");
    }
  }

  return (
    <Box sx={{ width: "100%", minHeight: "calc(100vh - 56px)", p: { xs: 2, md: 3, lg: 4 }, boxSizing: "border-box" }}>
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

      {selectedCollection ? (
        <CollectionItemsView
          collection={selectedCollection}
          onBack={() => { setSelectedCollection(null); loadCollections(); }}
          onCollectionUpdated={(c) => setSelectedCollection(c)}
          onCollectionDeleted={(id) => handleDeleteCollection(id)}
          notify={notify}
        />
      ) : (
        <CollectionsListView
          collections={collections}
          loading={loading}
          onSelect={setSelectedCollection}
          onCreateNew={() => setNewCollectionOpen(true)}
          onDelete={handleDeleteCollection}
          onRefresh={loadCollections}
          notify={notify}
        />
      )}

      <NewCollectionDialog
        open={newCollectionOpen}
        onClose={() => setNewCollectionOpen(false)}
        onCreated={(c) => { setNewCollectionOpen(false); loadCollections(); setSelectedCollection(c); }}
        notify={notify}
      />
    </Box>
  );
}

/* ── CollectionsListView ──────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CollectionsListView({
  collections, loading, onSelect, onCreateNew, onDelete
}: {
  collections: MediaCollection[];
  loading: boolean;
  onSelect: (c: MediaCollection) => void;
  onCreateNew: () => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  notify: (t: "success" | "error", m: string) => void;
}) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  return (
    <>
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="overline" sx={{ color: "var(--vx-text-muted)", letterSpacing: "0.12em", fontSize: 11 }}>
            ASSET
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--vx-text-primary)", mt: 0.25 }}>
            Collections
          </Typography>
          <Typography sx={{ color: "var(--vx-text-secondary)", fontSize: 13, mt: 0.25 }}>
            Gestisci le tue media collections
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateNew}
          sx={{
            height: 40, px: 2.5, borderRadius: "8px", textTransform: "none", fontWeight: 700, fontSize: 13,
            background: "var(--vx-gradient-brand)", boxShadow: "none",
            "&:hover": { filter: "brightness(1.06)" }
          }}
        >
          Nuova Collection
        </Button>
      </Stack>

      {loading ? (
        <AdminLoadingBoundary label="Carico collections" minHeight={280} framed />
      ) : collections.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center", bgcolor: "var(--vx-surface)", border: "1px solid var(--vx-border)", borderRadius: "12px", boxShadow: "none" }}>
          <Typography sx={{ color: "var(--vx-text-muted)", fontSize: 14 }}>
            Nessuna collection ancora. Crea la prima con il pulsante in alto.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 2
        }}>
          {collections.map((c) => (
            <Paper
              key={c.id}
              sx={{
                bgcolor: "var(--vx-surface)", border: "1px solid var(--vx-border)", borderRadius: "12px",
                boxShadow: "none", overflow: "hidden", cursor: "pointer",
                transition: "box-shadow 180ms, border-color 180ms",
                "&:hover": { borderColor: "var(--vx-primary)", boxShadow: "0 4px 16px rgba(25,118,210,0.10)" }
              }}
              onClick={() => onSelect(c)}
            >
              <Box
                sx={{
                  height: 100, bgcolor: "var(--vx-surface-muted)",
                  backgroundImage: c.cover_image_url ? `url(${c.cover_image_url})` : undefined,
                  backgroundSize: "cover", backgroundPosition: "center"
                }}
              />
              <Box sx={{ p: 2 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: "var(--vx-text-primary)" }}>{c.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)", mt: 0.25 }}>
                      {c.item_count ?? 0} elementi
                    </Typography>
                  </Box>
                  {statusBadge(c.status)}
                </Stack>
                {c.description && (
                  <Typography sx={{ fontSize: 12, color: "var(--vx-text-secondary)", mt: 1, lineHeight: 1.4,
                    overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {c.description}
                  </Typography>
                )}
                <Stack direction="row" sx={{ mt: 1.5, gap: 0.5, justifyContent: "flex-end" }}>
                  <Tooltip title="Elimina">
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(c.id); }}
                      sx={{ color: "var(--vx-text-muted)", "&:hover": { color: "var(--vx-danger)", bgcolor: "var(--vx-danger-soft)" } }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}
        slotProps={{ paper: { sx: dialogPaperSx } }}>
        <DialogTitle>Elimina collection</DialogTitle>
        <DialogContent>
          Sei sicuro? Verranno eliminati anche tutti gli elementi e le immagini associate. L&apos;azione non è reversibile.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Annulla</Button>
          <Button color="error" variant="contained" onClick={() => { if (deleteTarget) onDelete(deleteTarget); setDeleteTarget(null); }}>
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/* ── NewCollectionDialog ─────────────────────────────────────── */
function NewCollectionDialog({
  open, onClose, onCreated, notify
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (c: MediaCollection) => void;
  notify: (t: "success" | "error", m: string) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (!open) { setName(""); setSlug(""); setDescription(""); setSlugEdited(false); }
  }, [open]);

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name));
  }, [name, slugEdited]);

  async function handleCreate() {
    if (!name || !slug) return;
    setBusy(true);
    try {
      const res = await fetch("/api/vitrix/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description: description || null, status: "published" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore");
      notify("success", "Collection creata.");
      onCreated(data.collection);
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Errore nella creazione.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Nuova Collection</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Nome *" size="small" value={name} onChange={(e) => setName(e.target.value)}
            fullWidth autoFocus sx={fieldSx}
          />
          <TextField
            label="Slug *" size="small" value={slug}
            onChange={(e) => { setSlugEdited(true); setSlug(slugify(e.target.value)); }}
            fullWidth helperText={`URL: /collections/${slug || "..."}`} sx={fieldSx}
          />
          <TextField
            label="Descrizione" size="small" value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth multiline rows={2} sx={fieldSx}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>Annulla</Button>
        <Button
          variant="contained" onClick={handleCreate} disabled={busy || !name || !slug}
          sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, background: "var(--vx-gradient-brand)", boxShadow: "none" }}
        >
          {busy ? <CircularProgress size={18} color="inherit" /> : "Crea"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ════════════════════════════════════════════════════════════════
   COLLECTION ITEMS VIEW
   ════════════════════════════════════════════════════════════════ */
function CollectionItemsView({
  collection, onBack, onCollectionUpdated, onCollectionDeleted, notify
}: {
  collection: MediaCollection;
  onBack: () => void;
  onCollectionUpdated: (c: MediaCollection) => void;
  onCollectionDeleted: (id: string) => void;
  notify: (t: "success" | "error", m: string) => void;
}) {
  const [items, setItems] = useState<MediaCollectionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const [previewItem, setPreviewItem] = useState<MediaCollectionItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [drawerItem, setDrawerItem] = useState<MediaCollectionItem | null>(null);
  const [uploading, setUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);

  useEffect(() => { loadItems(); }, [page, limit, statusFilter, categoryFilter, tagFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadItems() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (tagFilter) params.set("tag", tagFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/vitrix/collections/${collection.id}/items?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setCategories(data.categories || []);
      setAllTags(data.tags || []);
    } catch {
      notify("error", "Errore nel caricamento degli elementi.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearchEnter(e: React.KeyboardEvent) {
    if (e.key === "Enter") { setPage(1); loadItems(); }
  }

  async function handleSaveItem(formData: Partial<MediaCollectionItem>, file?: File, cropArea?: Area, existingStoragePath?: string) {
    setUploading(true);
    try {
      if (drawerMode === "create") {
        if (!file && !existingStoragePath) { notify("error", "Seleziona un'immagine"); return; }
        const fd = new FormData();
        if (file) fd.append("file", file);
        if (existingStoragePath) fd.append("existing_storage_path", existingStoragePath);
        fd.append("title", formData.title || "");
        fd.append("description", formData.description || "");
        fd.append("alt_text", formData.alt_text || "");
        fd.append("category", formData.category || "");
        fd.append("tags", JSON.stringify(formData.tags || []));
        fd.append("status", formData.status || "published");
        fd.append("published_at", formData.published_at || new Date().toISOString());
        fd.append("slug", formData.slug || "");
        // Coordinate crop in pixel sull'immagine originale — sharp le usa server-side
        if (cropArea) {
          fd.append("crop_x", String(Math.round(cropArea.x)));
          fd.append("crop_y", String(Math.round(cropArea.y)));
          fd.append("crop_width", String(Math.round(cropArea.width)));
          fd.append("crop_height", String(Math.round(cropArea.height)));
        }

        const res = await fetch(`/api/vitrix/collections/${collection.id}/items`, { method: "POST", body: fd });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Errore upload"); }
        notify("success", "Elemento aggiunto.");
      } else {
        let res: Response;
        if (file || existingStoragePath) {
          const fd = new FormData();
          if (file) fd.append("file", file);
          if (existingStoragePath) fd.append("existing_storage_path", existingStoragePath);
          fd.append("title", formData.title || "");
          fd.append("description", formData.description || "");
          fd.append("alt_text", formData.alt_text || "");
          fd.append("category", formData.category || "");
          fd.append("tags", JSON.stringify(formData.tags || []));
          fd.append("status", formData.status || "published");
          fd.append("published_at", formData.published_at || new Date().toISOString());
          fd.append("slug", formData.slug || "");
          if (cropArea) {
            fd.append("crop_x", String(Math.round(cropArea.x)));
            fd.append("crop_y", String(Math.round(cropArea.y)));
            fd.append("crop_width", String(Math.round(cropArea.width)));
            fd.append("crop_height", String(Math.round(cropArea.height)));
          }
          res = await fetch(`/api/vitrix/collections/${collection.id}/items/${drawerItem?.id}`, { method: "PATCH", body: fd });
        } else {
          res = await fetch(`/api/vitrix/collections/${collection.id}/items/${drawerItem?.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
          });
        }
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Errore aggiornamento"); }
        notify("success", "Elemento aggiornato.");
      }
      setDrawerOpen(false);
      setDrawerItem(null);
      await loadItems();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Errore durante il salvataggio.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/vitrix/collections/${collection.id}/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      notify("success", "Elemento eliminato.");
      setDeleteTarget(null);
      if (previewItem?.id === id) setPreviewItem(null);
      await loadItems();
    } catch {
      notify("error", "Errore durante l'eliminazione.");
    }
  }

  async function handleDuplicate(item: MediaCollectionItem) {
    try {
      const res = await fetch(`/api/vitrix/collections/${collection.id}/items/${item.id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error();
      notify("success", "Elemento duplicato.");
      await loadItems();
    } catch {
      notify("error", "Errore durante la duplicazione.");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      {/* ── Header ── */}
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 0.5 }}>
            <IconButton size="small" onClick={onBack} sx={{ color: "var(--vx-text-muted)", "&:hover": { color: "var(--vx-text-primary)" } }}>
              <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>Collections</Typography>
          </Stack>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--vx-text-primary)" }}>
            {collection.name}
          </Typography>
          <Typography sx={{ color: "var(--vx-text-secondary)", fontSize: 13, mt: 0.25 }}>
            Gestisci gli elementi della collection &ldquo;{collection.name}&rdquo;
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            size="small" variant="outlined" startIcon={<SettingsOutlinedIcon />}
            onClick={() => setSettingsOpen(true)}
            sx={{ borderRadius: "8px", textTransform: "none", fontSize: 12, fontWeight: 600, borderColor: "var(--vx-border)", color: "var(--vx-text-secondary)" }}
          >
            Impostazioni
          </Button>
          <Button
            size="small" variant="outlined" startIcon={<SortIcon />}
            onClick={() => setReorderOpen(true)}
            sx={{ borderRadius: "8px", textTransform: "none", fontSize: 12, fontWeight: 600, borderColor: "var(--vx-border)", color: "var(--vx-text-secondary)" }}
          >
            Ordina
          </Button>
          <Button
            variant="contained" startIcon={<AddIcon />}
            onClick={() => { setDrawerMode("create"); setDrawerItem(null); setDrawerOpen(true); }}
            sx={{
              height: 36, px: 2, borderRadius: "8px", textTransform: "none", fontWeight: 700, fontSize: 13,
              background: "var(--vx-gradient-brand)", boxShadow: "none", "&:hover": { filter: "brightness(1.06)" }
            }}
          >
            Aggiungi elemento
          </Button>
        </Stack>
      </Stack>

      {/* ── Toolbar filtri ── */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
        <TextField
          placeholder="Cerca elementi..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchEnter}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: "var(--vx-text-muted)" }} /></InputAdornment> } }}
          sx={{ ...fieldSx, flex: 1, minWidth: 200, maxWidth: 320 }}
        />
        <Select
          size="small" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          displayEmpty sx={{ ...fieldSx, minWidth: 140, "& .MuiSelect-select": { py: "6px", fontSize: 13 } }}
        >
          <MenuItem value="">Tutti gli stati</MenuItem>
          <MenuItem value="published">Pubblicato</MenuItem>
          <MenuItem value="draft">Bozza</MenuItem>
        </Select>
        <Select
          size="small" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          displayEmpty sx={{ ...fieldSx, minWidth: 160, "& .MuiSelect-select": { py: "6px", fontSize: 13 } }}
        >
          <MenuItem value="">Tutte le categorie</MenuItem>
          {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </Select>
        <Select
          size="small" value={tagFilter} onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
          displayEmpty sx={{ ...fieldSx, minWidth: 140, "& .MuiSelect-select": { py: "6px", fontSize: 13 } }}
        >
          <MenuItem value="">Tutti i tag</MenuItem>
          {allTags.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </Select>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Vista lista">
          <IconButton
            size="small" onClick={() => setViewMode("list")}
            sx={{ color: viewMode === "list" ? "var(--vx-primary)" : "var(--vx-text-muted)", bgcolor: viewMode === "list" ? "var(--vx-primary-soft)" : "transparent", borderRadius: "6px" }}
          >
            <ViewListOutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Vista griglia">
          <IconButton
            size="small" onClick={() => setViewMode("grid")}
            sx={{ color: viewMode === "grid" ? "var(--vx-primary)" : "var(--vx-text-muted)", bgcolor: viewMode === "grid" ? "var(--vx-primary-soft)" : "transparent", borderRadius: "6px" }}
          >
            <ViewModuleOutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* ── Content ── */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <VitrixLoader label="Carico elementi" />
          ) : items.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", bgcolor: "var(--vx-surface)", border: "1px solid var(--vx-border)", borderRadius: "12px", boxShadow: "none" }}>
              <Typography sx={{ color: "var(--vx-text-muted)", fontSize: 14 }}>Nessun elemento trovato.</Typography>
            </Paper>
          ) : viewMode === "list" ? (
            <ItemsListView items={items} selectedId={previewItem?.id} onSelect={setPreviewItem}
              onEdit={(item) => { setDrawerMode("edit"); setDrawerItem(item); setDrawerOpen(true); }}
              onDelete={(id) => setDeleteTarget(id)}
            />
          ) : (
            <ItemsGridView items={items} selectedId={previewItem?.id} onSelect={setPreviewItem}
              onEdit={(item) => { setDrawerMode("edit"); setDrawerItem(item); setDrawerOpen(true); }}
              onDelete={(id) => setDeleteTarget(id)}
            />
          )}

          {!loading && total > 0 && (
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mt: 2 }}>
              <Typography sx={{ fontSize: 13, color: "var(--vx-text-muted)" }}>
                Totale {total} elementi
              </Typography>
              <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
                <IconButton size="small" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ArrowBackIcon sx={{ fontSize: 16 }} />
                </IconButton>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <IconButton
                      key={p} size="small" onClick={() => setPage(p)}
                      sx={{ minWidth: 32, borderRadius: "6px", fontWeight: p === page ? 700 : 400,
                        bgcolor: p === page ? "var(--vx-primary-soft)" : "transparent",
                        color: p === page ? "var(--vx-primary)" : "var(--vx-text-secondary)", fontSize: 13 }}
                    >
                      {p}
                    </IconButton>
                  );
                })}
                <IconButton size="small" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ArrowForwardIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <Select
                  size="small" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  sx={{ ...fieldSx, "& .MuiSelect-select": { py: "4px", fontSize: 12 } }}
                >
                  <MenuItem value={10}>Mostra 10</MenuItem>
                  <MenuItem value={20}>Mostra 20</MenuItem>
                  <MenuItem value={50}>Mostra 50</MenuItem>
                </Select>
              </Stack>
            </Stack>
          )}
        </Box>

        {previewItem && (
          <ItemPreviewPanel
            item={previewItem}
            items={items}
            collectionSlug={collection.slug}
            onClose={() => setPreviewItem(null)}
            onNavigate={setPreviewItem}
            onEdit={(item) => { setDrawerMode("edit"); setDrawerItem(item); setDrawerOpen(true); }}
            onDuplicate={handleDuplicate}
            onDelete={(id) => setDeleteTarget(id)}
          />
        )}
      </Box>

      <ItemDrawer
        open={drawerOpen}
        mode={drawerMode}
        item={drawerItem}
        categories={categories}
        collectionSlug={collection.slug}
        uploading={uploading}
        onClose={() => { setDrawerOpen(false); setDrawerItem(null); }}
        onSave={handleSaveItem}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}
        slotProps={{ paper: { sx: dialogPaperSx } }}>
        <DialogTitle>Elimina elemento</DialogTitle>
        <DialogContent>L&apos;azione non è reversibile. Verrà eliminata anche l&apos;immagine dallo storage.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Annulla</Button>
          <Button color="error" variant="contained" onClick={() => { if (deleteTarget) handleDelete(deleteTarget); }}>
            Elimina
          </Button>
        </DialogActions>
      </Dialog>

      <CollectionSettingsDialog
        open={settingsOpen}
        collection={collection}
        onClose={() => setSettingsOpen(false)}
        onUpdated={onCollectionUpdated}
        onDeleted={() => { setSettingsOpen(false); onCollectionDeleted(collection.id); onBack(); }}
        notify={notify}
      />

      <ReorderDialog
        open={reorderOpen}
        items={items}
        collectionId={collection.id}
        onClose={() => setReorderOpen(false)}
        onReordered={() => { setReorderOpen(false); loadItems(); }}
        notify={notify}
      />
    </>
  );
}

/* ── ItemsListView ───────────────────────────────────────────── */
function ItemsListView({
  items, selectedId, onSelect, onEdit, onDelete
}: {
  items: MediaCollectionItem[];
  selectedId?: string;
  onSelect: (item: MediaCollectionItem) => void;
  onEdit: (item: MediaCollectionItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Paper sx={{ bgcolor: "var(--vx-surface)", border: "1px solid var(--vx-border)", borderRadius: "12px", boxShadow: "none", overflow: "hidden" }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "var(--vx-surface-muted)" }}>
              <TableCell sx={{ fontSize: 12, fontWeight: 700, color: "var(--vx-text-muted)", py: 1.5 }}>Anteprima</TableCell>
              <TableCell sx={{ fontSize: 12, fontWeight: 700, color: "var(--vx-text-muted)" }}>Titolo</TableCell>
              <TableCell sx={{ fontSize: 12, fontWeight: 700, color: "var(--vx-text-muted)" }}>Categoria</TableCell>
              <TableCell sx={{ fontSize: 12, fontWeight: 700, color: "var(--vx-text-muted)" }}>Stato</TableCell>
              <TableCell sx={{ fontSize: 12, fontWeight: 700, color: "var(--vx-text-muted)" }}>Data</TableCell>
              <TableCell sx={{ fontSize: 12, fontWeight: 700, color: "var(--vx-text-muted)" }} align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.id}
                hover
                selected={item.id === selectedId}
                onClick={() => onSelect(item)}
                sx={{ cursor: "pointer", "&.Mui-selected": { bgcolor: "var(--vx-primary-soft)" } }}
              >
                <TableCell sx={{ py: 1 }}>
                  <Box
                    component="img"
                    src={item.url}
                    alt={item.alt_text || item.title}
                    sx={{ width: 48, height: 48, borderRadius: "6px", objectFit: "cover", display: "block" }}
                  />
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--vx-text-primary)" }}>{item.title}</Typography>
                  <Typography sx={{ fontSize: 11, color: "var(--vx-text-muted)" }}>
                    {item.storage_path.split("/").pop()}
                  </Typography>
                </TableCell>
                <TableCell>{item.category ? categoryBadge(item.category) : <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>—</Typography>}</TableCell>
                <TableCell>{statusBadge(item.status)}</TableCell>
                <TableCell sx={{ fontSize: 12, color: "var(--vx-text-secondary)", whiteSpace: "nowrap" }}>
                  {item.published_at ? new Date(item.published_at).toLocaleDateString("it-IT") : "—"}
                </TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Modifica">
                    <IconButton size="small" onClick={() => onEdit(item)} sx={{ color: "var(--vx-text-muted)" }}>
                      <EditOutlinedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Elimina">
                    <IconButton size="small" onClick={() => onDelete(item.id)} sx={{ color: "var(--vx-text-muted)", "&:hover": { color: "var(--vx-danger)" } }}>
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

/* ── ItemsGridView ───────────────────────────────────────────── */
function ItemsGridView({
  items, selectedId, onSelect, onEdit, onDelete
}: {
  items: MediaCollectionItem[];
  selectedId?: string;
  onSelect: (item: MediaCollectionItem) => void;
  onEdit: (item: MediaCollectionItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Box sx={{
      display: "grid",
      gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)", md: "repeat(4,1fr)", lg: "repeat(5,1fr)" },
      gap: 1.5
    }}>
      {items.map((item) => (
        <Box
          key={item.id}
          sx={{
            position: "relative", overflow: "hidden", borderRadius: "8px",
            border: item.id === selectedId ? "2px solid var(--vx-primary)" : "2px solid transparent",
            cursor: "pointer", bgcolor: "var(--vx-surface-muted)"
          }}
          onClick={() => onSelect(item)}
        >
          <Box component="img" src={item.url} alt={item.alt_text || item.title}
            sx={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
          <Stack
            sx={{
              position: "absolute", inset: 0, p: 1, bgcolor: "rgba(0,0,0,0.55)", color: "#fff",
              opacity: 0, transition: "opacity 180ms", "&:hover": { opacity: 1 },
              justifyContent: "space-between"
            }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{item.title}</Typography>
            <Stack direction="row" sx={{ justifyContent: "flex-end", gap: 0.25 }} onClick={(e) => e.stopPropagation()}>
              <IconButton size="small" onClick={() => onEdit(item)} sx={{ color: "#fff", p: 0.5 }}>
                <EditOutlinedIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <IconButton size="small" onClick={() => onDelete(item.id)} sx={{ color: "#fff", p: 0.5 }}>
                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Stack>
          </Stack>
          <Box sx={{ p: 0.75 }}>
            <Typography sx={{ fontSize: 11, color: "var(--vx-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.storage_path.split("/").pop()}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/* ── ItemPreviewPanel ────────────────────────────────────────── */
function ItemPreviewPanel({
  item, items, collectionSlug, onClose, onNavigate, onEdit, onDuplicate, onDelete
}: {
  item: MediaCollectionItem;
  items: MediaCollectionItem[];
  collectionSlug: string;
  onClose: () => void;
  onNavigate: (item: MediaCollectionItem) => void;
  onEdit: (item: MediaCollectionItem) => void;
  onDuplicate: (item: MediaCollectionItem) => void;
  onDelete: (id: string) => void;
}) {
  const currentIndex = items.findIndex((i) => i.id === item.id);
  const publicUrl = `/collections/${collectionSlug}/${item.slug}`;

  return (
    <Paper sx={{
      width: 320, flexShrink: 0, bgcolor: "var(--vx-surface)", border: "1px solid var(--vx-border)",
      borderRadius: "12px", boxShadow: "none", overflow: "hidden", position: "sticky", top: 20
    }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1.25, borderBottom: "1px solid var(--vx-border)" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--vx-text-primary)" }}>Anteprima elemento</Typography>
        <Stack direction="row" sx={{ gap: 0.25 }}>
          <IconButton size="small" disabled={currentIndex <= 0} onClick={() => onNavigate(items[currentIndex - 1])} sx={{ color: "var(--vx-text-muted)" }}>
            <ArrowBackIcon sx={{ fontSize: 14 }} />
          </IconButton>
          <IconButton size="small" disabled={currentIndex >= items.length - 1} onClick={() => onNavigate(items[currentIndex + 1])} sx={{ color: "var(--vx-text-muted)" }}>
            <ArrowForwardIcon sx={{ fontSize: 14 }} />
          </IconButton>
          <IconButton size="small" onClick={onClose} sx={{ color: "var(--vx-text-muted)" }}>
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Stack>
      </Stack>

      <Box sx={{ position: "relative", bgcolor: "var(--vx-surface-muted)" }}>
        <Box component="img" src={item.url} alt={item.alt_text || item.title}
          sx={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block" }} />
        <IconButton
          size="small" component="a" href={item.url} target="_blank"
          sx={{ position: "absolute", bottom: 8, right: 8, bgcolor: "rgba(0,0,0,0.5)", color: "#fff", "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }}
        >
          <OpenInFullIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      <Stack spacing={1.5} sx={{ p: 2 }}>
        <DetailRow label="Titolo" value={item.title} />
        {item.description && <DetailRow label="Descrizione" value={item.description} />}
        <DetailRow
          label="Categoria"
          value={item.category ? categoryBadge(item.category) : <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>—</Typography>}
        />
        {item.tags.length > 0 && (
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "var(--vx-text-muted)", mb: 0.5 }}>Tag</Typography>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
              {item.tags.map((t) => <Chip key={t} label={t} size="small" sx={{ fontSize: 11, height: 20 }} />)}
            </Stack>
          </Box>
        )}
        <DetailRow label="Stato" value={statusBadge(item.status)} />
        <DetailRow
          label="Data di pubblicazione"
          value={item.published_at ? new Date(item.published_at).toLocaleString("it-IT") : "—"}
        />
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "var(--vx-text-muted)", mb: 0.25 }}>URL</Typography>
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
            <Typography sx={{ fontSize: 11, color: "var(--vx-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {publicUrl}
            </Typography>
            <Tooltip title="Copia URL">
              <IconButton size="small" onClick={() => navigator.clipboard.writeText(window.location.origin + publicUrl)} sx={{ color: "var(--vx-text-muted)" }}>
                <ContentCopyIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Stack>

      <Divider />

      <Stack direction="row" sx={{ p: 1.5, gap: 1, justifyContent: "space-between" }}>
        <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => onEdit(item)}
          sx={{ flex: 1, borderRadius: "6px", textTransform: "none", fontSize: 12, fontWeight: 600, border: "1px solid var(--vx-border)", color: "var(--vx-text-primary)" }}>
          Modifica
        </Button>
        <Button size="small" startIcon={<FileCopyOutlinedIcon />} onClick={() => onDuplicate(item)}
          sx={{ flex: 1, borderRadius: "6px", textTransform: "none", fontSize: 12, fontWeight: 600, border: "1px solid var(--vx-border)", color: "var(--vx-text-primary)" }}>
          Duplica
        </Button>
        <Button size="small" startIcon={<DeleteOutlineIcon />} color="error" onClick={() => onDelete(item.id)}
          sx={{ flex: 1, borderRadius: "6px", textTransform: "none", fontSize: 12, fontWeight: 600 }}>
          Elimina
        </Button>
      </Stack>
    </Paper>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: "var(--vx-text-muted)", mb: 0.25 }}>{label}</Typography>
      {typeof value === "string"
        ? <Typography sx={{ fontSize: 12, color: "var(--vx-text-primary)", lineHeight: 1.4 }}>{value}</Typography>
        : value}
    </Box>
  );
}

/* ── ItemDrawer ──────────────────────────────────────────────── */
function ItemDrawer({
  open, mode, item, categories, collectionSlug, uploading, onClose, onSave
}: {
  open: boolean;
  mode: "create" | "edit";
  item: MediaCollectionItem | null;
  categories: string[];
  collectionSlug: string;
  uploading: boolean;
  onClose: () => void;
  onSave: (data: Partial<MediaCollectionItem>, file?: File, cropArea?: Area, existingStoragePath?: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [altText, setAltText] = useState("");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isNewCat, setIsNewCat] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [publishedAt, setPublishedAt] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  const [filePreview, setFilePreview] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [cropArea, setCropArea] = useState<Area | null>(null);
  const [useExistingMedia, setUseExistingMedia] = useState(false);
  const [existingMediaFiles, setExistingMediaFiles] = useState<VitrixMediaFile[]>([]);
  const [existingMediaLoading, setExistingMediaLoading] = useState(false);
  const [existingMediaError, setExistingMediaError] = useState<string | null>(null);
  const [selectedExistingMedia, setSelectedExistingMedia] = useState<VitrixMediaFile | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const existingMediaFetchedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      existingMediaFetchedRef.current = false;
      return;
    }
    if (mode === "edit" && item) {
      setTitle(item.title);
      setDescription(item.description || "");
      setAltText(item.alt_text || "");
      setCategory(item.category || "");
      setNewCategory(""); setIsNewCat(false);
      setTags(item.tags || []);
      setStatus(item.status);
      setPublishedAt(item.published_at ? item.published_at.slice(0, 16) : "");
      setSlug(item.slug);
      setSlugEdited(true);
      setFilePreview(item.url);
      setOriginalFile(null); setCropArea(null);
      setSelectedExistingMedia(null);
      setUseExistingMedia(false);
      setExistingMediaError(null);
    } else {
      setTitle(""); setDescription(""); setAltText(""); setCategory(""); setNewCategory(""); setIsNewCat(false);
      setTags([]); setTagInput("");
      setStatus("published");
      setPublishedAt(new Date().toISOString().slice(0, 16));
      setSlug(""); setSlugEdited(false);
      setFilePreview(""); setOriginalFile(null); setCropArea(null);
    }
  }, [open, mode, item]);

  useEffect(() => {
    if (!open || !useExistingMedia || existingMediaFetchedRef.current) return;
    existingMediaFetchedRef.current = true;
    setExistingMediaLoading(true);
    setExistingMediaError(null);

    fetch("/api/vitrix/media")
      .then(async (res) => {
        if (!res.ok) throw new Error("Impossibile caricare la libreria media");
        const json = await res.json();
        setExistingMediaFiles(json.files ?? []);
      })
      .catch((err) => {
        setExistingMediaError(err instanceof Error ? err.message : "Errore durante il caricamento");
      })
      .finally(() => setExistingMediaLoading(false));
  }, [open, useExistingMedia]);

  useEffect(() => {
    if (!slugEdited && mode === "create") setSlug(slugify(title));
  }, [title, slugEdited, mode]);

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  function processFile(f: File) {
    setSelectedExistingMedia(null);
    setUseExistingMedia(false);
    setOriginalFile(f);
    const reader = new FileReader();
    reader.onload = (e) => { setCropSrc(e.target?.result as string); setCropOpen(true); };
    reader.readAsDataURL(f);
  }

  async function handleSave() {
    if (mode === "create" && !originalFile && !selectedExistingMedia) {
      return;
    }

    const finalCategory = isNewCat ? newCategory : category;
    await onSave(
      {
        title,
        description: description || null,
        alt_text: altText || null,
        category: finalCategory || null,
        tags,
        status,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
        slug: slug || undefined,
      },
      originalFile ?? undefined,
      cropArea ?? undefined,
      selectedExistingMedia?.name
    );
  }

  const publicUrl = slug ? `/collections/${collectionSlug}/${slug}` : "";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 480, "@media (max-width:600px)": { width: "100%" } } } }}
    >
      <Stack sx={{ p: 3, height: "100%", overflow: "auto" }} spacing={2}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--vx-text-primary)" }}>
            {mode === "create" ? "Aggiungi elemento" : "Modifica elemento"}
          </Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
        </Stack>

        <Divider />

        <TextField label="Titolo *" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} sx={fieldSx} />

        <TextField label="Descrizione" fullWidth multiline rows={3} value={description}
          onChange={(e) => setDescription(e.target.value)} sx={fieldSx} />

        <TextField label="Alt text" fullWidth multiline rows={2} value={altText}
          onChange={(e) => setAltText(e.target.value)} sx={fieldSx} />

        <Stack spacing={0.75}>
          <Typography variant="subtitle2" sx={{ fontSize: 12, fontWeight: 600, color: "var(--vx-text-secondary)" }}>Categoria</Typography>
          <TextField
            select fullWidth size="small"
            value={isNewCat ? "__new" : category}
            onChange={(e) => {
              if (e.target.value === "__new") { setIsNewCat(true); setCategory(""); }
              else { setIsNewCat(false); setCategory(e.target.value); }
            }}
            slotProps={{ select: { native: true } }}
            sx={fieldSx}
          >
            <option value="">Nessuna categoria</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="__new">+ Nuova categoria</option>
          </TextField>
          {isNewCat && (
            <TextField size="small" placeholder="Nome nuova categoria" value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)} autoFocus sx={fieldSx} />
          )}
        </Stack>

        <Stack spacing={0.75}>
          <Typography variant="subtitle2" sx={{ fontSize: 12, fontWeight: 600, color: "var(--vx-text-secondary)" }}>Tag</Typography>
          <Stack direction="row" sx={{ gap: 0.5, flexWrap: "wrap" }}>
            {tags.map((t) => (
              <Chip key={t} label={t} size="small" onDelete={() => setTags(tags.filter((x) => x !== t))}
                sx={{ fontSize: 11, height: 22 }} />
            ))}
          </Stack>
          <TextField
            size="small" placeholder="Aggiungi tag e premi Enter" value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            sx={fieldSx}
          />
        </Stack>

        <Stack>
          <Typography variant="subtitle2" sx={{ fontSize: 12, fontWeight: 600, color: "var(--vx-text-secondary)" }}>Stato</Typography>
          <RadioGroup row value={status} onChange={(e) => setStatus(e.target.value as "published" | "draft")}>
            <FormControlLabel value="published" control={<Radio size="small" />} label={<Typography sx={{ fontSize: 13 }}>Pubblicato</Typography>} />
            <FormControlLabel value="draft" control={<Radio size="small" />} label={<Typography sx={{ fontSize: 13 }}>Bozza</Typography>} />
          </RadioGroup>
        </Stack>

        <TextField
          label="Data di pubblicazione" type="datetime-local" fullWidth size="small"
          value={publishedAt}
          onChange={(e) => setPublishedAt(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={fieldSx}
        />

        <TextField
          label="Slug" fullWidth size="small" value={slug}
          onChange={(e) => { setSlugEdited(true); setSlug(slugify(e.target.value)); }}
          helperText={publicUrl ? `URL: ${publicUrl}` : "Generato automaticamente dal titolo"}
          sx={fieldSx}
        />

        <Divider />

        <Stack spacing={0.75}>
          <Typography variant="subtitle2" sx={{ fontSize: 12, fontWeight: 600, color: "var(--vx-text-secondary)" }}>Immagine</Typography>

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Button
              size="small" variant={useExistingMedia ? "outlined" : "contained"}
              onClick={() => { setUseExistingMedia(false); setSelectedExistingMedia(null); setExistingMediaError(null); }}
              sx={{ textTransform: "none", fontSize: 12, borderRadius: "6px" }}
            >Carica immagine</Button>
            <Button
              size="small" variant={useExistingMedia ? "contained" : "outlined"}
              onClick={() => { setUseExistingMedia(true); setOriginalFile(null); setCropArea(null); }}
              sx={{ textTransform: "none", fontSize: 12, borderRadius: "6px" }}
            >Usa immagine esistente</Button>
          </Stack>

          {useExistingMedia ? (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {existingMediaLoading ? (
                <Typography sx={{ fontSize: 12, color: "var(--vx-text-secondary)" }}>Caricamento libreria media...</Typography>
              ) : existingMediaError ? (
                <Typography sx={{ fontSize: 12, color: "#d32f2f" }}>{existingMediaError}</Typography>
              ) : (
                <Stack spacing={1} sx={{ maxHeight: 260, overflowY: "auto" }}>
                  {existingMediaFiles.length === 0 ? (
                    <Typography sx={{ fontSize: 12, color: "var(--vx-text-secondary)" }}>Nessun elemento presente.</Typography>
                  ) : existingMediaFiles.map((file) => (
                    <Button
                      key={file.name}
                      variant={selectedExistingMedia?.name === file.name ? "contained" : "outlined"}
                      onClick={() => { setSelectedExistingMedia(file); setFilePreview(file.url); }}
                      sx={{ justifyContent: "space-between", textTransform: "none", borderRadius: "6px", fontSize: 12 }}
                    >
                      <span>{file.name}</span>
                      <Typography sx={{ fontSize: 11, color: "var(--vx-text-secondary)" }}>{file.size ? `${(file.size / 1024).toFixed(1)} KB` : ""}</Typography>
                    </Button>
                  ))}
                </Stack>
              )}
            </Stack>
          ) : filePreview ? (
            <Stack spacing={1}>
              <Box component="img" src={filePreview} alt=""
                sx={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: "8px", bgcolor: "var(--vx-surface-muted)" }} />
              <Button size="small" variant="outlined" startIcon={<CloudUploadIcon />}
                onClick={() => { setFilePreview(""); setOriginalFile(null); setCropArea(null); }}
                sx={{ borderColor: "var(--vx-border)", color: "var(--vx-text-secondary)", borderRadius: "6px", textTransform: "none", fontSize: 12 }}>
                Cambia immagine
              </Button>
            </Stack>
          ) : (
            <Box
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: `2px dashed ${dragOver ? "var(--vx-primary)" : "var(--vx-border)"}`,
                borderRadius: "8px", p: 3, textAlign: "center", cursor: "pointer",
                bgcolor: dragOver ? "var(--vx-primary-soft)" : "var(--vx-surface-muted)",
                transition: "border-color 0.15s, background-color 0.15s",
                "&:hover": { borderColor: "var(--vx-primary)", bgcolor: "var(--vx-primary-soft)" }
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 28, color: "var(--vx-text-muted)", mb: 0.75, display: "block", mx: "auto" }} />
              <Typography sx={{ fontSize: 13, color: "var(--vx-text-secondary)" }}>
                Trascina qui o{" "}
                <Box component="span" sx={{ color: "var(--vx-primary)", fontWeight: 600 }}>clicca per selezionare</Box>
              </Typography>
              <Typography sx={{ fontSize: 11, color: "var(--vx-text-muted)", mt: 0.5 }}>
                JPG, PNG, WebP · max 10 MB
              </Typography>
              <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.currentTarget.value = ""; }} />
            </Box>
          )}
        </Stack>

        <Divider />

        <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={onClose} disabled={uploading}
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, fontSize: 13, borderColor: "var(--vx-border)", color: "var(--vx-text-secondary)" }}>
            Annulla
          </Button>
          <Button
            variant="contained" onClick={handleSave}
            disabled={uploading || !title || (mode === "create" && !originalFile && !selectedExistingMedia)}
            sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, fontSize: 13, background: "var(--vx-gradient-brand)", boxShadow: "none" }}
          >
            {uploading ? <CircularProgress size={18} color="inherit" /> : "Salva"}
          </Button>
        </Stack>

        <ImageCropDialog
          open={cropOpen}
          imageSrc={cropSrc}
          onConfirm={(blob, area) => {
            setOriginalFile(createWebpFile(blob, slug || title || "collection-item"));
            setCropArea(area);
            setCropOpen(false);
            setFilePreview(URL.createObjectURL(blob));
          }}
          onCancel={() => { setCropOpen(false); setCropSrc(""); setOriginalFile(null); }}
        />
      </Stack>
    </Drawer>
  );
}

/* ── CollectionSettingsDialog ────────────────────────────────── */
function CollectionSettingsDialog({
  open, collection, onClose, onUpdated, onDeleted, notify
}: {
  open: boolean;
  collection: MediaCollection;
  onClose: () => void;
  onUpdated: (c: MediaCollection) => void;
  onDeleted: () => void;
  notify: (t: "success" | "error", m: string) => void;
}) {
  const [name, setName] = useState(collection.name);
  const [slug, setSlug] = useState(collection.slug);
  const [description, setDescription] = useState(collection.description || "");
  const [status, setStatus] = useState<"published" | "draft">(collection.status);
  const [busy, setBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setName(collection.name); setSlug(collection.slug);
      setDescription(collection.description || ""); setStatus(collection.status);
    }
  }, [open, collection]);

  async function handleSave() {
    setBusy(true);
    try {
      const res = await fetch(`/api/vitrix/collections/${collection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description: description || null, status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore");
      notify("success", "Collection aggiornata.");
      onUpdated(data.collection);
      onClose();
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Errore durante il salvataggio.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Impostazioni collection</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nome *" size="small" value={name} onChange={(e) => setName(e.target.value)} fullWidth sx={fieldSx} />
            <TextField
              label="Slug *" size="small" value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              helperText={`URL: /collections/${slug || "..."}`}
              fullWidth sx={fieldSx}
            />
            <TextField label="Descrizione" size="small" value={description}
              onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} sx={fieldSx} />
            <Stack>
              <Typography variant="subtitle2" sx={{ fontSize: 12, fontWeight: 600, color: "var(--vx-text-secondary)" }}>Stato</Typography>
              <RadioGroup row value={status} onChange={(e) => setStatus(e.target.value as "published" | "draft")}>
                <FormControlLabel value="published" control={<Radio size="small" />} label={<Typography sx={{ fontSize: 13 }}>Pubblicata</Typography>} />
                <FormControlLabel value="draft" control={<Radio size="small" />} label={<Typography sx={{ fontSize: 13 }}>Bozza</Typography>} />
              </RadioGroup>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Button color="error" onClick={() => setDeleteConfirm(true)} startIcon={<DeleteOutlineIcon />}
            sx={{ textTransform: "none", fontSize: 13 }}>
            Elimina collection
          </Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose} disabled={busy}>Annulla</Button>
            <Button variant="contained" onClick={handleSave} disabled={busy || !name || !slug}
              sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, background: "var(--vx-gradient-brand)", boxShadow: "none" }}>
              {busy ? <CircularProgress size={16} color="inherit" /> : "Salva"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}
        slotProps={{ paper: { sx: dialogPaperSx } }}>
        <DialogTitle>Elimina collection</DialogTitle>
        <DialogContent>Verranno eliminati anche tutti gli elementi e le immagini. L&apos;azione non è reversibile.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>Annulla</Button>
          <Button color="error" variant="contained" onClick={() => { setDeleteConfirm(false); onClose(); onDeleted(); }}>Elimina</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/* ── ReorderDialog ───────────────────────────────────────────── */
function ReorderDialog({
  open, items, collectionId, onClose, onReordered, notify
}: {
  open: boolean;
  items: MediaCollectionItem[];
  collectionId: string;
  onClose: () => void;
  onReordered: () => void;
  notify: (t: "success" | "error", m: string) => void;
}) {
  const [ordered, setOrdered] = useState<MediaCollectionItem[]>([]);
  const [busy, setBusy] = useState(false);
  const dragIndex = useRef<number | null>(null);

  useEffect(() => { if (open) setOrdered([...items]); }, [open, items]);

  function handleDragStart(i: number) { dragIndex.current = i; }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === i) return;
    setOrdered((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex.current!, 1);
      next.splice(i, 0, moved);
      dragIndex.current = i;
      return next;
    });
  }

  async function handleSave() {
    setBusy(true);
    try {
      const reorderItems = ordered.map((item, i) => ({ id: item.id, sort_order: i }));
      const res = await fetch(`/api/vitrix/collections/${collectionId}/items/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reorderItems })
      });
      if (!res.ok) throw new Error();
      notify("success", "Ordine salvato.");
      onReordered();
    } catch {
      notify("error", "Errore durante il salvataggio dell'ordine.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Ordina elementi</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Typography sx={{ px: 3, pb: 1.5, fontSize: 13, color: "var(--vx-text-secondary)" }}>
          Trascina gli elementi per cambiarne l&apos;ordine.
        </Typography>
        <Box sx={{ maxHeight: 400, overflow: "auto" }}>
          {ordered.map((item, i) => (
            <Stack
              key={item.id}
              direction="row"
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              sx={{
                alignItems: "center", gap: 1.5, px: 2.5, py: 1.25,
                borderBottom: "1px solid var(--vx-border)", cursor: "grab",
                "&:hover": { bgcolor: "var(--vx-surface-muted)" },
                "&:active": { cursor: "grabbing" }
              }}
            >
              <MoreVertIcon sx={{ fontSize: 18, color: "var(--vx-text-muted)" }} />
              <Box component="img" src={item.url} alt={item.title}
                sx={{ width: 36, height: 36, borderRadius: "4px", objectFit: "cover", flexShrink: 0 }} />
              <Typography sx={{ fontSize: 13, color: "var(--vx-text-primary)", flex: 1 }}>{item.title}</Typography>
              {item.category && categoryBadge(item.category)}
            </Stack>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>Annulla</Button>
        <Button variant="contained" onClick={handleSave} disabled={busy}
          sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, background: "var(--vx-gradient-brand)", boxShadow: "none" }}>
          {busy ? <CircularProgress size={16} color="inherit" /> : "Salva ordine"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
