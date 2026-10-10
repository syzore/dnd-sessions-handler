// Term popup (public/shared/term-popup.js) and its triggers: the pure HTML parts.
// The DOM behaviour (open, close, history, focus) is checked in a real browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setTerms, richText, optionLabel } from '../public/shared/terms.js';
import { termPopupHtml, termInfoButton, CATEGORY_LABELS } from '../public/shared/term-popup.js';

const veles = {
  id: 'veles', he: 'ולס', en: 'Veles', category: 'god', aliases: ['וֶלֶס', 'נחש-העולם'],
  images: ['https://example.org/a.jpg', 'https://example.org/b.jpg'],
  links: [{ title: 'Midgard Wiki', url: 'https://example.org/wiki' }, { url: 'https://www.dndbeyond.com/x' }],
  blurb: 'ולס הוא [[veles|הנחש]], אבי [[baal]].\n\nפסקה <שנייה>.',
};
const baal = { id: 'baal', he: 'בעל', en: 'Baal', category: 'god', images: [], links: [], blurb: 'אל אש.' };
const named = { id: 'named', he: 'שם', en: 'Name', category: 'concept', images: [], links: [] };
setTerms({ veles, baal, named });

test('richText: a term with popup content is a trigger button (D6)', () => {
  assert.equal(
    richText('[[baal]]'),
    '<button type="button" class="term term-ref" aria-haspopup="dialog" data-term="baal">בעל</button>',
  );
});

test('richText: a name-only term is a plain span, never a trigger (F15)', () => {
  assert.equal(richText('[[named]]'), '<span class="term-ref" data-term="named">שם</span>');
});

test('richText inert: a term with content is still a plain span inside a control (D4)', () => {
  assert.equal(richText('[[baal]]', { inert: true }), '<span class="term-ref term-inert" data-term="baal">בעל</span>');
});

test('richText self: a reference to the popup\'s own term is plain text, no data-term (F16)', () => {
  assert.equal(richText('[[veles|הנחש]] ו[[baal]]', { self: 'veles' }), 'הנחש ו<button type="button" class="term term-ref" aria-haspopup="dialog" data-term="baal">בעל</button>');
});

test('all 8 category labels are Hebrew, including רקע', () => {
  assert.deepEqual(CATEGORY_LABELS, {
    race: 'גזע', class: 'מקצוע', place: 'מקום', god: 'אל', faction: 'פלג', person: 'דמות', concept: 'מושג', background: 'רקע',
  });
});

test('popup: header, image, blurb and links for a full term', () => {
  const h = termPopupHtml(veles);
  assert.match(h, /<div class="kicker">אל<\/div>/);
  assert.match(h, /<h2 class="tp-name" id="term-pop-name">ולס<\/h2>/);
  assert.match(h, /<div class="tp-en" dir="ltr" lang="en">Veles<\/div>/);
  assert.match(h, /נקרא גם: וֶלֶס, נחש-העולם/);
  assert.match(h, /<img src="https:\/\/example.org\/a.jpg" alt="ולס \(Veles\)" loading="lazy" referrerpolicy="no-referrer"/);
  assert.match(h, /aria-label="סגירה"/);
  assert.doesNotMatch(h, /aria-label="חזרה"/);
  // blurb: self-reference plain, other reference a trigger, text escaped, one <p> per paragraph
  assert.match(h, /<p>ולס הוא הנחש, אבי <button type="button" class="term term-ref" aria-haspopup="dialog" data-term="baal">בעל<\/button>\.<\/p><p>פסקה &lt;שנייה&gt;\.<\/p>/);
  assert.match(h, /<h3>לקריאה נוספת<\/h3>/);
  assert.match(h, /<a href="https:\/\/example.org\/wiki" target="_blank" rel="noopener noreferrer" dir="auto">\s*<span class="tp-link-text">Midgard Wiki<\/span><span class="tp-link-host" dir="ltr">example.org<\/span>/);
  // no title: the host is the text, shown once
  assert.match(h, /<span class="tp-link-text">www.dndbeyond.com<\/span>\s*<span class="tp-link-ic">/);
});

test('popup: the back button only with canBack', () => {
  assert.match(termPopupHtml(veles, { canBack: true }), /class="icon-btn tp-back" aria-label="חזרה"/);
});

test('popup: a blurb-only term has no image, links or aliases sections (F17)', () => {
  const h = termPopupHtml(baal);
  assert.match(h, /tp-body/);
  assert.doesNotMatch(h, /tp-img|tp-links|נקרא גם/);
});

test('popup: links or an image with no blurb has no body section (F18)', () => {
  const h = termPopupHtml({ ...veles, blurb: undefined });
  assert.doesNotMatch(h, /tp-body/);
  assert.match(h, /tp-img/);
  assert.match(h, /tp-links/);
});

// ---------------------------------------------------------------- option term: (D4)

test('termInfoButton: an info button for a term with popup content, labelled "מידע על <name>"', () => {
  const html = termInfoButton('baal');
  assert.match(html, /^<button type="button" class="term-info" aria-haspopup="dialog" data-term-info="baal" aria-label="מידע על בעל"><svg /);
  assert.doesNotMatch(html, /data-term=/, 'data-term would count the button as a mention for the English pass');
});

test('termInfoButton: nothing for an unknown term (F7) or a name-only term (F15)', () => {
  assert.equal(termInfoButton('nope'), '');
  assert.equal(termInfoButton('constructor'), '');
  assert.equal(termInfoButton('named'), '');
});

test('optionLabel: with term:, the label is one inert mention of the term', () => {
  assert.equal(optionLabel({ label: 'בעל', term: 'baal' }), '<span class="term-ref term-inert" data-term="baal">בעל</span>');
  assert.equal(optionLabel({ label: 'האל <ה>[[veles]]', term: 'named' }),
    '<span class="term-ref term-inert" data-term="named">האל &lt;ה&gt;<span class="term-ref term-inert" data-term="veles">ולס</span></span>');
});

test('optionLabel: no term, or a term the client lacks, is the plain inert label (F7)', () => {
  assert.equal(optionLabel({ label: 'סתם [[baal]]' }), 'סתם <span class="term-ref term-inert" data-term="baal">בעל</span>');
  assert.equal(optionLabel({ label: 'בעל', term: 'nope' }), 'בעל');
});
