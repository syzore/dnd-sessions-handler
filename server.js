import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

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
// A "session" is the group: every tool hangs its data off the same code and DM key.
async function api(req, res, parts, url) {
  if (parts[1] === 'sched') return schedApi(req, res, parts, url);
  if (parts[1] === 'tables') return tablesApi(req, res, parts, url);
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

// ---------- scheduling ----------
const VOTES = ['yes', 'maybe', 'no'];
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);

function schedule(s) {
  return (s.schedule ||= { dates: [], quorum: 0, locked: null, people: {} });
}

// Keep only well-formed {key: 'yes'|'maybe'|'no'} entries
function cleanVotes(obj, validKey) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (validKey(k) && VOTES.includes(v)) out[k] = v;
  return out;
}

async function schedApi(req, res, parts, url) {
  // parts: ['api', 'sched', code, sub?, id?]
  const s = db.sessions[String(parts[2] || '').toUpperCase()];
  if (!s) return json(res, 404, { error: 'הקבוצה לא נמצאה' });
  const sc = schedule(s);
  const isAdmin = url.searchParams.get('key') === s.adminKey;

  // GET /api/sched/:code?pid=&key=
  if (req.method === 'GET' && parts.length === 3) {
    const pid = url.searchParams.get('pid');
    const people = Object.entries(sc.people)
      .filter(([, p]) => p.name)
      .sort((a, b) => a[1].createdAt - b[1].createdAt)
      .map(([id, p]) => ({ name: p.name, me: id === pid, weekly: p.weekly, votes: p.votes }));
    return json(res, 200, {
      code: s.code,
      title: s.title,
      isAdmin,
      dates: sc.dates,
      quorum: sc.quorum,
      locked: sc.locked,
      people,
      me: sc.people[pid] || s.responses[pid] ? { name: sc.people[pid]?.name || s.responses[pid]?.name } : null,
    });
  }

  // PUT /api/sched/:code/me/:pid  {name?, weekly?, votes?}
  if (req.method === 'PUT' && parts[3] === 'me' && parts[4]) {
    const body = await readBody(req);
    const pid = clean(parts[4], 64);
    const prev = sc.people[pid] || { createdAt: Date.now(), weekly: {}, votes: {} };
    sc.people[pid] = {
      ...prev,
      name: clean(body.name ?? prev.name, 40),
      weekly: body.weekly ? cleanVotes(body.weekly, (k) => /^[0-6]$/.test(k)) : prev.weekly,
      votes: body.votes ? cleanVotes(body.votes, isDate) : prev.votes,
      updatedAt: Date.now(),
    };
    save();
    return json(res, 200, { ok: true });
  }

  // PUT /api/sched/:code/admin?key=  {dates?, quorum?, locked?}
  if (req.method === 'PUT' && parts[3] === 'admin') {
    if (!isAdmin) return json(res, 403, { error: 'רק ה-DM' });
    const body = await readBody(req);
    if (Array.isArray(body.dates)) sc.dates = [...new Set(body.dates.filter(isDate))].sort().slice(0, 60);
    if (body.quorum !== undefined) sc.quorum = Math.max(0, Math.min(20, parseInt(body.quorum, 10) || 0));
    if (body.locked !== undefined) {
      const l = body.locked;
      sc.locked =
        l && isDate(l.date)
          ? { date: l.date, time: /^\d{2}:\d{2}$/.test(l.time) ? l.time : '20:00', place: clean(l.place, 120) }
          : null;
    }
    save();
    return json(res, 200, { ok: true });
  }

  // GET /api/sched/:code/event.ics
  if (req.method === 'GET' && parts[3] === 'event.ics') {
    if (!sc.locked) return json(res, 404, { error: 'עוד לא נקבע מועד' });
    const { date, time, place } = sc.locked;
    const start = date.replaceAll('-', '') + 'T' + time.replace(':', '') + '00';
    const end = new Date(`${date}T${time}:00Z`);
    end.setUTCHours(end.getUTCHours() + 4);
    const endStr = end.toISOString().slice(0, 19).replace(/[-:]/g, '');
    const esc = (t) => String(t).replace(/([,;\\])/g, '\\$1');
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//dnd-tools//schedule//HE',
      'BEGIN:VEVENT',
      `UID:${s.code}-${date}@dnd-tools`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTSTART;TZID=Asia/Jerusalem:${start}`,
      `DTEND;TZID=Asia/Jerusalem:${endStr}`,
      `SUMMARY:${esc('D&D — ' + s.title)}`,
      place ? `LOCATION:${esc(place)}` : null,
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .filter(Boolean)
      .join('\r\n');
    return send(res, 200, ics, {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="dnd-${date}.ics"`,
    });
  }

  return json(res, 404, { error: 'not found' });
}

// ---------- random tables (DM only) ----------
// Only the Claude-backed "enrich" roll lives here; table rolls happen in the browser.
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
const MOTIF_TYPES = ['class', 'race', 'background', 'creature', 'theme'];
const ANCHOR_TYPES = [...MOTIF_TYPES, 'character', 'place', 'faction', 'item', 'secret'];

const KIND_PROMPTS = {
  loot: 'a loot / treasure find: coins plus 1-3 items with D&D 5e values in gold pieces (write gold as מ״ז)',
  encounter: 'a random encounter: a situation with something happening and a twist, not just a list of monsters',
  npc: 'an NPC: name, race and occupation, look, mannerism, what they want, a secret',
  rumor: 'a tavern rumor, 1-2 sentences, which may be true, false or half-true',
  hook: 'a quest hook: who asks, what they want, the reward, and a complication',
  tavern: 'a tavern or inn: name, owner, house specialty, one odd detail',
  name: 'three fitting fantasy names, each with a few words of description',
  complication: 'a sudden complication the DM can throw into the current scene',
  place: 'a place: name, what it is known for, and a secret',
  pockets: "the contents of a random person's pockets: a few coins and 2-4 small, telling objects",
  corpse: 'a body the party finds: who it was, cause of death, what is on the body, and a clue',
  room: 'a dungeon room: what the room is, a notable feature, who or what is there, and treasure',
  tavernEvent: 'something that happens in the tavern right now, that the party can get pulled into',
};
const ENVIRONMENTS = { road: 'on the road', city: 'in a city', dungeon: 'in a dungeon', wild: 'in the wilderness' };
const AVOID_EN = {
  gore: 'gore / extreme violence',
  sexual: 'sexual content',
  sexual_violence: 'sexual violence',
  child_violence: 'violence toward children',
  animal: 'animal cruelty',
  horror: 'horror',
  drugs: 'drugs',
  real_world: 'real-world religion or politics',
};

const AI_SYSTEM = `You generate results for a Dungeon Master's random tables in a Hebrew-speaking D&D 5e group.
Write in natural, modern Hebrew with correct grammatical gender. Keep it table-ready: a short title and 1-6 short lines the DM can read aloud or use tonight. Be concrete and surprising rather than generic.
When campaign anchors are given, weave them in as the request asks, and stay consistent with their notes. Content the group asked to avoid must not appear.
List in anchors_used the exact names of the anchors you used.`;

const AI_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    lines: { type: 'array', items: { type: 'string' } },
    anchors_used: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'lines', 'anchors_used'],
  additionalProperties: false,
};

function tables(s) {
  return (s.tables ||= { anchors: [], saved: [] });
}

function groupAvoid(s) {
  const ids = new Set();
  const other = new Set();
  for (const r of Object.values(s.responses || {})) {
    if (!r.done) continue;
    for (const id of r.answers.avoid || []) if (AVOID_EN[id]) ids.add(AVOID_EN[id]);
    if ((r.answers.avoid || []).includes('other') && r.answers.avoidOther) other.add(clean(r.answers.avoidOther, 200));
  }
  return [...ids, ...other];
}

function aiPrompt(s, body) {
  const t = tables(s);
  const focus = new Set(body.focus || []);
  const anchors = t.anchors.map(
    (a) => `- [${a.type}] ${a.name}${a.note ? ` — ${a.note}` : ''}${focus.has(a.id) ? '  (FOCUS: must be used)' : ''}`
  );
  const how = 'None of the anchors were drawn this time: make something fresh that still fits the campaign.';
  const avoid = groupAvoid(s);
  return [
    `Generate ${KIND_PROMPTS[body.kind]}${body.kind === 'encounter' && ENVIRONMENTS[body.env] ? `, ${ENVIRONMENTS[body.env]}` : ''}.`,
    `Campaign: ${s.title}`,
    anchors.length ? `Campaign anchors:\n${anchors.join('\n')}` : 'No campaign anchors yet.',
    anchors.length
      ? `Anchor types ${MOTIF_TYPES.join('/')} are motifs (archetypes, not specific individuals): build around them, e.g. a hermit who was once a paladin and now studies how to defeat dragons. The other types are specific named things in this campaign.`
      : '',
    focus.size ? 'The anchors marked FOCUS were drawn for this roll: all of them must shape the result, combined in one coherent idea.' : how,
    avoid.length ? `The group asked to avoid: ${avoid.join(', ')}.` : '',
    body.seed ? `Build on this table result, keeping its core idea but making it richer:\n${clean(body.seed, 1500)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

async function tablesApi(req, res, parts, url) {
  // parts: ['api', 'tables', code, sub?, id?]
  const s = db.sessions[String(parts[2] || '').toUpperCase()];
  if (!s) return json(res, 404, { error: 'הקבוצה לא נמצאה' });
  if (url.searchParams.get('key') !== s.adminKey) return json(res, 403, { error: 'רק ה-DM' });
  const t = tables(s);

  if (req.method === 'GET' && parts.length === 3)
    return json(res, 200, { code: s.code, title: s.title, anchors: t.anchors, saved: t.saved, ai: !!anthropic });

  if (req.method === 'PUT' && parts[3] === 'anchors') {
    const body = await readBody(req);
    t.anchors = (Array.isArray(body.anchors) ? body.anchors : [])
      .filter((a) => a && ANCHOR_TYPES.includes(a.type) && clean(a.name, 60))
      .slice(0, 150)
      .map((a) => ({
        id: clean(a.id, 24) || crypto.randomBytes(6).toString('hex'),
        type: a.type,
        name: clean(a.name, 60),
        note: clean(a.note, 300),
        ...(a.lib ? { lib: clean(a.lib, 24) } : {}),
      }));
    save();
    return json(res, 200, { anchors: t.anchors });
  }

  if (req.method === 'POST' && parts[3] === 'saved') {
    const body = await readBody(req);
    const item = {
      id: crypto.randomBytes(6).toString('hex'),
      kind: clean(body.kind, 20),
      title: clean(body.title, 120),
      lines: (Array.isArray(body.lines) ? body.lines : []).slice(0, 12).map((l) => clean(l, 500)),
      anchors: (Array.isArray(body.anchors) ? body.anchors : []).slice(0, 10).map((a) => clean(a, 60)),
      source: body.source === 'ai' ? 'ai' : 'table',
      at: Date.now(),
    };
    t.saved = [item, ...t.saved].slice(0, 300);
    save();
    return json(res, 201, { item });
  }

  if (req.method === 'DELETE' && parts[3] === 'saved' && parts[4]) {
    t.saved = t.saved.filter((x) => x.id !== parts[4]);
    save();
    return json(res, 200, { ok: true });
  }

  if (req.method === 'POST' && parts[3] === 'ai') {
    if (!anthropic) return json(res, 503, { error: 'Claude לא מחובר (חסר ANTHROPIC_API_KEY)' });
    const body = await readBody(req);
    if (!KIND_PROMPTS[body.kind]) return json(res, 400, { error: 'סוג לא מוכר' });
    try {
      const response = await anthropic.beta.messages.create({
        model: 'claude-opus-5',
        max_tokens: 8000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: AI_SCHEMA } },
        system: AI_SYSTEM,
        messages: [{ role: 'user', content: aiPrompt(s, body) }],
      });
      if (response.stop_reason === 'refusal') return json(res, 422, { error: 'Claude סירב לבקשה הזאת' });
      const text = response.content.find((b) => b.type === 'text')?.text;
      const out = JSON.parse(text);
      return json(res, 200, { title: out.title, lines: out.lines, anchors: out.anchors_used });
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return json(res, 429, { error: 'יותר מדי בקשות, נסו שוב עוד רגע' });
      if (e instanceof Anthropic.AuthenticationError) return json(res, 503, { error: 'מפתח ה-API של Claude לא תקין' });
      if (e instanceof Anthropic.APIError) return json(res, 502, { error: `שגיאה מ-Claude (${e.status})` });
      if (e instanceof SyntaxError) return json(res, 502, { error: 'Claude החזיר תשובה לא תקינה' });
      throw e;
    }
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
  for (const tool of ['session-zero', 'schedule', 'tables'])
    if (parts[0] === tool && !path.extname(url.pathname)) return serveFile(res, path.join(PUBLIC, tool, 'index.html'));

  // Static assets (no path traversal)
  const file = path.normalize(path.join(PUBLIC, url.pathname));
  if (!file.startsWith(PUBLIC)) return send(res, 403, 'Forbidden');
  serveFile(res, file);
});

server.listen(PORT, () => console.log(`listening on :${PORT}, data in ${DATA_DIR}`));
