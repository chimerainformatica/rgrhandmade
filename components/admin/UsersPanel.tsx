"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
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
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
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
  Typography,
} from "@mui/material";
import type { VitrixUser } from "@/lib/vitrix/auth";
import {
  canAssignManagedRole,
  canManageTargetUser,
  type ManagedUserRole,
  type ManagedUserRow,
} from "@/lib/vitrix/users-core";
import { AdminLoadingBoundary } from "@/components/admin/AdminLoadingBoundary";

const roleLabels: Record<ManagedUserRole, string> = {
  superadmin: "Superadmin Chimera",
  owner: "Owner",
  admin: "Amministratore",
  editor: "Editor",
  viewer: "Visualizzatore",
};

const allRoles = Object.keys(roleLabels) as ManagedUserRole[];

const pageSx = {
  width: "100%",
  minHeight: "calc(100vh - 56px)",
  p: { xs: 2, md: 3, lg: 4 },
  boxSizing: "border-box",
};

const cardSx = {
  p: { xs: 2, md: 3 },
  bgcolor: "var(--vx-surface)",
  border: "1px solid var(--vx-border)",
  borderRadius: "12px",
  boxShadow: "none",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--vx-input-bg)",
    color: "var(--vx-text-primary)",
    "& fieldset": { borderColor: "var(--vx-input-border)" },
    "&:hover fieldset": { borderColor: "var(--vx-primary)" },
    "&.Mui-focused fieldset": { borderColor: "var(--vx-primary)", borderWidth: 2 },
  },
  "& .MuiInputLabel-root": { color: "var(--vx-text-muted)", fontSize: 13 },
  "& .MuiInputLabel-root.Mui-focused": { color: "var(--vx-primary)" },
};

type EditorState = {
  open: boolean;
  user: ManagedUserRow | null;
  email: string;
  password: string;
  role: ManagedUserRole;
};

type ConfirmState = {
  action: "toggle" | "delete";
  user: ManagedUserRow;
} | null;

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body.error === "string" ? body.error : "Operazione non riuscita.");
  }
  return body as T;
}

function formatDate(value: string | null): string {
  if (!value) return "Mai";
  return new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function UsersPanel({ currentUser }: { currentUser: VitrixUser }) {
  const [users, setUsers] = useState<ManagedUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{ severity: "success" | "error"; message: string } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [editor, setEditor] = useState<EditorState>({
    open: false,
    user: null,
    email: "",
    password: "",
    role: "viewer",
  });

  const assignableRoles = useMemo(
    () => allRoles.filter((role) => canAssignManagedRole(currentUser.roles, role)),
    [currentUser.roles],
  );

  const visibleUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;
    return users.filter((user) => user.email.toLowerCase().includes(normalizedQuery) || (user.role && roleLabels[user.role].toLowerCase().includes(normalizedQuery)));
  }, [query, users]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiJson<{ users: ManagedUserRow[] }>("/api/vitrix/users");
      setUsers(result.users);
    } catch (error) {
      setToast({ severity: "error", message: error instanceof Error ? error.message : "Caricamento utenti non riuscito." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function openCreate() {
    setEditor({ open: true, user: null, email: "", password: "", role: assignableRoles[0] ?? "viewer" });
  }

  function openEdit(user: ManagedUserRow) {
    setEditor({ open: true, user, email: user.email, password: "", role: user.role ?? "viewer" });
  }

  async function saveUser() {
    setBusy(true);
    try {
      const payload = { email: editor.email, password: editor.password, role: editor.role };
      const result = editor.user
        ? await apiJson<{ user: ManagedUserRow }>(`/api/vitrix/users/${editor.user.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await apiJson<{ user: ManagedUserRow }>("/api/vitrix/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      setUsers((current) => {
        const next = editor.user ? current.map((user) => (user.id === result.user.id ? result.user : user)) : [...current, result.user];
        return next.sort((left, right) => left.email.localeCompare(right.email, "it"));
      });
      setEditor((current) => ({ ...current, open: false }));
      setToast({ severity: "success", message: editor.user ? "Utente aggiornato." : "Utente creato." });
    } catch (error) {
      setToast({ severity: "error", message: error instanceof Error ? error.message : "Salvataggio non riuscito." });
    } finally {
      setBusy(false);
    }
  }

  async function runConfirmedAction() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.action === "delete") {
        await apiJson<{ ok: true }>(`/api/vitrix/users/${confirm.user.id}`, { method: "DELETE" });
        setUsers((current) => current.filter((user) => user.id !== confirm.user.id));
        setToast({ severity: "success", message: "Utente eliminato definitivamente." });
      } else {
        const result = await apiJson<{ user: ManagedUserRow }>(`/api/vitrix/users/${confirm.user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: !confirm.user.enabled }),
        });
        setUsers((current) => current.map((user) => (user.id === result.user.id ? result.user : user)));
        setToast({ severity: "success", message: result.user.enabled ? "Utente riattivato." : "Utente disattivato." });
      }
      setConfirm(null);
    } catch (error) {
      setToast({ severity: "error", message: error instanceof Error ? error.message : "Operazione non riuscita." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={pageSx}>
      <Paper sx={cardSx}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" }, justifyContent: "space-between", mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: 20, fontWeight: 700, color: "var(--vx-text-primary)" }}>Gestione utenti</Typography>
            <Typography sx={{ mt: 0.5, fontSize: 13, color: "var(--vx-text-secondary)" }}>
              Crea account, assegna un ruolo e controlla l’accesso al backoffice.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => void loadUsers()} disabled={loading || busy} startIcon={<RefreshOutlinedIcon />} sx={{ textTransform: "none", borderRadius: "8px" }}>
              Aggiorna
            </Button>
            <Button variant="contained" onClick={openCreate} disabled={busy} startIcon={<AddOutlinedIcon />} sx={{ textTransform: "none", borderRadius: "8px", boxShadow: "none" }}>
              Nuovo utente
            </Button>
          </Stack>
        </Stack>

        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cerca per e-mail o ruolo"
          size="small"
          sx={{ ...fieldSx, width: { xs: "100%", md: 360 }, mb: 2 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon sx={{ fontSize: 19 }} /></InputAdornment> } }}
        />

        {loading ? (
          <AdminLoadingBoundary label="Caricamento utenti" framed />
        ) : (
          <TableContainer sx={{ border: "1px solid var(--vx-border)", borderRadius: "8px" }}>
            <Table size="small" aria-label="Elenco utenti Vitrix">
              <TableHead>
                <TableRow sx={{ bgcolor: "var(--vx-surface-muted)" }}>
                  <TableCell>E-mail</TableCell>
                  <TableCell>Ruolo</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Creato</TableCell>
                  <TableCell>Ultimo accesso</TableCell>
                  <TableCell align="right">Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5, color: "var(--vx-text-muted)" }}>Nessun utente trovato.</TableCell></TableRow>
                ) : visibleUsers.map((user) => {
                  const manageable = canManageTargetUser(currentUser.roles, currentUser.id, { id: user.id, roles: user.roles });
                  return (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "var(--vx-text-primary)" }}>{user.email}</Typography>
                        {user.id === currentUser.id && <Typography sx={{ fontSize: 11, color: "var(--vx-text-muted)" }}>Account corrente</Typography>}
                      </TableCell>
                      <TableCell>{user.role ? roleLabels[user.role] : "Nessun ruolo"}</TableCell>
                      <TableCell><Chip size="small" label={user.enabled ? "Attivo" : "Disattivato"} color={user.enabled ? "success" : "default"} variant={user.enabled ? "filled" : "outlined"} /></TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.25} sx={{ justifyContent: "flex-end" }}>
                          <Tooltip title={manageable ? "Modifica" : "Utente protetto"}><span><IconButton size="small" disabled={!manageable || busy} onClick={() => openEdit(user)}><EditOutlinedIcon fontSize="small" /></IconButton></span></Tooltip>
                          <Tooltip title={manageable ? (user.enabled ? "Disattiva" : "Riattiva") : "Utente protetto"}><span><IconButton size="small" disabled={!manageable || busy} onClick={() => setConfirm({ action: "toggle", user })}>{user.enabled ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}</IconButton></span></Tooltip>
                          <Tooltip title={manageable ? "Elimina" : "Utente protetto"}><span><IconButton size="small" color="error" disabled={!manageable || busy} onClick={() => setConfirm({ action: "delete", user })}><DeleteOutlineIcon fontSize="small" /></IconButton></span></Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={editor.open} onClose={() => !busy && setEditor((current) => ({ ...current, open: false }))} fullWidth maxWidth="sm">
        <DialogTitle>{editor.user ? "Modifica utente" : "Nuovo utente"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField label="E-mail" type="email" value={editor.email} onChange={(event) => setEditor((current) => ({ ...current, email: event.target.value }))} disabled={busy} autoComplete="off" fullWidth sx={fieldSx} />
            <TextField label={editor.user ? "Nuova password (facoltativa)" : "Password temporanea"} type="password" value={editor.password} onChange={(event) => setEditor((current) => ({ ...current, password: event.target.value }))} disabled={busy} helperText="Minimo 8 caratteri" autoComplete="new-password" fullWidth sx={fieldSx} />
            <FormControl fullWidth sx={fieldSx}>
              <InputLabel id="managed-user-role-label">Ruolo</InputLabel>
              <Select labelId="managed-user-role-label" label="Ruolo" value={editor.role} onChange={(event) => setEditor((current) => ({ ...current, role: event.target.value as ManagedUserRole }))} disabled={busy}>
                {assignableRoles.map((role) => <MenuItem key={role} value={role}>{roleLabels[role]}</MenuItem>)}
              </Select>
            </FormControl>
            {!editor.user && <Alert severity="info">L’account sarà confermato subito. Comunica la password temporanea all’utente tramite un canale sicuro.</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditor((current) => ({ ...current, open: false }))} disabled={busy}>Annulla</Button>
          <Button variant="contained" onClick={() => void saveUser()} disabled={busy || !editor.email || (!editor.user && editor.password.length < 8)} startIcon={busy ? <CircularProgress size={16} /> : undefined}>
            {editor.user ? "Salva modifiche" : "Crea utente"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirm)} onClose={() => !busy && setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{confirm?.action === "delete" ? "Elimina definitivamente" : confirm?.user.enabled ? "Disattiva utente" : "Riattiva utente"}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "var(--vx-text-secondary)", lineHeight: 1.6 }}>
            {confirm?.action === "delete"
              ? `L’account ${confirm.user.email} e le relative associazioni verranno eliminati definitivamente.`
              : confirm?.user.enabled
                ? `L’utente ${confirm?.user.email} non potrà più accedere finché non verrà riattivato.`
                : `L’utente ${confirm?.user.email} potrà nuovamente accedere al backoffice.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirm(null)} disabled={busy}>Annulla</Button>
          <Button variant="contained" color={confirm?.action === "delete" ? "error" : "primary"} onClick={() => void runConfirmedAction()} disabled={busy} startIcon={busy ? <CircularProgress size={16} /> : undefined}>
            {confirm?.action === "delete" ? "Elimina" : "Conferma"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={4500} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast?.severity ?? "success"} onClose={() => setToast(null)} variant="filled">{toast?.message}</Alert>
      </Snackbar>
    </Box>
  );
}
