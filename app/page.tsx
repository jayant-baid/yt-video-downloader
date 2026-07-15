"use client";

import { useState } from "react";
import URLInput from "@/components/URLInput";
import VideoPreview from "@/components/VideoPreview";
import FormatGrid from "@/components/FormatGrid";
import ThemeToggle from "@/components/ThemeToggle";
import DownloadManager from "@/components/DownloadManager";
import { useDownloadManager } from "@/hooks/useDownloadManager";

interface VideoData {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  durationString: string;
  channel: string;
  viewCount: number;
  videoFormats: Array<{
    label: string;
    quality: string;
    formatId: string;
    ext: string;
    filesize: number | null;
    filesizeFormatted: string | null;
    type: "video" | "audio";
  }>;
  audioFormats: Array<{
    label: string;
    quality: string;
    formatId: string;
    ext: string;
    filesize: number | null;
    filesizeFormatted: string | null;
    type: "video" | "audio";
  }>;
}

export default function Home() {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const {
    jobs,
    startDownload,
    clearCompleted,
    clearFailed,
  } = useDownloadManager();

  const handleFetch = async (url: string) => {
    setIsLoading(true);
    setError("");
    setVideoData(null);
    setVideoUrl(url);

    try {
      const response = await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch video info");
      }

      setVideoData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Build a set of active job format IDs to pass to FormatGrid
  const activeJobFormatIds = new Set(
    jobs
      .filter((job) => job.status !== "ready" && job.status !== "failed")
      .map((job) => job.formatId)
  );

  return (
    <main className="flex-1 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-lg shadow-red-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[var(--foreground)]">
                YT Videos Downloader
              </h1>
              <p className="text-xs text-[var(--muted)]">
                Exports videos & MP3 files faster
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 px-6 py-14 sm:py-20">
        <div className="mx-auto w-full max-w-5xl">
          {/* Hero area — only show when no video is loaded */}
          {!videoData && !isLoading && (
            <div className="text-center mb-10 animate-fade-in">
              <div className="mx-auto mb-4 inline-flex uppercase items-center rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
                Streamed downloads • concurrent pipelines
              </div>
              <h2 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-6xl">
                Download YouTube Videos
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                Paste a link, select quality, and start concurrent downloads. Processing runs server-side, and results stream natively to your browser's download manager.
              </p>
            </div>
          )}

          {/* URL Input */}
          <URLInput onSubmit={handleFetch} isLoading={isLoading} />

          {/* Error */}
          {error && (
            <div className="mx-auto mt-6 max-w-2xl animate-fade-in">
              <div className="rounded-xl bg-[var(--accent-soft)] px-4 py-3 shadow-[var(--shadow-soft)]">
                <p className="text-sm text-[var(--accent)]">{error}</p>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div className="mx-auto mt-8 max-w-2xl animate-fade-in">
              <div className="overflow-hidden rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-card)]">
                <div className="aspect-video animate-pulse bg-[var(--surface-hover)]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-3/4 animate-pulse rounded-md bg-[var(--surface-hover)]" />
                  <div className="h-3 w-1/3 animate-pulse rounded-md bg-[var(--surface-hover)]" />
                </div>
              </div>
            </div>
          )}

          {/* Video preview + format grid */}
          {videoData && (
            <div className="animate-slide-up">
              <VideoPreview video={videoData} />
              <FormatGrid
                videoFormats={videoData.videoFormats}
                audioFormats={videoData.audioFormats}
                videoUrl={videoUrl}
                onDownload={startDownload}
                activeJobFormatIds={activeJobFormatIds}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Download Manager */}
      <DownloadManager
        jobs={jobs}
        clearCompleted={clearCompleted}
        clearFailed={clearFailed}
      />

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-4">
        <p className="text-center text-xs text-[var(--muted)]">
          Designed by{" "}
          <a
            href="https://github.com/yt-dlp/yt-dlp"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
          >
            Jayant Baid
          </a>
        </p>
      </footer>
    </main>
  );
}
