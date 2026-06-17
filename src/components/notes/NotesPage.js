import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Slide, Snackbar,
  InputAdornment, alpha, Chip, LinearProgress, Tooltip,
} from '@mui/material';
import {
  AddRounded, SearchRounded, PushPinRounded, PushPinOutlined,
  DeleteRounded, CloseRounded, MicRounded, StopRounded,
  PlayArrowRounded, PauseRounded, GraphicEqRounded, FiberManualRecordRounded,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../layout/PageContainer';
import ConfirmDialog from '../common/ConfirmDialog';
import useNotes from '../../hooks/useNotes';
import useVoiceRecorder from '../../hooks/useVoiceRecorder';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { formatDate } from '../../utils/dateUtils';

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);
const noteColors = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#6366F1'];

// ─── Global-aware AudioPlayer mini-component ────────────────────────────────
function AudioPlayer({ audioData, noteId, duration: storedDuration }) {
  const { toggle, isPlaying, progress, duration, isCurrentSrc } = useAudioPlayer();
  const active = isCurrentSrc(audioData);

  const fmt = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const displayDuration = active && duration ? duration : (storedDuration || 0);
  const displayProgress = active ? progress : 0;
  const playing = active && isPlaying;

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
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, playing ? 0.25 : 0.12)}`,
        mt: 1,
        transition: 'all 0.3s ease',
        ...(playing && {
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
          boxShadow: (theme) => `0 0 12px ${alpha(theme.palette.primary.main, 0.15)}`,
        }),
      }}
    >
      <IconButton
        size="small"
        onClick={() => toggle(audioData, noteId)}
        sx={{
          width: 30,
          height: 30,
          color: 'primary.main',
          backgroundColor: (theme) => alpha(theme.palette.primary.main, playing ? 0.2 : 0.1),
          '&:hover': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.25) },
          transition: 'all 0.2s ease',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={playing ? 'pause' : 'play'}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'flex' }}
          >
            {playing ? <PauseRounded sx={{ fontSize: 16 }} /> : <PlayArrowRounded sx={{ fontSize: 16 }} />}
          </motion.div>
        </AnimatePresence>
      </IconButton>

      <Box sx={{ flex: 1, cursor: 'pointer' }}>
        <LinearProgress
          variant="determinate"
          value={displayProgress}
          sx={{
            height: 4,
            borderRadius: 2,
            '& .MuiLinearProgress-bar': {
              borderRadius: 2,
              transition: playing ? 'transform 0.1s linear' : 'none',
            },
          }}
        />
      </Box>

      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600, minWidth: 32 }}>
        {fmt(displayDuration)}
      </Typography>

      {playing && (
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        >
          <GraphicEqRounded sx={{ fontSize: 14, color: 'primary.main' }} />
        </motion.div>
      )}
    </Box>
  );
}

// ─── Recording control bar inside dialog ────────────────────────────────────
function RecordingBar({ voiceRecorder, onStop }) {
  const pct = voiceRecorder.maxDuration
    ? (voiceRecorder.duration / voiceRecorder.maxDuration) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          borderRadius: 2,
          backgroundColor: alpha('#EF4444', 0.06),
          border: `1px solid ${alpha('#EF4444', 0.2)}`,
          mb: 0,
        }}
      >
        {/* Pulsating dot */}
        <motion.div
          animate={voiceRecorder.isPaused
            ? { scale: 1, opacity: 0.4 }
            : { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }
          }
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <FiberManualRecordRounded sx={{ color: '#EF4444', fontSize: 14 }} />
        </motion.div>

        {/* Timer */}
        <Typography
          sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#EF4444', fontSize: '1rem', minWidth: 52 }}
        >
          {voiceRecorder.formattedDuration}
        </Typography>

        {/* Progress bar (max duration) */}
        <Box sx={{ flex: 1 }}>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              height: 3,
              borderRadius: 2,
              backgroundColor: alpha('#EF4444', 0.15),
              '& .MuiLinearProgress-bar': { backgroundColor: '#EF4444', borderRadius: 2 },
            }}
          />
        </Box>

        {/* Status label */}
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
          {voiceRecorder.isPaused ? 'En pause' : 'REC'}
        </Typography>

        {/* Pause/Resume */}
        <Tooltip title={voiceRecorder.isPaused ? 'Reprendre' : 'Pause'}>
          <IconButton
            size="small"
            onClick={voiceRecorder.isPaused ? voiceRecorder.resumeRecording : voiceRecorder.pauseRecording}
            sx={{ color: voiceRecorder.isPaused ? '#10B981' : '#F59E0B', width: 30, height: 30 }}
          >
            {voiceRecorder.isPaused
              ? <PlayArrowRounded fontSize="small" />
              : <PauseRounded fontSize="small" />
            }
          </IconButton>
        </Tooltip>

        {/* Stop (save recording) */}
        <Tooltip title="Terminer et attacher">
          <IconButton
            size="small"
            onClick={onStop}
            sx={{
              color: '#fff',
              backgroundColor: '#EF4444',
              '&:hover': { backgroundColor: '#DC2626' },
              width: 30,
              height: 30,
            }}
          >
            <StopRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </motion.div>
  );
}

// ─── Main NotesPage ──────────────────────────────────────────────────────────
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

  // Audio state for the dialog
  const [dialogAudioUrl, setDialogAudioUrl] = useState(null);
  const [dialogAudioDuration, setDialogAudioDuration] = useState(0);
  const [dialogHasNewAudio, setDialogHasNewAudio] = useState(false);

  // ── Track whether we are "collecting" after stop (to hide bar immediately) ──
  const [isCollecting, setIsCollecting] = useState(false);

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
    setIsCollecting(false);
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
    setIsCollecting(false);
    setFormOpen(true);
  };

  const handleStartVoiceNote = () => {
    openNew();
    voiceRecorder.startRecording();
  };

  // ── Stop: IMMEDIATELY hide recording bar (isCollecting = true) ──────────
  const handleStopAndAttach = useCallback(() => {
    voiceRecorder.stopRecording(); // async: triggers onstop → sets audioUrl
    setIsCollecting(true);         // hide bar right away
  }, [voiceRecorder]);

  // ── When audioUrl arrives after stop, attach it ────────────────────────
  React.useEffect(() => {
    if (isCollecting && voiceRecorder.audioUrl) {
      setDialogAudioUrl(voiceRecorder.audioUrl);
      setDialogAudioDuration(voiceRecorder.duration);
      setDialogHasNewAudio(true);
      setIsCollecting(false);
    }
  }, [isCollecting, voiceRecorder.audioUrl, voiceRecorder.duration]);

  const handleCloseDialog = () => {
    setFormOpen(false);
    voiceRecorder.cancelRecording();
    setIsCollecting(false);
  };

  const handleSave = async () => {
    let audioData = editNote?.audioData || null;
    let audioDuration = editNote?.audioDuration || 0;

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
        updateData.audioData = null;
        updateData.audioDuration = 0;
      }
      await updateNote(editNote.id, updateData);
      setSnack({ open: true, msg: 'Note modifiée ✓' });
    } else {
      await addNote({ title, content, color, audioData, audioDuration });
      setSnack({ open: true, msg: audioData ? 'Note vocale ajoutée ! 🎤' : 'Note ajoutée ✓' });
    }
    setFormOpen(false);
    voiceRecorder.cancelRecording();
    setIsCollecting(false);
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

  // Is recording bar visible? Only when actively recording AND not yet collecting
  const showRecordingBar = voiceRecorder.isRecording && !isCollecting;

  return (
    <PageContainer title="Mes Notes" subtitle="Capture tes idées rapidement">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
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
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="outlined"
            startIcon={<MicRounded />}
            onClick={handleStartVoiceNote}
            disabled={voiceRecorder.isRecording}
            sx={{
              whiteSpace: 'nowrap',
              borderColor: '#EF4444',
              color: '#EF4444',
              '&:hover': { borderColor: '#DC2626', backgroundColor: alpha('#EF4444', 0.06) },
              '&.Mui-disabled': { opacity: 0.5 },
            }}
          >
            Note vocale
          </Button>
        </motion.div>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button variant="contained" startIcon={<AddRounded />} onClick={openNew} sx={{ whiteSpace: 'nowrap' }}>
            Nouvelle note
          </Button>
        </motion.div>
      </Box>

      {/* ── Recording error ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {voiceRecorder.error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Box sx={{
              mb: 2, p: 1.5, borderRadius: 2,
              backgroundColor: alpha('#EF4444', 0.08),
              border: `1px solid ${alpha('#EF4444', 0.2)}`,
            }}>
              <Typography variant="body2" sx={{ color: '#EF4444', fontWeight: 600 }}>
                ⚠️ {voiceRecorder.error}
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notes Grid ──────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Typography variant="h1" sx={{ fontSize: 64, mb: 2 }}>📝</Typography>
            <Typography variant="h6">Aucune note</Typography>
            <Typography variant="body2">Commence à écrire ou enregistre une note vocale !</Typography>
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
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 28 }}
                style={{ breakInside: 'avoid', marginBottom: 16 }}
              >
                <Card
                  onClick={() => openEdit(note)}
                  sx={{
                    cursor: 'pointer',
                    borderTop: `4px solid ${note.color || '#7C3AED'}`,
                    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    '&:hover': {
                      transform: 'translateY(-5px) scale(1.01)',
                      boxShadow: `0 16px 48px ${alpha(note.color || '#7C3AED', 0.18)}`,
                    },
                    '&:active': { transform: 'translateY(-2px) scale(1.005)' },
                    ...(note.pinned && {
                      boxShadow: `0 0 0 1px ${alpha(note.color || '#7C3AED', 0.35)}`,
                    }),
                  }}
                >
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2 } }}>
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
                            label={`${Math.floor((note.audioDuration || 0) / 60)}:${String(Math.round((note.audioDuration || 0) % 60)).padStart(2, '0')}`}
                            size="small"
                            sx={{
                              height: 22, fontSize: '0.7rem', fontWeight: 600, mb: 0.5,
                              backgroundColor: alpha('#EF4444', 0.1),
                              color: '#EF4444',
                              border: `1px solid ${alpha('#EF4444', 0.2)}`,
                              '& .MuiChip-icon': { color: '#EF4444' },
                            }}
                          />
                        )}
                      </Box>
                      <Tooltip title={note.pinned ? 'Désépingler' : 'Épingler'}>
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); togglePin(note); }}
                          sx={{ color: note.pinned ? note.color : 'text.secondary', ml: 0.5 }}
                        >
                          {note.pinned ? <PushPinRounded fontSize="small" /> : <PushPinOutlined fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {note.content && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary', mb: 1.5, lineHeight: 1.6,
                          display: '-webkit-box', WebkitLineClamp: 5,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}
                      >
                        {note.content}
                      </Typography>
                    )}

                    {note.audioData && (
                      <AudioPlayer
                        audioData={note.audioData}
                        noteId={note.id}
                        duration={note.audioDuration}
                      />
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {formatDate(note.createdAt?.substring(0, 10))}
                      </Typography>
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); setDelNote(note); }}
                          color="error"
                        >
                          <DeleteRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
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
            backgroundImage: 'none',
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {editNote ? '✏️ Modifier la Note' : '📝 Nouvelle Note'}
          </Box>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth autoFocus label="Titre" value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2, mt: 0.5 }}
          />
          <TextField
            fullWidth multiline rows={6} label="Contenu" value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* ── Voice recording section ─────────────────────────────────── */}
          <Box sx={{ mb: 2 }}>
            <AnimatePresence mode="wait">
              {showRecordingBar ? (
                // Recording in progress — bar visible
                <RecordingBar
                  key="recording"
                  voiceRecorder={voiceRecorder}
                  onStop={handleStopAndAttach}
                />
              ) : isCollecting ? (
                // Collecting audio after stop — show spinner
                <motion.div
                  key="collecting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                    borderRadius: 2, backgroundColor: alpha('#7C3AED', 0.06),
                    border: `1px solid ${alpha('#7C3AED', 0.15)}`,
                  }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <GraphicEqRounded sx={{ color: '#7C3AED', fontSize: 18 }} />
                    </motion.div>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Traitement audio…
                    </Typography>
                  </Box>
                </motion.div>
              ) : dialogAudioUrl ? (
                // Audio attached — player + remove button
                <motion.div
                  key="player"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <AudioPlayer
                      audioData={dialogAudioUrl}
                      noteId="dialog-preview"
                      duration={dialogAudioDuration}
                    />
                    <Tooltip title="Supprimer l'audio">
                      <IconButton
                        size="small"
                        onClick={removeAudioFromDialog}
                        sx={{
                          position: 'absolute', top: 2, right: -6,
                          width: 22, height: 22,
                          backgroundColor: 'error.main', color: '#fff',
                          '&:hover': { backgroundColor: 'error.dark' },
                        }}
                      >
                        <CloseRounded sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </motion.div>
              ) : (
                // No audio — show "add recording" button
                <motion.div
                  key="add"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<MicRounded />}
                    onClick={() => voiceRecorder.startRecording()}
                    fullWidth
                    sx={{
                      borderColor: alpha('#EF4444', 0.3),
                      color: '#EF4444',
                      borderStyle: 'dashed',
                      py: 1.2,
                      '&:hover': {
                        borderColor: '#EF4444',
                        backgroundColor: alpha('#EF4444', 0.04),
                      },
                    }}
                  >
                    Ajouter un enregistrement vocal
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>

          {/* ── Color picker ───────────────────────────────────────────── */}
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Couleur
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {noteColors.map((c) => (
              <motion.div key={c} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                <Box
                  onClick={() => setColor(c)}
                  sx={{
                    width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                    backgroundColor: c, transition: 'all 0.2s',
                    border: color === c ? '3px solid white' : '2px solid transparent',
                    boxShadow: color === c ? `0 0 14px ${c}` : 'none',
                    outline: color === c ? `2px solid ${c}` : 'none',
                  }}
                />
              </motion.div>
            ))}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={handleCloseDialog} sx={{ borderRadius: 2 }}>Annuler</Button>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={voiceRecorder.isRecording}
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
        message={`"${delNote?.title || 'Sans titre'}" sera supprimée.`}
        onConfirm={handleDelete}
        onCancel={() => setDelNote(null)}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
        message={snack.msg}
        TransitionComponent={Transition}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </PageContainer>
  );
}

export default memo(NotesPage);
