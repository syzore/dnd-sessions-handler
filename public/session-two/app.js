// Session Two player page. Stub: shows the group title (ticket 04 builds the flow, ticket 05 the DM view).
const code = location.pathname.split('/')[2];
const app = document.getElementById('app');
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

async function main() {
  if (!code) {
    app.innerHTML = '<main class="wrap center"><h1 class="q-title">סשן שני</h1></main>';
    return;
  }
  const r = await fetch(`/api/s2/${encodeURIComponent(code)}`);
  const data = await r.json();
  app.innerHTML = `<main class="wrap center"><h1 class="q-title">${esc(r.ok ? data.title : data.error)}</h1></main>`;
}
main();
