#!/usr/bin/env bash
set -euo pipefail

HOST=${1:-http://127.0.0.1:8787}

echo "[1/3] Health check"
curl -fsSL "$HOST/api/health" | jq .

echo "[2/3] Chat mock"
curl -fsSL -X POST "$HOST/api/chat" \
  -H 'content-type: application/json' \
  -d '{"message":"Say hello in 6 words."}' | jq .

echo "[3/3] Seed prompts"
curl -fsSL -X POST "$HOST/api/seed" | jq .

echo "Smoke OK ✅"
