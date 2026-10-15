// Session Two DM view rows (D9, F20-F23, F26): pure helper dmRows over one player's data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dmRows } from '../public/shared/session-two-flow.js';

const opt = (id, label, when) => ({ id, label: label || id, ...(when && { when }) });
const bg = { id: 'background', type: 'choice', carry: true, title: 'מה הרקע?', options: [opt('sage', 'חכם'), opt('soldier', 'חייל'), opt('criminal', 'פושע')] };
const dSage = { id: 'details_sage', type: 'choice', title: 'פרטי חכם', when: { step: 'background', value: 'sage' }, options: [opt('a', 'אלף')] };
const dSold = { id: 'details_soldier', type: 'choice', title: 'פרטי חייל', when: { step: 'background', value: 'soldier' }, options: [opt('b', 'בית')] };
const dOther = { id: 'details_other', type: 'text', title: 'פרטים', when: { step: 'background', value: '_else' } };
const trait = { id: 'trait', type: 'choice', title: 'תכונה', random: true, options: [opt('t1', 'סקרן'), opt('t2', 'זהיר', { step: 'background', value: 'sage' }), opt('t3', 'קשוח', { step: 'background', value: 'soldier' })] };
const two = { id: 'pair', type: 'choice', title: 'שניים', options: [opt('x', 'איקס'), opt('y', 'וואי'), opt('z', 'זד')] };
const info = { id: 'note', type: 'info', title: 'מידע' };
const mk = (extra = {}) => ({ id: 'c', steps: [info, bg, dSage, dSold, dOther, trait, two], ...extra });
const q = (r) => r.rows.map((x) => x.q);
const a = (r, i) => r.rows.find((x) => x.q === i);

test('background carried from Session One: row filled, note, details follow it', () => {
  const r = dmRows(mk(), { background: 'sage' }, { details_sage: 'a', trait: 't1' });
  assert.deepEqual(q(r), ['מה הרקע?', 'פרטי חכם', 'תכונה', 'שניים']);
  assert.deepEqual(a(r, 'מה הרקע?'), { q: 'מה הרקע?', a: 'חכם', note: '(מהסשן הראשון)' });
  assert.equal(a(r, 'פרטי חכם').a, 'אלף');
  assert.equal(a(r, 'שניים').a, '—');
});

test('override: note is DM, label from the bg_ term when not an option', () => {
  const termName = (id) => ({ bg_custom: 'מותאם' })[id];
  const r = dmRows(mk({ background: 'custom' }), {}, {}, { termName });
  assert.deepEqual(a(r, 'מה הרקע?'), { q: 'מה הרקע?', a: 'מותאם', note: '(נקבע על ידי ה-DM)' });
  assert.equal(r.rows.some((x) => x.q === 'פרטים'), true); // _else details step
});

test('Session Two background: no note; change hides old details (F22) and lists nothing stale', () => {
  const answers = { background: 'soldier', details_sage: 'a', details_soldier: 'b' };
  const r = dmRows(mk(), {}, answers);
  assert.deepEqual(a(r, 'מה הרקע?'), { q: 'מה הרקע?', a: 'חייל', note: '' });
  assert.equal(a(r, 'פרטי חכם'), undefined);
  assert.equal(a(r, 'פרטי חייל').a, 'בית');
  assert.deepEqual(r.extras, []);
});

test('stale pick on a now-hidden option is not listed (F22); random pick shows its label', () => {
  const r = dmRows(mk(), {}, { background: 'soldier', trait: 't2' });
  assert.equal(a(r, 'תכונה').a, '—');
  assert.equal(dmRows(mk(), {}, { background: 'soldier', trait: 't3' }).rows.find((x) => x.q === 'תכונה').a, 'קשוח');
});

test('multi answers join with a comma; free text shows "משהו אחר"', () => {
  const r = dmRows(mk(), { background: 'sage' }, { pair: ['x', 'z'], pair_other: 'ועוד' });
  assert.equal(a(r, 'שניים').a, 'איקס, זד · משהו אחר: ועוד');
  assert.equal(dmRows(mk(), {}, { background: 'sage', pair_other: 'רק טקסט' }).rows.find((x) => x.q === 'שניים').a, 'משהו אחר: רק טקסט');
});

test('unknown answer ids go to extras; hidden when-step answers and info do not (F20)', () => {
  const r = dmRows(mk({ background: 'soldier' }), {}, { details_sage: 'a', details_sage_other: 'x', gone: 'v', background: 'sage' });
  assert.deepEqual(r.extras, [['gone', 'v']]);
});

test('no character: no rows', () => {
  assert.deepEqual(dmRows(null, {}, { a: 1 }), { rows: [], extras: [['a', 1]] });
});
