import type { Locale } from '@/types/i18n';
import { getVoicesForLanguage } from './featureDetection';

/**
 * Text-to-Speech (TTS) Implementation
 *
 * Provides speech synthesis functionality using the Web Speech API
 * Supports multiple languages with voice selection
 */

export interface TextToSpeechConfig {
  /** Language code (e.g., 'en-US', 'ur-PK') */
  language: string;

  /** Speech rate (0.1 to 10, default 1.0) */
  rate?: number;

  /** Speech pitch (0 to 2, default 1.0) */
  pitch?: number;

  /** Speech volume (0 to 1, default 1.0) */
  volume?: number;

  /** Preferred voice name (optional) */
  voice?: string;
}

export interface TextToSpeechCallbacks {
  /** Called when speech starts */
  onStart?: () => void;

  /** Called when speech ends */
  onEnd?: () => void;

  /** Called on speech errors */
  onError?: (error: Error) => void;

  /** Called on speech pause */
  onPause?: () => void;

  /** Called on speech resume */
  onResume?: () => void;

  /** Called for speech boundary events (word, sentence) */
  onBoundary?: (event: SpeechSynthesisEvent) => void;
}

/**
 * Map locale to speech synthesis language code
 */
function getLanguageCode(locale: Locale): string {
  const languageMap: Record<Locale, string> = {
    en: 'en-US',
    ur: 'ur-PK',
  };

  return languageMap[locale] || 'en-US';
}

/**
 * Text-to-Speech Wrapper Class
 */
export class TextToSpeechWrapper {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private config: TextToSpeechConfig;
  private callbacks: TextToSpeechCallbacks;
  private isSpeaking = false;

  constructor(
    locale: Locale,
    callbacks: TextToSpeechCallbacks = {},
    customConfig?: Partial<TextToSpeechConfig>
  ) {
    this.config = {
      language: getLanguageCode(locale),
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      ...customConfig,
    };

    this.callbacks = callbacks;
    this.initialize();
  }

  /**
   * Initialize speech synthesis
   */
  private initialize(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.error('Speech synthesis is not supported in this browser');
      return;
    }

    this.synth = window.speechSynthesis;

    // Wait for voices to load
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Voices are now loaded
      };
    }
  }

  /**
   * Create and configure a speech utterance
   */
  private createUtterance(text: string): SpeechSynthesisUtterance {
    const utterance = new SpeechSynthesisUtterance(text);

    // Set configuration
    utterance.lang = this.config.language;
    utterance.rate = this.config.rate ?? 1.0;
    utterance.pitch = this.config.pitch ?? 1.0;
    utterance.volume = this.config.volume ?? 1.0;

    // Set voice if specified
    if (this.config.voice) {
      const voice = this.findVoice(this.config.voice);
      if (voice) {
        utterance.voice = voice;
      }
    } else {
      // Auto-select best voice for language
      const voice = this.selectBestVoice();
      if (voice) {
        utterance.voice = voice;
      }
    }

    // Set up event handlers
    utterance.onstart = () => {
      this.isSpeaking = true;
      this.callbacks.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.callbacks.onEnd?.();
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.callbacks.onError?.(new Error(`Speech synthesis error: ${event.error}`));
    };

    utterance.onpause = () => {
      this.callbacks.onPause?.();
    };

    utterance.onresume = () => {
      this.callbacks.onResume?.();
    };

    utterance.onboundary = (event) => {
      this.callbacks.onBoundary?.(event);
    };

    return utterance;
  }

  /**
   * Find a voice by name
   */
  private findVoice(voiceName: string): SpeechSynthesisVoice | null {
    if (!this.synth) return null;

    const voices = this.synth.getVoices();
    return voices.find((voice) => voice.name === voiceName) || null;
  }

  /**
   * Select the best voice for the current language
   */
  private selectBestVoice(): SpeechSynthesisVoice | null {
    if (!this.synth) return null;

    const voices = getVoicesForLanguage(this.config.language);

    if (voices.length === 0) return null;

    // Prefer local voices over remote
    const localVoice = voices.find((voice) => voice.localService);
    if (localVoice) return localVoice;

    // Fall back to first available voice
    return voices[0];
  }

  /**
   * Speak text
   *
   * @param text - Text to speak
   * @param options - Optional configuration overrides
   */
  speak(text: string, options?: Partial<TextToSpeechConfig>): void {
    if (!this.synth) {
      this.callbacks.onError?.(new Error('Speech synthesis not available'));
      return;
    }

    // Stop any ongoing speech
    this.stop();

    // Apply options if provided
    if (options) {
      this.config = { ...this.config, ...options };
    }

    // Create and speak utterance
    this.currentUtterance = this.createUtterance(text);
    this.synth.speak(this.currentUtterance);
  }

  /**
   * Speak multiple texts in sequence
   *
   * @param texts - Array of texts to speak
   */
  speakSequence(texts: string[]): void {
    if (!this.synth) {
      this.callbacks.onError?.(new Error('Speech synthesis not available'));
      return;
    }

    // Stop any ongoing speech
    this.stop();

    // Queue all utterances
    texts.forEach((text) => {
      const utterance = this.createUtterance(text);
      this.synth!.speak(utterance);
    });
  }

  /**
   * Pause speech
   */
  pause(): void {
    if (!this.synth || !this.isSpeaking) return;

    try {
      this.synth.pause();
    } catch (error) {
      console.error('Failed to pause speech:', error);
    }
  }

  /**
   * Resume speech
   */
  resume(): void {
    if (!this.synth || !this.synth.paused) return;

    try {
      this.synth.resume();
    } catch (error) {
      console.error('Failed to resume speech:', error);
    }
  }

  /**
   * Stop speech
   */
  stop(): void {
    if (!this.synth) return;

    try {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    } catch (error) {
      console.error('Failed to stop speech:', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TextToSpeechConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Update language
   */
  updateLanguage(locale: Locale): void {
    this.config.language = getLanguageCode(locale);
  }

  /**
   * Get available voices for current language
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return getVoicesForLanguage(this.config.language);
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Check if speech is paused
   */
  getIsPaused(): boolean {
    return this.synth?.paused ?? false;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.synth = null;
    this.currentUtterance = null;
  }
}

/**
 * Create a simple one-shot text-to-speech function
 *
 * @param locale - Language locale
 * @param text - Text to speak
 * @param onEnd - Optional callback when speech ends
 */
export function speakText(
  locale: Locale,
  text: string,
  onEnd?: () => void
): void {
  const tts = new TextToSpeechWrapper(locale, {
    onEnd: () => {
      onEnd?.();
      tts.destroy();
    },
  });

  tts.speak(text);
}

/**
 * Speak a list of items with pauses
 *
 * @param locale - Language locale
 * @param items - Array of text items to speak
 * @param onEnd - Optional callback when all items are spoken
 */
export function speakList(
  locale: Locale,
  items: string[],
  onEnd?: () => void
): void {
  const tts = new TextToSpeechWrapper(locale, {
    onEnd: () => {
      onEnd?.();
      tts.destroy();
    },
  });

  tts.speakSequence(items);
}

/**
 * Default speech rates for different use cases
 */
export const SPEECH_RATES = {
  SLOW: 0.75,
  NORMAL: 1.0,
  FAST: 1.25,
  VERY_FAST: 1.5,
} as const;

/**
 * Default speech pitches
 */
export const SPEECH_PITCHES = {
  LOW: 0.8,
  NORMAL: 1.0,
  HIGH: 1.2,
} as const;

/**
 * Language-specific TTS settings
 */
export const LANGUAGE_TTS_SETTINGS: Record<Locale, Partial<TextToSpeechConfig>> = {
  en: {
    rate: SPEECH_RATES.NORMAL,
    pitch: SPEECH_PITCHES.NORMAL,
  },
  ur: {
    rate: SPEECH_RATES.SLOW, // Slower for Urdu for better clarity
    pitch: SPEECH_PITCHES.NORMAL,
  },
};

/**
 * Get recommended TTS settings for a locale
 */
export function getRecommendedSettings(locale: Locale): Partial<TextToSpeechConfig> {
  return LANGUAGE_TTS_SETTINGS[locale] || {};
}
