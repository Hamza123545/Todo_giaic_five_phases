"use client";

import { motion } from "framer-motion";
import { CheckCircle2, UserPlus, ListChecks, Zap } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Account",
    description:
      "Sign up in seconds with just your email. No credit card required. Get started with a free account and unlock all features.",
  },
  {
    number: "02",
    icon: ListChecks,
    title: "Start Adding Tasks",
    description:
      "Create your first task, add descriptions, set priorities, and organize with tags. Your tasks sync instantly across all devices.",
  },
  {
    number: "03",
    icon: Zap,
    title: "Stay Productive",
    description:
      "Use filters, search, and shortcuts to manage tasks efficiently. Work offline, export data, and track your progress.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.43, 0.13, 0.23, 0.96] as const, // easeOut cubic-bezier
    },
  },
};

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden px-4 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            How It{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Get started in three simple steps. No complicated setup, no learning curve.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="relative"
        >
          {/* Connection Line (Desktop) */}
          <div className="absolute left-1/2 top-0 hidden h-full w-1 -translate-x-1/2 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 lg:block" />

          <div className="grid gap-12 lg:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div key={index} variants={item} className="relative">
                <div className="relative flex flex-col items-center text-center">
                  {/* Step Number Background */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="relative mb-6"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 blur-xl" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
                      {step.number}
                    </div>
                  </motion.div>

                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.2 + 0.3 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary"
                  >
                    <step.icon className="h-8 w-8" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="mb-3 text-xl font-bold text-foreground sm:text-2xl">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <a href="/signup">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              Get Started Now
              <CheckCircle2 className="h-5 w-5" />
            </motion.button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
