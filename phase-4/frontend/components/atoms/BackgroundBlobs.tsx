export interface BackgroundBlobsProps {
  count?: number;
  colors?: string[];
  blur?: 'sm' | 'md' | 'lg' | 'xl';
}

export function BackgroundBlobs({
  count = 3,
  colors,
  blur = 'xl',
}: BackgroundBlobsProps) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Blob 1 - Indigo */}
      <div
        className={`absolute top-[-10rem] left-[-10rem] w-80 h-80 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-3xl opacity-20 dark:opacity-10 animate-blob mix-blend-multiply dark:mix-blend-normal`}
      />

      {/* Blob 2 - Pink */}
      <div
        className={`absolute bottom-[-10rem] right-[-10rem] w-96 h-96 bg-gradient-to-r from-pink-500 to-red-500 rounded-full blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-normal`}
      />

      {/* Blob 3 - Blue */}
      <div
        className={`absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-normal`}
      />
    </div>
  );
}

