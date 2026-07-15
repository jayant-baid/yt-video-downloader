FROM python:3.11-slim

# Install system deps (ffmpeg for processing)
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg ca-certificates build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home appuser
WORKDIR /home/appuser

# Install python deps
COPY requirements.txt /home/appuser/requirements.txt
RUN pip install --no-cache-dir -r /home/appuser/requirements.txt

# Copy app
COPY server.py /home/appuser/server.py
RUN chown -R appuser:appuser /home/appuser
USER appuser

# Download output dir (inside container)
RUN mkdir -p /downloads

EXPOSE 8080
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
