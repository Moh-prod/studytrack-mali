import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Typography,
  Slide,
  Chip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  AddRounded,
  CloseRounded,
  DeleteOutlineRounded,
} from "@mui/icons-material";

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

const priorities = [
  { value: "urgent", label: "🔴 Urgente" },
  { value: "high", label: "🟠 Haute" },
  { value: "medium", label: "🔵 Moyenne" },
  { value: "low", label: "🟢 Basse" },
];

const categories = [
  { value: "study", label: "📚 Étude" },
  { value: "work", label: "💼 Travail" },
  { value: "personal", label: "🏠 Personnel" },
  { value: "health", label: "💪 Santé" },
  { value: "creativity", label: "🎨 Créativité" },
];

const recurringOptions = [
  { value: "daily", label: "📆 Tous les jours" },
  { value: "weekly", label: "📅 Chaque semaine" },
  { value: "monthly", label: "🗓️ Chaque mois" },
];

export default function TaskForm({ open, onClose, onSubmit, initialData }) {
  const isEdit = Boolean(initialData);
  const [text, setText] = useState(initialData?.text || "");
  const [date, setDate] = useState(initialData?.date || "");
  const [reminderTime, setReminderTime] = useState(
    initialData?.reminderTime || "",
  );
  const [priority, setPriority] = useState(initialData?.priority || "medium");
  const [category, setCategory] = useState(initialData?.category || "personal");
  const [subtasks, setSubtasks] = useState(initialData?.subtasks || []);
  const [subText, setSubText] = useState("");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [estimatedTime, setEstimatedTime] = useState(
    initialData?.estimatedTime || "",
  );
  const [recurring, setRecurring] = useState(initialData?.recurring || false);
  const [recurringInterval, setRecurringInterval] = useState(
    initialData?.recurringInterval || "daily",
  );

  const handleSubmit = () => {
    if (!text.trim() || !date) return;
    onSubmit({
      text: text.trim(),
      date,
      reminderTime: reminderTime || "",
      notified: false,
      priority,
      category,
      subtasks,
      notes: notes.trim(),
      estimatedTime: estimatedTime ? Number(estimatedTime) : null,
      recurring,
      recurringInterval: recurring ? recurringInterval : null,
    });
    handleClose();
  };

  const handleClose = () => {
    setText("");
    setDate("");
    setReminderTime("");
    setPriority("medium");
    setCategory("personal");
    setSubtasks([]);
    setSubText("");
    setNotes("");
    setEstimatedTime("");
    setRecurring(false);
    setRecurringInterval("daily");
    onClose();
  };

  /**
   * Ajoute une sous-tâche avec un ID unique garanti via crypto.randomUUID().
   * Corrige le bug où deux sous-tâches avec le même texte avaient la même clé React.
   */
  const addSubtask = () => {
    if (subText.trim()) {
      setSubtasks([
        ...subtasks,
        {
          id: crypto.randomUUID(),
          text: subText.trim(),
          done: false,
        },
      ]);
      setSubText("");
    }
  };

  const removeSubtask = (id) => {
    setSubtasks(subtasks.filter((sub) => sub.id !== id));
  };

  // Reset form when initialData changes (opening for edit)
  React.useEffect(() => {
    if (open && initialData) {
      setText(initialData.text || "");
      setDate(initialData.date || "");
      setReminderTime(initialData.reminderTime || "");
      setPriority(initialData.priority || "medium");
      setCategory(initialData.category || "personal");
      // Assurer que les sous-tâches existantes ont un id (rétro-compatibilité)
      setSubtasks(
        (initialData.subtasks || []).map((sub, i) => ({
          id: sub.id || `legacy-${i}-${Date.now()}`,
          text: sub.text,
          done: sub.done || false,
        })),
      );
      setNotes(initialData.notes || "");
      setEstimatedTime(initialData.estimatedTime || "");
      setRecurring(initialData.recurring || false);
      setRecurringInterval(initialData.recurringInterval || "daily");
    } else if (open && !initialData) {
      setText("");
      setDate("");
      setReminderTime("");
      setPriority("medium");
      setCategory("personal");
      setSubtasks([]);
      setNotes("");
      setEstimatedTime("");
      setRecurring(false);
      setRecurringInterval("daily");
    }
  }, [open, initialData]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {isEdit ? "Modifier la Tâche" : "Nouvelle Tâche"}
        <IconButton onClick={handleClose} size="small">
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: "8px !important" }}>
        <TextField
          fullWidth
          autoFocus
          label="Qu'est-ce que tu dois faire ?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 2,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <TextField
            fullWidth
            type="date"
            label="Date d'échéance"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: 1 }}
          />
          <TextField
            fullWidth
            type="time"
            label="Heure de rappel (optionnelle)"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: 1 }}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Priorité</InputLabel>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              label="Priorité"
            >
              {priorities.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Catégorie</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Catégorie"
            >
              {categories.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Temps estimé */}
        <TextField
          fullWidth
          type="number"
          label="⏱️ Temps estimé (minutes)"
          value={estimatedTime}
          onChange={(e) => setEstimatedTime(e.target.value)}
          slotProps={{ input: { inputProps: { min: 0, max: 480 } } }}
          size="small"
          sx={{ mb: 2 }}
        />

        {/* Tâche récurrente */}
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  🔄 Tâche récurrente
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Une nouvelle occurrence sera créée automatiquement quand tu la
                  valides
                </Typography>
              </Box>
            }
          />
          {recurring && (
            <FormControl fullWidth size="small" sx={{ mt: 1.5 }}>
              <InputLabel>Fréquence de récurrence</InputLabel>
              <Select
                value={recurringInterval}
                onChange={(e) => setRecurringInterval(e.target.value)}
                label="Fréquence de récurrence"
              >
                {recurringOptions.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Notes */}
        <TextField
          fullWidth
          multiline
          rows={2}
          label="📝 Notes (optionnelles)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 2 }}
          size="small"
        />

        {/* Subtasks */}
        <Typography
          variant="subtitle2"
          sx={{ mb: 1, fontWeight: 600, color: "text.secondary" }}
        >
          Sous-tâches
        </Typography>
        {subtasks.map((sub) => (
          <Box
            key={sub.id}
            sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
          >
            <Chip
              label={sub.text}
              size="small"
              variant="outlined"
              sx={{ flex: 1, justifyContent: "flex-start" }}
            />
            <IconButton
              size="small"
              onClick={() => removeSubtask(sub.id)}
              color="error"
            >
              <DeleteOutlineRounded fontSize="small" />
            </IconButton>
          </Box>
        ))}
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Ajouter une sous-tâche..."
            value={subText}
            onChange={(e) => setSubText(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addSubtask())
            }
          />
          <IconButton onClick={addSubtask} color="primary" size="small">
            <AddRounded />
          </IconButton>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} sx={{ borderRadius: 3 }}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{ borderRadius: 3 }}
          disabled={!text.trim() || !date}
        >
          {isEdit ? "Sauvegarder" : "Ajouter"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
