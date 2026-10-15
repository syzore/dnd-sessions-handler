---
id: turator
---

# טוראטור

<!-- name, class, icon and order come from content/session-one/characters/turator.md (same id). -->

## choice: subclass
title: ⚔️ איזו שבועה נשבעת?
prompt: ברמה 3 כל [[paladin]] נשבע שבועה, והיא קובעת איזה אביר הוא. בחר אחת מארבע השבועות של ספר השחקן.
context: god
link: הפלדין בספר השחקן 2024 (באנגלית) — https://dnd2024.wikidot.com/paladin:main

### שבועת המסירות
id: devotion
term: sc_devotion
subtitle: השבועה של [[holy_orders]]: אביר שעדיין עומד במילה שלו, גם כשהמסדר שלו נופץ.

אביר של יושר, אומץ, רחמים ואמת, שהנשק שלו זוהר באור קדוש.

### שבועת התהילה
id: glory
term: sc_glory
subtitle: [[jambuka]] שרוצה להוכיח שגם מי שאין לו קשקשים יכול להיות גיבור שזוכרים.

גיבור שנועד לגדולה, ומעורר השראה במהירות ובכוח שלו.

### שבועת הקדמונים
id: ancients
term: sc_ancients
subtitle: שבועה עתיקה יותר מהאימפריה: לשמור על מה שעוד חי ויפה תחת שלטון ה[[dragon]].

שומר האור, החיים והיופי בעולם מול החושך.

### שבועת הנקמה
id: vengeance
term: sc_vengeance
subtitle: מי שראה את הלגיונות מנפצים את המסדרים הקדושים לא שוכח ולא סולח.

נדר להעניש את מי שעשה עוול נורא, בכל מחיר.

## choice: background
from: session-one

## shared

## choice: trait
random: true
title: 🎭 איזה טיפוס אתה?
prompt: שבועה משאירה סימן באופי. בחר תכונה אחת שמתארת איך טוראטור מתנהג. ההצעות תלויות ברקע שלו, ויש גם כמה שמתאימות לכל פלדין. אפשר גם לכתוב משלך.

### נוכחות רגועה
id: gen_steady
subtitle: כשכולם מתרגשים

אני מדבר בשקט ועומד בשקט כשכולם סביבי מתרגשים. מי שעומד לידי מתחיל להאמין שהכול יהיה בסדר.

### מתפלל לפני ואחרי
id: gen_prays
subtitle: ואוכל אחרון

אני מתפלל לפני כל קרב ואחרי כל קרב, ואוכל רק אחרי שכל החברים שלי אכלו.

### אמת בחום
id: gen_honest_warm
subtitle: ופעם שנייה לכל אחד

אני אומר לאנשים את האמת בגלוי, אבל בחום. וכמעט לכל אחד אני נותן הזדמנות שנייה.

### נימוס כשריון
id: knight_courtesy
when: background = knight_of_the_order
subtitle: גם מול אויב

אני מנומס ומכבד גם מול אויב. את הנימוס קיבלתי מהמסדר כמו שריון, ואני לא פושט אותו.

### מספר גבורות המסדר
id: knight_tales
when: background = knight_of_the_order
subtitle: כי מישהו חייב לזכור

אני מספר על גבורות המסדר בכל הזדמנות. כשרוב המסדרים נופצו, מישהו חייב לזכור אותם בקול.

### הסמל מתחת לבגדים
id: knight_hidden_sigil
when: background = knight_of_the_order
subtitle: נוגע לפני כל החלטה

אני נושא את סמל המסדר מתחת לבגדים, ונוגע בו לפני כל החלטה קשה, כאילו הוא שואל אותי מה הייתי עושה לפני שנים.

### משימה שלא נגמרה
id: knight_unfinished_task
when: background = knight_of_the_order
subtitle: חוזר אליה בכל שיחה

יש לי משימה מהמסדר שלא הסתיימה. אני חוזר אליה בכל שיחה, כאילו אפשר לסיים אותה היום.

### רואה סימנים
id: acolyte_omens
when: background = acolyte
subtitle: האל מדבר בכל דבר

אני רואה סימנים בכל דבר: ציפור שחולפת, צבע של שמיים, מקרה מוזר. האל מדבר כל הזמן, ואני רק מתרגם.

### מצטט מהכתבים
id: acolyte_scripture
when: background = acolyte
subtitle: בכל מצב

אני מצטט מהכתבים הקדושים בכל מצב, גם כשאף אחד לא שאל. וכשלא מזהים את הציטוט אני נעלב.

### מנחם מתוך הרגל
id: acolyte_comforter
when: background = acolyte
subtitle: מהמקדש

גדלתי בין אנשים שבאו למקדש עם צער, ולנחם נעשה לי הרגל. כשמישהו בוכה, אני כבר שם עם מים ושקט.

### שמח לכל מאמין
id: acolyte_welcomes_believers
when: background = acolyte
subtitle: גם של אל אחר

כל מאמין שאני פוגש מרגש אותי, גם אם הוא פונה לאל אחר. במקום שבו תפילה בגלוי מסוכנת, כל מאמין הוא אח.

### סדר שאין לו משמעות
id: soldier_routine
when: background = soldier
subtitle: מהמחנה

אני קם עם שחר, מסדר את הציוד ומנקה את הנשק גם כשאין בזה צורך. הסדר הוא מה שמחזיק אותי.

### קול פיקוד
id: soldier_command_voice
when: background = soldier
subtitle: בלי להרגיש

אני נותן הוראות בקול של פקודה בלי להרגיש. אנשים ממהרים לציית, ואני שם לב אחרי כן.

### נשאר עם הקרב
id: soldier_haunted
when: background = soldier
subtitle: האמונה מחזיקה

חלק ממה שראיתי בקרב נשאר איתי בלילות. האמונה והתפילה הן מה שמחזיק אותי, ובלעדיהן אני לא ישן.

### מעט מילים
id: soldier_few_words
when: background = soldier
subtitle: פחות טעויות

אני מדבר ישר וקצר: פחות מילים, פחות טעויות. מי שרוצה סיפורים צריך לבקש מישהו אחר.

### שופט לפי מעשים
id: folk_judge_deeds
when: background = folk_hero
subtitle: לא לפי קשקשים או תואר

אני שופט אנשים לפי מה שהם עושים, לא לפי הקשקשים, התואר או הלבוש. מי שעוזר לאחרים, חבר שלי.

### כבר בדרך
id: folk_already_going
when: background = folk_hero
subtitle: לפני שחשבתי

כשמישהו בצרה אני כבר בדרך, לפני שנשאלתי ולפני שחשבתי. אחרי כן אני מגלה שהייתי צריך לתכנן.

### מתבייש בתואר גיבור
id: folk_modest
when: background = folk_hero
subtitle: אדם פשוט

אני לא אוהב שקוראים לי גיבור. אני אדם פשוט שעשה דבר אחד ביום אחד, ומסמיק כשמזכירים לי אותו.

### מתקן מה ששבור
id: folk_fixer
when: background = folk_hero
subtitle: בלי שביקשו

אני מרגיש בבית עם כלי עבודה יותר מאשר עם מילים. כל מה ששבור בדרך, גדר, גלגל, דלת, אני מתקן בלי שביקשו.

### מסתיר את התואר
id: destined_hides_title
when: background = destined
subtitle: מתנהג כאחד העם

אני מסתיר את התואר שלי ומתנהג כמו אחד העם, כי מי שיודע מי אני מצפה ממני למשהו שעוד לא הספקתי.

### מדבר בכובד
id: destined_solemn
when: background = destined
subtitle: כאילו נחרט על לוח

אני מדבר לאט ובכובד, כאילו כל משפט נחרט על לוח. אנשים מקשיבים, ולפעמים אני מתגעגע שיגחכו עליי.

### הסיפור הולך לפניי
id: destined_story_precedes
when: background = destined
subtitle: ומתאמץ לא להיות הוא

שמעו עליי עוד לפני שפגשו אותי. אני מתאמץ לא להיות הסיפור הזה בכל שיחה, ולפעמים נכשל.

### מתקשה לבקש עזרה
id: destined_no_help
when: background = destined
subtitle: הדרך הייתה שלי

הדרך הזו הייתה שלי לבד, ואני מתקשה לבקש עזרה. כשמציעים לי אותה, אני אומר תודה ושוכח לקבל.

## choice: ideal
random: true
title: 🌟 במה אתה מאמין?
prompt: מה מחזיק את טוראטור בשבועה? בחר אידיאל אחד, או כתוב משלך. ההצעות תלויות ברקע שלו, ויש גם כמה שמתאימות לכל פלדין.

### צדק
id: gen_justice
subtitle: חוקי

עוול אסור להשאיר מאחור. מי שיש לו כוח חייב להגן על מי שאין לו, והשבועה שלי לא נעצרת בגבול.

### תקווה
id: gen_hope
subtitle: טוב

בכל חושך יש אור, ותפקידי להישאר דלוק כשאחרים נחלשים. כל עוד מישהו מאמין שיש מחר, יש מחר.

### קדושה בגלוי
id: gen_open_faith
subtitle: כאוטי

קדושה לא צריכה היתר מ[[dragon|דרקון]]. אני מאמין בגלוי, והאל שלי לא נזקק לרשות כדי להישמע.

### נאמנות לשבועה
id: knight_oath
when: background = knight_of_the_order
subtitle: חוקי

אני מקיים את שבועת המסדר גם כשאין אף אחד אחר שזוכר אותה. מילה שנשבעה נשארת, גם אחרי שהמסדר נופץ.

### חסד לנכנע
id: knight_mercy
when: background = knight_of_the_order
subtitle: טוב

אביר מגן על מי שחלש ממנו, וגם אויב שהניח את נשקו מקבל חסד. כך אנחנו שונים מהלגיונות.

### לבנות מחדש
id: knight_rebuild
when: background = knight_of_the_order
subtitle: חוקי

הפלגים הקטנים שנסתרים לאורך הגבולות יכולים להיפגש שוב. אני אאסוף אותם, ואחזיר למסדר שם וסדר.

### כבוד לכל נפש
id: knight_respect
when: background = knight_of_the_order
subtitle: טוב

כל נפש ראויה לכבוד, גם מי שנולד בלי קשקשים וגם מי שאין לו אל. כבוד לא תלוי בדרגה.

### מסורת חיה
id: acolyte_tradition
when: background = acolyte
subtitle: חוקי

הטקסים והתפילות העתיקים הם מה שמחזיק קהילה. אם נפסיק לקיים אותם, נשכח מי אנחנו.

### צדקה
id: acolyte_charity
when: background = acolyte
subtitle: טוב

אני עוזר לנזקקים בלי לשאול מי הם או למי הם מתפללים. הקדושה שלי נמדדת בכמה נתתי.

### לסמוך על האל
id: acolyte_trust
when: background = acolyte
subtitle: חוקי

אני סומך על האל שיוביל אותי, ופועל לפי מה שהוא מראה לי, גם כשאין לי הסבר.

### להיות ראוי
id: acolyte_worthy
when: background = acolyte
subtitle: כל

אני רוצה להיות ראוי לאל שלי. כל מעשה שלי, קטן או גדול, הוא תפילה, וכך אני מתכוון לחיות.

### להגן על מי שאין לו
id: soldier_protect
when: background = soldier
subtitle: טוב

כוח שייך למי שמגן על אחרים. החרב שלי תמיד לשירות מי שאין לו חרב.

### חובה ודיבור
id: soldier_duty
when: background = soldier
subtitle: חוקי

אני עושה את חובתי ועומד בדיבור שלי. את המשמעת של הצבא לקחתי איתי, אבל עכשיו היא משרתת שבועה.

### לפרוע חוב
id: soldier_redeem
when: background = soldier
subtitle: טוב

שירתתי מי שלא הייתי צריך לשרת. כל נפש שאציל מכסה חלק מהחוב, ואני עדיין רחוק מלסיים לשלם.

### פקודה בלי אמונה
id: soldier_conscience
when: background = soldier
subtitle: חוקי

אני לא חייב דבר לצבא, רק לשבועה שלי. פקודה בלי אמונה היא כבל, ואחד כזה כבר נשבר.

### כבוד לאנשים פשוטים
id: folk_respect
when: background = folk_hero
subtitle: טוב

אנשים פשוטים ראויים לכבוד ולהגנה כמו כל אציל. כל עוד הם בטוחים, האמונה חיה.

### אף אחד לא פטור
id: folk_fairness
when: background = folk_hero
subtitle: חוקי

אף אחד, גם לא מושל וגם לא דרקון, לא פטור מהשבועה שלו. החוק חל על כולם, או שהוא לא חוק.

### שרשראות נועדו להישבר
id: folk_freedom
when: background = folk_hero
subtitle: כאוטי

מי שחי תחת אוכף ראוי לחופש. אני לא מחכה להיתר, ואם צריך אשבור את השרשרת בעצמי.

### בלי הצגות
id: folk_sincerity
when: background = folk_hero
subtitle: ניטרלי

אין טעם בהצגות. אני אומר מה שאני, ומה שאני נשבע, בלי תואר ובלי קישוטים.

### שבועה היא כל מה שנשאר
id: destined_oath
when: background = destined
subtitle: חוקי

השבועה היא כל מה שנשאר ממני. אקיים אותה גם כשאין עד, ואפילו כשאיש לא יודע שנשבעתי.

### אני בוחר איך
id: destined_choice
when: background = destined
subtitle: ניטרלי

הייעוד נולד איתי, אבל הדרך היא שלי. אני בוחר איך לעמוד בו, ומתי, ועם מי.

### ההקרבה
id: destined_sacrifice
when: background = destined
subtitle: טוב

שבועה שווה את המחיר. אם צריך, אתן את חיי כדי שאחרים יזכו ביום נוסף.

### להעביר הלאה
id: destined_legacy
when: background = destined
subtitle: חוקי

מה שקיבלתי, תואר, שם או חובה, לא ייגמר בי. אעביר אותו הלאה גם למי שלא מכיר את השם.

## choice: bond
random: true
title: 🔗 למי אתה קשור?
prompt: מי או מה מחזיק את טוראטור בעולם? בחר קשר אחד, או כתוב משלך. ההצעות תלויות ברקע שלו, ויש גם כמה שמתאימות לכל פלדין.

### הסמל הקדוש
id: gen_symbol
subtitle: כל מה שנשאר מהבית

הסמל הקדוש שלי הוא כל מה שנשאר לי מהבית. אשמור עליו, גם כשזה מסוכן, ובמיוחד כשזה מסוכן.

### חברי המסע
id: gen_companions
subtitle: משפחה חדשה

חברי למסע הם עכשיו המשפחה שלי. כל עוד אני עומד על רגליי, אף אחד מהם לא ייפול.

### הקריאה
id: gen_call
subtitle: האל קרא לי

האל קרא לי בלילה אחד ואני עדיין בדרך לתשובה. עד שאבין למה בחרו בי, אני לא נח.

### אחיי למסדר
id: knight_siblings
when: background = knight_of_the_order
subtitle: מי שנפוצו

אחיי למסדר נפוצו לכל כיוון, והם המשפחה שלי. אחפש כל אחד מהם, חי או מת.

### המפקד
id: knight_commander
when: background = knight_of_the_order
subtitle: לא יודע אם חי

נשבעתי למפקד שלי, ואני לא יודע אם הוא חי. עד שאדע, השבועה בתוקף.

### החפץ של המסדר
id: knight_relic
when: background = knight_of_the_order
subtitle: דגל, חרב או שריון

אני שומר חפץ קדוש של המסדר: דגל, חרב או שריון. אמות לפני שהוא ייפול ליד הלגיונות.

### הנער שלקחתי תחתיי
id: knight_squire
when: background = knight_of_the_order
subtitle: לא הספיק להישבע

יש נער או נערה שלקחתי תחת חסותי לפני שהספיקו להישבע. אני אחראי לחיים שלהם.

### המקדש שנסגר
id: acolyte_lost_temple
when: background = acolyte
subtitle: בית התפילה שלי

המקדש שגדלתי בו נסגר או נשרף. אחזיר את התפילה למקום שבו היא נשמעה, גם אם זה ייקח שנים.

### המורה מהמקדש
id: acolyte_mentor
when: background = acolyte
subtitle: מי שגידל אותי

הכוהן שגידל אותי במקדש לימד אותי הכול. אני חייב לו את מי שאני, ואגן עליו או על זכרו.

### הכתבים שאבדו
id: acolyte_lost_texts
when: background = acolyte
subtitle: מה שנגנב

הכתבים הקדושים של המקדש שלי נגנבו או הוחבאו. אני מתכוון להחזיר אותם, ולא משנה כמה זמן ייקח.

### קהילת המאמינים
id: acolyte_community
when: background = acolyte
subtitle: הקטנה שנשארה

קהילת מאמינים קטנה עדיין מחכה לי במקום מוסתר. אני חייב להם לחזור בחיים.

### שמות מי שלא חזר
id: soldier_names
when: background = soldier
subtitle: כל לילה

אני נושא את השמות של כל מי שלא חזר, ואומר אותם בתפילה כל לילה. לא אשכח אף אחד מהם.

### חוב החיים
id: soldier_life_debt
when: background = soldier
subtitle: מישהו שמר עליי

מישהו הציל אותי בקרב ועדיין לא החזרתי לו. אחזיר, גם אם זה יעלה לי הרבה.

### הקצין שבגד
id: soldier_commander
when: background = soldier
subtitle: משימה שנגמרה בטבח

הקצין שהוביל אותנו למשימה שנגמרה בטבח עוד חי. אני אמצא אותו, ואשמע ממנו למה.

### מי שהסתיר את העריק
id: soldier_hiding
when: background = soldier
subtitle: חוב על החיים

ברחתי מהלגיון, ויש מי שהסתירו אותי ולא שאלו שאלות. אני חייב להם את חיי.

### הכפר שלי
id: folk_village
when: background = folk_hero
subtitle: גם כשאני רחוק

הכפר שהגנתי עליו הוא הבית שלי. אני אגן עליו גם כשאני רחוק, ואחזור כשהוא יקרא.

### הכלי מאותו יום
id: folk_tool
when: background = folk_hero
subtitle: מעדר, פטיש או מקל

הכלי שהחזקתי באותו יום, מעדר, פטיש או מקל, איתי תמיד. הוא מזכיר לי כמה מעט צריך כדי להיות גיבור.

### מי שהסתיר אותי
id: folk_hidden_by
when: background = folk_hero
subtitle: כשהאוכפים חיפשו

פשוטי העם הסתירו אותי כשהאוכפים חיפשו. אני חייב להם את חיי, ואחזיר להם בדרך שלי.

### המשפחה שנשארה
id: folk_family
when: background = folk_hero
subtitle: ונמצאת בסכנה

המשפחה שלי נשארה מאחור, והאוכפים יודעים איפה היא. כל החלטה שלי עוברת דרך השאלה מה יקרה להם.

### האחרון במסדר
id: destined_last_of_order
when: background = destined
subtitle: נושא את השם

אני האחרון של מסדר שנופץ. אשא את השם שלו ואת הקברים של חבריו, ואחזור אליהם יום אחד.

### מה שירשתי
id: destined_inheritance
when: background = destined
subtitle: טבעת, חרב או מכתב

ירשתי חפץ שמגדיר את החובה שלי: טבעת, חרב או מכתב. הוא לא ייפול לידי הלגיונות.

### מי שעליי להגן
id: destined_ward
when: background = destined
subtitle: ועוד לא יודע

יש אדם אחד שהשבועה שלי מחייבת להגן עליו, והוא עדיין לא יודע זאת. אני ממשיך לשמור מרחוק.

### מי שהטיל עליי את החובה
id: destined_giver
when: background = destined
subtitle: מחכה לבשורה

מי שהטיל עליי את החובה, זקן, מפקד או גוסס, עדיין מחכה. אני חייב לחזור ולספר לו שהצלחתי.

## choice: flaw
random: true
title: 🩹 מה מכשיל אותך?
prompt: גם פלדין יש לו נקודה חלשה. בחר חולשה אחת, או כתוב משלך. ההצעות תלויות ברקע שלו, ויש גם כמה שמתאימות לכל פלדין.

### מחמיר עם עצמי
id: gen_hard_on_self
subtitle: כל כישלון הוא חטא

אני מחמיר עם עצמי יותר מאשר עם אחרים. כל כישלון הוא חטא, ואני לא יודע לסלוח לעצמי כמו שאני סולח לאחרים.

### לא מסוגל ללכת
id: gen_cannot_walk_away
subtitle: גם כשזה מלכודת

אני לא מסוגל להתעלם מקורבן, גם כשכולם אומרים שזה מלכודת. פעמים אני מכניס את כולם לצרות.

### הבטחות מהירות
id: gen_quick_promises
subtitle: ולא תמיד אקיים

אני מבטיח מהר יותר ממה שאני יכול לקיים. וכשאני לא מקיים, זה פוגע בי אפילו יותר ממי שהבטחתי לו.

### בטוח שהמסדר צודק
id: knight_pride
when: background = knight_of_the_order
subtitle: רק דרך אחת

אני בטוח שהדרך של המסדר היא היחידה הנכונה, ומזלזל במי שאין לו שבועה. זה לא מוסיף לי חברים.

### אין לי שקר
id: knight_cannot_lie
when: background = knight_of_the_order
subtitle: גם כשצריך

אני מתקשה לשקר, גם כשהחיים תלויים בזה. מול [[imperial_inquisitors]] זו חולשה מסוכנת.

### טקס לפני הכול
id: knight_ceremony
when: background = knight_of_the_order
subtitle: גם כשצריך להסתתר

אני מקפיד על מראה ועל טקס, ולא מצליח להתחבא היטב. אנשים מזהים בי אביר מרחוק.

### הנקמה על המסדר
id: knight_vengeance
when: background = knight_of_the_order
subtitle: מוכן לסכן הכול

מה שקרה למסדר שלי מכרסם בי. אני מוכן לקחת סיכונים מטורפים כדי לפגוע במי שנפץ אותו.

### שיפוטי
id: acolyte_judgmental
when: background = acolyte
subtitle: על פי האמונה

אני שופט אחרים בחומרה לפי הדרך שבה הם מתפללים או לא מתפללים. אנשים מרגישים את זה, ומתרחקים.

### סומך על ההיררכיה
id: acolyte_hierarchy
when: background = acolyte
subtitle: על כוהנים

אני סומך בעיניים עצומות על כל מי שלובש בגדי כוהן. מי שרוצה לנצל אותי יודע איפה לחפש.

### ספק שאני מסתיר
id: acolyte_doubt
when: background = acolyte
subtitle: האל שותק

אני כבר לא בטוח שהאל שומע אותי, ומסתיר את זה מכולם, גם מעצמי. בלילות הספק חזק יותר.

### תפילה בגלוי
id: acolyte_reckless_prayer
when: background = acolyte
subtitle: ויהי מה

אני מוכן להתפלל בגלוי גם כשזה עלול להרוג את כולנו. לא כל אחד מוכן לשלם את המחיר הזה.

### מציית לפקודה
id: soldier_obeys
when: background = soldier
subtitle: לפני שאני חושב

כשקול סמכותי נותן פקודה אני מציית לפני שאני חושב, גם כשאני יודע שהיא טעות.

### לא סולח לעצמי
id: soldier_unforgiving
when: background = soldier
subtitle: על טעות בקרב

טעיתי פעם בקרב, וזה עלה בחיים של אנשים. אני לא סולח לעצמי, וזה מכביד על כל החלטה.

### מזלזל באזרחים
id: soldier_contempt
when: background = soldier
subtitle: מי שלא שירת

אני מזלזל במי שלא שירת ולא ראה קרב. אני יודע שזה לא הוגן, ולא מצליח להפסיק.

### לא מאלתר
id: soldier_no_improv
when: background = soldier
subtitle: תוכנית היא תוכנית

אני לא מסוגל לשנות תוכנית באמצע. כשהיא קורסת, אני קופא לרגע, ובקרב רגע הוא הרבה.

### האוכפים עוד מחפשים
id: folk_hunted
when: background = folk_hero
subtitle: ומי שמסתיר אותי

האוכפים שפגעתי בהם לא מפסיקים לחפש אותי. כל מקום שאני נשאר בו הופך למלכודת לאלה שמסתירים אותי.

### בטוח שנבחרתי
id: folk_chosen
when: background = folk_hero
subtitle: ולא מקשיב

אני בטוח שהאל בחר בי למשהו גדול, ולכן לא מקשיב לאזהרות. אם הוא הוביל אותי עד כאן, יוביל עוד.

### חושש שיגלו
id: folk_shame
when: background = folk_hero
subtitle: מי שהכיר אותי קודם

מי שהכיר אותי לפני אותו יום יודע שאני לא גיבור. אני מפחד שיספרו, ושהכול יתפרק.

### לא סומך על מי שלא מהעם
id: folk_distrust
when: background = folk_hero
subtitle: תמיד מניח שימכרו

אני מתקשה לסמוך על בעלי ברית שאינם מהעם הפשוט. תמיד מניח שמישהו ימכור אותי.

### בטוח שהייעוד יגן עליי
id: destined_fate_blind
when: background = destined
subtitle: ולוקח סיכונים

אני מאמין שהייעוד שלי יגן עליי, ולוקח סיכונים שאדם רגיל לא היה לוקח. החברים שלי משלמים על זה.

### בורח מהחובה
id: destined_runs
when: background = destined
subtitle: יותר ממה שמתוודה

אני בורח מהחובה שלי יותר ממה שאני מודה. כל עיקוף הופך לתירוץ, והדרך הולכת ומתארכת.

### מסתיר מי אני
id: destined_secretive
when: background = destined
subtitle: ולמה אני כאן

אני מסתיר מהחברים מי אני באמת ולמה אני כאן. הסוד הזה עוד יעלה להם ביוקר.

### הכול על כתפיי
id: destined_burden
when: background = destined
subtitle: לא מאציל

אני חושב שהכול מוטל עליי. אני לא מאציל, לא מבקש עזרה, ולפעמים אפילו מסרב להגנה.
