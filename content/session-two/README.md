# תוכן סשן שני / Session Two content

תוכן סשן שני נמצא כאן, כקבצי Markdown, באותו פורמט של סשן ראשון. כאן מופיע רק מה שונה. את כל השאר (שלבים, אפשרויות, מונחים, `[[הפניות]]`, רשימות) מתארים ב-[README של סשן ראשון](../session-one/README.md). הטעינה מפעילה את אותו מנתח, ולכן אותן שגיאות מופיעות עם שם קובץ ומספר שורה.

Session Two content lives here as Markdown, in the Session One format. This file lists only what differs; steps, options, terms, `[[references]]` and lists are in the [Session One README](../session-one/README.md). The same parser reads both, so mistakes show up the same way, with file and line.

```
intro.md                    העמוד שכל שחקן רואה פעם אחת / the page every player sees once (like world.md)
characters/<id>.md          דמות אחת לכל קובץ / one character per file; the id must be a Session One character
steps/*.md                  שלבים משותפים, לכל הדמויות / shared steps, appended to every character
lists/<name>.md             כמו בסשן ראשון, אם צריך / as in Session One, if needed
terms/*.md                  מונחים של סשן שני / Session Two terms, merged with Session One's
```

סשן ראשון נטען תמיד קודם. טעות בקובץ של סשן ראשון מפילה גם את סשן שני, עם הקובץ והשורה שלה. מונח עם אותו `id` בשני הסשנים הוא טעות שמציינת את שני המקומות.

Session One always loads first: a mistake in a Session One file fails Session Two too, naming that file and line. A term `id` used in both sessions is an error naming both places.

## ⚠️ לפני העלאה / Before deploy

מריצים `npm test` לפני `railway up`. הבדיקה טוענת גם את סשן שני ונכשלת על כל טעות, וגם בודקת שלכל רקע (כל אפשרות של שלב `background` בסשן ראשון וכל מונח `bg_*`) יש שלב פרטים. `npm run check-terms` בודק גם את הקישורים של סשן שני.

Run `npm test` before `railway up`. It loads Session Two too and fails on any mistake. It also checks that every background (each option of Session One's `background` step and every `bg_*` term) has a details step. `npm run check-terms` covers Session Two links as well.

מזהים לא משנים אחרי ששחקנים ענו, כמו בסשן ראשון / Never change an id once players have answered, as in Session One.

## קובץ דמות / A character file

```markdown
---
id: deq
---

# רזול

## choice: subclass
title: 🪓 באיזה נתיב הזעם שלך הולך?
prompt: ברמה 3 כל [[barbarian]] בוחר נתיב, והוא קובע מאיפה הזעם בא ומה הוא עושה.
context: rage_style
link: הברברי בספר השחקן 2024 (באנגלית) — https://dnd2024.wikidot.com/barbarian:main

### נתיב המשתולל
id: berserker
term: sc_berserker
subtitle: ...

## choice: background
from: session-one
```

- `id`: חובה, וחייב להיות מזהה של דמות מסשן ראשון. אחרת השגיאה היא `no Session One character "<id>"`. / Required; must be a Session One character id.
- `name`, `class`, `icon`, `order`: לא חובה. מה שחסר נלקח מקובץ הדמות בסשן ראשון עם אותו `id`, כדי שיהיה מקור אחד לשם. מה שכתוב כאן גובר. בלי `order`, הסדר הוא הסדר בסשן ראשון. / Optional; a missing one is taken from the Session One file with the same id (one source for the name). A written value wins. Without `order` the Session One order is kept.
- `background: <id>`: לא חובה. **רקע שה-DM קובע.** גובר על כל תשובה, והשחקן לא נשאל על רקע. הערך הוא מזהה רקע שיש לו מונח `bg_<id>` (למשל `noble` עם `bg_noble`), אחרת: `background "x": there is no term "bg_x"`. / Optional. **The DM's background override.** It beats every answer and the player is not asked. The value is a background id that has a `bg_<id>` term.
- מפתח אחר בראש הקובץ הוא טעות שמציגה את המותרים: `id, name, class, icon, order, background`. סשן ראשון ממשיך לדחות `background:`. / Any other front-matter key is an error listing the allowed ones. Session One still rejects `background:`.
- דמות בלי קובץ כאן לא מופיעה בסשן שני. / A Session One character with no file here is not in Session Two.

## שלוש מילים חדשות לשלב / Three new step keys

רק בסשן שני. בסשן ראשון הן עדיין "unknown key". / Session Two only. Session One still rejects them as "unknown key".

### `from: session-one`

השלב הוא אותו שלב מסשן ראשון (אותו `id`, אותה דמות), מועתק בשלמותו: סוג, כותרת, שאלה, קישור, אפשרויות, מונחים. מתחת ל-`from:` לא כותבים כלום (אין מפתחות ואין `###`), וסוג הכותרת חייב להיות כמו בסשן ראשון. אם כבר יש תשובה מסשן ראשון (או רקע שה-DM קבע), השלב מדולג.

The step is the Session One step with the same `id` from the same character, copied whole. Write nothing under `from:` (no keys, no `###`), and the heading type must match Session One's. If the answer is already known (from Session One, or the DM's override), the step is skipped. Output: the copied step plus `carry: true`.

```markdown
## choice: background
from: session-one
```

### `when: <step id> = <option id>`

השלב מופיע רק כשהתשובה לשלב הקודם הזה שווה לאפשרות. `= _else` מתאים לכל תשובה אחרת: טקסט חופשי, או רקע שאין לו שלב משלו. השלב שנבדק חייב להופיע קודם בזרימה של אותה דמות, להיות שלב בחירה, ובלי `multi`. הערך חייב להיות מזהה של אפשרות בשלב הנבדק (בשלב `background` גם הרקע שה-DM קבע, או מזהה שיש לו מונח `bg_<id>`). כמה שלבים באותו קובץ דמות יכולים לחלוק `when:` אחד (רקע מותאם); שלב משותף (`steps/*.md`) לא חולק `when:` עם אף שלב אחר, וגם שני `_else` לאותו שלב הם טעות.

The step shows only when the answer to that earlier step equals the option. `= _else` matches any other answer: free text, or a background with no step of its own. The target must be an earlier step in that character's flow, a choice step, not `multi`. The value must be an option id of that step (for `background` also the character's own `background:`, or any id that has a `bg_<id>` term). Several steps in one character file may share one `when:` (a custom background); a shared step (`steps/*.md`) never shares a `when:` with another step, and two `_else` for one target are an error.

```markdown
## choice: details_soldier
when: background = soldier
context: background
title: ⚔️ באיזה צבא שירתת?
```

### `context: <step id>`

מעל האפשרויות מוצגת התשובה הקיימת לשלב הזה, כקריאה בלבד. השלב יכול להיות שלב קודם בזרימה של סשן שני, או שלב בחירה/טקסט בקובץ של אותה דמות בסשן ראשון (למשל `element`, `god`). שלב מידע אינו מתאים. הטעינה שומרת את השאלה ואת האפשרויות, כי שלב שקיים רק בסשן ראשון לא נמצא בתוכן של סשן שני.

Above the options the step shows the answer to that step, read-only. The target is an earlier Session Two step, or a choice or text step in the same character's Session One file (`element`, `god`). An info step is an error. The loader keeps the question and the options, because a Session One-only step is not in the Session Two content.

```markdown
## choice: subclass
context: rage_style
```

שאלה משלך: `context: <מזהה שלב> | <שאלה>`. הטקסט אחרי `|` מחליף את השאלה שנגזרת מהשלב (הכותרת, ואם אין, ההנחיה). שימושי כשהכותרת היא כותרת רשימה ולא שאלה, כמו `god`. טקסט ריק אחרי `|` הוא טעות.

Own question: `context: <step id> | <question>`. The text after `|` replaces the question taken from the target (its title, else its prompt). Use it when the title is a list heading, not a question (`god`). Nothing after `|` is an error.

```markdown
## choice: subclass
context: god | לאיזה אל אתה מתפלל?
```

### `count: <n>`

רק בסשן שני, ורק בשלב בחירה עם `multi: true`. מספר שלם מ-2 עד מספר האפשרויות: השחקן חייב לבחור בדיוק כך. סשן ראשון דוחה אותו ("unknown key").

Session Two only, on a `multi: true` choice step only. A whole number from 2 to the number of options: the player must pick exactly that many. Session One rejects it ("unknown key").

```markdown
## choice: mharoti_tools
multi: true
count: 2
```

תיבת הטקסט החופשי (`other: true`) לא נספרת ב-`n`: חובה לבחור בדיוק `n` אפשרויות, והטקסט החופשי הוא תוספת רשות.

The free-text box (`other: true`) does not count toward `n`: exactly `n` picks are required, and free text is an optional extra.

### `random: true`

רק בסשן שני, ורק בשלב בחירה יחיד. השלב מקבל כפתור "אקראי 🎲" שבוחר אחת מהאפשרויות הגלויות, והתשובה שנשמרת היא המזהה שנבחר. פלט: `random: true`. בכל מקום אחר זו טעות.

Session Two only, on a single-answer choice step only. The step gets a "random" button that draws one of the visible options; the stored answer is the drawn option id. Output: `random: true`. An error anywhere else.

```markdown
## choice: trait
random: true
```

### `when:` על אפשרות / `when:` on an option

רק בסשן שני. אפשרות מופיעה רק כשהתשובה האפקטיבית לשלב הנבדק שווה למזהה. אותן בדיקות כמו לשלב (שלב קודם, בחירה יחידה, ערך שהוא אפשרות). `= _else` על אפשרות הוא טעות, ולכל שלב חייבת להישאר לפחות אפשרות אחת בלי `when:`. הפלט: `when: { step, value }` על האפשרות.

Session Two only. An option shows only when the effective answer of the target step equals the id. Same checks as a step `when:` (earlier step, single-answer choice, value is an option). `= _else` on an option is an error, and every step keeps at least one option without `when:`. Output: `when: { step, value }` on the option.

```markdown
### 📚 ספרותי
id: bookish
when: background = sage
```

## שלבים משותפים / Shared steps

כל קובץ ב-`steps/` מכיל רק `## <סוג>: <מזהה>`: בלי כותרת `---`, בלי `### known` ו-`### secret`. הקבצים נטענים לפי סדר השמות, וכל דמות מקבלת את כל השלבים אחרי השלבים שלה. מזהה שחוזר אצל דמות אחת (בין שלביה לשלבים המשותפים) הוא טעות. ב-`when:` ו-`context:` של שלב משותף הבדיקה נעשית בנפרד לכל דמות.

Each file in `steps/` holds `## <type>: <id>` steps only: no front matter, no `### known` / `### secret`. Files load in name order, and every character gets every step after its own. An id repeated within one character's flow (own + shared) is an error. `when:` and `context:` in a shared step are checked once per character.

`steps/background-details.md` מכיל שלב פרטים אחד לכל רקע, ו-`details_other` לכל השאר / holds one details step per background and `details_other` for the rest:

```markdown
## text: details_other
when: background = _else
context: background
title: 📜 ספר/י עוד על הרקע שלך
prompt: איפה זה היה, עם מי, ומה נשאר לך ממנו היום?
```

רקע חדש בסשן ראשון או מונח `bg_*` חדש בלי שלב `details_<id>` מפיל את `npm test`. עד שמוסיפים שלב, השחקן יקבל את `details_other`.

A new Session One background or `bg_*` term with no `details_<id>` step fails `npm test`. Until the step exists, the player gets `details_other`.

### `## shared`: איפה השלבים המשותפים / where the shared steps go

בקובץ דמות אפשר לכתוב שורה `## shared` (כותרת בלי סוג ובלי מזהה, בלי מפתחות ובלי טקסט), לכל היותר פעם אחת. השלבים המשותפים נכנסים בדיוק שם. בלי השורה הם באים אחרי כל שלבי הקובץ. כך `trait`, `ideal`, `bond`, `flaw` יכולים לבוא אחרי שלבי `details_*`, ושלב אחרי השורה יכול לכתוב `when: details_sage = academy` או `when: background = ...` על אפשרות. שורה שנייה בקובץ, או `## shared` בקובץ ב-`steps/`, היא טעות. בסשן ראשון זו כותרת לא מוכרת.

A character file may hold one line `## shared` (a heading with no type or id, no keys, no text). The shared steps are inserted at that point; without it they come after all of the file's own steps. So `trait`, `ideal`, `bond`, `flaw` can follow the `details_*` steps, and a step after the line may use `when: details_sage = academy`, or an option `when: background = ...`. A second one in a file, or `## shared` in a `steps/` file, is an error. In Session One it is an unknown heading.

```markdown
## info: lore
from: session-one

## shared

## choice: trait
random: true
```

## מוסכמות בתוכן הנוכחי / Conventions in the current content

- **Characteristics** (`trait`, `ideal`, `bond`, `flaw`): per character, after the `## shared` line, 6 to 8 options each, `random: true`. The label is short, the PHB-style first-person sentence is the description, and an ideal's alignment is its subtitle. A test fails if any `details_*` or `msc_*` step comes after `trait`.
- **Turator** has no fixed background, so each characteristic has 3 options with no `when:` (ids `gen_*`) plus 4 options per background with `when: background = <id>`: 7 visible for any covered background, and only the 3 `gen_*` for free text.
- **Vilhelm's custom background** (`mharoti_scholar_criminal`): his own `msc_*` steps, each `when: background = mharoti_scholar_criminal`. Their terms are in `terms/proficiencies.md`: ids carry the prefixes `skill_`, `tool_`, `lang_`, `feat_`. Skills, tools, languages and feats use `category: concept`; no closer category exists.

## 🔒 סודות / Keep secrets out of shared steps

כל שחקן מקבל את כל השלבים המשותפים ואת השלבים הגלויים של כל הדמויות. לכן לא כותבים בהם עובדה שמופיעה רק ב-`### secret` של דמות כלשהי. שלב `from:` שמעתיק שלב מידע מביא איתו גם את ה-`secret` שלו, ושחקן אחר לא רואה אותו (כמו בסשן ראשון).

Every player receives every shared step and every character's non-secret steps. Do not use a fact that exists only in some character's `### secret` there. A `from:` step that copies an info step brings its `secret` along, and other players do not receive it (as in Session One).

שלב מידע של דמות בקובץ שלה (בלי `from:`) יכול להחזיק `### secret` ו-`image:` בתוכו, בדיוק כמו בסשן ראשון: רק השחקן של הדמות (וה-DM) מקבלים אותם.

A character's own info step (no `from:`) may hold a `### secret` and an `image:` inside it, exactly as in Session One: only that character's player (and the DM) receive them.
