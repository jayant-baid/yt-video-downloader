import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backend";
import { getJob, cleanupJob } from "@/lib/downloadManager";
import { createReadStream } from "fs";
import { Readable } from "stream";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const backendBaseUrl = getBackendBaseUrl();

  if (backendBaseUrl) {
    try {
      const response = await fetch(`${backendBaseUrl}/file/${jobId}`);
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": response.headers.get("content-type") || "application/octet-stream",
            "Content-Disposition": response.headers.get("content-disposition") || "attachment",
            "Cache-Control": "no-store",
          },
        });
      }

      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: response.status });
    } catch {
      // fall back to local behavior if the backend is unavailable
    }
  }

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

  const ext = job.isAudio ? "mp3" : "mp4";
  const contentType = job.isAudio ? "audio/mpeg" : "video/mp4";
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
