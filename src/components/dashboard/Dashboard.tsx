import React, { useState, useMemo, memo, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  alpha,
  useTheme,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Slide,
} from "@mui/material";
import {
  AddRounded,
  CloseRounded,
  MailOutlineRounded,
  SendRounded,
  TimerRounded,
} from "@mui/icons-material";
import PageContainer from "../layout/PageContainer";
import StatsCards from "./StatsCards";
import ProgressChart from "./ProgressChart";
import StreakTracker from "./StreakTracker";
import MotivationalQuote from "./MotivationalQuote";
import AIInsightsCard from "./AIInsightsCard";
import useStreak from "../../hooks/useStreak";
import { getToday, isOverdue } from "../../utils/dateUtils";
import { motion } from "framer-motion";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { usePomodoro } from "../../context/PomodoroContext";

import useTaskStore from "../../store/useTaskStore";
import useHabitStore from "../../store/useHabitStore";

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

// ── Mini Quick Add Dialog ────────────────────────────────────────────────────
function QuickAddDialog({ open, onClose, user }) {
  const addTaskStore = useTaskStore((state) => state.addTask);
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = getToday();

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!text.trim()) return;
      setSubmitting(true);
      try {
        await addTaskStore(user, {
          text: text.trim(),
          date: date || today,
          priority: "medium",
          category: "personal",
        });
        setText("");
        setDate("");
        onClose();
      } finally {
        setSubmitting(false);
      }
    },
    [text, date, today, user, addTaskStore, onClose],
  );

  const handleClose = useCallback(() => {
    setText("");
    setDate("");
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        ⚡ Tâche rapide
        <IconButton onClick={handleClose} size="small">
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: "8px !important" }}>
          <TextField
            fullWidth
            autoFocus
            label="Qu'est-ce que tu dois faire ?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="date"
            label="Date (optionnelle — aujourd'hui par défaut)"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} sx={{ borderRadius: 3 }}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!text.trim() || submitting}
            sx={{ borderRadius: 3 }}
          >
            Ajouter
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function Dashboard() {
  const theme = useTheme();
  const tasks = useTaskStore((state) => state.tasks);
  const habits = useHabitStore((state) => state.habits);
  const { currentStreak, longestStreak, activeDates } = useStreak(tasks);
  const today = getToday();

  // Pomodoro data du jour
  const { sessions, isWork, workMin } = usePomodoro();
  const completedWorkSessions = useMemo(() => {
    // sessions = nombre de sessions de travail complétées depuis le démarrage
    return sessions;
  }, [sessions]);
  const totalFocusMinutes = completedWorkSessions * workMin;

  const todayTasks = useMemo(
    () => tasks.filter((t) => t.date === today && !t.done),
    [tasks, today],
  );
  const overdueTasks = useMemo(
    () => tasks.filter((t) => isOverdue(t.date) && !t.done),
    [tasks],
  );

  // Quick Add state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  // Récupérer l'utilisateur courant depuis Firebase Auth (import statique)
  const user = auth.currentUser;

  // Newsletter State
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "newsletter_subscribers"), {
        email: email.trim(),
        subscribedAt: new Date().toISOString(),
      });
      setSuccess(true);
      setEmail("");
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Tableau de Bord"
      subtitle="Vue d'ensemble de ta progression"
    >
      {/* Stats Cards */}
      <StatsCards tasks={tasks} streak={currentStreak} />

      {/* Chart + Quote Row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: 2.5,
          mb: 3,
        }}
      >
        <ProgressChart tasks={tasks} />
        <MotivationalQuote />
      </Box>

      {/* Streak */}
      <Box sx={{ mb: 3 }}>
        <StreakTracker
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          activeDates={activeDates}
        />
      </Box>

      {/* AI Insights Card */}
      <AIInsightsCard tasks={tasks} habits={habits} streak={currentStreak} />

      {/* Quick Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* Quick Add button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1.5 }}>
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setQuickAddOpen(true)}
            sx={{
              borderRadius: 3,
              background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
              "&:hover": {
                background: "linear-gradient(135deg, #5B21B6, #0891B2)",
              },
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)",
            }}
          >
            ⚡ Tâche rapide
          </Button>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
            gap: 2.5,
          }}
        >
          {/* Aujourd'hui */}
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: "text.secondary", mb: 1 }}
              >
                📅 Aujourd'hui
              </Typography>
              {todayTasks.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{ color: "success.main", fontWeight: 600 }}
                >
                  ✅ Rien de prévu — profites-en !
                </Typography>
              ) : (
                todayTasks.slice(0, 4).map((t) => (
                  <Typography key={t.id} variant="body2" sx={{ mb: 0.5 }}>
                    • {t.text}
                  </Typography>
                ))
              )}
              {todayTasks.length > 4 && (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  +{todayTasks.length - 4} autres...
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* En retard */}
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: "text.secondary", mb: 1 }}
              >
                ⚠️ En retard
              </Typography>
              {overdueTasks.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{ color: "success.main", fontWeight: 600 }}
                >
                  ✅ Aucune tâche en retard !
                </Typography>
              ) : (
                overdueTasks.slice(0, 4).map((t) => (
                  <Typography
                    key={t.id}
                    variant="body2"
                    sx={{ color: "error.main", mb: 0.5 }}
                  >
                    • {t.text} ({t.date})
                  </Typography>
                ))
              )}
            </CardContent>
          </Card>

          {/* Activité Pomodoro du jour */}
          <Card
            sx={{
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(124, 58, 237, 0.05) 100%)"
                  : "linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(124, 58, 237, 0.03) 100%)",
              border: `1px solid ${alpha("#EF4444", 0.15)}`,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <TimerRounded sx={{ color: "#EF4444", fontSize: 18 }} />
                <Typography
                  variant="subtitle2"
                  sx={{ color: "text.secondary" }}
                >
                  Pomodoro aujourd'hui
                </Typography>
              </Box>
              {completedWorkSessions === 0 ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Aucune session encore — vas-y ! 🍅
                </Typography>
              ) : (
                <>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, color: "#EF4444", lineHeight: 1 }}
                  >
                    {completedWorkSessions}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    session{completedWorkSessions > 1 ? "s" : ""} •{" "}
                    {totalFocusMinutes} min de focus
                  </Typography>
                  {isWork === false && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        color: "#10B981",
                        fontWeight: 600,
                        mt: 0.5,
                      }}
                    >
                      ☕ En pause actuellement
                    </Typography>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </motion.div>

      {/* Newsletter Subscription — Grid2 API (MUI v7) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card
          sx={{
            mt: 3,
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)"
                : "linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(6, 182, 212, 0.03) 100%)",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {/* Grid2 — nouvelle API MUI v7 (remplace l'ancien <Grid item xs={12} md={7}>) */}
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 7 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2.5,
                      background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFF",
                      boxShadow: "0 4px 12px rgba(124, 58, 237, 0.2)",
                    }}
                  >
                    <MailOutlineRounded />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    Rejoins la Newsletter StudyTrack
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", maxWidth: 600 }}
                >
                  Reçois des conseils hebdomadaires exclusifs sur la
                  productivité, des astuces d'apprentissage et reste informé des
                  nouveautés de l'application StudyTrack Mali.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                {success ? (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 1.5,
                        px: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.08),
                        borderRadius: 3,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "success.main", fontWeight: 700 }}
                      >
                        🎉 Merci pour ton inscription !
                      </Typography>
                    </Box>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubscribe}>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        flexDirection: { xs: "column", sm: "row" },
                      }}
                    >
                      <TextField
                        required
                        fullWidth
                        type="email"
                        placeholder="Ton adresse email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={submitting}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            backgroundColor: theme.palette.background.paper,
                          },
                        }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={submitting}
                        startIcon={<SendRounded />}
                        sx={{
                          whiteSpace: "nowrap",
                          px: 3,
                          py: { xs: 1.5, sm: 0 },
                          borderRadius: 3,
                        }}
                      >
                        S'abonner
                      </Button>
                    </Box>
                  </form>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Add Dialog */}
      <QuickAddDialog
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        user={user}
      />
    </PageContainer>
  );
}

export default Dashboard;
