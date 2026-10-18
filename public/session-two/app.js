// Session Two player page (docs/specs/session-two.md D6-D8): pick, intro, the visible steps, end.
// The flow rules (effective answer, visible steps and options, context line) are pure and live in
// /shared/session-two-flow.js; the screens come from the shared step screen. The DM view is ticket 05.
import { icon } from '/shared/icons.js';
import { esc, api, playerId, adminKey, rememberAdminKey, copyButton } from '/shared/lib.js';
import { setTerms, termOf, richText, richParas, plainText, optionLabel, addEnglishAll } from '/shared/terms.js';
import { initTermPopup, stepLinkHtml } from '/shared/term-popup.js';
import { withInfo, loreHtml, topbar, pickListHtml, stepScreenHtml, wireStep } from '/shared/step-screen.js';
import { visibleSteps, visibleOptions, screenAnswers, commitScreenAnswers, contextLine, dmRows } from '/shared/session-two-flow.js';

let CHARACTERS = [];
let INTRO = null;
const character = (id) => CHARACTERS.find((c) => c.id === id);

const $app = document.getElementById('app');
const base = (code) => `/session-two/${code}`;

function screen(html) {
  $app.innerHTML = html;
  addEnglishAll($app);
  window.scrollTo(0, 0);
}

async function loadContent(code, key = null) {
  const q = new URLSearchParams({ code, pid: playerId() });
  if (key) q.set('key', key);
  let terms;
  ({ commonLore: INTRO, characters: CHARACTERS, terms } = await api('GET', `/api/s2/content?${q}`));
  setTerms(terms);
}

function renderContentError(e) {
  screen(`
    <main class="wrap center">
      <div class="hero-icon">${icon('question')}</div>
      <h1 class="q-title">בעיה בקובץ התוכן</h1>
      <p class="lead" dir="auto">${esc(e.message)}</p>
    </main>`);
}

const lockScreen = () =>
  screen(`<main class="wrap center"><div class="hero-icon">${icon('lock')}</div><h1 class="q-title">רק ל-DM</h1></main>`);

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
  return dm ? renderDm(code) : start(code);
}

// ---------------------------------------------------------------- create
function renderCreate() {
  screen(`
    <main class="wrap center">
      <div class="hero-icon">${icon('knight')}</div>
      <h1 class="q-title">סשן שני</h1>
      <p class="lead">כל שחקן בוחר דמות, ועונה על תת-מקצוע, רקע ופרטי הרקע.</p>
      <p class="hint">כבר יש לכם קבוצה מהסשן הראשון? פתחו את אותו קישור, עם session-two במקום session-one.</p>
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
      <a class="cta" href="/session-two">${icon('sword')}<span>ליצור קבוצה חדשה</span></a>
    </main>`);
}

// ---------------------------------------------------------------- DM view (D9)
async function renderDm(code) {
  const key = adminKey(code);
  let data;
  try {
    data = await api('GET', `/api/s2/${code}${key ? `?key=${encodeURIComponent(key)}` : ''}`);
  } catch {
    return renderNotFound();
  }
  if (!data.isAdmin) return lockScreen();
  const rows = (data.players || [])
    .map((p) => {
      const c = character(p.character);
      const { rows: shown, extras } = c
        ? dmRows(c, p.carried?.answers || {}, p.answers || {}, { termName: (id) => termOf(id)?.he, plain: plainText })
        : { rows: [], extras: Object.entries(p.answers || {}) };
      const name = c ? `${p.carried?.newName || c.name} (${c.cls})` : 'עוד לא בחר/ה';
      const line = ([q, a, note = '']) => `<div><dt>${esc(q)}</dt><dd>${esc(Array.isArray(a) ? a.join(', ') : a) || '—'}${note ? ` <span class="muted">${esc(note)}</span>` : ''}</dd></div>`;
      return `
        <details class="card dm-player" open>
          <summary>${esc(name)} ${c && !p.done ? '<span class="muted">(באמצע)</span>' : ''}</summary>
          <dl class="dm-dl">
            ${shown.map((r) => line([r.q, r.a, r.note])).join('')}
            ${extras.map(([k, v]) => line([k, v])).join('')}
          </dl>
          <button class="cta ghost danger dm-del" data-pid="${esc(p.id)}">מחיקה</button>
        </details>`;
    })
    .join('');
  screen(`
    <main class="wrap results">
      <div class="kicker">${esc(data.title)}</div>
      <h1 class="q-title">סשן שני: בניית הדמות</h1>
      <section class="dm">
        <h2>${icon('eye')} רק ל-DM</h2>
        ${rows || '<p class="muted">עוד אין שחקנים</p>'}
      </section>
      <div class="footer stack">
        <a class="cta ghost" href="${base(code)}/dm/lore?key=${encodeURIComponent(key || '')}">${icon('eye')}<span>כל הלור והבחירות</span></a>
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
        await api('DELETE', `/api/s2/${code}/players/${encodeURIComponent(btn.dataset.pid)}?key=${encodeURIComponent(key)}`);
        return renderDm(code);
      }
      disarm();
      btn.textContent = 'בטוח?';
      armed = { btn, timer: setTimeout(disarm, 4000) };
    };
  });
  document.addEventListener('click', disarm, { once: true });
}

// ---------------------------------------------------------------- DM lore compendium (read-only)
// Every character's steps and options, secrets included, plus the shared background details once.
// The secrets come only from /api/s2/content with the DM key (contentFor strips them otherwise),
// and the page renders only when /api/s2/:code confirms isAdmin. Modelled on Session One's renderLore.
const isSharedDetails = (id) => id.startsWith('details_') && CHARACTERS.every((c) => c.steps.some((s) => s.id === id));
const bgName = (id) => (id === '_else' ? 'כל רקע אחר / טקסט חופשי' : plainText(termOf(`bg_${id}`)?.he || id));
// "when: step = value" as a short label, with the step's title and the option's label where known.
function whenLabel(when, c) {
  if (!when) return '';
  if (when.step === 'background') return `רק כשהרקע: ${bgName(when.value)}`;
  const target = c?.steps.find((s) => s.id === when.step);
  const opt = target?.options?.find((o) => o.id === when.value);
  return `רק כש-${plainText(target?.title || when.step)} = ${opt ? plainText(opt.label) : when.value}`;
}
const badge = (text) => `<span class="badge">${esc(text)}</span>`;

async function renderLore(code) {
  const key = adminKey(code);
  let data;
  try {
    data = await api('GET', `/api/s2/${code}${key ? `?key=${encodeURIComponent(key)}` : ''}`);
  } catch {
    return renderNotFound();
  }
  if (!data.isAdmin) return lockScreen();
  const card = (o, c) => withInfo(o, `
    <div class="opt opt-card">
      ${o.emoji ? `<span class="opt-emoji" aria-hidden="true">${esc(o.emoji)}</span>` : ''}
      <span class="opt-text">
        <span class="opt-label">${optionLabel(o)}</span>
        ${o.subtitle ? `<span class="opt-sub">${richText(o.subtitle, { inert: true })}</span>` : ''}
        ${o.description ? `<span class="opt-desc">${richParas(o.description, { inert: true })}</span>` : ''}
        ${o.when ? `<span class="opt-sub">${badge(whenLabel(o.when, c))}</span>` : ''}
      </span>
    </div>`);
  const stepHtml = (c, st, label = '') => {
    const tags = [
      st.type === 'info' ? 'מידע' : st.type === 'choice' ? (st.multi ? 'בחירה מרובה' : 'בחירה') : 'טקסט חופשי',
      st.count && `בדיוק ${st.count}`,
      st.random && 'אקראי 🎲',
      st.other && '+ טקסט חופשי',
      st.optional && 'אופציונלי',
      st.carry && 'מסשן ראשון (מדולג אם כבר נענה)',
    ].filter(Boolean);
    const when = label || whenLabel(st.when, c);
    const body =
      st.type === 'info'
        ? loreHtml(st, `🤫 הסודות של ${c?.name || ''}`)
        : st.type === 'choice'
        ? `<div class="grid one cards">${st.options.map((o) => card(o, c)).join('')}</div>`
        : '';
    return `
      <section class="lore-step" data-term-scope>
        <div class="kicker">${tags.map(badge).join(' ')} ${when ? badge(when) : ''} <span dir="ltr" class="muted">${esc(st.id)}</span></div>
        <h3 class="q-title small">${richText(st.title || st.prompt || '')}</h3>
        ${st.title && st.prompt ? `<p class="lead step-intro">${richText(st.prompt)}</p>` : ''}
        ${st.hint ? `<p class="hint">${richText(st.hint)}</p>` : ''}
        ${body}${stepLinkHtml(st.link)}
      </section>`;
  };
  const chars = CHARACTERS.map((c) => {
    const own = c.steps.filter((st) => !isSharedDetails(st.id));
    const fixed = c.background
      ? `<p class="hint">${badge('רקע קבוע')} ${esc(bgName(c.background))}: ה-DM קבע, השחקן לא נשאל על רקע.</p>`
      : '';
    return `
    <details class="card dm-player">
      <summary>${esc(c.name)} · ${esc(c.cls)}${c.background ? ` · ${esc(bgName(c.background))}` : ''}</summary>
      ${fixed}
      ${own.map((st) => stepHtml(c, st)).join('')}
      <p class="hint">פרטי הרקע המשותפים: בקטע "פרטי רקע (לכל הדמויות)".</p>
    </details>`;
  }).join('');
  const first = CHARACTERS[0];
  const shared = first ? first.steps.filter((st) => isSharedDetails(st.id)) : [];
  const sharedHtml = shared.length
    ? `<details class="card dm-player">
        <summary>פרטי רקע (לכל הדמויות, ${shared.length})</summary>
        ${shared.map((st) => stepHtml(first, st, st.when?.step === 'background' ? `רקע: ${bgName(st.when.value)}` : '')).join('')}
      </details>`
    : '';
  screen(`
    <main class="wrap results">
      <div class="kicker">${esc(data.title)}</div>
      <h1 class="q-title">סשן שני: כל הלור והבחירות</h1>
      <section class="dm">
        <h2>${icon('eye')} רק ל-DM</h2>
        <details class="card dm-player" data-term-scope>
          <summary>${richText(INTRO.title, { inert: true })} (כל השחקנים)</summary>
          ${INTRO.prompt ? `<p class="lead step-intro">${richText(INTRO.prompt)}</p>` : ''}
          ${loreHtml(INTRO)}
        </details>
        ${chars}
        ${sharedHtml}
      </section>
      <div class="footer stack"><a class="cta ghost" href="${base(code)}/dm?key=${encodeURIComponent(key || '')}">${icon('chevR')}<span>חזרה לתצוגת ה-DM</span></a></div>
    </main>`);
}

// ---------------------------------------------------------------- player flow
const state = { code: null, title: '', character: null, answers: {}, done: false, taken: {}, carried: null, s1Character: null };

// Session One answers carried for this character (live from the server, D1, A8).
const carriedAnswers = () => state.carried?.answers || {};

async function load(code) {
  const s = await api('GET', `/api/s2/${code}?pid=${playerId()}`);
  const me = s.me || {};
  Object.assign(state, {
    code: s.code,
    title: s.title,
    taken: s.taken,
    character: me.character || null,
    answers: me.answers || {},
    done: !!me.done,
    carried: s.carried || null,
    s1Character: s.s1Character || null,
  });
}

async function start(code) {
  try {
    await load(code);
  } catch {
    return renderNotFound();
  }
  if (state.done && character(state.character)) renderEnd();
  else renderPick();
}

// Saves go out one at a time, in call order, each with the state as it was when asked: two quick
// saves (the last step, then the end) can never land out of order and leave done:false.
let saving = Promise.resolve();
// The character pick goes through the same chain, so an earlier save cannot land after it.
function queueSave(code, payload) {
  const body = JSON.stringify(payload);
  const run = () => api('PUT', `/api/s2/${code}/me/${playerId()}`, JSON.parse(body));
  const sent = saving.then(run);
  saving = sent.catch(() => {}); // the caller still gets the rejection (e.g. 409)
  return sent;
}
function save() {
  const { code, character: c, done } = state;
  return queueSave(code, { character: c, answers: state.answers, done });
}

// The character's name: a Session One rename carries (A5).
const shownName = () => state.carried?.newName || character(state.character)?.name || '';

async function renderPick(message = '') {
  await load(state.code).catch(() => {}); // fresh "taken" list
  screen(`
    <main class="wrap q">
      <div class="kicker">${esc(state.title)} · סשן שני</div>
      <h1 class="q-title">איזו דמות תשחק/י?</h1>
      ${pickListHtml(CHARACTERS, { taken: state.taken, selected: state.character })}
      <p class="err" id="err">${esc(message)}</p>
    </main>`);
  // A18: hint the character this browser played in Session One; never preselect it.
  const hinted = $app.querySelector(`.opt[data-id="${CSS.escape(state.s1Character || '')}"]:not([disabled]) .opt-sub`);
  if (hinted) hinted.textContent += ' · שיחקת בה בסשן הראשון';
  $app.querySelectorAll('.opt').forEach((b) => {
    b.onclick = async () => {
      // A different character starts clean: the server keeps one answer object per player, and
      // the old character's answers (and `<id>_other` text) would show on the new one's steps.
      const changed = b.dataset.id !== state.character;
      const next = changed ? { answers: {}, done: false } : { answers: state.answers, done: state.done };
      try {
        await queueSave(state.code, { character: b.dataset.id, ...next });
      } catch (e) {
        return renderPick(e.message);
      }
      state.character = b.dataset.id;
      Object.assign(state, next);
      await loadContent(state.code).catch(() => {});
      await load(state.code).catch(() => {}); // the carry for this character
      renderIntro();
    };
  });
}

function renderIntro() {
  const c = character(state.character);
  screen(`
    ${topbar()}
    <main class="wrap q">
      <div class="kicker">${esc(shownName())} · ${esc(c.cls)}</div>
      <h1 class="q-title">${richText(INTRO.title)}</h1>
      ${INTRO.prompt ? `<p class="lead step-intro">${richText(INTRO.prompt)}</p>` : ''}
      ${loreHtml(INTRO)}
      <div class="footer"><button class="cta" id="next">${icon('chevL')}<span>המשך</span></button></div>
    </main>`);
  document.getElementById('back').onclick = () => renderPick();
  document.getElementById('next').onclick = () => renderStep(0);
}

// The context block above the options (D8), in the .hint style.
function contextHtml(st, c) {
  const line = contextLine(st, c, carriedAnswers(), state.answers, { termName: (id) => termOf(id)?.he, plain: plainText });
  if (!line) return '';
  return `
      <div class="hint context-line">
        ${line.question ? `<div>${esc(line.question)}</div>` : ''}
        <div><strong>${esc(line.answer)}</strong></div>
        ${line.note ? `<div>${esc(line.note)}</div>` : ''}
      </div>`;
}

// One screen per visible step. The visible list is recomputed on every render (D6), so a changed
// background changes the next step. The step screen gets only the visible options; an answer to a
// hidden option shows as unanswered and stays stored until the player picks again.
function renderStep(i) {
  const c = character(state.character);
  const steps = visibleSteps(c, carriedAnswers(), state.answers);
  if (i >= steps.length) {
    state.done = true;
    return renderEnd(save());
  }
  const raw = steps[Math.max(0, i)];
  const options = raw.type === 'choice' ? visibleOptions(raw, { character: c, carried: carriedAnswers(), answers: state.answers }) : null;
  const st = options ? { ...raw, options } : raw;
  const before = screenAnswers(st, options || [], state.answers);
  const view = { ...before };
  screen(stepScreenHtml({ st, i, n: steps.length, kicker: `${shownName()} · ${c.cls}`, answers: view, contextHtml: contextHtml(st, c) }));
  document.getElementById('back').onclick = () => (i === 0 ? renderIntro() : renderStep(i - 1));
  const go = () => {
    commitScreenAnswers(st, before, view, state.answers);
    // Recomputed after the commit: this answer may reveal more steps (a `when:` step).
    if (i + 1 < visibleSteps(c, carriedAnswers(), state.answers).length) save().catch(() => {}); // the last step is saved once, with done, by the end screen
    renderStep(i + 1);
  };
  wireStep($app, { st, answers: view, onNext: go, onSkip: go });
}

// `saving` is the pending save when the player just finished; nothing when returning to a saved form.
// The "saved" text shows only once the save went through; a failure says so and offers a retry.
function renderEnd(saving = null) {
  screen(`
    <main class="wrap center">
      <div class="hero-icon">${icon('flag')}</div>
      <h1 class="q-title">${esc(shownName())} מוכן/ה</h1>
      <p class="lead" id="end-msg">${saving ? 'שומר/ת…' : 'התשובות נשמרו. נתראה בסשן!'}</p>
      <button class="cta hidden" id="retry">${icon('chevL')}<span>לנסות שוב</span></button>
      <button class="cta ghost" id="edit">${icon('pencil')}<span>לשנות</span></button>
    </main>`);
  const msg = document.getElementById('end-msg');
  const retry = document.getElementById('retry');
  const watch = (p) => {
    retry.classList.add('hidden');
    msg.className = 'lead';
    msg.textContent = 'שומר/ת…';
    p.then(
      () => {
        msg.textContent = 'התשובות נשמרו. נתראה בסשן!';
      },
      (e) => {
        msg.className = 'err';
        msg.setAttribute('role', 'alert');
        msg.textContent = `השמירה נכשלה: ${e?.status ? e.message : 'אין חיבור לשרת'}. התשובות עוד לא נשמרו.`;
        retry.classList.remove('hidden');
      },
    );
  };
  if (saving) watch(saving);
  retry.onclick = () => watch(save());
  document.getElementById('edit').onclick = () => {
    state.done = false;
    renderStep(0);
  };
}

initTermPopup(); // term references open one shared popup
route();
