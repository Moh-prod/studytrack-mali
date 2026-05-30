import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = dayjs(dateStr);
  return `${d.date()} ${MONTHS_FR[d.month()]} ${d.year()}`;
}

export function getToday() {
  return dayjs().format('YYYY-MM-DD');
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  return dayjs(dateStr).isBefore(dayjs(), 'day');
}

export function daysUntil(dateStr) {
  if (!dateStr) return 0;
  return dayjs(dateStr).diff(dayjs(), 'day');
}

export function getRelativeDate(dateStr) {
  const diff = daysUntil(dateStr);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff === -1) return 'Hier';
  if (diff < -1) return `En retard (${Math.abs(diff)}j)`;
  if (diff <= 7) return `Dans ${diff} jours`;
  return formatDate(dateStr);
}

export function getWeekDays() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    days.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
  }
  return days;
}

export function getMonthDays() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    days.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
  }
  return days;
}

export function getDayName(dateStr) {
  const d = dayjs(dateStr);
  return DAYS_SHORT[d.day()];
}

export function getCurrentWeekDates() {
  const today = dayjs();
  const startOfWeek = today.startOf('week');
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(startOfWeek.add(i, 'day').format('YYYY-MM-DD'));
  }
  return days;
}

export function formatShortDate(dateStr) {
  const d = dayjs(dateStr);
  return `${d.date()} ${MONTHS_FR[d.month()].substring(0, 3)}`;
}
