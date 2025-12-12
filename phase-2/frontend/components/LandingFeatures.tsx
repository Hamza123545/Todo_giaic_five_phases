"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Lock,
  ListTodo,
  WifiOff,
  Search,
  Filter,
  Download,
  Upload,
  Keyboard,
  BarChart3,
  Bell,
  Tags,
  Calendar,
  Sparkles,
} from "lucide-react";

const mainFeatures = [
  {
    icon: Lock,
    title: "Secure Authentication",
    description:
      "Enterprise-grade security with JWT tokens and Better Auth integration. Your data is encrypted and protected at every step.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: ListTodo,
    title: "Advanced Task Management",
    description:
      "Create, edit, organize, and prioritize tasks with ease. Support for due dates, priorities, tags, and detailed descriptions.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: WifiOff,
    title: "Offline-First PWA",
    description:
      "Work seamlessly without internet. All changes sync automatically when you reconnect. Install as an app on any device.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Search,
    title: "Powerful Search & Filter",
    description:
      "Find tasks instantly with real-time search. Filter by status, priority, tags, or due dates. Sort by creation date or custom order.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Download,
    title: "Export & Import",
    description:
      "Export your tasks to CSV, JSON, or PDF. Import tasks from other tools. Full data portability and backup options.",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    icon: Keyboard,
    title: "Keyboard Shortcuts",
    description:
      "Navigate and manage tasks faster with intuitive keyboard shortcuts. Power user features for maximum productivity.",
    gradient: "from-yellow-500 to-orange-500",
  },
];

const additionalFeatures = [
  { icon: Filter, text: "Smart Filtering" },
  { icon: Tags, text: "Tag Organization" },
  { icon: Calendar, text: "Due Date Tracking" },
  { icon: BarChart3, text: "Task Analytics" },
  { icon: Bell, text: "Reminders & Notifications" },
  { icon: Upload, text: "Bulk Operations" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.43, 0.13, 0.23, 0.96] as const, // easeOut cubic-bezier
    },
  },
};

export function LandingFeatures() {
  return (
    <section id="features" className="relative px-4 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
          >
            <Sparkles className="h-4 w-4" />
            <span>Powerful Features</span>
          </motion.div>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Stay Productive
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            A comprehensive suite of features designed to help you manage your tasks efficiently and
            achieve your goals faster.
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {mainFeatures.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Card className="group relative h-full overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
                />
                <CardHeader className="relative">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}
                  >
                    <feature.icon className="h-7 w-7" aria-hidden="true" />
                  </motion.div>
                  <CardTitle className="mb-2 text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-border bg-card/50 p-8 sm:p-12"
        >
          <h3 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl">
            And So Much More
          </h3>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-6">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center gap-3 rounded-lg p-4 transition-colors hover:bg-accent"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <span className="text-center text-sm font-medium text-foreground">
                  {feature.text}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
