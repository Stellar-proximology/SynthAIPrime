# Cynthia Prime

Mobile-first, offline-capable PWA with avatar (TTS + mic), prompt library, local-first storage, and LLM routing (Ollama with cloud fallback). Runs on desktop or Termux with one command.

## Why Node/Express + better-sqlite3?
- Termux-friendly (no Python build chain pain, no Prisma engine downloads).
- Single binary SQLite via `better-sqlite3` = fast and reliable.
- TS end-to-end, minimal dependencies, PWA-first.

> Note: A Prisma schema is included for future migrations, but runtime uses `better-sqlite3` for Termux stability.

---

## Quickstart — Desktop
```bash
# 1) clone
git clone https://github.com/you/cynthia-prime.git
cd cynthia-prime

# 2) env
cp .env.example .env

# 3) install deps
npm install

# 4) dev (spawns API @8787 and Vite @5173)
npm run dev

# 5) open
xdg-open http://localhost:5173 || open http://localhost:5173
