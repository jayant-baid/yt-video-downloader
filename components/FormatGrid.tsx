"use client";

import { useState } from "react";
import DownloadProgress from "./DownloadProgress";

interface Format {
  label: string;
  quality: string;
  formatId: string;
  ext: string;
  filesize: number | null;
  filesizeFormatted: string | null;
  type: "video" | "audio";
}

interface FormatGridProps {
  videoFormats: Format[];
  audioFormats: Format[];
  videoUrl: string;
}

type FileSystemWritable = {
  write: (chunk: Uint8Array) => Promise<void>;
  close: () => Promise<void>;
};

type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string;
  }) => Promise<{ createWritable: () => Promise<FileSystemWritable> }>;
};

const resolutionIcons: Record<string, string> = {
  "4K": "Ultra HD",
  "2K": "Quad HD",
  "1080p": "Full HD",
  "720p": "HD",
  "480p": "SD",
  "360p": "Low",
};

export default function FormatGrid({
  videoFormats,
  audioFormats,
  videoUrl,
}: FormatGridProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadLabel, setDownloadLabel] = useState("");

  const handleDownload = async (
    formatId: string,
    label: string,
    isAudio: boolean
  ) => {
    setDownloading(formatId);
    setDownloadLabel(label);

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: videoUrl,
          formatId,
          isAudio,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Download failed");
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = isAudio ? "audio.mp3" : "video.mp4";

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+?)"?$/);
        if (match) filename = decodeURIComponent(match[1]);
      }

      const pickerWindow = window as SaveFilePickerWindow;
      if (pickerWindow.showSaveFilePicker && response.body) {
        const fileHandle = await pickerWindow.showSaveFilePicker({
          suggestedName: filename,
        });
        const writable = await fileHandle.createWritable();
        const reader = response.body.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) await writable.write(value);
        }

        await writable.close();
        return;
      }

      // Fallback for browsers without File System Access API.
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Download failed"
      );
    } finally {
      setDownloading(null);
      setDownloadLabel("");
    }
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-2xl">
      {/* Video Formats */}
      {videoFormats.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Video
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {videoFormats.map((format) => (
              <button
                key={format.formatId}
                onClick={() =>
                  handleDownload(format.formatId, format.label, false)
                }
                disabled={downloading !== null}
                className="group rounded-2xl bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-soft)]
                           transition-all duration-200 hover:bg-[var(--surface-hover)] hover:shadow-[var(--shadow-card)]
                           disabled:opacity-40 disabled:cursor-not-allowed
                           active:scale-[0.97]"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[var(--foreground)] font-semibold text-lg">
                    {format.label}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[var(--subtle)] group-hover:text-[var(--accent)] transition-colors duration-150 mt-1"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--muted)] text-xs">
                    {resolutionIcons[format.label] || "Video"}
                  </span>
                  {format.filesizeFormatted && (
                    <>
                      <span className="text-[var(--subtle)] text-xs">•</span>
                      <span className="text-[var(--muted)] text-xs">
                        ~{format.filesizeFormatted}
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[var(--subtle)] text-xs uppercase mt-1 block">
                  {format.ext}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Audio Format */}
      {audioFormats.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Audio
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {audioFormats.map((format) => (
              <button
                key={format.formatId}
                onClick={() =>
                  handleDownload(format.formatId, format.label, true)
                }
                disabled={downloading !== null}
                className="group rounded-2xl bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-soft)]
                           transition-all duration-200 hover:bg-[var(--surface-hover)] hover:shadow-[var(--shadow-card)]
                           disabled:opacity-40 disabled:cursor-not-allowed
                           active:scale-[0.97] flex items-center gap-4"
              >
                {/* Music icon */}
                <div
                  className="w-10 h-10 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center
                              group-hover:bg-[var(--accent-soft)] transition-colors duration-150 shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors duration-150"
                  >
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[var(--foreground)] font-semibold text-base block">
                    {format.label}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[var(--muted)] text-xs">Best quality</span>
                    {format.filesizeFormatted && (
                      <>
                        <span className="text-[var(--subtle)] text-xs">•</span>
                        <span className="text-[var(--muted)] text-xs">
                          ~{format.filesizeFormatted}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--subtle)] group-hover:text-[var(--accent)] transition-colors duration-150 shrink-0"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Download progress toast */}
      <DownloadProgress
        isActive={downloading !== null}
        formatLabel={downloadLabel}
      />
    </div>
  );
}

