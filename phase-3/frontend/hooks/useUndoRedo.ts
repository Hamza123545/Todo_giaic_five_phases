"use client";

/**
 * useUndoRedo Hook
 *
 * Implements undo/redo functionality using useReducer with history pattern
 * Supports command pattern for reversible operations
 * Maintains 5-second undo window with auto-cleanup
 */

import { useReducer, useCallback, useEffect, useRef } from "react";

// Command interface for reversible operations
export interface Command<T = unknown> {
  execute: () => Promise<void>;
  undo: () => Promise<void>;
  description: string;
  data?: T;
}

interface HistoryState<T> {
  past: Command<T>[];
  present: Command<T> | null;
  future: Command<T>[];
  pendingCommand: Command<T> | null;
  timeoutId: NodeJS.Timeout | null;
}

type HistoryAction<T> =
  | { type: "EXECUTE"; command: Command<T> }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR_PENDING" }
  | { type: "CLEAR_HISTORY" };

const UNDO_TIMEOUT = 5000; // 5 seconds

function historyReducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  switch (action.type) {
    case "EXECUTE": {
      // Clear any existing timeout
      if (state.timeoutId) {
        clearTimeout(state.timeoutId);
      }

      return {
        past: state.present ? [...state.past, state.present] : state.past,
        present: action.command,
        future: [], // Clear future on new action
        pendingCommand: action.command,
        timeoutId: null,
      };
    }

    case "UNDO": {
      if (state.past.length === 0) {
        return state;
      }

      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: state.present ? [state.present, ...state.future] : state.future,
        pendingCommand: null,
        timeoutId: null,
      };
    }

    case "REDO": {
      if (state.future.length === 0) {
        return state;
      }

      const next = state.future[0];
      const newFuture = state.future.slice(1);

      return {
        past: state.present ? [...state.past, state.present] : state.past,
        present: next,
        future: newFuture,
        pendingCommand: null,
        timeoutId: null,
      };
    }

    case "CLEAR_PENDING": {
      return {
        ...state,
        pendingCommand: null,
        timeoutId: null,
      };
    }

    case "CLEAR_HISTORY": {
      if (state.timeoutId) {
        clearTimeout(state.timeoutId);
      }
      return {
        past: [],
        present: null,
        future: [],
        pendingCommand: null,
        timeoutId: null,
      };
    }

    default:
      return state;
  }
}

export interface UndoRedoHook<T = unknown> {
  executeCommand: (command: Command<T>) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
  pendingCommand: Command<T> | null;
}

export function useUndoRedo<T = unknown>(): UndoRedoHook<T> {
  const [state, dispatch] = useReducer(historyReducer<T>, {
    past: [],
    present: null,
    future: [],
    pendingCommand: null,
    timeoutId: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Execute a new command
  const executeCommand = useCallback(async (command: Command<T>) => {
    try {
      await command.execute();
      dispatch({ type: "EXECUTE", command });

      // Set timeout to clear pending state
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        dispatch({ type: "CLEAR_PENDING" });
      }, UNDO_TIMEOUT);
    } catch (error) {
      console.error("Failed to execute command:", error);
      throw error;
    }
  }, []);

  // Undo the last command
  const undo = useCallback(async () => {
    if (state.past.length === 0) {
      return;
    }

    try {
      if (state.present) {
        await state.present.undo();
      }
      dispatch({ type: "UNDO" });
    } catch (error) {
      console.error("Failed to undo command:", error);
      throw error;
    }
  }, [state.past.length, state.present]);

  // Redo the next command
  const redo = useCallback(async () => {
    if (state.future.length === 0) {
      return;
    }

    try {
      const nextCommand = state.future[0];
      await nextCommand.execute();
      dispatch({ type: "REDO" });
    } catch (error) {
      console.error("Failed to redo command:", error);
      throw error;
    }
  }, [state.future]);

  // Clear all history
  const clearHistory = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    dispatch({ type: "CLEAR_HISTORY" });
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    executeCommand,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    clearHistory,
    pendingCommand: state.pendingCommand,
  };
}
