#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

# Ensure SQLite file exists and writable
mkdir -p server/models
touch server/models/cynthia.db

# Install deps (idempotent)
npm install

# Start API then client; open a small delay to let server boot
(node --loader ts-node/esm server/main.ts) &

SERVER_PID=$!
sleep 1

(vite --config client/vite.config.ts) &

CLIENT_PID=$!

trap "kill $SERVER_PID $CLIENT_PID || true" INT TERM
wait
