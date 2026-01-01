'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from './useLanguage';
import {
  TextToSpeechWrapper,
  getRecommendedSettings,
  SPEECH_RATES,
} from '@/lib/voice/textToSpeech';
import { isSpeechSynthesisSupported } from '@/lib/voice/featureDetection';
import type { TextToSpeechConfig } from '@/lib/voice/textToSpeech';

export interface TextToSpeechState {
  /** Whether text-to-speech is currently speaking */
  isSpeaking: boolean;

  /** Whether speech is paused */
  isPaused: boolean;

  /** Current speech rate (0.1 to 10) */
  rate: number;

  /** Current speech pitch (0 to 2) */
  pitch: number;

  /** Current speech volume (0 to 1) */
  volume: number;

  /** Error message if any */
  error: string | null;
}

/**
 * Custom hook for text-to-speech functionality
 *
 * Features:
 * - Speak text with configurable voice settings
 * - Speak lists of items sequentially
 * - Pause/resume/stop controls
 * - Adjust rate, pitch, and volume
 * - Language-aware voice selection
 * - Error handling
 *
 * @returns TTS state and control functions
 */
export function useTextToSpeech() {
  const { locale } = useLanguage();
  const ttsRef = useRef<TextToSpeechWrapper | null>(null);

  const [state, setState] = useState<TextToSpeechState>({
    isSpeaking: false,
    isPaused: false,
    rate: SPEECH_RATES.NORMAL,
    pitch: 1.0,
    volume: 1.0,
    error: null,
  });

  /**
   * Initialize text-to-speech engine
   */
  const initializeTTS = useCallback(() => {
    if (ttsRef.current) {
      ttsRef.current.destroy();
    }

    const recommendedSettings = getRecommendedSettings(locale);

    ttsRef.current = new TextToSpeechWrapper(
      locale,
      {
        onStart: () => {
          setState((prev) => ({
            ...prev,
            isSpeaking: true,
            isPaused: false,
            error: null,
          }));
        },

        onEnd: () => {
          setState((prev) => ({
            ...prev,
            isSpeaking: false,
            isPaused: false,
          }));
        },

        onError: (error: Error) => {
          setState((prev) => ({
            ...prev,
            error: error.message,
            isSpeaking: false,
            isPaused: false,
          }));
        },

        onPause: () => {
          setState((prev) => ({ ...prev, isPaused: true }));
        },

        onResume: () => {
          setState((prev) => ({ ...prev, isPaused: false }));
        },
      },
      {
        language: locale,
        rate: state.rate,
        pitch: state.pitch,
        volume: state.volume,
        ...recommendedSettings,
      }
    );
  }, [locale, state.rate, state.pitch, state.volume]);

  /**
   * Speak text
   *
   * @param text - Text to speak
   * @param options - Optional configuration overrides
   */
  const speak = useCallback(
    (text: string, options?: Partial<TextToSpeechConfig>) => {
      if (!isSpeechSynthesisSupported()) {
        setState((prev) => ({
          ...prev,
          error: 'Text-to-speech is not supported in this browser',
        }));
        return;
      }

      if (!text.trim()) {
        setState((prev) => ({
          ...prev,
          error: 'No text provided to speak',
        }));
        return;
      }

      if (!ttsRef.current) {
        initializeTTS();
      }

      ttsRef.current?.speak(text, options);
    },
    [initializeTTS]
  );

  /**
   * Speak multiple texts in sequence
   *
   * @param texts - Array of texts to speak
   */
  const speakSequence = useCallback(
    (texts: string[]) => {
      if (!isSpeechSynthesisSupported()) {
        setState((prev) => ({
          ...prev,
          error: 'Text-to-speech is not supported in this browser',
        }));
        return;
      }

      if (texts.length === 0) {
        setState((prev) => ({
          ...prev,
          error: 'No texts provided to speak',
        }));
        return;
      }

      if (!ttsRef.current) {
        initializeTTS();
      }

      ttsRef.current?.speakSequence(texts);
    },
    [initializeTTS]
  );

  /**
   * Pause speech
   */
  const pause = useCallback(() => {
    ttsRef.current?.pause();
  }, []);

  /**
   * Resume speech
   */
  const resume = useCallback(() => {
    ttsRef.current?.resume();
  }, []);

  /**
   * Stop speech
   */
  const stop = useCallback(() => {
    ttsRef.current?.stop();
    setState((prev) => ({
      ...prev,
      isSpeaking: false,
      isPaused: false,
    }));
  }, []);

  /**
   * Set speech rate
   *
   * @param rate - Speech rate (0.1 to 10, default 1.0)
   */
  const setRate = useCallback((rate: number) => {
    const clampedRate = Math.max(0.1, Math.min(10, rate));
    setState((prev) => ({ ...prev, rate: clampedRate }));
    ttsRef.current?.updateConfig({ rate: clampedRate });
  }, []);

  /**
   * Set speech pitch
   *
   * @param pitch - Speech pitch (0 to 2, default 1.0)
   */
  const setPitch = useCallback((pitch: number) => {
    const clampedPitch = Math.max(0, Math.min(2, pitch));
    setState((prev) => ({ ...prev, pitch: clampedPitch }));
    ttsRef.current?.updateConfig({ pitch: clampedPitch });
  }, []);

  /**
   * Set speech volume
   *
   * @param volume - Speech volume (0 to 1, default 1.0)
   */
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState((prev) => ({ ...prev, volume: clampedVolume }));
    ttsRef.current?.updateConfig({ volume: clampedVolume });
  }, []);

  /**
   * Reset all settings to default
   */
  const resetSettings = useCallback(() => {
    const recommendedSettings = getRecommendedSettings(locale);
    const defaultRate = recommendedSettings.rate ?? SPEECH_RATES.NORMAL;
    const defaultPitch = recommendedSettings.pitch ?? 1.0;
    const defaultVolume = recommendedSettings.volume ?? 1.0;

    setState((prev) => ({
      ...prev,
      rate: defaultRate,
      pitch: defaultPitch,
      volume: defaultVolume,
    }));

    ttsRef.current?.updateConfig({
      rate: defaultRate,
      pitch: defaultPitch,
      volume: defaultVolume,
    });
  }, [locale]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Get available voices for current language
   */
  const getAvailableVoices = useCallback(() => {
    if (!ttsRef.current) {
      initializeTTS();
    }
    return ttsRef.current?.getAvailableVoices() ?? [];
  }, [initializeTTS]);

  /**
   * Reinitialize TTS when locale changes
   */
  useEffect(() => {
    initializeTTS();
  }, [locale, initializeTTS]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      ttsRef.current?.destroy();
    };
  }, []);

  return {
    /** Current TTS state */
    state,

    /** Speak text */
    speak,

    /** Speak multiple texts in sequence */
    speakSequence,

    /** Pause speech */
    pause,

    /** Resume speech */
    resume,

    /** Stop speech */
    stop,

    /** Set speech rate (0.1 to 10) */
    setRate,

    /** Set speech pitch (0 to 2) */
    setPitch,

    /** Set speech volume (0 to 1) */
    setVolume,

    /** Reset all settings to default */
    resetSettings,

    /** Clear error state */
    clearError,

    /** Get available voices for current language */
    getAvailableVoices,

    /** Whether TTS is supported */
    isSupported: isSpeechSynthesisSupported(),
  };
}

/**
 * Convenience hook for simple one-time speech
 *
 * @returns Simple speak function
 */
export function useSimpleSpeech() {
  const { locale } = useLanguage();

  const speak = useCallback(
    (text: string) => {
      if (!isSpeechSynthesisSupported()) {
        console.error('Text-to-speech is not supported');
        return;
      }

      const recommendedSettings = getRecommendedSettings(locale);
      const tts = new TextToSpeechWrapper(locale, {}, recommendedSettings);
      tts.speak(text);

      // Auto-cleanup after speech ends
      setTimeout(() => {
        tts.destroy();
      }, 60000); // 1 minute timeout
    },
    [locale]
  );

  return speak;
}
