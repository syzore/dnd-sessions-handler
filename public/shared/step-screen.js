// The step screen shared by Session One and Session Two: markup builders and the wiring for one
// step. No state of its own: the caller owns `answers` and passes it in, and decides what
// next / skip / back do. Content text goes through richText (HTML) or optionLabel; raw [[term]]
// markup never reaches the screen. addEnglishAll stays per screen, in the caller's `screen()`.
import { icon } from '/shared/icons.js';
import { esc } from '/shared/lib.js';
import { richText, optionLabel } from '/shared/terms.js';
import { termInfoButton, stepLinkHtml } from '/shared/term-popup.js';

// A choice card whose option says `term:` gets an info button beside it, not inside the
// option <button> (D4). Player flow and DM compendium share the layout.
export function withInfo(o, card) {
  const info = o.term ? termInfoButton(o.term) : '';
  return info ? `<div class="opt-wrap">${card}${info}</div>` : card;
}

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
export const loreHtml = (st, secretHeading = '🤫 מה רק אתה יודע', pen) =>
  `<div class="lore-wrap">${loreSection(st.known, 'lore-known', 'מה כולם יודעים', pen)}${loreSection(st.secret, 'lore-secret', secretHeading, pen)}</div>`;

// Back button (when `back`) and, when n > 0, progress bar and i+1/n count.
export function topbar(i, n, back = true) {
  return `
    <header class="topbar">
      ${back ? `<button class="icon-btn" id="back" aria-label="חזרה">${icon('chevR')}</button>` : ''}
      ${n ? `<div class="progress"><div style="width:${Math.round(((i + 1) / n) * 100)}%"></div></div><div class="count">${i + 1}/${n}</div>` : ''}
    </header>`;
}

// The pick card list: one button per character, taken ones disabled. `taken` maps id -> name.
export function pickListHtml(characters, { taken = {}, selected = null } = {}) {
  return `<div class="grid one">${characters.map((c) => {
    const by = taken[c.id];
    return `
        <button class="opt ${selected === c.id ? 'sel' : ''}" data-id="${c.id}" ${by != null ? 'disabled' : ''}>
          <span class="opt-ic">${icon(c.icon || 'd20')}</span>
          <span class="opt-text"><span class="opt-label">${esc(c.name)}</span><span class="opt-sub">${esc(c.cls)}${by != null ? ` · נלקחה${by ? ` (${esc(by)})` : ''}` : ''}</span></span>
          <span class="opt-check">${icon('check')}</span>
        </button>`;
  }).join('')}</div>`;
}

const isChoice = (st) => st.type === 'choice';

// The body of one step: info lore, choice cards (+ "משהו אחר" box), or a text box; then the step link.
export function stepBodyHtml(st, answers) {
  const cur = answers[st.id];
  const cards = isChoice(st) && st.options.some((o) => o.description);
  const withOther = isChoice(st) && st.other !== false;
  const picked = (id) => (Array.isArray(cur) ? cur.includes(id) : cur === id);
  const body =
    st.type === 'info'
      ? loreHtml(st)
      : isChoice(st)
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
          <textarea class="big-text" id="other" rows="3" maxlength="1000">${esc(answers[`${st.id}_other`] || '')}</textarea></label>` : ''}`
      : `<textarea class="big-text" id="ans" rows="5" maxlength="2000">${esc(cur)}</textarea>`;
  return `${body}${stepLinkHtml(st.link)}`;
}

// The whole step screen (topbar, kicker, title, prompt, hint, body, footer). `contextHtml` is an
// optional pre-rendered block between the hint and the options; Session One never passes it.
// `kicker` is plain text and is escaped here.
export function stepScreenHtml({ st, i, n, kicker, answers, contextHtml = '' }) {
  const last = i === n - 1;
  return `
    ${topbar(i, n)}
    <main class="wrap q">
      <div class="kicker">${esc(kicker)}</div>
      <h1 class="q-title">${richText(st.title || st.prompt || '')}</h1>
      ${st.title && st.prompt ? `<p class="lead step-intro">${richText(st.prompt)}</p>` : ''}
      ${st.hint ? `<p class="hint">${richText(st.hint)}</p>` : ''}${contextHtml}
      ${stepBodyHtml(st, answers)}
      <div class="footer ${st.optional ? 'stack' : ''}">
        <button class="cta" id="next">${icon(last ? 'flag' : 'chevL')}<span>${last ? 'סיום' : 'המשך'}</span></button>
        ${st.optional ? `<button class="cta ghost" id="skip"><span>דלג</span></button>` : ''}
      </div>
    </main>`;
}

// Wire option clicks, free text, and the next/skip enable rules on a rendered step screen.
// Mutates `answers` (the caller's object). `onNext()` / `onSkip()` run after the answers are
// updated (skip has already deleted this step's answers); the caller saves and navigates.
// Returns { refresh } to re-run the enable rule.
export function wireStep(root, { st, answers, onNext, onSkip }) {
  const otherKey = `${st.id}_other`;
  const next = document.getElementById('next');
  const answered = () => {
    const v = answers[st.id];
    return (Array.isArray(v) ? v.length > 0 : !!v) || !!answers[otherKey]?.trim();
  };
  const textEmpty = () => st.type === 'text' && !String(answers[st.id] || '').trim();
  const refresh = () => (next.disabled = !st.optional && (isChoice(st) ? !answered() : textEmpty()));
  refresh();
  next.onclick = () => onNext();
  if (st.optional) {
    document.getElementById('skip').onclick = () => {
      delete answers[st.id];
      delete answers[otherKey];
      onSkip();
    };
  }
  if (isChoice(st)) {
    root.querySelectorAll('.opt').forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.id;
        if (st.multi) {
          const prev = Array.isArray(answers[st.id]) ? answers[st.id] : answers[st.id] ? [answers[st.id]] : [];
          const nextPicks = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
          if (nextPicks.length) answers[st.id] = nextPicks;
          else delete answers[st.id];
          b.classList.toggle('sel', nextPicks.includes(id));
          b.setAttribute('aria-pressed', nextPicks.includes(id));
        } else {
          answers[st.id] = id;
          root.querySelectorAll('.opt').forEach((x) => {
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
        if (e.target.value.trim()) answers[otherKey] = e.target.value;
        else delete answers[otherKey];
        refresh();
      };
    }
  } else if (st.type === 'text') {
    document.getElementById('ans').oninput = (e) => {
      answers[st.id] = e.target.value;
      refresh();
    };
  }
  return { refresh };
}
