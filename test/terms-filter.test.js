// Secret-safe term filtering (spec D7, F14): contentFor(content, viewer) sends a
// player only the terms their own filtered content reaches; the DM gets all.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent, contentFor } from '../session-one-content.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const content = loadContent(path.join(HERE, 'fixtures', 'session-one', 'filter'));
const ALL = ['a_open', 'hub', 'opt_only', 'secret_a', 'secret_chain', 'unused', 'via_blurb', 'via_blurb_2'];
const PUBLIC = ['a_open', 'hub', 'opt_only', 'via_blurb', 'via_blurb_2'];

const termIds = (viewer) => Object.keys(contentFor(content, viewer).terms).sort();

test('the fixture loads every term', () => {
  assert.deepEqual(Object.keys(content.terms).sort(), ALL);
});

test('a term only A\'s secret references (and its blurb chain) is not sent to B\'s player (F14)', () => {
  assert.deepEqual(termIds({ isAdmin: false, character: 'b' }), PUBLIC);
});

test('a player with no character yet gets no secret-only term (F14)', () => {
  assert.deepEqual(termIds({ isAdmin: false, character: undefined }), PUBLIC);
});

test('A\'s player gets the secret term and what its blurb reaches', () => {
  assert.deepEqual(termIds({ isAdmin: false, character: 'a' }), [...PUBLIC, 'secret_a', 'secret_chain'].sort());
});

test('the DM gets every term, unreferenced ones too', () => {
  assert.deepEqual(termIds({ isAdmin: true }), ALL);
});

test('a term reached only through other terms\' blurbs is included (transitive, cycles end)', () => {
  const ids = termIds({ isAdmin: false });
  assert.ok(ids.includes('via_blurb'), 'one hop: hub -> via_blurb');
  assert.ok(ids.includes('via_blurb_2'), 'two hops: hub -> via_blurb -> via_blurb_2');
});

test('a term reached only through an option "term:" is included', () => {
  assert.ok(termIds({ isAdmin: false }).includes('opt_only'));
});

test('the sent terms keep their full shape', () => {
  const { terms } = contentFor(content, { isAdmin: false });
  assert.deepEqual(terms.hub, content.terms.hub);
});

test('a term id like "__proto__" or "constructor" is filtered as an own key', () => {
  const t = (id) => ({ id, he: id, en: id, category: 'concept', images: [], links: [] });
  const c = {
    commonLore: { id: 'w', type: 'info', known: [{ text: '[[constructor]]' }] },
    characters: [],
    terms: Object.fromEntries([['__proto__', t('__proto__')], ['constructor', t('constructor')]]),
  };
  const sent = contentFor(c, { isAdmin: false }).terms;
  assert.deepEqual(Object.keys(sent), ['constructor']);
  assert.ok(!Object.hasOwn(sent, '__proto__'));
});

test('real content: every viewer gets a subset of the terms, the DM gets all', () => {
  const real = loadContent(path.join(HERE, '..', 'content', 'session-one'));
  const dm = Object.keys(contentFor(real, { isAdmin: true }).terms);
  assert.deepEqual(dm, Object.keys(real.terms));
  for (const c of [undefined, ...real.characters.map((ch) => ch.id)]) {
    const sent = contentFor(real, { isAdmin: false, character: c }).terms;
    for (const id of Object.keys(sent)) assert.ok(Object.hasOwn(real.terms, id));
  }
});
