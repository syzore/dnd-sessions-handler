// Session One content: content/session-one/**/*.md -> the JSON app.js renders.
// The format is documented for humans in content/session-one/README.md.
//
// Output: { commonLore: <info step>, characters: [{ id, name, cls, icon, steps }] }
// Every parse problem throws ContentError with "<file> line <n>: <what>".
import fs from 'node:fs';
import path from 'node:path';

export class ContentError extends Error {}

const STEP_TYPES = ['info', 'choice', 'text'];
const BOOL = new Set(['multi', 'optional', 'other']);
const STEP_KEYS = new Set(['title', 'prompt', 'hint', 'multi', 'optional', 'other', 'use']);
const OPTION_KEYS = new Set(['id', 'subtitle']);
const FRONT_KEYS = { id: 'id', name: 'name', class: 'cls', icon: 'icon', order: 'order' };

const KEY_LINE = /^([a-z_]+):\s*(.*)$/;
const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

// Parse one md file. kind: 'character' | 'world' | 'list'.
// lists: { name: { keys, options } } for `use:` (not needed when kind is 'list').
function parseFile(text, rel, kind, lists = {}) {
  const fail = (n, msg) => {
    throw new ContentError(`${rel} line ${n}: ${msg}`);
  };
  // HTML comments are notes for the author: blank them, keep line numbers.
  const lines = text.replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, '')).split('\n');

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
      let v = m[2].trim();
      if (BOOL.has(m[1])) {
        if (v !== 'true' && v !== 'false') fail(n, `"${m[1]}:" is true or false`);
        v = v === 'true';
      }
      if (step[m[1]] !== undefined) fail(n, `"${m[1]}:" appears twice in this step`);
      step[m[1]] = v;
      continue;
    }

    // info sections: "- **title** text" bullets; lines below a bullet continue it
    if (section === 'known' || section === 'secret' || section === 'bullets') {
      const u = section !== 'bullets' && l.match(/^use:\s*([a-z0-9_-]+)$/);
      if (u) {
        step.uses ||= {};
        if (step.uses[section]) fail(n, `"use:" appears twice in this ### ${section} section`);
        step.uses[section] = { name: u[1], line: n };
        item = null;
        continue;
      }
      if (l.startsWith('- ')) {
        const b = l.slice(2).trim();
        const m = b.match(/^\*\*(.+?)\*\*\s*(.*)$/);
        item = m ? { line: n, title: m[1].trim(), text: m[2] } : { line: n, text: b };
        step[section].push(item);
      } else if (item) item.text = item.text ? `${item.text} ${l}` : l;
      else fail(n, 'lore lines start with "- " (optionally "- **title** text")');
      continue;
    }

    // option body: id:/subtitle: lines first, then the description paragraph(s)
    const o = section;
    const m = !para && !o.paras.length && l.match(KEY_LINE);
    if (m && OPTION_KEYS.has(m[1])) {
      if (o[m[1]] !== undefined) fail(n, `"${m[1]}:" appears twice in this option`);
      o[m[1]] = m[2].trim();
      if (m[1] === 'id' && !/^[a-z0-9_]+$/.test(o.id)) fail(n, 'an option id is Latin lowercase letters, digits and _');
      continue;
    }
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
  return { front, steps };
}

const read = (dir, rel) => fs.readFileSync(path.join(dir, rel), 'utf8');
const mdFiles = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort() : []);
// Reorder so id/type come first in each step and each option (purely cosmetic in the JSON).
const tidyStep = ({ id, type, ...rest }) => ({ id, type, ...rest, ...(rest.options && { options: rest.options.map(({ id, ...o }) => ({ id, ...o })) }) });

// Read and parse the whole content folder. Throws ContentError.
export function loadContent(dir) {
  const relOf = (f) => path.relative(path.dirname(path.dirname(dir)), path.join(dir, f)); // content/session-one/...
  const lists = {};
  for (const f of mdFiles(path.join(dir, 'lists'))) {
    const rel = path.join('lists', f);
    const { steps } = parseFile(read(dir, rel), relOf(rel), 'list');
    const { id, type, options, bullets, ...keys } = steps[0];
    lists[f.slice(0, -3)] = { keys, options, bullets };
  }

  if (!fs.existsSync(path.join(dir, 'world.md'))) throw new ContentError(`${relOf('world.md')}: file is missing`);
  const world = parseFile(read(dir, 'world.md'), relOf('world.md'), 'world', lists);
  if (world.steps.length !== 1 || world.steps[0].type !== 'info')
    throw new ContentError(`${relOf('world.md')}: holds exactly one "## info: <id>" step`);

  const characters = [];
  for (const f of mdFiles(path.join(dir, 'characters'))) {
    const rel = path.join('characters', f);
    const { front, steps } = parseFile(read(dir, rel), relOf(rel), 'character', lists);
    if (characters.some((c) => c.id === front.id)) throw new ContentError(`${relOf(rel)}: character id "${front.id}" is used by another file`);
    characters.push({ ...front, steps: steps.map(tidyStep) });
  }
  const ord = (c) => (c.order === undefined ? Infinity : Number(c.order));
  characters.sort((a, b) => ord(a) - ord(b));
  for (const c of characters) delete c.order;
  return { commonLore: tidyStep(world.steps[0]), characters };
}

// What one viewer may see: the DM gets everything; a player gets only their
// own character's secret sections (none until they pick).
export function contentFor(content, { isAdmin, character }) {
  if (isAdmin) return content;
  return {
    ...content,
    characters: content.characters.map((c) =>
      c.id === character ? c : { ...c, steps: c.steps.map(({ secret, ...st }) => st) },
    ),
  };
}
