import type { Locale } from '@/types/i18n';
import type { VoiceError } from '@/types/voice';
import { getSpeechRecognitionConstructor } from './featureDetection';

/**
 * Speech Recognition Wrapper
 *
 * Provides a clean abstraction over the Web Speech API SpeechRecognition
 * Handles browser compatibility, error handling, and language support
 */

export interface SpeechRecognitionConfig {
  /** Language code (e.g., 'en-US', 'ur-PK') */
  language: string;

  /** Whether to return interim (partial) results */
  interimResults?: boolean;

  /** Maximum number of alternative transcriptions to return */
  maxAlternatives?: number;

  /** Whether recognition should continue after the user stops speaking */
  continuous?: boolean;
}

export interface SpeechRecognitionCallbacks {
  /** Called when speech recognition starts */
  onStart?: () => void;

  /** Called when speech is detected */
  onSpeechStart?: () => void;

  /** Called when speech stops */
  onSpeechEnd?: () => void;

  /** Called with interim (partial) results */
  onInterimResult?: (transcript: string) => void;

  /** Called with final results */
  onFinalResult?: (transcript: string, confidence: number) => void;

  /** Called when recognition ends */
  onEnd?: () => void;

  /** Called on errors */
  onError?: (error: VoiceError) => void;

  /** Called on no speech detected */
  onNoMatch?: () => void;
}

/**
 * Map locale to speech recognition language code
 */
function getLanguageCode(locale: Locale): string {
  const languageMap: Record<Locale, string> = {
    en: 'en-US',
    ur: 'ur-PK',
  };

  return languageMap[locale] || 'en-US';
}

/**
 * Create and configure a speech recognition instance
 */
export class SpeechRecognitionWrapper {
  private recognition: SpeechRecognition | null = null;
  private isRecognizing = false;
  private config: SpeechRecognitionConfig;
  private callbacks: SpeechRecognitionCallbacks;

  constructor(
    locale: Locale,
    callbacks: SpeechRecognitionCallbacks,
    customConfig?: Partial<SpeechRecognitionConfig>
  ) {
    this.config = {
      language: getLanguageCode(locale),
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
      ...customConfig,
    };

    this.callbacks = callbacks;
    this.initialize();
  }

  /**
   * Initialize speech recognition instance
   */
  private initialize(): void {
    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      this.callbacks.onError?.({
        code: 'not-allowed',
        message: 'Speech recognition is not supported in this browser',
        timestamp: Date.now(),
      });
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    } catch (error) {
      this.callbacks.onError?.({
        code: 'not-allowed',
        message: 'Failed to initialize speech recognition',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Configure speech recognition instance
   */
  private setupRecognition(): void {
    if (!this.recognition) return;

    // Set configuration
    this.recognition.lang = this.config.language;
    this.recognition.interimResults = this.config.interimResults ?? true;
    this.recognition.maxAlternatives = this.config.maxAlternatives ?? 1;
    this.recognition.continuous = this.config.continuous ?? false;

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isRecognizing = true;
      this.callbacks.onStart?.();
    };

    this.recognition.onspeechstart = () => {
      this.callbacks.onSpeechStart?.();
    };

    this.recognition.onspeechend = () => {
      this.callbacks.onSpeechEnd?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.handleResult(event);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.handleError(event);
    };

    this.recognition.onend = () => {
      this.isRecognizing = false;
      this.callbacks.onEnd?.();
    };

    this.recognition.onnomatch = () => {
      this.callbacks.onNoMatch?.();
    };
  }

  /**
   * Handle speech recognition results
   */
  private handleResult(event: SpeechRecognitionEvent): void {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;

      if (result.isFinal) {
        this.callbacks.onFinalResult?.(transcript, confidence);
      } else {
        this.callbacks.onInterimResult?.(transcript);
      }
    }
  }

  /**
   * Handle speech recognition errors
   */
  private handleError(event: SpeechRecognitionErrorEvent): void {
    const voiceError: VoiceError = {
      code: event.error as VoiceError['code'],
      message: this.getErrorMessage(event.error),
      timestamp: Date.now(),
    };

    this.callbacks.onError?.(voiceError);
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'Microphone not available. Please check your microphone.',
      'not-allowed':
        'Microphone permission denied. Please allow microphone access.',
      'network': 'Network error. Please check your internet connection.',
      aborted: 'Speech recognition was aborted.',
      'bad-grammar': 'Speech recognition grammar error.',
      'language-not-supported':
        'Language not supported. Please use a supported language.',
    };

    return errorMessages[error] || `Speech recognition error: ${error}`;
  }

  /**
   * Start speech recognition
   */
  start(): void {
    if (!this.recognition) {
      this.callbacks.onError?.({
        code: 'not-allowed',
        message: 'Speech recognition is not initialized',
        timestamp: Date.now(),
      });
      return;
    }

    if (this.isRecognizing) {
      console.warn('Speech recognition is already running');
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      this.callbacks.onError?.({
        code: 'not-allowed',
        message: 'Failed to start speech recognition',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Stop speech recognition
   */
  stop(): void {
    if (!this.recognition) return;

    if (this.isRecognizing) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Failed to stop speech recognition:', error);
      }
    }
  }

  /**
   * Abort speech recognition (stop immediately without processing results)
   */
  abort(): void {
    if (!this.recognition) return;

    if (this.isRecognizing) {
      try {
        this.recognition.abort();
      } catch (error) {
        console.error('Failed to abort speech recognition:', error);
      }
    }
  }

  /**
   * Update language configuration
   */
  updateLanguage(locale: Locale): void {
    const newLanguage = getLanguageCode(locale);
    this.config.language = newLanguage;

    if (this.recognition) {
      this.recognition.lang = newLanguage;
    }
  }

  /**
   * Check if currently recognizing
   */
  getIsRecognizing(): boolean {
    return this.isRecognizing;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.recognition = null;
  }
}

/**
 * Create a simple one-shot speech recognition session
 *
 * @param locale - Language locale
 * @param onResult - Callback with final transcript
 * @param onError - Callback for errors
 * @returns Function to start recognition
 */
export function createSimpleRecognition(
  locale: Locale,
  onResult: (transcript: string) => void,
  onError?: (error: VoiceError) => void
): () => void {
  const recognition = new SpeechRecognitionWrapper(locale, {
    onFinalResult: (transcript) => {
      onResult(transcript);
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return () => recognition.start();
}

/**
 * Language support information
 */
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en-US',
    name: 'English (US)',
    supported: true,
  },
  ur: {
    code: 'ur-PK',
    name: 'Urdu (Pakistan)',
    supported: true,
  },
} as const;

/**
 * Check if a language is supported for speech recognition
 */
export function isLanguageSupported(locale: Locale): boolean {
  return SUPPORTED_LANGUAGES[locale]?.supported ?? false;
}
