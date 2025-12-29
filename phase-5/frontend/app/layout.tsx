import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/toast";
import OfflineIndicator from "@/components/OfflineIndicator";
import { BackgroundBlobs } from "@/components/atoms/BackgroundBlobs";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { GlobalChatButton } from "@/components/organisms/GlobalChatButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Todo App - AI-Powered Task Management",
  description: "A modern todo application with AI-powered chat assistant, authentication, and comprehensive task management. Features OpenAI Agents SDK with MCP (Model Context Protocol) tools for intelligent task operations including add, list, complete, delete, and update tasks through natural conversation.",
  keywords: [
    "todo",
    "task management",
    "AI assistant",
    "chatbot",
    "MCP tools",
    "OpenAI Agents SDK",
    "natural language processing",
    "conversational AI",
    "pwa",
    "offline",
    "productivity",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Todo App",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Todo App - AI-Powered Task Management",
    description: "Manage your tasks with an AI assistant powered by OpenAI Agents SDK and MCP tools. Create, update, complete, and organize tasks through natural conversation.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Todo App - AI-Powered Task Management",
    description: "AI assistant with MCP tools for intelligent task management through natural conversation.",
  },
  other: {
    "ai-capabilities": "OpenAI Agents SDK with MCP (Model Context Protocol) tools",
    "mcp-tools": "add_task, list_tasks, complete_task, delete_task, update_task",
    "ai-provider": "OpenAI GPT-4o or Gemini 2.5 Flash (configurable)",
    "chat-features": "Real-time streaming, conversation persistence, tool invocation tracking",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* 
          AI Chat Integration:
          - ChatKit CDN: OpenAI ChatKit widget for conversational UI
          - Backend: OpenAI Agents SDK with MCP (Model Context Protocol) tools
          - MCP Tools: add_task, list_tasks, complete_task, delete_task, update_task
          - Features: Real-time SSE streaming, conversation persistence, tool invocation tracking
          - AI Providers: OpenAI GPT-4o (default) or Gemini 2.5 Flash (configurable via LLM_PROVIDER)
          - Endpoint: POST /api/{user_id}/chat with JWT authentication
        */}
        <Script
          src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
          strategy="afterInteractive"
        />
        <ThemeProvider>
          <BackgroundBlobs />
          <LayoutWrapper>
            <ToastProvider>
              {children}
              <OfflineIndicator />
              <GlobalChatButton />
            </ToastProvider>
          </LayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
