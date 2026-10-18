# dnd-sessions-handler

Small Hebrew web tools for one D&D group: Session Zero, Session One, Session Two, schedule, tables. One Node server (`server.js`, ESM, no build step) serves `public/<tool>/` and the JSON API.

Phase: pre-revenue

## Where things are

- **Content format** (characters, steps, options, terms): [`content/session-one/README.md`](content/session-one/README.md), then [`content/session-two/README.md`](content/session-two/README.md) for what Session Two adds. Read them before editing anything under `content/`.
- **Specs and tickets**: `docs/specs/`. Each feature's spec holds its decisions (D*), assumptions (A*) and failure states (F*); code comments cite them by number.
- **Vocabulary** (carried answer, effective answer, background override...): [`GLOSSARY.md`](GLOSSARY.md).
- **How the server, loaders and shared front-end modules work**: [`docs/architecture.md`](docs/architecture.md). Read it before changing an API route, `contentFor`, a loader, or a module in `public/shared/`.
- **Tests, scratch servers and browser checks**: [`docs/testing.md`](docs/testing.md).
- **Lore research drafts** (sources, canon vs campaign invention): `docs/lore/`.

## Rules

- **Deploy is manual.** `railway up` to Railway project `dnd-tools` (dnd-tools-production.up.railway.app) is the only way to ship; a push to `main` ships nothing. `railway up` uploads the local working tree, untracked files included (`session-zero.json` with test admin keys rides along). Commit first, so git equals production, and run `npm test` before every `railway up`.
- **Production data** is one JSON file, `/data/session-zero.json` on the Railway volume, shared by every tool. The server loads it once into memory and rewrites it on every save, so a hand edit of the live file is lost. Free a character through `DELETE /api/s1/:code/players/:pid?key=` (or `/api/s2/...`).
- **An admin key proves nothing.** `POST /api/sz/sessions` is unauthenticated and returns a fresh `adminKey`. Gate a privileged feature (writing files, anything beyond one group) on the environment or loopback, as `LORE_EDIT` does.
- **Secrets travel only in `### secret`.** Every player receives every character's non-secret steps, so a fact that exists only in some `### secret` must stay out of shared steps, subclass text and term blurbs. `contentFor` also filters terms by what the viewer can reach; a route that adds terms by hand (`extraTerms`) limits them to the viewer's own character.
- **Content text renders through `richText` / `plainText`, and option descriptions through `richParas`** (`public/shared/terms.js`); `esc` alone drops the term markup and the first-mention English.
