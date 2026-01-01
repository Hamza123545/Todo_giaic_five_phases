'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from './useLanguage';
import type { VoiceCommand, VoiceError, VoiceRecordingState } from '@/types/voice';
import { SpeechRecognitionWrapper } from '@/lib/voice/speechRecognition';
import { parseVoiceCommand, isValidCommand } from '@/lib/voice/commandParser';
import {
  isSpeechRecognitionSupported,
  checkMicrophonePermission,
  requestMicrophonePermission,
} from '@/lib/voice/featureDetection';

/**
 * Custom hook for voice command recognition and processing
 *
 * Features:
 * - Start/stop voice recording
 * - Automatic command parsing
 * - Interim and final transcript handling
 * - Error handling
 * - Microphone permission management
 * - Language-aware recognition
 *
 * @param onCommand - Callback when a valid command is recognized
 * @returns Voice command state and control functions
 */
export function useVoiceCommands(
  onCommand?: (command: VoiceCommand) => void | Promise<void>
) {
  const { locale } = useLanguage();
  const recognitionRef = useRef<SpeechRecognitionWrapper | null>(null);

  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isSpeaking: false,
    isProcessing: false,
    interimTranscript: '',
    finalTranscript: '',
    error: null,
    permissionStatus: 'prompt',
  });

  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);

  /**
   * Update permission status
   */
  const updatePermissionStatus = useCallback(async () => {
    const status = await checkMicrophonePermission();
    if (status) {
      setState((prev) => ({ ...prev, permissionStatus: status }));
    }
  }, []);

  /**
   * Request microphone permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestMicrophonePermission();
    await updatePermissionStatus();
    return granted;
  }, [updatePermissionStatus]);

  /**
   * Process final transcript into a command
   */
  const processTranscript = useCallback(
    async (transcript: string) => {
      setState((prev) => ({ ...prev, isProcessing: true }));

      try {
        const command = parseVoiceCommand(transcript, locale);
        setLastCommand(command);

        if (isValidCommand(command)) {
          await onCommand?.(command);
        } else {
          // Invalid or unknown command
          setState((prev) => ({
            ...prev,
            error: {
              code: 'no-speech',
              message: 'Could not understand command. Please try again.',
              timestamp: Date.now(),
            },
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: {
            code: 'network',
            message:
              error instanceof Error
                ? error.message
                : 'Failed to process command',
            timestamp: Date.now(),
          },
        }));
      } finally {
        setState((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    [locale, onCommand]
  );

  /**
   * Initialize speech recognition
   */
  const initializeRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.destroy();
    }

    recognitionRef.current = new SpeechRecognitionWrapper(
      locale,
      {
        onStart: () => {
          setState((prev) => ({
            ...prev,
            isRecording: true,
            error: null,
            interimTranscript: '',
            finalTranscript: '',
          }));
        },

        onSpeechStart: () => {
          setState((prev) => ({ ...prev, isSpeaking: true }));
        },

        onSpeechEnd: () => {
          setState((prev) => ({ ...prev, isSpeaking: false }));
        },

        onInterimResult: (transcript) => {
          setState((prev) => ({ ...prev, interimTranscript: transcript }));
        },

        onFinalResult: (transcript, confidence) => {
          setState((prev) => ({
            ...prev,
            finalTranscript: transcript,
            interimTranscript: '',
          }));
          processTranscript(transcript);
        },

        onError: (error: VoiceError) => {
          setState((prev) => ({
            ...prev,
            error,
            isRecording: false,
            isSpeaking: false,
          }));
        },

        onEnd: () => {
          setState((prev) => ({
            ...prev,
            isRecording: false,
            isSpeaking: false,
          }));
        },

        onNoMatch: () => {
          setState((prev) => ({
            ...prev,
            error: {
              code: 'no-speech',
              message: 'No speech detected. Please try again.',
              timestamp: Date.now(),
            },
          }));
        },
      },
      {
        continuous: false, // Stop after one phrase
        interimResults: true, // Show interim results for better UX
        maxAlternatives: 1,
      }
    );
  }, [locale, processTranscript]);

  /**
   * Start voice recording
   */
  const startRecording = useCallback(async () => {
    // Check browser support
    if (!isSpeechRecognitionSupported()) {
      setState((prev) => ({
        ...prev,
        error: {
          code: 'not-allowed',
          message: 'Speech recognition is not supported in this browser',
          timestamp: Date.now(),
        },
      }));
      return;
    }

    // Check microphone permission
    const permissionStatus = await checkMicrophonePermission();

    if (permissionStatus === 'denied') {
      setState((prev) => ({
        ...prev,
        error: {
          code: 'not-allowed',
          message: 'Microphone access denied. Please enable in browser settings.',
          timestamp: Date.now(),
        },
      }));
      return;
    }

    if (permissionStatus === 'prompt') {
      const granted = await requestPermission();
      if (!granted) {
        setState((prev) => ({
          ...prev,
          error: {
            code: 'not-allowed',
            message: 'Microphone access denied',
            timestamp: Date.now(),
          },
        }));
        return;
      }
    }

    // Initialize and start recognition
    initializeRecognition();
    recognitionRef.current?.start();
  }, [initializeRecognition, requestPermission]);

  /**
   * Stop voice recording
   */
  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  /**
   * Abort voice recording (without processing)
   */
  const abortRecording = useCallback(() => {
    recognitionRef.current?.abort();
    setState((prev) => ({
      ...prev,
      isRecording: false,
      isSpeaking: false,
      interimTranscript: '',
      finalTranscript: '',
    }));
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    abortRecording();
    setLastCommand(null);
    setState({
      isRecording: false,
      isSpeaking: false,
      isProcessing: false,
      interimTranscript: '',
      finalTranscript: '',
      error: null,
      permissionStatus: state.permissionStatus,
    });
  }, [abortRecording, state.permissionStatus]);

  /**
   * Update language when locale changes
   */
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.updateLanguage(locale);
    }
  }, [locale]);

  /**
   * Check permission status on mount
   */
  useEffect(() => {
    updatePermissionStatus();
  }, [updatePermissionStatus]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      recognitionRef.current?.destroy();
    };
  }, []);

  return {
    /** Current recording state */
    state,

    /** Last recognized command */
    lastCommand,

    /** Start voice recording */
    startRecording,

    /** Stop voice recording */
    stopRecording,

    /** Abort voice recording without processing */
    abortRecording,

    /** Request microphone permission */
    requestPermission,

    /** Clear error state */
    clearError,

    /** Reset all state */
    reset,

    /** Whether speech recognition is supported */
    isSupported: isSpeechRecognitionSupported(),
  };
}
