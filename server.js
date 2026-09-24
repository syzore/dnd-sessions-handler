import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'session-zero.json');

// ---------- storage: one JSON file, rewritten atomically ----------
fs.mkdirSync(DATA_DIR, { recursive: true });
let db = { sessions: {} };
try {
  db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
} catch {}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, DB_FILE);
  }, 200);
}

// Answers that are only ever shown aggregated/anonymised, or to the DM
const PRIVATE_FIELDS = ['avoid', 'avoidOther', 'discomfort', 'notes'];

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newCode() {
  for (;;) {
    let code = '';
    for (let i = 0; i < 5; i++) code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    if (!db.sessions[code]) return code;
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const clean = (s, max) => String(s ?? '').trim().slice(0, max);

// ---------- http helpers ----------
function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}
const json = (res, status, obj) =>
  send(res, status, JSON.stringify(obj), { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 64 * 1024) {
        reject(new Error('too large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        reject(new Error('bad json'));
      }
    });
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveFile(res, file) {
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'Not found');
    send(res, 200, buf, {
      'content-type': MIME[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-cache',
    });
  });
}

// ---------- API ----------
async function api(req, res, parts, url) {
  // parts: ['api', 'sz', 'sessions', code?, sub?, id?]
  if (parts[1] !== 'sz' || parts[2] !== 'sessions') return json(res, 404, { error: 'not found' });

  if (req.method === 'POST' && parts.length === 3) {
    const body = await readBody(req);
    const code = newCode();
    const adminKey = crypto.randomBytes(12).toString('hex');
    db.sessions[code] = {
      code,
      title: clean(body.title, 60) || 'הקבוצה שלנו',
      adminKey,
      createdAt: Date.now(),
      responses: {},
    };
    save();
    return json(res, 201, { code, adminKey });
  }

  const s = db.sessions[String(parts[3] || '').toUpperCase()];
  if (!s) return json(res, 404, { error: 'הסשן לא נמצא' });

  // GET /api/sz/sessions/:code
  if (req.method === 'GET' && parts.length === 4) {
    const rs = Object.values(s.responses);
    return json(res, 200, { code: s.code, title: s.title, count: rs.filter((r) => r.done).length });
  }

  // /api/sz/sessions/:code/responses/:playerId
  if (parts[4] === 'responses' && parts[5]) {
    const pid = clean(parts[5], 64);
    if (req.method === 'GET') return json(res, 200, { response: s.responses[pid] || null });
    if (req.method === 'PUT') {
      const body = await readBody(req);
      const prev = s.responses[pid] || { createdAt: Date.now() };
      const answers = body.answers && typeof body.answers === 'object' ? body.answers : prev.answers || {};
      if (JSON.stringify(answers).length > 20000) return json(res, 413, { error: 'too large' });
      s.responses[pid] = {
        ...prev,
        name: clean(body.name ?? prev.name, 40),
        answers,
        done: body.done ?? prev.done ?? false,
        ready: body.ready ?? prev.ready ?? false,
        updatedAt: Date.now(),
      };
      save();
      return json(res, 200, { ok: true });
    }
  }

  // GET /api/sz/sessions/:code/results?key=
  if (req.method === 'GET' && parts[4] === 'results') {
    const isAdmin = url.searchParams.get('key') === s.adminKey;
    const all = Object.values(s.responses).sort((a, b) => a.createdAt - b.createdAt);
    const done = all.filter((r) => r.done);

    const avoidIds = new Set();
    const avoidOther = new Set();
    for (const r of done) {
      for (const id of r.answers.avoid || []) if (id !== 'none' && id !== 'other') avoidIds.add(id);
      const other = clean(r.answers.avoidOther, 200);
      if (other && (r.answers.avoid || []).includes('other')) avoidOther.add(other);
    }

    const publicAnswers = shuffle(
      done.map((r) => {
        const a = { ...r.answers };
        for (const f of PRIVATE_FIELDS) delete a[f];
        return a;
      })
    );

    return json(res, 200, {
      code: s.code,
      title: s.title,
      isAdmin,
      players: all.filter((r) => r.name).map((r) => ({ name: r.name, done: !!r.done, ready: !!r.ready })),
      answers: publicAnswers,
      avoid: { ids: [...avoidIds], other: [...avoidOther] },
      detail: isAdmin ? all.map((r) => ({ name: r.name, done: !!r.done, ready: !!r.ready, answers: r.answers })) : undefined,
    });
  }

  return json(res, 404, { error: 'not found' });
}

// ---------- routing ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);

  try {
    if (parts[0] === 'api') return await api(req, res, parts, url);
  } catch (e) {
    return json(res, 400, { error: e.message });
  }

  if (req.method !== 'GET') return send(res, 405, 'Method not allowed');
  if (url.pathname === '/health') return send(res, 200, 'ok');

  // Tool SPAs
  if (parts.length === 0) return serveFile(res, path.join(PUBLIC, 'index.html'));
  if (parts[0] === 'session-zero' && !path.extname(url.pathname))
    return serveFile(res, path.join(PUBLIC, 'session-zero', 'index.html'));

  // Static assets (no path traversal)
  const file = path.normalize(path.join(PUBLIC, url.pathname));
  if (!file.startsWith(PUBLIC)) return send(res, 403, 'Forbidden');
  serveFile(res, file);
});

server.listen(PORT, () => console.log(`listening on :${PORT}, data in ${DATA_DIR}`));
