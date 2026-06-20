import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton, Button, alpha } from "@mui/material";
import {
  CloseRounded,
  PlayArrowRounded,
  CoffeeRounded,
  VolumeOffRounded,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { stopAlarm } from "../../utils/alarmSound";

/**
 * PomodoroNotification — Premium in-app toast notification
 *
 * Apparaît avec une animation slide-down depuis le haut.
 * Glassmorphism, icône animée, boutons d'action.
 * Auto-dismiss après 20 secondes avec barre de progression.
 */
export default function PomodoroNotification({
  notification,
  onDismiss,
  onAction,
}) {
  const [progressWidth, setProgressWidth] = useState(100);
  const isVisible = notification?.visible;
  const isWorkComplete = notification?.type === "work-complete";

  // Auto-dismiss timer with smooth progress bar
  useEffect(() => {
    if (!isVisible) return;

    const totalDuration = 20000; // 20s
    const startTime = Date.now();
    let animFrame;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / totalDuration) * 100);
      setProgressWidth(remaining);

      if (remaining > 0) {
        animFrame = requestAnimationFrame(updateProgress);
      } else {
        handleDismiss();
      }
    };

    animFrame = requestAnimationFrame(updateProgress);

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, notification?.title]);

  const handleDismiss = () => {
    stopAlarm();
    onDismiss?.();
  };

  const handleAction = () => {
    stopAlarm();
    onAction?.();
  };

  const handleStopSound = () => {
    stopAlarm();
  };

  // Theme colors based on notification type
  const colors = isWorkComplete
    ? {
        primary: "#7C3AED",
        secondary: "#06B6D4",
        gradient:
          "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(6,182,212,0.85))",
        bg: "rgba(124,58,237,0.12)",
        emoji: "🎉",
        actionLabel: "Démarrer la pause ☕",
        actionIcon: <CoffeeRounded sx={{ fontSize: 18, mr: 0.5 }} />,
      }
    : {
        primary: "#10B981",
        secondary: "#7C3AED",
        gradient:
          "linear-gradient(135deg, rgba(16,185,129,0.95), rgba(124,58,237,0.85))",
        bg: "rgba(16,185,129,0.12)",
        emoji: "🚀",
        actionLabel: "Reprendre le travail 💻",
        actionIcon: <PlayArrowRounded sx={{ fontSize: 18, mr: 0.5 }} />,
      };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -120, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -120, opacity: 0, scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            mass: 0.8,
          }}
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            width: "94%",
            maxWidth: 460,
            pointerEvents: "auto",
          }}
        >
          <Box
            sx={{
              position: "relative",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: `0 20px 60px ${alpha(colors.primary, 0.35)}, 0 8px 24px rgba(0,0,0,0.2)`,
            }}
          >
            {/* Glassmorphism background */}
            <Box
              sx={{
                background: colors.gradient,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                p: 2.5,
                pb: 2,
              }}
            >
              {/* Close button */}
              <IconButton
                onClick={handleDismiss}
                size="small"
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  color: "rgba(255,255,255,0.7)",
                  "&:hover": {
                    color: "#fff",
                    bgcolor: "rgba(255,255,255,0.15)",
                  },
                }}
              >
                <CloseRounded fontSize="small" />
              </IconButton>

              {/* Header with animated emoji */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1.5,
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.25, 1],
                    rotate: [0, -8, 8, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Typography sx={{ fontSize: 32, lineHeight: 1 }}>
                    {colors.emoji}
                  </Typography>
                </motion.div>

                <Box sx={{ flex: 1, mr: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "1.05rem",
                      lineHeight: 1.3,
                      textShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  >
                    {notification?.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(255,255,255,0.85)",
                      fontWeight: 500,
                      fontSize: "0.82rem",
                      mt: 0.3,
                    }}
                  >
                    {notification?.body}
                  </Typography>
                </Box>
              </Box>

              {/* Action buttons */}
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Button
                  onClick={handleAction}
                  variant="contained"
                  size="small"
                  sx={{
                    flex: 1,
                    bgcolor: "rgba(255,255,255,0.22)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    borderRadius: "12px",
                    textTransform: "none",
                    py: 1,
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.35)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                    },
                  }}
                  startIcon={colors.actionIcon}
                >
                  {colors.actionLabel}
                </Button>

                <IconButton
                  onClick={handleStopSound}
                  size="small"
                  sx={{
                    color: "rgba(255,255,255,0.7)",
                    bgcolor: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "12px",
                    px: 1.5,
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.25)",
                      color: "#fff",
                    },
                  }}
                >
                  <VolumeOffRounded fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Auto-dismiss progress bar */}
            <Box
              sx={{
                height: 3,
                background: "rgba(0,0,0,0.15)",
                position: "relative",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: `${progressWidth}%`,
                  background: "rgba(255,255,255,0.6)",
                  transition: "width 0.1s linear",
                  borderRadius: "0 4px 4px 0",
                }}
              />
            </Box>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
