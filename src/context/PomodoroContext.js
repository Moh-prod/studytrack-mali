import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { initAlarmSound, playAlarm, stopAlarm } from '../utils/alarmSound';

const PomodoroContext = createContext();

export function PomodoroProvider({ children }) {
  // ─── Settings with localStorage persistence ───────────────────────
  const [workMin, setWorkMin] = useState(() => Number(localStorage.getItem('pomo_workMin')) || 25);
  const [breakMin, setBreakMin] = useState(() => Number(localStorage.getItem('pomo_breakMin')) || 5);
  const [longBreakMin, setLongBreakMin] = useState(() => Number(localStorage.getItem('pomo_longBreakMin')) || 15);
  const longBreakAfter = 4;

  // ─── Timer state ──────────────────────────────────────────────────
  const [isWork, setIsWork] = useState(true);
  const [timeLeft, setTimeLeft] = useState(workMin * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  // ─── In-app notification state ────────────────────────────────────
  const [notification, setNotification] = useState({ visible: false, title: '', body: '', type: '' });

  // ─── Refs ─────────────────────────────────────────────────────────
  const workerRef = useRef(null);
  const isWorkRef = useRef(isWork);
  const sessionsRef = useRef(sessions);
  const workMinRef = useRef(workMin);
  const breakMinRef = useRef(breakMin);
  const longBreakMinRef = useRef(longBreakMin);
  const originalTitleRef = useRef(document.title);

  // Keep refs in sync with state (needed for Worker message handler)
  useEffect(() => { isWorkRef.current = isWork; }, [isWork]);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  useEffect(() => { workMinRef.current = workMin; }, [workMin]);
  useEffect(() => { breakMinRef.current = breakMin; }, [breakMin]);
  useEffect(() => { longBreakMinRef.current = longBreakMin; }, [longBreakMin]);

  // ─── Sync settings to localStorage ────────────────────────────────
  useEffect(() => { localStorage.setItem('pomo_workMin', workMin); }, [workMin]);
  useEffect(() => { localStorage.setItem('pomo_breakMin', breakMin); }, [breakMin]);
  useEffect(() => { localStorage.setItem('pomo_longBreakMin', longBreakMin); }, [longBreakMin]);

  // ─── Request notification permissions ─────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // ─── Pre-generate alarm sound on mount ────────────────────────────
  useEffect(() => {
    initAlarmSound().catch(() => {
      // Silently fallback to Web Audio if OfflineAudioContext not available
    });
  }, []);

  // ─── System OS notification (enhanced) ────────────────────────────
  const triggerSystemNotification = useCallback((title, body) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: 'studytrack-pomodoro',
          renotify: true,
          requireInteraction: true,
          silent: true, // We handle sound ourselves
          vibrate: [200, 100, 200, 100, 300],
        });

        // Bring the tab to focus when user clicks the notification
        notif.onclick = () => {
          window.focus();
          notif.close();
        };

        // Auto-close after 30s
        setTimeout(() => notif.close(), 30000);
      } catch (e) {
        console.warn('Could not display notification:', e);
      }
    }
  }, []);

  // ─── Show in-app toast notification ───────────────────────────────
  const triggerInAppNotification = useCallback((title, body, type) => {
    setNotification({ visible: true, title, body, type });
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, visible: false }));
    stopAlarm();
  }, []);

  // ─── Handle timer completion ──────────────────────────────────────
  const handleTimerComplete = useCallback(() => {
    setRunning(false);

    // Play professional alarm sound (3 loops)
    playAlarm(3);

    if (isWorkRef.current) {
      const nextSessions = sessionsRef.current + 1;
      setSessions(nextSessions);
      setIsWork(false);

      const isLongBreak = nextSessions % longBreakAfter === 0;
      const breakDuration = isLongBreak ? longBreakMinRef.current : breakMinRef.current;
      const nextTime = breakDuration * 60;
      setTimeLeft(nextTime);

      const title = '🎉 Session de travail terminée !';
      const body = `Bravo ! C'est l'heure d'une ${isLongBreak ? 'longue ' : ''}pause de ${breakDuration} minutes.`;

      triggerSystemNotification(title, body);
      triggerInAppNotification(title, body, 'work-complete');
    } else {
      setIsWork(true);
      const nextTime = workMinRef.current * 60;
      setTimeLeft(nextTime);

      const title = '🚀 Pause terminée !';
      const body = "C'est reparti ! C'est l'heure de se concentrer et travailler.";

      triggerSystemNotification(title, body);
      triggerInAppNotification(title, body, 'break-complete');
    }
  }, [triggerSystemNotification, triggerInAppNotification]);

  // ─── Web Worker initialization ────────────────────────────────────
  useEffect(() => {
    // Create the Web Worker
    const worker = new Worker(`${process.env.PUBLIC_URL}/pomodoroWorker.js`);

    worker.onmessage = (e) => {
      const { type, timeLeft: workerTimeLeft } = e.data;

      switch (type) {
        case 'tick':
          setTimeLeft(workerTimeLeft);
          break;
        case 'complete':
          handleTimerComplete();
          break;
        case 'paused':
          setTimeLeft(workerTimeLeft);
          break;
        default:
          break;
      }
    };

    worker.onerror = (err) => {
      console.warn('Pomodoro Worker error:', err);
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, [handleTimerComplete]);

  // ─── Dynamic tab title ────────────────────────────────────────────
  useEffect(() => {
    const savedTitle = originalTitleRef.current;

    if (running || timeLeft < (isWork ? workMin * 60 : breakMin * 60)) {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      const mode = isWork ? '💻 Travail' : '☕ Pause';
      document.title = `${timeStr} — ${mode} | StudyTrack`;
    } else {
      document.title = savedTitle;
    }

    return () => {
      // Restore title on unmount
      document.title = savedTitle;
    };
  }, [timeLeft, running, isWork, workMin, breakMin]);

  // ─── Derived state ────────────────────────────────────────────────
  const totalTime = isWork
    ? workMin * 60
    : (sessions > 0 && sessions % longBreakAfter === 0 ? longBreakMin * 60 : breakMin * 60);

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  // ─── Timer controls ───────────────────────────────────────────────
  const start = useCallback(() => {
    setRunning(true);
    workerRef.current?.postMessage({ command: 'start', timeLeft });
  }, [timeLeft]);

  const pause = useCallback(() => {
    setRunning(false);
    workerRef.current?.postMessage({ command: 'pause' });
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    const newTime = isWork
      ? workMin * 60
      : (sessions > 0 && sessions % longBreakAfter === 0 ? longBreakMin * 60 : breakMin * 60);
    setTimeLeft(newTime);
    workerRef.current?.postMessage({ command: 'reset', timeLeft: newTime });
    stopAlarm();
    dismissNotification();
  }, [isWork, workMin, breakMin, longBreakMin, sessions, dismissNotification]);

  const skip = useCallback(() => {
    setRunning(false);
    stopAlarm();
    dismissNotification();

    if (isWork) {
      const nextSessions = sessions + 1;
      setSessions(nextSessions);
      setIsWork(false);
      const newTime = nextSessions % longBreakAfter === 0 ? longBreakMin * 60 : breakMin * 60;
      setTimeLeft(newTime);
      workerRef.current?.postMessage({ command: 'reset', timeLeft: newTime });
    } else {
      setIsWork(true);
      const newTime = workMin * 60;
      setTimeLeft(newTime);
      workerRef.current?.postMessage({ command: 'reset', timeLeft: newTime });
    }
  }, [isWork, sessions, workMin, breakMin, longBreakMin, dismissNotification]);

  // ─── Action from notification toast (start next phase) ────────────
  const startNextFromNotification = useCallback(() => {
    dismissNotification();
    stopAlarm();
    // Start the timer automatically for the next phase
    const currentTime = isWork
      ? workMin * 60
      : (sessions > 0 && sessions % longBreakAfter === 0 ? longBreakMin * 60 : breakMin * 60);
    setTimeLeft(currentTime);
    setRunning(true);
    workerRef.current?.postMessage({ command: 'start', timeLeft: currentTime });
  }, [isWork, workMin, breakMin, longBreakMin, sessions, dismissNotification]);

  // ─── Settings updaters ────────────────────────────────────────────
  const updateWorkMin = useCallback((min) => {
    setWorkMin(min);
    if (!running && isWork) {
      setTimeLeft(min * 60);
      workerRef.current?.postMessage({ command: 'sync', timeLeft: min * 60 });
    }
  }, [running, isWork]);

  const updateBreakMin = useCallback((min) => {
    setBreakMin(min);
    if (!running && !isWork && (sessions === 0 || sessions % longBreakAfter !== 0)) {
      setTimeLeft(min * 60);
      workerRef.current?.postMessage({ command: 'sync', timeLeft: min * 60 });
    }
  }, [running, isWork, sessions]);

  const updateLongBreakMin = useCallback((min) => {
    setLongBreakMin(min);
    if (!running && !isWork && sessions > 0 && sessions % longBreakAfter === 0) {
      setTimeLeft(min * 60);
      workerRef.current?.postMessage({ command: 'sync', timeLeft: min * 60 });
    }
  }, [running, isWork, sessions]);

  // ─── Context Provider ─────────────────────────────────────────────
  return (
    <PomodoroContext.Provider
      value={{
        // State
        workMin,
        breakMin,
        longBreakMin,
        longBreakAfter,
        isWork,
        timeLeft,
        running,
        sessions,
        progress,
        totalTime,
        notification,
        // Controls
        start,
        pause,
        reset,
        skip,
        updateWorkMin,
        updateBreakMin,
        updateLongBreakMin,
        dismissNotification,
        startNextFromNotification,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
}
