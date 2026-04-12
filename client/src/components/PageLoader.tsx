import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300">
      {/* Skeleton Header */}
      <div className="h-20 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        </div>
        <div className="flex gap-4">
          <div className="h-10 w-10 rounded-xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          <div className="h-10 w-10 rounded-xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        </div>
      </div>

      <div className="flex-1 p-8 md:p-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Skeleton Hero/Title */}
          <div className="space-y-4">
            <div className="h-12 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />
            <div className="h-6 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
          </div>

          {/* Skeleton Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
                <div className="size-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                <div className="h-4 w-full bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Progress Bar at the top */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-[100]">
        <div className="h-full bg-primary animate-[loading-progress_2s_ease-in-out_infinite] w-1/3" />
      </div>
    </div>
  );
}
