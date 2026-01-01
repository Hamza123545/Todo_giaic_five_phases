/**
 * Conversation History Sidebar
 *
 * Displays list of recent conversations for the user
 * Allows switching between conversations
 */

"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/atoms/GlassCard";

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;

  return date.toLocaleDateString();
}

interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface ConversationHistoryProps {
  jwtToken: string;
  userId: string;
  onSelectConversation: (conversationId: number) => void;
  selectedConversationId?: number;
  apiUrl?: string;
}

export function ConversationHistory({
  jwtToken,
  userId,
  onSelectConversation,
  selectedConversationId,
  apiUrl = "http://localhost:8000",
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${apiUrl}/api/${userId}/conversations?limit=50`,
          {
            headers: {
              Authorization: `Bearer ${jwtToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch conversations");
        }

        const data = await response.json();

        if (data.success && data.data?.conversations) {
          setConversations(data.data.conversations);
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
        setError(err instanceof Error ? err.message : "Failed to load conversations");
      } finally {
        setIsLoading(false);
      }
    };

    if (jwtToken && userId) {
      fetchConversations();
    }
  }, [jwtToken, userId, apiUrl]);

  return (
    <div className="w-full md:w-64 flex flex-col gap-4 mb-4 md:mb-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Conversations
        </h2>
        <button
          title="New conversation"
          className="text-2xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          +
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        ) : error ? (
          <GlassCard variant="flat" className="p-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              Error: {error}
            </p>
          </GlassCard>
        ) : conversations.length === 0 ? (
          <GlassCard variant="flat" className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No conversations yet. Start a new chat!
            </p>
          </GlassCard>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`w-full text-start p-3 rounded-lg transition-all duration-200 ${
                selectedConversationId === conversation.id
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <p className="font-medium truncate text-sm">{conversation.title}</p>
              <p className="text-xs opacity-75 mt-1">
                {formatRelativeTime(conversation.updated_at)}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
