#!/usr/bin/env bash
# deploy.sh
# Usage:
#   ./deploy.sh            -> local docker-compose up (build images)
#   ./deploy.sh --build    -> force rebuild images
#   ./deploy.sh --push     -> build and push backend image to DOCKER_REGISTRY (requires env)
#   ./deploy.sh --prod     -> production mode (compose-prod.yml if provided)
#
# Environment variables used:
#   DOCKER_REGISTRY - e.g. docker.io/youruser
#   BACKEND_IMAGE_NAME - e.g. ton-hero-backend
#   TAG - image tag (default: latest)
#   COMPOSE_FILE - optional docker compose file (default: docker-compose.yml)
#   MONGO_URI, JWT_SECRET - must be provided in .env or environment

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
COMPOSE_FILE="${ROOT_DIR}/backend/docker-compose.yml"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
BACKEND_IMAGE_NAME="${BACKEND_IMAGE_NAME:-ton-hero-backend}"
TAG="${TAG:-latest}"
PUSH="${1:-}"

function info() { echo -e "\n[INFO] $*\n"; }

cd "$BACKEND_DIR"

# ensure .env exists
if [[ ! -f .env ]]; then
  info ".env not found in ${BACKEND_DIR}. Copy .env.example to .env and configure it first."
  cp -n .env.example .env || true
  info "Created .env from example (please edit .env with real values and re-run)."
fi

if [[ "$PUSH" == "--push" ]]; then
  if [[ -z "$DOCKER_REGISTRY" ]]; then
    echo "[ERROR] DOCKER_REGISTRY not set. e.g. docker.io/yourusername"
    exit 1
  fi
fi

#########################
# Build docker image
#########################
info "Building backend docker image..."
docker build -t "${BACKEND_IMAGE_NAME}:${TAG}" -f Dockerfile .

if [[ -n "${DOCKER_REGISTRY}" ]]; then
  docker tag "${BACKEND_IMAGE_NAME}:${TAG}" "${DOCKER_REGISTRY}/${BACKEND_IMAGE_NAME}:${TAG}"
fi

if [[ "$PUSH" == "--push" ]]; then
  info "Pushing image to registry ${DOCKER_REGISTRY}..."
  docker push "${DOCKER_REGISTRY}/${BACKEND_IMAGE_NAME}:${TAG}"
fi

#########################
# Deploy with docker-compose
#########################
if [[ "$PUSH" == "--prod" || "$PUSH" == "--prod-up" ]]; then
  info "Starting production compose..."
  docker-compose -f "$COMPOSE_FILE" up -d --force-recreate --remove-orphans
else
  info "Starting docker-compose (development)..."
  docker-compose -f "$COMPOSE_FILE" up -d --build
fi

# Wait for API health
HEALTH_URL="http://localhost:4000/health"
info "Waiting for API to become healthy at $HEALTH_URL ..."
for i in {1..15}; do
  STATUS=$(curl -sS -o /dev/null -w "%{http_code}" "$HEALTH_URL" || true)
  if [[ "$STATUS" == "200" ]]; then
    info "API is healthy."
    break
  fi
  info "Health check returned $STATUS. Retrying in 2s..."
  sleep 2
done

info "Deployment complete. Backend running on port 5001 (or as configured in docker-compose)."
exit 0