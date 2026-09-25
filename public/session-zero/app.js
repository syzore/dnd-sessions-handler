import { icon } from '/shared/icons.js';
import { esc, api, playerId, savedName, rememberName, adminKey, rememberAdminKey, copyButton } from '/shared/lib.js';
import { QUESTIONS, FRAMES, byId, question } from './content.js';
import { buildContract } from './contract.js';

const $app = document.getElementById('app');

const base = (code) => `/session-zero/${code}`;
const go = (url) => {
  history.pushState(null, '', url);
  route();
};
window.addEventListener('popstate', () => route());

function screen(html) {
  $app.innerHTML = html;
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------- routing
function route() {
  clearInterval(pollTimer);
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts.length === 1) return renderCreate();
  const code = parts[1].toUpperCase();
  if (parts[2] === 'results') return renderResults(code);
  return startQuiz(code);
}

// ---------------------------------------------------------------- create
function renderCreate() {
  screen(`
    <main class="wrap center">
      <div class="hero-icon">${icon('d20')}</div>
      <h1 class="q-title">סשן אפס</h1>
      <p class="lead">שאלון של 3 דקות לפני המשחק הראשון. כל אחד עונה מהטלפון, ובסוף מקבלים חוזה קבוצתי והצעה לקמפיין.</p>
      <label class="field">
        <span>איך נקרא לקבוצה?</span>
        <input id="title" maxlength="60" placeholder="למשל: החבר׳ה של יום חמישי" autocomplete="off">
      </label>
      <button class="cta" id="create">${icon('sword')}<span>יוצרים סשן</span></button>
      <p class="err" id="err"></p>
    </main>`);
  const btn = document.getElementById('create');
  btn.onclick = async () => {
    btn.disabled = true;
    try {
      const { code, adminKey } = await api('POST', '/api/sz/sessions', { title: document.getElementById('title').value });
      rememberAdminKey(code, adminKey);
      renderCreated(code, adminKey);
    } catch (e) {
      document.getElementById('err').textContent = e.message;
      btn.disabled = false;
    }
  };
}

function renderCreated(code, adminKey) {
  const link = `${location.origin}${base(code)}`;
  const dmLink = `${link}/results?key=${adminKey}`;
  screen(`
    <main class="wrap center">
      <div class="hero-icon">${icon('flag')}</div>
      <h1 class="q-title">הסשן מוכן</h1>
      <p class="lead">שלחו את הקישור לקבוצה:</p>
      <div class="linkbox">${esc(link)}</div>
      <button class="cta" id="share">${icon('link')}<span>העתקה / שיתוף</span></button>
      <button class="cta ghost" id="fill">${icon('pencil')}<span>למלא בעצמי</span></button>
      <a class="cta ghost" href="/schedule/${code}">${icon('calendar')}<span>לתאם מועד</span></a>
      <div class="note">
        <strong>קישור ה-DM</strong> — שמרו אותו לעצמכם. דרכו רואים גם את ההערות הפרטיות של כל שחקן.
        <div class="linkbox small">${esc(dmLink)}</div>
        <button class="chip" id="copydm">${icon('copy')}<span>העתקה</span></button>
      </div>
    </main>`);
  copyButton('share', link);
  copyButton('copydm', dmLink);
  document.getElementById('fill').onclick = () => go(base(code));
}

// ---------------------------------------------------------------- quiz
const state = { code: null, title: '', name: '', answers: {}, done: false };

async function startQuiz(code) {
  screen('<main class="wrap center"><div class="spinner"></div></main>');
  try {
    const s = await api('GET', `/api/sz/sessions/${code}`);
    Object.assign(state, { code: s.code, title: s.title, name: '', answers: {}, done: false });
  } catch {
    return renderNotFound();
  }
  const saved = await api('GET', `/api/sz/sessions/${code}/responses/${playerId()}`).catch(() => null);
  if (saved?.response) {
    Object.assign(state, { name: saved.response.name, answers: saved.response.answers || {}, done: saved.response.done });
  } else {
    state.name = savedName();
  }
  state.done ? renderDone() : renderIntro();
}

function renderNotFound() {
  screen(`
    <main class="wrap center">
      <div class="hero-icon">${icon('question')}</div>
      <h1 class="q-title">הסשן לא נמצא</h1>
      <p class="lead">כדאי לבדוק את הקישור.</p>
      <a class="cta" href="/session-zero">${icon('sword')}<span>ליצור סשן חדש</span></a>
    </main>`);
}

function save(extra = {}) {
  return api('PUT', `/api/sz/sessions/${state.code}/responses/${playerId()}`, {
    name: state.name,
    answers: state.answers,
    done: state.done,
    ...extra,
  }).catch(() => {});
}

function renderIntro() {
  screen(`
    <main class="wrap center">
      <div class="kicker">${esc(state.title)}</div>
      <div class="hero-icon">${icon('d20')}</div>
      <h1 class="q-title">סשן אפס</h1>
      <p class="lead">כמה שאלות קצרות כדי שהמשחק הראשון יהיה כיף לכולם. אין תשובות נכונות, ואפשר לשנות אחר כך.</p>
      <label class="field">
        <span>איך קוראים לך?</span>
        <input id="name" maxlength="40" value="${esc(state.name)}" autocomplete="given-name">
      </label>
      <button class="cta" id="start" ${state.name ? '' : 'disabled'}>${icon('chevL')}<span>יאללה, מתחילים</span></button>
    </main>`);
  const input = document.getElementById('name');
  const btn = document.getElementById('start');
  input.oninput = () => (btn.disabled = !input.value.trim());
  input.onkeydown = (e) => e.key === 'Enter' && !btn.disabled && btn.click();
  btn.onclick = () => {
    state.name = input.value.trim();
    rememberName(state.name);
    save();
    renderQuestion(0);
  };
}

function header(i) {
  const pct = Math.round(((i + 1) / QUESTIONS.length) * 100);
  return `
    <header class="topbar">
      <button class="icon-btn" id="back" aria-label="חזרה">${icon('chevR')}</button>
      <div class="progress"><div style="width:${pct}%"></div></div>
      <div class="count">${i + 1}/${QUESTIONS.length}</div>
    </header>`;
}

function optionButton(o, selected, extraClass = '') {
  return `
    <button class="opt ${selected ? 'sel' : ''} ${extraClass}" data-id="${o.id}">
      ${o.icon ? `<span class="opt-ic">${icon(o.icon)}</span>` : `<span class="opt-box">${icon('ban')}</span>`}
      <span class="opt-text"><span class="opt-label">${esc(o.label)}</span>${o.sub ? `<span class="opt-sub">${esc(o.sub)}</span>` : ''}</span>
      <span class="opt-check">${icon('check')}</span>
    </button>`;
}

function frameCard(f, selected) {
  return `
    <article class="frame ${selected ? 'sel' : ''}" data-id="${f.id}" style="--h:${f.hue}">
      <button class="frame-main" data-id="${f.id}">
        <div class="frame-art">${icon(f.icon)}</div>
        <div class="frame-head">
          <h3>${esc(f.title)}</h3>
          <p class="frame-tag">${esc(f.tagline)}</p>
        </div>
        <span class="opt-check">${icon('check')}</span>
      </button>
      <details>
        <summary>עוד על זה</summary>
        <p>${esc(f.body)}</p>
        <div class="tags">${f.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
        <p class="frame-story"><strong>הסיפור:</strong> ${esc(f.story)}</p>
        ${f.credit ? `<p class="frame-credit">${esc(f.credit)}</p>` : ''}
      </details>
    </article>`;
}

function renderQuestion(i) {
  const q = QUESTIONS[i];
  const cur = state.answers[q.id];
  let body = '';
  let footer = '';

  if (q.type === 'single') {
    body = `<div class="grid">${q.options.map((o) => optionButton(o, cur === o.id)).join('')}</div>`;
  } else if (q.type === 'multi') {
    const sel = cur || [];
    body = `<div class="grid">${q.options.map((o) => optionButton(o, sel.includes(o.id))).join('')}</div>`;
    footer = nextButton(sel.length > 0);
  } else if (q.type === 'frames') {
    const sel = cur || [];
    body = `<div class="frames">${FRAMES.map((f) => frameCard(f, sel.includes(f.id))).join('')}</div>`;
    footer = nextButton(sel.length > 0);
  } else if (q.type === 'avoid') {
    const sel = cur || [];
    body = `
      <div class="grid avoid">${q.options.map((o) => optionButton(o, sel.includes(o.id), o.exclusive ? 'wide' : '')).join('')}</div>
      <input class="text-in ${sel.includes('other') ? '' : 'hidden'}" id="avoidOther" maxlength="200" placeholder="מה עוד?" value="${esc(state.answers.avoidOther)}">
      <label class="field soft">
        <span>יש משהו שיגרום לך ממש לא להרגיש בנוח לשחק? <em>רק ה-DM רואה את זה</em></span>
        <textarea id="discomfort" rows="2" maxlength="1000">${esc(state.answers.discomfort)}</textarea>
      </label>`;
    footer = nextButton(sel.length > 0);
  } else if (q.type === 'text') {
    body = `<textarea class="big-text" id="notes" rows="5" maxlength="2000" placeholder="לא חובה">${esc(cur)}</textarea>`;
    footer = `<button class="cta" id="next">${icon('flag')}<span>סיום</span></button>`;
  }

  screen(`
    ${header(i)}
    <main class="wrap q">
      <h1 class="q-title">${esc(q.title)}</h1>
      ${q.hint ? `<p class="hint">${esc(q.hint)}</p>` : ''}
      ${body}
      <div class="footer">${footer}</div>
    </main>`);

  document.getElementById('back').onclick = () => (i === 0 ? renderIntro() : renderQuestion(i - 1));
  const next = () => {
    if (i === QUESTIONS.length - 1) {
      state.done = true;
      save();
      renderDone();
    } else {
      save();
      renderQuestion(i + 1);
    }
  };
  const nextBtn = document.getElementById('next');
  if (nextBtn) nextBtn.onclick = next;

  if (q.type === 'single') {
    $app.querySelectorAll('.opt').forEach((b) => {
      b.onclick = () => {
        state.answers[q.id] = b.dataset.id;
        $app.querySelectorAll('.opt').forEach((x) => x.classList.toggle('sel', x === b));
        setTimeout(next, 220);
      };
    });
  }

  if (q.type === 'multi' || q.type === 'avoid' || q.type === 'frames') {
    const exclusive = q.type === 'avoid' ? q.options.filter((o) => o.exclusive).map((o) => o.id) : q.exclusive || [];
    $app.querySelectorAll('[data-id]:is(.opt, .frame-main)').forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.id;
        let sel = [...(state.answers[q.id] || [])];
        if (sel.includes(id)) sel = sel.filter((x) => x !== id);
        else if (exclusive.includes(id)) sel = [id];
        else {
          sel = sel.filter((x) => !exclusive.includes(x));
          if (q.max && sel.length >= q.max) sel.shift(); // drop the oldest pick
          sel.push(id);
        }
        state.answers[q.id] = sel;
        $app.querySelectorAll('[data-id]:is(.opt, .frame)').forEach((x) => x.classList.toggle('sel', sel.includes(x.dataset.id)));
        nextBtn.disabled = !sel.length;
        const other = document.getElementById('avoidOther');
        if (other) {
          other.classList.toggle('hidden', !sel.includes('other'));
          if (id === 'other' && sel.includes('other')) other.focus();
        }
      };
    });
  }

  if (q.type === 'avoid') {
    document.getElementById('avoidOther').oninput = (e) => (state.answers.avoidOther = e.target.value);
    document.getElementById('discomfort').oninput = (e) => (state.answers.discomfort = e.target.value);
  }
  if (q.type === 'text') {
    document.getElementById('notes').oninput = (e) => (state.answers.notes = e.target.value);
  }
}

function nextButton(enabled) {
  return `<button class="cta" id="next" ${enabled ? '' : 'disabled'}>${icon('chevL')}<span>המשך</span></button>`;
}

function renderDone() {
  screen(`
    <main class="wrap center">
      <div class="hero-icon">${icon('flag')}</div>
      <h1 class="q-title">תודה, ${esc(state.name)}!</h1>
      <p class="lead">התשובות נשמרו. כשכולם יסיימו, החוזה הקבוצתי יתמלא.</p>
      <button class="cta" id="results">${icon('scroll')}<span>לחוזה הקבוצתי</span></button>
      <button class="cta ghost" id="edit">${icon('pencil')}<span>לשנות תשובות</span></button>
    </main>`);
  document.getElementById('results').onclick = () => go(`${base(state.code)}/results`);
  document.getElementById('edit').onclick = () => renderQuestion(0);
}

// ---------------------------------------------------------------- results
let pollTimer = null;

async function renderResults(code) {
  const key = adminKey(code);

  let data;
  try {
    data = await api('GET', `/api/sz/sessions/${code}/results${key ? `?key=${encodeURIComponent(key)}` : ''}`);
  } catch {
    return renderNotFound();
  }
  const mine = await api('GET', `/api/sz/sessions/${code}/responses/${playerId()}`).catch(() => null);
  paintResults(data, mine?.response);

  // Light polling so everyone watches the contract fill up live
  clearInterval(pollTimer);
  const sig = JSON.stringify(data);
  let last = sig;
  pollTimer = setInterval(async () => {
    if (document.hidden) return;
    const fresh = await api('GET', `/api/sz/sessions/${code}/results${key ? `?key=${encodeURIComponent(key)}` : ''}`).catch(() => null);
    if (!fresh) return;
    const s = JSON.stringify(fresh);
    if (s !== last) {
      last = s;
      const openDetails = [...$app.querySelectorAll('details[open]')].map((d) => d.dataset.k);
      paintResults(fresh, mine?.response, true);
      openDetails.forEach((k) => $app.querySelector(`details[data-k="${k}"]`)?.setAttribute('open', ''));
    }
  }, 8000);
}

function scaleLine(s) {
  if (!s) return 'נגלה ביחד';
  return `${s.text}${s.split ? ' <span class="muted">(יש פערים — נאזן)</span>' : ''}`;
}

function paintResults(data, mine, keepScroll = false) {
  const c = buildContract(data);
  const code = data.code;
  const doneCount = data.players.filter((p) => p.done).length;
  const readyCount = data.players.filter((p) => p.ready).length;
  const iAmReady = !!mine?.ready;
  const scrollY = window.scrollY;

  const players = data.players
    .map(
      (p) =>
        `<span class="pl ${p.ready ? 'ready' : p.done ? 'done' : ''}">${p.ready ? icon('flag') : p.done ? icon('check') : '…'} ${esc(p.name)}</span>`
    )
    .join('');

  const framesHtml = c?.frames.length
    ? `<div class="bars">${c.frames
        .map(
          ({ frame, count }) => `
        <div class="bar" style="--h:${frame.hue}">
          <span class="bar-ic">${icon(frame.icon)}</span>
          <span class="bar-name">${esc(frame.title)}</span>
          <span class="bar-track"><span style="width:${(count / c.n) * 100}%"></span></span>
          <span class="bar-n">${count}/${c.n}</span>
        </div>`
        )
        .join('')}</div>`
    : '';

  const campaignHtml = c?.campaign
    ? `
      <section class="campaign" style="--h:${c.campaign.frame.hue}">
        <div class="campaign-art">${icon(c.campaign.frame.icon)}</div>
        <div class="kicker">הקמפיין המוצע</div>
        <h2>${esc(c.campaign.title)}</h2>
        ${c.campaign.subtitle ? `<p class="campaign-sub">${esc(c.campaign.subtitle)}</p>` : ''}
        <p>${esc(c.campaign.pitch)}</p>
      </section>`
    : '';

  const contractHtml = c
    ? `
      <section class="contract">
        <h2>המשחק הראשון שלנו</h2>
        <dl>
          <dt>${icon('sparkles')} טון</dt><dd>${esc(c.tone)}</dd>
          <dt>${icon('mask')} משחק תפקידים</dt><dd>${scaleLine(c.roleplay)}</dd>
          <dt>${icon('sword')} קרבות</dt><dd>${scaleLine(c.combat)}</dd>
          <dt>${icon('book')} חוקים</dt><dd>${esc(c.rules)}</dd>
          <dt>${icon('hat')} דמויות</dt><dd>${esc(c.characters)}</dd>
          <dt>${icon('beer')} המטרה</dt><dd>${esc(c.goals)}</dd>
          <dt>${icon('ban')} להימנע מ</dt><dd>${c.avoid.length ? c.avoid.map((a) => `<span class="avoid-chip">${esc(a)}</span>`).join('') : 'לא סומן כלום'}</dd>
        </dl>
        <p class="first"><strong>סשן ראשון:</strong> ${esc(c.firstSession)}</p>
        <p class="first"><strong>כלל אחד:</strong> כל אחד יכול לעצור או לדלג על סצנה בכל רגע, בלי להסביר למה.</p>
      </section>`
    : `<section class="contract empty"><p class="lead">עוד אף אחד לא סיים את השאלון. החוזה יתמלא כאן לבד.</p></section>`;

  const readyHtml = mine?.done
    ? `<button class="cta ready-btn ${iAmReady ? 'on' : ''}" id="ready">${icon(iAmReady ? 'check' : 'sword')}<span>${iAmReady ? 'אני בפנים!' : 'מוכנים לשחק'}</span></button>`
    : `<button class="cta" id="fill">${icon('pencil')}<span>${mine ? 'להמשיך את השאלון' : 'למלא את השאלון'}</span></button>`;

  screen(`
    <main class="wrap results">
      <div class="kicker">${esc(data.title)}</div>
      <h1 class="q-title">החוזה הקבוצתי</h1>
      <p class="hint">${doneCount} סיימו${readyCount ? ` · ${readyCount} מוכנים לשחק` : ''}</p>
      <div class="players">${players || '<span class="muted">עוד אין שחקנים</span>'}</div>
      ${campaignHtml}
      ${framesHtml ? `<details class="card" data-k="frames"><summary>איך הצביעו על ההרפתקאות</summary>${framesHtml}</details>` : ''}
      ${contractHtml}
      <div class="footer stack">
        ${readyHtml}
        ${mine?.done ? `<button class="cta ghost" id="edit">${icon('pencil')}<span>לשנות תשובות</span></button>` : ''}
        <button class="cta ghost" id="share">${icon('link')}<span>לשתף את השאלון</span></button>
        <a class="cta ghost" href="/schedule/${code}">${icon('calendar')}<span>מתי משחקים?</span></a>
        ${data.isAdmin ? `<a class="cta ghost" href="/tables/${code}">${icon('dice')}<span>שולחנות אקראיים (DM)</span></a>` : ''}
      </div>
      ${data.isAdmin ? dmPanel(data) : ''}
    </main>`);
  if (keepScroll) window.scrollTo(0, scrollY);

  const readyBtn = document.getElementById('ready');
  if (readyBtn)
    readyBtn.onclick = async () => {
      mine.ready = !iAmReady;
      await api('PUT', `/api/sz/sessions/${code}/responses/${playerId()}`, { ready: mine.ready });
      renderResults(code);
    };
  const fill = document.getElementById('fill');
  if (fill) fill.onclick = () => go(base(code));
  const edit = document.getElementById('edit');
  if (edit)
    edit.onclick = async () => {
      await startQuiz(code);
      history.pushState(null, '', base(code));
      renderQuestion(0);
    };
  copyButton('share', `${location.origin}${base(code)}`);
}

function answerText(qid, v) {
  if (qid === 'frames') return (v || []).map((id) => FRAMES.find((f) => f.id === id)?.title).join(', ');
  const q = question(qid);
  const ids = Array.isArray(v) ? v : v ? [v] : [];
  return ids.map((id) => byId(q, id)?.label || id).join(', ');
}

function dmPanel(data) {
  const rows = data.detail
    .map((p) => {
      const a = p.answers || {};
      const fields = QUESTIONS.filter((q) => q.type !== 'text' && q.id !== 'avoid')
        .map((q) => `<div><dt>${esc(q.title)}</dt><dd>${esc(answerText(q.id, a[q.id])) || '—'}</dd></div>`)
        .join('');
      const avoid = answerText('avoid', (a.avoid || []).filter((x) => x !== 'other'));
      return `
        <details class="card dm-player" data-k="dm-${esc(p.name)}">
          <summary>${esc(p.name || 'ללא שם')} ${p.done ? '' : '<span class="muted">(באמצע)</span>'}</summary>
          <dl class="dm-dl">${fields}
            <div><dt>להימנע</dt><dd>${esc([avoid, a.avoidOther].filter(Boolean).join(', ')) || '—'}</dd></div>
          </dl>
          ${a.discomfort ? `<p class="private"><strong>לא בנוח עם:</strong> ${esc(a.discomfort)}</p>` : ''}
          ${a.notes ? `<p class="private"><strong>הערות:</strong> ${esc(a.notes)}</p>` : ''}
        </details>`;
    })
    .join('');
  return `
    <section class="dm">
      <h2>${icon('eye')} רק ל-DM</h2>
      <p class="hint">התשובות של כל אחד, כולל מה שנועד רק ל-DM.</p>
      ${rows || '<p class="muted">עוד אין תשובות</p>'}
    </section>`;
}

route();
