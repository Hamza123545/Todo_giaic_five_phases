import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale, localePrefix, pathnames } from './lib/i18n/config';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Strategy for locale prefixes in URLs
  localePrefix,

  // Pathnames configuration (optional)
  pathnames
});

export const config = {
  // Match only internationalized pathnames
  // Exclude API routes, static files, and Next.js internal routes
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public files (images, etc.)
    // - manifest.json, sw.js, workbox-* (PWA files)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$|manifest.json|sw.js|workbox-.*\\.js).*)',
  ],
};
