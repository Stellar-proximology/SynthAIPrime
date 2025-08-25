import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';

const PORT = parseInt(process.env.PORT || '8787', 10);
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b-instruct';
const CLOUD_PROVIDER = process.env.CLOUD_PROVIDER || 'openai';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const app = express();
app.use(cors({ origin: ORIGIN }));
app.use(express.json({ limit: '1mb' }));

// --- SQLite init
const db = new Database('server/models/cynthia.db');
db.pragma('journal_mode = WAL');
db.prepare(`
CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  ts INTEGER,
  input TEXT,
  output TEXT,
  node TEXT,
  model TEXT,
  tokens INTEGER,
  ms INTEGER
)`).run();
db.prepare(`
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  name TEXT,
  body TEXT,
  createdAt INTEGER,
  updatedAt INTEGER,
  version INTEGER
)`).run();

const insertLog = db.prepare(`INSERT INTO logs (id, ts, input, output, node, model, tokens, ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const selectHealth = () => ({ node: process.version, betterSqlite3: (db as any).open ? true : true });
const upsertPrompt = db.prepare(`
INSERT INTO prompts (id, name, body, createdAt, updatedAt, version)
VALUES (@id, @name, @body, @createdAt, @updatedAt, @version)
ON CONFLICT(id) DO UPDATE SET
 name=excluded.name, body=excluded.body, updatedAt=excluded.updatedAt, version=excluded.version
`);

app.get('/api/health', async (_req, res) => {
  const router = await detectRouter();
  res.json({
    ok: true,
    router,
    versions: selectHealth(),
  });
});

app.post('/api/seed', (_req, res) => {
  const now = Date.now();
  const prompts = [
    { id: uuid(), name: 'Cynthia Prime — System', body: 'You are Cynthia Prime, a field-aware assistant...', createdAt: now, updatedAt: now, version: 1 },
    { id: uuid(), name: 'Concise Coach', body: 'Coach me in 6 crisp steps...', createdAt: now, updatedAt: now, version: 1 },
  ];
  const tx = db.transaction((rows:any[]) => rows.forEach((r)=> upsertPrompt.run(r)));
  tx(prompts);
  res.json({ ok: true, count: prompts.length });
});

app.post('/api/chat', async (req, res) => {
  const start = Date.now();
  const message: string = (req.body?.message ?? '').toString().slice(0, 5000);
  if (!message) return res.status(400).json({ error: 'Missing message' });

  const router = await detectRouter();

  let text = '';
  let model = '';
  try {
    if (router === 'ollama') {
      const r = await fetch(`${OLLAMA_BASE}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [{ role: 'user', content: message }],
          temperature: 0.4,
        })
      });
      if (!r.ok) throw new Error(`Ollama HTTP ${r.status}`);
      const j = await r.json() as any;
      text = j.choices?.[0]?.message?.content || '';
      model = OLLAMA_MODEL;
    } else if (router === 'cloud' && OPENAI_KEY) {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [{ role: 'user', content: message }],
          temperature: 0.4
        })
      });
      if (!r.ok) throw new Error(`Cloud HTTP ${r.status}`);
      const j = await r.json() as any;
      text = j.choices?.[0]?.message?.content || '';
      model = OPENAI_MODEL;
    } else {
      text = `Echo: ${message}`;
      model = 'mock';
    }
  } catch (err:any) {
    text = `Echo: ${message}`;
    model = 'mock';
  }

  const ms = Date.now() - start;
  const node = pickNode(message);
  const tokens = roughTokens(message + text);
  const logId = uuid();
  insertLog.run(logId, Date.now(), message, text, node, model, tokens, ms);
  res.json({ text, node, model, metrics: { ms, tokens } });
});

app.listen(PORT, () => {
  console.log(`[Cynthia Prime API] http://127.0.0.1:${PORT}`);
});

// --- helpers
function uuid(){ return crypto.randomUUID(); }
function roughTokens(s:string){ return Math.ceil(s.split(/\s+/).length * 1.3); }
function pickNode(input:string):'body'|'heart'|'mind'{
  const t = input.toLowerCase();
  if (/\b(feel|love|hurt|heart|care)\b/.test(t)) return 'heart';
  if (/\bthink|why|how|idea|plan\b/.test(t)) return 'mind' as any;
  return 'body';
}
async function detectRouter():Promise<'ollama'|'cloud'|'mock'>{
  try {
    const ping = await fetch(`${OLLAMA_BASE}/api/tags`, { method:'GET' });
    if (ping.ok) return 'ollama';
  } catch {}
  if (OPENAI_KEY) return 'cloud';
  return 'mock';
}
