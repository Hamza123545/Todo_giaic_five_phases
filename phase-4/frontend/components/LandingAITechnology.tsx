"use client";

import { motion } from "framer-motion";
import { Brain, MessageCircle, Zap, Code, Database, Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const techStack = [
  {
    icon: Brain,
    title: "AI Chatbot with MCP Tools",
    description:
      "Our AI chatbot uses advanced MCP (Model Context Protocol) tools to understand and execute your task management requests. Just chat naturally and the AI handles everything.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: MessageCircle,
    title: "Natural Conversation",
    description:
      "Talk to the AI like you would to a friend. Say 'Add buy groceries' or 'Show my tasks' and get instant responses. The AI understands context and remembers your conversation history.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Real-time Responses",
    description:
      "See the AI's responses stream in real-time as it processes your requests. Watch as it creates tasks, updates lists, and provides helpful suggestions instantly.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Your conversations and tasks are completely private and secure. Each user's data is isolated, and the AI only accesses your information through authenticated sessions.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Code,
    title: "Smart Task Operations",
    description:
      "The AI can create, list, complete, update, and delete tasks through simple conversation. No need to navigate complex menus - just tell the AI what you need.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Database,
    title: "Always Available",
    description:
      "Your conversations are saved automatically, so you can continue where you left off anytime. Access your chat history and tasks from any device, anywhere.",
    gradient: "from-yellow-500 to-orange-500",
  },
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
      ease: [0.43, 0.13, 0.23, 0.96] as const,
    },
  },
};

export function LandingAITechnology() {
  return (
    <section id="ai-technology" className="relative overflow-hidden px-4 py-24 bg-gradient-to-b from-background to-muted/20">
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
            <Brain className="h-4 w-4" />
            <span>AI Technology Stack</span>
          </motion.div>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Powered by{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Advanced AI
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Built with cutting-edge AI technology for intelligent, conversational task management. 
            Experience the future of productivity with our AI chatbot powered by MCP tools.
          </p>
        </motion.div>

        {/* Technology Stack Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {techStack.map((tech, index) => (
            <motion.div key={index} variants={item}>
              <Card className="group relative h-full overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${tech.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
                />
                <CardHeader className="relative">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${tech.gradient} text-white shadow-lg`}
                  >
                    <tech.icon className="h-7 w-7" aria-hidden="true" />
                  </motion.div>
                  <CardTitle className="mb-2 text-xl">{tech.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {tech.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Example Chat Commands */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 rounded-2xl border border-border bg-card/50 p-8 sm:p-12"
        >
          <h3 className="mb-6 text-center text-2xl font-bold text-foreground sm:text-3xl">
            Try These Commands
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Add buy groceries",
              "Show my pending tasks",
              "Mark task 3 as complete",
              "Update task 5 title to 'Meeting'",
              "Delete task 2",
              "What tasks do I have?",
            ].map((command, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                className="rounded-lg border border-border bg-background/50 p-4 text-sm font-mono text-foreground"
              >
                <span className="text-muted-foreground">$ </span>
                {command}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

