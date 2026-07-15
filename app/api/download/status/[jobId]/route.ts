import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/lib/backend";
import { getJobStatus } from "@/lib/downloadManager";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const backendBaseUrl = getBackendBaseUrl();

  if (backendBaseUrl) {
    try {
      const response = await fetch(`${backendBaseUrl}/status/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }

      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: response.status });
    } catch {
      // fall back to local behavior if the backend is unavailable
    }
  }

  const status = getJobStatus(jobId);

  if (!status) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(status);
}
