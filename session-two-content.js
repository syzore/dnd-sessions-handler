// Session Two content: content/session-two/**/*.md (+ Session One's) -> the JSON the app renders.
// The format is documented for humans in content/session-two/README.md; the design is
// docs/specs/session-two.md (D2-D5, F1-F10).
//
// Output: { commonLore: <intro info step>, characters: [{ id, name, cls, icon, background?, steps }], terms }
// Same shape as Session One (contentFor works on it unchanged). Every problem throws
// ContentError with "<file> line <n>: <what>".
//
// The parser is Session One's (parseFile / parseTermFile); this file adds the three step
// keys from / when / context, the front-matter inheritance and the shared steps.
import path from 'node:path';
import {
  loadContent,
  ContentError,
  parseFile,
  parseTermFile,
  checkRefs,
  termOf,
  tidyStep,
  mdFilesDisk,
  readDisk,
  FRONT_KEYS,
} from './session-one-content.js';

export { ContentError };

const FRONT = { ...FRONT_KEYS, background: 'background' }; // D3: "background:" is the DM override
const STEP_KEYS = ['from', 'when', 'context']; // D4
const EXT = { frontKeys: FRONT, frontRequired: ['id'], stepKeys: STEP_KEYS };
const EXT_SHARED = { stepKeys: STEP_KEYS, shared: true };
const EXT_INTRO = { stepKeys: [] }; // the intro is plain Session One grammar

// content/session-two/... for error messages, from any <root>/content/<name> dir.
const relFrom = (dir) => (f) => path.relative(path.dirname(path.dirname(dir)), path.join(dir, f));

// Where Session One defines term `id`, for the duplicate-term error. Only runs on that error path.
function sessionOneTermWhere(s1Dir, id) {
  const rel = relFrom(s1Dir);
  for (const f of mdFilesDisk(path.join(s1Dir, 'terms'))) {
    const hit = parseTermFile(readDisk(s1Dir, path.join('terms', f)), rel(path.join('terms', f)), `terms/${f}`).terms.find((t) => t.id === id);
    if (hit) return `${rel(path.join('terms', f))} line ${hit.line}`;
  }
  return 'Session One';
}

// F8 lives here so a later change (several steps sharing one `when:` value inside one
// character file) is one edit. `seen` maps "target value" -> the first step id that claimed it.
function claimWhen(seen, step, at, charId) {
  const k = `${step.when.step} = ${step.when.value}`;
  if (seen.has(k))
    throw new ContentError(`${at.rel} line ${at.when}: character "${charId}": steps "${seen.get(k)}" and "${step.id}" both have "when: ${k}"`);
  seen.set(k, step.id);
}

// The context object a `context:` line becomes (D4).
const contextOf = (target) => ({
  step: target.id,
  question: target.title ?? target.prompt,
  options: (target.options || []).map(({ id, label }) => ({ id, label })),
});

// One character's flow: own steps, then shared steps. Each entry { step, at } (tidy step, line info).
function resolveFlow(charId, flow, s1Char) {
  const out = [];
  const ids = new Map(); // step id -> rel of the file that defined it
  const whens = new Map();
  for (const { step: raw, at } of flow) {
    const fail = (n, msg) => {
      throw new ContentError(`${at.rel} line ${n}: ${msg}`);
    };
    if (ids.has(raw.id)) fail(at.heading, `step id "${raw.id}" is used twice in the flow of character "${charId}" (also in ${ids.get(raw.id)})`);
    ids.set(raw.id, at.rel);

    let step = raw;
    if (raw.from) {
      const s1Step = s1Char.steps.find((s) => s.id === raw.id);
      if (!s1Step) fail(at.from, `"from: session-one": character "${charId}" has no Session One step "${raw.id}"`);
      if (s1Step.type !== raw.type)
        fail(at.heading, `"from: session-one": the Session One step "${raw.id}" is a ${s1Step.type} step, this heading says ${raw.type}`);
      step = { ...structuredClone(s1Step), carry: true };
    }
    if (raw.when) {
      const target = out.find((s) => s.id === raw.when.step);
      if (!target) fail(at.when, `"when: ${raw.when.step} = ${raw.when.value}": "${raw.when.step}" is not an earlier step of character "${charId}"`);
      if (target.type !== 'choice' || target.multi)
        fail(at.when, `"when: ${raw.when.step} = ${raw.when.value}": "${raw.when.step}" must be a single-answer choice step (no multi, no text)`);
      claimWhen(whens, raw, at, charId);
    }
    if (raw.context) {
      const target = out.find((s) => s.id === raw.context) || s1Char.steps.find((s) => s.id === raw.context);
      if (!target) fail(at.context, `"context: ${raw.context}": character "${charId}" has no such earlier step, and no such Session One step`);
      if (target.type === 'info') fail(at.context, `"context: ${raw.context}": an info step has no answer to show`);
      step = { ...step, context: contextOf(target) };
    }
    out.push(step);
  }
  return out;
}

export function loadSessionTwo({ s1Dir, s2Dir }) {
  const s1 = loadContent(s1Dir); // a Session One error is reported as is (F28)
  const rel = relFrom(s2Dir);

  // Terms: Session One's + terms/*.md, one Map (D2.2).
  const terms = new Map(Object.entries(s1.terms));
  const where = new Map();
  const termFiles = [];
  for (const f of mdFilesDisk(path.join(s2Dir, 'terms'))) {
    const r = rel(path.join('terms', f));
    const parsed = parseTermFile(readDisk(s2Dir, path.join('terms', f)), r, `terms/${f}`);
    for (const p of parsed.terms) {
      if (terms.has(p.id)) throw new ContentError(`${r} line ${p.line}: term id "${p.id}" is used by another term (${where.get(p.id) ?? sessionOneTermWhere(s1Dir, p.id)})`);
      terms.set(p.id, termOf(p));
      where.set(p.id, `${r} line ${p.line}`);
    }
    termFiles.push([r, parsed]);
  }
  for (const [r, { lines, allowed }] of termFiles) checkRefs(lines, r, allowed, terms);

  const parse = (file, kind, lists, ext) => {
    const r = rel(file);
    const parsed = parseFile(readDisk(s2Dir, file), r, kind, lists, terms, { key: file, ext });
    checkRefs(parsed.lines, r, parsed.allowed, terms);
    return { ...parsed, rel: r };
  };

  const lists = {};
  for (const f of mdFilesDisk(path.join(s2Dir, 'lists'))) {
    const { steps } = parse(path.join('lists', f), 'list', {});
    const { id, type, options, bullets, ...keys } = steps[0];
    lists[f.slice(0, -3)] = { keys, options, bullets };
  }

  // intro.md: exactly one info step (like Session One's world.md).
  if (!mdFilesDisk(s2Dir).includes('intro.md')) throw new ContentError(`${rel('intro.md')}: file is missing`);
  const intro = parse('intro.md', 'world', lists, EXT_INTRO);
  if (intro.steps.length !== 1 || intro.steps[0].type !== 'info') throw new ContentError(`${intro.rel}: holds exactly one "## info: <id>" step`);

  // Shared steps (D5), in file-name order.
  const shared = [];
  for (const f of mdFilesDisk(path.join(s2Dir, 'steps'))) {
    const p = parse(path.join('steps', f), 'world', lists, EXT_SHARED);
    for (const s of p.steps) shared.push({ step: tidyStep(s), at: { ...p.at[s.id], rel: p.rel } });
  }

  const characters = [];
  const seen = new Set();
  for (const f of mdFilesDisk(path.join(s2Dir, 'characters'))) {
    const p = parse(path.join('characters', f), 'character', lists, EXT);
    const { front } = p;
    const s1Index = s1.characters.findIndex((c) => c.id === front.id);
    if (s1Index === -1) throw new ContentError(`${p.rel} line ${p.frontLines.id}: no Session One character "${front.id}"`);
    if (seen.has(front.id)) throw new ContentError(`${p.rel} line ${p.frontLines.id}: character id "${front.id}" is used by another file`);
    seen.add(front.id);
    if (front.background !== undefined && !terms.has(`bg_${front.background}`))
      throw new ContentError(`${p.rel} line ${p.frontLines.background}: background "${front.background}": there is no term "bg_${front.background}"`);

    const s1Char = s1.characters[s1Index];
    const own = p.steps.map((s) => ({ step: tidyStep(s), at: { ...p.at[s.id], rel: p.rel } }));
    const flow = [...own, ...shared.map((x) => ({ step: structuredClone(x.step), at: x.at }))];
    const icon = front.icon ?? s1Char.icon;
    characters.push({
      order: Number(front.order ?? s1Index + 1),
      id: front.id,
      name: front.name ?? s1Char.name,
      cls: front.cls ?? s1Char.cls,
      ...(icon !== undefined && { icon }),
      ...(front.background !== undefined && { background: front.background }),
      steps: resolveFlow(front.id, flow, s1Char),
    });
  }
  characters.sort((a, b) => a.order - b.order);
  for (const c of characters) delete c.order;

  return { commonLore: tidyStep(intro.steps[0]), characters, terms: Object.fromEntries(terms) };
}
