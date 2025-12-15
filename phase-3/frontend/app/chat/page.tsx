/**
 * Chat Page - ChatKit Widget Demo
 *
 * This page demonstrates the ChatKit widget integration
 * - Shows authenticated chat interface
 * - Requires user to be logged in
 * - Uses Better Auth JWT for backend communication
 */

import { ChatKitWidget } from "@/components/chatkit";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              AI Chat Assistant
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your tasks using natural language conversations
            </p>
          </div>

          {/* ChatKit Widget */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <ChatKitWidget className="h-[600px]" />
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              How to use:
            </h2>
            <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1">
              <li>Ask to add a new task: &ldquo;Add task: Buy groceries&rdquo;</li>
              <li>List your tasks: &ldquo;Show me all my tasks&rdquo;</li>
              <li>Mark tasks as complete: &ldquo;Complete task 1&rdquo;</li>
              <li>Delete tasks: &ldquo;Delete task 2&rdquo;</li>
              <li>Update tasks: &ldquo;Update task 3 to &lsquo;Finish homework&rsquo;&rdquo;</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
