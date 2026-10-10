# Session One: world terms with popups, and a background step

Status: build-ready. This spec goes to engineering without another review by Aviv. Every decision is stated, under "Decisions already made", "Design decisions" or "Assumptions". Tickets: `session-one-glossary-tickets.md`. Written 2026-10-10. Revised 2026-10-10: background step, step links, open questions turned into assumptions. Revised again 2026-10-10: both drafts exist; the PM's content-scope decisions are A20–A34.

## Problem

Players go through Session One in Hebrew. The lore names many things: gods, places, races, classes, factions. A player who does not know Midgard cannot learn more about a name without leaving the app. Hebrew spelling also hides how to say a foreign name: "ולס" can be read several ways, and the text spells it both "ולס" and "וֶלֶס".

Players also have no place to choose a D&D 5e background for their premade character. Aviv wants each character to offer 5 backgrounds that suit its race, class and lore, plus a free-text answer and a link to a full list of backgrounds on the web.

## Solution

1. **Terms.** A term is a named thing in the world (race, class, place, god, faction, person, concept, background). It has a Hebrew name, an English name, a short Hebrew blurb, optional images (external URLs) and optional web links. Terms live as Markdown in `content/session-one/terms/`.
2. **Term references.** The author marks a word in the lore text as a reference to a term. The page styles it as a link. A tap or click opens a popup with the term's blurb, image and links.
3. **English names.** On each screen, the first time a term appears, the page writes its English name after it, e.g. "בהאמוט (Bahamut)". The page adds this from the term's `en:` line. The author does not type it. The popup header always shows both names.
4. **More lore.** `world.md` gets more bullets, drafted from Midgard canon in the existing tone.
5. **Step link.** A choice or text step can carry one external web link (`link:`), shown under the answer area (D9).
6. **Background step.** Each of the 5 character files gets a `## choice: background` step with 5 backgrounds, the free-text box, and a link to the full list. Each background option is a term, so its card has an info button and shows the English name (D10).

## Vocabulary

| Term | Meaning | Avoid |
| --- | --- | --- |
| **Term** (מונח) | A named world thing with an entry in `terms/`. | "glossary entry": `GLOSSARY.md` is the repo's domain-glossary convention, so the content is not called a glossary |
| **Term reference** | The markup in a text that points at a term: `[[id]]` or `[[id\|text]]`. | "hyperlink", "link" (a link is a web URL in a term or a step) |
| **Name-only term** | A term with `en:` but no blurb, image or link. It shows the English name but does not open a popup. | |
| **Term popup** | The dialog that shows one term. | "modal", "tooltip" |
| **Screen** | One rendered page of the player flow (the world page, one step), or one step section of the DM compendium. This is the scope of the first-mention English rule. | |
| **Background** (רקע) | A D&D 5e character background (e.g. Soldier, Sage), from the 2014 PHB, the 2024 PHB or Kobold Press. | "origin": the step ids `origin` (bebby) and `magic_origin` (vilhelm) already mean something else |
| **Step link** | The one external web link a step can carry, written `link:` at step level. | "term link" (a `link:` inside a term) |

## Decisions already made (by Aviv, do not reopen)

- No design references. Match the current Session One UI (dark card, gold accent, Frank Ruhl / Heebo).
- Agents draft the lore text from Midgard canon, in Hebrew and in the existing tone. Aviv edits the Markdown afterwards.
- Images are external URLs only. The app hosts no images.
- The English name appears inline on the first mention. The popup header always shows Hebrew + English.
- Each character gets a background choice step with id `background`: 5 backgrounds that suit the character, the free-text box, and a visible link to a full web list of backgrounds.

## Assumptions

Aviv does not review this spec before the build. These are decisions. Engineers build to them and do not ask.

Set by Aviv:

- **A1. Repo phase.** The repo has no `CLAUDE.md` and no phase line. It is pre-revenue: engineers commit straight to `main`, one commit or more per ticket. Deploys are manual (`railway up`), so a commit does not ship.
- **A2. Class label.** The Hebrew category label for `class` is "מקצוע" ("מעמד" already means social class in `world.md`).
- **A3. Unknown term id fails the load.** A reference or an option `term:` to an unknown term id is a content error. The whole Session One page shows the content-error screen, as for every other content mistake today (F1, F6). The `node --test` suite must catch this before a deploy: it includes a test that loads the real `content/session-one` folder through `loadContent` and fails on any `ContentError`. The README tells Aviv to run `npm test` before `railway up`.
- **A4. URL checker is required.** The offline URL checker is a required ticket (09), ordered last.

Set by this spec:

- **A5. Background step placement.** In every character file, the background step comes directly after `## info: lore` and before every other choice and text step. Why: the 5 fit lines refer to lore the player has just read, and the background frames the narrative questions after it (bebby's `origin` and vilhelm's `magic_origin` read as detail on top of it). The full step orders are in D10.
- **A6. Background option ids.** Option id = the draft id with `-` replaced by `_`. The background draft already writes every id in snake_case (`folk_hero`, `knight_of_the_order`), so this conversion changes nothing for it. The rule stays for any later draft. The same background (same `en`) has the same option id in every character. If the drafts give one background different ids, all characters use the id that sorts first. These ids are final once committed: never rename them (README id rule).
- **A7. Background term ids.** Term id = `bg_` + option id (e.g. `bg_soldier`). The prefix keeps background terms apart from world terms such as a faction or a person with the same English word. Term ids may change later (D3), option ids may not.
- **A8. Every background option is a term.** Each one gets `term:`, so every card has an info button. The popup gives the English name, the source and a link to the background's rules page, which the card does not show.
- **A9. Background card layout.** Label = Hebrew name (the English name is added by the `term:` rule, D4). `subtitle:` = the 1-line fit reason. Description = the short Hebrew description. No emoji (the draft has none and the conversion does not invent any). The source goes in the term popup, not on the card.
- **A10. Background step is a single, required pick.** No `multi:`, no `optional:`. The free-text box stays (the default), so a player can answer with a background from the full list instead.
- **A11. Step link details.** Allowed on choice and text steps and as a default in `lists/` files. One per step. Same syntax and the same `https:`-only validation as a term `link:`. Rendered after the answer area with `target="_blank" rel="noopener noreferrer"`, the same `rel` as term links in the popup (D9).
- **A12. Full-list URL.** The step link URL is `https://www.dndbeyond.com/backgrounds`. It is the background draft's primary recommendation (official, both editions; checked 2026-10-10: HTTP 200). Do not use the draft's wikidot fallback. It is also the fallback when ticket 09 finds the step link dead.
- **A13. Drafts.** Both drafts exist as of 2026-10-10 and are the only content sources. `docs/lore/session-one-glossary-draft.md`: 58 entries (race 14, class 6, place 14, god 9, faction 7, person 3, concept 5) and 7 proposed `world.md` bullets. `docs/lore/session-one-backgrounds-draft.md`: 5 options for each of the 5 characters, 17 distinct backgrounds. Tickets 06 and 07 wait only for their code tickets. No ticket writes lore that is not in a draft, except the edits that A20–A34 order. If a draft file is missing or moved when its ticket starts, the ticket stops (F34).
- **A14. Option count.** Take the draft's options for each character in draft order, at most 5. If the draft has fewer than 5 for a character, convert those that exist and say so in the commit message. The current draft has exactly 5 for every character.
- **A15. Players who already finished.** A player with `done: true` is not sent back to the new step. The DM view shows "—" for their background. If they tap "לשנות", they walk through every step and must answer the background step to continue.
- **A16. Glossary candidates in the background draft.** Ticket 07 does not convert candidates that are not one of the chosen backgrounds. It keeps them in an HTML comment at the top of `terms/backgrounds.md`, so ticket 08 or Aviv can pick them up. In the current draft every candidate is also a chosen background, so there is nothing to keep and no comment is written. The candidates' own `blurb:` and `links:` are not used: background terms follow D10 (blurb = description + source, link = the option `link`).
- **A17. Id collisions in the glossary conversion.** If two glossary-draft ids give the same term id after `-` → `_`, the later entry gets `_2` and an HTML comment that says why.
- **A18. Agent-drafted lore ships.** The `world.md` bullets and term blurbs from the drafts go in without waiting for Aviv. He edits the Markdown after the build.
- **A19. Dead URLs.** Ticket 09 runs the checker once against the real content. A term `image:` or `link:` that fails twice is removed and replaced by `<!-- removed dead URL: <url> (<status>) -->`. A failing step `link:` is replaced by the A12 fallback URL.

Set by the product manager, 2026-10-10 (content scope; final, Aviv does not review before the build):

Glossary draft (tickets 02, 06, 08):

- **A20. The deposed sultana stays unnamed.** Do not convert the draft entry `casmara-azrabahir`. Do not add the proposed `world.md` bullet "הסולטנה הגולה", the only one that names her. Her name (קסמרה אזרבהיר, Casmara Azrabahir) appears in no term, blurb, comment or bullet. Why: the content never names her, and the DM may be holding her back. Unnamed mentions stay as written: "סולטנה אנושית" in `world.md` stays plain text with no reference, and "הסולטנה המודחת" in the `seven-cities` blurb stays.
- **A21. No Emperor Loki V.** The mortal Emperor Loki V of Valera is not mentioned anywhere, so players do not confuse him with the god Loki. In the `loki` entry: the blurb ends after "...חלק ממזימה עם הענקים." (remove the sentence that starts "שימו לב:"); the sources comment is `<!-- sources: KP-serpent (Veles as a mask of Loki; Loki's tall tales) -->`; the draft's `uncertain:` line (about the emperor) is not kept. Valera as a city name may stay where the draft has it (the `seven-cities` blurb).
- **A22. Misleading stand-in images become no image.** These entries get no `image:` line: `azuran`, `ozmir-al-stragul`, `holy-orders`, `giantkin` (and `casmara-azrabahir`, excluded by A20). Their `uncertain:` comment is kept, with " Image omitted (A22)." added. Every other draft image stays, including generic D&D race and class art and Bahamut's holy symbol. A draft line `image: none verified` or `image: none` gives no `image:` line.
- **A23. `[fandom: no-referrer]` images keep their URL.** Convert the line to a plain `image: <url>` and drop the marker. The popup already loads every image with `referrerpolicy="no-referrer"` (D6), which is what `static.wikia.nocookie.net` needs. Ticket 02 proves it with one of these URLs.
- **A24. `uncertain:` is a comment, never a key.** A draft `uncertain:` value goes into `<!-- uncertain: ... -->` directly above its entry's `###` heading, so Aviv sees it when he edits. It never becomes a term key or blurb text. `uncertain: none` gives no comment. The same applies to `sources:` (D3).
- **A25. English in `world.md` comes only from references.** Ticket 08 adds English to the existing `world.md` bullets by marking the first mention of each term with `[[id]]` / `[[id|text]]`; the renderer appends the English (D5). Nobody types English in parentheses. The draft's "Optional, not new bullets" list is done this way. The proposed bullets that go in (the 6 left after A20) lose their hand-typed "(English)" parentheticals, which become references, and lose their "(source: ...)" tails and "[scope call ...]" tags. "מהארוט (Mharot)" has no draft entry, so ticket 06 adds the name-only term `mharot` (`### מהארוט`, `en: Mharot`, `category: person`) and ticket 08 references it.
- **A26. Minor terms are out of scope.** The draft's left-out terms (מחתרת הג'מבוקה, לוחם קדוש, צלבן, אלמנטליסטים, כישוף מולד) get no term, not even a name-only one, and are not marked. Ticket 06's name-only rule does not apply to them.
- **A27. "Seven Cities" stays.** The term is `seven-cities` → `seven_cities`, "שבע הערים", `en: Seven Cities`, with the draft blurb as written, although canon lists eight cities. The draft's `uncertain:` comment about it stays as a comment.
- **A28. The campaign content wins over canon.** Where the content departs from Midgard canon (goliaths, the giants of Cassilon, the inquisitors, the dragon roads (הסליל של הדרקון), the Law of Masks, the shattered holy orders), blurbs and bullets follow the content. Rules for the converter: a blurb sentence that contradicts the content changes to match it; a sentence that comments on canon vs campaign ("this is a campaign addition", "not in canon") is removed; canon facts that add detail without contradicting the content stay; the `uncertain:` comments that record the deviation stay. Concretely:
  - `goliath`: remove the last sentence ("השבטים של דק ... הם תוספת של הקמפיין."). The rest matches `deq.md` line 16.
  - `cassilon`: in the first sentence, replace "ממלכה קוסמופוליטית במערב" with "עיר אגדית של מלאכה ומסחר במערב" (`deq.md` line 17).
  - `holy-orders`: replace the second sentence ("בממלכת מגדר עדיין פועלים שניים: ...") with "רוב המסדרים של בני האדם והגמדים נופצו, ורק פלגים קטנים עדיין מסתתרים לאורך הגבולות, בממלכת מגדר ובנוריה נטאל." (`turator.md` line 24).
  - Proposed bullet "ממלכת מגדר": replace "עם עגלות מלחמה משוריינות ושני מסדרי אבירים קדושים" with "עם עגלות מלחמה משוריינות". The bullet is public, and Turator's lore says the orders were shattered.
  - `imperial-inquisitors`, `dragon-roads`, `law-of-masks`: the blurbs already agree with the content. Keep them as written.
- **A29. "חצי-אדם" is halfling, unconfirmed.** Bebby's "חצי-אדם" maps to the `halfling` term (`en: Halfling`). The comment above the entry starts with "unconfirmed:": `<!-- uncertain: unconfirmed: the content's "חצי-אדם" was read as halfling from context ... -->` (the rest of the draft's text follows).
- **A30. The World Serpent's id is `veles`** (set by this spec, not the PM). The draft and canon spell him Veles (ולס), so the term id is `veles` and `en: Veles`. Ticket 01 seeds `veles` (not "velas"), and ticket 06 replaces the seed entry with the draft entry of the same id.

Background draft (ticket 07):

- **A31. The background step is added, never substituted.** `background` is its own step, next to bebby's `origin` and vilhelm's `magic_origin`. No existing step is removed, renamed or merged into it: answered step ids are immutable.
- **A32. Gladiator stays.** Deq keeps `gladiator`. Its term blurb is: the draft description, then the paragraph "זהו וריאנט של רקע הבדרן.", then `מקור: 2014 PHB (variant of Entertainer)`. "הבדרן" is plain text (Entertainer is not a term), and no English is typed in the Hebrew text. The card keeps the draft description only.
- **A33. Mixed editions are allowed.** Backgrounds from the 2014 PHB, the 2024 PHB, Kobold Press *Tome of Heroes* and other WotC books sit side by side. Nothing is normalized to one edition. The `מקור:` line in the term popup (D10) is the only edition marker, copied as written in the draft.
- **A34. Tenni and Turator picks stand.** Their race is still a TODO in the content. The draft's picks for them, based on class and lore only, are converted as drafted. The build does not wait for the race.

## Design decisions (made in this spec)

### D1. Explicit markup, not auto-matching

Term references are explicit: `[[veles]]` or `[[baal|בעל]]`. The page never searches the text for names.

Why auto-matching fails on this content:
- **Prefix letters collide with name letters.** "ולס" (Veles) starts with ו, the same letter as the "and" prefix. A matcher that removes ו/ה/ב/כ/ל/מ/ש reads "ולס" as ו + "לס".
- **Names are also common words.** The god "בעל" (Baal) is the same string as "בעל" in "בעלי קשקשים" (scale-bearers): `world.md` line 10, `vilhelm.md` lines 19 and 26. A matcher would link the god inside unrelated sentences.
- **Spelling and inflection vary.** "וֶלֶס" (with niqqud) vs "ולס"; "דרקון / דרקונים / דרקוני / בני-הדרקון". A matcher needs a morphology table, and it still makes mistakes nobody sees.
- **A mistake is silent.** A wrong auto-link has no error. A wrong explicit reference fails the parser and names the file and line, like every other content mistake today.

Cost: the author types the markup. The common case `[[id]]` is short, and it inserts the Hebrew name, so the author does not type the name too.

### D2. Markup syntax

| Markup | Renders |
| --- | --- |
| `[[bahamut]]` | the term's Hebrew name (the `###` heading), as a term reference |
| `[[baal\|בעל]]` | the text after `\|`, as a reference to `baal`. Use it for inflected forms: `[[dragonborn\|בני-הדרקון]]` |
| `ו[[veles]]` | a prefix letter stays outside the brackets and is not part of the link |

Rules:
- The id is a term id (D3). The text after `|` is any text except `]]`, and it must not be empty.
- A reference starts and ends on the same line.
- References are allowed in: step `title`, `prompt`, `hint`; lore bullets (title and text, including `lists/` bullet files); option label, `subtitle` and description; term blurbs.
- References are not allowed anywhere else: front matter, ids, `use:`, option `term:`, step `link:`, keys in a term header. The parser reports them with file and line.
- No escape syntax. `[[` does not appear in the content today.

### D3. Term file format

Folder: `content/session-one/terms/*.md`. The author chooses the file names and groups the terms freely (suggestion: one file per category, `gods.md`, `places.md`, `backgrounds.md`, ...). The `category:` line, not the file, sets the category. The grammar copies the choice-option grammar (`### heading`, `key: value` lines, a blank line, paragraphs), so the format already in the README stays familiar.

```markdown
# אלים

<!-- sources: Midgard Worldbook p.12; uncertain: exact spelling of the Hebrew name -->

### וֶלֶס
id: veles
en: Veles
category: god
aliases: ולס, נחש-העולם
image: https://example.org/veles.jpg
image: https://example.org/veles-fallback.png
link: Midgard Wiki — https://example.org/wiki/Veles
link: https://example.org/another-page

נחש-העולם, שמתפתל סביב קצה הדיסקה ונושך את זנבו. הדרקונים של [[mharoti_empire]] רואים את עצמם כיורשיו.
```

| Key | Required | Rule |
| --- | --- | --- |
| `### <Hebrew name>` | yes | The display name. An emoji before it is not allowed (this is not a card). |
| `id:` | yes | Latin lowercase, digits, `_` (the README id rule). Unique across all term files. |
| `en:` | yes | English name, one line. |
| `category:` | yes | one of `race`, `class`, `place`, `god`, `faction`, `person`, `concept`, `background` |
| `aliases:` | no | Comma-separated other Hebrew names or spellings. The popup shows them as "נקרא גם: ...". Authors use them to find mentions. |
| `image:` | no, can repeat (max 3) | `https://` URL. The popup shows the first one that loads. The others are fallbacks. |
| `link:` | no, can repeat | `[title] [— or -] https://URL`. The URL is the last token. The title is optional. Without a title the popup shows the host name. |
| blurb | no | Paragraph(s) after the blank line, in Hebrew. Can contain term references. |

- A term with no blurb, image or link is a **name-only term**.
- Each key except `image:` and `link:` may appear only once.
- Only `https:` URLs are allowed. The parser rejects `http:`, `javascript:`, `data:` and relative URLs, because the URLs go into `src` and `href`.
- One parser function reads a `link:` value (`[title] [—|-] URL` → `{ title?, url }`) and validates the URL. Term links and step links (D9) both use it.
- `sources` and `uncertain` notes are HTML comments. The parser ignores them. They are for Aviv's review.
- **Ids and renames.** No player answer saves a term id, so a term id may change if every reference to it changes too. The parser reports every reference left without a term. (Character, step and option ids keep the existing rule: never rename them.)

**Converting the research draft** (`docs/lore/session-one-glossary-draft.md`), entry by entry. Each entry is a `### <id>` heading followed by `- key: value` bullets. Skip `casmara-azrabahir` (A20). A value of `none` or `none verified` means the key is absent.

| Draft | Term file |
| --- | --- |
| `### <id>` (kebab-case) | `id: <id with - replaced by _>` (collision: A17) |
| `he:` | `### <he>` heading |
| `en:` | `en:` |
| `category:` | `category:` |
| `aliases_he:` | `aliases:` (comma-separated) |
| `image:` URL(s) | one `image:` line each, max 3, `https:` only (drop others and note them in a comment). Drop a trailing ` [fandom: no-referrer]` marker and keep the URL (A23). No image for the A22 entries |
| `links:` `title — URL` | one `link:` line each |
| `blurb:` | blurb paragraph. Wrap mentions of other draft terms in references. |
| `sources:`, `uncertain:` | `<!-- sources: ... -->`, `<!-- uncertain: ... -->` above the entry, never a key (A24). No comment for `none` |

### D4. Choice cards: a term per option, plain text inside the button

A choice option is a `<button>`. A link inside it would put a control inside a control (invalid HTML), and a tap on the term would also select the option. So:
- Inside option label, subtitle and description, a term reference renders as plain text, with no link style. The first-mention English rule still applies.
- A new option key **`term: <id>`** links the whole option to a term. The card gets a separate info button ("ⓘ", aria-label "מידע על <name>"). It is placed next to the card's selection button, not inside it, and it opens the term popup. Selecting the card works as before. Examples: each god in `lists/gods.md` gets `term: <god id>`; each background option gets `term: bg_<option id>` (D10).
- When an option has `term:`, its label counts as an occurrence of that term for the English rule, so a card shows "בהאמוט (Bahamut)".
- The same applies to the DM compendium cards. They are not buttons, but they keep the same layout.

### D5. First-mention English

- **Rendered, not authored.** The page appends ` (En)` from the term's `en:`. The author writes no parentheses. The README says not to type the English by hand.
- **Scope = screen.** Each player-flow screen starts fresh: the world page and each step. In the DM compendium, each step section starts fresh, and the world-lore block counts as one section. Each term popup body starts fresh too.
- **"First" = first in document order** within the scope. This includes plain-text occurrences (D4) and step titles. It is done as one pass over the rendered screen after the HTML is built, so the order is the DOM order and not the order in which strings were rendered.
- Inside a popup, a reference to the popup's own term gets no English and no link (the header already shows it).
- The English is a separate `<span dir="ltr" lang="en">(Bahamut)</span>` after the reference, outside the trigger button, in the muted color. The parentheses are inside the LTR span, so bidi does not flip them.
- Name-only terms follow the same rule. They render as plain text plus English, with no link.
- A step link title (D9) is plain text and gets no English.

### D6. Term popup

- **Element:** native `<dialog>`, opened with `showModal()`. The browser gives the top layer, an inert background and Esc for free. One dialog instance is shared by the whole app, in the shared layer (Session Zero can use it later).
- **Layout:** RTL inherited from the page.
  - Narrow viewports (≤ 560px): a bottom sheet with the full width, rounded top corners, max height 85vh, and its own scroll.
  - Wider viewports: a centered card, max width 480px.
  - Style: `--card` background, `--line` border, `--radius`.
- **Header:** category kicker in Hebrew (race גזע, class מקצוע, place מקום, god אל, faction פלג, person דמות, concept מושג, background רקע), Hebrew name (serif, gold), English name (`dir="ltr" lang="en"`, muted), then the "נקרא גם" aliases line if there is one. Close button X (aria-label "סגירה"). Back button (aria-label "חזרה") only when the in-popup history has more than one entry.
- **Image:** `<img loading="lazy" referrerpolicy="no-referrer" alt="<he> (<en>)">`, max height 240px, `object-fit: cover`. While it loads, the image area keeps its height and shows a subtle background, so the text does not jump. If an image fails, the popup tries the next `image:`. If all fail, or there are none, the image area is removed. The popup shows no broken-image icon.
- **Body:** blurb paragraphs, with term references.
- **Links:** section "לקריאה נוספת". Each link is `<a target="_blank" rel="noopener noreferrer">` with the title (or host name), the host name in muted text, an external icon and `dir="auto"`.
- **Close:** X button, Esc, or a click on the backdrop (outside the sheet or card). A click inside the content never closes the popup.
- **Focus:** when the popup opens, focus moves to the close button. When it closes, focus returns to the element that opened it. The dialog has `aria-labelledby` pointing at the Hebrew name.
- **Page scroll:** the page behind does not scroll while the popup is open (lock the root overflow; iOS does not do this for a modal dialog by itself).
- **Browser back / Android back:** opening the popup pushes one history entry. Back closes the popup and does not leave the page (leaving would lose the current step's unsaved input). Closing with X, Esc or the backdrop removes that entry.
- **Terms inside a popup:** a reference in a blurb opens the target term in the same popup and pushes it onto an in-popup stack. The back button goes back one entry. Close closes the whole stack. The stack has max 10 entries (the oldest is dropped). A→B→A cycles are allowed.
- **Trigger:** `<button type="button" class="term" aria-haspopup="dialog" data-term="<id>">`, styled as a text link (inherits font and size, gold, 1px dotted underline, visible focus ring). A term that wraps as one unit is acceptable.

### D7. API and secrets

- `GET /api/s1/content` adds `terms: { <id>: { id, he, en, category, aliases?: string[], images: string[], links: [{ title?, url }], blurb?: string } }`.
- A step with a step link carries `link: { title?, url }` in its step JSON (D9).
- All text fields keep their raw `[[...]]` markup. The client renders it. The server only validates.
- **Secret-safe filtering.** A term that only a secret section references must not reach other players. `contentFor` sends each viewer the terms that their own filtered content references (text references and option `term:`), plus the terms that those terms' blurbs reference (transitive closure). The DM gets every term. Every term blurb is visible to anyone who gets the term. The README says to keep secrets out of blurbs.

### D8. Rendering helpers (client)

Two shared functions. Every place that shows content text uses one of them.
- `richText(str)`: escapes the text and turns references into triggers (or plain spans for name-only terms).
- `plainText(str)`: returns the display text with no markup. Used in buttons (D4), DM answer labels (`dt`), `<title>`, and anywhere a control or attribute holds the text.

Raw `[[...]]` must never reach the screen.

### D9. Step link

Choice steps today have no link field (`STEP_KEYS` in `session-one-content.js` is `title, prompt, hint, multi, optional, other, use`). This spec adds one.

```markdown
## choice: background
title: 📜 מה הרקע שלך?
link: הרשימה המלאה של הרקעים (באנגלית) — https://www.dndbeyond.com/backgrounds
```

- **Key:** `link:` at step level. Allowed on `choice` and `text` steps. On an `info` step it is a parser error. In a `lists/` options file it is a default, like `title:` and `prompt:`: a step that says `use:` gets it, and the step's own `link:` overrides it.
- **Syntax:** the term `link:` syntax (D3): `[title] [— or -] https://URL`. The same parser function reads it. One per step (the existing duplicate-key error covers a second one).
- **Title:** plain text. A `[[` in it is a parser error (F3). Without a title, the page shows the host name.
- **Validation:** `https:` only, the same rule and the same error message style as term links.
- **Output:** `step.link = { title?, url }` in the step JSON.
- **Render** (player flow and DM compendium): after the answer area (the options and the "other" box, or the text box) and before the footer. `<a class="step-link" href="<url>" target="_blank" rel="noopener noreferrer" dir="auto">` with the title (or host name), the host name in muted text when a title is shown, and an external icon. Same look as the popup links (D6). Max width 560px, aligned with the card grid and the "other" box. `url` and title are escaped.
- **Behaviour:** the link opens in a new tab. The step's answers and the text in the "other" box stay as they were. Opening the link saves nothing.
- **README:** a `link` row in the step key table, in Hebrew + English.

### D10. Background step

Every character file gets this step. Its id is `background`. Answers save as `answers.background` (option id) and `answers.background_other` (free text), the existing rule.

**Fixed step text** (the same in every file except the name in `prompt`):

```markdown
## choice: background
title: 📜 מה הרקע שלך?
prompt: הרקע הוא מה שעשית בחיים לפני ההרפתקה. בחר אחד מחמשת הרקעים שמתאימים ל<name>, או כתוב רקע אחר מהרשימה המלאה.
link: הרשימה המלאה של הרקעים (באנגלית) — <full-list URL, A12>

### <he>
id: <option id>
term: bg_<option id>
subtitle: <fit>

<description>
```

`<name>` per file: deq "דק", bebby "בבי", turator "טוראטור", tenni "טני", vilhelm "וילהלם" (so "לדק", "לבבי", "לטוראטור", "לטני", "לוילהלם").

**Placement** (A5): directly after `## info: lore`.

| File | Step order after the change |
| --- | --- |
| `deq.md` | lore, **background**, tribe, left_behind, how_joined, on_evoker, rage_style |
| `bebby.md` | lore, **background**, origin, past_contact, rogue_type, rogue_lean |
| `turator.md` | lore, **background**, god, training, why, vibe |
| `tenni.md` | lore, **background**, god, training, why |
| `vilhelm.md` | lore, **background**, magic_origin, magic_dream, element, allegiance, goal |

No existing step id is `background`, and no answer key is `background_other`, so no saved answer collides.

**Converting the background draft** (`docs/lore/session-one-backgrounds-draft.md`). The draft has, per character: 5 options with `id`, `he`, `en`, `source`, `description`, `fit`, `link`; a recommended full-list URL; glossary candidates.

| Draft | Content |
| --- | --- |
| character section | `content/session-one/characters/<character id>.md`, background step as above |
| option `id` (already snake_case in the draft) | option `id:` = the draft id unchanged (the A6 `-` → `_` step is a no-op); must match `^[a-z0-9_]+$`. Same `en` in two characters → one id (A6) |
| option `he` | `### <he>` heading. Remove a trailing parenthetical in Latin letters, e.g. "חייל (Soldier)" → "חייל" (the page adds the English, F20) |
| option `en` | term `en:` |
| option `fit` | option `subtitle:`, one line (join line breaks with a space) |
| option `description` | option description paragraph, and the term blurb's first paragraph |
| option `source` | term blurb's last paragraph: `מקור: <source as written in the draft>` (mixed editions allowed, A33). Gladiator gets an extra paragraph before it (A32) |
| option `link` | term `link: <en> — <url>`, `https:` only (otherwise drop it and leave `<!-- dropped non-https link: <url> -->`) |
| recommended full-list URL | step `link:` in all 5 files: `https://www.dndbeyond.com/backgrounds` (A12) |
| glossary candidates | not converted. Only candidates that are not a chosen background go in `<!-- glossary candidates (not converted): <list> -->` at the top of `terms/backgrounds.md`. The current draft has none, so no comment (A16) |

Background terms: one file, `content/session-one/terms/backgrounds.md`, `# רקעים` title, one entry per distinct background (by option id), ordered by `en`:

```markdown
### חייל
id: bg_soldier
en: Soldier
category: background
link: Soldier — https://...

<description>

מקור: <source>
```

If two characters' drafts give the same background different descriptions, the term blurb uses the one from the character file that sorts first; each card keeps its own description.

## Failure and edge states

| # | State | Behaviour |
| --- | --- | --- |
| F1 | Reference to an unknown term id | Parser error: `<file> line <n>: [[foo]]: there is no term "foo" (terms/*.md)`. The page shows the content-error screen, as for any content mistake today. `npm test` fails on it through the real-content test (A3). |
| F2 | Bad reference syntax: `[[` without `]]` on the line, `[[]]`, `[[id\|]]`, an id with uppercase, `-` or Hebrew | Parser error with file and line. |
| F3 | Reference in a field that does not allow it (front matter, `use:`, `id:`, option `term:`, step `link:`, term header keys) | Parser error with file and line. |
| F4 | Duplicate term id across files; a duplicate key; a missing `id:`, `en:` or `category:`; an unknown category; more than 3 `image:` lines | Parser error with file and line. |
| F5 | Term `image:` or `link:` that is not `https://`, or has no URL | Parser error with file and line. |
| F6 | Option `term:` names an unknown term | Parser error with file and line. The real-content test catches it (A3). |
| F7 | The client gets a reference to an id that is not in `terms` (stale client, filtered term, old server) | Render the display text as plain text. No link, no English, no console error spam. An option `term:` with no matching term renders the card with no info button. |
| F8 | Image URL is 404, blocked or slow | Try the next `image:`. When none load, remove the image area. A slow image never blocks the text, the links or closing the popup. |
| F9 | Web link is broken (term link or step link) | The app cannot detect this (cross-origin). The link opens in a new tab and the session page stays as it was. Ticket 09 adds an offline URL checker and removes dead URLs once (A19). |
| F10 | Term inside a choice card (button) | Plain text, English rule applies, not clickable. Use option `term:` for a popup (D4). |
| F11 | Term in a step `title` or `prompt` (headings) | Clickable. A button inside a heading is valid. |
| F12 | Term in the DM players view (`dt` question labels, answer values) | `plainText`. The answers are player free text and never contain markup, and they are always escaped. |
| F13 | DM compendium | Fully clickable. English rule per step section. Secret sections behave the same. |
| F14 | Term referenced only in a character's secret section | Not sent to other players (D7). The DM and that character's player get it. |
| F15 | Name-only term | Plain text + English. No trigger, no popup. |
| F16 | A popup term references itself | Plain text, no English. |
| F17 | Term with a blurb but no image and no links | The popup shows the header + blurb only. No empty sections. |
| F18 | Term with links or an image but no blurb | The popup opens. The body is the image + links. |
| F19 | Very long blurb | The sheet scrolls inside itself. The header with X stays visible (sticky). |
| F20 | Hand-typed English next to a reference or a `term:` label, e.g. "[[bahamut]] (Bahamut)" or `### חייל (Soldier)` with `term: bg_soldier` | Renders twice. The README forbids it. The conversion tickets (06, 07) and the markup ticket (08) check for it. |
| F21 | A content edit while a player is mid-flow | Content loads once per route, as today. New terms and the new background step appear on the next load. |
| F22 | The player changes character: secrets and terms change | `loadContent` already runs again after a pick. The terms set comes with it. |
| F23 | Two quick taps on two terms | The second tap replaces the popup content (no second dialog). |
| F24 | `<dialog>` not supported | Not handled. All target browsers (iOS 15.4+, current Chrome and Firefox) support it. |
| F25 | Step `link:` on an `info` step | Parser error with file and line: `"link:" works on choice and text steps`. |
| F26 | Step `link:` that is not `https://`, has no URL, or appears twice in a step | Parser error with file and line (same message style as F5; the duplicate uses the existing duplicate-key error). |
| F27 | Step `link:` in a `lists/` file and in the step that uses it | The step's own value wins, as for `title:` / `prompt:`. |
| F28 | Step link without a title | The link text is the host name, e.g. "www.dndbeyond.com". |
| F29 | A player who finished before the background step existed | Not sent back. The DM view shows "—" for the background. "לשנות" walks every step, and the required background step blocks "המשך" until a card is picked or the "other" box has text (A15). |
| F30 | A player picks a card and also writes in the "other" box | Both save (existing behaviour). The DM view shows "<label> · משהו אחר: <text>". |
| F31 | The chosen background contradicts another answer (e.g. a noble background with bebby's "street" origin) | No validation. The DM reconciles it at the table. |
| F32 | The same background appears for two characters | One term (`bg_<id>`), the same option id in both files. Each card keeps its own fit line and description. |
| F33 | The background draft has fewer than 5 options for a character | Convert those that exist, note it in the commit message (A14). The step still needs at least 1 option, or the parser fails. The current draft has 5 for each character. |
| F34 | A draft file is missing or moved when its ticket starts (both exist on 2026-10-10) | The ticket stops and reports it (A13). No partial or invented content is committed. |

## Acceptance criteria (feature level)

1. A player on the world page sees marked terms styled as links. A tap opens a popup with Hebrew + English names, category, blurb, image (if one loads) and links that open in a new tab with `rel="noopener noreferrer"`.
2. On every screen, the first occurrence of each term shows "(English)" after it. Later occurrences on the same screen do not.
3. The popup closes with X, Esc, a backdrop click and the browser/Android back button. Back never leaves the page while the popup is open. Focus returns to the trigger.
4. On a ≤ 560px viewport the popup is a bottom sheet. On a wide one it is a centered card. Both are RTL.
5. A god choice card has an info button that opens the god's popup without selecting the card. Selection works exactly as before.
6. Every content mistake listed in F1–F6 and F25–F26 shows the existing content-error screen with file and line.
7. A non-DM player's `/api/s1/content` response contains no term that only another character's secret section references.
8. Raw `[[...]]` never appears on any screen, in any `<title>`, or in DM answer labels.
9. The README documents term files, the reference syntax, where references are allowed, the English rule, the secrets rule, option `term:`, step `link:` and "run `npm test` before `railway up`", in Hebrew + English like the rest of the README.
10. `world.md` has the expanded lore, and existing content references terms on their first mention in each step.
11. Every character's second step (after the lore page) is the background step: 5 cards (or the draft's count, F33), each showing "<Hebrew> (English)", the fit line and the description, each with an info button that opens a popup with category "רקע", the source and a rules link.
12. The background step shows the "other" box and, under it, a link to the full list that opens in a new tab. Typed text in the "other" box survives opening the link.
13. `npm test` fails if any file in the real `content/session-one` folder has a content error, including an unknown term id.
14. `npm run check-terms` reports every failing term URL and step link URL with file and line, and the shipped content has no URL that failed it twice.

## Testing

- **Seam 1 (server, highest):** `loadContent(dir)` + `contentFor(content, viewer)`. The repo has no tests yet. Add `node:test` (`npm test` → `node --test`) with fixture content folders under a test directory. Test behaviour through these two functions only: the parsed term shape, the step link shape, every F1–F6 and F25–F27 error message (file + line), and the secret filtering (F14).
- **Real-content test:** one test calls `loadContent` on the repo's `content/session-one` and expects no throw (A3). It is the gate before `railway up`.
- **Seam 2 (client):** no test framework, and none is added for this. Verify in a real browser with the local recipe: `DATA_DIR=<scratch> PORT=<p> node server.js`, create a group via `POST /api/sz/sessions`, open `/session-one/<CODE>` and `/session-one/<CODE>/dm/lore?key=<adminKey>`. Check a 390px and a 1280px viewport. Use a fresh group per test browser, because one player per group can take each character.
- The `richText` / `plainText` functions are pure. If an engineer wants unit tests, they can live in the shared lib and be imported by `node:test`, because the shared lib is an ES module without DOM access at import time.

## Out of scope

- Links on the character-pick screen and on the `name · class` kicker. A class term on the pick cards would need a front-matter key. Possible follow-up.
- Session Zero, schedule, tables tools (the popup component is reusable later).
- Search or an index page of all terms.
- Hosting or caching images; checking links at runtime.
- Auto-matching names in text (D1).
- Translating the UI to English.
- Background rules: skills, tools, languages, equipment, feats or ability scores. The step records the choice only.
- Checking that a background agrees with other answers (F31).
- A link on an `info` step, or more than one link per step.
