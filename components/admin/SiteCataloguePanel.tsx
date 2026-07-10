"use client";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardActionArea,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Menu,
  MenuItem,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import type {
  VitrixCatalogueCategoryRow,
  VitrixCatalogueRow,
} from "@/lib/vitrix/types";
import { fieldSx, dialogPaperSx, dialogHeaderSx } from "@/lib/admin-theme";
import { ImageCropDialog } from "./ImageCropDialog";
import MediaPickerDialog from "./MediaPickerDialog";
import { AdminLoadingBoundary } from "@/components/admin/AdminLoadingBoundary";
import { ItalianFlag, UKFlag } from "./Flags";
import CollectionPreviewCard from "./CollectionPreviewCard";
import type { PreviewMode } from "./CollectionPreviewCard";

const CATALOGUE_TITLE = "Catalogo";
const CATALOGUE_TITLE_STORAGE_KEY = "vitrix-site-catalogue-title";
const CATALOGUE_DESCRIPTION_STORAGE_KEY = "vitrix-site-catalogue-description";
const CATALOGUE_COVER_STORAGE_KEY = "vitrix-site-catalogue-cover";
const CATALOGUE_COLOR_STORAGE_KEY = "vitrix-site-catalogue-color";
const CATALOGUE_CARD_COLORS = ["#F04438", "#2563EB", "#0F766E", "#B45309", "#7C3AED", "#BE123C"];

type CatalogueStatus = VitrixCatalogueRow["status"] | "archived";
type ViewMode = "overview" | "detail";
type CategoryBusyAction = "create" | "save" | "delete" | "reorder" | null;

const cellSx = {
  height: 58,
  py: 0.75,
  borderColor: "var(--vx-border)",
  color: "var(--vx-text-primary)",
  fontSize: 13,
  verticalAlign: "middle",
};

const statusMap: Record<CatalogueStatus, { label: string; bg: string; color: string; dot: string }> = {
  published: {
    label: "Pubblicato",
    bg: "rgba(46,125,50,0.12)",
    color: "#2E7D32",
    dot: "#2E7D32",
  },
  draft: {
    label: "Bozza",
    bg: "rgba(237,108,2,0.13)",
    color: "#B45309",
    dot: "#D97706",
  },
  archived: {
    label: "Archiviato",
    bg: "rgba(100,116,139,0.14)",
    color: "#64748B",
    dot: "#64748B",
  },
};

const categoryMap: Record<string, { bg: string; color: string }> = {
  Anelli: { bg: "rgba(234,179,8,0.22)", color: "#8A6500" },
  Bracciali: { bg: "rgba(199,110,72,0.2)", color: "#A04B2D" },
  Collane: { bg: "rgba(20,184,166,0.18)", color: "#0F766E" },
  Orecchini: { bg: "rgba(168,85,247,0.18)", color: "#7E22CE" },
  Parure: { bg: "rgba(99,102,241,0.18)", color: "#4F46E5" },
};

function StatusBadge({ status }: { status: CatalogueStatus }) {
  const meta = statusMap[status] ?? statusMap.draft;
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
        bgcolor: meta.bg,
        color: meta.color,
        lineHeight: 1.5,
      }}
    >
      <Box
        component="span"
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: meta.dot,
          display: "inline-block",
        }}
      />
      {meta.label}
    </Box>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const meta = categoryMap[category] ?? { bg: "var(--vx-primary-soft)", color: "var(--vx-primary)" };
  return (
    <Chip
      label={category}
      size="small"
      sx={{
        height: 24,
        borderRadius: "12px",
        bgcolor: meta.bg,
        color: meta.color,
        fontSize: 11,
        fontWeight: 700,
        "& .MuiChip-label": { px: 1 },
      }}
    />
  );
}

function LanguageFlag({ lang }: { lang: string }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32 }}>
      {lang === "en" ? <UKFlag /> : <ItalianFlag />}
    </Box>
  );
}

const emptyForm = (defaultCategory = "") => ({
  ref: "",
  title: "",
  description: "",
  category: defaultCategory,
  item_type: "item" as "collection" | "item",
  img_position: "",
  lang: "it",
  status: "draft" as "draft" | "published",
  sort_order: 0,
});

type FormState = ReturnType<typeof emptyForm>;

function getCatalogueItemType(row: Pick<VitrixCatalogueRow, "item_type" | "category">): "collection" | "item" {
  if (row.item_type === "collection" || row.item_type === "item") return row.item_type;
  return row.category === "Parure" ? "collection" : "item";
}

export function SiteCataloguePanel() {
  const [view, setView] = useState<ViewMode>("overview");
  const [catalogueTitle, setCatalogueTitle] = useState(CATALOGUE_TITLE);
  const [catalogueDescription, setCatalogueDescription] = useState("");
  const [catalogueCover, setCatalogueCover] = useState("");
  const [catalogueColor, setCatalogueColor] = useState(CATALOGUE_CARD_COLORS[0]);
  const [rows, setRows] = useState<VitrixCatalogueRow[]>([]);
  const [categories, setCategories] = useState<VitrixCatalogueCategoryRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VitrixCatalogueRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [cardMenuAnchor, setCardMenuAnchor] = useState<HTMLElement | null>(null);
  const [catalogueEditOpen, setCatalogueEditOpen] = useState(false);
  const [catalogueTitleDraft, setCatalogueTitleDraft] = useState(CATALOGUE_TITLE);
  const [catalogueDescriptionDraft, setCatalogueDescriptionDraft] = useState("");
  const [catalogueCoverDraft, setCatalogueCoverDraft] = useState("");
  const [catalogueColorDraft, setCatalogueColorDraft] = useState(CATALOGUE_CARD_COLORS[0]);
  const [catalogueDeleteOpen, setCatalogueDeleteOpen] = useState(false);
  const [deleteCatalogueContents, setDeleteCatalogueContents] = useState(false);
  const [deletingCatalogue, setDeletingCatalogue] = useState(false);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryDrafts, setCategoryDrafts] = useState<VitrixCatalogueCategoryRow[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryBusyId, setCategoryBusyId] = useState<string | null>(null);
  const [categoryBusyAction, setCategoryBusyAction] = useState<CategoryBusyAction>(null);

  const [showCollectionItems, setShowCollectionItems] = useState(false);
  const [collectionItemsSearch, setCollectionItemsSearch] = useState("");
  const [selectedCollectionItems, setSelectedCollectionItems] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState("");
  const [cropSrc, setCropSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [cropArea, setCropArea] = useState<Area | null>(null);

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"collection" | "catalogue">("collection");
  const [selectedMediaUrl, setSelectedMediaUrl] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<VitrixCatalogueRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("compact");
  const formIsCollection = form.item_type === "collection";
  const editingHeaderLabel = editing
    ? getCatalogueItemType(editing) === "collection"
      ? editing.title
      : `${editing.ref} - ${editing.title}`
    : "";

  const switchLanguage = (newLang: "it" | "en") => {
    if (newLang === form.lang) return;
    if (editing) {
      const sibling = rows.find((c) => c.ref === editing.ref && c.lang === newLang);
      if (sibling) {
        setEditing(sibling);
        setForm({
          ref: sibling.ref,
          title: sibling.title,
          description: sibling.description ?? "",
          category: sibling.category,
          item_type: getCatalogueItemType(sibling),
          img_position: sibling.img_position ?? "",
          lang: sibling.lang,
          status: sibling.status,
          sort_order: sibling.sort_order,
        });
        setFilePreview(sibling.img_path?.startsWith("http") ? sibling.img_path : "");
        return;
      }
    }
    setForm((prev) => ({ ...prev, lang: newLang }));
  };

  const rowsRef = useRef<VitrixCatalogueRow[]>([]);
  const dragRowId = useRef<number | null>(null);
  const dragStartedOrder = useRef<number[]>([]);
  const [draggingRowId, setDraggingRowId] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
  }, []);

  useEffect(() => {
    setCatalogueTitle(localStorage.getItem(CATALOGUE_TITLE_STORAGE_KEY) || CATALOGUE_TITLE);
    setCatalogueDescription(localStorage.getItem(CATALOGUE_DESCRIPTION_STORAGE_KEY) || "");
    setCatalogueCover(localStorage.getItem(CATALOGUE_COVER_STORAGE_KEY) || "");
    setCatalogueColor(localStorage.getItem(CATALOGUE_COLOR_STORAGE_KEY) || CATALOGUE_CARD_COLORS[0]);
  }, []);

  const fetchCatalogue = useCallback(async () => {
    setLoadingRows(true);
    try {
      const res = await fetch("/api/vitrix/site-catalogue");
      const json = await res.json();
      const sorted = (json.catalogue ?? []).sort((a: VitrixCatalogueRow, b: VitrixCatalogueRow) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.lang.localeCompare(b.lang);
      });
      setRows(sorted);
    } catch {
      showToast("error", "Errore caricamento collezioni");
    } finally {
      setLoadingRows(false);
    }
  }, [showToast]);

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/vitrix/site-catalogue/categories");
      const json = await res.json();
      setCategories((json.categories ?? []).sort((a: VitrixCatalogueCategoryRow, b: VitrixCatalogueCategoryRow) => a.sort_order - b.sort_order));
    } catch {
      showToast("error", "Errore caricamento categorie");
    } finally {
      setLoadingCategories(false);
    }
  }, [showToast]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchCatalogue(), fetchCategories()]);
  }, [fetchCatalogue, fetchCategories]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    if (loadingCategories) return;
    if (categories.length === 0) {
      if (selectedCategory) setSelectedCategory("");
      return;
    }
    if (!selectedCategory || !categories.some((category) => category.name === selectedCategory)) {
      setSelectedCategory(categories[0].name);
    }
  }, [categories, loadingCategories, selectedCategory]);

  const totalItems = rows.length;
  const publishedItems = rows.filter((row) => row.status === "published").length;
  const overviewIsDraft = publishedItems === 0 && totalItems > 0;
  const catalogueCreatedAt = rows
    .map((row) => row.created_at)
    .filter(Boolean)
    .sort()[0];
  const catalogueCreatedLabel = new Date(catalogueCreatedAt ?? Date.now()).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const filteredRows = rows.filter((row) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      row.title.toLowerCase().includes(q) ||
      row.ref.toLowerCase().includes(q) ||
      row.category.toLowerCase().includes(q);
    const matchesCategory = !selectedCategory || row.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const dragDisabled = search.trim().length > 0 || savingOrder;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setOriginalFile(file);
    setCropSrc(url);
    setCropOpen(true);
    e.target.value = "";
  };

  const openAdd = () => {
    const defaultCategory = selectedCategory || categories[0]?.name || "";
    setEditing(null);
    setForm(emptyForm(defaultCategory));
    setOriginalFile(null);
    setFilePreview("");
    setCropArea(null);
    setSelectedMediaUrl("");
    setSelectedCollectionItems([]);
    setShowCollectionItems(false);
    setDialogOpen(true);
  };

  const openEdit = (row: VitrixCatalogueRow) => {
    setEditing(row);
    setForm({
      ref: row.ref,
      title: row.title,
      description: row.description ?? "",
      category: row.category,
      item_type: getCatalogueItemType(row),
      img_position: row.img_position ?? "",
      lang: row.lang,
      status: row.status,
      sort_order: row.sort_order,
    });
    setOriginalFile(null);
    setFilePreview(row.img_path?.startsWith("http") ? row.img_path : "");
    setCropArea(null);
    setSelectedMediaUrl("");
    setShowCollectionItems(getCatalogueItemType(row) === "collection");
    const itemsInCollection = rows.filter((item) => (item.parent_id ?? item.parure_id) === row.id).map((item) => item.id);
    setSelectedCollectionItems(itemsInCollection);
    setDialogOpen(true);
  };

  const openCatalogueEdit = () => {
    setCardMenuAnchor(null);
    setCatalogueTitleDraft(catalogueTitle);
    setCatalogueDescriptionDraft(catalogueDescription);
    setCatalogueCoverDraft(catalogueCover);
    setCatalogueColorDraft(catalogueColor);
    setCatalogueEditOpen(true);
  };

  const saveCatalogueTitle = () => {
    const nextTitle = catalogueTitleDraft.trim() || CATALOGUE_TITLE;
    const nextDescription = catalogueDescriptionDraft.trim();
    const nextCover = catalogueCoverDraft.trim();
    const nextColor = catalogueColorDraft || CATALOGUE_CARD_COLORS[0];
    setCatalogueTitle(nextTitle);
    setCatalogueDescription(nextDescription);
    setCatalogueCover(nextCover);
    setCatalogueColor(nextColor);
    localStorage.setItem(CATALOGUE_TITLE_STORAGE_KEY, nextTitle);
    localStorage.setItem(CATALOGUE_DESCRIPTION_STORAGE_KEY, nextDescription);
    if (nextCover) {
      localStorage.setItem(CATALOGUE_COVER_STORAGE_KEY, nextCover);
    } else {
      localStorage.removeItem(CATALOGUE_COVER_STORAGE_KEY);
    }
    localStorage.setItem(CATALOGUE_COLOR_STORAGE_KEY, nextColor);
    setCatalogueEditOpen(false);
    showToast("success", "Catalogo aggiornato");
  };

  const openCatalogueDelete = () => {
    setCardMenuAnchor(null);
    setDeleteCatalogueContents(false);
    setCatalogueDeleteOpen(true);
  };

  const handleDeleteCatalogue = async () => {
    setDeletingCatalogue(true);
    try {
      if (deleteCatalogueContents) {
        const deleteRows = rows.map((row) =>
          fetch(`/api/vitrix/site-catalogue/${row.id}`, { method: "DELETE" }),
        );
        const rowResults = await Promise.all(deleteRows);
        const failedRow = rowResults.find((res) => !res.ok);
        if (failedRow) {
          const json = await failedRow.json().catch(() => ({}));
          showToast("error", typeof json.error === "string" ? json.error : "Errore eliminazione catalogo");
          return;
        }

        const deleteCategories = categories.map((category) =>
          fetch(`/api/vitrix/site-catalogue/categories/${category.id}`, { method: "DELETE" }),
        );
        const categoryResults = await Promise.all(deleteCategories);
        const failedCategory = categoryResults.find((res) => !res.ok);
        if (failedCategory) {
          const json = await failedCategory.json().catch(() => ({}));
          showToast("error", typeof json.error === "string" ? json.error : "Errore eliminazione categorie");
          return;
        }
      }

      localStorage.removeItem(CATALOGUE_TITLE_STORAGE_KEY);
      localStorage.removeItem(CATALOGUE_DESCRIPTION_STORAGE_KEY);
      localStorage.removeItem(CATALOGUE_COVER_STORAGE_KEY);
      localStorage.removeItem(CATALOGUE_COLOR_STORAGE_KEY);
      setCatalogueTitle(CATALOGUE_TITLE);
      setCatalogueDescription("");
      setCatalogueCover("");
      setCatalogueColor(CATALOGUE_CARD_COLORS[0]);
      setCatalogueDeleteOpen(false);
      showToast("success", deleteCatalogueContents ? "Catalogo e contenuti eliminati" : "Configurazione catalogo eliminata");
      await refreshAll();
    } finally {
      setDeletingCatalogue(false);
    }
  };

  const openCategoryDialog = () => {
    setCategoryDrafts(categories.map((category) => ({ ...category })));
    setNewCategoryName("");
    setCategoryDialogOpen(true);
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim().replace(/\s+/g, " ");
    if (!name) {
      showToast("error", "Il nome della categoria e obbligatorio");
      return;
    }

    setCategoryBusyAction("create");
    try {
      const res = await fetch("/api/vitrix/site-catalogue/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast("error", json.error ?? "Errore creazione categoria");
        return;
      }

      showToast("success", "Categoria creata");
      setNewCategoryName("");
      await refreshAll();
      if (dialogOpen && !form.category) {
        setForm((current) => ({ ...current, category: json.category?.name ?? name }));
      }
    } finally {
      setCategoryBusyAction(null);
    }
  };

  const handleRenameCategory = async (categoryId: string) => {
    const draft = categoryDrafts.find((item) => item.id === categoryId);
    const original = categories.find((item) => item.id === categoryId);
    if (!draft || !original) return;

    const nextName = draft.name.trim().replace(/\s+/g, " ");
    if (!nextName) {
      showToast("error", "Il nome della categoria e obbligatorio");
      return;
    }
    if (nextName === original.name) return;

    setCategoryBusyId(categoryId);
    setCategoryBusyAction("save");
    try {
      const res = await fetch(`/api/vitrix/site-catalogue/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast("error", json.error ?? "Errore aggiornamento categoria");
        return;
      }

      showToast("success", "Categoria aggiornata");
      if (selectedCategory === original.name) {
        setSelectedCategory(nextName);
      }
      await refreshAll();
    } finally {
      setCategoryBusyId(null);
      setCategoryBusyAction(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const original = categories.find((item) => item.id === categoryId);
    if (!original) return;

    setCategoryBusyId(categoryId);
    setCategoryBusyAction("delete");
    try {
      const res = await fetch(`/api/vitrix/site-catalogue/categories/${categoryId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        showToast("error", json.error ?? "Errore eliminazione categoria");
        return;
      }

      showToast("success", "Categoria eliminata");
      if (selectedCategory === original.name) {
        setSelectedCategory("");
      }
      await refreshAll();
      setCategoryDrafts((current) => current.filter((item) => item.id !== categoryId));
    } finally {
      setCategoryBusyId(null);
      setCategoryBusyAction(null);
    }
  };

  const handleMoveCategory = async (categoryId: string, direction: -1 | 1) => {
    const source = categoryDrafts.length > 0 ? categoryDrafts : categories;
    const index = source.findIndex((item) => item.id === categoryId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= source.length) return;

    const next = [...source];
    [next[index], next[target]] = [next[target], next[index]];
    setCategoryDrafts(next);
    setCategoryBusyId(categoryId);
    setCategoryBusyAction("reorder");
    try {
      const res = await fetch("/api/vitrix/site-catalogue/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: next.map((item, position) => ({ id: item.id, sort_order: position + 1 })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast("error", json.error ?? "Errore riordino categorie");
        await refreshAll();
        return;
      }

      showToast("success", "Ordine categorie aggiornato");
      await refreshAll();
    } finally {
      setCategoryBusyId(null);
      setCategoryBusyAction(null);
    }
  };

  const handleSave = async () => {
    const refValue = formIsCollection ? form.title.trim() : form.ref.trim();
    const categoryValue = form.category.trim() || (formIsCollection ? "Collection" : "");

    if (!refValue || !form.title.trim() || !categoryValue) {
      showToast("error", formIsCollection ? "Titolo obbligatorio" : "Ref, titolo e categoria sono obbligatori");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("ref", refValue);
      fd.append("title", form.title.trim());
      fd.append("description", form.description);
      fd.append("category", categoryValue);
      fd.append("img_position", form.img_position);
      fd.append("lang", form.lang);
      fd.append("status", form.status);
      fd.append("sort_order", String(form.sort_order));
      fd.append("item_type", form.item_type);

      if (formIsCollection && selectedCollectionItems.length > 0) {
        fd.append("collection_items", JSON.stringify(selectedCollectionItems));
      }

      if (originalFile) {
        fd.append("file", originalFile, originalFile.name);
        if (cropArea) {
          fd.append("crop_x", String(Math.round(cropArea.x)));
          fd.append("crop_y", String(Math.round(cropArea.y)));
          fd.append("crop_width", String(Math.round(cropArea.width)));
          fd.append("crop_height", String(Math.round(cropArea.height)));
        }
      } else if (selectedMediaUrl) {
        fd.append("img_url", selectedMediaUrl);
      }

      const url = editing ? `/api/vitrix/site-catalogue/${editing.id}` : "/api/vitrix/site-catalogue";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, body: fd });
      const json = await res.json();

      if (!res.ok) {
        showToast("error", json.error ?? "Errore salvataggio");
        return;
      }

      showToast("success", editing ? "Elemento aggiornato" : "Elemento creato");
      setDialogOpen(false);
      await refreshAll();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/vitrix/site-catalogue/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        showToast("error", json.error ?? "Errore eliminazione");
        return;
      }
      showToast("success", "Collezione eliminata");
      setDeleteTarget(null);
      await fetchCatalogue();
    } finally {
      setDeleting(false);
    }
  };

  const handlePublish = async (row: VitrixCatalogueRow) => {
    const fd = new FormData();
    fd.append("status", "published");

    const res = await fetch(`/api/vitrix/site-catalogue/${row.id}`, {
      method: "PATCH",
      body: fd,
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      showToast("error", typeof json.error === "string" ? json.error : "Errore pubblicazione");
      return;
    }

    showToast("success", "Elemento pubblicato");
    await fetchCatalogue();
  };

  const handleSaveOrder = async (orderedRows: VitrixCatalogueRow[]) => {
    setSavingOrder(true);
    try {
      const res = await fetch("/api/vitrix/site-catalogue/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderedRows.map((row, index) => ({ id: row.id, sort_order: index + 1 })),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        showToast("error", json.error ?? "Errore salvataggio ordine");
        await fetchCatalogue();
        return;
      }

      showToast("success", "Ordine collezioni aggiornato");
      await fetchCatalogue();
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>, rowId: number) => {
    if (dragDisabled) {
      event.preventDefault();
      return;
    }

    dragRowId.current = rowId;
    dragStartedOrder.current = rowsRef.current.map((row) => row.id);
    setDraggingRowId(rowId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(rowId));
  };

  const handleDragOver = (event: React.DragEvent<HTMLTableRowElement>, targetRowId: number) => {
    event.preventDefault();
    const sourceRowId = dragRowId.current;
    if (sourceRowId === null || sourceRowId === targetRowId || dragDisabled) return;

    const currentRows = rowsRef.current;
    const from = currentRows.findIndex((row) => row.id === sourceRowId);
    const to = currentRows.findIndex((row) => row.id === targetRowId);
    if (from < 0 || to < 0) return;

    const nextRows = [...currentRows];
    const [moved] = nextRows.splice(from, 1);
    nextRows.splice(to, 0, moved);
    rowsRef.current = nextRows;
    setRows(nextRows);
  };

  const handleDragEnd = () => {
    const sourceRowId = dragRowId.current;
    dragRowId.current = null;
    setDraggingRowId(null);

    if (sourceRowId === null || dragDisabled) return;

    const currentOrder = rowsRef.current.map((row) => row.id);
    const changed = currentOrder.some((id, index) => id !== dragStartedOrder.current[index]);
    dragStartedOrder.current = [];

    if (changed) {
      void handleSaveOrder(rowsRef.current);
    }
  };

  const renderOverview = () => {
    if (loadingRows || loadingCategories) {
      return (
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 3 }}>
            <Skeleton variant="text" width={220} height={40} />
            <Skeleton variant="rounded" width={140} height={36} />
          </Box>
          <Card
            sx={{
              width: 356,
              maxWidth: "100%",
              borderRadius: "12px",
              border: "1px solid rgba(15,23,42,0.08)",
              boxShadow: "0 1px 3px rgba(15,23,42,0.16)",
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, py: 1.75, pr: 6 }}>
              <Box sx={{ minWidth: 0, width: "100%" }}>
                <Skeleton variant="text" width={180} height={26} />
                <Skeleton variant="text" width={120} />
                <Box sx={{ mt: 0.75 }}>
                  <Skeleton variant="rounded" width={80} height={22} />
                </Box>
              </Box>
            </Box>
            <Skeleton variant="rectangular" width="100%" height={164} />
            <Box sx={{ px: 2, py: 2 }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Skeleton variant="rounded" width={90} height={22} />
                <Skeleton variant="rounded" width={70} height={22} />
              </Box>
            </Box>
          </Card>
        </Box>
      );
    }

    return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 3 }}>
        <Typography sx={{ fontSize: 28, fontWeight: 700, color: "var(--vx-text-primary)", lineHeight: 1.1 }}>
          {catalogueTitle}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{
            textTransform: "none",
            bgcolor: "var(--vx-primary)",
            "&:hover": { bgcolor: "var(--vx-primary-dark)" },
            borderRadius: "8px",
          }}
        >
          Crea catalogo
        </Button>
      </Box>

      <Card
        sx={{
          width: 356,
          maxWidth: "100%",
          borderRadius: "12px",
          border: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 1px 3px rgba(15,23,42,0.16)",
          overflow: "hidden",
          cursor: "pointer",
          bgcolor: "#fff",
          transition: "box-shadow 0.3s ease, transform 0.3s ease",
          "&:hover": {
            boxShadow: "0 12px 40px rgba(15,23,42,0.14)",
            transform: "translateY(-3px)",
          },
        }}
      >
        <Box sx={{ position: "relative" }}>
          <CardActionArea
            onClick={() => setView("detail")}
            sx={{
              display: "block",
              height: "100%",
              "&:hover .cover-image": { transform: "scale(1.06)" },
              "&:hover .card-enter-indicator": { opacity: 1, right: 16 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, py: 1.75, pr: 6 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 19,
                    fontWeight: 800,
                    color: "#111827",
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {catalogueTitle}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#4B5563", lineHeight: 1.35 }}>
                  Creato il {catalogueCreatedLabel}
                </Typography>
                <Box sx={{ mt: 0.75 }}>
                  <StatusBadge status={publishedItems > 0 ? "published" : "draft"} />
                </Box>
              </Box>
            </Box>
            <Box
              className="cover-image"
              sx={{
                height: 164,
                bgcolor: catalogueColor,
                backgroundImage: catalogueCover
                  ? `url("${catalogueCover.replace(/"/g, "%22")}")`
                  : `linear-gradient(135deg, ${catalogueColor}, rgba(255,255,255,0.16))`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transition: "transform 0.45s ease",
              }}
            />
            <Box sx={{ px: 2, py: 2 }}>
              {catalogueDescription && (
                <Typography sx={{ fontSize: 13, color: "#6B7280", lineHeight: 1.45, mb: 1 }}>
                  {catalogueDescription}
                </Typography>
              )}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Chip
                    label={`${publishedItems} pubblicati`}
                    size="small"
                    sx={{
                      height: 22,
                      borderRadius: "6px",
                      bgcolor: "rgba(46,125,50,0.1)",
                      color: "#2E7D32",
                      fontSize: 11,
                      fontWeight: 700,
                      "& .MuiChip-label": { px: 0.75 },
                    }}
                  />
                  {totalItems - publishedItems > 0 && (
                    <Chip
                      label={`${totalItems - publishedItems} bozze`}
                      size="small"
                      sx={{
                        height: 22,
                        borderRadius: "6px",
                        bgcolor: "rgba(237,108,2,0.1)",
                        color: "#B45309",
                        fontSize: 11,
                        fontWeight: 700,
                        "& .MuiChip-label": { px: 0.75 },
                      }}
                    />
                  )}
                </Box>
                <ArrowForwardIosIcon
                  className="card-enter-indicator"
                  sx={{
                    fontSize: 13,
                    color: "var(--vx-primary)",
                    opacity: 0,
                    transition: "opacity 0.25s ease, right 0.25s ease",
                    position: "relative",
                    right: 8,
                  }}
                />
              </Box>
            </Box>
          </CardActionArea>
          <IconButton
            aria-label="settings"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setCardMenuAnchor(event.currentTarget);
            }}
            sx={{
              position: "absolute",
              top: 12,
              right: 8,
              zIndex: 2,
              color: "#6B7280",
              bgcolor: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(4px)",
              width: 30,
              height: 30,
              transition: "background-color 0.2s ease, color 0.2s ease",
              "&:hover": {
                bgcolor: "var(--vx-primary)",
                color: "#fff",
              },
            }}
          >
            <MoreVertIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Box>
      </Card>
      <Menu
        anchorEl={cardMenuAnchor}
        open={Boolean(cardMenuAnchor)}
        onClose={() => setCardMenuAnchor(null)}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 180,
              bgcolor: "var(--vx-surface)",
              color: "var(--vx-text-primary)",
              border: "1px solid var(--vx-border)",
              boxShadow: "0 20px 44px rgba(15,23,42,0.16)",
            },
          },
        }}
      >
        <MenuItem
          onClick={openCatalogueEdit}
        >
          Modifica
        </MenuItem>
        <MenuItem
          onClick={openCatalogueDelete}
        >
          {overviewIsDraft ? "Rimuovi bozza" : "Elimina"}
        </MenuItem>
      </Menu>
    </Box>
    );
  };

  const renderDetail = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{
            textTransform: "none",
            bgcolor: "var(--vx-primary)",
            "&:hover": { bgcolor: "var(--vx-primary-dark)" },
            borderRadius: "8px",
          }}
        >
          Crea catalogo
        </Button>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => setView("overview")}
          sx={{
            textTransform: "none",
            color: "var(--vx-text-secondary)",
            borderRadius: "8px",
            "&:hover": { bgcolor: "var(--vx-surface-muted)" },
          }}
        >
          Cataloghi
        </Button>
        <Box sx={{ textAlign: "right" }}>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: "var(--vx-text-primary)" }}>
            {catalogueTitle}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "var(--vx-text-muted)" }}>
            {rows.length} elementi, {categories.length} categorie
          </Typography>
        </Box>
      </Box>

      <Stack component="div" direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2, alignItems: { md: "center" } }}>
        <TextField
          placeholder="Cerca per titolo, ref o categoria..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: "var(--vx-text-muted)" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ ...fieldSx, flex: 1, maxWidth: 360 }}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<CategoryOutlinedIcon />}
          onClick={openCategoryDialog}
          sx={{
            borderColor: "var(--vx-border)",
            color: "var(--vx-text-secondary)",
            borderRadius: "8px",
            textTransform: "none",
          }}
        >
          Categorie
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{
            bgcolor: "var(--vx-primary)",
            "&:hover": { bgcolor: "var(--vx-primary-dark)" },
            borderRadius: "8px",
            textTransform: "none",
          }}
        >
          Nuova collezione
        </Button>
      </Stack>

      {loadingRows || loadingCategories ? (
        <AdminLoadingBoundary label="Carico collezioni" minHeight={340} framed />
      ) : categories.length === 0 ? (
        <Box
          sx={{
            mt: 2,
            p: 4,
            borderRadius: 3,
            border: "1px dashed var(--vx-border)",
            bgcolor: "var(--vx-surface)",
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "var(--vx-text-primary)" }}>
            Nessuna categoria ancora presente
          </Typography>
          <Typography sx={{ fontSize: 13, color: "var(--vx-text-muted)", mt: 1 }}>
            Crea prima le categorie, poi aggiungi le immagini dentro ciascun tab.
          </Typography>
          <Button
            variant="contained"
            startIcon={<CategoryOutlinedIcon />}
            onClick={openCategoryDialog}
            sx={{
              mt: 2,
              bgcolor: "var(--vx-primary)",
              "&:hover": { bgcolor: "var(--vx-primary-dark)" },
              borderRadius: "8px",
              textTransform: "none",
            }}
          >
            Crea categoria
          </Button>
        </Box>
      ) : (
        <>
          <Tabs
            value={selectedCategory || categories[0]?.name || ""}
            onChange={(_, value) => setSelectedCategory(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 2,
              minHeight: 42,
              "& .MuiTab-root": {
                minHeight: 42,
                textTransform: "none",
                fontWeight: 600,
                color: "var(--vx-text-secondary)",
              },
              "& .Mui-selected": { color: "var(--vx-primary) !important" },
              "& .MuiTabs-indicator": { backgroundColor: "var(--vx-primary)" },
            }}
          >
            {categories.map((category) => (
              <Tab
                key={category.id}
                value={category.name}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span>{category.name}</span>
                    <Chip
                      label={category.item_count ?? 0}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 10,
                        bgcolor: "var(--vx-primary-soft)",
                        color: "var(--vx-primary)",
                        "& .MuiChip-label": { px: 0.75 },
                      }}
                    />
                  </Box>
                }
              />
            ))}
          </Tabs>

          {filteredRows.length === 0 ? (
            <Typography sx={{ color: "var(--vx-text-muted)", textAlign: "center", py: 6, fontSize: 14 }}>
              {search
                ? "Nessun risultato."
                : "Nessuna collezione in questa categoria. Creane una con il pulsante in alto."}
            </Typography>
          ) : (
            <TableContainer
              sx={{
                bgcolor: "var(--vx-surface)",
                borderRadius: 2,
                border: "1px solid var(--vx-border)",
                boxShadow: "0 12px 32px rgba(15,23,42,0.08)",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      "& th": {
                        color: "var(--vx-text-muted)",
                        fontSize: 12,
                        fontWeight: 700,
                        borderColor: "var(--vx-border)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        py: 1.15,
                      },
                    }}
                  >
                    <TableCell>Ref</TableCell>
                    <TableCell>Titolo</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell align="center">Lingua</TableCell>
                    <TableCell>Stato</TableCell>
                    <TableCell align="right">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingRows ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skel-${i}`}>
                        <TableCell><Skeleton variant="text" width={70} /></TableCell>
                        <TableCell>
                          <Stack component="div" direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                            <Skeleton variant="rounded" width={38} height={48} />
                            <Box>
                              <Skeleton variant="text" width={180} />
                              <Skeleton variant="text" width={260} />
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell><Skeleton variant="rounded" width={80} height={24} /></TableCell>
                        <TableCell><Skeleton variant="rounded" width={70} height={24} /></TableCell>
                        <TableCell align="center"><Skeleton variant="circular" width={28} height={22} /></TableCell>
                        <TableCell><Skeleton variant="rounded" width={60} height={24} /></TableCell>
                        <TableCell align="right">
                          <Stack component="div" direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                            <Skeleton variant="circular" width={28} height={28} />
                            <Skeleton variant="circular" width={28} height={28} />
                            <Skeleton variant="circular" width={28} height={28} />
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: "center", py: 6, color: "var(--vx-text-muted)", fontStyle: "italic" }}>
                        Nessuna collezione trovata.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      onDragOver={(event) => handleDragOver(event, row.id)}
                      sx={{
                        opacity: draggingRowId === row.id ? 0.48 : 1,
                        transition: "background-color 120ms ease, opacity 120ms ease",
                        "& td": cellSx,
                        cursor: "default",
                      }}
                    >
                      <TableCell sx={{ ...cellSx, fontFamily: "monospace", color: "var(--vx-text-muted) !important", fontWeight: 700 }}>
                        {row.ref}
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <Stack component="div" direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                          {row.img_path?.startsWith("http") && (
                            <Box
                              component="img"
                              src={row.img_path}
                              alt={row.title}
                              sx={{
                                width: 38,
                                height: 48,
                                objectFit: "cover",
                                borderRadius: "8px",
                                flexShrink: 0,
                                border: "1px solid var(--vx-border)",
                                bgcolor: "var(--vx-surface-muted)",
                              }}
                            />
                          )}
                          <Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--vx-text-primary)" }}>
                              {row.title}
                            </Typography>
                            {row.description && (
                              <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>
                                {row.description}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <Chip
                          label={getCatalogueItemType(row) === "collection" ? "Collection" : "Articolo"}
                          size="small"
                          sx={{
                            height: 24,
                            borderRadius: "12px",
                            bgcolor: getCatalogueItemType(row) === "collection" ? "rgba(37,99,235,0.12)" : "rgba(15,118,110,0.12)",
                            color: getCatalogueItemType(row) === "collection" ? "#2563EB" : "#0F766E",
                            fontSize: 11,
                            fontWeight: 700,
                            "& .MuiChip-label": { px: 1 },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <CategoryBadge category={row.category} />
                      </TableCell>
                      <TableCell align="center" sx={cellSx}>
                        <LanguageFlag lang={row.lang} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell align="right" sx={cellSx}>
                        <Stack component="div" direction="row" spacing={0.5} sx={{ justifyContent: "flex-end", alignItems: "center" }}>
                          <Tooltip title={dragDisabled ? "Rimuovi la ricerca per riordinare" : "Trascina per riordinare"}>
                            <span>
                              <IconButton
                                size="small"
                                draggable={!dragDisabled}
                                disabled={dragDisabled}
                                onDragStart={(event) => handleDragStart(event, row.id)}
                                onDragEnd={handleDragEnd}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  cursor: dragDisabled ? "not-allowed" : "grab",
                                  color: "var(--vx-text-muted)",
                                  "&:hover": { bgcolor: "var(--vx-surface-muted)", color: "var(--vx-text-primary)" },
                                  "&:active": { cursor: "grabbing" },
                                }}
                              >
                                <DragIndicatorIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Modifica">
                            <IconButton
                              size="small"
                              onClick={() => openEdit(row)}
                              sx={{ color: "var(--vx-text-muted)", "&:hover": { color: "var(--vx-primary)" } }}
                            >
                              <EditOutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                      {row.status === "draft" && (
                        <Tooltip title="Pubblica">
                          <IconButton
                            size="small"
                            onClick={() => void handlePublish(row)}
                            sx={{ color: "var(--vx-text-muted)", "&:hover": { color: "#2E7D32" } }}
                          >
                            <CheckCircleOutlinedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={row.status === "draft" ? "Rimuovi bozza" : "Elimina"}>
                            <IconButton
                              size="small"
                              onClick={() => setDeleteTarget(row)}
                              sx={{ color: "var(--vx-text-muted)", "&:hover": { color: "#d32f2f" } }}
                            >
                              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );

  return (
    <>
      {view === "overview" ? renderOverview() : renderDetail()}

      <Dialog
        open={catalogueEditOpen}
        onClose={() => setCatalogueEditOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          backdrop: { sx: { backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" } },
          paper: { sx: dialogPaperSx },
        }}
      >
        <DialogTitle sx={dialogHeaderSx}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              bgcolor: "var(--vx-primary-soft)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <EditOutlinedIcon sx={{ fontSize: 16, color: "var(--vx-primary)" }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: "var(--vx-text-primary)", lineHeight: 1.2 }}>
              Modifica catalogo
            </Typography>
            <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>
              Aggiorna contenuti, copertina e impostazioni del catalogo.
            </Typography>
          </Box>
          <IconButton
            aria-label="Chiudi"
            onClick={() => setCatalogueEditOpen(false)}
            size="small"
            sx={{ ml: "auto", color: "var(--vx-text-muted)", "&:hover": { bgcolor: "var(--vx-surface-muted)" } }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.45fr 1fr" }, gap: 3, alignItems: "start" }}>
            {/* ── COLONNA SINISTRA — form ───────────────────────────── */}
            <Box sx={{ display: "grid", gap: 2.25 }}>
              <TextField
                label="Nome catalogo"
                value={catalogueTitleDraft}
                onChange={(event) => setCatalogueTitleDraft(event.target.value)}
                size="small"
                fullWidth
                sx={fieldSx}
                autoFocus
              />
              <TextField
                label="Descrizione"
                value={catalogueDescriptionDraft}
                onChange={(event) => setCatalogueDescriptionDraft(event.target.value.slice(0, 300))}
                size="small"
                fullWidth
                sx={fieldSx}
                multiline
                minRows={2}
                placeholder="Breve descrizione del catalogo (usata come hero nella pagina interna)"
                helperText={`${catalogueDescriptionDraft.length}/300`}
                slotProps={{
                  htmlInput: { maxLength: 300 },
                  formHelperText: { sx: { textAlign: "right", color: "var(--vx-text-muted)", fontSize: 11, mt: 0.5 } },
                }}
              />
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--vx-text-muted)", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Immagine di copertina
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
                  {catalogueCoverDraft ? (
                    <Box
                      component="img"
                      src={catalogueCoverDraft}
                      alt="cover preview"
                      sx={{ width: 56, height: 56, borderRadius: "8px", objectFit: "cover", border: "1px solid var(--vx-border)", flexShrink: 0 }}
                    />
                  ) : (
                    <Box sx={{ width: 56, height: 56, borderRadius: "8px", bgcolor: "var(--vx-surface-muted)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <ImageOutlinedIcon sx={{ color: "var(--vx-text-muted)", fontSize: 22 }} />
                    </Box>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PhotoLibraryOutlinedIcon sx={{ fontSize: 15 }} />}
                    onClick={() => {
                      setMediaPickerTarget("catalogue");
                      setMediaPickerOpen(true);
                    }}
                    sx={{
                      textTransform: "none",
                      borderColor: "var(--vx-border)",
                      color: "var(--vx-text-secondary)",
                      borderRadius: "8px",
                      fontSize: 13,
                      "&:hover": {
                        borderColor: "var(--vx-primary)",
                        color: "var(--vx-primary)",
                        bgcolor: "var(--vx-primary-soft)",
                      },
                    }}
                  >
                    {catalogueCoverDraft ? "Cambia" : "Scegli da libreria"}
                  </Button>
                  {catalogueCoverDraft && (
                    <IconButton size="small" onClick={() => setCatalogueCoverDraft("")} sx={{ color: "var(--vx-text-muted)" }}>
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>
                <TextField
                  label="oppure incolla URL immagine"
                  value={catalogueCoverDraft}
                  onChange={(event) => setCatalogueCoverDraft(event.target.value)}
                  size="small"
                  fullWidth
                  sx={fieldSx}
                  helperText="Usato come cover della card e come hero della pagina interna del catalogo."
                  slotProps={{ formHelperText: { sx: { color: "var(--vx-text-muted)", fontSize: 11, mt: 0.5 } } }}
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--vx-text-muted)", mb: 1, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Colore card
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {CATALOGUE_CARD_COLORS.map((color) => (
                    <IconButton
                      key={color}
                      aria-label={`Seleziona colore ${color}`}
                      onClick={() => setCatalogueColorDraft(color)}
                      sx={{
                        width: 30,
                        height: 30,
                        bgcolor: color,
                        border: catalogueColorDraft === color ? "3px solid var(--vx-text-primary)" : "1px solid var(--vx-border)",
                        "&:hover": { bgcolor: color, filter: "brightness(0.95)" },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>

            {/* ── COLONNA DESTRA — anteprima live + info ─────────────── */}
            <Box sx={{ display: "grid", gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--vx-text-muted)", mb: 1, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Anteprima
                </Typography>
                <Box
                  sx={{
                    borderRadius: "14px",
                    border: "1px solid var(--vx-border)",
                    overflow: "hidden",
                    bgcolor: "var(--vx-surface, #fff)",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
                  }}
                >
                  <Box sx={{ position: "relative", aspectRatio: "16 / 9", bgcolor: "var(--vx-surface-muted)" }}>
                    {catalogueCoverDraft ? (
                      <Box component="img" src={catalogueCoverDraft} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <Box sx={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
                        <ImageOutlinedIcon sx={{ color: "var(--vx-text-muted)", fontSize: 28 }} />
                      </Box>
                    )}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        bgcolor: catalogueColorDraft,
                        border: "2px solid #fff",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                      }}
                    />
                  </Box>
                  <Box sx={{ p: 1.75 }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: "var(--vx-text-primary)", lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {catalogueTitleDraft.trim() || CATALOGUE_TITLE}
                    </Typography>
                    {catalogueDescriptionDraft.trim() && (
                      <Typography sx={{ fontSize: 12.5, color: "var(--vx-text-secondary)", mt: 0.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {catalogueDescriptionDraft.trim()}
                      </Typography>
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1.25, color: "var(--vx-success, #16A34A)" }}>
                      <CheckCircleOutlinedIcon sx={{ fontSize: 15 }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{publishedItems} pubblicati</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Info catalogo */}
              <Box sx={{ borderRadius: "10px", border: "1px solid var(--vx-border)", p: 1.5, display: "grid", gap: 1 }}>
                {([
                  { icon: <LayersOutlinedIcon sx={{ fontSize: 15, color: "var(--vx-text-muted)" }} />, label: "Schede totali", value: rows.length },
                  { icon: <CheckCircleOutlinedIcon sx={{ fontSize: 15, color: "var(--vx-text-muted)" }} />, label: "Pubblicate", value: publishedItems },
                  { icon: <CategoryOutlinedIcon sx={{ fontSize: 15, color: "var(--vx-text-muted)" }} />, label: "Categorie", value: categories.length },
                ] as const).map((info) => (
                  <Box key={info.label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {info.icon}
                    <Typography sx={{ fontSize: 12.5, color: "var(--vx-text-secondary)" }}>{info.label}</Typography>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "var(--vx-text-primary)", ml: "auto" }}>{info.value}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", borderRadius: "10px", bgcolor: "var(--vx-primary-soft)", p: 1.5 }}>
                <InfoOutlinedIcon sx={{ fontSize: 16, color: "var(--vx-primary)", mt: "1px", flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12, color: "var(--vx-text-secondary)", lineHeight: 1.5 }}>
                  Le modifiche saranno visibili sul sito solo dopo aver salvato.
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid var(--vx-border)", px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => setCatalogueEditOpen(false)}
            sx={{
              textTransform: "none",
              color: "var(--vx-text-muted)",
              borderRadius: "8px",
              "&:hover": { bgcolor: "var(--vx-surface-muted)" },
            }}
          >
            Annulla
          </Button>
          <Button
            variant="contained"
            onClick={saveCatalogueTitle}
            sx={{
              textTransform: "none",
              bgcolor: "var(--vx-primary)",
              "&:hover": { bgcolor: "var(--vx-primary-dark, #1565c0)" },
              borderRadius: "8px",
              fontWeight: 600,
            }}
          >
            Salva
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={catalogueDeleteOpen}
        onClose={() => !deletingCatalogue && setCatalogueDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          backdrop: { sx: { backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" } },
          paper: { sx: dialogPaperSx },
        }}
      >
        <DialogTitle sx={dialogHeaderSx}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              bgcolor: "rgba(211,47,47,0.1)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 16, color: "#d32f2f" }} />
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "var(--vx-text-primary)" }}>
            Elimina catalogo
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important" }}>
          <Alert severity="warning" sx={{ mb: 2, fontSize: 13 }}>
            Scegli se rimuovere solo la scheda del catalogo o anche tutti i contenuti collegati.
          </Alert>
          <Typography sx={{ fontSize: 14, color: "var(--vx-text-secondary)", lineHeight: 1.6 }}>
            Confermi l&apos;eliminazione di <strong style={{ color: "var(--vx-text-primary)" }}>{catalogueTitle}</strong>?
          </Typography>
          <FormControlLabel
            sx={{ mt: 2, alignItems: "flex-start" }}
            control={
              <Checkbox
                checked={deleteCatalogueContents}
                onChange={(event) => setDeleteCatalogueContents(event.target.checked)}
                disabled={deletingCatalogue}
                sx={{
                  color: "var(--vx-text-muted)",
                  "&.Mui-checked": { color: "#d32f2f" },
                }}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "var(--vx-text-primary)" }}>
                  Elimina anche immagini, elementi e categorie presenti
                </Typography>
                <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)", lineHeight: 1.5 }}>
                  Se non selezioni questa opzione, immagini, elementi e categorie rimangono salvati.
                </Typography>
              </Box>
            }
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid var(--vx-border)", px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => !deletingCatalogue && setCatalogueDeleteOpen(false)}
            disabled={deletingCatalogue}
            sx={{
              textTransform: "none",
              color: "var(--vx-text-muted)",
              borderRadius: "8px",
              "&:hover": { bgcolor: "var(--vx-surface-muted)" },
            }}
          >
            Annulla
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteCatalogue}
            disabled={deletingCatalogue}
            sx={{ textTransform: "none", borderRadius: "8px", minWidth: 100, fontWeight: 600 }}
          >
            {deletingCatalogue ? <CircularProgress size={15} sx={{ color: "#fff" }} /> : "Elimina"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        slotProps={{
          backdrop: { sx: { backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" } },
          paper: { sx: { ...dialogPaperSx, maxHeight: "calc(100vh - 64px)" } },
        }}
      >
        <DialogTitle sx={{ ...dialogHeaderSx, pr: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              bgcolor: "var(--vx-primary-soft)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {editing ? (
              <EditOutlinedIcon sx={{ fontSize: 16, color: "var(--vx-primary)" }} />
            ) : (
              <AddIcon sx={{ fontSize: 16, color: "var(--vx-primary)" }} />
            )}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: "var(--vx-text-primary)", lineHeight: 1.2 }}>
              {editing ? "Modifica elemento catalogo" : "Nuovo elemento catalogo"}
            </Typography>
            {editing && (
              <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)", mt: 0.25 }}>
                {editingHeaderLabel}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={() => switchLanguage(form.lang === "it" ? "en" : "it")}
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid var(--vx-border)",
              bgcolor: "rgba(255,255,255,0.6)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
            }}
            aria-label={form.lang === "it" ? "Switch to English" : "Passa all'italiano"}
          >
            {form.lang === "it" ? <ItalianFlag width={18} height={13} /> : <UKFlag width={18} height={13} />}
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: "20px !important", pb: 1 }}>
          <Grid container spacing={3}>
            {/* Sinistra: form */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack component="div" spacing={2}>
                <TextField
                  select
                  label="Tipo"
                  value={form.item_type}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      item_type: e.target.value as "collection" | "item",
                    }))
                  }
                  size="small"
                  fullWidth
                  sx={fieldSx}
                >
                  <MenuItem value="collection">Collection</MenuItem>
                  <MenuItem value="item">Articolo</MenuItem>
                </TextField>

                <Box sx={{ display: "grid", gridTemplateColumns: formIsCollection ? "1fr" : "1fr 1fr", gap: 2 }}>
                  {!formIsCollection && (
                    <TextField
                      label="Ref (es. N 016)"
                      value={form.ref}
                      onChange={(e) => setForm((current) => ({ ...current, ref: e.target.value }))}
                      size="small"
                      fullWidth
                      sx={fieldSx}
                    />
                  )}
                  <TextField
                    label="Titolo"
                    value={form.title}
                    onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                    size="small"
                    fullWidth
                    sx={fieldSx}
                  />
                </Box>

                <TextField
                  label="Descrizione"
                  value={form.description}
                  onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                  size="small"
                  fullWidth
                  sx={fieldSx}
                  multiline
                  minRows={2}
                />

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <Autocomplete
                    freeSolo
                    options={categories.map((category) => category.name)}
                    value={form.category}
                    onChange={(_, value) =>
                      setForm((current) => ({
                        ...current,
                        category: typeof value === "string" ? value : value ?? "",
                      }))
                    }
                    onInputChange={(_, value) =>
                      setForm((current) => ({
                        ...current,
                        category: value,
                      }))
                    }
                    renderInput={(params) => (
                      <TextField {...params} label={formIsCollection ? "Categoria / label" : "Categoria"} size="small" fullWidth sx={fieldSx} />
                    )}
                  />
                  <TextField
                    select
                    label="Stato"
                    value={form.status}
                    onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as "draft" | "published" }))}
                    size="small"
                    fullWidth
                    sx={fieldSx}
                  >
                    <MenuItem value="draft">Bozza</MenuItem>
                    <MenuItem value="published">Pubblicato</MenuItem>
                  </TextField>
                </Box>

                {formIsCollection && (
                  <Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setShowCollectionItems(!showCollectionItems)}
                      sx={{
                        borderColor: "var(--vx-border)",
                        color: "var(--vx-text-secondary)",
                        borderRadius: "8px",
                        textTransform: "none",
                        width: "100%",
                      }}
                    >
                      {showCollectionItems ? "Nascondi articoli" : "Seleziona articoli della Collection"} ({selectedCollectionItems.length})
                    </Button>
                    {showCollectionItems && (
                      <Box sx={{ mt: 2, p: 2, border: "1px solid var(--vx-border)", borderRadius: "8px", bgcolor: "var(--vx-surface)" }}>
                        <TextField
                          placeholder="Cerca per titolo, ref o categoria..."
                          size="small"
                          value={collectionItemsSearch}
                          onChange={(e) => setCollectionItemsSearch(e.target.value)}
                          fullWidth
                          sx={{ ...fieldSx, mb: 2 }}
                        />
                        <Stack component="div" spacing={1} sx={{ maxHeight: 260, overflowY: "auto" }}>
                          {rows
                            .filter(
                              (item) =>
                                getCatalogueItemType(item) === "item" &&
                                item.id !== editing?.id &&
                                (!collectionItemsSearch.trim() ||
                                  item.title.toLowerCase().includes(collectionItemsSearch.toLowerCase()) ||
                                  item.ref.toLowerCase().includes(collectionItemsSearch.toLowerCase()) ||
                                  item.category.toLowerCase().includes(collectionItemsSearch.toLowerCase()))
                            )
                            .map((item) => (
                              <Box
                                key={item.id}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  p: 1.5,
                                  border: "1px solid var(--vx-border)",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  bgcolor: selectedCollectionItems.includes(item.id) ? "var(--vx-primary-soft)" : "transparent",
                                  "&:hover": { bgcolor: "var(--vx-surface-muted)" },
                                }}
                                onClick={() => {
                                  setSelectedCollectionItems((current) =>
                                    current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]
                                  );
                                }}
                              >
                                <Checkbox
                                  checked={selectedCollectionItems.includes(item.id)}
                                  onChange={() => {
                                    setSelectedCollectionItems((current) =>
                                      current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]
                                    );
                                  }}
                                  sx={{ color: "var(--vx-text-muted)", "&.Mui-checked": { color: "var(--vx-primary)" } }}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--vx-text-primary)" }}>
                                    {item.title}
                                  </Typography>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                    <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>
                                      {item.ref}
                                    </Typography>
                                    <CategoryBadge category={item.category} />
                                  </Box>
                                </Box>
                                {item.img_path?.startsWith("http") && (
                                  <Box
                                    component="img"
                                    src={item.img_path}
                                    alt={item.title}
                                    sx={{ width: 48, height: 48, borderRadius: "6px", objectFit: "cover", flexShrink: 0 }}
                                  />
                                )}
                              </Box>
                            ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                )}

                <TextField
                  label="Posizione immagine (es. 70% 80%)"
                  value={form.img_position}
                  onChange={(e) => setForm((current) => ({ ...current, img_position: e.target.value }))}
                  size="small"
                  fullWidth
                  sx={fieldSx}
                  helperText="CSS object-position: x% y%. Lascia vuoto per center."
                  slotProps={{
                    formHelperText: {
                      sx: { color: "var(--vx-text-muted)", fontSize: 11, mt: 0.5 },
                    },
                  }}
                />

                <Divider sx={{ borderColor: "var(--vx-border)", my: 0.5 }} />

                <Box>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--vx-text-muted)",
                      mb: 1.5,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Immagine di copertina
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ImageOutlinedIcon sx={{ fontSize: 15 }} />}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        textTransform: "none",
                        borderColor: "var(--vx-border)",
                        color: "var(--vx-text-secondary)",
                        borderRadius: "8px",
                        fontSize: 13,
                        "&:hover": {
                          borderColor: "var(--vx-primary)",
                          color: "var(--vx-primary)",
                          bgcolor: "var(--vx-primary-soft)",
                        },
                      }}
                    >
                      {filePreview ? "Cambia immagine" : "Carica immagine"}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PhotoLibraryOutlinedIcon sx={{ fontSize: 15 }} />}
                      onClick={() => {
                        setMediaPickerTarget("collection");
                        setMediaPickerOpen(true);
                      }}
                      sx={{
                        textTransform: "none",
                        borderColor: "var(--vx-border)",
                        color: "var(--vx-text-secondary)",
                        borderRadius: "8px",
                        fontSize: 13,
                        "&:hover": {
                          borderColor: "var(--vx-primary)",
                          color: "var(--vx-primary)",
                          bgcolor: "var(--vx-primary-soft)",
                        },
                      }}
                    >
                      Scegli da libreria
                    </Button>
                    {filePreview ? (
                      <Box
                        component="img"
                        src={filePreview}
                        alt="preview"
                        sx={{
                          height: 56,
                          width: 42,
                          borderRadius: "6px",
                          border: "1px solid var(--vx-border)",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>
                        JPG / PNG / WebP - max 10 MB
                      </Typography>
                    )}
                  </Box>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                </Box>
              </Stack>
            </Grid>

            {/* Destra: anteprima live */}
            <Grid size={{ xs: 12, md: 5 }} sx={{ position: "sticky", top: 0, alignSelf: "flex-start" }}>
              <CollectionPreviewCard
                imageUrl={(filePreview || editing?.img_path) ?? null}
                refCode={formIsCollection ? "" : form.ref}
                title={form.title}
                description={form.description}
                category={form.category}
                imgPosition={form.img_position}
                lang={form.lang as "it" | "en"}
                mode={previewMode}
                onModeChange={setPreviewMode}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ borderTop: "1px solid var(--vx-border)", px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => !saving && setDialogOpen(false)}
            disabled={saving}
            sx={{
              textTransform: "none",
              color: "var(--vx-text-muted)",
              borderRadius: "8px",
              "&:hover": { bgcolor: "var(--vx-surface-muted)" },
            }}
          >
            Annulla
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              textTransform: "none",
              bgcolor: "var(--vx-primary)",
              "&:hover": { bgcolor: "var(--vx-primary-dark, #1565c0)" },
              borderRadius: "8px",
              minWidth: 140,
              fontWeight: 600,
            }}
          >
            {saving ? <CircularProgress size={15} sx={{ color: "#fff" }} /> : editing ? "Salva modifiche" : "Crea collezione"}
          </Button>
        </DialogActions>
      </Dialog>

      <ImageCropDialog
        open={cropOpen}
        imageSrc={cropSrc}
        onConfirm={(blob, area) => {
          setCropArea(area);
          setCropOpen(false);
          setFilePreview(URL.createObjectURL(blob));
        }}
        onCancel={() => {
          setCropOpen(false);
          setCropSrc("");
          setOriginalFile(null);
        }}
      />

      <MediaPickerDialog
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(file) => {
          if (mediaPickerTarget === "catalogue") {
            setCatalogueCoverDraft(file.url);
          } else {
            setSelectedMediaUrl(file.url);
            setFilePreview(file.url);
            setOriginalFile(null);
            setCropArea(null);
          }
          setMediaPickerOpen(false);
        }}
      />

      <Dialog
        open={categoryDialogOpen}
        onClose={() => !categoryBusyAction && setCategoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          backdrop: { sx: { backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" } },
          paper: { sx: dialogPaperSx },
        }}
      >
        <DialogTitle sx={dialogHeaderSx}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              bgcolor: "var(--vx-primary-soft)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <CategoryOutlinedIcon sx={{ fontSize: 16, color: "var(--vx-primary)" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: "var(--vx-text-primary)" }}>
              Categorie del catalogo
            </Typography>
            <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)", mt: 0.25 }}>
              Rinomina, elimina e riordina le categorie che compaiono come tab nel frontend.
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: "20px !important" }}>
          <Stack component="div" spacing={2}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1.5, alignItems: { md: "flex-end" } }}>
              <TextField
                label="Nuova categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                size="small"
                fullWidth
                sx={fieldSx}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateCategory}
                disabled={categoryBusyAction === "create"}
                sx={{
                  whiteSpace: "nowrap",
                  textTransform: "none",
                  bgcolor: "var(--vx-primary)",
                  "&:hover": { bgcolor: "var(--vx-primary-dark)" },
                  borderRadius: "8px",
                  minWidth: 140,
                }}
              >
                {categoryBusyAction === "create" ? <CircularProgress size={15} sx={{ color: "#fff" }} /> : "Aggiungi"}
              </Button>
            </Box>

            <Divider sx={{ borderColor: "var(--vx-border)" }} />

            {categoryDrafts.length === 0 ? (
              <Typography sx={{ color: "var(--vx-text-muted)", fontSize: 13 }}>
                Nessuna categoria salvata.
              </Typography>
            ) : (
              <Stack component="div" spacing={1}>
                {categoryDrafts.map((category, index) => {
                  const original = categories.find((item) => item.id === category.id);
                  const changed = original ? original.name !== category.name.trim() : false;
                  return (
                    <Box
                      key={category.id}
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        gap: 1,
                        alignItems: { md: "center" },
                        p: 1.25,
                        borderRadius: 2,
                        border: "1px solid var(--vx-border)",
                        bgcolor: "var(--vx-surface)",
                      }}
                    >
                      <TextField
                        value={category.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCategoryDrafts((current) =>
                            current.map((item) => (item.id === category.id ? { ...item, name: value } : item)),
                          );
                        }}
                        size="small"
                        fullWidth
                        sx={fieldSx}
                      />
                      <Chip
                        label={`${category.item_count ?? 0} elementi`}
                        size="small"
                        sx={{
                          height: 28,
                          bgcolor: "var(--vx-primary-soft)",
                          color: "var(--vx-primary)",
                          fontWeight: 700,
                        }}
                      />
                      <Stack component="div" direction="row" spacing={0.5}>
                        <Tooltip title="Sposta su">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => void handleMoveCategory(category.id, -1)}
                              disabled={index === 0 || categoryBusyId === category.id}
                              sx={{ color: "var(--vx-text-muted)" }}
                            >
                              <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Sposta giu">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => void handleMoveCategory(category.id, 1)}
                              disabled={index === categoryDrafts.length - 1 || categoryBusyId === category.id}
                              sx={{ color: "var(--vx-text-muted)" }}
                            >
                              <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Salva nome">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => void handleRenameCategory(category.id)}
                              disabled={!changed || categoryBusyId === category.id}
                              sx={{ color: "var(--vx-text-muted)" }}
                            >
                              <EditOutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Elimina">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => void handleDeleteCategory(category.id)}
                              disabled={categoryBusyId === category.id}
                              sx={{ color: "var(--vx-text-muted)", "&:hover": { color: "#d32f2f" } }}
                            >
                              {categoryBusyAction === "delete" && categoryBusyId === category.id ? (
                                <CircularProgress size={14} />
                              ) : (
                                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ borderTop: "1px solid var(--vx-border)", px: 3, py: 2 }}>
          <Button
            onClick={() => !categoryBusyAction && setCategoryDialogOpen(false)}
            sx={{
              textTransform: "none",
              color: "var(--vx-text-muted)",
              borderRadius: "8px",
              "&:hover": { bgcolor: "var(--vx-surface-muted)" },
            }}
          >
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          backdrop: { sx: { backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" } },
          paper: { sx: dialogPaperSx },
        }}
      >
        <DialogTitle sx={{ ...dialogHeaderSx }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              bgcolor: "rgba(211,47,47,0.1)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 16, color: "#d32f2f" }} />
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "var(--vx-text-primary)" }}>
            {deleteTarget?.status === "draft" ? "Rimuovi bozza" : "Elimina collezione"}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: "20px !important" }}>
          <Typography sx={{ fontSize: 14, color: "var(--vx-text-secondary)", lineHeight: 1.6 }}>
            {deleteTarget?.status === "draft" ? "Sei sicuro di voler rimuovere la bozza " : "Sei sicuro di voler eliminare "}
            <strong style={{ color: "var(--vx-text-primary)" }}>{deleteTarget?.title}</strong>?
            <br />
            L&apos;operazione non e reversibile.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid var(--vx-border)", px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => !deleting && setDeleteTarget(null)}
            disabled={deleting}
            sx={{
              textTransform: "none",
              color: "var(--vx-text-muted)",
              borderRadius: "8px",
              "&:hover": { bgcolor: "var(--vx-surface-muted)" },
            }}
          >
            Annulla
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting} sx={{ textTransform: "none", borderRadius: "8px", minWidth: 100, fontWeight: 600 }}>
            {deleting ? <CircularProgress size={15} sx={{ color: "#fff" }} /> : "Elimina"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast?.type ?? "success"} onClose={() => setToast(null)} sx={{ fontSize: 13 }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
