"use client";

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
                  className="group relative rounded-2xl bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-soft)]
                             transition-all duration-200 hover:bg-[var(--surface-hover)] hover:shadow-[var(--shadow-card)]
                             active:scale-[0.97]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[var(--foreground)] font-semibold text-lg">
                      {format.label}
                    </span>
                    {isDownloadingThis ? (
                      <svg
                        className="animate-spin h-4 w-4 text-[var(--accent)] mt-1"
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
                    ) : (
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
                  <span className="text-[var(--subtle)] text-xs uppercase mt-1 block">
                    {format.ext}
                  </span>
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
                  className="group rounded-2xl bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-soft)]
                             transition-all duration-200 hover:bg-[var(--surface-hover)] hover:shadow-[var(--shadow-card)]
                             active:scale-[0.97] flex items-center gap-4"
                >
                  {/* Music icon */}
                  <div
                    className="w-10 h-10 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center
                                group-hover:bg-[var(--accent-soft)] transition-colors duration-150 shrink-0"
                  >
                    {isDownloadingThis ? (
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
                    ) : (
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
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[var(--foreground)] font-semibold text-base block truncate">
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
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
