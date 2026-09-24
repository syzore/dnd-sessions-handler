import { icon } from '/shared/icons.js';
import { esc, api, playerId, savedName, rememberName, adminKey, rememberAdminKey, copyButton } from '/shared/lib.js';

const $app = document.getElementById('app');

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const DAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const VOTE = {
  yes: { icon: 'check', label: 'מתאים' },
  maybe: { icon: 'maybe', label: 'אולי' },
  no: { icon: 'x', label: 'לא מתאים' },
};
const CYCLE = { undefined: 'yes', yes: 'maybe', maybe: 'no', no: undefined };
const LOCAL_TZ = 'Asia/Jerusalem';

// ---------------------------------------------------------------- dates (local, YYYY-MM-DD)
const pad = (n) => String(n).padStart(2, '0');
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const today = () => toStr(new Date());
const shortDate = (s) => {
  const d = parse(s);
  return `${DAYS[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}`;
};
const longDate = (s) => {
  const d = parse(s);
  return `יום ${DAYS[d.getDay()]}, ${d.getDate()} ב${MONTHS[d.getMonth()]}`;
};

function googleCalUrl(title, { date, time, place }) {
  const start = parse(date);
  const [h, m] = time.split(':').map(Number);
  start.setHours(h, m);
  const end = new Date(start.getTime() + 4 * 3600 * 1000);
  const fmt = (d) => `${toStr(d).replaceAll('-', '')}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const q = new URLSearchParams({ action: 'TEMPLATE', text: `D&D — ${title}`, dates: `${fmt(start)}/${fmt(end)}`, ctz: LOCAL_TZ });
  if (place) q.set('location', place);
  return `https://calendar.google.com/calendar/render?${q}`;
}

function screen(html) {
  $app.innerHTML = html;
}

// ---------------------------------------------------------------- routing

function renderCreate() {
  screen(`
    <main class="wrap center">
      <div class="hero-icon">${icon('calendar')}</div>
      <h1 class="q-title">מתי משחקים?</h1>
      <p class="lead">כל אחד מסמן מתי מתאים לו, וה-DM קובע ערב. יש כבר סשן אפס? אפשר לפתוח את התיאום מתוכו, וזו תהיה אותה קבוצה.</p>
      <label class="field">
        <span>איך נקרא לקבוצה?</span>
        <input id="title" maxlength="60" placeholder="למשל: החבר׳ה של יום חמישי" autocomplete="off">
      </label>
      <button class="cta" id="create">${icon('calendar')}<span>יוצרים קבוצה</span></button>
      <p class="err" id="err"></p>
    </main>`);
  const btn = document.getElementById('create');
  btn.onclick = async () => {
    btn.disabled = true;
    try {
      const { code, adminKey: key } = await api('POST', '/api/sz/sessions', { title: document.getElementById('title').value });
      rememberAdminKey(code, key);
      location.href = `/schedule/${code}`;
    } catch (e) {
      document.getElementById('err').textContent = e.message;
      btn.disabled = false;
    }
  };
}

// ---------------------------------------------------------------- main
const st = { code: null, key: null, data: null, me: null, name: '', naming: false };

let pollTimer = null;
function startPolling() {
  clearInterval(pollTimer);
  pollTimer = setInterval(refresh, 8000);
}

async function load() {
  const q = new URLSearchParams({ pid: playerId() });
  if (st.key) q.set('key', st.key);
  st.data = await api('GET', `/api/sched/${st.code}?${q}`);
  const mine = st.data.people.find((p) => p.me);
  st.me = { weekly: mine?.weekly || {}, votes: mine?.votes || {} };
  st.name = mine?.name || st.data.me?.name || savedName();
}

async function start(code) {
  st.code = code;
  st.key = adminKey(code);
  screen('<main class="wrap center"><div class="spinner"></div></main>');
  try {
    await load();
  } catch {
    return screen(`
      <main class="wrap center">
        <div class="hero-icon">${icon('question')}</div>
        <h1 class="q-title">הקבוצה לא נמצאה</h1>
        <p class="lead">כדאי לבדוק את הקישור.</p>
        <a class="cta" href="/schedule">${icon('calendar')}<span>ליצור קבוצה חדשה</span></a>
      </main>`);
  }
  if (!st.name) return renderName();
  paint();
  startPolling();
}

async function refresh() {
  if (st.naming || document.hidden || document.activeElement?.matches('input, textarea')) return;
  const before = JSON.stringify(st.data);
  await load().catch(() => {});
  if (JSON.stringify(st.data) !== before) paint(true);
}

function renderName() {
  st.naming = true;
  screen(`
    <main class="wrap center">
      <div class="kicker">${esc(st.data.title)}</div>
      <div class="hero-icon">${icon('calendar')}</div>
      <h1 class="q-title">מתי משחקים?</h1>
      <label class="field">
        <span>איך קוראים לך?</span>
        <input id="name" maxlength="40" autocomplete="given-name" value="${esc(st.name)}">
      </label>
      <button class="cta" id="go" ${st.name ? '' : 'disabled'}>${icon('chevL')}<span>המשך</span></button>
    </main>`);
  const input = document.getElementById('name');
  const btn = document.getElementById('go');
  input.oninput = () => (btn.disabled = !input.value.trim());
  input.onkeydown = (e) => e.key === 'Enter' && !btn.disabled && btn.click();
  btn.onclick = async () => {
    st.name = input.value.trim();
    rememberName(st.name);
    await saveMe({});
    st.naming = false;
    paint();
    startPolling();
  };
}

async function saveMe(patch) {
  await api('PUT', `/api/sched/${st.code}/me/${playerId()}`, { name: st.name, ...patch }).catch(() => {});
  await load().catch(() => {});
}

async function saveAdmin(patch) {
  await api('PUT', `/api/sched/${st.code}/admin?key=${encodeURIComponent(st.key)}`, patch);
  await load();
  paint(true);
}

// ---------------------------------------------------------------- tallies
function tallyDate(date) {
  const t = { yes: [], maybe: [], no: [] };
  for (const p of st.data.people) if (p.votes?.[date]) t[p.votes[date]].push(p.name);
  const pending = st.data.people.length - t.yes.length - t.maybe.length - t.no.length;
  const quorum = st.data.quorum;
  return {
    ...t,
    pending,
    score: t.yes.length * 2 + t.maybe.length,
    meets: !quorum || t.yes.length >= quorum,
    // Can't reach the minimum even if every maybe and non-voter says yes
    impossible: quorum > 0 && t.yes.length + t.maybe.length + pending < quorum,
  };
}

function tallyWeekday(day) {
  const t = { yes: 0, maybe: 0, no: 0 };
  for (const p of st.data.people) if (p.weekly?.[day]) t[p.weekly[day]]++;
  return t;
}

// ---------------------------------------------------------------- paint
function paint(keepScroll = false) {
  const y = window.scrollY;
  const d = st.data;
  const dates = d.dates.filter((x) => x >= today());
  const n = d.people.length;

  const ranked = dates
    .map((date) => ({ date, t: tallyDate(date) }))
    .filter(({ t }) => !t.impossible && t.yes.length)
    .sort((a, b) => b.t.score - a.t.score || a.date.localeCompare(b.date));
  const best = ranked[0];

  screen(`
    <main class="wrap sched">
      <div class="kicker">${esc(d.title)}</div>
      <h1 class="q-title">מתי משחקים?</h1>
      <p class="hint">${n} ${n === 1 ? 'שחקן' : 'שחקנים'}${d.quorum ? ` · צריך לפחות ${d.quorum}` : ''} · השם שלך: <button class="linklike" id="rename">${esc(st.name)} ${icon('pencil')}</button></p>

      ${d.locked ? lockedCard(d) : ''}

      ${
        dates.length
          ? `
        ${best && !d.locked ? bestCard(best) : ''}
        <h2 class="sec">${icon('calendar')} אילו ערבים מתאימים לך?</h2>
        <div class="dates">${dates.map((date) => dateCard(date, best?.date === date)).join('')}</div>`
          : `<div class="card empty-note">${icon('moon')}<p>ה-DM עוד לא הציע תאריכים. בינתיים, סמנו מה מתאים לכם בדרך כלל.</p></div>`
      }

      <h2 class="sec">${icon('moon')} באופן כללי, אילו ערבים בשבוע מתאימים?</h2>
      <p class="hint">הקישו כדי להחליף: מתאים → אולי → לא</p>
      <div class="week">${DAYS.map((_, i) => weekTile(i)).join('')}</div>

      <div class="footer stack">
        <button class="cta ghost" id="share">${icon('link')}<span>לשתף את הקישור</span></button>
        <a class="cta ghost" href="/session-zero/${d.code}/results">${icon('scroll')}<span>לחוזה הקבוצתי (סשן אפס)</span></a>
      </div>

      ${d.isAdmin ? dmPanel(d) : ''}
    </main>`);
  if (keepScroll) window.scrollTo(0, y);
  wire();
}

function lockedCard(d) {
  const l = d.locked;
  return `
    <section class="locked">
      <div class="locked-ic">${icon('lock')}</div>
      <div class="kicker">נקבע!</div>
      <h2>${esc(longDate(l.date))}</h2>
      <p class="locked-meta">${icon('moon')} ${esc(l.time)}${l.place ? ` · ${icon('pin')} ${esc(l.place)}` : ''}</p>
      <div class="row">
        <a class="cta" href="${esc(googleCalUrl(d.title, l))}" target="_blank" rel="noopener">${icon('calendar')}<span>הוספה ליומן Google</span></a>
        <a class="cta ghost" href="/api/sched/${d.code}/event.ics">${icon('download')}<span>קובץ ליומן (אפל / אאוטלוק)</span></a>
      </div>
    </section>`;
}

function bestCard({ date, t }) {
  return `
    <section class="best">
      <span class="best-ic">${icon('flag')}</span>
      <div>
        <div class="kicker">הכי מתאים כרגע</div>
        <strong>${esc(shortDate(date))}</strong>
        <span class="muted"> · ${t.yes.length} מתאים${t.maybe.length ? `, ${t.maybe.length} אולי` : ''}</span>
      </div>
    </section>`;
}

function dateCard(date, isBest) {
  const t = tallyDate(date);
  const mine = st.me.votes[date];
  const n = st.data.people.length || 1;
  const q = st.data.quorum;
  const missing = q && t.yes.length < q ? q - t.yes.length : 0;
  const locked = st.data.locked?.date === date;
  return `
    <article class="date ${t.impossible ? 'dim' : ''} ${isBest ? 'is-best' : ''} ${locked ? 'is-locked' : ''}" data-date="${date}">
      <header>
        <h3>${esc(shortDate(date))}</h3>
        ${locked ? `<span class="badge gold">${icon('lock')} נקבע</span>` : isBest ? `<span class="badge gold">הכי טוב</span>` : ''}
        ${t.impossible ? `<span class="badge">לא יגיעו למינימום</span>` : missing ? `<span class="badge">חסרים ${missing}</span>` : q ? `<span class="badge ok">${icon('check')} יש מספיק</span>` : ''}
      </header>
      <div class="tally"><span class="t-yes" style="width:${(t.yes.length / n) * 100}%"></span><span class="t-maybe" style="width:${(t.maybe.length / n) * 100}%"></span></div>
      <p class="who">
        ${t.yes.length ? `<span class="w-yes">${icon('check')} ${t.yes.map(esc).join(', ')}</span>` : ''}
        ${t.maybe.length ? `<span class="w-maybe">${icon('maybe')} ${t.maybe.map(esc).join(', ')}</span>` : ''}
        ${t.no.length ? `<span class="w-no">${icon('x')} ${t.no.map(esc).join(', ')}</span>` : ''}
        ${!t.yes.length && !t.maybe.length && !t.no.length ? '<span class="muted">עוד אף אחד לא ענה</span>' : ''}
      </p>
      <div class="votes">
        ${Object.entries(VOTE)
          .map(([v, o]) => `<button class="vote v-${v} ${mine === v ? 'sel' : ''}" data-vote="${v}">${icon(o.icon)}<span>${o.label}</span></button>`)
          .join('')}
      </div>
      ${st.data.isAdmin && !locked ? `<button class="chip lock-btn" data-lock="${date}">${icon('lock')}<span>לקבוע את הערב הזה</span></button>` : ''}
    </article>`;
}

function weekTile(day) {
  const mine = st.me.weekly[day];
  const t = tallyWeekday(day);
  return `
    <button class="wk ${mine ? `v-${mine} sel` : ''}" data-day="${day}">
      <span class="wk-day">${DAYS[day]}</span>
      <span class="wk-ic">${mine ? icon(VOTE[mine].icon) : ''}</span>
      <span class="wk-lbl">${mine ? VOTE[mine].label : 'לא סומן'}</span>
      <span class="wk-group">${t.yes ? `<b>${t.yes}</b> ✓` : ''}${t.maybe ? ` ${t.maybe} ?` : ''}${!t.yes && !t.maybe ? '&nbsp;' : ''}</span>
    </button>`;
}

// ---------------------------------------------------------------- DM
function dmPanel(d) {
  const first = new Date();
  first.setDate(first.getDate() - first.getDay()); // this week's Sunday
  const t0 = today();
  const n = d.people.length || 1;
  const cells = [];
  for (let i = 0; i < 56; i++) {
    const day = new Date(first);
    day.setDate(first.getDate() + i);
    const s = toStr(day);
    const w = tallyWeekday(day.getDay());
    const heat = (w.yes + w.maybe / 2) / n;
    const monthStart = day.getDate() === 1 || i === 0;
    cells.push(`
      <button class="cal-d ${d.dates.includes(s) ? 'sel' : ''} ${d.locked?.date === s ? 'locked' : ''}" data-cal="${s}" ${s < t0 ? 'disabled' : ''} style="--heat:${heat.toFixed(2)}">
        ${monthStart ? `<span class="cal-m">${MONTHS[day.getMonth()]}</span>` : ''}${day.getDate()}
      </button>`);
  }
  const l = d.locked || {};
  return `
    <section class="dm">
      <h2>${icon('eye')} רק ל-DM</h2>

      <h3 class="dm-h">הציעו תאריכים</h3>
      <p class="hint">הקישו על ערבים כדי להציע אותם לקבוצה. ככל שיום בשבוע מתאים ליותר אנשים, הוא צבוע חזק יותר.</p>
      <div class="cal">
        ${DAY_LETTERS.map((x) => `<span class="cal-h">${x}</span>`).join('')}
        ${cells.join('')}
      </div>

      <h3 class="dm-h">מינימום שחקנים</h3>
      <div class="stepper">
        <button class="icon-btn" id="q-plus" aria-label="עוד">+</button>
        <span id="q-val">${d.quorum || 'ללא'}</span>
        <button class="icon-btn" id="q-minus" aria-label="פחות">−</button>
      </div>

      <h3 class="dm-h">פרטי הערב שנקבע</h3>
      <div class="lock-fields">
        <label class="field"><span>שעה</span><input type="time" id="l-time" value="${esc(l.time || '20:00')}"></label>
        <label class="field"><span>איפה?</span><input id="l-place" maxlength="120" placeholder="לא חובה" value="${esc(l.place || '')}"></label>
      </div>
      ${
        d.locked
          ? `<div class="row"><button class="cta" id="l-save">${icon('check')}<span>לעדכן</span></button><button class="cta ghost" id="unlock">${icon('unlock')}<span>לבטל קביעה</span></button></div>`
          : '<p class="hint">כדי לקבוע, לחצו על "לקבוע את הערב הזה" באחד התאריכים.</p>'
      }
    </section>`;
}

// ---------------------------------------------------------------- events
function wire() {
  const d = st.data;
  copyButton('share', `${location.origin}/schedule/${d.code}`);

  document.getElementById('rename').onclick = () => renderName();

  $app.querySelectorAll('.date').forEach((card) => {
    const date = card.dataset.date;
    card.querySelectorAll('.vote').forEach((b) => {
      b.onclick = async () => {
        const v = b.dataset.vote;
        const votes = { ...st.me.votes };
        if (votes[date] === v) delete votes[date];
        else votes[date] = v;
        st.me.votes = votes;
        card.querySelectorAll('.vote').forEach((x) => x.classList.toggle('sel', x.dataset.vote === votes[date]));
        await saveMe({ votes });
        paint(true);
      };
    });
  });

  $app.querySelectorAll('.wk').forEach((b) => {
    b.onclick = async () => {
      const day = b.dataset.day;
      const weekly = { ...st.me.weekly };
      const next = CYCLE[weekly[day]];
      if (next) weekly[day] = next;
      else delete weekly[day];
      st.me.weekly = weekly;
      await saveMe({ weekly });
      paint(true);
    };
  });

  if (!d.isAdmin) return;

  $app.querySelectorAll('[data-cal]').forEach((b) => {
    b.onclick = () => {
      const s = b.dataset.cal;
      const dates = d.dates.includes(s) ? d.dates.filter((x) => x !== s) : [...d.dates, s];
      saveAdmin({ dates });
    };
  });
  document.getElementById('q-plus').onclick = () => saveAdmin({ quorum: d.quorum + 1 });
  document.getElementById('q-minus').onclick = () => saveAdmin({ quorum: Math.max(0, d.quorum - 1) });

  const lockDetails = () => ({
    time: document.getElementById('l-time').value || '20:00',
    place: document.getElementById('l-place').value,
  });
  $app.querySelectorAll('[data-lock]').forEach((b) => {
    b.onclick = () => {
      saveAdmin({ locked: { date: b.dataset.lock, ...lockDetails() } });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  });
  const save = document.getElementById('l-save');
  if (save) save.onclick = () => saveAdmin({ locked: { date: d.locked.date, ...lockDetails() } });
  const unlock = document.getElementById('unlock');
  if (unlock) unlock.onclick = () => saveAdmin({ locked: null });
}

// ---------------------------------------------------------------- boot
const parts = location.pathname.split('/').filter(Boolean);
if (parts.length === 1) renderCreate();
else start(parts[1].toUpperCase());
