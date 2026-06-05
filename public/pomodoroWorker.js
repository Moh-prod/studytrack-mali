/**
 * Pomodoro Web Worker — Background Timer
 * 
 * Ce Worker gère le décompte du timer en arrière-plan.
 * Contrairement à setInterval() dans le thread principal,
 * les Workers ne sont PAS throttlés quand l'onglet est inactif.
 * 
 * Utilise Date.now() pour compenser le drift d'horloge.
 */

let endTime = null;
let intervalId = null;
let timeLeftSec = 0;
let isRunning = false;

function tick() {
  if (!isRunning || endTime === null) return;

  const now = Date.now();
  const remaining = Math.round((endTime - now) / 1000);

  if (remaining <= 0) {
    // Timer completed
    isRunning = false;
    clearInterval(intervalId);
    intervalId = null;
    endTime = null;
    timeLeftSec = 0;
    self.postMessage({ type: 'complete' });
    self.postMessage({ type: 'tick', timeLeft: 0 });
  } else if (remaining !== timeLeftSec) {
    // Only send update when second actually changes (avoid duplicate messages)
    timeLeftSec = remaining;
    self.postMessage({ type: 'tick', timeLeft: remaining });
  }
}

self.onmessage = function (e) {
  const { command, timeLeft: newTimeLeft } = e.data;

  switch (command) {
    case 'start':
      // Start or resume the timer
      timeLeftSec = newTimeLeft;
      endTime = Date.now() + newTimeLeft * 1000;
      isRunning = true;
      
      // Clear any existing interval
      if (intervalId) clearInterval(intervalId);
      
      // Tick every 250ms for precision, but we only post when seconds change
      intervalId = setInterval(tick, 250);
      
      // Immediately send current state
      self.postMessage({ type: 'tick', timeLeft: timeLeftSec });
      break;

    case 'pause':
      isRunning = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      // Calculate exact remaining time and store it
      if (endTime !== null) {
        timeLeftSec = Math.max(0, Math.round((endTime - Date.now()) / 1000));
        endTime = null;
      }
      self.postMessage({ type: 'paused', timeLeft: timeLeftSec });
      break;

    case 'reset':
      isRunning = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      endTime = null;
      timeLeftSec = newTimeLeft;
      self.postMessage({ type: 'tick', timeLeft: timeLeftSec });
      break;

    case 'sync':
      // Sync time without changing running state (used for skip/settings changes)
      if (isRunning) {
        timeLeftSec = newTimeLeft;
        endTime = Date.now() + newTimeLeft * 1000;
      } else {
        timeLeftSec = newTimeLeft;
      }
      self.postMessage({ type: 'tick', timeLeft: timeLeftSec });
      break;

    default:
      break;
  }
};
