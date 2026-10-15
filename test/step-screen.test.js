// Step screen rules for count: and random: (Session Two). The pure rules live in step-rules.js and
// load directly. step-screen.js imports absolute browser paths ('/shared/...'), so the markup tests
// load a temp copy of public/shared with those imports made relative.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { countState, isLocked, canAdvance, drawRandom, RANDOM_CARD_ID } from '../public/shared/step-rules.js';

const multi = { id: 'm', type: 'choice', multi: true, count: 2, options: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
const opts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

test('countState: null without count or for single-choice', () => {
  assert.equal(countState({ id: 'x', type: 'choice', multi: true, options: opts }, ['a']), null);
  assert.equal(countState({ id: 'x', type: 'choice', count: 2 }, 'a'), null);
});

test('countState: picked / full / exact / label', () => {
  assert.deepEqual(countState(multi, undefined), { n: 2, picked: 0, full: false, exact: false, label: 'נבחרו 0 מתוך 2' });
  assert.deepEqual(countState(multi, ['a']), { n: 2, picked: 1, full: false, exact: false, label: 'נבחרו 1 מתוך 2' });
  assert.deepEqual(countState(multi, ['a', 'b']), { n: 2, picked: 2, full: true, exact: true, label: 'נבחרו 2 מתוך 2' });
});

test('isLocked: unpicked cards lock once n are picked; picked ones stay unlockable', () => {
  assert.equal(isLocked(multi, ['a'], 'c'), false);
  assert.equal(isLocked(multi, ['a', 'b'], 'c'), true);
  assert.equal(isLocked(multi, ['a', 'b'], 'a'), false);
  assert.equal(isLocked({ ...multi, count: undefined }, ['a', 'b'], 'c'), false);
});

test('canAdvance: count step needs exactly n picks; free text does not unlock it', () => {
  assert.equal(canAdvance(multi, {}), false);
  assert.equal(canAdvance(multi, { m: ['a'] }), false);
  assert.equal(canAdvance(multi, { m: ['a', 'b'] }), true);
  assert.equal(canAdvance(multi, { m_other: 'text' }), false);
  assert.equal(canAdvance(multi, { m: ['a'], m_other: 'text' }), false);
  assert.equal(canAdvance(multi, { m: ['a', 'b'], m_other: 'text' }), true);
});

test('canAdvance: without count the old rule (any pick, or free text; text steps non-empty)', () => {
  const single = { id: 's', type: 'choice', options: opts };
  const free = { id: 'f', type: 'choice', multi: true, options: opts };
  assert.equal(canAdvance(single, {}), false);
  assert.equal(canAdvance(single, { s: 'a' }), true);
  assert.equal(canAdvance(single, { s_other: '  ' }), false);
  assert.equal(canAdvance(single, { s_other: 'x' }), true);
  assert.equal(canAdvance(free, { f: ['a'] }), true);
  assert.equal(canAdvance(free, { f: [] }), false);
  assert.equal(canAdvance({ id: 't', type: 'text' }, { t: ' ' }), false);
  assert.equal(canAdvance({ id: 't', type: 'text' }, { t: 'x' }), true);
});

test('drawRandom: returns an id from the given options only, with the rng picking the index', () => {
  assert.equal(drawRandom(opts, undefined, () => 0), 'a');
  assert.equal(drawRandom(opts, undefined, () => 0.99), 'c');
  assert.equal(drawRandom(opts, undefined, () => 1), 'c');
  assert.equal(drawRandom([{ id: 'only' }], 'only', () => 0), 'only');
  assert.equal(drawRandom([], undefined), null);
  for (let i = 0; i < 50; i++) assert.ok(['a', 'b', 'c'].includes(drawRandom(opts, undefined)));
  assert.notEqual(drawRandom(opts, undefined), RANDOM_CARD_ID);
});

test('drawRandom: a redraw never repeats the current answer when there is more than one option', () => {
  for (const cur of ['a', 'b', 'c']) {
    for (const r of [0, 0.3, 0.5, 0.7, 0.999]) assert.notEqual(drawRandom(opts, cur, () => r), cur);
  }
  assert.equal(drawRandom([{ id: 'a' }, { id: 'b' }], 'a', () => 0), 'b');
});

// Markup: load step-screen.js with its '/shared/' imports rewritten to relative ones.
async function loadScreen() {
  const dir = mkdtempSync(join(tmpdir(), 'step-screen-'));
  cpSync(new URL('../public/shared', import.meta.url), dir, { recursive: true });
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) {
    const p = join(dir, f);
    writeFileSync(p, readFileSync(p, 'utf8').replaceAll("'/shared/", "'./"));
  }
  return import(pathToFileURL(join(dir, 'step-screen.js')).href);
}

test('markup: no count / random leaves the step body free of the new elements (Session One)', async () => {
  const { stepBodyHtml } = await loadScreen();
  for (const st of [
    { id: 'a', type: 'choice', multi: true, options: opts },
    { id: 'b', type: 'choice', options: opts.map((o) => ({ ...o, description: 'd' })) },
    { id: 'c', type: 'choice', random: false, options: opts },
  ]) {
    const html = stepBodyHtml(st, { a: ['a', 'b', 'c'], b: 'a' });
    assert.ok(!html.includes('count-hint') && !html.includes('aria-disabled') && !html.includes(RANDOM_CARD_ID) && !html.includes('🎲'), st.id);
  }
});

test('markup: count step shows the counter and locks the unpicked cards when full', async () => {
  const { stepBodyHtml } = await loadScreen();
  const html = stepBodyHtml(multi, { m: ['a', 'b'] });
  assert.match(html, /<p class="hint count-hint" id="count-hint" aria-live="polite">נבחרו 2 מתוך 2<\/p>/);
  assert.equal(html.match(/aria-disabled="true"/g).length, 1);
  assert.match(html, /data-id="c" aria-pressed="false" aria-disabled="true"/);
  assert.ok(!stepBodyHtml(multi, { m: ['a'] }).includes('aria-disabled'));
});

test('markup: random step ends with the random card, only on single-choice', async () => {
  const { stepBodyHtml } = await loadScreen();
  const html = stepBodyHtml({ id: 'r', type: 'choice', random: true, options: opts }, {});
  assert.ok(html.indexOf(`data-id="${RANDOM_CARD_ID}"`) > html.indexOf('data-id="c"'));
  assert.match(html, /אקראי 🎲/);
  assert.match(html, /בחירה אקראית מתוך האפשרויות/);
  assert.ok(!stepBodyHtml({ id: 'r', type: 'choice', multi: true, random: true, options: opts }, {}).includes(RANDOM_CARD_ID));
});
