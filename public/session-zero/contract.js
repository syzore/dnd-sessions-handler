import { FRAMES, DIRECTION_PITCH, question, byId } from './content.js';

// Count how many answers picked each option id (works for single and multi answers)
function tally(answers, qid, ignore = []) {
  const counts = {};
  for (const a of answers) {
    const v = a[qid];
    for (const id of Array.isArray(v) ? v : v ? [v] : []) {
      if (!ignore.includes(id)) counts[id] = (counts[id] || 0) + 1;
    }
  }
  return Object.entries(counts).sort((x, y) => y[1] - x[1]);
}

const label = (qid, id) => {
  const o = byId(question(qid), id);
  return o?.short || o?.label || id;
};

// Average a 1..3 scale; flags a split group (someone at each extreme)
function scale(answers, qid) {
  const q = question(qid);
  const scores = answers.map((a) => byId(q, a[qid])?.score).filter(Boolean);
  if (!scores.length) return null;
  const avg = scores.reduce((s, x) => s + x, 0) / scores.length;
  const text = avg >= 2.5 ? 'הרבה' : avg >= 1.6 ? 'בינוני' : 'מעט';
  const split = scores.includes(1) && scores.includes(3);
  return { text, split, dist: tally(answers, qid, ['unsure']) };
}

export function buildContract(data) {
  const A = data.answers;
  const n = A.length;
  if (!n) return null;

  const tone = tally(A, 'tone', ['unsure']);
  const toneTop = tone.filter(([, c], i) => i < 2 && c >= Math.max(1, tone[0][1] / 2)).map(([id]) => label('tone', id));

  const rules = tally(A, 'rules', ['figure']);
  const chars = tally(A, 'characters');
  const goals = tally(A, 'goals').slice(0, 3).map(([id]) => label('goals', id));

  const frames = tally(A, 'frames').map(([id, count]) => ({ frame: FRAMES.find((f) => f.id === id), count }));
  const direction = tally(A, 'direction', ['surprise'])[0]?.[0] || 'problems';

  let campaign = null;
  if (frames.length) {
    const [top, second] = frames;
    const blend = second && second.count >= Math.max(1, Math.ceil(n * 0.4)) ? second.frame : null;
    campaign = {
      frame: top.frame,
      title: top.frame.campaign,
      subtitle: blend ? blend.blend : null,
      pitch: `${top.frame.pitch} ${DIRECTION_PITCH[direction]}`,
    };
  }

  const ownCount = A.filter((a) => a.characters === 'own').length;
  const firstSession =
    ownCount > n / 2
      ? 'נבנה את הדמויות יחד בתחילת הערב. אף אחד לא צריך לדעת את החוקים מראש.'
      : 'נתחיל עם דמויות מוכנות מראש, או שנבנה אותן יחד מהר. אף אחד לא צריך לדעת את החוקים מראש.';

  const avoid = [...data.avoid.ids.map((id) => label('avoid', id)), ...data.avoid.other];

  return {
    n,
    tone: toneTop.length ? toneTop.join(' + ') : 'נגלה ביחד',
    roleplay: scale(A, 'roleplay'),
    combat: scale(A, 'combat'),
    rules: rules.length ? label('rules', rules[0][0]) : 'נסתדר תוך כדי',
    characters: chars.length ? label('characters', chars[0][0]) : '—',
    goals: goals.length ? goals.join(' · ') : '—',
    avoid,
    frames,
    campaign,
    firstSession,
  };
}
