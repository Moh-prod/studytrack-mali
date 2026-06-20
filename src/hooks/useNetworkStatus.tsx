import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Hook pour surveiller le statut réseau (online/offline).
 *
 * Sur natif (Capacitor) : utilise @capacitor/network
 * Sur web : utilise navigator.onLine + événements online/offline
 */
export default function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    let cleanup = null;

    if (Capacitor.isNativePlatform()) {
      // Capacitor native: use @capacitor/network
      (async () => {
        try {
          const { Network } = await import("@capacitor/network");
          const status = await Network.getStatus();
          setIsOnline(status.connected);

          const handle = Network.addListener("networkStatusChange", (s) => {
            const connected = s.connected;
            setIsOnline((prev) => {
              if (prev && !connected) setWasOffline(true);
              return connected;
            });
          });

          cleanup = () => handle.then?.((h) => h.remove()) || handle.remove?.();
        } catch (e) {
          // Fallback to web events
          setupWebListeners();
        }
      })();
    } else {
      setupWebListeners();
    }

    function setupWebListeners() {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => {
        setIsOnline(false);
        setWasOffline(true);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      cleanup = () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const dismissOfflineWarning = useCallback(() => {
    setWasOffline(false);
  }, []);

  return {
    isOnline,
    wasOffline,
    dismissOfflineWarning,
  };
}
