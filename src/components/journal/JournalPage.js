import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Box, Typography, alpha, useTheme, CircularProgress, Drawer, IconButton,
  useMediaQuery, Fab,
} from '@mui/material';
import {
  MenuBookRounded, CloseRounded, AutoAwesomeRounded,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { SIDEBAR_WIDTH } from '../layout/Sidebar';

import useJournal from '../../hooks/useJournal';
import useStreak from '../../hooks/useStreak';
import JournalTimeline from './JournalTimeline';
import DailyReport from './DailyReport';
import WeeklyReport from './WeeklyReport';
import MonthlyReport from './MonthlyReport';
import dayjs from 'dayjs';

const PANEL_WIDTH = 240;

/**
 * Page principale du Journal StudyTrack.
 * Layout 3 zones : sidebar timeline | rapport détaillé
 * - Génère automatiquement le rapport du jour à la visite
 * - Navigation entre jours, semaines, mois
 */
function JournalPage({ user, tasks, habits }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const { currentStreak } = useStreak(tasks);

  const {
    entries, todayEntry,
    loading, ensureTodayReport, ensureWeekReport, updateEntry,
    getMonthEntries,
  } = useJournal(user, tasks, habits, currentStreak);

  // Génère automatiquement le rapport du jour à la visite
  useEffect(() => {
    if (user && !loading) {
      ensureTodayReport(null);
    }
  }, [user, loading, ensureTodayReport]);

  // Auto-sélectionne le rapport du jour au premier chargement
  useEffect(() => {
    if (!selectedEntry && todayEntry) {
      setSelectedEntry(todayEntry);
    } else if (!selectedEntry && entries.length > 0) {
      setSelectedEntry(entries[0]);
    }
  }, [todayEntry, entries, selectedEntry]);

  // Met à jour la sélection si l'entrée sélectionnée change (ex: humeur sauvegardée)
  useEffect(() => {
    if (selectedEntry) {
      const updated = entries.find((e) => e.id === selectedEntry.id);
      if (updated && updated !== selectedEntry) {
        setSelectedEntry(updated);
      }
    }
  }, [entries, selectedEntry]);

  const handleSelect = useCallback((entry) => {
    setSelectedEntry(entry);
    if (isMobile) setPanelOpen(false);

    // Si c'est un rapport hebdo, s'assurer qu'il est généré
    if (entry.type === 'weekly') {
      ensureWeekReport(entry.periodStart, entry.periodEnd);
    }
  }, [isMobile, ensureWeekReport]);

  // Données du mois pour le rapport mensuel
  const monthEntries = useMemo(() => {
    if (!selectedEntry) return [];
    const d = dayjs(selectedEntry.periodStart);
    return getMonthEntries(d.year(), d.month() + 1);
  }, [selectedEntry, getMonthEntries]);

  const renderReport = () => {
    if (!selectedEntry) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 2 }}>
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
            <Typography sx={{ fontSize: '4rem' }}>📓</Typography>
          </motion.div>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            Sélectionne un rapport dans la timeline
          </Typography>
        </Box>
      );
    }

    if (selectedEntry.type === 'daily') {
      return (
        <DailyReport
          key={selectedEntry.id}
          entry={selectedEntry}
          habits={habits}
          onUpdate={updateEntry}
        />
      );
    }
    if (selectedEntry.type === 'weekly') {
      return <WeeklyReport key={selectedEntry.id} entry={selectedEntry} />;
    }
    if (selectedEntry.type === 'monthly') {
      return (
        <MonthlyReport
          key={selectedEntry.id}
          entry={selectedEntry}
          dailyEntries={monthEntries}
        />
      );
    }
    return null;
  };

  const timelinePanel = (
    <Box
      sx={{
        width: PANEL_WIDTH,
        height: '100%',
        borderRight: `1px solid ${theme.palette.divider}`,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, rgba(15,14,23,0.95) 0%, rgba(26,26,46,0.95) 100%)'
          : 'linear-gradient(180deg, rgba(248,250,252,0.98) 0%, #fff 100%)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header timeline */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MenuBookRounded sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
              Mon Journal
            </Typography>
          </Box>
          {isMobile && (
            <IconButton size="small" onClick={() => setPanelOpen(false)}>
              <CloseRounded fontSize="small" />
            </IconButton>
          )}
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
          {entries.length} rapport{entries.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Timeline */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <JournalTimeline
            entries={entries}
            selectedId={selectedEntry?.id}
            onSelect={handleSelect}
          />
        )}
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        pt: { xs: 7, md: 8 },
        ml: { md: `${SIDEBAR_WIDTH}px` },
      }}
    >
      {/* Panel timeline desktop */}
      {!isMobile && timelinePanel}

      {/* Panel timeline mobile (Drawer) */}
      {isMobile && (
        <Drawer
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          variant="temporary"
          PaperProps={{ sx: { width: PANEL_WIDTH, pt: 8 } }}
        >
          {timelinePanel}
        </Drawer>
      )}

      {/* Zone de contenu principal */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: { xs: 2, md: 3 },
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(theme.palette.primary.main, 0.2),
            borderRadius: 4,
          },
        }}
      >
        {/* Header bannière */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box
            sx={{
              mb: 3, p: 2.5, borderRadius: 3,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.08) 100%)'
                : 'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(6,182,212,0.04) 100%)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 44, height: 44, borderRadius: 2.5, flexShrink: 0,
                background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
              }}
            >
              <MenuBookRounded sx={{ color: '#fff' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Journal de Productivité
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {todayEntry
                  ? `Rapport du jour généré · Score : ${todayEntry.productivityScore || 0}/100`
                  : 'Génération du rapport en cours...'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexShrink: 0 }}>
              <AutoAwesomeRounded sx={{ color: '#F59E0B', fontSize: '1rem' }} />
              <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                Auto-sync
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* Rapport sélectionné */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedEntry?.id || 'empty'}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {loading && !selectedEntry ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: 'primary.main' }} />
              </Box>
            ) : (
              renderReport()
            )}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* FAB mobile pour ouvrir la timeline */}
      {isMobile && (
        <Fab
          onClick={() => setPanelOpen(true)}
          size="medium"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5B21B6, #0891B2)',
            },
          }}
        >
          <MenuBookRounded />
        </Fab>
      )}
    </Box>
  );
}

export default memo(JournalPage);
