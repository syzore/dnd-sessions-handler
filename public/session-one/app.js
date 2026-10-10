import { icon } from '/shared/icons.js';
import { esc, api, playerId, savedName, rememberName, adminKey, rememberAdminKey, copyButton } from '/shared/lib.js';
import { setTerms, richText, plainText, optionLabel, addEnglishAll } from '/shared/terms.js';
import { initTermPopup, termInfoButton, stepLinkHtml } from '/shared/term-popup.js';

// Characters and lore come from the server (content/session-one/*.md, parsed per request).
let CHARACTERS = [];
let COMMON_LORE = null;
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
  ({ commonLore: COMMON_LORE, characters: CHARACTERS, terms } = await api('GET', `/api/s1/content?${q}`));
  setTerms(terms);
}

// A broken content file: show the parser's message (file and line), not a blank page.
function renderContentError(e) {
  screen(`
    <main class="wrap center">
      <div class="hero-icon">${icon('question')}</div>
      <h1 class="q-title">בעיה בקובץ התוכן</h1>
      <p class="lead" dir="auto">${esc(e.message)}</p>
    </main>`);
}

// ---------------------------------------------------------------- routing
async function route() {
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts.length === 1) return renderCreate();
  const code = parts[1].toUpperCase();
  const dm = parts[2] === 'dm';
  screen('<main class="wrap center"><div class="spinner"></div></main>');
  try {
    await loadContent(code, dm ? adminKey(code) : null);
  } catch (e) {
    return renderContentError(e);
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
  else renderIntro();
}

function save(extra = {}) {
  const { name, character: c, choice, newName, answers, done } = state;
  return api('PUT', `/api/s1/${state.code}/me/${playerId()}`, { name, character: c, choice, newName, answers, done, ...extra });
}

const shownName = () => (state.choice === 'rename' && state.newName) || character(state.character)?.name || '';

function topbar(i, n) {
  return `
    <header class="topbar">
      <button class="icon-btn" id="back" aria-label="חזרה">${icon('chevR')}</button>
      ${n ? `<div class="progress"><div style="width:${Math.round(((i + 1) / n) * 100)}%"></div></div><div class="count">${i + 1}/${n}</div>` : ''}
    </header>`;
}

function renderIntro() {
  screen(`
    <main class="wrap center">
      <div class="kicker">${esc(state.title)}</div>
      <div class="hero-icon">${icon('knight')}</div>
      <h1 class="q-title">סשן ראשון</h1>
      <p class="lead">בוחרים דמות מוכנה ומכירים אותה לפני שמתחילים.</p>
      <label class="field">
        <span>איך קוראים לך?</span>
        <input id="name" maxlength="40" value="${esc(state.name)}" autocomplete="given-name">
      </label>
      <button class="cta" id="start" ${state.name ? '' : 'disabled'}>${icon('chevL')}<span>יאללה</span></button>
    </main>`);
  const input = document.getElementById('name');
  const btn = document.getElementById('start');
  input.oninput = () => (btn.disabled = !input.value.trim());
  input.onkeydown = (e) => e.key === 'Enter' && !btn.disabled && btn.click();
  btn.onclick = () => {
    state.name = input.value.trim();
    rememberName(state.name);
    save().catch(() => {});
    renderPick();
  };
}

async function renderPick() {
  await load(state.code).catch(() => {}); // fresh "taken" list
  screen(`
    ${topbar()}
    <main class="wrap q">
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
  document.getElementById('back').onclick = renderIntro;
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
const loreSection = (items, cls, heading) =>
  items?.length
    ? `<section class="lore ${cls}"><h2 class="lore-h">${esc(heading)}</h2>${items.map((it) => `
        <div class="lore-item">${it.title ? `<h3 class="lore-t">${richText(it.title)}</h3>` : ''}<p>${richText(it.text)}</p></div>`).join('')}</section>`
    : '';
const loreHtml = (st, secretHeading = '🤫 מה רק אתה יודע') =>
  `<div class="lore-wrap">${loreSection(st.known, 'lore-known', 'מה כולם יודעים')}${loreSection(st.secret, 'lore-secret', secretHeading)}</div>`;

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
          <summary>${esc(p.name || 'ללא שם')} · ${esc(c ? `${c.name} (${c.cls})` : 'עוד לא בחר/ה')} ${!p.done ? '<span class="muted">(באמצע)</span>' : p.choice === 'switch' ? '<span class="muted">(יחליף דמות)</span>' : ''}</summary>
          <dl class="dm-dl">
            <div><dt>החלטה</dt><dd>${esc(choiceLabel(p.choice))}</dd></div>
            ${p.choice === 'rename' ? `<div><dt>שם חדש</dt><dd>${esc(p.newName) || '—'}</dd></div>` : ''}
            ${answers.map(([q, a]) => `<div><dt>${esc(q)}</dt><dd>${esc(Array.isArray(a) ? a.join(', ') : a) || '—'}</dd></div>`).join('')}
          </dl>
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
  const card = (o) => withInfo(o, `
    <div class="opt opt-card">
      ${o.emoji ? `<span class="opt-emoji" aria-hidden="true">${esc(o.emoji)}</span>` : ''}
      <span class="opt-text">
        <span class="opt-label">${optionLabel(o)}</span>
        ${o.subtitle ? `<span class="opt-sub">${richText(o.subtitle, { inert: true })}</span>` : ''}
        ${o.description ? `<span class="opt-desc">${richText(o.description, { inert: true })}</span>` : ''}
      </span>
    </div>`);
  const stepHtml = (c, st) => {
    const tags = [
      st.type === 'info' ? 'מידע' : st.type === 'choice' ? (st.multi ? 'בחירה מרובה' : 'בחירה') : 'שאלה פתוחה',
      st.optional && 'אופציונלי',
    ].filter(Boolean).join(' · ');
    const body =
      st.type === 'info'
        ? loreHtml(st, `🤫 הסודות של ${c.name}`)
        : st.type === 'choice'
        ? `<div class="grid one cards">${st.options.map(card).join('')}</div>`
        : '';
    return `
      <section class="lore-step" data-term-scope>
        <div class="kicker">${esc(tags)}</div>
        <h3 class="q-title small">${richText(st.title || st.prompt || '')}</h3>
        ${st.title && st.prompt ? `<p class="lead step-intro">${richText(st.prompt)}</p>` : ''}
        ${st.hint ? `<p class="hint">${richText(st.hint)}</p>` : ''}
        ${body}${stepLinkHtml(st.link)}
      </section>`;
  };
  const chars = CHARACTERS.map((c) => `
    <details class="card dm-player">
      <summary>${esc(c.name)} · ${esc(c.cls)}</summary>
      ${(c.steps || []).map((st) => stepHtml(c, st)).join('')}
    </details>`).join('');
  screen(`
    <main class="wrap results">
      <div class="kicker">${esc(data.title)}</div>
      <h1 class="q-title">סשן ראשון: כל הלור והבחירות</h1>
      <section class="dm">
        <h2>${icon('eye')} רק ל-DM</h2>
        <details class="card dm-player" open data-term-scope>
          <summary>${richText(COMMON_LORE.title, { inert: true })} (כל השחקנים)</summary>
          ${loreHtml(COMMON_LORE)}
        </details>
        ${chars}
      </section>
      <div class="footer stack"><a class="cta ghost" href="${base(code)}/dm?key=${encodeURIComponent(key)}">${icon('chevR')}<span>חזרה לתצוגת ה-DM</span></a></div>
    </main>`);
}

initTermPopup(); // term references open one shared popup (D6)
route();
