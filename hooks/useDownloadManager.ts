"use client";

import { getBackendBaseUrl } from "@/lib/backend";
import { useState, useEffect, useRef, useCallback } from "react";

export type DownloadStatus =
  | "preparing"
  | "downloading"
  | "merging"
  | "ready"
  | "failed"
  | "saving";

export interface DownloadJob {
  jobId: string;
  label: string;
  status: DownloadStatus;
  progress: number;
  error?: string;
  formatId: string;
  isAudio: boolean;
}

export function useDownloadManager() {
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const intervalsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const hasActiveJobs = jobs.some(
    (job) => job.status !== "ready" && job.status !== "failed"
  );

  const startDownload = useCallback(
    async (url: string, formatId: string, label: string, isAudio: boolean) => {
      try {
        const response = await fetch(`${getBackendBaseUrl()}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to start download job");
        }

        const { jobId } = await response.json();

        // Create new job in local state
        const newJob: DownloadJob = {
          jobId,
          label,
          status: "preparing",
          progress: 0,
          formatId,
          isAudio,
        };

        setJobs((prev) => [newJob, ...prev]);

        // Start polling
        const poll = async () => {
          try {
            const res = await fetch(`${getBackendBaseUrl()}/status/${jobId}`);
            if (!res.ok) throw new Error("Status check failed");
            const data = await res.json();

            setJobs((prev) =>
              prev.map((job) => {
                if (job.jobId === jobId) {
                  const updatedStatus = data.status as DownloadStatus;
                  
                  // If ready, trigger native browser download
                  if (updatedStatus === "ready" && job.status !== "ready" && job.status !== "saving") {
                    clearInterval(intervalsRef.current[jobId]);
                    delete intervalsRef.current[jobId];

                    // Trigger the download
                    setTimeout(() => {
                      const a = document.createElement("a");
                      a.href = `${getBackendBaseUrl()}/file/${jobId}`;
                      a.download = data.filename || "download";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);

                      // Set final state to ready
                      setJobs((currentJobs) =>
                        currentJobs.map((j) =>
                          j.jobId === jobId ? { ...j, status: "ready", progress: 100 } : j
                        )
                      );
                    }, 50);

                    return { ...job, status: "saving", progress: 100 };
                  }

                  return {
                    ...job,
                    status: updatedStatus,
                    progress: data.progress,
                    error: data.error || undefined,
                  };
                }
                return job;
              })
            );

            if (data.status === "failed") {
              clearInterval(intervalsRef.current[jobId]);
              delete intervalsRef.current[jobId];
            }
          } catch (err) {
            clearInterval(intervalsRef.current[jobId]);
            delete intervalsRef.current[jobId];
            setJobs((prev) =>
              prev.map((job) =>
                job.jobId === jobId
                  ? { ...job, status: "failed", error: "Lost connection to download task" }
                  : job
              )
            );
          }
        };

        const intervalId = setInterval(poll, 1000);
        intervalsRef.current[jobId] = intervalId;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to start download";
        const errorJob: DownloadJob = {
          jobId: Math.random().toString(),
          label,
          status: "failed",
          progress: 0,
          error: errorMsg,
          formatId,
          isAudio,
        };
        setJobs((prev) => [errorJob, ...prev]);
      }
    },
    []
  );

  const clearCompleted = useCallback(() => {
    setJobs((prev) => prev.filter((job) => job.status !== "ready"));
  }, []);

  const clearFailed = useCallback(() => {
    setJobs((prev) => prev.filter((job) => job.status !== "failed"));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(intervalsRef.current).forEach(clearInterval);
    };
  }, []);

  return {
    jobs,
    startDownload,
    clearCompleted,
    clearFailed,
    hasActiveJobs,
  };
}
