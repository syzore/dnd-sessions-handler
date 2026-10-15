// Pure decision rules for the shared step screen (no DOM, no imports, so node --test loads it).
// step-screen.js re-exports these and wires them to the page.

// Value of the "random" card's data-id; never stored as an answer.
export const RANDOM_CARD_ID = '__random';

const picksOf = (answer) => (Array.isArray(answer) ? answer : answer ? [answer] : []);

// State of a `count: n` multi step, or null when the step has no count (Session One).
// Free text (`<id>_other`) is not part of `answer`, so it never counts toward n.
export function countState(step, answer) {
  if (!step || !step.multi || !Number.isInteger(step.count)) return null;
  const n = step.count;
  const picks = picksOf(answer);
  return { n, picked: picks.length, full: picks.length >= n, exact: picks.length === n, label: `נבחרו ${picks.length} מתוך ${n}` };
}

// True when an unpicked option card must be locked: a count step already holds n picks.
export function isLocked(step, answer, id) {
  const cs = countState(step, answer);
  return !!cs && cs.full && !picksOf(answer).includes(id);
}

// Whether "המשך" is enabled for the step (before the optional-step override). Choice: any pick
// or free text, except count steps, which need exactly n picks and ignore free text.
export function canAdvance(step, answers) {
  if (step.type === 'choice') {
    const cs = countState(step, answers[step.id]);
    if (cs) return cs.exact;
    const v = answers[step.id];
    return (Array.isArray(v) ? v.length > 0 : !!v) || !!answers[`${step.id}_other`]?.trim();
  }
  if (step.type === 'text') return !!String(answers[step.id] || '').trim();
  return true;
}

// Draw one option id from `options` (the visible ones). With more than one option the current
// answer is excluded, so a redraw always changes. Returns null for an empty list.
export function drawRandom(options, currentId, rng = Math.random) {
  const ids = (options || []).map((o) => o.id);
  const pool = ids.length > 1 ? ids.filter((id) => id !== currentId) : ids;
  if (!pool.length) return null;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}
