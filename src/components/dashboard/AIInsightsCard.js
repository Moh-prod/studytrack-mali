import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, alpha, useTheme, IconButton, Skeleton } from '@mui/material';
import { AutoAwesomeRounded, RefreshRounded } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDashboardInsights } from '../../utils/aiService';

export default function AIInsightsCard({ tasks, habits, streak }) {
  const theme = useTheme();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async (force = false) => {
    setLoading(true);
    if (force) {
      // Clear cache to force refresh
      const cacheKey = `studytrack_ai_insights_dashboard_${new Date().toISOString().split('T')[0]}`;
      localStorage.removeItem(cacheKey);
    }
    const data = await generateDashboardInsights({ tasks, habits, streak });
    setInsights(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loading && (!insights || insights.length === 0)) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card
        sx={{
          mb: 3,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute', top: -50, right: -50,
            width: 150, height: 150, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, rgba(0,0,0,0) 70%)',
          }}
        />
        
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: 2,
                  background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#FFF', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                }}
              >
                <AutoAwesomeRounded fontSize="small" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
                Conseils du Coach IA
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => fetchInsights(true)} disabled={loading} sx={{ color: 'text.secondary' }}>
              <RefreshRounded fontSize="small" sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            <AnimatePresence mode="wait">
              {loading ? (
                [0, 1, 2].map((i) => (
                  <motion.div key={`skel-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.background.paper, 0.5), borderRadius: 3 }}>
                      <Skeleton variant="circular" width={28} height={28} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="90%" />
                      <Skeleton variant="text" width="60%" />
                    </Box>
                  </motion.div>
                ))
              ) : (
                insights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                  >
                    <Box
                      sx={{
                        p: 2, height: '100%',
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                        borderRadius: 3,
                        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                        backdropFilter: 'blur(10px)',
                        display: 'flex', flexDirection: 'column', gap: 1
                      }}
                    >
                      <Typography sx={{ fontSize: '1.4rem' }}>{insight.icon}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.5 }}>
                        {insight.text}
                      </Typography>
                    </Box>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}
