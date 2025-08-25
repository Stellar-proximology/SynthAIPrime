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

Quickstart — Termux (Android)

pkg update -y && pkg upgrade -y
pkg install -y nodejs-lts git sqlite

git clone https://github.com/you/cynthia-prime.git
cd cynthia-prime
cp .env.example .env
chmod +x server/scripts/termux-start.sh
./server/scripts/termux-start.sh

Environment

PORT=8787
CORS_ORIGIN=http://localhost:5173
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b-instruct
CLOUD_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

API

GET  /api/health → { ok, router: "ollama|cloud|mock", versions }

POST /api/chat { message } → { text, node, model, metrics }

POST /api/seed → loads sample prompts


PWA

manifest.webmanifest + sw.js cache app shell & CDN

Install from browser menu → works offline after first load


Data Shapes

type Prompt = { id:string; name:string; body:string; createdAt:number; updatedAt:number; version:number };
type Log = { id:string; ts:number; input:string; output:string; node:"body"|"heart"|"mind"; model:string; tokens:number; ms:number };
type TrinityConfig = { body:{gate:number;line:number}, heart:{gate:number;line:number}, mind:{gate:number;line:number} };

HD/Astro Hooks (lightweight, pure TS)

computeTrinity(birthData) → deterministic gates/lines

transitNow() → planets snapshot (toy, extend later)

resonanceSentence(spec) → concise sentence from Gate.Line


Smoke Tests

./tests/smoke.sh

Run Sheet (10 steps)

1. Clone repo


2. Copy .env.example → .env


3. npm install


4. npm run dev (desktop) or Termux script


5. Open app


6. Install as PWA


7. Create & reload prompts → persistence OK


8. Test avatar speaks; mic captures


9. ./tests/smoke.sh → API OK


10. Toggle Wi-Fi → offline still serves app



Risks & Mitigations

Mic/ASR support varies → webkitSpeechRecognition fallback + clear UI.

Ollama down → auto fall back to cloud; if no key → mock echo.

Service worker cache drift → versioned CACHE_NAME and cleanup.

SQLite busy → WAL mode, short busy timeout.



---

---

### `cynthia-prime/.env.example`
```ini
PORT=8787
CORS_ORIGIN=http://localhost:5173
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b-instruct
CLOUD_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

