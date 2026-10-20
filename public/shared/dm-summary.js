// DM summary (/session-two/<code>/dm/summary): every answer the group gave in Session Zero, One and
// Two, plus each held character's `### secret` sections, as one model. The page renders it and
// copies it as Markdown (toMarkdown), for pasting into the DM's notes.
// Pure: no DOM and only relative imports, so node --test loads it. The caller sets the terms first
// (setTerms with the DM's Session Two content, which holds every Session One term too).
import { plainText, termOf } from './terms.js';
import { visibleSteps, dmRows } from './session-two-flow.js';
import { QUESTIONS, FRAMES, byId, question } from '../session-zero/content.js';

// Session One's "what do you think of the character" answer (the player flow imports this list).
export const S1_CHOICES = [
  { id: 'keep', icon: 'check', label: 'שומר/ת על הדמות' },
  { id: 'rename', icon: 'pencil', label: 'שומר/ת עליה, אבל משנה לה את השם' },
  { id: 'switch', icon: 'dice', label: 'לא מתחבר/ת אליה, אחליף אחרי שהפרולוג ייגמר' },
];

export const NO_ANSWERS = 'אין תשובות';
const asText = (a) => (Array.isArray(a) ? a.join(', ') : a == null ? '' : typeof a === 'object' ? JSON.stringify(a) : String(a));

// Session One answers of one player as [question, answer] pairs, as the Session One DM view lists
// them: a row per non-info step (info steps hold no answer), then answers to steps since removed.
export function s1Answers(c, answers) {
  const label = (st, v) => plainText(st.options.find((o) => o.id === v)?.label || v);
  const answerText = (st, a) => {
    const v = a?.[st.id];
    if (st.type !== 'choice') return v;
    const picks = (Array.isArray(v) ? v : v ? [v] : []).map((x) => label(st, x)).join(', ');
    const other = a?.[`${st.id}_other`]?.trim();
    return [picks, other && `משהו אחר: ${other}`].filter(Boolean).join(' · ');
  };
  const steps = (c?.steps || []).filter((s) => s.type !== 'info');
  const known = new Set(steps.flatMap((s) => [s.id, `${s.id}_other`]));
  return [
    ...steps.map((st) => [plainText(st.title || st.prompt), answerText(st, answers)]),
    ...Object.entries(answers || {}).filter(([k]) => !known.has(k)),
  ];
}

// Session Zero answers of one player, as the Session Zero DM panel lists them.
function s0Rows(a = {}) {
  const text = (qid, v) => {
    if (qid === 'frames') return (v || []).map((id) => FRAMES.find((f) => f.id === id)?.title).join(', ');
    const q = question(qid);
    return (Array.isArray(v) ? v : v ? [v] : []).map((id) => byId(q, id)?.label || id).join(', ');
  };
  const rows = QUESTIONS.filter((q) => q.type !== 'text' && q.id !== 'avoid').map((q) => ({ q: q.title, a: text(q.id, a[q.id]) }));
  const avoid = text('avoid', (a.avoid || []).filter((x) => x !== 'other'));
  rows.push({ q: 'להימנע', a: [avoid, a.avoidOther].filter(Boolean).join(', ') });
  if (a.discomfort) rows.push({ q: 'לא בנוח עם', a: a.discomfort });
  if (a.notes) rows.push({ q: 'הערות', a: a.notes });
  return rows;
}

const blankAnswers = (answers) => !Object.values(answers || {}).some((v) => (Array.isArray(v) ? v.length : v != null && String(v).trim() !== ''));
const secretsOf = (steps) => steps.filter((st) => st.type === 'info' && (st.secret?.length || st.secretImage));

// The whole summary.
//   title: the group's title
//   s0: `detail` of GET /api/sz/sessions/:code/results?key= ([{ name, done, answers }])
//   s1: { characters, players } (Session One content with the DM key; GET /api/s1/:code?key= players)
//   s2: { characters, players } (the same for Session Two; each player carries its own `carried`)
// Returns { title, s0: [{ name, done, rows }], characters: [{ id, name, cls, sessions: [session] }] }
// where session = { label, player, done, empty, rows: [{ q, a, note }], secrets: [step] }.
// A character is listed when a Session One or Session Two player holds it, in content order.
export function buildSummary({ title, s0 = [], s1, s2 }) {
  const s1Of = (id) => (s1.players || []).find((p) => p.character === id);
  const s2Of = (id) => (s2.players || []).find((p) => p.character === id);
  const characters = s2.characters
    .filter((c) => s1Of(c.id) || s2Of(c.id))
    .map((c2) => {
      const c1 = s1.characters.find((c) => c.id === c2.id);
      const p1 = s1Of(c2.id);
      const p2 = s2Of(c2.id);
      const newName = (p1?.choice === 'rename' && p1.newName) || p2?.carried?.newName || '';

      const one = { label: 'סשן ראשון', player: p1?.name || '', done: !!p1?.done, empty: !p1 || (blankAnswers(p1.answers) && !p1.choice), rows: [], secrets: [] };
      if (p1) {
        const choice = S1_CHOICES.find((o) => o.id === p1.choice)?.label || '—';
        one.rows.push({ q: 'החלטה', a: choice, note: '' });
        if (p1.choice === 'rename') one.rows.push({ q: 'שם חדש', a: p1.newName || '—', note: '' });
        for (const [q, a] of s1Answers(c1, p1.answers)) one.rows.push({ q, a: asText(a) || '—', note: '' });
      }
      one.secrets = secretsOf(c1?.steps || []);

      const carried = p2?.carried?.answers || {};
      const answers = p2?.answers || {};
      const two = { label: 'סשן שני', player: '', done: !!p2?.done, empty: !p2 || blankAnswers(answers), rows: [], secrets: [] };
      if (p2) {
        const { rows, extras } = dmRows(c2, carried, answers, { termName: (id) => termOf(id)?.he, plain: plainText });
        two.rows = [...rows, ...extras.map(([q, a]) => ({ q, a: asText(a) || '—', note: '' }))];
        // An empty Session Two still lists the background row when it is fixed or carried.
        if (two.empty && rows.some((r) => r.note)) two.empty = false;
      }
      two.secrets = secretsOf(visibleSteps(c2, carried, answers));
      return { id: c2.id, name: newName || c2.name, cls: c2.cls, sessions: [one, two] };
    });
  return {
    title,
    s0: s0.map((p) => ({ name: p.name || 'ללא שם', done: !!p.done, empty: blankAnswers(p.answers), rows: s0Rows(p.answers) })),
    characters,
  };
}

// ---------------------------------------------------------------- Markdown (Copy all)
// Headings per session and per character, "- question: answer" lines, secrets as a 🔒 blockquote.
// Every content string goes through plainText, so no [[markup]] is left.
const oneLine = (s) => String(s ?? '').replace(/\s*\n\s*/g, ' / ').trim();
const quote = (text) =>
  String(text ?? '')
    .split('\n')
    .map((ln) => (ln.trim() ? `> ${ln}` : '>'))
    .join('\n');

export function secretMarkdown(st) {
  const out = [`> 🔒 סוד: ${oneLine(plainText(st.title || st.prompt || st.id))}`];
  if (st.secretLead) out.push('>', quote(plainText(st.secretLead)));
  if (st.secretImage) out.push('>', `> תמונה: ${oneLine(st.secretImage.alt)} (${st.secretImage.src})`);
  for (const it of st.secret || []) {
    const head = it.title ? `**${oneLine(plainText(it.title))}**` : '';
    const body = plainText(it.text || '');
    out.push('>', quote([head, body].filter(Boolean).join(body.includes('\n') || !head ? '\n' : ' ')));
  }
  return out.join('\n');
}

const rowLine = (r) => `- ${oneLine(r.q)}: ${oneLine(r.a) || '—'}${r.note ? ` ${r.note}` : ''}`;

export function sessionMarkdown(s, level = '###') {
  const head = `${level} ${s.label}${s.player ? ` (שחקן/ית: ${s.player})` : ''}${!s.empty && !s.done ? ' (באמצע)' : ''}`;
  const body = s.empty ? [NO_ANSWERS] : s.rows.map(rowLine);
  const secrets = s.secrets.map(secretMarkdown);
  return [head, body.join('\n'), ...secrets].join('\n\n');
}

export function characterMarkdown(c) {
  return [`## ${c.name} (${c.cls})`, ...c.sessions.map((s) => sessionMarkdown(s))].join('\n\n');
}

export function toMarkdown(sum) {
  const s0 = sum.s0.length
    ? sum.s0.map((p) => [`### ${p.name}${!p.empty && !p.done ? ' (באמצע)' : ''}`, p.empty ? NO_ANSWERS : p.rows.map(rowLine).join('\n')].join('\n\n'))
    : [NO_ANSWERS];
  return [
    `# ${sum.title}: סיכום תשובות ל-DM`,
    '## סשן אפס (לפי שחקן/ית)',
    ...s0,
    ...(sum.characters.length ? sum.characters.map(characterMarkdown) : ['## דמויות', 'עוד אין שחקנים']),
  ].join('\n\n') + '\n';
}
