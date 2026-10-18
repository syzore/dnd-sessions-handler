// Session Two DM compendium (/session-two/<code>/dm/lore): the access check only. The page reads
// /api/s2/content with the DM key; secrets (Grey's vision lead-in and image) must not leave the
// server for no key or a wrong key. Real content, temp DATA_DIR.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SERVER = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'server.js');
let child;
after(() => child?.kill());

function start() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 's2-lore-'));
  const clean = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('RAILWAY_') && !['LORE_EDIT', 'S1_CONTENT_DIR', 'S2_CONTENT_DIR'].includes(k)));
  const port = 45000 + Math.floor(Math.random() * 2000);
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

test('DM key gets the secrets and isAdmin; no key and a wrong key get neither', async () => {
  const g = await start();
  const content = async (key) => (await fetch(`${g.base}/api/s2/content?code=${g.code}${key ? `&key=${key}` : ''}`)).json();
  const vision = (c) => c.characters.find((x) => x.id === 'turator').steps.find((s) => s.id === 'vision');
  const isAdmin = async (key) => (await (await fetch(`${g.base}/api/s2/${g.code}${key ? `?key=${key}` : ''}`)).json()).isAdmin;

  const dm = vision(await content(g.key));
  assert.ok(dm.secret?.length && dm.secretLead && dm.secretImage, 'DM content carries the vision secret, lead and image');
  assert.equal(await isAdmin(g.key), true);

  for (const key of ['', 'wrong-key']) {
    const v = vision(await content(key));
    assert.equal(v.secret, undefined, `secret for key "${key}"`);
    assert.equal(v.secretLead, undefined);
    assert.equal(v.secretImage, undefined);
    assert.equal(await isAdmin(key), false);
  }
});
