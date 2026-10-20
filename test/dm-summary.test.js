// DM summary (/session-two/<code>/dm/summary). The page reads five routes with the DM key and
// builds its Markdown with /shared/dm-summary.js. Checks: without the key (none, or a wrong one) no
// route hands out player answers or secrets, even where the status is 200; with the key, the
// Markdown holds Session Zero, One and Two, the secrets, and no [[markup]]. Real content, temp DATA_DIR.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTerms, plainText } from '../public/shared/terms.js';
import { buildSummary, toMarkdown, NO_ANSWERS } from '../public/shared/dm-summary.js';

const SERVER = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'server.js');
let child;
after(() => child?.kill());

function start() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-summary-'));
  const clean = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('RAILWAY_') && !['LORE_EDIT', 'S1_CONTENT_DIR', 'S2_CONTENT_DIR'].includes(k)));
  const port = 47000 + Math.floor(Math.random() * 2000);
  child = spawn('node', [SERVER], { env: { ...clean, PORT: String(port), DATA_DIR: path.join(tmp, 'data') } });
  return new Promise((resolve, reject) => {
    child.stdout.on('data', async (d) => {
      if (!/listening on :\d+/.test(String(d))) return;
      const base = `http://127.0.0.1:${port}`;
      const made = await (await fetch(`${base}/api/sz/sessions`, { method: 'POST', body: JSON.stringify({ title: 'בדיקה' }) })).json();
      resolve({ base, code: made.code, key: made.adminKey });
    });
    child.on('exit', () => reject(new Error('server exited')));
  });
}

test('summary routes: no answers or secrets without the DM key; all three sessions with it', async () => {
  const g = await start();
  const get = async (p) => (await fetch(`${g.base}${p}`)).json();
  const put = (p, body) => fetch(`${g.base}${p}`, { method: 'PUT', body: JSON.stringify(body) });

  // Seed: player A did Session Zero and Session One as Turator; player B did Session Two as Turator.
  // Answer ids come from the real content, so a content change cannot make the check vacuous.
  const s1c = await get(`/api/s1/content?code=${g.code}&key=${g.key}`);
  const t1 = s1c.characters.find((c) => c.id === 'turator');
  const god = t1.steps.find((s) => s.id === 'god');
  const why = t1.steps.find((s) => s.id === 'why');
  await put(`/api/sz/sessions/${g.code}/responses/A`, { name: 'אביב', answers: { tone: ['heroic'], notes: 'הערה פרטית' }, done: true });
  await put(`/api/s1/${g.code}/me/A`, { name: 'אביב', character: 'turator', choice: 'keep', answers: { god: god.options[0].id, why: 'כי ככה' }, done: true });
  const s2c = await get(`/api/s2/content?code=${g.code}&key=${g.key}`);
  const t2 = s2c.characters.find((c) => c.id === 'turator');
  const sub = t2.steps.find((s) => s.id === 'subclass');
  await put(`/api/s2/${g.code}/me/B`, { character: 'turator', answers: { subclass: sub.options[1].id } });

  for (const key of ['', 'wrong-key']) {
    const q = key ? `key=${key}` : '';
    const s0 = await get(`/api/sz/sessions/${g.code}/results?${q}`);
    assert.equal(s0.isAdmin, false);
    assert.equal(s0.detail, undefined, `Session Zero detail for key "${key}"`);
    assert.ok(!JSON.stringify(s0).includes('הערה פרטית'), 'private notes stay out of the public results');
    const s1 = await get(`/api/s1/${g.code}?${q}`);
    assert.equal(s1.isAdmin, false);
    assert.equal(s1.players, undefined, `Session One players for key "${key}"`);
    const s2 = await get(`/api/s2/${g.code}?${q}`);
    assert.equal(s2.isAdmin, false);
    assert.equal(s2.players, undefined, `Session Two players for key "${key}"`);
    const lore1 = (await get(`/api/s1/content?code=${g.code}&${q}`)).characters.find((c) => c.id === 'turator').steps.find((s) => s.id === 'lore');
    assert.equal(lore1.secret, undefined, `Session One secret for key "${key}"`);
    const vision = (await get(`/api/s2/content?code=${g.code}&${q}`)).characters.find((c) => c.id === 'turator').steps.find((s) => s.id === 'vision');
    assert.equal(vision.secret, undefined, `Session Two secret for key "${key}"`);
  }

  // The DM: the same five reads the page makes, through the page's builder.
  const s2 = await get(`/api/s2/${g.code}?key=${g.key}`);
  const s1 = await get(`/api/s1/${g.code}?key=${g.key}`);
  const s0 = await get(`/api/sz/sessions/${g.code}/results?key=${g.key}`);
  assert.equal(s2.isAdmin, true);
  setTerms(s2c.terms);
  const sum = buildSummary({
    title: s2.title,
    s0: s0.detail,
    s1: { characters: s1c.characters, players: s1.players },
    s2: { characters: s2c.characters, players: s2.players },
  });
  const md = toMarkdown(sum);

  assert.deepEqual(sum.characters.map((c) => c.id), ['turator'], 'only held characters');
  assert.match(md, /^# בדיקה: סיכום תשובות ל-DM/);
  assert.match(md, /## סשן אפס/);
  assert.match(md, /### אביב/);
  assert.match(md, /- הערות: הערה פרטית/);
  assert.match(md, new RegExp(`## ${t2.name} \\(${t2.cls}\\)`));
  assert.match(md, /### סשן ראשון \(שחקן\/ית: אביב\)/);
  assert.ok(md.includes(`- ${plainText(god.title || god.prompt)}: ${plainText(god.options[0].label)}`), 'Session One choice, labelled');
  assert.ok(md.includes(`- ${plainText(why.title || why.prompt)}: כי ככה`), 'Session One free text');
  assert.match(md, /### סשן שני \(באמצע\)/);
  assert.ok(md.includes(`- ${plainText(sub.title || sub.prompt)}: ${plainText(sub.options[1].label)}`), 'Session Two choice, labelled');
  assert.ok(md.includes(`> 🔒 סוד: ${plainText(t1.steps.find((s) => s.id === 'lore').title)}`), 'Session One secret');
  assert.ok(md.includes(`> 🔒 סוד: ${plainText(t2.steps.find((s) => s.id === 'vision').title)}`), 'Session Two secret');
  assert.ok(md.includes(plainText(t2.steps.find((s) => s.id === 'vision').secretLead)), 'secret lead-in');
  assert.ok(!md.includes('[['), 'no term markup left');
});

test('a held character with no answers in a session says so', () => {
  setTerms({});
  const c = { id: 'x', name: 'איקס', cls: 'לוחם', steps: [{ id: 'q', type: 'text', title: 'שאלה' }] };
  const sum = buildSummary({
    title: 't',
    s0: [],
    s1: { characters: [c], players: [] },
    s2: { characters: [c], players: [{ id: 'B', character: 'x', answers: {}, carried: null }] },
  });
  const md = toMarkdown(sum);
  const [one, two] = sum.characters[0].sessions;
  assert.equal(one.empty, true);
  assert.equal(two.empty, true);
  assert.ok(md.includes(`### סשן ראשון\n\n${NO_ANSWERS}`));
  assert.ok(md.includes(`### סשן שני\n\n${NO_ANSWERS}`));
  assert.ok(md.includes(`## סשן אפס (לפי שחקן/ית)\n\n${NO_ANSWERS}`));
});
