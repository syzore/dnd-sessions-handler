// Offline URL checker: `npm run check-terms`. Run before a deploy; never part of a page request.
// Requests every term image:/link: URL and every step link: URL in content/session-one.
// Exit 1 if any URL fails. 403/429 that a browser-User-Agent GET also returns = "blocked", reported, not failing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const URL_RE = /https?:\/\/\S+/;

// Every { file, line, kind, url } in dir: terms/ image: + link:, other files link: (steps).
export function collectUrls(dir) {
  const out = [];
  const walk = (sub) => {
    for (const e of fs.readdirSync(path.join(dir, sub), { withFileTypes: true })) {
      const rel = path.join(sub, e.name);
      if (e.isDirectory()) walk(rel);
      else if (e.name.endsWith('.md') && rel !== 'README.md') scan(rel);
    }
  };
  const scan = (rel) => {
    const isTerm = rel.split(path.sep)[0] === 'terms';
    fs.readFileSync(path.join(dir, rel), 'utf8').split('\n').forEach((text, i) => {
      const m = /^(image|link):/.exec(text);
      if (!m || (m[1] === 'image' && !isTerm)) return;
      const url = URL_RE.exec(text)?.[0];
      if (url) out.push({ file: rel.split(path.sep).join('/'), line: i + 1, kind: isTerm ? `term ${m[1]}` : 'step link', url });
    });
  };
  walk('');
  return out;
}

async function request(url, method, headers, timeoutMs) {
  try {
    const res = await fetch(url, { method, headers, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
    res.body?.cancel().catch(() => {});
    return { status: res.status };
  } catch (e) {
    return { error: e.name === 'TimeoutError' ? 'timeout' : (e.cause?.code || e.message) };
  }
}

// -> { ok: true } | { ok: false, blocked: bool, status?, error? }
export async function checkUrl(url, { timeoutMs = 10000 } = {}) {
  let r = await request(url, 'HEAD', {}, timeoutMs);
  if (r.error || r.status >= 400) r = await request(url, 'GET', {}, timeoutMs); // HEAD refused -> GET
  if (r.status < 400) return { ok: true };
  if (r.status === 403 || r.status === 429) {
    const b = await request(url, 'GET', { 'User-Agent': BROWSER_UA, Accept: 'text/html,*/*' }, timeoutMs);
    if (b.status === r.status) return { ok: false, blocked: true, status: r.status };
    if (b.status < 400) return { ok: true };
    r = b;
  }
  return { ok: false, blocked: false, ...r };
}

export async function checkAll(dir, { concurrency = 6, timeoutMs } = {}) {
  const items = collectUrls(dir);
  const cache = new Map(); // one request per distinct URL
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      const { url } = items[i];
      if (!cache.has(url)) cache.set(url, checkUrl(url, { timeoutMs }));
      results[i] = { ...items[i], ...(await cache.get(url)) };
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

const label = (r) => (r.status ? `HTTP ${r.status}` : r.error);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'content', 'session-one');
  const results = await checkAll(dir);
  const blocked = results.filter((r) => !r.ok && r.blocked);
  const failed = results.filter((r) => !r.ok && !r.blocked);
  for (const r of blocked) console.log(`blocked  ${r.file}:${r.line}  ${r.kind}  ${label(r)}  ${r.url}`);
  for (const r of failed) console.log(`FAIL     ${r.file}:${r.line}  ${r.kind}  ${label(r)}  ${r.url}`);
  console.log(`${results.length} URLs checked, ${failed.length} failed, ${blocked.length} blocked (not counted as failed)`);
  process.exit(failed.length ? 1 : 0);
}
