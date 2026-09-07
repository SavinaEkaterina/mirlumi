// Centralized Speech & Voice Manager for Lumi character using Web Speech API (SpeechSynthesis)

let voiceSilenceMode = false;
let speechIdCounter = 0;
let currentSpeechId = 0;
let currentSpeechKey: string | null = null;
let isSpeaking = false;
let activeSafetyTimer: NodeJS.Timeout | null = null;
let pendingSpeakTimeout: NodeJS.Timeout | null = null;
let lastCancelTime = 0;

/**
 * Toggle silence mode (e.g., during Game 2 sequence demonstration phase).
 * When enabled, all non-forced speech calls are blocked and current speech is cancelled.
 */
export const setVoiceSilenceMode = (silence: boolean) => {
  voiceSilenceMode = silence;
  if (silence) {
    stopLumiVoice();
  }
};

export const isLumiSpeaking = (): boolean => isSpeaking;

/**
 * Cancel any ongoing speech synthesis immediately and invalidate all callbacks.
 */
export const stopLumiVoice = () => {
  // Invalidate any ongoing speech request ID
  speechIdCounter++;
  currentSpeechId = speechIdCounter;
  currentSpeechKey = null;
  isSpeaking = false;

  if (activeSafetyTimer) {
    clearTimeout(activeSafetyTimer);
    activeSafetyTimer = null;
  }
  if (pendingSpeakTimeout) {
    clearTimeout(pendingSpeakTimeout);
    pendingSpeakTimeout = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      lastCancelTime = Date.now();
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('Error cancelling speech synthesis:', e);
    }
  }
};

let cachedRuVoice: SpeechSynthesisVoice | null = null;

function getRuVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  if (cachedRuVoice) return cachedRuVoice;

  try {
    const voices = window.speechSynthesis.getVoices();
    const ruVoices = voices.filter((v) => v.lang.includes('ru') || v.lang.includes('RU'));
    if (ruVoices.length === 0) return null;

    // Prefer calm, natural female Russian voices
    const preferredFemaleNames = [
      'google русский',
      'yandex',
      'milena',
      'elena',
      'katya',
      'tatiana',
      'tatyana',
      'victoria',
      'anna',
      'irina',
      'russian female',
    ];

    const femaleVoice = ruVoices.find((v) => {
      const name = v.name.toLowerCase();
      return preferredFemaleNames.some((pref) => name.includes(pref));
    });

    const selected =
      femaleVoice ||
      ruVoices.find((v) => !v.name.toLowerCase().includes('pavel') && !v.name.toLowerCase().includes('male')) ||
      ruVoices[0];

    cachedRuVoice = selected;
    return selected;
  } catch {
    return null;
  }
}

// Pre-warm voices list on load
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedRuVoice = null;
      getRuVoice();
    };
  } catch {
    // Ignore in unsupported environments
  }
}

export interface SpeakOptions {
  soundEnabled?: boolean;
  force?: boolean; // ignore silence mode
  cancelPrevious?: boolean; // default true
  pitch?: number; // default 0.98 (warm, calm, natural motherly pitch)
  rate?: number; // default 0.85 (slow, measured, reassuring pacing)
  onEnd?: () => void;
  speechKey?: string; // event key to prevent duplicate re-triggering during re-renders
  debounceMs?: number; // legacy option kept for backward compatibility
}

/**
 * Main centralized function to trigger Lumi's spoken speech.
 */
export const speakLumi = (text: string, options: SpeakOptions = {}) => {
  const {
    soundEnabled = true,
    force = false,
    cancelPrevious = true,
    pitch = 0.98,
    rate = 0.85,
    onEnd,
    speechKey,
  } = options;

  if (!soundEnabled) {
    if (onEnd) onEnd();
    return;
  }
  if (voiceSilenceMode && !force) {
    if (onEnd) onEnd();
    return;
  }
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  // Remove emojis, technical brackets, and combining accent marks (U+0300-U+036F)
  let cleanText = text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\(\)\[\]\{\}]/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // =========================================================================
  // PHONETIC & STRESS AUDIT DICTIONARY FOR RUSSIAN TTS (LUMI'S VOICE)
  // Ensures natural, grammatically correct phrasing without modifying screen text.
  // Note: All U+0301 accent marks are removed to prevent browser TTS stuttering.
  // =========================================================================

  // 1. Natural spoken phrasing for baskets: use "корзинам", "корзину", "корзины"
  cleanText = cleanText
    .replace(/\bпо\s+корзинкам\b/gi, 'по корзинам')
    .replace(/\bв\s+корзинку\b/gi, 'в корзину')
    .replace(/\bиз\s+корзинки\b/gi, 'из корзины')
    .replace(/\bкорзинкам\b/gi, 'корзинам')
    .replace(/\bКорзинкам\b/gi, 'Корзинам')
    .replace(/\bкорзинки\b/gi, 'корзины')
    .replace(/\bКорзинки\b/gi, 'Корзины')
    .replace(/\bкорзинку\b/gi, 'корзину')
    .replace(/\bКорзинку\b/gi, 'Корзину');

  // Format speech for calm, motherly pacing: replace harsh exclamation marks with calm periods/ellipses
  cleanText = cleanText.replace(/!+/g, '.');

  // Add gentle natural pauses after key introductory and supporting phrases
  cleanText = cleanText
    .replace(/Посмотри внимательно[\.\s]*/gi, 'Посмотри внимательно… ')
    .replace(/Ничего страшного[\.\s]*/gi, 'Ничего страшного… ')
    .replace(/Давай попробуем ещё раз[\.\s]*/gi, 'Давай попробуем ещё раз… ')
    .replace(/Давай попробуем еще раз[\.\s]*/gi, 'Давай попробуем ещё раз… ')
    .replace(/Да, правильно[\.\s]*/gi, 'Да… правильно. ')
    .replace(/Да, отлично[\.\s]*/gi, 'Да… отлично. ')
    .replace(/Отлично[\.\s]*/gi, 'Отлично… ')
    .replace(/Ура[\.\s]*/gi, 'Ура… ')
    .replace(/Молодец[\.\s]*/gi, 'Молодец… ')
    .replace(/Получилось[\.\s]*/gi, 'Получилось… ');

  cleanText = cleanText
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/…\s*…/g, '…')
    .trim();

  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  const effectiveKey = speechKey || cleanText;

  // DEDUPLICATION: If this exact speech is ALREADY currently active or pending, do NOT restart it!
  if ((isSpeaking || pendingSpeakTimeout !== null) && currentSpeechKey === effectiveKey) {
    return;
  }

  // Assign a new unique speech request ID
  speechIdCounter++;
  const thisSpeechId = speechIdCounter;
  currentSpeechId = thisSpeechId;
  currentSpeechKey = effectiveKey;

  // Clear previous safety/pending timers
  if (activeSafetyTimer) {
    clearTimeout(activeSafetyTimer);
    activeSafetyTimer = null;
  }
  if (pendingSpeakTimeout) {
    clearTimeout(pendingSpeakTimeout);
    pendingSpeakTimeout = null;
  }

  // Cancel any ongoing browser speech
  if (cancelPrevious || isSpeaking || window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    try {
      lastCancelTime = Date.now();
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  isSpeaking = true;

  // 80ms delay allows browser speech engine to process cancel() cleanly before starting new utterance
  const elapsedSinceCancel = Date.now() - lastCancelTime;
  const startDelay = Math.max(80, 80 - elapsedSinceCancel);

  pendingSpeakTimeout = setTimeout(() => {
    pendingSpeakTimeout = null;

    // If a newer speech request superseded this one during the delay, abort!
    if (currentSpeechId !== thisSpeechId) {
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'ru-RU';
      utterance.pitch = pitch;
      utterance.rate = rate;

      const ruVoice = getRuVoice();
      if (ruVoice) {
        utterance.voice = ruVoice;
      }

      let hasFinished = false;

      const finishSpeech = (triggerCallback: boolean) => {
        if (hasFinished) return;
        hasFinished = true;

        if (activeSafetyTimer) {
          clearTimeout(activeSafetyTimer);
          activeSafetyTimer = null;
        }

        // Only update global state and fire onEnd if this request is STILL the current active request
        if (currentSpeechId === thisSpeechId) {
          isSpeaking = false;
          currentSpeechKey = null;
          if (triggerCallback && onEnd) {
            onEnd();
          }
        }
      };

      utterance.onstart = () => {
        if (currentSpeechId !== thisSpeechId) {
          try {
            window.speechSynthesis.cancel();
          } catch {}
          return;
        }
        isSpeaking = true;
      };

      utterance.onend = () => {
        finishSpeech(true);
      };

      utterance.onerror = () => {
        // 'interrupted' or 'canceled' errors happen when cancel() is called.
        // finishSpeech checks currentSpeechId === thisSpeechId so canceled calls won't fire onEnd.
        finishSpeech(true);
      };

      // Safety fallback timer in case browser fails to fire onend/onerror
      const maxMs = Math.max(3000, cleanText.length * 180);
      activeSafetyTimer = setTimeout(() => {
        if (currentSpeechId === thisSpeechId) {
          finishSpeech(true);
        }
      }, maxMs);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      if (currentSpeechId === thisSpeechId) {
        isSpeaking = false;
        currentSpeechKey = null;
        if (onEnd) onEnd();
      }
    }
  }, startDelay);
};
