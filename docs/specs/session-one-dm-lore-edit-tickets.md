# Session One DM lore edit: tickets

Spec: `docs/specs/session-one-dm-lore-edit.md` (A# = assumption, D# = design decision, F# = failure state). Give each engineer the spec path plus one ticket. Nothing in the spec is open: build to the assumptions and do not wait for Aviv.

For every ticket:
- Start only after glossary ticket 09 is on `main` (A24): the parser and lore view change under tickets 01–09.
- Commit straight to `main` after the ticket's checks pass. Deploys are manual (`railway up`), so a commit does not ship.
- `npm test` passes before each commit, including the real-content test.
- Never write to the repo's `content/session-one/` in tests or browser checks. Tests use a temp copy; browser checks use the scratch recipe (spec, Testing).
- Edit mode off must stay exactly today's behaviour (F1). Each ticket re-checks it.

Order and blocking edges:

```
09 → 11 → 12
09 → 11 → 13 ─┐
09 → 14 ──────┴→ 15 → 16
(16 also needs 12)
```

| # | Title | Blocked by |
| --- | --- | --- |
| 11 | Edit mode gates and the file write API | 09 |
| 12 | File editor page in the lore view | 11 |
| 13 | Field addresses and the field edit API | 11 |
| 14 | Terms section in the DM lore view (read-only) | 09 |
| 15 | Inline editing in the lore view | 13, 14 |
| 16 | Polish: keep place after save, saved mark, unsaved-changes guard | 12, 15 |

The frontier after 09 is 11 and 14.

---

## 11: Edit mode gates and the file write API

**What to build:** Server only. Lore edit mode (A4, A5) and the whole-file endpoints from D2: `GET /api/s1/lore-file`, `PUT /api/s1/lore-file`, `POST /api/s1/lore-file`. Saves run the D4 steps that apply to whole files (1, 2, 4, 5, 6, 8). The content response gets `edit.files` (D1) when the gates pass. No UI.

**Blocked by:** 09.

Scope:
- Gates (A5): `LORE_EDIT=1`, no `RAILWAY_*` env var (log the F2 line once at start), loopback socket address, DM key of any session. All edit endpoints 404 when edit mode is off, 403 for a wrong key.
- A17 content-type and origin checks; A13 limits with 413 (map `readBody`'s "too large" to 413 on these routes).
- A12 whitelist: regex, directory listing, `lstat` regular file, resolved path inside the content dir.
- `loadContent(dir, { override })` (D5, first bullet). Existing output and errors unchanged.
- A8 id comparison for whole files and the A9 `ids_removed` / `confirmRemovedIds` flow.
- A10 version check, synchronous read-check-write, temp file + rename (A26), A18 line endings and final newline, F31 cleanup.
- A11 error wrapper with `file` and `line` fields.
- D1: `edit: { files }` in `GET /api/s1/content` when gated; on a `ContentError`, the 500 adds `file`, `line` and `edit.files` when gated.
- Make the content dir configurable for tests (for example `S1_CONTENT_DIR`, default the repo path).
- `package.json`: `"dev:lore": "LORE_EDIT=1 node --watch server.js"` (A25). `.gitignore`: `content/**/.*.tmp` (A26).
- README (`content/session-one/README.md`): a short "עריכה מהדפדפן / Editing from the browser" section: start with `npm run dev:lore`, it writes to the local files, edits need a manual commit, commit before `railway up` (A6). Hebrew + English. Tickets 12 and 15 add a line each for their UI.

- [ ] Tests (node:test, temp dir copies): F1–F5 gates (env off, `RAILWAY_X=1`, non-loopback, wrong key, a freshly created session's key with env off), F6 and F7 (including a real symlink in the temp dir), F8–F10, F11, F12, F14, F15, F16, F19, F20, F21, F29, F31 (a read-only file or dir), F36, F37.
- [ ] Test: a valid `PUT` writes exactly the sent text (plus a final newline when missing) and returns the new version; `GET` then returns the same text and version.
- [ ] Test: after a failed save of any kind, the file bytes and mtime are unchanged and no `.*.tmp` file is left.
- [ ] Test: no response contains `edit` unless all gates pass (players, DM with env off, DM over a non-loopback address).
- [ ] `npm run dev` (no flag): `/api/s1/content` and the lore view are unchanged; edit endpoints 404.
- [ ] README section added.

## 12: File editor page in the lore view

**What to build:** The D6 file editor: the route, the page, entry points from the lore view, new-file creation, and the error-screen link (F17). Uses ticket 11's endpoints only.

**Blocked by:** 11.

Scope:
- Route `/session-one/<CODE>/dm/lore/file?key=&file=` in `public/session-one/app.js` (`route()`), lock screen when not in edit mode.
- Page per D6: file key header, textarea, "שמירה" / "ביטול", hint line.
- Errors: 422 in this file selects and scrolls to the line; in another file shows "פתיחת <file> בעורך"; `ids_removed` confirm and resend; 409 message with a "טעינה מחדש" button and the text left in place; 413; network failure.
- Entry points in edit mode only: per character `<details>`, the world block, per shared list (where a `use:` list shows), and a "קבצים" section at the end listing every file key plus "קובץ חדש".
- New file form and templates (D6).
- F17: the content-error screen, when the 500 carries `edit.files` and `file`, adds "פתיחת <file> בעורך".
- README: one line on the file editor.

- [ ] Browser (scratch recipe, `LORE_EDIT=1`): open `world.md` from the lore view, change a bullet word, save, back to the lore view: the new word shows. `git diff --no-index` against the original shows only that line.
- [ ] Add `[[no_such_term]]` on line N and save: the Hebrew error names the file and line N, the textarea selects line N, the file on disk is unchanged.
- [ ] Delete an option in a character file: the confirm lists its id; cancel writes nothing; confirm saves.
- [ ] Save the file in a code editor while the page is open, then save in the page: the 409 message shows and the page's text is still there.
- [ ] Break `world.md` on disk by hand, open the lore view: the error screen links to the editor for `world.md`; fixing it there makes the lore view load again.
- [ ] Create `terms/test_places.md` from "קובץ חדש" with one valid term: it appears in the "קבצים" list. A second create with the same name gets "הקובץ כבר קיים".
- [ ] Without `LORE_EDIT`: no links, no "קבצים" section; the editor route shows the lock screen.
- [ ] 390px and 1280px: the textarea and buttons fit; RTL.

## 13: Field addresses and the field edit API

**What to build:** Server only. The parser reports field locations (D5, second bullet). `GET /api/s1/content` adds `src` (D1, D3) when gated. `PUT /api/s1/lore-field` applies field edits per D3 and validates per D4, all steps.

**Blocked by:** 11.

Scope:
- Field kinds and write rules in D3, for steps (including `lists/` defaults), bullets (including `lists/` bullet files merged through `use:`), options (including `lists/` options), and terms.
- `edits` array: same file version, bottom-up application, 400 on overlapping ranges.
- A19, A20, A21, A22, F18 (id change through a derived id), D4 step 7 round trip.
- `src` only when gated; the public JSON shape is otherwise unchanged.

- [ ] Tests per field kind on a temp copy of the real content: the save returns 200, the file diff touches only the field's line range (F30), and `loadContent` shows the new value.
- [ ] Test: a shared bullet edited via the address from one character's `src` changes the list file, and both characters that `use:` it get the new text.
- [ ] Test: a step whose `title:` comes from a list default and whose `prompt:` is in the character file reports two different files in `src` (F27). (If the content after ticket 09 has no such step, use a fixture.)
- [ ] Tests: F22 (each listed case), F23, F24 (bullet title clear allowed, bullet text clear refused), F25, F18 (fixture option without `id:`), a stale `line` with a correct hash (400), overlapping edits (400), F11.
- [ ] Test: an option save with label, subtitle and description in one request writes all three in one file version.
- [ ] Test: no `src` key anywhere in player responses or ungated DM responses.

## 14: Terms section in the DM lore view (read-only)

**What to build:** The lore view gets a "מונחים" section after the characters (A15): every term, grouped by category in the order of the glossary spec's D6 labels, each showing the Hebrew name, the English name, aliases ("נקרא גם: ...") and the blurb through `richText`. No editing. Works with edit mode off.

**Blocked by:** 09.

- [ ] Each category is a `<details class="card dm-player">` with "<Hebrew category label> (<count>)" in the summary, closed by default. Inside, each term is a `.lore-item`-style block.
- [ ] Each term block is its own first-mention English scope (`data-term-scope`), so its own references behave as in the popup body.
- [ ] Name-only terms show the name, English and aliases, with no empty blurb area.
- [ ] Image and link counts are not shown (the popup shows them; this section is for the text).
- [ ] Browser: every term from `terms/*.md` appears once, in its category. No raw `[[`.
- [ ] Players never see this section (it is in the DM-only lore view).

## 15: Inline editing in the lore view

**What to build:** The D7 affordance on every editable item in the lore view: step header lines, bullets (known and secret, own and shared), choice options, and terms (ticket 14's section). Uses `src` and `edit.files` from ticket 13.

**Blocked by:** 13, 14.

Scope:
- Banner, pencil button, form, field labels, hint, and all states in D7.
- The form sends `{ file, hash: edit.files[file], edits }` with only changed fields. On success, reload content and re-render (scroll and `<details>` preservation is ticket 16).
- Shared-item note with the character names that use the list (F26).
- A16: one editor open at a time.
- One-line fields are `<input>`; Enter in them does not submit or insert a newline. Multi-paragraph fields are auto-growing textareas.
- Items with no `src` (edit mode off) render exactly as today.
- README: one line on inline editing.

- [ ] Browser (scratch recipe, `LORE_EDIT=1`), one save per kind: a world bullet, a character secret bullet, a shared bullet (check both characters show it after save), a step `prompt:`, an option label + description in one save, a term blurb with a new `[[id]]` reference. After each, the scratch file diff shows only that field's lines.
- [ ] A save with `[[no_such_term]]` shows the Hebrew error with file and line and keeps the form open with the text.
- [ ] Edit the same file in a code editor, then save in the form: the 409 message and "טעינה מחדש" show, and the text stays in the form.
- [ ] Stop the server, save: the network message shows; start it, save again: it saves.
- [ ] Open a second pencil with unsaved changes in the first: the discard confirm shows.
- [ ] The pencil on a choice card is not inside a button; tapping the card area does nothing new; the glossary info button still works.
- [ ] Keyboard: Tab reaches each pencil, Enter opens the form, focus lands on the first input, "ביטול" returns focus to the pencil.
- [ ] Without `LORE_EDIT`: no banner, no pencils; the page HTML matches today's for the same content.
- [ ] 390px and 1280px, RTL: the form fits inside its card; the textarea grows with its text.

## 16: Polish: keep place after save, saved mark, unsaved-changes guard

**What to build:** The finishing parts of D7 and A23 on both the inline forms and the file editor.

**Blocked by:** 12, 15.

- [ ] After an inline save, the re-rendered view keeps the scroll position (anchored on the edited item) and the same `<details>` open.
- [ ] The saved item shows a short "נשמר" mark (about 2 seconds), announced to screen readers through an `aria-live="polite"` region.
- [ ] `beforeunload` asks for confirmation when an inline form or the file editor has unsaved changes (F34), and not otherwise.
- [ ] In the file editor and in inline forms, Ctrl+Enter / Cmd+Enter saves and Esc cancels (Esc with unsaved changes asks first).
- [ ] Back from the file editor returns to the lore view with the same `<details>` open as before (store the open set in `sessionStorage`).
- [ ] Browser check of each item above at 390px and 1280px.
