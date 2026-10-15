// Session Two content: content/session-two/**/*.md (+ Session One) -> the JSON the client renders.
// The format is documented for humans in content/session-two/README.md; the design is
// docs/specs/session-two.md (D2-D5, F1-F10).
//
// Output: { commonLore: <intro step>, characters: [{ id, name, cls, icon, background?, steps }], terms }
// the Session One shape, so contentFor() from session-one-content.js works on it unchanged.
// A step may also carry `carry: true`, `when: { step, value }`, `context: { step, question, options }`.
// Every problem throws ContentError with "<file> line <n>: <what>".
//
// The parser is Session One's (parseFile, parseTermFile, checkRefs); this file adds
// what is new: front-matter inheritance, the from / when / context step keys and shared steps.
import fs from 'node:fs';
import path from 'node:path';
import {
  ContentError,
  loadContent,
  parseFile,
  parseTermFile,
  checkRefs,
  readDisk,
  mdFilesDisk,
  tidyStep,
} from './session-one-content.js';

export { ContentError };

const EXT = { frontKeys: { background: 'background' }, frontRequired: ['id'], stepKeys: ['from', 'when', 'context'] };
const WHEN = /^([a-z0-9_]+)\s*=\s*([a-z0-9_]+)$/;
const ELSE = '_else';
// Keys a `from:` step may hold: nothing besides its heading and the `from:` line.
const FROM_ONLY = new Set(['id', 'type', 'at', 'from']);

// The location (file + line) of a Session One term id, for the duplicate-term message.
function s1TermWhere(s1Dir, id) {
  const rootOf = path.dirname(path.dirname(s1Dir));
  for (const f of mdFilesDisk(path.join(s1Dir, 'terms'))) {
    const rel = path.join('terms', f);
    const { terms } = parseTermFile(readDisk(s1Dir, rel), rel, rel, false);
    const t = terms.find((x) => x.id === id);
    if (t) return `${path.relative(rootOf, path.join(s1Dir, rel))} line ${t.line}`;
  }
  return 'Session One terms';
}

export function loadSessionTwo({ s1Dir, s2Dir }) {
  const s1 = loadContent(s1Dir); // a Session One content error is reported as is (F28)
  const rootOf = path.dirname(path.dirname(s2Dir));
  const relOf = (f) => path.relative(rootOf, path.join(s2Dir, f));

  // Terms: Session One's + Session Two's, one Map; a shared id is an error naming both places.
  const terms = new Map(Object.entries(s1.terms));
  const s2Where = new Map();
  const termFiles = [];
  for (const f of mdFilesDisk(path.join(s2Dir, 'terms'))) {
    const rel = relOf(path.join('terms', f));
    const parsed = parseTermFile(readDisk(s2Dir, path.join('terms', f)), rel, `terms/${f}`, false);
    for (const { line, id, he, en, category, aliases, images, links, blurb } of parsed.terms) {
      if (terms.has(id)) {
        const where = s2Where.get(id) || s1TermWhere(s1Dir, id);
        throw new ContentError(`${rel} line ${line}: term id "${id}" is used by another term (${where})`);
      }
      terms.set(id, { id, he, en, category, ...(aliases && { aliases }), images, links, ...(blurb && { blurb }) });
      s2Where.set(id, `${rel} line ${line}`);
    }
    termFiles.push([rel, parsed]);
  }
  for (const [rel, { lines, allowed }] of termFiles) checkRefs(lines, rel, allowed, terms);
  const checked = (rel, parsed) => (checkRefs(parsed.lines, rel, parsed.allowed, terms), parsed);
  const stamp = (parsed, rel) => (parsed.steps.forEach((s) => (s.at.file = rel)), parsed);

  const lists = {};
  for (const f of mdFilesDisk(path.join(s2Dir, 'lists'))) {
    const rel = path.join('lists', f);
    const { steps } = checked(relOf(rel), parseFile(readDisk(s2Dir, rel), relOf(rel), 'list', {}, terms, { key: `lists/${f}` }));
    const { id, type, options, bullets, ...keys } = steps[0];
    lists[f.slice(0, -3)] = { keys, options, bullets };
  }

  // intro.md: exactly one info step, like Session One's world.md.
  if (!fs.existsSync(path.join(s2Dir, 'intro.md'))) throw new ContentError(`${relOf('intro.md')}: file is missing`);
  const intro = checked(relOf('intro.md'), parseFile(readDisk(s2Dir, 'intro.md'), relOf('intro.md'), 'world', lists, terms, { key: 'intro.md' }));
  if (intro.steps.length !== 1 || intro.steps[0].type !== 'info')
    throw new ContentError(`${relOf('intro.md')}: holds exactly one "## info: <id>" step`);

  // Shared steps (D5): choice and text steps only, no front matter, no known / secret sections.
  const shared = [];
  for (const f of mdFilesDisk(path.join(s2Dir, 'steps'))) {
    const rel = path.join('steps', f);
    const parsed = stamp(
      checked(relOf(rel), parseFile(readDisk(s2Dir, rel), relOf(rel), 'world', lists, terms, { key: `steps/${f}`, ext: EXT })),
      relOf(rel),
    );
    for (const s of parsed.steps)
      if (s.known || s.secret) throw new ContentError(`${relOf(rel)} line ${s.at.step}: a shared step has no ### known / ### secret sections (every player receives it)`);
    shared.push(...parsed.steps);
  }

  const s1ById = new Map(s1.characters.map((c, i) => [c.id, { ...c, index: i }]));
  const characters = [];
  for (const f of mdFilesDisk(path.join(s2Dir, 'characters'))) {
    const rel = path.join('characters', f);
    const rrel = relOf(rel);
    const { front, frontLines, steps } = checked(
      rrel,
      parseFile(readDisk(s2Dir, rel), rrel, 'character', lists, terms, { key: `characters/${f}`, ext: EXT }),
    );
    const base = s1ById.get(front.id);
    if (!base) throw new ContentError(`${rrel} line ${frontLines.id}: no Session One character "${front.id}"`);
    if (characters.some((c) => c.id === front.id)) throw new ContentError(`${rrel} line ${frontLines.id}: character id "${front.id}" is used by another file`);
    if (front.background !== undefined && !terms.has(`bg_${front.background}`))
      throw new ContentError(`${rrel} line ${frontLines.background}: background "${front.background}": there is no term "bg_${front.background}"`);
    stamp({ steps }, rrel);
    const flow = buildFlow(front.id, base, [...steps, ...structuredClone(shared)]);
    const { index } = base;
    characters.push({
      id: front.id,
      name: front.name ?? base.name,
      cls: front.cls ?? base.cls,
      ...((front.icon ?? base.icon) !== undefined && { icon: front.icon ?? base.icon }),
      ...(front.background !== undefined && { background: front.background }),
      steps: flow,
      order: front.order === undefined ? index + 1 : Number(front.order),
    });
  }
  characters.sort((a, b) => a.order - b.order);
  for (const c of characters) delete c.order;
  return { commonLore: tidyStep(stripAt(intro.steps[0])), characters, terms: Object.fromEntries(terms) };
}

const stripAt = ({ at, ...step }) => step;

// One character's steps: own steps, then the shared ones. Resolves from / when / context (D4)
// and checks F4-F9 in order, so "earlier in the flow" means earlier in `raw`.
function buildFlow(characterId, base, raw) {
  const out = []; // resolved steps so far
  const s1Steps = new Map(base.steps.map((s) => [s.id, s]));
  const shows = new Map(); // "<target> = <value>" -> the step id that shows on it (F8)
  const fail = (step, key, msg) => {
    throw new ContentError(`${step.at.file} line ${step.at[key] ?? step.at.step}: ${msg}`);
  };
  const earlier = (id) => out.find((s) => s.id === id);

  for (const step of raw) {
    const { at } = step;
    if (out.some((s) => s.id === step.id)) fail(step, 'step', `step id "${step.id}" is used twice in the flow of ${characterId} (its own steps, then the shared steps)`);

    // from: session-one (F4)
    let resolved = step;
    if (step.from !== undefined) {
      if (step.from !== 'session-one') fail(step, 'from', `"from: ${step.from}": the only source is "session-one"`);
      const extra = Object.keys(step).filter((k) => !FROM_ONLY.has(k));
      if (extra.length) fail(step, 'step', `a "from:" step holds nothing else (found ${extra.map((k) => `"${k}"`).join(', ')}); it is the Session One step, copied whole`);
      const src = s1Steps.get(step.id);
      if (!src) fail(step, 'from', `"from: session-one": Session One character "${characterId}" has no step "${step.id}"`);
      if (src.type !== step.type) fail(step, 'step', `the heading says ${step.type} but Session One step "${step.id}" is a ${src.type} step`);
      resolved = { ...structuredClone(src), carry: true, at };
    }

    // when: <step id> = <option id | _else> (F5-F8)
    if (step.when !== undefined) {
      const m = step.when.match(WHEN);
      if (!m) fail(step, 'when', `"when: ${step.when}": expected "when: <step id> = <option id>" or "when: <step id> = ${ELSE}"`);
      const [, target, value] = m;
      const t = earlier(target);
      if (!t) fail(step, 'when', `"when: ${step.when}": no earlier step "${target}" in the flow of ${characterId} (its own steps, then the shared steps)`);
      if (t.type !== 'choice' || t.multi) fail(step, 'when', `"when: ${step.when}": step "${target}" must be a choice step without multi: true (character ${characterId})`);
      const k = `${target} = ${value}`;
      if (shows.has(k)) fail(step, 'when', `steps "${shows.get(k)}" and "${step.id}" both show on "${k}" (character ${characterId})`);
      shows.set(k, step.id);
      resolved = { ...resolved, when: { step: target, value } };
    }

    // context: <step id> (F9)
    if (step.context !== undefined) {
      const target = step.context;
      const t = earlier(target) || s1Steps.get(target);
      if (!t) fail(step, 'context', `"context: ${target}": there is no such step earlier in the flow of ${characterId} or in its Session One file`);
      if (t.type === 'info') fail(step, 'context', `"context: ${target}": an info step has no answer to show`);
      resolved = {
        ...resolved,
        context: {
          step: target,
          question: t.title || t.prompt || '',
          options: (t.options || []).map((o) => ({ id: o.id, label: o.label })),
        },
      };
    }
    out.push(resolved);
  }
  return out.map((s) => tidyStep(stripAt(s)));
}
