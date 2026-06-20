/**
 * nativeNotifications.js — Service de notifications unifié
 *
 * Détecte automatiquement si on est sur Capacitor (natif Android)
 * ou sur le web, et utilise le bon système de notifications.
 *
 * Sur Android natif : @capacitor/local-notifications (vraies notifs système)
 * Sur web : Notification API standard (fallback)
 */

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

// ─── Platform detection ──────────────────────────────────────────────
const isNative = Capacitor.isNativePlatform();

// ─── Notification ID counter ─────────────────────────────────────────
let notifIdCounter = Math.floor(Date.now() / 1000) % 100000;

function getNextId() {
  notifIdCounter += 1;
  return notifIdCounter;
}

// ─── Request permissions ─────────────────────────────────────────────
export async function requestNotificationPermissions() {
  if (isNative) {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === "granted";
    } catch (e) {
      console.warn("Native notification permission request failed:", e);
      return false;
    }
  } else {
    // Web fallback
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") return true;
      if (Notification.permission === "default") {
        const result = await Notification.requestPermission();
        return result === "granted";
      }
    }
    return false;
  }
}

// ─── Check permission status ─────────────────────────────────────────
export async function checkPermissions() {
  if (isNative) {
    try {
      const result = await LocalNotifications.checkPermissions();
      return result.display === "granted";
    } catch (e) {
      return false;
    }
  } else {
    return (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    );
  }
}

// ─── Send immediate notification ─────────────────────────────────────
/**
 * Show an immediate notification (both native and web).
 * @param {Object} options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {string} [options.icon] - Icon path (web only)
 * @param {string} [options.tag] - Tag for grouping
 * @param {boolean} [options.sound] - Play sound (default true)
 * @param {number} [options.id] - Notification ID (auto-generated if not provided)
 * @returns {Promise<number>} The notification ID
 */
export async function sendNotification({
  title,
  body,
  icon,
  tag,
  sound = true,
  id,
}) {
  const notifId = id || getNextId();

  if (isNative) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title,
            body,
            sound: sound ? "default" : undefined,
            smallIcon: "ic_launcher",
            largeIcon: "ic_launcher",
            channelId: "studytrack-default",
            extra: { tag: tag || "studytrack" },
            schedule: { at: new Date(Date.now() + 100) }, // Immediate
          },
        ],
      });
    } catch (e) {
      console.warn("Native notification failed:", e);
      // Fallback to web
      sendWebNotification(title, body, icon, tag);
    }
  } else {
    sendWebNotification(title, body, icon, tag);
  }

  return notifId;
}

// ─── Send alarm notification (high priority, with sound) ─────────────
/**
 * Send a high-priority alarm notification (for Pomodoro timer etc.)
 * On Android, uses a dedicated alarm channel with high importance.
 */
export async function sendAlarmNotification({ title, body, id }) {
  const notifId = id || getNextId();

  if (isNative) {
    try {
      // Create alarm channel if needed
      await ensureAlarmChannel();

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title,
            body,
            sound: "default",
            smallIcon: "ic_launcher",
            largeIcon: "ic_launcher",
            channelId: "studytrack-alarm",
            extra: { tag: "pomodoro-alarm" },
            schedule: { at: new Date(Date.now() + 100) },
          },
        ],
      });
    } catch (e) {
      console.warn("Alarm notification failed:", e);
      sendWebNotification(title, body, "/logo192.png", "studytrack-pomodoro");
    }
  } else {
    sendWebNotification(title, body, "/logo192.png", "studytrack-pomodoro");
  }

  return notifId;
}

// ─── Schedule a notification for a future time ───────────────────────
/**
 * Schedule a notification at a specific time.
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.body
 * @param {Date} options.at - When to fire
 * @param {number} [options.id]
 * @returns {Promise<number>} The notification ID
 */
export async function scheduleNotification({ title, body, at, id }) {
  const notifId = id || getNextId();

  if (isNative) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title,
            body,
            sound: "default",
            smallIcon: "ic_launcher",
            largeIcon: "ic_launcher",
            channelId: "studytrack-default",
            schedule: { at },
          },
        ],
      });
    } catch (e) {
      console.warn("Schedule notification failed:", e);
    }
  } else {
    // Web fallback: use setTimeout
    const delay = at.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        sendWebNotification(
          title,
          body,
          "/logo192.png",
          "studytrack-scheduled",
        );
      }, delay);
    }
  }

  return notifId;
}

// ─── Cancel a notification ───────────────────────────────────────────
export async function cancelNotification(notifId) {
  if (isNative) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
    } catch (e) {
      console.warn("Cancel notification failed:", e);
    }
  }
}

// ─── Create notification channels (Android) ──────────────────────────
let channelsCreated = false;

async function ensureAlarmChannel() {
  if (!isNative || channelsCreated) return;

  try {
    await LocalNotifications.createChannel({
      id: "studytrack-alarm",
      name: "Alarmes Pomodoro",
      description: "Notifications d'alarme pour le timer Pomodoro",
      importance: 5, // IMPORTANCE_HIGH
      visibility: 1, // PUBLIC
      sound: "default",
      vibration: true,
      lights: true,
    });

    await LocalNotifications.createChannel({
      id: "studytrack-default",
      name: "StudyTrack Notifications",
      description: "Rappels de tâches et notifications générales",
      importance: 4, // IMPORTANCE_DEFAULT
      visibility: 1,
      sound: "default",
      vibration: true,
    });

    channelsCreated = true;
  } catch (e) {
    console.warn("Failed to create notification channels:", e);
  }
}

// ─── Initialize notification service ─────────────────────────────────
export async function initNotifications() {
  const granted = await requestNotificationPermissions();

  if (isNative) {
    await ensureAlarmChannel();

    // Listen for notification actions
    LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (notification) => {
        console.log("Notification action:", notification);
        // Could be used to navigate to specific page when notification is tapped
      },
    );
  }

  return granted;
}

// ─── Helper: Web Notification ────────────────────────────────────────
function sendWebNotification(title, body, icon, tag) {
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    try {
      const notif = new Notification(title, {
        body,
        icon: icon || "/logo192.png",
        badge: "/logo192.png",
        tag: tag || "studytrack",
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 300],
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      setTimeout(() => notif.close(), 15000);
    } catch (e) {
      console.warn("Web notification failed:", e);
    }
  }
}
