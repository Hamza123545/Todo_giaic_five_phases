"use client";

/**
 * Chat Page - Enhanced with Conversation History & Better Message UI
 *
 * Features:
 * - Conversation history sidebar for switching between chats
 * - Better message formatting with timestamps
 * - Visual distinction between user and assistant messages
 * - AI Chat Assistant with ChatKit widget
 * - Preserves all existing ChatKit functionality
 */

import { ChatKitWidget } from "@/components/chatkit";
import { ConversationHistory } from "@/components/chatkit/ConversationHistory";
import { HeaderGreeting } from "@/components/molecules/HeaderGreeting";
import { GlassCard } from "@/components/atoms/GlassCard";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/types";

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<number | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            createdAt: currentUser.createdAt?.toISOString(),
            updatedAt: currentUser.updatedAt?.toISOString(),
          });

          // Get JWT token for API calls
          try {
            const authClient = (await import("@/lib/auth")).authClient;
            const tokenResult = await authClient.token();
            if (tokenResult.data?.token) {
              setJwtToken(tokenResult.data.token);
            }
          } catch (error) {
            console.error("Failed to get JWT token:", error);
          }
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    }

    loadUser();
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <HeaderGreeting
          userName={user?.name}
          title="AI Chat Assistant"
          subtitle="Manage your tasks using natural language conversations"
        />
      </div>

      {/* Chat Layout: Sidebar + Chat */}
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-4 h-[700px]">
          {/* Mobile Toggle Button */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-blue-500 text-white"
          >
            {isMobileSidebarOpen ? "✕" : "☰"}
          </button>

          {/* Conversation Sidebar */}
          <div
            className={`${
              isMobileSidebarOpen ? "block" : "hidden"
            } md:block absolute md:relative top-0 left-0 right-0 md:w-64 z-40 md:z-auto bg-white dark:bg-gray-900 md:bg-transparent p-4 md:p-0 md:flex md:flex-col`}
          >
            {user && jwtToken && (
              <ConversationHistory
                jwtToken={jwtToken}
                userId={user.id}
                onSelectConversation={(convId) => {
                  setSelectedConversationId(convId);
                  setIsMobileSidebarOpen(false);
                }}
                selectedConversationId={selectedConversationId}
              />
            )}
          </div>

          {/* Chat Area */}
          <div className="flex-1 md:flex-1 w-full md:w-auto">
            <GlassCard variant="elevated" className="p-6 overflow-hidden h-full flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedConversationId ? `Conversation #${selectedConversationId}` : "New Conversation"}
                </h2>
                <div className="flex gap-2">
                  <button
                    title="New chat"
                    className="px-3 py-1 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    + New
                  </button>
                </div>
              </div>

              {/* ChatKit Widget */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <ChatKitWidget
                  className="flex-1 w-full h-full"
                  key={selectedConversationId} // Force re-render when conversation changes
                />
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Instructions */}
        <GlassCard variant="flat" className="mt-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            💡 Tips for using the AI Chat Assistant:
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Task Management:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 text-sm">
                <li>Add task: &quot;Add task: Buy groceries, mark as urgent&quot;</li>
                <li>List tasks: &quot;Show me all my high priority tasks&quot;</li>
                <li>Mark complete: &quot;Complete task 1&quot;</li>
                <li>Delete: &quot;Delete task 2&quot;</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Features:</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 text-sm">
                <li>🔍 View conversation history in sidebar</li>
                <li>⏰ Messages include timestamps</li>
                <li>🎯 Priority support for tasks</li>
                <li>💾 Chat history saved for 2 days</li>
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
