import os
import uuid
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI(title="yt-downloader-backend")

DOWNLOAD_DIR = "/downloads"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

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
        out_template = os.path.join(DOWNLOAD_DIR, f"{job_id}.%(ext)s")
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
        stdout, stderr = await proc.communicate()

        # locate produced file
        for fname in os.listdir(DOWNLOAD_DIR):
            if fname.startswith(job_id):
                jobs[job_id]["status"] = "ready"
                jobs[job_id]["path"] = os.path.join(DOWNLOAD_DIR, fname)
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
