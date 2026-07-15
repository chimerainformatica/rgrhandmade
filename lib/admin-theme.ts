/* Vitrix CMS — centralised MUI sx tokens
   Import these instead of duplicating in every panel. */

export const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--vx-input-bg)",
    color: "var(--vx-text-primary)",
    fontSize: 14,
    borderRadius: "8px",
    "& fieldset": { borderColor: "var(--vx-input-border)" },
    "&:hover fieldset": { borderColor: "var(--vx-primary)" },
    "&.Mui-focused fieldset": { borderColor: "var(--vx-primary)", borderWidth: 2 },
    "&.Mui-focused": { boxShadow: "0 0 0 3px rgba(25,118,210,0.12)" }
  },
  "& .MuiInputBase-input": { color: "var(--vx-text-primary)", fontSize: 14 },
  "& .MuiInputLabel-root": { color: "var(--vx-text-muted)", fontSize: 14 },
  "& .MuiInputLabel-root.Mui-focused": { color: "var(--vx-primary)" }
};

export const cardSx = {
  p: 3,
  bgcolor: "var(--vx-surface)",
  border: "1px solid var(--vx-border)",
  borderRadius: "12px",
  boxShadow: "none"
};

export const selectSx = {
  bgcolor: "var(--vx-input-bg)",
  color: "var(--vx-text-primary)",
  fontSize: 14,
  borderRadius: "8px",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--vx-input-border)" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--vx-primary)" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--vx-primary)", borderWidth: 2 },
  "& .MuiSelect-icon": { color: "var(--vx-text-muted)" }
};

/** Portal-safe styling for MUI Autocomplete dropdowns in the Vitrix admin. */
export const autocompletePaperSx = {
  mt: 0.75,
  bgcolor: "var(--vx-surface)",
  color: "var(--vx-text-primary)",
  border: "1px solid var(--vx-border)",
  borderRadius: "10px",
  boxShadow: "var(--vx-shadow-lg)",
  backgroundImage: "none",
  overflow: "hidden",
  "& .MuiAutocomplete-listbox": {
    p: 0.75,
    bgcolor: "var(--vx-surface)",
    "& .MuiAutocomplete-option": {
      minHeight: 38,
      px: 1.25,
      borderRadius: "7px",
      color: "var(--vx-text-secondary)",
      fontSize: 14,
      "&[aria-selected='true']": {
        bgcolor: "var(--vx-primary-soft)",
        color: "var(--vx-primary)",
      },
      "&.Mui-focused, &.Mui-focusVisible": {
        bgcolor: "var(--vx-surface-muted)",
        color: "var(--vx-text-primary)",
      },
      "&[aria-selected='true'].Mui-focused": {
        bgcolor: "var(--vx-primary-soft)",
      },
    },
  },
  "& .MuiAutocomplete-noOptions": {
    bgcolor: "var(--vx-surface)",
    color: "var(--vx-text-muted)",
  },
};

export const iconBtnSx = (intent: "default" | "danger" | "primary" = "default") => {
  const map = {
    default: { color: "var(--vx-text-muted)", hoverColor: "var(--vx-text-primary)", hoverBg: "var(--vx-surface-muted)" },
    primary: { color: "var(--vx-text-muted)", hoverColor: "var(--vx-primary)", hoverBg: "var(--vx-primary-soft)" },
    danger:  { color: "var(--vx-text-muted)", hoverColor: "var(--vx-danger)",  hoverBg: "var(--vx-danger-soft)"  }
  };
  const t = map[intent];
  return {
    color: t.color,
    borderRadius: "8px",
    "&:hover": { color: t.hoverColor, bgcolor: t.hoverBg }
  };
};

export const dialogPaperSx = {
  bgcolor: "var(--vx-surface)",
  color: "var(--vx-text-primary)",
  borderRadius: "16px",
  border: "1px solid var(--vx-border)",
  boxShadow: "0 24px 64px rgba(0,0,0,0.18)"
};

export const dialogHeaderSx = {
  background: "linear-gradient(135deg, rgba(46,196,241,0.07) 0%, rgba(108,92,231,0.07) 100%)",
  borderBottom: "1px solid var(--vx-border)",
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  px: 3,
  py: 2.5
};
