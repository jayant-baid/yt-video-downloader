import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobStatus =
  | "preparing"
  | "downloading"
  | "merging"
  | "ready"
  | "failed";

export interface DownloadJob {
  id: string;
  status: JobStatus;
  url: string;
  formatId: string;
  isAudio: boolean;
  progress: number; // 0-100
  filePath: string | null;
  filename: string | null;
  fileSize: number | null;
  tmpDir: string | null;
  error: string | null;
  createdAt: number;
  process: ChildProcess | null;
}

// Serialisable subset sent to the client.
export interface JobStatusResponse {
  id: string;
  status: JobStatus;
  progress: number;
  error: string | null;
  filename: string | null;
  fileSize: number | null;
}

// ---------------------------------------------------------------------------
// WinGet path resolution (reused from ytdlp.ts)
// ---------------------------------------------------------------------------

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

  if (!fs.existsSync(baseWinGet)) return paths;

  try {
    const dirs = fs.readdirSync(baseWinGet);

    const ytdlpDir = dirs.find((d) => d.includes("yt-dlp.yt-dlp"));
    if (ytdlpDir) paths.push(path.join(baseWinGet, ytdlpDir));

    const ffmpegDirs = dirs.filter((d) => d.toLowerCase().includes("ffmpeg"));
    for (const ffmpegDir of ffmpegDirs) {
      const full = path.join(baseWinGet, ffmpegDir);
      if (fs.existsSync(path.join(full, "ffmpeg.exe"))) {
        paths.push(full);
      }
      try {
        for (const sub of fs.readdirSync(full)) {
          const subPath = path.join(full, sub);
          if (!fs.statSync(subPath).isDirectory()) continue;
          if (fs.existsSync(path.join(subPath, "ffmpeg.exe"))) paths.push(subPath);
          const binPath = path.join(subPath, "bin");
          if (fs.existsSync(path.join(binPath, "ffmpeg.exe"))) paths.push(binPath);
        }
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }

  return paths;
}

function buildEnv(): NodeJS.ProcessEnv {
  const winGetPaths = getWinGetPaths();
  return {
    ...process.env,
    PYTHONUNBUFFERED: "1",
    PATH: [...winGetPaths, process.env.PATH].filter(Boolean).join(path.delimiter),
  };
}

// ---------------------------------------------------------------------------
// Job store (in-memory, singleton)
// ---------------------------------------------------------------------------

const jobs = new Map<string, DownloadJob>();

const CLEANUP_AGE_MS = 30 * 60 * 1000; // 30 minutes

function runCleanup() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > CLEANUP_AGE_MS && (job.status === "ready" || job.status === "failed")) {
      if (job.tmpDir) {
        try { fs.rmSync(job.tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
      }
      jobs.delete(id);
    }
  }
}

// Run cleanup every 5 minutes.
setInterval(runCleanup, 5 * 60 * 1000);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getJob(id: string): DownloadJob | undefined {
  return jobs.get(id);
}

export function getJobStatus(id: string): JobStatusResponse | null {
  const job = jobs.get(id);
  if (!job) return null;
  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    error: job.error,
    filename: job.filename,
    fileSize: job.fileSize,
  };
}

export function listJobs(): JobStatusResponse[] {
  return Array.from(jobs.values()).map((job) => ({
    id: job.id,
    status: job.status,
    progress: job.progress,
    error: job.error,
    filename: job.filename,
    fileSize: job.fileSize,
  }));
}

export function cleanupJob(id: string): void {
  const job = jobs.get(id);
  if (!job) return;
  if (job.tmpDir) {
    try { fs.rmSync(job.tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
  jobs.delete(id);
}

export function startJob(
  url: string,
  formatId: string,
  isAudio: boolean
): string {
  const id = crypto.randomUUID();

  const tmpRoot = path.join(os.tmpdir(), "yt-downloader");
  fs.mkdirSync(tmpRoot, { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(tmpRoot, "job-"));

  const outputTemplate = path.join(tmpDir, "%(title).200B.%(ext)s");

  const args: string[] = [
    "--no-playlist",
    "--newline",            // progress on separate lines
    "--progress",
    "--progress-template", "download:%(progress._percent_str)s",
    "--print", "after_move:filepath",
    "-o", outputTemplate,
  ];

  if (isAudio) {
    args.push(
      "-f", `${formatId || "bestaudio"}/bestaudio`,
      "-x",
      "--audio-format", "mp3",
      "--audio-quality", "0",
      url
    );
  } else {
    args.push(
      "-f", `${formatId}+bestaudio[ext=m4a]/${formatId}+bestaudio/best[ext=mp4]/best`,
      "--merge-output-format", "mp4",
      url
    );
  }

  const job: DownloadJob = {
    id,
    status: "preparing",
    url,
    formatId,
    isAudio,
    progress: 0,
    filePath: null,
    filename: null,
    fileSize: null,
    tmpDir,
    error: null,
    createdAt: Date.now(),
    process: null,
  };

  jobs.set(id, job);

  // Spawn yt-dlp in the background.
  const customEnv = buildEnv();
  const child = spawn("yt-dlp", args, {
    env: customEnv,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  job.process = child;

  let stdoutBuffer = "";
  let stderrBuffer = "";

  child.stdout?.on("data", (chunk: Buffer) => {
    stdoutBuffer += chunk.toString();

    // Parse progress lines: e.g. "  45.2%"
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() || ""; // keep incomplete last line

    for (const line of lines) {
      const trimmed = line.trim();

      // Progress percentage from --progress-template
      const percentMatch = trimmed.match(/([\d.]+)%/);
      if (percentMatch) {
        const pct = parseFloat(percentMatch[1]);
        if (!isNaN(pct)) {
          job.progress = Math.min(Math.round(pct), 99);
          if (job.status === "preparing") job.status = "downloading";
        }
        continue;
      }

      // Merger line
      if (trimmed.includes("[Merger]") || trimmed.includes("[ExtractAudio]")) {
        job.status = "merging";
        job.progress = 95;
        continue;
      }

      // The --print after_move:filepath line — this is the final output path.
      // It will be a valid file path (not starting with [ )
      if (trimmed && !trimmed.startsWith("[") && !trimmed.startsWith("Deleting")) {
        // Could be the final filepath printed by --print
        if (fs.existsSync(trimmed)) {
          job.filePath = trimmed;
          job.filename = path.basename(trimmed);
        }
      }
    }
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    stderrBuffer += chunk.toString();

    // yt-dlp also prints progress to stderr in some versions
    const lines = stderrBuffer.split(/\r?\n/);
    stderrBuffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      // Download progress: [download]  45.2% of ~50MiB ...
      const dlMatch = trimmed.match(/\[download\]\s+([\d.]+)%/);
      if (dlMatch) {
        const pct = parseFloat(dlMatch[1]);
        if (!isNaN(pct)) {
          job.progress = Math.min(Math.round(pct), 99);
          if (job.status === "preparing") job.status = "downloading";
        }
      }
      if (trimmed.includes("[Merger]") || trimmed.includes("[ExtractAudio]")) {
        job.status = "merging";
        job.progress = 95;
      }
    }
  });

  child.on("close", (code) => {
    job.process = null;

    if (code !== 0 && !job.filePath) {
      job.status = "failed";
      job.error = stderrBuffer.trim().slice(-500) || `yt-dlp exited with code ${code}`;
      return;
    }

    // If filePath wasn't captured from stdout, try to find the file in tmpDir.
    if (!job.filePath) {
      try {
        const files = fs.readdirSync(tmpDir);
        if (files.length > 0) {
          const sorted = files
            .map((f) => ({
              name: f,
              time: fs.statSync(path.join(tmpDir, f)).mtimeMs,
            }))
            .sort((a, b) => b.time - a.time);
          job.filePath = path.join(tmpDir, sorted[0].name);
          job.filename = sorted[0].name;
        }
      } catch { /* ignore */ }
    }

    if (job.filePath && fs.existsSync(job.filePath)) {
      job.fileSize = fs.statSync(job.filePath).size;
      job.progress = 100;
      job.status = "ready";
    } else {
      job.status = "failed";
      job.error = "Download completed but output file not found";
    }
  });

  child.on("error", (err) => {
    job.process = null;
    job.status = "failed";
    job.error = err.message.includes("ENOENT")
      ? "yt-dlp is not installed. Please install it: https://github.com/yt-dlp/yt-dlp#installation"
      : `Spawn error: ${err.message}`;
  });

  return id;
}
