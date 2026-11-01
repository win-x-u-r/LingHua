# LingHua backend with MindSpore, for Hugging Face Spaces (Docker SDK).
# Also runs anywhere Docker does: docker build -t linghua-backend backend/
FROM python:3.12-slim

# MindSpore needs the OpenMP runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face runs containers as user 1000
RUN useradd -m -u 1000 app
WORKDIR /home/app/backend

COPY --chown=app requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=app . .
USER app

ENV FLASK_DEBUG=false \
    PORT=7860 \
    PYTHONUNBUFFERED=1
EXPOSE 7860

CMD gunicorn app:app --bind 0.0.0.0:${PORT} --workers 1 --threads 4 --timeout 120
