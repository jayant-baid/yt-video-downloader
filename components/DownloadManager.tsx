"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { DownloadJob, DownloadStatus } from "@/hooks/useDownloadManager";

interface DownloadManagerProps {
  jobs: DownloadJob[];
  clearCompleted: () => void;
  clearFailed: () => void;
}

const statusLabels: Record<DownloadStatus, string> = {
  preparing: "Preparing",
  downloading: "Downloading",
  merging: "Merging/Converting",
  saving: "Sending to Browser",
  ready: "Finished",
  failed: "Failed",
};

const statusColors: Record<DownloadStatus, string> = {
  preparing: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  downloading: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  merging: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  saving: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  ready: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  failed: "text-red-500 bg-red-500/10 border-red-500/20",
};

export default function DownloadManager({
  jobs,
  clearCompleted,
  clearFailed,
}: DownloadManagerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (jobs.length === 0) return null;

  const activeJobs = jobs.filter(
    (job) => job.status !== "ready" && job.status !== "failed"
  );
  const completedJobs = jobs.filter((job) => job.status === "ready");
  const failedJobs = jobs.filter((job) => job.status === "failed");

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {activeJobs.length > 0 && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75"></span>
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                activeJobs.length > 0 ? "bg-[var(--accent)]" : "bg-[var(--subtle)]"
              }`}
            ></span>
          </span>
          <h4 className="text-sm font-semibold text-[var(--foreground)]">
            Downloads ({jobs.length})
          </h4>
        </div>
        <div className="flex items-center gap-1.5">
          {completedJobs.length > 0 && (
            <button
              onClick={clearCompleted}
              className="cursor-pointer rounded-full px-2.5 py-1 font-medium uppercase tracking-wide text-[var(--muted)] transition-all hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            >
              Clear Completed
            </button>
          )}
          {failedJobs.length > 0 && (
            <button
              onClick={clearFailed}
              className="cursor-pointer rounded-full px-2.5 py-1 font-medium uppercase tracking-wide text-[var(--muted)] transition-all hover:bg-red-500/10 hover:text-red-400"
            >
              Clear Failed
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-full cursor-pointer text-[var(--muted)] transition-all hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
          >
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="max-h-72 overflow-y-auto p-4 space-y-4 divide-y divide-[var(--border)]/50">
          {jobs.map((job, idx) => (
            <div key={job.jobId} className={`pt-3 ${idx === 0 ? "pt-0" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-[var(--foreground)] truncate block">
                    {job.label}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] block truncate mt-0.5">
                    {job.status === "failed" ? job.error : statusLabels[job.status]}
                  </span>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 ${
                    statusColors[job.status]
                  }`}
                >
                  {job.status === "downloading" ? `${job.progress}%` : job.status}
                </span>
              </div>

              {/* Progress bar */}
              {job.status !== "failed" && job.status !== "ready" && (
                <div className="mt-2 h-1 w-full bg-[var(--surface-hover)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      job.status === "preparing"
                        ? "bg-amber-500 animate-pulse w-1/4"
                        : job.status === "merging"
                        ? "bg-purple-500 animate-pulse w-[95%]"
                        : job.status === "saving"
                        ? "bg-emerald-500 w-full"
                        : "bg-[var(--accent)]"
                    }`}
                    style={
                      job.status === "downloading"
                        ? { width: `${job.progress}%` }
                        : undefined
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
