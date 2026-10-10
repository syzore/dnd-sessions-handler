// Session One content parser: loadContent(dir) is the seam. Each test copies a
// fixture folder to a temp dir as .../content/session-one, edits one file, and
// checks the parsed shape or the ContentError message (file + line).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent, ContentError } from '../session-one-content.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASIC = path.join(HERE, 'fixtures', 'session-one', 'basic');
const REAL = path.join(HERE, '..', 'content', 'session-one');

// Copy `from` to a temp .../content/session-one; edits: { 'rel/path.md': text | (old) => new }.
function copyWith(from, edits = {}) {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 's1-')), 'content', 'session-one');
  fs.cpSync(from, dir, { recursive: true });
  for (const [rel, e] of Object.entries(edits)) {
    const f = path.join(dir, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, typeof e === 'function' ? e(fs.readFileSync(f, 'utf8')) : e);
  }
  return dir;
}
const load = (edits, from = BASIC) => loadContent(copyWith(from, edits));
const fails = (edits, message, from = BASIC) =>
  assert.throws(() => load(edits, from), (e) => e instanceof ContentError && (message instanceof RegExp ? message.test(e.message) : e.message === message), message);
const replace = (a, b) => (s) => {
  assert.ok(s.includes(a), `fixture has no "${a}"`);
  return s.replace(a, b);
};
// A minimal term file with one term; `extra` lines go in its header.
const termFile = (extra = '', { id = 'x', en = 'X', category = 'concept' } = {}) =>
  `### איקס\n${[id && `id: ${id}`, en && `en: ${en}`, category && `category: ${category}`, extra].filter(Boolean).join('\n')}\n`;

// ---------------------------------------------------------------- shape

test('terms: full term shape', () => {
  const { terms } = load();
  assert.deepEqual(terms.veles, {
    id: 'veles',
    he: 'ולס',
    en: 'Veles',
    category: 'god',
    aliases: ['וֶלֶס', 'נחש-העולם'],
    images: ['https://example.org/veles.jpg', 'https://example.org/veles-2.png'],
    links: [{ title: 'Midgard Wiki', url: 'https://example.org/wiki/Veles' }, { url: 'https://example.org/another' }],
    blurb: 'נחש-העולם, שמתפתל סביב הקצה. אביו של [[baal]].\n\nפסקה שנייה.',
  });
});

test('terms: a name-only term has no aliases or blurb, and empty images and links', () => {
  assert.deepEqual(load().terms.baal, { id: 'baal', he: 'בעל', en: 'Baal', category: 'god', images: [], links: [] });
});

test('references stay raw in every text field', () => {
  const c = load();
  assert.equal(c.commonLore.known[0].text, 'סביב הקצה מתפתל [[veles]] נחש-העולם, ו[[veles|וֶלֶס]] שוב.');
  const [lore, pick, god] = c.characters[0].steps;
  assert.equal(lore.title, 'הלור של [[baal]]');
  assert.equal(lore.secret[0].text, 'סוד על [[baal|הבעל]].');
  assert.equal(pick.title, 'בחירה על [[veles]]');
  assert.equal(pick.prompt, 'שאלה על [[baal]]');
  assert.equal(pick.hint, 'רמז על [[veles]]');
  assert.deepEqual(pick.options[0], { id: 'snake', label: '[[veles]]', emoji: '🐍', subtitle: 'נחש [[veles]]', description: 'תיאור עם [[baal]].' });
  assert.equal(god.options[0].description, 'אל הצדק, לא [[baal]].');
});

test('the link separator can be "-" and the title is optional', () => {
  const { terms } = load({ 'terms/x.md': termFile('link: A page - https://example.org/a\nlink: https://example.org/b') });
  assert.deepEqual(terms.x.links, [{ title: 'A page', url: 'https://example.org/a' }, { url: 'https://example.org/b' }]);
});

test('every one of the 8 categories is accepted', () => {
  for (const category of ['race', 'class', 'place', 'god', 'faction', 'person', 'concept', 'background'])
    assert.equal(load({ 'terms/x.md': termFile('', { category }) }).terms.x.category, category);
});

test('no terms folder: terms is an empty object', () => {
  const dir = copyWith(BASIC);
  fs.rmSync(path.join(dir, 'terms'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'world.md'), '## info: w\n### known\n- a\n');
  fs.writeFileSync(path.join(dir, 'lists', 'gods.md'), '### g\nid: g\n');
  fs.writeFileSync(path.join(dir, 'characters', 'a.md'), '---\nid: a\nname: א\nclass: ב\n---\n## text: t\nprompt: ש\n');
  assert.deepEqual(loadContent(dir).terms, {});
});

// ---------------------------------------------------------------- F1: unknown term id

test('F1: unknown id in world.md', () => {
  fails({ 'world.md': replace('[[veles]] נחש', '[[nope]] נחש') }, 'content/session-one/world.md line 8: [[nope]]: there is no term "nope" (terms/*.md)');
});

test('F1: unknown id in a term blurb', () => {
  fails({ 'terms/gods.md': replace('אביו של [[baal]]', 'אביו של [[zeus]]') }, 'content/session-one/terms/gods.md line 15: [[zeus]]: there is no term "zeus" (terms/*.md)');
});

test('F1: unknown id in a list file and in a character option description', () => {
  fails({ 'lists/gods.md': replace('[[baal]]', '[[nope|x]]') }, 'content/session-one/lists/gods.md line 7: [[nope]]: there is no term "nope" (terms/*.md)');
  fails({ 'characters/a.md': replace('תיאור עם [[baal]]', 'תיאור עם [[nope]]') }, 'content/session-one/characters/a.md line 28: [[nope]]: there is no term "nope" (terms/*.md)');
});

test('F1: Object.prototype names are not terms', () => {
  for (const id of ['constructor', '__proto__', 'tostring', 'hasownproperty']) {
    fails({ 'world.md': replace('[[veles]] נחש', `[[${id}]] נחש`) }, `content/session-one/world.md line 8: [[${id}]]: there is no term "${id}" (terms/*.md)`);
  }
});

test('a term may have the id "constructor" or "__proto__"', () => {
  const { terms } = load({ 'terms/x.md': termFile('', { id: 'constructor' }) + '\n' + termFile('', { id: '__proto__' }) });
  assert.equal(Object.hasOwn(terms, 'constructor'), true);
  assert.equal(terms.constructor.en, 'X');
  assert.equal(Object.hasOwn(terms, '__proto__'), true);
  fails({ 'terms/x.md': termFile('', { id: 'constructor' }) + '\n' + termFile('', { id: 'constructor' }) }, 'content/session-one/terms/x.md line 6: term id "constructor" is used by another term (content/session-one/terms/x.md line 1)');
});

test('the "|" text may hold a single "]" (D2: any text except "]]")', () => {
  const c = load({ 'world.md': replace('[[veles]] נחש', '[[baal|a]b]] נחש') });
  assert.match(c.commonLore.known[0].text, /\[\[baal\|a\]b\]\]/);
});

// ---------------------------------------------------------------- F2: bad syntax

test('F2: bad reference syntax gives file and line', () => {
  const at = (bad) => ({ 'world.md': replace('[[veles]] נחש', `${bad} נחש`) });
  fails(at('[[veles'), 'content/session-one/world.md line 8: "[[" without a closing "]]" on the same line');
  fails(at('[[]]'), 'content/session-one/world.md line 8: [[]]: a term reference needs a term id: [[id]] or [[id|text]]');
  fails(at('[[veles|]]'), 'content/session-one/world.md line 8: [[veles|]]: the text after "|" is empty');
  fails(at('[[Veles]]'), 'content/session-one/world.md line 8: [[Veles]]: a term id is Latin lowercase letters, digits and _');
  fails(at('[[ve-les]]'), 'content/session-one/world.md line 8: [[ve-les]]: a term id is Latin lowercase letters, digits and _');
  fails(at('[[ולס]]'), 'content/session-one/world.md line 8: [[ולס]]: a term id is Latin lowercase letters, digits and _');
});

test('F2: a reference cannot span two lines', () => {
  fails({ 'world.md': replace('[[veles]] נחש-העולם,', '[[veles|נחש\n  העולם]],') }, 'content/session-one/world.md line 8: "[[" without a closing "]]" on the same line');
});

// ---------------------------------------------------------------- F3: not allowed here

const NOT_HERE = 'a term reference [[...]] is not allowed here (only in title, prompt, hint, lore bullets, option label / subtitle / description and term blurbs)';

test('F3: references outside the allowed fields', () => {
  fails({ 'characters/a.md': replace('name: א', 'name: [[veles]]') }, `content/session-one/characters/a.md line 3: ${NOT_HERE}`);
  fails({ 'characters/a.md': replace('subtitle: נחש', 'id: x [[veles]]\nsubtitle: נחש') }, `content/session-one/characters/a.md line 26: ${NOT_HERE}`);
  fails({ 'characters/a.md': replace('use: gods', 'use: [[veles]]') }, `content/session-one/characters/a.md line 31: ${NOT_HERE}`);
  fails({ 'characters/a.md': replace('---\n\n## info', '---\n# [[veles]]\n## info') }, `content/session-one/characters/a.md line 7: ${NOT_HERE}`);
  fails({ 'characters/a.md': replace('## choice: pick', '## choice: pick [[veles]]') }, `content/session-one/characters/a.md line 19: ${NOT_HERE}`);
  fails({ 'characters/a.md': replace('hint: רמז', 'optional: [[veles]]\nhint: רמז') }, `content/session-one/characters/a.md line 22: ${NOT_HERE}`);
  fails({ 'terms/gods.md': replace('id: baal', 'id: baal [[veles]]') }, `content/session-one/terms/gods.md line 20: ${NOT_HERE}`);
  fails({ 'world.md': replace('### known', '### known\n\nuse: [[veles]]') }, `content/session-one/world.md line 8: ${NOT_HERE}`);
});

test('F3: references in a term heading or term header keys', () => {
  fails({ 'terms/gods.md': replace('### בעל', '### [[veles]]') }, `content/session-one/terms/gods.md line 19: ${NOT_HERE}`);
  fails({ 'terms/gods.md': replace('en: Baal', 'en: Baal [[veles]]') }, `content/session-one/terms/gods.md line 21: ${NOT_HERE}`);
  fails({ 'terms/x.md': termFile('aliases: [[veles]]') }, `content/session-one/terms/x.md line 5: ${NOT_HERE}`);
  fails({ 'terms/x.md': termFile('link: [[veles]] — https://example.org') }, `content/session-one/terms/x.md line 5: ${NOT_HERE}`);
});

test('F3: an HTML comment may hold [[...]]', () => {
  assert.doesNotThrow(() => load({ 'world.md': replace('### known', '<!-- [[anything]] -->\n### known') }));
});

// ---------------------------------------------------------------- F4: term file structure

test('F4: duplicate term id across files', () => {
  fails({ 'terms/z.md': termFile('', { id: 'veles' }) }, 'content/session-one/terms/z.md line 1: term id "veles" is used by another term (content/session-one/terms/gods.md line 5)');
});

test('F4: duplicate key, missing keys, unknown category, too many images', () => {
  fails({ 'terms/x.md': termFile('en: Again') }, 'content/session-one/terms/x.md line 5: "en:" appears twice in this term');
  fails({ 'terms/x.md': termFile('', { id: '' }) }, 'content/session-one/terms/x.md line 1: the term "איקס" needs "id:"');
  fails({ 'terms/x.md': termFile('', { en: '' }) }, 'content/session-one/terms/x.md line 1: the term "איקס" needs "en:"');
  fails({ 'terms/x.md': termFile('', { category: '' }) }, 'content/session-one/terms/x.md line 1: the term "איקס" needs "category:"');
  fails({ 'terms/x.md': termFile('', { category: 'monster' }) }, 'content/session-one/terms/x.md line 4: unknown category "monster" (one of race, class, place, god, faction, person, concept, background)');
  const img = (n) => `image: https://example.org/${n}.png`;
  fails({ 'terms/x.md': termFile([1, 2, 3, 4].map(img).join('\n')) }, 'content/session-one/terms/x.md line 8: a term has at most 3 "image:" lines');
});

test('F4: bad term id, unknown key, emoji heading, text before the first term', () => {
  fails({ 'terms/x.md': termFile('', { id: 'Bad-Id' }) }, 'content/session-one/terms/x.md line 2: a term id is Latin lowercase letters, digits and _');
  fails({ 'terms/x.md': termFile('colour: red') }, 'content/session-one/terms/x.md line 5: unknown term key "colour" (allowed: id, en, category, aliases, image, link)');
  fails({ 'terms/x.md': '### 🐍 נחש\nid: x\nen: X\ncategory: god\n' }, 'content/session-one/terms/x.md line 1: a term heading has no emoji, only the Hebrew name');
  fails({ 'terms/x.md': `טקסט\n\n${termFile()}` }, 'content/session-one/terms/x.md line 1: text before the first "### <Hebrew name>" term heading');
});

// ---------------------------------------------------------------- option term: (D4, F3, F6)

test('option "term:" links an option to a term, in a step and in a list', () => {
  const c = load({
    'characters/a.md': replace('id: snake\n', 'id: snake\nterm: veles\n'),
    'lists/gods.md': replace('id: bahamut\n', 'id: bahamut\nterm: baal\n'),
  });
  const [, pick, god] = c.characters[0].steps;
  assert.equal(pick.options[0].term, 'veles');
  assert.equal(god.options[0].term, 'baal');
});

test('an option without "term:" has no term key', () => {
  assert.equal('term' in load().characters[0].steps[1].options[0], false);
});

test('F6: option "term:" names an unknown term, with file and line', () => {
  fails({ 'characters/a.md': replace('id: snake\n', 'id: snake\nterm: nope\n') }, 'content/session-one/characters/a.md line 26: "term: nope": there is no term "nope" (terms/*.md)');
  fails({ 'lists/gods.md': replace('id: bahamut\n', 'id: bahamut\nterm: nope\n') }, 'content/session-one/lists/gods.md line 6: "term: nope": there is no term "nope" (terms/*.md)');
  fails({ 'lists/gods.md': replace('id: bahamut\n', 'id: bahamut\nterm: constructor\n') }, 'content/session-one/lists/gods.md line 6: "term: constructor": there is no term "constructor" (terms/*.md)');
  fails({ 'lists/gods.md': replace('id: bahamut\n', 'id: bahamut\nterm:\n') }, 'content/session-one/lists/gods.md line 6: "term:" needs a term id');
});

test('F3: a reference in an option "term:" value', () => {
  fails({ 'characters/a.md': replace('id: snake\n', 'id: snake\nterm: [[veles]]\n') }, `content/session-one/characters/a.md line 26: ${NOT_HERE}`);
  fails({ 'lists/gods.md': replace('id: bahamut\n', 'id: bahamut\nterm: [[baal]]\n') }, `content/session-one/lists/gods.md line 6: ${NOT_HERE}`);
});

test('option "term:" appears once per option', () => {
  fails({ 'lists/gods.md': replace('id: bahamut\n', 'id: bahamut\nterm: baal\nterm: veles\n') }, 'content/session-one/lists/gods.md line 7: "term:" appears twice in this option');
});

// ---------------------------------------------------------------- F5: URLs

test('F5: image and link URLs must be https', () => {
  const at = (line) => ({ 'terms/x.md': termFile(line) });
  fails(at('image: http://example.org/a.png'), 'content/session-one/terms/x.md line 5: "http://example.org/a.png" is not an https:// URL (only https:// links and images are allowed)');
  fails(at('image: data:image/png;base64,AAAA'), /^content\/session-one\/terms\/x\.md line 5: "data:image\/png;base64,AAAA" is not an https:\/\/ URL/);
  fails(at('image: /local.png'), 'content/session-one/terms/x.md line 5: "/local.png" is not an https:// URL (only https:// links and images are allowed)');
  fails(at('image:'), 'content/session-one/terms/x.md line 5: "image:" needs an https:// URL');
  fails(at('link: Wiki — http://example.org'), 'content/session-one/terms/x.md line 5: "http://example.org" is not an https:// URL (only https:// links and images are allowed)');
  fails(at('link: javascript:alert(1)'), 'content/session-one/terms/x.md line 5: "javascript:alert(1)" is not an https:// URL (only https:// links and images are allowed)');
  fails(at('link: Just a title'), 'content/session-one/terms/x.md line 5: "link:" needs a URL at the end: "[title] — https://..."');
  fails(at('link:'), 'content/session-one/terms/x.md line 5: "link:" needs a URL at the end: "[title] — https://..."');
});

// ---------------------------------------------------------------- step link: (D9, F25-F27, F3)

const withLink = (line) => ({ 'characters/a.md': replace('prompt: שאלה על [[baal]]\n', `prompt: שאלה על [[baal]]\n${line}\n`) });

test('step "link:" parses to { title?, url }, on a choice step', () => {
  const pick = (edits) => load(edits).characters[0].steps[1];
  assert.deepEqual(pick(withLink('link: הרשימה — https://example.org/x')).link, { title: 'הרשימה', url: 'https://example.org/x' });
  assert.deepEqual(pick(withLink('link: https://example.org/x')).link, { url: 'https://example.org/x' });
  assert.equal('link' in load().characters[0].steps[1], false);
});

test('step "link:" works on a text step', () => {
  const c = load({ 'characters/a.md': (s) => `${s}\n## text: t\nprompt: שאלה\nlink: https://example.org/t\n` });
  assert.deepEqual(c.characters[0].steps.at(-1).link, { url: 'https://example.org/t' });
});

test('F25: step "link:" on an info step', () => {
  fails({ 'characters/a.md': replace('title: הלור של [[baal]]\n', 'title: הלור של [[baal]]\nlink: https://example.org/x\n') }, 'content/session-one/characters/a.md line 10: "link:" works on choice and text steps');
});

test('F26: step "link:" must be https, have a URL, and appear once', () => {
  fails(withLink('link: T — http://example.org'), 'content/session-one/characters/a.md line 22: "http://example.org" is not an https:// URL (only https:// links and images are allowed)');
  fails(withLink('link: Just a title'), 'content/session-one/characters/a.md line 22: "link:" needs a URL at the end: "[title] — https://..."');
  fails(withLink('link:'), 'content/session-one/characters/a.md line 22: "link:" needs a URL at the end: "[title] — https://..."');
  fails(withLink('link: https://example.org/a\nlink: https://example.org/b'), 'content/session-one/characters/a.md line 23: "link:" appears twice in this step');
});

test('F3: a reference in a step "link:"', () => {
  fails(withLink('link: [[baal]] — https://example.org/x'), `content/session-one/characters/a.md line 22: ${NOT_HERE}`);
});

test('F27: a "link:" in a lists/ file is a default; the step\'s own wins', () => {
  const list = { 'lists/gods.md': replace('prompt: מי מדבר אליך?\n', 'prompt: מי מדבר אליך?\nlink: List — https://example.org/list\n') };
  const god = (edits) => load(edits).characters[0].steps[2];
  assert.deepEqual(god(list).link, { title: 'List', url: 'https://example.org/list' });
  assert.deepEqual(god({ ...list, 'characters/a.md': replace('use: gods\n', 'use: gods\nlink: https://example.org/own\n') }).link, { url: 'https://example.org/own' });
});

// ---------------------------------------------------------------- real content (A3)

test('the real content/session-one loads with no content error', () => {
  assert.doesNotThrow(() => loadContent(REAL));
});

test('the real-content check catches an unknown term id', () => {
  fails(
    { 'world.md': (s) => s.replace(/^(- \*\*.+)$/m, '$1 [[no_such_term]]') },
    /^content\/session-one\/world\.md line \d+: \[\[no_such_term\]\]: there is no term "no_such_term" \(terms\/\*\.md\)$/,
    REAL,
  );
});
