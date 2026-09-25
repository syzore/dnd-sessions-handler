import { icon } from '/shared/icons.js';
import { esc, api, store, adminKey, rememberAdminKey } from '/shared/lib.js';
import { ANCHOR_TYPES, ENVIRONMENTS, KINDS } from './content.js';
import { roll, pickAnchors } from './engine.js';
import { LIB, libFor, libLabel } from './tags.js';

const $app = document.getElementById('app');
const MODES = [
  { id: 'random', label: 'אקראי', icon: 'dice' },
  { id: 'mixed', label: 'מעורב', icon: 'scales' },
  { id: 'anchors', label: 'קשור לעוגנים', icon: 'anchor' },
];
const kindOf = (id) => KINDS.find((k) => k.id === id);
const typeOf = (id) => ANCHOR_TYPES.find((t) => t.id === id);

const st = {
  code: null,
  key: null,
  title: '',
  anchors: [],
  saved: [],
  ai: [], // available providers: 'claude' | 'gemini'
  provider: store.get('tables:provider'),
  focus: new Set(),
  mode: store.get('tables:mode') || 'mixed',
  env: store.get('tables:env') || null,
  useAi: false,
  feed: [],
  editing: null, // null | {id?, type, name, note}
};

const PROVIDER_NAMES = { claude: 'Claude', gemini: 'Gemini' };
const providerName = (p) => PROVIDER_NAMES[p] || 'AI';
const activeProvider = () => (st.ai.includes(st.provider) ? st.provider : st.ai[0]);
const q = () => `key=${encodeURIComponent(st.key)}`;
const newId = () => (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 12);
let uid = 0;

// ---------------------------------------------------------------- boot
function renderCreate() {
  $app.innerHTML = `
    <main class="wrap center">
      <div class="hero-icon">${icon('dice')}</div>
      <h1 class="q-title">שולחנות אקראיים</h1>
      <p class="lead">שלל, מפגשים, דמויות ושמועות בלחיצה, כולל כאלה שקשורות לדמויות ולמקומות של הקמפיין שלך. יש כבר קבוצה? פתחו את הכלי מתוכה עם קישור ה-DM.</p>
      <label class="field">
        <span>איך נקרא לקבוצה?</span>
        <input id="title" maxlength="60" autocomplete="off">
      </label>
      <button class="cta" id="create">${icon('dice')}<span>יוצרים קבוצה</span></button>
      <p class="err" id="err"></p>
    </main>`;
  const btn = document.getElementById('create');
  btn.onclick = async () => {
    btn.disabled = true;
    try {
      const { code, adminKey: key } = await api('POST', '/api/sz/sessions', { title: document.getElementById('title').value });
      rememberAdminKey(code, key);
      location.href = `/tables/${code}`;
    } catch (e) {
      document.getElementById('err').textContent = e.message;
      btn.disabled = false;
    }
  };
}

async function start(code) {
  st.code = code;
  st.key = adminKey(code);
  if (st.key) history.replaceState(null, '', `/tables/${code}`); // keep the key out of the address bar
  $app.innerHTML = '<main class="wrap center"><div class="spinner"></div></main>';
  try {
    if (!st.key) throw new Error('רק ה-DM');
    const d = await api('GET', `/api/tables/${code}?${q()}`);
    Object.assign(st, { title: d.title, anchors: d.anchors, saved: d.saved, ai: d.ai });
  } catch (e) {
    $app.innerHTML = `
      <main class="wrap center">
        <div class="hero-icon">${icon('lock')}</div>
        <h1 class="q-title">רק ל-DM</h1>
        <p class="lead">${e.message === 'רק ה-DM' ? 'הכלי הזה נפתח רק מקישור ה-DM של הקבוצה.' : esc(e.message)}</p>
      </main>`;
    return;
  }
  st.feed = store.get(`tables:feed:${code}`) || [];
  paint();
}

// ---------------------------------------------------------------- rolling
function persistFeed() {
  store.set(`tables:feed:${st.code}`, st.feed.filter((r) => !r.loading).slice(0, 30));
}

function settings() {
  return { anchors: st.anchors, focus: st.focus, mode: st.mode, env: st.env };
}

async function doRoll(kind, seed = null) {
  if (!st.useAi && !seed) {
    st.feed.unshift({ id: ++uid, ...roll(kind, settings()) });
    persistFeed();
    return paintFeed();
  }
  const placeholder = { id: ++uid, kind, loading: true };
  st.feed.unshift(placeholder);
  paintFeed();
  const chosen = seed
    ? st.anchors.filter((a) => seed.anchors?.includes(a.name))
    : pickAnchors(st.anchors, { focus: st.focus, mode: st.mode });
  try {
    const r = await api('POST', `/api/tables/${st.code}/ai?${q()}`, {
      kind,
      env: st.env,
      focus: chosen.map((a) => a.id),
      provider: activeProvider(),
      seed: seed ? [seed.title, ...seed.lines].join('\n') : null,
    });
    Object.assign(placeholder, { loading: false, title: r.title, lines: r.lines, anchors: r.anchors, source: 'ai', provider: r.provider });
  } catch (e) {
    Object.assign(placeholder, { loading: false, error: e.message });
  }
  persistFeed();
  paintFeed();
}

async function saveResult(r) {
  const { item } = await api('POST', `/api/tables/${st.code}/saved?${q()}`, r);
  st.saved.unshift(item);
  r.savedId = item.id;
  persistFeed();
  paintFeed();
  paintSaved();
}

async function saveAnchors(anchors) {
  const d = await api('PUT', `/api/tables/${st.code}/anchors?${q()}`, { anchors });
  st.anchors = d.anchors;
  for (const id of st.focus) if (!st.anchors.some((a) => a.id === id)) st.focus.delete(id);
}

// ---------------------------------------------------------------- paint
function paint() {
  $app.innerHTML = `
    <main class="wrap tables">
      <div class="kicker">${esc(st.title)}</div>
      <h1 class="q-title">שולחנות אקראיים</h1>

      <section class="card anchors" id="anchors"></section>

      <div class="controls">
        <div class="seg" id="modes">${MODES.map((m) => `<button data-mode="${m.id}" class="${st.mode === m.id ? 'on' : ''}">${icon(m.icon)}<span>${m.label}</span></button>`).join('')}</div>
        <div class="seg small" id="envs">
          <span class="seg-label">סביבה למפגשים:</span>
          <button data-env="" class="${!st.env ? 'on' : ''}">כל מקום</button>
          ${ENVIRONMENTS.map((e) => `<button data-env="${e.id}" class="${st.env === e.id ? 'on' : ''}">${e.label}</button>`).join('')}
        </div>
        <div class="ai-row">
          <button class="ai-toggle ${st.useAi ? 'on' : ''}" id="ai" ${st.ai.length ? '' : 'disabled'}>
            ${icon('sparkles')}<span>${st.ai.length ? (st.useAi ? `${providerName(activeProvider())} כותב את ההגרלות` : 'הגרלה רגילה מהטבלאות') : 'AI לא מחובר'}</span>
          </button>
          ${st.ai.length > 1 ? `<div class="seg small" id="providers">${st.ai.map((p) => `<button data-provider="${p}" class="${activeProvider() === p ? 'on' : ''}">${providerName(p)}</button>`).join('')}</div>` : ''}
        </div>
      </div>

      <div class="gen">${KINDS.map((k) => `<button class="gen-btn" data-kind="${k.id}">${icon(k.icon)}<span>${k.label}</span></button>`).join('')}</div>

      <div class="feed" id="feed"></div>

      <details class="card saved" id="saved" data-k="saved"></details>

      <div class="footer stack">
        <a class="cta ghost" href="/schedule/${st.code}">${icon('calendar')}<span>מתי משחקים?</span></a>
        <a class="cta ghost" href="/session-zero/${st.code}/results">${icon('scroll')}<span>החוזה הקבוצתי</span></a>
      </div>
    </main>`;

  $app.querySelectorAll('[data-mode]').forEach(
    (b) =>
      (b.onclick = () => {
        st.mode = b.dataset.mode;
        store.set('tables:mode', st.mode);
        $app.querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('on', x === b));
      })
  );
  $app.querySelectorAll('[data-env]').forEach(
    (b) =>
      (b.onclick = () => {
        st.env = b.dataset.env || null;
        store.set('tables:env', st.env);
        $app.querySelectorAll('[data-env]').forEach((x) => x.classList.toggle('on', x === b));
      })
  );
  document.getElementById('ai').onclick = () => {
    st.useAi = !st.useAi;
    paint();
  };
  $app.querySelectorAll('[data-provider]').forEach(
    (b) =>
      (b.onclick = () => {
        st.provider = b.dataset.provider;
        store.set('tables:provider', st.provider);
        paint();
      })
  );
  $app.querySelectorAll('[data-kind]').forEach((b) => (b.onclick = () => doRoll(b.dataset.kind)));

  paintAnchors();
  paintFeed();
  paintSaved();
}

function paintAnchors() {
  const el = document.getElementById('anchors');
  const byType = ANCHOR_TYPES.map((t) => ({ t, list: st.anchors.filter((a) => a.type === t.id) })).filter((g) => g.list.length);
  el.innerHTML = `
    <header class="anchors-head">
      <h2>${icon('anchor')} העוגנים שלי <span class="muted">(${st.anchors.length})</span></h2>
      <button class="chip" id="add-anchor">${icon('plus')}<span>עוגן</span></button>
    </header>
    <p class="hint">מוטיבים (מקצועות, גזעים, רקעים, יצורים, נושאים) ושמות מהקמפיין. כל הגרלה בוחרת מהם באקראי, אפס או יותר, ובונה סביבם. הקישו על עוגן כדי לחייב אותו.</p>
    ${st.focus.size ? `<p class="hint focus-note">${icon('target')} ממוקד: ${st.anchors.filter((a) => st.focus.has(a.id)).map((a) => esc(a.name)).join(', ')} <button class="linklike" id="clear-focus">ניקוי</button></p>` : ''}
    <div class="anchor-groups">
      ${byType
        .map(
          ({ t, list }) => `
        <div class="anchor-group">
          <span class="ag-label">${icon(t.icon)} ${t.label}</span>
          ${list
            .map(
              (a) => `<span class="anchor ${st.focus.has(a.id) ? 'on' : ''}">
                <button class="anchor-name" data-focus="${a.id}" title="${esc(a.note)}">${esc(a.name)}</button>
                <button class="anchor-edit" data-edit="${a.id}" aria-label="עריכה">${icon('pencil')}</button>
              </span>`
            )
            .join('')}
        </div>`
        )
        .join('')}
    </div>
    ${st.editing ? anchorForm() : ''}`;

  document.getElementById('add-anchor').onclick = () => {
    st.editing = { type: st.editing?.type || 'class', name: '', note: '' };
    paintAnchors();
    document.getElementById('a-name').focus();
  };
  const clear = document.getElementById('clear-focus');
  if (clear)
    clear.onclick = () => {
      st.focus.clear();
      paintAnchors();
    };
  el.querySelectorAll('[data-focus]').forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.focus;
        st.focus.has(id) ? st.focus.delete(id) : st.focus.add(id);
        paintAnchors();
      })
  );
  el.querySelectorAll('[data-edit]').forEach(
    (b) =>
      (b.onclick = () => {
        st.editing = { ...st.anchors.find((a) => a.id === b.dataset.edit) };
        paintAnchors();
        document.getElementById('a-name').focus();
      })
  );
  if (st.editing) wireAnchorForm();
}

function typeButtons(group, e) {
  return ANCHOR_TYPES.filter((t) => t.group === group)
    .map((t) => `<button class="type-btn ${e.type === t.id ? 'on' : ''}" data-type="${t.id}">${icon(t.icon)}<span>${t.label}</span></button>`)
    .join('');
}

function anchorForm() {
  const e = st.editing;
  const motif = typeOf(e.type).group === 'motif';
  const presets = motif && !e.id ? LIB.filter((x) => x.type === e.type) : [];
  const has = (x) => st.anchors.some((a) => a.type === x.type && libFor(a)?.id === x.id);
  return `
    <div class="anchor-form">
      <span class="form-label">מוטיבים: דברים שהקמפיין עוסק בהם</span>
      <div class="type-row">${typeButtons('motif', e)}</div>
      <span class="form-label">שמות מהקמפיין</span>
      <div class="type-row">${typeButtons('named', e)}</div>
      ${
        presets.length
          ? `<div class="presets">${presets.map((x) => `<button class="preset ${has(x) ? 'on' : ''}" data-preset="${x.id}">${has(x) ? icon('check') : icon('plus')}<span>${esc(libLabel(x))}</span></button>`).join('')}</div>
             <span class="form-label">או משהו משלכם:</span>`
          : ''
      }
      <input id="a-name" maxlength="60" placeholder="${motif ? 'למשל: ' + esc(typeOf(e.type).hint.split(',')[0]) + ' (אפשר זכר/נקבה: חובש/חובשת)' : 'שם (למשל: ' + esc(typeOf(e.type).hint.split(',')[0]) + ')'}" value="${esc(e.name)}">
      <textarea id="a-note" rows="2" maxlength="300" placeholder="כמה מילים עליו (לא חובה, עוזר ל-AI)">${esc(e.note)}</textarea>
      <div class="row">
        <button class="cta" id="a-save">${icon('check')}<span>${e.id ? 'לשמור' : 'להוסיף'}</span></button>
        <button class="cta ghost" id="a-cancel"><span>ביטול</span></button>
        ${e.id ? `<button class="cta ghost danger" id="a-delete">${icon('trash')}<span>למחוק</span></button>` : ''}
      </div>
    </div>`;
}

function wireAnchorForm() {
  const e = st.editing;
  const name = document.getElementById('a-name');
  const note = document.getElementById('a-note');
  name.oninput = () => (e.name = name.value);
  note.oninput = () => (e.note = note.value);
  $app.querySelectorAll('[data-type]').forEach(
    (b) =>
      (b.onclick = () => {
        e.type = b.dataset.type;
        paintAnchors();
        document.getElementById('a-name').focus();
      })
  );
  $app.querySelectorAll('[data-preset]').forEach(
    (b) =>
      (b.onclick = async () => {
        const x = LIB.find((l) => l.id === b.dataset.preset);
        const existing = st.anchors.find((a) => a.type === x.type && libFor(a)?.id === x.id);
        await saveAnchors(
          existing
            ? st.anchors.filter((a) => a !== existing)
            : [...st.anchors, { id: newId(), type: x.type, name: libLabel(x), lib: x.id, note: '' }]
        );
        paintAnchors();
      })
  );
  const submit = async () => {
    if (!e.name.trim()) return name.focus();
    // "paladin" / "פלדינית" -> the library's פלדין, so the rich fragments kick in
    const lib = typeOf(e.type).group === 'motif' ? libFor({ type: e.type, name: e.name }) : null;
    const clean = lib ? { ...e, lib: lib.id, name: libLabel(lib) } : { ...e, lib: undefined };
    const next = e.id ? st.anchors.map((a) => (a.id === e.id ? clean : a)) : [...st.anchors, { ...clean, id: newId() }];
    await saveAnchors(next);
    // Stay in "add" mode with the same type so a list of names goes in quickly
    st.editing = e.id ? null : { type: e.type, name: '', note: '' };
    paintAnchors();
    document.getElementById('a-name')?.focus();
  };
  name.onkeydown = (ev) => ev.key === 'Enter' && submit();
  document.getElementById('a-save').onclick = submit;
  document.getElementById('a-cancel').onclick = () => {
    st.editing = null;
    paintAnchors();
  };
  const del = document.getElementById('a-delete');
  if (del)
    del.onclick = async () => {
      await saveAnchors(st.anchors.filter((a) => a.id !== e.id));
      st.editing = null;
      paintAnchors();
    };
}

function resultCard(r, { inFeed = true } = {}) {
  const k = kindOf(r.kind) || { icon: 'dice', label: '' };
  if (r.loading)
    return `<article class="result loading"><div class="spinner small"></div><span>${providerName(activeProvider())} כותב ${k.label}…</span></article>`;
  if (r.error)
    return `<article class="result error">${icon('x')}<span>${esc(r.error)}</span></article>`;
  return `
    <article class="result ${r.source === 'ai' ? 'ai' : ''}" data-id="${r.id}">
      <header>
        <span class="r-ic">${icon(k.icon)}</span>
        <h3>${esc(r.title)}</h3>
        ${r.source === 'ai' ? `<span class="badge gold">${icon('sparkles')} ${providerName(r.provider)}</span>` : ''}
      </header>
      <ul>${r.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
      ${r.anchors?.length ? `<div class="r-anchors">${r.anchors.map((a) => `<span>${icon('anchor')} ${esc(a)}</span>`).join('')}</div>` : ''}
      <div class="r-actions">
        ${
          inFeed
            ? `<button class="chip" data-again="${r.kind}">${icon('dice')}<span>עוד אחד</span></button>
               ${st.ai.length && r.source !== 'ai' ? `<button class="chip" data-enrich="${r.id}">${icon('sparkles')}<span>להעשיר</span></button>` : ''}
               ${r.savedId ? `<span class="chip done">${icon('check')}<span>נשמר</span></span>` : `<button class="chip" data-save="${r.id}">${icon('pin')}<span>לשמור</span></button>`}`
            : `<button class="chip" data-del="${r.id}">${icon('trash')}<span>למחוק</span></button>`
        }
      </div>
    </article>`;
}

function paintFeed() {
  const el = document.getElementById('feed');
  el.innerHTML = st.feed.length
    ? `<div class="feed-head"><h2 class="sec">${icon('dice')} הגרלות</h2><button class="linklike" id="clear-feed">ניקוי</button></div>` +
      st.feed.map((r) => resultCard(r)).join('')
    : `<p class="hint empty-feed">בחרו טבלה למעלה כדי להגריל.</p>`;
  const clear = document.getElementById('clear-feed');
  if (clear)
    clear.onclick = () => {
      st.feed = st.feed.filter((r) => r.loading);
      persistFeed();
      paintFeed();
    };
  const find = (id) => st.feed.find((r) => String(r.id) === id);
  el.querySelectorAll('[data-again]').forEach((b) => (b.onclick = () => doRoll(b.dataset.again)));
  el.querySelectorAll('[data-enrich]').forEach(
    (b) =>
      (b.onclick = () => {
        const r = find(b.dataset.enrich);
        doRoll(r.kind, r);
      })
  );
  el.querySelectorAll('[data-save]').forEach(
    (b) =>
      (b.onclick = () => {
        b.disabled = true;
        saveResult(find(b.dataset.save));
      })
  );
}

function paintSaved() {
  const el = document.getElementById('saved');
  const open = el.open;
  el.innerHTML = `
    <summary>${icon('pin')} שמורים <span class="muted">(${st.saved.length})</span></summary>
    ${st.saved.length ? st.saved.map((r) => resultCard(r, { inFeed: false })).join('') : '<p class="hint">עוד לא נשמר כלום. לחצו "לשמור" על הגרלה כדי שתישאר כאן.</p>'}`;
  el.open = open;
  el.querySelectorAll('[data-del]').forEach(
    (b) =>
      (b.onclick = async () => {
        await api('DELETE', `/api/tables/${st.code}/saved/${b.dataset.del}?${q()}`);
        st.saved = st.saved.filter((x) => x.id !== b.dataset.del);
        paintSaved();
      })
  );
}

// ---------------------------------------------------------------- boot
const parts = location.pathname.split('/').filter(Boolean);
if (parts.length === 1) renderCreate();
else start(parts[1].toUpperCase());
