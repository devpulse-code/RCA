# RCA/docker/backend/Dockerfile
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

WORKDIR /app/backend
# NEW: point Alembic to the config file no matter where we run from
ENV ALEMBIC_CONFIG=/app/backend/alembic.ini
# Install curl (healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends curl ffmpeg && \
    rm -rf /var/lib/apt/lists/*
# Copy requirements relative to project root
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
# Now relative to /app/backend, so files go to /app/backend/src
COPY backend/src ./src
COPY backend/alembic.ini .
COPY backend/pyproject.toml .

# Copy entrypoint and make it executable
COPY docker/backend/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Create non‑root user and the uploads directory
RUN addgroup --system app && adduser --system --ingroup app app
RUN mkdir -p /app/uploads && chown app:app /app/uploads

# Switch to the non‑root user
USER app

# Development target
FROM base AS development
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["uvicorn", "backend.src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production target
FROM base AS production
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["uvicorn", "backend.src.main:app", "--host", "0.0.0.0", "--port", "8000"]
# end of RCA/docker/backend/Dockerfile