import React, { useState, memo, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, alpha, useTheme,
  TextField, Divider, LinearProgress, Tabs, Tab,
} from '@mui/material';
import {
  CheckCircleRounded, WarningAmberRounded, RadioButtonUncheckedRounded,
  AssignmentTurnedInRounded, FitnessCenterRounded, TimerRounded, EditNoteRounded,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ProductivityScore from './ProductivityScore';
import MoodSelector from './MoodSelector';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

const CATEGORY_EMOJI = {
  study: '📚', work: '💼', personal: '🏠', health: '💪', creativity: '🎨',
};
const PRIORITY_COLOR = {
  urgent: '#EF4444', high: '#F59E0B', medium: '#06B6D4', low: '#10B981',
};

function TabPanel({ value, index, children }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2.5 }}>{children}</Box>}
    </div>
  );
}

/**
 * Affiche le rapport quotidien complet avec :
 * - Score de productivité animé
 * - Sélecteur d'humeur
 * - Note personnelle éditable
 * - Tâches complétées / en retard
 * - Habitudes du jour
 * - Sessions Pomodoro
 */
function DailyReport({ entry, habits, onUpdate }) {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [note, setNote] = useState(entry?.personalNote || '');
  const [savingNote, setSavingNote] = useState(false);

  const isToday = entry?.periodStart === dayjs().format('YYYY-MM-DD');

  const handleMoodChange = useCallback(async (mood) => {
    if (!onUpdate || !entry?.id) return;
    await onUpdate(entry.id, { mood });
  }, [onUpdate, entry?.id]);

  const handleNoteBlur = useCallback(async () => {
    if (!onUpdate || !entry?.id || note === entry?.personalNote) return;
    setSavingNote(true);
    await onUpdate(entry.id, { personalNote: note });
    setSavingNote(false);
  }, [onUpdate, entry?.id, note, entry?.personalNote]);

  if (!entry) return null;

  const completedTasks = entry.completedTasks || [];
  const completionRate = entry.completionRate || 0;
  const habitsDone = entry.habitsDone || 0;
  const habitsTotal = entry.habitsTotal || 0;
  const habitRate = entry.habitCompletionRate || 0;

  // Habitudes du jour avec statut
  const habitsForDay = habits.map((h) => ({
    ...h,
    done: (h.completedDates || []).includes(entry.periodStart),
  }));

  const dateLabel = (() => {
    const d = dayjs(entry.periodStart);
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    if (entry.periodStart === today) return "Aujourd'hui";
    if (entry.periodStart === yesterday) return 'Hier';
    return d.format('dddd D MMMM YYYY');
  })();

  return (
    <Box>
      {/* Header date */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, textTransform: 'capitalize' }}>
          {dateLabel}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Rapport quotidien · {entry.tasksTotal || 0} tâche{(entry.tasksTotal || 0) > 1 ? 's' : ''} prévues
        </Typography>
      </Box>

      {/* Score + Humeur */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2.5,
          mb: 3,
        }}
      >
        {/* Score de productivité */}
        <Card
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(124,58,237,0.04) 0%, rgba(6,182,212,0.03) 100%)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          }}
        >
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary', mb: 2 }}>
              Score du jour
            </Typography>
            <ProductivityScore score={entry.productivityScore || 0} size={140} />
          </CardContent>
        </Card>

        {/* Humeur + Note */}
        <Card>
          <CardContent sx={{ py: 2.5 }}>
            <MoodSelector
              value={entry.mood}
              onChange={isToday ? handleMoodChange : undefined}
              readOnly={!isToday}
            />
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <EditNoteRounded sx={{ color: 'text.secondary', mt: 0.5, fontSize: '1.1rem' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.7 }}>
                Note du jour
              </Typography>
            </Box>
            <TextField
              multiline
              rows={3}
              fullWidth
              placeholder={isToday ? "Comment s'est passée ta journée ? Notes, réflexions..." : 'Aucune note'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={handleNoteBlur}
              disabled={!isToday}
              variant="standard"
              sx={{
                mt: 0.5,
                '& .MuiInput-underline:before': { borderBottomColor: alpha(theme.palette.divider, 0.5) },
                '& textarea': { fontSize: '0.85rem', color: theme.palette.text.primary },
              }}
            />
            {savingNote && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                Sauvegarde...
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Stats rapides */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 3 }}>
        {[
          {
            icon: <AssignmentTurnedInRounded />,
            label: 'Tâches',
            value: `${entry.tasksDone || 0}/${entry.tasksTotal || 0}`,
            color: '#7C3AED',
            progress: completionRate,
          },
          {
            icon: <FitnessCenterRounded />,
            label: 'Habitudes',
            value: `${habitsDone}/${habitsTotal}`,
            color: '#10B981',
            progress: habitRate,
          },
          {
            icon: <TimerRounded />,
            label: 'Pomodoros',
            value: `${entry.pomodoroSessions || 0} sessions`,
            color: '#EF4444',
            progress: Math.min(((entry.pomodoroSessions || 0) / 8) * 100, 100),
          },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ color: stat.color, display: 'flex' }}>{stat.icon}</Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {stat.label}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', mb: 0.8 }}>
                  {stat.value}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={stat.progress}
                  sx={{
                    height: 5, borderRadius: 4,
                    '& .MuiLinearProgress-bar': { backgroundColor: stat.color, borderRadius: 4 },
                    backgroundColor: alpha(stat.color, 0.12),
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </Box>

      {/* Tabs : Tâches / Habitudes / Pomodoro */}
      <Card>
        <CardContent sx={{ pb: '16px !important' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ mb: 0, borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Tab label={`✅ Tâches (${completedTasks.length})`} sx={{ fontWeight: 600, fontSize: '0.82rem' }} />
            <Tab label={`🔥 Habitudes (${habitsForDay.length})`} sx={{ fontWeight: 600, fontSize: '0.82rem' }} />
            <Tab label={`⏱ Pomodoro`} sx={{ fontWeight: 600, fontSize: '0.82rem' }} />
          </Tabs>

          {/* Tâches complétées */}
          <TabPanel value={tab} index={0}>
            {completedTasks.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                Aucune tâche complétée ce jour
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <AnimatePresence>
                  {completedTasks.map((task, i) => (
                    <motion.div
                      key={task.id || i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Box
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 1.5,
                          p: 1.5, borderRadius: 2,
                          backgroundColor: task.wasLate
                            ? alpha('#F59E0B', 0.06)
                            : alpha('#10B981', 0.06),
                          border: `1px solid ${task.wasLate ? alpha('#F59E0B', 0.2) : alpha('#10B981', 0.2)}`,
                        }}
                      >
                        {task.wasLate
                          ? <WarningAmberRounded sx={{ color: '#F59E0B', fontSize: '1.1rem', flexShrink: 0 }} />
                          : <CheckCircleRounded sx={{ color: '#10B981', fontSize: '1.1rem', flexShrink: 0 }} />}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.text}
                          </Typography>
                          <Typography variant="caption" sx={{ color: task.wasLate ? '#F59E0B' : '#10B981', fontWeight: 500 }}>
                            {task.wasLate
                              ? `Terminé avec ${task.daysLate} j de retard`
                              : 'Terminé à temps ✓'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
                          <Chip
                            label={CATEGORY_EMOJI[task.category] || '📌'}
                            size="small"
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                          {task.priority && (
                            <Box
                              sx={{
                                width: 8, height: 8, borderRadius: '50%',
                                backgroundColor: PRIORITY_COLOR[task.priority] || '#06B6D4',
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Box>
            )}
          </TabPanel>

          {/* Habitudes */}
          <TabPanel value={tab} index={1}>
            {habitsForDay.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                Aucune habitude enregistrée
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: 1.5,
                }}
              >
                {habitsForDay.map((habit, i) => (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Box
                      sx={{
                        p: 1.5, borderRadius: 2.5,
                        display: 'flex', alignItems: 'center', gap: 1.2,
                        backgroundColor: habit.done
                          ? alpha(habit.color || '#7C3AED', 0.1)
                          : alpha(theme.palette.action.hover, 0.5),
                        border: `1px solid ${habit.done ? alpha(habit.color || '#7C3AED', 0.3) : 'transparent'}`,
                        opacity: habit.done ? 1 : 0.5,
                      }}
                    >
                      <Typography sx={{ fontSize: '1.3rem' }}>{habit.icon || '⭐'}</Typography>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {habit.name}
                        </Typography>
                        {habit.done
                          ? <CheckCircleRounded sx={{ fontSize: '0.75rem', color: habit.color || '#7C3AED' }} />
                          : <RadioButtonUncheckedRounded sx={{ fontSize: '0.75rem', color: 'text.disabled' }} />}
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            )}
          </TabPanel>

          {/* Pomodoro */}
          <TabPanel value={tab} index={2}>
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography sx={{ fontSize: '3rem', mb: 1 }}>⏱</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
                {entry.pomodoroSessions || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                sessions Pomodoro
              </Typography>
              {(entry.pomodoroMinutes || 0) > 0 && (
                <Chip
                  label={`${entry.pomodoroMinutes} minutes de focus`}
                  sx={{ backgroundColor: alpha('#EF4444', 0.1), color: '#EF4444', fontWeight: 600 }}
                />
              )}
              {(entry.pomodoroSessions || 0) === 0 && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  Aucune session ce jour. Lance le Pomodoro pour booster ta concentration !
                </Typography>
              )}
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}

export default memo(DailyReport);
