// Session Two content: content/session-two/**/*.md (+ Session One's) -> the JSON the app renders.
// The format is documented for humans in content/session-two/README.md; the design is
// docs/specs/session-two.md (D2-D5, F1-F10).
//
// Output: { commonLore: <intro info step>, characters: [{ id, name, cls, icon, background?, steps }], terms }
// Same shape as Session One (contentFor works on it unchanged). Every problem throws
// ContentError with "<file> line <n>: <what>".
//
// The parser is Session One's (parseFile / parseTermFile); this file adds the step keys
// from / when / context / count / random, the option key when, the front-matter inheritance
// and the shared steps.
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
const STEP_KEYS = ['from', 'when', 'context', 'count', 'random']; // D4, D14
const OPTION_KEYS = ['when']; // D14
const EXT = { frontKeys: FRONT, frontRequired: ['id'], stepKeys: STEP_KEYS, optionKeys: OPTION_KEYS };
const EXT_SHARED = { stepKeys: STEP_KEYS, optionKeys: OPTION_KEYS, shared: true };
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

// F8. `seen` maps "target value" -> the first step { id, shared } that claimed it. Several steps
// may share one value only when all of them are in the same character file (a custom background
// has several steps); a shared step (steps/*.md) never shares it, and neither does `_else`.
function claimWhen(seen, step, at, charId) {
  const k = `${step.when.step} = ${step.when.value}`;
  const first = seen.get(k);
  if (!first) return seen.set(k, { id: step.id, shared: at.shared });
  const why = step.when.value === '_else' ? 'only one step per character may have "= _else"' : first.shared || at.shared ? 'a shared step (steps/*.md) cannot share a "when:" value with any other step' : null;
  if (why)
    throw new ContentError(`${at.rel} line ${at.when}: character "${charId}": steps "${first.id}" and "${step.id}" both have "when: ${k}" (${why})`);
}

// The context object a `context:` line becomes (D4).
const contextOf = (target) => ({
  step: target.id,
  question: target.title ?? target.prompt,
  options: (target.options || []).map(({ id, label }) => ({ id, label })),
});

const targetOf = (out, name) => out.find((s) => s.id === name);

// When-value rule: `when: <target> = <value>` needs <value> to be an option id of the target step.
// The `background` target also takes the character's own `background:` override and any id that has a
// bg_<id> term (a custom background such as mharoti_scholar_criminal is no option of the step).
// Returns an error message, or null.
function whenValueError(target, value, { background, terms }) {
  if (target.options?.some((o) => o.id === value)) return null;
  if (target.id === 'background' && (value === background || terms.has(`bg_${value}`))) return null;
  return `"${target.id}" has no option "${value}"`;
}

// count:, random: and option-level when: on one step (D14). Returns the step without whenLine / random: false.
function checkChoiceKeys(step, raw, at, out, fail, charId, env) {
  if (raw.count !== undefined) {
    if (raw.type !== 'choice' || raw.multi !== true) fail(at.count, `"count: ${raw.count}" works on a choice step with "multi: true" only`);
    const n = raw.options.length;
    if (raw.count < 2 || raw.count > n) fail(at.count, `"count: ${raw.count}" must be a whole number from 2 to the number of options (${n})`);
  }
  if (raw.random !== undefined) {
    if (raw.type !== 'choice' || raw.multi === true) fail(at.random, `"random: ${raw.random}" works on a single-answer choice step only (no multi, no text, no info)`);
    if (raw.random === false) {
      step = { ...step };
      delete step.random;
    }
  }
  if (!step.options?.some((o) => o.when)) return step;
  let free = 0;
  const options = step.options.map(({ whenLine, ...o }) => {
    if (!o.when) return free++, o;
    const { step: name, value } = o.when;
    const bad = (msg) => fail(whenLine, `option "${o.id}": "when: ${name} = ${value}": ${msg}`);
    if (value === '_else') bad('"= _else" is not allowed on an option');
    const target = targetOf(out, name);
    if (!target) bad(`"${name}" is not an earlier step of character "${charId}"`);
    if (target.type !== 'choice' || target.multi) bad(`"${name}" must be a single-answer choice step (no multi, no text)`);
    const err = whenValueError(target, value, env);
    if (err) bad(err);
    return o;
  });
  if (!free) fail(at.heading, `every option of step "${raw.id}" has a "when:"; at least one option must have none, so the step is never empty`);
  return { ...step, options };
}

// One character's flow: own steps, then shared steps. Each entry { step, at } (tidy step, line info).
function resolveFlow(charId, flow, s1Char, env) {
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
      const target = targetOf(out, raw.when.step);
      if (!target) fail(at.when, `"when: ${raw.when.step} = ${raw.when.value}": "${raw.when.step}" is not an earlier step of character "${charId}"`);
      if (target.type !== 'choice' || target.multi)
        fail(at.when, `"when: ${raw.when.step} = ${raw.when.value}": "${raw.when.step}" must be a single-answer choice step (no multi, no text)`);
      if (raw.when.value !== '_else') {
        const err = whenValueError(target, raw.when.value, env);
        if (err) fail(at.when, `"when: ${raw.when.step} = ${raw.when.value}": ${err}`);
      }
      claimWhen(whens, raw, at, charId);
    }
    step = checkChoiceKeys(step, raw, at, out, fail, charId, env);
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
    for (const s of p.steps) shared.push({ step: tidyStep(s), at: { ...p.at[s.id], rel: p.rel, shared: true } });
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
      steps: resolveFlow(front.id, flow, s1Char, { background: front.background, terms }),
    });
  }
  characters.sort((a, b) => a.order - b.order);
  for (const c of characters) delete c.order;

  return { commonLore: tidyStep(intro.steps[0]), characters, terms: Object.fromEntries(terms) };
}
