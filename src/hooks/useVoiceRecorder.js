import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook personnalisé pour l'enregistrement vocal.
 *
 * - Demande la permission micro via l'API Capacitor sur natif,
 *   et getUserMedia sur le web.
 * - Sélectionne automatiquement le meilleur codec disponible.
 * - Durée max : 10 minutes.
 * - Collecte les données toutes les 500 ms pour robustesse.
 */
const MAX_DURATION_SECONDS = 600; // 10 minutes

// Priority-ordered list of MIME types
const MIME_PRIORITY = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
  'audio/aac',
  '',
];

function getSupportedMime() {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const mime of MIME_PRIORITY) {
    try {
      if (mime === '' || MediaRecorder.isTypeSupported(mime)) return mime;
    } catch (_) {}
  }
  return '';
}

/**
 * Request microphone permission via Capacitor (native) or browser.
 * On native Android/iOS we use the Permissions API via Capacitor Core;
 * on web, getUserMedia itself triggers the browser prompt.
 * Returns true if permission is (likely) granted.
 */
async function requestMicPermission() {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      try {
        // Use the generic Capacitor Permissions plugin (included with @capacitor/core >= 3)
        const { Permissions } = await import('@capacitor/core');
        if (Permissions && Permissions.request) {
          const result = await Permissions.request({ name: 'microphone' });
          return result.state === 'granted';
        }
      } catch (_) {
        // Permissions plugin not available — fall through to getUserMedia
      }
    }
  } catch (_) {}
  // On web, getUserMedia will handle the permission prompt automatically
  return true;
}

export default function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const accumulatedRef = useRef(0); // total paused/accumulated seconds
  const streamRef = useRef(null);
  const mimeTypeRef = useRef('');

  // ─── KeepAwake ────────────────────────────────────────────────────────────
  const activateKeepAwake = useCallback(async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { KeepAwake } = await import('@capacitor-community/keep-awake');
        await KeepAwake.keepAwake();
      }
    } catch (_) {}
  }, []);

  const deactivateKeepAwake = useCallback(async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { KeepAwake } = await import('@capacitor-community/keep-awake');
        await KeepAwake.allowSleep();
      }
    } catch (_) {}
  }, []);

  // ─── Internal timer helpers ────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback((baseSeconds = 0) => {
    stopTimer();
    startTimeRef.current = Date.now();
    accumulatedRef.current = baseSeconds;
    timerRef.current = setInterval(() => {
      const elapsed = accumulatedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (elapsed >= MAX_DURATION_SECONDS) {
        // Auto-stop at max duration — stopRecording triggers mediaRecorder.stop()
        clearInterval(timerRef.current);
        timerRef.current = null;
        setDuration(MAX_DURATION_SECONDS);
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== 'inactive'
        ) {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setIsPaused(false);
        return;
      }
      setDuration(elapsed);
    }, 500);
  }, [stopTimer]);

  // ─── Stop all stream tracks ────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ─── Start Recording ──────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      setAudioUrl(null);
      chunksRef.current = [];

      // Step 1 — native permission request
      const granted = await requestMicPermission();
      if (!granted) {
        setError('Permission microphone refusée. Active-la dans les paramètres.');
        return;
      }

      // Step 2 — get media stream
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Don't lock sampleRate on iOS — causes NotSupportedError
          ...(!/iPhone|iPad|iPod/i.test(navigator.userAgent) && { sampleRate: 44100 }),
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Step 3 — choose MIME
      const mimeType = getSupportedMime();
      mimeTypeRef.current = mimeType;

      // Step 4 — build MediaRecorder
      const options = {};
      if (mimeType) options.mimeType = mimeType;
      try {
        options.audioBitsPerSecond = 128000;
      } catch (_) {}

      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (_) {
        // Fallback: no options
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalMime = mimeTypeRef.current || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalMime });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stopStream();
        deactivateKeepAwake();
      };

      mediaRecorder.onerror = (e) => {
        setError('Erreur d\'enregistrement: ' + (e.error?.message || 'inconnue'));
        setIsRecording(false);
        setIsPaused(false);
        stopStream();
        deactivateKeepAwake();
      };

      mediaRecorderRef.current = mediaRecorder;
      // Collect every 500ms — important for mobile reliability
      mediaRecorder.start(500);

      setDuration(0);
      setIsRecording(true);
      setIsPaused(false);
      startTimer(0);
      activateKeepAwake();
    } catch (err) {
      stopStream();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permission micro refusée. Autorise l\'accès dans les réglages.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('Aucun microphone détecté sur cet appareil.');
      } else if (err.name === 'NotSupportedError') {
        setError('Enregistrement non supporté sur ce navigateur.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Le microphone est déjà utilisé par une autre application.');
      } else {
        setError('Impossible de démarrer: ' + err.message);
      }
    }
  }, [activateKeepAwake, deactivateKeepAwake, startTimer, stopStream]);

  // ─── Pause ────────────────────────────────────────────────────────────────
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.pause();
      } catch (_) {}
      // Freeze accumulated time
      accumulatedRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
      stopTimer();
      setIsPaused(true);
    }
  }, [stopTimer]);

  // ─── Resume ───────────────────────────────────────────────────────────────
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      try {
        mediaRecorderRef.current.resume();
      } catch (_) {}
      setIsPaused(false);
      startTimer(accumulatedRef.current);
    }
  }, [startTimer]);

  // ─── Stop (save) ──────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    setIsRecording(false);
    setIsPaused(false);
  }, [stopTimer]);

  // ─── Cancel (discard) ─────────────────────────────────────────────────────
  const cancelRecording = useCallback(() => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    stopStream();
    chunksRef.current = [];
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setAudioBlob(null);
    setAudioUrl(null);
    deactivateKeepAwake();
  }, [stopTimer, stopStream, deactivateKeepAwake]);

  // ─── Base64 conversion ────────────────────────────────────────────────────
  const getAudioBase64 = useCallback(async () => {
    if (!audioBlob) return null;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  }, [audioBlob]);

  // ─── Formatted duration ───────────────────────────────────────────────────
  const formattedDuration = (() => {
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  })();

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    isRecording,
    isPaused,
    duration,
    formattedDuration,
    maxDuration: MAX_DURATION_SECONDS,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    getAudioBase64,
  };
}
