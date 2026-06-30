"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { EventCategoryRow } from "@/lib/vitrix/event-categories";
import type { VtxEventRow } from "@/lib/vitrix/types";
import { getThumbnailImageUrl } from "@/lib/vitrix/image";
import { fieldSx, iconBtnSx, selectSx } from "@/lib/admin-theme";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminLoadingBoundary } from "@/components/admin/AdminLoadingBoundary";
import { ItalianFlag, UKFlag } from "@/components/admin/Flags";
import { EditEventDialog, type EventFormValues } from "@/components/admin/events/EditEventDialog";

type ToastState = { open: boolean; message: string; severity: "success" | "error" };
type EventType = "event" | "fiera" | "press";
type StatusFilter = "all" | "published" | "draft" | "featured";
type BulkAction = "" | "publish" | "draft" | "feature" | "unfeature" | "delete";
type SortKey = "title" | "event" | "status" | "type";
type SortDir = "asc" | "desc";

type QuickEditValues = {
  title: string;
  slug: string;
  event_date: string;
  event_start_at: string;
  category: string;
  tags: string;
  status: "draft" | "published";
  is_featured: boolean;
  sort_order: number;
};

const EMPTY_FORM: EventFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  type: "event",
  category: "",
  venue: "",
  event_date: "",
  event_start_at: "",
  event_end_at: "",
  lang: "it",
  status: "draft",
  description: "",
  content: "",
  tags: "",
  main_image_url: "",
  image_alt: "",
  image_position: "50% 50%",
  cta_label: "",
  cta_url: "",
  cta_target: "_self",
  is_featured: false,
  sort_order: 0,
  widget_id: "vtx_events",
  seo_title: "",
  seo_description: "",
  canonical_url: "",
  robots_index: true,
  robots_follow: true,
};

const cardSx = {
  p: 0,
  bgcolor: "var(--vx-surface)",
  border: "1px solid var(--vx-border)",
  borderRadius: "12px",
  boxShadow: "none",
  overflow: "hidden",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function rowToForm(row: VtxEventRow): EventFormValues {
  return {
    title: row.title,
    slug: row.slug ?? "",
    excerpt: row.excerpt ?? "",
    type: row.type as EventType,
    category: row.category ?? "",
    venue: row.venue ?? "",
    event_date: row.event_date_label ?? row.event_date ?? "",
    event_start_at: row.event_start_at ? row.event_start_at.slice(0, 16) : "",
    event_end_at: row.event_end_at ? row.event_end_at.slice(0, 16) : "",
    lang: row.lang,
    status: row.status,
    description: row.description ?? "",
    content: row.content ?? row.body ?? "",
    tags: row.tags?.join(", ") ?? "",
    main_image_url: row.main_image_url ?? row.cover_image ?? "",
    image_alt: row.image_alt ?? "",
    image_position: row.image_position ?? "50% 50%",
    cta_label: row.cta_label ?? "",
    cta_url: row.cta_url ?? "",
    cta_target: row.cta_target === "_blank" ? "_blank" : "_self",
    is_featured: Boolean(row.is_featured),
    sort_order: row.sort_order ?? 0,
    widget_id: row.widget_id ?? "vtx_events",
    seo_title: row.seo_title ?? "",
    seo_description: row.seo_description ?? "",
    canonical_url: row.canonical_url ?? "",
    robots_index: row.robots_index ?? true,
    robots_follow: row.robots_follow ?? true,
  };
}

function rowToQuickEdit(row: VtxEventRow): QuickEditValues {
  return {
    title: row.title,
    slug: row.slug ?? "",
    event_date: row.event_date_label ?? row.event_date ?? "",
    event_start_at: row.event_start_at ? row.event_start_at.slice(0, 16) : "",
    category: row.category ?? "",
    tags: row.tags?.join(", ") ?? "",
    status: row.status,
    is_featured: Boolean(row.is_featured),
    sort_order: row.sort_order ?? 0,
  };
}

function formToPayload(form: EventFormValues) {
  return {
    ...form,
    event_date: form.event_date || null,
    event_date_label: form.event_date || null,
    category: form.category || null,
    venue: form.venue || null,
    description: form.description || null,
    content: form.content || null,
    body: form.content || null,
    tags: form.tags,
    event_start_at: form.event_start_at || null,
    event_end_at: form.event_end_at || null,
    main_image_url: form.main_image_url || null,
    cover_image: form.main_image_url || null,
    image_alt: form.image_alt || null,
    image_position: form.image_position || "50% 50%",
    cta_label: form.cta_label || null,
    cta_url: form.cta_url || null,
    cta_target: form.cta_target,
    is_featured: form.is_featured,
    sort_order: form.sort_order,
    widget_id: form.widget_id || "vtx_events",
    seo_title: form.seo_title || null,
    seo_description: form.seo_description || null,
    canonical_url: form.canonical_url || null,
    robots_index: form.robots_index,
    robots_follow: form.robots_follow,
  };
}

function includesText(value: string | null | undefined, query: string) {
  return (value ?? "").toLowerCase().includes(query);
}

export function EventsPanel() {
  const [items, setItems] = useState<VtxEventRow[]>([]);
  const [categories, setCategories] = useState<EventCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | EventType>("all");
  const [langFilter, setLangFilter] = useState("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("event");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [quickEditId, setQuickEditId] = useState<number | null>(null);
  const [quickEdit, setQuickEdit] = useState<QuickEditValues | null>(null);
  const [quickSaving, setQuickSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>({ open: false, message: "", severity: "success" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VtxEventRow | null>(null);
  const [form, setForm] = useState<EventFormValues>(EMPTY_FORM);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VtxEventRow | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categoryEditId, setCategoryEditId] = useState<string | null>(null);
  const [categoryEditName, setCategoryEditName] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const showToast = useCallback((message: string, severity: "success" | "error" = "success") => {
    setToast({ open: true, message, severity });
  }, []);

  const fetchItems = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        fetch("/api/vitrix/events", { signal: abortRef.current.signal }),
        fetch("/api/vitrix/events/categories", { signal: abortRef.current.signal }),
      ]);
      const itemsJson = await itemsRes.json();
      const categoriesJson = await categoriesRes.json();
      if (!itemsRes.ok) throw new Error(itemsJson.error || "Errore caricamento eventi.");
      if (!categoriesRes.ok) throw new Error(categoriesJson.error || "Errore caricamento categorie.");
      setItems(itemsJson.items ?? []);
      setCategories(categoriesJson.categories ?? []);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      showToast(err instanceof Error ? err.message : "Errore nel caricamento eventi.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchItems();
    return () => abortRef.current?.abort();
  }, [fetchItems]);

  const counts = useMemo(() => ({
    all: items.length,
    published: items.filter((item) => item.status === "published").length,
    draft: items.filter((item) => item.status === "draft").length,
    featured: items.filter((item) => item.is_featured).length,
  }), [items]);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (statusFilter === "published" && item.status !== "published") return false;
      if (statusFilter === "draft" && item.status !== "draft") return false;
      if (statusFilter === "featured" && !item.is_featured) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (langFilter !== "all" && item.lang !== langFilter) return false;
      if (!q) return true;
      return (
        includesText(item.title, q) ||
        includesText(item.slug, q) ||
        includesText(item.category, q) ||
        includesText(item.venue, q) ||
        includesText(item.tags?.join(" "), q)
      );
    });

    return [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "title") return a.title.localeCompare(b.title) * dir;
      if (sortKey === "status") return a.status.localeCompare(b.status) * dir;
      if (sortKey === "type") return a.type.localeCompare(b.type) * dir;
      const aDate = Date.parse(a.event_start_at ?? a.event_date ?? "") || 0;
      const bDate = Date.parse(b.event_start_at ?? b.event_date ?? "") || 0;
      return (aDate - bDate) * dir;
    });
  }, [categoryFilter, items, langFilter, search, sortDir, sortKey, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(displayed.length / rowsPerPage));
  const pageItems = displayed.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const visibleIds = pageItems.map((item) => item.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    setPage(0);
  }, [categoryFilter, langFilter, rowsPerPage, search, statusFilter, typeFilter]);

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDir(nextKey === "event" ? "desc" : "asc");
  }

  function toggleSelected(id: number) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]);
  }

  function toggleAllVisible() {
    setSelectedIds((prev) => {
      if (allVisibleSelected) return prev.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...prev, ...visibleIds]));
    });
  }

  function openCreate() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setMainImageFile(null);
    setDialogOpen(true);
  }

  function openEdit(item: VtxEventRow) {
    setEditingItem(item);
    setForm(rowToForm(item));
    setMainImageFile(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingItem(null);
    setMainImageFile(null);
  }

  function openQuickEdit(item: VtxEventRow) {
    setQuickEditId(item.id);
    setQuickEdit(rowToQuickEdit(item));
  }

  function resetFilters() {
    setStatusFilter("all");
    setTypeFilter("all");
    setCategoryFilter("all");
    setLangFilter("all");
    setSearchDraft("");
    setSearch("");
  }

  async function handleSave(nextForm = form) {
    if (!nextForm.title.trim()) {
      showToast("Il titolo e obbligatorio.", "error");
      return;
    }
    setSaving(true);
    try {
      const categoryName = await ensureCategory(nextForm.category);
      const finalForm = { ...nextForm, category: categoryName };
      const isEdit = Boolean(editingItem);
      const url = isEdit ? `/api/vitrix/events/${editingItem!.id}` : "/api/vitrix/events";
      const method = isEdit ? "PATCH" : "POST";
      const body = formToPayload(finalForm);
      const requestInit: RequestInit = { method };
      if (mainImageFile) {
        const formData = new FormData();
        Object.entries(body).forEach(([key, value]) => {
          if (value === null || value === undefined) return;
          formData.append(key, typeof value === "boolean" || typeof value === "number" ? String(value) : value);
        });
        formData.append("main_image", mainImageFile);
        requestInit.body = formData;
      } else {
        requestInit.headers = { "Content-Type": "application/json" };
        requestInit.body = JSON.stringify(body);
      }
      const res = await fetch(url, requestInit);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast(isEdit ? "Evento aggiornato." : "Evento creato.");
      closeDialog();
      fetchItems();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Errore nel salvataggio.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickSave() {
    if (!quickEditId || !quickEdit) return;
    if (!quickEdit.title.trim()) {
      showToast("Il titolo e obbligatorio.", "error");
      return;
    }
    setQuickSaving(true);
    try {
      const categoryName = await ensureCategory(quickEdit.category);
      const res = await fetch(`/api/vitrix/events/${quickEditId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quickEdit.title,
          slug: quickEdit.slug || null,
          event_date: quickEdit.event_date || null,
          event_date_label: quickEdit.event_date || null,
          event_start_at: quickEdit.event_start_at || null,
          category: categoryName || null,
          tags: quickEdit.tags,
          status: quickEdit.status,
          is_featured: quickEdit.is_featured,
          sort_order: quickEdit.sort_order,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast("Modifica rapida salvata.");
      setQuickEditId(null);
      setQuickEdit(null);
      fetchItems();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Errore nella modifica rapida.", "error");
    } finally {
      setQuickSaving(false);
    }
  }

  async function ensureCategory(rawName: string) {
    const name = rawName.trim();
    if (!name || categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) return name;

    const res = await fetch("/api/vitrix/events/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Errore creazione categoria.");

    if (json.category) {
      setCategories((current) => {
        if (current.some((category) => category.id === json.category.id || category.name.toLowerCase() === json.category.name.toLowerCase())) {
          return current;
        }
        return [...current, json.category].sort((a, b) => a.sort_order - b.sort_order);
      });
      return json.category.name as string;
    }

    return name;
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setCategoryBusy(true);
    try {
      await ensureCategory(name);
      setNewCategoryName("");
      showToast("Categoria creata.");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Errore creazione categoria.", "error");
    } finally {
      setCategoryBusy(false);
    }
  }

  async function handleRenameCategory(id: string) {
    const name = categoryEditName.trim();
    if (!name) return;
    setCategoryBusy(true);
    try {
      const res = await fetch(`/api/vitrix/events/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCategories((current) => current.map((c) => (c.id === id ? { ...c, name: json.category?.name ?? name } : c)));
      setCategoryEditId(null);
      setCategoryEditName("");
      showToast("Categoria rinominata.");
      fetchItems();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Errore rinomina categoria.", "error");
    } finally {
      setCategoryBusy(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    setCategoryBusy(true);
    try {
      const res = await fetch(`/api/vitrix/events/categories/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCategories((current) => current.filter((c) => c.id !== id));
      showToast("Categoria eliminata.");
      fetchItems();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Errore eliminazione categoria.", "error");
    } finally {
      setCategoryBusy(false);
    }
  }

  async function runBulkAction(action: Exclude<BulkAction, "">) {
    if (selectedIds.length === 0) {
      showToast("Seleziona almeno un evento.", "error");
      return;
    }
    setBulkBusy(true);
    try {
      const res = await fetch("/api/vitrix/events/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast(`${json.updated ?? selectedIds.length} elementi aggiornati.`);
      setSelectedIds([]);
      setBulkAction("");
      setBulkDeleteOpen(false);
      fetchItems();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Errore azione massiva.", "error");
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkApply() {
    if (!bulkAction) return;
    if (bulkAction === "delete") {
      setBulkDeleteOpen(true);
      return;
    }
    await runBulkAction(bulkAction);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/vitrix/events/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast("Evento eliminato.");
      setDeleteTarget(null);
      fetchItems();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Errore eliminazione.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: "column", lg: "row" }} sx={{ justifyContent: "space-between", gap: 2.5, mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontSize: 24, fontWeight: 750, color: "var(--vx-text-primary)", mb: 0.5 }}>
            Eventi
          </Typography>
          <Typography sx={{ fontSize: 13, color: "var(--vx-text-muted)" }}>
            Gestisci eventi, fiere e press con filtri, quick edit e azioni massive.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<LocalOfferOutlinedIcon />}
            onClick={() => setCategoryDialogOpen(true)}
            sx={{ height: 38, borderRadius: "8px", textTransform: "none", fontSize: 13, fontWeight: 700, borderColor: "var(--vx-border)", color: "var(--vx-text-secondary)" }}
          >
            Gestisci categorie
          </Button>
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={openCreate}
            sx={{ height: 38, borderRadius: "8px", textTransform: "none", fontSize: 13, fontWeight: 700, bgcolor: "var(--vx-primary)", boxShadow: "none", "&:hover": { bgcolor: "var(--vx-primary)", filter: "brightness(0.92)" } }}
          >
            Aggiungi evento
          </Button>
        </Stack>
      </Stack>

      <Tabs
        value={statusFilter}
        onChange={(_, value) => setStatusFilter(value as StatusFilter)}
        sx={{
          mb: 2,
          minHeight: 38,
          borderBottom: "1px solid var(--vx-border)",
          "& .MuiTabs-indicator": { bgcolor: "var(--vx-primary)", height: 2 },
        }}
      >
        {[
          ["all", "Tutti", counts.all],
          ["published", "Pubblicati", counts.published],
          ["draft", "Bozze", counts.draft],
          ["featured", "In evidenza", counts.featured],
        ].map(([key, label, count]) => (
          <Tab
            key={key}
            value={key}
            label={`${label} (${count})`}
            sx={{
              minHeight: 38,
              textTransform: "none",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--vx-text-muted)",
              "&.Mui-selected": { color: "var(--vx-primary)", fontWeight: 700 },
            }}
          />
        ))}
      </Tabs>

      <Paper sx={{ ...cardSx, mb: 2, p: 2 }}>
        <Stack direction={{ xs: "column", xl: "row" }} spacing={1.5} sx={{ alignItems: { xl: "center" } }}>
          <Stack direction="row" spacing={1} sx={{ flex: 1, minWidth: 260 }}>
            <TextField
              size="small"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchDraft); }}
              placeholder="Cerca eventi..."
              fullWidth
              sx={fieldSx}
            />
            <Button variant="outlined" startIcon={<SearchOutlinedIcon />} onClick={() => setSearch(searchDraft)} sx={{ textTransform: "none", borderRadius: "8px", borderColor: "var(--vx-border)" }}>
              Cerca
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            <Select size="small" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "all" | EventType)} sx={selectSx}>
              <MenuItem value="all">Tutti i tipi</MenuItem>
              <MenuItem value="event">Eventi</MenuItem>
              <MenuItem value="fiera">Fiere</MenuItem>
              <MenuItem value="press">Press</MenuItem>
            </Select>
            <Select size="small" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} sx={selectSx}>
              <MenuItem value="all">Tutte le categorie</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.name}>{category.name} ({category.item_count ?? 0})</MenuItem>
              ))}
            </Select>
            <Select size="small" value={langFilter} onChange={(e) => setLangFilter(e.target.value)} sx={selectSx}>
              <MenuItem value="all">Tutte le lingue</MenuItem>
              <MenuItem value="it">IT</MenuItem>
              <MenuItem value="en">EN</MenuItem>
            </Select>
            <Button startIcon={<FilterListOutlinedIcon />} variant="outlined" onClick={resetFilters} sx={{ textTransform: "none", borderRadius: "8px", borderColor: "var(--vx-border)" }}>
              Reset
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "center" }, justifyContent: "space-between", mb: 1.5 }}>
        <Stack direction="row" spacing={1}>
          <Select size="small" value={bulkAction} onChange={(e) => setBulkAction(e.target.value as BulkAction)} sx={selectSx} displayEmpty>
            <MenuItem value="">Azioni di gruppo</MenuItem>
            <MenuItem value="publish">Pubblica</MenuItem>
            <MenuItem value="draft">Sposta in bozza</MenuItem>
            <MenuItem value="feature">Imposta featured</MenuItem>
            <MenuItem value="unfeature">Rimuovi featured</MenuItem>
            <MenuItem value="delete">Elimina</MenuItem>
          </Select>
          <Button variant="outlined" disabled={!bulkAction || selectedIds.length === 0 || bulkBusy} onClick={handleBulkApply} sx={{ textTransform: "none", borderRadius: "8px", borderColor: "var(--vx-border)" }}>
            {bulkBusy ? "Applico..." : "Applica"}
          </Button>
        </Stack>
        <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>
          {displayed.length} elementi filtrati - {selectedIds.length} selezionati
        </Typography>
      </Stack>

      <Paper sx={cardSx}>
        {loading ? (
          <AdminLoadingBoundary label="Carico eventi" minHeight={320} />
        ) : displayed.length === 0 ? (
          <Box sx={{ p: 8, textAlign: "center" }}>
            <ArticleOutlinedIcon sx={{ fontSize: 40, color: "var(--vx-text-disabled)", mb: 2 }} />
            <Typography sx={{ color: "var(--vx-text-secondary)", fontSize: 14 }}>Nessun evento trovato.</Typography>
          </Box>
        ) : (
          <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
            <Box component="thead">
              <Box component="tr" sx={{ borderBottom: "1px solid var(--vx-border)" }}>
                <Box component="th" sx={{ width: 42, px: 1.25, py: 1.25, textAlign: "left", bgcolor: "rgba(247,249,252,0.95)" }}>
                  <Checkbox size="small" checked={allVisibleSelected} indeterminate={selectedIds.length > 0 && !allVisibleSelected} onChange={toggleAllVisible} />
                </Box>
                {[
                  ["title", "Titolo"],
                  ["type", "Tipo"],
                  ["category", "Categorie"],
                  ["event", "Data"],
                  ["venue", "Luogo"],
                  ["status", "Stato"],
                  ["lang", "Lingua"],
                  ["actions", ""],
                ].map(([key, label]) => (
                  <Box
                    key={key}
                    component="th"
                    onClick={() => (["title", "type", "event", "status"].includes(key) ? toggleSort(key as SortKey) : undefined)}
                    sx={{ px: 2, py: 1.5, textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--vx-text-muted)", bgcolor: "rgba(247,249,252,0.95)", cursor: ["title", "type", "event", "status"].includes(key) ? "pointer" : "default" }}
                  >
                    {label}{sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {pageItems.map((item, idx) => (
                <Fragment key={item.id}>
                  <Box key={item.id} component="tr" sx={{ borderBottom: quickEditId === item.id ? "none" : "1px solid var(--vx-border)", "&:hover": { bgcolor: "var(--vx-surface-muted)" } }}>
                    <Box component="td" sx={{ px: 1.25, py: 1.5 }}>
                      <Checkbox size="small" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} />
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.5, minWidth: 320 }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        <Box sx={{ width: 54, height: 46, flex: "0 0 auto", borderRadius: "8px", overflow: "hidden", bgcolor: "var(--vx-surface-muted)", border: "1px solid var(--vx-border)", display: "grid", placeItems: "center" }}>
                          {item.main_image_url || item.cover_image ? (
                            <Box component="img" src={getThumbnailImageUrl(item.main_image_url ?? item.cover_image) ?? ""} alt={item.image_alt ?? item.title} loading="lazy" decoding="async" sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: item.image_position ?? "50% 50%" }} />
                          ) : (
                            <ArticleOutlinedIcon sx={{ fontSize: 18, color: "var(--vx-text-disabled)" }} />
                          )}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "var(--vx-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: "center", flexWrap: "wrap" }}>
                            <Button size="small" onClick={() => openQuickEdit(item)} sx={{ minWidth: 0, p: 0, textTransform: "none", fontSize: 12 }}>Modifica rapida</Button>
                            <Typography sx={{ color: "var(--vx-text-disabled)", fontSize: 12 }}>|</Typography>
                            <Button size="small" onClick={() => openEdit(item)} sx={{ minWidth: 0, p: 0, textTransform: "none", fontSize: 12 }}>Modifica completa</Button>
                            <Typography sx={{ color: "var(--vx-text-disabled)", fontSize: 12 }}>|</Typography>
                            <Button size="small" onClick={() => setDeleteTarget(item)} sx={{ minWidth: 0, p: 0, textTransform: "none", fontSize: 12, color: "var(--vx-danger, #c62828)" }}>Elimina</Button>
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.5 }}><StatusBadge status={item.type} size="xs" /></Box>
                    <Box component="td" sx={{ px: 2, py: 1.5 }}><Typography sx={{ fontSize: 13, color: "var(--vx-text-secondary)" }}>{item.category || "-"}</Typography></Box>
                    <Box component="td" sx={{ px: 2, py: 1.5 }}>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                        <EventOutlinedIcon sx={{ fontSize: 14, color: "var(--vx-text-muted)" }} />
                        <Typography sx={{ fontSize: 12.5, color: "var(--vx-text-secondary)" }}>{item.event_date_label || formatDate(item.event_start_at || item.event_date)}</Typography>
                      </Stack>
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.5 }}><Typography sx={{ fontSize: 13, color: "var(--vx-text-secondary)" }}>{item.venue || "-"}</Typography></Box>
                    <Box component="td" sx={{ px: 2, py: 1.5 }}>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                        <StatusBadge status={item.status} size="xs" />
                        {item.is_featured && <Chip size="small" icon={<PushPinOutlinedIcon sx={{ fontSize: 12 }} />} label="Featured" sx={{ height: 22, fontSize: 10, bgcolor: "var(--vx-primary-soft)", color: "var(--vx-primary)" }} />}
                      </Stack>
                    </Box>
                    <Box component="td" sx={{ px: 2, py: 1.5 }}>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                        <Box sx={{ opacity: item.lang === "it" ? 1 : 0.3 }}><ItalianFlag width={18} height={13} /></Box>
                        <Box sx={{ opacity: item.lang === "en" ? 1 : 0.3 }}><UKFlag width={18} height={13} /></Box>
                      </Stack>
                    </Box>
                    <Box component="td" sx={{ px: 1.5, py: 1.5 }}>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Modifica completa" arrow><IconButton size="small" onClick={() => openEdit(item)} sx={iconBtnSx("primary")}><EditOutlinedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                        <Tooltip title="Elimina" arrow><IconButton size="small" onClick={() => setDeleteTarget(item)} sx={iconBtnSx("danger")}><DeleteOutlinedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                      </Stack>
                    </Box>
                  </Box>
                  {quickEditId === item.id && quickEdit && (
                    <Box key={`${item.id}-quick`} component="tr" sx={{ borderBottom: idx < pageItems.length - 1 ? "1px solid var(--vx-border)" : "none" }}>
                      <Box component="td" colSpan={9} sx={{ p: 0, bgcolor: "rgba(247,249,252,0.82)" }}>
                        <Box sx={{ p: 2.5, borderTop: "1px solid var(--vx-border)" }}>
                          <Typography sx={{ mb: 2, fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--vx-text-muted)" }}>Modifica rapida</Typography>
                          <Stack spacing={2}>
                            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                              <TextField label="Titolo" value={quickEdit.title} onChange={(e) => setQuickEdit((p) => p && ({ ...p, title: e.target.value }))} fullWidth sx={fieldSx} />
                              <TextField label="Slug" value={quickEdit.slug} onChange={(e) => setQuickEdit((p) => p && ({ ...p, slug: e.target.value }))} fullWidth sx={fieldSx} />
                            </Stack>
                            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                              <TextField label="Data label" value={quickEdit.event_date} onChange={(e) => setQuickEdit((p) => p && ({ ...p, event_date: e.target.value }))} fullWidth sx={fieldSx} />
                              <TextField label="Inizio evento" type="datetime-local" value={quickEdit.event_start_at} onChange={(e) => setQuickEdit((p) => p && ({ ...p, event_start_at: e.target.value }))} fullWidth slotProps={{ inputLabel: { shrink: true } }} sx={fieldSx} />
                              <TextField label="Ordinamento" type="number" value={quickEdit.sort_order} onChange={(e) => setQuickEdit((p) => p && ({ ...p, sort_order: Number(e.target.value) }))} sx={fieldSx} />
                            </Stack>
                            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                              <Autocomplete
                                freeSolo
                                options={categories.map((category) => category.name)}
                                value={quickEdit.category || ""}
                                onChange={(_, next) => setQuickEdit((p) => p && ({ ...p, category: typeof next === "string" ? next : next ?? "" }))}
                                onInputChange={(_, next) => setQuickEdit((p) => p && ({ ...p, category: next }))}
                                fullWidth
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Categoria"
                                    helperText="Scegli o scrivi una nuova categoria."
                                    sx={fieldSx}
                                  />
                                )}
                              />
                              <TextField label="Tag" value={quickEdit.tags} onChange={(e) => setQuickEdit((p) => p && ({ ...p, tags: e.target.value }))} fullWidth sx={fieldSx} />
                              <TextField select label="Stato" value={quickEdit.status} onChange={(e) => setQuickEdit((p) => p && ({ ...p, status: e.target.value as "draft" | "published" }))} sx={fieldSx}>
                                <MenuItem value="draft">Bozza</MenuItem>
                                <MenuItem value="published">Pubblicato</MenuItem>
                              </TextField>
                            </Stack>
                            <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                              <FormControlLabel control={<Switch checked={quickEdit.is_featured} onChange={(e) => setQuickEdit((p) => p && ({ ...p, is_featured: e.target.checked }))} />} label="Metti questo evento in evidenza" />
                              <Stack direction="row" spacing={1}>
                                <Button variant="contained" disabled={quickSaving} onClick={handleQuickSave} sx={{ textTransform: "none", borderRadius: "8px" }}>{quickSaving ? "Aggiorno..." : "Aggiorna"}</Button>
                                <Button variant="outlined" onClick={() => { setQuickEditId(null); setQuickEdit(null); }} sx={{ textTransform: "none", borderRadius: "8px", borderColor: "var(--vx-border)" }}>Annulla</Button>
                              </Stack>
                            </Stack>
                          </Stack>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Fragment>
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1.5, alignItems: { sm: "center" }, justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>
          Mostra {pageItems.length} di {displayed.length} elementi filtrati su {items.length} totali.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>Elementi per pagina</Typography>
          <Select size="small" value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))} sx={{ ...selectSx, minWidth: 78 }}>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
          <Button variant="outlined" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} sx={{ minWidth: 36, borderRadius: "8px", borderColor: "var(--vx-border)" }}>
            ‹
          </Button>
          <Typography sx={{ minWidth: 72, textAlign: "center", fontSize: 12, color: "var(--vx-text-secondary)" }}>
            {page + 1} / {totalPages}
          </Typography>
          <Button variant="outlined" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} sx={{ minWidth: 36, borderRadius: "8px", borderColor: "var(--vx-border)" }}>
            ›
          </Button>
        </Stack>
      </Stack>

      <EditEventDialog
        open={dialogOpen}
        mode={editingItem ? "edit" : "create"}
        event={editingItem}
        value={form}
        categories={categories}
        imageFile={mainImageFile}
        saving={saving}
        onChange={setForm}
        onImageFileChange={setMainImageFile}
        onClose={closeDialog}
        onSave={handleSave}
        onDelete={setDeleteTarget}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { bgcolor: "var(--vx-surface)", color: "var(--vx-text-primary)", borderRadius: "14px", border: "1px solid var(--vx-border)", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" } } }}>
        <DialogTitle sx={{ px: 3, pt: 3, pb: 1, fontSize: 17, fontWeight: 700 }}>Elimina evento</DialogTitle>
        <DialogContent sx={{ px: 3 }}><Typography sx={{ fontSize: 14, color: "var(--vx-text-secondary)" }}>Sei sicuro di voler eliminare <Box component="strong" sx={{ color: "var(--vx-text-primary)" }}>&quot;{deleteTarget?.title}&quot;</Box>? L&apos;operazione e irreversibile.</Typography></DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} variant="outlined" sx={{ textTransform: "none", fontSize: 13, borderRadius: "8px", borderColor: "var(--vx-border)", color: "var(--vx-text-secondary)" }}>Annulla</Button>
          <Button onClick={handleDelete} disabled={deleting} variant="contained" color="error" startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlinedIcon />} sx={{ textTransform: "none", fontSize: 13, fontWeight: 700, borderRadius: "8px", boxShadow: "none" }}>{deleting ? "Eliminazione..." : "Elimina"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Elimina eventi selezionati</DialogTitle>
        <DialogContent><Typography sx={{ fontSize: 14 }}>Vuoi eliminare definitivamente {selectedIds.length} eventi selezionati?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteOpen(false)} sx={{ textTransform: "none" }}>Annulla</Button>
          <Button onClick={() => runBulkAction("delete")} disabled={bulkBusy} color="error" variant="contained" sx={{ textTransform: "none" }}>{bulkBusy ? "Elimino..." : "Elimina"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { bgcolor: "var(--vx-surface)", color: "var(--vx-text-primary)", borderRadius: "14px", border: "1px solid var(--vx-border)", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" } } }}>
        <DialogTitle sx={{ px: 3, pt: 3, pb: 1, fontSize: 17, fontWeight: 700 }}>Categorie eventi</DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Stack spacing={1.5} sx={{ mb: 2, maxHeight: 300, overflowY: "auto" }}>
            {categories.map((category) => (
              <Stack key={category.id} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {categoryEditId === category.id ? (
                  <>
                    <TextField size="small" value={categoryEditName} onChange={(e) => setCategoryEditName(e.target.value)} fullWidth sx={fieldSx} autoFocus />
                    <Button size="small" variant="contained" disabled={categoryBusy} onClick={() => handleRenameCategory(category.id)} sx={{ textTransform: "none", borderRadius: "8px" }}>Salva</Button>
                    <Button size="small" variant="outlined" onClick={() => { setCategoryEditId(null); setCategoryEditName(""); }} sx={{ textTransform: "none", borderRadius: "8px", borderColor: "var(--vx-border)" }}>Annulla</Button>
                  </>
                ) : (
                  <>
                    <Typography sx={{ flex: 1, fontSize: 14, color: "var(--vx-text-primary)" }}>
                      {category.name} <Typography component="span" sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>({category.item_count ?? 0})</Typography>
                    </Typography>
                    <Tooltip title="Rinomina" arrow>
                      <IconButton size="small" onClick={() => { setCategoryEditId(category.id); setCategoryEditName(category.name); }} sx={iconBtnSx("primary")}>
                        <EditOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina" arrow>
                      <IconButton size="small" disabled={categoryBusy} onClick={() => handleDeleteCategory(category.id)} sx={iconBtnSx("danger")}>
                        <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Stack>
            ))}
            {categories.length === 0 && (
              <Typography sx={{ fontSize: 13, color: "var(--vx-text-muted)" }}>Nessuna categoria creata.</Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              placeholder="Nuova categoria (es. Press ADV)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateCategory(); }}
              fullWidth
              sx={fieldSx}
            />
            <Button variant="contained" disabled={categoryBusy || !newCategoryName.trim()} onClick={handleCreateCategory} sx={{ textTransform: "none", borderRadius: "8px", bgcolor: "var(--vx-primary)" }}>
              Crea
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCategoryDialogOpen(false)} variant="outlined" sx={{ textTransform: "none", fontSize: 13, borderRadius: "8px", borderColor: "var(--vx-border)", color: "var(--vx-text-secondary)" }}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3500} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: "10px", fontSize: 13 }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
