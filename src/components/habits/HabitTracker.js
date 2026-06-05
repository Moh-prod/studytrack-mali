import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, IconButton, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Slide,
  useTheme, alpha, Tooltip, LinearProgress,
} from '@mui/material';
import { AddRounded, DeleteRounded } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../layout/PageContainer';
import ConfirmDialog from '../common/ConfirmDialog';
import { getCurrentWeekDates, getDayName, getToday } from '../../utils/dateUtils';

const emojiOptions = ['⭐', '📖', '🏃‍♂️', '🧘‍♂️', '💧', '🎯', '📝', '🎵', '💤', '🍎', '🧠', '💪'];
const colorOptions = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#6366F1'];

const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

// Props come from App.js — no internal useHabits call (eliminates double Firestore subscription)
function HabitTracker({ user, habits = [], addHabit, deleteHabit, toggleHabitDate }) {
  const theme = useTheme();
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [color, setColor] = useState('#7C3AED');
  const [delHabit, setDelHabit] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '' });

  // Memoize weekDates and today — stable for the whole day, computed once
  const weekDates = useMemo(() => getCurrentWeekDates(), []);
  const today = useMemo(() => getToday(), []);

  const handleAdd = useCallback(async () => {
    if (!name.trim()) return;
    await addHabit({ name: name.trim(), icon, color });
    setName('');
    setIcon('⭐');
    setColor('#7C3AED');
    setFormOpen(false);
    setSnack({ open: true, msg: 'Habitude ajoutée !' });
  }, [name, icon, color, addHabit]);

  const handleDelete = useCallback(async () => {
    if (delHabit) {
      await deleteHabit(delHabit.id);
      setDelHabit(null);
      setSnack({ open: true, msg: 'Habitude supprimée.' });
    }
  }, [delHabit, deleteHabit]);

  const getHabitStreak = useCallback((habit) => {
    const datesSet = new Set(habit.completedDates || []);
    let streak = 0;
    const check = new Date(today);
    if (!datesSet.has(today)) check.setDate(check.getDate() - 1);
    while (true) {
      const ds = check.toISOString().substring(0, 10);
      if (datesSet.has(ds)) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else break;
    }
    return streak;
  }, [today]);

  const getWeekRate = useCallback((habit) => {
    const datesSet = new Set(habit.completedDates || []);
    const done = weekDates.filter((d) => datesSet.has(d)).length;
    return Math.round((done / 7) * 100);
  }, [weekDates]);

  const handleCloseSnack = useCallback(() => setSnack(s => ({ ...s, open: false })), []);

  return (
    <PageContainer title="Suivi d'Habitudes" subtitle="Construis ta discipline quotidienne">
      {/* Add button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained" startIcon={<AddRounded />}
          onClick={() => setFormOpen(true)}
          sx={{ borderRadius: 3 }}
        >
          Nouvelle habitude
        </Button>
      </Box>

      {/* Habits list */}
      {habits.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography variant="h1" sx={{ fontSize: 64, mb: 2 }}>💪</Typography>
          <Typography variant="h6">Ajoute ta première habitude !</Typography>
          <Typography variant="body2">Commence à construire ta routine quotidienne.</Typography>
        </Box>
      ) : (
        <AnimatePresence>
          {habits.map((habit, i) => {
            const streak = getHabitStreak(habit);
            const rate = getWeekRate(habit);
            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card sx={{ mb: 2, borderLeft: `4px solid ${habit.color}` }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      {/* Icon + Name */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 160 }}>
                        <Box sx={{
                          width: 40, height: 40, borderRadius: 2.5,
                          backgroundColor: alpha(habit.color, 0.12),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 20,
                        }}>
                          {habit.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {habit.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            🔥 {streak}j | {rate}% cette semaine
                          </Typography>
                        </Box>
                      </Box>

                      {/* Week checkboxes */}
                      <Box sx={{ display: 'flex', gap: 0.8, flex: 1, justifyContent: 'center' }}>
                        {weekDates.map((date) => {
                          const checked = (habit.completedDates || []).includes(date);
                          const isToday = date === today;
                          const isFuture = date > today;
                          return (
                            <Tooltip key={date} title={getDayName(date)}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', display: 'block' }}>
                                  {getDayName(date)}
                                </Typography>
                                <Checkbox
                                  checked={checked}
                                  disabled={isFuture}
                                  onChange={() => toggleHabitDate(habit, date)}
                                  sx={{
                                    p: 0.4,
                                    color: isToday ? habit.color : undefined,
                                    '&.Mui-checked': { color: habit.color },
                                    border: isToday ? `2px solid ${habit.color}` : 'none',
                                    borderRadius: 1,
                                  }}
                                  size="small"
                                />
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Box>

                      {/* Progress + Delete */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 60 }}>
                          <LinearProgress
                            variant="determinate" value={rate}
                            sx={{
                              height: 6, borderRadius: 3,
                              '& .MuiLinearProgress-bar': { backgroundColor: habit.color },
                            }}
                          />
                        </Box>
                        <IconButton size="small" onClick={() => setDelHabit(habit)} color="error">
                          <DeleteRounded fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {/* Add Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} TransitionComponent={Transition} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Nouvelle Habitude</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth autoFocus label="Nom de l'habitude" value={name}
            onChange={(e) => setName(e.target.value)} sx={{ mb: 2, mt: 1 }}
          />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Icône</Typography>
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2 }}>
            {emojiOptions.map((e) => (
              <Box
                key={e} onClick={() => setIcon(e)}
                sx={{
                  width: 40, height: 40, borderRadius: 2, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, transition: 'all 0.2s',
                  backgroundColor: icon === e ? alpha(color, 0.15) : alpha(theme.palette.text.secondary, 0.05),
                  border: icon === e ? `2px solid ${color}` : '2px solid transparent',
                  '&:hover': { transform: 'scale(1.1)' },
                }}
              >
                {e}
              </Box>
            ))}
          </Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Couleur</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {colorOptions.map((c) => (
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
          <Button variant="contained" onClick={handleAdd} disabled={!name.trim()}>Ajouter</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(delHabit)} title="Supprimer cette habitude ?"
        message={`"${delHabit?.name}" sera supprimée.`}
        onConfirm={handleDelete} onCancel={() => setDelHabit(null)}
      />

      <Snackbar
        open={snack.open} autoHideDuration={3000}
        onClose={handleCloseSnack}
        message={snack.msg} TransitionComponent={Transition}
      />
    </PageContainer>
  );
}

export default memo(HabitTracker);
