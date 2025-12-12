import { LandingNavbar } from "@/components/LandingNavbar";
import { LandingHero } from "@/components/LandingHero";
import { LandingFeatures } from "@/components/LandingFeatures";
import { LandingHowItWorks } from "@/components/LandingHowItWorks";
import { LandingFooter } from "@/components/LandingFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Todo App - Modern Task Management",
  description:
    "Full-featured todo application with PWA support, offline sync, JWT authentication, and powerful task management features. Work offline and sync when online.",
  keywords: ["todo", "task management", "pwa", "offline", "productivity"],
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
      </main>
      <LandingFooter />
    </div>
  );
}
