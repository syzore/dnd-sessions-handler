# Session Two: tickets

Spec: `docs/specs/session-two.md` (D# = design decision, F# = failure state, A# = assumption). Give each engineer the spec path plus one ticket. Nothing is open: build to the assumptions and do not wait for Aviv.

For every ticket:
- Commit straight to `main` (A1) after `npm test` passes. A commit does not ship; `railway up` ships the working tree.
- Never change a Session One character, step or option id, and never edit `content/session-one/` (A13).
- Do not commit the untracked `session-zero.json` at the repo root (it holds test admin keys).
- Content ids in `content/session-two/` are final once players answer. Fix a draft only where the loader's grammar forces it, and say so in the commit message.

Order and blocking edges:

```
01 → 02 ─┐
03 ──────┼→ 04 → 05
```

| # | Title | Blocked by |
| --- | --- | --- |
| 01 | Session Two content loader | none |
| 02 | Session Two API, route and home tile | 01 |
| 03 | Shared step screen (Session One refactor, no behaviour change) | none |
| 04 | Session Two player flow | 02, 03 |
| 05 | Session Two DM view | 04 |

01 and 03 can start at once, in parallel.

---

## 01: Session Two content loader

**What to build:** `loadSessionTwo({ s1Dir, s2Dir })` parses the draft content in `content/session-two/` into the D2 shape, with every F1–F10 mistake reported as a `ContentError` with file and line. Nothing user-visible yet; the proof is `npm test` on the real content.

**Blocked by:** none.

Scope:
- New `session-two-content.js` (ESM). Reuse the Session One parser: export the internals it needs from `session-one-content.js` (`parseFile`, `parseTermFile`, `checkRefs` or a small wrapper). Do not copy the parser. Session One's output and errors do not change.
- Terms: Session One terms + `s2Dir/terms/*.md`, one Map; duplicate id → error naming both files (D2).
- `intro.md`: exactly one info step (like `world.md`).
- Front matter (D3): `id` required and must exist in Session One (F1); `name`, `class`, `icon`, `order` inherited when missing; `background:` override validated against `bg_*` terms (F3); other keys → F2. Session One keeps rejecting `background:` (F10).
- Step keys `from`, `when`, `context` (D4), accepted only by the Session Two loader; Session One rejects them as today (F10). Output `carry: true`, `when: { step, value }`, `context: { step, question, options }`.
- Shared steps from `steps/*.md`, appended per character in file-name order (D5).
- All checks F4–F9, per character for shared steps.
- `contentFor` works on the result unchanged; add a test that proves it (a player gets no other character's secret).
- `content/session-two/README.md`, Hebrew + English like the Session One README: the folder layout, front-matter inheritance and `background:`, the three new step keys with one example each (use real drafts: `deq.md`, a `details_soldier` excerpt, `details_other`), shared steps, "keep secrets out of shared steps" (A15), the id rule, and `npm test` before `railway up`. Link to the Session One README for everything else instead of repeating it.
- `scripts/check-terms.js` (`npm run check-terms`) also checks the Session Two term links and step links.

Tests (`test/session-two-content.test.js`, fixtures under `test/fixtures/session-two/`):
- [ ] Shape: inheritance from Session One front matter; `from` copies the Session One step; `when` / `context` objects; shared steps appended after the character's own.
- [ ] One test per F1–F10, asserting the message names the file and line.
- [ ] Real content: `loadSessionTwo` on `content/session-one` + `content/session-two` does not throw.
- [ ] Coverage: every option id of every Session One `background` step, and every `bg_*` term id minus `bg_`, has a `when: background = <id>` step; exactly one `_else` step for `background` exists. Mutation check: deleting `details_soldier` from a copy fails this test.
- [ ] Each real character's `subclass` step has exactly the D10 option ids for its class.
- [ ] Session One tests unchanged and green.

## 02: Session Two API, route and home tile

**What to build:** The D7 server side. `/session-two/<anything>` serves the (stub) Session Two page; the API stores Session Two answers and returns carried Session One answers matched by character.

**Blocked by:** 01.

Scope:
- `server.js`: `if (parts[1] === 's2') return s2Api(...)`. The four routes in D7. Storage `db.sessions[CODE].sessionTwo.players` (D7). Content dir `S2_CONTENT_DIR` or `<ROOT>/content/session-two`.
- `carried` per D1, A4, A5: Session One owner of the same character, not `switch`; only the `<id>` / `<id>_other` keys for the character's `carry` step ids and `context:` targets; `newName` only when the owner chose `rename`.
- `s1Character` for the requesting pid.
- Add `'session-two'` to the SPA tool list; create `public/session-two/index.html` as a copy of the Session One page that loads `/session-two/app.js` (a stub that renders the group title is enough here; ticket 04 fills it).
- Home tile in `public/index.html` (D7).
- Share helpers with `s1Api` if useful; Session One responses unchanged.

Tests (`test/session-two-api.test.js`, spawn `server.js` on temp `DATA_DIR`, `S1_CONTENT_DIR` and `S2_CONTENT_DIR` fixtures; see `test/lore-edit.test.js` for the spawn pattern; `PORT` explicit):
- [ ] Session One owner of `bebby` answered `background` + `rogue_type` + an unrelated text step → a Session Two player on `bebby` gets `carried.answers` with only `background`, `background_other` (if set) and `rogue_type`.
- [ ] Owner chose `switch` → `carried: null` (F13). Nobody holds the character in Session One → `carried: null` (F12).
- [ ] Owner chose `rename` → `carried.newName` set; `keep` → empty.
- [ ] Different pid in Session Two still gets the carry (F17); `s1Character` is set only for the pid that held a character in Session One.
- [ ] 409 on a taken character (F15), 413 over 20 KB, 403/404 on DELETE, unknown code → 404 (F30).
- [ ] `GET /api/s2/content` 500 with file and line on broken Session Two content (F27).
- [ ] `/session-two/ABCDE/dm` serves the Session Two `index.html`. Home page shows the tile.
- [ ] No Session One record changes after any Session Two request.

## 03: Shared step screen (Session One refactor, no behaviour change)

**What to build:** The step screen, pick card list and lore section markup of `public/session-one/app.js` move into a shared module, so Session Two renders steps with the same code. Session One looks and behaves exactly as before.

**Blocked by:** none.

Scope:
- New `public/shared/step-screen.js` exporting the pieces Session Two needs: the step body markup (choice cards with `withInfo`, the "משהו אחר" box, text box, step link), the topbar, `loreHtml`, and the wiring for option clicks, free text and next/skip enable rules. Session One's `renderStep`, `renderCommon` and `renderPick` call into it.
- One addition, off by default: the step screen accepts an optional pre-rendered HTML block placed between the hint and the options (ticket 04 uses it for the context line). Session One never passes it.
- Keep `addEnglishAll` per screen and `richText` / `plainText` rules as they are.

Checks:
- [ ] `npm test` green, including `test/term-popup.test.js` (it pins source text; update a pinned selector only if the move changes the file it reads, and keep the selector list identical).
- [ ] Browser, Session One on a fresh group: pick, keep/rename/switch, world page, every step type (choice with cards, multi, optional skip, text, link, info), end, "לשנות", the DM view and the DM lore view. Same as `main` before the change; compare screenshots of three screens.
- [ ] `git diff --stat` shows no change under `content/`.

## 04: Session Two player flow

**What to build:** A player opens `/session-two/<CODE>`, picks a character, reads the intro, answers subclass, background (only when not carried or overridden) and one details step, and lands on the end screen. D6 and D8 in full.

**Blocked by:** 02, 03.

Scope:
- `public/shared/session-two-flow.js`: `effective` and `visibleSteps` (D6). Pure functions, no DOM, importable from `node --test`.
- `public/session-two/app.js`: routes as Session One (`/session-two` create, `/session-two/<CODE>` player, `/session-two/<CODE>/dm` left to ticket 05: render "רק ל-DM" placeholder until then). Screens and copy per D8, built on `public/shared/step-screen.js`.
- Context line (D8): question without leading emoji, labels, free text, source note; label fallback to term `bg_<id>` then raw id. Styled with `.hint`; no new colours.
- Kicker and end-screen name: `carried.newName` or the character name (A5).
- Navigation by visible index; recompute the visible list on every render (D6). Back from the first step → intro; back from intro → pick.
- `done: true` after the last visible step; returning done players see the end screen (A16).

Tests:
- [ ] `test/session-two-flow.test.js`: override > carried > Session Two (A7); `carry` step hidden for `dm` / `s1`; `when` match, `_else` on free text and on an id with no step (F18, F21); F11, F19, F20, F22.

Browser checks (fresh group, Session One answers seeded through `PUT /api/s1/<CODE>/me/<pid>`):
- [ ] Bebby with Session One `background: criminal` and `rogue_type: spy`: subclass step shows the context line "איזה סוג נוכל אתה?" / "מרגל מארץ זרה" / "מהסשן הראשון"; no background step; `details_criminal` with the context line for the background.
- [ ] Vilhelm with no Session One owner: no context line on subclass; the 5-option Session One background step (sage, scribe, occultist, criminal, hermit) with the free-text box and link; pick `sage` → `details_sage`; go back, write free text only → `details_other`.
- [ ] Set `background: noble` in a scratch copy of `content/session-two/characters/turator.md` (via `S2_CONTENT_DIR`): no background step; `details_noble`; context line "אציל" / "נקבע על ידי ה-DM".
- [ ] Razul's subclass context shows `rage_style`, never `on_evoker`.
- [ ] Two browsers, same character → the second sees "נלקחה" and gets the 409 message.
- [ ] Session One player renamed Tenni → Session Two kicker shows the new name.
- [ ] Phone viewport (390 px wide): no horizontal scroll, context line readable, info buttons open the term popup for `sc_*` terms.

## 05: Session Two DM view

**What to build:** `/session-two/<CODE>/dm?key=` shows every Session Two player and their answers (D9), and the Session One DM view links to it.

**Blocked by:** 04.

Scope:
- `renderDm` in `public/session-two/app.js` per D9, using `visibleSteps` / `effective` with each player's own `carried`.
- Background row: effective answer, plus "(מהסשן הראשון)" or "(נקבע על ידי ה-DM)" when skipped for that reason.
- Hidden `when` answers not listed; answers to ids no longer in the content listed at the end (as Session One).
- Delete: arm, confirm, `DELETE /api/s2/...`, as Session One.
- Session One DM footer: link "לסשן השני" → `/session-two/<CODE>/dm?key=<key>`.

Checks:
- [ ] Wrong or missing key → "רק ל-DM" (as Session One).
- [ ] Three seeded players (carried background, override, Session Two-answered background): each row and source note correct.
- [ ] Changing a player's Session Two background hides their old details answer in the DM view (F22).
- [ ] Delete frees the character; the player page shows it free on reload.
- [ ] Session One DM view shows the new link; nothing else changes there.
