// Session One lore editing: whole-file saves with validation. Pure functions of a content dir;
// server.js owns the gates and HTTP. Local use only (see content/session-one/README.md).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadContent, ContentError } from './session-one-content.js';

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
