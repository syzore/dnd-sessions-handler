import { T, FALLBACK, ENVIRONMENTS, OPENERS, ANCHOR_TYPES } from './content.js';
import { libFor, generic, PERSON_TYPES } from './tags.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const maybe = (p) => Math.random() < p;
const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);

// "a|b" -> a or b per word, by gender
const gender = (s, g) => s.replace(/\S*\|\S*/g, (w) => w.split('|')[g === 'f' ? 1 : 0]);
const pron = (g) => (g === 'f' ? 'היא' : 'הוא');
const isNamed = (a) => ANCHOR_TYPES.find((t) => t.id === a.type)?.group === 'named';

/**
 * Which anchors this roll is about. Focused anchors are always in; the rest are sampled:
 * random = none, mixed = 0-2, anchors = 1-3. Exported so Claude rolls use the same draw.
 */
export function pickAnchors(anchors, { focus = new Set(), mode = 'mixed' } = {}) {
  const forced = anchors.filter((a) => focus.has(a.id));
  if (mode === 'random' && !forced.length) return [];
  const k = mode === 'anchors' ? pick([1, 2, 2, 3]) : mode === 'mixed' ? pick([0, 0, 1, 1, 2]) : 0;
  const rest = shuffle(anchors.filter((a) => !focus.has(a.id)));
  return [...forced, ...rest.slice(0, Math.max(0, k - forced.length))];
}

// ---------------------------------------------------------------- context helpers
const info = (a) => libFor(a) || generic(a);
const of = (ctx, type) => ctx.chosen.filter((a) => a.type === type);
const one = (ctx, type) => {
  const a = pick(of(ctx, type));
  if (a) ctx.used.add(a);
  return a;
};
const noun = (a, g) => gender(info(a).noun, g);

// Named anchors inside {@type} slots: only from this roll's chosen set
function anchorFor(type, ctx) {
  const pool = ctx.chosen.filter((a) => isNamed(a) && (type === 'any' || a.type === type));
  const fresh = pool.filter((a) => !ctx.used.has(a));
  const a = pick(fresh.length ? fresh : pool);
  if (!a) return null;
  ctx.used.add(a);
  return a.name;
}

function fill(tpl, ctx) {
  return tpl.replace(/\{(@?)(\w+)\}/g, (_, at, key) => {
    if (at) return anchorFor(key, ctx) ?? fill(pick(T[FALLBACK[key]]), ctx);
    if (key === 'cr' || key === 'crPl') {
      const c = ctx.creature;
      return key === 'cr' ? c.name : c.plural;
    }
    return fill(pick(T[key]), ctx);
  });
}

const slotTypes = (tpl) => [...tpl.matchAll(/\{@(\w+)\}/g)].map((m) => m[1]);
const hasNamed = (ctx) => ctx.chosen.some(isNamed);

// An anchored template that uses at least one chosen named anchor (null if none fits)
function namedTemplate(list, ctx) {
  const types = new Set(ctx.chosen.filter(isNamed).map((a) => a.type));
  const usable = list.filter((tpl) => slotTypes(tpl).some((t) => t === 'any' || types.has(t)));
  return usable.length ? pick(usable) : null;
}

function line(plain, anchored, ctx) {
  const tpl = hasNamed(ctx) && anchored ? namedTemplate(T[anchored], ctx) : null;
  return fill(tpl || pick(T[plain]), ctx);
}

// ---------------------------------------------------------------- people from motifs
/**
 * An NPC shaped by the chosen class / race / background.
 * Background (if any) is who they are now; a class alongside it becomes their past.
 */
function person(ctx, g = pick(['m', 'f'])) {
  const race = one(ctx, 'race');
  const bg = one(ctx, 'background');
  const cls = one(ctx, 'class');
  const now = bg || cls;
  const raceTxt = race ? noun(race, g) : maybe(0.5) ? gender(pick(T.races), g) : '';
  const nowTxt = now ? noun(now, g) : gender(pick(T.jobs), g);
  const past = bg && cls ? cls : null;
  const parts = [race, bg, cls].filter(Boolean);
  return {
    g,
    parts,
    cls,
    bg,
    label: [raceTxt, nowTxt].filter(Boolean).join(' ') + (past ? `, לשעבר ${noun(past, g)}` : ''),
    where: bg && info(bg).where,
  };
}

// Why this person is here: creature > theme > named anchor > their own motifs > generic
function motive(ctx, p) {
  const G = (s) => gender(s, p.g);
  const cr = one(ctx, 'creature');
  if (cr) return G(pick(info(cr).motives));
  const th = one(ctx, 'theme');
  if (th) return G(pick(info(th).motives));
  if (hasNamed(ctx)) {
    const tpl = namedTemplate(T.motiveAnchored, ctx);
    if (tpl) return fill(tpl, ctx);
  }
  const own = p.parts.flatMap((a) => info(a).motive || []);
  return G(own.length ? pick(own) : pick(T.wants));
}

function details(ctx, p, max = 2) {
  const G = (s) => gender(s, p.g);
  const out = shuffle(p.parts.flatMap((a) => info(a).detail || []))
    .slice(0, max)
    .map(G);
  const cr = of(ctx, 'creature')[0];
  if (cr && ctx.used.has(cr)) out.push(pick(info(cr).signs));
  const th = of(ctx, 'theme')[0];
  if (th && ctx.used.has(th)) out.push(pick(info(th).details));
  return out;
}

function bonds(ctx, p) {
  const out = [];
  if (p.cls && info(p.cls).bond) out.push(info(p.cls).bond);
  if (hasNamed(ctx) && maybe(0.7)) {
    const tpl = namedTemplate(T.bondAnchored, ctx);
    if (tpl) out.push(gender(fill(tpl, ctx), p.g));
  }
  return out;
}

function asks(ctx, p) {
  const cr = of(ctx, 'creature').find((a) => ctx.used.has(a));
  return gender(cr && maybe(0.7) ? pick(info(cr).asks) : pick(T.asks), p.g);
}

const hasPersonMotif = (ctx) => ctx.chosen.some((a) => PERSON_TYPES.includes(a.type));
// One item from the chosen motifs (marks that motif used), or null
function motifItem(ctx) {
  const pairs = ctx.chosen.filter((a) => !isNamed(a)).flatMap((a) => (info(a).items || []).map((item) => ({ a, item })));
  const hit = pick(pairs);
  if (!hit) return null;
  ctx.used.add(hit.a);
  return hit.item;
}

function npcName(g) {
  return `${pick(g === 'f' ? T.namesF : T.namesM)} ${pick(T.surnames)}`;
}

// ---------------------------------------------------------------- generators
const GENERATORS = {
  encounter(ctx) {
    const env = ctx.env || pick(ENVIRONMENTS).id;
    const title = `מפגש · ${ENVIRONMENTS.find((e) => e.id === env).label}`;

    if (hasPersonMotif(ctx)) {
      const p = person(ctx);
      const where = p.where && maybe(0.5) ? p.where : pick(OPENERS[env]);
      const why = motive(ctx, p);
      return {
        title,
        lines: [
          `${where}, החבורה פוגשת ${p.label}.`,
          `${pron(p.g)} כאן כדי ${why}.`,
          ...details(ctx, p).map((d) => `פרט: ${d}`),
          ...bonds(ctx, p),
          `${gender('מבקש|מבקשת', p.g)} מהחבורה: ${asks(ctx, p)}`,
        ],
      };
    }
    const cr = one(ctx, 'creature');
    if (cr) {
      const i = info(cr);
      const lines = [`${pick(OPENERS[env])}: ${pick(i.signs)}.`, `מה באמת קורה: ${pick(i.twists)}.`];
      const th = one(ctx, 'theme');
      if (th) lines.push(`וגם: ${pick(info(th).details)}`);
      if (hasNamed(ctx)) lines.push(fill(namedTemplate(T.encounterAnchored, ctx) || pick(T[env]), ctx));
      return { title, lines };
    }
    const th = one(ctx, 'theme');
    if (th) return { title, lines: [`${pick(OPENERS[env])}: ${pick(info(th).details)}.`, line(env, 'encounterAnchored', ctx)] };
    return { title, lines: [line(env, 'encounterAnchored', ctx)] };
  },

  npc(ctx) {
    const p = person(ctx);
    const G = (s) => gender(s, p.g);
    const bondLines = bonds(ctx, p);
    const lines = [
      p.label,
      `מראה: ${G(pick(T.looks))}`,
      `הרגל: ${G(pick(T.quirks))}`,
      `רוצה: ${motive(ctx, p)}`,
      `סוד: ${G(pick(T.secrets))}`,
      ...details(ctx, p, 1).map((d) => `פרט: ${d}`),
      ...bondLines,
    ];
    if (hasNamed(ctx) && !bondLines.length) {
      const tpl = namedTemplate(T.npcAnchored, ctx);
      if (tpl) lines.push(`קשר: ${fill(G(tpl), ctx)}`);
    }
    return { title: npcName(p.g), lines };
  },

  hook(ctx) {
    if (!ctx.chosen.length) return { title: 'משימה', lines: [pick(T.hook)] };
    if (!hasPersonMotif(ctx) && hasNamed(ctx) && !ctx.chosen.some((a) => !isNamed(a)))
      return { title: 'משימה', lines: [line('hook', 'hookAnchored', ctx)] };
    const p = person(ctx);
    const cr = of(ctx, 'creature')[0];
    const task = cr ? (ctx.used.add(cr), pick(info(cr).asks)) : asks(ctx, p);
    const why = motive(ctx, p);
    return {
      title: 'משימה',
      lines: [
        `${p.label} ${gender('מבקש|מבקשת', p.g)} מהחבורה: ${gender(task, p.g)}.`,
        `למה: ${pron(p.g)} ${gender('רוצה', p.g)} ${why}.`,
        `שכר: ${pick(T.rewards)}`,
        `סיבוך: ${cr && maybe(0.5) ? pick(info(cr).twists) : pick(T.hookTwist)}`,
        ...bonds(ctx, p),
      ],
    };
  },

  loot(ctx) {
    const lines = [`${rand(2, 40)} מ״ז, ${rand(5, 60)} מ״כ`];
    lines.push(fill(pick(T[pick(['valuable', 'valuable', 'trinket', 'magic'])]), ctx));
    const item = motifItem(ctx);
    if (item) lines.push(item);
    if (hasNamed(ctx)) lines.push(fill(namedTemplate(T.lootAnchored, ctx) || pick(T.trinket), ctx));
    else if (!item && maybe(0.4)) lines.push(fill(pick(T[pick(['trinket', 'magic'])]), ctx));
    return { title: 'שלל', lines };
  },

  pockets(ctx) {
    const lines = [`${rand(0, 12)} מ״כ ו-${rand(0, 30)} מ״נ`, ...shuffle(T.pocket).slice(0, rand(1, 3))];
    const item = motifItem(ctx);
    if (item) lines.push(item);
    if (hasNamed(ctx)) lines.push(fill(namedTemplate(T.lootAnchored, ctx) || pick(T.pocket), ctx));
    return { title: 'בכיסים', lines };
  },

  corpse(ctx) {
    const p = person(ctx);
    const G = (s) => gender(s, p.g);
    const cr = one(ctx, 'creature');
    const onBody = [motifItem(ctx), pick(T.pocket)].filter(Boolean);
    const lines = [
      `מי: ${p.label}, ${G(pick(T.deadFor))}`,
      `סיבת מוות: ${cr ? G(info(cr).death) : pick(T.deathCause)}`,
      `על הגופה: ${onBody.join(', ')}`,
      `רמז: ${G(pick(T.corpseClue))}`,
    ];
    if (hasNamed(ctx)) lines.push(fill(namedTemplate(T.lootAnchored, ctx) || pick(T.trinket), ctx));
    return { title: 'גופה', lines };
  },

  room(ctx) {
    const cr = one(ctx, 'creature');
    const th = one(ctx, 'theme');
    const lines = [
      `מה יש: ${pick(T.roomFeature)}`,
      `מי שם: ${cr ? info(cr).room : pick(T.roomOccupant)}`,
    ];
    if (th) lines.push(`פרט: ${pick(info(th).details)}`);
    lines.push(`אוצר: ${(maybe(0.6) && motifItem(ctx)) || fill(pick(T[pick(['valuable', 'trinket', 'magic'])]), ctx)}`);
    if (hasPersonMotif(ctx)) {
      const p = person(ctx);
      lines.push(`סימן לנוכחות: ${p.label} ${gender('היה|הייתה', p.g)} כאן, ${gender('והשאיר|והשאירה', p.g)} פתק`);
    }
    if (hasNamed(ctx)) lines.push(fill(namedTemplate(T.lootAnchored, ctx) || pick(T.trinket), ctx));
    return { title: pick(T.roomType), lines };
  },

  rumor(ctx) {
    const cr = one(ctx, 'creature');
    if (cr) {
      ctx.creature = info(cr);
      return { title: 'שמועה', lines: [fill(pick(T.creatureRumor), ctx)] };
    }
    const th = one(ctx, 'theme');
    if (th) return { title: 'שמועה', lines: [`אומרים ש${pick(info(th).rumors)}`] };
    if (hasPersonMotif(ctx)) {
      const p = person(ctx);
      return { title: 'שמועה', lines: [`אומרים שמחוץ לעיר ${gender('גר|גרה', p.g)} ${p.label}, שרוצה ${motive(ctx, p)}.`] };
    }
    return { title: 'שמועה', lines: [line('rumor', 'rumorAnchored', ctx)] };
  },

  tavernEvent(ctx) {
    if (hasPersonMotif(ctx)) {
      const p = person(ctx);
      return {
        title: 'קורה בטברנה',
        lines: [`${p.label} ${gender('נכנס|נכנסת', p.g)} לטברנה ו${gender(pick(T.tavernEntrance), p.g)}.`, `${pron(p.g)} כאן כדי ${motive(ctx, p)}.`, ...bonds(ctx, p)],
      };
    }
    const cr = one(ctx, 'creature');
    if (cr) return { title: 'קורה בטברנה', lines: [`מישהו נכנס בריצה וצועק: "${pick(info(cr).signs)}!"`, pick(T.tavernEvent)] };
    return { title: 'קורה בטברנה', lines: [pick(T.tavernEvent)] };
  },

  complication(ctx) {
    const cr = one(ctx, 'creature');
    if (cr) return { title: 'סיבוך', lines: [`פתאום: ${pick(info(cr).signs)}`] };
    if (hasPersonMotif(ctx)) {
      const p = person(ctx);
      return { title: 'סיבוך', lines: [`${p.label} ${gender('מופיע|מופיעה', p.g)} ${gender('ודורש|ודורשת', p.g)} עזרה, עכשיו.`] };
    }
    return { title: 'סיבוך', lines: [line('complication', 'complicationAnchored', ctx)] };
  },

  place(ctx) {
    const lines = [`ידוע בזכות: ${fill(pick(T.placeDetail), ctx)}`, `סוד: ${fill(pick(T.placeSecret), ctx)}`];
    const cr = one(ctx, 'creature');
    if (cr) lines.push(`בסביבה: ${pick(info(cr).signs)}`);
    const th = one(ctx, 'theme');
    if (th) lines.push(`באוויר: ${pick(info(th).details)}`);
    if (hasPersonMotif(ctx)) {
      const p = person(ctx);
      lines.push(`שם ${gender('גר|גרה', p.g)} ${p.label}, שרוצה ${motive(ctx, p)}`);
    }
    if (hasNamed(ctx)) lines.push(fill(namedTemplate(T.placeAnchored, ctx) || pick(T.placeDetail), ctx));
    return { title: fill(pick(T.placeName), ctx), lines };
  },

  tavern: () => ({
    title: `טברנת ${pick(T.tavern)}`,
    lines: [`בעלים: ${pick(T.tavernOwner)}`, `מנת הבית: ${pick(T.tavernSpecial)}`, `מוזר: ${pick(T.tavernOdd)}`],
  }),

  name(ctx) {
    return {
      title: 'שמות',
      lines: [0, 1, 2].map(() => {
        const p = person(ctx);
        return `${npcName(p.g)} (${p.label})`;
      }),
    };
  },
};

export function roll(kind, { anchors = [], focus = new Set(), mode = 'mixed', env = null, chosen = null } = {}) {
  const ctx = { chosen: chosen ?? pickAnchors(anchors, { focus, mode }), env, used: new Set() };
  const out = GENERATORS[kind](ctx);
  return { kind, ...out, anchors: [...ctx.used].map((a) => a.name), source: 'table' };
}
