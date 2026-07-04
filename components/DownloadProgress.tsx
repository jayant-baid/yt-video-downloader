"use client";

interface DownloadProgressProps {
  isActive: boolean;
  formatLabel: string;
}

export default function DownloadProgress({
  isActive,
  formatLabel,
}: DownloadProgressProps) {
  if (!isActive) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <svg
            className="animate-spin h-5 w-5 text-[var(--accent)]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--foreground)] font-medium truncate">
            Downloading {formatLabel}
          </p>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Preparing your file. Long videos may take a few minutes...
          </p>
        </div>
      </div>
      <div className="mt-3 h-1 bg-[var(--surface-hover)] rounded-full overflow-hidden">
        <div className="h-full bg-[var(--accent)] rounded-full animate-progress" />
      </div>
    </div>
  );
}

