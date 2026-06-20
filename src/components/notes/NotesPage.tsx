import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Snackbar,
  InputAdornment,
  alpha,
} from "@mui/material";
import { AddRounded, SearchRounded, CloseRounded } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import PageContainer from "../layout/PageContainer";
import ConfirmDialog from "../common/ConfirmDialog";
import useNotes from "../../hooks/useNotes";
import NoteCard from "./NoteCard";

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));
const noteColors = [
  "#7C3AED",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#6366F1",
];

export default function NotesPage({ user }) {
  const { notes, addNote, updateNote, deleteNote, togglePin } = useNotes(user);
  const [search, setSearch] = useState("");
  const [editNote, setEditNote] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [color, setColor] = useState("#7C3AED");
  const [delNote, setDelNote] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: "" });

  const filtered = useMemo(
    () =>
      notes
        .filter((n) => {
          if (!search.trim()) return true;
          const s = search.toLowerCase();
          return (
            (n.title || "").toLowerCase().includes(s) ||
            (n.content || "").toLowerCase().includes(s)
          );
        })
        .sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return (b.createdAt || "").localeCompare(a.createdAt || "");
        }),
    [notes, search],
  );

  const openNew = () => {
    setEditNote(null);
    setTitle("");
    setContent("");
    setTags("");
    setColor("#7C3AED");
    setFormOpen(true);
  };

  const openEdit = (note) => {
    setEditNote(note);
    setTitle(note.title || "");
    setContent(note.content || "");
    setTags(note.tags ? note.tags.join(", ") : "");
    setColor(note.color || "#7C3AED");
    setFormOpen(true);
  };

  const handleCloseDialog = () => {
    setFormOpen(false);
  };

  const handleSave = async () => {
    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

    if (editNote) {
      const updateData = { title, content, color, tags: tagsArray };
      await updateNote(editNote.id, updateData);
      setSnack({ open: true, msg: "Note modifiée ✓" });
    } else {
      await addNote({ title, content, color, tags: tagsArray });
      setSnack({ open: true, msg: "Note ajoutée ✓" });
    }
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (delNote) {
      await deleteNote(delNote);
      setDelNote(null);
      setSnack({ open: true, msg: "Note supprimée." });
    }
  };

  return (
    <PageContainer title="Mes Notes" subtitle="Capture tes idées rapidement">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Rechercher une note..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 150 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={openNew}
            sx={{ whiteSpace: "nowrap" }}
          >
            Nouvelle note
          </Button>
        </motion.div>
      </Box>

      {/* ── Notes Grid ──────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <Typography variant="h1" sx={{ fontSize: 64, mb: 2 }}>
              📝
            </Typography>
            <Typography variant="h6">Aucune note</Typography>
            <Typography variant="body2">Commence à écrire !</Typography>
          </Box>
        </motion.div>
      ) : (
        <Box sx={{ columns: { xs: 1, sm: 2, md: 3 }, columnGap: 2 }}>
          <AnimatePresence>
            {filtered.map((note, i) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  delay: i * 0.04,
                  type: "spring",
                  stiffness: 300,
                  damping: 28,
                }}
                style={{ breakInside: "avoid", marginBottom: 16 }}
              >
                <NoteCard
                  note={note}
                  onEdit={openEdit}
                  onTogglePin={togglePin}
                  onDelete={setDelNote}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      )}

      {/* ── Edit/Create Dialog ──────────────────────────────────────────── */}
      <Dialog
        open={formOpen}
        onClose={handleCloseDialog}
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            backgroundImage: "none",
            backdropFilter: "blur(20px)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {editNote ? "✏️ Modifier la Note" : "📝 Nouvelle Note"}
          </Box>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            autoFocus
            label="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2, mt: 0.5 }}
          />
          <TextField
            fullWidth
            label="Tags (séparés par des virgules)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="ex: urgent, projetX, révision"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Contenu (Supporte le Markdown)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* ── Color picker ───────────────────────────────────────────── */}
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, fontWeight: 600, color: "text.secondary" }}
          >
            Couleur
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {noteColors.map((c) => (
              <motion.div
                key={c}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                <Box
                  onClick={() => setColor(c)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    cursor: "pointer",
                    backgroundColor: c,
                    transition: "all 0.2s",
                    border:
                      color === c ? "3px solid white" : "2px solid transparent",
                    boxShadow: color === c ? `0 0 14px ${c}` : "none",
                    outline: color === c ? `2px solid ${c}` : "none",
                  }}
                />
              </motion.div>
            ))}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={handleCloseDialog} sx={{ borderRadius: 2 }}>
            Annuler
          </Button>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
            >
              Sauvegarder
            </Button>
          </motion.div>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(delNote)}
        title="Supprimer cette note ?"
        message={`"${delNote?.title || "Sans titre"}" sera supprimée.`}
        onConfirm={handleDelete}
        onCancel={() => setDelNote(null)}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
        message={snack.msg}
        TransitionComponent={Transition}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </PageContainer>
  );
}
