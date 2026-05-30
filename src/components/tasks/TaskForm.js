import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  Box, Select, MenuItem, FormControl, InputLabel, IconButton, Typography,
  Slide, Chip,
} from '@mui/material';
import { AddRounded, CloseRounded, DeleteOutlineRounded } from '@mui/icons-material';

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

const priorities = [
  { value: 'urgent', label: '🔴 Urgente' },
  { value: 'high', label: '🟠 Haute' },
  { value: 'medium', label: '🔵 Moyenne' },
  { value: 'low', label: '🟢 Basse' },
];

const categories = [
  { value: 'study', label: '📚 Étude' },
  { value: 'work', label: '💼 Travail' },
  { value: 'personal', label: '🏠 Personnel' },
  { value: 'health', label: '💪 Santé' },
  { value: 'creativity', label: '🎨 Créativité' },
];

export default function TaskForm({ open, onClose, onSubmit, initialData }) {
  const isEdit = Boolean(initialData);
  const [text, setText] = useState(initialData?.text || '');
  const [date, setDate] = useState(initialData?.date || '');
  const [priority, setPriority] = useState(initialData?.priority || 'medium');
  const [category, setCategory] = useState(initialData?.category || 'personal');
  const [subtasks, setSubtasks] = useState(initialData?.subtasks || []);
  const [subText, setSubText] = useState('');

  const handleSubmit = () => {
    if (!text.trim() || !date) return;
    onSubmit({
      text: text.trim(),
      date,
      priority,
      category,
      subtasks,
    });
    handleClose();
  };

  const handleClose = () => {
    setText('');
    setDate('');
    setPriority('medium');
    setCategory('personal');
    setSubtasks([]);
    setSubText('');
    onClose();
  };

  const addSubtask = () => {
    if (subText.trim()) {
      setSubtasks([...subtasks, { text: subText.trim(), done: false }]);
      setSubText('');
    }
  };

  const removeSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  // Reset form when initialData changes (opening for edit)
  React.useEffect(() => {
    if (open && initialData) {
      setText(initialData.text || '');
      setDate(initialData.date || '');
      setPriority(initialData.priority || 'medium');
      setCategory(initialData.category || 'personal');
      setSubtasks(initialData.subtasks || []);
    } else if (open && !initialData) {
      setText('');
      setDate('');
      setPriority('medium');
      setCategory('personal');
      setSubtasks([]);
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
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {isEdit ? 'Modifier la Tâche' : 'Nouvelle Tâche'}
        <IconButton onClick={handleClose} size="small"><CloseRounded /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <TextField
          fullWidth autoFocus label="Qu'est-ce que tu dois faire ?"
          value={text} onChange={(e) => setText(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth type="date" label="Date d'échéance"
          value={date} onChange={(e) => setDate(e.target.value)}
          sx={{ mb: 2 }}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Priorité</InputLabel>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)} label="Priorité">
              {priorities.map((p) => (
                <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Catégorie</InputLabel>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} label="Catégorie">
              {categories.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Subtasks */}
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
          Sous-tâches
        </Typography>
        {subtasks.map((sub, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Chip label={sub.text} size="small" variant="outlined" sx={{ flex: 1, justifyContent: 'flex-start' }} />
            <IconButton size="small" onClick={() => removeSubtask(i)} color="error">
              <DeleteOutlineRounded fontSize="small" />
            </IconButton>
          </Box>
        ))}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField
            size="small" fullWidth placeholder="Ajouter une sous-tâche..."
            value={subText} onChange={(e) => setSubText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
          />
          <IconButton onClick={addSubtask} color="primary" size="small">
            <AddRounded />
          </IconButton>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} sx={{ borderRadius: 3 }}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" sx={{ borderRadius: 3 }} disabled={!text.trim() || !date}>
          {isEdit ? 'Sauvegarder' : 'Ajouter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
