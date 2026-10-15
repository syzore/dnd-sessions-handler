---
id: vilhelm
background: mharoti_scholar_criminal
---

# וילהלם

<!-- name, class, icon and order come from content/session-one/characters/vilhelm.md (same id). The Evoker option reuses the Session One term "evoker" (קוסם יסודות). -->

## choice: subclass
title: 📖 באיזו אסכולה של קסם התמחית?
prompt: ברמה 3 כל [[wizard]] מתמחה באסכולה אחת, והיא קובעת באיזה קסם הוא הכי טוב. בחר אחת מארבע האסכולות של ספר השחקן.
context: element
link: הקוסם בספר השחקן 2024 (באנגלית) — https://dnd2024.wikidot.com/wizard:main

### קוסם מגן
id: abjurer
term: sc_abjurer
subtitle: האימפריה משתמשת בקוסמים אנושיים כמבטלי לחשים. אתה יודע לבטל את הקסם שלה.

מומחה לקסם הגנה: מגנים קסומים וביטול לחשים.

### קוסם חוזה
id: diviner
term: sc_diviner
subtitle: מי שרוצה לפתור תעלומות קסומות, ולדעת מראש מתי ציידי הקוסמים מגיעים.

רואה את העתיד, ולפעמים יודע מה יקרה לפני שזה קורה.

### קוסם יסודות
id: evoker
term: evoker
subtitle: הכי קרוב ללור של וילהלם: היסוד שבחרת, ו[[sculpt_spells]] שחוסך את החברים שלך.

מומחה לקסם הרס: אש, ברק וקור, ופיצוצים שלא פוגעים בחברים.

### קוסם אשליות
id: illusionist
term: sc_illusionist
subtitle: ספר לחשים שנראה כמו פנקס של סוחר, וקוסם שנראה כמו פקיד.

מומחה לאשליות: מראות, קולות וחפצים שנראים אמיתיים.

## choice: background
from: session-one

## choice: msc_skills
when: background = mharoti_scholar_criminal
context: background
title: 🎓 במה אתה מיומן?
prompt: מלומד-פושע מהאימפריה המהארוטית לומד דברים שהמוסדות לא מלמדים. בחר שתי מיומנויות.
multi: true
count: 2
other: false

### ארקנה
id: arcana
term: skill_arcana

לימוד לחשים, תאוריה קסומה, כישופים עתיקים וטקסים אסורים.

### היסטוריה
id: history
term: skill_history

חקר ציוויליזציות עתיקות, ההיסטוריה של האימפריה, שושלות וסודות היסטוריים.

### חקירה
id: investigation
term: skill_investigation

בחינת מסמכים, פתרון תעלומות, מציאת פרטים נסתרים וחיבור רמזים.

### תפיסה
id: perception
term: skill_perception

הבחנה במעקב, בחפצים חבויים, בהתנהגות חשודה ובסכנה מתקרבת.

### הונאה
id: deception
term: skill_deception

שקר משכנע, שמירה על זהות בדויה והטעיית שלטונות או יריבים.

### פעלולי יד
id: sleight_of_hand
term: skill_sleight_of_hand

הסתרת חפצים קטנים בכף היד, החלפת מסמכים, הטמנת ראיות וכיסי גנבים.

### התגנבות
id: stealth
term: skill_stealth

חדירה לארכיונים אסורים, התחמקות משומרים ובריחה בלי להיראות.

## choice: msc_tools_languages
when: background = mharoti_scholar_criminal
title: 🗝️ אילו כלים או שפות למדת?
prompt: בחר שניים בסך הכול, בכל שילוב: שני כלים, שתי שפות, או אחד מכל סוג.
hint: אל תבחר שפה שהדמות שלך כבר יודעת.
multi: true
count: 2
other: false

### ציוד קליגרפיה
id: calligraphers_supplies
term: tool_calligraphers_supplies
subtitle: כלי

העתקת כתבי יד, הפקת מסמכים מהודרים ושמירת רשומות כתובות.

### ערכת זיוף
id: forgery_kit
term: tool_forgery_kit
subtitle: כלי

זיוף חותמות, אישורים, חתימות ומסמכים רשמיים.

### כלי פריצה
id: thieves_tools
term: tool_thieves_tools
subtitle: כלי

פתיחת מנעולים והתמודדות עם אבטחה מכנית.

### ערכת תחפושות
id: disguise_kit
term: tool_disguise_kit
subtitle: כלי

שינוי המראה כדי להתחזות למישהו או להימנע מזיהוי.

### ציוד אלכימיה
id: alchemists_supplies
term: tool_alchemists_supplies
subtitle: כלי

ניסויים בחומרים, בתגובות אלכימיות ובחומרים יוצאי דופן.

### ערכת משחק (קוביות או קלפים)
id: gaming_set
term: tool_gaming_set
subtitle: כלי

הימורים, קריאת יריבים וקשרים בבתי אוכל ובעולם התחתון.

### דרקונית
id: draconic
term: lang_draconic
subtitle: שפה

הבחירה המתאימה ביותר: חקר דרקונים, מסורות דרקוניות וקסם האימפריה.

### קדמונית
id: primordial
term: lang_primordial
subtitle: שפה

מועילה לחקר קסם יסודות ולכוחות של המסורות היסודיות באימפריה.

### גיהנומית
id: infernal
term: lang_infernal
subtitle: שפה

מועילה לחקר שדים, חוזים גיהנומיים ועסקאות על-טבעיות מסוכנות.

### גובלינית
id: goblin
term: lang_goblin
subtitle: שפה

מועילה לשיחה עם גובלינואידים ולתנועה במעגלים פליליים או מסחריים.

### ננסית
id: dwarvish
term: lang_dwarvish
subtitle: שפה

מועילה לחקר כתובות עתיקות, אומנות ורשומות של הננסים.

### אלפית
id: elvish
term: lang_elvish
subtitle: שפה

מועילה לגישה למלומדות עתיקה, לספרות ולמקורות היסטוריים של האלפים.

### שפה משותפת
id: common
term: lang_common
subtitle: שפה

מועילה למסחר, למסע ולתקשורת בין תרבויות.

## choice: msc_feat
when: background = mharoti_scholar_criminal
title: ⭐ איזו יכולת מוצא יש לך?
prompt: בחר יכולת מוצא אחת.
hint: בחר את מה שמבטא את הדמות שלך, לא את מה שנשמע החזק ביותר.
other: false

### מיומן
id: skilled
term: feat_skilled

צברת מגוון רחב של ידע מעשי. תקבל מיומנות בשלוש יכולות או כלים נוספים לבחירתך.

### חניך קסם (קוסם)
id: magic_initiate_wizard
term: feat_magic_initiate_wizard

הלימודים לימדו אותך קסם נוסף. תלמד שני לחשי כישוף וקסם אחד ברמה 1 מרשימת הקוסם, עם יתרונות ההטלה של היכולת.

### עירני
id: alert
term: feat_alert

שנים של התגנבות, ריגול והתחמקות מהשלטונות לימדו אותך להגיב מהר ולהישאר צעד לפני הסכנה.

### בר מזל
id: lucky
term: feat_lucky

יש לך חוש לצאת מצרות, להפוך מצבים רעים ולהצליח כשהסיכויים נגדך.

### אומן
id: crafter
term: feat_crafter

הניסיון בהכנת כתבי יד, בטיפול בחומרים או בייצור סחורה אסורה הפך למומחיות מעשית. תקבל מיומנות בשלושה כלי אומן מתאימים, הנחה על חפצים לא קסומים, והיתרון היצירתי של היכולת.

## text: msc_story
when: background = mharoti_scholar_criminal
title: 📜 ספר את הסיפור שלך
prompt: במשפט או שניים: מה למדת, ומה הפך את העבודה שלך לפלילית? למשל: דרקונים עתיקים, קסם יסודות, ציוויליזציות אבודות או לחשים אסורים. ומה עשית: גנבת ידע, זייפת מסמכים, מכרת סודות, פרצת לארכיון אסור, או התריסת נגד סמכות קיסרית?
hint: התשובות שלך מגדירות את הדמות שמאחורי המיומנויות.
