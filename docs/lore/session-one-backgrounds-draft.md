# Session One: background options (draft)

Draft for a new `## choice: background` step per character. Research only, nothing in `content/` changed.
Verified 2026-10-10 with `curl -sL` (status + page title/content check). Sources: Open5e API v2 (`https://api.open5e.com/v2/backgrounds/`) for Kobold Press *Tome of Heroes*; dnd5e.wikidot.com / dnd2024.wikidot.com for the text of WotC backgrounds; D&D Beyond `/backgrounds` listing for the existence and source of each one.

## Conventions used

- **Option ids use `_`, not kebab-case.** `content/session-one/README.md` ("Ids are Latin lowercase, digits and `_`") and every existing id (`sunder_bone`, `free_realm`, `kaanesh_outcasts`) use underscores. So `folk_hero`, not `folk-hero`. If a background repeats across characters, it keeps the same id.
- **Step id `background`: no collision.** Existing step ids:
  - bebby: `lore`, `origin`, `past_contact`, `rogue_type`, `rogue_lean`
  - deq: `lore`, `tribe`, `left_behind`, `how_joined`, `on_evoker`, `rage_style`
  - tenni: `lore`, `god`, `training`, `why`
  - turator: `lore`, `god`, `training`, `why`, `vibe`
  - vilhelm: `lore`, `magic_origin`, `magic_dream`, `element`, `allegiance`, `goal`
  - None of them is `background` or `background_other` (the key for the free-text answer).
- **Race/class as the content states it.** `class:` comes from the frontmatter. Race comes from the lore `title:`. Tenni and Turator have no race in the content (their titles say only "כוהן/פלדין באימפריית הדרקון", and both files have a `TODO: Aviv fills this in` comment).
- **Hebrew terms reused from the content:** ג'מבוקה, מורזה, האימפריה המהארוטית, הרקש, נוריה נטאל, שבע הערים, קסילון, בני-ענק, לוחמי זירה, מבריח, מלומדים. I avoided `נוכל` as a background label because it is the rogue class name (bebby's `class: נוכל`). Charlatan is `רמאי`, to match bebby's existing `con` option, "🦊 הרמאי".

## Full-list URL (for the "other" box)

| | URL | Check |
| --- | --- | --- |
| **Primary (recommended)** | https://www.dndbeyond.com/backgrounds | 200, title "Character Backgrounds for D&D Fifth Edition (5e) - D&D Beyond", 169 background links in the HTML, 2014 and 2024 rules, all official books |
| Fallback | https://dnd5e.wikidot.com/ (home page, "Backgrounds" tab) | 200, 102 `background:` links, full free text (2014 rules) |

Why D&D Beyond: it is the official first-party catalogue and the most complete (both editions plus every setting book), and it has been at the same URL for years. Caveat: the listing shows name, book and skills, but no description. For most non-SRD entries, the detail page sends you with a 303 to the marketplace (`marketplace.dndbeyond.com/category/players-handbook`). Players can browse the list but can't read most entries without owning the book. Wikidot has the full text for free, but it is community-run, unofficial and covers 2014 only (for 2024 the matching page is https://dnd2024.wikidot.com/background:all, 200, 71 links).
Ruled out: `dnd5e.wikidot.com/backgrounds` (404), `dnd5e.wikidot.com/background:all` (404), the 5e SRD (5.1 has only Acolyte and 5.2 only 4 backgrounds, per Open5e), and `open5e.com/backgrounds` (renders with JS, and returns 200 even for ids that don't exist, so a status check proves nothing).

Per-option links below point to wikidot / Open5e because those pages are readable without an account. For the free SRD backgrounds, D&D Beyond also works: `7-acolyte`, `11-sage`, `12-soldier`, `9-folk-hero` (2014) and `406474-criminal`, `406475-acolyte`, `406485-sage`, `406488-soldier` (2024), all 200 with content.

---

## bebby: חצי-אדם נוכל
### criminal
- he: פושע (Criminal)
- en: Criminal
- source: 2014 PHB, 2024 PHB
- description: חיית מחוץ לחוק: גניבות, הברחות ועסקאות עם העולם התחתון. יש לך אנשי קשר שיודעים להעביר הודעה או סחורה בלי שאלות.
- fit: מתאים לבזארים של הרקש, לרכיבים האסורים ולגילדת הגנבים. בגרסת 2014 יש וריאנט "מרגל", שמתאים ל"מרגל מארץ זרה".
- link: https://dnd5e.wikidot.com/background:criminal

### urchin
- he: ילד רחוב (Urchin)
- en: Urchin
- source: 2014 PHB
- description: גדלת לבד ברחובות העיר, בלי משפחה ובלי כסף. אתה מכיר כל סמטה וכל קיצור דרך, ויודע לחיות מכלום.
- fit: חצי-אדם שגדל ברובעי המשרתים, כמו רייוולד הקטנה, ולמד לשרוד ברחוב (`origin: street`).
- link: https://dnd5e.wikidot.com/background:urchin

### charlatan
- he: רמאי (Charlatan)
- en: Charlatan
- source: 2014 PHB, 2024 PHB
- description: אתה חי מעקיצות, תחפושות וזהויות בדויות. יש לך שם ומסמכים של מישהו אחר, למקרה שתצטרך להיעלם.
- fit: זהות בדויה היא כרטיס מילוט טוב לג'מבוקה שבורח דרומה לנוריה נטאל או מערבה לשבע הערים (`origin: con`).
- link: https://dnd5e.wikidot.com/background:charlatan

### desert_runner
- he: נווד מדבר (Desert Runner)
- en: Desert Runner
- source: Kobold Press Tome of Heroes
- description: גדלת במדבר, בין שבילי השיירות, וזזת ממקום למקום. אתה מסתפק במעט מים ומכיר את המדבר טוב יותר מכל עיר.
- fit: מבריח מדבר שמריץ סחורה בשבילי הגבול, הרחק מעיני הלגיונות (`rogue_type: desert`).
- link: https://open5e.com/backgrounds/toh_desert-runner

### court_servant
- he: משרת חצר (Court Servant)
- en: Court Servant
- source: Kobold Press Tome of Heroes
- description: פעם שירתת סוחר, אציל או שליט, ולמדת להיות תמיד זמין ואף פעם לא בולט. עכשיו אתה חופשי, ואתה עדיין יודע לעבור בחדר בלי שאיש ישים לב.
- fit: חצאי-אדם נזרקים לרובעי משרתים. משרת ג'מבוקה בבית של מורזה שומע הכול (`origin: rich`).
- link: https://open5e.com/backgrounds/toh_court-servant

## deq: בן-ענק ברברי
(Race label: the lore title is "בן ענקים". The `tribe` step and `goliath-tribes.md` call him גוליית.)

### giant_foundling
- he: אסופי של ענקים (Giant Foundling)
- en: Giant Foundling
- source: other (Bigby Presents: Glory of the Giants, WotC 2023)
- description: גדלת בין ענקים או ליד חורבות שלהם, והגודל וההשפעה שלהם עיצבו אותך. אתה מרגיש בבית בין דברים ענקיים, ונושא בתוכך מסורות עתיקות של ענקים.
- fit: הכי קרוב ללור של דק: קסילון, האימפריות של הענקים שנפלו, ורוח אדוני הענקים שמתעוררת בזעם שלו.
- link: https://dnd5e.wikidot.com/background:giant-foundling

### outlander
- he: איש הפרא (Outlander)
- en: Outlander
- source: 2014 PHB
- description: גדלת הרחק מהערים, בהרים, ביערות או בערבות. אתה יודע למצוא מזון ומים ולא ללכת לאיבוד בשטח.
- fit: מתאים למי שירד מההרים (`how_joined: mountains`) ולשבטי ההרים או רוכבי-האבן.
- link: https://dnd5e.wikidot.com/background:outlander

### soldier
- he: חייל (Soldier)
- en: Soldier
- source: 2014 PHB, 2024 PHB
- description: שירתת בצבא, למדת משמעת, שרשרת פיקוד ומה זה קרב אמיתי. חיילים אחרים מזהים את הדרגה שלך, גם אם ברחת.
- fit: ענקי הגבעות הם חיל הלם בשורה הראשונה של לגיונות הדרקון. דק הוא מגויס שברח (`how_joined: conscript`).
- link: https://dnd5e.wikidot.com/background:soldier

### gladiator
- he: לוחם זירה (Gladiator)
- en: Gladiator
- source: 2014 PHB (variant of Entertainer)
- description: נלחמת מול קהל צועק, והפכת את הקרב להופעה. בכל עיר יש מישהו שמוכן לשלם כדי לראות אותך נלחם.
- fit: גוליית ג'מבוקה הוא "רכוש של הזירה" (`tribe: jambuka`). את החופש שלו היה צריך לקחת בעצמו.
- link: https://dnd5e.wikidot.com/background:entertainer

### sage
- he: מלומד (Sage)
- en: Sage
- source: 2014 PHB, 2024 PHB
- description: בילית שנים בלימוד: ספרים, מגילות ושאלות שאין עליהן תשובה. כשאתה לא יודע משהו, אתה יודע איפה לחפש.
- fit: "ההפתעה של התא": כולם מצפים לזולל חסר מחשבה, ודק יודע לקרוא את הכתובות בחורבות קסילון.
- link: https://dnd5e.wikidot.com/background:sage

## tenni: (race not stated) כוהן
### acolyte
- he: משרת מקדש (Acolyte)
- en: Acolyte
- source: 2014 PHB, 2024 PHB
- description: שירתת במקדש וגדלת בתוך הטקסים והתפילות. מאמינים אחרים יתנו לך מחסה ועזרה.
- fit: מתאים למקדשים הסודיים מתחת לבארות ולרשת המאמינים שמסתתרת מהאינקוויזיטורים.
- link: https://dnd5e.wikidot.com/background:acolyte

### sage
- he: מלומד (Sage)
- en: Sage
- source: 2014 PHB, 2024 PHB
- description: בילית שנים בלימוד: ספרים, מגילות ושאלות שאין עליהן תשובה. כשאתה לא יודע משהו, אתה יודע איפה לחפש.
- fit: מי שמחפש את מיתוסי הבריאה שנמחקו מהרשומות הקיסריות.
- link: https://dnd5e.wikidot.com/background:sage

### hermit
- he: מתבודד (Hermit)
- en: Hermit
- source: 2014 PHB, 2024 PHB
- description: חיית שנים בבדידות, הרחק מאנשים. שם גילית אמת גדולה, שאחרים לא יודעים או לא רוצים לדעת.
- fit: אפשר לחשוב שהגילוי של טני הוא האמת שהדרקונים מחקו: אלי הבריאה האמיתיים.
- link: https://dnd5e.wikidot.com/background:hermit

### occultist
- he: חוקר הנסתר (Occultist)
- en: Occultist
- source: Kobold Press Tome of Heroes
- description: אתה מאמין בדברים שאחרים מבטלים, ומחפש סודות בחורבות, בכתות ובספרים נשכחים. אתה מכיר אנשים שחיים בשולי החברה ויודעים דברים אסורים.
- fit: אמונה אסורה, פולחנים חבויים וחוק המסכות, שבגללו אותו אל מופיע בשמות שונים.
- link: https://open5e.com/backgrounds/toh_occultist

### charlatan
- he: רמאי (Charlatan)
- en: Charlatan
- source: 2014 PHB, 2024 PHB
- description: אתה חי מעקיצות, תחפושות וזהויות בדויות. יש לך שם ומסמכים של מישהו אחר, למקרה שתצטרך להיעלם.
- fit: חוק המסכות בפועל: מאמין שמסתתר מאחורי פטרון מסחר מאושר ומחזיק זהות כפולה מול האינקוויזיטורים.
- link: https://dnd5e.wikidot.com/background:charlatan

## turator: (race not stated) פלדין
### knight_of_the_order
- he: אביר מסדר (Knight of the Order)
- en: Knight of the Order
- source: other (Sword Coast Adventurer's Guide, WotC 2015)
- description: אתה חבר במסדר אבירים שנשבע לאידיאל או לאל. בני המסדר שלך יתנו לך מחסה ועזרה בכל מקום.
- fit: המסדרים השבורים: פלגים קטנים עדיין מסתתרים לאורך הגבולות, במגדר ובנוריה נטאל.
- link: https://dnd5e.wikidot.com/background:knight-of-the-order

### acolyte
- he: משרת מקדש (Acolyte)
- en: Acolyte
- source: 2014 PHB, 2024 PHB
- description: שירתת במקדש וגדלת בתוך הטקסים והתפילות. מאמינים אחרים יתנו לך מחסה ועזרה.
- fit: מכיר את הקודים של מחבואי המאמינים: לחיצות יד סודיות וסימני גיר על פתחי בארות.
- link: https://dnd5e.wikidot.com/background:acolyte

### soldier
- he: חייל (Soldier)
- en: Soldier
- source: 2014 PHB, 2024 PHB
- description: שירתת בצבא, למדת משמעת, שרשרת פיקוד ומה זה קרב אמיתי. חיילים אחרים מזהים את הדרגה שלך, גם אם ברחת.
- fit: לוחם שעמד מול הכיבושים של האימפריה, או ערק מלגיון מהארוטי אל האמונה.
- link: https://dnd5e.wikidot.com/background:soldier

### folk_hero
- he: גיבור העם (Folk Hero)
- en: Folk Hero
- source: 2014 PHB
- description: באת מאנשים פשוטים, ועשית משהו שהפך אותך לגיבור בעיניהם. פשוטי העם יסתירו אותך ויעזרו לך.
- fit: פלדין ג'מבוקה שהגן על הכפר שלו מאוכפי האימפריה. המחתרת מוכנה להסתיר אותו.
- link: https://dnd5e.wikidot.com/background:folk-hero

### destined
- he: בעל ייעוד (Destined)
- en: Destined
- source: Kobold Press Tome of Heroes
- description: יש עליך חובה גדולה: תואר, שבועה, ירושה או תפקיד. אתה בדרך אליה, או בורח ממנה, והסיפור שלך הולך לפניך.
- fit: פלדין מוגדר על ידי השבועה שלו. אולי הוא אחרון מסדר שבור, שנשא את חובתו לבד.
- link: https://open5e.com/backgrounds/toh_destined

## vilhelm: אנושי קוסם
### sage
- he: מלומד (Sage)
- en: Sage
- source: 2014 PHB, 2024 PHB
- description: בילית שנים בלימוד: ספרים, מגילות ושאלות שאין עליהן תשובה. כשאתה לא יודע משהו, אתה יודע איפה לחפש.
- fit: קוסמות נלמדת מספרים (`magic_origin: academy / apprentice`).
- link: https://dnd5e.wikidot.com/background:sage

### scribe
- he: לבלר (Scribe)
- en: Scribe
- source: 2024 PHB
- description: עבדת כמעתיק, מנהל חשבונות או פקיד, ולמדת לכתוב בדיוק ולשים לב לכל פרט. אף אחד לא מסתכל פעמיים על פקיד עם פנקס.
- fit: האימפריה משתמשת בקוסמים אנושיים כמנהלי חשבונות. ספר הלחשים של וילהלם מוסווה כפנקס של סוחר.
- link: https://dnd2024.wikidot.com/background:scribe

### occultist
- he: חוקר הנסתר (Occultist)
- en: Occultist
- source: Kobold Press Tome of Heroes
- description: אתה מאמין בדברים שאחרים מבטלים, ומחפש סודות בחורבות, בכתות ובספרים נשכחים. אתה מכיר אנשים שחיים בשולי החברה ויודעים דברים אסורים.
- fit: נודד סקרן או חבר באגודה סודית (`magic_origin: wanderer / society`) שמחפש ידע אסור.
- link: https://open5e.com/backgrounds/toh_occultist

### criminal
- he: פושע (Criminal)
- en: Criminal
- source: 2014 PHB, 2024 PHB
- description: חיית מחוץ לחוק: גניבות, הברחות ועסקאות עם העולם התחתון. יש לך אנשי קשר שיודעים להעביר הודעה או סחורה בלי שאלות.
- fit: קוסם לא רשום הוא פושע מעצם קיומו, ותלוי ברשת ההברחה כדי להשיג גופרית, גואנו עטלפים וחוטי נחושת.
- link: https://dnd5e.wikidot.com/background:criminal

### hermit
- he: מתבודד (Hermit)
- en: Hermit
- source: 2014 PHB, 2024 PHB
- description: חיית שנים בבדידות, הרחק מאנשים. שם גילית אמת גדולה, שאחרים לא יודעים או לא רוצים לדעת.
- fit: לימד את עצמו מספר אסור (`magic_origin: book`), הרחק מעיני ציידי הקוסמים.
- link: https://dnd5e.wikidot.com/background:hermit

---

## Glossary candidates

These are the backgrounds whose English name doesn't explain itself, or that come from outside the PHB. Self-explanatory ones (soldier, criminal, sage) can skip the popup.

```yaml
- id: giant_foundling
  category: background
  he: אסופי של ענקים
  en: Giant Foundling
  blurb: רקע של מי שגדל בין ענקים או בצל החורבות שלהם. הגודל, הכוח והמסורות של הענקים עיצבו אותו מילדות. במידגארד זה מתחבר לאימפריות הענקים שנפלו ולקסילון, עיר האגדה של ענקי הגבעות.
  image: none
  links: [https://dnd5e.wikidot.com/background:giant-foundling, https://www.dndbeyond.com/backgrounds/343060-giant-foundling]
  sources: [Bigby Presents: Glory of the Giants (WotC 2023)]
  uncertain: the D&D Beyond detail page redirects to the marketplace (paid content); the Midgard tie-in is our framing, not the book's.

- id: desert_runner
  category: background
  he: נווד מדבר
  en: Desert Runner
  blurb: רקע של נווד שגדל במדבר ונע בין שבילי השיירות. הגוף שלו רגיל לחום ולמעט מים, והוא מכיר את המדבר טוב יותר מכל עיר. זה רקע של Kobold Press, ההוצאה של מידגארד.
  image: none
  links: [https://open5e.com/backgrounds/toh_desert-runner, https://api.open5e.com/v2/backgrounds/toh_desert-runner/]
  sources: [Kobold Press, Tome of Heroes (2022), via Open5e]
  uncertain: none

- id: court_servant
  category: background
  he: משרת חצר
  en: Court Servant
  blurb: רקע של מי ששירת פעם סוחר, אציל או שליט. הוא למד לקרוא את היחסים בחצר ולהיות נוכח בלי שאיש ישים לב אליו. זה רקע של Kobold Press, ההוצאה של מידגארד.
  image: none
  links: [https://open5e.com/backgrounds/toh_court-servant, https://api.open5e.com/v2/backgrounds/toh_court-servant/]
  sources: [Kobold Press, Tome of Heroes (2022), via Open5e]
  uncertain: none

- id: occultist
  category: background
  he: חוקר הנסתר
  en: Occultist
  blurb: רקע של מי שמאמין בדברים שאחרים מבטלים. הוא רודף אחרי שמועות, ספרים נשכחים, כתות סודיות וחורבות עתיקות. הוא מכיר אנשים בשולי החברה שיודעים דברים אסורים. זה רקע של Kobold Press, ההוצאה של מידגארד.
  image: none
  links: [https://open5e.com/backgrounds/toh_occultist, https://api.open5e.com/v2/backgrounds/toh_occultist/]
  sources: [Kobold Press, Tome of Heroes (2022), via Open5e]
  uncertain: none

- id: destined
  category: background
  he: בעל ייעוד
  en: Destined
  blurb: רקע של מי שיש עליו חובה גדולה: תואר, שבועה, נישואים מוסכמים או תפקיד בירושה. הוא בדרך אל הייעוד שלו, או בורח ממנו, והסיפור שלו מגיע לפניו. זה רקע של Kobold Press, ההוצאה של מידגארד.
  image: none
  links: [https://open5e.com/backgrounds/toh_destined, https://api.open5e.com/v2/backgrounds/toh_destined/]
  sources: [Kobold Press, Tome of Heroes (2022), via Open5e]
  uncertain: none

- id: knight_of_the_order
  category: background
  he: אביר מסדר
  en: Knight of the Order
  blurb: רקע של אביר שנשבע למסדר, לאידיאל או לאל. בני המסדר נותנים לו מחסה ועזרה בכל מקום. באימפריית הדרקון רוב המסדרים נופצו, ומה שנשאר מהם מסתתר בגבולות.
  image: none
  links: [https://dnd5e.wikidot.com/background:knight-of-the-order, https://www.dndbeyond.com/backgrounds/27-knight-of-the-order]
  sources: [Sword Coast Adventurer's Guide (WotC 2015)]
  uncertain: written for the Forgotten Realms; the Midgard framing is ours. The D&D Beyond page redirects to the marketplace.

- id: gladiator
  category: background
  he: לוחם זירה
  en: Gladiator
  blurb: וריאנט של רקע הבדרן: לוחם שהופך קרב להופעה מול קהל. באימפריה המהארוטית גוליית ג'מבוקה רבים הם רכוש של הזירה.
  image: none
  links: [https://dnd5e.wikidot.com/background:entertainer, https://www.dndbeyond.com/backgrounds/33-gladiator]
  sources: [Player's Handbook 2014 (Entertainer variant)]
  uncertain: none

- id: outlander
  category: background
  he: איש הפרא
  en: Outlander
  blurb: רקע של מי שגדל הרחק מהערים, בהרים, ביערות או בערבות. הוא יודע למצוא מזון ומים ולא ללכת לאיבוד בשטח, והערים זרות לו.
  image: none
  links: [https://dnd5e.wikidot.com/background:outlander]
  sources: [Player's Handbook 2014]
  uncertain: Hebrew label "איש הפרא" is a coinage; no existing content term to match.

- id: folk_hero
  category: background
  he: גיבור העם
  en: Folk Hero
  blurb: רקע של מי שבא מאנשים פשוטים ועשה משהו שהפך אותו לגיבור שלהם. פשוטי העם יסתירו אותו ויעזרו לו, כל עוד הוא לא מסכן אותם.
  image: none
  links: [https://dnd5e.wikidot.com/background:folk-hero, https://www.dndbeyond.com/backgrounds/9-folk-hero]
  sources: [Player's Handbook 2014]
  uncertain: none
```

## Unverified or open

- **Midgard Heroes Handbook (Kobold Press 2018) backgrounds:** not checked. It is not on Open5e, and I found no free primary source. *Tome of Heroes* is the only Kobold Press source verified here.
- **Tenni and Turator race:** not in the content (TODO). Their fit lines rely on class and lore only.
- **Hebrew labels** are my coinages (no official Hebrew D&D). "איש הפרא" (outlander) and "בעל ייעוד" (destined) are the weakest.
- **Images:** none verified, so every glossary entry says `image: none`.
- **Wikidot** is unofficial, community-run and copyright-gray. It is used for links because the D&D Beyond detail pages for non-SRD backgrounds are paywalled (303 to the marketplace).
