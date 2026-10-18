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
import { fileURLToPath } from 'node:url';

export class ContentError extends Error {}

const STEP_TYPES = ['info', 'choice', 'text'];
const BOOL = new Set(['multi', 'optional', 'other', 'random']); // 'random' only parses when ext.stepKeys allows it
const STEP_KEYS = new Set(['title', 'prompt', 'hint', 'multi', 'optional', 'other', 'use', 'link']);
const OPTION_KEYS = new Set(['id', 'subtitle', 'term']);
export const FRONT_KEYS = { id: 'id', name: 'name', class: 'cls', icon: 'icon', order: 'order' };

const KEY_LINE = /^([a-z_]+):\s*(.*)$/;
export const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;
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

// Where server.js serves /img/... from: public/ next to this file (both live at the repo root).
const PUBLIC_DIR = fileURLToPath(new URL('./public', import.meta.url));
// A repo-hosted image: /img/<name> (subfolders allowed), no dot-files, no "..", a known image type.
const LOCAL_IMAGE = /^\/img\/(?:[a-z0-9_-][a-z0-9_.-]*\/)*[a-z0-9_-][a-z0-9_.-]*\.(?:png|jpe?g|webp|svg)$/i;

// One info-step "image:" value: "<alt text> [— or -] <https URL | /img/<file>>" -> { src, alt }.
// A /img/ path must name a file in public/img/ (checked at load). fail(msg) throws with file and line.
function parseImage(value, fail) {
  const m = String(value ?? '').trim().match(/^(.*?)\s*(\S+)$/);
  const alt = m ? m[1].replace(/\s*[—-]\s*$/, '').trim() : '';
  if (!m || !alt || !/^(?:[a-z][a-z0-9+.-]*:|\/|img\/)/i.test(m[2]))
    fail('"image:" is "image: <alt text> — /img/<file> or https://..."; the alt text describes the picture');
  const src = m[2];
  const notImage = () => fail(`"${src}" is not an image this page can show: use https://... or a file under public/img/ as /img/<name>.png (also .jpg, .jpeg, .webp, .svg)`);
  if (src.startsWith('/') && !src.startsWith('//')) {
    if (!LOCAL_IMAGE.test(src) || src.split('/').some((seg) => seg === '..')) notImage();
    if (!fs.existsSync(path.join(PUBLIC_DIR, src))) fail(`"${src}": there is no file public${src}`);
  } else {
    let u;
    try {
      u = new URL(src);
    } catch {
      u = null;
    }
    if (!u || u.protocol !== 'https:') notImage();
  }
  return { src, alt };
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
export function checkRefs(lines, rel, allowed, terms) {
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
export function parseTermFile(text, rel, key, withSrc) {
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
      t = { line: n, he, images: [], links: [], paras: [], ...(withSrc && { src: { name: { file: key, line: n } } }) };
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
      if (withSrc && (k === 'en' || (k === 'aliases' && t.aliases))) t.src[k] = { file: key, line: n };
      continue;
    }
    allowed.add(n);
    if (withSrc && !para && !t.paras.length) t.src.blurb = { file: key, line: n };
    (para ||= []).push(l);
  }
  endTerm();
  return { terms: out, allowed, lines };
}

// Parse one md file. kind: 'character' | 'world' | 'list'.
// lists: { name: { keys, options } } for `use:` (not needed when kind is 'list').
// terms: Map of id -> term, for option "term:" (D4).
// ext (Session Two only; Session One passes none and keeps its grammar and errors):
//   { frontKeys: { <key>: <field> }, frontRequired: [<field>], stepKeys: [<extra step keys>], optionKeys: [<extra option keys>], shared: bool, sharedMarker: bool }.
//   sharedMarker: a "## shared" line (at most once) marks where the shared steps go; returned as sharedAt = { line, index }.
//   An extra step key (from, when, context, count, random) or option key (when) is parsed here and
//   resolved by session-two-content.js. An option "when:" becomes option.when = { step, value } and
//   option.whenLine = <line>; the caller deletes whenLine.
// Returns { front, frontLines, steps, at, lines, allowed }; at[stepId] = { heading, <extra key>: line }.
export function parseFile(text, rel, kind, lists = {}, terms = new Map(), { key, src: withSrc, ext } = {}) {
  const fail = (n, msg) => {
    throw new ContentError(`${rel} line ${n}: ${msg}`);
  };
  // A field that may not hold references: report it as that, before any other rule trips on it.
  const noRef = (n, v) => String(v).includes('[[') && fail(n, NOT_HERE);
  const lines = linesOf(text);
  const allowed = new Set(); // lines whose text may hold [[term]] references

  const frontKeys = ext?.frontKeys ?? FRONT_KEYS;
  const frontRequired = ext?.frontRequired ?? ['id', 'name', 'cls'];
  const stepKeys = ext ? new Set([...STEP_KEYS, ...ext.stepKeys]) : STEP_KEYS;
  const optionKeys = ext?.optionKeys ? new Set([...OPTION_KEYS, ...ext.optionKeys]) : OPTION_KEYS;
  // "when: <step id> = <option id | _else>" -> { step, value }
  const parseWhen = (n, v) => {
    const w = v.match(/^([a-z0-9_]+)\s*=\s*([a-z0-9_]+)$/);
    if (!w) fail(n, `"when: ${v}" is "when: <step id> = <option id>" or "when: <step id> = _else"`);
    return { step: w[1], value: w[2] };
  };
  const front = {};
  const frontLines = {};
  const at = {};
  const steps = [];
  let i = 0;

  // Front matter: --- key: value lines ---
  if (kind === 'character') {
    while (i < lines.length && !lines[i].trim()) i++;
    if (lines[i]?.trim() !== '---') fail(i + 1, 'a character file starts with a --- front-matter block (' + Object.keys(frontKeys).join(', ') + ')');
    for (i++; ; i++) {
      if (i >= lines.length) fail(i, 'front matter is not closed with ---');
      const l = lines[i].trim();
      if (l === '---') break;
      if (!l) continue;
      noRef(i + 1, l);
      const m = l.match(KEY_LINE);
      if (!m || !frontKeys[m[1]]) fail(i + 1, `unknown front-matter line "${l}" (allowed: ${Object.keys(frontKeys).join(', ')})`);
      front[frontKeys[m[1]]] = m[2].trim();
      frontLines[frontKeys[m[1]]] = i + 1;
    }
    i++;
    for (const k of frontRequired) if (!front[k]) fail(1, `front matter needs "${k === 'cls' ? 'class' : k}:"`);
  }

  let step = null; // the step being filled
  let section = null; // null | 'known' | 'secret' | an option object
  let item = null; // the lore bullet being filled
  let gap = false; // a blank line came after `item`: an indented line next starts its next paragraph
  let para = null; // the description paragraph being filled (array of lines)
  let stepLine = 0;
  let sharedAt = null; // { line, index }: where "## shared" stands (index = steps before it)
  let marker = false; // the lines right after "## shared", up to the next heading
  let imageLine = 0; // the line of this info step's "image:", once seen

  const endPara = () => {
    if (para && section && typeof section === 'object') section.paras.push(para.join(' '));
    para = null;
  };
  const endStep = () => {
    endPara();
    if (!step) return;
    const n = stepLine;
    if (step.from) {
      // "from: session-one": the whole step comes from Session One, so nothing else may be written here.
      const extra = Object.keys(step).filter((k) => !['id', 'type', 'from'].includes(k));
      if (extra.length) fail(n, `a step with "from:" holds no other key and no ### sections (found: ${extra.join(', ')})`);
      if (steps.some((s) => s.id === step.id)) fail(n, `step id "${step.id}" is used twice in this file`);
      steps.push(step);
      step = null;
      return;
    }
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
      const src = withSrc && { ...list.keys.src, ...step.src };
      Object.assign(step, { ...list.keys, ...step, options: list.options });
      if (withSrc && Object.keys(src).length) step.src = src;
      delete step.use;
    }
    if (step.type === 'choice' && !step.options?.length && !step.bullets) fail(n, 'a choice step needs ### options (or "use: <list>")');
    if (step.type === 'info' && !step.known && !step.secret) fail(n, 'an info step needs a ### known or ### secret section');
    for (const it of [...(step.known || []), ...(step.secret || []), ...(step.bullets || [])]) {
      if (!it.text && !it.title) fail(it.line, 'this lore bullet has no text');
      delete it.line;
    }
    if (kind !== 'list' && step.type !== 'info' && !step.title && !step.prompt) fail(n, 'a question step needs "prompt:" (or "title:")');
    const ids = new Set();
    for (const o of step.options || []) {
      // an option without id: gets the label's slug, which must not be empty
      if (!o.id) {
        o.id = slug(o.label);
        if (!o.id) throw new ContentError(`${rel}: option "${o.label}" in step "${step.id}" needs an "id:" line (the label has no Latin letters)`);
      }
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

    if (ext && /^## shared\s*$/.test(raw)) {
      if (ext.shared) fail(n, '"## shared" marks where the shared steps go; it belongs in a character file, not in a shared step file');
      if (!ext.sharedMarker) fail(n, 'a step heading is "## <type>: <id>"');
      endStep();
      if (sharedAt) fail(n, `"## shared" appears twice in this file (first at line ${sharedAt.line})`);
      sharedAt = { line: n, index: steps.length };
      step = null;
      section = item = null;
      marker = true;
      continue;
    }
    if (/^## /.test(raw)) {
      marker = false;
      if (kind === 'list') fail(n, 'a list file holds keys and ### options only, no ## steps');
      endStep();
      noRef(n, raw);
      const m = raw.slice(3).trim().match(/^([a-z]+)\s*:\s*([a-z0-9_]+)$/);
      if (!m || !STEP_TYPES.includes(m[1]))
        fail(n, `a step heading is "## <type>: <id>", type one of ${STEP_TYPES.join(', ')}, id Latin letters, digits, _`);
      step = { id: m[2], type: m[1] };
      imageLine = 0;
      at[m[2]] = { heading: n };
      stepLine = n;
      section = item = null;
      gap = false;
      continue;
    }
    if (/^#( |$)/.test(raw)) continue; // a page title, for the reader only
    if (!step) {
      if (l && marker) fail(n, '"## shared" is a line of its own: it holds no keys and no text');
      if (l) fail(n, 'text before the first "## <type>: <id>" step heading');
      continue;
    }

    if (/^### /.test(raw)) {
      endPara();
      item = null;
      gap = false;
      const h = raw.slice(4).trim();
      if (step.type === 'text') fail(n, 'a text step has no ### sections');
      if (ext?.shared && step.type === 'info') fail(n, 'a shared step is a choice or text step; it has no ### known / ### secret');
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
      const o = { line: n, paras: [], label: hasEmoji ? rest.join(' ') : h, ...(withSrc && { src: { label: { file: key, line: n } } }) };
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
      if (item) gap = true; // the item stays open for an indented next paragraph
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
      if (!m) fail(n, `expected a "key: value" line (${[...stepKeys].join(', ')}) or a ### section`);
      if (m[1] === 'image' && step.type === 'info') fail(n, '"image:" goes under ### known or ### secret (the image shows at the top of the step)');
      if (!stepKeys.has(m[1])) fail(n, `unknown key "${m[1]}" (allowed: ${[...stepKeys].join(', ')})`);
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
      if (ext?.stepKeys.includes(m[1])) {
        at[step.id][m[1]] = n;
        if (m[1] === 'from' && v !== 'session-one') fail(n, `"from: ${v}": the only source is "session-one"`);
        if (m[1] === 'context' && !REF_ID.test(v)) fail(n, `"context: ${v}": a step id is Latin lowercase letters, digits and _`);
        if (m[1] === 'when') v = parseWhen(n, v);
        if (m[1] === 'count') {
          if (!/^\d+$/.test(v)) fail(n, `"count: ${v}": count is a whole number`);
          v = Number(v);
        }
      }
      if (REF_STEP_KEYS.has(m[1])) allowed.add(n);
      if (withSrc && REF_STEP_KEYS.has(m[1])) (step.src ||= {})[m[1]] = { file: key, line: n };
      step[m[1]] = v;
      continue;
    }

    // info sections: "- **title** text" bullets. "- **title**" alone is a heading item (no text).
    // Lines right below a bullet continue it, each line break kept ("\n"); after a blank line, an
    // indented line starts the item's next paragraph ("\n\n"). An indented line under an item is
    // always its text, even when it starts with "- ", "use:" or "image:" (dialogue dashes).
    if (section === 'known' || section === 'secret' || section === 'bullets') {
      if (item && /^\s/.test(raw)) {
        allowed.add(n);
        item.text = item.text ? `${item.text}${gap ? '\n\n' : '\n'}${l}` : l;
        gap = false;
        continue;
      }
      if (gap) item = null;
      gap = false;
      if (section !== 'bullets' && /^use:/.test(l)) noRef(n, l);
      // "image:" in ### known -> step.image, in ### secret -> step.secretImage (contentFor drops it
      // with the secret). One per step; it renders at the top of the step.
      if (section !== 'bullets' && /^image:/.test(l)) {
        noRef(n, l);
        if (imageLine) fail(n, `an info step has one "image:" (the first is at line ${imageLine})`);
        imageLine = n;
        step[section === 'secret' ? 'secretImage' : 'image'] = parseImage(l.slice(6), (msg) => fail(n, msg));
        item = null;
        continue;
      }
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
        item = m ? { line: n, title: m[1].trim(), ...(m[2] && { text: m[2] }) } : { line: n, text: b };
        if (withSrc) item.src = { bullet: { file: key, line: n } };
        step[section].push(item);
      } else if (item) item.text = item.text ? `${item.text}\n${l}` : l;
      else fail(n, 'lore lines start with "- " (optionally "- **title** text")');
      continue;
    }

    // option body: id:/subtitle:/term: lines first, then the description paragraph(s)
    const o = section;
    // Only before the description starts: a key-shaped line inside it is text. KEY_LINE is
    // lowercase Latin, so Hebrew prose with a colon is never a key.
    const m = !para && !o.paras.length && l.match(KEY_LINE);
    if (m && !optionKeys.has(m[1])) fail(n, `unknown option key "${m[1]}" (allowed: ${[...optionKeys].join(', ')})`);
    if (m) {
      if (m[1] !== 'subtitle') noRef(n, l);
      if (o[m[1]] !== undefined) fail(n, `"${m[1]}:" appears twice in this option`);
      o[m[1]] = m[2].trim();
      if (m[1] === 'when') (o.whenLine = n, (o.when = parseWhen(n, o.when)));
      if (m[1] === 'subtitle') (allowed.add(n), withSrc && (o.src.subtitle = { file: key, line: n }));
      if (m[1] === 'id' && !/^[a-z0-9_]+$/.test(o.id)) fail(n, 'an option id is Latin lowercase letters, digits and _');
      if (m[1] === 'term') {
        if (!o.term) fail(n, '"term:" needs a term id');
        if (!terms.has(o.term)) fail(n, `"term: ${o.term}": there is no term "${o.term}" (terms/*.md)`);
      }
      continue;
    }
    allowed.add(n);
    if (withSrc && !para && !o.src.description) o.src.description = { file: key, line: n };
    (para ||= []).push(l);
  }
  endStep();
  return { front, frontLines, steps, at, lines, allowed, sharedAt };
}

// The term object a parsed term file entry becomes (shared by Session One and Session Two).
export const termOf = ({ id, he, en, category, aliases, images, links, blurb, src }) =>
  ({ id, he, en, category, ...(aliases && { aliases }), images, links, ...(blurb && { blurb }), ...(src && { src }) });
export const readDisk = (dir, rel) => fs.readFileSync(path.join(dir, rel), 'utf8');
export const mdFilesDisk = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort() : []);
// Reorder so id/type come first in each step and each option (purely cosmetic in the JSON).
export const tidyStep = ({ id, type, ...rest }) => ({ id, type, ...rest, ...(rest.options && { options: rest.options.map(({ id, ...o }) => ({ id, ...o })) }) });

// Read and parse the whole content folder. Throws ContentError.
// override: { file: 'terms/x.md', text } parses with that file's text replaced (or added),
// without touching the disk.
export function loadContent(dir, { override, src } = {}) {
  const isOver = (rel) => override && rel.split(path.sep).join('/') === override.file;
  const read = (d, rel) => (isOver(rel) ? override.text : readDisk(d, rel));
  const mdFiles = (d) => {
    const names = mdFilesDisk(d);
    const sub = path.relative(dir, d).split(path.sep).join('/');
    if (override && sub && path.posix.dirname(override.file) === sub) {
      const n = path.posix.basename(override.file);
      if (!names.includes(n)) names.push(n), names.sort();
    }
    return names;
  };
  const relOf = (f) => path.relative(path.dirname(path.dirname(dir)), path.join(dir, f)); // content/session-one/...

  // Terms first: every other file's [[references]] are checked against them.
  // A Map, so ids like "constructor" or "__proto__" are not found on Object.prototype.
  const terms = new Map();
  const termFiles = [];
  for (const f of mdFiles(path.join(dir, 'terms'))) {
    const rel = relOf(path.join('terms', f));
    const parsed = parseTermFile(read(dir, path.join('terms', f)), rel, `terms/${f}`, src);
    for (const parsedTerm of parsed.terms) {
      const { line } = parsedTerm;
      const t = termOf(parsedTerm);
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
    const { steps } = checked(relOf(rel), parseFile(read(dir, rel), relOf(rel), 'list', {}, terms, { key: `lists/${f}`, src }));
    const { id, type, options, bullets, ...keys } = steps[0];
    lists[f.slice(0, -3)] = { keys, options, bullets };
  }

  if (!fs.existsSync(path.join(dir, 'world.md')) && !isOver('world.md')) throw new ContentError(`${relOf('world.md')}: file is missing`);
  const world = checked(relOf('world.md'), parseFile(read(dir, 'world.md'), relOf('world.md'), 'world', lists, terms, { key: 'world.md', src }));
  if (world.steps.length !== 1 || world.steps[0].type !== 'info')
    throw new ContentError(`${relOf('world.md')}: holds exactly one "## info: <id>" step`);

  const characters = [];
  for (const f of mdFiles(path.join(dir, 'characters'))) {
    const rel = path.join('characters', f);
    const { front, steps } = checked(relOf(rel), parseFile(read(dir, rel), relOf(rel), 'character', lists, terms, { key: `characters/${f}`, src }));
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
// own character's secret sections and secret images (none until they pick), and only the terms
// that their filtered content reaches (secret-safe, F14), plus `extraTerms` (ids the caller
// vouches for, e.g. the viewer's own background) and what those reach.
export function contentFor(content, { isAdmin, character, extraTerms = [] }) {
  if (isAdmin) return content;
  const { terms, ...rest } = content;
  const visible = {
    ...rest,
    characters: rest.characters.map((c) =>
      c.id === character ? c : { ...c, steps: c.steps.map(({ secret, secretImage, ...st }) => st) },
    ),
  };
  return { ...visible, terms: reachableTerms(terms || {}, collectRefs(visible, new Set(extraTerms))) };
}
