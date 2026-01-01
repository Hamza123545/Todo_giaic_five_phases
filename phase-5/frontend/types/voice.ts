import { Locale } from '../lib/i18n/config';

// Voice command intent types
export type VoiceIntent =
  | 'CREATE_TASK'
  | 'COMPLETE_TASK'
  | 'DELETE_TASK'
  | 'UPDATE_TASK'
  | 'FILTER_TASKS'
  | 'READ_TASKS'
  | 'SHOW_HELP'
  | 'UNKNOWN';

// Voice command structure
export interface VoiceCommand {
  transcript: string;
  intent: VoiceIntent;
  parameters: Record<string, any>;
  confidence: number;
  timestamp: number;
  locale: Locale;
}

// Voice recording state
export interface VoiceRecordingState {
  isRecording: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  interimTranscript: string;
  finalTranscript: string;
  error: VoiceError | null;
  permissionStatus: PermissionState;
}

// Voice error structure
export interface VoiceError {
  code: VoiceErrorCode;
  message: string;
  timestamp: number;
}

// Voice error codes
export type VoiceErrorCode =
  | 'PERMISSION_DENIED'
  | 'NOT_SUPPORTED'
  | 'NO_SPEECH_DETECTED'
  | 'LOW_CONFIDENCE'
  | 'UNKNOWN_INTENT'
  | 'NETWORK_ERROR'
  | 'MICROPHONE_IN_USE'
  | 'BROWSER_NOT_SUPPORTED';

// Browser permission state
export type PermissionState = 'prompt' | 'granted' | 'denied';

// Browser capabilities for feature detection
export interface BrowserCapabilities {
  speechRecognition: boolean;
  speechSynthesis: boolean;
  localStorage: boolean;
  intl: boolean;
}

// Voice command pattern for parsing
export interface VoiceCommandPattern {
  intent: VoiceIntent;
  patterns: {
    en: RegExp[];
    ur: RegExp[];
  };
  parameters: string[];
  requiresConfirmation: boolean;
}

// Text-to-speech configuration
export interface TTSConfig {
  voice: SpeechSynthesisVoice | null;
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
  lang: string; // e.g., 'en-US' or 'ur-PK'
}

// Default TTS configuration
export const defaultTTSConfig: Omit<TTSConfig, 'voice'> = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  lang: 'en-US',
};

// Speech recognition configuration
export interface SpeechRecognitionConfig {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

// Default speech recognition configuration
export const defaultSpeechRecognitionConfig: SpeechRecognitionConfig = {
  lang: 'en-US',
  continuous: false,
  interimResults: true,
  maxAlternatives: 1,
};

// Voice command execution result
export interface VoiceCommandResult {
  success: boolean;
  message: string;
  data?: any;
}

// Task filter options for voice commands
export type TaskFilter =
  | 'all'
  | 'completed'
  | 'incomplete'
  | 'high'
  | 'medium'
  | 'low';

// Task operation types for voice commands
export type TaskOperation =
  | 'create'
  | 'complete'
  | 'delete'
  | 'update'
  | 'filter'
  | 'read';
