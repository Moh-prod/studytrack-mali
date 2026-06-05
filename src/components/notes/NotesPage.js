import React, { useState, useMemo, memo } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Slide, Snackbar,
  InputAdornment, alpha,
} from '@mui/material';
import {
  AddRounded, SearchRounded, PushPinRounded, PushPinOutlined,
  DeleteRounded, CloseRounded,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../layout/PageContainer';
import ConfirmDialog from '../common/ConfirmDialog';
import useNotes from '../../hooks/useNotes';
import { formatDate } from '../../utils/dateUtils';

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);
const noteColors = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#6366F1'];

function NotesPage({ user }) {
  const { notes, addNote, updateNote, deleteNote, togglePin } = useNotes(user);
  const [search, setSearch] = useState('');
  const [editNote, setEditNote] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#7C3AED');
  const [delNote, setDelNote] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '' });

  const filtered = useMemo(() => notes
    .filter((n) => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (n.title || '').toLowerCase().includes(s) || (n.content || '').toLowerCase().includes(s);
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    }), [notes, search]);

  const openNew = () => {
    setEditNote(null);
    setTitle('');
    setContent('');
    setColor('#7C3AED');
    setFormOpen(true);
  };

  const openEdit = (note) => {
    setEditNote(note);
    setTitle(note.title || '');
    setContent(note.content || '');
    setColor(note.color || '#7C3AED');
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (editNote) {
      await updateNote(editNote.id, { title, content, color });
      setSnack({ open: true, msg: 'Note modifiée !' });
    } else {
      await addNote({ title, content, color });
      setSnack({ open: true, msg: 'Note ajoutée !' });
    }
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (delNote) {
      await deleteNote(delNote.id);
      setDelNote(null);
      setSnack({ open: true, msg: 'Note supprimée.' });
    }
  };

  return (
    <PageContainer title="Mes Notes" subtitle="Capture tes idées rapidement">
      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
        <TextField
          size="small" fullWidth placeholder="Rechercher une note..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>,
            },
          }}
        />
        <Button variant="contained" startIcon={<AddRounded />} onClick={openNew} sx={{ whiteSpace: 'nowrap' }}>
          Nouvelle note
        </Button>
      </Box>

      {/* Notes Grid */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography variant="h1" sx={{ fontSize: 64, mb: 2 }}>📝</Typography>
          <Typography variant="h6">Aucune note</Typography>
          <Typography variant="body2">Commence à écrire !</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            columns: { xs: 1, sm: 2, md: 3 },
            columnGap: 2,
          }}
        >
          <AnimatePresence>
            {filtered.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
                style={{ breakInside: 'avoid', marginBottom: 16 }}
              >
                <Card
                  onClick={() => openEdit(note)}
                  sx={{
                    cursor: 'pointer',
                    borderTop: `4px solid ${note.color || '#7C3AED'}`,
                    '&:hover': {
                      transform: 'translateY(-4px) scale(1.01)',
                      boxShadow: `0 12px 40px ${alpha(note.color || '#7C3AED', 0.15)}`,
                    },
                    ...(note.pinned && {
                      boxShadow: `0 0 0 1px ${alpha(note.color || '#7C3AED', 0.3)}`,
                    }),
                  }}
                >
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2 } }}>
                    {/* Pin */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      {note.title && (
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, flex: 1 }}>
                          {note.title}
                        </Typography>
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); togglePin(note); }}
                        sx={{ color: note.pinned ? note.color : 'text.secondary', ml: 0.5 }}
                      >
                        {note.pinned ? <PushPinRounded fontSize="small" /> : <PushPinOutlined fontSize="small" />}
                      </IconButton>
                    </Box>

                    {note.content && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary', mb: 1.5, lineHeight: 1.6,
                          display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {note.content}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {formatDate(note.createdAt?.substring(0, 10))}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setDelNote(note); }}
                        color="error"
                      >
                        <DeleteRounded fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} TransitionComponent={Transition} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
          {editNote ? 'Modifier la Note' : 'Nouvelle Note'}
          <IconButton onClick={() => setFormOpen(false)} size="small"><CloseRounded /></IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth autoFocus label="Titre" value={title}
            onChange={(e) => setTitle(e.target.value)} sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth multiline rows={6} label="Contenu" value={content}
            onChange={(e) => setContent(e.target.value)} sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>Couleur</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {noteColors.map((c) => (
              <Box
                key={c} onClick={() => setColor(c)}
                sx={{
                  width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                  backgroundColor: c, transition: 'all 0.2s',
                  border: color === c ? '3px solid white' : 'none',
                  boxShadow: color === c ? `0 0 12px ${c}` : 'none',
                  '&:hover': { transform: 'scale(1.15)' },
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSave}>Sauvegarder</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(delNote)} title="Supprimer cette note ?"
        message={`"${delNote?.title || 'Sans titre'}" sera supprimée.`}
        onConfirm={handleDelete} onCancel={() => setDelNote(null)}
      />

      <Snackbar
        open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
        message={snack.msg} TransitionComponent={Transition}
      />
    </PageContainer>
  );
}

export default memo(NotesPage);
