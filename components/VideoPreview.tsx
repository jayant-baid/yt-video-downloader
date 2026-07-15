"use client";

import Image from "next/image";

interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  durationString: string;
  channel: string;
  viewCount: number;
}

interface VideoPreviewProps {
  video: VideoInfo;
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B views`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}

export default function VideoPreview({ video }: VideoPreviewProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div
        className="bg-[var(--surface)] rounded-xl shadow-[var(--shadow-soft)] overflow-hidden
                    transition-all duration-150"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-[var(--surface-raised)]">
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute bottom-3 right-3 bg-[var(--background)] text-[var(--foreground)] text-xs
                        font-mono px-2 py-1 rounded-md"
          >
            {video.durationString}
          </div>
        </div>

        {/* Info */}
        <div className="p-5">
          <h2 className="line-clamp-2 text-base font-semibold leading-snug text-[var(--foreground)]">
            {video.title}
          </h2>
          <div className="flex items-center gap-3 mt-2.5">
            <span className="text-[var(--muted)] text-sm">{video.channel}</span>
            <span className="text-[var(--subtle)] text-xs">•</span>
            <span className="text-[var(--muted)] text-sm">
              {formatViewCount(video.viewCount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

