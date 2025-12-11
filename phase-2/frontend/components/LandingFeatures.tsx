'use client';

import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Lock, ListTodo, WifiOff } from 'lucide-react';

const features = [
  {
    icon: Lock,
    title: 'JWT Authentication',
    description: 'Secure authentication with Better Auth and JWT tokens for protected access',
  },
  {
    icon: ListTodo,
    title: 'Task Management',
    description: 'Full CRUD operations with drag-and-drop, filtering, sorting, and search',
  },
  {
    icon: CheckCircle2,
    title: 'Advanced Features',
    description: 'Export/import tasks, undo/redo, bulk operations, and keyboard shortcuts',
  },
  {
    icon: WifiOff,
    title: 'PWA & Offline Sync',
    description: 'Work offline seamlessly with automatic sync when connection is restored',
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
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function LandingFeatures() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Powerful Features
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to manage your tasks efficiently
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="mt-2">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
