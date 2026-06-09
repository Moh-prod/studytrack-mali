import React, { memo } from 'react';
import {
  Box, Typography, Card, CardContent, alpha, useTheme, LinearProgress,
} from '@mui/material';
import {
  TrendingUpRounded, LightbulbRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import ProductivityScore from './ProductivityScore';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/**
 * Rapport hebdomadaire : graphique en barres + insights + score moyen
 */
function WeeklyReport({ entry }) {
  const theme = useTheme();

  if (!entry) return null;

  const dailyScores = entry.dailyScores || [];
  const maxScore = Math.max(...dailyScores.map((d) => d.score), 1);
  const insights = entry.insights || [];

  const getPeriodLabel = () => {
    const start = dayjs(entry.periodStart);
    const end = dayjs(entry.periodEnd);
    const monthsFr = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    if (start.month() === end.month()) {
      return `${start.date()} au ${end.date()} ${monthsFr[end.month()]} ${end.year()}`;
    }
    return `${start.date()} ${monthsFr[start.month()]} au ${end.date()} ${monthsFr[end.month()]} ${end.year()}`;
  };

  const getBarColor = (score) => {
    if (score >= 75) return '#10B981';
    if (score >= 50) return '#06B6D4';
    if (score >= 25) return '#7C3AED';
    return alpha(theme.palette.text.primary, 0.2);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Box
            sx={{
              px: 2, py: 0.4, borderRadius: 3,
              background: 'linear-gradient(135deg, #7C3AED20, #06B6D420)',
              border: `1px solid ${alpha('#7C3AED', 0.2)}`,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#7C3AED' }}>
              📅 RAPPORT HEBDOMADAIRE
            </Typography>
          </Box>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Semaine du {getPeriodLabel()}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {entry.tasksTotal || 0} tâches · {entry.habitsTotal || 0} check habitudes · {entry.pomodoroSessions || 0} Pomodoros
        </Typography>
      </Box>

      {/* Score moyen + stats */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' },
          gap: 2.5,
          mb: 3,
        }}
      >
        <Card
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.06))'
              : 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(6,182,212,0.03))',
            border: `1px solid ${alpha('#7C3AED', 0.15)}`,
          }}
        >
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, px: 4 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary', mb: 2 }}>
              Score moyen
            </Typography>
            <ProductivityScore score={entry.productivityScore || 0} size={130} />
          </CardContent>
        </Card>

        {/* Stats résumées */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[
                { label: 'Tâches complétées', value: `${entry.tasksDone || 0}/${entry.tasksTotal || 0}`, color: '#7C3AED', progress: entry.completionRate || 0 },
                { label: 'Habitudes respectées', value: `${entry.habitsDone || 0}/${entry.habitsTotal || 0}`, color: '#10B981', progress: entry.habitCompletionRate || 0 },
                { label: 'Sessions Pomodoro', value: `${entry.pomodoroSessions || 0}`, color: '#EF4444', progress: Math.min(((entry.pomodoroSessions || 0) / 20) * 100, 100) },
                { label: 'Meilleur jour', value: entry.bestDayDate ? `${entry.bestDayScore}/100` : '—', color: '#F59E0B', progress: entry.bestDayScore || 0 },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                      {s.label}
                    </Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: s.color, mb: 0.5 }}>
                      {s.value}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={s.progress}
                      sx={{
                        height: 4, borderRadius: 3,
                        '& .MuiLinearProgress-bar': { backgroundColor: s.color },
                        backgroundColor: alpha(s.color, 0.12),
                      }}
                    />
                  </Box>
                </motion.div>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Graphique barres par jour */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <TrendingUpRounded sx={{ color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Évolution du score par jour
            </Typography>
          </Box>
          {dailyScores.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
              Données insuffisantes pour cette semaine
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 140, px: 1 }}>
              {/* Remplir les 7 jours même si données manquantes */}
              {Array.from({ length: 7 }, (_, i) => {
                const dayDate = dayjs(entry.periodStart).add(i, 'day').format('YYYY-MM-DD');
                const dayData = dailyScores.find((d) => d.date === dayDate);
                const score = dayData?.score || 0;
                const barH = score > 0 ? Math.max((score / maxScore) * 100, 8) : 4;
                const color = getBarColor(score);

                return (
                  <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', fontWeight: 600 }}>
                      {score > 0 ? score : '—'}
                    </Typography>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${barH}%` }}
                      transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
                      style={{ width: '100%', borderRadius: 6, backgroundColor: color, minHeight: 4 }}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 }}>
                      {DAY_LABELS[i]}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LightbulbRounded sx={{ color: '#F59E0B' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Insights de la semaine
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                >
                  <Box
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      p: 1.5, borderRadius: 2,
                      backgroundColor: alpha('#F59E0B', 0.06),
                      border: `1px solid ${alpha('#F59E0B', 0.15)}`,
                    }}
                  >
                    <Typography sx={{ fontSize: '1.2rem', flexShrink: 0 }}>{insight.icon}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {insight.text}
                    </Typography>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default memo(WeeklyReport);
