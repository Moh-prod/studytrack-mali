import dayjs from "dayjs";
import "dayjs/locale/fr";
import relativeTime from "dayjs/plugin/relativeTime";
import weekOfYear from "dayjs/plugin/weekOfYear";

dayjs.locale("fr");
dayjs.extend(relativeTime);
dayjs.extend(weekOfYear);

const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const DAYS_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = dayjs(dateStr);
  return `${d.date()} ${MONTHS_FR[d.month()]} ${d.year()}`;
}

export function getToday() {
  return dayjs().format("YYYY-MM-DD");
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  return dayjs(dateStr).isBefore(dayjs(), "day");
}

export function daysUntil(dateStr) {
  if (!dateStr) return 0;
  return dayjs(dateStr).diff(dayjs(), "day");
}

export function getRelativeDate(dateStr) {
  const diff = daysUntil(dateStr);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  if (diff === -1) return "Hier";
  if (diff < -1) return `En retard (${Math.abs(diff)}j)`;
  if (diff <= 7) return `Dans ${diff} jours`;
  return formatDate(dateStr);
}

export function getWeekDays() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    days.push(dayjs().subtract(i, "day").format("YYYY-MM-DD"));
  }
  return days;
}

export function getMonthDays() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    days.push(dayjs().subtract(i, "day").format("YYYY-MM-DD"));
  }
  return days;
}

export function getDayName(dateStr) {
  const d = dayjs(dateStr);
  return DAYS_SHORT[d.day()];
}

export function getCurrentWeekDates() {
  const today = dayjs();
  const startOfWeek = today.startOf("week");
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(startOfWeek.add(i, "day").format("YYYY-MM-DD"));
  }
  return days;
}

export function formatShortDate(dateStr) {
  const d = dayjs(dateStr);
  return `${d.date()} ${MONTHS_FR[d.month()].substring(0, 3)}`;
}

/**
 * Retourne un label FIGÉ pour une tâche terminée.
 * Basé sur completedAt vs date limite — ne recalcule JAMAIS avec la date du jour.
 * Corrige le bug où les tâches terminées affichaient un retard croissant.
 */
export function getTaskCompletedLabel(task) {
  if (!task.done) return getRelativeDate(task.date);

  const completedAt = task.completedAt ? dayjs(task.completedAt) : dayjs();
  const formattedDate = `${completedAt.date()} ${MONTHS_FR[completedAt.month()]}`;

  if (!task.date) {
    return `Terminé le ${formattedDate}`;
  }

  const dueDate = dayjs(task.date);
  // Diff positif = terminé APRÈS la date limite (retard)
  const daysLate = completedAt
    .startOf("day")
    .diff(dueDate.startOf("day"), "day");

  if (daysLate <= 0) {
    return `Terminé le ${formattedDate}`;
  }
  if (daysLate === 1) {
    return `Terminé avec 1 jour de retard`;
  }
  return `Terminé avec ${daysLate} jours de retard`;
}

/**
 * Retourne le nombre de jours de retard au moment de la complétion (figé).
 * Utilisé par le journal pour les statistiques.
 */
export function getCompletedDaysLate(task) {
  if (!task.done || !task.date || !task.completedAt) return 0;
  const completedAt = dayjs(task.completedAt);
  const dueDate = dayjs(task.date);
  const diff = completedAt.startOf("day").diff(dueDate.startOf("day"), "day");
  return Math.max(0, diff);
}

/**
 * Formate une date ISO en label court lisible (ex: "Lun 9 juin")
 */
export function formatDayLabel(dateStr) {
  if (!dateStr) return "";
  const d = dayjs(dateStr);
  const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  return `${days[d.day()]} ${d.date()} ${MONTHS_FR[d.month()]}`;
}

/**
 * Retourne les N derniers jours (pour les graphiques journal)
 */
export function getLastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(dayjs().subtract(i, "day").format("YYYY-MM-DD"));
  }
  return days;
}

/**
 * Retourne le label de la semaine ISO (ex: "Semaine 23 — 2 au 8 juin 2026")
 */
export function getWeekLabel(dateStr) {
  const d = dayjs(dateStr);
  const start = d.startOf("week").add(1, "day"); // Lundi
  const end = d.endOf("week").add(1, "day"); // Dimanche
  const weekNum = d.week
    ? d.week()
    : Math.ceil(d.dayOfYear ? d.dayOfYear() / 7 : 1);
  return `Semaine ${weekNum} — ${start.date()} au ${end.date()} ${MONTHS_FR[end.month()]} ${end.year()}`;
}

/**
 * Retourne le label du mois (ex: "Juin 2026")
 */
export function getMonthLabel(dateStr) {
  const d = dayjs(dateStr);
  const month = MONTHS_FR[d.month()];
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${d.year()}`;
}
