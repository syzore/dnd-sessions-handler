// The term popup (spec D6): one native <dialog> for the whole app, opened from any
// <button class="term" data-term> that richText() renders. A bottom sheet on narrow
// screens, a centered card on wide ones (style.css, "term popup").
//
// termPopupHtml() is pure (node:test imports it). initTermPopup() touches the DOM.
import { esc } from './lib.js';
import { icon } from './icons.js';
import { termOf, richText, addEnglish, hasPopup } from './terms.js';

export const CATEGORY_LABELS = {
  race: 'גזע',
  class: 'מקצוע',
  place: 'מקום',
  god: 'אל',
  faction: 'פלג',
  person: 'דמות',
  concept: 'מושג',
  background: 'רקע',
};
const MAX_STACK = 10;
const NAME_ID = 'term-pop-name';
// What opens the popup from the page: a term reference in text, or a choice card's info button.
const TRIGGER = 'button.term[data-term], button.term-info[data-term-info]';
const triggerId = (el) => el.dataset.term ?? el.dataset.termInfo;

const host = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

// A step's one external link (D9), shown after the answer area. Plain text title, host when none.
export function stepLinkHtml(link) {
  if (!link) return '';
  const h = host(link.url);
  return `<a class="step-link" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer" dir="auto">
    <span class="tp-link-text">${esc(link.title || h)}</span>${link.title ? `<span class="tp-link-host" dir="ltr">${esc(h)}</span>` : ''}
    <span class="tp-link-ic">${icon('external')}</span></a>`;
}

// The popup's inner HTML for one term. canBack: show the in-popup back button.
// Empty sections are left out (F17, F18). The image area holds the first URL; the
// DOM side walks the rest on error (F8). Blurb references to the term itself are plain (F16).
export function termPopupHtml(t, { canBack = false } = {}) {
  const img = t.images?.length
    ? `<div class="tp-img"><img src="${esc(t.images[0])}" alt="${esc(`${t.he} (${t.en})`)}" loading="lazy" referrerpolicy="no-referrer" decoding="async"></div>`
    : '';
  const blurb = t.blurb
    ? `<div class="tp-body" data-term-scope>${t.blurb.split(/\n\n+/).map((p) => `<p>${richText(p, { self: t.id })}</p>`).join('')}</div>`
    : '';
  const links = t.links?.length
    ? `<section class="tp-links"><h3>לקריאה נוספת</h3><ul>${t.links.map((l) => {
        const h = host(l.url);
        return `<li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" dir="auto">
          <span class="tp-link-text">${esc(l.title || h)}</span>${l.title ? `<span class="tp-link-host" dir="ltr">${esc(h)}</span>` : ''}
          <span class="tp-link-ic">${icon('external')}</span></a></li>`;
      }).join('')}</ul></section>`
    : '';
  return `
    <header class="tp-head">
      <div class="tp-bar">
        ${canBack ? `<button type="button" class="icon-btn tp-back" aria-label="חזרה">${icon('chevR')}</button>` : ''}
        <button type="button" class="icon-btn tp-close" aria-label="סגירה">${icon('x')}</button>
      </div>
      <div class="kicker">${esc(CATEGORY_LABELS[t.category] || '')}</div>
      <h2 class="tp-name" id="${NAME_ID}">${esc(t.he)}</h2>
      <div class="tp-en" dir="ltr" lang="en">${esc(t.en)}</div>
      ${t.aliases?.length ? `<p class="tp-aka">נקרא גם: ${t.aliases.map(esc).join(', ')}</p>` : ''}
    </header>
    ${img}${blurb}${links}`;
}

// The info button beside a choice card whose option says `term:` (D4). It sits next to the
// option <button>, never inside it. Empty when the client lacks the term (F7) or the term
// is name-only and has no popup (F15). data-term-info, not data-term: the English pass
// counts data-term elements as mentions.
export function termInfoButton(id) {
  const t = termOf(id);
  if (!hasPopup(t)) return '';
  return `<button type="button" class="term-info" aria-haspopup="dialog" data-term-info="${esc(id)}" aria-label="${esc(`מידע על ${t.he}`)}">${icon('info')}</button>`;
}

let dialog = null;
let sheet = null;
let stack = []; // term ids, the last one is shown
let opener = null; // the element focus returns to
let pushed = false; // our history entry is the current one
let skipPops = 0; // popstate events still to come from our own history.back()
let wantPush = false; // reopened before that back landed: push once it has
let render = 0; // guards image error handlers from an earlier render
let active = false; // opened and not yet cleaned up

function show() {
  const t = termOf(stack[stack.length - 1]);
  if (!t) return close();
  const n = ++render;
  sheet.innerHTML = termPopupHtml(t, { canBack: stack.length > 1 });
  sheet.scrollTop = 0;
  const body = sheet.querySelector('.tp-body');
  if (body) addEnglish(body);
  const img = sheet.querySelector('.tp-img img');
  if (img) {
    let i = 0;
    img.onerror = () => {
      if (n !== render) return;
      if (++i < t.images.length) img.src = t.images[i];
      else img.closest('.tp-img').remove();
    };
    img.onload = () => n === render && img.closest('.tp-img').classList.add('loaded');
  }
  sheet.querySelector('.tp-close').focus();
}

function open(id, from) {
  if (!termOf(id)) return;
  // Esc closed the dialog natively and its close event is still queued: clean up first,
  // or this open would push a second history entry.
  if (active && !dialog.open) finish();
  if (dialog.open) {
    opener = from; // a tap on another page term replaces the content (F23)
    stack = [id];
    return show();
  }
  opener = from;
  active = true;
  stack = [id];
  document.documentElement.classList.add('tp-lock');
  dialog.showModal();
  // history.back() is async: pushing before it lands would let it pop the new entry.
  if (skipPops) wantPush = true;
  else pushEntry();
  show();
}

function pushEntry() {
  history.pushState({ termPopup: true }, '');
  pushed = true;
}

function navigate(id) {
  if (!termOf(id)) return;
  stack.push(id);
  if (stack.length > MAX_STACK) stack.shift();
  show();
}

// X, backdrop and browser back. Cleans up at once: the dialog's own close event comes a
// task later, after a quick reopen could already have happened.
function close() {
  if (dialog.open) dialog.close();
  finish();
}

// Esc closes the dialog natively; its close event lands here. Ignore it when the dialog
// is open again (reopened before the event arrived) or already cleaned up.
function onCloseEvent() {
  if (!dialog.open && active) finish();
}

function finish() {
  if (!active) return;
  active = false;
  document.documentElement.classList.remove('tp-lock');
  stack = [];
  wantPush = false;
  render++;
  sheet.innerHTML = '';
  if (pushed) {
    pushed = false;
    skipPops++;
    history.back(); // drop our entry, so closing leaves no extra history
  }
  if (opener?.isConnected) opener.focus({ preventScroll: true });
  opener = null;
}

// The page term under a backdrop press, if any. Hit testing skips the inert page
// (elementsFromPoint returns only the dialog and <html>), so compare the term boxes.
// getClientRects: a term can wrap onto two lines.
// A box is not a hit when the user cannot see the term: in a closed <details> body, or
// under a sticky/fixed element such as the top bar (that tap closes instead).
const inside = (x, y, r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
function coveredAt(x, y, el) {
  for (const c of document.body.querySelectorAll('*')) {
    if (c === dialog || c.contains(el)) continue;
    const pos = getComputedStyle(c).position;
    if ((pos === 'sticky' || pos === 'fixed') && inside(x, y, c.getBoundingClientRect())) return true;
  }
  return false;
}
function pageTermAt(x, y) {
  for (const el of document.querySelectorAll(TRIGGER)) {
    if (dialog.contains(el) || el.closest('details:not([open]) > :not(summary)')) continue;
    if (!el.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true })) continue;
    for (const r of el.getClientRects()) {
      if (inside(x, y, r)) return coveredAt(x, y, el) ? null : el;
    }
  }
  return null;
}

// Call once per page. Safe to call again.
export function initTermPopup() {
  if (dialog) return;
  // Reloaded with the popup open: our entry came back without the popup. Make it plain.
  if (history.state?.termPopup) history.replaceState(null, '');
  dialog = document.createElement('dialog');
  dialog.className = 'term-pop';
  dialog.setAttribute('aria-labelledby', NAME_ID);
  dialog.innerHTML = '<div class="tp-sheet"></div>';
  sheet = dialog.firstElementChild;
  document.body.append(dialog);

  dialog.addEventListener('close', onCloseEvent);
  // Backdrop: a press that starts and ends on the dialog itself, outside the sheet.
  let downOnBackdrop = false;
  dialog.addEventListener('pointerdown', (e) => (downOnBackdrop = e.target === dialog));
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog && downOnBackdrop) {
      // showModal() makes the page inert, so a tap on another page term lands here (F23).
      const ref = pageTermAt(e.clientX, e.clientY);
      return ref ? open(triggerId(ref), ref) : close();
    }
    if (e.target.closest('.tp-close')) return close();
    if (e.target.closest('.tp-back')) {
      stack.pop();
      return show();
    }
    const ref = e.target.closest('button.term[data-term]');
    if (!ref) return;
    // show() detaches the clicked button, so the page listener below could not tell it came from here
    e.stopPropagation();
    navigate(ref.dataset.term);
  });
  // Triggers on the page (the dialog's own clicks are handled above).
  document.addEventListener('click', (e) => {
    const ref = e.target.closest(TRIGGER);
    if (ref) open(triggerId(ref), ref);
  });
  // Browser / Android back while open: close, stay on the page.
  window.addEventListener('popstate', () => {
    if (skipPops) {
      if (--skipPops === 0 && wantPush && dialog.open) {
        wantPush = false;
        pushEntry();
      }
      return;
    }
    if (!pushed) return;
    pushed = false;
    close();
  });
}
