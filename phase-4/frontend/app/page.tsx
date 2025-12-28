import { LandingNavbar } from "@/components/LandingNavbar";
import { LandingHero } from "@/components/LandingHero";
import { LandingFeatures } from "@/components/LandingFeatures";
import { LandingAITechnology } from "@/components/LandingAITechnology";
import { LandingHowItWorks } from "@/components/LandingHowItWorks";
import { LandingFooter } from "@/components/LandingFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Todo App - AI-Powered Task Management",
  description:
    "Full-featured todo application with AI-powered chat assistant. Chat naturally with your AI to create, update, and manage tasks. Features PWA support, offline sync, secure authentication, and powerful task management through conversational AI.",
  keywords: [
    "todo",
    "task management",
    "AI assistant",
    "AI chatbot",
    "chatbot",
    "natural language",
    "conversational AI",
    "pwa",
    "offline",
    "productivity",
  ],
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingAITechnology />
        <LandingHowItWorks />
      </main>
      <LandingFooter />
    </div>
  );
}
