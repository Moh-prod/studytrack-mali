import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, TextField, alpha, useTheme, Grid } from '@mui/material';
import PageContainer from '../layout/PageContainer';
import StatsCards from './StatsCards';
import ProgressChart from './ProgressChart';
import StreakTracker from './StreakTracker';
import MotivationalQuote from './MotivationalQuote';
import useStreak from '../../hooks/useStreak';
import { getToday, isOverdue } from '../../utils/dateUtils';
import { motion } from 'framer-motion';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { MailOutlineRounded, SendRounded } from '@mui/icons-material';

export default function Dashboard({ tasks, habits }) {
  const theme = useTheme();
  const { currentStreak, longestStreak, activeDates } = useStreak(tasks);
  const today = getToday();
  const todayTasks = tasks.filter((t) => t.date === today && !t.done);
  const overdueTasks = tasks.filter((t) => isOverdue(t.date) && !t.done);

  // Newsletter State
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email: email.trim(),
        subscribedAt: new Date().toISOString(),
      });
      setSuccess(true);
      setEmail('');
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* Newsletter Subscription */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card
          sx={{
            mt: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(6, 182, 212, 0.03) 100%)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 44, height: 44, borderRadius: 2.5,
                      background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#FFF', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)',
                    }}
                  >
                    <MailOutlineRounded />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    Rejoins la Newsletter StudyTrack
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 600 }}>
                  Reçois des conseils hebdomadaires exclusifs sur la productivité, des astuces d'apprentissage et reste informé des nouveautés de l'application StudyTrack Mali.
                </Typography>
              </Grid>
              <Grid item xs={12} md={5}>
                {success ? (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                    <Box sx={{ textAlign: 'center', py: 1.5, px: 2, bgcolor: alpha(theme.palette.success.main, 0.08), borderRadius: 3, border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>
                        🎉 Merci pour ton inscription !
                      </Typography>
                    </Box>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubscribe}>
                    <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                      <TextField
                        required
                        fullWidth
                        type="email"
                        placeholder="Ton adresse email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={submitting}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: theme.palette.background.paper,
                          }
                        }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={submitting}
                        startIcon={<SendRounded />}
                        sx={{
                          whiteSpace: 'nowrap',
                          px: 3, py: { xs: 1.5, sm: 0 },
                          borderRadius: 3,
                        }}
                      >
                        S'abonner
                      </Button>
                    </Box>
                  </form>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
    </PageContainer>
  );
}
