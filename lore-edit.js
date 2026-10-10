// Session One lore editing: whole-file saves with validation. Pure functions of a content dir;
// server.js owns the gates and HTTP. Local use only (see content/session-one/README.md).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadContent, ContentError, EMOJI } from './session-one-content.js';

export const FILE_KEY = /^(world\.md|(characters|lists|terms)\/[a-z0-9_-]+\.md)$/;

export const versionOf = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex');

// Absolute path for a file key, or null when the key is not allowed or escapes the dir.
export function pathOf(dir, key) {
  if (typeof key !== 'string' || !FILE_KEY.test(key)) return null;
  const root = path.resolve(dir);
  const p = path.resolve(root, key);
  return p.startsWith(root + path.sep) ? p : null;
}

// { "<file key>": "<version>" } for every content file.
export function fileVersions(dir) {
  const out = {};
  const add = (key) => {
    try {
      out[key] = versionOf(fs.readFileSync(path.join(dir, key), 'utf8'));
    } catch {}
  };
  add('world.md');
  for (const sub of ['characters', 'lists', 'terms'])
    if (fs.existsSync(path.join(dir, sub)))
      for (const f of fs.readdirSync(path.join(dir, sub)).sort()) if (FILE_KEY.test(`${sub}/${f}`)) add(`${sub}/${f}`);
  return out;
}

// "<content/session-one/terms/x.md> line 12: what" -> { file: "terms/x.md", line: 12, detail }
export function splitError(dir, message) {
  const prefix = path.relative(path.dirname(path.dirname(path.resolve(dir))), path.resolve(dir)).split(path.sep).join('/') + '/';
  const m = /^(.+?)(?: line (\d+))?: ([\s\S]*)$/.exec(message);
  if (!m) return { detail: message };
  const file = m[1].split(path.sep).join('/');
  return { file: file.startsWith(prefix) ? file.slice(prefix.length) : file, ...(m[2] && { line: Number(m[2]) }), detail: m[3] };
}

// Every id an editor path must not lose: characters, steps, options, lists. (Terms are
// protected by the parser: a removed term that is still referenced fails the parse.)
function idsOf(content) {
  const ids = new Set();
  for (const c of content.characters)
    for (const st of c.steps) {
      ids.add(`${c.id}/${st.id}`);
      for (const o of st.options || []) ids.add(`${c.id}/${st.id}/${o.id}`);
    }
  for (const c of content.characters) ids.add(`character ${c.id}`);
  for (const l of Object.keys(content.lists || {})) ids.add(`list ${l}`);
  for (const t of Object.keys(content.terms)) ids.add(`term ${t}`);
  return ids;
}

function tryLoad(dir, opts) {
  try {
    return loadContent(dir, opts);
  } catch (e) {
    if (e instanceof ContentError) return null;
    throw e;
  }
}

const fail = (status, body) => ({ status, body });

// Save one whole file. create: true makes a new file. Synchronous end to end, so two requests
// cannot interleave between the version check and the write.
export function saveFile(dir, { file, hash, text, confirmRemovedIds, create }) {
  const p = pathOf(dir, file);
  if (!p) return fail(400, { error: 'שם קובץ לא תקין' });
  if (typeof text !== 'string') return fail(400, { error: 'חסר טקסט' });

  let old = null;
  try {
    old = fs.readFileSync(p, 'utf8');
  } catch {}
  if (create) {
    if (old !== null) return fail(409, { error: 'הקובץ כבר קיים' });
  } else if (old === null || versionOf(old) !== hash) {
    return fail(409, { error: 'הקובץ השתנה מאז שנטען. העתיקו את הטקסט ששיניתם וטענו מחדש.' });
  }

  // A18: keep CRLF if the file uses it; always end with a newline.
  const eol = old?.includes('\r\n') ? '\r\n' : '\n';
  let out = text.replace(/\r\n/g, '\n');
  if (!out.endsWith('\n')) out += '\n';
  if (eol === '\r\n') out = out.replace(/\n/g, '\r\n');

  let content;
  try {
    content = loadContent(dir, { override: { file, text: out } });
  } catch (e) {
    if (!(e instanceof ContentError)) throw e;
    const { file: f, line, detail } = splitError(dir, e.message);
    return fail(422, { error: `לא נשמר. טעות ב-${f ?? file}${line ? ` בשורה ${line}` : ''}: ${detail}`, file: f ?? file, ...(line && { line }) });
  }

  if (!create) {
    const before = tryLoad(dir);
    if (before) {
      const after = idsOf(content);
      const removed = [...idsOf(before)].filter((id) => !after.has(id)).sort();
      if (removed.length) {
        const ok = Array.isArray(confirmRemovedIds) && JSON.stringify([...confirmRemovedIds].sort()) === JSON.stringify(removed);
        if (!ok) return fail(422, { error: 'המחיקה תסיר מזהים. יש לאשר.', code: 'ids_removed', ids: removed });
      }
    }
  }

  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, out);
  } catch {
    return fail(500, { error: 'השמירה נכשלה. הקובץ לא השתנה.' });
  }
  return { status: create ? 201 : 200, body: { file, hash: versionOf(out) } };
}

// ---------- field edits (PUT /api/s1/lore-field) ----------
const NOT_FOUND = 'השדה לא נמצא. טענו מחדש.';
const ONE_LINE = new Set(['title', 'prompt', 'hint', 'subtitle', 'en', 'aliases', 'label', 'name']);
const MULTI = new Set(['description', 'blurb']);
const STRUCTURE = 'השינוי משנה את מבנה הקובץ. ערכו אותו בעורך הקובץ.';
const oneLine = (s) => s.replace(/\s*\n\s*/g, ' ').trim();
const paragraphs = (s) => s.split(/\r?\n\s*\r?\n/).map(oneLine).filter(Boolean);

// Plan one edit against the current lines: { start, end (0-based, inclusive), out: new lines, expect }.
// Returns { error } for a 400. `expect` is the value the parser must report back (D4 step 7).
function planEdit(lines, scan, { line, field, value }) {
  const i = line - 1;
  if (!Number.isInteger(line) || i < 0 || i >= lines.length) return { error: NOT_FOUND };
  const at = lines[i];
  let start = i;
  let end = i;
  let out;
  let expect;
  if (field === 'bullet') {
    if (!value || typeof value !== 'object' || typeof value.text !== 'string') return { error: NOT_FOUND };
    if (!at.trim().startsWith('- ')) return { error: NOT_FOUND };
    const title = typeof value.title === 'string' ? value.title : '';
    if (/[\r\n]/.test(title)) return { error: 'ערך בשורה אחת' };
    const text = oneLine(value.text);
    if (!text) return { error: 'שדה ריק: כדי למחוק, השתמשו בעורך הקובץ' };
    while (end + 1 < lines.length && scan[end + 1].trim() && !/^(- |#|use:)/.test(scan[end + 1].trim())) end++;
    out = [`- ${title.trim() ? `**${title.trim()}** ` : ''}${text}`];
    expect = { title: title.trim(), text };
  } else if (ONE_LINE.has(field) || MULTI.has(field)) {
    if (typeof value !== 'string') return { error: NOT_FOUND };
    if (ONE_LINE.has(field) && /[\r\n]/.test(value)) return { error: 'ערך בשורה אחת' };
    const v = MULTI.has(field) ? paragraphs(value).join('\n\n') : value.trim();
    if (!v) return { error: 'שדה ריק: כדי למחוק, השתמשו בעורך הקובץ' };
    expect = v;
    if (MULTI.has(field)) {
      if (!at.trim() || at.startsWith('#')) return { error: NOT_FOUND };
      let last = i;
      for (let j = i + 1; j < lines.length && !scan[j].startsWith('#'); j++) if (scan[j].trim()) last = j;
      end = last;
      out = v.split('\n');
    } else if (field === 'label' || field === 'name') {
      const m = /^(###\s+)(.*)$/.exec(at);
      if (!m) return { error: NOT_FOUND };
      let keep = m[1];
      if (field === 'label') {
        const [first, ...rest] = m[2].trim().split(/\s+/);
        if (rest.length && EMOJI.test(first) && !/\p{L}/u.test(first)) keep += first + ' ';
      }
      out = [keep + v];
    } else {
      const m = new RegExp(`^(\\s*${field}:\\s*)(.*)$`).exec(at);
      if (!m) return { error: NOT_FOUND };
      out = [m[1] + v];
    }
  } else return { error: NOT_FOUND };
  if (/<!--|-->/.test(lines.slice(start, end + 1).join('\n'))) return { error: 'יש הערה בתוך השדה הזה. ערכו אותו בעורך הקובץ.' };
  return { start, end, out, expect };
}

// What the parser reports for a field, found by its address (file + line) in a src-annotated parse.
const GET = {
  title: (x) => x.title,
  prompt: (x) => x.prompt,
  hint: (x) => x.hint,
  bullet: (x) => ({ title: x.title ?? '', text: x.text }),
  label: (x) => x.label,
  subtitle: (x) => x.subtitle,
  description: (x) => x.description,
  name: (x) => x.he,
  en: (x) => x.en,
  aliases: (x) => (x.aliases || []).join(', '),
  blurb: (x) => x.blurb,
};
function* itemsOf(content) {
  for (const st of [content.commonLore, ...content.characters.flatMap((c) => c.steps)]) {
    yield st;
    for (const k of ['known', 'secret', 'bullets']) yield* st[k] || [];
    yield* st.options || [];
  }
  yield* Object.values(content.terms);
}
function parsedAt(content, file, line, field) {
  for (const x of itemsOf(content)) if (x.src?.[field]?.file === file && x.src[field].line === line) return GET[field](x);
  return undefined;
}

// Apply field edits to one file. All edits target the same file version; ranges are planned on
// the current lines, then applied bottom-up so earlier line numbers stay valid.
export function editFields(dir, { file, hash, edits }) {
  const p = pathOf(dir, file);
  if (!p) return fail(400, { error: 'שם קובץ לא תקין' });
  if (!Array.isArray(edits) || !edits.length) return fail(400, { error: 'אין עריכות' });
  let old = null;
  try {
    old = fs.readFileSync(p, 'utf8');
  } catch {}
  if (old === null || versionOf(old) !== hash) return fail(409, { error: 'הקובץ השתנה מאז שנטען. העתיקו את הטקסט ששיניתם וטענו מחדש.' });

  const eol = old.includes('\r\n') ? '\r\n' : '\n';
  const lines = old.split(/\r?\n/);
  // The parser blanks HTML comments before reading; scan the same way, check the raw lines for A21.
  const scan = old.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, '')).split(/\r?\n/);
  const plans = [];
  for (const e of edits) {
    const r = planEdit(lines, scan, e || {});
    if (r.error) return fail(400, { error: r.error });
    plans.push({ ...r, line: e.line, field: e.field });
  }
  plans.sort((a, b) => a.start - b.start);
  for (let k = 1; k < plans.length; k++)
    if (plans[k].start <= plans[k - 1].end) return fail(400, { error: 'עריכות חופפות' });
  const next = [...lines];
  for (const r of [...plans].reverse()) next.splice(r.start, r.end - r.start + 1, ...r.out);
  const text = next.join(eol);

  const before = tryLoad(dir);
  let content;
  try {
    content = loadContent(dir, { override: { file, text }, src: true });
  } catch (e) {
    if (!(e instanceof ContentError)) throw e;
    const { file: f, line, detail } = splitError(dir, e.message);
    return fail(422, { error: `לא נשמר. טעות ב-${f ?? file}${line ? ` בשורה ${line}` : ''}: ${detail}`, file: f ?? file, ...(line && { line }) });
  }
  if (before) {
    const was = idsOf(before);
    const now = idsOf(content);
    const changed = [...was].filter((id) => !now.has(id));
    if (changed.length || now.size !== was.size) {
      const id = (changed[0] ?? [...now].find((x) => !was.has(x)) ?? '').split(/[/ ]/).pop();
      return fail(400, { error: `השינוי משנה מזהה (${id}). הוסיפו \`id: ${id}\` בעורך הקובץ ואז ערכו את השם.` });
    }
  }
  let shift = 0;
  for (const r of plans) {
    const got = parsedAt(content, file, r.start + 1 + shift, r.field);
    if (JSON.stringify(got) !== JSON.stringify(r.expect)) return fail(400, { error: STRUCTURE });
    shift += r.out.length - (r.end - r.start + 1);
  }

  try {
    fs.writeFileSync(p, text);
  } catch {
    return fail(500, { error: 'השמירה נכשלה. הקובץ לא השתנה.' });
  }
  return { status: 200, body: { file, hash: versionOf(text) } };
}
