import { icon } from '/shared/icons.js';
import { esc, api, playerId, savedName, adminKey, rememberAdminKey, copyButton } from '/shared/lib.js';
import { setTerms, allTerms, richText, plainText, optionLabel, addEnglishAll } from '/shared/terms.js';
import { initTermPopup, termInfoButton, stepLinkHtml, CATEGORY_LABELS } from '/shared/term-popup.js';

// Characters and lore come from the server (content/session-one/*.md, parsed per request).
let CHARACTERS = [];
let COMMON_LORE = null;
let EDIT = null; // { files: { key: hash } } when the server is in lore edit mode and the DM key matched
const character = (id) => CHARACTERS.find((c) => c.id === id);

const $app = document.getElementById('app');
const base = (code) => `/session-one/${code}`;

// Content text goes through richText (HTML) or plainText (attributes, labels):
// raw [[term]] markup never reaches the screen. Each screen then gets its first-mention English.
// A choice card whose option says `term:` gets an info button beside it, not inside the
// option <button> (D4). Player flow and DM compendium share the layout.
function withInfo(o, card) {
  const info = o.term ? termInfoButton(o.term) : '';
  return info ? `<div class="opt-wrap">${card}${info}</div>` : card;
}

function screen(html) {
  $app.innerHTML = html;
  addEnglishAll($app);
  window.scrollTo(0, 0);
}

const CHOICES = [
  { id: 'keep', icon: 'check', label: 'שומר/ת על הדמות' },
  { id: 'rename', icon: 'pencil', label: 'שומר/ת עליה, אבל משנה לה את השם' },
  { id: 'switch', icon: 'dice', label: 'לא מתחבר/ת אליה, אחליף אחרי שהפרולוג ייגמר' },
];

// The DM key gets every secret; a player gets only their own character's.
async function loadContent(code, key) {
  const q = new URLSearchParams({ code, pid: playerId() });
  if (key) q.set('key', key);
  let terms;
  let edit;
  ({ commonLore: COMMON_LORE, characters: CHARACTERS, terms, edit } = await api('GET', `/api/s1/content?${q}`));
  EDIT = edit || null;
  setTerms(terms);
}

// A broken content file: show the parser's message (file and line), not a blank page.
// In edit mode the 500 also names the file: link straight to the editor for it (F17).
function renderContentError(e, code) {
  const b = e.body || {};
  const fix = b.edit && b.file ? editLink(code, b.file, `פתיחת ${b.file} בעורך`, 'cta') : '';
  screen(`
    <main class="wrap center">
      <div class="hero-icon">${icon('question')}</div>
      <h1 class="q-title">בעיה בקובץ התוכן</h1>
      <p class="lead" dir="auto">${esc(e.message)}</p>
      ${fix}
    </main>`);
}

// ---------------------------------------------------------------- routing
async function route() {
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts.length === 1) return renderCreate();
  const code = parts[1].toUpperCase();
  const dm = parts[2] === 'dm';
  screen('<main class="wrap center"><div class="spinner"></div></main>');
  // The file editor must open even when the content is broken: it is how the DM fixes it.
  if (dm && parts[3] === 'lore' && parts[4] === 'file') return renderFileEditor(code);
  if (dm && parts[3] === 'lore' && parts[4] === 'new') return renderNewFile(code);
  try {
    await loadContent(code, dm ? adminKey(code) : null);
  } catch (e) {
    return renderContentError(e, code);
  }
  if (dm && parts[3] === 'lore') return renderLore(code);
  if (dm) return renderDm(code);
  return start(code);
}

// ---------------------------------------------------------------- create
function renderCreate() {
  screen(`
    <main class="wrap center">
      <div class="hero-icon">${icon('knight')}</div>
      <h1 class="q-title">סשן ראשון</h1>
      <p class="lead">כל שחקן בוחר דמות מוכנה ומכיר אותה. יש כבר סשן אפס? פתחו את סשן ראשון עם אותו קוד, וזו תהיה אותה קבוצה.</p>
      <label class="field">
        <span>איך נקרא לקבוצה?</span>
        <input id="title" maxlength="60" placeholder="למשל: החבר׳ה של יום חמישי" autocomplete="off">
      </label>
      <button class="cta" id="create">${icon('sword')}<span>יוצרים קבוצה</span></button>
      <p class="err" id="err"></p>
    </main>`);
  const btn = document.getElementById('create');
  btn.onclick = async () => {
    btn.disabled = true;
    try {
      const { code, adminKey: key } = await api('POST', '/api/sz/sessions', { title: document.getElementById('title').value });
      rememberAdminKey(code, key);
      renderCreated(code, key);
    } catch (e) {
      document.getElementById('err').textContent = e.message;
      btn.disabled = false;
    }
  };
}

function renderCreated(code, key) {
  const link = `${location.origin}${base(code)}`;
  const dmLink = `${link}/dm?key=${key}`;
  screen(`
    <main class="wrap center">
      <div class="hero-icon">${icon('flag')}</div>
      <h1 class="q-title">הקבוצה מוכנה</h1>
      <p class="lead">שלחו את הקישור לקבוצה:</p>
      <div class="linkbox">${esc(link)}</div>
      <button class="cta" id="share">${icon('link')}<span>העתקה / שיתוף</span></button>
      <div class="note">
        <strong>קישור ה-DM</strong>: שמרו אותו לעצמכם.
        <div class="linkbox small">${esc(dmLink)}</div>
        <button class="chip" id="copydm">${icon('copy')}<span>העתקה</span></button>
      </div>
    </main>`);
  copyButton('share', link);
  copyButton('copydm', dmLink);
}

function renderNotFound() {
  screen(`
    <main class="wrap center">
      <div class="hero-icon">${icon('question')}</div>
      <h1 class="q-title">הקבוצה לא נמצאה</h1>
      <p class="lead">כדאי לבדוק את הקישור.</p>
      <a class="cta" href="/session-one">${icon('sword')}<span>ליצור קבוצה חדשה</span></a>
    </main>`);
}

// ---------------------------------------------------------------- player flow
const state = { code: null, title: '', name: '', character: null, choice: null, newName: '', answers: {}, done: false, taken: {} };

async function load(code) {
  const s = await api('GET', `/api/s1/${code}?pid=${playerId()}`);
  const me = s.me || {};
  Object.assign(state, {
    code: s.code,
    title: s.title,
    taken: s.taken,
    name: me.name || s.name || savedName(),
    character: me.character || null,
    choice: me.choice || null,
    newName: me.newName || '',
    answers: me.answers || {},
    done: !!me.done,
  });
}

async function start(code) {
  screen('<main class="wrap center"><div class="spinner"></div></main>');
  try {
    await load(code);
  } catch {
    return renderNotFound();
  }
  if (state.done || state.choice === 'switch') renderEnd();
  else renderPick();
}

function save(extra = {}) {
  const { name, character: c, choice, newName, answers, done } = state;
  return api('PUT', `/api/s1/${state.code}/me/${playerId()}`, { name, character: c, choice, newName, answers, done, ...extra });
}

const shownName = () => (state.choice === 'rename' && state.newName) || character(state.character)?.name || '';

function topbar(i, n, back = true) {
  return `
    <header class="topbar">
      ${back ? `<button class="icon-btn" id="back" aria-label="חזרה">${icon('chevR')}</button>` : ''}
      ${n ? `<div class="progress"><div style="width:${Math.round(((i + 1) / n) * 100)}%"></div></div><div class="count">${i + 1}/${n}</div>` : ''}
    </header>`;
}

async function renderPick() {
  await load(state.code).catch(() => {}); // fresh "taken" list
  screen(`
    <main class="wrap q">
      <div class="kicker">${esc(state.title)} · סשן ראשון</div>
      <h1 class="q-title">איזו דמות תשחק/י?</h1>
      <div class="grid one">${CHARACTERS.map((c) => {
        const by = state.taken[c.id];
        return `
        <button class="opt ${state.character === c.id ? 'sel' : ''}" data-id="${c.id}" ${by != null ? 'disabled' : ''}>
          <span class="opt-ic">${icon(c.icon || 'd20')}</span>
          <span class="opt-text"><span class="opt-label">${esc(c.name)}</span><span class="opt-sub">${esc(c.cls)}${by != null ? ` · נלקחה${by ? ` (${esc(by)})` : ''}` : ''}</span></span>
          <span class="opt-check">${icon('check')}</span>
        </button>`;
      }).join('')}</div>
      <p class="err" id="err"></p>
    </main>`);
  $app.querySelectorAll('.opt').forEach((b) => {
    b.onclick = async () => {
      try {
        await save({ character: b.dataset.id });
        state.character = b.dataset.id;
        await loadContent(state.code).catch(() => {}); // this character's secrets
        renderChoice();
      } catch (e) {
        document.getElementById('err').textContent = e.message;
        renderPick();
      }
    };
  });
}

function renderChoice() {
  const c = character(state.character);
  screen(`
    ${topbar()}
    <main class="wrap q">
      <div class="kicker">${esc(c.name)} · ${esc(c.cls)}</div>
      <h1 class="q-title">מה דעתך על הדמות?</h1>
      <div class="grid one">${CHOICES.map((o) => `
        <button class="opt ${state.choice === o.id ? 'sel' : ''}" data-id="${o.id}">
          <span class="opt-ic">${icon(o.icon)}</span>
          <span class="opt-text"><span class="opt-label">${esc(o.label)}</span></span>
          <span class="opt-check">${icon('check')}</span>
        </button>`).join('')}</div>
      <input class="text-in ${state.choice === 'rename' ? '' : 'hidden'}" id="newName" maxlength="40" placeholder="השם החדש" value="${esc(state.newName)}">
      <div class="footer"><button class="cta" id="next" ${canGo() ? '' : 'disabled'}>${icon('chevL')}<span>המשך</span></button></div>
    </main>`);
  const input = document.getElementById('newName');
  const next = document.getElementById('next');
  document.getElementById('back').onclick = renderPick;
  $app.querySelectorAll('.opt').forEach((b) => {
    b.onclick = () => {
      state.choice = b.dataset.id;
      $app.querySelectorAll('.opt').forEach((x) => x.classList.toggle('sel', x === b));
      input.classList.toggle('hidden', state.choice !== 'rename');
      if (state.choice === 'rename') input.focus();
      next.disabled = !canGo();
    };
  });
  input.oninput = () => {
    state.newName = input.value.trim();
    next.disabled = !canGo();
  };
  next.onclick = () => {
    if (state.choice !== 'rename') state.newName = '';
    save().catch(() => {});
    renderCommon();
  };
}

const canGo = () => !!state.choice && (state.choice !== 'rename' || !!state.newName);

// An info step's known/secret sections (player flow and DM compendium).
// `pen` (lore view, edit mode only) turns an item into its pencil button, or '' for none.
const loreSection = (items, cls, heading, pen) =>
  items?.length
    ? `<section class="lore ${cls}"><h2 class="lore-h">${esc(heading)}</h2>${items.map((it) => {
        const pencil = pen ? pen(it) : '';
        return `
        <div class="lore-item${pencil ? ' ed-host' : ''}">${it.title ? `<h3 class="lore-t">${richText(it.title)}</h3>` : ''}<p>${richText(it.text)}</p>${pencil}</div>`;
      }).join('')}</section>`
    : '';
const loreHtml = (st, secretHeading = '🤫 מה רק אתה יודע', pen) =>
  `<div class="lore-wrap">${loreSection(st.known, 'lore-known', 'מה כולם יודעים', pen)}${loreSection(st.secret, 'lore-secret', secretHeading, pen)}</div>`;

// Shared world lore, shown to every player after the keep/rename/switch choice.
function renderCommon() {
  const c = character(state.character);
  screen(`
    ${topbar()}
    <main class="wrap q">
      <div class="kicker">${esc(shownName())} · ${esc(c.cls)}</div>
      <h1 class="q-title">${richText(COMMON_LORE.title)}</h1>
      ${COMMON_LORE.prompt ? `<p class="lead step-intro">${richText(COMMON_LORE.prompt)}</p>` : ''}
      ${loreHtml(COMMON_LORE)}
      <div class="footer"><button class="cta" id="next">${icon('chevL')}<span>המשך</span></button></div>
    </main>`);
  document.getElementById('back').onclick = renderChoice;
  document.getElementById('next').onclick = () => {
    if (state.choice !== 'switch') return renderStep(0);
    state.done = true; // a switch player has nothing more to answer; the DM sees them as done
    save().catch(() => {});
    renderEnd();
  };
}

function renderStep(i) {
  const c = character(state.character);
  const steps = c.steps || [];
  if (i >= steps.length) {
    state.done = true;
    save().catch(() => {});
    return renderEnd();
  }
  const st = steps[i];
  const cur = state.answers[st.id];
  const otherKey = `${st.id}_other`;
  const isChoice = st.type === 'choice';
  const cards = isChoice && st.options.some((o) => o.description);
  const withOther = isChoice && st.other !== false;
  const picked = (id) => (Array.isArray(cur) ? cur.includes(id) : cur === id);
  const body =
    st.type === 'info'
      ? loreHtml(st)
      : st.type === 'choice'
      ? `<div class="grid ${cards ? 'one cards' : ''}">${st.options.map((o) => withInfo(o, `
          <button class="opt ${cards ? 'opt-card' : ''} ${picked(o.id) ? 'sel' : ''}" data-id="${o.id}" aria-pressed="${picked(o.id)}">
            ${o.emoji ? `<span class="opt-emoji" aria-hidden="true">${esc(o.emoji)}</span>` : ''}
            <span class="opt-text">
              <span class="opt-label">${optionLabel(o)}</span>
              ${o.subtitle ? `<span class="opt-sub">${richText(o.subtitle, { inert: true })}</span>` : ''}
              ${o.description ? `<span class="opt-desc">${richText(o.description, { inert: true })}</span>` : ''}
            </span>
            <span class="opt-check">${icon('check')}</span>
          </button>`)).join('')}</div>${withOther ? `
        <label class="other-box"><span>משהו אחר / לכתוב בעצמי</span>
          <textarea class="big-text" id="other" rows="3" maxlength="1000">${esc(state.answers[otherKey] || '')}</textarea></label>` : ''}`
      : `<textarea class="big-text" id="ans" rows="5" maxlength="2000">${esc(cur)}</textarea>`;
  const last = i === steps.length - 1;
  screen(`
    ${topbar(i, steps.length)}
    <main class="wrap q">
      <div class="kicker">${esc(shownName())} · ${esc(c.cls)}</div>
      <h1 class="q-title">${richText(st.title || st.prompt || '')}</h1>
      ${st.title && st.prompt ? `<p class="lead step-intro">${richText(st.prompt)}</p>` : ''}
      ${st.hint ? `<p class="hint">${richText(st.hint)}</p>` : ''}
      ${body}${stepLinkHtml(st.link)}
      <div class="footer ${st.optional ? 'stack' : ''}">
        <button class="cta" id="next">${icon(last ? 'flag' : 'chevL')}<span>${last ? 'סיום' : 'המשך'}</span></button>
        ${st.optional ? `<button class="cta ghost" id="skip"><span>דלג</span></button>` : ''}
      </div>
    </main>`);
  document.getElementById('back').onclick = () => (i === 0 ? renderCommon() : renderStep(i - 1));
  const next = document.getElementById('next');
  const answered = () => {
    const v = state.answers[st.id];
    return (Array.isArray(v) ? v.length > 0 : !!v) || !!state.answers[otherKey]?.trim();
  };
  const textEmpty = () => st.type === 'text' && !String(state.answers[st.id] || '').trim();
  const refresh = () => (next.disabled = !st.optional && (isChoice ? !answered() : textEmpty()));
  refresh();
  next.onclick = () => {
    save().catch(() => {});
    renderStep(i + 1);
  };
  if (st.optional) {
    document.getElementById('skip').onclick = () => {
      delete state.answers[st.id];
      delete state.answers[otherKey];
      save().catch(() => {});
      renderStep(i + 1);
    };
  }
  if (isChoice) {
    $app.querySelectorAll('.opt').forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.id;
        if (st.multi) {
          const prev = Array.isArray(state.answers[st.id]) ? state.answers[st.id] : state.answers[st.id] ? [state.answers[st.id]] : [];
          const nextPicks = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
          if (nextPicks.length) state.answers[st.id] = nextPicks;
          else delete state.answers[st.id];
          b.classList.toggle('sel', nextPicks.includes(id));
          b.setAttribute('aria-pressed', nextPicks.includes(id));
        } else {
          state.answers[st.id] = id;
          $app.querySelectorAll('.opt').forEach((x) => {
            x.classList.toggle('sel', x === b);
            x.setAttribute('aria-pressed', x === b);
          });
        }
        refresh();
      };
    });
    const other = document.getElementById('other');
    if (other) {
      other.oninput = (e) => {
        if (e.target.value.trim()) state.answers[otherKey] = e.target.value;
        else delete state.answers[otherKey];
        refresh();
      };
    }
  } else if (st.type === 'text') {
    document.getElementById('ans').oninput = (e) => {
      state.answers[st.id] = e.target.value;
      refresh();
    };
  }
}

function renderEnd() {
  const sw = state.choice === 'switch';
  screen(`
    <main class="wrap center">
      <div class="hero-icon">${icon(sw ? 'bubble' : 'flag')}</div>
      <h1 class="q-title">${sw ? 'אין בעיה!' : `${esc(shownName())} מוכן/ה`}</h1>
      <p class="lead">${
        sw
          ? 'דבר/י עם מנהל המשחק, הוא ישמח לעזור לך להתחיל לבנות ולחשוב על דמות חדשה לאחרי שהפרולוג ייגמר (או לפני, אם זה מתאים 😉).'
          : 'התשובות נשמרו. נתראה בסשן!'
      }</p>
      <button class="cta ghost" id="edit">${icon('pencil')}<span>לשנות</span></button>
    </main>`);
  document.getElementById('edit').onclick = () => {
    state.done = false;
    renderChoice();
  };
}

// ---------------------------------------------------------------- DM view
async function renderDm(code) {
  const key = adminKey(code);
  let data;
  try {
    data = await api('GET', `/api/s1/${code}${key ? `?key=${encodeURIComponent(key)}` : ''}`);
  } catch {
    return renderNotFound();
  }
  if (!data.isAdmin) {
    return screen(`<main class="wrap center"><div class="hero-icon">${icon('lock')}</div><h1 class="q-title">רק ל-DM</h1></main>`);
  }
  const choiceLabel = (id) => CHOICES.find((o) => o.id === id)?.label || '—';
  const label = (st, v) => plainText(st.options.find((o) => o.id === v)?.label || v);
  const answerText = (st, a) => {
    const v = a?.[st.id];
    if (st.type !== 'choice') return v;
    const picks = (Array.isArray(v) ? v : v ? [v] : []).map((x) => label(st, x)).join(', ');
    const other = a?.[`${st.id}_other`]?.trim();
    return [picks, other && `משהו אחר: ${other}`].filter(Boolean).join(' · ');
  };
  const rows = data.players
    .map((p) => {
      const c = character(p.character);
      const steps = (c?.steps || []).filter((s) => s.type !== 'info'); // info steps hold no answer
      const known = new Set(steps.flatMap((s) => [s.id, `${s.id}_other`]));
      const answers = [
        ...steps.map((st) => [plainText(st.title || st.prompt), answerText(st, p.answers)]),
        ...Object.entries(p.answers || {}).filter(([k]) => !known.has(k)), // answers to steps since removed
      ];
      return `
        <details class="card dm-player" open>
          <summary>${esc([p.name, c ? `${p.choice === 'rename' && p.newName ? p.newName : c.name} (${c.cls})` : 'עוד לא בחר/ה'].filter(Boolean).join(' · '))} ${!p.done ? '<span class="muted">(באמצע)</span>' : p.choice === 'switch' ? '<span class="muted">(יחליף דמות)</span>' : ''}</summary>
          <dl class="dm-dl">
            <div><dt>החלטה</dt><dd>${esc(choiceLabel(p.choice))}</dd></div>
            ${p.choice === 'rename' ? `<div><dt>שם חדש</dt><dd>${esc(p.newName) || '—'}</dd></div>` : ''}
            ${answers.map(([q, a]) => `<div><dt>${esc(q)}</dt><dd>${esc(Array.isArray(a) ? a.join(', ') : a) || '—'}</dd></div>`).join('')}
          </dl>
          <button class="cta ghost danger dm-del" data-pid="${esc(p.id)}">מחיקה</button>
        </details>`;
    })
    .join('');
  screen(`
    <main class="wrap results">
      <div class="kicker">${esc(data.title)}</div>
      <h1 class="q-title">סשן ראשון: מי משחק את מי</h1>
      <section class="dm">
        <h2>${icon('eye')} רק ל-DM</h2>
        ${rows || '<p class="muted">עוד אין שחקנים</p>'}
      </section>
      <div class="footer stack">
        <a class="cta ghost" href="${base(code)}/dm/lore?key=${encodeURIComponent(key)}">${icon('eye')}<span>כל הלור והבחירות</span></a>
        <button class="cta ghost" id="share">${icon('link')}<span>לשתף עם השחקנים</span></button>
      </div>
    </main>`);
  copyButton('share', `${location.origin}${base(code)}`);
  // Delete: first tap arms ("בטוח?"), second tap deletes; disarms after 4s or on a tap elsewhere.
  let armed = null;
  const disarm = () => {
    if (!armed) return;
    armed.btn.textContent = 'מחיקה';
    clearTimeout(armed.timer);
    armed = null;
  };
  document.querySelectorAll('.dm-del').forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (armed?.btn === btn) {
        await api('DELETE', `/api/s1/${code}/players/${encodeURIComponent(btn.dataset.pid)}?key=${encodeURIComponent(key)}`);
        return renderDm(code);
      }
      disarm();
      btn.textContent = 'בטוח?';
      armed = { btn, timer: setTimeout(disarm, 4000) };
    };
  });
  document.addEventListener('click', disarm, { once: true });
}

// ---------------------------------------------------------------- DM lore compendium
// Read-only: all of content/session-one, secrets included. Same key check as
// the DM view: the server only answers isAdmin (and sends every secret) for the right key.
async function renderLore(code) {
  const key = adminKey(code);
  let data;
  try {
    data = await api('GET', `/api/s1/${code}${key ? `?key=${encodeURIComponent(key)}` : ''}`);
  } catch {
    return renderNotFound();
  }
  if (!data.isAdmin) {
    return screen(`<main class="wrap center"><div class="hero-icon">${icon('lock')}</div><h1 class="q-title">רק ל-DM</h1></main>`);
  }
  EDITS.length = 0;
  const optCard = (o) => withInfo(o, `
    <div class="opt opt-card">
      ${o.emoji ? `<span class="opt-emoji" aria-hidden="true">${esc(o.emoji)}</span>` : ''}
      <span class="opt-text">
        <span class="opt-label">${optionLabel(o)}</span>
        ${o.subtitle ? `<span class="opt-sub">${richText(o.subtitle, { inert: true })}</span>` : ''}
        ${o.description ? `<span class="opt-desc">${richText(o.description, { inert: true })}</span>` : ''}
      </span>
    </div>`);
  const card = (o) => {
    const pencil = editPencil(o.label, o.src, { label: 'שם', subtitle: 'תת-כותרת', description: 'תיאור' }, o);
    return pencil ? `<div class="ed-host ed-card">${optCard(o)}${pencil}</div>` : optCard(o);
  };
  // Edit mode only: links to the files behind an item. Shared lists show up in the
  // item's source locations (a `use:` list keeps its own file in `src`).
  const srcFiles = (v, out = new Set()) => {
    if (Array.isArray(v)) v.forEach((x) => srcFiles(x, out));
    else if (v && typeof v === 'object') {
      if (typeof v.file === 'string' && typeof v.line === 'number') out.add(v.file);
      else Object.values(v).forEach((x) => srcFiles(x, out));
    }
    return out;
  };
  const listLinks = (item) =>
    EDIT ? [...srcFiles(item)].filter((f) => f.startsWith('lists/')).map((f) => editLink(code, f, `עריכת הקובץ ${f} (רשימה משותפת)`)).join('') : '';
  // Pencil for a bullet (known/secret, own or from a shared list): title + text, one `bullet` edit.
  const bulletPencil = (it) => editPencil(it.title || it.text, it.src && { bullet: it.src.bullet }, { bullet: ['כותרת', 'טקסט'] }, it);
  const stepHtml = (c, st) => {
    const tags = [
      st.type === 'info' ? 'מידע' : st.type === 'choice' ? (st.multi ? 'בחירה מרובה' : 'בחירה') : 'שאלה פתוחה',
      st.optional && 'אופציונלי',
    ].filter(Boolean).join(' · ');
    const body =
      st.type === 'info'
        ? loreHtml(st, `🤫 הסודות של ${c.name}`, bulletPencil)
        : st.type === 'choice'
        ? `<div class="grid one cards">${st.options.map(card).join('')}</div>`
        : '';
    const head = `<h3 class="q-title small">${richText(st.title || st.prompt || '')}</h3>
        ${st.title && st.prompt ? `<p class="lead step-intro">${richText(st.prompt)}</p>` : ''}
        ${st.hint ? `<p class="hint">${richText(st.hint)}</p>` : ''}`;
    const headPencil = editPencil(st.title || st.prompt, st.src, { title: 'כותרת', prompt: 'שאלה', hint: 'רמז' }, st);
    return `
      <section class="lore-step" data-term-scope>
        <div class="kicker">${esc(tags)}</div>
        ${headPencil ? `<div class="ed-host">${head}${headPencil}</div>` : head}
        ${body}${stepLinkHtml(st.link)}${listLinks(st)}
      </section>`;
  };
  // A character's file: the characters/ file its own steps come from.
  const charFile = (c) => [...srcFiles(c.steps)].find((f) => f.startsWith('characters/')) || `characters/${c.id}.md`;
  const chars = CHARACTERS.map((c) => `
    <details class="card dm-player">
      <summary>${esc(c.name)} · ${esc(c.cls)}</summary>
      ${EDIT ? editLink(code, charFile(c), `עריכת הקובץ ${charFile(c)}`) : ''}
      ${(c.steps || []).map((st) => stepHtml(c, st)).join('')}
    </details>`).join('');
  const termHtml = (t) => {
    const pencil = editPencil(t.he, t.src, { name: 'שם', en: 'שם באנגלית', aliases: 'שמות נוספים', blurb: 'תיאור' }, t);
    return `
    <div class="lore-item${pencil ? ' ed-host' : ''}" data-term-scope>
      <h3 class="lore-t">${esc(t.he)} <span dir="ltr" lang="en">(${esc(t.en)})</span></h3>
      ${t.aliases?.length ? `<p class="hint">נקרא גם: ${t.aliases.map(esc).join(', ')}</p>` : ''}
      ${t.blurb ? t.blurb.split(/\n\n+/).map((p) => `<p>${richText(p, { self: t.id })}</p>`).join('') : ''}${pencil}
    </div>`;
  };
  const terms = allTerms();
  const termCats = [...Object.keys(CATEGORY_LABELS), ...terms.map((t) => t.category)]
    .filter((c, i, a) => a.indexOf(c) === i);
  const termsHtml = termCats.map((cat) => {
    const list = terms.filter((t) => t.category === cat);
    return list.length
      ? `<details class="card dm-player"><summary>${esc(CATEGORY_LABELS[cat] || cat)} (${list.length})</summary>${list.map(termHtml).join('')}</details>`
      : '';
  }).join('');
  screen(`
    <main class="wrap results">
      <div class="kicker">${esc(data.title)}</div>
      <h1 class="q-title">סשן ראשון: כל הלור והבחירות</h1>
      ${EDIT ? '<p class="hint ed-banner">מצב עריכה: שמירה כותבת לקבצים במחשב הזה. לא לשכוח commit.</p>' : ''}
      <section class="dm">
        <h2>${icon('eye')} רק ל-DM</h2>
        <details class="card dm-player" open data-term-scope>
          <summary>${richText(COMMON_LORE.title, { inert: true })} (כל השחקנים)</summary>
          ${EDIT ? editLink(code, 'world.md', 'עריכת הקובץ world.md') : ''}
          ${loreHtml(COMMON_LORE, undefined, bulletPencil)}${listLinks(COMMON_LORE)}
        </details>
        ${chars}
        ${terms.length ? `<h2>מונחים</h2>${termsHtml}` : ''}
        ${EDIT ? `
        <h2>קבצים</h2>
        <div class="card edit-links">
          ${Object.keys(EDIT.files).map((f) => editLink(code, f, f, '', ' dir="ltr"')).join('')}
          <a href="${base(code)}/dm/lore/new?key=${encodeURIComponent(key)}"><strong>קובץ חדש</strong></a>
        </div>` : ''}
      </section>
      <div class="footer stack"><a class="cta ghost" href="${base(code)}/dm?key=${encodeURIComponent(key)}">${icon('chevR')}<span>חזרה לתצוגת ה-DM</span></a></div>
    </main>`);
  wireInlineEdit(code, key);
}

// ---------------------------------------------------------------- inline editing (edit mode only)
// One pencil per editable item (D7). EDITS[i] describes the item behind pencil i.
const EDITS = [];
const NET_ERR = 'אין חיבור לשרת. הטקסט שלך עדיין כאן.';
// Fields that are paragraphs (auto-growing textarea); every other field is one line.
const MULTI_FIELDS = new Set(['description', 'blurb', 'text']);

// `src` is the item's `src` object, `labels` maps field kind -> Hebrew label (a bullet maps to
// [title label, text label]), `item` supplies the current values. Fields come from one file only
// (a save writes one file); '' when edit mode is off or the item has no src.
function editPencil(name, src, labels, item) {
  if (!EDIT || !src) return '';
  const kinds = Object.keys(labels).filter((k) => src[k]);
  if (!kinds.length) return '';
  const file = src[kinds[0]].file;
  const inputs = [];
  for (const k of kinds.filter((x) => src[x].file === file)) {
    const line = src[k].line;
    if (k === 'bullet') {
      inputs.push({ field: k, line, part: 'title', label: labels[k][0], value: item.title || '' });
      inputs.push({ field: k, line, part: 'text', label: labels[k][1], value: item.text || '' });
    } else {
      const v = k === 'aliases' ? (item.aliases || []).join(', ') : k === 'name' ? item.he : item[k];
      inputs.push({ field: k, line, label: labels[k], value: v ?? '' });
    }
  }
  EDITS.push({ name: plainText(name), file, inputs });
  return `<button type="button" class="ed-pencil" data-ed="${EDITS.length - 1}" aria-label="${esc(`עריכה: ${plainText(name)}`)}">${icon('pencil')}</button>`;
}

function wireInlineEdit(code, key) {
  if (!EDIT) return;
  let open = null; // { host, html, dirty() }: the one open editor (A16)
  const users = (file) => {
    const has = (v) => JSON.stringify(v).includes(`"file":${JSON.stringify(file)}`);
    return [...(has(COMMON_LORE) ? ['העולם'] : []), ...CHARACTERS.filter((c) => has(c.steps)).map((c) => c.name)];
  };

  const close = () => {
    if (!open) return;
    open.host.innerHTML = open.html;
    const pen = open.host.querySelector('.ed-pencil');
    open = null;
    return pen;
  };

  const openEditor = (host, spec) => {
    const html = host.innerHTML;
    const shared = spec.file.startsWith('lists/')
      ? `<p class="hint ed-shared">רשימה משותפת: השינוי יופיע אצל ${esc(users(spec.file).join(', '))}</p>` : '';
    host.innerHTML = `
      <div class="ed-form">
        <div class="ed-file" dir="ltr">${esc(spec.file)}</div>
        ${shared}
        ${spec.inputs.map((f, i) => `
        <label class="ed-field"><span>${esc(f.label)}</span>
          ${MULTI_FIELDS.has(f.part || f.field)
            ? `<textarea dir="rtl" rows="2" data-i="${i}">${esc(f.value)}</textarea>`
            : `<input dir="rtl" data-i="${i}" value="${esc(f.value)}">`}
        </label>`).join('')}
        <p class="hint">הפניה למונח: [[id]] או [[id|טקסט]]</p>
        <div class="editor-bar">
          <button type="button" class="cta" data-act="save" disabled><span>שמירה</span></button>
          <button type="button" class="cta ghost" data-act="cancel"><span>ביטול</span></button>
        </div>
        <p class="err ed-err" role="alert"></p>
        <div class="ed-extra"></div>
      </div>`;
    const els = [...host.querySelectorAll('[data-i]')];
    const saveBtn = host.querySelector('[data-act=save]');
    const cancelBtn = host.querySelector('[data-act=cancel]');
    const err = host.querySelector('.ed-err');
    const extra = host.querySelector('.ed-extra');
    const grow = (el) => {
      if (el.tagName !== 'TEXTAREA') return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight + 2}px`;
    };
    const dirty = () => els.some((el, i) => el.value !== spec.inputs[i].value);
    open = { host, html, dirty, name: spec.name };
    els.forEach((el) => {
      grow(el);
      el.oninput = () => {
        grow(el);
        saveBtn.disabled = !dirty();
      };
      if (el.tagName === 'INPUT') el.onkeydown = (e) => e.key === 'Enter' && e.preventDefault();
    });
    els[0].focus();
    cancelBtn.onclick = () => close()?.focus();

    saveBtn.onclick = async () => {
      err.textContent = '';
      extra.innerHTML = '';
      // Changed fields only; a bullet's title and text go together as one edit.
      const edits = [];
      spec.inputs.forEach((f, i) => {
        if (els[i].value === f.value) return;
        if (f.field === 'bullet') {
          if (edits.some((e) => e.line === f.line)) return;
          const pair = spec.inputs.map((g, j) => ({ g, j })).filter(({ g }) => g.line === f.line);
          const val = (part) => els[pair.find(({ g }) => g.part === part).j].value;
          edits.push({ line: f.line, field: 'bullet', value: { title: val('title'), text: val('text') } });
        } else edits.push({ line: f.line, field: f.field, value: els[i].value });
      });
      els.forEach((el) => (el.readOnly = true));
      saveBtn.disabled = true;
      cancelBtn.disabled = true;
      saveBtn.querySelector('span').textContent = 'שומר…';
      try {
        await api('PUT', `/api/s1/lore-field?code=${encodeURIComponent(code)}&key=${encodeURIComponent(key)}`, {
          file: spec.file, hash: EDIT.files[spec.file], edits,
        });
        await loadContent(code, key);
        return renderLore(code);
      } catch (e) {
        err.textContent = e.status ? e.message : NET_ERR;
        if (e.status === 409) {
          extra.innerHTML = '<button class="cta ghost" type="button">טעינה מחדש</button>';
          extra.firstChild.onclick = () => location.reload();
        }
      }
      els.forEach((el) => (el.readOnly = false));
      saveBtn.disabled = !dirty();
      cancelBtn.disabled = false;
      saveBtn.querySelector('span').textContent = 'שמירה';
    };
  };

  $app.onclick = (e) => {
    const pen = e.target.closest('.ed-pencil');
    if (!pen) return;
    const host = pen.closest('.ed-host');
    const spec = EDITS[+pen.dataset.ed];
    if (open && open.host !== host && open.dirty()) {
      // A16: unsaved changes in the open editor. Ask inside it, not with window.confirm.
      const box = open.host.querySelector('.ed-extra');
      box.innerHTML = `
        <div class="confirm-box" role="alert">
          <p>לבטל את השינויים ב${esc(open.name)}?</p>
          <div class="editor-bar"><button type="button" class="cta danger" data-act="yes">כן, לבטל</button><button type="button" class="cta ghost" data-act="no">המשך עריכה</button></div>
        </div>`;
      box.querySelector('[data-act=no]').onclick = () => {
        box.innerHTML = '';
        open.host.querySelector('[data-i]').focus();
      };
      box.querySelector('[data-act=yes]').onclick = () => {
        close();
        openEditor(host, spec);
      };
      box.querySelector('[data-act=no]').focus();
      return;
    }
    if (open?.host === host) return;
    close();
    openEditor(host, spec);
  };
}

// ---------------------------------------------------------------- lore file editor (edit mode only)
function editLink(code, file, text, cls = 'edit-link', attrs = '') {
  const href = `${base(code)}/dm/lore/file?key=${encodeURIComponent(adminKey(code))}&file=${encodeURIComponent(file)}`;
  return `<a${cls ? ` class="${cls}"` : ''}${attrs} href="${href}">${esc(text)}</a>`;
}

const lockScreen = () =>
  screen(`<main class="wrap center"><div class="hero-icon">${icon('lock')}</div><h1 class="q-title">רק ל-DM</h1></main>`);

const FILE_NAME = /^[a-z0-9_-]+$/;
function templateFor(file) {
  const [dir, name] = file.replace(/\.md$/, '').split('/');
  const id = name.replace(/-/g, '_');
  if (dir === 'characters')
    return `---\nid: ${id}\nname: שם\nclass: מקצוע\nicon: sword\n---\n\n# שם\n\n## info: lore\ntitle: כותרת\n\n### known\n\n- **כותרת** טקסט\n`;
  if (dir === 'lists') return `# רשימה\n\ntitle: כותרת\nprompt: שאלה\n\n### 🎲 אפשרות\nid: ${id}_one\n\nתיאור.\n`;
  return `# מונחים\n\n### מונח\nid: ${id}\nen: Term\ncategory: concept\n\nתיאור.\n`;
}

// New-file form: folder + name, then the editor opens with a template.
function renderNewFile(code) {
  const key = adminKey(code);
  screen(`
    <main class="wrap center">
      <div class="kicker">עורך הקובץ</div>
      <h1 class="q-title">קובץ חדש</h1>
      <label class="field new-file"><span>תיקייה</span>
        <select id="dir"><option value="characters">characters</option><option value="lists">lists</option><option value="terms" selected>terms</option></select>
      </label>
      <label class="field new-file"><span>שם</span>
        <input id="name" dir="ltr" placeholder="my_file" autocomplete="off" spellcheck="false"><em>אותיות קטנות באנגלית, ספרות, _ ו-. ‏.md יתווסף</em>
      </label>
      <p class="err" id="err"></p>
      <button class="cta" id="go">${icon('check')}<span>יצירה</span></button>
      <a class="cta ghost" href="${base(code)}/dm/lore?key=${encodeURIComponent(key)}">${icon('chevR')}<span>חזרה ללור</span></a>
    </main>`);
  document.getElementById('go').onclick = () => {
    const name = document.getElementById('name').value.trim().replace(/\.md$/, '');
    if (!FILE_NAME.test(name)) return (document.getElementById('err').textContent = 'שם לא תקין: אותיות קטנות באנגלית, ספרות, _ ו-.');
    const file = `${document.getElementById('dir').value}/${name}.md`;
    location.href = `${base(code)}/dm/lore/file?key=${encodeURIComponent(key)}&file=${encodeURIComponent(file)}&new=1`;
  };
}

async function renderFileEditor(code) {
  const key = adminKey(code);
  const params = new URL(location.href).searchParams;
  const file = params.get('file') || '';
  let isNew = params.get('new') === '1';
  const q = `code=${encodeURIComponent(code)}&key=${encodeURIComponent(key || '')}`;
  let text = isNew ? templateFor(file) : '';
  let hash = null;
  if (!isNew) {
    try {
      ({ text, hash } = await api('GET', `/api/s1/lore-file?${q}&file=${encodeURIComponent(file)}`));
    } catch (e) {
      if (e.status === 404 || e.status === 403) return lockScreen();
      return screen(`<main class="wrap center"><h1 class="q-title">הקובץ לא נטען</h1><p class="lead" dir="auto">${esc(e.status ? e.message : 'אין חיבור לשרת.')}</p></main>`);
    }
  } else {
    // Create mode: probe edit mode with a read of world.md, so a non-edit server shows the lock.
    try {
      await api('GET', `/api/s1/lore-file?${q}&file=world.md`);
    } catch (e) {
      if (e.status === 404 || e.status === 403) return lockScreen();
    }
  }
  const back = `${base(code)}/dm/lore?key=${encodeURIComponent(key || '')}`;
  let saved = text;
  screen(`
    <main class="wrap">
      <div class="kicker">עורך הקובץ</div>
      <h1 class="q-title small" dir="ltr">${esc(file)}</h1>
      <a class="edit-link" href="${back}" id="back">חזרה ללור</a>
      <textarea id="ta" class="file-editor" dir="auto" spellcheck="false" aria-label="${esc(file)}"></textarea>
      <p class="hint">הפורמט מתואר ב-content/session-one/README.md</p>
      <div id="box"></div>
      <p class="err" id="err" role="alert"></p>
      <div id="extra"></div>
      <div class="editor-bar">
        <button class="cta" id="save">${icon('check')}<span>שמירה</span></button>
        <button class="cta ghost" id="cancel">ביטול</button>
      </div>
    </main>`);
  const ta = document.getElementById('ta');
  const err = document.getElementById('err');
  const extra = document.getElementById('extra');
  const box = document.getElementById('box');
  const saveBtn = document.getElementById('save');
  const cancel = document.getElementById('cancel');
  ta.value = text;
  const dirty = () => ta.value !== saved;
  const clear = () => ((err.textContent = ''), (extra.innerHTML = ''), (box.innerHTML = ''));
  const goBack = () => (location.href = back);

  // Cancel: with unsaved text the first tap asks "בטוח?", the second leaves.
  let armed = null;
  const disarm = () => {
    if (!armed) return;
    clearTimeout(armed);
    armed = null;
    cancel.textContent = 'ביטול';
  };
  cancel.onclick = (e) => {
    e.stopPropagation();
    if (!dirty() || armed) return goBack();
    cancel.textContent = 'יש שינויים. בטוח?';
    armed = setTimeout(disarm, 4000);
  };
  document.addEventListener('click', disarm);

  // Select the named line, scroll the textarea to it.
  const selectLine = (n) => {
    const lines = ta.value.split('\n');
    if (!(n >= 1 && n <= lines.length)) return;
    const start = lines.slice(0, n - 1).reduce((a, l) => a + l.length + 1, 0);
    const keep = ta.value;
    ta.value = keep.slice(0, start); // measure how tall the text before the line is
    const top = ta.scrollHeight;
    ta.value = keep;
    ta.focus();
    ta.setSelectionRange(start, start + lines[n - 1].length);
    ta.scrollTop = Math.max(0, top - ta.clientHeight / 2);
  };

  const send = async (confirmRemovedIds) => {
    clear();
    saveBtn.disabled = true;
    ta.readOnly = true;
    saveBtn.querySelector('span').textContent = 'שומר…';
    try {
      const body = isNew ? { file, text: ta.value } : { file, hash, text: ta.value, ...(confirmRemovedIds && { confirmRemovedIds }) };
      const r = await api(isNew ? 'POST' : 'PUT', `/api/s1/lore-file?${q}`, body);
      hash = r.hash;
      saved = ta.value;
      if (isNew) {
        isNew = false;
        history.replaceState(null, '', `${base(code)}/dm/lore/file?key=${encodeURIComponent(key || '')}&file=${encodeURIComponent(file)}`);
      }
      err.style.color = 'var(--yes)';
      err.textContent = 'נשמר';
    } catch (e) {
      err.style.color = '';
      const b = e.body || {};
      if (!e.status) {
        err.textContent = NET_ERR;
      } else if (b.code === 'ids_removed') {
        box.innerHTML = `
          <div class="confirm-box" role="alert">
            <p>השמירה תסיר: <strong dir="ltr">${b.ids.map(esc).join(', ')}</strong></p>
            <p class="hint">שחקנים שענו על אלה יאבדו את התשובה בתצוגת ה-DM. בטוח?</p>
            <div class="editor-bar"><button class="cta danger" id="yes">כן, לשמור ולמחוק</button><button class="cta ghost" id="no">לא</button></div>
          </div>`;
        document.getElementById('yes').onclick = () => send(b.ids);
        document.getElementById('no').onclick = () => (box.innerHTML = '');
        document.getElementById('yes').focus();
      } else if (e.status === 422 && b.file) {
        err.textContent = e.message;
        if (b.file === file) {
          if (b.line) selectLine(b.line);
        } else {
          extra.innerHTML = `<a class="edit-link" target="_blank" rel="noopener" href="${base(code)}/dm/lore/file?key=${encodeURIComponent(key || '')}&file=${encodeURIComponent(b.file)}">${esc(`פתיחת ${b.file} בעורך`)}</a>`;
        }
      } else {
        err.textContent = e.message;
        if (e.status === 409 && !isNew) {
          extra.innerHTML = '<button class="cta ghost" id="reload" type="button">טעינה מחדש</button>';
          document.getElementById('reload').onclick = () => location.reload();
        }
      }
    }
    ta.readOnly = false;
    saveBtn.disabled = false;
    saveBtn.querySelector('span').textContent = 'שמירה';
  };
  saveBtn.onclick = () => send();
}

initTermPopup(); // term references open one shared popup (D6)
route();
