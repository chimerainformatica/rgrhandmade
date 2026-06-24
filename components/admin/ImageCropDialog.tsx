"use client";

import { useState, useCallback, type ReactNode } from "react";
import Cropper, { type Point, type Area } from "react-easy-crop";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Slider,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Box,
} from "@mui/material";
import { dialogPaperSx } from "@/lib/admin-theme";
import Crop169Icon from "@mui/icons-material/Crop169";
import Crop75Icon from "@mui/icons-material/Crop75";
import CropFreeIcon from "@mui/icons-material/CropFree";
import CropPortraitIcon from "@mui/icons-material/CropPortrait";
import CropSquareIcon from "@mui/icons-material/CropSquare";

type AspectOption = "free" | "1:1" | "4:3" | "16:9" | "9:16";

const ASPECT_MAP: Record<AspectOption, number | undefined> = {
  free: undefined,
  "1:1": 1,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
};

const ASPECT_OPTIONS: Array<{
  value: AspectOption;
  label: string;
  hint: string;
  icon: ReactNode;
}> = [
  { value: "free", label: "Libero", hint: "Manuale", icon: <CropFreeIcon fontSize="small" /> },
  { value: "1:1", label: "1:1", hint: "Square", icon: <CropSquareIcon fontSize="small" /> },
  { value: "4:3", label: "4:3", hint: "Catalogo", icon: <Crop75Icon fontSize="small" /> },
  { value: "16:9", label: "16:9", hint: "Wide", icon: <Crop169Icon fontSize="small" /> },
  { value: "9:16", label: "9:16", hint: "Reels", icon: <CropPortraitIcon fontSize="small" /> },
];

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string;
  /** blob = anteprima client-side (WebP canvas); cropArea = coordinate in pixel per crop server-side */
  onConfirm: (blob: Blob, cropArea: Area, width: number, height: number) => void;
  onCancel: () => void;
}

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  quality = 0.85
): Promise<{ blob: Blob; width: number; height: number }> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error("Canvas toBlob failed")); return; }
        resolve({ blob, width: pixelCrop.width, height: pixelCrop.height });
      },
      "image/webp",
      quality
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function ImageCropDialog({ open, imageSrc, onConfirm, onCancel }: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectKey, setAspectKey] = useState<AspectOption>("free");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [converting, setConverting] = useState(false);

  const onCropComplete = useCallback((_: Area, pixelCrop: Area) => {
    setCroppedAreaPixels(pixelCrop);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setConverting(true);
    try {
      const { blob, width, height } = await getCroppedBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob, croppedAreaPixels, width, height);
    } finally {
      setConverting(false);
    }
  };

  return (
    <Dialog open={open} maxWidth="md" fullWidth onClose={onCancel}
      slotProps={{ paper: { sx: dialogPaperSx } }}>
      <DialogTitle>Ritaglia immagine</DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Stack spacing={2}>
          <ToggleButtonGroup
            value={aspectKey}
            exclusive
            onChange={(_, v) => v && setAspectKey(v)}
            size="small"
            fullWidth
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(5, minmax(0, 1fr))" },
              gap: 0.75,
              "& .MuiToggleButtonGroup-grouped": {
                border: "1px solid var(--vx-border) !important",
                borderRadius: "8px !important",
                m: 0,
              },
            }}
          >
            {ASPECT_OPTIONS.map((option) => (
              <ToggleButton
                key={option.value}
                value={option.value}
                aria-label={`Formato ${option.label}`}
                sx={{
                  minHeight: 58,
                  py: 0.75,
                  px: 1,
                  color: "var(--vx-text-secondary)",
                  textTransform: "none",
                  "&.Mui-selected": {
                    color: "var(--vx-primary)",
                    bgcolor: "var(--vx-primary-soft)",
                    borderColor: "var(--vx-primary) !important",
                    boxShadow: "0 8px 22px rgba(25,118,210,0.13)",
                  },
                }}
              >
                <Stack spacing={0.25} sx={{ alignItems: "center", lineHeight: 1 }}>
                  {option.icon}
                  <Typography component="span" sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.1 }}>
                    {option.label}
                  </Typography>
                  <Typography component="span" sx={{ fontSize: 10, color: "var(--vx-text-muted)", lineHeight: 1.1 }}>
                    {option.hint}
                  </Typography>
                </Stack>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Box
            sx={{
              position: "relative",
              height: { xs: 340, sm: 430 },
              overflow: "hidden",
              borderRadius: "12px",
              background: "#0b0d10",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03), 0 18px 40px rgba(0,0,0,0.20)",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.12), transparent 28%), linear-gradient(135deg, rgba(25,118,210,0.22), transparent 38%, rgba(198,161,91,0.12))",
                zIndex: 1,
              },
            }}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={ASPECT_MAP[aspectKey]}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid
              style={{
                cropAreaStyle: {
                  border: "2px solid rgba(255,255,255,0.98)",
                  boxShadow:
                    "0 0 0 9999px rgba(5,7,10,0.54), 0 0 0 1px rgba(198,161,91,0.95), 0 0 26px rgba(198,161,91,0.34)",
                  borderRadius: aspectKey === "free" ? 10 : 6,
                },
              }}
            />
          </Box>

          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Typography variant="caption">Zoom</Typography>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              onChange={(_, v) => setZoom(v as number)}
              sx={{ flex: 1 }}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={converting}>Annulla</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={converting || !croppedAreaPixels}
        >
          {converting ? "Preparazione anteprima..." : "Conferma ritaglio"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
