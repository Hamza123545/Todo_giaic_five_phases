/**
 * Message Display Component
 *
 * Displays chat messages with better formatting
 * - User messages: right-aligned with blue background
 * - Assistant messages: left-aligned with gray background
 * - Timestamps and visual distinction
 */

"use client";

import { GlassCard } from "@/components/atoms/GlassCard";

// Helper function to format time as HH:mm
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  tool_calls?: Record<string, unknown>;
}

interface MessageDisplayProps {
  messages: Message[];
  isLoading?: boolean;
  error?: string | null;
}

export function MessageDisplay({
  messages,
  isLoading = false,
  error = null,
}: MessageDisplayProps) {
  if (error) {
    return (
      <div className="flex items-center justify-center p-8 h-full">
        <GlassCard variant="flat" className="p-6 max-w-md">
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">
            Error loading messages
          </p>
          <p className="text-sm text-red-500 dark:text-red-300">{error}</p>
        </GlassCard>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 h-full">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No messages yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Start a conversation to get began!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 animate-fadeIn ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          {/* Avatar and message content */}
          <div
            className={`flex gap-3 max-w-xs lg:max-w-md ${
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
                message.role === "user"
                  ? "bg-blue-500"
                  : message.role === "assistant"
                  ? "bg-green-500"
                  : "bg-gray-500"
              }`}
            >
              {message.role === "user"
                ? "U"
                : message.role === "assistant"
                ? "A"
                : "S"}
            </div>

            {/* Message bubble */}
            <div className="flex flex-col gap-1">
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
                }`}
              >
                {/* Message content */}
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>

                {/* Tool calls if present */}
                {message.tool_calls && Object.keys(message.tool_calls).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-opacity-30 border-current">
                    <p className="text-xs opacity-75 font-semibold mb-1">
                      Tools used:
                    </p>
                    <div className="text-xs opacity-75 space-y-1">
                      {Array.isArray(message.tool_calls.calls) &&
                        message.tool_calls.calls.map(
                          (
                            call: { tool: string; args: Record<string, unknown> },
                            idx: number
                          ) => (
                            <div key={idx} className="font-mono text-opacity-75">
                              • {call.tool}
                            </div>
                          )
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
                {formatTime(message.created_at)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
