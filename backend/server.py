import os
import uuid
import asyncio
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI(title="yt-downloader-backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yt-video-downloader-beta.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR", "/tmp/yt-downloader-downloads")
DOWNLOAD_PATH = Path(DOWNLOAD_DIR)
DOWNLOAD_PATH.mkdir(parents=True, exist_ok=True)

jobs: dict = {}

class StartRequest(BaseModel):
    url: str

@app.post("/start")
async def start(req: StartRequest):
    url = req.url
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "preparing"}
    asyncio.create_task(run_download(job_id, url))
    return {"jobId": job_id}

async def run_download(job_id: str, url: str):
    try:
        jobs[job_id]["status"] = "downloading"
        out_template = str(DOWNLOAD_PATH / f"{job_id}.%(ext)s")
        proc = await asyncio.create_subprocess_exec(
            "yt-dlp",
            "-f",
            "best",
            "-o",
            out_template,
            url,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()

        for output_path in DOWNLOAD_PATH.glob(f"{job_id}.*"):
            if output_path.is_file():
                jobs[job_id]["status"] = "ready"
                jobs[job_id]["path"] = str(output_path)
                return

        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = (stderr.decode() if stderr else "download failed")
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)

@app.get("/status/{job_id}")
def status(job_id: str):
    return jobs.get(job_id, {"status": "not_found"})

@app.get("/file/{job_id}")
def get_file(job_id: str):
    j = jobs.get(job_id)
    if not j:
        raise HTTPException(status_code=404, detail="job not found")
    if j.get("status") != "ready":
        raise HTTPException(status_code=400, detail="file not ready")
    return FileResponse(j["path"], filename=os.path.basename(j["path"]))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=8080, reload=False)
