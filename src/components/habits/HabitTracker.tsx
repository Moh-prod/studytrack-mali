import React, { useState, useMemo, useCallback, useEffect, memo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Slide,
  useTheme,
  alpha,
  Tooltip,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { AddRounded, DeleteRounded, EditRounded } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import PageContainer from "../layout/PageContainer";
import ConfirmDialog from "../common/ConfirmDialog";
import {
  getCurrentWeekDates,
  getDayName,
  getToday,
} from "../../utils/dateUtils";
import useHabitStore from "../../store/useHabitStore";

const emojiOptions = [
  "⭐",
  "📖",
  "🏃‍♂️",
  "🧘‍♂️",
  "💧",
  "🎯",
  "📝",
  "🎵",
  "💤",
  "🍎",
  "🧠",
  "💪",
];
const colorOptions = [
  "#7C3AED",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#6366F1",
];

const frequencyOptions = [
  { value: "daily", label: "📆 Tous les jours", targetDays: 7 },
  { value: "3x_week", label: "📅 3 fois par semaine", targetDays: 3 },
  { value: "weekdays", label: "💼 Jours ouvrés (Lun-Ven)", targetDays: 5 },
];

const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

/**
 * Hook qui fournit les dates de la semaine courante et se met à jour automatiquement
 * à minuit. Corrige le bug où les dates restaient figées si l'app était laissée
 * ouverte la nuit (useMemo avec deps vides ne se recalcule jamais).
 */
function useLiveWeekDates() {
  const [weekDates, setWeekDates] = useState(() => getCurrentWeekDates());
  const [today, setToday] = useState(() => getToday());

  useEffect(() => {
    // Calculer le délai jusqu'à minuit
    const scheduleUpdate = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 100); // 100ms après minuit

      const msUntilMidnight = tomorrow.getTime() - now.getTime();

      const timer = setTimeout(() => {
        setWeekDates(getCurrentWeekDates());
        setToday(getToday());
        scheduleUpdate(); // Reprogrammer pour le lendemain
      }, msUntilMidnight);

      return timer;
    };

    const timer = scheduleUpdate();
    return () => clearTimeout(timer);
  }, []);

  return { weekDates, today };
}

// ── HabitForm Dialog (ajouter + modifier) ────────────────────────────────────
function HabitFormDialog({ open, onClose, onSubmit, initialData }) {
  const theme = useTheme();
  const isEdit = Boolean(initialData);
  const [name, setName] = useState(initialData?.name || "");
  const [icon, setIcon] = useState(initialData?.icon || "⭐");
  const [color, setColor] = useState(initialData?.color || "#7C3AED");
  const [frequency, setFrequency] = useState(initialData?.frequency || "daily");

  useEffect(() => {
    if (open) {
      setName(initialData?.name || "");
      setIcon(initialData?.icon || "⭐");
      setColor(initialData?.color || "#7C3AED");
      setFrequency(initialData?.frequency || "daily");
    }
  }, [open, initialData]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), icon, color, frequency });
    if (!isEdit) {
      setName("");
      setIcon("⭐");
      setColor("#7C3AED");
      setFrequency("daily");
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEdit ? "✏️ Modifier l'habitude" : "➕ Nouvelle Habitude"}
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          autoFocus
          label="Nom de l'habitude"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2, mt: 1 }}
        />

        {/* Fréquence */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Fréquence</InputLabel>
          <Select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            label="Fréquence"
          >
            {frequencyOptions.map((f) => (
              <MenuItem key={f.value} value={f.value}>
                {f.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Icône
        </Typography>
        <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mb: 2 }}>
          {emojiOptions.map((e) => (
            <Box
              key={e}
              onClick={() => setIcon(e)}
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                transition: "all 0.2s",
                backgroundColor:
                  icon === e
                    ? alpha(color, 0.15)
                    : alpha(theme.palette.text.secondary, 0.05),
                border:
                  icon === e ? `2px solid ${color}` : "2px solid transparent",
                "&:hover": { transform: "scale(1.1)" },
              }}
            >
              {e}
            </Box>
          ))}
        </Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Couleur
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {colorOptions.map((c) => (
            <Box
              key={c}
              onClick={() => setColor(c)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                cursor: "pointer",
                backgroundColor: c,
                transition: "all 0.2s",
                border: color === c ? "3px solid white" : "none",
                boxShadow: color === c ? `0 0 12px ${c}` : "none",
                "&:hover": { transform: "scale(1.15)" },
              }}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          {isEdit ? "Sauvegarder" : "Ajouter"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Props come from App.js — no internal useHabits call (eliminates double Firestore subscription)
function HabitTracker({ user }) {
  const habits = useHabitStore((state) => state.habits);
  const addHabitStore = useHabitStore((state) => state.addHabit);
  const updateHabit = useHabitStore((state) => state.updateHabit);
  const deleteHabit = useHabitStore((state) => state.deleteHabit);
  const toggleHabitDate = useHabitStore((state) => state.toggleHabitDate);

  const [formOpen, setFormOpen] = useState(false);
  const [editHabit, setEditHabit] = useState(null); // habitude en cours d'édition
  const [delHabit, setDelHabit] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: "" });

  // weekDates et today se mettent à jour automatiquement à minuit
  const { weekDates, today } = useLiveWeekDates();

  const handleAdd = useCallback(
    async (data) => {
      await addHabitStore(user, data);
      setSnack({ open: true, msg: "Habitude ajoutée !" });
    },
    [addHabitStore, user],
  );

  const handleEdit = useCallback(
    async (data) => {
      if (editHabit) {
        await updateHabit(editHabit.id, data);
        setEditHabit(null);
        setSnack({ open: true, msg: "Habitude modifiée !" });
      }
    },
    [editHabit, updateHabit],
  );

  const handleDelete = useCallback(async () => {
    if (delHabit) {
      await deleteHabit(delHabit.id);
      setDelHabit(null);
      setSnack({ open: true, msg: "Habitude supprimée." });
    }
  }, [delHabit, deleteHabit]);

  const openEdit = useCallback((habit) => {
    setEditHabit(habit);
    setFormOpen(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setEditHabit(null);
  }, []);

  const handleFormSubmit = useCallback(
    async (data) => {
      if (editHabit) {
        await handleEdit(data);
      } else {
        await handleAdd(data);
      }
    },
    [editHabit, handleAdd, handleEdit],
  );

  /**
   * Calcule le streak courant d'une habitude.
   * Remonte les jours consécutifs en partant d'aujourd'hui (ou hier si aujourd'hui n'est pas coché).
   */
  const getHabitStreak = useCallback(
    (habit) => {
      const datesSet = new Set(habit.completedDates || []);
      let streak = 0;
      const check = new Date(today);
      if (!datesSet.has(today)) check.setDate(check.getDate() - 1);
      while (true) {
        const ds = check.toISOString().substring(0, 10);
        if (datesSet.has(ds)) {
          streak++;
          check.setDate(check.getDate() - 1);
        } else break;
      }
      return streak;
    },
    [today],
  );

  /**
   * Calcule le taux de complétion hebdomadaire en tenant compte de la fréquence.
   * - daily: objectif = 7 jours
   * - 3x_week: objectif = 3 jours
   * - weekdays: objectif = 5 jours (Lun-Ven uniquement)
   */
  const getWeekRate = useCallback(
    (habit) => {
      const datesSet = new Set(habit.completedDates || []);
      const freq = habit.frequency || "daily";
      const freqOpt = frequencyOptions.find((f) => f.value === freq);
      const targetDays = freqOpt?.targetDays || 7;

      let doneDates = weekDates.filter((d) => datesSet.has(d));

      // Pour weekdays: ne compter que les jours Lun-Ven
      if (freq === "weekdays") {
        doneDates = doneDates.filter((d) => {
          const dayOfWeek = new Date(d).getDay();
          return dayOfWeek >= 1 && dayOfWeek <= 5; // 1=Lun, 5=Ven
        });
      }

      return Math.min(100, Math.round((doneDates.length / targetDays) * 100));
    },
    [weekDates],
  );

  const handleCloseSnack = useCallback(
    () => setSnack((s) => ({ ...s, open: false })),
    [],
  );

  return (
    <PageContainer
      title="Suivi d'Habitudes"
      subtitle="Construis ta discipline quotidienne"
    >
      {/* Add button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => {
            setEditHabit(null);
            setFormOpen(true);
          }}
          sx={{ borderRadius: 3 }}
        >
          Nouvelle habitude
        </Button>
      </Box>

      {/* Habits list */}
      {habits.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <Typography variant="h1" sx={{ fontSize: 64, mb: 2 }}>
            💪
          </Typography>
          <Typography variant="h6">Ajoute ta première habitude !</Typography>
          <Typography variant="body2">
            Commence à construire ta routine quotidienne.
          </Typography>
        </Box>
      ) : (
        <AnimatePresence>
          {habits.map((habit, i) => {
            const streak = getHabitStreak(habit);
            const rate = getWeekRate(habit);
            const freq = habit.frequency || "daily";
            const freqLabel =
              frequencyOptions.find((f) => f.value === freq)?.label || "";

            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card sx={{ mb: 2, borderLeft: `4px solid ${habit.color}` }}>
                  <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Icon + Name */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          minWidth: 180,
                        }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2.5,
                            backgroundColor: alpha(habit.color, 0.12),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 20,
                          }}
                        >
                          {habit.icon}
                        </Box>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700 }}
                          >
                            {habit.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                          >
                            🔥 {streak}j | {rate}% | {freqLabel}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Week checkboxes */}
                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.8,
                          flex: 1,
                          justifyContent: "center",
                        }}
                      >
                        {weekDates.map((date) => {
                          const checked = (habit.completedDates || []).includes(
                            date,
                          );
                          const isToday = date === today;
                          const isFuture = date > today;
                          // Pour weekdays: griser les week-ends
                          const dayOfWeek = new Date(date).getDay();
                          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                          const isDisabled =
                            isFuture || (freq === "weekdays" && isWeekend);

                          return (
                            <Tooltip key={date} title={getDayName(date)}>
                              <Box sx={{ textAlign: "center" }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color:
                                      isDisabled && !isFuture
                                        ? alpha("#000", 0.3)
                                        : "text.secondary",
                                    fontSize: "0.65rem",
                                    display: "block",
                                  }}
                                >
                                  {getDayName(date)}
                                </Typography>
                                <Checkbox
                                  checked={checked}
                                  disabled={isDisabled}
                                  onChange={() => toggleHabitDate(habit, date)}
                                  sx={{
                                    p: 0.4,
                                    color: isToday ? habit.color : undefined,
                                    "&.Mui-checked": { color: habit.color },
                                    border: isToday
                                      ? `2px solid ${habit.color}`
                                      : "none",
                                    borderRadius: 1,
                                  }}
                                  size="small"
                                />
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Box>

                      {/* Progress + Actions */}
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box sx={{ width: 60 }}>
                          <LinearProgress
                            variant="determinate"
                            value={rate}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: habit.color,
                              },
                            }}
                          />
                        </Box>
                        <Tooltip title="Modifier">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(habit)}
                            color="primary"
                          >
                            <EditRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton
                            size="small"
                            onClick={() => setDelHabit(habit)}
                            color="error"
                          >
                            <DeleteRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {/* Add/Edit Dialog */}
      <HabitFormDialog
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={editHabit}
      />

      <ConfirmDialog
        open={Boolean(delHabit)}
        title="Supprimer cette habitude ?"
        message={`"${delHabit?.name}" et tout son historique seront supprimés.`}
        onConfirm={handleDelete}
        onCancel={() => setDelHabit(null)}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={handleCloseSnack}
        message={snack.msg}
        TransitionComponent={Transition}
      />
    </PageContainer>
  );
}

export default HabitTracker;
