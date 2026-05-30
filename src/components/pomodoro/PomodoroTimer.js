import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, IconButton, Slider, Collapse,
  useTheme, alpha, Tooltip,
} from '@mui/material';
import {
  PlayArrowRounded, PauseRounded, ReplayRounded, SkipNextRounded,
  SettingsRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import PageContainer from '../layout/PageContainer';
import { usePomodoro } from '../../context/PomodoroContext';

export default function PomodoroTimer() {
  const theme = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  const {
    workMin,
    breakMin,
    longBreakMin,
    longBreakAfter,
    isWork,
    timeLeft,
    running,
    sessions,
    progress,
    start,
    pause,
    reset,
    skip,
    updateWorkMin,
    updateBreakMin,
    updateLongBreakMin,
  } = usePomodoro();

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // SVG circle dimensions
  const size = 280;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  const circleColor = isWork ? '#7C3AED' : '#10B981';

  return (
    <PageContainer title="Pomodoro" subtitle="Concentre-toi et sois productif">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {/* Timer Circle */}
        <motion.div
          animate={running ? { scale: [1, 1.02, 1] } : {}}
          transition={running ? { repeat: Infinity, duration: 2 } : {}}
        >
          <Box sx={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke={alpha(circleColor, 0.12)}
                strokeWidth={stroke}
              />
              {/* Progress circle */}
              <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke={circleColor}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            {/* Center content */}
            <Box
              sx={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Typography variant="h2" sx={{ fontWeight: 900, color: circleColor, fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(timeLeft)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.5 }}>
                {isWork ? '💻 Travail' : '☕ Pause'}
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* Controls */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Tooltip title="Réinitialiser">
            <IconButton onClick={reset} sx={{ bgcolor: alpha(theme.palette.text.secondary, 0.08), p: 1.5 }}>
              <ReplayRounded />
            </IconButton>
          </Tooltip>
          <Tooltip title={running ? 'Pause' : 'Démarrer'}>
            <IconButton
              onClick={() => running ? pause() : start()}
              sx={{
                p: 2.5,
                background: `linear-gradient(135deg, ${circleColor}, ${isWork ? '#06B6D4' : '#059669'})`,
                color: '#FFF',
                boxShadow: `0 6px 24px ${alpha(circleColor, 0.4)}`,
                '&:hover': { boxShadow: `0 8px 32px ${alpha(circleColor, 0.5)}` },
              }}
            >
              {running ? <PauseRounded sx={{ fontSize: 32 }} /> : <PlayArrowRounded sx={{ fontSize: 32 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Passer">
            <IconButton onClick={skip} sx={{ bgcolor: alpha(theme.palette.text.secondary, 0.08), p: 1.5 }}>
              <SkipNextRounded />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Session counter */}
        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          🍅 {sessions} session{sessions > 1 ? 's' : ''} complétée{sessions > 1 ? 's' : ''}
        </Typography>

        {/* Settings */}
        <Card sx={{ width: '100%', maxWidth: 500 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mb: showSettings ? 2 : 0 }}
              onClick={() => setShowSettings(!showSettings)}
            >
              <SettingsRounded fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Paramètres
              </Typography>
            </Box>
            <Collapse in={showSettings}>
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>Travail : {workMin} min</Typography>
                <Slider
                  value={workMin} onChange={(_, v) => updateWorkMin(v)}
                  min={15} max={60} step={5}
                  sx={{ color: '#7C3AED', mb: 2 }}
                />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>Pause : {breakMin} min</Typography>
                <Slider
                  value={breakMin} onChange={(_, v) => updateBreakMin(v)}
                  min={3} max={15} step={1}
                  sx={{ color: '#10B981', mb: 2 }}
                />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>Pause longue : {longBreakMin} min (après {longBreakAfter} sessions)</Typography>
                <Slider
                  value={longBreakMin} onChange={(_, v) => updateLongBreakMin(v)}
                  min={10} max={30} step={5}
                  sx={{ color: '#06B6D4' }}
                />
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
}
