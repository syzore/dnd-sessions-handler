// Session Two content loader: loadSessionTwo({ s1Dir, s2Dir }) is the seam. Each test copies a
// fixture (a Session One folder + a Session Two folder) to a temp .../content/, edits one file,
// and checks the parsed shape or the ContentError message (file + line). The last section loads
// the real content/ folders.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSessionTwo, ContentError } from '../session-two-content.js';
import { loadContent, contentFor } from '../session-one-content.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASIC = path.join(HERE, 'fixtures', 'session-two', 'basic');
const REAL = path.join(HERE, '..', 'content');
const REAL_LAYOUT = { s1: 'session-one', s2: 'session-two' };

// Copy a folder holding session-one/ and session-two/ to a temp .../content/;
// edits: { 'session-two/steps/x.md': text | (old) => new }. Returns { s1Dir, s2Dir }.
function copyWith(from, edits = {}) {
  const root = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 's2-')), 'content');
  fs.cpSync(from, root, { recursive: true });
  for (const [rel, e] of Object.entries(edits)) {
    const f = path.join(root, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, typeof e === 'function' ? e(fs.readFileSync(f, 'utf8')) : e);
  }
  return { s1Dir: path.join(root, 'session-one'), s2Dir: path.join(root, 'session-two') };
}
const load = (edits, from = BASIC) => loadSessionTwo(copyWith(from, edits));
const fails = (edits, message, from = BASIC) =>
  assert.throws(
    () => load(edits, from),
    (e) => e instanceof ContentError && (message instanceof RegExp ? message.test(e.message) : e.message === message),
    String(message),
  );
const replace = (a, b) => (s) => {
  assert.ok(s.includes(a), `fixture has no "${a}"`);
  return s.replace(a, b);
};
const stepsOf = (c, id) => c.characters.find((x) => x.id === id).steps;
const stepOf = (c, charId, stepId) => stepsOf(c, charId).find((s) => s.id === stepId);

const ANN = 'session-two/characters/ann.md';
const BOB = 'session-two/characters/bob.md';
const DETAILS = 'session-two/steps/a-details.md';
const OTHER = 'session-two/steps/b-other.md';

// ---------------------------------------------------------------- shape

test('shape: name, class and icon are inherited from Session One; a front-matter value wins; background is the override', () => {
  const c = load();
  const [ann, bob] = c.characters;
  assert.deepEqual(
    { id: ann.id, name: ann.name, cls: ann.cls, icon: ann.icon, background: ann.background },
    { id: 'ann', name: 'אן', cls: 'לוחמת', icon: 'shield', background: undefined },
  );
  assert.deepEqual(
    { id: bob.id, name: bob.name, cls: bob.cls, icon: bob.icon, background: bob.background },
    { id: 'bob', name: 'בובי', cls: 'קוסם', icon: 'hat', background: 'sage' },
  );
  assert.ok(!('order' in ann) && !('at' in ann));
});

test('shape: characters follow the Session One order unless a Session Two order says otherwise', () => {
  assert.deepEqual(load().characters.map((c) => c.id), ['ann', 'bob']);
  const c = load({ [BOB]: replace('background: sage', 'background: sage\norder: 0') });
  assert.deepEqual(c.characters.map((c) => c.id), ['bob', 'ann']);
});

test('shape: commonLore is the intro step; terms are Session One + Session Two in one object', () => {
  const c = load();
  assert.equal(c.commonLore.id, 'intro');
  assert.equal(c.commonLore.type, 'info');
  for (const id of ['zeus', 'bg_sage', 'sc_order', 'sc_spell']) assert.ok(c.terms[id], id);
});

test('shape: "from: session-one" copies the Session One step whole and adds carry: true', () => {
  const s1 = loadContent(copyWith(BASIC).s1Dir);
  const c = load();
  for (const id of ['ann', 'bob']) {
    const src = s1.characters.find((x) => x.id === id).steps.find((s) => s.id === 'background');
    assert.deepEqual(stepOf(c, id, 'background'), { ...src, carry: true });
  }
  assert.equal(stepOf(c, 'ann', 'background').options[0].emoji, '⚔️');
});

test('shape: "when" and "context" become objects; context options come from the target step', () => {
  const c = load();
  const soldier = stepOf(c, 'ann', 'details_soldier');
  assert.deepEqual(soldier.when, { step: 'background', value: 'soldier' });
  assert.deepEqual(soldier.context, {
    step: 'background',
    question: '📜 מה הרקע שלך?',
    options: [{ id: 'soldier', label: 'חייל' }, { id: 'sage', label: 'חכם' }],
  });
  assert.deepEqual(stepOf(c, 'ann', 'details_other').when, { step: 'background', value: '_else' });
  assert.equal(stepOf(c, 'ann', 'details_soldier').prompt, 'באיזה צבא?');
});

test('shape: a "context" target that only exists in Session One is found there; a multi target keeps its options', () => {
  const c = load();
  assert.deepEqual(stepOf(c, 'ann', 'subclass').context, {
    step: 'god',
    question: 'מי האל שלך?',
    options: [{ id: 'zeus', label: 'זאוס' }, { id: 'hera', label: 'הרה' }],
  });
  assert.deepEqual(stepOf(c, 'bob', 'subclass').context.options.map((o) => o.id), ['fire', 'ice']);
});

test('shape: a context target that is a text step has no options', () => {
  const c = load({ [ANN]: replace('context: god', 'context: goal') });
  assert.deepEqual(stepOf(c, 'ann', 'subclass').context, { step: 'goal', question: 'מה המטרה?', options: [] });
});

test('shape: shared steps come after the character\'s own steps, in file-name order, for every character', () => {
  const c = load();
  assert.deepEqual(stepsOf(c, 'ann').map((s) => s.id), ['note', 'subclass', 'background', 'details_soldier', 'details_sage', 'details_other']);
  assert.deepEqual(stepsOf(c, 'bob').map((s) => s.id), ['subclass', 'background', 'details_soldier', 'details_sage', 'details_other']);
  // each character gets its own copy
  assert.notEqual(stepOf(c, 'ann', 'details_sage'), stepOf(c, 'bob', 'details_sage'));
});

test('shape: no loader bookkeeping leaks into the output', () => {
  const c = load();
  assert.ok(!JSON.stringify(c).includes('"at"'));
});

// ---------------------------------------------------------------- contentFor

test('contentFor: works on the result; a player gets no other character\'s secret', () => {
  const c = load();
  const forBob = JSON.stringify(contentFor(c, { isAdmin: false, character: 'bob' }));
  assert.ok(!forBob.includes('ANN2SECRET'));
  const forAnn = JSON.stringify(contentFor(c, { isAdmin: false, character: 'ann' }));
  assert.ok(forAnn.includes('ANN2SECRET'));
  const nobody = JSON.stringify(contentFor(c, { isAdmin: false, character: null }));
  assert.ok(!nobody.includes('ANN2SECRET'));
  assert.ok(JSON.stringify(contentFor(c, { isAdmin: true })).includes('ANN2SECRET'));
  // the terms a player's content reaches are still there
  assert.ok(contentFor(c, { isAdmin: false, character: 'bob' }).terms.sc_spell);
});

// ---------------------------------------------------------------- terms, intro, shared steps

test('terms: the same id in a Session One and a Session Two file names both places', () => {
  fails(
    { 'session-two/terms/subclasses.md': replace('id: sc_order', 'id: zeus') },
    'content/session-two/terms/subclasses.md line 1: term id "zeus" is used by another term (content/session-one/terms/terms.md line 1)',
  );
});

test('terms: the same id in two Session Two files names both places', () => {
  fails(
    { 'session-two/terms/z-more.md': '### עוד\nid: sc_order\nen: More\ncategory: class\n' },
    'content/session-two/terms/z-more.md line 1: term id "sc_order" is used by another term (content/session-two/terms/subclasses.md line 1)',
  );
});

test('a [[reference]] in Session Two content is checked against the merged terms', () => {
  load({ [OTHER]: replace('ספר/י עוד.', 'ספר/י על [[zeus]] או [[sc_order]].') });
  fails({ [OTHER]: replace('ספר/י עוד.', 'ספר/י על [[nope]].') }, 'content/session-two/steps/b-other.md line 6: [[nope]]: there is no term "nope" (terms/*.md)');
});

test('intro.md holds exactly one info step', () => {
  fails({ 'session-two/intro.md': (s) => `${s}\n## info: two\n\n### known\n\n- **a** b\n` }, 'content/session-two/intro.md: holds exactly one "## info: <id>" step');
  fails({ 'session-two/intro.md': '# x\n\n## text: q\nprompt: p\n' }, 'content/session-two/intro.md: holds exactly one "## info: <id>" step');
});

test('intro.md is required', () => {
  const dirs = copyWith(BASIC);
  fs.rmSync(path.join(dirs.s2Dir, 'intro.md'));
  assert.throws(() => loadSessionTwo(dirs), /^ContentError: content\/session-two\/intro\.md: file is missing$|content\/session-two\/intro\.md: file is missing/);
});

test('a shared step holds no known / secret sections', () => {
  fails(
    { [OTHER]: (s) => `${s}\n## info: leak\n\n### known\n\n- **a** b\n` },
    /^content\/session-two\/steps\/b-other\.md line 8: a shared step has no ### known \/ ### secret sections/,
  );
});

test('a step id used by a character and a shared step is an error', () => {
  fails(
    { [ANN]: (s) => `${s}\n## text: details_other\nprompt: x\n` },
    /^content\/session-two\/steps\/b-other\.md line 3: step id "details_other" is used twice in the flow of ann/,
  );
});

test('a Session One content error is reported as is (F28)', () => {
  fails(
    { 'session-one/world.md': (s) => s.replace('## info: world', '## nonsense') },
    /^content\/session-one\/world\.md line 3: a step heading is/,
  );
});

// ---------------------------------------------------------------- F1-F10

test('F1: a character with no Session One character', () => {
  fails({ [ANN]: replace('id: ann', 'id: zzz') }, 'content/session-two/characters/ann.md line 2: no Session One character "zzz"');
});

test('F2: an unknown front-matter key lists the allowed keys', () => {
  fails(
    { [ANN]: replace('id: ann\n', 'id: ann\npower: 3\n') },
    'content/session-two/characters/ann.md line 3: unknown front-matter line "power: 3" (allowed: id, name, class, icon, order, background)',
  );
});

test('F3: a background override with no bg_ term', () => {
  fails({ [BOB]: replace('background: sage', 'background: nosuch') }, 'content/session-two/characters/bob.md line 4: background "nosuch": there is no term "bg_nosuch"');
});

test('F4: "from:" must name session-one', () => {
  fails({ [ANN]: replace('from: session-one', 'from: session-two') }, /^content\/session-two\/characters\/ann\.md line 34: "from: session-two": the only source is "session-one"/);
});

test('F4: a "from:" step holds no other key and no options', () => {
  fails({ [BOB]: replace('from: session-one', 'from: session-one\ntitle: x') }, /^content\/session-two\/characters\/bob\.md line 18: a "from:" step holds nothing else \(found "title"\)/);
  fails({ [BOB]: (s) => `${s}\n### extra\nid: extra\n` }, /^content\/session-two\/characters\/bob\.md line 18: a "from:" step holds nothing else \(found "options"\)/);
  fails({ [BOB]: replace('from: session-one', 'from: session-one\ncontext: element') }, /^content\/session-two\/characters\/bob\.md line 18: a "from:" step holds nothing else \(found "context"\)/);
});

test('F4: the Session One character must have a step with that id', () => {
  fails({ [BOB]: replace('## choice: background', '## choice: nostep') }, 'content/session-two/characters/bob.md line 19: "from: session-one": Session One character "bob" has no step "nostep"');
});

test('F4: the heading type must match the Session One step type', () => {
  fails({ [BOB]: replace('## choice: background', '## text: background') }, 'content/session-two/characters/bob.md line 18: the heading says text but Session One step "background" is a choice step');
});

test('F5: "when:" is "<step id> = <option id>" or "<step id> = _else"', () => {
  for (const bad of ['background is soldier', 'background =', 'background = two words', 'Background = soldier'])
    fails({ [DETAILS]: replace('when: background = soldier', `when: ${bad}`) }, new RegExp(`^content/session-two/steps/a-details\\.md line 4: "when: ${bad}": expected "when: <step id> = <option id>"`));
});

test('F6: "when:" must name an earlier step of the character\'s flow', () => {
  fails({ [DETAILS]: replace('when: background = soldier', 'when: nope = soldier') }, /^content\/session-two\/steps\/a-details\.md line 4: "when: nope = soldier": no earlier step "nope" in the flow of ann/);
  // a step that comes later does not count
  fails({ [ANN]: replace('context: god', 'context: god\nwhen: background = soldier') }, /^content\/session-two\/characters\/ann\.md line 22: "when: background = soldier": no earlier step "background" in the flow of ann/);
});

test('F6: a shared step is checked per character, and the message names the character', () => {
  fails(
    { [BOB]: replace('## choice: background\nfrom: session-one\n', '') },
    /^content\/session-two\/steps\/a-details\.md line 4: "when: background = soldier": no earlier step "background" in the flow of bob/,
  );
});

test('F7: the "when:" target must be a choice step', () => {
  fails(
    { [ANN]: replace('## choice: background', '## text: free\nprompt: x\n\n## choice: background'), [DETAILS]: replace('when: background = sage', 'when: free = sage') },
    /^content\/session-two\/steps\/a-details\.md line 15: "when: free = sage": step "free" must be a choice step without multi: true \(character ann\)/,
  );
});

test('F7: the "when:" target must not be multi', () => {
  fails(
    { [ANN]: replace('## choice: subclass\n', '## choice: subclass\nmulti: true\n'), [DETAILS]: replace('when: background = soldier', 'when: subclass = first') },
    /^content\/session-two\/steps\/a-details\.md line 4: "when: subclass = first": step "subclass" must be a choice step without multi: true \(character ann\)/,
  );
});

test('F8: two steps with the same "when:" target and value name both step ids', () => {
  fails({ [OTHER]: replace('background = _else', 'background = soldier') }, /^content\/session-two\/steps\/b-other\.md line 4: steps "details_soldier" and "details_other" both show on "background = soldier" \(character ann\)/);
});

test('F8: two "_else" steps for one target name both step ids', () => {
  fails({ [DETAILS]: replace('when: background = sage', 'when: background = _else') }, /^content\/session-two\/steps\/b-other\.md line 4: steps "details_sage" and "details_other" both show on "background = _else" \(character ann\)/);
});

test('F9: a "context:" target that is nowhere', () => {
  fails({ [ANN]: replace('context: god', 'context: nothing') }, /^content\/session-two\/characters\/ann\.md line 21: "context: nothing": there is no such step earlier in the flow of ann or in its Session One file/);
});

test('F9: a "context:" target that is an info step', () => {
  fails({ [ANN]: replace('context: god', 'context: lore') }, /^content\/session-two\/characters\/ann\.md line 21: "context: lore": an info step has no answer to show/);
  fails({ [ANN]: replace('context: god', 'context: note') }, /^content\/session-two\/characters\/ann\.md line 21: "context: note": an info step has no answer to show/);
});

test('F10: Session One still rejects from / when / context and a background: front-matter line', () => {
  const s1 = (edits) => () => loadContent(copyWith(BASIC, edits).s1Dir);
  const ann1 = 'session-one/characters/ann.md';
  const rejects = (edits, re) => assert.throws(s1(edits), (e) => e instanceof ContentError && re.test(e.message), String(re));
  rejects({ [ann1]: replace('## choice: god\n', '## choice: god\nfrom: session-one\n') }, /^content\/session-one\/characters\/ann\.md line \d+: unknown key "from" \(allowed: title, prompt, hint, multi, optional, other, use, link\)/);
  rejects({ [ann1]: replace('## choice: god\n', '## choice: god\nwhen: background = sage\n') }, /^content\/session-one\/characters\/ann\.md line \d+: unknown key "when"/);
  rejects({ [ann1]: replace('## choice: god\n', '## choice: god\ncontext: background\n') }, /^content\/session-one\/characters\/ann\.md line \d+: unknown key "context"/);
  rejects({ [ann1]: replace('order: 1\n', 'order: 1\nbackground: soldier\n') }, /^content\/session-one\/characters\/ann\.md line 7: unknown front-matter line "background: soldier" \(allowed: id, name, class, icon, order\)/);
});

// ---------------------------------------------------------------- the real content

const real = () => ({ s1Dir: path.join(REAL, REAL_LAYOUT.s1), s2Dir: path.join(REAL, REAL_LAYOUT.s2) });

test('real content: loadSessionTwo on content/session-one + content/session-two does not throw', () => {
  const c = loadSessionTwo(real());
  assert.deepEqual(c.characters.map((x) => x.id).sort(), ['bebby', 'deq', 'tenni', 'turator', 'vilhelm']);
  assert.equal(c.commonLore.id, 'intro');
  for (const ch of c.characters) assert.ok(ch.name && ch.cls, ch.id);
  assert.equal(c.characters.find((x) => x.id === 'deq').name, 'רזול');
});

test('real content: Session One content is unchanged by the loader (it still loads alone)', () => {
  const before = JSON.stringify(loadContent(real().s1Dir));
  loadSessionTwo(real());
  assert.equal(JSON.stringify(loadContent(real().s1Dir)), before);
});

// Every background id Session Two must give a details step: all Session One options + all bg_* terms.
// Returns { missing: [ids with no "when: background = <id>" step], elseSteps: [ids of the _else steps] }.
function detailsCoverage({ s1Dir, s2Dir }) {
  const s1 = loadContent(s1Dir);
  const s2 = loadSessionTwo({ s1Dir, s2Dir });
  const wanted = new Set();
  for (const ch of s1.characters) for (const o of ch.steps.find((s) => s.id === 'background')?.options || []) wanted.add(o.id);
  for (const id of Object.keys(s2.terms)) if (id.startsWith('bg_')) wanted.add(id.slice(3));
  const steps = s2.characters[0].steps.filter((s) => s.when?.step === 'background');
  const has = new Set(steps.map((s) => s.when.value));
  return { missing: [...wanted].filter((id) => !has.has(id)).sort(), elseSteps: steps.filter((s) => s.when.value === '_else').map((s) => s.id), wanted };
}

test('real content: every Session One background and every bg_ term has a details step; exactly one _else step', () => {
  const { missing, elseSteps, wanted } = detailsCoverage(real());
  assert.deepEqual(missing, []);
  assert.deepEqual(elseSteps, ['details_other']);
  assert.ok(wanted.size >= 26, `only ${wanted.size} backgrounds found`);
});

test('real content: every character gets the same details steps', () => {
  const c = loadSessionTwo(real());
  const ids = (ch) => ch.steps.filter((s) => s.id.startsWith('details_')).map((s) => s.id);
  for (const ch of c.characters) assert.deepEqual(ids(ch), ids(c.characters[0]), ch.id);
});

test('real content: deleting details_soldier from a copy fails the coverage test', () => {
  const dirs = copyWith(REAL, {});
  const f = path.join(dirs.s2Dir, 'steps', 'background-details.md');
  const text = fs.readFileSync(f, 'utf8');
  const cut = text.replace(/## choice: details_soldier\n[\s\S]*?(?=## choice: details_)/, '');
  assert.notEqual(cut, text, 'the mutation changed nothing');
  fs.writeFileSync(f, cut);
  assert.deepEqual(detailsCoverage(dirs).missing, ['soldier']);
});

test('real content: each character\'s subclass step has exactly the four 2024 PHB subclasses of its class', () => {
  const want = {
    turator: ['devotion', 'glory', 'ancients', 'vengeance'],
    deq: ['berserker', 'wild_heart', 'world_tree', 'zealot'],
    tenni: ['life', 'light', 'trickery', 'war'],
    bebby: ['arcane_trickster', 'assassin', 'soulknife', 'thief'],
    vilhelm: ['abjurer', 'diviner', 'evoker', 'illusionist'],
  };
  const c = loadSessionTwo(real());
  for (const [id, ids] of Object.entries(want)) {
    const st = stepOf(c, id, 'subclass');
    assert.equal(st.type, 'choice', id);
    assert.deepEqual(st.options.map((o) => o.id), ids, id);
    // the step comes first, then the carried background, then the shared details steps
    assert.deepEqual(stepsOf(c, id).slice(0, 2).map((s) => s.id), ['subclass', 'background'], id);
    assert.equal(stepOf(c, id, 'background').carry, true, id);
  }
});

test('real content: every context target and when target resolves (the draft grammar is accepted unchanged)', () => {
  const c = loadSessionTwo(real());
  for (const ch of c.characters)
    for (const s of ch.steps) {
      if (s.context) assert.ok(s.context.question, `${ch.id}/${s.id}`);
      if (s.when) assert.ok(ch.steps.findIndex((x) => x.id === s.when.step) < ch.steps.indexOf(s), `${ch.id}/${s.id}`);
    }
});
