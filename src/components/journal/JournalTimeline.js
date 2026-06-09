import React, { memo, useMemo } from 'react';
import {
  Box, Typography, Divider, alpha, useTheme,
} from '@mui/material';
import {
  TodayRounded, CalendarViewWeekRounded, CalendarMonthRounded,
  ChevronRightRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { getScoreLevel } from '../../utils/journalUtils';

/**
 * Panneau de navigation latéral du journal.
 * Affiche une timeline : Aujourd'hui → Jours précédents → Semaines → Mois
 */
function JournalTimeline({ entries, selectedId, onSelect }) {
  const theme = useTheme();

  // Grouper les entrées quotidiennes par semaine puis par mois
  const groups = useMemo(() => {
    const daily = entries.filter((e) => e.type === 'daily');
    const weekly = entries.filter((e) => e.type === 'weekly');

    // 7 derniers jours

    const last7 = Array.from({ length: 7 }, (_, i) =>
      dayjs().subtract(i, 'day').format('YYYY-MM-DD')
    );
    const recentDaily = daily.filter((e) => last7.includes(e.periodStart));

    // Semaines (sans les 7 derniers jours)
    const olderDaily = daily.filter((e) => !last7.includes(e.periodStart));

    return { recentDaily, weekly, olderDaily };
  }, [entries]);

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const monthsFr = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

  const getDayLabel = (dateStr) => {
    const d = dayjs(dateStr);
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    if (dateStr === today) return "Aujourd'hui";
    if (dateStr === yesterday) return 'Hier';
    return `${dayNames[d.day()]} ${d.date()} ${monthsFr[d.month()]}`;
  };

  const renderEntry = (entry) => {
    const isSelected = selectedId === entry.id;
    const level = getScoreLevel(entry.productivityScore || 0);
    const isToday = entry.periodStart === dayjs().format('YYYY-MM-DD');

    return (
      <motion.div
        key={entry.id}
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.98 }}
      >
        <Box
          onClick={() => onSelect(entry)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.2,
            mx: 1,
            mb: 0.3,
            borderRadius: 2.5,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: isSelected
              ? alpha(theme.palette.primary.main, 0.12)
              : 'transparent',
            borderLeft: isSelected
              ? `3px solid ${theme.palette.primary.main}`
              : '3px solid transparent',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.06),
            },
          }}
        >
          {/* Indicateur score */}
          <Box
            sx={{
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: entry.productivityScore > 0 ? level.color : alpha(theme.palette.text.primary, 0.2),
              flexShrink: 0,
              boxShadow: entry.productivityScore > 0 ? `0 0 6px ${alpha(level.color, 0.6)}` : 'none',
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: isSelected || isToday ? 700 : 500,
                color: isSelected ? 'primary.main' : 'text.primary',
                fontSize: '0.82rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {entry.type === 'daily'
                ? getDayLabel(entry.periodStart)
                : entry.type === 'weekly'
                ? `Sem. ${dayjs(entry.periodStart).week?.() || ''}  ${dayjs(entry.periodStart).date()} ${monthsFr[dayjs(entry.periodStart).month()]}`
                : `${monthsFr[dayjs(entry.periodStart).month()].charAt(0).toUpperCase() + monthsFr[dayjs(entry.periodStart).month()].slice(1)} ${dayjs(entry.periodStart).year()}`}
            </Typography>
            {entry.productivityScore > 0 && (
              <Typography variant="caption" sx={{ color: level.color, fontWeight: 600, fontSize: '0.7rem' }}>
                {entry.productivityScore}/100
              </Typography>
            )}
          </Box>
          {entry.mood && (
            <Typography sx={{ fontSize: '0.9rem' }}>
              {entry.mood === 'great' ? '🔥' : entry.mood === 'good' ? '😊' : entry.mood === 'okay' ? '😐' : entry.mood === 'hard' ? '😓' : '😞'}
            </Typography>
          )}
          {isSelected && <ChevronRightRounded sx={{ fontSize: '1rem', color: 'primary.main' }} />}
        </Box>
      </motion.div>
    );
  };

  const SectionHeader = ({ icon, label }) => (
    <Box sx={{ px: 3, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon}
      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary', fontSize: '0.7rem' }}>
        {label}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        py: 1.5,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: alpha(theme.palette.primary.main, 0.2), borderRadius: 4 },
      }}
    >
      {/* Jours récents */}
      {groups.recentDaily.length > 0 && (
        <>
          <SectionHeader
            icon={<TodayRounded sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />}
            label="7 derniers jours"
          />
          {groups.recentDaily.map(renderEntry)}
        </>
      )}

      {/* Rapports hebdomadaires */}
      {groups.weekly.length > 0 && (
        <>
          <Divider sx={{ my: 1.5, mx: 2, opacity: 0.4 }} />
          <SectionHeader
            icon={<CalendarViewWeekRounded sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />}
            label="Semaines"
          />
          {groups.weekly.map(renderEntry)}
        </>
      )}

      {/* Jours plus anciens groupés */}
      {groups.olderDaily.length > 0 && (
        <>
          <Divider sx={{ my: 1.5, mx: 2, opacity: 0.4 }} />
          <SectionHeader
            icon={<CalendarMonthRounded sx={{ fontSize: '0.85rem', color: 'text.secondary' }} />}
            label="Historique"
          />
          {groups.olderDaily.map(renderEntry)}
        </>
      )}

      {entries.length === 0 && (
        <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Aucune entrée encore
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default memo(JournalTimeline);
