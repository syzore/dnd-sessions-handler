# תוכן סשן ראשון / Session One content

כל הדמויות והלור של סשן ראשון נמצאים כאן, כקבצי Markdown. עורכים, שומרים, מרעננים את הדף. אין צורך להפעיל מחדש את השרת.

All Session One characters and lore live here as Markdown. Edit, save, refresh the page. No server restart.

```
world.md                    מה כולם יודעים על העולם / the world page every player sees
characters/<id>.md          דמות אחת לכל קובץ / one character per file
lists/<name>.md             רשימת אפשרויות משותפת / a shared option list (use: <name>)
```

אם יש טעות בקובץ, הדף מציג הודעה עם שם הקובץ ומספר השורה.
If a file has a mistake, the page shows a message with the file name and line number.

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
| `use: <list>` | בחירה: האפשרויות מ-`lists/<list>.md` / choice: options from a shared list |

כל ערך הוא שורה אחת. / Each value is one line.

### text: שאלה פתוחה / free text

```markdown
## text: magic_dream
prompt: מהי תעלומה קסומה אחת שהיית רוצה לפתור?
optional: true
```

### choice: בחירה / pick from options

כל אפשרות היא `### <אימוג'י> <שם>`. מתחתיה `id:` (חובה כשהשם בעברית), `subtitle:` אם רוצים, ואז שורה ריקה ופסקת התיאור. אפשרות עם תיאור מוצגת ככרטיס.

Each option is `### <emoji> <label>`. Under it: `id:` (required when the label is Hebrew), an optional `subtitle:`, then a blank line and the description paragraph(s). Options with a description render as cards. The emoji is optional.

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
subtitle: דרקון הפלטינה

אל הצדק, הכבוד, ההגנה והדרקונים הטובים.
```

`characters/tenni.md`:

```markdown
## choice: god
use: gods
```

## תשובות שמורות / Saved answers (for the code)

`answers[<step id>]`: text = string; choice = option id, or an array with `multi: true`; free text in `answers["<step id>_other"]`; a skipped step has no key. Parser: `session-one-content.js`; served at `GET /api/s1/content`.
