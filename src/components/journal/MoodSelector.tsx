import React, { memo } from "react";
import { Box, Typography, alpha, useTheme, Tooltip } from "@mui/material";
import { motion } from "framer-motion";

const MOODS = [
  { key: "great", emoji: "🔥", label: "Excellent", color: "#F59E0B" },
  { key: "good", emoji: "😊", label: "Bien", color: "#10B981" },
  { key: "okay", emoji: "😐", label: "Correct", color: "#06B6D4" },
  { key: "hard", emoji: "😓", label: "Difficile", color: "#7C3AED" },
  { key: "bad", emoji: "😞", label: "Dur", color: "#EF4444" },
];

/**
 * Sélecteur d'humeur avec 5 emojis animés au hover.
 * L'emoji sélectionné pulse et s'agrandit.
 */
function MoodSelector({ value, onChange, readOnly = false }) {
  const theme = useTheme();

  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          mb: 1.5,
          display: "block",
        }}
      >
        Comment s'est passée ta journée ?
      </Typography>
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {MOODS.map((mood, i) => {
          const isSelected = value === mood.key;
          return (
            <Tooltip key={mood.key} title={mood.label} placement="top">
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 300 }}
                whileHover={readOnly ? {} : { scale: 1.2, rotate: [-5, 5, 0] }}
                whileTap={readOnly ? {} : { scale: 0.9 }}
              >
                <Box
                  onClick={() => !readOnly && onChange && onChange(mood.key)}
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.8rem",
                    cursor: readOnly ? "default" : "pointer",
                    transition: "all 0.2s ease",
                    backgroundColor: isSelected
                      ? alpha(mood.color, 0.15)
                      : alpha(
                          theme.palette.mode === "dark" ? "#fff" : "#000",
                          0.04,
                        ),
                    border: isSelected
                      ? `2px solid ${mood.color}`
                      : `2px solid transparent`,
                    boxShadow: isSelected
                      ? `0 0 16px ${alpha(mood.color, 0.4)}`
                      : "none",
                    "&:hover": !readOnly
                      ? {
                          backgroundColor: alpha(mood.color, 0.1),
                          border: `2px solid ${alpha(mood.color, 0.5)}`,
                        }
                      : {},
                  }}
                >
                  <motion.span
                    animate={
                      isSelected
                        ? {
                            scale: [1, 1.1, 1],
                            rotate: [0, -5, 5, 0],
                          }
                        : { scale: 1 }
                    }
                    transition={
                      isSelected
                        ? {
                            duration: 0.5,
                            repeat: Infinity,
                            repeatDelay: 2,
                          }
                        : {}
                    }
                  >
                    {mood.emoji}
                  </motion.span>
                </Box>
              </motion.div>
            </Tooltip>
          );
        })}
      </Box>
      {value && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              mt: 1,
              color: MOODS.find((m) => m.key === value)?.color,
              fontWeight: 600,
            }}
          >
            {MOODS.find((m) => m.key === value)?.emoji}{" "}
            {MOODS.find((m) => m.key === value)?.label}
          </Typography>
        </motion.div>
      )}
    </Box>
  );
}

export { MOODS };
export default MoodSelector;
