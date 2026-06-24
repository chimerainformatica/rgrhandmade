"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { dialogPaperSx, dialogHeaderSx } from "@/lib/admin-theme";
import type { VitrixMediaFile } from "@/lib/vitrix/types";

interface MediaPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (file: VitrixMediaFile) => void;
}

const thumbnailSx = (selected: boolean) => ({
  position: "relative" as const,
  borderRadius: "10px",
  overflow: "hidden",
  cursor: "pointer",
  border: selected ? "2px solid var(--vx-primary)" : "2px solid var(--vx-border)",
  bgcolor: "var(--vx-surface)",
  transition: "all 0.18s ease",
  "&:hover": {
    borderColor: "var(--vx-primary)",
    boxShadow: "0 4px 16px rgba(46,196,241,0.15)",
  },
});

export default function MediaPickerDialog({ open, onClose, onSelect }: MediaPickerDialogProps) {
  const [files, setFiles] = useState<VitrixMediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedUrl(null);
    setSearch("");
    fetch("/api/vitrix/media")
      .then((r) => r.json())
      .then((json) => setFiles(json.files ?? []))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = search.trim()
    ? files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  const handleConfirm = () => {
    const picked = files.find((f) => f.url === selectedUrl);
    if (picked) onSelect(picked);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        backdrop: { sx: { backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" } },
        paper: { sx: { ...dialogPaperSx, minHeight: "60vh" } },
      }}
    >
      <DialogTitle sx={dialogHeaderSx}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "var(--vx-text-primary)" }}>
            Galleria media
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: "16px !important", pb: 1 }}>
        <TextField
          placeholder="Cerca per nome file..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "var(--vx-text-muted)" }} />
                </InputAdornment>
              ),
            },
          }}
        />

        {loading ? (
          <Typography sx={{ color: "var(--vx-text-muted)", textAlign: "center", py: 6 }}>
            Caricamento...
          </Typography>
        ) : filtered.length === 0 ? (
          <Typography sx={{ color: "var(--vx-text-muted)", textAlign: "center", py: 6 }}>
            Nessun file trovato.
          </Typography>
        ) : (
          <Grid container spacing={1.5} sx={{ maxHeight: "50vh", overflowY: "auto" }}>
            {filtered.map((file) => {
              const isImage = /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(file.name);
              const isSelected = file.url === selectedUrl;
              return (
                <Grid key={file.name} size={{ xs: 4, sm: 3, md: 2 }}>
                  <Box sx={thumbnailSx(isSelected)} onClick={() => setSelectedUrl(file.url)}>
                    {isImage ? (
                      <Box
                        component="img"
                        src={file.url}
                        alt={file.name}
                        sx={{
                          width: "100%",
                          aspectRatio: "1",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          aspectRatio: "1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--vx-text-muted)",
                          fontSize: 11,
                        }}
                      >
                        {file.type.toUpperCase()}
                      </Box>
                    )}
                    {isSelected && (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          bgcolor: "rgba(46,196,241,0.12)",
                          border: "2px solid var(--vx-primary)",
                          pointerEvents: "none",
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    sx={{ fontSize: 10, color: "var(--vx-text-muted)", mt: 0.3, textAlign: "center", wordBreak: "break-all" }}
                  >
                    {file.name.length > 20 ? file.name.slice(0, 18) + ".." : file.name}
                  </Typography>
                </Grid>
              );
            })}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: "1px solid var(--vx-border)", px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={onClose}
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
          onClick={handleConfirm}
          disabled={!selectedUrl}
          sx={{
            textTransform: "none",
            bgcolor: "var(--vx-primary)",
            "&:hover": { bgcolor: "var(--vx-primary-dark, #1565c0)" },
            borderRadius: "8px",
            fontWeight: 600,
          }}
        >
          Seleziona
        </Button>
      </DialogActions>
    </Dialog>
  );
}
