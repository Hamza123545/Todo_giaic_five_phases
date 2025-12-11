'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Todo App. All rights reserved.
            </p>
          </div>

          <div className="flex gap-4">
            <Link href="/signup">
              <Button variant="ghost" size="sm">
                Sign Up
              </Button>
            </Link>
            <Link href="/signin">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
