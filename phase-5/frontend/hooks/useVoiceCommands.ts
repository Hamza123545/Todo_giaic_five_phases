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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');

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
              code: 'UNKNOWN_INTENT',
              message: 'Could not understand command. Please try again.',
              timestamp: Date.now(),
            },
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: {
            code: 'NETWORK_ERROR',
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
          // Reset accumulated transcript
          accumulatedTranscriptRef.current = '';
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          
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
          // Don't stop immediately - wait a bit for more speech
          // This helps capture longer descriptions
          setState((prev) => ({ ...prev, isSpeaking: false }));
        },

        onInterimResult: (transcript) => {
          // Update interim transcript in real-time
          setState((prev) => ({ ...prev, interimTranscript: transcript }));
        },

        onFinalResult: (transcript, confidence) => {
          // Accumulate final transcript if we get multiple results
          setState((prev) => {
            const accumulated = prev.finalTranscript 
              ? `${prev.finalTranscript} ${transcript}`.trim()
              : transcript;
            
            // Store in ref for timeout processing
            accumulatedTranscriptRef.current = accumulated;
            
            // Clear existing timeout and set new one
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            
            // Auto-process after 1.5 seconds of silence (user finished speaking)
            // This allows natural pauses but processes quickly
            timeoutRef.current = setTimeout(() => {
              if (accumulatedTranscriptRef.current) {
                processTranscript(accumulatedTranscriptRef.current);
                accumulatedTranscriptRef.current = '';
                // Stop recognition after processing
                recognitionRef.current?.stop();
              }
            }, 1500); // 1.5 seconds of silence before auto-processing
            
            return {
              ...prev,
              finalTranscript: accumulated,
              interimTranscript: '',
            };
          });
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
          // Process any accumulated final transcript when recognition ends
          setState((prev) => {
            const transcriptToProcess = accumulatedTranscriptRef.current || prev.finalTranscript;
            if (transcriptToProcess && !prev.isProcessing) {
              // Small delay to ensure all results are processed
              setTimeout(() => {
                processTranscript(transcriptToProcess);
                accumulatedTranscriptRef.current = '';
              }, 200);
            }
            return {
              ...prev,
              isRecording: false,
              isSpeaking: false,
            };
          });
        },

        onNoMatch: () => {
          setState((prev) => ({
            ...prev,
            error: {
              code: 'NO_SPEECH_DETECTED',
              message: 'No speech detected. Please try again.',
              timestamp: Date.now(),
            },
          }));
        },
      },
      {
        continuous: false, // Stop after processing to prevent continuous listening
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
          code: 'BROWSER_NOT_SUPPORTED',
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
          code: 'BROWSER_NOT_SUPPORTED',
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
            code: 'BROWSER_NOT_SUPPORTED',
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
   * Stop voice recording and process accumulated transcript
   */
  const stopRecording = useCallback(() => {
    // Clear auto-process timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    recognitionRef.current?.stop();
    
    // Process any accumulated transcript after stopping
    setState((prev) => {
      const transcriptToProcess = accumulatedTranscriptRef.current || prev.finalTranscript;
      if (transcriptToProcess && !prev.isProcessing) {
        // Small delay to ensure recognition has stopped
        setTimeout(() => {
          processTranscript(transcriptToProcess);
          accumulatedTranscriptRef.current = '';
        }, 300);
      }
      return prev;
    });
  }, [processTranscript]);

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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
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
