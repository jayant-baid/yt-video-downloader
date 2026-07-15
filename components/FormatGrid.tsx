"use client";

import { Download, Music, Loader2 } from "lucide-react";

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
  onDownload: (url: string, formatId: string, label: string, isAudio: boolean) => void;
  activeJobFormatIds: Set<string>;
}

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
  onDownload,
  activeJobFormatIds,
}: FormatGridProps) {
  return (
    <div className="mx-auto mt-8 w-full max-w-2xl">
      {/* Video Formats */}
      {videoFormats.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Video
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {videoFormats.map((format) => {
              const isDownloadingThis = activeJobFormatIds.has(format.formatId);
              return (
                <button
                  key={format.formatId}
                  onClick={() =>
                    onDownload(videoUrl, format.formatId, `${format.label} Video`, false)
                  }
                  className="group relative rounded-2xl bg-[var(--surface)] cursor-pointer p-4 text-left shadow-[var(--shadow-soft)]
                             transition-all duration-200 hover:bg-[var(--surface-hover)] hover:shadow-[var(--shadow-card)]
                             active:scale-[0.97]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[var(--foreground)] font-semibold text-lg group-hover:text-[var(--accent)]">
                      {format.label}
                    </span>
                    {isDownloadingThis ? (
                      <Loader2 className="animate-spin h-4 w-4 text-[var(--accent)] mt-1" />
                    ) : (
                      <Download className="h-4 w-4 text-[var(--subtle)] group-hover:text-[var(--accent)] transition-colors duration-150 mt-1" />
                    )}
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
                  {/* <span className="text-[var(--subtle)] text-xs uppercase mt-1 block">
                    {format.ext}
                  </span> */}
                </button>
              );
            })}
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
            {audioFormats.map((format) => {
              const isDownloadingThis = activeJobFormatIds.has(format.formatId);
              return (
                <button
                  key={format.formatId}
                  onClick={() =>
                    onDownload(videoUrl, format.formatId, `${format.label}`, true)
                  }
                  className="group rounded-2xl bg-[var(--surface)] cursor-pointer p-4 text-left shadow-[var(--shadow-soft)]
                             transition-all duration-200 hover:bg-[var(--surface-hover)] hover:shadow-[var(--shadow-card)]
                             active:scale-[0.97] flex items-center gap-4"
                >
                  {/* Music icon */}
                  <div
                    className="w-10 h-10 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center
                                group-hover:bg-[var(--accent-soft)] transition-colors duration-150 shrink-0"
                  >
                    {isDownloadingThis ? (
                      <Loader2 className="animate-spin h-5 w-5 text-[var(--accent)]" />
                    ) : (
                      <Music className="h-5 w-5 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors duration-150" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[var(--foreground)] font-semibold text-base block truncate group-hover:text-[var(--accent)]">
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
                  {isDownloadingThis ? (
                    <Loader2 className="animate-spin h-4 w-4 text-[var(--accent)] shrink-0" />
                  ) : (
                    <Download className="h-4 w-4 text-[var(--subtle)] group-hover:text-[var(--accent)] transition-colors duration-150 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
