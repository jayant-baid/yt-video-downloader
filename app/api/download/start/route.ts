import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backend";
import { startJob } from "@/lib/downloadManager";
import { isValidYouTubeUrl } from "@/lib/ytdlp";

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

    const backendBaseUrl = getBackendBaseUrl();
    if (backendBaseUrl) {
      try {
        const response = await fetch(`${backendBaseUrl}/start`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url }),
        });

        const data = await response.json();
        if (response.ok) {
          return NextResponse.json(data);
        }

        return NextResponse.json(data, { status: response.status });
      } catch {
        // fall back to local behavior if the backend is unavailable
      }
    }

    if (!isAudio && !formatId) {
      return NextResponse.json(
        { error: "Format ID is required for video downloads" },
        { status: 400 }
      );
    }

    const jobId = startJob(url, formatId || "", isAudio === true);

    return NextResponse.json({ jobId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
