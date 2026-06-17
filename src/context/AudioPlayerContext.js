import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

const AudioPlayerContext = createContext(null);

/**
 * Global Audio Player — persiste entre les navigations de pages.
 * L'élément <audio> est monté une seule fois dans App.js
 * et jamais démonté.
 */
export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(new Audio());
  const [currentSrc, setCurrentSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentNoteId, setCurrentNoteId] = useState(null);

  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const play = useCallback((src, noteId) => {
    const audio = audioRef.current;
    if (currentSrc !== src) {
      audio.src = src;
      audio.load();
      setCurrentSrc(src);
      setProgress(0);
    }
    setCurrentNoteId(noteId || null);
    audio.play().catch(() => {});
  }, [currentSrc]);

  const pause = useCallback(() => {
    audioRef.current.pause();
  }, []);

  const toggle = useCallback((src, noteId) => {
    const audio = audioRef.current;
    if (currentSrc === src && !audio.paused) {
      audio.pause();
    } else {
      play(src, noteId);
    }
  }, [currentSrc, play]);

  const seek = useCallback((pct) => {
    const audio = audioRef.current;
    if (audio.duration) {
      audio.currentTime = (pct / 100) * audio.duration;
    }
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setProgress(0);
    setCurrentNoteId(null);
  }, []);

  const isCurrentNote = useCallback((noteId) => currentNoteId === noteId, [currentNoteId]);
  const isCurrentSrc = useCallback((src) => currentSrc === src, [currentSrc]);

  return (
    <AudioPlayerContext.Provider
      value={{
        isPlaying,
        progress,
        duration,
        currentSrc,
        currentNoteId,
        play,
        pause,
        toggle,
        seek,
        stop,
        isCurrentNote,
        isCurrentSrc,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error('useAudioPlayer must be used inside AudioPlayerProvider');
  return ctx;
}
