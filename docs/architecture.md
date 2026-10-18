# How the tools work

Reference for changing the server, the content loaders or `public/shared/`. Content authors need the content READMEs instead; tests and browser checks are in [`testing.md`](testing.md).

## Server and data

- `server.js` is a plain `http` server. Any extensionless path under `/<tool>/` serves that tool's `index.html`, so a new nested SPA route (`/session-one/<CODE>/dm/lore`) needs no server change.
- Data: one JSON file `<DATA_DIR>/session-zero.json`. `DATA_DIR` env, else `RAILWAY_VOLUME_MOUNT_PATH` (`/data` in production), else `./data`. Loaded once at start, rewritten on every save.
- A group is `db.sessions[CODE]`. Session One players are `db.sessions[CODE].sessionOne.players[pid]`, Session Two players `...sessionTwo.players[pid]`. `pid` is a per-browser id (localStorage `sz:pid`, JSON-encoded). Players are nameless by default; the UI names them by character (`shownName()` in `public/session-one/app.js`, which also uses a Session One rename).
- Answers are stored opaquely, 20000 characters of JSON at most (413 above that). The server does not check character ids against the content.
- A character is held by one player per group: a PUT that takes a held character returns 409, and the pick screen disables it for everyone else.
- Env: `PORT`, `DATA_DIR`, `S1_CONTENT_DIR`, `S2_CONTENT_DIR` (default `content/session-one`, `content/session-two` next to `server.js`), `LORE_EDIT`.

## API

| Route | |
| --- | --- |
| `POST /api/sz/sessions {title}` | creates a group; returns `code` and `adminKey`. Unauthenticated. |
| `GET /api/s1/content?code=&pid=&key=` | Session One content for this viewer (`contentFor`). Parse error: 500 naming file and line. |
| `GET /api/s1/:code?pid=&key=`, `PUT /api/s1/:code/me/:pid` | the group and this player; PUT saves character and answers. |
| `DELETE /api/s1/:code/players/:pid?key=` | DM only (403 / 404); frees the character. |
| `GET/PUT/POST /api/s1/lore-file`, `PUT /api/s1/lore-field` | lore edit mode only (below); 404 otherwise. |
| `GET /api/s2/content?code=&pid=&key=` | Session Two content for this viewer. |
| `GET /api/s2/:code?pid=&key=` | the group, this player, `carried` for this player's character; the DM also gets `players`, each with its own `carried`. |
| `PUT /api/s2/:code/me/:pid {character?, answers?, done?}`, `DELETE /api/s2/:code/players/:pid?key=` | as in Session One. |

## Content loading

- Both sessions' Markdown is parsed on every request, so a content edit shows on refresh with no restart.
- `session-one-content.js`: `loadContent(dir, { override, src })`. The loader is ESM and needs the dir. `override: { file, text }` parses the folder with one file replaced (lore edit validation). Every parse problem is a `ContentError` `"<file> line <n>: <what>"`.
- `contentFor(content, { isAdmin, character, extraTerms })` shapes what one viewer gets. The DM gets everything. A player gets every character's steps with `secret` removed except their own character's, and only the terms reachable from that (text references, option `term:`, blurbs of those terms, plus `extraTerms`). Consequence: a `[[ref]]` outside a `### secret` makes that term public.
- `session-two-content.js`: `loadSessionTwo({ s1Dir, s2Dir })` loads Session One first, then reuses Session One's `parseFile` through an `ext` option (`{ frontKeys, frontRequired, stepKeys, shared }`). Session One passes no `ext`, so its grammar and error text stay unchanged. `from`, `when`, `context` are parsed in `parseFile` and resolved per character in `resolveFlow`.
- `context: <id> | <question>`: Session One's `parseFile` accepts only a bare step id, so `parse()` in `session-two-content.js` cuts the `| ...` off each line first (line count unchanged) and passes the questions by line as `at.questions`. A one-line `REF_ID` relaxation in `session-one-content.js` would make that pre-cut unnecessary.

## Session Two carry

- A player is matched to Session One by character inside the same group, never by `pid` (spec D1).
- `carried.answers` holds the keys of the character's carry steps (`from: session-one`) and its `context:` targets, plus their `_other` keys. The background step is a carry step for every character without an override, so an option `when:` on `background` needs no extra key.
- `GET /api/s2/:code` recomputes the carry on every request. When Session Two content fails to parse it carries `answers: {}`; the content route shows the error.
- `/api/s2/content` adds `bg_<override>` to the viewer's own `extraTerms`, because the context line names an overridden background by that term and no step references it (Vilhelm's custom background). Only the viewer's own character's term is added.

## Front end (`public/shared/`)

- `terms.js`: `richText` (HTML) and `plainText` (attributes, labels) render content text. `richText` emits a popup button only for a term with a blurb, image or link and only when not `inert`; name-only terms, option-button text and `<summary>` text stay `<span class="term-ref">`. `screen()` in `public/session-one/app.js` adds the first-mention English once per `[data-term-scope]` element, else once per screen; a DM compendium section without the attribute shares one English scope with its neighbours.
- `term-popup.js`: one shared `<dialog>`. A page calls `initTermPopup()` once; any `<button class="term" data-term>` opens it through document-level click delegation. Images carry `referrerpolicy="no-referrer"` (static.wikia.nocookie.net returns 404 to a foreign Referer).
  - `<dialog>.close()` fires `close` a task later, and `history.back()` lands a task later too, so cleanup in the `close` event, or a `pushState` right after a back, races a quick reopen. The popup cleans up synchronously and defers its push until its own back's `popstate` arrives.
  - On phones the popup is a top-anchored card with no bottom edge: browser toolbars (Arc, iOS) hid a bottom sheet when the layout viewport differs from the visual viewport.
  - The no-`showModal` fallback rule `.term-pop.tp-nomodal` must stay above the phone `@media` block in `style.css`, and that block lists both selectors; otherwise it beats the `@supports` top/`env()` rules.
- `step-screen.js`: the step screen both sessions use. Options render as `<button>`, so a link can't sit inside option text; put it in a sibling control (a step `link:` or the term info button). `count:` steps mark unpicked cards `aria-disabled="true"` (not `disabled`) so picked cards stay clickable to unpick. The random card has `data-id="__random"` and is never stored.
- `step-rules.js`: the pure `count:` / `random:` rules, re-exported by `step-screen.js`. They live apart because `step-screen.js` imports absolute `/shared/...` paths that node can't load.
- `session-two-flow.js`: pure Session Two rules (`effective`, `visibleSteps`, `visibleOptions`, `screenAnswers` / `commitScreenAnswers`, `contextLine`, `dmRows`). Here `carried` means the answers map (`carried.answers` from the API).
  - The player app gives the step screen only visible options and a filtered copy of the answers. A stored pick on a now-hidden option shows as unanswered and is kept until the player picks again. Any view of answers (the DM view too) applies `screenAnswers`.
  - The context line (`.context-line`, a `.hint` div) has three lines: question, answer, source note. The question is the target's title, else its prompt, unless `context:` gives one after `|`.
  - `dmRows(character, carriedAnswersMap, answers, { termName, plain })` returns `{ rows: [{ q, a, note }], extras }`. Only the background step is a carry step in the current content, so only it gets a skipped row with a source note. `renderDm` loads content with the DM key (so `bg_` terms arrive) and uses each player's `carried` from `GET /api/s2/:code?key=`.

## Session Two player saves

`save()` in `public/session-two/app.js` chains PUTs in call order, each with a snapshot of the state. The last step is saved once, with `done: true`, by `renderEnd(savePromise)`, which shows the saved text only on success and a retry button on failure. Picking a different character clears answers and `done`, on the client and in the PUT.

## Lore edit mode (Session One only)

- On when `LORE_EDIT=1` and no `RAILWAY_*` variable is set (`npm run dev:lore`); writes go to the local files, and Aviv commits them.
- `lore-edit.js`: whole-file API (`pathOf`, `fileVersions`, `saveFile`, `splitError`) and field edits (`editFields`, `PUT /api/s1/lore-field`). Saves are checked by hash.
- The file editor textarea needs `dir="auto"` plus `unicode-bidi: plaintext`; `dir="rtl"` scrambles Markdown lines that start in English.
- Inline edit in the DM lore view: one delegated `$app.onclick` handles `.ed-pencil`; a form replaces `host.innerHTML` and restores the saved HTML on cancel. The `EDITS` registry (one entry per pencil) is rebuilt on each `renderLore`.
- Open `<details>` in the lore view are kept in sessionStorage `s1-lore-open:<code>`, by index. `beforeunload` asks the module-level `dirtyCheck` that the active editor sets.
