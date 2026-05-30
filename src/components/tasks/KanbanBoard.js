import React from 'react';
import { Box, Typography, Paper, Chip, alpha } from '@mui/material';
import TaskCard from './TaskCard';
import { AnimatePresence } from 'framer-motion';

const columns = [
  { key: 'todo', label: 'À Faire', color: '#06B6D4', emoji: '📋' },
  { key: 'doing', label: 'En Cours', color: '#F59E0B', emoji: '🔨' },
  { key: 'done', label: 'Terminé', color: '#10B981', emoji: '✅' },
];

export default function KanbanBoard({ tasks, onToggle, onEdit, onDelete, onUpdateTask }) {

  const moveTask = (task, newStatus) => {
    const done = newStatus === 'done';
    onUpdateTask(task.id, {
      status: newStatus,
      done,
      completedAt: done ? new Date().toISOString() : null,
    });
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 2,
        minHeight: 400,
      }}
    >
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => (t.status || (t.done ? 'done' : 'todo')) === col.key);
        return (
          <Paper
            key={col.key}
            elevation={0}
            sx={{
              p: 2, borderRadius: 3,
              backgroundColor: alpha(col.color, 0.04),
              border: `1px solid ${alpha(col.color, 0.15)}`,
              minHeight: 200,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {col.emoji} {col.label}
              </Typography>
              <Chip
                label={colTasks.length}
                size="small"
                sx={{
                  height: 22, fontSize: '0.75rem', fontWeight: 700,
                  backgroundColor: alpha(col.color, 0.15),
                  color: col.color,
                }}
              />
            </Box>

            <AnimatePresence>
              {colTasks.length === 0 ? (
                <Box
                  sx={{
                    py: 4, textAlign: 'center',
                    border: `2px dashed ${alpha(col.color, 0.2)}`,
                    borderRadius: 2, color: 'text.secondary', fontSize: '0.85rem',
                  }}
                >
                  Aucune tâche
                </Box>
              ) : (
                colTasks.map((task) => (
                  <Box key={task.id} sx={{ mb: 0.5 }}>
                    <TaskCard
                      task={task}
                      onToggle={onToggle}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onUpdateTask={onUpdateTask}
                    />
                    {/* Move buttons */}
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1, justifyContent: 'center' }}>
                      {columns
                        .filter((c) => c.key !== col.key)
                        .map((c) => (
                          <Chip
                            key={c.key}
                            label={`→ ${c.label}`}
                            size="small"
                            onClick={() => moveTask(task, c.key)}
                            sx={{
                              fontSize: '0.65rem', height: 20, cursor: 'pointer',
                              backgroundColor: alpha(c.color, 0.1),
                              color: c.color,
                              '&:hover': { backgroundColor: alpha(c.color, 0.2) },
                            }}
                          />
                        ))}
                    </Box>
                  </Box>
                ))
              )}
            </AnimatePresence>
          </Paper>
        );
      })}
    </Box>
  );
}
