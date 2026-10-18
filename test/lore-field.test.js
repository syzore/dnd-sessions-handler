// PUT /api/s1/lore-field: server spawned on a temp copy of the "edit" fixture (never the repo's content).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(HERE, 'fixtures', 'session-one', 'edit');
const SERVER = path.join(HERE, '..', 'server.js');

const procs = [];
let nextPort = 43000 + Math.floor(Math.random() * 2000);
function start(env) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 's1-field-'));
  const dir = path.join(tmp, 'content', 'session-one');
  fs.cpSync(FIXTURE, dir, { recursive: true });
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

const content = async (s, extra = '') => (await fetch(`${s.base}/api/s1/content?code=${s.code}&key=${s.key}${extra}`)).json();
const read = (s, file) => fs.readFileSync(path.join(s.dir, file), 'utf8');
// PUT edits against the file's current version.
async function put(s, file, edits, hash) {
  hash ??= (await content(s)).edit.files[file];
  const r = await fetch(`${s.base}/api/s1/lore-field?code=${s.code}&key=${s.key}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ file, hash, edits }),
  });
  return { status: r.status, body: await r.json() };
}
// Save one edit; assert 200 and that only [from, to] (1-based, inclusive, in the old file) changed.
async function saveTouching(s, file, edit, from, to) {
  const before = read(s, file).split('\n');
  const r = await put(s, file, [edit]);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const after = read(s, file).split('\n');
  assert.deepEqual(after.slice(0, from - 1), before.slice(0, from - 1));
  const tail = before.length - to;
  assert.deepEqual(after.slice(after.length - tail), before.slice(before.length - tail));
}
const charA = (c) => c.characters.find((x) => x.id === 'a');
const stepOf = (c, id) => charA(c).steps.find((x) => x.id === id);

let on;
before(async () => {
  on = await start({ LORE_EDIT: '1' });
});

test('src: gated DM only, never in player or ungated responses', async () => {
  const off = await start({});
  const body = (o) => JSON.stringify(o);
  assert.ok(!body(await content(off)).includes('"src"'));
  assert.ok(!body(await (await fetch(`${on.base}/api/s1/content?code=${on.code}&key=wrong`)).json()).includes('"src"'));
  assert.ok(!body(await (await fetch(`${on.base}/api/s1/content?code=${on.code}`)).json()).includes('"src"'));
  assert.ok(body(await content(on)).includes('"src"'));
});

test('step fields: title/prompt/hint, each key from its own file (F27)', async () => {
  const god = stepOf(await content(on), 'god');
  assert.equal(god.src.title.file, 'lists/gods.md');
  assert.equal(god.src.prompt.file, 'characters/a.md');
  const pick = stepOf(await content(on), 'pick');
  await saveTouching(on, 'characters/a.md', { line: pick.src.prompt.line, field: 'prompt', value: 'שאלה חדשה [[veles]]' }, pick.src.prompt.line, pick.src.prompt.line);
  assert.equal(stepOf(await content(on), 'pick').prompt, 'שאלה חדשה [[veles]]');
  const g = stepOf(await content(on), 'god');
  await saveTouching(on, 'lists/gods.md', { line: g.src.title.line, field: 'title', value: 'אלים חדשים' }, 1, 1);
  assert.equal(stepOf(await content(on), 'god').title, 'אלים חדשים');
});

test('bullet: own bullet, no-title bullet, and a shared list bullet changes both characters', async () => {
  const known = stepOf(await content(on), 'lore').known;
  const own = known.find((b) => b.title === 'ידוע');
  // continuation line is part of the range (14-15); the comment line after it is not.
  // A line break in the text stays one: the next line is written indented under the bullet.
  await saveTouching(on, 'characters/a.md', { line: own.src.bullet.line, field: 'bullet', value: { title: 'חדש', text: 'שורה\nאחת' } }, own.src.bullet.line, own.src.bullet.line + 1);
  assert.match(read(on, 'characters/a.md'), /^- \*\*חדש\*\* שורה\n  אחת\n<!-- הערה בין שדות -->$/m);
  const shared = known.find((b) => b.title === 'משותף');
  assert.equal(shared.src.bullet.file, 'lists/shared.md');
  const r = await put(on, 'lists/shared.md', [{ line: 1, field: 'bullet', value: { title: 'משותף', text: 'טקסט מעודכן' } }]);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const c = await content(on);
  for (const id of ['a', 'b']) assert.equal(c.characters.find((x) => x.id === id).steps[0].known[0].text, 'טקסט מעודכן');
});

test('F24: bullet title may be cleared, bullet text may not', async () => {
  const b = stepOf(await content(on), 'lore').known.find((x) => x.title === 'חדש');
  assert.equal((await put(on, 'characters/a.md', [{ line: b.src.bullet.line, field: 'bullet', value: { title: '', text: 'x' } }])).status, 200);
  assert.match(read(on, 'characters/a.md'), /^- x$/m);
  const r = await put(on, 'characters/a.md', [{ line: b.src.bullet.line, field: 'bullet', value: { title: 'a', text: '  ' } }]);
  assert.equal(r.status, 400);
  assert.equal((await put(on, 'characters/a.md', [{ line: b.src.bullet.line, field: 'prompt', value: '' }])).status, 400);
});

// a fresh server per test below: they rewrite a's ### secret ("- סוד." at line 22).
async function withSecret(body) {
  const s = await start({ LORE_EDIT: '1' });
  const f = path.join(s.dir, 'characters/a.md');
  const old = fs.readFileSync(f, 'utf8');
  assert.ok(old.includes('\n- סוד.\n'));
  fs.writeFileSync(f, old.replace('\n- סוד.\n', `\n${body}`));
  return s;
}
const secretA = async (s) => stepOf(await content(s), 'lore').secret;

test('bullet: a prose item (lines, paragraphs) round-trips; its whole range is replaced', async () => {
  const s = await withSecret('- **ח** א\n  ב\n\n  ג\n- אחרי.\n');
  const [it] = await secretA(s);
  assert.equal(it.text, 'א\nב\n\nג');
  // the editor sends back what it showed, edited: paragraphs and line breaks keep their shape
  await saveTouching(s, 'characters/a.md', { line: it.src.bullet.line, field: 'bullet', value: { title: 'ח', text: 'א\nב2\n\n\nג\nד\n\nה' } }, 22, 25);
  assert.ok(read(s, 'characters/a.md').includes('\n- **ח** א\n  ב2\n\n  ג\n  ד\n\n  ה\n- אחרי.\n'));
  const after = await secretA(s);
  assert.deepEqual(after.map(({ title, text }) => ({ title, text })), [{ title: 'ח', text: 'א\nב2\n\nג\nד\n\nה' }, { title: undefined, text: 'אחרי.' }]);
  // a prose item edited down to one line leaves no stray paragraph behind
  await saveTouching(s, 'characters/a.md', { line: it.src.bullet.line, field: 'bullet', value: { title: 'ח', text: 'יחיד' } }, 22, 28);
  assert.deepEqual((await secretA(s)).map((x) => x.text), ['יחיד', 'אחרי.']);
});

test('bullet: a heading item edits its title; text may be added, and only a heading may have none (F24)', async () => {
  const s = await withSecret('- **כותרת**\n- סוד.\n');
  const [h, b] = await secretA(s);
  assert.equal(h.text, undefined);
  await saveTouching(s, 'characters/a.md', { line: h.src.bullet.line, field: 'bullet', value: { title: 'חדשה', text: '' } }, 22, 22);
  assert.ok(read(s, 'characters/a.md').includes('\n- **חדשה**\n- סוד.\n'));
  // a bullet with text cannot be emptied into a heading
  assert.equal((await put(s, 'characters/a.md', [{ line: b.src.bullet.line, field: 'bullet', value: { title: 'x', text: '' } }])).status, 400);
  // a heading needs its title
  assert.equal((await put(s, 'characters/a.md', [{ line: h.src.bullet.line, field: 'bullet', value: { title: '', text: ' ' } }])).status, 400);
  await saveTouching(s, 'characters/a.md', { line: h.src.bullet.line, field: 'bullet', value: { title: 'חדשה', text: 'גוף' } }, 22, 22);
  assert.equal((await secretA(s))[0].text, 'גוף');
});

test('bullet: an unindented image: line right below a bullet is the step image, and an edit keeps it', async () => {
  const img = 'image: מגן — https://example.org/shield.png';
  const s = await withSecret(`- **ח** א\n${img}\n- אחרי.\n`);
  const lore = stepOf(await content(s), 'lore');
  assert.deepEqual(lore.secretImage, { src: 'https://example.org/shield.png', alt: 'מגן' });
  assert.deepEqual(lore.secret.map((x) => x.text), ['א', 'אחרי.']);
  await saveTouching(s, 'characters/a.md', { line: lore.secret[0].src.bullet.line, field: 'bullet', value: { title: 'ח', text: 'ב\nג' } }, 22, 22);
  assert.ok(read(s, 'characters/a.md').includes(`\n- **ח** ב\n  ג\n${img}\n- אחרי.\n`));
  const after = stepOf(await content(s), 'lore');
  assert.deepEqual(after.secretImage, lore.secretImage);
  assert.deepEqual(after.secret.map((x) => x.text), ['ב\nג', 'אחרי.']);
});

test('bullet: an indented image: line under a bullet is item text for parser and editor alike', async () => {
  const s = await withSecret('- **ח** א\n  image: לא תמונה — https://example.org/x.png\n- אחרי.\n');
  const lore = stepOf(await content(s), 'lore');
  assert.equal(lore.secretImage, undefined);
  assert.equal(lore.secret[0].text, 'א\nimage: לא תמונה — https://example.org/x.png');
  // the editor's range is the whole item, the indented line included
  await saveTouching(s, 'characters/a.md', { line: lore.secret[0].src.bullet.line, field: 'bullet', value: { title: 'ח', text: 'יחיד' } }, 22, 23);
  assert.deepEqual(stepOf(await content(s), 'lore').secret.map((x) => x.text), ['יחיד', 'אחרי.']);
});

// Session One has no "lead:" key (that is Session Two), so an unindented "lead:" right below a bullet
// is that bullet's next line, for the parser and the editor's range alike.
test('bullet: an unindented lead: line right below a bullet is item text, and an edit replaces it', async () => {
  const s = await withSecret('- **ח** א\nlead: פתיח\n- אחרי.\n');
  const lore = stepOf(await content(s), 'lore');
  assert.equal(lore.secretLead, undefined);
  assert.equal(lore.secret[0].text, 'א\nlead: פתיח');
  await saveTouching(s, 'characters/a.md', { line: lore.secret[0].src.bullet.line, field: 'bullet', value: { title: 'ח', text: 'יחיד' } }, 22, 23);
  assert.deepEqual(stepOf(await content(s), 'lore').secret.map((x) => x.text), ['יחיד', 'אחרי.']);
});

test('option: label, subtitle, description in one request, one version', async () => {
  const o = stepOf(await content(on), 'pick').options[0];
  const v0 = (await content(on)).edit.files['characters/a.md'];
  const r = await put(on, 'characters/a.md', [
    { line: o.src.description.line, field: 'description', value: 'פסקה א\nעדיין א\n\nפסקה ב' },
    { line: o.src.label.line, field: 'label', value: 'Serpent' },
    { line: o.src.subtitle.line, field: 'subtitle', value: 'נחש חדש' },
  ]);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.notEqual(r.body.hash, v0);
  const n = stepOf(await content(on), 'pick').options[0];
  assert.equal(n.label, 'Serpent');
  assert.equal(n.emoji, '🐍');
  assert.equal(n.subtitle, 'נחש חדש');
  assert.equal(n.description, 'פסקה א עדיין א\n\nפסקה ב');
  assert.match(read(on, 'characters/a.md'), /### 🐍 Serpent\nid: snake\nsubtitle: נחש חדש\n\nפסקה א עדיין א\n\nפסקה ב\n\n### Plain/);
});

test('term: name, en, aliases, blurb; only the field lines change', async () => {
  const v = (await content(on)).terms.veles;
  assert.deepEqual(Object.keys(v.src), ['name', 'en', 'aliases', 'blurb']);
  const r = await put(on, 'terms/gods.md', [
    { line: v.src.name.line, field: 'name', value: 'ולס השני' },
    { line: v.src.en.line, field: 'en', value: 'Veles II' },
    { line: v.src.aliases.line, field: 'aliases', value: 'א, ב' },
    { line: v.src.blurb.line, field: 'blurb', value: 'בלורב חדש.' },
  ]);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const n = (await content(on)).terms.veles;
  assert.equal(n.he, 'ולס השני');
  assert.equal(n.en, 'Veles II');
  assert.deepEqual(n.aliases, ['א', 'ב']);
  assert.equal(n.blurb, 'בלורב חדש.');
  const t = read(on, 'terms/gods.md');
  assert.match(t, /<!-- sources:/);
  assert.match(t, /image: https:\/\/example.org\/veles-2.png\nlink: Midgard/);
});

test('term: aliases "a,b" without a space saves', async () => {
  const v = (await content(on)).terms.veles;
  const r = await put(on, 'terms/gods.md', [{ line: v.src.aliases.line, field: 'aliases', value: 'א,ב' }]);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.deepEqual((await content(on)).terms.veles.aliases, ['א', 'ב']);
});

test('rejections: overlap, stale line, one-line, comment, structure, id change, stale hash', async () => {
  const c = await content(on);
  const o = stepOf(c, 'pick').options[0];
  const file = 'characters/a.md';
  const before = read(on, file);
  const bad = async (edits, status, hash) => {
    const r = await put(on, file, edits, hash);
    assert.ok([].concat(status).includes(r.status), JSON.stringify(r.body));
    assert.equal(read(on, file), before);
    return r.body;
  };
  await bad([{ line: o.src.description.line, field: 'description', value: 'a' }, { line: o.src.description.line + 1, field: 'description', value: 'b' }], 400); // overlap (range runs to the last paragraph line)
  await bad([{ line: 9999, field: 'prompt', value: 'x' }], 400); // stale line
  await bad([{ line: o.src.label.line, field: 'prompt', value: 'x' }], 400); // line is not that field
  await bad([{ line: o.src.subtitle.line, field: 'subtitle', value: 'a\nb' }], 400); // A19
  await bad([{ line: o.src.subtitle.line, field: 'subtitle', value: '' }], 400); // A22
  const withComment = stepOf(c, 'lore').known.find((b) => b.text === 'טקסט');
  await bad([{ line: withComment.src.bullet.line, field: 'bullet', value: { title: 'מוער', text: 'y' } }], 400); // A21
  await bad([{ line: o.src.description.line, field: 'description', value: 'id: x' }], [400, 422]); // F22
  await bad([{ line: o.src.description.line, field: 'description', value: 'פסקה\n\n### כותרת' }], [400, 422]); // F22
  await bad([{ line: stepOf(c, 'lore').known.at(-1).src.bullet.line, field: 'bullet', value: { title: '', text: '**x** y' } }], [400, 422]); // F22
  await bad([{ line: stepOf(c, 'pick').options[1].src.label.line, field: 'label', value: '🔥 Fire' }], [400, 422]); // F22: emoji-only first word
  const plain = stepOf(c, 'pick').options[1]; // no id: line, so its id comes from the label
  const r = await bad([{ line: plain.src.label.line, field: 'label', value: 'Other' }], 400); // F18
  assert.match(r.error, /id: plain/);
  await bad([{ line: o.src.label.line, field: 'label', value: 'X' }], 409, 'stale'); // stale hash
});
