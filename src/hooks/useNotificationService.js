import { useEffect, useCallback } from 'react';
import { sendNotification, initNotifications } from '../utils/nativeNotifications';

export default function useNotificationService(tasks, updateTask) {
  // Initialize notification system (native + web)
  useEffect(() => {
    initNotifications();
  }, []);

  // Web Audio API procedural task chime generator
  const playTaskChime = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const now = audioCtx.currentTime;

      // Play a beautiful, rising 3-note harmonic chime (C5 -> E5 -> G5)
      const playNote = (freq, time, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.25, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc.start(time);
        osc.stop(time + duration + 0.05);
      };

      playNote(523.25, now, 0.2);        // C5
      playNote(659.25, now + 0.12, 0.2); // E5
      playNote(783.99, now + 0.24, 0.35); // G5
    } catch (e) {
      console.warn("Could not play task chime: ", e);
    }
  }, []);

  // Show notification using the unified native service
  const triggerNotification = useCallback((title, body) => {
    sendNotification({
      title,
      body,
      tag: 'studytrack-reminder',
      sound: true,
    }).catch((e) => {
      console.warn("Could not display task notification: ", e);
    });
  }, []);

  // Effect to scan tasks periodically
  useEffect(() => {
    if (!tasks || tasks.length === 0 || !updateTask) return;

    const checkTasks = () => {
      const localDate = new Date();
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      const todayLocal = `${year}-${month}-${day}`;

      const currentHour = String(localDate.getHours()).padStart(2, '0');
      const currentMin = String(localDate.getMinutes()).padStart(2, '0');
      const currentTimeLocal = `${currentHour}:${currentMin}`;

      tasks.forEach((task) => {
        const isDone = task.done || task.status === 'done';
        
        if (
          !isDone &&
          !task.notified &&
          task.date === todayLocal &&
          task.reminderTime &&
          currentTimeLocal >= task.reminderTime
        ) {
          // Play sound and trigger notification
          playTaskChime();
          triggerNotification("🔔 Rappel de Tâche !", task.text);

          // Update task state on Firestore so we don't notify again
          updateTask(task.id, { notified: true });
        }
      });
    };

    // Check immediately and then every 15 seconds
    checkTasks();
    const interval = setInterval(checkTasks, 15000);

    return () => clearInterval(interval);
  }, [tasks, updateTask, playTaskChime, triggerNotification]);
}
