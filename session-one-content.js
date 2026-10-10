// Session One content: content/session-one/**/*.md -> the JSON app.js renders.
// The format is documented for humans in content/session-one/README.md.
//
// Output: { commonLore: <info step>, characters: [{ id, name, cls, icon, steps }], terms: { <id>: term } }
// Every parse problem throws ContentError with "<file> line <n>: <what>".
//
// Text fields keep their raw [[id]] / [[id|text]] term references; the client
// renders them. Here they are only validated (syntax, allowed field, known id).
import fs from 'node:fs';
import path from 'node:path';

export class ContentError extends Error {}

const STEP_TYPES = ['info', 'choice', 'text'];
const BOOL = new Set(['multi', 'optional', 'other']);
const STEP_KEYS = new Set(['title', 'prompt', 'hint', 'multi', 'optional', 'other', 'use', 'link']);
const OPTION_KEYS = new Set(['id', 'subtitle', 'term']);
const FRONT_KEYS = { id: 'id', name: 'name', class: 'cls', icon: 'icon', order: 'order' };

const KEY_LINE = /^([a-z_]+):\s*(.*)$/;
const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;
const TERM_KEYS = new Set(['id', 'en', 'category', 'aliases', 'image', 'link']);
const TERM_REPEAT = new Set(['image', 'link']);
export const TERM_CATEGORIES = ['race', 'class', 'place', 'god', 'faction', 'person', 'concept', 'background'];
const MAX_IMAGES = 3;
const REF_ID = /^[a-z0-9_]+$/;
const NOT_HERE = 'a term reference [[...]] is not allowed here (only in title, prompt, hint, lore bullets, option label / subtitle / description and term blurbs)';
const REF_STEP_KEYS = new Set(['title', 'prompt', 'hint']); // step keys whose text may hold [[term]] references

// "[[id|text]]" -> "text", "[[id]]" -> "id": a label's text without markup, for the id slug.
const unref = (s) => s.replace(/\[\[([^\]|]*)(?:\|((?:(?!\]\]).)*))?\]\]/g, (_, id, text) => text ?? id);
const slug = (s) => unref(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

// HTML comments are notes for the author: blank them, keep line numbers.
const linesOf = (text) =>
  text.replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, '')).split('\n');

// A web URL that goes into src/href: https only.
function checkUrl(url, fail) {
  let u;
  try {
    u = new URL(url);
  } catch {
    u = null;
  }
  if (!u || u.protocol !== 'https:') fail(`"${url}" is not an https:// URL (only https:// links and images are allowed)`);
  return url;
}

// One "link:" value: "[title] [— or -] https://URL" -> { title?, url }. The URL is the last token.
// fail(msg) throws with the caller's file and line. Term links and step links both use this.
export function parseLink(value, fail) {
  const v = String(value ?? '').trim();
  const m = v.match(/^(.*?)\s*(\S+)$/);
  if (!m || !/^[a-z][a-z0-9+.-]*:/i.test(m[2])) fail(`"link:" needs a URL at the end: "[title] — https://..."`);
  const url = checkUrl(m[2], fail);
  const title = m[1].replace(/\s*[—-]\s*$/, '').trim();
  return title ? { title, url } : { url };
}

// Check every [[...]] term reference in a file, line by line (comments already blanked).
// allowed: the line numbers whose text may hold references. terms: Map of id -> term.
function checkRefs(lines, rel, allowed, terms) {
  lines.forEach((line, i) => {
    const n = i + 1;
    if (!line.includes('[[')) return;
    if (!allowed.has(n))
      throw new ContentError(`${rel} line ${n}: ${NOT_HERE}`);
    let rest = line;
    for (let at = rest.indexOf('[['); at !== -1; at = rest.indexOf('[[')) {
      const end = rest.indexOf(']]', at + 2);
      if (end === -1) throw new ContentError(`${rel} line ${n}: "[[" without a closing "]]" on the same line`);
      const inner = rest.slice(at + 2, end);
      if (inner.includes('[[')) throw new ContentError(`${rel} line ${n}: "[[" without a closing "]]" on the same line`);
      const bar = inner.indexOf('|');
      const id = bar === -1 ? inner : inner.slice(0, bar);
      if (!id) throw new ContentError(`${rel} line ${n}: [[${inner}]]: a term reference needs a term id: [[id]] or [[id|text]]`);
      if (!REF_ID.test(id)) throw new ContentError(`${rel} line ${n}: [[${inner}]]: a term id is Latin lowercase letters, digits and _`);
      if (bar !== -1 && !inner.slice(bar + 1).trim()) throw new ContentError(`${rel} line ${n}: [[${inner}]]: the text after "|" is empty`);
      if (!terms.has(id)) throw new ContentError(`${rel} line ${n}: [[${id}]]: there is no term "${id}" (terms/*.md)`);
      rest = rest.slice(end + 2);
    }
  });
}

// Parse one terms/*.md file: "### <Hebrew name>", key lines, a blank line, blurb paragraphs.
// Returns { terms: [{ ...term, line }], allowed: Set of blurb line numbers }.
function parseTermFile(text, rel) {
  const lines = linesOf(text);
  const fail = (n, msg) => {
    throw new ContentError(`${rel} line ${n}: ${msg}`);
  };
  // A field that may not hold references: report it as that, before any other rule trips on it.
  const noRef = (n, v) => String(v).includes('[[') && fail(n, NOT_HERE);
  const out = [];
  const allowed = new Set();
  let t = null;
  let para = null;
  const endPara = () => {
    if (para) t.paras.push(para.join(' '));
    para = null;
  };
  const endTerm = () => {
    if (!t) return;
    endPara();
    for (const k of ['id', 'en', 'category']) if (!t[k]) fail(t.line, `the term "${t.he}" needs "${k}:"`);
    if (t.paras.length) t.blurb = t.paras.join('\n\n');
    delete t.paras;
    out.push(t);
    t = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const n = i + 1;
    const raw = lines[i];
    const l = raw.trim();
    if (/^#( |$)/.test(raw)) continue; // a page title, for the reader only
    if (/^### /.test(raw)) {
      endTerm();
      const he = raw.slice(4).trim();
      noRef(n, he);
      if (!he) fail(n, 'a term heading is "### <Hebrew name>"');
      if (EMOJI.test(he.split(/\s+/)[0]) && !/\p{L}/u.test(he.split(/\s+/)[0])) fail(n, 'a term heading has no emoji, only the Hebrew name');
      t = { line: n, he, images: [], links: [], paras: [] };
      continue;
    }
    if (/^##/.test(raw)) fail(n, 'a term file holds "### <Hebrew name>" terms only, no ## steps');
    if (!t) {
      if (l) fail(n, 'text before the first "### <Hebrew name>" term heading');
      continue;
    }
    if (!l) {
      endPara();
      continue;
    }
    const m = !para && !t.paras.length && l.match(KEY_LINE);
    if (m) {
      noRef(n, l);
      const [, k] = m;
      const v = m[2].trim();
      if (!TERM_KEYS.has(k)) fail(n, `unknown term key "${k}" (allowed: ${[...TERM_KEYS].join(', ')})`);
      if (!TERM_REPEAT.has(k) && t[k] !== undefined) fail(n, `"${k}:" appears twice in this term`);
      const urlFail = (msg) => fail(n, msg);
      if (k === 'id') {
        if (!REF_ID.test(v)) fail(n, 'a term id is Latin lowercase letters, digits and _');
        t.id = v;
      } else if (k === 'category') {
        if (!TERM_CATEGORIES.includes(v)) fail(n, `unknown category "${v}" (one of ${TERM_CATEGORIES.join(', ')})`);
        t.category = v;
      } else if (k === 'aliases') {
        const a = v.split(',').map((x) => x.trim()).filter(Boolean);
        if (a.length) t.aliases = a;
      } else if (k === 'image') {
        if (!v) fail(n, '"image:" needs an https:// URL');
        if (t.images.length >= MAX_IMAGES) fail(n, `a term has at most ${MAX_IMAGES} "image:" lines`);
        t.images.push(checkUrl(v, urlFail));
      } else if (k === 'link') {
        t.links.push(parseLink(v, urlFail));
      } else {
        if (!v) fail(n, `"${k}:" is empty`);
        t[k] = v;
      }
      continue;
    }
    allowed.add(n);
    (para ||= []).push(l);
  }
  endTerm();
  return { terms: out, allowed, lines };
}

// Parse one md file. kind: 'character' | 'world' | 'list'.
// lists: { name: { keys, options } } for `use:` (not needed when kind is 'list').
// terms: Map of id -> term, for option "term:" (D4).
function parseFile(text, rel, kind, lists = {}, terms = new Map()) {
  const fail = (n, msg) => {
    throw new ContentError(`${rel} line ${n}: ${msg}`);
  };
  // A field that may not hold references: report it as that, before any other rule trips on it.
  const noRef = (n, v) => String(v).includes('[[') && fail(n, NOT_HERE);
  const lines = linesOf(text);
  const allowed = new Set(); // lines whose text may hold [[term]] references

  const front = {};
  const steps = [];
  let i = 0;

  // Front matter: --- key: value lines ---
  if (kind === 'character') {
    while (i < lines.length && !lines[i].trim()) i++;
    if (lines[i]?.trim() !== '---') fail(i + 1, 'a character file starts with a --- front-matter block (id, name, class, icon, order)');
    for (i++; ; i++) {
      if (i >= lines.length) fail(i, 'front matter is not closed with ---');
      const l = lines[i].trim();
      if (l === '---') break;
      if (!l) continue;
      noRef(i + 1, l);
      const m = l.match(KEY_LINE);
      if (!m || !FRONT_KEYS[m[1]]) fail(i + 1, `unknown front-matter line "${l}" (allowed: ${Object.keys(FRONT_KEYS).join(', ')})`);
      front[FRONT_KEYS[m[1]]] = m[2].trim();
    }
    i++;
    for (const k of ['id', 'name', 'cls']) if (!front[k]) fail(1, `front matter needs "${k === 'cls' ? 'class' : k}:"`);
  }

  let step = null; // the step being filled
  let section = null; // null | 'known' | 'secret' | an option object
  let item = null; // the lore bullet being filled
  let para = null; // the description paragraph being filled (array of lines)
  let stepLine = 0;

  const endPara = () => {
    if (para && section && typeof section === 'object') section.paras.push(para.join(' '));
    para = null;
  };
  const endStep = () => {
    endPara();
    if (!step) return;
    const n = stepLine;
    for (const o of step.options || []) {
      if (o.paras.length) o.description = o.paras.join('\n\n');
      delete o.paras;
    }
    // "use: <list>" inside ### known / ### secret: the list's bullets go first
    for (const [sec, u] of Object.entries(step.uses || {})) {
      const list = lists[u.name];
      if (!list) fail(u.line, `"use: ${u.name}" but there is no lists/${u.name}.md`);
      if (!list.bullets) fail(u.line, `lists/${u.name}.md holds options, not "- " lore bullets`);
      step[sec] = [...list.bullets.map((b) => ({ ...b })), ...step[sec]];
    }
    delete step.uses;
    if (kind === 'list' && step.bullets && step.options) fail(n, 'a list file holds either ### options or "- " lore bullets, not both');
    if (step.use) {
      if (step.type !== 'choice') fail(n, '"use:" at the top of a step only works on a choice step (in an info step, put it under ### known / ### secret)');
      const list = lists[step.use];
      if (!list) fail(n, `"use: ${step.use}" but there is no lists/${step.use}.md`);
      if (step.options) fail(n, 'a step with "use:" takes its options from the list; remove the ### options here');
      Object.assign(step, { ...list.keys, ...step, options: list.options });
      delete step.use;
    }
    if (step.type === 'choice' && !step.options?.length && !step.bullets) fail(n, 'a choice step needs ### options (or "use: <list>")');
    if (step.type === 'info' && !step.known && !step.secret) fail(n, 'an info step needs a ### known or ### secret section');
    for (const it of [...(step.known || []), ...(step.secret || []), ...(step.bullets || [])]) {
      if (!it.text) fail(it.line, 'this lore bullet has no text');
      delete it.line;
    }
    if (kind !== 'list' && step.type !== 'info' && !step.title && !step.prompt) fail(n, 'a question step needs "prompt:" (or "title:")');
    const ids = new Set();
    for (const o of step.options || []) {
      if (ids.has(o.id)) fail(o.line, `option id "${o.id}" is used twice in this step`);
      ids.add(o.id);
      delete o.line;
    }
    if (steps.some((s) => s.id === step.id)) fail(n, `step id "${step.id}" is used twice in this file`);
    steps.push(step);
    step = null;
  };

  if (kind === 'list') {
    step = { id: '__list', type: 'choice' };
    stepLine = 1;
  }

  for (; i < lines.length; i++) {
    const n = i + 1;
    const raw = lines[i];
    const l = raw.trim();

    if (/^## /.test(raw)) {
      if (kind === 'list') fail(n, 'a list file holds keys and ### options only, no ## steps');
      endStep();
      noRef(n, raw);
      const m = raw.slice(3).trim().match(/^([a-z]+)\s*:\s*([a-z0-9_]+)$/);
      if (!m || !STEP_TYPES.includes(m[1]))
        fail(n, `a step heading is "## <type>: <id>", type one of ${STEP_TYPES.join(', ')}, id Latin letters, digits, _`);
      step = { id: m[2], type: m[1] };
      stepLine = n;
      section = item = null;
      continue;
    }
    if (/^#( |$)/.test(raw)) continue; // a page title, for the reader only
    if (!step) {
      if (l) fail(n, 'text before the first "## <type>: <id>" step heading');
      continue;
    }

    if (/^### /.test(raw)) {
      endPara();
      item = null;
      const h = raw.slice(4).trim();
      if (step.type === 'text') fail(n, 'a text step has no ### sections');
      if (step.type === 'info') {
        if (h !== 'known' && h !== 'secret') fail(n, 'an info step\'s sections are "### known" and "### secret"');
        if (step[h]) fail(n, `"### ${h}" appears twice in this step`);
        step[h] = [];
        section = h;
        continue;
      }
      // choice option: ### <emoji?> <label>
      const [first, ...rest] = h.split(/\s+/);
      const hasEmoji = rest.length && EMOJI.test(first) && !/\p{L}/u.test(first);
      const o = { line: n, paras: [], label: hasEmoji ? rest.join(' ') : h };
      allowed.add(n);
      if (hasEmoji) o.emoji = first;
      if (!o.label) fail(n, 'an option heading needs a label after the emoji');
      step.options ||= [];
      step.options.push(o);
      section = o;
      continue;
    }

    if (!l) {
      endPara();
      item = null;
      continue;
    }

    // a list file of lore bullets (for "use:" under ### known / ### secret)
    if (kind === 'list' && section === null && l.startsWith('- ')) {
      step.bullets = [];
      section = 'bullets';
    }

    // step-level key lines (before any ### section)
    if (section === null) {
      const m = l.match(KEY_LINE);
      if (!m) fail(n, `expected a "key: value" line (${[...STEP_KEYS].join(', ')}) or a ### section`);
      if (!STEP_KEYS.has(m[1])) fail(n, `unknown key "${m[1]}" (allowed: ${[...STEP_KEYS].join(', ')})`);
      if (!REF_STEP_KEYS.has(m[1])) noRef(n, l);
      let v = m[2].trim();
      if (BOOL.has(m[1])) {
        if (v !== 'true' && v !== 'false') fail(n, `"${m[1]}:" is true or false`);
        v = v === 'true';
      }
      if (step[m[1]] !== undefined) fail(n, `"${m[1]}:" appears twice in this step`);
      if (m[1] === 'link') {
        if (step.type === 'info') fail(n, '"link:" works on choice and text steps');
        v = parseLink(v, (msg) => fail(n, msg));
      }
      if (REF_STEP_KEYS.has(m[1])) allowed.add(n);
      step[m[1]] = v;
      continue;
    }

    // info sections: "- **title** text" bullets; lines below a bullet continue it
    if (section === 'known' || section === 'secret' || section === 'bullets') {
      if (section !== 'bullets' && /^use:/.test(l)) noRef(n, l);
      const u = section !== 'bullets' && l.match(/^use:\s*([a-z0-9_-]+)$/);
      if (u) {
        step.uses ||= {};
        if (step.uses[section]) fail(n, `"use:" appears twice in this ### ${section} section`);
        step.uses[section] = { name: u[1], line: n };
        item = null;
        continue;
      }
      allowed.add(n);
      if (l.startsWith('- ')) {
        const b = l.slice(2).trim();
        const m = b.match(/^\*\*(.+?)\*\*\s*(.*)$/);
        item = m ? { line: n, title: m[1].trim(), text: m[2] } : { line: n, text: b };
        step[section].push(item);
      } else if (item) item.text = item.text ? `${item.text} ${l}` : l;
      else fail(n, 'lore lines start with "- " (optionally "- **title** text")');
      continue;
    }

    // option body: id:/subtitle:/term: lines first, then the description paragraph(s)
    const o = section;
    const m = !para && !o.paras.length && l.match(KEY_LINE);
    if (m && OPTION_KEYS.has(m[1])) {
      if (m[1] !== 'subtitle') noRef(n, l);
      if (o[m[1]] !== undefined) fail(n, `"${m[1]}:" appears twice in this option`);
      o[m[1]] = m[2].trim();
      if (m[1] === 'subtitle') allowed.add(n);
      if (m[1] === 'id' && !/^[a-z0-9_]+$/.test(o.id)) fail(n, 'an option id is Latin lowercase letters, digits and _');
      if (m[1] === 'term') {
        if (!o.term) fail(n, '"term:" needs a term id');
        if (!terms.has(o.term)) fail(n, `"term: ${o.term}": there is no term "${o.term}" (terms/*.md)`);
      }
      continue;
    }
    allowed.add(n);
    (para ||= []).push(l);
  }
  endStep();

  // options without id: get the label's slug, which must not be empty
  for (const st of steps)
    for (const o of st.options || []) {
      if (!o.id) {
        o.id = slug(o.label);
        if (!o.id) throw new ContentError(`${rel}: option "${o.label}" in step "${st.id}" needs an "id:" line (the label has no Latin letters)`);
      }
    }
  return { front, steps, lines, allowed };
}

const read = (dir, rel) => fs.readFileSync(path.join(dir, rel), 'utf8');
const mdFiles = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort() : []);
// Reorder so id/type come first in each step and each option (purely cosmetic in the JSON).
const tidyStep = ({ id, type, ...rest }) => ({ id, type, ...rest, ...(rest.options && { options: rest.options.map(({ id, ...o }) => ({ id, ...o })) }) });

// Read and parse the whole content folder. Throws ContentError.
export function loadContent(dir) {
  const relOf = (f) => path.relative(path.dirname(path.dirname(dir)), path.join(dir, f)); // content/session-one/...

  // Terms first: every other file's [[references]] are checked against them.
  // A Map, so ids like "constructor" or "__proto__" are not found on Object.prototype.
  const terms = new Map();
  const termFiles = [];
  for (const f of mdFiles(path.join(dir, 'terms'))) {
    const rel = relOf(path.join('terms', f));
    const parsed = parseTermFile(read(dir, path.join('terms', f)), rel);
    for (const { line, id, he, en, category, aliases, images, links, blurb } of parsed.terms) {
      const t = { id, he, en, category, ...(aliases && { aliases }), images, links, ...(blurb && { blurb }) };
      if (terms.has(t.id)) throw new ContentError(`${rel} line ${line}: term id "${t.id}" is used by another term (${terms.get(t.id).where})`);
      terms.set(t.id, { ...t, where: `${rel} line ${line}` });
    }
    termFiles.push([rel, parsed]);
  }
  for (const [rel, { lines, allowed }] of termFiles) checkRefs(lines, rel, allowed, terms);
  for (const t of terms.values()) delete t.where;
  const checked = (rel, parsed) => (checkRefs(parsed.lines, rel, parsed.allowed, terms), parsed);

  const lists = {};
  for (const f of mdFiles(path.join(dir, 'lists'))) {
    const rel = path.join('lists', f);
    const { steps } = checked(relOf(rel), parseFile(read(dir, rel), relOf(rel), 'list', {}, terms));
    const { id, type, options, bullets, ...keys } = steps[0];
    lists[f.slice(0, -3)] = { keys, options, bullets };
  }

  if (!fs.existsSync(path.join(dir, 'world.md'))) throw new ContentError(`${relOf('world.md')}: file is missing`);
  const world = checked(relOf('world.md'), parseFile(read(dir, 'world.md'), relOf('world.md'), 'world', lists, terms));
  if (world.steps.length !== 1 || world.steps[0].type !== 'info')
    throw new ContentError(`${relOf('world.md')}: holds exactly one "## info: <id>" step`);

  const characters = [];
  for (const f of mdFiles(path.join(dir, 'characters'))) {
    const rel = path.join('characters', f);
    const { front, steps } = checked(relOf(rel), parseFile(read(dir, rel), relOf(rel), 'character', lists, terms));
    if (characters.some((c) => c.id === front.id)) throw new ContentError(`${relOf(rel)}: character id "${front.id}" is used by another file`);
    characters.push({ ...front, steps: steps.map(tidyStep) });
  }
  const ord = (c) => (c.order === undefined ? Infinity : Number(c.order));
  characters.sort((a, b) => ord(a) - ord(b));
  for (const c of characters) delete c.order;
  // Object.fromEntries makes own properties, "__proto__" included.
  return { commonLore: tidyStep(world.steps[0]), characters, terms: Object.fromEntries(terms) };
}

// The term ids a value reaches: every [[id]] / [[id|text]] in its strings, and
// every option "term:" value. Ids, use: and link: never hold "[[" (the parser
// rejects it), so walking every string is safe.
const REF = /\[\[([a-z0-9_]+)(?:\||\]\])/g;
function collectRefs(value, out) {
  if (typeof value === 'string') for (const m of value.matchAll(REF)) out.add(m[1]);
  else if (Array.isArray(value)) for (const v of value) collectRefs(v, out);
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) {
      if (k === 'term' && typeof v === 'string') out.add(v);
      else collectRefs(v, out);
    }
  return out;
}

// The terms `seen` reaches, plus what their blurbs reach, transitively (D7).
// Own keys only, so "__proto__" / "constructor" ids are not found on Object.prototype.
function reachableTerms(terms, seen) {
  const ids = [...seen].filter((id) => Object.hasOwn(terms, id));
  const keep = new Set(ids);
  while (ids.length) {
    const blurb = terms[ids.pop()].blurb;
    for (const id of collectRefs(blurb, new Set()))
      if (!keep.has(id) && Object.hasOwn(terms, id)) keep.add(id), ids.push(id);
  }
  return Object.fromEntries(Object.entries(terms).filter(([id]) => keep.has(id)));
}

// What one viewer may see: the DM gets everything; a player gets only their
// own character's secret sections (none until they pick), and only the terms
// that their filtered content reaches (secret-safe, F14).
export function contentFor(content, { isAdmin, character }) {
  if (isAdmin) return content;
  const { terms, ...rest } = content;
  const visible = {
    ...rest,
    characters: rest.characters.map((c) =>
      c.id === character ? c : { ...c, steps: c.steps.map(({ secret, ...st }) => st) },
    ),
  };
  return { ...visible, terms: reachableTerms(terms || {}, collectRefs(visible, new Set())) };
}
