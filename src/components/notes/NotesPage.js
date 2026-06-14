import React, { useState, useMemo, useCallback, useRef, memo } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Slide, Snackbar,
  InputAdornment, alpha, Chip, LinearProgress,
} from '@mui/material';
import {
  AddRounded, SearchRounded, PushPinRounded, PushPinOutlined,
  DeleteRounded, CloseRounded, MicRounded, StopRounded,
  PlayArrowRounded, PauseRounded, GraphicEqRounded,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../layout/PageContainer';
import ConfirmDialog from '../common/ConfirmDialog';
import useNotes from '../../hooks/useNotes';
import useVoiceRecorder from '../../hooks/useVoiceRecorder';
import { formatDate } from '../../utils/dateUtils';

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);
const noteColors = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#6366F1'];

// ─── Audio Player mini-component ─────────────────────────────────────
function AudioPlayer({ audioData, duration }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = useCallback((e) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }, [playing]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && audioRef.current.duration) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    setProgress(0);
  }, []);

  const formatDur = (sec) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      onClick={(e) => e.stopPropagation()}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderRadius: 2,
        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.06),
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        mt: 1,
      }}
    >
      <audio
        ref={audioRef}
        src={audioData}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />
      <IconButton
        size="small"
        onClick={togglePlay}
        sx={{
          width: 28,
          height: 28,
          color: 'primary.main',
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
          '&:hover': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2) },
        }}
      >
        {playing ? <PauseRounded sx={{ fontSize: 16 }} /> : <PlayArrowRounded sx={{ fontSize: 16 }} />}
      </IconButton>
      <Box sx={{ flex: 1 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 3,
            borderRadius: 2,
            '& .MuiLinearProgress-bar': { borderRadius: 2 },
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 }}>
        {formatDur(duration)}
      </Typography>
      <GraphicEqRounded sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.5 }} />
    </Box>
  );
}

// ─── Main NotesPage ──────────────────────────────────────────────────
function NotesPage({ user }) {
  const { notes, addNote, updateNote, deleteNote, togglePin } = useNotes(user);
  const voiceRecorder = useVoiceRecorder();
  const [search, setSearch] = useState('');
  const [editNote, setEditNote] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#7C3AED');
  const [delNote, setDelNote] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '' });
  // Audio state for dialog
  const [dialogAudioUrl, setDialogAudioUrl] = useState(null);
  const [dialogAudioDuration, setDialogAudioDuration] = useState(0);
  const [dialogHasNewAudio, setDialogHasNewAudio] = useState(false);

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
    setDialogAudioUrl(null);
    setDialogAudioDuration(0);
    setDialogHasNewAudio(false);
    setFormOpen(true);
  };

  const openEdit = (note) => {
    setEditNote(note);
    setTitle(note.title || '');
    setContent(note.content || '');
    setColor(note.color || '#7C3AED');
    setDialogAudioUrl(note.audioData || null);
    setDialogAudioDuration(note.audioDuration || 0);
    setDialogHasNewAudio(false);
    setFormOpen(true);
  };

  // Start voice recording for a new note
  const handleStartVoiceNote = () => {
    openNew();
    voiceRecorder.startRecording();
  };

  // Stop and attach recording to dialog
  const handleStopAndAttach = async () => {
    voiceRecorder.stopRecording();
    // Wait a bit for the blob to be processed
    setTimeout(async () => {
      if (voiceRecorder.audioUrl) {
        setDialogAudioUrl(voiceRecorder.audioUrl);
        setDialogAudioDuration(voiceRecorder.duration);
        setDialogHasNewAudio(true);
      }
    }, 300);
  };

  // Watch for recording completion
  const handleRecordingStop = useCallback(async () => {
    if (voiceRecorder.audioUrl && !dialogAudioUrl) {
      setDialogAudioUrl(voiceRecorder.audioUrl);
      setDialogAudioDuration(voiceRecorder.duration);
      setDialogHasNewAudio(true);
    }
  }, [voiceRecorder.audioUrl, voiceRecorder.duration, dialogAudioUrl]);

  // Effect: when recording stops, auto-attach audio
  React.useEffect(() => {
    if (!voiceRecorder.isRecording && voiceRecorder.audioUrl && formOpen) {
      handleRecordingStop();
    }
  }, [voiceRecorder.isRecording, voiceRecorder.audioUrl, formOpen, handleRecordingStop]);

  const handleSave = async () => {
    let audioData = editNote?.audioData || null;
    let audioDuration = editNote?.audioDuration || 0;

    // If new audio was recorded, convert to base64
    if (dialogHasNewAudio && voiceRecorder.audioBlob) {
      try {
        audioData = await voiceRecorder.getAudioBase64();
        audioDuration = voiceRecorder.duration;
      } catch (e) {
        console.warn('Failed to encode audio:', e);
      }
    }

    if (editNote) {
      const updateData = { title, content, color };
      if (dialogHasNewAudio) {
        updateData.audioData = audioData;
        updateData.audioDuration = audioDuration;
      }
      if (dialogAudioUrl === null && editNote.audioData) {
        // Audio was removed
        updateData.audioData = null;
        updateData.audioDuration = 0;
      }
      await updateNote(editNote.id, updateData);
      setSnack({ open: true, msg: 'Note modifiée !' });
    } else {
      await addNote({ title, content, color, audioData, audioDuration });
      setSnack({ open: true, msg: audioData ? 'Note vocale ajoutée ! 🎤' : 'Note ajoutée !' });
    }
    setFormOpen(false);
    voiceRecorder.cancelRecording(); // Clean up recorder state
  };

  const handleDelete = async () => {
    if (delNote) {
      await deleteNote(delNote.id);
      setDelNote(null);
      setSnack({ open: true, msg: 'Note supprimée.' });
    }
  };

  const removeAudioFromDialog = () => {
    setDialogAudioUrl(null);
    setDialogAudioDuration(0);
    setDialogHasNewAudio(false);
  };

  return (
    <PageContainer title="Mes Notes" subtitle="Capture tes idées rapidement">
      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small" fullWidth placeholder="Rechercher une note..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 150 }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>,
            },
          }}
        />
        <Button
          variant="outlined"
          startIcon={<MicRounded />}
          onClick={handleStartVoiceNote}
          disabled={voiceRecorder.isRecording}
          sx={{
            whiteSpace: 'nowrap',
            borderColor: '#EF4444',
            color: '#EF4444',
            '&:hover': {
              borderColor: '#DC2626',
              backgroundColor: alpha('#EF4444', 0.06),
            },
          }}
        >
          Note vocale
        </Button>
        <Button variant="contained" startIcon={<AddRounded />} onClick={openNew} sx={{ whiteSpace: 'nowrap' }}>
          Nouvelle note
        </Button>
      </Box>

      {/* Recording error */}
      {voiceRecorder.error && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, backgroundColor: alpha('#EF4444', 0.08), border: `1px solid ${alpha('#EF4444', 0.2)}` }}>
          <Typography variant="body2" sx={{ color: '#EF4444', fontWeight: 600 }}>
            ⚠️ {voiceRecorder.error}
          </Typography>
        </Box>
      )}

      {/* Notes Grid */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography variant="h1" sx={{ fontSize: 64, mb: 2 }}>📝</Typography>
          <Typography variant="h6">Aucune note</Typography>
          <Typography variant="body2">Commence à écrire ou enregistre une note vocale !</Typography>
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
                    {/* Pin + Audio badge */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {note.title && (
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {note.title}
                          </Typography>
                        )}
                        {note.audioData && (
                          <Chip
                            icon={<MicRounded sx={{ fontSize: '0.8rem !important' }} />}
                            label={`${Math.floor((note.audioDuration || 0) / 60)}:${String((note.audioDuration || 0) % 60).padStart(2, '0')}`}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              backgroundColor: alpha('#EF4444', 0.1),
                              color: '#EF4444',
                              border: `1px solid ${alpha('#EF4444', 0.2)}`,
                              mb: 0.5,
                              '& .MuiChip-icon': { color: '#EF4444' },
                            }}
                          />
                        )}
                      </Box>
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

                    {/* Audio player on card */}
                    {note.audioData && (
                      <AudioPlayer audioData={note.audioData} duration={note.audioDuration} />
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
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
      <Dialog open={formOpen} onClose={() => { setFormOpen(false); voiceRecorder.cancelRecording(); }} TransitionComponent={Transition} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
          {editNote ? 'Modifier la Note' : 'Nouvelle Note'}
          <IconButton onClick={() => { setFormOpen(false); voiceRecorder.cancelRecording(); }} size="small"><CloseRounded /></IconButton>
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

          {/* Voice Recording controls in dialog */}
          <Box sx={{ mb: 2 }}>
            {voiceRecorder.isRecording ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: alpha('#EF4444', 0.06),
                  border: `1px solid ${alpha('#EF4444', 0.15)}`,
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EF4444' }} />
                </motion.div>
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#EF4444', fontSize: '0.95rem' }}>
                  {voiceRecorder.formattedDuration}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>
                  {voiceRecorder.isPaused ? 'En pause...' : 'Enregistrement en cours...'}
                </Typography>
                {voiceRecorder.isPaused ? (
                  <IconButton size="small" onClick={voiceRecorder.resumeRecording} sx={{ color: '#10B981' }}>
                    <PlayArrowRounded fontSize="small" />
                  </IconButton>
                ) : (
                  <IconButton size="small" onClick={voiceRecorder.pauseRecording} sx={{ color: '#F59E0B' }}>
                    <PauseRounded fontSize="small" />
                  </IconButton>
                )}
                <IconButton size="small" onClick={handleStopAndAttach} sx={{ color: '#EF4444' }}>
                  <StopRounded fontSize="small" />
                </IconButton>
              </Box>
            ) : dialogAudioUrl ? (
              <Box sx={{ position: 'relative' }}>
                <AudioPlayer audioData={dialogAudioUrl} duration={dialogAudioDuration} />
                <IconButton
                  size="small"
                  onClick={removeAudioFromDialog}
                  sx={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    backgroundColor: 'error.main',
                    color: '#fff',
                    '&:hover': { backgroundColor: 'error.dark' },
                  }}
                >
                  <CloseRounded sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>
            ) : (
              <Button
                variant="outlined"
                startIcon={<MicRounded />}
                onClick={() => voiceRecorder.startRecording()}
                fullWidth
                sx={{
                  borderColor: alpha('#EF4444', 0.3),
                  color: '#EF4444',
                  borderStyle: 'dashed',
                  '&:hover': {
                    borderColor: '#EF4444',
                    backgroundColor: alpha('#EF4444', 0.04),
                  },
                }}
              >
                Ajouter un enregistrement vocal
              </Button>
            )}
          </Box>

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
          <Button onClick={() => { setFormOpen(false); voiceRecorder.cancelRecording(); }}>Annuler</Button>
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
