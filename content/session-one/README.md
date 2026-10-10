# תוכן סשן ראשון / Session One content

כל הדמויות והלור של סשן ראשון נמצאים כאן, כקבצי Markdown. עורכים, שומרים, מרעננים את הדף. אין צורך להפעיל מחדש את השרת.

All Session One characters and lore live here as Markdown. Edit, save, refresh the page. No server restart.

```
world.md                    מה כולם יודעים על העולם / the world page every player sees
characters/<id>.md          דמות אחת לכל קובץ / one character per file
lists/<name>.md             רשימת אפשרויות משותפת / a shared option list (use: <name>)
terms/<any>.md              מונחים: אלים, מקומות, גזעים... / terms: gods, places, races...
```

אם יש טעות בקובץ, הדף מציג הודעה עם שם הקובץ ומספר השורה.
If a file has a mistake, the page shows a message with the file name and line number.

## 🚀 לפני העלאה / Before deploy

מריצים `npm test` לפני `railway up`. הבדיקה טוענת את כל התיקייה הזו ונכשלת על כל טעות בתוכן, כולל הפניה למונח שלא קיים.

מריצים גם `npm run check-terms`: הוא פונה לכל תמונה וקישור של מונחים ולכל קישור של שלבים, ומציג את הקישורים השבורים עם קובץ ומספר שורה (יציאה 1). איטי, צריך רשת; 403/429 מאתרים שחוסמים בוטים מדווח כ-"blocked" ואינו נחשב כשל.

Run `npm test` before `railway up`. It loads this whole folder and fails on any content mistake, including a reference to a term that does not exist.

Run `npm run check-terms` too: it requests every term image and link and every step link, and lists dead ones with file and line (exit 1). Slow, needs network; 403/429 from bot-blocking hosts is reported as "blocked" and does not fail.

## ⚠️ מזהים / Ids

מזהים (`id`) באנגלית בלבד: אותיות קטנות, ספרות ו-`_`. אחרי ששחקנים ענו, לא משנים מזהה של דמות, שלב או אפשרות: התשובות השמורות מצביעות עליו. את הטקסט בעברית מותר לשנות תמיד.

Ids are Latin lowercase, digits and `_`. Once players have answered, never change a character, step or option id: saved answers point at it. The Hebrew text can always change.

## קובץ דמות / A character file

```markdown
---
id: deq
name: דק
class: ברברי
icon: sword
order: 2
---

# דק

## text: left_behind
prompt: מה גרם לך לעזוב, ומה השארת מאחור?
```

- `icon`: שם מתוך / a name from `public/shared/icons.js` (sword, shield, hat, mask...).
- `order`: המיקום ברשימת הדמויות / position in the character list.
- `# כותרת` היא רק בשבילך ולא מוצגת / `# Title` is for the reader only.
- `<!-- הערה -->` לא מוצגת / an HTML comment is ignored.

## שלב / A step

כל שלב מתחיל ב-`## <סוג>: <מזהה>`, והשלבים מוצגים לפי הסדר בקובץ. מיד אחריו שורות `מפתח: ערך`:

Each step starts with `## <type>: <id>`, shown in file order, followed by `key: value` lines:

| key | |
| --- | --- |
| `title` | כותרת; כשיש כותרת, ה-prompt מוצג מתחתיה כפתיח / heading; the prompt then shows under it |
| `prompt` | השאלה / the question |
| `hint` | שורה קטנה מתחת לשאלה / a smaller line under it |
| `optional: true` | כפתור "דלג" / a skip button |
| `multi: true` | בחירה: אפשר כמה / choice: several picks |
| `other: false` | בחירה: בלי תיבת "משהו אחר" (שמופיעה כברירת מחדל) / choice: hide the free-text box (shown by default) |
| `link: [כותרת —] https://…` | בחירה/שאלה פתוחה: קישור חיצוני אחד מתחת לתשובה (לא ב-info); בלי כותרת מוצג שם האתר; ב-`lists/` זה ברירת מחדל / choice/text: one external link under the answer (not on info); no title shows the host; in `lists/` it is a default |
| `use: <list>` | בחירה: האפשרויות מ-`lists/<list>.md` / choice: options from a shared list |
| `use: <list>` (in `### known`/`### secret`) | info: פריטי לור משותפים מ-`lists/<list>.md` / info: shared lore bullets, listed first |

כל ערך הוא שורה אחת. / Each value is one line.

### text: שאלה פתוחה / free text

```markdown
## text: magic_dream
prompt: מהי תעלומה קסומה אחת שהיית רוצה לפתור?
optional: true
link: הרשימה המלאה (באנגלית) — https://www.dndbeyond.com/backgrounds
```

### choice: בחירה / pick from options

כל אפשרות היא `### <אימוג'י> <שם>`. מתחתיה `id:` (חובה כשהשם בעברית), `subtitle:` אם רוצים, ואז שורה ריקה ופסקת התיאור. אפשרות עם תיאור מוצגת ככרטיס.

Each option is `### <emoji> <label>`. Under it: `id:` (required when the label is Hebrew), an optional `subtitle:`, then a blank line and the description paragraph(s). Options with a description render as cards. The emoji is optional.

**`term: <id>`** (אם רוצים) מקשר את האפשרות למונח מ-`terms/` (ראו "מונחים" למטה). ליד הכרטיס מופיע כפתור מידע (ⓘ) שפותח את חלון המונח, בלי לבחור את הכרטיס, והשם מקבל את האנגלית: "בהאמוט (Bahamut)". **לא כותבים את האנגלית בסוגריים בשם האפשרות** (`### חייל (Soldier)`): היא תופיע פעמיים. מזהה מונח שלא קיים הוא טעות. מונח בלי תיאור, תמונה וקישור מוסיף רק את האנגלית, בלי כפתור מידע.

**`term: <id>`** (optional) links the option to a term in `terms/` (see "Terms" below). The card gets an info button (ⓘ) beside it that opens the term popup without selecting the card, and the label gets the English name: "בהאמוט (Bahamut)". **Do not type the English in parentheses in the label** (`### חייל (Soldier)`): it would show twice. An unknown term id is a mistake. A name-only term (no blurb, image or link) adds only the English, with no info button.

```markdown
## choice: allegiance
prompt: עם מי אתה נלחם?

### 🕯️ תא מורדים
id: cell

אתה חלק מקבוצת מורדים בתוך האימפריה.

### 🌑 נוקם בודד
id: lone
subtitle: בלי אף אחד

אתה פועל לבד.
```

### info: דף מידע / read-only lore

שום דבר לא נשמר. `### known` הוא "מה כולם יודעים", `### secret` הוא "🤫 מה רק אתה יודע": רק השחקן שבחר בדמות (וה-DM) מקבלים אותו. כל פריט הוא `- **כותרת** טקסט`; הכותרת לא חובה.

Nothing is saved. `### known` is what everyone knows; `### secret` reaches only the player who picked this character (and the DM). Each item is `- **title** text`; the title is optional.

```markdown
## info: lore
title: קוסם אנושי באימפריית הדרקון

### known

- **סיכון ביטחוני** קוסם אנושי הוא "עבד שמנסה לקנות כוח של דרקון בספרים".

### secret

- אתה יודע איפה המנהרה שעוקפת את השערים.
```

גם פריטי לור משותפים כתובים פעם אחת: קובץ ב-`lists/` שכולו שורות `- **כותרת** טקסט`. שורה `use: <name>` בתוך `### known` או `### secret` מוסיפה את הפריטים שלו בראש הסעיף, לפני הפריטים של הדמות עצמה.

Shared lore bullets are written once too: a `lists/<name>.md` file of `- **title** text` lines. A `use: <name>` line inside `### known` or `### secret` puts those bullets first, before the character's own.

```markdown
### secret

use: faith-secret

- **המסדרים השבורים** סוד שרק לטוראטור יש.
```

`world.md` הוא שלב info אחד (`## info: common_lore`) שכל השחקנים רואים.
`world.md` is a single info step (`## info: common_lore`) every player sees.

## רשימה משותפת / A shared list

אפשרויות שכמה דמויות משתמשות בהן כתובות פעם אחת ב-`lists/<name>.md`: אפשרויות `###` כמו בשלב בחירה, ומעליהן, אם רוצים, `title:` / `prompt:` שיהיו ברירת המחדל. שלב שכותב `use: <name>` מקבל אותן, ויכול לדרוס את ה-title / prompt.

Options several characters share are written once in `lists/<name>.md`: `###` options as in a choice step, optionally with default `title:` / `prompt:` above them. A step with `use: <name>` gets them and may override title / prompt.

`lists/gods.md`:

```markdown
title: חמישה אלים שתוכלו לבחור בהם
prompt: אז מי מדבר אליכם?

### 🐉 בהאמוט
id: bahamut
term: bahamut
subtitle: דרקון הפלטינה

אל הצדק, הכבוד, ההגנה והדרקונים הטובים.
```

`characters/tenni.md`:

```markdown
## choice: god
use: gods
```

## מונחים / Terms

מונח הוא דבר בעולם שיש לו שם: אל, מקום, גזע, מקצוע, פלג, דמות, מושג או רקע. כל מונח כתוב פעם אחת בקובץ בתיקייה `terms/`. את שמות הקבצים בוחרים חופשי (למשל `gods.md`, `places.md`); השורה `category:` קובעת את הקטגוריה, לא הקובץ.

A term is a named thing in the world: a god, place, race, class, faction, person, concept or background. Each term is written once, in a file under `terms/`. File names are free (e.g. `gods.md`, `places.md`); the `category:` line sets the category, not the file.

```markdown
# אלים

<!-- sources: ...; uncertain: ... (הערות בשבילך, לא מוצגות / notes for you, not shown) -->

### ולס
id: veles
en: Veles
category: god
aliases: וֶלֶס, נחש-העולם
image: https://example.org/veles.jpg
link: Midgard Wiki — https://example.org/wiki/Veles

נחש-העולם, שמתפתל סביב קצה הדיסקה. אבי [[baal]].
```

| key | |
| --- | --- |
| `### <שם>` | השם בעברית, בלי אימוג'י / the Hebrew name, no emoji |
| `id` | חובה. אותיות לטיניות קטנות, ספרות ו-`_`, ייחודי בכל קבצי המונחים / required; Latin lowercase, digits, `_`; unique across all term files |
| `en` | חובה. השם באנגלית / required; the English name |
| `category` | חובה. אחת מהקטגוריות בטבלה למטה / required; one of the categories below |
| `aliases` | שמות או כתיבים אחרים, מופרדים בפסיק / other names or spellings, comma-separated |
| `image` | כתובת `https://` של תמונה, עד 3 שורות (הבאות הן גיבוי) / an `https://` image URL, up to 3 lines (the later ones are fallbacks) |
| `link` | `כותרת — https://...` (הכותרת לא חובה), אפשר כמה שורות / `title — https://...` (title optional), can repeat |
| תיאור / blurb | אחרי שורה ריקה, פסקאות בעברית. אפשר להפנות בהן למונחים אחרים / after a blank line, Hebrew paragraphs; may reference other terms |

רק כתובות `https://`. כל מפתח חוץ מ-`image` ו-`link` מופיע פעם אחת. מונח בלי תיאור, תמונה וקישור מוסיף רק את השם באנגלית.

Only `https://` URLs. Each key except `image` and `link` appears once. A term with no blurb, image or link only adds the English name.

| `category` | עברית / Hebrew |
| --- | --- |
| `race` | גזע |
| `class` | מקצוע |
| `place` | מקום |
| `god` | אל |
| `faction` | פלג |
| `person` | דמות |
| `concept` | מושג |
| `background` | רקע |

### הפניה למונח / A term reference

בטקסט כותבים `[[id]]`, והדף מציג את השם בעברית של המונח. כשהמילה בטקסט שונה (נטייה, כתיב אחר), כותבים `[[id|הטקסט]]`. אות שימוש נשארת מחוץ לסוגריים:

In the text, write `[[id]]` and the page shows the term's Hebrew name. When the word differs (an inflection, another spelling), write `[[id|the text]]`. A prefix letter stays outside the brackets:

```markdown
- **דיסקה צפה** סביב הקצה מתפתל [[veles]] נחש-העולם.
- דת המדינה היא אלי הדרקונים, [[baal]] ו[[veles|וֶלֶס]].
```

- **איפה מותר / Where allowed:** `title`, `prompt`, `hint`, פריטי לור (כותרת וטקסט, גם ב-`lists/`), שם אפשרות, `subtitle` ותיאור, ותיאור של מונח. בשום מקום אחר (front matter, `id`, `use`, `term` של אפשרות, מפתחות של מונח) / `title`, `prompt`, `hint`, lore bullets (title and text, `lists/` too), option label, `subtitle` and description, and term blurbs. Nowhere else (front matter, `id`, `use`, option `term`, term keys).
- **הפניה מתחילה ונגמרת באותה שורה / A reference starts and ends on one line.**
- **מזהה שלא קיים הוא טעות / An unknown id is a mistake:** הדף מציג את הודעת השגיאה עם קובץ ושורה, ו-`npm test` נכשל / the page shows the error with file and line, and `npm test` fails.
- **הדף לא מחפש שמות בטקסט / The page never searches the text for names:** רק מה שמסומן ב-`[[...]]` הוא הפניה / only `[[...]]` marks a reference.

### מונחים וסודות / Terms and secrets

כל שחקן מקבל רק את המונחים שהתוכן שלו מגיע אליהם: הפניות בטקסט שהוא רואה, `term:` של אפשרויות, ומונחים שהתיאורים של אלה מפנים אליהם. מונח שרק `### secret` של דמות מפנה אליו מגיע רק לשחקן של הדמות הזו (ול-DM). **אבל התיאור של מונח גלוי לכל שחקן שמקבל את המונח**, אז לא כותבים סודות בתיאור של מונח: כתבו את הסוד ב-`### secret` של הדמות.

Each player gets only the terms their content reaches: references in text they see, option `term:` values, and the terms those terms' blurbs reference. A term that only a character's `### secret` references reaches only that character's player (and the DM). **But a term's blurb is seen by every player who gets the term**, so keep secrets out of term blurbs: write the secret in the character's `### secret`.

### השם באנגלית / The English name

בכל מסך, בפעם הראשונה שמונח מופיע, הדף מוסיף אחריו את השם באנגלית מהשורה `en:`, למשל "ולס (Veles)". **לא כותבים את האנגלית בסוגריים ביד**: היא תופיע פעמיים.

On each screen, the first time a term appears, the page adds its English name from the `en:` line after it, e.g. "ולס (Veles)". **Do not type the English in parentheses by hand**: it would show twice.

### שינוי מזהה של מונח / Renaming a term id

שום תשובה של שחקן לא שומרת מזהה של מונח, אז מותר לשנות אותו, בתנאי שמשנים גם כל הפניה אליו. `npm test` מראה כל הפניה שנשארה בלי מונח. (מזהים של דמות, שלב ואפשרות: לא משנים, כמו למעלה.)

No player answer saves a term id, so it may change if every reference to it changes too. `npm test` lists every reference left without a term. (Character, step and option ids: never change them, as above.)

## עריכה מהדפדפן / Editing from the browser

הרצה עם `npm run dev:lore`. השרת כותב ישר לקבצים המקומיים; שינוי דורש commit ידני, ו**צריך לעשות commit לפני `railway up`**. מצב עריכה כבוי ב-Railway.

Start with `npm run dev:lore`. The server writes to the local files; an edit needs a manual commit, and **commit before `railway up`**. Edit mode is off on Railway.

File editor: in the DM lore view, each character, `world.md` and shared list has an edit link, and the "קבצים" section opens any file or creates a new one (`/session-one/<CODE>/dm/lore/file?key=&file=`).

Inline editing: in the DM lore view, each step header, bullet, choice option and term has a pencil that edits its fields in place (`PUT /api/s1/lore-field`); a shared list item says which characters it appears under.

API (DM key): `GET/PUT/POST /api/s1/lore-file?code=&key=`; `PUT` sends `{ file, hash, text }`, `POST` creates `{ file, text }`.

## תשובות שמורות / Saved answers (for the code)

`answers[<step id>]`: text = string; choice = option id, or an array with `multi: true`; free text in `answers["<step id>_other"]`; a skipped step has no key. Parser: `session-one-content.js`; served at `GET /api/s1/content`.
