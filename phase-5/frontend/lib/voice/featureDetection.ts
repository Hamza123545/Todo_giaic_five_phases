import type { BrowserCapabilities } from '@/types/voice';

/**
 * Detect browser support for Web Speech API features
 *
 * Checks for:
 * - Speech Recognition (SpeechRecognition or webkitSpeechRecognition)
 * - Speech Synthesis (SpeechSynthesis)
 * - localStorage availability
 * - Internationalization API (Intl)
 *
 * @returns Object with feature availability flags
 */
export function detectBrowserCapabilities(): BrowserCapabilities {
  // Server-side rendering check
  if (typeof window === 'undefined') {
    return {
      speechRecognition: false,
      speechSynthesis: false,
      localStorage: false,
      intl: false,
    };
  }

  // Check for Speech Recognition support
  const hasSpeechRecognition =
    'SpeechRecognition' in window ||
    'webkitSpeechRecognition' in window;

  // Check for Speech Synthesis support
  const hasSpeechSynthesis = 'speechSynthesis' in window;

  // Check for localStorage support
  const hasLocalStorage = (() => {
    try {
      const test = '__localStorage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  })();

  // Check for Intl API support
  const hasIntl = 'Intl' in window && typeof window.Intl === 'object';

  return {
    speechRecognition: hasSpeechRecognition,
    speechSynthesis: hasSpeechSynthesis,
    localStorage: hasLocalStorage,
    intl: hasIntl,
  };
}

/**
 * Check if speech recognition is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  return detectBrowserCapabilities().speechRecognition;
}

/**
 * Check if speech synthesis (text-to-speech) is supported
 */
export function isSpeechSynthesisSupported(): boolean {
  return detectBrowserCapabilities().speechSynthesis;
}

/**
 * Check if all voice features are fully supported
 */
export function isVoiceFullySupported(): boolean {
  const capabilities = detectBrowserCapabilities();
  return capabilities.speechRecognition && capabilities.speechSynthesis;
}

/**
 * Get user-friendly error message for unsupported features
 */
export function getUnsupportedFeatureMessage(
  capabilities: BrowserCapabilities
): string | null {
  if (!capabilities.speechRecognition && !capabilities.speechSynthesis) {
    return 'Your browser does not support voice features. Please use Chrome, Edge, or Safari.';
  }

  if (!capabilities.speechRecognition) {
    return 'Your browser does not support voice recognition. Voice commands are unavailable.';
  }

  if (!capabilities.speechSynthesis) {
    return 'Your browser does not support text-to-speech. Task reading is unavailable.';
  }

  return null;
}

/**
 * Get Speech Recognition constructor (handles vendor prefixes)
 */
export function getSpeechRecognitionConstructor():
  | typeof SpeechRecognition
  | null {
  if (typeof window === 'undefined') return null;

  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
}

/**
 * Get available speech synthesis voices for a given language
 *
 * @param lang - Language code (e.g., 'en-US', 'ur-PK')
 * @returns Array of available voices for the language
 */
export function getVoicesForLanguage(lang: string): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return [];
  }

  const voices = window.speechSynthesis.getVoices();
  return voices.filter((voice) => voice.lang.startsWith(lang));
}

/**
 * Check microphone permission status
 *
 * @returns Permission state or null if not supported
 */
export async function checkMicrophonePermission(): Promise<PermissionState | null> {
  if (typeof navigator === 'undefined' || !navigator.permissions) {
    return null;
  }

  try {
    const result = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    });
    return result.state;
  } catch (error) {
    console.warn('Could not check microphone permission:', error);
    return null;
  }
}

/**
 * Request microphone permission
 * Note: This requires user interaction (e.g., button click)
 *
 * @returns Promise resolving to whether permission was granted
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
    return false;
  }

  try {
    // Request microphone access (will prompt user)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Stop all tracks immediately (we just needed permission)
    stream.getTracks().forEach((track) => track.stop());

    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}

/**
 * Browser compatibility information
 */
export const BROWSER_COMPATIBILITY = {
  speechRecognition: {
    chrome: true,
    edge: true,
    safari: true,
    firefox: false, // Firefox doesn't support Web Speech API
    opera: true,
  },
  speechSynthesis: {
    chrome: true,
    edge: true,
    safari: true,
    firefox: true,
    opera: true,
  },
} as const;

/**
 * Detect current browser type (simplified detection)
 */
export function detectBrowser(): string {
  if (typeof navigator === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('edg')) return 'edge';
  if (userAgent.includes('chrome')) return 'chrome';
  if (userAgent.includes('safari')) return 'safari';
  if (userAgent.includes('opera') || userAgent.includes('opr')) return 'opera';

  return 'unknown';
}

/**
 * Check if current browser supports voice recognition
 */
export function isCurrentBrowserSupported(): boolean {
  const browser = detectBrowser();
  return (
    browser === 'chrome' ||
    browser === 'edge' ||
    browser === 'safari' ||
    browser === 'opera'
  );
}
