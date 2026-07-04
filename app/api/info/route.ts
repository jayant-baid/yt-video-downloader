import { NextRequest, NextResponse } from "next/server";
import { getVideoInfo, isValidYouTubeUrl, formatFileSize } from "@/lib/ytdlp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL. Please provide a valid YouTube video link." },
        { status: 400 }
      );
    }

    const info = await getVideoInfo(url);

    // Add formatted file sizes
    const videoFormats = info.videoFormats.map((f) => ({
      ...f,
      filesizeFormatted: formatFileSize(f.filesize),
    }));

    const audioFormats = info.audioFormats.map((f) => ({
      ...f,
      filesizeFormatted: formatFileSize(f.filesize),
    }));

    return NextResponse.json({
      id: info.id,
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      durationString: info.durationString,
      channel: info.channel,
      viewCount: info.viewCount,
      videoFormats,
      audioFormats,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    const status = message.includes("not installed") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
