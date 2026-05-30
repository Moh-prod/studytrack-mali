import { useMemo } from 'react';
import { getToday } from '../utils/dateUtils';

export default function useStreak(tasks) {
  return useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { currentStreak: 0, longestStreak: 0, activeDates: [], todayActive: false };
    }

    // Collect unique dates when tasks were completed
    const completedDatesSet = new Set();
    tasks.forEach((t) => {
      if (t.done && t.completedAt) {
        const d = t.completedAt.substring(0, 10);
        completedDatesSet.add(d);
      }
    });

    const activeDates = Array.from(completedDatesSet).sort();
    const today = getToday();
    const todayActive = completedDatesSet.has(today);

    // Calculate current streak (consecutive days ending today or yesterday)
    let currentStreak = 0;
    const checkDate = new Date(today);
    
    // If today is not active, start checking from yesterday
    if (!todayActive) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().substring(0, 10);
      if (completedDatesSet.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = [...activeDates].sort();
    
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { currentStreak, longestStreak, activeDates, todayActive };
  }, [tasks]);
}
