import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import os from "os";

const execFileAsync = promisify(execFile);

export interface VideoFormat {
  formatId: string;
  ext: string;
  resolution: string;
  height: number | null;
  filesize: number | null;
  filesizeApprox: number | null;
  vcodec: string;
  acodec: string;
  fps: number | null;
  tbr: number | null;
  quality: string;
  hasVideo: boolean;
  hasAudio: boolean;
}

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  durationString: string;
  channel: string;
  viewCount: number;
  uploadDate: string;
  description: string;
  formats: VideoFormat[];
  videoFormats: GroupedFormat[];
  audioFormats: GroupedFormat[];
}

export interface GroupedFormat {
  label: string;
  quality: string;
  formatId: string;
  ext: string;
  filesize: number | null;
  type: "video" | "audio";
}

const QUALITY_MAP: Record<string, string> = {
  "2160": "4K",
  "1440": "2K",
  "1080": "1080p",
  "720": "720p",
  "480": "480p",
  "360": "360p",
  "240": "240p",
  "144": "144p",
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatFileSize(bytes: number | null): string | null {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
    /^(https?:\/\/)?youtu\.be\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
  ];
  return patterns.some((p) => p.test(url));
}

function getWinGetPaths(): string[] {
  const paths: string[] = [];
  const baseWinGet = path.join(
    os.homedir(),
    "AppData",
    "Local",
    "Microsoft",
    "WinGet",
    "Packages"
  );

  if (fs.existsSync(baseWinGet)) {
    try {
      const dirs = fs.readdirSync(baseWinGet);
      
      // Locate yt-dlp directory
      const ytdlpDir = dirs.find((d) => d.includes("yt-dlp.yt-dlp"));
      if (ytdlpDir) {
        paths.push(path.join(baseWinGet, ytdlpDir));
      }

      // Locate FFmpeg bin directories. Different winget packages use different
      // names (Gyan.FFmpeg, yt-dlp.FFmpeg, etc.), so do not hard-code one id.
      const ffmpegDirs = dirs.filter((d) => d.toLowerCase().includes("ffmpeg"));
      for (const ffmpegDir of ffmpegDirs) {
        const fullFfmpegDir = path.join(baseWinGet, ffmpegDir);

        if (fs.existsSync(path.join(fullFfmpegDir, "ffmpeg.exe"))) {
          paths.push(fullFfmpegDir);
        }

        const subs = fs.readdirSync(fullFfmpegDir);
        for (const sub of subs) {
          const subPath = path.join(fullFfmpegDir, sub);
          if (!fs.statSync(subPath).isDirectory()) continue;

          if (fs.existsSync(path.join(subPath, "ffmpeg.exe"))) {
            paths.push(subPath);
          }

          const binPath = path.join(subPath, "bin");
          if (fs.existsSync(path.join(binPath, "ffmpeg.exe"))) {
            paths.push(binPath);
          }
        }
      }
    } catch {
      // Ignore directory read errors
    }
  }
  return paths;
}

function findYtDlp(): string {
  return "yt-dlp";
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  if (!isValidYouTubeUrl(url)) {
    throw new Error("Invalid YouTube URL");
  }

  const ytdlp = findYtDlp();
  const winGetPaths = getWinGetPaths();
  const customEnv = {
    ...process.env,
    PATH: [...winGetPaths, process.env.PATH].filter(Boolean).join(path.delimiter),
  };

  try {
    const { stdout } = await execFileAsync(ytdlp, [
      "--dump-json",
      "--no-warnings",
      "--no-playlist",
      url,
    ], {
      maxBuffer: 10 * 1024 * 1024,
      env: customEnv,
    });

    const data = JSON.parse(stdout);

    // Parse formats
    const allFormats: VideoFormat[] = (data.formats || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f: any) => ({
        formatId: f.format_id,
        ext: f.ext,
        resolution: f.resolution || "audio only",
        height: typeof f.height === "number" ? f.height : null,
        filesize: f.filesize || null,
        filesizeApprox: f.filesize_approx || null,
        vcodec: f.vcodec || "none",
        acodec: f.acodec || "none",
        fps: f.fps || null,
        tbr: f.tbr || null,
        quality: f.height ? `${f.height}p` : "audio",
        hasVideo: f.vcodec !== "none" && f.vcodec !== null,
        hasAudio: f.acodec !== "none" && f.acodec !== null,
      })
    );

    // Group video formats by resolution — pick the best for each resolution
    const videoByHeight = new Map<string, GroupedFormat>();
    const targetResolutions = ["2160", "1440", "1080", "720", "480", "360", "240", "144"];

    for (const f of allFormats) {
      if (!f.hasVideo) continue;
      const height = f.height?.toString();
      if (!height) continue;
      if (!targetResolutions.includes(height)) continue;

      const existing = videoByHeight.get(height);
      const size = f.filesize || f.filesizeApprox || 0;
      const existingSize =
        existing?.filesize || 0;

      if (!existing || size > existingSize) {
        videoByHeight.set(height, {
          label: QUALITY_MAP[height] || `${height}p`,
          quality: `${height}p`,
          formatId: f.formatId,
          ext: "mp4",
          filesize: f.filesize || f.filesizeApprox,
          type: "video",
        });
      }
    }

    // Sort video formats from highest to lowest
    const videoFormats = targetResolutions
      .filter((h) => videoByHeight.has(h))
      .map((h) => videoByHeight.get(h)!);

    // Get best audio format
    const audioFormats: GroupedFormat[] = [];
    const bestAudio = allFormats
      .filter((f) => !f.hasVideo && f.hasAudio)
      .sort((a, b) => (b.tbr || 0) - (a.tbr || 0))[0];

    if (bestAudio) {
      audioFormats.push({
        label: "Audio (MP3)",
        quality: "audio",
        formatId: bestAudio.formatId,
        ext: "mp3",
        filesize: bestAudio.filesize || bestAudio.filesizeApprox,
        type: "audio",
      });
    }

    return {
      id: data.id,
      title: data.title,
      thumbnail: data.thumbnail,
      duration: data.duration,
      durationString: formatDuration(data.duration),
      channel: data.channel || data.uploader || "Unknown",
      viewCount: data.view_count || 0,
      uploadDate: data.upload_date || "",
      description: data.description || "",
      formats: allFormats,
      videoFormats,
      audioFormats,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("is not recognized") || error.message.includes("ENOENT")) {
        throw new Error(
          "yt-dlp is not installed. Please install it: https://github.com/yt-dlp/yt-dlp#installation"
        );
      }
      throw new Error(`Failed to fetch video info: ${error.message}`);
    }
    throw error;
  }
}

export async function downloadVideo(
  url: string,
  formatId: string,
  isAudio: boolean = false
): Promise<{ filePath: string; filename: string; tmpDir: string; fileSize: number }> {
  const ytdlp = findYtDlp();
  const tmpRoot = path.join(os.tmpdir(), "yt-downloader");
  fs.mkdirSync(tmpRoot, { recursive: true });

  const tmpDir = fs.mkdtempSync(path.join(tmpRoot, "job-"));
  const outputTemplate = path.join(tmpDir, "%(title).200B.%(ext)s");

  const args: string[] = [
    "--no-playlist",
    "--no-warnings",
    "--no-progress",
    "--newline",
    "--print",
    "after_move:filepath",
    "-o",
    outputTemplate,
  ];

  if (isAudio) {
    args.push(
      "-f",
      `${formatId || "bestaudio"}/bestaudio`,
      "-x",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "0",
      url
    );
  } else {
    // Download selected video format + best compatible audio, merge into mp4.
    args.push(
      "-f",
      `${formatId}+bestaudio[ext=m4a]/${formatId}+bestaudio/best[ext=mp4]/best`,
      "--merge-output-format",
      "mp4",
      url
    );
  }

  const winGetPaths = getWinGetPaths();
  const customEnv = {
    ...process.env,
    PATH: [...winGetPaths, process.env.PATH].filter(Boolean).join(path.delimiter),
  };

  try {
    const { stdout } = await execFileAsync(ytdlp, args, {
      maxBuffer: 2 * 1024 * 1024,
      timeout: 2 * 60 * 60 * 1000, // Long videos can take a while to merge/convert.
      env: customEnv,
    });

    const printedPaths = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    let filePath =
      [...printedPaths].reverse().find((candidate) => fs.existsSync(candidate)) || "";

    if (!filePath) {
      const files = fs.readdirSync(tmpDir);
      if (files.length > 0) {
        const sorted = files
          .map((f) => ({
            name: f,
            time: fs.statSync(path.join(tmpDir, f)).mtimeMs,
          }))
          .sort((a, b) => b.time - a.time);
        filePath = path.join(tmpDir, sorted[0].name);
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error("Download completed but output file not found");
    }

    const filename = path.basename(filePath);
    const fileSize = fs.statSync(filePath).size;
    return { filePath, filename, tmpDir, fileSize };
  } catch (error) {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    if (error instanceof Error) {
      if (error.message.includes("is not recognized") || error.message.includes("ENOENT")) {
        throw new Error(
          "yt-dlp is not installed. Please install it: https://github.com/yt-dlp/yt-dlp#installation"
        );
      }
      throw new Error(`Download failed: ${error.message}`);
    }
    throw error;
  }
}

export { formatFileSize };
