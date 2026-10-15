# תוכן סשן שני / Session Two content

כל התוכן של סשן שני נמצא כאן, כקבצי Markdown, באותו פורמט של סשן ראשון. כאן רק מה שחדש. כל השאר (שלבים, אפשרויות, מונחים, הפניות `[[id]]`, קישורים) מתואר ב-[README של סשן ראשון](../session-one/README.md) ולא חוזר כאן.

All Session Two content lives here as Markdown, in the Session One format. This file only covers what is new. Everything else (steps, options, terms, `[[id]]` references, links) is in the [Session One README](../session-one/README.md) and is not repeated.

```
intro.md                    דף פתיחה אחד שכל שחקן רואה / the one page every player sees (like Session One's world.md)
characters/<id>.md          קובץ אחד לדמות; ה-id חייב להיות של דמות מסשן ראשון / one file per character; the id must be a Session One character
steps/*.md                  שלבים משותפים: כל דמות מקבלת אותם, אחרי השלבים שלה / shared steps: every character gets them after its own
terms/*.md                  מונחים של סשן שני, מתמזגים עם של סשן ראשון / Session Two terms, merged with Session One's
lists/<name>.md             רשימות משותפות, כמו בסשן ראשון (אין כרגע) / shared lists as in Session One (none yet)
```

אם יש טעות בקובץ, הדף מציג הודעה עם שם הקובץ ומספר השורה. סשן ראשון לא מושפע. סשן שני טוען קודם את סשן ראשון, אז טעות בתוכן של סשן ראשון מפילה גם אותו.

If a file has a mistake, the page shows a message with the file name and line number. Session One is not affected. Session Two loads Session One first, so a mistake in Session One content also stops Session Two.

## 🚀 לפני העלאה / Before deploy

מריצים `npm test` לפני `railway up`: הבדיקה טוענת את התיקייה הזו ואת של סשן ראשון, ונכשלת על כל טעות. מריצים גם `npm run check-terms`: הוא בודק את הקישורים של שתי התיקיות.

Run `npm test` before `railway up`: it loads this folder and Session One's, and fails on any mistake. Run `npm run check-terms` too: it checks the links of both folders.

## ⚠️ מזהים / Ids

אותו כלל כמו בסשן ראשון: אחרי ששחקנים ענו, לא משנים מזהה של שלב או אפשרות (`subclass`, `details_soldier`, `legion`...). התשובות השמורות מצביעות עליו. את מזהי הדמויות והשלבים של סשן ראשון אף פעם לא משנים, גם לא מכאן. עברית מותר לשנות תמיד.

Same rule as Session One: once players have answered, never change a step or option id (`subclass`, `details_soldier`, `legion`...). Saved answers point at it. Never change a Session One character or step id either. The Hebrew text can always change.

## קובץ דמות / A character file

```markdown
---
id: deq
background: soldier
---
```

(דוגמה: ב-`characters/deq.md` האמיתי יש רק `id: deq`, בלי רקע קבוע. / An example: the real `characters/deq.md` has only `id: deq`, no override.)

- `id` חובה, ופירושו דמות מסשן ראשון. `name`, `class`, `icon`, `order` אופציונליים: מה שחסר נלקח מקובץ הדמות של סשן ראשון, כך ששם הדמות נשמר במקום אחד. `order` חסר = המקום של הדמות בסשן ראשון.
- `background:` (רק כאן) קובע רקע לדמות. הוא גובר על כל תשובה: שלב הרקע נדלג, ושלב הפרטים מתאים לרקע הזה. הערך חייב להיות מזהה שיש לו מונח `bg_<id>` (בסשן ראשון או בסשן שני).
- `id` is required and names a Session One character. `name`, `class`, `icon` and `order` are optional: a missing one is taken from the Session One file with the same id, so a character's name lives in one place. A missing `order` means the character's Session One position.
- `background:` (this folder only) sets the character's background. It beats every answer: the background step is skipped and the details step follows this background. The value must be an id that has a `bg_<id>` term (Session One or Session Two).

## שלושה מפתחות חדשים בשלב / Three new step keys

אלה עובדים רק כאן. בסשן ראשון הם נדחים כ"unknown key".
They work only here. Session One rejects them as "unknown key".

### `from: session-one`

השלב הוא השלב של סשן ראשון עם אותו מזהה, מאותה דמות, מועתק כמו שהוא. אין בו שום מפתח אחר ואין `###` אפשרויות. סוג הכותרת חייב להתאים לסוג השלב המקורי. השלב מסומן `carry: true` ומדולג כשהרקע כבר ידוע.

The step is the Session One step with the same id from the same character, copied whole. It holds no other key and no `###` options. The heading type must match the original step's type. It is marked `carry: true` and skipped when the answer is already known.

```markdown
## choice: background
from: session-one
```

(`characters/deq.md`)

### `when: <step id> = <option id>`

השלב מופיע רק כשהתשובה לשלב `<step id>` היא האפשרות הזו. `= _else` מופיע כשיש תשובה (בחירה או טקסט חופשי) ואף `when:` אחר על אותו שלב לא מתאים לה. היעד חייב להיות שלב בחירה (לא `multi`) שמופיע מוקדם יותר בזרימה של הדמות. אסור שני שלבים עם אותו יעד ואותו ערך.

The step shows only when the answer to `<step id>` is that option. `= _else` shows when there is an answer (a pick or free text) and no other `when:` on the same step matches it. The target must be a choice step (not `multi`) earlier in the character's flow. Two steps may not share a target and a value.

```markdown
## choice: details_soldier
when: background = soldier
context: background
title: ⚔️ באיזה צבא שירתת?
```

(`steps/background-details.md`)

### `context: <step id>`

מעל האפשרויות מוצגת התשובה הקודמת לשלב הזה, לקריאה בלבד. היעד: שלב קודם בזרימה של סשן שני, או שלב בחירה או טקסט בקובץ הדמות של סשן ראשון (למשל `god`, `element`). שלב מידע לא נחשב.

Above the options the step shows the earlier answer to that step, read only. The target is an earlier step in the Session Two flow, or a choice or text step in the character's Session One file (for example `god`, `element`). An info step does not count.

```markdown
## text: details_other
when: background = _else
context: background
title: 📜 ספר/י עוד על הרקע שלך
```

(`steps/background-details.md`)

## שלבים משותפים / Shared steps

קבצים ב-`steps/*.md` מכילים כותרות `## <type>: <id>` בלבד: בלי front matter ובלי `### known` או `### secret`. הקבצים נטענים לפי סדר שמות. כל דמות מקבלת כל שלב משותף אחרי השלבים שלה, ו-`when:` ו-`context:` נבדקים לכל דמות בנפרד. מזהה שלב שמופיע פעמיים בזרימה של דמות אחת (שלה ושל המשותפים) הוא שגיאה.

Files in `steps/*.md` hold `## <type>: <id>` steps only: no front matter, no `### known` or `### secret`. Files load in name order. Every character gets every shared step after its own, and `when:` and `context:` are checked per character. A step id that appears twice in one character's flow (its own and the shared ones) is an error.

## 🔒 סודות לא נכנסים לשלבים משותפים / Keep secrets out of shared steps

כל שחקן מקבל את כל השלבים המשותפים, ואת כל השלבים שאינם סוד של כל דמות. לכן אסור להשתמש כאן בעובדה שמופיעה רק ב-`### secret` של דמות בסשן ראשון. השתמשו רק במה שפומבי: `world.md`, `### known`, טקסט של שלבים ואפשרויות, והסברי מונחים.

Every player receives every shared step, and every character's non-secret steps. So never use a fact that appears only in a character's `### secret` in Session One. Use only what is public: `world.md`, `### known`, step and option text, and term blurbs.

## מונחים / Terms

`terms/*.md` באותו פורמט כמו בסשן ראשון. מזהה מונח שכבר קיים בסשן ראשון (או בקובץ אחר כאן) הוא שגיאה, והיא מציינת את שני המקומות. את `content/session-one/` לא עורכים מכאן.

`terms/*.md` use the Session One format. A term id that already exists in Session One (or in another file here) is an error, and the message names both places. Never edit `content/session-one/` from here.
