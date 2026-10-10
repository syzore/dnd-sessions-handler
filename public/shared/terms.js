// Term references in content text: [[id]] and [[id|text]] (content/session-one/README.md).
// Pure string functions plus one DOM pass; nothing touches the DOM at import time,
// so node:test can import this file.
import { esc } from './lib.js';

let TERMS = {};
// The terms the server sent with the content: { <id>: { id, he, en, ... } }.
export const setTerms = (terms) => (TERMS = terms || {});
// Own keys only: "constructor" or "__proto__" must not find Object.prototype (F7).
// Every term, in the order the server sent them (the DM lore view's terms section).
export const allTerms = () => Object.values(TERMS);
export const termOf = (id) => (Object.hasOwn(TERMS, id) ? TERMS[id] : undefined);

// [[id]] or [[id|text]]; the text is anything except "]]" (D2), so it may hold a single "]".
const REF = /\[\[([^\]|]*)(?:\|((?:(?!\]\]).)*))?\]\]/g;

// The text a reference shows: the text after "|", else the term's Hebrew name.
// An id the client does not know (F7) shows its "|" text, else the bare id.
const display = (id, text) => text ?? termOf(id)?.he ?? id;

// Display text with no markup: for buttons' attributes, DM answer labels, <title>.
export const plainText = (str) => String(str ?? '').replace(REF, (_, id, text) => display(id, text));

// A name-only term (no blurb, image or link) has nothing to show in a popup (F15).
export const hasPopup = (t) => !!(t && (t.blurb || t.images?.length || t.links?.length));

// Escaped HTML with each known reference marked [data-term] for the English pass.
// - a term with popup content: a trigger button the term popup opens from (D6)
// - a name-only term, or any term when inert: a plain span (F15, D4)
// - an unknown id (F7), or a reference to `self` (the popup's own term, F16): plain text,
//   with no data-term and so no English
// inert: inside a control (an option <button>, a <summary>): never a link, only text (D4).
export function richText(str, { inert = false, self = null } = {}) {
  const s = String(str ?? '');
  let out = '';
  let last = 0;
  for (const m of s.matchAll(REF)) {
    const [whole, id, text] = m;
    out += esc(s.slice(last, m.index));
    last = m.index + whole.length;
    const shown = esc(display(id, text));
    const t = termOf(id);
    if (!t || id === self) out += shown;
    else if (!inert && hasPopup(t))
      out += `<button type="button" class="term term-ref" aria-haspopup="dialog" data-term="${esc(id)}">${shown}</button>`;
    else out += `<span class="term-ref${inert ? ' term-inert' : ''}" data-term="${esc(id)}">${shown}</span>`;
  }
  return out + esc(s.slice(last));
}

// An option label (D4): plain text, because it sits inside the option <button>. With
// `term:`, the whole label counts as a mention of that term for the English rule, so the
// card reads "בהאמוט (Bahamut)". A `term:` the client does not have adds nothing (F7).
export function optionLabel(o) {
  const html = richText(o.label, { inert: true });
  return o.term && termOf(o.term) ? `<span class="term-ref term-inert" data-term="${esc(o.term)}">${html}</span>` : html;
}

// First-mention English (D5): in document order, the first reference to each term
// inside `scope` gets " (English)" after it. Run once per screen, after the HTML is built.
// A nested element marked data-term-scope is its own scope and is skipped here.
export function addEnglish(scope) {
  const seen = new Set();
  for (const el of scope.querySelectorAll('[data-term]')) {
    if (el.closest('[data-term-scope]') !== (scope.matches('[data-term-scope]') ? scope : null)) continue;
    const t = termOf(el.dataset.term);
    if (!t || seen.has(t.id)) continue;
    seen.add(t.id);
    const en = document.createElement('span');
    en.className = 'term-en';
    en.dir = 'ltr';
    en.lang = 'en';
    en.textContent = `(${t.en})`;
    el.after(' ', en);
  }
}

// Every scope on a rendered screen: each [data-term-scope] element, or the whole root if none.
export function addEnglishAll(root) {
  const scopes = root.querySelectorAll('[data-term-scope]');
  if (scopes.length) scopes.forEach(addEnglish);
  else addEnglish(root);
}
