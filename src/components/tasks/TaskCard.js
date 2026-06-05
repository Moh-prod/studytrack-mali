import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  Card, CardContent, Box, Typography, IconButton, Chip, LinearProgress,
  Checkbox, Collapse, alpha, Tooltip,
} from '@mui/material';
import {
  CheckCircleRounded, CheckCircleOutlineRounded, EditRounded,
  DeleteRounded, ExpandMoreRounded, ExpandLessRounded, AccessTimeRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getRelativeDate, isOverdue } from '../../utils/dateUtils';

const priorityConfig = {
  urgent: { label: 'Urgente', color: '#EF4444' },
  high: { label: 'Haute', color: '#F59E0B' },
  medium: { label: 'Moyenne', color: '#06B6D4' },
  low: { label: 'Basse', color: '#10B981' },
};

const categoryConfig = {
  study: { label: 'Étude', emoji: '📚' },
  work: { label: 'Travail', emoji: '💼' },
  personal: { label: 'Personnel', emoji: '🏠' },
  health: { label: 'Santé', emoji: '💪' },
  creativity: { label: 'Créativité', emoji: '🎨' },
};

function TaskCard({ task, onToggle, onEdit, onDelete, onUpdateTask }) {
  const [showSubs, setShowSubs] = useState(false);
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const category = categoryConfig[task.category] || categoryConfig.personal;
  const overdue = isOverdue(task.date) && !task.done;

  const subtasks = useMemo(() => task.subtasks || [], [task.subtasks]);
  const subDone = subtasks.filter((s) => s.done).length;

  const toggleSubtask = useCallback((index) => {
    const updated = subtasks.map((s, i) =>
      i === index ? { ...s, done: !s.done } : s
    );
    onUpdateTask(task.id, { subtasks: updated });
  }, [subtasks, onUpdateTask, task.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        sx={{
          mb: 1.5, position: 'relative', overflow: 'visible',
          borderLeft: `4px solid ${priority.color}`,
          animation: overdue ? 'glow 3s ease-in-out infinite' : 'none',
          opacity: task.done ? 0.7 : 1,
          '&:hover .task-actions': { opacity: 1 },
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            {/* Toggle */}
            <IconButton
              size="small"
              onClick={() => onToggle(task)}
              sx={{ mt: -0.3, color: task.done ? 'success.main' : 'text.secondary' }}
            >
              {task.done ? <CheckCircleRounded /> : <CheckCircleOutlineRounded />}
            </IconButton>

            {/* Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  textDecoration: task.done ? 'line-through' : 'none',
                  color: overdue ? 'error.main' : 'text.primary',
                  mb: 0.5,
                }}
              >
                {task.text}
              </Typography>

              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip
                  label={priority.label}
                  size="small"
                  sx={{
                    height: 22, fontSize: '0.7rem', fontWeight: 600,
                    backgroundColor: alpha(priority.color, 0.12),
                    color: priority.color, border: `1px solid ${alpha(priority.color, 0.3)}`,
                  }}
                />
                <Chip
                  label={`${category.emoji} ${category.label}`}
                  size="small"
                  sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
                  variant="outlined"
                />
                {task.reminderTime && (
                  <Chip
                    icon={<AccessTimeRounded sx={{ fontSize: '0.85rem !important', color: 'primary.main' }} />}
                    label={`Rappel à ${task.reminderTime}`}
                    size="small"
                    sx={{
                      height: 22, fontSize: '0.7rem', fontWeight: 600,
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                      color: 'primary.main', border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  />
                )}
                <Typography variant="caption" sx={{ color: overdue ? 'error.main' : 'text.secondary', fontWeight: overdue ? 600 : 400 }}>
                  {getRelativeDate(task.date)}
                </Typography>
              </Box>

              {/* Subtasks summary */}
              {subtasks.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                    onClick={() => setShowSubs(!showSubs)}
                  >
                    <LinearProgress
                      variant="determinate"
                      value={subtasks.length > 0 ? (subDone / subtasks.length) * 100 : 0}
                      sx={{ flex: 1, height: 4, borderRadius: 2 }}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {subDone}/{subtasks.length}
                    </Typography>
                    {showSubs ? <ExpandLessRounded fontSize="small" /> : <ExpandMoreRounded fontSize="small" />}
                  </Box>
                  <Collapse in={showSubs}>
                    <Box sx={{ mt: 1 }}>
                      {subtasks.map((sub, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Checkbox
                            size="small"
                            checked={sub.done}
                            onChange={() => toggleSubtask(i)}
                            sx={{ p: 0.3 }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ textDecoration: sub.done ? 'line-through' : 'none', color: 'text.secondary' }}
                          >
                            {sub.text}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              )}
            </Box>

            {/* Actions */}
            <Box
              className="task-actions"
              sx={{
                display: 'flex', gap: 0.3,
                opacity: { xs: 1, md: 0 }, transition: 'opacity 0.2s',
              }}
            >
              <Tooltip title="Modifier">
                <IconButton size="small" onClick={() => onEdit(task)} color="primary">
                  <EditRounded fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Supprimer">
                <IconButton size="small" onClick={() => onDelete(task)} color="error">
                  <DeleteRounded fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { priorityConfig, categoryConfig };
export default memo(TaskCard);
