"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import FileOpenOutlinedIcon from "@mui/icons-material/FileOpenOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
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
  IconButton,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Typography
} from "@mui/material";
import type { VitrixMediaFile } from "@/lib/vitrix/types";
import { VitrixLoader } from "./VitrixLoader";

/* ── helpers ─────────────────────────────────────────────────── */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);

function isImage(ext: string) { return IMAGE_EXTS.has(ext.toLowerCase()); }

const TYPE_COLOR: Record<string, "primary" | "secondary" | "default" | "error" | "warning" | "info" | "success"> = {
  pdf: "error",
  zip: "warning",
  mp4: "secondary",
  webm: "secondary",
  mp3: "info",
  ogg: "info",
};

const cardSx = {
  p: 0,
  bgcolor: "var(--vx-surface)",
  border: "1px solid var(--vx-border)",
  borderRadius: "12px",
  boxShadow: "none"
};

type ToastState = { open: boolean; message: string; severity: "success" | "error" };

/* ── DropZone ────────────────────────────────────────────────── */
function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  }

  return (
    <Box
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      sx={{
        mb: 2.5, p: 4, borderRadius: "12px", cursor: "pointer",
        border: `2px dashed ${over ? "var(--vx-primary)" : "var(--vx-border)"}`,
        bgcolor: over ? "var(--vx-primary-soft)" : "var(--vx-surface-muted)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
        transition: "all 160ms ease",
        "&:hover": { borderColor: "var(--vx-primary)", bgcolor: "var(--vx-primary-soft)" }
      }}
    >
      <CloudUploadOutlinedIcon sx={{ fontSize: 36, color: over ? "var(--vx-primary)" : "var(--vx-text-disabled)" }} />
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "var(--vx-text-secondary)" }}>
        Trascina i file qui o clicca per caricarli
      </Typography>
      <Typography sx={{ fontSize: 12, color: "var(--vx-text-muted)" }}>
        Immagini, PDF, video, documenti — max 50 MB per file
      </Typography>
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => { if (e.target.files?.length) onFiles(Array.from(e.target.files)); }}
      />
    </Box>
  );
}

/* ── FileCard ────────────────────────────────────────────────── */
function FileCard({ file, onDelete, onCopy }: { file: VitrixMediaFile; onDelete: () => void; onCopy: () => void }) {
  return (
    <Paper
      sx={{
        p: 1.5, bgcolor: "var(--vx-surface-muted)", border: "1px solid var(--vx-border)",
        borderRadius: "10px", boxShadow: "none", transition: "border-color 160ms",
        "&:hover": { borderColor: "var(--vx-primary)" }
      }}
    >
      {/* Preview or icon */}
      <Box sx={{ mb: 1, borderRadius: "8px", overflow: "hidden", bgcolor: "var(--vx-bg)", aspectRatio: "16/10", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isImage(file.type) ? (
          <Box
            component="img"
            src={file.url}
            alt={file.name}
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <InsertDriveFileOutlinedIcon sx={{ fontSize: 32, color: "var(--vx-text-disabled)" }} />
        )}
      </Box>

      {/* Meta */}
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
        <Chip
          label={file.type.toUpperCase()}
          size="small"
          color={TYPE_COLOR[file.type] ?? "default"}
          sx={{ fontSize: 10, height: 18, fontWeight: 700 }}
        />
        <Typography sx={{ fontSize: 11, color: "var(--vx-text-muted)" }}>
          {formatBytes(file.size)}
        </Typography>
      </Stack>

      <Tooltip title={file.name} placement="top">
        <Typography
          sx={{
            fontSize: 12, fontWeight: 600, color: "var(--vx-text-primary)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
          }}
        >
          {file.name}
        </Typography>
      </Tooltip>

      <Typography sx={{ fontSize: 11, color: "var(--vx-text-muted)", mt: 0.25 }}>
        {formatDate(file.created_at)}
      </Typography>

      {/* Actions */}
      <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
        <Tooltip title="Copia URL" arrow>
          <IconButton
            size="small"
            onClick={onCopy}
            sx={{ color: "var(--vx-text-muted)", borderRadius: "6px", "&:hover": { color: "var(--vx-primary)", bgcolor: "var(--vx-primary-soft)" } }}
          >
            <ContentCopyOutlinedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Apri file" arrow>
          <IconButton
            size="small"
            component="a"
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "var(--vx-text-muted)", borderRadius: "6px", "&:hover": { color: "var(--vx-primary)", bgcolor: "var(--vx-primary-soft)" } }}
          >
            <FileOpenOutlinedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Elimina" arrow>
          <IconButton
            size="small"
            onClick={onDelete}
            sx={{ ml: "auto", color: "var(--vx-text-muted)", borderRadius: "6px", "&:hover": { color: "var(--vx-danger)", bgcolor: "var(--vx-danger-soft)" } }}
          >
            <DeleteOutlinedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  );
}

/* ── main component ─────────────────────────────────────────── */
export function MediaPanel() {
  const [files, setFiles] = useState<VitrixMediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState<ToastState>({ open: false, message: "", severity: "success" });
  const [deleteTarget, setDeleteTarget] = useState<VitrixMediaFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (message: string, severity: "success" | "error" = "success") => {
    setToast({ open: true, message, severity });
  };

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vitrix/media");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setFiles(json.files ?? []);
    } catch {
      showToast("Errore nel caricamento dei file.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  async function handleUpload(filesToUpload: File[]) {
    setUploading(true);
    let success = 0;
    let fail = 0;

    for (let i = 0; i < filesToUpload.length; i++) {
      setUploadProgress(Math.round(((i) / filesToUpload.length) * 100));
      try {
        const form = new FormData();
        form.append("file", filesToUpload[i]);
        const res = await fetch("/api/vitrix/media", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        success++;
      } catch {
        fail++;
      }
    }

    setUploadProgress(100);
    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);

    if (success > 0) showToast(`${success} file caricati con successo.`);
    if (fail > 0) showToast(`${fail} file non caricati (tipo non supportato o troppo grandi).`, "error");
    fetchFiles();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/vitrix/media/${encodeURIComponent(deleteTarget.name)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast("File eliminato.");
      setDeleteTarget(null);
      fetchFiles();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Errore nell'eliminazione.", "error");
    } finally {
      setDeleting(false);
    }
  }

  function copyUrl(file: VitrixMediaFile) {
    navigator.clipboard.writeText(window.location.origin + file.url).then(
      () => showToast("URL copiato negli appunti."),
      () => showToast("Impossibile copiare l'URL.", "error")
    );
  }

  const imageFiles = files.filter((f) => isImage(f.type));
  const otherFiles = files.filter((f) => !isImage(f.type));

  return (
    <Box sx={{ p: 3 }}>
      <DropZone onFiles={handleUpload} />

      {uploading && (
        <Box sx={{ mb: 2.5 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 0.75 }}>
            <CircularProgress size={14} sx={{ color: "var(--vx-primary)" }} />
            <Typography sx={{ fontSize: 13, color: "var(--vx-text-secondary)" }}>
              Caricamento in corso…
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
            sx={{ borderRadius: 4, bgcolor: "var(--vx-surface-muted)", "& .MuiLinearProgress-bar": { bgcolor: "var(--vx-primary)" } }}
          />
        </Box>
      )}

      {loading ? (
        <VitrixLoader label="Carico media" />
      ) : files.length === 0 ? (
        <Paper sx={{ ...cardSx, p: 8, textAlign: "center" }}>
          <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: "var(--vx-text-disabled)", mb: 2 }} />
          <Typography sx={{ color: "var(--vx-text-secondary)", fontSize: 14 }}>
            Nessun file caricato. Trascina i file nella zona sopra.
          </Typography>
        </Paper>
      ) : (
        <>
          {imageFiles.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ mb: 1.5, fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--vx-text-muted)" }}>
                Immagini ({imageFiles.length})
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 2 }}>
                {imageFiles.map((f) => (
                  <FileCard
                    key={f.name}
                    file={f}
                    onDelete={() => setDeleteTarget(f)}
                    onCopy={() => copyUrl(f)}
                  />
                ))}
              </Box>
            </Box>
          )}

          {otherFiles.length > 0 && (
            <Box>
              <Typography sx={{ mb: 1.5, fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--vx-text-muted)" }}>
                Altri file ({otherFiles.length})
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 2 }}>
                {otherFiles.map((f) => (
                  <FileCard
                    key={f.name}
                    file={f}
                    onDelete={() => setDeleteTarget(f)}
                    onCopy={() => copyUrl(f)}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Typography sx={{ mt: 2, fontSize: 12, color: "var(--vx-text-muted)" }}>
            {files.length} file totali · {formatBytes(files.reduce((s, f) => s + f.size, 0))} usati
          </Typography>
        </>
      )}

      {/* ── delete confirm ── */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { bgcolor: "var(--vx-surface)", color: "var(--vx-text-primary)", borderRadius: "14px", border: "1px solid var(--vx-border)", boxShadow: "0 24px 64px rgba(0,0,0,0.22)" } } }}
      >
        <DialogTitle sx={{ px: 3, pt: 3, pb: 1, fontSize: 17, fontWeight: 700 }}>
          Elimina file
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography sx={{ fontSize: 14, color: "var(--vx-text-secondary)" }}>
            Sei sicuro di voler eliminare{" "}
            <Box component="strong" sx={{ color: "var(--vx-text-primary)" }}>
              &quot;{deleteTarget?.name}&quot;
            </Box>
            ? Il file verrà rimosso dal server.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            variant="outlined"
            sx={{ textTransform: "none", fontSize: 13, borderRadius: "8px", borderColor: "var(--vx-border)", color: "var(--vx-text-secondary)" }}
          >
            Annulla
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            variant="contained"
            color="error"
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlinedIcon />}
            sx={{ textTransform: "none", fontSize: 13, fontWeight: 700, borderRadius: "8px", boxShadow: "none" }}
          >
            {deleting ? "Eliminazione…" : "Elimina"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── toast ── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: "10px", fontSize: 13 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
