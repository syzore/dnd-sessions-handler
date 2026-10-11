// Helpers shared by every tool. Storage keys keep their original "sz:" prefix:
// the player id, name and DM keys are per group, not per tool.

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// A tab left open across a deploy keeps its old JS. The server stamps the page
// (<meta name="build">) and every API response (x-build) with the same id; when they differ
// this page's code is old. Pages without the meta tag opt out.
export const staleBuild = (page, server) => !!page && !!server && page !== server;

function offerReload() {
  if (typeof document === 'undefined' || document.getElementById('stale-build')) return;
  const bar = document.createElement('div');
  bar.id = 'stale-build';
  bar.setAttribute('role', 'status');
  bar.innerHTML = '<span>יצאה גרסה חדשה של הדף.</span><button type="button">לרענון</button>';
  bar.querySelector('button').onclick = () => location.reload();
  document.body.append(bar);
}

function checkBuild(r) {
  const page = typeof document === 'undefined' ? null : document.querySelector('meta[name="build"]')?.content;
  if (staleBuild(page, r.headers.get('x-build'))) offerReload();
}

export async function api(method, url, body) {
  const r = await fetch(url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  checkBuild(r);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'משהו השתבש'), { status: r.status, body: j });
  return j;
}

export const store = {
  get(k) {
    try {
      return JSON.parse(localStorage.getItem(k));
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};

// One id per browser: friends on the same wifi share an IP, so IP won't do
export function playerId() {
  let id = store.get('sz:pid');
  if (!id) {
    id = crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
    store.set('sz:pid', id);
  }
  return id;
}

export const savedName = () => store.get('sz:name') || '';
export const rememberName = (name) => store.set('sz:name', name);

// DM key: from ?key= (and remembered), or remembered from creating the group
export function adminKey(code) {
  const fromUrl = new URL(location.href).searchParams.get('key');
  if (fromUrl) store.set(`sz:admin:${code}`, fromUrl);
  return fromUrl || store.get(`sz:admin:${code}`);
}
export const rememberAdminKey = (code, key) => store.set(`sz:admin:${code}`, key);

// Share sheet on phones, clipboard elsewhere
export function copyButton(el, text) {
  if (typeof el === 'string') el = document.getElementById(el);
  el.onclick = async () => {
    if (navigator.share && /Mobi/.test(navigator.userAgent)) {
      try {
        return await navigator.share({ url: text });
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      el.classList.add('done');
      el.querySelector('span').textContent = 'הועתק!';
    } catch {}
  };
}
