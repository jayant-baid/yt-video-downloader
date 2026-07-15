YT Downloader - Backend
=======================

This small backend runs `yt-dlp` to download media and expose simple job endpoints suitable for deployment in a small VM (Fly.io, Render, or similar).

Endpoints
- POST /start    -> { jobId }
- GET  /status/:jobId -> { status, path?, error? }
- GET  /file/:jobId   -> serves the finished file

Build & run locally (Docker)

```bash
# build
docker build -t yt-downloader-backend:local .

# run (map port, persist downloads)
docker run --rm -p 8080:8080 -v "$(pwd)/downloads:/downloads" yt-downloader-backend:local
```

Deploy to Render

1. Push this backend folder to GitHub.
2. Open Render and create a New Web Service from that repository.
3. Use the following settings:
   - Runtime: Python
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port 10000`
4. Deploy the service.

Render will expose a URL like:

```text
https://yt-downloader-backend.onrender.com
```

Set any environment variables in the Render dashboard if needed.

Notes & recommendations
- Use a persistent volume or object storage for production (do not rely on ephemeral container storage).
- Add authentication / rate limiting to avoid abuse.
- For higher throughput use a job queue (Redis + workers) and offload large files to S3-compatible storage.
- Monitor resource usage; the free tiers have limits.

Security & Legal
- This service downloads YouTube content. Ensure you comply with YouTube's Terms of Service and local laws before deploying.
