import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import PageContainer from '../layout/PageContainer';
import StatsCards from './StatsCards';
import ProgressChart from './ProgressChart';
import StreakTracker from './StreakTracker';
import MotivationalQuote from './MotivationalQuote';
import useStreak from '../../hooks/useStreak';
import { getToday, isOverdue } from '../../utils/dateUtils';
import { motion } from 'framer-motion';

export default function Dashboard({ tasks, habits }) {
  const { currentStreak, longestStreak, activeDates } = useStreak(tasks);
  const today = getToday();
  const todayTasks = tasks.filter((t) => t.date === today && !t.done);
  const overdueTasks = tasks.filter((t) => isOverdue(t.date) && !t.done);

  return (
    <PageContainer title="Tableau de Bord" subtitle="Vue d'ensemble de ta progression">
      {/* Stats Cards */}
      <StatsCards tasks={tasks} streak={currentStreak} />

      {/* Chart + Quote Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 2.5,
          mb: 3,
        }}
      >
        <ProgressChart tasks={tasks} />
        <MotivationalQuote />
      </Box>

      {/* Streak */}
      <Box sx={{ mb: 3 }}>
        <StreakTracker
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          activeDates={activeDates}
        />
      </Box>

      {/* Quick Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2.5,
          }}
        >
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                📅 Aujourd'hui
              </Typography>
              {todayTasks.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                  ✅ Rien de prévu — profites-en !
                </Typography>
              ) : (
                todayTasks.map((t) => (
                  <Typography key={t.id} variant="body2" sx={{ mb: 0.5 }}>
                    • {t.text}
                  </Typography>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                ⚠️ En retard
              </Typography>
              {overdueTasks.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                  ✅ Aucune tâche en retard !
                </Typography>
              ) : (
                overdueTasks.slice(0, 5).map((t) => (
                  <Typography key={t.id} variant="body2" sx={{ color: 'error.main', mb: 0.5 }}>
                    • {t.text} ({t.date})
                  </Typography>
                ))
              )}
            </CardContent>
          </Card>
        </Box>
      </motion.div>
    </PageContainer>
  );
}
