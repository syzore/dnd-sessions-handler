// A tab left open across a deploy has old JS: the page and every API response carry the
// same build id, so the page can tell (public/shared/lib.js staleBuild).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { staleBuild } from '../public/shared/lib.js';

const SERVER = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'server.js');
const port = 43000 + Math.floor(Math.random() * 2000);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 's1-build-'));
const child = spawn('node', [SERVER], { env: { ...process.env, PORT: String(port), DATA_DIR: tmp } });
after(() => child.kill());
const up = new Promise((resolve) => child.stdout.on('data', (d) => /listening on/.test(String(d)) && resolve()));

test('the Session One page and its API responses carry the same build id', async () => {
  await up;
  const base = `http://127.0.0.1:${port}`;
  const html = await (await fetch(`${base}/session-one`)).text();
  const meta = /<meta name="build" content="([^"]*)">/.exec(html)?.[1];
  assert.match(meta, /^[0-9a-f]{12}$/);
  const r = await fetch(`${base}/api/s1/content?code=NOPE&pid=x`);
  assert.equal(r.headers.get('x-build'), meta);
});

test('staleBuild: differs only when both sides have an id', () => {
  assert.equal(staleBuild('aaa', 'bbb'), true);
  assert.equal(staleBuild('aaa', 'aaa'), false);
  assert.equal(staleBuild(undefined, 'bbb'), false);
  assert.equal(staleBuild('aaa', null), false);
});
