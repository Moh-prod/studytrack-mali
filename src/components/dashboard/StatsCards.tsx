import React, { memo } from "react";
import { Box, Card, Typography } from "@mui/material";
import {
  AssignmentRounded,
  CheckCircleRounded,
  LocalFireDepartmentRounded,
  TrendingUpRounded,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import AnimatedCounter from "../common/AnimatedCounter";

const cardConfigs = [
  {
    key: "total",
    label: "Tâches Totales",
    icon: AssignmentRounded,
    gradient: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
    shadow: "rgba(124,58,237,0.3)",
  },
  {
    key: "done",
    label: "Terminées",
    icon: CheckCircleRounded,
    gradient: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
    shadow: "rgba(16,185,129,0.3)",
  },
  {
    key: "streak",
    label: "Streak Actuel",
    icon: LocalFireDepartmentRounded,
    gradient: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
    shadow: "rgba(245,158,11,0.3)",
    suffix: " 🔥",
  },
  {
    key: "rate",
    label: "Taux de Réussite",
    icon: TrendingUpRounded,
    gradient: "linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)",
    shadow: "rgba(6,182,212,0.3)",
    suffix: "%",
  },
];

function StatsCards({ tasks, streak }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  const values = { total, done, streak: streak || 0, rate };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" },
        gap: 2.5,
        mb: 3,
      }}
    >
      {cardConfigs.map((cfg, i) => {
        const Icon = cfg.icon;
        return (
          <motion.div
            key={cfg.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Card
              sx={{
                p: 2.5,
                position: "relative",
                overflow: "hidden",
                background: cfg.gradient,
                border: "none",
                boxShadow: `0 8px 32px ${cfg.shadow}`,
                "&:hover": {
                  transform: "translateY(-4px) scale(1.02)",
                  boxShadow: `0 12px 40px ${cfg.shadow}`,
                },
              }}
            >
              {/* Background Icon */}
              <Icon
                sx={{
                  position: "absolute",
                  right: -8,
                  top: -8,
                  fontSize: 100,
                  opacity: 0.15,
                  color: "#FFFFFF",
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255,255,255,0.8)",
                  fontWeight: 500,
                  mb: 1,
                  position: "relative",
                }}
              >
                {cfg.label}
              </Typography>
              <Box sx={{ position: "relative" }}>
                <AnimatedCounter
                  value={values[cfg.key]}
                  suffix={cfg.suffix || ""}
                  sx={{ fontSize: "2rem", color: "#FFFFFF" }}
                />
              </Box>
            </Card>
          </motion.div>
        );
      })}
    </Box>
  );
}

export default StatsCards;
