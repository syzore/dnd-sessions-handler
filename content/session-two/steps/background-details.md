# פרטי הרקע

<!--
Shared steps: every character gets them, after the steps in its own file (docs/specs/session-two.md, D5).
Each step shows only when the player's background matches its "when:" line. A player sees at most one.
"when: background = _else" is the fallback: a background written as free text, or one with no step here.
Every choice step also shows the free-text box (the default), so a player can always write their own answer.
Covered: the 17 backgrounds in content/session-one/characters/*.md plus the 2024 PHB list. A test checks
that every Session One background option and every bg_* term has a step here (ticket 01).
Keep lore that is only in a character's "### secret" out of this file: every player receives these steps.
Sorted by background id.
-->

## choice: details_acolyte
when: background = acolyte
context: background
title: 🕯️ באיזה מקדש שירתת?
prompt: משרת מקדש גדל בתוך הטקסים. איפה זה היה, ואיזה אל עבדתם שם?

### 🕳️ מקדש מתחת לבאר
id: well_shrine

אחד המקדשים העתיקים שמתחת לבארות העיר, מוסתר מעיני [[imperial_inquisitors]].

### 🎭 מקדש של אל מותר
id: masked_temple

מקדש רשמי של אל שהאימפריה מתירה, ומאחורי המסכה התפללתם לאל אחר. [[law_of_masks]] בפועל.

### 🔥 המקדש של [[baal]]
id: baal_temple

גדלת בכהונה הרשמית של אל-ה[[dragon|דרקון]], וראית מבפנים איך היא מרדימה את ה[[jambuka]].

### 🕊️ מקדש בארץ חופשית
id: free_temple

ב[[crossroads]] או ב[[nuria_natal]], שבהן מתפללים בגלוי.

### 🚶 כוהן נודד
id: wandering

לא היה לך מקדש. שירתת כוהן שנדד בין כפרים וקיים טקסים בסתר.

## choice: details_artisan
when: background = artisan
context: background
title: ⚒️ מה המלאכה שלך?
prompt: אומן חי מהידיים שלו. מה הן יודעות לעשות, ובשביל מי עבדת?

### ⚒️ נפח
id: smith

חישלת שריון ונשק ללגיונות של האימפריה, ויודע בדיוק איפה כל שריון נסדק.

### 💎 צורף
id: jeweler

עבדת בבזאר הגדול של [[harkesh]], בין הזהב שה[[dragon]] כל כך אוהבים.

### 🧱 בנאי
id: mason

עבודת פרך על המונומנטים של [[harkesh]] או על דרכי [[dragon_roads]]. אתה יודע איך בנויה עיר, ואיך מפילים חומה.

### 🧵 אורג או חייט
id: weaver

תפרת בגדים לאצילים בעלי קשקשים, ותחפושות למי ששילם בשקט.

### ⚗️ אלכימאי
id: alchemist

ערבבת שיקויים, צבעים ורכיבים. חלק מהם חוקיים.

## choice: details_charlatan
when: background = charlatan
context: background
title: 🎭 מי הזהות הבדויה שלך?
prompt: לרמאי יש שם ומסמכים של מישהו אחר. מי הוא, האיש שאתה מעמיד פנים שאתה?

### 🧳 סוחר מכובד
id: false_merchant

סוחר עם מסמכים, שיירה ושם טוב, שאף פעם לא היה קיים.

### 🎭 מאמין של אל מותר
id: false_priest

[[law_of_masks]]: בעיני כולם אתה מתפלל לפטרון מסחר מאושר. בפועל אתה מתפלל למישהו אחר לגמרי.

### 📜 בעל היתר
id: false_permit

יש לך מסמכים של מישהו שמותר לו ללכת ב[[dragon_roads]], ואתה הולך בהן בלב דופק.

### 🔮 מגיד עתידות
id: fortune_teller

בבזארים מוכרים תקווה, ואתה מוכר אותה בזול.

### 👑 יורש אבוד
id: lost_heir

אתה מציג את עצמך כבן של בית אצולה מ[[seven_cities]]. אף אחד עוד לא בדק.

## choice: details_court_servant
when: background = court_servant
context: background
title: 🍷 את מי שירתת?
prompt: משרת חצר שומע הכול. בבית של מי עמדת בפינה, ומה שמעת שם?

### 🐉 בית של [[morza|מורזה]]
id: morza_house

שירתת בבית של אדון [[dragon|דרקון]]. ראית איך הם מדברים כשהם חושבים שאף אחד לא מקשיב.

### 📜 פקיד [[kobold]] מנופח
id: kobold_official

עבדת אצל פקיד קטן עם אגו ענק, שחשב שאתה רהיט.

### 💰 נסיך סוחרים
id: merchant_prince

סוחר עשיר מהבזאר הגדול של [[harkesh]], עם חדרים מלאים בסודות ובחובות.

### 👑 החצר של הסולטנה האנושית
id: sultana_court

לפני ההפיכה. ראית אותה נופלת, וברחת עם מה שהספקת לקחת.

### 🕯️ בית של כוהן גדול
id: high_priest

כוהן גדול של אלי הדרקונים, שהתפילות שלו נשמעו אחרת כשרק המשרתים היו בחדר.

## choice: details_criminal
when: background = criminal
context: background
title: 🗝️ באיזה עולם תחתון פעלת?
prompt: פושע לא עובד לבד. עם מי עבדת, ומה הייתה העבודה?

### 🏙️ גנבי הבזאר
id: bazaar_thieves

גילדת גנבים בבזאר הגדול של [[harkesh]], שבו אלף דוכנים ואלף כיסים.

### 📦 טבעת הברחה
id: smuggling_ring

גופרית, חוטי נחושת וכל מה שהשווקים של האימפריה עוקבים אחריו. אתה יודע להעביר אותם בלי שאלות.

### 🕯️ מחתרת הג'מבוקה
id: underground

אצלכם פשע הוא גם מרד: זייפתם היתרים והסתרתם נמלטים.

### 🏴 "המפרשים האדומים"
id: red_sails

השודדים של [[triolo]], שצדים את הספינות של הסולטן.

### 💰 סוחר גניבות
id: fence

קנית ומכרת סחורה גנובה. אתה יודע כמה הכול שווה, ומי לא ישאל מאיפה זה בא.

### 🌑 לבד
id: lone

בלי גילדה ובלי בוס. אף אחד לא יכול להסגיר אותך.

## choice: details_desert_runner
when: background = desert_runner
context: background
title: 🏜️ באילו שבילים רצת?
prompt: נווד מדבר מכיר את החולות טוב יותר מכל עיר. איפה הם עברו, ומה הובלת?

### 🏜️ שבילי הגבול
id: border_trails

הרצת סחורה בשבילי הגבול, הרחק מעיני הלגיונות.

### 🏺 הדרך דרומה
id: south_road

הדרך הארוכה ל[[nuria_natal]], ממלכת הנהר שהאימפריה לא הצליחה לכבוש.

### 🐪 נתיבי השיירות
id: caravan_routes

הובלת שיירות אל [[harkesh]]. אתה מכיר כל באר בדרך, וכל שודד.

### 🌴 שבט של נווה מדבר
id: oasis_clan

גדלת עם משפחה נודדת שעוברת בין נאות מדבר. הם עדיין יקבלו אותך.

## choice: details_destined
when: background = destined
context: background
title: ⭐ מה הייעוד שלך?
prompt: על בעל ייעוד יש חובה גדולה. מהי, ואתה הולך אליה או בורח ממנה?

### 🛡️ אחרון המסדר
id: last_of_order

אתה האחרון ממסדר שבור, ונושא את החובה שלו לבד.

### 🔮 נבואה
id: prophecy

מישהו ניבא עליך משהו. אתה לא בטוח שאתה רוצה שזה יתגשם.

### 📜 שבועה בירושה
id: inherited_oath

אבא או אמא שלך נשבעו, ומתו לפני שעמדו בשבועה. עכשיו היא שלך.

### 👑 תואר שנגזל
id: stolen_title

למשפחה שלך היו אדמה ושם, עד שהאימפריה לקחה אותם. מישהו צריך להחזיר אותם.

## choice: details_entertainer
when: background = entertainer
context: background
title: 🎪 איפה הופעת?
prompt: בדרן חי מהקהל. על איזו במה עמדת, ומול מי?

### 🎪 בבזאר הגדול
id: bazaar_stage

בין אלף הדוכנים של [[harkesh]], מול קהל שעוצר רק לרגע.

### 🎭 להקה נודדת
id: travelling_troupe

נדדתם עם השיירות מעיר לעיר, ובכל עיר הופעתם לפני שגירשו אתכם.

### 🎶 בחצר של [[morza|מורזה]]
id: dragon_court

הופעת לפני אדוני ה[[dragon|דרקון]], וראית מה קורה כשהם משתעממים.

### ⚔️ בזירה
id: arena

הקהל רצה דם, ואתה נתת לו הופעה.

### 🍺 בנמלים של [[seven_cities]]
id: port_taverns

בתי מרזח של מלחים, פיראטים ושכירי חרב, שמשלמים טוב על שיר נגד הסולטן.

## choice: details_farmer
when: background = farmer
context: background
title: 🌾 איפה עבדת את האדמה?
prompt: חוואי יודע מה אנשים פשוטים צריכים. איפה הייתה החווה, ושל מי היא הייתה?

### 🌾 אחוזה של אציל בעל קשקשים
id: imperial_estate

אדמה של [[timar_legions|טימארלי]]. אתם גידלתם, והיבול הלך ללגיונות.

### 🌊 על גדות הנהר
id: river_farm

בממלכת הנהר [[nuria_natal]], שבה המלכים-האלים שומרים על השדות.

### ⛰️ טרסות בהרים
id: mountain_terraces

בשולי [[dragoncoil_mountains]], שם [[drake]] גונבים עזים כל חורף.

### 🐎 עדרים בערבה
id: steppe_herds

ב[[rothenian_plain]], בין שבטי הפרשים, עם סוסים ועדרים במקום שדות.

## choice: details_folk_hero
when: background = folk_hero
context: background
title: 🏘️ מה עשית שהפך אותך לגיבור?
prompt: גיבור העם עשה משהו אחד שאנשים פשוטים לא שוכחים. מה זה היה?

### 🏘️ הגנת על הכפר
id: defended_village

עמדת מול אוכפי האימפריה כשבאו לקחת את מה שנשאר.

### ⛓️ שחררת עבדים
id: freed_slaves

שברת שרשראות של [[jambuka]] שנלקחו לעבודת כפייה.

### 📜 עמדת מול פקיד
id: defied_official

פקיד [[kobold]] רצה להעניש את כל הרחוב, ואתה לקחת את העונש במקומם.

### 🐉 הרגת [[drake]]
id: killed_drake

דרייק טרף אנשים בכפר שלך, ואתה הרגת אותו. האימפריה עדיין מחפשת את מי שעשה את זה.

### 🍞 האכלת רעבים
id: fed_hungry

בשנת בצורת פרצת למחסן התבואה של הלגיון.

## choice: details_giant_foundling
when: background = giant_foundling
context: background
title: 🪨 מי גידל אותך?
prompt: אסופי של ענקים גדל בין דברים ענקיים. מי לקח אותך, ואיפה?

### 🏛️ חורבות [[cassilon]]
id: cassilon_ruins

גדלת בין החורבות של העיר האגדית, ולמדת לקרוא את הכתובות שעל הקירות.

### 🪨 משפחה של [[hill_giant]]
id: hill_giant_family

משפחה נואשת, רעבה ונרדפת, שבכל זאת לקחה אותך.

### 🏔️ ענקי הפסגות
id: peak_giants

שבט בפסגות הגבוהות, שרואה את עצמו צאצא של ענקי האבן והאש.

### ⛓️ מכלאות האימפריה
id: imperial_pens

גדלת בין [[giant]] שבויים שהאימפריה הכינה לחזית.

## choice: details_gladiator
when: background = gladiator
context: background
title: 🏟️ באיזו זירה נלחמת?
prompt: לוחם זירה הוא רכוש של הזירה, עד שהוא לוקח את החופש שלו. איפה זה היה?

### 🏟️ הזירה הגדולה של [[harkesh]]
id: harkesh_arena

הזירה של הבירה, מול אלפי צופים ואולי גם מול הסולטן.

### 🩸 בורות הדם של [[kaanesh]]
id: kaanesh_pits

עיר של [[ogre]] ו[[dragonkin]], שבה מגי-דם מקעקעים את הלוחמים.

### ⚔️ משחקי הלגיון
id: legion_games

נלחמת כדי לבדר חיילים במחנה, בין קרב אמיתי לקרב אמיתי.

### 🎪 קרקס נודד
id: circus

קרב מבוים, עיר אחרי עיר, עם שלט ענק שכתוב עליו השם שנתנו לך.

### ⚓ זירות הנמל
id: port_arena

ב[[seven_cities]], שבהן שכירי חרב מהמרים על כל דבר.

## choice: details_guard
when: background = guard
context: background
title: 🛡️ מה שמרת?
prompt: שומר יודע לזהות צרות לפני שהן מגיעות. על מה עמדת, ובשביל מי?

### 🚪 שער עיר
id: city_gate

בדקת היתרים של [[jambuka]] בשער, וידעת מי מהם משקר.

### 🐪 שיירה
id: caravan_guard

שמרת על שיירות בדרכים, מפני שודדים ומפני מה שבא מההרים.

### 🕯️ מקדש
id: temple_guard

שמרת על מקדש של אלי הדרקונים, וראית מי בא להתפלל בלילה.

### 🏰 בית אצולה
id: noble_house

עמדת בפתח של בית עשיר, ושמעת יותר ממה שהיית צריך.

### ⛓️ מכרה או מחנה עבודה
id: labor_camp

שמרת על עובדי כפייה. אולי זה הדבר שגרם לך לעזוב.

## choice: details_guide
when: background = guide
context: background
title: 🧭 איזה שטח אתה מכיר?
prompt: מורה דרך מביא אנשים למקום ומחזיר אותם בחיים. איפה?

### ⛰️ [[dragoncoil_mountains]]
id: dragoncoil

מעברי ההרים שהשיירות מעדיפות לעקוף, בין [[drake]] וויברנים.

### 🏜️ שבילי המדבר
id: desert

בארות סודיות ושבילים שהחול מכסה כל לילה.

### 🌾 [[rothenian_plain]]
id: steppe

ערבה בלי סוף ותלי קבורה עתיקים, בין שבטי הפרשים.

### 💀 [[wasted_west]]
id: wasted_west

הובלת משלחות לחורבות של ממלכות הקוסמים, ולא כולם חזרו.

### 🗺️ דרכים עוקפות
id: hidden_paths

שבילים שעוקפים את [[dragon_roads]], שבהם [[jambuka]] הולכים בלי היתר.

## choice: details_hermit
when: background = hermit
context: background
title: 🏔️ איפה התבודדת?
prompt: מתבודד חי שנים לבד, ושם גילה אמת גדולה. איפה זה היה? את האמת עצמה אפשר לכתוב בתיבה.

### 🏔️ מערה בהרים
id: mountain_cave

מערה ב[[dragoncoil_mountains]], גבוה מעל המקום שבו [[drake]] צדים.

### 🏜️ חורבה במדבר
id: desert_ruin

חורבה עתיקה שהחול כמעט כיסה, עם כתובות שאף אחד אחר לא קרא.

### 🕳️ מקדש נשכח
id: forgotten_shrine

מקדש תת-קרקעי שכולם שכחו, עתיק יותר מהאימפריה.

### 💀 [[wasted_west]]
id: wasted_west

בין החורבות של ממלכות הקוסמים, הרחק מכל עין של האימפריה.

### 🕊️ מנזר בארץ חופשית
id: monastery

מנזר שקט ב[[crossroads]], שבו אף אחד לא שאל שאלות.

## choice: details_knight_of_the_order
when: background = knight_of_the_order
context: background
title: 🛡️ לאיזה מסדר אתה שייך?
prompt: אביר מסדר נשבע לאידיאל או לאל, ובני המסדר יעזרו לו בכל מקום. מי הם?

### ☀️ מסדר השמש שאינה מתה
id: undying_sun

מ[[magdar_kingdom]]. בקרב שדה מארוק אבירי השמש כמעט חתכו את הצבא הקיסרי לשניים.

### ⛈️ מסדר הסערה
id: storm_order

המסדר השני של [[magdar_kingdom]], של אבירים שנלחמים כמו סערה.

### 💔 מסדר שנופץ
id: shattered_order

אחד מ[[holy_orders]]. נשארו ממנו רק כמה אבירים שמסתתרים לאורך הגבולות.

### 🏺 מסדר מממלכת הנהר
id: nurian_order

אבירים של [[nuria_natal]], שמשרתים את המלכים-האלים שלא מתים.

### 🕯️ מסדר חדש
id: new_order

אתה ומעט אחרים נשבעתם מחדש, בסתר. אתם המסדר.

## choice: details_merchant
when: background = merchant
context: background
title: 💰 במה סחרת?
prompt: סוחר יודע להתמקח ולמצוא מי צריך את מה שיש לו. מה מכרת, ולאן?

### 🧂 תבלינים ומשי
id: spices_silk

דוכן בבזאר הגדול של [[harkesh]], בין אלף דוכנים אחרים.

### 🐪 שיירות
id: caravans

הובלת סחורה בין הערים של האימפריה, ושילמת מס בכל שער.

### ⚓ סחר ימי
id: sea_trade

סחר עם [[seven_cities]], גם כשהאימפריה במלחמה איתן. מסחר לא מכיר גבולות.

### 📦 סחורה אסורה
id: forbidden_goods

ספרים, רכיבים וסמלים של אלים אסורים, מתחת לסחורה הרגילה.

### ⚗️ רכיבים קסומים
id: reagents

גופרית, חוטי נחושת ושאר הדברים שקוסמים צריכים, ושהאימפריה עוקבת אחריהם.

## choice: details_noble
when: background = noble
context: background
title: 👑 מאיזה בית אתה בא?
prompt: לאציל יש שם משפחה שעדיין פותח דלתות, או סוגר אותן. איזה שם?

### 🏚️ בית אנושי שנפל
id: fallen_house

המשפחה שלך שירתה את הסולטנה האנושית, ונפלה איתה בהפיכה.

### 🛡️ בית אבירים מ[[magdar_kingdom]]
id: magdar_house

בית של אבירים ועגלות מלחמה, שאיבד את המלך שלו בקרב לפני שבע שנים.

### ⚓ משפחת סוחרים מ[[seven_cities]]
id: merchant_house

אצולה של כסף וספינות, שמימנה את מי שנלחם בצי של הסולטן.

### 🏺 חצר בממלכת הנהר
id: nurian_court

משפחה מהחצר של [[nuria_natal]], שבה מלכים קדומים קמו לתחייה.

### 🐎 משפחת חאן
id: khan_family

קרוב משפחה של חאן מ[[khazzaki]], שגדל במחנה נודד.

## choice: details_occultist
when: background = occultist
context: background
title: 🕯️ אחרי איזה סוד רדפת?
prompt: חוקר הנסתר מחפש את מה שאחרים מבטלים. מה חיפשת?

### 📜 מיתוסי הבריאה שנמחקו
id: erased_myths

מה שנמחק מהרשומות הקיסריות, ולמה.

### 🎭 המסכות של האלים
id: god_masks

[[law_of_masks]]: מי באמת מסתתר מאחורי השמות השונים של האלים.

### 💀 שרידי ממלכות הקוסמים
id: wasted_west_relics

חפצים וספרים מ[[wasted_west]], מהזמן שלפני שהקוסמים השמידו את עצמם.

### 🏚️ [[baba_yaga]]
id: baba_yaga

סיפורים על המכשפה, על הבית שלה ועל מי שהיא מקללת.

### 🐍 נחש-העולם
id: veles_cult

כת סודית של [[veles]], שמאמינה שכל האלים הם מסכות שלו.

### 🕯️ אגודה סודית
id: secret_society

חוג נסתר של מלומדים ומיסטיקנים, עם כללים, סודות והתחייבויות.

## choice: details_outlander
when: background = outlander
context: background
title: 🏔️ מאיפה באת?
prompt: איש הפרא גדל הרחק מהערים. איזה שטח פראי גידל אותך?

### 🏔️ הפסגות הגבוהות
id: high_peaks

הפסגות הגבוהות ביותר של [[dragoncoil_mountains]], שבהן האוויר דליל וזר לא מגיע.

### ⛰️ הגבעות ליד [[kaanesh]]
id: kaanesh_hills

גבעות מרעה שכל באר בהן שווה קרב.

### 🐎 הערבה
id: steppe

[[rothenian_plain]], בין שבטי הפרשים והקנטאורים.

### 🌲 היערות העתיקים
id: old_forests

יערות [[crossroads]], רחוק מהאימפריה ומהחוקים שלה.

### 💀 [[wasted_west]]
id: wasted_west

שממה של חורבות, שבה לשרוד זה הישג.

## choice: details_sage
when: background = sage
context: background
title: 📚 איפה למדת?
prompt: מלומד יודע איפה לחפש את מה שהוא לא יודע. איפה הוא למד לחפש?

### 🏛️ האקדמיות של [[harkesh]]
id: harkesh_academy

בעלי הקשקשים מקבלים שם כבוד. אתה ישבת בשולי הכיתה, ושמעת הכול.

### 📜 הארכיונים הקיסריים
id: imperial_archives

עבדת בין הרשומות של האימפריה, וראית מה נמחק מהן.

### 🏺 הספריות של ממלכת הנהר
id: nurian_libraries

ב[[nuria_natal]], הממלכה האנושית העתיקה ביותר, שבה הספרים עתיקים מהאימפריה.

### 🪨 הכתובות בחורבות
id: ruin_inscriptions

למדת לבד מהכתובות בחורבות של [[cassilon]] ושל ממלכות שנפלו.

### 🕊️ העיר החופשית
id: free_city

באוניברסיטאות ובספריות של זובק, העיר החופשית ב[[crossroads]].

### 🕯️ חוג לימוד סודי
id: secret_circle

קבוצה קטנה שלמדה בלילות, ממה שאסור לקרוא.

## choice: details_sailor
when: background = sailor
context: background
title: ⚓ באיזו ספינה הפלגת?
prompt: מלח מכיר סערות ונמלים זרים. על איזה סיפון עמדת?

### 🏴 "המפרשים האדומים"
id: red_sails

השודדים של [[triolo]], שצדים את הספינות של הסולטן.

### 🐉 הצי של האימפריה
id: imperial_fleet

שירתת בצי של הסולטן, ושרדת כשהצי המערבי טבע.

### 🚢 ספינת סוחר
id: merchant_ship

ספינת סחר מ[[seven_cities]], בין נמל לנמל.

### 🌊 סירת נהר
id: river_boat

שטת על הנהר של [[nuria_natal]], בין מקדשים ושווקים.

### ⛓️ עבד חותר
id: galley_slave

חתרת בשרשראות בספינה של האימפריה, עד שהשרשרת נשברה.

## choice: details_scribe
when: background = scribe
context: background
title: ✒️ בשביל מי כתבת?
prompt: אף אחד לא מסתכל פעמיים על פקיד עם פנקס. בשביל מי ניהלת את הפנקס?

### 📜 משרד קיסרי
id: imperial_office

ניהלת חשבונות לאימפריה, כמו כל קוסם [[human|אנושי]] "מועיל".

### 🧾 בית מסחר
id: merchant_house

ספרי חשבונות של סוחר בבזאר הגדול של [[harkesh]].

### 🕯️ מעתיק במקדש
id: temple_copyist

העתקת כתבי קודש, וראית מה מוסיפים להם ומה מוחקים.

### ⚔️ אפסנאות הלגיון
id: quartermaster

ידעת בדיוק כמה יש בכל מחסן של הצבא, ומתי שיירת האספקה יוצאת.

### ✒️ מזייף
id: forger

כתבת היתרים ותעודות שלא היו אמורים להתקיים.

## choice: details_soldier
when: background = soldier
context: background
title: ⚔️ באיזה צבא שירתת?
prompt: חיילים אחרים מזהים את הדרגה שלך, גם אם ברחת. באיזה צבא קיבלת אותה?

### 🐉 לגיונות הדרקון
id: mharoti_legion

חייל [[jambuka]] בלגיון [[mharoti_empire|מהארוטי]], אולי בחיל ההלם של השורה הראשונה.

### 🛡️ בשורות האדג'ט
id: edjet

אחד מבני "הגזעים הנחותים" שהגיעו לשורות של [[edjet]], ועזבו.

### 🛞 צבא [[magdar_kingdom]]
id: magdar_army

עגלות המלחמה המשוריינות, שמתחברות לחומה ניידת נגד [[dragon]].

### 🐎 הפרשים של [[khazzaki]]
id: khazzaki_riders

רכבת עם שבטי הערבה, או צעדת בחיל הרגלים הכבד שלהם.

### 🏺 צבא ממלכת הנהר
id: nurian_army

הצבא של [[nuria_natal]], שהדף את האימפריה שוב ושוב.

### 💰 שכירי חרב
id: mercenary

חבורת שכירי חרב מ[[seven_cities]], שנלחמה בשביל מי ששילם.

## choice: details_urchin
when: background = urchin
context: background
title: 🏚️ באיזה רחוב גדלת?
prompt: ילד רחוב מכיר כל סמטה. איזו סמטה הייתה הבית שלך?

### 🏚️ רובע המשרתים
id: servants_quarter

רובע של [[halfling|חצאי-אדם]] ו[[gnome]], כמו [[little_reywald]].

### 🏙️ הסמטאות של הבזאר
id: bazaar_alleys

הבזאר הגדול של [[harkesh]], שבו תמיד יש משהו ליפול מעגלה.

### ⚓ נמל
id: port

נמל ב[[seven_cities]], בין מלחים, פיראטים ומחסנים.

### 🩸 העיר של האוגרים
id: kaanesh

[[kaanesh]], שבה ילד קטן לומד מהר להתחבא.

### 🐪 מחנות השיירות
id: caravan_camps

נדדת עם השיירות, וגדלת בין גמלים, סוחרים ושומרים.

## choice: details_wayfarer
when: background = wayfarer
context: background
title: 🛤️ איפה נדדת?
prompt: הלך דרכים ישן בכל מקום ונעלם בקהל. באילו דרכים?

### 🛤️ בשולי דרכי הדרקון
id: road_edges

[[jambuka]] בלי היתר, תמיד בשוליים של [[dragon_roads]].

### 🐪 בין השיירות
id: caravans

עבודות קטנות בכל שיירה שהסכימה לקחת אותך.

### ⚓ מנמל לנמל
id: ports

נמלים של [[seven_cities]], ספינה אחרי ספינה.

### 🌾 בערבה
id: steppe

[[rothenian_plain]], עם הנוודים.

### 🏙️ ברחובות הבירה
id: capital_streets

הרחובות של [[harkesh]], שבהם אף אחד לא שם לב לעוד פנים.

## text: details_other
when: background = _else
context: background
title: 📜 ספר/י עוד על הרקע שלך
prompt: איפה זה היה, עם מי, ומה נשאר לך ממנו היום?
