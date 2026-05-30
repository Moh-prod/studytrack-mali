import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const PomodoroContext = createContext();

export function PomodoroProvider({ children }) {
  // Settings with localStorage persistence
  const [workMin, setWorkMin] = useState(() => Number(localStorage.getItem('pomo_workMin')) || 25);
  const [breakMin, setBreakMin] = useState(() => Number(localStorage.getItem('pomo_breakMin')) || 5);
  const [longBreakMin, setLongBreakMin] = useState(() => Number(localStorage.getItem('pomo_longBreakMin')) || 15);
  const longBreakAfter = 4;

  const [isWork, setIsWork] = useState(true);
  const [timeLeft, setTimeLeft] = useState(workMin * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const intervalRef = useRef(null);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('pomo_workMin', workMin);
  }, [workMin]);

  useEffect(() => {
    localStorage.setItem('pomo_breakMin', breakMin);
  }, [breakMin]);

  useEffect(() => {
    localStorage.setItem('pomo_longBreakMin', longBreakMin);
  }, [longBreakMin]);

  // Request browser notification permissions
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Web Audio API procedural alarm sound generator
  const playAlarmSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const now = audioCtx.currentTime;

      // Play a triple double-beep (beep-beep ... beep-beep ... beep-beep)
      const playBeep = (time, freq) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.2, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

        osc.start(time);
        osc.stop(time + 0.18);
      };

      // Double beeps at different intervals
      const beeps = [
        { t: 0.0, f: 880 }, { t: 0.18, f: 880 },
        { t: 0.5, f: 880 }, { t: 0.68, f: 880 },
        { t: 1.0, f: 1046.5 }, { t: 1.18, f: 1046.5 } // C6 note at the end for positive resolution
      ];

      beeps.forEach(beep => {
        playBeep(now + beep.t, beep.f);
      });
    } catch (e) {
      console.warn("Could not play synthesized sound: ", e);
    }
  }, []);

  // Show a real OS Notification
  const triggerNotification = useCallback((title, body) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/logo.svg',
          silent: true // Handled by our custom AudioContext sound
        });
      } catch (e) {
        console.warn("Could not display notification: ", e);
      }
    }
  }, []);

  const totalTime = isWork
    ? workMin * 60
    : (sessions > 0 && sessions % longBreakAfter === 0 ? longBreakMin * 60 : breakMin * 60);

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        setRunning(false);
        playAlarmSound();

        if (isWork) {
          const nextSessions = sessions + 1;
          setSessions(nextSessions);
          setIsWork(false);
          const nextTime = nextSessions % longBreakAfter === 0 ? longBreakMin * 60 : breakMin * 60;
          
          triggerNotification(
            "💻 Session de travail terminée !",
            `Bravo ! C'est l'heure de faire une pause de ${nextSessions % longBreakAfter === 0 ? longBreakMin : breakMin} minutes.`
          );
          
          return nextTime;
        } else {
          setIsWork(true);
          
          triggerNotification(
            "☕ Pause terminée !",
            "C'est reparti pour rester concentré ! C'est l'heure de travailler."
          );

          return workMin * 60;
        }
      }
      return prev - 1;
    });
  }, [isWork, sessions, workMin, breakMin, longBreakMin, playAlarmSound, triggerNotification]);

  // Handle setInterval ticking
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, tick]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);

  const reset = () => {
    setRunning(false);
    setTimeLeft(isWork ? workMin * 60 : (sessions > 0 && sessions % longBreakAfter === 0 ? longBreakMin * 60 : breakMin * 60));
  };

  const skip = () => {
    setRunning(false);
    if (isWork) {
      const nextSessions = sessions + 1;
      setSessions(nextSessions);
      setIsWork(false);
      setTimeLeft(nextSessions % longBreakAfter === 0 ? longBreakMin * 60 : breakMin * 60);
    } else {
      setIsWork(true);
      setTimeLeft(workMin * 60);
    }
  };

  const updateWorkMin = (min) => {
    setWorkMin(min);
    if (!running && isWork) {
      setTimeLeft(min * 60);
    }
  };

  const updateBreakMin = (min) => {
    setBreakMin(min);
    if (!running && !isWork && (sessions === 0 || sessions % longBreakAfter !== 0)) {
      setTimeLeft(min * 60);
    }
  };

  const updateLongBreakMin = (min) => {
    setLongBreakMin(min);
    if (!running && !isWork && sessions > 0 && sessions % longBreakAfter === 0) {
      setTimeLeft(min * 60);
    }
  };

  return (
    <PomodoroContext.Provider
      value={{
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
        start,
        pause,
        reset,
        skip,
        updateWorkMin,
        updateBreakMin,
        updateLongBreakMin,
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
