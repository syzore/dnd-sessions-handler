// The step screen shared by Session One and Session Two: markup builders and the wiring for one
// step. No state of its own: the caller owns `answers` and passes it in, and decides what
// next / skip / back do. Content text goes through richText (HTML) or optionLabel; raw [[term]]
// markup never reaches the screen. addEnglishAll stays per screen, in the caller's `screen()`.
import { icon } from '/shared/icons.js';
import { esc } from '/shared/lib.js';
import { richText, richParas, optionLabel } from '/shared/terms.js';
import { termInfoButton, stepLinkHtml } from '/shared/term-popup.js';
import { RANDOM_CARD_ID, countState, isLocked, canAdvance, drawRandom } from '/shared/step-rules.js';

export { RANDOM_CARD_ID, countState, isLocked, canAdvance, drawRandom };

// A choice card whose option says `term:` gets an info button beside it, not inside the
// option <button> (D4). Player flow and DM compendium share the layout.
export function withInfo(o, card) {
  const info = o.term ? termInfoButton(o.term) : '';
  return info ? `<div class="opt-wrap">${card}${info}</div>` : card;
}

// An info step's image and known/secret sections (player flow and DM compendium).
// `pen` (lore view, edit mode only) turns an item into its pencil button, or '' for none.
// An item's text: "\n\n" between paragraphs (one <p> each), "\n" a line break (<br>). A heading
// item (title, no text) has no <p> and the class lore-head (no divider before the next item).
// [[refs]] never span a line (the parser checks each line), so each line goes through richText.
const loreParas = (text) =>
  text ? text.split('\n\n').map((p) => `<p>${p.split('\n').map((ln) => richText(ln)).join('<br>')}</p>`).join('') : '';
const loreSection = (items, cls, heading, pen) =>
  items?.length
    ? `<section class="lore ${cls}"><h2 class="lore-h">${esc(heading)}</h2>${items.map((it) => {
        const pencil = pen ? pen(it) : '';
        return `
        <div class="lore-item${it.text ? '' : ' lore-head'}${pencil ? ' ed-host' : ''}">${it.title ? `<h3 class="lore-t">${richText(it.title)}</h3>` : ''}${loreParas(it.text)}${pencil}</div>`;
      }).join('')}</section>`
    : '';
// The step's image, at the top: `secretImage` (from ### secret; contentFor sends it only to the
// character's own player and the DM) wins over `image` (from ### known). The parser allows one.
const loreImage = (img) =>
  img ? `<figure class="lore-img"><img src="${esc(img.src)}" alt="${esc(img.alt)}" decoding="async" referrerpolicy="no-referrer"></figure>` : '';
export const loreHtml = (st, secretHeading = '🤫 מה רק אתה יודע', pen) =>
  `<div class="lore-wrap">${loreImage(st.secretImage || st.image)}${loreSection(st.known, 'lore-known', 'מה כולם יודעים', pen)}${loreSection(st.secret, 'lore-secret', secretHeading, pen)}</div>`;

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

// `count: n` counter, in the hint style. Empty for steps without a count.
const countHintHtml = (st, cur) => {
  const cs = countState(st, cur);
  return cs ? `<p class="hint count-hint" id="count-hint" aria-live="polite">${esc(cs.label)}</p>` : '';
};

// `random: true` on a single-choice step: the last card, "אקראי 🎲". Never an answer itself.
const randomCardHtml = (cards) => `
          <button class="opt ${cards ? 'opt-card' : ''}" data-id="${RANDOM_CARD_ID}" id="random-card">
            <span class="opt-emoji" aria-hidden="true">🎲</span>
            <span class="opt-text">
              <span class="opt-label">אקראי 🎲</span>
              <span class="opt-desc">בחירה אקראית מתוך האפשרויות</span>
            </span>
          </button>`;

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
      ? `${countHintHtml(st, cur)}<div class="grid ${cards ? 'one cards' : ''}">${st.options.map((o) => withInfo(o, `
          <button class="opt ${cards ? 'opt-card' : ''} ${picked(o.id) ? 'sel' : ''}" data-id="${o.id}" aria-pressed="${picked(o.id)}"${isLocked(st, cur, o.id) ? ' aria-disabled="true"' : ''}>
            ${o.emoji ? `<span class="opt-emoji" aria-hidden="true">${esc(o.emoji)}</span>` : ''}
            <span class="opt-text">
              <span class="opt-label">${optionLabel(o)}</span>
              ${o.subtitle ? `<span class="opt-sub">${richText(o.subtitle, { inert: true })}</span>` : ''}
              ${o.description ? `<span class="opt-desc">${richParas(o.description, { inert: true })}</span>` : ''}
            </span>
            <span class="opt-check">${icon('check')}</span>
          </button>`)).join('')}${st.random && !st.multi ? randomCardHtml(cards) : ''}</div>${st.random && !st.multi ? '<p class="sr-only" id="random-live" aria-live="polite"></p>' : ''}${withOther ? `
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
  const refresh = () => {
    next.disabled = !st.optional && !canAdvance(st, answers);
    if (!countState(st, answers[st.id])) return;
    // count step: update the counter and lock/unlock the unpicked cards
    const hint = document.getElementById('count-hint');
    if (hint) hint.textContent = countState(st, answers[st.id]).label;
    root.querySelectorAll('.opt').forEach((x) => {
      if (isLocked(st, answers[st.id], x.dataset.id)) x.setAttribute('aria-disabled', 'true');
      else x.removeAttribute('aria-disabled');
    });
  };
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
        let id = b.dataset.id;
        let card = b;
        if (id === RANDOM_CARD_ID) {
          id = drawRandom(st.options, answers[st.id]);
          if (id == null) return;
          card = [...root.querySelectorAll('.opt')].find((x) => x.dataset.id === id);
          const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          card.scrollIntoView?.({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
          const live = document.getElementById('random-live');
          if (live) live.textContent = `נבחר: ${card.querySelector('.opt-label')?.textContent.trim() ?? id}`;
        }
        if (card.getAttribute('aria-disabled') === 'true') return;
        if (st.multi) {
          const prev = Array.isArray(answers[st.id]) ? answers[st.id] : answers[st.id] ? [answers[st.id]] : [];
          const nextPicks = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
          if (nextPicks.length) answers[st.id] = nextPicks;
          else delete answers[st.id];
          card.classList.toggle('sel', nextPicks.includes(id));
          card.setAttribute('aria-pressed', nextPicks.includes(id));
        } else {
          answers[st.id] = id;
          root.querySelectorAll('.opt').forEach((x) => {
            if (x.dataset.id === RANDOM_CARD_ID) return;
            x.classList.toggle('sel', x === card);
            x.setAttribute('aria-pressed', x === card);
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
