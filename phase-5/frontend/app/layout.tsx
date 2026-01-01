import "./globals.css";

/**
 * Root Layout
 *
 * Minimal root layout required by Next.js
 * Actual app layout with i18n support is in app/[locale]/layout.tsx
 *
 * This layout is only used for:
 * - API routes (/api/*)
 * - Error pages (if they're not in [locale])
 * - Middleware redirects
 *
 * The middleware (middleware.ts) automatically redirects requests
 * without a locale to the default locale (e.g., / -> /en)
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
