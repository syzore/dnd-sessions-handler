# Session Two: subclass, background and background details

Status: build-ready. Aviv does not review this spec before the build. Every open question is settled under "Assumptions" or "Design decisions". Tickets: `session-two-tickets.md`. Written 2026-10-15.

## Problem

Session One let each player pick a premade character and answer questions about it, including a background for most players. Before the next game every character needs three more things: a subclass (all five characters reach level 3), a background if the player does not have one yet, and one concrete detail about the background ("which army?" for a soldier, "where did you study?" for a sage). Aviv's words:

> next is session-two. again ask for who is your character. then each player is asked character-building stuff. we have to ask subclasses (use real subclasses for each class). and background (if we already have background set for a character skip asking it), because after the background we ask for specifics (e.g. soldier → which army, sage → where he learned, and so on).

## Solution

A new tool at `/session-two/<CODE>`, built on the Session One step engine and look. The group code is the same one Session One used.

1. **Pick.** The player picks a character, as in Session One. Each character can be taken by one player per group.
2. **Intro.** One info screen says what Session Two asks (`content/session-two/intro.md`).
3. **Subclass.** One choice step with the four 2024 PHB subclasses of the character's class. Each card has a one-line Hebrew description, a lore-fit subtitle and an info button (a term). Where Session One already asked something related, the step shows that earlier answer above the options as context.
4. **Background.** The character's Session One background step, unchanged. It is skipped when the background is already known: a DM override in the Session Two character file, or the Session One answer for that character.
5. **Background details.** One follow-up step, picked by the background: 26 lore-grounded option lists (every Session One background plus the 2024 PHB list) and a free-text fallback for anything else.
6. **DM view.** `/session-two/<CODE>/dm?key=` shows every player's Session Two answers like the Session One DM view, and marks where the background came from.

## Vocabulary

The terms this spec uses (subclass, carried answer, background override, effective answer, details step, context line, shared step) are defined in [`GLOSSARY.md`](../../GLOSSARY.md).

## Decisions already made (by Aviv or the PM, do not reopen)

- Same look and flow as Session One. Reuse or generalise the step engine and the parser. New content folder `content/session-two/`, and a route that mirrors `/session-one`. No new design.
- Subclasses (2024 PHB, level 3): turator = Paladin (Devotion, Glory, Ancients, Vengeance); deq (shown as רזול; the id stays `deq`) = Barbarian (Berserker, Wild Heart, World Tree, Zealot); tenni = Cleric (Life, Light, Trickery, War); bebby = Rogue (Arcane Trickster, Assassin, Soulknife, Thief); vilhelm = Wizard (Abjurer, Diviner, Evoker, Illusionist). A one-line Hebrew description for each.
- Session One answers that overlap the subclass (vilhelm `element`, deq `on_evoker`, bebby `rogue_type`) are reconciled. How: D8.
- Background carry-over: if the player answered `background` in Session One, Session Two skips that step and uses the answer. A per-character front-matter override in Session Two content wins over it. With neither, Session Two asks the same background step as Session One (its options are per character).
- Background details: one follow-up step per background, shown only for the matching background. Covers every Session One background option of all five characters plus the 2024 PHB list (Acolyte, Artisan, Charlatan, Criminal, Entertainer, Farmer, Guard, Guide, Hermit, Merchant, Noble, Sage, Sailor, Scribe, Soldier, Wayfarer). Options are grounded in world lore, plus free text. A custom or unknown background gets a generic free-text question.
- The DM view shows Session Two answers the way Session One does.

## Assumptions

Aviv does not review this spec. These are decisions; engineers build to them and do not ask.

- **A1. Repo phase.** No `CLAUDE.md`, no phase line; personal, pre-revenue. Commit straight to `main`. Deploys are manual `railway up` of the working tree, so a commit does not ship and an uncommitted file does.
- **A2. Same group code.** Session Two uses the Session One group code. `/session-two/<CODE>` reads `db.sessions[CODE]`, the same object Session Zero and Session One use. Carry-over works only inside one group (F14).
- **A3. Players are matched by character, not by browser** (D1). A carried answer is the Session One answer of whoever holds the same character in the same group.
- **A4. A Session One "switch" player carries nothing.** If the Session One owner of the character chose `switch` ("I'll change character"), their answers are not carried. They did not want that character.
- **A5. The Session One rename carries.** If the Session One owner chose `rename`, Session Two shows `newName` wherever it shows the character's name (kicker, end screen, DM view). Session Two has no keep/rename/switch screen.
- **A6. Override key is `background:`** in the Session Two character front matter. Its value is a background id that has a `bg_<id>` term (Session One or Session Two terms). Anything else is a content error (F3).
- **A7. Priority.** Override > carried Session One answer > Session Two answer. A carried answer wins over a Session Two answer even if the Session Two answer is newer (F11).
- **A8. Carried answers are read live, never copied.** Every Session Two load reads the current Session One record. Session Two never writes Session One data.
- **A9. Subclass step keeps the free-text box.** A player can write a non-PHB subclass. The step link goes to the class page on dnd2024.wikidot.com, which lists every subclass. Aviv handles a free-text subclass at the table.
- **A10. The subclass step comes first, then background, then details.** Subclass is the main decision of the session and does not depend on the background.
- **A11. Details steps are required.** A choice details step needs a pick or free text. `details_other` is a text step and needs text. Subclass is required. Nothing in Session Two is `optional:`.
- **A12. Glossary terms added.** 19 subclass terms (`sc_<option id>`, category `class`, in `content/session-two/terms/subclasses.md`); Vilhelm's Evoker reuses the existing `evoker` term. 9 background terms for the 2024 PHB backgrounds no character offers (`bg_artisan`, `bg_entertainer`, `bg_farmer`, `bg_guard`, `bg_guide`, `bg_merchant`, `bg_noble`, `bg_sailor`, `bg_wayfarer`, in `content/session-two/terms/backgrounds-2024.md`). Details options get no terms; they reference existing world terms with `[[id]]`. The vocabulary now lives in `GLOSSARY.md`.
- **A13. Session One content is not edited.** All new terms live in `content/session-two/terms/`. Session One parses and renders byte-for-byte as before.
- **A14. Lore editing is Session One only.** The browser lore editor (`LORE_EDIT`) and the DM lore compendium do not cover Session Two. Aviv edits `content/session-two/` in his code editor.
- **A15. Shared step text holds no character secret.** Every player receives every character's non-secret steps (`contentFor`). The draft details and subclass text use only lore that is already public: world.md, `### known` sections, step and option text, term blurbs. A fact that appears only in a `### secret` (Bebby's tent cities, Vilhelm's "heavy artillery") is not used.
- **A16. A player who finishes stays finished.** `done: true` sends a returning player to the end screen, as in Session One. "לשנות" restarts at the first visible step.
- **A17. Draft content is final enough to ship.** The files under `content/session-two/` were written with this spec. They follow the grammar in D2–D5; ticket 01 makes the loader accept them unchanged. Aviv edits the Markdown after the build.
- **A18. The pick screen hints, never preselects.** If this browser held a character in Session One, that card says "שיחקת בה בסשן הראשון". The player still taps it. Preselecting would hide that the character may be a different one now.

## Design decisions

### D1. Matching a player across sessions: by character

How Session One identifies a player: `playerId()` (`public/shared/lib.js`) is one random id per browser, kept in `localStorage` under `sz:pid` and shared by every tool. Session One stores `db.sessions[code].sessionOne.players[pid] = { character, choice, newName, answers, done, ... }`. The server refuses a character that another pid in the group holds (409), so inside one group a character has at most one Session One owner.

Options weighed:

| Key | Works when | Fails when |
| --- | --- | --- |
| Browser pid | Same phone, same browser, storage not cleared | Different device or browser, private window, cleared storage: no carry. Same browser, different character in Session Two: carries the wrong character's background. |
| Character id (chosen) | Always inside one group: the background belongs to the character, whoever plays it | Character not picked in Session One; group code changed. Both fall back to asking (F12, F14). |
| Name | | Session One players are nameless by default. |

Rule: for a Session Two player holding character `C` in group `G`, the carried answers come from the Session One player in `G` whose `character === C` and whose `choice !== 'switch'`. If there is none, nothing is carried. The browser pid is used only for the pick-screen hint (A18).

Consequence, stated on purpose: if Ben played Bebby in Session One and Dana plays Bebby in Session Two, Dana gets Bebby's background and sees Ben's earlier answers on the context lines. The answers belong to the character. The server sends only the carried step ids, not all of Ben's answers (D7).

### D2. Content layout and loader

```
content/session-two/
  README.md                 the Session Two additions to the Session One format (ticket 01)
  intro.md                  one "## info: intro" step every player sees (Session One's world.md)
  characters/<id>.md        one per character; id must match a Session One character
  steps/*.md                shared steps, appended to every character (D5)
  terms/*.md                Session Two terms; merged with Session One's terms
```

Draft files written with this spec: `intro.md`, `characters/{turator,deq,tenni,bebby,vilhelm}.md`, `steps/background-details.md`, `terms/subclasses.md`, `terms/backgrounds-2024.md`.

Loader: `loadSessionTwo({ s1Dir, s2Dir })`, exported from a new `session-two-content.js` that reuses the Session One parser (export what it needs from `session-one-content.js`; do not copy the parser). It:

1. Loads Session One with `loadContent(s1Dir)`. A Session One content error is reported as is.
2. Parses `s2Dir/terms/*.md` and merges them with the Session One terms. A term id used in both is an error naming both places.
3. Parses `intro.md` (exactly one info step), `characters/*.md`, `steps/*.md` with the merged terms and the Session Two step keys (D4). `lists/` works as in Session One if Aviv adds one (none exists now).
4. Resolves front matter (D3), `from:` steps, `context:` targets and `when:` targets (D4), and appends the shared steps (D5).
5. Returns `{ commonLore: <intro step>, characters: [{ id, name, cls, icon, background?, steps }], terms }`, the same shape as Session One plus `background` on a character. `contentFor` works on it unchanged.

Parsed per request, as Session One. `S2_CONTENT_DIR` overrides the Session Two dir (tests), as `S1_CONTENT_DIR` does.

### D3. Character front matter

```markdown
---
id: deq
background: soldier      # optional override (A6)
---
```

- `id` is required and must be a Session One character id. `name`, `class`, `icon` and `order` are optional; each missing one is taken from the Session One file with the same id. Why: the deq → רזול rename on 2026-10-15 had to touch several files; one source of truth for the name avoids a second copy drifting.
- `background:` is the override (A6). Allowed only in Session Two; Session One still rejects unknown front-matter keys.
- A Session One character with no Session Two file does not appear in Session Two.

### D4. New step keys (Session Two only)

Session One keeps rejecting these keys ("unknown key"), so its README stays true.

**`from: session-one`.** The step is the Session One step with the same id from the same character, copied whole (type, title, prompt, link, options, terms). The Session Two step holds no other key and no `###` options. The heading type must match the Session One step's type. Output: the copied step plus `carry: true`. A `carry` step is skipped when its effective answer comes from the override or from Session One (D6).

**`when: <step id> = <option id>`** or **`when: <step id> = _else`.** The step shows only when the effective answer of `<step id>` matches. `_else` shows when that step has an effective answer (a pick or free text) and no other `when:` on the same step id in this character's flow matches it. Output: `when: { step, value }`.

**`context: <step id>`.** Above the options (or the text box) the step shows the effective answer of `<step id>` (D8). The target is a step earlier in this character's Session Two flow, or a choice or text step in the same character's Session One file. Output: `context: { step, question, options: [{ id, label }] }`, where `question` is the target's `title` or `prompt` (or the text after `|` in `context: <step id> | <question>`, see D14) and `options` are its option ids and labels (empty for a text step). The client needs these because a Session One-only step (`god`, `element`) is not in the Session Two content.

Load-time checks, each a `ContentError` with file and line: see F1–F9.

### D5. Shared steps

`steps/*.md` hold `## <type>: <id>` steps only: no front matter, no `###` known/secret sections. Files load in name order. Every character gets every shared step after its own steps. A step id used twice in one character's full flow (own + shared) is an error. `steps/background-details.md` holds the 26 `details_<id>` choice steps (`when: background = <id>`, `context: background`) and `details_other` (a text step, `when: background = _else`).

### D6. Effective answer and visible steps

One pure module, `public/shared/session-two-flow.js`, used by the player flow and the DM view and unit-tested under `node --test`.

`effective(character, stepId, carried, answers)` returns `{ value, other, source }` or `null`:

1. `stepId === 'background'` and `character.background` is set → `{ value: character.background, source: 'dm' }`.
2. The character's Session Two step `stepId` has `carry: true`, or no Session Two step has that id (a Session One-only `context:` target), and `carried[stepId]` or a non-blank `carried[stepId + '_other']` exists → `{ value, other, source: 's1' }`.
3. `answers[stepId]` or a non-blank `answers[stepId + '_other']` exists → `{ value, other, source: 's2' }`.
4. Otherwise `null`.

`visibleSteps(character, carried, answers)` returns the character's steps, in order, without:

- a `carry` step whose effective answer has source `dm` or `s1`;
- a `when` step whose condition is false. A condition reads `effective(...).value`, which is a single option id (a `when:` target cannot be `multi`, F7). `= <id>` matches equal ids. `= _else` matches when the effective answer exists and its value is not named by any other `when:` on that step id (free text only counts as no match).

The list is recomputed on every render, so changing the background in Session Two changes the next step. Progress shows `i / n` of the current visible list.

### D7. Server: API and storage

Storage: `db.sessions[CODE].sessionTwo = { players: { [pid]: { createdAt, character, answers, done, updatedAt } } }`. Answers use the Session One shape: choice → option id (or an array if `multi`), free text in `<id>_other`, text → string. 20 KB cap, as Session One.

Routes (mirror `/api/s1`, same status codes and Hebrew errors):

| Route | Does |
| --- | --- |
| `GET /api/s2/content?code=&pid=&key=` | `loadSessionTwo` → `contentFor` (the DM key gets everything; a player gets their own character's secrets, if any). A `ContentError` returns 500 `שגיאה בקובץ התוכן: <file> line <n>: ...`. |
| `GET /api/s2/:code?pid=&key=` | `{ code, title, isAdmin, taken, me, carried, s1Character, players? }`. `taken`: `{ [character]: '' }` for every other Session Two player's character. `carried`: `{ answers, newName }` for `me.character` (D1, A4, A5), or `null` when there is no character or no Session One owner. `answers` holds only the keys `<id>` and `<id>_other` for the ids of this character's `carry` steps and `context:` targets. `s1Character`: the character this pid holds in Session One, or `null`. `players` (DM key only): every Session Two player with `id`, `character`, `answers`, `done`, `createdAt`, `updatedAt` and their own `carried`. If Session Two content fails to parse, `carried` is computed with no ids (`answers: {}`); the client shows the content error from the content route anyway. |
| `PUT /api/s2/:code/me/:pid` | `{ character?, answers?, done? }`. 409 `הדמות הזאת כבר נלקחה` when another Session Two player holds the character. 413 over 20 KB. |
| `DELETE /api/s2/:code/players/:pid?key=` | DM only (403); 404 for an unknown pid; frees the character. |

`server.js` also serves `public/session-two/index.html` for any extensionless path under `/session-two/` (add `'session-two'` to the tool list). The home page (`public/index.html`) gets a tile: `{ href: '/session-two', icon: 'quill', title: 'סשן שני', sub: 'תת-מקצוע, רקע ופרטי הרקע' }`. Session Two may share helpers with `s1Api`; Session One responses do not change (existing tests stay green).

### D8. Player flow and the context line

Screens, in order, all in the Session One markup and CSS:

1. **Create** (`/session-two`, no code): the Session One create screen, with one extra line: "כבר יש לכם קבוצה מהסשן הראשון? פתחו את אותו קישור, עם session-two במקום session-one." (Creating a new group means no carry-over, F14.)
2. **Pick**: kicker `<group title> · סשן שני`, heading "איזו דמות תשחק/י?", the Session One card list (taken = disabled, "נלקחה"). The card of `s1Character` adds " · שיחקת בה בסשן הראשון" to its subtitle (A18).
3. **Intro**: `commonLore` like the Session One world screen. Back → pick.
4. **Steps**: the visible steps (D6), rendered by the Session One step screen. Back from the first → intro.
5. **End**: "<name> מוכן/ה" / "התשובות נשמרו. נתראה בסשן!" and "לשנות" (A16).

The kicker name is `carried.newName` or the character's name (A5).

**Context line.** When a step has `context` and its effective answer exists, a small block sits above the options, styled with the existing `.hint` class (no new colours):

- line 1: the question as plain text, leading emoji removed (e.g. "מה היסוד שלך?"): the target's title or prompt, or the `| <question>` override of the `context:` line;
- line 2: the answer labels joined by ", ", then "משהו אחר: <text>" if there is free text;
- line 3, only for `s1` / `dm`: "מהסשן הראשון" or "נקבע על ידי ה-DM".

A label is found in `context.options`; else, for the `background` step, the Hebrew name of term `bg_<id>` (covers an override such as `noble` that no character offers); else the raw id.

**Subclass reconciliation (the decision about overlapping answers).** Context line, never a preselected card. Per character:

| Character | `context:` | Why |
| --- | --- | --- |
| vilhelm | `element` | The damage element is the closest earlier answer to a wizard school. The Evoker card's subtitle names it as the closest fit. |
| bebby | `rogue_type` | Urban thief / desert smuggler / foreign spy maps loosely onto Thief / Assassin. |
| deq | `rage_style` | `on_evoker` is Razul's opinion of the wizard's magic, not of his own path; showing it would mislead. `rage_style` (primal vs juggernaut) is what separates Wild Heart / World Tree from Berserker. |
| tenni, turator | `god \| <question>` | A cleric domain and a paladin oath follow from the god. The Session One `god` step's title is a list heading ("חמישה אלים שתוכלו לבחור בהם"), not a question, so both files override it ("לאיזה אל אתה מתפלל?" / "לאיזה אל אתה נשבע?"). |

Why no preselection: a preselected card makes "המשך" enabled before the player chose anything, and none of these answers maps to exactly one subclass (`element: psychic` fits no school better than another). The cards' subtitles carry the lore fit instead.

**Background step.** Shown only when not skipped (D6): exactly the Session One step, so the same 5 options, free-text box and link. **Details step.** `context: background` shows the background on top, including where it came from.

### D9. DM view

`/session-two/<CODE>/dm?key=`: the Session One DM layout. Kicker = group title; heading "סשן שני: בניית הדמות". One open card per Session Two player, sorted by `createdAt`:

- summary: `<shown name> (<class>)`, or "עוד לא בחר/ה"; "(באמצע)" when not done;
- rows: one per visible step of that player (D6, using their `carried`), question = plain title or prompt, answer as in Session One. The background row adds "(מהסשן הראשון)" or "(נקבע על ידי ה-DM)" when skipped for that reason; a skipped background step still gets its row, filled from the effective answer;
- answers to step ids that are no longer in the content: listed at the end, as Session One does. Answers of hidden `when` steps (an old details answer after the background changed) are not listed;
- delete button: as Session One, against `DELETE /api/s2/...`.

Footer: share `/session-two/<CODE>`. No lore compendium link (A14). The Session One DM view footer gets one more link: "לסשן השני" → `/session-two/<CODE>/dm?key=<key>`.

### D10. Draft content summary

| File | Holds |
| --- | --- |
| `characters/*.md` | Front matter `id` only. `## choice: subclass` (4 options, each `term:`, subtitle = lore fit, description = one line; `context:` per D8; `link:` to the class page), then `## choice: background` / `from: session-one`. No overrides set. |
| `steps/background-details.md` | 26 details steps, 4–6 options each, emoji + Hebrew label + one-line lore description; `details_other` text step. |
| `terms/subclasses.md` | 19 `sc_*` terms: Hebrew name, `en`, `category: class`, a dnd2024.wikidot.com link (checked 2026-10-15, HTTP 200), blurb, "מקור: 2024 PHB". |
| `terms/backgrounds-2024.md` | 9 `bg_*` terms in the shape of `content/session-one/terms/backgrounds.md`. |
| `intro.md` | `## info: intro`, three known bullets. |

Subclass option ids: `devotion, glory, ancients, vengeance` / `berserker, wild_heart, world_tree, zealot` / `life, light, trickery, war` / `arcane_trickster, assassin, soulknife, thief` / `abjurer, diviner, evoker, illusionist`. Details step ids: `details_` + one of `acolyte, artisan, charlatan, court_servant, criminal, desert_runner, destined, entertainer, farmer, folk_hero, giant_foundling, gladiator, guard, guide, hermit, knight_of_the_order, merchant, noble, occultist, outlander, sage, sailor, scribe, soldier, urchin, wayfarer`, plus `details_other`. Never rename an id once players answer (README rule).

## Failure and edge states

Content (each is a `ContentError` with file and line; the page shows the content-error screen; `npm test` fails):

| # | State | Behaviour |
| --- | --- | --- |
| F1 | Session Two character id with no Session One character | Error at the front-matter `id` line: `no Session One character "<id>"`. |
| F2 | Unknown front-matter key in Session Two | Error listing the allowed keys (`id, name, class, icon, order, background`). |
| F3 | `background:` value with no `bg_<value>` term | Error: `background "<v>": there is no term "bg_<v>"`. |
| F4 | `from:` value other than `session-one`; `from:` step with other keys or options; the Session One character has no step with that id; the types differ | One error each, at the step heading or the `from:` line. |
| F5 | `when:` not in the form `<id> = <option id or _else>` | Syntax error at the line. |
| F6 | `when:` names a step that is not earlier in this character's flow | Error naming the character (a shared step is checked per character). |
| F7 | `when:` target is not a choice step, or is `multi: true` | Error. |
| F8 | Two steps in one character's flow with the same `when:` target and value, or two `_else` for one target | Error naming both step ids. |
| F9 | `context:` target is in neither the Session Two flow (earlier) nor the character's Session One file, or is an info step | Error. |
| F10 | `from`, `when` or `context` in a Session One file; `background:` in Session One front matter | Session One's existing "unknown key" error. |

Data and flow:

| # | State | Behaviour |
| --- | --- | --- |
| F11 | Player answered `background` in Session Two (no carry then), and later the Session One owner answers it | The carried answer wins (A7); the background step disappears, the details step follows the carried background. The Session Two `background` answer stays stored, unused. |
| F12 | Nobody picked the character in Session One | No carry. The background step is asked; context lines for Session One-only targets do not show. |
| F13 | The Session One owner chose `switch` | As F12 (A4). |
| F14 | The group in Session Two is a new code | Nothing to carry; everything is asked. The create screen tells groups to reuse the old link (D8). |
| F15 | Two players want the same character in Session Two | The second gets 409 "הדמות הזאת כבר נלקחה", as Session One; the card shows "נלקחה". |
| F16 | Same browser played Turator in Session One, picks Bebby in Session Two | Bebby's Session One answers carry (D1). The Turator card shows the "שיחקת בה" hint; nothing forces it. |
| F17 | Different browser or cleared storage | Carry still works (matched by character). The pick hint is missing (no `s1Character`). |
| F18 | Session One background is free text only (`background_other`, no pick) | Background counts as answered: step skipped, `details_other` shown, context line shows the text. |
| F19 | Session One background has a pick and free text | The pick decides the details step; the context line shows both. |
| F20 | Override set while a player already answered background or details in Session Two | Override wins. Old answers stay stored and hidden; the DM view lists only visible steps. |
| F21 | Background id with no details step (a background added to Session One later) | `details_other` shows (`_else`). The coverage test fails until a step is added. |
| F22 | Player changes the background in Session Two after answering details | The new details step shows; the old details answer stays stored, hidden. |
| F23 | DM deletes the Session One player after Session Two answers | Carry disappears on the next load; the background step comes back for that player if they edit. DM view shows what is effective now. |
| F24 | Context target answered in Session One with an option id that no longer exists | The label falls back to the raw id (D8). |
| F25 | `multi` context target (e.g. a future one) | Labels joined by ", ". |
| F26 | Subclass answered as free text only | Accepted (A9). The DM view shows "משהו אחר: <text>". |
| F27 | Session Two content broken | `/api/s2/content` returns 500 with file and line; the player and DM pages show the content-error screen. Session One is unaffected. |
| F28 | Session One content broken | Session Two also fails (it loads Session One first) with the Session One file and line. |
| F29 | Network error on save | As Session One: the save is fire-and-forget on "המשך"; the next save resends the whole answers object. |
| F30 | Unknown group code | The Session One not-found screen. |
| F31 | Session One player renamed the character, a different person plays it in Session Two | The new player sees the renamed name (A5). They cannot rename in Session Two. |

## Acceptance criteria (feature level)

- [ ] `/session-two/<CODE>` walks pick → intro → subclass → background (when not skipped) → one details step → end, in the Session One look.
- [ ] Each character's subclass step shows exactly its four 2024 PHB subclasses, each with English name and an info button.
- [ ] A character whose Session One owner answered `background` skips the background step; the details step matches that answer and shows "מהסשן הראשון".
- [ ] A `background:` override skips the background step even when Session One has a different answer; the details step follows the override and shows "נקבע על ידי ה-DM".
- [ ] With neither, the Session One background step for that character is asked, and the details step follows the answer.
- [ ] A free-text background gets `details_other`.
- [ ] Vilhelm, Bebby, Razul, Tenni and Turator see their D8 context line when the Session One answer exists, and no line when it does not.
- [ ] `/session-two/<CODE>/dm?key=` lists every Session Two player with the visible steps' answers and the background source.
- [ ] Session One behaves as before: its tests pass, its responses are unchanged.
- [ ] `npm test` loads the real `content/session-two` and passes, including the coverage test.

## Testing

- **Loader** (`test/session-two-content.test.js`): fixtures under `test/fixtures/session-two/` with a small Session One fixture beside them. Shape tests (inheritance, `from` copy, `when`, `context`, shared steps appended) and one test per F1–F10. Real-content test: `loadSessionTwo` on the repo's `content/session-one` + `content/session-two` does not throw. Coverage test: every option id of every Session One `background` step and every `bg_*` term (minus `bg_`) has a `when: background = <id>` step, and one `_else` step exists.
- **Flow logic** (`test/session-two-flow.test.js`): `effective` and `visibleSteps` against the D6 priority, F11–F13, F18–F22.
- **API** (`test/session-two-api.test.js`): spawn `server.js` on a temp `DATA_DIR` with `S1_CONTENT_DIR` / `S2_CONTENT_DIR` fixtures (the lore-edit tests show how). Seed Session One through `PUT /api/s1/...`, then check `carried`, the key filter, `switch`, 409, 413, DELETE.
- **Browser**: local server (`DATA_DIR=<scratch> PORT=<p> node server.js`), a fresh group per run (`POST /api/sz/sessions`). Seed Session One answers through the API. Walk each acceptance criterion on a phone-sized viewport.

## Out of scope

- Lore editing and the DM compendium for Session Two (A14).
- Changing a character's class, level or Session One answers from Session Two.
- More than one details question per background.
- Matching free-text backgrounds to known ids (no string matching; same reason as the term-markup decision in `session-one-glossary.md` D1).
- Moving shared terms out of `content/session-one/terms/`.

## Addendum (Aviv, 2026-10-15)

### D11. Fixed backgrounds

Four characters get a `background:` in their front matter (D3), so their background step is skipped and the details step follows the override: deq `soldier`, tenni `sage`, bebby `court_servant`, vilhelm `mharoti_scholar_criminal` (D12). Turator keeps the Session One question, so his background varies.

### D12. Vilhelm's custom background

`mharoti_scholar_criminal` is not an option of the Session One `background` step. Vilhelm's file (`characters/vilhelm.md`) holds four steps of his own, each `when: background = mharoti_scholar_criminal` (F8 relaxed, D14):

1. a multi choice with `count: 2`: two skill proficiencies;
2. a multi choice with `count: 2`: two tools or languages in total, with a `hint:` not to pick a language the character already knows;
3. a single choice: one Origin Feat;
4. a text step: the story (what was studied, what made it criminal).

Term `bg_mharoti_scholar_criminal` (in `terms/`) carries the flavour paragraph. Source text: `/tmp/s2brief/vilhelm-background.md` (adapted to Hebrew and the lore). The loader accepts the value because the character's `background:` override has a `bg_` term (D14 when-value rule). The coverage test accepts a background covered by one character's own steps (D14).

### D13. Characteristics steps

After the details step(s), every character gets four choice steps with ids `trait`, `ideal`, `bond`, `flaw` (personality trait, ideal, bond, flaw). They are per character (option sets differ), so they live in the character files. **Ordering (decided, Aviv's manager, 2026-10-15):** the shared `details_*` steps (D5) come first, so a character file holds a `## shared` line (D14) right before `trait`; the loader inserts the shared steps there. Without the line they go at the end, as before.

- Each has 6 to 8 options, written in Hebrew, adapted from the 2014 PHB and SCAG tables to the lore, with `random: true` (D14). The "random" button draws one of the visible options and stores its id. Free text stays available (`other: true`, as in Session One).
- Turator's background varies, so his options are keyed with option `when: background = <id>` for the backgrounds that have their own options, plus generic paladin options with no `when:`, shown for any background.
- Every other character has fixed options (their background is fixed by D11).

### D14. Grammar added to the loader

All Session Two only; Session One keeps rejecting them as "unknown key" and its output is byte-equal.

- **F8 relaxed.** Several steps may share one `when: <target> = <value>` if all are in the same character file. Still errors: two shared steps with one target and value; a character step and a shared step with one target and value; two `_else` for one target in a flow.
- **`count: <n>`.** Only on `multi: true` choice steps. Whole number from 2 to the number of options. Exactly `n` picks. Error otherwise, with file and line. Output: `count: n`.
- **Option `when: <step> = <option id>`.** The option shows only when the effective answer of that step equals the id. Same checks as step `when` (F5, F6, F7); `= _else` on an option is an error; every step keeps at least one option without `when`. Output: `when: { step, value }` on the option.
- **`context: <step id> | <question>`.** Optional text after `|` replaces the derived question (`title`, else `prompt`) of the context line. Both parts are trimmed. Nothing after `|` is an error with file and line; without `|` nothing changes. Session Two only (Session One still rejects `context:`). The step id keeps its rule (Latin lowercase letters, digits, `_`).
- **`random: true`.** Only on single-answer choice steps. Output: `random: true`. `random: false` is accepted and dropped.
- **When-value rule.** A step or option `when: <target> = <value>` needs `<value>` to be an option id of the target step (`_else` on a step excepted). For target `background` it is also accepted when it equals the character's own `background:` override or when a term `bg_<value>` exists (overrides and custom backgrounds are no option of the `from` step). Otherwise an error at the `when:` line.
- **`## shared` placement marker.** A line `## shared` (a heading with no type or id, no keys, no text) in a character file marks where the shared steps (D5) go in that character's flow. At most once per file; without it they go after the file's own steps (as before). Errors, with file and line: a second `## shared` in one file; `## shared` in a shared step file (`steps/*.md`); keys or text under it. In Session One, `## shared` is the usual unknown-heading error. F6 and the F8 / when-value checks use the final flow order, so a step after the marker may say `when: details_x = ...` or an option `when: background = ...`.
- **`count` and free text.** For a `count: n` step the free-text box (`other: true`) does not count toward `n`: exactly `n` picks are required, and free text is an optional extra.
- **Session One option `when:`.** Session One rejects a `when:` line inside an option with the unknown-key error (`unknown key "when" (allowed: id, subtitle, term)`) instead of reading it as description text.
- **Coverage test.** A character's own steps count as covering a `bg_*` term. An id that some characters cover and others do not is a custom background and is not required of the rest. Each character still needs exactly one `_else` step.

### Acceptance criteria (addendum)

- [ ] Deq, Tenni, Bebby and Vilhelm skip the background step; their details step follows the override and shows "נקבע על ידי ה-DM".
- [ ] Vilhelm sees his four steps; the two multi steps accept exactly 2 picks and refuse fewer or more.
- [ ] Every character has `trait`, `ideal`, `bond`, `flaw` after the details step; each has 6 to 8 options and a "אקראי 🎲" button.
- [ ] The random button draws one of the options visible for that player and stores its id (never a hidden option, never "random").
- [ ] Turator sees the options for his effective background plus the generic ones, and no option of another background.
- [ ] `npm test` passes: one test per rule in D14, with file and line in each error; Session One output is unchanged.
