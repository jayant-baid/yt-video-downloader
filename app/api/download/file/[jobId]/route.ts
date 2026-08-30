import { NextRequest, NextResponse } from "next/server";
import { getJob, cleanupJob } from "@/lib/downloadManager";
import { createReadStream } from "fs";
import { Readable } from "stream";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "ready" || !job.filePath) {
    return NextResponse.json(
      { error: "File not ready yet", status: job.status },
      { status: 409 }
    );
  }

  const extension = (job.filename || "").split(".").pop()?.toLowerCase();
  const ext = extension && /^[a-z0-9]+$/.test(extension)
    ? extension
    : job.isAudio
      ? "m4a"
      : "mp4";
  const contentType = job.isAudio
    ? ext === "m4a" ? "audio/mp4" : ext === "webm" ? "audio/webm" : "audio/mpeg"
    : ext === "webm" ? "video/webm" : "video/mp4";
  const safeName = (job.filename || "download")
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w\s.-]/g, "_");

  const stream = createReadStream(job.filePath);

  // Schedule cleanup after the stream finishes.
  stream.on("close", () => {
    // Delay cleanup slightly to ensure the response is fully sent.
    setTimeout(() => cleanupJob(jobId), 5000);
  });

  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(safeName)}.${ext}"`,
      "Content-Length": (job.fileSize || 0).toString(),
      "Cache-Control": "no-store",
    },
  });
}
