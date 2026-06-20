import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Slider,
  Collapse,
  useTheme,
  alpha,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  PlayArrowRounded,
  PauseRounded,
  ReplayRounded,
  SkipNextRounded,
  SettingsRounded,
  TimerRounded,
  LinkRounded,
  MusicNoteRounded,
  BarChartRounded,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { KeepAwake } from "@capacitor-community/keep-awake";
import PageContainer from "../layout/PageContainer";
import PomodoroNotification from "./PomodoroNotification";
import { usePomodoro } from "../../context/PomodoroContext";
import useTaskStore from "../../store/useTaskStore";

const alarmOptions = [
  { value: "default", label: "🔔 Défaut (Cloche)" },
  { value: "digital", label: "📱 Digital" },
  { value: "zen", label: "🧘 Zen (Bol tibétain)" },
  { value: "nature", label: "🌿 Nature (Oiseaux)" },
];

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
    linkedTaskId,
    alarmSound,
    setLinkedTaskId,
    setAlarmSound,
    start,
    pause,
    reset,
    skip,
    updateWorkMin,
    updateBreakMin,
    updateLongBreakMin,
    notification,
    dismissNotification,
    startNextFromNotification,
  } = usePomodoro();

  const tasks = useTaskStore((state) => state.tasks);
  const activeTasks = tasks.filter((t) => t.status !== "done");

  // KeepAwake integration
  useEffect(() => {
    const toggleKeepAwake = async () => {
      try {
        if (running) {
          await KeepAwake.keepAwake();
        } else {
          await KeepAwake.allowSleep();
        }
      } catch (err) {
        console.warn("KeepAwake not supported/failed:", err);
      }
    };
    toggleKeepAwake();
  }, [running]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // SVG circle dimensions
  const size = 280;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  const circleColor = isWork ? "#7C3AED" : "#10B981";
  const glowColor = isWork ? "rgba(124,58,237,0.25)" : "rgba(16,185,129,0.25)";

  return (
    <PageContainer title="Pomodoro" subtitle="Concentre-toi et sois productif">
      {/* In-app notification toast */}
      <PomodoroNotification
        notification={notification}
        onDismiss={dismissNotification}
        onAction={startNextFromNotification}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        {/* Linked Task Selector */}
        <Card
          sx={{
            width: "100%",
            maxWidth: 500,
            borderRadius: 3,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.05)}`,
          }}
        >
          <CardContent
            sx={{
              p: 2,
              pb: "16px !important",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <LinkRounded sx={{ color: "text.secondary" }} />
            <FormControl fullWidth size="small">
              <InputLabel>Tâche liée (optionnel)</InputLabel>
              <Select
                value={linkedTaskId || ""}
                label="Tâche liée (optionnel)"
                onChange={(e) => setLinkedTaskId(e.target.value || null)}
                displayEmpty
              >
                <MenuItem value="">
                  <em>Aucune tâche liée</em>
                </MenuItem>
                {activeTasks.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.text}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* Background indicator badge */}
        {running && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Chip
              icon={<TimerRounded sx={{ fontSize: 16 }} />}
              label="Timer actif — continue en arrière-plan"
              size="small"
              sx={{
                bgcolor: alpha(circleColor, 0.1),
                color: circleColor,
                fontWeight: 600,
                fontSize: "0.72rem",
                border: `1px solid ${alpha(circleColor, 0.2)}`,
                "& .MuiChip-icon": { color: circleColor },
              }}
            />
          </motion.div>
        )}

        {/* Timer Circle */}
        <motion.div
          animate={running ? { scale: [1, 1.02, 1] } : {}}
          transition={running ? { repeat: Infinity, duration: 2 } : {}}
        >
          <Box
            sx={{
              position: "relative",
              width: size,
              height: size,
              filter: running ? `drop-shadow(0 0 20px ${glowColor})` : "none",
              transition: "filter 0.5s ease",
            }}
          >
            <svg
              width={size}
              height={size}
              style={{ transform: "rotate(-90deg)" }}
            >
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={alpha(circleColor, 0.12)}
                strokeWidth={stroke}
              />
              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={circleColor}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            {/* Center content */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  color: circleColor,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.02em",
                }}
              >
                {formatTime(timeLeft)}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontWeight: 600, mt: 0.5 }}
              >
                {isWork ? "💻 Travail" : "☕ Pause"}
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* Controls */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Tooltip title="Réinitialiser">
            <IconButton
              onClick={reset}
              sx={{
                bgcolor: alpha(theme.palette.text.secondary, 0.08),
                p: 1.5,
                transition: "all 0.2s ease",
                "&:hover": { transform: "scale(1.08)" },
              }}
            >
              <ReplayRounded />
            </IconButton>
          </Tooltip>
          <Tooltip title={running ? "Pause" : "Démarrer"}>
            <IconButton
              onClick={() => (running ? pause() : start())}
              sx={{
                p: 2.5,
                background: `linear-gradient(135deg, ${circleColor}, ${isWork ? "#06B6D4" : "#059669"})`,
                color: "#FFF",
                boxShadow: `0 6px 24px ${alpha(circleColor, 0.4)}`,
                transition: "all 0.25s ease",
                "&:hover": {
                  boxShadow: `0 8px 32px ${alpha(circleColor, 0.5)}`,
                  transform: "scale(1.06)",
                },
                "&:active": { transform: "scale(0.97)" },
              }}
            >
              {running ? (
                <PauseRounded sx={{ fontSize: 32 }} />
              ) : (
                <PlayArrowRounded sx={{ fontSize: 32 }} />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Passer">
            <IconButton
              onClick={skip}
              sx={{
                bgcolor: alpha(theme.palette.text.secondary, 0.08),
                p: 1.5,
                transition: "all 0.2s ease",
                "&:hover": { transform: "scale(1.08)" },
              }}
            >
              <SkipNextRounded />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Stats Row */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Chip
            icon={<BarChartRounded />}
            label={`${sessions} session${sessions > 1 ? "s" : ""} terminée${sessions > 1 ? "s" : ""}`}
            variant="outlined"
            sx={{
              fontWeight: 600,
              color: "text.secondary",
              borderColor: alpha(theme.palette.text.secondary, 0.2),
            }}
          />
          <Chip
            icon={<TimerRounded />}
            label={`${sessions * workMin} min au total`}
            variant="outlined"
            sx={{
              fontWeight: 600,
              color: "text.secondary",
              borderColor: alpha(theme.palette.text.secondary, 0.2),
            }}
          />
        </Box>

        {/* Settings */}
        <Card
          sx={{
            width: "100%",
            maxWidth: 500,
            transition: "box-shadow 0.3s ease",
            "&:hover": {
              boxShadow: `0 4px 20px ${alpha(theme.palette.text.primary, 0.08)}`,
            },
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                mb: showSettings ? 2 : 0,
                transition: "margin 0.3s ease",
              }}
              onClick={() => setShowSettings(!showSettings)}
            >
              <motion.div
                animate={{ rotate: showSettings ? 90 : 0 }}
                transition={{ duration: 0.25 }}
              >
                <SettingsRounded
                  fontSize="small"
                  sx={{ color: "text.secondary" }}
                />
              </motion.div>
              <Typography
                variant="subtitle2"
                sx={{ color: "text.secondary", fontWeight: 600 }}
              >
                Paramètres
              </Typography>
            </Box>
            <Collapse in={showSettings}>
              <Box sx={{ mt: 1 }}>
                <Box
                  sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}
                >
                  <MusicNoteRounded sx={{ color: "text.secondary" }} />
                  <FormControl fullWidth size="small">
                    <InputLabel>Sonnerie d'alarme</InputLabel>
                    <Select
                      value={alarmSound}
                      onChange={(e) => setAlarmSound(e.target.value)}
                      label="Sonnerie d'alarme"
                    >
                      {alarmOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Travail : {workMin} min
                </Typography>
                <Slider
                  value={workMin}
                  onChange={(_, v) => updateWorkMin(v)}
                  min={15}
                  max={60}
                  step={5}
                  sx={{ color: "#7C3AED", mb: 2 }}
                />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Pause : {breakMin} min
                </Typography>
                <Slider
                  value={breakMin}
                  onChange={(_, v) => updateBreakMin(v)}
                  min={3}
                  max={15}
                  step={1}
                  sx={{ color: "#10B981", mb: 2 }}
                />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Pause longue : {longBreakMin} min (après {longBreakAfter}{" "}
                  sessions)
                </Typography>
                <Slider
                  value={longBreakMin}
                  onChange={(_, v) => updateLongBreakMin(v)}
                  min={10}
                  max={30}
                  step={5}
                  sx={{ color: "#06B6D4" }}
                />
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
}
