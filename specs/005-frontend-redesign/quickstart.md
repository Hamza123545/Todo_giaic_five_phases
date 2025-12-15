# Quickstart Guide: Frontend Glass Morphism Redesign

**Feature**: 005-frontend-redesign
**Date**: 2025-12-15
**For**: Developers implementing the glass morphism redesign

## Prerequisites

- Node.js 22+ installed
- Frontend codebase cloned
- Existing Next.js 16 App Router setup
- Tailwind CSS 4 configured
- Basic understanding of React and TypeScript

---

## Installation Steps

### 1. Install New Dependencies

```bash
cd frontend

# Install new packages
npm install lucide-react@^0.547.0 next-themes@^0.4.0 recharts@^2.15.0

# Or with pnpm
pnpm add lucide-react@^0.547.0 next-themes@^0.4.0 recharts@^2.15.0
```

---

### 2. Update Tailwind Configuration

Update `tailwind.config.js` to include glass morphism utilities and animations:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'glass-light': 'rgba(255, 255, 255, 0.1)',
        'glass-dark': 'rgba(31, 41, 55, 0.1)',
        'glass-border-light': 'rgba(255, 255, 255, 0.3)',
        'glass-border-dark': 'rgba(75, 85, 99, 0.5)',
      },
      backdropBlur: {
        'glass': '24px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(99, 102, 241, 0.1)',
      },
      animation: {
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
```

---

### 3. Set Up Theme Provider

Update `app/layout.tsx` to include the ThemeProvider:

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Todo Console App',
  description: 'Modern task management with glass morphism design',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

### 4. Add Global Styles

Update `app/globals.css` to include base styles and motion-safe animations:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 243 244 246; /* gray-100 */
    --foreground: 17 24 39; /* gray-900 */
  }

  .dark {
    --background: 17 24 39; /* gray-900 */
    --foreground: 243 244 246; /* gray-100 */
  }

  body {
    @apply bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100;
  }
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-200 dark:bg-gray-800;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-400 dark:bg-gray-600 rounded-full hover:bg-gray-500 dark:hover:bg-gray-500;
}
```

---

## Component Examples

### 1. GlassCard Component

Create the base glass morphism card component:

```typescript
// components/atoms/GlassCard.tsx
import { cn } from '@/lib/utils'

export interface GlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'flat'
  hover?: boolean
  onClick?: () => void
}

export function GlassCard({
  children,
  className,
  variant = 'default',
  hover = false,
  onClick,
}: GlassCardProps) {
  const baseStyles = 'relative rounded-2xl backdrop-blur-xl border transition-all duration-300'

  const variantStyles = {
    default: 'bg-white/10 border-white/30 dark:bg-gray-800/10 dark:border-gray-700/50 shadow-glass',
    elevated: 'bg-white/20 border-white/40 dark:bg-gray-800/20 dark:border-gray-700/60 shadow-2xl shadow-indigo-500/10',
    flat: 'bg-white/5 border-white/20 dark:bg-gray-800/5 dark:border-gray-700/40',
  }

  const hoverStyles = hover ? 'hover:scale-105 hover:shadow-2xl cursor-pointer' : ''

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], hoverStyles, className)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
```

---

### 2. Theme Toggle Component

Create a dark mode toggle:

```typescript
// components/molecules/ThemeToggle.tsx
'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg bg-white/10 dark:bg-gray-800/10 border border-white/30 dark:border-gray-700/50 backdrop-blur-xl transition-all duration-300 hover:scale-110"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-600" />
      )}
    </button>
  )
}
```

---

### 3. Background Blobs

Create animated gradient background blobs:

```typescript
// components/atoms/BackgroundBlobs.tsx
export function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Blob 1 - Indigo */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-3xl opacity-20 dark:opacity-10 animate-blob" />

      {/* Blob 2 - Pink */}
      <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-r from-pink-500 to-red-500 rounded-full blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000" />

      {/* Blob 3 - Blue */}
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000" />
    </div>
  )
}
```

---

## Development Workflow

### Step 1: Create Base Components
1. Create `GlassCard` component
2. Create `ThemeToggle` component
3. Create `BackgroundBlobs` component
4. Test in isolated Storybook or component sandbox

### Step 2: Create Layout Components
1. Create `Sidebar` component (desktop)
2. Create `TopBar` component (mobile)
3. Update root layout to include both
4. Test responsive behavior

### Step 3: Create Molecule Components
1. Create `StatCard` component
2. Create `TaskCard` component
3. Create `HeaderGreeting` component
4. Create `ChartCard` component

### Step 4: Update Pages
1. Update Dashboard page with new components
2. Update Tasks page with Kanban layout
3. Update other pages (Chat, Settings, Calendar)
4. Test all pages in light and dark modes

### Step 5: Testing and Refinement
1. Test responsive design (mobile, tablet, desktop)
2. Test dark mode toggle
3. Test accessibility (keyboard navigation, screen readers)
4. Test performance (Lighthouse, bundle size)
5. Fix any contrast issues

---

## Testing Checklist

### Visual Testing
- [ ] All pages display glass morphism effects correctly
- [ ] Dark mode works on all pages
- [ ] Hover effects work on interactive elements
- [ ] Animations run smoothly at 60fps
- [ ] Background gradient blobs animate correctly

### Responsive Testing
- [ ] Mobile (< 640px): Top bar visible, sidebar hidden
- [ ] Tablet (640px - 1024px): Hybrid layout works
- [ ] Desktop (≥ 1024px): Sidebar visible and fixed
- [ ] Layout doesn't break during resize

### Accessibility Testing
- [ ] Color contrast meets WCAG AA (4.5:1 normal, 3:1 large)
- [ ] Keyboard navigation works for all interactive elements
- [ ] Focus indicators visible
- [ ] Screen reader announces elements correctly
- [ ] prefers-reduced-motion respected

### Performance Testing
- [ ] Initial bundle size < 150KB gzipped
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Lighthouse score > 90

---

## Common Patterns

### Pattern 1: Creating a Glass Morphism Page Section

```typescript
import { GlassCard } from '@/components/atoms/GlassCard'
import { LayoutDashboard } from 'lucide-react'

export function DashboardSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <GlassCard variant="elevated" hover className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/20">
            <LayoutDashboard className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">24</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Tasks</p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
```

### Pattern 2: Creating a Responsive Layout

```typescript
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Sidebar - Desktop only */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 z-30">
        <Sidebar />
      </aside>

      {/* Top Bar - Mobile/Tablet only */}
      <header className="block lg:hidden fixed top-0 left-0 right-0 z-30">
        <TopBar />
      </header>

      {/* Main Content - Shifts for sidebar on desktop */}
      <main className="lg:ml-64 p-4 md:p-8 pt-20 lg:pt-8">
        {children}
      </main>
    </div>
  )
}
```

### Pattern 3: Creating a Chart with Glass Morphism

```typescript
import { GlassCard } from '@/components/atoms/GlassCard'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function TaskTrendsChart({ data }) {
  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold mb-4">Task Completion Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis dataKey="date" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(31, 41, 55, 0.9)',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              borderRadius: '12px',
              backdropFilter: 'blur(24px)',
            }}
          />
          <Line type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
```

---

## Troubleshooting

### Issue: Theme Flash on Page Load
**Solution**: Ensure `suppressHydrationWarning` is on `<html>` tag in layout.tsx

### Issue: Backdrop Blur Not Working
**Solution**: Check browser support. Add fallback with `@supports` query in CSS

### Issue: Icons Not Displaying
**Solution**: Verify Lucide React is installed correctly. Check import statements.

### Issue: Dark Mode Not Persisting
**Solution**: Check localStorage. Ensure next-themes is configured correctly.

### Issue: Animations Causing Performance Issues
**Solution**: Reduce number of animated elements. Check `prefers-reduced-motion` support.

---

## Resources

- **Next.js 16 Docs**: https://nextjs.org/docs
- **Tailwind CSS 4**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/icons
- **next-themes**: https://github.com/pacocoursey/next-themes
- **Recharts**: https://recharts.org/

---

**Ready to Start**: Follow the installation steps, then proceed with the component creation workflow!

**Need Help?**: Check the research.md and data-model.md files for detailed technical context and component interfaces.
