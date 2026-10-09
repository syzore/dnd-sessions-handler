import { icon } from '/shared/icons.js';
import { esc, api, playerId, savedName, rememberName, adminKey, rememberAdminKey, copyButton } from '/shared/lib.js';
import { CHARACTERS, character } from './characters.js';

const $app = document.getElementById('app');
const base = (code) => `/session-one/${code}`;

function screen(html) {
  $app.innerHTML = html;
  window.scrollTo(0, 0);
}

const CHOICES = [
  { id: 'keep', icon: 'check', label: 'שומר/ת על הדמות' },
  { id: 'rename', icon: 'pencil', label: 'שומר/ת עליה, אבל משנה לה את השם' },
  { id: 'switch', icon: 'dice', label: 'לא מתחבר/ת אליה, אחליף אחרי שהפרולוג ייגמר' },
];

// ---------------------------------------------------------------- routing
function route() {
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts.length === 1) return renderCreate();
  const code = parts[1].toUpperCase();
  if (parts[2] === 'dm') return renderDm(code);
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
    state.choice === 'switch' ? renderEnd() : renderStep(0);
  };
}

const canGo = () => !!state.choice && (state.choice !== 'rename' || !!state.newName);

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
  const cards = st.type === 'choice' && st.options.some((o) => o.description);
  const body =
    st.type === 'choice'
      ? `<div class="grid ${cards ? 'one cards' : ''}">${st.options.map((o) => `
          <button class="opt ${cards ? 'opt-card' : ''} ${cur === o.id ? 'sel' : ''}" data-id="${o.id}">
            ${o.emoji ? `<span class="opt-emoji" aria-hidden="true">${esc(o.emoji)}</span>` : ''}
            <span class="opt-text">
              <span class="opt-label">${esc(o.label)}</span>
              ${o.subtitle ? `<span class="opt-sub">${esc(o.subtitle)}</span>` : ''}
              ${o.description ? `<span class="opt-desc">${esc(o.description)}</span>` : ''}
            </span>
            <span class="opt-check">${icon('check')}</span>
          </button>`).join('')}</div>`
      : `<textarea class="big-text" id="ans" rows="5" maxlength="2000">${esc(cur)}</textarea>`;
  const last = i === steps.length - 1;
  screen(`
    ${topbar(i, steps.length)}
    <main class="wrap q">
      <div class="kicker">${esc(shownName())} · ${esc(c.cls)}</div>
      <h1 class="q-title">${esc(st.title || st.prompt)}</h1>
      ${st.title ? `<p class="lead step-intro">${esc(st.prompt)}</p>` : ''}
      ${st.hint ? `<p class="hint">${esc(st.hint)}</p>` : ''}
      ${body}
      <div class="footer"><button class="cta" id="next" ${st.type === 'choice' && !cur ? 'disabled' : ''}>${icon(last ? 'flag' : 'chevL')}<span>${last ? 'סיום' : 'המשך'}</span></button></div>
    </main>`);
  document.getElementById('back').onclick = () => (i === 0 ? renderChoice() : renderStep(i - 1));
  const next = document.getElementById('next');
  next.onclick = () => {
    save().catch(() => {});
    renderStep(i + 1);
  };
  if (st.type === 'choice') {
    $app.querySelectorAll('.opt').forEach((b) => {
      b.onclick = () => {
        state.answers[st.id] = b.dataset.id;
        $app.querySelectorAll('.opt').forEach((x) => x.classList.toggle('sel', x === b));
        next.disabled = false;
      };
    });
  } else {
    document.getElementById('ans').oninput = (e) => (state.answers[st.id] = e.target.value);
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
  const answerText = (st, v) => (st.type === 'choice' ? st.options.find((o) => o.id === v)?.label || v : v);
  const rows = data.players
    .map((p) => {
      const c = character(p.character);
      const steps = c?.steps || [];
      const known = new Set(steps.map((s) => s.id));
      const answers = [
        ...steps.map((st) => [st.title || st.prompt, answerText(st, p.answers?.[st.id])]),
        ...Object.entries(p.answers || {}).filter(([k]) => !known.has(k)), // answers to steps since removed
      ];
      return `
        <details class="card dm-player" open>
          <summary>${esc(p.name || 'ללא שם')} · ${esc(c ? `${c.name} (${c.cls})` : 'עוד לא בחר/ה')} ${p.done ? '' : '<span class="muted">(באמצע)</span>'}</summary>
          <dl class="dm-dl">
            <div><dt>החלטה</dt><dd>${esc(choiceLabel(p.choice))}</dd></div>
            ${p.choice === 'rename' ? `<div><dt>שם חדש</dt><dd>${esc(p.newName) || '—'}</dd></div>` : ''}
            ${answers.map(([q, a]) => `<div><dt>${esc(q)}</dt><dd>${esc(a) || '—'}</dd></div>`).join('')}
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
      <div class="footer stack"><button class="cta ghost" id="share">${icon('link')}<span>לשתף עם השחקנים</span></button></div>
    </main>`);
  copyButton('share', `${location.origin}${base(code)}`);
}

route();
