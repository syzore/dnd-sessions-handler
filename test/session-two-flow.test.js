// Session Two flow rules (D6, D8, D14): effective answer, visible steps, visible options, stale
// option answers, context line. Pure module, plus one pass over the real content.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { effective, visibleSteps, visibleOptions, screenAnswers, commitScreenAnswers, contextLine } from '../public/shared/session-two-flow.js';
import { loadSessionTwo } from '../session-two-content.js';

const ids = (steps) => steps.map((s) => s.id);
const opt = (id, when) => ({ id, label: id, ...(when && { when }) });
const bgStep = { id: 'background', type: 'choice', carry: true, options: [opt('sage'), opt('soldier'), opt('criminal')] };
const sub = { id: 'subclass', type: 'choice', options: [opt('a')], context: { step: 'god', question: '🙏 מי האל?', options: [{ id: 'torm', label: 'טורם' }] } };
const when = (id, value) => ({ id: `details_${id}`, type: 'choice', when: { step: 'background', value }, options: [opt('x')] });
const other = { id: 'details_other', type: 'text', when: { step: 'background', value: '_else' } };
const mk = (extra = {}, steps) => ({ id: 'c', steps: steps || [sub, bgStep, when('sage', 'sage'), when('soldier', 'soldier'), other], ...extra });

test('effective: override > carried > Session Two (A7)', () => {
  const c = mk({ background: 'soldier' });
  assert.deepEqual(effective(c, 'background', { background: 'sage' }, { background: 'criminal' }), { value: 'soldier', other: '', source: 'dm' });
  const n = mk();
  assert.deepEqual(effective(n, 'background', { background: 'sage' }, { background: 'criminal' }), { value: 'sage', other: '', source: 's1' });
  assert.deepEqual(effective(n, 'background', {}, { background: 'criminal' }), { value: 'criminal', other: '', source: 's2' });
  assert.equal(effective(n, 'background', {}, {}), null);
});

test('effective: override applies only to the background step', () => {
  assert.equal(effective(mk({ background: 'soldier' }), 'subclass', {}, {}), null);
});

test('effective: a carried answer wins over a newer Session Two answer (F11)', () => {
  assert.equal(effective(mk(), 'background', { background: 'sage' }, { background: 'soldier' }).value, 'sage');
});

test('effective: a Session One-only target (no Session Two step) reads carried; a non-carry step ignores it', () => {
  const c = mk();
  assert.deepEqual(effective(c, 'god', { god: 'torm' }, {}), { value: 'torm', other: '', source: 's1' });
  assert.equal(effective(c, 'subclass', { subclass: 'a' }, {}), null);
});

test('effective: free text only counts as answered, value null (F18)', () => {
  assert.deepEqual(effective(mk(), 'background', { background_other: 'חייל נטוש' }, {}), { value: null, other: 'חייל נטוש', source: 's1' });
  assert.equal(effective(mk(), 'background', {}, { background_other: '   ' }), null);
});

test('visibleSteps: carry step hidden for dm and for s1, shown for none and s2', () => {
  assert.deepEqual(ids(visibleSteps(mk({ background: 'sage' }), {}, {})), ['subclass', 'details_sage']);
  assert.deepEqual(ids(visibleSteps(mk(), { background: 'soldier' }, {})), ['subclass', 'details_soldier']);
  assert.deepEqual(ids(visibleSteps(mk(), {}, {})), ['subclass', 'background']);
  assert.deepEqual(ids(visibleSteps(mk(), {}, { background: 'sage' })), ['subclass', 'background', 'details_sage']);
});

test('visibleSteps: when match, _else on free text (F18) and on an id with no step (F21)', () => {
  assert.deepEqual(ids(visibleSteps(mk(), { background: 'soldier' }, {})), ['subclass', 'details_soldier']);
  assert.deepEqual(ids(visibleSteps(mk(), { background_other: 'x' }, {})), ['subclass', 'details_other']);
  assert.deepEqual(ids(visibleSteps(mk(), { background: 'criminal' }, {})), ['subclass', 'details_other']);
});

test('visibleSteps: pick plus free text, the pick decides (F19)', () => {
  assert.deepEqual(ids(visibleSteps(mk(), { background: 'sage', background_other: 'x' }, {})), ['subclass', 'details_sage']);
});

test('visibleSteps: carried beats a Session Two answer, then the details follow it (F11)', () => {
  assert.deepEqual(ids(visibleSteps(mk(), { background: 'sage' }, { background: 'soldier' })), ['subclass', 'details_sage']);
});

test('visibleSteps: override set after Session Two answers hides the old details (F20)', () => {
  const answers = { background: 'sage', details_sage: 'x' };
  assert.deepEqual(ids(visibleSteps(mk({ background: 'soldier' }), {}, answers)), ['subclass', 'details_soldier']);
});

test('visibleSteps: changing the background in Session Two swaps the details step (F22)', () => {
  const c = mk();
  assert.deepEqual(ids(visibleSteps(c, {}, { background: 'sage', details_sage: 'x' })), ['subclass', 'background', 'details_sage']);
  assert.deepEqual(ids(visibleSteps(c, {}, { background: 'soldier', details_sage: 'x' })), ['subclass', 'background', 'details_soldier']);
});

test('visibleSteps: no background answered yet shows no details and no _else', () => {
  assert.deepEqual(ids(visibleSteps(mk(), null, {})), ['subclass', 'background']);
});

test('visibleSteps: several steps may share one when (Vilhelm msc_*), and _else stays hidden for them', () => {
  const msc = ['skills', 'tools', 'feat', 'story'].map((n) => ({ id: `msc_${n}`, type: 'choice', when: { step: 'background', value: 'custom' }, options: [opt('x')] }));
  const c = { background: 'custom', steps: [sub, bgStep, ...msc, when('sage', 'sage'), other] };
  assert.deepEqual(ids(visibleSteps(c, {}, {})), ['subclass', 'msc_skills', 'msc_tools', 'msc_feat', 'msc_story']);
});

test('visibleOptions: option when filters by the effective answer of its target', () => {
  const trait = { id: 'trait', type: 'choice', options: [opt('gen'), opt('knight', { step: 'background', value: 'knight' }), opt('soldier_o', { step: 'background', value: 'soldier' })] };
  const c = mk({}, [bgStep, trait]);
  const v = (carried, answers) => visibleOptions(trait, { character: c, carried, answers }).map((o) => o.id);
  assert.deepEqual(v({}, {}), ['gen']);
  assert.deepEqual(v({ background: 'soldier' }, {}), ['gen', 'soldier_o']);
  assert.deepEqual(v({}, { background: 'knight' }), ['gen', 'knight']);
  assert.deepEqual(v({ background_other: 'free' }, {}), ['gen']); // free text only: generic options
  assert.deepEqual(visibleOptions(trait, { character: mk({ background: 'knight' }, [bgStep, trait]), carried: {}, answers: {} }).map((o) => o.id), ['gen', 'knight']);
});

test('screenAnswers: a pick on a hidden option is unanswered on screen, stays stored', () => {
  const trait = { id: 'trait', type: 'choice', options: [] };
  const visible = [opt('gen')];
  const stored = { trait: 'soldier_o', trait_other: 'mine' };
  const view = screenAnswers(trait, visible, stored);
  assert.equal(view.trait, undefined);
  assert.equal(view.trait_other, 'mine');
  assert.equal(stored.trait, 'soldier_o');
  // multi: hidden ids dropped, visible kept
  assert.deepEqual(screenAnswers({ id: 'm', type: 'choice', multi: true }, visible, { m: ['gen', 'gone'] }).m, ['gen']);
  assert.equal(screenAnswers({ id: 'm', type: 'choice', multi: true }, visible, { m: ['gone'] }).m, undefined);
});

test('commitScreenAnswers: untouched keeps the stale pick; a new pick replaces it; free text follows the box', () => {
  const trait = { id: 'trait', type: 'choice' };
  const stored = { trait: 'old_hidden', trait_other: 'mine' };
  const before = screenAnswers(trait, [opt('gen')], stored);
  commitScreenAnswers(trait, before, { ...before }, stored);
  assert.equal(stored.trait, 'old_hidden');
  const after = { ...before, trait: 'gen' };
  delete after.trait_other;
  commitScreenAnswers(trait, before, after, stored);
  assert.deepEqual(stored, { trait: 'gen' });
});

test('contextLine: question without emoji, labels, free text, source note', () => {
  const c = mk();
  const line = (carried, answers, o) => contextLine(sub, c, carried, answers, o);
  assert.deepEqual(line({ god: 'torm' }, {}), { question: 'מי האל?', answer: 'טורם', note: 'מהסשן הראשון' });
  assert.equal(line({}, {}), null);
  assert.equal(contextLine({ id: 'x' }, c, {}, {}), null);
  assert.equal(line({ god: 'torm', god_other: 'שלי' }, {}).answer, 'טורם, משהו אחר: שלי');
  assert.equal(line({ god: 'gone' }, {}).answer, 'gone'); // F24: raw id
});

test('contextLine: background label falls back to the bg_ term name, then the id; dm and s2 notes', () => {
  const det = { id: 'details_noble', context: { step: 'background', question: '📜 מה הרקע שלך?', options: [{ id: 'sage', label: 'מלומד' }] } };
  const termName = (id) => ({ bg_noble: 'אציל' })[id];
  const c = mk({ background: 'noble' });
  assert.deepEqual(contextLine(det, c, {}, {}, { termName }), { question: 'מה הרקע שלך?', answer: 'אציל', note: 'נקבע על ידי ה-DM' });
  assert.equal(contextLine(det, mk(), { background: 'zzz' }, {}, { termName }).answer, 'zzz');
  assert.deepEqual(contextLine(det, mk(), {}, { background: 'sage' }, { termName }), { question: 'מה הרקע שלך?', answer: 'מלומד', note: '' });
  assert.equal(contextLine(det, mk(), { background_other: 'חייל' }, {}, { termName }).answer, 'משהו אחר: חייל');
});

// ---- the real content ----
const real = loadSessionTwo({ s1Dir: 'content/session-one', s2Dir: 'content/session-two' });
const char = (id) => real.characters.find((c) => c.id === id);
const vis = (id, carried = {}, answers = {}) => ids(visibleSteps(char(id), carried, answers));

test('real content: Vilhelm has no background step and sees his 4 steps together, then the characteristics', () => {
  const v = vis('vilhelm');
  assert.ok(!v.includes('background'));
  assert.deepEqual(v.filter((s) => s.startsWith('msc_')), ['msc_skills', 'msc_tools_languages', 'msc_feat', 'msc_story']);
  assert.ok(!v.some((s) => s.startsWith('details_')));
  assert.deepEqual(v.slice(-4), ['trait', 'ideal', 'bond', 'flaw']);
});

test('real content: an override hides the background step; the details step follows it (Bebby, Razul, Tenni)', () => {
  for (const [id, d] of [['bebby', 'details_court_servant'], ['deq', 'details_soldier'], ['tenni', 'details_sage']]) {
    const v = vis(id, { background: 'criminal' }, { background: 'noble' });
    assert.ok(!v.includes('background'), id);
    assert.deepEqual(v.filter((s) => s.startsWith('details_')), [d], id);
  }
});

test('real content: Turator with no owner asks the background, free text only leads to details_other', () => {
  assert.deepEqual(vis('turator').slice(0, 4), ['vision', 'subclass', 'vision_end', 'background']);
  assert.deepEqual(vis('turator', {}, { background_other: 'x' }).filter((s) => s.startsWith('details_')), ['details_other']);
  assert.deepEqual(vis('turator', {}, { background: 'soldier' }).filter((s) => s.startsWith('details_')), ['details_soldier']);
  assert.ok(!vis('turator', { background: 'knight_of_the_order' }).includes('background'));
});

test('real content: Turator trait options are the generic ones plus his effective background only', () => {
  const t = char('turator');
  const trait = t.steps.find((s) => s.id === 'trait');
  const v = (carried, answers) => visibleOptions(trait, { character: t, carried, answers }).map((o) => o.id);
  const generic = trait.options.filter((o) => !o.when).map((o) => o.id);
  assert.deepEqual(v({}, { background_other: 'x' }), generic);
  const soldier = v({}, { background: 'soldier' });
  assert.deepEqual(soldier.filter((i) => !generic.includes(i)).every((i) => trait.options.find((o) => o.id === i).when.value === 'soldier'), true);
  assert.equal(soldier.length, generic.length + 4);
  assert.equal(v({ background: 'knight_of_the_order' }, {}).length, generic.length + 4);
});

test('real content: Razul context is rage_style, never on_evoker; Bebby shows the subclass context line', () => {
  const sc = char('deq').steps.find((s) => s.id === 'subclass');
  assert.equal(sc.context.step, 'rage_style');
  const bs = char('bebby').steps.find((s) => s.id === 'subclass');
  const line = contextLine(bs, char('bebby'), { rogue_type: 'spy' }, {});
  assert.equal(line.note, 'מהסשן הראשון');
  assert.equal(line.question, 'איזה סוג נוכל אתה?');
  assert.equal(line.answer, 'מרגל מארץ זרה');
});
