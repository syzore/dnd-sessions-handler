// Session Two API (docs/specs/session-two.md D7): server.js spawned on a temp copy of the fixture content and a temp DATA_DIR.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASIC = path.join(HERE, 'fixtures', 'session-two', 'basic', 'content');
const SERVER = path.join(HERE, '..', 'server.js');

const procs = [];
let nextPort = 43000 + Math.floor(Math.random() * 2000);
function start() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 's2-api-'));
  fs.cpSync(BASIC, path.join(tmp, 'content'), { recursive: true });
  const s1 = path.join(tmp, 'content', 'session-one');
  const s2 = path.join(tmp, 'content', 'session-two');
  const clean = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('RAILWAY_') && k !== 'LORE_EDIT'));
  const child = spawn('node', [SERVER], { env: { ...clean, PORT: String(nextPort++), DATA_DIR: path.join(tmp, 'data'), S1_CONTENT_DIR: s1, S2_CONTENT_DIR: s2 } });
  procs.push(child);
  return new Promise((resolve, reject) => {
    child.stdout.on('data', async (d) => {
      const m = /listening on :(\d+)/.exec(String(d));
      if (!m) return;
      const base = `http://127.0.0.1:${m[1]}`;
      const made = await (await fetch(`${base}/api/sz/sessions`, { method: 'POST', body: JSON.stringify({ title: 'קבוצה' }) })).json();
      resolve({ base, s1, s2, code: made.code, key: made.adminKey });
    });
    child.on('exit', () => reject(new Error('server exited')));
  });
}
after(() => procs.forEach((p) => p.kill()));

const put = (g, n, pid, body) => fetch(`${g.base}/api/s${n}/${g.code}/me/${pid}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const get = async (g, pid, key = '') => (await fetch(`${g.base}/api/s2/${g.code}?pid=${pid}&key=${key}`)).json();
const dump = async (g) => (await (await fetch(`${g.base}/api/s1/${g.code}?key=${g.key}`)).json()).players;

const S1_ANSWERS = { background: 'sage', background_other: 'משהו', element: 'fire', dream: 'סוד', tools: ['hammer'] };
const ownerOf = (g, choice, extra = {}) => put(g, 1, 'owner', { name: 'בעלים', character: 'a', choice, answers: S1_ANSWERS, ...extra });

test('carried: only the carry and context ids of the character, matched by character not pid (F17)', async () => {
  const g = await start();
  await ownerOf(g, 'keep');
  assert.equal((await put(g, 2, 'other-browser', { character: 'a' })).status, 200);
  const r = await get(g, 'other-browser');
  assert.deepEqual(r.carried, { answers: { background: 'sage', background_other: 'משהו', element: 'fire' }, newName: '' });
  assert.equal(r.s1Character, null);
  assert.equal(r.me.character, 'a');
  const own = await get(g, 'owner');
  assert.equal(own.s1Character, 'a');
  assert.equal(own.carried, null); // owner has not picked a Session Two character yet
});

test('switch owner carries nothing (F13); nobody holds the character (F12); no character', async () => {
  const g = await start();
  await ownerOf(g, 'switch');
  await put(g, 2, 'p1', { character: 'a' });
  assert.equal((await get(g, 'p1')).carried, null);
  await put(g, 2, 'p2', { character: 'b' });
  assert.equal((await get(g, 'p2')).carried, null);
  assert.equal((await get(g, 'nobody')).carried, null);
});

test('rename carries newName, keep leaves it empty (A5)', async () => {
  const g = await start();
  await ownerOf(g, 'rename', { newName: 'חדש' });
  await put(g, 2, 'p1', { character: 'a' });
  assert.equal((await get(g, 'p1')).carried.newName, 'חדש');
  await ownerOf(g, 'keep', { newName: 'חדש' });
  assert.equal((await get(g, 'p1')).carried.newName, '');
});

test('taken lists other players only; 409 on a taken character (F15); free after releasing', async () => {
  const g = await start();
  assert.equal((await put(g, 2, 'p1', { character: 'a' })).status, 200);
  const r = await put(g, 2, 'p2', { character: 'a' });
  assert.equal(r.status, 409);
  assert.equal((await r.json()).error, 'הדמות הזאת כבר נלקחה');
  assert.deepEqual((await get(g, 'p2')).taken, { a: '' });
  assert.deepEqual((await get(g, 'p1')).taken, {});
  assert.equal((await put(g, 2, 'p1', { character: 'a' })).status, 200); // own character is not taken from yourself
});

test('answers are stored as given (multi arrays, plain ids); 413 over 20 KB', async () => {
  const g = await start();
  await put(g, 2, 'p1', { character: 'a', answers: { subclass: 'path_one', picks: ['x', 'y'], details_sage_other: 'טקסט' }, done: true });
  const me = (await get(g, 'p1')).me;
  assert.deepEqual(me.answers, { subclass: 'path_one', picks: ['x', 'y'], details_sage_other: 'טקסט' });
  assert.equal(me.done, true);
  const big = await put(g, 2, 'p1', { answers: { t: 'x'.repeat(21000) } });
  assert.equal(big.status, 413);
  assert.deepEqual((await get(g, 'p1')).me.answers.subclass, 'path_one');
});

test('players: DM key only, with their own carried; DELETE gating and freeing', async () => {
  const g = await start();
  await ownerOf(g, 'keep');
  await put(g, 2, 'p1', { character: 'a' });
  await put(g, 2, 'p2', { character: 'b' });
  assert.equal((await get(g, 'p1')).players, undefined);
  assert.equal((await get(g, 'p1', 'wrong')).players, undefined);
  const dm = await get(g, 'dm', g.key);
  assert.equal(dm.isAdmin, true);
  assert.deepEqual(dm.players.map((p) => [p.id, p.character]), [['p1', 'a'], ['p2', 'b']]);
  assert.equal(dm.players[0].carried.answers.background, 'sage');
  assert.equal(dm.players[1].carried, null);

  const del = (pid, key) => fetch(`${g.base}/api/s2/${g.code}/players/${pid}${key ? `?key=${key}` : ''}`, { method: 'DELETE' });
  assert.equal((await del('p1')).status, 403);
  assert.equal((await del('p1', 'wrong')).status, 403);
  assert.equal((await del('ghost', g.key)).status, 404);
  assert.equal((await del('p1', g.key)).status, 200);
  assert.deepEqual((await get(g, 'p2')).taken, {});
  assert.equal((await put(g, 2, 'p3', { character: 'a' })).status, 200);
});

test('unknown code: 404 (F30)', async () => {
  const g = await start();
  assert.equal((await fetch(`${g.base}/api/s2/ZZZZZ?pid=x`)).status, 404);
  assert.equal((await fetch(`${g.base}/api/s2/ZZZZZ/me/x`, { method: 'PUT', body: '{}' })).status, 404);
});

test('no Session One record changes after any Session Two request', async () => {
  const g = await start();
  await ownerOf(g, 'rename', { newName: 'חדש' });
  const before = JSON.stringify(await dump(g));
  await put(g, 2, 'owner', { character: 'a', answers: { subclass: 'path_one' }, done: true });
  await put(g, 2, 'p2', { character: 'b' });
  await get(g, 'owner');
  await get(g, 'dm', g.key);
  await fetch(`${g.base}/api/s2/content?code=${g.code}&pid=owner&key=${g.key}`);
  await fetch(`${g.base}/api/s2/${g.code}/players/p2?key=${g.key}`, { method: 'DELETE' });
  assert.equal(JSON.stringify(await dump(g)), before);
});

test('content route: contentFor shape; 500 with file and line on broken Session Two content (F27) and Session One (F28)', async () => {
  const g = await start();
  const ok = await fetch(`${g.base}/api/s2/content?code=${g.code}&pid=x`);
  assert.equal(ok.status, 200);
  const c = await ok.json();
  assert.deepEqual(c.characters.map((x) => x.id), ['b', 'a']);
  assert.ok(c.commonLore && c.terms.sc_path);

  const file = path.join(g.s2, 'characters', 'a.md');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('context: element', 'context: nothing_here'));
  const bad = await fetch(`${g.base}/api/s2/content?code=${g.code}&pid=x`);
  assert.equal(bad.status, 500);
  assert.match((await bad.json()).error, /^שגיאה בקובץ התוכן: content\/session-two\/characters\/a\.md line 7: /);
  // the group route still answers, with nothing carried
  await ownerOf(g, 'keep');
  await put(g, 2, 'p1', { character: 'a' });
  assert.deepEqual((await get(g, 'p1')).carried, { answers: {}, newName: '' });

  fs.writeFileSync(path.join(g.s1, 'world.md'), '## nonsense\n');
  const bad1 = await fetch(`${g.base}/api/s2/content?code=${g.code}&pid=x`);
  assert.equal(bad1.status, 500);
  assert.match((await bad1.json()).error, /session-one\/world\.md/);
});

test('content route: a player gets no other character\'s secret, the DM gets all', async () => {
  const g = await start();
  await put(g, 2, 'p1', { character: 'a' });
  const lore = (c) => JSON.stringify(c);
  const mine = await (await fetch(`${g.base}/api/s2/content?code=${g.code}&pid=p1`)).json();
  const stranger = await (await fetch(`${g.base}/api/s2/content?code=${g.code}&pid=nobody`)).json();
  const dm = await (await fetch(`${g.base}/api/s2/content?code=${g.code}&key=${g.key}`)).json();
  const SECRET = 'של א.'; // the secret bullet of a's lore step, copied in by `from: session-one`
  assert.ok(lore(dm).includes(SECRET) && lore(mine).includes(SECRET));
  assert.ok(!lore(stranger).includes(SECRET));
});

test('content route: an own info step\'s secret image reaches its player and the DM only; /img/ serves the file', async () => {
  const g = await start();
  const a = path.join(g.s2, 'characters', 'a.md');
  fs.appendFileSync(a, '\n## info: vision\ntitle: החזון\n\n### secret\n\nimage: מגן — /img/turator-shield.png\n\n- חזון.\n');
  await put(g, 2, 'pa', { character: 'a' });
  await put(g, 2, 'pb', { character: 'b' });
  const body = async (q) => {
    const r = await fetch(`${g.base}/api/s2/content?code=${g.code}&${q}`);
    assert.equal(r.status, 200);
    return r.text();
  };
  for (const q of ['pid=pa', `key=${g.key}`]) assert.ok((await body(q)).includes('/img/turator-shield.png'), q);
  for (const q of ['pid=pb', 'pid=nobody']) assert.ok(!(await body(q)).includes('turator-shield'), q);

  const img = await fetch(`${g.base}/img/turator-shield.png`);
  assert.equal(img.status, 200);
  assert.equal(img.headers.get('content-type'), 'image/png');
  const want = fs.readFileSync(path.join(HERE, '..', 'public', 'img', 'turator-shield.png'));
  assert.ok(Buffer.from(await img.arrayBuffer()).equals(want));
  assert.equal((await fetch(`${g.base}/img/no-such.png`)).status, 404);
});

test('content route: a custom-background term (bg_ override) goes to its own character and the DM only, with what it reaches', async () => {
  const g = await start();
  fs.writeFileSync(path.join(g.s2, 'terms', 'custom.md'), '### מותאם\nid: bg_custom\nen: Custom\ncategory: background\n\nרקע סודי של [[inner_ref]].\n\n### פנימי\nid: inner_ref\nen: Inner\ncategory: concept\n\nמשהו.\n');
  const a = path.join(g.s2, 'characters', 'a.md');
  fs.writeFileSync(a, fs.readFileSync(a, 'utf8').replace('id: a\n', 'id: a\nbackground: custom\n'));
  await put(g, 2, 'pa', { character: 'a' });
  await put(g, 2, 'pb', { character: 'b' });
  const terms = async (q) => {
    const r = await (await fetch(`${g.base}/api/s2/content?code=${g.code}&${q}`)).json();
    assert.ok(r.terms, r.error);
    return Object.keys(r.terms);
  };
  const own = await terms('pid=pa');
  assert.ok(own.includes('bg_custom') && own.includes('inner_ref'));
  for (const q of ['pid=pb', 'pid=nobody']) {
    const other = await terms(q);
    assert.ok(!other.includes('bg_custom') && !other.includes('inner_ref'), q);
  }
  const dm = await terms(`key=${g.key}`);
  assert.ok(dm.includes('bg_custom') && dm.includes('inner_ref'));
});

test('pages: /session-two/<anything> serves the Session Two page; the home page has the tile', async () => {
  const g = await start();
  for (const p of ['/session-two', '/session-two/ABCDE', '/session-two/ABCDE/dm']) {
    const r = await fetch(g.base + p);
    assert.equal(r.status, 200);
    assert.match(await r.text(), /src="\/session-two\/app\.js"/);
  }
  assert.equal((await fetch(`${g.base}/session-two/app.js`)).status, 200);
  assert.match(await (await fetch(g.base + '/')).text(), /href: '\/session-two'/);
});
