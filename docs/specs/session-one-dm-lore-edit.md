# Session One: edit lore inline from the DM lore view

Status: build-ready. Aviv does not review this spec before the build. Every open call is a numbered assumption (A#). Engineers build to them and do not ask. Tickets: `session-one-dm-lore-edit-tickets.md` (11–16). Written 2026-10-10.

Builds on the glossary spec (`session-one-glossary.md`, tickets 01–09). Write against the content format as it is after ticket 09: terms in `terms/*.md`, `[[id]]` / `[[id|text]]` references, option `term:`, step `link:`. In this spec, "term" always means a world term from that spec.

## Problem

Aviv (the DM) reads all Session One lore at `/session-one/<CODE>/dm/lore?key=<adminKey>`. To fix a word there, he finds the Markdown file and the line in `content/session-one/`, edits it in a code editor, and refreshes. He wants to fix the text where he reads it.

## Solution

1. **Lore edit mode.** A server flag (`LORE_EDIT=1`) turns on editing. It works only on Aviv's local checkout. Without the flag, the lore view is read-only, exactly as today.
2. **Inline edit.** In edit mode, each editable item in the lore view has a pencil button. It opens an in-place form with the item's source text (including `[[...]]` markup). Save writes the change into the right Markdown file.
3. **File editor.** For anything inline edit does not cover (add, delete, reorder, new keys, front matter, `term:`, `link:`, `image:`, new files), a per-file editor shows the whole Markdown file in a textarea.
4. **Safe write.** The server applies the change to the file text, parses the whole content folder with the change, and writes only if the parse succeeds and no id changed. The write is atomic. Every other byte of the file stays the same.
5. **Stale-safe.** Each save carries the hash of the file version it started from. If the file changed since, the save is refused with 409.
6. **Commit by hand.** Edits land on disk, uncommitted. Aviv commits them. The app has no commit button.

## Vocabulary

| Word | Meaning | Avoid |
| --- | --- | --- |
| **Lore edit mode** (מצב עריכה) | The server state where edit endpoints answer and the lore view shows edit controls. On when `LORE_EDIT=1`, no `RAILWAY_*` variable is set, and the request comes from loopback (A5). | "admin mode": the DM key is a different thing |
| **Content file** | One `.md` file the parser reads: `world.md`, `characters/*.md`, `lists/*.md`, `terms/*.md`. `README.md` is not a content file. | "lore file" for a single file |
| **File key** | A content file's path relative to `content/session-one/`, e.g. `characters/deq.md`. The only way a client names a file. | "path" |
| **File version** | The SHA-256 hex digest of a content file's bytes on disk. | "etag", "revision" |
| **Editable item** | One thing in the lore view with one pencil button: a step header line, a lore bullet, a choice option, or a term. All its fields live in one content file. | "entry" alone (ambiguous with term) |
| **Field** | One editable piece of source text inside an item, with a kind (D3). | "term" |
| **Field address** | `{ file, line, field }`: where a field starts in a given file version. | |
| **Inline edit** | Editing an item's fields in place in the lore view. | |
| **File editor** (עורך הקובץ) | The whole-file textarea for one content file. | "raw mode", "markdown mode" |
| **Shared item** | An option or bullet that comes from a `lists/*.md` file through `use:`. One edit changes it for every character that uses the list. | |

## Decisions already made (by Aviv and the PM, do not reopen)

- Aviv's request: "let me in the dm view update lore inline, so i can edit entries for lore and such under /dm/lore?key=".
- Builds go ahead without Aviv's approval. No blocking questions.
- Editing works only locally in v1 (A4). No commit button (A6).
- Ids never change through an editor path (A8).
- Concurrency is hash-based: 409 on mismatch, no locks, no merges (A10).
- No design references. Match the existing lore view: dark card, gold accent, Frank Ruhl / Heebo, RTL Hebrew.

## Assumptions

PM calls (recorded as given, with the details this spec adds):

- **A1. Scope split.** Inline edit is the main path. It changes existing text only. The file editor is the fallback for structure: add, delete, reorder, new keys, new files. Inline edit covers the fields in D3.
- **A2. Secrets are inline-editable. (Overrides the PM call, which excluded character secrets.)** Why: the lore view shows secrets only to the DM, and Aviv's request is about "entries for lore". Secret bullets are most of each character's lore (deq, tenni, turator, vilhelm). An edit does not change who sees a bullet: `### known` / `### secret` membership is structure and changes only in the file editor. Not inline-editable: front matter (`id`, `name`, `class`, `icon`, `order`), every `id:` line, `use:`, `term:`, `link:`, `image:`, `category:`, boolean keys, and the option emoji.
- **A3. Step header lines are inline-editable. (Extends the PM list.)** The PM listed bullets, options, terms and list entries. Each step's `title:`, `prompt:` and `hint:` lines also show in the lore view, are plain one-line text, and carry term references. They get their own pencil each, since a step's title can come from a `lists/` file and its prompt from the character file.
- **A4. Edit mode is local only.** Production content is baked into the Railway deploy (`content/` is not on the volume). An edit there would vanish on the next deploy and never reach git. So edit mode needs `LORE_EDIT=1`, which is set only by `npm run dev:lore` on Aviv's machine. Everywhere else the lore view shows no edit controls and the edit endpoints answer 404.
- **A5. Three gates, all required for any edit endpoint and for the edit data in the content response.** (1) `LORE_EDIT=1`. (2) No environment variable whose name starts with `RAILWAY_` (so a flag copied into Railway, or `railway run`, cannot turn edit mode on; the server logs one line saying why it is off). (3) The request's socket address is loopback (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`). Plus the DM key of any existing session on every request. Why the DM key alone is not enough: `POST /api/sz/sessions` (server.js, the Session Zero create route) has no auth and returns a fresh `adminKey` to anyone. So the env flag and the loopback check are the real gate; the DM key only keeps the edit UI out of player pages. Consequence: Aviv cannot edit from his phone over the LAN. Accepted.
- **A6. No commit button.** Edits are uncommitted changes in Aviv's checkout. Note: `railway up` uploads the local working tree, so uncommitted edits ship on the next `railway up` even before a commit. The README tells Aviv to commit before `railway up`, so git matches production.
- **A7. Save path.** Apply the edit to the file text in memory, parse the whole content folder with that one file replaced (`loadContent` with an override, D5), check ids (A8) and the round trip (D4), then write atomically: a temp file in the same directory, then `rename`. Bytes outside the edited field's line range stay identical, including comments, blank lines, line endings and the final newline.
- **A8. Ids are immutable.** Inline edit: the set of ids in the whole parsed folder (character ids; step ids per character; effective option ids per character step, including `use:` list options; term ids; list names) must be identical before and after, or the save is refused (400). This also catches an option label edit that would change an id derived from the label. File editor: a removed term id that is still referenced fails the parse (unknown reference), so it is refused. A removed character, step or option id is refused unless the request confirms that exact list (A9). Renaming an id is a removal plus an addition, so it falls under the same rule.
- **A9. Deleting a step, option or character in the file editor needs a confirm. (Refines the PM call "reject a save that removes an id other content still references".)** Content never references step or option ids; saved player answers do, and those live in the production database, which the local server cannot see. The PM also wants the file editor to support delete. So: the server refuses with the list of removed ids (422, `code: "ids_removed"`), the client shows a confirm dialog that names them and says players who answered lose that answer in the DM view, and a resend with `confirmRemovedIds` equal to that exact list saves. Term ids keep the parser rule (refused while referenced).
- **A10. Concurrency.** Every save sends `hash`: the file version it started from. The server reads the file, hashes it, and compares. Mismatch, or the file is gone: 409 with "הקובץ השתנה מאז שנטען. העתיקו את הטקסט ששיניתם וטענו מחדש." No locks, no merges. The read-check-write runs synchronously in one tick (no `await` between read and rename), so two requests in the same process cannot interleave.
- **A11. Errors in Hebrew, details from the parser.** Parser messages are English (`<file> line <n>: <what>`). The server wraps them: `לא נשמר. טעות ב-<file> בשורה <n>: <parser detail>`, and returns `file` and `line` as fields. Line numbers refer to the text that was checked (after the edit). The error can name a different file than the one edited (e.g. a removed term still referenced in `world.md`).
- **A12. File targets come from a whitelist.** The client sends a file key. The server accepts it only if it matches `^(world\.md|(characters|lists|terms)/[a-z0-9_-]+\.md)$` and, for an edit, is in the current directory listing. The server builds the path from its own content dir and the key, then checks: `lstat` is a regular file (not a symlink), and the resolved path is inside the content dir. `..`, absolute paths, backslashes, `%2e`, `README.md` and non-`.md` names fail the regex. A create needs the key to match and the file not to exist (409 otherwise).
- **A13. Size limits.** A request body is at most 64 KB (the existing `readBody` limit). A file's text after the edit is at most 48 KB (the largest content file is 6 KB today). Over either: 413 "הטקסט ארוך מדי". `readBody`'s "too large" maps to 413 on these routes, not the generic 400.
- **A14. UI.** Match the existing lore view's components (`.lore-item`, `.opt-card`, `.cta`, `.cta.ghost`, `.err`, `textarea`). The affordance is described in D7; visual design is the builder's call inside the existing styles.

Set by this spec:

- **A15. Term entries need a place in the lore view.** The lore view today shows no terms (they appear only in popups). Ticket 14 adds a read-only "מונחים" section to the lore view, grouped by category, so terms have something to edit. It is DM-only, so it does not conflict with the glossary spec's "no index page of all terms" out-of-scope line, which is about players.
- **A16. One editor open at a time.** Saving re-renders the lore view from fresh content, which would drop other open forms. So opening a second editor while one has unsaved changes asks "לבטל את השינויים ב<item>?" first. An unchanged open editor just closes.
- **A17. Requests must be JSON from the same origin.** Edit endpoints require `content-type: application/json` (415 otherwise), which forces a CORS preflight that the server never answers, and refuse a request whose `Origin` header is present and does not match its `Host` (403). This stops another site open in Aviv's browser from posting to `localhost`.
- **A18. Line endings and text.** A file that uses CRLF keeps CRLF in every line the server writes. A file's final newline stays as it was; a new or file-editor text without one gets one. The server writes the exact UTF-8 text, with no Unicode normalization (niqqud stays as typed).
- **A19. One-line fields refuse newlines.** A field that is one line in the format (step keys, option label, subtitle, term name, `en`, `aliases`, bullet title) refuses a value with a newline (400 "ערך בשורה אחת"). The client input does not allow Enter in those fields.
- **A20. Multi-paragraph fields are rewritten one line per paragraph.** A bullet's text, an option's description and a term's blurb: the parser joins wrapped lines with a space, so the form shows each paragraph as one line, and the server writes each paragraph as one line, paragraphs separated by one blank line. A bullet text is one paragraph: newlines in it become spaces. The edited field's own line range may change shape this way; nothing outside it does.
- **A21. A field whose source contains an HTML comment is not inline-editable.** If any raw line in the field's range contains `<!--` or `-->`, the server refuses the edit (400 "יש הערה בתוך השדה הזה. ערכו אותו בעורך הקובץ.") instead of dropping the comment. The client still shows the pencil (it cannot know); the error explains.
- **A22. Inline edit cannot empty a field, except a bullet title.** Clearing `title:` / `prompt:` / `hint:`, a label, a subtitle, a description, a blurb or a term key is a structure change, so it is refused (400 "שדה ריק: כדי למחוק, השתמשו בעורך הקובץ"). A bullet title may be cleared: the line becomes `- <text>`. A bullet text may not be empty (the parser requires it).
- **A23. After a save, the lore view reloads content and re-renders.** It keeps the scroll position and which `<details>` are open (ticket 16; ticket 15 may simply re-render).
- **A24. Ticket numbering.** The glossary tickets in the repo are 01–09; there is no ticket 10 on 2026-10-10. These tickets start at 11 so they cannot collide with a ticket 10 written later. They build after ticket 09.
- **A25. Run command.** `package.json` gets `"dev:lore": "LORE_EDIT=1 node --watch server.js"`. `node --watch` restarts only on imported module changes, not on content `.md` writes, so a save does not restart the server.
- **A26. Temp files.** The temp file is `<dir>/.<name>.<random>.tmp`. The parser reads only names ending in `.md`, so a leftover temp file is ignored. `.gitignore` gets `content/**/.*.tmp`. The server removes its temp file when the write fails.

## Design decisions

### D1. Edit data in the content response

When all A5 gates pass and the key is the DM key, `GET /api/s1/content` adds:

- `edit: { files: { "<file key>": "<file version>" } }` for every content file.
- A `src` object on each editable item (shape in D3), with the item's file key and each field's start line.

Otherwise the response has no `edit` and no `src` keys anywhere: player responses, DM responses with edit mode off, and non-loopback requests. A test proves it.

When the folder fails to parse and the request passes the gates, the 500 response adds `file` and `line` (from the parser message) and `edit.files`, so the lore view's content-error screen can open the file editor on the broken file (ticket 12).

### D2. Endpoints

All take `code` and `key` as query parameters (the existing pattern). All answer 404 `{ error: "not found" }` unless edit mode is on (A5), and 403 "רק ה-DM" for a wrong key.

| Method and path | Body | Success | Failure |
| --- | --- | --- | --- |
| `GET /api/s1/lore-file?file=` | | 200 `{ file, text, hash }` | 400 bad key (A12), 404 no such file |
| `PUT /api/s1/lore-file` | `{ file, hash, text, confirmRemovedIds? }` | 200 `{ file, hash }` | 400, 409 (A10), 413, 415, 422 parse error `{ error, file, line }` or `{ code: "ids_removed", ids: [...] }` (A9) |
| `POST /api/s1/lore-file` (create) | `{ file, text }` | 201 `{ file, hash }` | 400, 409 exists, 413, 415, 422 |
| `PUT /api/s1/lore-field` | `{ file, hash, edits: [{ line, field, value }] }` | 200 `{ file, hash }` | 400 (address not found, A8, A19, A21, A22, round trip), 409, 413, 415, 422 |

- `edits` lets one save change several fields of one item (an option's label, subtitle and description) in one write. All edits target the same file version. The server applies them bottom-up by line, so earlier line numbers stay valid. Two edits with overlapping ranges: 400.
- A write failure (permissions, disk full): 500 "השמירה נכשלה. הקובץ לא השתנה." The temp file is removed.
- No delete-file endpoint in v1. Aviv deletes a file in his editor (he is local by definition, A4).

### D3. Field kinds, source shapes and how each is written

| Field | Item | Source shape | Value | Write |
| --- | --- | --- | --- | --- |
| `title`, `prompt`, `hint` | step header line (world, character step, or `lists/` default) | `key: value`, one line | string, one line | replace the value after `key: ` on that line |
| `bullet` | lore bullet (`### known` / `### secret`, or a `lists/` bullet file) | `- **title** text` plus continuation lines | `{ title, text }` | replace the bullet's whole line range with one line `- **title** text` (or `- text` with no title) |
| `label` | choice option | `### <emoji?> <label>` | string, one line | replace the label after the emoji; the emoji stays |
| `subtitle` | choice option | `subtitle: value` | string, one line | replace the value |
| `description` | choice option | paragraphs after the option's key lines | string, paragraphs split by a blank line | replace from the first paragraph line to the last non-blank line before the next heading or EOF (A20) |
| `name` | term | `### <Hebrew name>` | string, one line | replace after `### ` |
| `en`, `aliases` | term | `key: value` | string, one line | replace the value |
| `blurb` | term | paragraphs after the term's key lines | string | as `description` |

`src` shape in the content response (D1): every field address is `{ file, line }`, keyed by field kind. A step gets `src: { title?, prompt?, hint? }` (each key can come from a different file: a `lists/` default or the character file). A bullet gets `src: { bullet }`. An option gets `src: { label, subtitle?, description? }`. A term gets `src: { name, en, aliases?, blurb? }`. A field missing from the source has no key and no inline input (adding it is a file-editor change).

Only fields that exist in the file get an input. Prefill comes from the parsed JSON the lore view already has: parsed values keep the raw `[[...]]` markup, and multi-line fields are already joined as in A20.

### D4. Validation order for a save

1. Gates (A5), key, content type and origin (A17), body size (A13).
2. File key (A12). Read the file; compare its version with `hash` (A10).
3. Field edits only: find each address in the current file (the version matches, so it exists; if not, 400 "השדה לא נמצא. טענו מחדש."). Check A19, A21, A22. Apply.
4. Size of the new text (A13).
5. Parse the whole folder with the new text in place of the file (D5). `ContentError` → 422 (A11).
6. Ids (A8, A9).
7. Field edits only: the round trip. In the new parse, each edited field's parsed value equals the submitted value (after trimming, and A20 joining). If not, 400 "השינוי משנה את מבנה הקובץ. ערכו אותו בעורך הקובץ." This catches a description whose first line looks like `id: x`, a label that starts with an emoji-only word, a bullet text starting with `**`, a line starting `### ` or `- `, and any other text that would parse as structure.
8. Re-check the version (still synchronous), write the temp file, rename, return the new version.

### D5. Parser changes

- `loadContent(dir, { override: { [fileKey]: text } })`: read that file's text from the override instead of disk; a create adds a file that is not on disk yet.
- The parser can report source locations for editable fields: file key, start line and line range per field, including fields that come from `lists/` through `use:`. Line ranges are needed only on the server (to apply an edit); the client gets start lines only (D3).
- The existing output (`commonLore`, `characters`, `terms`) and every existing error message stay the same. `npm test` keeps passing unchanged.

### D6. File editor

- Route: `/session-one/<CODE>/dm/lore/file?key=<adminKey>&file=<file key>`. A full page inside the existing app shell, not a modal. It works only in edit mode; otherwise it shows the existing "רק ל-DM" lock screen.
- Header: the file key (`dir="ltr"`), the kicker "עורך הקובץ", and a back link "חזרה ללור" to the lore view.
- Body: one `<textarea dir="rtl" spellcheck="false">` with the file text, tall (at least 70vh), using the existing `textarea` style. A hint line under it, plain text: "הפורמט מתואר ב-content/session-one/README.md".
- Buttons: "שמירה" (`.cta`) and "ביטול" (`.cta.ghost`, back to the lore view; if the text changed, confirm first).
- On a 422 parse error in this file: the error text under the textarea, and the textarea selects and scrolls to the named line. In another file: the error text plus a link "פתיחת <file> בעורך".
- On `ids_removed`: a native `confirm()` naming the ids, then resend with `confirmRemovedIds`.
- Entry points in the lore view (edit mode only): a "עריכת הקובץ" link in each character's `<details>` (its character file), in the world block (`world.md`), next to each shared-item marker (its `lists/` file), and in the terms section per term file. A "קבצים" section at the end of the lore view lists every file key as a link, plus "קובץ חדש".
- New file: a small form with a folder select (`characters`, `lists`, `terms`) and a name input (`[a-z0-9_-]+`, `.md` added). It opens the editor with a template: a character file gets the README's front-matter block and one `## info: lore` step; a list file gets one `###` option; a term file gets one term. Save calls the create endpoint.

### D7. Inline edit affordance

- **Banner.** In edit mode, the top of the lore view shows one line under the title: "מצב עריכה: שמירה כותבת לקבצים במחשב הזה. לא לשכוח commit." Muted text, the existing kicker or hint style.
- **Edit control.** Each editable item gets a small pencil button (`icon('pencil')`, `<button type="button">`, `aria-label="עריכה: <item name, plain text>"`), at the item's inline-start edge (right side in RTL), visible at rest at low emphasis and full on hover/focus. On choice cards it sits outside any button, like the glossary's info button (D4 there). Touch target at least 40px.
- **Form.** The pencil replaces the item in place with a form inside the same card/section:
  - The file key in small LTR muted text, and for a shared item: "רשימה משותפת: השינוי יופיע אצל <names>".
  - One input per existing field, labelled in Hebrew: כותרת, טקסט, שם, תת-כותרת, תיאור, שם באנגלית, שמות נוספים. One-line fields are `<input>` (Enter does not insert a newline; A19). Multi-paragraph fields are an auto-growing `<textarea dir="rtl">`.
  - A hint line: "הפניה למונח: [[id]] או [[id|טקסט]]".
  - "שמירה" (`.cta`) and "ביטול" (`.cta.ghost`). Focus goes to the first input on open and back to the pencil on cancel.
- **States.**
  - Unchanged: "שמירה" disabled.
  - Saving: inputs read-only, both buttons disabled, "שמירה" shows "שומר…".
  - Saved: content reloads, the item shows its new text and a short "נשמר" mark (ticket 16).
  - Error (400 / 422 / 413): the message in `.err` under the buttons; the form stays open with the text.
  - Conflict (409): the message from A10 in `.err`, plus a "טעינה מחדש" button that reloads the page. The form stays open so Aviv can copy his text first.
  - Network failure: "אין חיבור לשרת. הטקסט שלך עדיין כאן." The form stays open; "שמירה" works again.
- The rendered (read) item keeps using `richText` and first-mention English after a save; the form shows raw source text.

## Failure and edge states

| # | State | Behaviour |
| --- | --- | --- |
| F1 | `LORE_EDIT` not set (production, or plain `npm run dev`) | No `edit` / `src` in any response. No pencil, banner, file links. Edit endpoints 404. The lore view is byte-for-byte today's view. |
| F2 | `LORE_EDIT=1` with a `RAILWAY_*` variable set | Edit mode stays off (as F1). The server logs once at start: `LORE_EDIT ignored: RAILWAY_* environment detected`. |
| F3 | Edit mode on, request from a LAN address (phone at the table) | As F1 for that request. |
| F4 | A player key, no key, or a key for no session | Content as today (no edit data). Edit endpoints 403. |
| F5 | Someone creates a session to get an `adminKey` | Gets nothing extra: the A5 env and loopback gates still apply. |
| F6 | File key with `..`, absolute path, backslash, encoded dots, `README.md`, a non-`.md` name, or a name outside the three folders | 400 "קובץ לא מוכר". Nothing is read or written. |
| F7 | File key names a symlink, or resolves outside the content dir | 400 "קובץ לא מוכר". |
| F8 | Body over 64 KB, or new file text over 48 KB | 413 "הטקסט ארוך מדי". |
| F9 | Body not JSON, or content type not JSON | 415, or 400 for invalid JSON. |
| F10 | `Origin` header from another host | 403. |
| F11 | The file changed on disk since the lore view loaded (Aviv saved it in his code editor, or another tab saved) | 409 with the A10 message. Nothing written. The form stays open. |
| F12 | The file was deleted since load | 409, same message. |
| F13 | Two saves in flight from the same page (double click) | The client disables "שמירה" while saving. If two still arrive, the first writes; the second has the old hash and gets 409. |
| F14 | The edit makes this file fail to parse (unknown `[[id]]`, `[[` not closed, a bad key) | 422 with the Hebrew wrapper, file and line (A11). Nothing written. |
| F15 | The edit breaks a different file (file editor removes a term that `world.md` references) | 422 naming `world.md` and its line. Nothing written. |
| F16 | The folder was already broken in another file before this save | The save fails with that file's error (the candidate folder must parse). The message names the other file; the file editor offers to open it. |
| F17 | The folder is broken, so the lore view cannot load | The content-error screen shows as today. In edit mode it also shows "פתיחת <file> בעורך" for the file in the error (D1, D6). |
| F18 | An inline edit would change an id (an option without `id:` whose id comes from its label) | 400 "השינוי משנה מזהה (<id>). הוסיפו `id: <old id>` בעורך הקובץ ואז ערכו את השם." Nothing written. (All current options have `id:`; the rule guards future ones.) |
| F19 | File editor removes or renames a character, step or option id | 422 `ids_removed` with the list. A confirm names them; a resend with the same list saves. A different list (the file changed meanwhile) is refused again. |
| F20 | File editor removes a term id still referenced anywhere | 422 parse error naming the file and line of the dangling reference. No override. |
| F21 | File editor renames a term id and updates every reference in the same file | Saves if nothing else references it (the README allows term renames). References in other files fail the parse (F15). |
| F22 | Inline value whose text would parse as structure (description starting `id: x`, a line `### ...`, a bullet text starting `**`, a label starting with an emoji-only word) | 400 round-trip message (D4 step 7). |
| F23 | One-line field value with a newline | 400 "ערך בשורה אחת". |
| F24 | Empty value (except a bullet title) | 400 (A22). |
| F25 | The field's source lines contain an HTML comment | 400 (A21). The comment stays. |
| F26 | Item from a `lists/` file shown under several characters | The edit targets the list file. The form says it is shared and where it shows. After save, every character's copy shows the new text. |
| F27 | A step's `title:` comes from a list default and its `prompt:` from the character file | Two pencils; each saves to its own file. |
| F28 | Text with niqqud, mixed Hebrew and Latin, emoji in a title (`🌍 מה כולם יודעים על העולם`) | Saved byte-exact. No normalization. |
| F29 | File with CRLF line endings, or no final newline | Preserved (A18). (All content files today are LF with a final newline.) |
| F30 | A comment, blank line or other field next to the edited field | Unchanged. A test diffs the file before and after: only the field's line range differs. |
| F31 | Write fails (read-only disk, permissions) | 500 "השמירה נכשלה. הקובץ לא השתנה." The temp file is removed; the original is intact. |
| F32 | Server stopped or restarting during save | The client's network-failure state. The rename is atomic, so the file is either the old or the new version, never partial. |
| F33 | A second editor opened while one has unsaved changes | Confirm before discarding (A16). |
| F34 | Leaving the page with unsaved changes (back link, reload, close tab) | `beforeunload` asks the browser's confirm (ticket 16). |
| F35 | A term reference to a term that the edit itself adds in another file | Not possible in one save: add the term first (term file), then reference it. The error from F14 says the term does not exist. |
| F36 | Create with a file key that exists | 409 "הקובץ כבר קיים". |
| F37 | New character file with an id another file uses | 422 from the parser ("character id ... is used by another file"). |
| F38 | Saved text reaches production | Only by Aviv's own `railway up` from this checkout (it uploads the working tree, A6). Never from the app. |
| F39 | Players on the production site while Aviv edits locally | Unaffected. Local and production are different servers and different content copies. |

## Acceptance criteria (feature level)

1. Without `LORE_EDIT=1`, the lore view and every API response are unchanged from today. A test proves that no player or non-edit DM response contains `edit` or `src`.
2. With `npm run dev:lore` and the DM key, from `localhost`, every lore bullet (known and secret, including shared list bullets), every choice option (label, subtitle, description), every step `title:` / `prompt:` / `hint:`, and every term (name, `en`, `aliases`, blurb) has a pencil. Saving a change updates the right Markdown file, and the view shows the new text after the save.
3. After any successful inline save, `git diff` on the file shows only the edited field's lines changed.
4. A save that would break the parse, change an id, or change the file's structure writes nothing and shows a Hebrew message; parse errors name the file and line.
5. A save started from an old file version gets the 409 message and writes nothing.
6. The file editor opens any content file from the lore view, saves valid changes, refuses invalid ones with file and line (and jumps to the line when it is in this file), confirms id removals, and creates new files in `characters/`, `lists/` and `terms/`.
7. With `LORE_EDIT=1`, a request from a non-loopback address, a request with a wrong key, and a request with any `RAILWAY_*` variable set all get no edit data and 404 or 403 from the edit endpoints.
8. No file key outside the whitelist is ever read or written (F6, F7).
9. The README documents edit mode: how to start it, that it writes to the local files, that edits need a manual commit, and "commit before `railway up`". Hebrew + English, like the rest of the README.

## Testing

- **Server seam (node:test, highest value).** Test the save logic as functions that take a content dir: copy a fixture folder (or the real `content/session-one`) into a temp dir per test, never the repo's files. Cover: each field kind's write (byte diff outside the range is empty); A8 ids; A9 confirm; F11/F12 conflict; F14–F16 parse errors with file and line; F18; F22 round trip; F23–F25; F6/F7 whitelist (including a symlink in the temp dir); F29 CRLF; atomic write leaves no temp file.
- **HTTP seam.** Start the server on a random port against a temp content dir (make the content dir configurable, for example `S1_CONTENT_DIR` env, defaulting to the repo path) and check gates: F1–F5, F8–F10, and that `src` / `edit` never appear without all gates.
- **Real-content test.** The existing `loadContent` real-content test keeps passing.
- **Browser.** Use the scratch recipe from `.knowledge-inbox.md` (copy `server.js`, `session-one-content.js`, `package.json` and `content/` into a scratch dir, symlink `public/` and `node_modules/`), run it with `LORE_EDIT=1`, create a group with `POST /api/sz/sessions`, and open `/session-one/<CODE>/dm/lore?key=<adminKey>`. Edits then land in the scratch copy, not the repo. Check 390px and 1280px.

## Out of scope / Later

- **Saving from production through a GitHub commit.** Later, the production server could accept an edit, run the same validation (D4), and instead of writing to disk, commit the new file text to `syzore/dnd-sessions-handler` on `main` through the GitHub contents API (`PUT /repos/{owner}/{repo}/contents/{path}` with the file's current blob `sha` as the concurrency check, which replaces the local file version). A fine-grained token with contents write on that one repo would sit in a Railway variable. A Railway GitHub deploy trigger (not set up today: deploys are manual `railway up`) would then rebuild and redeploy with the new content, so the edit appears after the deploy, about a minute or two. Until then the server would keep showing the old text, so the UI would need a "saved, deploying" state. This needs real auth beyond the session DM key (A5: anyone can mint one), for example a separate secret from a Railway variable.
- A commit button for local edits.
- Deleting files from the app.
- Adding, deleting or reordering items inline (the file editor does it).
- Editing front matter, ids, `use:`, `term:`, `link:`, `image:`, `category:` inline.
- Editing from a phone or any non-loopback client.
- Live preview of the rendered text while typing.
- Merging concurrent edits, locks, undo history (git is the undo).
- Editing Session Zero, schedule or tables content.
