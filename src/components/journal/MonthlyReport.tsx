import React, { memo, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  alpha,
  useTheme,
  Tooltip,
} from "@mui/material";
import { LocalFireDepartmentRounded } from "@mui/icons-material";
import { motion } from "framer-motion";
import ProductivityScore from "./ProductivityScore";
import { buildHeatmapData, getMonthlyBadge } from "../../utils/journalUtils";
import dayjs from "dayjs";
import "dayjs/locale/fr";
dayjs.locale("fr");

const HEATMAP_COLORS = {
  0: "transparent",
  1: alpha("#7C3AED", 0.15),
  2: alpha("#7C3AED", 0.35),
  3: alpha("#7C3AED", 0.6),
  4: "#7C3AED",
};

const MONTHS_FR = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

/**
 * Rapport mensuel avec :
 * - Badge mérité
 * - Heatmap GitHub-style
 * - Score moyen et stats
 * - Meilleur jour du mois
 */
function MonthlyReport({ entry, dailyEntries }) {
  const theme = useTheme();

  const year = entry ? dayjs(entry.periodStart).year() : dayjs().year();
  const month = entry
    ? dayjs(entry.periodStart).month() + 1
    : dayjs().month() + 1;

  // Construire les données de la heatmap depuis les rapports quotidiens du mois
  const heatmapData = useMemo(() => {
    return buildHeatmapData(dailyEntries || [], year, month);
  }, [dailyEntries, year, month]);

  // Stats agrégées du mois
  const monthStats = useMemo(() => {
    if (!dailyEntries || dailyEntries.length === 0) return null;
    const totalTasks = dailyEntries.reduce((s, r) => s + (r.tasksDone || 0), 0);
    const totalHabits = dailyEntries.reduce(
      (s, r) => s + (r.habitsDone || 0),
      0,
    );
    const avgScore = Math.round(
      dailyEntries.reduce((s, r) => s + (r.productivityScore || 0), 0) /
        dailyEntries.length,
    );
    const bestDay = dailyEntries.reduce(
      (best, r) =>
        r.productivityScore > (best?.productivityScore || 0) ? r : best,
      null,
    );
    const activeDays = dailyEntries.filter(
      (r) => r.tasksDone > 0 || r.habitsDone > 0,
    ).length;
    return { totalTasks, totalHabits, avgScore, bestDay, activeDays };
  }, [dailyEntries]);

  const badge = useMemo(
    () =>
      getMonthlyBadge({
        productivityScore: monthStats?.avgScore || 0,
        maxStreak: 0,
      }),
    [monthStats],
  );

  const monthLabel = (() => {
    const m = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
    const name = MONTHS_FR[m.month()];
    return `${name.charAt(0).toUpperCase() + name.slice(1)} ${year}`;
  })();

  // Déterminer le premier jour du mois (pour aligner la heatmap)
  const firstDayOfWeek = dayjs(
    `${year}-${String(month).padStart(2, "0")}-01`,
  ).day();
  // 0 = dim → on décale pour commencer lundi
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          <Box
            sx={{
              px: 2,
              py: 0.4,
              borderRadius: 3,
              background: "linear-gradient(135deg, #F59E0B20, #10B98120)",
              border: `1px solid ${alpha("#F59E0B", 0.2)}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: "#F59E0B" }}
            >
              📅 RAPPORT MENSUEL
            </Typography>
          </Box>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          {monthLabel}
        </Typography>
      </Box>

      {/* Badge + Score */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2.5,
          mb: 3,
        }}
      >
        {/* Badge mérité */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(badge.color, 0.1)}, ${alpha(badge.color, 0.04)})`,
              border: `1px solid ${alpha(badge.color, 0.25)}`,
              textAlign: "center",
            }}
          >
            <CardContent sx={{ py: 3 }}>
              <motion.div
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ repeat: Infinity, duration: 3, repeatDelay: 1 }}
              >
                <Typography
                  sx={{ fontSize: "3.5rem", display: "block", mb: 1 }}
                >
                  {badge.emoji}
                </Typography>
              </motion.div>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: badge.color, mb: 0.5 }}
              >
                {badge.label}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Badge du mois de {monthLabel}
              </Typography>
            </CardContent>
          </Card>
        </motion.div>

        {/* Score mensuel */}
        <Card
          sx={{
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.05))"
                : "linear-gradient(135deg, rgba(124,58,237,0.04), rgba(6,182,212,0.02))",
            border: `1px solid ${alpha("#7C3AED", 0.12)}`,
          }}
        >
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 3,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: "text.secondary",
                mb: 2,
              }}
            >
              Score mensuel moyen
            </Typography>
            <ProductivityScore score={monthStats?.avgScore || 0} size={130} />
          </CardContent>
        </Card>
      </Box>

      {/* Stats du mois */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1.5,
          mb: 3,
        }}
      >
        {[
          {
            label: "Tâches complétées",
            value: monthStats?.totalTasks || 0,
            icon: "✅",
            color: "#7C3AED",
          },
          {
            label: "Jours actifs",
            value: `${monthStats?.activeDays || 0}/${heatmapData.length}`,
            icon: "📅",
            color: "#10B981",
          },
          {
            label: "Habitudes cochées",
            value: monthStats?.totalHabits || 0,
            icon: "🔥",
            color: "#F59E0B",
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent
                sx={{ textAlign: "center", py: 2, "&:last-child": { pb: 2 } }}
              >
                <Typography sx={{ fontSize: "1.8rem", mb: 0.5 }}>
                  {stat.icon}
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "1.3rem",
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontWeight: 500 }}
                >
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </Box>

      {/* Heatmap GitHub-style */}
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
            <LocalFireDepartmentRounded sx={{ color: "#EF4444" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Activité du mois
            </Typography>
          </Box>

          {/* Jours de la semaine */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 0.5,
              mb: 0.5,
            }}
          >
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <Typography
                key={i}
                variant="caption"
                sx={{
                  textAlign: "center",
                  color: "text.secondary",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                }}
              >
                {d}
              </Typography>
            ))}
          </Box>

          {/* Grille de cases */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 0.6,
            }}
          >
            {/* Décalage pour le premier jour */}
            {Array.from({ length: offset }).map((_, i) => (
              <Box key={`offset-${i}`} />
            ))}
            {heatmapData.map((dayData, i) => (
              <Tooltip
                key={dayData.date}
                title={`${dayData.day} ${monthLabel} · Score: ${dayData.score || 0}`}
                placement="top"
                arrow
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: i * 0.01,
                    type: "spring",
                    stiffness: 300,
                  }}
                  whileHover={{ scale: 1.3 }}
                >
                  <Box
                    sx={{
                      aspectRatio: "1",
                      borderRadius: 0.8,
                      backgroundColor:
                        dayData.level > 0
                          ? HEATMAP_COLORS[dayData.level]
                          : alpha(
                              theme.palette.mode === "dark" ? "#fff" : "#000",
                              0.06,
                            ),
                      border:
                        dayData.level > 0
                          ? `1px solid ${alpha("#7C3AED", 0.2)}`
                          : `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      cursor: "pointer",
                      boxShadow:
                        dayData.level === 4
                          ? `0 0 8px ${alpha("#7C3AED", 0.5)}`
                          : "none",
                    }}
                  />
                </motion.div>
              </Tooltip>
            ))}
          </Box>

          {/* Légende */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mt: 2,
              justifyContent: "flex-end",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontSize: "0.7rem" }}
            >
              Moins
            </Typography>
            {[0, 1, 2, 3, 4].map((level) => (
              <Box
                key={level}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: 0.5,
                  backgroundColor:
                    level === 0
                      ? alpha(
                          theme.palette.mode === "dark" ? "#fff" : "#000",
                          0.06,
                        )
                      : HEATMAP_COLORS[level],
                  border: `1px solid ${alpha("#7C3AED", level > 0 ? 0.2 : 0.1)}`,
                }}
              />
            ))}
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontSize: "0.7rem" }}
            >
              Plus
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default MonthlyReport;
