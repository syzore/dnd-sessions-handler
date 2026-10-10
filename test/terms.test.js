// Client term helpers (public/shared/terms.js): pure string functions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setTerms, richText, plainText } from '../public/shared/terms.js';

setTerms({
  veles: { id: 'veles', he: 'ולס', en: 'Veles' },
  baal: { id: 'baal', he: 'בעל', en: 'Baal' },
});

test('plainText: the display text, no markup', () => {
  assert.equal(plainText('סביב ו[[veles]] ו[[baal|הבעל]].'), 'סביב וולס והבעל.');
  assert.equal(plainText(undefined), '');
});

test('plainText: unknown id shows its "|" text, else the id (F7)', () => {
  assert.equal(plainText('[[nope|משהו]] ו[[nope]]'), 'משהו וnope');
});

test('richText: escapes text and wraps known references', () => {
  assert.equal(
    richText('<b> ו[[veles]] & [[baal|"בעל"]]'),
    '&lt;b&gt; ו<span class="term-ref" data-term="veles">ולס</span> &amp; <span class="term-ref" data-term="baal">&quot;בעל&quot;</span>',
  );
});

test('richText inert: marked as text inside a control', () => {
  assert.equal(richText('[[veles]]', { inert: true }), '<span class="term-ref term-inert" data-term="veles">ולס</span>');
});

test('richText: unknown id is plain escaped text with no span (F7)', () => {
  assert.equal(richText('[[nope|<x>]] [[nope]]'), '&lt;x&gt; nope');
});

test('no raw [[ survives either helper', () => {
  for (const s of ['[[veles]]', '[[nope]]', '[[baal|x]] [[veles]]']) {
    assert.ok(!plainText(s).includes('[['));
    assert.ok(!richText(s).includes('[['));
  }
});
