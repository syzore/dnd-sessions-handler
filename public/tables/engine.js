import { T, FALLBACK, ENVIRONMENTS } from './content.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

// "a|b" -> a or b per word, by gender
const gender = (s, g) => s.replace(/\S*\|\S*/g, (w) => w.split('|')[g === 'f' ? 1 : 0]);

const slotTypes = (tpl) => [...tpl.matchAll(/\{@(\w+)\}/g)].map((m) => m[1]);

/**
 * ctx: { anchors, focus: Set<id>, mode: 'random'|'mixed'|'anchors', env, used: [] }
 * Focused anchors are preferred; otherwise any anchor of the right type; otherwise a random table entry.
 */
function anchorFor(type, ctx) {
  const ofType = (a) => type === 'any' || a.type === type;
  const unused = (list) => list.filter((a) => !ctx.used.includes(a));
  const focused = ctx.anchors.filter((a) => ctx.focus.has(a.id) && ofType(a));
  const all = ctx.anchors.filter(ofType);
  const pool = unused(focused).length ? unused(focused) : unused(all).length ? unused(all) : all;
  if (!pool.length) return null;
  const a = pick(pool);
  ctx.used.push(a);
  return a.name;
}

function fill(tpl, ctx) {
  return tpl.replace(/\{(@?)(\w+)\}/g, (_, at, key) =>
    at ? anchorFor(key, ctx) ?? fill(pick(T[FALLBACK[key]]), ctx) : fill(pick(T[key]), ctx)
  );
}

// Whether to reach for an anchored template this roll
function wantsAnchor(ctx) {
  if (!ctx.anchors.length) return false;
  if (ctx.mode === 'anchors' || ctx.focus.size) return true;
  return ctx.mode === 'mixed' && Math.random() < 0.5;
}

// Anchored templates whose slots we can actually fill, favouring ones that use a focused anchor
function anchoredTemplate(list, ctx) {
  const has = (t) => t === 'any' || ctx.anchors.some((a) => a.type === t);
  const hasFocus = (t) => ctx.anchors.some((a) => ctx.focus.has(a.id) && (t === 'any' || a.type === t));
  const usable = list.filter((tpl) => slotTypes(tpl).some(has));
  const focused = usable.filter((tpl) => slotTypes(tpl).some(hasFocus));
  return pick(focused.length ? focused : usable.length ? usable : list);
}

function line(plain, anchored, ctx) {
  return wantsAnchor(ctx) && anchored ? fill(anchoredTemplate(T[anchored], ctx), ctx) : fill(pick(T[plain]), ctx);
}

function npcName(g) {
  return `${pick(g === 'f' ? T.namesF : T.namesM)} ${pick(T.surnames)}`;
}

const GENERATORS = {
  loot(ctx) {
    const lines = [`${rand(2, 40)} מ״ז, ${rand(5, 60)} מ״כ`];
    const extra = pick(['valuable', 'valuable', 'trinket', 'magic']);
    lines.push(fill(pick(T[extra]), ctx));
    if (wantsAnchor(ctx)) lines.push(fill(anchoredTemplate(T.lootAnchored, ctx), ctx));
    else if (Math.random() < 0.4) lines.push(fill(pick(T[pick(['trinket', 'magic'])]), ctx));
    return { title: 'שלל', lines };
  },
  encounter(ctx) {
    const env = ctx.env || pick(ENVIRONMENTS).id;
    const envLabel = ENVIRONMENTS.find((e) => e.id === env).label;
    return { title: `מפגש · ${envLabel}`, lines: [line(env, 'encounterAnchored', ctx)] };
  },
  npc(ctx) {
    const g = pick(['m', 'f']);
    const G = (s) => gender(s, g);
    const lines = [
      `${G(pick(T.races))} · ${G(pick(T.jobs))}`,
      `מראה: ${G(pick(T.looks))}`,
      `הרגל: ${G(pick(T.quirks))}`,
      `רוצה: ${G(pick(T.wants))}`,
      `סוד: ${G(pick(T.secrets))}`,
    ];
    if (wantsAnchor(ctx)) lines.push(`קשר: ${fill(G(anchoredTemplate(T.npcAnchored, ctx)), ctx)}`);
    return { title: npcName(g), lines };
  },
  rumor: (ctx) => ({ title: 'שמועה', lines: [line('rumor', 'rumorAnchored', ctx)] }),
  hook: (ctx) => ({ title: 'משימה', lines: [line('hook', 'hookAnchored', ctx)] }),
  place(ctx) {
    const lines = [`ידוע בזכות: ${fill(pick(T.placeDetail), ctx)}`, `סוד: ${fill(pick(T.placeSecret), ctx)}`];
    if (wantsAnchor(ctx)) lines.push(fill(anchoredTemplate(T.placeAnchored, ctx), ctx));
    return { title: fill(pick(T.placeName), ctx), lines };
  },
  tavern: (ctx) => ({
    title: `טברנת ${pick(T.tavern)}`,
    lines: [`בעלים: ${pick(T.tavernOwner)}`, `מנת הבית: ${pick(T.tavernSpecial)}`, `מוזר: ${pick(T.tavernOdd)}`],
  }),
  name: () => ({
    title: 'שמות',
    lines: [0, 1, 2].map(() => {
      const g = pick(['m', 'f']);
      return `${npcName(g)} (${gender(pick(T.races), g)}, ${gender(pick(T.jobs), g)})`;
    }),
  }),
  complication: (ctx) => ({ title: 'סיבוך', lines: [line('complication', 'complicationAnchored', ctx)] }),
};

export function roll(kind, { anchors = [], focus = new Set(), mode = 'mixed', env = null } = {}) {
  const ctx = { anchors, focus, mode, env, used: [] };
  const out = GENERATORS[kind](ctx);
  return { kind, ...out, anchors: [...new Set(ctx.used.map((a) => a.name))], source: 'table' };
}
