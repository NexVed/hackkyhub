# syntax=docker/dockerfile:1
FROM python:3.12-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
WORKDIR /app
COPY requirements.txt requirements-ops.txt ./
RUN pip install --no-cache-dir -r requirements-ops.txt
ARG INSTALL_BROWSER=false
RUN if [ "$INSTALL_BROWSER" = "true" ]; then python -m playwright install --with-deps chromium; fi
RUN groupadd --gid 10001 app && useradd --uid 10001 --gid app --no-create-home app
COPY --chown=app:app app ./app
COPY --chown=app:app scripts ./scripts
USER 10001:10001
# Production ingestion targets frontend Convex; no legacy API/scheduler is started.
CMD ["python", "scripts/sync_to_frontend.py"]
