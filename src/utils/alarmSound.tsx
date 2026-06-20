/**
 * alarmSound.js — Professional Alarm Sound Generator
 *
 * Utilise OfflineAudioContext pour pré-rendre une sonnerie professionnelle
 * en un blob WAV. Ce fichier audio réel est ensuite joué via Audio(),
 * ce qui est beaucoup plus fiable que le Web Audio en temps réel,
 * surtout en arrière-plan et sur mobile.
 */

// Convert AudioBuffer to WAV ArrayBuffer
function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitsPerSample = 16;

  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // WAV header
  writeString(0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave and write samples
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

/**
 * Generate a professional, melodic alarm chime using OfflineAudioContext.
 * Creates a beautiful rising chord progression: C5 → E5 → G5 → C6
 * with harmonics, gentle reverb-like tail, and smooth envelope.
 *
 * @returns {Promise<string>} Blob URL for the generated WAV audio
 */
async function generateAlarmBlobUrl() {
  const sampleRate = 44100;
  const duration = 2.8; // seconds for one alarm cycle
  const ctx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);

  // Helper: create a single tone with harmonics
  function createTone(freq, startTime, dur, volume = 0.15) {
    // Fundamental
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = freq;
    gain1.gain.setValueAtTime(0, startTime);
    gain1.gain.linearRampToValueAtTime(volume, startTime + 0.015);
    gain1.gain.setValueAtTime(volume, startTime + dur * 0.6);
    gain1.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(startTime);
    osc1.stop(startTime + dur + 0.05);

    // 2nd harmonic (octave above, softer) for richness
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = freq * 2;
    const vol2 = volume * 0.25;
    gain2.gain.setValueAtTime(0, startTime);
    gain2.gain.linearRampToValueAtTime(vol2, startTime + 0.015);
    gain2.gain.setValueAtTime(vol2, startTime + dur * 0.4);
    gain2.gain.exponentialRampToValueAtTime(0.001, startTime + dur * 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(startTime);
    osc2.stop(startTime + dur + 0.05);

    // 3rd harmonic (soft triangle for warmth)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "triangle";
    osc3.frequency.value = freq * 1.5; // Perfect fifth
    const vol3 = volume * 0.12;
    gain3.gain.setValueAtTime(0, startTime);
    gain3.gain.linearRampToValueAtTime(vol3, startTime + 0.02);
    gain3.gain.exponentialRampToValueAtTime(0.001, startTime + dur * 0.7);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(startTime);
    osc3.stop(startTime + dur + 0.05);
  }

  // Alarm pattern: Rising melodic chime
  // Pattern 1: C5 → E5 → G5 (arpeggiated major chord)
  createTone(523.25, 0.0, 0.45, 0.14); // C5
  createTone(659.25, 0.15, 0.45, 0.16); // E5
  createTone(783.99, 0.3, 0.55, 0.18); // G5

  // Brief pause, then resolution
  createTone(1046.5, 0.65, 0.7, 0.2); // C6 — resolution, bright

  // Second phrase — repeat higher, more urgent
  createTone(659.25, 1.3, 0.35, 0.14); // E5
  createTone(783.99, 1.45, 0.35, 0.16); // G5
  createTone(1046.5, 1.6, 0.45, 0.18); // C6
  createTone(1318.51, 1.8, 0.8, 0.15); // E6 — gentle high resolution

  const renderedBuffer = await ctx.startRendering();
  const wavData = audioBufferToWav(renderedBuffer);
  const blob = new Blob([wavData], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}

// Singleton alarm sound manager
let alarmAudio = null;
let alarmBlobUrl = null;
let isGenerating = false;
let generatePromise = null;

/**
 * Initialize the alarm sound (call once at app startup).
 * Pre-renders the alarm into a WAV blob for instant playback later.
 */
export async function initAlarmSound() {
  if (alarmBlobUrl) return alarmBlobUrl;
  if (isGenerating) return generatePromise;

  isGenerating = true;
  generatePromise = (async () => {
    try {
      const OfflineCtx =
        window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!OfflineCtx) {
        console.warn(
          "OfflineAudioContext not supported, alarm will use fallback",
        );
        return null;
      }
      alarmBlobUrl = await generateAlarmBlobUrl();

      // Pre-create and load the Audio element
      alarmAudio = new Audio(alarmBlobUrl);
      alarmAudio.preload = "auto";
      alarmAudio.volume = 0.85;

      // Force browser to load the audio data
      try {
        await alarmAudio.load();
      } catch (e) {
        // load() may not return a promise in all browsers
      }

      return alarmBlobUrl;
    } catch (e) {
      console.warn("Failed to generate alarm sound:", e);
      return null;
    } finally {
      isGenerating = false;
    }
  })();

  return generatePromise;
}

/**
 * Play the alarm sound.
 * @param {number} loops - Number of times to play
 * @param {string} soundType - The type of sound to play
 * @returns {Promise<void>}
 */
export async function playAlarm(loops = 3, soundType = "default") {
  // If default sound, try the pre-rendered audio first
  if (soundType === "default" && alarmAudio && alarmBlobUrl) {
    let played = 0;

    return new Promise((resolve) => {
      const playNext = async () => {
        played++;
        try {
          alarmAudio.currentTime = 0;
          await alarmAudio.play();

          if (played < loops) {
            alarmAudio.onended = () => {
              // Small gap between loops
              setTimeout(playNext, 300);
            };
          } else {
            alarmAudio.onended = () => resolve();
          }
        } catch (e) {
          console.warn("Audio play failed, trying fallback:", e);
          playFallbackAlarm(soundType);
          resolve();
        }
      };

      playNext();
    });
  }

  // Fallback or custom sounds using Web Audio API
  playFallbackAlarm(soundType);
}

/**
 * Fallback alarm using real-time Web Audio API
 * (used when OfflineAudioContext is not available or custom sound)
 */
function playFallbackAlarm(soundType = "default") {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const now = audioCtx.currentTime;

    const playBeep = (time, freq, dur = 0.3, vol = 0.18, type = "sine") => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.015);
      gain.gain.setValueAtTime(vol, time + dur * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.start(time);
      osc.stop(time + dur + 0.05);
    };

    if (soundType === "digital") {
      // Classic digital alarm (beep-beep-beep)
      for (let rep = 0; rep < 4; rep++) {
        const offset = rep * 1.0;
        playBeep(now + offset + 0.0, 880, 0.15, 0.1, "square");
        playBeep(now + offset + 0.2, 880, 0.15, 0.1, "square");
        playBeep(now + offset + 0.4, 880, 0.15, 0.1, "square");
      }
    } else if (soundType === "zen") {
      // Tibetan bowl (slow, ringing bell)
      playBeep(now + 0.0, 349.23, 2.0, 0.3, "sine");
      playBeep(now + 0.0, 351, 2.0, 0.1, "sine"); // slight detune
      playBeep(now + 2.5, 440, 2.0, 0.3, "sine");
      playBeep(now + 2.5, 442, 2.0, 0.1, "sine");
    } else if (soundType === "nature") {
      // Birds chirping
      for (let rep = 0; rep < 5; rep++) {
        const offset = rep * 0.6;
        playBeep(
          now + offset + 0.0,
          2500 + Math.random() * 500,
          0.1,
          0.05,
          "triangle",
        );
        playBeep(
          now + offset + 0.15,
          3000 + Math.random() * 500,
          0.1,
          0.05,
          "triangle",
        );
      }
    } else {
      // Default fallback
      for (let rep = 0; rep < 2; rep++) {
        const offset = rep * 2.2;
        playBeep(now + offset + 0.0, 523.25, 0.35);
        playBeep(now + offset + 0.15, 659.25, 0.35);
        playBeep(now + offset + 0.3, 783.99, 0.45);
        playBeep(now + offset + 0.6, 1046.5, 0.6, 0.2);
        playBeep(now + offset + 1.2, 659.25, 0.3);
        playBeep(now + offset + 1.35, 783.99, 0.3);
        playBeep(now + offset + 1.5, 1046.5, 0.4);
        playBeep(now + offset + 1.7, 1318.51, 0.5, 0.14);
      }
    }
  } catch (e) {
    console.warn("Fallback alarm also failed:", e);
  }
}

/**
 * Stop the alarm sound if it's currently playing.
 */
export function stopAlarm() {
  if (alarmAudio) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    alarmAudio.onended = null;
  }
}
