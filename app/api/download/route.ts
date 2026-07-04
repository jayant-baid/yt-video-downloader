import { NextRequest, NextResponse } from "next/server";
import { downloadVideo, isValidYouTubeUrl } from "@/lib/ytdlp";
import { createReadStream, rmSync } from "fs";
import { Readable } from "stream";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, formatId, isAudio } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    if (!isAudio && !formatId) {
      return NextResponse.json(
        { error: "Format ID is required for video downloads" },
        { status: 400 }
      );
    }

    const result = await downloadVideo(url, formatId, isAudio);

    const ext = isAudio ? "mp3" : "mp4";
    const contentType = isAudio ? "audio/mpeg" : "video/mp4";
    const stream = createReadStream(result.filePath);

    stream.on("close", () => {
      try {
        rmSync(result.tmpDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(result.filename.replace(/\.[^.]+$/, ""))}.${ext}"`,
        "Content-Length": result.fileSize.toString(),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    const status = message.includes("not installed") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
