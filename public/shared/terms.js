// Term references in content text: [[id]] and [[id|text]] (content/session-one/README.md).
// Pure string functions plus one DOM pass; nothing touches the DOM at import time,
// so node:test can import this file.
import { esc } from './lib.js';

let TERMS = {};
// The terms the server sent with the content: { <id>: { id, he, en, ... } }.
export const setTerms = (terms) => (TERMS = terms || {});

const REF = /\[\[([^\]|]*)(?:\|([^\]]*))?\]\]/g;

// The text a reference shows: the text after "|", else the term's Hebrew name.
// An id the client does not know (F7) shows its "|" text, else the bare id.
const display = (id, text) => text ?? TERMS[id]?.he ?? id;

// Display text with no markup: for buttons' attributes, DM answer labels, <title>.
export const plainText = (str) => String(str ?? '').replace(REF, (_, id, text) => display(id, text));

// Escaped HTML with each known reference wrapped in a span the English pass can find.
// Unknown ids render as plain text, with no span and so no English (F7).
// inert: inside a control (an option <button>): never a link, only text (D4).
export function richText(str, { inert = false } = {}) {
  const s = String(str ?? '');
  let out = '';
  let last = 0;
  for (const m of s.matchAll(REF)) {
    const [whole, id, text] = m;
    out += esc(s.slice(last, m.index));
    last = m.index + whole.length;
    const shown = esc(display(id, text));
    out += TERMS[id] ? `<span class="term-ref${inert ? ' term-inert' : ''}" data-term="${esc(id)}">${shown}</span>` : shown;
  }
  return out + esc(s.slice(last));
}

// First-mention English (D5): in document order, the first reference to each term
// inside `scope` gets " (English)" after it. Run once per screen, after the HTML is built.
// A nested element marked data-term-scope is its own scope and is skipped here.
export function addEnglish(scope) {
  const seen = new Set();
  for (const el of scope.querySelectorAll('[data-term]')) {
    if (el.closest('[data-term-scope]') !== (scope.matches('[data-term-scope]') ? scope : null)) continue;
    const t = TERMS[el.dataset.term];
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
