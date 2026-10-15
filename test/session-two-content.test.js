// Session Two content loader: loadSessionTwo({ s1Dir, s2Dir }) is the seam. Each test copies the
// fixture tree (content/session-one + content/session-two) to a temp dir, edits one file, and
// checks the parsed shape or the ContentError (file + line, F1-F10).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSessionTwo, ContentError } from '../session-two-content.js';
import { loadContent, contentFor } from '../session-one-content.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASIC = path.join(HERE, 'fixtures', 'session-two', 'basic', 'content');
const CUSTOM = path.join(HERE, 'fixtures', 'session-two', 'custom', 'content'); // basic + a custom background, count:, option when:, random:
const REAL = path.join(HERE, '..', 'content');

// Copy a content/ tree to a temp dir; edits: { 'session-two/steps/x.md': text | (old) => new }.
function copyWith(from, edits = {}) {
  const root = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 's2-')), 'content');
  fs.cpSync(from, root, { recursive: true });
  for (const [rel, e] of Object.entries(edits)) {
    const f = path.join(root, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, typeof e === 'function' ? e(fs.readFileSync(f, 'utf8')) : e);
  }
  return root;
}
const loadFrom = (root) => loadSessionTwo({ s1Dir: path.join(root, 'session-one'), s2Dir: path.join(root, 'session-two') });
const load = (edits, from = BASIC) => loadFrom(copyWith(from, edits));
const replace = (a, b) => (s) => {
  assert.ok(s.includes(a), `fixture has no "${a}"`);
  return s.replace(a, b);
};
const char = (c, id) => c.characters.find((x) => x.id === id);
const step = (c, cid, sid) => char(c, cid).steps.find((s) => s.id === sid);

// The load must throw a ContentError "content/<file> line <n>: <message>" where line <n> of that
// file holds `lineText`; `message` is matched against the part after the colon.
function fails(edits, { file, lineText, message, from = BASIC }) {
  const root = copyWith(from, edits);
  assert.throws(
    () => loadFrom(root),
    (e) => {
      assert.ok(e instanceof ContentError, `not a ContentError: ${e}`);
      const m = e.message.match(/^(content\/[^ ]+) line (\d+): (.*)$/s);
      assert.ok(m, `no "<file> line <n>:" prefix: ${e.message}`);
      assert.equal(m[1], `content/${file}`);
      const line = fs.readFileSync(path.join(root, file), 'utf8').split('\n')[Number(m[2]) - 1];
      assert.ok(line.trim().startsWith(lineText), `line ${m[2]} is "${line}", expected it to start with "${lineText}"`);
      assert.match(m[3], message instanceof RegExp ? message : new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      return true;
    },
  );
}

const A = 'session-two/characters/a.md';
const B = 'session-two/characters/b.md';
const DETAILS = 'session-two/steps/details.md';
const CA = 'session-two/characters/a.md'; // in CUSTOM
const CB = 'session-two/characters/b.md'; // in CUSTOM

// ---------------------------------------------------------------- shape

test('shape: front matter is inherited from Session One, and written values win', () => {
  const c = load();
  const a = char(c, 'a');
  assert.deepEqual({ name: a.name, cls: a.cls, icon: a.icon, background: a.background }, { name: 'א', cls: 'לוחם', icon: 'shield', background: undefined });
  assert.ok(!('background' in a));
  const b = char(c, 'b');
  assert.deepEqual({ name: b.name, cls: b.cls, icon: b.icon, background: b.background }, { name: 'בי', cls: 'קוסם-על', icon: 'hat', background: 'noble' });
  assert.ok(!('order' in a) && !('order' in b));
});

test('shape: characters sort by order (written, else the Session One position)', () => {
  assert.deepEqual(load().characters.map((c) => c.id), ['b', 'a']); // b: order 0 beats a: Session One position 1
  const c = load({ [B]: replace('order: 0\n', '') });
  assert.deepEqual(c.characters.map((x) => x.id), ['a', 'b']);
});

test('shape: a character with no Session Two file is absent', () => {
  const root = copyWith(BASIC);
  fs.rmSync(path.join(root, B));
  assert.deepEqual(loadFrom(root).characters.map((c) => c.id), ['a']);
});

test('shape: commonLore is the intro step; terms are merged', () => {
  const c = load();
  assert.equal(c.commonLore.id, 'intro');
  assert.equal(c.commonLore.known[0].title, 'תת-מקצוע');
  assert.ok(c.terms.baal && c.terms.sc_path && c.terms.bg_sage);
  assert.equal(c.terms.sc_path.blurb, 'נתיב של [[baal]].');
});

test('shape: "from" copies the whole Session One step and adds carry', () => {
  const c = load();
  const s1 = loadContent(path.join(BASIC, 'session-one')).characters.find((x) => x.id === 'a');
  for (const id of ['background', 'lore']) assert.deepEqual(step(c, 'a', id), { ...s1.steps.find((s) => s.id === id), carry: true });
  assert.equal(step(c, 'a', 'background').options.length, 2);
  assert.equal(step(c, 'a', 'background').link.url, 'https://example.org/backgrounds');
  assert.ok(!('from' in step(c, 'a', 'background')));
});

test('shape: "when" and "context" become objects', () => {
  const c = load();
  assert.deepEqual(step(c, 'a', 'details_sage').when, { step: 'background', value: 'sage' });
  assert.deepEqual(step(c, 'a', 'details_other').when, { step: 'background', value: '_else' });
  assert.deepEqual(step(c, 'a', 'details_sage').context, {
    step: 'background',
    question: '📜 מה הרקע שלך?',
    options: [{ id: 'sage', label: 'חכם' }, { id: 'scribe', label: 'סופר' }],
  });
});

test('shape: a context on a Session One-only step (choice, text) reads that step; a text target has no options', () => {
  const c = load();
  assert.deepEqual(step(c, 'a', 'subclass').context, {
    step: 'element',
    question: 'מה היסוד שלך?',
    options: [{ id: 'fire', label: 'אש' }, { id: 'cold', label: 'קור' }],
  });
  const t = load({ [A]: replace('context: element', 'context: dream') });
  assert.deepEqual(step(t, 'a', 'subclass').context, { step: 'dream', question: 'מה החלום שלך?', options: [] });
  const m = load({ [A]: replace('context: element', 'context: tools') });
  assert.equal(step(m, 'a', 'subclass').context.options.length, 2); // a multi target is allowed (F25)
});

test('shape: a context on an earlier Session Two step is allowed', () => {
  const c = load({
    [A]: (t) => t.replace('context: element\n', '').replace('from: session-one\n\n## info', 'from: session-one\n\n## text: why\ncontext: subclass\nprompt: למה?\n\n## info'),
  });
  assert.equal(step(c, 'a', 'why').context.step, 'subclass');
  assert.equal(step(c, 'a', 'why').context.question, 'איזה נתיב?');
  assert.deepEqual(step(c, 'a', 'why').context.options.map((o) => o.id), ['path_one', 'path_two']);
});

test('shape: shared steps come after the character\'s own steps, in file-name order, per character', () => {
  const c = load({ 'session-two/steps/a-first.md': '## text: first_shared\nprompt: ראשון\n' });
  assert.deepEqual(char(c, 'a').steps.map((s) => s.id), ['subclass', 'background', 'lore', 'first_shared', 'details_sage', 'details_scribe', 'details_noble', 'details_other']);
  assert.deepEqual(char(c, 'b').steps.map((s) => s.id), ['subclass', 'background', 'first_shared', 'details_sage', 'details_scribe', 'details_noble', 'details_other']);
  assert.notEqual(step(c, 'a', 'details_sage'), step(c, 'b', 'details_sage')); // a copy per character
});

test('shape: a shared step may use a list from session-two/lists', () => {
  const c = load({
    'session-two/lists/pair.md': 'prompt: זוג\n\n### אחד\nid: one\n\n### שניים\nid: two\n',
    [DETAILS]: (s) => s + '\n## choice: pair_step\nuse: pair\n',
  });
  assert.deepEqual(step(c, 'a', 'pair_step').options.map((o) => o.id), ['one', 'two']);
});

test('contentFor works on the result: a player gets no other character\'s secret', () => {
  const c = load();
  assert.ok(step(c, 'a', 'lore').secret, 'fixture: the copied Session One step carries a secret');
  assert.equal(contentFor(c, { isAdmin: true, character: 'b' }), c);
  const asB = contentFor(c, { isAdmin: false, character: 'b' });
  assert.ok(!('secret' in step(asB, 'a', 'lore')));
  assert.ok(!JSON.stringify(asB).includes('של א.'));
  const asA = contentFor(c, { isAdmin: false, character: 'a' });
  assert.equal(step(asA, 'a', 'lore').secret[0].title, 'סוד');
  const none = contentFor(c, { isAdmin: false, character: undefined });
  assert.ok(!JSON.stringify(none).includes('של א.'));
  assert.ok(asB.terms.baal && asB.terms.sc_path); // terms the visible content reaches
});

// ------------------------------------------------- errors: terms, intro, ids

test('terms: an id used by Session One and Session Two names both places', () => {
  fails(
    { 'session-two/terms/extra.md': (s) => s.replace('id: sc_path', 'id: baal') },
    { file: 'session-two/terms/extra.md', lineText: '### נתיב', message: 'term id "baal" is used by another term (content/session-one/terms/base.md line 1)' },
  );
});

test('terms: an id used twice inside Session Two names the first place', () => {
  fails(
    { 'session-two/terms/more.md': '### עוד\nid: sc_path\nen: More\ncategory: class\n' },
    { file: 'session-two/terms/more.md', lineText: '### עוד', message: 'content/session-two/terms/extra.md line 1' },
  );
});

test('terms: a Session Two [[reference]] to an unknown term is an error with file and line', () => {
  fails(
    { [DETAILS]: replace('title: איפה למדת?', 'title: איפה [[nope]] למדת?') },
    { file: DETAILS, lineText: 'title: איפה', message: '[[nope]]: there is no term "nope"' },
  );
});

test('intro: missing file, no step, two steps, a non-info step', () => {
  const root = copyWith(BASIC);
  fs.rmSync(path.join(root, 'session-two/intro.md'));
  assert.throws(() => loadFrom(root), (e) => e instanceof ContentError && e.message === 'content/session-two/intro.md: file is missing');
  for (const text of ['# x\n', '## info: a\n### known\n- **x** y\n\n## info: b\n### known\n- **x** y\n', '## text: a\nprompt: x\n'])
    assert.throws(() => load({ 'session-two/intro.md': text }), (e) => e instanceof ContentError && /^content\/session-two\/intro\.md: holds exactly one "## info: <id>" step/.test(e.message));
});

test('intro: "from", "when", "context" are unknown keys there', () => {
  fails({ 'session-two/intro.md': replace('title: סשן שני', 'title: סשן שני\nwhen: a = b') }, { file: 'session-two/intro.md', lineText: 'when: a = b', message: 'unknown key "when"' });
});

test('a step id repeated between own and shared steps is an error naming the other file', () => {
  fails(
    { [DETAILS]: (s) => s + '\n## text: subclass\nprompt: x\n' },
    { file: DETAILS, lineText: '## text: subclass', message: 'step id "subclass" is used twice in the flow of character "a" (also in content/session-two/characters/a.md)' },
  );
});

test('two files with one character id is an error', () => {
  fails(
    { 'session-two/characters/c.md': fs.readFileSync(path.join(BASIC, B), 'utf8') },
    { file: 'session-two/characters/c.md', lineText: 'id: b', message: 'character id "b" is used by another file' },
  );
});

// ------------------------------------------------- F1-F10

test('F1: a character id with no Session One character', () => {
  fails({ [A]: replace('id: a', 'id: zed') }, { file: A, lineText: 'id: zed', message: 'no Session One character "zed"' });
});

test('F2: an unknown front-matter key lists the allowed ones', () => {
  fails({ [A]: replace('id: a', 'id: a\nlevel: 3') }, { file: A, lineText: 'level: 3', message: 'unknown front-matter line "level: 3" (allowed: id, name, class, icon, order, background)' });
});

test('F3: background: with no bg_ term', () => {
  fails({ [B]: replace('background: noble', 'background: ghost') }, { file: B, lineText: 'background: ghost', message: 'background "ghost": there is no term "bg_ghost"' });
});

test('F4: from: with another source', () => {
  fails({ [A]: replace('from: session-one\n\n## info', 'from: session-two\n\n## info') }, { file: A, lineText: 'from: session-two', message: '"from: session-two": the only source is "session-one"' });
});

test('F4: a from: step with another key', () => {
  fails({ [A]: replace('## choice: background\nfrom: session-one', '## choice: background\nfrom: session-one\ntitle: x') }, { file: A, lineText: '## choice: background', message: 'holds no other key' });
});

test('F4: a from: step with options', () => {
  fails({ [A]: replace('## choice: background\nfrom: session-one', '## choice: background\nfrom: session-one\n\n### x\nid: x') }, { file: A, lineText: '## choice: background', message: 'holds no other key and no ### sections (found: options)' });
});

test('F4: the Session One character has no step with that id', () => {
  fails({ [A]: replace('## choice: background\nfrom: session-one', '## choice: faith\nfrom: session-one') }, { file: A, lineText: 'from: session-one', message: 'character "a" has no Session One step "faith"' });
});

test('F4: the heading type differs from the Session One step', () => {
  fails({ [A]: replace('## choice: background\nfrom: session-one', '## text: background\nfrom: session-one') }, { file: A, lineText: '## text: background', message: 'is a choice step, this heading says text' });
});

test('F5: when: syntax', () => {
  for (const bad of ['background', 'background sage', 'Background = sage', 'background = ', 'background = a b'])
    fails({ [DETAILS]: replace('when: background = sage', `when: ${bad}`) }, { file: DETAILS, lineText: 'when:', message: 'is "when: <step id> = <option id>"' });
});

test('F6: when: names a step that is not earlier in this character\'s flow (checked per character)', () => {
  fails({ [DETAILS]: replace('when: background = sage', 'when: later = sage') }, { file: DETAILS, lineText: 'when: later = sage', message: '"later" is not an earlier step of character "a"' });
  // a step that exists, but only later in the flow
  fails({ [DETAILS]: replace('when: background = sage', 'when: details_other = x') }, { file: DETAILS, lineText: 'when: details_other = x', message: 'not an earlier step of character "a"' });
  // only character b lacks the target: the error names b
  fails({ [B]: replace('## choice: background\nfrom: session-one', '## text: other\nprompt: x') }, { file: DETAILS, lineText: 'when: background = sage', message: 'character "b"' });
});

test('F7: when: target is a text step, an info step, or multi', () => {
  fails({ [DETAILS]: replace('when: background = sage', 'when: lore = sage') }, { file: DETAILS, lineText: 'when: lore = sage', message: 'must be a single-answer choice step' });
  const multi = '## choice: pick\nmulti: true\nprompt: x\n\n### a\nid: a\n\n';
  fails({ [DETAILS]: (s) => s.replace('## choice: details_sage', `${multi}## choice: details_sage`).replace('when: background = sage', 'when: pick = a') }, { file: DETAILS, lineText: 'when: pick = a', message: 'must be a single-answer choice step' });
  fails({ [DETAILS]: (s) => s.replace('## choice: details_sage', '## text: txt\nprompt: x\n\n## choice: details_sage').replace('when: background = sage', 'when: txt = a') }, { file: DETAILS, lineText: 'when: txt = a', message: 'must be a single-answer choice step' });
});

test('F8: two shared steps with the same when: target and value, or two _else, name both step ids', () => {
  fails({ [DETAILS]: replace('when: background = scribe', 'when: background = sage') }, { file: DETAILS, lineText: 'when: background = sage', message: 'steps "details_sage" and "details_scribe" both have "when: background = sage" (a shared step' });
  fails({ [DETAILS]: (s) => s + '\n## text: details_more\nwhen: background = _else\nprompt: x\n' }, { file: DETAILS, lineText: 'when: background = _else', message: 'steps "details_other" and "details_more" both have "when: background = _else"' });
});

test('F8: several steps of one character file may share a when: value (custom background)', () => {
  const c = load({}, CUSTOM);
  assert.deepEqual(char(c, 'a').steps.filter((s) => s.when?.value === 'mystic').map((s) => s.id), ['mystic_tools', 'mystic_langs', 'mystic_path', 'mystic_story']);
  assert.equal(char(c, 'b').steps.some((s) => s.when?.value === 'mystic'), false); // b has none
});

test('F8: a character step and a shared step with the same when: target and value is an error (reported at the shared step)', () => {
  fails({ [DETAILS]: replace('when: background = scribe', 'when: background = mystic') }, { from: CUSTOM, file: DETAILS, lineText: 'when: background = mystic', message: 'steps "mystic_tools" and "details_scribe" both have "when: background = mystic" (a shared step (steps/*.md) cannot share' });
});

test('F8: two _else steps of one character file are an error, even in the same file', () => {
  const twoElse = '## text: else_one\nwhen: background = _else\nprompt: x\n\n## text: else_two\nwhen: background = _else\nprompt: y\n';
  fails({ [CA]: (s) => s + '\n' + twoElse }, { from: CUSTOM, file: CA, lineText: 'when: background = _else', message: 'steps "else_one" and "else_two" both have "when: background = _else" (only one step per character may have "= _else")' });
  // the error is at the second one
  const root = copyWith(CUSTOM, { [CA]: (s) => s + '\n' + twoElse });
  assert.throws(() => loadFrom(root), (e) => /characters\/a\.md line (\d+)/.test(e.message) && fs.readFileSync(path.join(root, CA), 'utf8').split('\n')[Number(e.message.match(/line (\d+)/)[1]) - 2].includes('else_two'));
});

test('F9: context: target is in neither flow nor the Session One file, or is an info step', () => {
  fails({ [A]: replace('context: element', 'context: nowhere') }, { file: A, lineText: 'context: nowhere', message: 'has no such earlier step, and no such Session One step' });
  fails({ [A]: replace('context: element', 'context: lore') }, { file: A, lineText: 'context: lore', message: 'an info step has no answer to show' });
  // a Session Two step that comes later does not count (and Session One has none of that id)
  fails({ [A]: replace('context: element', 'context: details_sage') }, { file: A, lineText: 'context: details_sage', message: 'has no such earlier step' });
  // another character's Session One step does not count: element is a's, not b's
  fails({ [B]: replace('prompt: איזו אסכולה?', 'prompt: איזו אסכולה?\ncontext: element') }, { file: B, lineText: 'context: element', message: 'character "b" has no such earlier step' });
});

test('F10: from / when / context in a Session One file are "unknown key" errors, as are background: in its front matter', () => {
  const S1A = 'session-one/characters/a.md';
  for (const key of ['from: session-one', 'when: a = b', 'context: a'])
    fails({ [S1A]: replace('## choice: element', `## choice: element\n${key}`) }, { file: S1A, lineText: key, message: `unknown key "${key.split(':')[0]}"` });
  fails({ [S1A]: replace('order: 1', 'order: 1\nbackground: sage') }, { file: S1A, lineText: 'background: sage', message: 'unknown front-matter line "background: sage" (allowed: id, name, class, icon, order)' });
  // and Session One's own loader says the same
  const root = copyWith(BASIC, { [S1A]: replace('## choice: element', '## choice: element\nfrom: x') });
  assert.throws(() => loadContent(path.join(root, 'session-one')), /unknown key "from"/);
});

test('F28: a Session One content error is reported as is', () => {
  fails({ 'session-one/world.md': replace('## info: world', '## info: world\nbogus: 1') }, { file: 'session-one/world.md', lineText: 'bogus: 1', message: 'unknown key "bogus"' });
});

test('shared steps: no ### known / ### secret, no front matter', () => {
  fails({ [DETAILS]: (s) => s + '\n## info: lore2\n\n### known\n- **x** y\n' }, { file: DETAILS, lineText: '### known', message: 'a shared step is a choice or text step' });
  fails({ [DETAILS]: (s) => `---\nid: x\n---\n${s}` }, { file: DETAILS, lineText: '---', message: 'text before the first "## <type>: <id>" step heading' });
});

// ------------------------------------------------- count:, random:, option when: (D14)

test('shape: count and random come out as written; option when becomes { step, value } without a line number', () => {
  const c = load({}, CUSTOM);
  assert.equal(step(c, 'a', 'mystic_tools').count, 2);
  assert.equal(step(c, 'a', 'mystic_tools').multi, true);
  assert.equal(step(c, 'a', 'trait').random, true);
  assert.deepEqual(step(c, 'a', 'trait').options.map((o) => o.when), [undefined, { step: 'background', value: 'sage' }, { step: 'background', value: 'scribe' }, undefined]);
  assert.ok(!JSON.stringify(c).includes('whenLine'));
  assert.equal(char(c, 'a').background, 'mystic');
  assert.ok(c.terms.bg_mystic);
});

test('shape: "random: false" is dropped from the output', () => {
  const c = load({ [CA]: replace('random: true', 'random: false') }, CUSTOM);
  assert.ok(!('random' in step(c, 'a', 'trait')));
});

test('shape: count and random work in a shared step too', () => {
  const c = load({ 'session-two/steps/more.md': '## choice: m\nmulti: true\ncount: 2\nprompt: x\n\n### א\nid: x\n\n### ב\nid: y\n\n## choice: r\nrandom: true\nprompt: y\n\n### ג\nid: z\n' }, CUSTOM);
  assert.equal(step(c, 'a', 'm').count, 2);
  assert.equal(step(c, 'b', 'r').random, true);
});

test('count: only on a multi: true choice step', () => {
  fails({ [CA]: replace('multi: true\ncount: 2\nprompt: בחר/י שני כלים', 'count: 2\nprompt: בחר/י שני כלים') }, { from: CUSTOM, file: CA, lineText: 'count: 2', message: '"count: 2" works on a choice step with "multi: true" only' });
  fails({ [CA]: replace('multi: true\ncount: 2\nprompt: בחר/י שני כלים', 'multi: false\ncount: 2\nprompt: בחר/י שני כלים') }, { from: CUSTOM, file: CA, lineText: 'count: 2', message: 'with "multi: true" only' });
  fails({ [CA]: replace('when: background = mystic\nprompt: ספר/י', 'when: background = mystic\ncount: 2\nprompt: ספר/י') }, { from: CUSTOM, file: CA, lineText: 'count: 2', message: 'with "multi: true" only' });
});

test('count: a whole number from 2 to the number of options', () => {
  for (const [bad, msg] of [['1', 'from 2 to the number of options (3)'], ['0', 'from 2 to'], ['4', 'from 2 to the number of options (3)']])
    fails({ [CA]: replace('multi: true\ncount: 2\nprompt: בחר/י שני כלים', `multi: true\ncount: ${bad}\nprompt: בחר/י שני כלים`) }, { from: CUSTOM, file: CA, lineText: `count: ${bad}`, message: msg });
  for (const bad of ['two', '2.5', '-2', '']) // "" is an empty value
    fails({ [CA]: replace('multi: true\ncount: 2\nprompt: בחר/י שני כלים', `multi: true\ncount: ${bad}\nprompt: בחר/י שני כלים`) }, { from: CUSTOM, file: CA, lineText: 'count:', message: 'count is a whole number' });
  assert.equal(step(load({ [CA]: replace('multi: true\ncount: 2\nprompt: בחר/י שני כלים', 'multi: true\ncount: 3\nprompt: בחר/י שני כלים') }, CUSTOM), 'a', 'mystic_tools').count, 3);
});

test('count: appears twice in one step', () => {
  fails({ [CA]: replace('count: 2\nprompt: בחר/י שני כלים', 'count: 2\ncount: 3\nprompt: בחר/י שני כלים') }, { from: CUSTOM, file: CA, lineText: 'count: 3', message: '"count:" appears twice in this step' });
});

test('random: only on a single-answer choice step', () => {
  fails({ [CA]: replace('random: true\nprompt: מה התכונה', 'random: true\nmulti: true\nprompt: מה התכונה') }, { from: CUSTOM, file: CA, lineText: 'random: true', message: 'works on a single-answer choice step only' });
  fails({ [CA]: replace('when: background = mystic\nprompt: ספר/י', 'when: background = mystic\nrandom: true\nprompt: ספר/י') }, { from: CUSTOM, file: CA, lineText: 'random: true', message: 'works on a single-answer choice step only' });
  fails({ [CA]: (s) => s + '\n## info: note\nrandom: true\n\n### known\n- x\n' }, { from: CUSTOM, file: CA, lineText: 'random: true', message: 'works on a single-answer choice step only' });
  fails({ [CA]: replace('random: true', 'random: yes') }, { from: CUSTOM, file: CA, lineText: 'random: yes', message: '"random:" is true or false' });
  fails({ [CA]: replace('random: true', 'random: true\nrandom: false') }, { from: CUSTOM, file: CA, lineText: 'random: false', message: '"random:" appears twice' });
});

test('option when: F5 syntax, with the same message as a step when', () => {
  for (const bad of ['background', 'background sage', 'Background = sage', 'background = ', 'background = a b'])
    fails({ [CA]: replace('when: background = sage', `when: ${bad}`) }, { from: CUSTOM, file: CA, lineText: 'when:', message: 'is "when: <step id> = <option id>"' });
});

test('option when: "= _else" is not allowed on an option', () => {
  fails({ [CA]: replace('when: background = sage', 'when: background = _else') }, { from: CUSTOM, file: CA, lineText: 'when: background = _else', message: 'option "bookish": "when: background = _else": "= _else" is not allowed on an option' });
});

test('option when: F6 the target must be an earlier step of this character (checked per character, shared steps too)', () => {
  fails({ [CA]: replace('when: background = sage', 'when: later = sage') }, { from: CUSTOM, file: CA, lineText: 'when: later = sage', message: '"later" is not an earlier step of character "a"' });
  // a step that exists but only later in the flow
  fails({ [CA]: replace('when: background = sage', 'when: details_other = sage') }, { from: CUSTOM, file: CA, lineText: 'when: details_other = sage', message: 'not an earlier step of character "a"' });
  // a shared step: b has no "trait" step, so only the check for b can fail
  const shared = '## choice: s1\nprompt: x\n\n### א\nid: x\n\n## choice: s2\nprompt: y\n\n### ב\nid: y\n\n### ג\nid: z\nwhen: trait = calm\n';
  fails({ 'session-two/steps/more.md': shared }, { from: CUSTOM, file: 'session-two/steps/more.md', lineText: 'when: trait = calm', message: 'character "b"' });
});

test('option when: F7 the target is a multi, text or info step', () => {
  fails({ [CA]: replace('when: background = sage', 'when: mystic_tools = wrench') }, { from: CUSTOM, file: CA, lineText: 'when: mystic_tools = wrench', message: 'must be a single-answer choice step' }); // mystic_tools is earlier and multi
  fails({ [CA]: replace('when: background = sage', 'when: mystic_story = x') }, { from: CUSTOM, file: CA, lineText: 'when: mystic_story = x', message: 'must be a single-answer choice step' });
  fails({ [CA]: replace('when: background = sage', 'when: lore = x') }, { from: CUSTOM, file: CA, lineText: 'when: lore = x', message: 'must be a single-answer choice step' });
});

test('option when: the value must be an option of the target step', () => {
  fails({ [CA]: replace('when: background = sage', 'when: background = sagee') }, { from: CUSTOM, file: CA, lineText: 'when: background = sagee', message: '"background" has no option "sagee"' });
});

test('when-value rule: a step when: value must be an option id of the target (background also takes a bg_<value> term)', () => {
  fails({ [DETAILS]: replace('when: background = scribe', 'when: background = scribee') }, { file: DETAILS, lineText: 'when: background = scribee', message: '"when: background = scribee": "background" has no option "scribee"' });
  fails({ [CA]: replace('when: background = mystic\nprompt: ספר/י', 'when: subclass = nowhere\nprompt: ספר/י') }, { from: CUSTOM, file: CA, lineText: 'when: subclass = nowhere', message: '"subclass" has no option "nowhere"' });
  // "mystic" is no option of the background step but has a bg_mystic term (and is a's own background:); b has no override
  const c = load({ [CB]: (s) => s + '\n## text: b_extra\nwhen: background = mystic\nprompt: x\n' }, CUSTOM);
  assert.equal(step(c, 'b', 'b_extra').when.value, 'mystic');
  fails({ [CB]: (s) => s + '\n## text: b_extra\nwhen: background = nonesuch\nprompt: x\n' }, { from: CUSTOM, file: CB, lineText: 'when: background = nonesuch', message: '"background" has no option "nonesuch"' });
  // _else is never checked against the options
  assert.ok(load({}, CUSTOM)); // the shared details_other has "= _else" and loads
});

test('option when: at least one option of the step has none', () => {
  fails({ [CA]: (s) => replace('### 🧘 רגוע\nid: calm\n', '### 🧘 רגוע\nid: calm\nwhen: background = sage\n')(replace('### 🐗 פראי\nid: wild', '### 🐗 פראי\nid: wild\nwhen: background = sage')(s)) }, { from: CUSTOM, file: CA, lineText: '## choice: trait', message: 'every option of step "trait" has a "when:"' });
});

test('option when: two when lines in one option', () => {
  fails({ [CA]: replace('when: background = sage', 'when: background = sage\nwhen: background = scribe') }, { from: CUSTOM, file: CA, lineText: 'when: background = scribe', message: '"when:" appears twice in this option' });
});

test('Session One keeps rejecting count: and random: (F10)', () => {
  const S1A = 'session-one/characters/a.md';
  for (const key of ['count: 2', 'random: true'])
    fails({ [S1A]: replace('## choice: element', `## choice: element\n${key}`) }, { file: S1A, lineText: key, message: `unknown key "${key.split(':')[0]}"` });
  const root = copyWith(BASIC, { [S1A]: replace('## choice: element', '## choice: element\nrandom: true') });
  assert.throws(() => loadContent(path.join(root, 'session-one')), /unknown key "random"/);
});

// ------------------------------------------------- "## shared" placement marker (D13, D14)

const ids = (c, cid) => char(c, cid).steps.map((s) => s.id);
const DETAIL_IDS = ['details_sage', 'details_scribe', 'details_noble', 'details_other'];

test('## shared: without the marker the shared steps go at the end (today\'s order)', () => {
  assert.deepEqual(ids(load({}, CUSTOM), 'a').slice(-5), ['trait', ...DETAIL_IDS]);
});

test('## shared: the shared steps are inserted at the marker, and a later step may use their answers', () => {
  const c = load({ [CA]: (s) => replace('## choice: trait', '## shared\n\n## choice: trait')(s) + '\n## choice: after\nwhen: details_sage = academy\nprompt: אחרי?\n\n### א\nid: x\n\n### ב\nid: y\n' }, CUSTOM);
  const all = ids(c, 'a');
  assert.deepEqual(all.slice(all.indexOf('mystic_story') + 1), [...DETAIL_IDS, 'trait', 'after']);
  assert.deepEqual(step(c, 'a', 'after').when, { step: 'details_sage', value: 'academy' });
  assert.ok(!JSON.stringify(c).includes('sharedAt'));
  // another character's file without a marker is unaffected
  assert.deepEqual(ids(c, 'b').slice(-DETAIL_IDS.length), DETAIL_IDS);
});

test('## shared: an own step before the marker cannot name a step that comes after it (F6, final order)', () => {
  fails({ [CA]: (s) => replace('## choice: trait', '## shared\n\n## choice: trait')(s).replace('## text: mystic_story\nwhen: background = mystic', '## text: mystic_story\nwhen: details_sage = academy') }, { from: CUSTOM, file: CA, lineText: 'when: details_sage = academy', message: '"details_sage" is not an earlier step' });
});

test('## shared: option when: on a step after the marker may name a background step before it', () => {
  assert.ok(load({ [CA]: replace('## choice: trait', '## shared\n\n## choice: trait') }, CUSTOM));
});

test('## shared: twice in one character file is an error at the second one', () => {
  fails({ [CA]: (s) => replace('## choice: trait', '## shared\n\n## choice: trait')(s) + '\n## shared\n' }, { from: CUSTOM, file: CA, lineText: '## shared', message: '"## shared" appears twice in this file (first at line 64)' });
});

test('## shared: in a shared step file is an error', () => {
  fails({ [DETAILS]: (s) => s + '\n## shared\n' }, { file: DETAILS, lineText: '## shared', message: 'belongs in a character file, not in a shared step file' });
});

test('## shared: holds no keys and no text', () => {
  fails({ [CA]: replace('## choice: trait', '## shared\nwhen: background = sage\n\n## choice: trait') }, { from: CUSTOM, file: CA, lineText: 'when: background = sage', message: 'a line of its own' });
});

test('## shared: Session One keeps the unknown-heading error', () => {
  const S1A = 'session-one/characters/a.md';
  fails({ [S1A]: replace('## choice: element', '## shared\n\n## choice: element') }, { file: S1A, lineText: '## shared', message: 'a step heading is "## <type>: <id>"' });
});

test('count: and random: are unknown keys in the intro and in lists', () => {
  fails({ 'session-two/intro.md': replace('title: סשן שני', 'title: סשן שני\ncount: 2') }, { file: 'session-two/intro.md', lineText: 'count: 2', message: 'unknown key "count"' });
  fails({ 'session-two/lists/pair.md': 'random: true\nprompt: זוג\n\n### אחד\nid: one\n' }, { file: 'session-two/lists/pair.md', lineText: 'random: true', message: 'unknown key "random"' });
});

test('coverage: a custom background covered by one character\'s own steps is accepted; uncovered, it fails', () => {
  const s1Dir = path.join(CUSTOM, 'session-one');
  const gaps = (root) => coverageGaps(loadFrom(root), s1Dir);
  // basic has no shared step for bg_mystic, a covers it itself: only the shared noble/sage/scribe/_else matter
  assert.deepEqual(gaps(copyWith(CUSTOM)), []);
  // remove a's mystic steps: bg_mystic is covered by nobody
  const root = copyWith(CUSTOM, {
    [CA]: (s) => s.slice(0, s.indexOf('## choice: mystic_tools')) + s.slice(s.indexOf('## choice: trait')),
  });
  assert.deepEqual(gaps(root).sort(), ['a: no when: background = mystic', 'b: no when: background = mystic']);
});

// ---------------------------------------------------------------- real content

const REAL_S1 = path.join(REAL, 'session-one');
const REAL_S2 = path.join(REAL, 'session-two');

test('real content: loadSessionTwo on content/session-one + content/session-two does not throw', () => {
  const c = loadSessionTwo({ s1Dir: REAL_S1, s2Dir: REAL_S2 });
  assert.deepEqual(c.characters.map((x) => x.id).sort(), ['bebby', 'deq', 'tenni', 'turator', 'vilhelm']);
  assert.equal(c.commonLore.id, 'intro');
  const s1 = loadContent(REAL_S1);
  for (const x of c.characters) {
    const s1c = s1.characters.find((y) => y.id === x.id);
    assert.deepEqual({ name: x.name, cls: x.cls, icon: x.icon }, { name: s1c.name, cls: s1c.cls, icon: s1c.icon });
  }
  for (const [id, t] of Object.entries(s1.terms)) assert.deepEqual(c.terms[id], t); // Session One terms are unchanged
});

// Every Session One background option and every bg_* term (Session One's or Session Two's) needs a
// `when: background = <id>` step. A custom background (its steps live in one character's file, e.g.
// Vilhelm's mharoti_scholar_criminal) is covered by those steps alone: an id that some characters cover
// and others do not is a custom one and is not required of the rest.
function coverageGaps(content, s1Dir = REAL_S1) {
  const s1 = loadContent(s1Dir);
  const wanted = new Set(Object.keys(content.terms).filter((id) => id.startsWith('bg_')).map((id) => id.slice(3)));
  for (const c of s1.characters)
    for (const o of c.steps.find((s) => s.id === 'background')?.options || []) wanted.add(o.id);
  const covers = (c, id) => c.steps.some((s) => s.when?.step === 'background' && s.when.value === id);
  const gaps = [];
  for (const id of wanted) {
    const covering = content.characters.filter((c) => covers(c, id));
    const custom = covering.length > 0 && covering.length < content.characters.length;
    if (!custom) for (const c of content.characters) if (!covers(c, id)) gaps.push(`${c.id}: no when: background = ${id}`);
  }
  for (const c of content.characters) {
    const elses = c.steps.filter((s) => s.when?.step === 'background' && s.when.value === '_else');
    if (elses.length !== 1) gaps.push(`${c.id}: ${elses.length} steps with when: background = _else (need exactly 1)`);
  }
  return gaps;
}

test('coverage: every Session One background option and every bg_* term has a details step, and one _else step exists', () => {
  const c = loadSessionTwo({ s1Dir: REAL_S1, s2Dir: REAL_S2 });
  assert.deepEqual(coverageGaps(c), []);
  assert.ok(Object.keys(c.terms).filter((id) => id.startsWith('bg_')).length >= 26);
});

test('coverage mutation: deleting details_soldier from a copy fails the coverage check', () => {
  const root = copyWith(REAL, {
    'session-two/steps/background-details.md': (s) => {
      const a = s.indexOf('## choice: details_soldier');
      const b = s.indexOf('\n## ', a + 1);
      assert.ok(a > 0 && b > a, 'details_soldier found');
      return s.slice(0, a) + s.slice(b + 1);
    },
  });
  const gaps = coverageGaps(loadFrom(root));
  assert.ok(gaps.length >= 5 && gaps.every((g) => g.endsWith('when: background = soldier')), gaps.join('\n'));
});

test('loader mutation: a second _else step fails the load (F8), before the coverage check runs', () => {
  const root = copyWith(REAL, { 'session-two/steps/background-details.md': (s) => s + '\n## text: details_extra\nwhen: background = _else\nprompt: x\n' });
  assert.throws(() => loadFrom(root), /both have "when: background = _else"/);
});

test('coverage mutation: deleting details_other leaves every character without an _else step', () => {
  const root = copyWith(REAL, {
    'session-two/steps/background-details.md': (s) => {
      const a = s.indexOf('## text: details_other');
      assert.ok(a > 0, 'details_other found');
      const b = s.indexOf('\n## ', a + 1);
      return s.slice(0, a) + (b === -1 ? '' : s.slice(b + 1));
    },
  });
  const gaps = coverageGaps(loadFrom(root));
  assert.ok(gaps.length >= 5 && gaps.every((g) => g.includes('0 steps with when: background = _else')), gaps.join('\n'));
});

test('real content: each character\'s subclass step has exactly its four 2024 PHB option ids (D10)', () => {
  const want = {
    turator: ['devotion', 'glory', 'ancients', 'vengeance'],
    deq: ['berserker', 'wild_heart', 'world_tree', 'zealot'],
    tenni: ['life', 'light', 'trickery', 'war'],
    bebby: ['arcane_trickster', 'assassin', 'soulknife', 'thief'],
    vilhelm: ['abjurer', 'diviner', 'evoker', 'illusionist'],
  };
  const c = loadSessionTwo({ s1Dir: REAL_S1, s2Dir: REAL_S2 });
  for (const [id, ids] of Object.entries(want)) {
    const sub = step(c, id, 'subclass');
    assert.equal(sub.type, 'choice');
    assert.deepEqual(sub.options.map((o) => o.id), ids, id);
    assert.equal(char(c, id).steps[0].id, 'subclass');
    assert.equal(char(c, id).steps[1].id, 'background');
    assert.equal(char(c, id).steps[1].carry, true);
  }
});

test('real content: characteristics steps follow every details step, are random, and have 6-8 options (D13)', () => {
  const c = loadSessionTwo({ s1Dir: REAL_S1, s2Dir: REAL_S2 });
  const order = ['trait', 'ideal', 'bond', 'flaw'];
  const withTrait = c.characters.filter((ch) => ch.steps.some((s) => s.id === 'trait'));
  assert.ok(withTrait.length >= 4, 'deq, tenni, bebby and vilhelm have characteristics steps');
  for (const ch of withTrait) {
    const ids = ch.steps.map((s) => s.id);
    const idx = order.map((id) => ids.indexOf(id));
    assert.ok(idx.every((i) => i >= 0), `${ch.id}: has trait, ideal, bond and flaw`);
    assert.deepEqual([...idx].sort((a, b) => a - b), idx, `${ch.id}: order trait < ideal < bond < flaw`);
    ids.forEach((id, i) => {
      if (/^(details_|msc_)/.test(id)) assert.ok(i < idx[0], `${ch.id}: ${id} comes before trait`);
    });
    for (const id of order) {
      const s = ch.steps[ids.indexOf(id)];
      assert.equal(s.type, 'choice', `${ch.id}.${id}`);
      assert.equal(s.random, true, `${ch.id}.${id} has random: true`);
      assert.ok(s.options.length >= 6 && s.options.length <= 8, `${ch.id}.${id} has ${s.options.length} options`);
    }
  }
});
