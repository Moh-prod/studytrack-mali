import React, { memo } from 'react';
import { Box, Typography, alpha, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { getScoreLevel } from '../../utils/journalUtils';

/**
 * Jauge circulaire animée affichant le Score de Productivité (0–100).
 * Design premium avec arc SVG dégradé et animation au montage.
 */
function ProductivityScore({ score = 0, size = 160, showLabel = true }) {
  const theme = useTheme();
  const level = getScoreLevel(score);

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  // L'arc couvre 270° (du bas-gauche au bas-droit), donc 75% de la circonférence
  const arcLength = circumference * 0.75;
  const fillLength = (score / 100) * arcLength;
  const gap = circumference - arcLength;

  // Couleur dynamique selon le score
  const getGradientColors = () => {
    if (score >= 75) return ['#10B981', '#06B6D4'];
    if (score >= 50) return ['#7C3AED', '#06B6D4'];
    if (score >= 25) return ['#F59E0B', '#7C3AED'];
    return ['#EF4444', '#F59E0B'];
  };
  const [color1, color2] = getGradientColors();
  const gradientId = `score-gradient-${size}`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(135deg)' }}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color1} />
              <stop offset="100%" stopColor={color2} />
            </linearGradient>
          </defs>
          {/* Piste de fond */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={alpha(theme.palette.mode === 'dark' ? '#fff' : '#000', 0.08)}
            strokeWidth={10}
            strokeDasharray={`${arcLength} ${gap + circumference - arcLength}`}
            strokeLinecap="round"
          />
          {/* Arc de progression animé */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: arcLength - fillLength }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
            style={{ filter: `drop-shadow(0 0 6px ${color1}80)` }}
          />
        </svg>

        {/* Score centré */}
        <Box
          sx={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          >
            <Typography
              sx={{
                fontSize: size > 120 ? '2rem' : '1.4rem',
                fontWeight: 900,
                lineHeight: 1,
                background: `linear-gradient(135deg, ${color1}, ${color2})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {score}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', fontWeight: 600 }}>
              /100
            </Typography>
          </motion.div>
        </Box>
      </Box>

      {showLabel && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Box
            sx={{
              px: 2, py: 0.6, borderRadius: 4,
              backgroundColor: alpha(level.color, 0.12),
              border: `1px solid ${alpha(level.color, 0.25)}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: level.color, fontSize: '0.75rem' }}
            >
              {level.label}
            </Typography>
          </Box>
        </motion.div>
      )}
    </Box>
  );
}

export default memo(ProductivityScore);
