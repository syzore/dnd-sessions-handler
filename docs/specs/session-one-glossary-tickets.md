# Session One terms and background step: tickets

Spec: `docs/specs/session-one-glossary.md` (D# = design decision, F# = failure state, A# = assumption). Give each engineer the spec path plus one ticket. Nothing in the spec is open: build to the assumptions and do not wait for Aviv.

For every ticket:
- Commit straight to `main` (A1), after the ticket's checks pass. Deploys are manual (`railway up`), so a commit does not ship.
- `npm test` passes before each commit (from ticket 01 on).
- Never change an existing character, step or option id (README id rule). `git diff` shows only text, new keys and new steps.
- Browser checks use the local recipe in the spec's Testing section.

Order and blocking edges:

```
01 → 02 → 03 ─┐
01 → 05 ──────┴→ 07 ─┐
01 → 04 ─────────────┼→ 08 → 09
01 → 06 ─────────────┘
(08 also needs 03)
```

| # | Title | Blocked by |
| --- | --- | --- |
| 01 | Term files and references render as plain text with first-mention English | none |
| 02 | Term popup | 01 |
| 03 | Option `term:` and the info button on choice cards | 01, 02 |
| 04 | Send each player only the terms they can reach | 01 |
| 05 | Step-level `link:` | 01 |
| 06 | Convert the glossary draft into term files | 01 (the draft exists) |
| 07 | Background step for all 5 characters | 03, 05 (the draft exists) |
| 08 | Expand world.md and mark up existing content | 03, 04, 06, 07 |
| 09 | Offline URL checker (required, last) | 08 |

The frontier after 01 is 02, 04, 05 and 06. Both drafts exist (A13). If a draft file is missing or moved when its ticket starts, stop and report it (F34).

---

## 01: Term files and references render as plain text with first-mention English

**What to build:** An author can add `content/session-one/terms/*.md` (D3) and write `[[id]]` / `[[id|text]]` (D2) in any allowed field. Players and the DM see the display text with "(English)" after the first occurrence of each term on each screen (D5). Nothing is clickable yet. Every content mistake in F1–F5 shows the existing content-error screen with file and line. (F6 is ticket 03.)

**Blocked by:** None.

Scope:
- Parser (`session-one-content.js`): a new term-file kind. Categories are the 8 in D3, including `background`. Validate references across every content file with line numbers (a line-based scan after comments are blanked is enough). Add `terms` to the parsed content.
- One shared parser function for a `link:` value (`[title] [—|-] URL` → `{ title?, url }`, `https:` only). Ticket 05 reuses it for step links.
- API: `/api/s1/content` returns `terms` (D7 shape). All terms go to everyone for now. Ticket 04 adds the filtering.
- Client: shared `richText` / `plainText` (D8). Use them at every place that shows content text in Session One (player flow, DM players view, DM compendium). Add a post-render pass that appends the English span to the first occurrence per scope (D5). Use `plainText` inside option buttons (D4).
- Seed content: 2 terms (`veles` per A30, `baal`) and one reference to each in `world.md` / `lists/faith-known.md`, so the slice can be shown.
- Tests: add `"test": "node --test"` to `package.json`, with fixture folders. Cover the term shape and F1–F5. Add the real-content test: `loadContent` on the repo's `content/session-one` must not throw (A3).
- README (`content/session-one/README.md`): the term-file section, the 8 categories with their Hebrew labels (class = "מקצוע", background = "רקע"), the reference syntax, where references are allowed, "do not type the English by hand", the id-rename rule for terms, and a "before deploy" line: run `npm test` before `railway up`. Hebrew + English, as the README does now.

- [ ] `npm test` passes and covers F1, F2, F3, F4, F5 messages (file + line).
- [ ] The real-content test fails when a fixture copy of the real content has `[[no_such_term]]` added, and passes on the real content.
- [ ] The world page shows "ולס (Veles)" on its first mention and plain "ולס" on any later one.
- [ ] A choice option description with a reference shows plain text inside the button. Selection still works.
- [ ] No raw `[[` on any player screen, DM players view, DM compendium or `<title>` (F12).
- [ ] An unknown id on the client renders plain text (F7).
- [ ] README updated, including the `npm test` before `railway up` line.

## 02: Term popup (bottom sheet / dialog)

**What to build:** Term references outside buttons become triggers (D6). A tap or click opens the term popup: header, image with fallback chain, blurb, links. It closes with X, Esc, backdrop and back button. Focus is handled, and references inside the popup navigate within it.

**Blocked by:** 01.

- [ ] The trigger is a `<button type="button" class="term" aria-haspopup="dialog">`, styled as a text link with a visible focus ring.
- [ ] ≤ 560px: bottom sheet, max height 85vh, internal scroll, sticky header (F19). Wider: centered card, max width 480px. RTL.
- [ ] The header has the category kicker in Hebrew (all 8 labels in D6, including "רקע"), the Hebrew name, the English name (`dir="ltr" lang="en"`) and the aliases line if there is one.
- [ ] Image: lazy, `referrerpolicy="no-referrer"`, the alt text has both names, the area keeps its height while loading. On error it tries the next URL. When all fail it removes the area (F8). Test this with a deliberately broken URL.
- [ ] A `static.wikia.nocookie.net` image actually renders in the popup (A23). Use a scratch term with the draft's `human` image, `https://static.wikia.nocookie.net/forgottenrealms/images/b/bd/5eR_Humans.jpg/revision/latest?cb=20250529030721`, and check in the browser's network panel that the request has no `Referer` header and returns 200.
- [ ] Links open in a new tab with `rel="noopener noreferrer"`. They show the title (or host name) plus the host name.
- [ ] Esc, X and a backdrop click close the popup. A click inside does not. Focus goes to X on open and back to the trigger on close.
- [ ] Android/browser back closes the popup and stays on the page. Closing it another way leaves no extra history entry.
- [ ] The page behind does not scroll while the popup is open (check iOS Safari or the responsive emulator).
- [ ] A reference in a blurb opens that term in the same popup. The back button returns. Max 10 entries. A self-reference is plain (F16).
- [ ] Name-only terms are not triggers (F15). F17, F18 and F23 behave as in the spec.
- [ ] Works in the DM compendium (F13).
- [ ] Verified in a real browser at 390px and 1280px.

## 03: Option `term:` and the info button on choice cards

**What to build:** A choice option can say `term: <id>` (D4). Its card shows an info button that opens the term popup without selecting the card. The label counts as a term occurrence for the English rule. Each god in `lists/gods.md` gets `term:`. Each of those gods needs a term entry: add minimal ones (`id`, `en`, `category: god`, Hebrew name) if ticket 06 has not landed yet. Ticket 06 enriches them.

**Blocked by:** 01, 02.

- [ ] The parser accepts `term:` on options in steps and in `lists/`. An unknown id gives a parser error with file and line (F6). `[[` in a `term:` value is an error (F3). Tests cover both.
- [ ] The info button is not inside the option `<button>`. The HTML is valid (no nested interactive elements). It has aria-label "מידע על <name>".
- [ ] Tapping the info button opens the popup and does not change the selection or `aria-pressed`. Tapping the card still selects it.
- [ ] An option whose `term:` is missing from the client's `terms` renders with no info button (F7).
- [ ] The god cards show "בהאמוט (Bahamut)" (or the converted spelling).
- [ ] DM compendium cards show the same info button.
- [ ] README documents `term:` under the choice option keys, and says the label must not carry the English in parentheses (F20).

## 04: Send each player only the terms they can reach

**What to build:** `contentFor` sends a non-DM viewer only the terms referenced by the content that viewer gets, including option `term:` values, plus the transitive closure through blurbs (D7). The DM gets every term. If 03 has not landed, still collect `term:` values from options: the key is just absent until then.

**Blocked by:** 01.

- [ ] Test: a term referenced only in character A's secret is missing from the response for a player of B and for a player with no character yet. It is present for A's player and for the DM.
- [ ] Test: a term reached only through another term's blurb is included.
- [ ] Test: a term reached only through an option `term:` is included.
- [ ] README states that term blurbs are seen by every player who can reach them, so secrets stay out of blurbs.

## 05: Step-level `link:`

**What to build:** A choice or text step can carry one external link (D9). The parser reads `link:` with the shared function from 01 and returns `step.link = { title?, url }`. The player flow and the DM compendium render it after the answer area, before the footer.

**Blocked by:** 01.

Scope:
- Parser: add `link` to the step keys. Reject it on `info` steps (F25). Accept it in `lists/` options files as a default that a step's own `link:` overrides (F27). Validate with the shared function (F26). `[[` in it is an error (F3).
- Client: render `<a class="step-link" target="_blank" rel="noopener noreferrer" dir="auto">` with the title (or host name, F28), the host name in muted text when a title is shown, and an external icon. Max width 560px, aligned with the card grid and the "other" box. Same render in `renderStep` and in the DM compendium's step sections.
- README: a `link` row in the step key table (Hebrew + English), with one example.

- [ ] Tests: the parsed shape with and without a title; F25, F26 (non-`https`, no URL, twice) and F3 messages with file and line; the F27 override.
- [ ] A choice step with `link:` shows the link under the "other" box. A text step shows it under the text box.
- [ ] Typing in the "other" box, then opening the link, then coming back: the text is still there and "המשך" state is unchanged.
- [ ] The DM compendium shows the same link.
- [ ] Verified in a real browser at 390px and 1280px, on a temporary `link:` added to a scratch copy of the content (do not commit a link to real content in this ticket).

## 06: Convert the glossary draft into term files

**What to build:** Every entry in `docs/lore/session-one-glossary-draft.md` except `casmara-azrabahir` becomes a term in `content/session-one/terms/` (57 terms), using the conversion table in spec D3 and the content-scope assumptions A20–A30. Add the name-only term `mharot` (A25). The page loads without a content error.

**Blocked by:** 01. The draft exists (A13).

- [ ] One term per draft entry, except `casmara-azrabahir` (A20). Ids are kebab → snake. Ids are unique; on a collision, the later entry gets `_2` and a comment (A17).
- [ ] Draft `sources` / `uncertain` go into HTML comments above each entry, never into keys or blurbs; `none` gives no comment (A24). The `halfling` comment starts with "unconfirmed:" (A29).
- [ ] `grep -rn 'קסמרה\|Casmara\|לוקי החמישי\|Emperor' content/` finds nothing (A20, A21). The `loki` blurb ends after "...חלק ממזימה עם הענקים."
- [ ] `azuran`, `ozmir_al_stragul`, `holy_orders` and `giantkin` have no `image:` line, and their comment says "Image omitted (A22)." Every other draft image is kept.
- [ ] No `[fandom: no-referrer]` text in `content/`. Those URLs are kept as plain `image:` lines (A23).
- [ ] The A28 blurb edits are applied to `goliath`, `cassilon` and `holy_orders`. `seven_cities` keeps "שבע הערים" and its blurb as written (A27).
- [ ] Every image and link is `https://`. Drop any others and note them in a comment.
- [ ] Mentions of other terms inside blurbs are wrapped in references. No hand-typed English parentheses (F20).
- [ ] Names from the existing content that appear in no draft entry but need a pronunciation become name-only terms, plus `mharot` (A25). The minor terms in A26 do not.
- [ ] Minimal god terms added by ticket 03, and the `veles` / `baal` seeds from ticket 01, are replaced by the draft's entries with the same id, not duplicated (A30).
- [ ] `npm test` passes, including the real-content test. The local server shows no content error, and each term popup opens (spot-check at least one per category).
- [ ] Do not change the Hebrew tone of the blurbs beyond mechanical fixes (A18).

## 07: Background step for all 5 characters

**What to build:** Each of `deq.md`, `bebby.md`, `turator.md`, `tenni.md` and `vilhelm.md` gets the `## choice: background` step from spec D10, directly after `## info: lore` (A5). Its options and terms come mechanically from `docs/lore/session-one-backgrounds-draft.md`, the content source for this ticket, through the D10 conversion table. The background terms go in `content/session-one/terms/backgrounds.md`.

**Blocked by:** 03 (option `term:`), 05 (step `link:`). The draft exists (A13): 5 options per character, 17 distinct backgrounds.

Scope:
- A new step only (A31). No existing step is removed, renamed or merged, including bebby's `origin` and vilhelm's `magic_origin`.
- Step text: the D10 `title:`, `prompt:` (with the character's name) and `link:` lines, exactly as written there. No `multi:`, no `optional:`, no `other:` (A10).
- Options: at most 5 per character, in draft order (A14). Option id = the draft id as written; it is already snake_case, so the A6 `-` → `_` step is a no-op. The same `en` uses one id in every file (A6). Tenni's and Turator's options are converted as drafted, although their race is a TODO (A34). Heading = `he` without a trailing Latin parenthetical. `term: bg_<option id>` (A7). `subtitle:` = fit. Description = draft description. No emoji (A9).
- Terms: one entry per distinct background (17), `category: background`, blurb = description + `מקור: <source>` as written (mixed editions allowed, A33), `link: <en> — <url>` (D10). `bg_gladiator` has the extra paragraph "זהו וריאנט של רקע הבדרן." between them (A32).
- Full-list URL: `https://www.dndbeyond.com/backgrounds` in all 5 files (A12).
- Glossary candidates: every candidate is a chosen background, so no candidates comment is written and the candidates' blurbs are not used (A16).

- [ ] Each character file has `## choice: background` as the step directly after `## info: lore`, and the order matches the D10 placement table.
- [ ] `git diff` on `characters/` shows only the 5 added steps. No existing line changes.
- [ ] Every option id matches `^[a-z0-9_]+$`. A background shared by two characters has the same option id and one term (F32).
- [ ] No heading carries the English name in parentheses (F20). Each card in the browser shows "<Hebrew> (English)" once.
- [ ] Every term and step URL is `https://`; dropped ones are noted in a comment.
- [ ] `npm test` passes, including the real-content test.
- [ ] Browser, for each of the 5 characters on a fresh group: the background step is step 2; 5 cards with the fit line and description; the info button opens a popup with "רקע", the English name, the source and the rules link, and does not select the card; the "other" box is there with the full-list link under it; "המשך" stays disabled until a card is picked or the box has text.
- [ ] DM view shows the picked label (and "משהו אחר: ..." when the box was used, F30). A player who was `done` before the change shows "—" (F29).
- [ ] Every character has 5 options, so the commit message needs no F33 note. `bg_gladiator`'s popup shows the "וריאנט של רקע הבדרן" paragraph (A32).

## 08: Expand world.md and mark up existing content

**What to build:** `world.md` gets the glossary draft's "Proposed world.md bullets" except "הסולטנה הגולה" (A20): 6 bullets, added in the existing `- **title** text` format and tone. Hand-typed "(English)" parentheticals become references, and the "(source: ...)" tails and "[scope call ...]" tags are dropped (A25). The "ממלכת מגדר" bullet gets the A28 edit. The existing content (`world.md`, `lists/`, `characters/`, including the background steps from 07) references terms. Each step marks at least the first mention of each term. Later mentions can stay plain text.

**Blocked by:** 03, 04, 06, 07.

- [ ] The new `world.md` bullets come from the draft, contain term references, and keep the `## info: common_lore` step id. They contain no Latin letters outside `[[...]]`, no "(source:" and no "[scope call".
- [ ] The existing `world.md` bullets get their English only through `[[id]]` / `[[id|text]]` on first mention (A25). No hand-typed English anywhere (F20).
- [ ] The sultana is not named and Emperor Loki V is not mentioned (A20, A21). "סולטנה אנושית" in `world.md` stays plain text.
- [ ] The A26 minor terms (מחתרת הג'מבוקה, לוחם קדוש, צלבן, אלמנטליסטים, כישוף מולד) are not marked.
- [ ] Every step's first mention of a known term is a reference, including inflected forms through `[[id|text]]`. A prefix letter stays outside the brackets.
- [ ] No step, option or character id changes (saved answers point at them). Check with `git diff`: only text and new `term:` lines change.
- [ ] Words that only look like a term are not marked (e.g. "בעלי קשקשים" is not the god Baal).
- [ ] No term only a secret references is described in a way that leaks the secret (D7).
- [ ] `npm test` passes, including the real-content test.
- [ ] Every screen of every character checked in a real browser: no raw markup, the English appears once per term per screen.

## 09: Offline URL checker (required, last)

**What to build:** `npm run check-terms` requests every term `image:` and `link:` URL and every step `link:` URL in `content/session-one`, and lists the ones that fail, with file and line. It is for Aviv to run before a deploy. It is never part of a page request. Then run it once on the real content and clean up dead URLs (A19).

**Blocked by:** 08. The code only needs 01 and 05, but it goes last so its run covers every URL the earlier tickets added.

- [ ] It reports the HTTP status, or a network error, per failing URL with file and line. It exits non-zero if any fail.
- [ ] It uses a timeout per URL and limited concurrency. It falls back to GET when HEAD is refused.
- [ ] It covers term images, term links and step links (test with a fixture that has one dead URL of each kind).
- [ ] Run on the real content: a term URL that fails twice is removed and replaced by `<!-- removed dead URL: <url> (<status>) -->`. A failing step link is replaced by the A12 fallback URL. A second run exits 0.
- [ ] README mentions the command next to the "before deploy" line.
