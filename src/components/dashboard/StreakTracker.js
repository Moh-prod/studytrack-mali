import React from 'react';
import { Card, CardContent, Typography, Box, useTheme, alpha, Tooltip } from '@mui/material';
import { getMonthDays, getToday, formatShortDate } from '../../utils/dateUtils';
import { motion } from 'framer-motion';

const milestones = [
  { days: 7, label: '7j', emoji: '⭐' },
  { days: 14, label: '14j', emoji: '🌟' },
  { days: 30, label: '30j', emoji: '💎' },
  { days: 60, label: '60j', emoji: '👑' },
  { days: 100, label: '100j', emoji: '🏆' },
];

export default function StreakTracker({ currentStreak, longestStreak, activeDates }) {
  const theme = useTheme();
  const today = getToday();
  const last30 = getMonthDays();
  const activeDatesSet = new Set(activeDates || []);

  return (
    <Card sx={{ p: 0 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          🔥 Ton Streak
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start' }}>
          {/* Streak counter */}
          <Box sx={{ textAlign: 'center', minWidth: 140 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <Box
                sx={{
                  width: 100, height: 100, borderRadius: '50%', mx: 'auto', mb: 1,
                  background: currentStreak > 0
                    ? 'linear-gradient(135deg, #F59E0B, #EF4444)'
                    : alpha(theme.palette.text.secondary, 0.1),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: currentStreak > 0 ? '0 8px 32px rgba(245,158,11,0.3)' : 'none',
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 900, color: currentStreak > 0 ? '#FFF' : 'text.secondary' }}>
                  {currentStreak}
                </Typography>
              </Box>
            </motion.div>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              jours consécutifs
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
              🏆 Record : {longestStreak} jours
            </Typography>
          </Box>

          {/* Heatmap */}
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, fontWeight: 500 }}>
              30 derniers jours
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {last30.map((day) => {
                const isActive = activeDatesSet.has(day);
                const isToday = day === today;
                return (
                  <Tooltip key={day} title={`${formatShortDate(day)} ${isActive ? '✅' : ''}`} arrow>
                    <Box
                      sx={{
                        width: 18, height: 18, borderRadius: 1,
                        backgroundColor: isActive
                          ? alpha('#7C3AED', 0.8)
                          : alpha(theme.palette.text.secondary, 0.08),
                        border: isToday ? '2px solid #06B6D4' : 'none',
                        transition: 'all 0.2s ease',
                        cursor: 'default',
                        '&:hover': {
                          transform: 'scale(1.3)',
                          backgroundColor: isActive
                            ? '#7C3AED'
                            : alpha(theme.palette.text.secondary, 0.15),
                        },
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* Milestones */}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
          {milestones.map((m) => {
            const unlocked = longestStreak >= m.days;
            return (
              <Tooltip key={m.days} title={`${m.label} ${unlocked ? '(Débloqué !)' : '(Verrouillé)'}`}>
                <Box
                  sx={{
                    px: 1.5, py: 0.8, borderRadius: 2,
                    background: unlocked
                      ? alpha('#7C3AED', 0.12)
                      : alpha(theme.palette.text.secondary, 0.06),
                    border: `1px solid ${unlocked ? alpha('#7C3AED', 0.3) : 'transparent'}`,
                    opacity: unlocked ? 1 : 0.4,
                    fontSize: '0.85rem', fontWeight: 600,
                    animation: unlocked ? 'glow 3s ease-in-out infinite' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {m.emoji} {m.label}
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
