// Session Two flow rules (docs/specs/session-two.md D6, D8, D14). Pure functions, no DOM and no
// imports, so node --test loads this file and the DM view (ticket 05) can reuse it.
//
// Vocabulary: `character` is a loaded Session Two character ({ background?, steps }); `carried` is
// the carried ANSWERS map ({ [stepId]: ..., [stepId_other]: ... }), i.e. `carried.answers` from
// GET /api/s2/:code, or {} / null when nothing is carried; `answers` is this player's Session Two
// answers.

const blank = (v) => v == null || String(v).trim() === '';
const has = (map, id) => {
  const v = map?.[id];
  const o = map?.[`${id}_other`];
  return (v != null && v !== '' && !(Array.isArray(v) && !v.length)) || !blank(o);
};
const pick = (map, id) => ({ value: map[id] ?? null, other: blank(map[`${id}_other`]) ? '' : map[`${id}_other`] });

// The answer Session Two acts on for a step: { value, other, source } or null (D6).
// source: 'dm' (override), 's1' (carried), 's2' (this player's own answer).
export function effective(character, stepId, carried, answers) {
  if (stepId === 'background' && character?.background) return { value: character.background, other: '', source: 'dm' };
  const own = (character?.steps || []).find((s) => s.id === stepId);
  if ((!own || own.carry) && has(carried, stepId)) return { ...pick(carried, stepId), source: 's1' };
  if (has(answers, stepId)) return { ...pick(answers, stepId), source: 's2' };
  return null;
}

// Does a `when: { step, value }` hold? `flow` is the character's steps: `_else` needs to know
// which values other steps on the same target name.
function whenHolds(character, when, carried, answers) {
  const e = effective(character, when.step, carried, answers);
  if (!e) return false;
  if (when.value !== '_else') return e.value === when.value;
  // Free text only (value null) names nothing, so it falls to _else (F18); so does an id with no step (F21).
  const named = (character.steps || []).some((s) => s.when && s.when.step === when.step && s.when.value !== '_else' && s.when.value === e.value);
  return !named;
}

// The character's steps in order, minus `carry` steps already answered by the override or Session
// One, and minus `when` steps whose condition is false. Several steps may share one `when` (the
// four msc_* steps of Vilhelm's custom background): each is judged on its own.
export function visibleSteps(character, carried, answers) {
  return (character?.steps || []).filter((st) => {
    if (st.carry) {
      const e = effective(character, st.id, carried, answers);
      if (e && (e.source === 'dm' || e.source === 's1')) return false;
    }
    return !st.when || whenHolds(character, st.when, carried, answers);
  });
}

// Options of a step that show now: an option with `when: { step, value }` shows only when the
// effective answer of that step equals value (D14). The step screen gets only these, so the
// random draw never picks a hidden one.
export function visibleOptions(step, ctx) {
  const { character, carried, answers } = ctx;
  return (step.options || []).filter((o) => {
    if (!o.when) return true;
    const e = effective(character, o.when.step, carried, answers);
    return !!e && e.value === o.when.value;
  });
}

// The answers as the step screen should see them: an answer that names an option that is no
// longer visible (Turator changed background after picking a trait) is not shown as selected and
// does not count as answered. The stored answer is left alone (caller keeps `answers` untouched).
export function screenAnswers(step, options, answers) {
  if (step.type !== 'choice') return { ...answers };
  const ids = new Set(options.map((o) => o.id));
  const out = { ...answers };
  const cur = answers[step.id];
  if (Array.isArray(cur)) {
    const kept = cur.filter((id) => ids.has(id));
    if (kept.length) out[step.id] = kept;
    else delete out[step.id];
  } else if (cur != null && !ids.has(cur)) delete out[step.id];
  return out;
}

// Write the step screen's answers back. Only a changed pick replaces the stored one, so a stale
// answer to a hidden option survives a visit where the player did not touch the pick (F20, F22).
export function commitScreenAnswers(step, before, after, answers) {
  const id = step.id;
  if (JSON.stringify(before[id]) !== JSON.stringify(after[id])) {
    if (after[id] === undefined) delete answers[id];
    else answers[id] = after[id];
  }
  const other = `${id}_other`;
  if (blank(after[other])) delete answers[other];
  else answers[other] = after[other];
}

const LEADING_SYMBOLS = /^[\p{Extended_Pictographic}\p{Emoji_Presentation}️‍\s]+/u;

// The context line of a step (D8): { question, answer, note } or null when there is nothing to show.
// `termName(id)` gives the Hebrew name of a term (or undefined); `plain(str)` turns [[markup]] into
// text. The question is the target's `question` from the loader, which is its title, else its prompt
// (so the `god` context shows the gods list title; see the ticket 04 report).
export function contextLine(step, character, carried, answers, { termName = () => undefined, plain = (s) => s } = {}) {
  const ctx = step.context;
  if (!ctx) return null;
  const e = effective(character, ctx.step, carried, answers);
  if (!e) return null;
  const labelOf = (id) =>
    ctx.options?.find((o) => o.id === id)?.label ?? (ctx.step === 'background' ? termName(`bg_${id}`) : undefined) ?? id;
  const picks = (Array.isArray(e.value) ? e.value : e.value == null ? [] : [e.value]).map((id) => plain(labelOf(id)));
  const text = [...picks, e.other && `משהו אחר: ${e.other}`].filter(Boolean).join(', ');
  return {
    question: plain(ctx.question || '').replace(LEADING_SYMBOLS, '').trim(),
    answer: text,
    note: e.source === 's1' ? 'מהסשן הראשון' : e.source === 'dm' ? 'נקבע על ידי ה-DM' : '',
  };
}
