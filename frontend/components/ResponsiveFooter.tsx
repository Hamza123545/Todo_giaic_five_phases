'use client';

import Link from 'next/link';

export default function ResponsiveFooter() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start">
            <div className="flex items-center">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">Todo App</span>
            </div>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Todo App. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}