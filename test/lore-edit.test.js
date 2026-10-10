// Lore edit mode: server spawned on a temp copy of the fixture content (never the repo's content).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASIC = path.join(HERE, 'fixtures', 'session-one', 'basic');
const SERVER = path.join(HERE, '..', 'server.js');

const procs = [];
let nextPort = 41000 + Math.floor(Math.random() * 2000);
function start(env) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 's1-edit-'));
  const dir = path.join(tmp, 'content', 'session-one');
  fs.cpSync(BASIC, dir, { recursive: true });
  const clean = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('RAILWAY_') && k !== 'LORE_EDIT'));
  const child = spawn('node', [SERVER], { env: { ...clean, PORT: String(nextPort++), DATA_DIR: path.join(tmp, 'data'), S1_CONTENT_DIR: dir, ...env } });
  procs.push(child);
  return new Promise((resolve, reject) => {
    child.stdout.on('data', async (d) => {
      const m = /listening on :(\d+)/.exec(String(d));
      if (!m) return;
      const base = `http://127.0.0.1:${m[1]}`;
      const created = await (await fetch(`${base}/api/sz/sessions`, { method: 'POST', body: '{}' })).json();
      resolve({ base, dir, code: created.code, key: created.adminKey });
    });
    child.on('exit', () => reject(new Error('server exited')));
  });
}
after(() => procs.forEach((p) => p.kill()));

const q = (s, extra = '') => `code=${s.code}&key=${s.key}${extra}`;
const getFile = (s, file) => fetch(`${s.base}/api/s1/lore-file?${q(s)}&file=${file}`);
const send = (s, method, body, key = s.key) =>
  fetch(`${s.base}/api/s1/lore-file?code=${s.code}&key=${key}`, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

let on;
before(async () => {
  on = await start({ LORE_EDIT: '1' });
});

test('gate off: edit endpoints 404, no edit key in content', async () => {
  const off = await start({});
  assert.equal((await getFile(off, 'world.md')).status, 404);
  assert.equal((await send(off, 'PUT', { file: 'world.md' })).status, 404);
  const c = await (await fetch(`${off.base}/api/s1/content?${q(off)}`)).json();
  assert.ok(!('edit' in c));
});

test('RAILWAY_* env keeps edit mode off', async () => {
  const r = await start({ LORE_EDIT: '1', RAILWAY_X: '1' });
  assert.equal((await getFile(r, 'world.md')).status, 404);
});

test('wrong key: 403; players get no edit key', async () => {
  assert.equal((await send(on, 'PUT', { file: 'world.md' }, 'nope')).status, 403);
  const player = await (await fetch(`${on.base}/api/s1/content?code=${on.code}`)).json();
  assert.ok(!('edit' in player));
  const dm = await (await fetch(`${on.base}/api/s1/content?${q(on)}`)).json();
  assert.ok(dm.edit.files['world.md']);
});

test('PUT round trip: GET returns the same text and version', async () => {
  const g = await (await getFile(on, 'world.md')).json();
  const text = g.text.replace(/\n+$/, '') + '\n';
  const r = await send(on, 'PUT', { file: 'world.md', hash: g.hash, text });
  assert.equal(r.status, 200);
  const saved = await r.json();
  const again = await (await getFile(on, 'world.md')).json();
  assert.equal(again.text, text);
  assert.equal(again.hash, saved.hash);
  const c = await (await fetch(`${on.base}/api/s1/content?${q(on)}`)).json();
  assert.equal(c.edit.files['world.md'], saved.hash);
});

test('validation error: 422 with file and line, file unchanged', async () => {
  const g = await (await getFile(on, 'world.md')).json();
  const text = g.text + '- [[no_such_term]]\n';
  const r = await send(on, 'PUT', { file: 'world.md', hash: g.hash, text });
  assert.equal(r.status, 422);
  const b = await r.json();
  assert.equal(b.file, 'world.md');
  assert.equal(b.line, text.split('\n').length - 1);
  assert.equal(fs.readFileSync(path.join(on.dir, 'world.md'), 'utf8'), g.text);
});

test('stale version: 409, file unchanged', async () => {
  const g = await (await getFile(on, 'world.md')).json();
  const r = await send(on, 'PUT', { file: 'world.md', hash: 'stale', text: g.text });
  assert.equal(r.status, 409);
  assert.equal(fs.readFileSync(path.join(on.dir, 'world.md'), 'utf8'), g.text);
});

test('removing an option id needs confirmRemovedIds', async () => {
  const files = fs.readdirSync(path.join(on.dir, 'characters'));
  const file = `characters/${files[0]}`;
  const g = await (await getFile(on, file)).json();
  const lines = g.text.split('\n');
  const text = [...lines.slice(0, 18), ...lines.slice(29)].join('\n'); // drops the "pick" step
  const r = await send(on, 'PUT', { file, hash: g.hash, text });
  assert.equal(r.status, 422);
  const b = await r.json();
  assert.equal(b.code, 'ids_removed', JSON.stringify(b));
  assert.deepEqual(b.ids, ['a/pick', 'a/pick/snake']);
  assert.equal(fs.readFileSync(path.join(on.dir, file), 'utf8'), g.text);
  const ok = await send(on, 'PUT', { file, hash: g.hash, text, confirmRemovedIds: b.ids });
  assert.equal(ok.status, 200);
  assert.equal(fs.readFileSync(path.join(on.dir, file), 'utf8'), text.endsWith('\n') ? text : text + '\n');
});

test('POST creates a file; a second create says it exists', async () => {
  const text = '### מקום\nid: test_place\nen: Test Place\ncategory: place\n\nתיאור.\n';
  const r = await send(on, 'POST', { file: 'terms/test_places.md', text });
  assert.equal(r.status, 201, JSON.stringify(await r.clone().json()));
  assert.equal(fs.readFileSync(path.join(on.dir, 'terms/test_places.md'), 'utf8'), text);
  assert.equal((await send(on, 'POST', { file: 'terms/test_places.md', text })).status, 409);
});

test('paths outside the content dir are refused', async () => {
  for (const file of ['../server.js', '/etc/passwd', 'README.md', 'terms/../../x.md', '..%2fx.md'])
    assert.equal((await send(on, 'POST', { file, text: 'x\n' })).status, 400, file);
  assert.equal((await getFile(on, '../server.js')).status, 400);
});
