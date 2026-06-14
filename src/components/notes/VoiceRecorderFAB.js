import React, { memo } from 'react';
import { Box, Typography, IconButton, alpha } from '@mui/material';
import {
  StopRounded, PauseRounded, PlayArrowRounded, DeleteRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Composant flottant affiché quand un enregistrement vocal est en cours.
 * Visible sur toutes les pages tant que l'enregistrement est actif.
 */
function VoiceRecorderFAB({
  isRecording,
  isPaused,
  formattedDuration,
  onStop,
  onPause,
  onResume,
  onCancel,
}) {
  if (!isRecording) return null;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          py: 1.2,
          borderRadius: 8,
          background: 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95))',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(239,68,68,0.4), 0 2px 8px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        {/* Pulsating recording indicator */}
        <motion.div
          animate={{
            scale: isPaused ? [1, 1] : [1, 1.4, 1],
            opacity: isPaused ? 0.5 : [1, 0.6, 1],
          }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#fff',
              boxShadow: '0 0 8px rgba(255,255,255,0.6)',
            }}
          />
        </motion.div>

        {/* Timer */}
        <Typography
          sx={{
            color: '#fff',
            fontWeight: 700,
            fontSize: '1rem',
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
            minWidth: 52,
            textAlign: 'center',
          }}
        >
          {formattedDuration}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            color: alpha('#fff', 0.8),
            fontWeight: 600,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {isPaused ? 'Pause' : 'REC'}
        </Typography>

        {/* Controls */}
        <Box sx={{ display: 'flex', gap: 0.5, ml: 0.5 }}>
          {/* Pause/Resume */}
          <IconButton
            size="small"
            onClick={isPaused ? onResume : onPause}
            sx={{
              color: '#fff',
              backgroundColor: alpha('#fff', 0.15),
              '&:hover': { backgroundColor: alpha('#fff', 0.25) },
              width: 32,
              height: 32,
            }}
          >
            {isPaused ? <PlayArrowRounded fontSize="small" /> : <PauseRounded fontSize="small" />}
          </IconButton>

          {/* Stop (save) */}
          <IconButton
            size="small"
            onClick={onStop}
            sx={{
              color: '#fff',
              backgroundColor: alpha('#fff', 0.2),
              '&:hover': { backgroundColor: alpha('#fff', 0.35) },
              width: 32,
              height: 32,
            }}
          >
            <StopRounded fontSize="small" />
          </IconButton>

          {/* Cancel (discard) */}
          <IconButton
            size="small"
            onClick={onCancel}
            sx={{
              color: alpha('#fff', 0.7),
              '&:hover': { color: '#fff', backgroundColor: alpha('#fff', 0.15) },
              width: 32,
              height: 32,
            }}
          >
            <DeleteRounded fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </motion.div>
  );
}

export default memo(VoiceRecorderFAB);
