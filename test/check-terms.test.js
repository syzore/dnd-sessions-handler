import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAll, collectUrls } from '../scripts/check-terms.js';

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'session-one', 'urls');

test('check-terms: reports a dead term image, term link and step link with file and line; blocked is not a failure', async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/ok') return res.end('ok');
    if (req.url === '/blocked') { res.statusCode = 403; return res.end('no'); }
    if (req.url === '/dead-link' && req.method === 'HEAD') { res.statusCode = 405; return res.end(); } // HEAD refused, GET 404
    res.statusCode = 404; res.end('gone');
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-terms-'));
  try {
    fs.mkdirSync(path.join(dir, 'terms'));
    const sub = (f) => fs.readFileSync(path.join(FIX, f), 'utf8').replaceAll('PORT', server.address().port);
    fs.writeFileSync(path.join(dir, 'terms', 't.md'), sub('terms/t.md'));
    fs.writeFileSync(path.join(dir, 'steps.md'), sub('steps.md'));
    const res = await checkAll(dir, { timeoutMs: 2000 });
    const failed = res.filter((r) => !r.ok && !r.blocked).map((r) => `${r.file}:${r.line} ${r.kind} ${r.status}`).sort();
    assert.deepEqual(failed, ['steps.md:5 step link 404', 'terms/t.md:11 term link 404', 'terms/t.md:7 term image 404', 'terms/t.md:8 term link 404']);
    assert.deepEqual(res.filter((r) => r.blocked).map((r) => r.url.split('/').pop()), ['blocked']);
    assert.equal(res.filter((r) => r.ok).length, 1);
  } finally {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('check-terms: Session Two content is scanned (term links in terms/, step links in characters/)', () => {
  const urls = collectUrls(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'content', 'session-two'));
  assert.ok(urls.some((u) => u.kind === 'term link' && u.file === 'terms/subclasses.md' && u.url.startsWith('https://dnd2024.wikidot.com/')));
  assert.ok(urls.some((u) => u.kind === 'step link' && u.file === 'characters/deq.md' && u.url === 'https://dnd2024.wikidot.com/barbarian:main'));
});

test('check-terms: several folders are checked together, each file prefixed with its folder name', async () => {
  const server = http.createServer((req, res) => { res.statusCode = req.url === '/ok' ? 200 : 404; res.end(); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-terms-'));
  try {
    for (const [d, p] of [['one', 'ok'], ['two', 'dead']]) {
      fs.mkdirSync(path.join(root, d));
      fs.writeFileSync(path.join(root, d, 'steps.md'), `## text: x\nlink: t — http://127.0.0.1:${server.address().port}/${p}\n`);
    }
    const res = await checkAll([path.join(root, 'one'), path.join(root, 'two')], { timeoutMs: 2000 });
    assert.deepEqual(res.map((r) => `${r.file}:${r.line} ${r.ok}`), ['one/steps.md:2 true', 'two/steps.md:2 false']);
  } finally {
    server.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
