import React, { memo } from "react";
import {
  Box,
  Typography,
  IconButton,
  alpha,
  LinearProgress,
} from "@mui/material";
import {
  StopRounded,
  PauseRounded,
  PlayArrowRounded,
  DeleteRounded,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

const MAX_DURATION = 600; // 10 minutes

/**
 * Floating recording bar — visible on all pages while recording is active.
 */
function VoiceRecorderFAB({
  isRecording,
  isPaused,
  formattedDuration,
  duration,
  onStop,
  onPause,
  onResume,
  onCancel,
}) {
  if (!isRecording) return null;

  const progressPct = Math.min(100, ((duration || 0) / MAX_DURATION) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 90, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 90, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          minWidth: 300,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.8,
            px: 2.5,
            pt: 1.5,
            pb: 1.2,
            borderRadius: 4,
            background:
              "linear-gradient(135deg, rgba(239,68,68,0.97), rgba(185,28,28,0.97))",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow:
              "0 12px 40px rgba(239,68,68,0.45), 0 2px 8px rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          {/* ── Top row: dot + timer + label + controls ── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {/* Pulsating recording dot */}
            <motion.div
              animate={
                isPaused
                  ? { scale: 1, opacity: 0.4 }
                  : { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }
              }
              transition={{
                repeat: Infinity,
                duration: 1.1,
                ease: "easeInOut",
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                  boxShadow: "0 0 10px rgba(255,255,255,0.8)",
                }}
              />
            </motion.div>

            {/* Timer */}
            <Typography
              sx={{
                color: "#fff",
                fontWeight: 800,
                fontSize: "1.1rem",
                fontFamily: "monospace",
                letterSpacing: "0.06em",
                minWidth: 56,
              }}
            >
              {formattedDuration}
            </Typography>

            {/* Status badge */}
            <Box
              sx={{
                px: 1,
                py: 0.2,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.15)",
              }}
            >
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {isPaused ? "Pause" : "REC"}
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }} />

            {/* Controls */}
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {/* Pause / Resume */}
              <IconButton
                size="small"
                onClick={isPaused ? onResume : onPause}
                sx={{
                  color: "#fff",
                  backgroundColor: alpha("#fff", 0.15),
                  "&:hover": { backgroundColor: alpha("#fff", 0.28) },
                  width: 34,
                  height: 34,
                  transition: "all 0.2s ease",
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isPaused ? "resume" : "pause"}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ display: "flex" }}
                  >
                    {isPaused ? (
                      <PlayArrowRounded fontSize="small" />
                    ) : (
                      <PauseRounded fontSize="small" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </IconButton>

              {/* Stop (save) */}
              <IconButton
                size="small"
                onClick={onStop}
                sx={{
                  color: "#EF4444",
                  backgroundColor: "#fff",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.9)",
                    transform: "scale(1.05)",
                  },
                  width: 34,
                  height: 34,
                  transition: "all 0.2s ease",
                  fontWeight: 900,
                }}
              >
                <StopRounded fontSize="small" />
              </IconButton>

              {/* Cancel (discard) */}
              <IconButton
                size="small"
                onClick={onCancel}
                sx={{
                  color: alpha("#fff", 0.65),
                  "&:hover": {
                    color: "#fff",
                    backgroundColor: alpha("#fff", 0.15),
                  },
                  width: 34,
                  height: 34,
                }}
              >
                <DeleteRounded fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* ── Progress bar (max 10 min) ── */}
          <LinearProgress
            variant="determinate"
            value={progressPct}
            sx={{
              height: 3,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.2)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: "#fff",
                borderRadius: 2,
              },
            }}
          />
        </Box>
      </motion.div>
    </AnimatePresence>
  );
}

export default VoiceRecorderFAB;
