import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook personnalisé pour l'enregistrement vocal.
 * 
 * Utilise l'API MediaRecorder pour capturer l'audio du micro.
 * Gère le timer, la sauvegarde en base64, et tente de
 * maintenir l'enregistrement actif en arrière-plan via KeepAwake.
 */
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
  const pausedDurationRef = useRef(0);
  const streamRef = useRef(null);

  // Try to use KeepAwake on Capacitor
  const activateKeepAwake = useCallback(async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { KeepAwake } = await import('@capacitor-community/keep-awake');
        await KeepAwake.keepAwake();
      }
    } catch (e) {
      // KeepAwake not available, continue without it
    }
  }, []);

  const deactivateKeepAwake = useCallback(async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { KeepAwake } = await import('@capacitor-community/keep-awake');
        await KeepAwake.allowSleep();
      }
    } catch (e) {
      // Silently ignore
    }
  }, []);

  // ─── Start recording ──────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      setAudioUrl(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Choose supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        deactivateKeepAwake();
      };

      mediaRecorder.onerror = (e) => {
        setError('Erreur d\'enregistrement: ' + e.message);
        setIsRecording(false);
        deactivateKeepAwake();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      // Start timer
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;
      setDuration(0);
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000) - pausedDurationRef.current;
        setDuration(elapsed);
      }, 500);

      setIsRecording(true);
      setIsPaused(false);

      // Keep screen awake during recording
      activateKeepAwake();
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Permission micro refusée. Autorise l\'accès au microphone.');
      } else if (err.name === 'NotFoundError') {
        setError('Aucun microphone détecté.');
      } else {
        setError('Impossible de démarrer l\'enregistrement: ' + err.message);
      }
    }
  }, [activateKeepAwake, deactivateKeepAwake]);

  // ─── Pause recording ──────────────────────────────────────────────
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  // ─── Resume recording ─────────────────────────────────────────────
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Resume timer
      const pauseOffset = duration;
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;
      timerRef.current = setInterval(() => {
        const elapsed = pauseOffset + Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 500);
    }
  }, [duration]);

  // ─── Stop recording ───────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  // ─── Cancel recording (discard) ───────────────────────────────────
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    chunksRef.current = [];
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setAudioBlob(null);
    setAudioUrl(null);
    deactivateKeepAwake();
  }, [deactivateKeepAwake]);

  // ─── Convert blob to base64 for Firestore storage ─────────────────
  const blobToBase64 = useCallback((blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  // ─── Get audio as base64 ──────────────────────────────────────────
  const getAudioBase64 = useCallback(async () => {
    if (!audioBlob) return null;
    return await blobToBase64(audioBlob);
  }, [audioBlob, blobToBase64]);

  // ─── Format duration for display ──────────────────────────────────
  const formattedDuration = (() => {
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  })();

  // ─── Cleanup on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    // State
    isRecording,
    isPaused,
    duration,
    formattedDuration,
    audioBlob,
    audioUrl,
    error,
    // Actions
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    getAudioBase64,
  };
}
