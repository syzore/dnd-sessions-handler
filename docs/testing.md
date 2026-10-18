# Testing

`npm test` (`node --test`) runs everything under `test/`, including a load of the real `content/` tree. `npm run check-terms` checks every term image and link and every step link over the network. Browser checks in `/tmp` are not in CI; `test/term-popup.test.js` pins the popup's CSS source text only.

## Loader tests

- Quick load of the real Session One content: `node -e "import('./session-one-content.js').then(c=>c.loadContent('content/session-one'))"` (the dir argument is required).
- Fixtures live in `test/fixtures/`. The Session Two tree is `test/fixtures/session-two/basic/content/{session-one,session-two}` (`custom/` beside it). A test copies it to a temp dir and edits one file; the `fails` helper checks that the reported line of the edited file holds the expected text.
- A loader-error fixture built around an info step still includes a `### known` or `### secret` section, which every info step needs.
- Term-file errors point at the `### <name>` heading, not the `id:` line, in both sessions.
- Visible-option tests count unconditional options plus the ones whose `when:` matches, never the total.

## Server tests

Tests spawn `server.js` with `PORT` (explicit: the log prints the given port), `DATA_DIR`, `S1_CONTENT_DIR` and `S2_CONTENT_DIR` pointing at a temp copy of the fixture content. A content-error test edits the temp copy; the error reads `content/session-two/characters/a.md line 7: ...`.

## Front-end unit tests

`step-screen.js` imports absolute `/shared/...` paths, so markup tests copy `public/shared` to a temp dir with the imports rewritten to relative. Pure rules (`step-rules.js`, `session-two-flow.js`) import directly.

## Scratch server for browser checks

Keep repo data and content untouched:

```sh
DATA_DIR=/tmp/<dir> PORT=<port> node server.js          # add S1_CONTENT_DIR / S2_CONTENT_DIR for scratch content
curl -X POST localhost:<port>/api/sz/sessions -d '{"title":"t"}'   # -> code, adminKey
```

- Each character can be held by one player per group, so use a fresh group per test browser.
- Seed Session One for a Session Two check with `PUT /api/s1/<CODE>/me/<pid>`.
- The pid is JSON in localStorage `sz:pid`: set `JSON.stringify(id)`, read with `JSON.parse`.
- DM views: `/session-one/<CODE>/dm/lore?key=<adminKey>`, `/session-two/<CODE>/dm?key=<adminKey>`.

### Selectors

- Player flow (both sessions): pick a character with `.opt[data-id]`, then per step `.opt` + `#next`; also `#back`, `#other` (free text), `#ans` (text answer).
- Session Two: `#random-card`, `#count-hint`, `.context-line`, `.topbar .count` (`i/n`).
- A locked `count:` card carries `aria-disabled`, so Playwright `click()` waits forever on it; use `dispatchEvent('click')`.

### Phone viewport bugs

Chromium and WebKit phone emulation at scale 1 hides bugs that need the layout viewport to differ from the visual viewport. Reproduce with CDP `Emulation.setPageScaleFactor` (e.g. 1.6, Chromium only; WebKit has no equivalent) and assert element rects against `visualViewport`, not `innerHeight`.
