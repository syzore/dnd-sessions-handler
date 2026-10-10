# Session One glossary: draft content

Status: draft for the spec-writer and engineering. Researched 2026-10-10. Does not change `content/`.

## Read first

- **Hotlinking.** Every `koboldpress.com/wp-content/...` and `upload.wikimedia.org/...` image returned 200 with an image content-type, also when sent with a foreign `Referer`. Every `static.wikia.nocookie.net/...` image (Forgotten Realms wiki) returned **404 when a foreign `Referer` is sent** and 200 without one. Those lines are marked `[fandom: no-referrer]`. They render only with `<img referrerpolicy="no-referrer">` (or if we copy them locally).
- **FR wiki links.** `forgottenrealms.fandom.com/wiki/...` pages return 403 to curl (Cloudflare bot check) but open in a browser. Each page's existence was confirmed through the wiki's `api.php`.
- **Primary vs secondary.** Kobold Press (KP) blog posts reprint Midgard Worldbook text and are treated as primary. The Midgard Worldbook itself is not online. Where only `[WB-writeup]` backs a fact, the entry says so under `uncertain`. `[WB-writeup]` is a chapter-by-chapter fan summary of the 2018 Worldbook.
- **Hebrew.** `he` / `aliases_he` copy the spelling used in `content/session-one/`. Nothing is newly transliterated except inside the proposed bullets.

### Source keys

| key | URL |
| --- | --- |
| KP-origins | https://koboldpress.com/welcome-to-midgard-origins-of-the-mharoti-empire/ |
| KP-dragoncoil | https://koboldpress.com/welcome-to-midgard-lands-of-the-dragoncoil/ |
| KP-sultan | https://koboldpress.com/midgard-icons-the-dragon-sultan/ |
| KP-sultana | https://koboldpress.com/midgard-icons-the-dragon-sultana/ |
| KP-favor | https://koboldpress.com/midgard-monday-favor-of-the-dragon-empire/ |
| KP-volpe | https://koboldpress.com/midgard-expanded-the-travels-of-lucano-volpe-or-on-the-road-to-mharoti/ |
| KP-serpent | https://koboldpress.com/welcome-to-midgard-the-great-serpent/ |
| KP-worldnew | https://koboldpress.com/welcome-to-midgard-the-world-made-new/ |
| KP-azuran | https://koboldpress.com/midgard-monday-pilgrimage-to-the-shrines-of-azuran/ |
| KP-edjet | https://koboldpress.com/welcome-to-midgard-edjet-martial-archetype/ |
| KP-khazzaki | https://koboldpress.com/welcome-to-midgard-khanate-of-the-khazzaki/ |
| KP-nuria | https://koboldpress.com/welcome-to-midgard-nuria-natal/ |
| KP-wasted | https://koboldpress.com/welcome-to-midgard-the-wasted-west/ |
| KP-babayaga | https://koboldpress.com/welcome-to-midgard-grandmother-baba-yaga/ |
| KP-babayaga-icon | https://koboldpress.com/midgard-icons-baba-yaga-2/ |
| KP-favored | https://koboldpress.com/moving-to-midgard-favored-nations/ |
| KP-crossroads | https://koboldpress.com/moving-to-midgard-the-crossroads/ |
| KP-magdar | https://koboldpress.com/fight-dragons-in-style-and-safety-with-magdar-war-wagons/ |
| KP-kobolds | https://koboldpress.com/midgard-monday-casimirs-enchiridion-of-monsters-talks-about-kobolds/ |
| KP-cadua | https://koboldpress.com/midgard-icons-first-duke-admiral-cadua/ |
| KP-haunted | https://koboldpress.com/boss-fights-haunted-giant/ |
| WB-writeup | https://writeups.letsyouandhimfight.com/libertad/midgard-campaign-setting/ |
| FRW | https://forgottenrealms.fandom.com/wiki/<page> |
| DDB | https://www.dndbeyond.com/classes/<class> |

## 1. Inventory

| id | category | Hebrew in content | files |
| --- | --- | --- | --- |
| dragon | race | דרקונים / דרקון | world.md, lists/faith-known.md, lists/goliath-tribes.md, characters/* |
| drake | race | דרייקים | world.md, characters/vilhelm.md |
| dragonkin | race | בני-דרקון / בן-דרקון / בן-הדרקון | world.md, lists/goliath-tribes.md, characters/vilhelm.md |
| kobold | race | קובולדים / קובולד | world.md, characters/deq.md, characters/vilhelm.md |
| human | race | בני אדם / אנושי | world.md, characters/vilhelm.md, characters/bebby.md, lists/faith-known.md |
| halfling | race | חצי-אדם / חצאי-אדם | world.md, characters/bebby.md |
| elf | race | אלפים | world.md, characters/vilhelm.md |
| gnome | race | גנומים | world.md, characters/bebby.md, characters/vilhelm.md |
| goliath | race | גוליית | lists/goliath-tribes.md, characters/deq.md |
| giantkin | race | בני-ענק / בן ענקים | characters/deq.md |
| half-ogre | race | חצאי-אוגרים | characters/deq.md |
| giant | race | ענקים / ענקי האבן והאש | characters/deq.md, lists/goliath-tribes.md |
| hill-giant | race | ענקי הגבעות | characters/deq.md |
| ogre | race | אוגרים | lists/goliath-tribes.md |
| barbarian | class | ברברי | characters/deq.md |
| cleric | class | כוהן | characters/tenni.md |
| paladin | class | פלדין | characters/turator.md |
| wizard | class | קוסם | characters/vilhelm.md (+ mentions in bebby, deq, turator) |
| rogue | class | נוכל | characters/bebby.md, characters/turator.md |
| evoker | class | קוסם יסודות | characters/bebby.md (Deq's `on_evoker` step) |
| midgard | place | מידגארד | world.md, lists/faith-secret.md, characters/deq.md |
| mharoti-empire | place | האימפריה המהארוטית / אימפריית הדרקון | almost every file |
| harkesh | place | הרקש | characters/bebby.md, characters/vilhelm.md, lists/goliath-tribes.md |
| dragoncoil-mountains | place | הרי פיתול-הדרקון | lists/goliath-tribes.md |
| kaanesh | place | קא'נש | lists/goliath-tribes.md |
| nuria-natal | place | נוריה נטאל | world.md, lists/training.md, characters/bebby.md, turator.md, vilhelm.md |
| seven-cities | place | שבע הערים | world.md, characters/bebby.md |
| triolo | place | טריולו | world.md, characters/bebby.md |
| rothenian-plain | place | מישורי רותניה / מישור רותניה | world.md, lists/goliath-tribes.md |
| cassilon | place | קסילון | characters/deq.md |
| wasted-west | place | המערב השומם | characters/vilhelm.md |
| magdar-kingdom | place | ממלכת מגדר / מגדר | characters/turator.md, characters/vilhelm.md |
| crossroads | place | הצומת | lists/training.md |
| little-reywald | place | רייוולד הקטנה | characters/bebby.md |
| bahamut | god | בהאמוט | lists/gods.md |
| lathander | god | לאת'נדר | lists/gods.md |
| torm | god | טורם | lists/gods.md |
| selune | god | סלונה | lists/gods.md |
| ilmater | god | אילמטר | lists/gods.md |
| baal | god | בעל | lists/faith-known.md, characters/tenni.md |
| azuran | god | אזוראן | lists/faith-known.md |
| veles | god | ולס / וֶלֶס | world.md, lists/faith-known.md |
| loki | god | לוקי | characters/tenni.md |
| jambuka | faction | ג'מבוקה | world.md, lists/faith-known.md, lists/goliath-tribes.md, tenni.md, deq.md, vilhelm.md |
| edjet | faction | האדג'ט | world.md, characters/turator.md |
| morza | faction | המורזה / מורזה | world.md, lists/faith-known.md, characters/deq.md, characters/vilhelm.md |
| timar-legions | faction | לגיונות הטימאר | characters/vilhelm.md |
| khazzaki | faction | החזאקי / החאנות | world.md, lists/goliath-tribes.md |
| imperial-inquisitors | faction | האינקוויזיטורים | lists/faith-secret.md, lists/training.md, characters/turator.md |
| holy-orders | faction | המסדרים השבורים / מסדרי אבירים קדושים | characters/turator.md |
| ozmir-al-stragul | person | אוזמיר אל-סטרגול / סולטן האימה / הסולטן האיום | world.md, characters/vilhelm.md, characters/turator.md |
| casmara-azrabahir | person | סולטנה אנושית (unnamed) | world.md |
| baba-yaga | person | באבא יאגה | characters/bebby.md |
| law-of-masks | concept | חוק המסכות | lists/faith-secret.md |
| age-of-scales | concept | עידן הקשקשים | world.md |
| mharoti-castes | concept | סולם המעמדות / בעלי קשקשים | world.md, characters/vilhelm.md |
| sculpt-spells | concept | עיצוב לחשים | characters/vilhelm.md |
| dragon-roads | concept | הסליל של הדרקון / דרכי הדרקון | world.md |

Left out as too generic for a popup: מחתרת הג'מבוקה, לוחם קדוש, צלבן, אלמנטליסטים, כישוף מולד. The spec-writer can add them.

## 2. Entries

### Races

### dragon
- category: race
- he: דרקונים
- en: Dragon
- aliases_he: דרקון
- blurb: הדרקונים הם האדונים של האימפריה המהארוטית. במידגארד הם קשורים ליסודות (אש, רוח, אדמה, מים) ולא לצבעים ולמתכות. לפני כ-400 שנה הדרקון האדום מהארוט כרת ברית עם דרקונים שכנים ועם שבטי קובולדים, ומהברית הזאת נולדה האימפריה. הם בונים אימפריות שנקראות על שמם, ולא ישנים על ערימות זהב.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/f/f7/Dragons_-_Eva_Widermann.jpg/revision/latest?cb=20090625000836 [fandom: no-referrer]
- links: Origins of the Mharoti Empire (Kobold Press) — https://koboldpress.com/welcome-to-midgard-origins-of-the-mharoti-empire/
- links: Dragon (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Dragon
- sources: KP-origins (Mharot, 400 years, pact), KP-worldnew (dragons tied to elements, empires named after them)
- uncertain: The image is generic D&D art, not Midgard art.

### drake
- category: race
- he: דרייקים
- en: Drake
- aliases_he: none
- blurb: דרייקים הם קרובים קטנים יותר של הדרקונים: חיות מכונפות, ערמומיות ומסוכנות. הם שורצים בהרי פיתול-הדרקון, ומהם קיבלו ההרים את שמם. בצבא האימפריה הם חלק ממעמד האצולה של בעלי הקשקשים, ובקרב הם כוח אווירי. "מאכילים בו את הדרייקים" הוא איום שכל ג'מבוקה מכיר.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/d/d1/Drakes_4e.jpg/revision/latest?cb=20190816104038 [fandom: no-referrer]
- links: Lands of the Dragoncoil (Kobold Press) — https://koboldpress.com/welcome-to-midgard-lands-of-the-dragoncoil/
- links: Drake (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Drake
- sources: KP-origins ("drakes, wyrms, and wyverns" give the Dragoncoil its name); WB-writeup (Timarli caste includes drakes and wyverns)
- uncertain: Feeding prisoners to drakes is campaign content, not canon. The image is D&D 4e art.

### dragonkin
- category: race
- he: בני-דרקון
- en: Dragonkin (dragonborn in 5e)
- aliases_he: בן-דרקון, בן-הדרקון
- blurb: בני-דרקון הם בני אנוש-למחצה עם קשקשים, ראש דרקוני וזנב. הם העם הצעיר ביותר במידגארד, והם ממלאים את המעמדות האמצעיים והגבוהים של האימפריה: פועלים מיומנים, חיילי האדג'ט, קצינים ופקידים. במשחק הם ה-dragonborn של D&D. הסולטן הנוכחי, אוזמיר אל-סטרגול, הוא הראשון מבני-הדרקון שעלה לכס.
- image: https://koboldpress.com/wp-content/uploads/2018/06/dragonkin-2.jpg
- image: https://koboldpress.com/wp-content/uploads/2016/11/Dragonkin.jpg
- links: Lands of the Dragoncoil (Kobold Press) — https://koboldpress.com/welcome-to-midgard-lands-of-the-dragoncoil/
- links: Dragonborn (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Dragonborn
- sources: KP-origins ("for the first time one of the dragonborn"); WB-writeup (Dragonborn, called Dragonkin in the 2012 book, are Midgard's youngest race; Sekban/Edjet/Akinji castes)
- uncertain: none

### kobold
- category: race
- he: קובולדים
- en: Kobold
- aliases_he: קובולד
- blurb: הקובולדים הם יצורים קטנים וזוחלים, "ילדי הדרקון". כשנוסדה האימפריה הם נשבעו אמונים לדרקונים תמורת הגנה. היום הם אזרחים מלאים במעמד משלהם, הקובולדי, מעל הג'מבוקה. הם שולטים בגילדות הכרייה והאריגה, משמשים חבלנים ואלכימאים בצבא, ויש להם תחושת עליונות מנופחת כי הם "קרובי משפחה" של הדרקונים.
- image: https://koboldpress.com/wp-content/uploads/2016/11/Kobold-Miner.jpg
- image: https://static.wikia.nocookie.net/forgottenrealms/images/f/f3/Monster_Manual_5e_-_Kobold_-_p195.jpg/revision/latest?cb=20141112221803 [fandom: no-referrer]
- links: Casimir's Enchiridion: kobolds (Kobold Press) — https://koboldpress.com/midgard-monday-casimirs-enchiridion-of-monsters-talks-about-kobolds/
- links: Kobold (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Kobold
- sources: KP-origins (kobold allegiance, kobold alchemy, settlers in Rumela); KP-favor (Koboldi caste above Jambuka); KP-volpe ("Kobaldi... full citizens"); WB-writeup (inflated superiority, mining and weaving guilds)
- uncertain: none

### human
- category: race
- he: בני אדם
- en: Human
- aliases_he: אנושי
- blurb: במידגארד בני האדם הם העם הנפוץ ביותר, אבל באימפריה המהארוטית הם אזרחים סוג ב'. כל אדם בלי קשקשים הוא ג'מבוקה. לאורך רוב ההיסטוריה של האימפריה ישבו על הכס סולטן או סולטנה אנושיים, כי הדרקונים לא סמכו זה על זה. ההפיכה של אוזמיר אל-סטרגול סיימה את זה.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/b/bd/5eR_Humans.jpg/revision/latest?cb=20250529030721 [fandom: no-referrer]
- links: Origins of the Mharoti Empire (Kobold Press) — https://koboldpress.com/welcome-to-midgard-origins-of-the-mharoti-empire/
- links: Human (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Human
- sources: KP-origins ("humans and their kin are distinctly second-class citizens"; human rulers until the coup)
- uncertain: none

### halfling
- category: race
- he: חצי-אדם
- en: Halfling
- aliases_he: חצאי-אדם
- blurb: חצאי-אדם הם עם קטן וזריז. במידגארד רבים מהם נודדים בנהרות כ"עם הנהר", סוחרים ומבריחים. בדורניג הם, יחד עם הגנומים, מעמד משרתים, ויש להם רובע משלהם בעיר רייוולד: רייוולד הקטנה. באימפריה המהארוטית הם ג'מבוקה ככל השאר.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/3/38/Halflings_5eR.png/revision/latest?cb=20251028032610 [fandom: no-referrer]
- image: https://koboldpress.com/wp-content/uploads/2020/03/COVER_WLK17_Halflings.jpg
- links: Riverfolk Halflings (Kobold Press) — https://koboldpress.com/warlocks-apprentice-riverfolk-halflings-the-scattered-people-of-the-trade/
- links: Halfling (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Halfling
- sources: KP riverfolk post; WB-writeup ("Halflings and gnomes are a common servant class... Little Reywald")
- uncertain: The content's "חצי-אדם" was read as halfling from context: Bebby is a rogue, and the halfling-and-gnome pairing plus Little Reywald match canon. Check with Aviv.

### elf
- category: race
- he: אלפים
- en: Elf
- aliases_he: none
- blurb: האלפים שלטו פעם במערב מידגארד, ולפני כ-500 שנה רובם עזבו לממלכות הפיות ב"נסיגה הגדולה". מעטים נשארו: אלפי הצל, הרוכבים הנודדים של מישורי רותניה, ואלפי היער ארבונס. באימפריה אלף הוא ג'מבוקה, בדיוק כמו אדם.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/e/e2/5eR_Elves.jpg/revision/latest?cb=20250529031259 [fandom: no-referrer]
- links: Moving to Midgard: Favored Nations (Kobold Press) — https://koboldpress.com/moving-to-midgard-favored-nations/
- links: Elf (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Elf
- sources: KP-favored (Great Retreat nearly 500 years ago); WB-writeup (shadow fey, Windrunners, Arbonesse elves)
- uncertain: none

### gnome
- category: race
- he: גנומים
- en: Gnome
- aliases_he: none
- blurb: הגנומים של מידגארד חיים ביער נימהיים. כדי להינצל מזעמה של באבא יאגה הם מכרו את עצמם לשטני הגיהנומים האחד-עשר. באבא יאגה לא שוכחת עלבון: הכוחות שלה צדים כל גנום שיוצא לעולם הפתוח. באימפריה גנום הוא ג'מבוקה.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/c/cb/5eR_Gnomes.png/revision/latest?cb=20251028031317 [fandom: no-referrer]
- links: Grandmother Baba Yaga (Kobold Press) — https://koboldpress.com/welcome-to-midgard-grandmother-baba-yaga/
- links: Gnome (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Gnome
- sources: KP-babayaga ("never forgets a slight, as the gnomes of Midgard learned"; "slaves of the arch-devils of the Eleven Hells to escape Baba Yaga's wrath"); KP-babayaga-icon (Gnome King is her principal enemy); WB-writeup (gnomes can't leave Niemheim before her forces track them)
- uncertain: The content says she "cursed" the gnomes. Canon frames it as wrath and a grudge, and the gnomes' own devil pact.

### goliath
- category: race
- he: גוליית
- en: Goliath
- aliases_he: none
- blurb: גוליית הם עם ענק-למחצה מספרי D&D: גבוהים, חזקים, עם עור דמוי אבן ודם של ענקים. במידגארד אין עם בשם הזה, ולכן כאן קוראים להם בני-ענק או חצאי-אוגרים. השבטים של דק (שובר-העצם, מנודי קא'נש, רוכבי-האבן) הם תוספת של הקמפיין.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/1/15/United_colors_of_goliaths_5point5e.jpg/revision/latest?cb=20241016184327 [fandom: no-referrer]
- links: Goliath (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Goliath
- sources: FRW Goliath; deq.md ("אין כאן גוליית")
- uncertain: Goliaths are not a Midgard race in any KP source found. The four tribes in lists/goliath-tribes.md are campaign invention placed on canon geography (Dragoncoil, Kaa'nesh, Rothenian Plain).

### giantkin
- category: race
- he: בני-ענק
- en: Giantkin
- aliases_he: בן ענקים
- blurb: "בני-ענק" הוא השם שמידגארד נותנת כאן לצאצאי הענקים בגובה של אדם גבוה מאוד. הם נושאים בדמם את הכוח, ולפעמים גם את הרוחות, של אבותיהם. בעיני האימפריה הם ג'מבוקה גדולים: כוח עבודה, לוחמי זירה או חיל הלם.
- image: https://koboldpress.com/wp-content/uploads/2020/03/jotun-giant-e1684121716623.jpg
- links: Goliath (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Goliath
- sources: deq.md; WB-writeup (trollkin are "mixed giant and fey bloodlines", the closest canon people)
- uncertain: "Giantkin" as a people is not confirmed in canon. Midgard's closest canon peoples are trollkin (giant and fey blood) and the "tusked ogrekin" of Kaa'nesh. The image shows a KP jotun giant, not giantkin.

### half-ogre
- category: race
- he: חצאי-אוגרים
- en: Half-ogre
- aliases_he: none
- blurb: חצאי-אוגרים הם צאצאים של אוגרים ובני אדם: ענקיים, חזקים, ובעיני רבים פראיים. במידגארד העיר המהארוטית קא'נש מפורסמת באוגרים שלה, שמגויסים כחיל הלם. זה השם השני שבו מכנים את דק.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/6/60/Half-ogre-5e.jpg/revision/latest?cb=20171011024251 [fandom: no-referrer]
- links: Half-ogre (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Half-ogre
- sources: FRW Half-ogre; KP-dragoncoil ("Kaa'nesh, home of the tusked ogrekin"); WB-writeup (Kaa'Nesh ogres as shock troops)
- uncertain: Midgard uses "ogrekin". "Half-ogre" is the D&D term.

### giant
- category: race
- he: ענקים
- en: Giant
- aliases_he: ענקי האבן והאש
- blurb: הענקים של מידגארד מספרים שהעולם נברא מגופתו של אביהם הנרצח, אאורגלמיר. בעבר היו להם ממלכות גדולות, כמו קסילון שבה חיו ענקים ועמים קטנים יחד, והן נפלו במלחמות הקוסמים הגדולות. היום רבים מהם נודדים בדרום המערב השומם, רדופים בידי רוחות אבותיהם. ענקי אש לוחמים בצבאות האימפריה, ושולי הצפון הם ארצם של ענקי הכפור.
- image: https://koboldpress.com/wp-content/uploads/2023/04/Haunted-Giant.png
- links: Welcome to Midgard: The Wasted West (Kobold Press) — https://koboldpress.com/welcome-to-midgard-the-wasted-west/
- links: Giant (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Giant
- sources: KP-wasted ("dead-eyed giants haunted by their ghostly ancestors"); KP-dragoncoil ("Fire giants support the Mharoti armies"); WB-writeup (Aurgelmir, Cassilon); KP-serpent (Veles "Patron of Giants and Dragons")
- uncertain: That stone and fire giants ruled the Dragoncoil peaks before the dragons (goliath-tribes.md) is campaign invention.

### hill-giant
- category: race
- he: ענקי הגבעות
- en: Hill giant
- aliases_he: none
- blurb: ענקי הגבעות הם הענקים הנמוכים והגסים ביותר: רעבים תמיד, נואשים לאוכל ולאדמה. משפחות ענקי הגבעות של דק מתייחסות לקסילון האגדית. האימפריה צדה אותם, משעבדת אותם ושולחת אותם בשורה הראשונה של הלגיונות.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/0/0f/HillGiant-5e.jpg/revision/latest?cb=20141112170803 [fandom: no-referrer]
- links: Hill giant (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Hill_giant
- sources: FRW Hill giant; deq.md
- uncertain: That the Mharoti hunt and enslave hill giants as shock troops is not found in KP sources. Canon shock troops are Kaa'nesh ogres and allied fire giants.

### ogre
- category: race
- he: אוגרים
- en: Ogre
- aliases_he: none
- blurb: אוגרים הם ענקים קטנים, אכזריים וחזקים מאוד. בעיר המהארוטית קא'נש מקעקעים מגי-דם קעקועים קסומים על אוגרים, כדי שישאבו חיים מכל מי שהם פוצעים בקרב פנים אל פנים. לכן הם חיל הלם יקר.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/f/f0/Ogre_5point5e.jpg/revision/latest?cb=20250321153542 [fandom: no-referrer]
- image: https://koboldpress.com/wp-content/uploads/2023/06/Tusked-Crimson-Ogre.png
- links: Ogre (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Ogre
- links: Khanate of the Khazzaki (Kobold Press) — https://koboldpress.com/welcome-to-midgard-khanate-of-the-khazzaki/
- sources: KP-khazzaki ("Kaa'nesh is a home of ogres and dragonkin"); WB-writeup (blood mages' tattoos)
- uncertain: The KP "Tusked Crimson Ogre" image is a KP monster, not confirmed as a Kaa'nesh ogre.

### Classes

### barbarian
- category: class
- he: ברברי
- en: Barbarian
- aliases_he: none
- blurb: ברברי הוא לוחם שהכוח שלו בא מזעם. בקרב הוא נכנס לסערת זעם שמחזקת את המכות שלו ומקהה את הכאב. בכל ברברי יש משהו פראי: רוחות, טבע, או אבות קדומים שמתעוררים בדם. במידגארד יש אפילו "דרך האבות" שבה רוחות האבות נלחמות לצד הברברי.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/1/1f/Barbarian_5point5e.jpg/revision/latest?cb=20240717190611 [fandom: no-referrer]
- image: https://koboldpress.com/wp-content/uploads/2018/08/barbarian.jpg
- links: Barbarian (D&D Beyond) — https://www.dndbeyond.com/classes/barbarian
- links: Primal Path of the Ancestors (Kobold Press) — https://koboldpress.com/welcome-to-midgard-primal-path-of-the-ancestors/
- sources: DDB Barbarian; KP Primal Path of the Ancestors post
- uncertain: none

### cleric
- category: class
- he: כוהן
- en: Cleric
- aliases_he: none
- blurb: כוהן הוא שליח של אל. הכוח שלו בא מאמונה ולא מספרים: הוא מרפא, מברך, מגרש מתים-חיים ומטיל קסם אלוהי. כל כוהן בוחר תחום של האל שלו, כמו חיים, אור או מלחמה. באימפריית הדרקון כוהן של אל לא-דרקוני הוא כופר.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/8/8f/Cleric_PHB5e2024.png/revision/latest?cb=20240904051450 [fandom: no-referrer]
- links: Cleric (D&D Beyond) — https://www.dndbeyond.com/classes/cleric
- sources: DDB Cleric; lists/faith-known.md
- uncertain: none

### paladin
- category: class
- he: פלדין
- en: Paladin
- aliases_he: none
- blurb: פלדין הוא לוחם קדוש שקשור בשבועה. הכוח שלו בא מהשבועה עצמה: מכה קדושה, ריפוי בידיים והילה שמגינה על בני בריתו. כל עוד הוא עומד בשבועה, הקסם שלו נשאר. במידגארד מסדרי אבירים קדושים, כמו מסדר השמש שאינה מתה בממלכת מגדר, נלחמים בדרקונים כבר דורות.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/2/29/Paladin_PHB5e2024.png/revision/latest?cb=20240904055130 [fandom: no-referrer]
- links: Paladin (D&D Beyond) — https://www.dndbeyond.com/classes/paladin
- sources: DDB Paladin; KP-origins (Knights of the Undying Sun at Marroc's Field); WB-writeup (Undying Sun paladins of Khors)
- uncertain: none

### wizard
- category: class
- he: קוסם
- en: Wizard
- aliases_he: none
- blurb: קוסם לומד קסם מספרים. הוא מעתיק לחשים לספר הלחשים שלו, מכין אותם מראש ומבין את חוקי הקסם כמו מדען. בניגוד למכשף, שהקסם זורם בדמו, הקוסם הרוויח כל לחש בעבודה. לכן האימפריה רואה בקוסם אנושי "עבד שמנסה לקנות כוח של דרקון בספרים".
- image: https://static.wikia.nocookie.net/forgottenrealms/images/7/74/Wizard-2024.jpg/revision/latest?cb=20240917124335 [fandom: no-referrer]
- links: Wizard (D&D Beyond) — https://www.dndbeyond.com/classes/wizard
- sources: DDB Wizard; characters/vilhelm.md
- uncertain: none

### rogue
- category: class
- he: נוכל
- en: Rogue
- aliases_he: none
- blurb: נוכל חי על זריזות, ערמומיות וידע במקום שבו אחרים לא מסתכלים. הוא פוגע בדיוק בנקודה החלשה ("התקפת פתע"), מתגנב, פורץ מנעולים ומנטרל מלכודות. נוכל יכול להיות גנב, מרגל, מבריח או מתנקש, וכמעט תמיד יש לו דרך החוצה.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/9/9b/Rogue_PHB5e2024.png/revision/latest?cb=20240904061438 [fandom: no-referrer]
- links: Rogue (D&D Beyond) — https://www.dndbeyond.com/classes/rogue
- sources: DDB Rogue
- uncertain: none

### evoker
- category: class
- he: קוסם יסודות
- en: Evoker (Wizard, School of Evocation)
- aliases_he: none
- blurb: קוסם יסודות הוא קוסם שהתמחה באסכולת ההעלאה (Evocation): לחשים שמשחררים אש, ברק, קור וחומצה, כמו כדור אש. הוא יכול "לעצב" את הפיצוצים כך שבני בריתו לא ייפגעו. באימפריה שבה הרס יסודי שייך לדרקונים, קוסם כזה הוא נשק וכופר בבת אחת.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/a/a5/Evocation_BGIII.png/revision/latest?cb=20221025150459 [fandom: no-referrer]
- links: Wizard, School of Evocation (D&D Beyond) — https://www.dndbeyond.com/classes/wizard
- links: Evocation (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Evocation
- sources: DDB Wizard (Evoker subclass); FRW Evocation
- uncertain: The content says "קוסם יסודות" (elemental wizard). Mapping it to Evoker rests on Vilhelm's `element` step, Deq's `on_evoker` step and "עיצוב לחשים" (Sculpt Spells). Mixed-language note: 2024 rules call the subclass "Evoker"; 2014 rules call it "School of Evocation".

### Places

### midgard
- category: place
- he: מידגארד
- en: Midgard
- aliases_he: none
- blurb: מידגארד הוא העולם של הקמפיין, מבית Kobold Press. הוא דיסקה שטוחה שצפה בין כוכבים חיים, וסביב הקצה שלה מתפתל ולס, נחש-העולם, שנושך את זנבו. הדרקונים בו קשורים ליסודות, קווי ליי של קסם חוצים את האדמה, והאלים עוטים מסכות ומופיעים בשמות שונים בכל ארץ.
- image: https://koboldpress.com/wp-content/uploads/2018/03/Midgard-Worldbook-COVER.jpg
- links: Midgard (Kobold Press) — https://koboldpress.com/midgard/
- links: Welcome to Midgard: The World Made New (Kobold Press) — https://koboldpress.com/welcome-to-midgard-the-world-made-new/
- sources: KP-worldnew (flat world, living stars, surrounded by a serpent, dragons tied to elements, gods wear masks); KP-serpent
- uncertain: none

### mharoti-empire
- category: place
- he: האימפריה המהארוטית
- en: Mharoti Empire (the Dragon Empire)
- aliases_he: אימפריית הדרקון, מהארוטי
- blurb: האימפריה המהארוטית, "אימפריית הדרקון", היא הממלכה הגדולה והחזקה ביותר במידגארד. היא נוסדה לפני כ-400 שנה בברית של הדרקון האדום מהארוט עם דרקונים שכנים ושבטי קובולדים. הדרקונים שולטים בה, בעלי הקשקשים מעל כולם, ובני האדם הם אזרחים סוג ב'. היא נלחמת בכמה חזיתות בבת אחת: ממלכת מגדר, נוריה נטאל, שבע הערים ואימפריות במזרח.
- image: https://koboldpress.com/wp-content/uploads/2023/12/map_MharotiEmpire.jpg
- image: https://koboldpress.com/wp-content/uploads/2023/08/Mharoti-Emissary.png
- links: Origins of the Mharoti Empire (Kobold Press) — https://koboldpress.com/welcome-to-midgard-origins-of-the-mharoti-empire/
- links: Lands of the Dragoncoil (Kobold Press) — https://koboldpress.com/welcome-to-midgard-lands-of-the-dragoncoil/
- sources: KP-origins; KP-dragoncoil
- uncertain: The map is from a KP "rumors" post and carries red numbered markers.

### harkesh
- category: place
- he: הרקש
- en: Harkesh
- aliases_he: none
- blurb: הרקש, "עיר הזהב", היא בירת האימפריה המהארוטית. שם נמצא ארמון שמונת היסודות של הסולטן. בבזאר הגדול שלה "אלף דוכנים", וגם סוחרים מארצות אויב באים אליה, כי מסחר לא מכיר גבולות. בעיר יש גם מקדשים גדולים לאזוראן ולוולס.
- image: https://koboldpress.com/wp-content/uploads/2023/12/map_MharotiEmpire.jpg
- links: Midgard Icons: The Dragon Sultan (Kobold Press) — https://koboldpress.com/midgard-icons-the-dragon-sultan/
- links: Pilgrimage to the Shrines of Azuran (Kobold Press) — https://koboldpress.com/midgard-monday-pilgrimage-to-the-shrines-of-azuran/
- sources: KP-sultan (Golden City, Imperial Palace of the Eight Elements); KP-dragoncoil (Grand Bazaar, "a thousand stalls"); KP-azuran (Four Pillars of Wisdom); KP-serpent (Portal of the Void, Veles's main shrine); WB-writeup (trade hub)
- uncertain: No dedicated Harkesh image exists. The empire map shows Harkesh at its west end (checked visually).

### dragoncoil-mountains
- category: place
- he: הרי פיתול-הדרקון
- en: Dragoncoil Mountains
- aliases_he: none
- blurb: הרי פיתול-הדרקון הם רכס ההרים שבלב האימפריה המהארוטית. דרייקים, תולעים וויברנים שורצים בהם, ומהם קיבלו ההרים את שמם. רוב הדרקונים השליטים באים מכאן. ההרים עשירים בקסם של קווי ליי, ושיירות מעדיפות לעקוף אותם.
- image: https://koboldpress.com/wp-content/uploads/2023/12/map_MharotiEmpire.jpg
- links: Origins of the Mharoti Empire (Kobold Press) — https://koboldpress.com/welcome-to-midgard-origins-of-the-mharoti-empire/
- sources: KP-origins; KP-volpe (caravans avoid the Dragoncoil); WB-writeup (ley line magic; most morza come from the region)
- uncertain: The Hebrew "פיתול-הדרקון" renders "Dragoncoil" well. Goliath tribes on the highest peaks are campaign invention.

### kaanesh
- category: place
- he: קא'נש
- en: Kaa'nesh
- aliases_he: none
- blurb: קא'נש היא עיר מהארוטית למרגלות הרי פיתול-הדרקון, בקצה הדרומי של מישורי רותניה. היא ביתם של אוגרים ובני-דרקון שמתעבים את פרשי החזאקי. החאן ניסה לכבוש אותה שוב ושוב ונכשל. מגי-הדם שלה מקעקעים אוגרים והופכים אותם לחיל הלם.
- image: none verified
- links: Khanate of the Khazzaki (Kobold Press) — https://koboldpress.com/welcome-to-midgard-khanate-of-the-khazzaki/
- sources: KP-khazzaki (Kaa'nesh, ogres and dragonkin, failed sieges, edjet shot near its walls); KP-dragoncoil ("tusked ogrekin"); WB-writeup (spelled Kaa'Nesh; blood mages)
- uncertain: Canon spelling varies: "Kaa'nesh" / "Kaa'Nesh".

### nuria-natal
- category: place
- he: נוריה נטאל
- en: Nuria Natal
- aliases_he: none
- blurb: נוריה נטאל היא "ממלכת הנהר" בדרום, הממלכה האנושית העתיקה ביותר במידגארד, בהשראת מצרים. האלים שלה (אטן, הורוס, בסטת) הולכים על הארץ כשקוראים להם. כשהם לא ענו, הקימו הנורים לתחייה מלכים קדומים, והמלכים-האלים האלה הדפו את הדרקונים שוב ושוב. מאז הם נשארו, וזה מסבך את הפוליטיקה. הסולטן החדש חולם לכבוש אותה.
- image: https://koboldpress.com/wp-content/uploads/2018/07/nuria-natal-2.jpg
- image: https://koboldpress.com/wp-content/uploads/2018/07/nuria-natal-map.jpg
- links: Welcome to Midgard: Nuria Natal (Kobold Press) — https://koboldpress.com/welcome-to-midgard-nuria-natal/
- sources: KP-nuria (dozen conquest attempts repelled; Aten, Horus, Bastet; resurrected kings); KP-sultan (Ozmir's goal: conquer Nuria Natal); WB-writeup (oldest continuous human kingdom, about 5,000 years)
- uncertain: none

### seven-cities
- category: place
- he: שבע הערים
- en: Seven Cities (Septime Cities)
- aliases_he: none
- blurb: שבע הערים הן חצי-אי בצורת מגף ממערב לאימפריה: ערי-מדינה של סוחרים, שכירי חרב ופיראטים, שרבות ביניהן כבר מאות שנים. אחת מהן, איליריה, נכבשה בידי האימפריה. השאר הטביעו את הצי המהארוטי ונותנות מחסה לסולטנה המודחת. בין הערים: טריולו, ולרה, קפליאון וקאמאיי.
- image: https://koboldpress.com/wp-content/uploads/2024/02/map_SevenCities.jpg
- links: Moving to Midgard: Favored Nations (Kobold Press) — https://koboldpress.com/moving-to-midgard-favored-nations/
- links: Midgard Icons: The Dragon Sultan (Kobold Press) — https://koboldpress.com/midgard-icons-the-dragon-sultan/
- sources: KP-favored (boot-shaped peninsula, "also called the Septime Cities", Mharoti to the east); KP-sultan (Illyria conquered; Ragusa Narrows); KP-origins (Valera); WB-writeup (city list)
- uncertain: Canon actually lists eight cities.

### triolo
- category: place
- he: טריולו
- en: Triolo
- aliases_he: none
- blurb: טריולו היא עיר נמל של סוחרים בשבע הערים, וחלק גדול מתושביה מינוטאורים. בראשה עומד הדוכס-האדמירל הראשון קדואה, המינוטאור הראשון בתפקיד. השודדים שלה, "המפרשים האדומים", צדים את ספינות הסולטן. הצי שלה היה בין אלה שהטביעו את הצי המערבי של האימפריה.
- image: https://koboldpress.com/wp-content/uploads/2013/05/Midgard-Minotaur-Corsair.jpg
- links: Midgard Icons: First Duke-Admiral Cadua (Kobold Press) — https://koboldpress.com/midgard-icons-first-duke-admiral-cadua/
- sources: KP-cadua; KP-origins (Triolo's minotaur corsairs, red-sailed pirates; Mharoti fleet lost to Triolo and Kyprion); KP-nuria ("merchant-city of Triolo")
- uncertain: none

### rothenian-plain
- category: place
- he: מישורי רותניה
- en: Rothenian Plain
- aliases_he: מישור רותניה
- blurb: מישורי רותניה הם ערבה עצומה בצפון-מזרח מידגארד: עשב בלי סוף, נהרות ותלי קבורה עתיקים. נוודים נודדים בה, החזאקי והקאריב, עם בני-ברית קנטאורים. באבא יאגה אוהבת לשחק בהם זה נגד זה. בקצה הדרומי שלה המישור נעצר מול הרי פיתול-הדרקון והעיר קא'נש.
- image: https://koboldpress.com/wp-content/uploads/2017/01/rothenianbg.jpg
- links: Khanate of the Khazzaki (Kobold Press) — https://koboldpress.com/welcome-to-midgard-khanate-of-the-khazzaki/
- sources: KP-khazzaki; WB-writeup (Rothenian Plain chapter: nomads, Baba Yaga's stomping grounds)
- uncertain: The image is KP banner art (centaurs and a figure in a flying mortar), not a landscape.

### cassilon
- category: place
- he: קסילון
- en: Cassilon
- aliases_he: none
- blurb: קסילון הייתה ממלכה קוסמופוליטית במערב, שבה חיו ענקים ועמים קטנים זה לצד זה. במלחמות הקוסמים הגדולות חדרו לעיר מכשפים טיפלינגים מקאלמרת וזימנו שדים לרחובות, והיא נשרפה. היום היא חורבות במערב השומם, ומשפחות ענקים עוד זוכרות אותה.
- image: https://koboldpress.com/wp-content/uploads/2018/07/wasted-west-wizard.jpg
- links: Welcome to Midgard: The Wasted West (Kobold Press) — https://koboldpress.com/welcome-to-midgard-the-wasted-west/
- sources: KP-wasted ("tiefling sorcerers from withered Caelmarath infiltrated Cassilon and summoned powerful fiends"); WB-writeup ("cosmopolitan realm of giants and shorter races... burned down by Caelmarath's devilish patrons")
- uncertain: The content calls it a "city of craft and trade" tied to hill giants, and says giant ruins carry a "curse". Canon makes it a mixed giant and human magocracy destroyed in the Mage Wars. The hill-giant link is campaign framing. The image is a general Wasted West illustration.

### wasted-west
- category: place
- he: המערב השומם
- en: The Wasted West
- aliases_he: none
- blurb: המערב השומם היה פעם ארץ פורחת של ממלכות קוסמים אנושיות. אחרי שהאלפים עזבו, הקוסמים פנו זה נגד זה ב"מלחמות הקוסמים הגדולות". הם זימנו יצורים זרים ענקיים, "ההולכים האיומים", שהרסו עיר אחר עיר. היום זו שממה של חורבות, גובלינים של אבק וקוסמים מתים-חיים. האימפריה זוכרת את המקום כהוכחה למה שקורה כשבני אדם מקבלים קסם.
- image: https://koboldpress.com/wp-content/uploads/2018/07/wasted-west-wizard.jpg
- links: Welcome to Midgard: The Wasted West (Kobold Press) — https://koboldpress.com/welcome-to-midgard-the-wasted-west/
- sources: KP-wasted
- uncertain: That the Mharoti cite the Wasted West as a reason to distrust human wizards is campaign framing. It fits canon.

### magdar-kingdom
- category: place
- he: ממלכת מגדר
- en: Magdar Kingdom
- aliases_he: מגדר
- blurb: ממלכת מגדר היא ממלכת אבירים בצפון-מערב האימפריה, מדרום לצומת. שני מסדרי אבירים, מסדר השמש שאינה מתה ומסדר הסערה, משרתים את חורס, לאדה ופרון. לפני שבע שנים נהרגו המלך סטפנוס ובנו בכורו בקרב נגד הלגיונות המהארוטיים. המגדרים מפורסמים בעגלות מלחמה משוריינות שמתחברות לחומה ניידת נגד דרקונים.
- image: https://koboldpress.com/wp-content/uploads/2023/04/map_MagdarKingdom.jpg
- links: Fight dragons with Magdar war wagons (Kobold Press) — https://koboldpress.com/fight-dragons-in-style-and-safety-with-magdar-war-wagons/
- links: Origins of the Mharoti Empire (Kobold Press) — https://koboldpress.com/welcome-to-midgard-origins-of-the-mharoti-empire/
- sources: KP-magdar ("South of the Crossroads... Magdar Kingdom"); KP-origins (King Stephanos killed at Marroc's Field; Knights of the Undying Sun); WB-writeup (two orders; Khors, Lada, Perun; war wagons)
- uncertain: none

### crossroads
- category: place
- he: הצומת
- en: The Crossroads
- aliases_he: none
- blurb: הצומת הוא לב מידגארד: אזור של ממלכות פיאודליות, נתיבי מסחר ויער המרגרייב העתיק. במרכזו העיר החופשית זובק, "עיר הצומת". במקומות כאלה אפשר עדיין להתפלל בגלוי לאלים שהאימפריה אוסרת.
- image: https://koboldpress.com/wp-content/uploads/2012/11/Players-Guide-Crossroads.jpg
- image: https://koboldpress.com/wp-content/uploads/2019/03/zobecker.jpg
- links: Moving to Midgard: The Crossroads (Kobold Press) — https://koboldpress.com/moving-to-midgard-the-crossroads/
- sources: KP-crossroads ("Crossroads of Midgard—the heart of commerce"); KP pirates-and-rogues post ("Zobeck is called the Crossroads City")
- uncertain: The first image is a book cover (Player's Guide to the Crossroads).

### little-reywald
- category: place
- he: רייוולד הקטנה
- en: Little Reywald
- aliases_he: none
- blurb: רייוולד הקטנה הוא רובע המשרתים של חצאי-האדם והגנומים בעיר רייוולד, בדוכסות הגדולה דורניג. הקיסרית האלפית ישנה בעיר בשינה קסומה, וההמונים שבאים לחלות את פניה ממלאים את הרובעים. הרובע מוזכר כאן כדוגמה למקום שבו מכניסים חצאי-אדם וגנומים יחד.
- image: https://koboldpress.com/wp-content/uploads/2023/12/map_Dornig_rumors.jpg
- links: Moving to Midgard: Favored Nations (Kobold Press) — https://koboldpress.com/moving-to-midgard-favored-nations/
- sources: WB-writeup ("Halflings and gnomes are a common servant class and have their own neighborhood called Little Reywald"); KP-favored (Reywald, Imperatrix's slumber)
- uncertain: Little Reywald is in Dornig, not in the Mharoti Empire. The content does not say where it is, but a reader may assume it is an imperial district. "Little Reywald" itself is confirmed only via WB-writeup. The map shows Reywald (checked visually), not the district.

### Gods

### bahamut
- category: god
- he: בהאמוט
- en: Bahamut
- aliases_he: none
- blurb: בהאמוט, "דרקון הפלטינה", הוא אל הצדק, ההגנה והדרקונים הטובים. הוא מופיע כדרקון כסוף-לבן ענק, ולפעמים כזקן מתהלך עם שבעה כנריים. באימפריה שבה דרקונים הם אדונים, אל-דרקון שמגן על החלשים הוא סתירה מסוכנת.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/7/7f/Bahamut_holy_symbol.jpg/revision/latest?cb=20210711114805 [fandom: no-referrer]
- links: Bahamut (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Bahamut
- sources: FRW Bahamut ("the Platinum Dragon"; old man with seven canaries is a standard FR depiction)
- uncertain: Bahamut is not part of the Midgard pantheon. The campaign brings D&D gods in through the Law of Masks. The image is his holy symbol, not a portrait.

### lathander
- category: god
- he: לאת'נדר
- en: Lathander
- aliases_he: none
- blurb: לאת'נדר, "אדון השחר", הוא אל השחר, האביב וההתחדשות. הוא מייצג התחלות חדשות, יצירה ותקווה, וכוהניו לוחמים במתים-חיים. במידגארד, לפי חוק המסכות, אפשר לראות בו פנים של אלי השמש והשחר המקומיים, חורס ולאדה.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/e/e5/Lathander_p39-1-.jpg/revision/latest?cb=20091224154952 [fandom: no-referrer]
- links: Lathander (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Lathander
- sources: FRW Lathander ("the Morninglord"); WB-writeup (Khors sun god, Lada goddess of dawn)
- uncertain: The mask link to Khors or Lada is a suggestion, not canon.

### torm
- category: god
- he: טורם
- en: Torm
- aliases_he: none
- blurb: טורם, "האמיתי", הוא אל החובה, הנאמנות והאבירות. הוא דורש לעמוד במילה גם כשהמחיר כבד, ומאמיניו רואים בעצמם את המגינים של חפים מפשע. זה אל טבעי לפלדינים ולאבירים.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/0/0f/Torm.jpg/revision/latest?cb=20070706153755 [fandom: no-referrer]
- links: Torm (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Torm
- sources: FRW Torm ("the True")
- uncertain: Not a Midgard god. The image is old 3e-era art.

### selune
- category: god
- he: סלונה
- en: Selûne
- aliases_he: none
- blurb: סלונה, "גבירת הירח", היא אלת הירח, הכוכבים והנווטים. היא מגינה על נודדים ועל מי שאבד בחושך, ונלחמת באחותה שאר, אלת האפלה. המאמינים שלה לומדים לקרוא את השמיים ולמצוא דרך הביתה.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/d/dc/Selune.jpg/revision/latest?cb=20091224153157 [fandom: no-referrer]
- links: Selûne (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Sel%C3%BBne
- sources: FRW Selûne ("Our Lady of Silver"; rivalry with Shar)
- uncertain: The English name has a circumflex: "Selûne", pronounced roughly "Seh-LOON-ay". The Hebrew "סלונה" fits. Not a Midgard god.

### ilmater
- category: god
- he: אילמטר
- en: Ilmater
- aliases_he: none
- blurb: אילמטר, "האל הבוכה", הוא אל הסבל, הסבלנות והחמלה. הוא לוקח על עצמו את הכאב של אחרים, ומאמיניו מרפאים, מגינים על המדוכאים ונשארים כשכולם בורחים. אל מתאים במיוחד לעבדים ולג'מבוקה.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/9/98/Ilmater.jpg/revision/latest?cb=20210429131935 [fandom: no-referrer]
- links: Ilmater (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Ilmater
- sources: FRW Ilmater ("the Crying God")
- uncertain: Not a Midgard god.

### baal
- category: god
- he: בעל
- en: Baal
- aliases_he: none
- blurb: בעל הוא אל אש גדול, הפטרון של האימפריה המהארוטית כולה. כל האצילים סוגדים לו, והוא שומר על "זכותם האלוהית לשלוט". את תורתו לא כתבו בספר: מסדר כוהנים, הבעל-שק, מדקלם כל יום את 444 הסיפורים הקדושים שלו בעל-פה. כוהניו נטועים עמוק בפקידות של האימפריה.
- image: none verified
- links: Lands of the Dragoncoil (Kobold Press) — https://koboldpress.com/welcome-to-midgard-lands-of-the-dragoncoil/
- sources: KP-dragoncoil ("Baal, a great fiery god that cultists sacrifice to"); WB-writeup (patron of the empire, nobles, divine right, Baal-Shek, 444 sacred stories)
- uncertain: Most of these facts rest on WB-writeup only. That Baal's priesthood "borrows" war-and-chaos faces from Loki (tenni.md) is campaign invention. Canon pairs Baal (lawful) against Azuran (chaotic). A KP media item named `baal.jpg` exists but its context could not be confirmed, so it is left out.

### azuran
- category: god
- he: אזוראן
- en: Azuran
- aliases_he: none
- blurb: אזוראן הוא אל-דרקון בעל ארבעה פנים, אל ארבע הרוחות והשמיים. "כל מה שנושם" נברא בידיו, וכל נשימה אחרונה היא אזוראן שלוקח את שלו. לכל רוח כת משלה: מזרח למזל וגורל, מערב לקרב, דרום לחוכמה, צפון לנדודים. דרקונים, בני-דרקון, בני אדם וקובולדים עולים לרגל למקדשיו.
- image: https://koboldpress.com/wp-content/uploads/2023/10/Azuran.jpg
- links: Pilgrimage to the Shrines of Azuran (Kobold Press) — https://koboldpress.com/midgard-monday-pilgrimage-to-the-shrines-of-azuran/
- sources: KP-azuran (God of the Four Winds; worshippers; shrines incl. Four Pillars of Wisdom in Harkesh); KP-dragoncoil ("four-faced god of the East"); WB-writeup (four winds' sects; "all who breathe")
- uncertain: The image is a blue-green dragon from a KP post about a cleric of Azuran. It probably shows that cleric, not the god. Replace it if a god depiction matters.

### veles
- category: god
- he: ולס
- en: Veles (the World Serpent)
- aliases_he: וֶלֶס
- blurb: ולס הוא נחש-העולם, נחש ענק שנושך את זנבו ומקיף את מידגארד. הגאות והשפל הם הנשימה שלו, והסערות הן הנחירות שלו. הוא "אבי הנחשים" והפטרון של ענקים ודרקונים. בצפון קוראים לו יורמונגנדר, ובצומת ובמערב אורובורוס. המהארוטים מאמינים שהדרקונים נבראו בצלמו ונועדו לשלוט בעולם.
- image: https://koboldpress.com/wp-content/uploads/2019/02/the-great-serpent.jpg
- image: https://koboldpress.com/wp-content/uploads/2012/07/Midgard-world-serpent.jpg
- image: https://upload.wikimedia.org/wikipedia/commons/7/71/Serpiente_alquimica.jpg
- links: Welcome to Midgard: The Great Serpent (Kobold Press) — https://koboldpress.com/welcome-to-midgard-the-great-serpent/
- links: Ouroboros (Wikipedia) — https://en.wikipedia.org/wiki/Ouroboros
- sources: KP-serpent (names, titles, tides and storms, worshippers, Portal of the Void in Harkesh); KP-origins ("Veles the World-Serpent, the Maker of All Things"; dragons made in his image); WB-writeup (dragon gods are literal children of Veles)
- uncertain: The brief called him "Vall". The content and canon both say Veles (ולס). Pronunciation: "VEH-les".

### loki
- category: god
- he: לוקי
- en: Loki
- aliases_he: none
- blurb: לוקי הוא אל התעלולים, השקרים והתוהו של הצפון. במידגארד יש צפוניים שמאמינים שוולס עצמו הוא רק מסכה של לוקי, חלק ממזימה עם הענקים. שימו לב: בעיר ולרה שבשבע הערים יושב קיסר בן-תמותה בשם לוקי החמישי, והוא שנתן מחסה לסולטנה המודחת.
- image: https://static.wikia.nocookie.net/forgottenrealms/images/5/5c/Loki-3e.jpg/revision/latest?cb=20210910133116 [fandom: no-referrer]
- image: https://upload.wikimedia.org/wikipedia/commons/4/40/Processed_SAM_loki.jpg
- links: Welcome to Midgard: The Great Serpent (Kobold Press) — https://koboldpress.com/welcome-to-midgard-the-great-serpent/
- links: Loki (Forgotten Realms Wiki) — https://forgottenrealms.fandom.com/wiki/Loki
- sources: KP-serpent (Veles as a mask of Loki; Loki's tall tales); KP-origins (sultana "sought shelter with young Emperor Loki"); WB-writeup ("Emperor Loki V (not the god)")
- uncertain: Whether to mention the mortal Emperor Loki is a scope call for the PM. It may confuse players.

### Factions

### jambuka
- category: faction
- he: ג'מבוקה
- en: Jambuka ("jackals")
- aliases_he: none
- blurb: ג'מבוקה, "התנים", הוא המעמד הנמוך ביותר באימפריה המהארוטית: כל מי שאין לו קשקשים. בני אדם, חצאי-אדם, אלפים, גנומים וענקים הם פועלים, משרתים ועבדים, בלי זכויות של בעלי הקשקשים. גם נוסע זר מקבל יחס של "מחלה שצריך לסבול".
- image: none verified
- links: Moving to Midgard: Favored Nations (Kobold Press) — https://koboldpress.com/moving-to-midgard-favored-nations/
- links: The Travels of Lucano Volpe (Kobold Press) — https://koboldpress.com/midgard-expanded-the-travels-of-lucano-volpe-or-on-the-road-to-mharoti/
- sources: KP-favored ("Non-dragons, known as jambuka, are at the lowest level"); KP-volpe ("Jambuka or 'Jackals' made up... of everyone else"); KP-favor (jambuka caste); WB-writeup (laborers and servants)
- uncertain: The ban on jambuka walking the dragon roads without a permit (world.md) is not confirmed.

### edjet
- category: faction
- he: האדג'ט
- en: Edjet
- aliases_he: none
- blurb: האדג'ט הם עמוד השדרה של צבא אימפריית הדרקון: מעמד לוחמים, רובם בני-דרקון, שמאומנים מילדות להילחם במבנים צפופים עם מגן ונשק. הם קשוחים, ממושמעים ומסוכנים. לפעמים גם בני "גזעים נחותים" מנסים להגיע לשורותיהם.
- image: https://koboldpress.com/wp-content/uploads/2018/08/edjet-dragon-fighter.jpg
- links: Welcome to Midgard: Edjet (Kobold Press) — https://koboldpress.com/welcome-to-midgard-edjet-martial-archetype/
- sources: KP-edjet ("backbone of the mighty Dragon Empire's military... most commonly dragonkin"); KP-favor (Edjet caste); WB-writeup
- uncertain: Pronunciation unconfirmed; the content's "אדג'ט" implies "ED-jet".

### morza
- category: faction
- he: המורזה
- en: Morza (dragon lords)
- aliases_he: מורזה
- blurb: המורזה הם אדוני הדרקון, הדרקונים הגדולים שמושלים בפרובינציות האימפריה. בדרקונית המילה פירושה "נסיך", "מושל-דרקון" או "אדון גדול". הם עצמאיים כמעט לגמרי, והסולטן קיים בעיקר כי הם לא סומכים זה על זה. בלי הסולטן, האימפריה הייתה נראית כמו שמונה ממלכות דרקונים במלחמה.
- image: none verified
- links: Origins of the Mharoti Empire (Kobold Press) — https://koboldpress.com/welcome-to-midgard-origins-of-the-mharoti-empire/
- sources: KP-origins (definition; "eight draconic kingdoms at war"); KP-volpe ("dragon lords, the Morza"); WB-writeup (nine Great Dragon Lords drawn from the 500 Urmanli)
- uncertain: The brief said "mordaza". Canon is "morza", matching the content's "מורזה". Canon is inconsistent on eight vs nine morza.

### timar-legions
- category: faction
- he: לגיונות הטימאר
- en: Timarli (timar legions)
- aliases_he: none
- blurb: הטימארלי הם מעמד האצולה של בעלי הקשקשים: דרקונים, דרייקים וויברנים שמחזיקים אדמות וגילדות, משמשים כוהנים גדולים ומפקדים על צבאות. "לגיונות הטימאר" הם הכוחות שתחת פיקודם. השם בא מה"טימאר" העות'מאני, אדמה שניתנה לפרש תמורת שירות צבאי.
- image: none verified
- links: The Travels of Lucano Volpe (Kobold Press) — https://koboldpress.com/midgard-expanded-the-travels-of-lucano-volpe-or-on-the-road-to-mharoti/
- links: Timar (Wikipedia) — https://en.wikipedia.org/wiki/Timar
- sources: KP-volpe ("Urmanli and Timarli castes... nobles, dukes, generals, and priests"); WB-writeup (Timarli include dragons, drakes, wyverns)
- uncertain: "Timar legions" and their mage-hunting units (vilhelm.md) are campaign phrasing. Canon names the caste (Timarli), not a legion type.

### khazzaki
- category: faction
- he: החזאקי
- en: Khazzaki (Khanate of the Khazzaki)
- aliases_he: החאנות
- blurb: החזאקי הם שבטי פרשים נוודים של מישורי רותניה, ובראשם החאן בודאן זנודי, ששולט מ"עיר הגלגלים" הנודדת. הסוסים שלהם קטנים, מהירים וקשוחים, ומשפחות קנטאורים רוכבות לצדם. הם נלחמים גם בשלג. כשהאימפריה שלחה נגדם צבא, דרקון הרוח שלהם הרג את הדרייקים, והפרשים רדפו את החיילים עד חומות קא'נש.
- image: https://koboldpress.com/wp-content/uploads/2019/06/khazzaki.jpg
- links: Welcome to Midgard: Khanate of the Khazzaki (Kobold Press) — https://koboldpress.com/welcome-to-midgard-khanate-of-the-khazzaki/
- links: Khazzak Vagabond background (Kobold Press) — https://koboldpress.com/khazzak-vagabond-a-background/
- sources: KP-khazzaki
- uncertain: That goliath families serve the khans as heavy infantry (goliath-tribes.md) is campaign invention.

### imperial-inquisitors
- category: faction
- he: האינקוויזיטורים
- en: Inquisitors (of the Sultan)
- aliases_he: none
- blurb: האינקוויזיטורים של הסולטן צדים כופרים: כוהנים, פלדינים ומאמינים של אלים שאינם דרקוניים. האימפריה מפורסמת ברשת המרגלים שלה, שעוסקת בעיקר בענייני פנים, והאינקוויזיטורים הם הזרוע הדתית שלה. המאמינים מתחמקים מהם בקודים, בסימנים ובמסכות של אלים מותרים.
- image: none verified
- links: Midgard Monday: Favor of the Dragon Empire (Kobold Press) — https://koboldpress.com/midgard-monday-favor-of-the-dragon-empire/
- sources: KP-favor ("extensive spy network focused on internal affairs"; clandestine operations respected)
- uncertain: A named Mharoti inquisition is not found in canon. The spy network is canon; the inquisitors are campaign invention.

### holy-orders
- category: faction
- he: המסדרים השבורים
- en: Holy knightly orders (Order of the Undying Sun, Order of the Storm)
- aliases_he: none
- blurb: מסדרי אבירים קדושים עמדו מול הלגיונות המהארוטיים מהיום הראשון. בממלכת מגדר עדיין פועלים שניים: מסדר השמש שאינה מתה, של פלדיני חורס, ומסדר הסערה, פרשים של פרון. בקרב שדה מארוק כמעט חתכו אבירי השמש את הצבא הקיסרי לשניים.
- image: https://koboldpress.com/wp-content/uploads/2013/03/SaintGeorgedetail_BurneJones.jpg
- links: Origins of the Mharoti Empire (Kobold Press) — https://koboldpress.com/welcome-to-midgard-origins-of-the-mharoti-empire/
- links: Fight dragons with Magdar war wagons (Kobold Press) — https://koboldpress.com/fight-dragons-in-style-and-safety-with-magdar-war-wagons/
- sources: KP-origins (Knights of the Undying Sun at Marroc's Field); WB-writeup (both orders, gods)
- uncertain: The content says most human and dwarf orders were "shattered" and only splinters hide on the borders. Canon has the Magdar orders intact and active. The image is a Burne-Jones Saint George painting used on that KP post, not Midgard art.

### People

### ozmir-al-stragul
- category: person
- he: אוזמיר אל-סטרגול
- en: Ozmir Al-Stragul, the Dread Sultan
- aliases_he: סולטן האימה, הסולטן האיום
- blurb: אוזמיר אל-סטרגול הוא גנרל בן-דרקון מצולק וערמומי, מצביא מוכשר ופוליטיקאי חסר רחמים. אחרי תבוסות בים ובמזרח הוא ושני גנרלים נוספים הפילו את הסולטנה האנושית. שני השותפים נעלמו מאז. הוא הראשון מבני-הדרקון שישב על הכס, והכריז על "עידן הקשקשים". הוא חולם לכבוש את נוריה נטאל.
- image: https://koboldpress.com/wp-content/uploads/2017/01/Dragonkin-fire-mage.jpg
- links: Midgard Icons: The Dragon Sultan (Kobold Press) — https://koboldpress.com/midgard-icons-the-dragon-sultan/
- links: Origins of the Mharoti Empire (Kobold Press) — https://koboldpress.com/welcome-to-midgard-origins-of-the-mharoti-empire/
- sources: KP-sultan; KP-origins
- uncertain: The image is a dragonkin fire mage from his icon article, not a portrait of him. Spelling: KP writes "Al-Stragul"; the brief wrote "al-Stragol". "סטרגול" fits either.

### casmara-azrabahir
- category: person
- he: סולטנה אנושית
- en: Sultana Casmara Azrabahir
- aliases_he: none
- blurb: קסמרה אזרבהיר הייתה הסולטנה האנושית הצעירה של האימפריה. אחרי שהצבא שלה הובס במזרח והצי שלה טבע מול שבע הערים, שלושה גנרלים הדיחו אותה, ומשמר הארמון שלה, מסדר הוויברן, עבר מיד לצד שלהם. היא ברחה על גב דרקון, ויושבת היום בגלות בעיר ולרה שבשבע הערים, ומחפשת בני-ברית כדי לחזור.
- image: https://koboldpress.com/wp-content/uploads/2013/05/Midgard-Dragon-Sultana-002L.jpg
- links: Origins of the Mharoti Empire (Kobold Press) — https://koboldpress.com/welcome-to-midgard-origins-of-the-mharoti-empire/
- links: Midgard Icons: The Dragon Sultana (Kobold Press) — https://koboldpress.com/midgard-icons-the-dragon-sultana/
- sources: KP-origins; KP-sultan; WB-writeup (gathering a Septime Alliance)
- uncertain: The content does not name her. Naming her is a scope call. The 2013 "Dragon Sultana" art predates the 2018 timeline and may not be her. It also shows a revealing costume; check it fits the table.

### baba-yaga
- category: person
- he: באבא יאגה
- en: Baba Yaga
- aliases_he: none
- blurb: באבא יאגה, "סבתא", היא מכשפת פיות עתיקה בעלת רגלי עצם, שגרה בבקתה על רגלי תרנגולת. היא סוחרת בסודות, ונדמה שאין דבר שהיא לא יודעת. המחיר יכול להיות נשיקה ראשונה, נשימה אחרונה, או שתאכל אותך. היא לא שוכחת עלבון, כמו שהגנומים של מידגארד למדו. אפילו הסולטן לא סומך עליה, אבל מקשיב לעצותיה.
- image: https://koboldpress.com/wp-content/uploads/2018/06/baba-yaga.jpg
- image: https://upload.wikimedia.org/wikipedia/commons/6/6c/%D0%A1%D0%BA%D0%B0%D0%B7%D0%BA%D0%B0_%D0%91%D0%B0%D0%B1%D0%B0-%D1%8F%D0%B3%D0%B0_3.jpg
- links: Welcome to Midgard: Grandmother Baba Yaga (Kobold Press) — https://koboldpress.com/welcome-to-midgard-grandmother-baba-yaga/
- links: Baba Yaga (Wikipedia) — https://en.wikipedia.org/wiki/Baba_Yaga
- sources: KP-babayaga; KP-babayaga-icon; KP-sultan ("distrusts Baba Yaga but values her counsel")
- uncertain: The Wikimedia image is Ivan Bilibin's public-domain illustration of the folk Baba Yaga, not Midgard's.

### Concepts

### law-of-masks
- category: concept
- he: חוק המסכות
- en: The Law of Masks (masked gods)
- aliases_he: none
- blurb: במידגארד האלים עוטים מסכות. אל אחד מופיע בשמות, בפנים ובתורות שונים בארצות שונות: פרון ות'ור שניהם אלי ברק, וולס נקרא גם יורמונגנדר ואורובורוס. הסיבה: במידגארד אפשר לרצוח אל או לשעבד אותו ולקחת את כוחו, והמסכות מסתירות כמה אלים יש באמת. בזכות זה אל זר יכול להסתתר כאן מאחורי שם מקומי.
- image: none verified
- links: Welcome to Midgard: The Great Serpent (Kobold Press) — https://koboldpress.com/welcome-to-midgard-the-great-serpent/
- links: Welcome to Midgard: The World Made New (Kobold Press) — https://koboldpress.com/welcome-to-midgard-the-world-made-new/
- sources: KP-worldnew ("the gods wear masks... partly because divine murder and enslavement are possible"); KP-serpent (Veles's names; priests claim other gods are his masks); WB-writeup (Perun and Thor)
- uncertain: The concept is canon. The exact name "Law of Masks" was not found in any reachable source. A search summary (2d4chan, community wiki) says Veles issued an ultimatum that the gods stop warring openly and act through masks; that is unverified.

### age-of-scales
- category: concept
- he: עידן הקשקשים
- en: Age of Scales
- aliases_he: none
- blurb: "עידן הקשקשים" הוא השם שהסולטן אוזמיר אל-סטרגול נתן לשלטונו. כ"נסיך חדש" מבני-הדרקון הוא טען שקיבל הכשר אלוהי להכתרה. עבור הג'מבוקה פירוש הדבר שבעלי הקשקשים כבר לא צריכים אפילו סולטן אנושי כבובה.
- image: none verified
- links: Origins of the Mharoti Empire (Kobold Press) — https://koboldpress.com/welcome-to-midgard-origins-of-the-mharoti-empire/
- sources: KP-origins ("a dragonborn 'new prince' has claimed divine sanction for his coronation, and a new Age of Scales")
- uncertain: none

### mharoti-castes
- category: concept
- he: סולם המעמדות
- en: Mharoti caste system
- aliases_he: בעלי קשקשים
- blurb: באימפריה כל אחד יודע את מקומו לפי הקשקשים שלו. מלמטה למעלה: ג'מבוקה (כל מי שאין לו קשקשים), קובולדי, סקבן (בני-דרקון פועלים), אדג'ט (לוחמים), אקינג'י (קצינים ובעלי אדמות קטנים), טימארלי (אצילים, דרקונים ודרייקים), אורמנלי (500 הדרקונים המקושרים ביותר), ובראש המורזה, אדוני הדרקון. טקסים קסומים יכולים "להעלות" קובולד לבן-דרקון, ובן-דרקון לדרייק.
- image: https://koboldpress.com/wp-content/uploads/2023/08/Mharoti-Emissary.png
- links: The Travels of Lucano Volpe (Kobold Press) — https://koboldpress.com/midgard-expanded-the-travels-of-lucano-volpe-or-on-the-road-to-mharoti/
- links: Midgard Monday: Favor of the Dragon Empire (Kobold Press) — https://koboldpress.com/midgard-monday-favor-of-the-dragon-empire/
- sources: KP-volpe (full caste list); KP-favor; WB-writeup (Urmanli 500; transformation rituals)
- uncertain: Canon spellings vary: Sekban/Sekben, Akinji/Akijani, Kobaldi/Koboldi.

### sculpt-spells
- category: concept
- he: עיצוב לחשים
- en: Sculpt Spells
- aliases_he: none
- blurb: עיצוב לחשים היא יכולת של קוסם יסודות: הוא "חוצב" כיסים בטוחים בתוך הפיצוץ שלו, כך שבני בריתו שבאזור לא נפגעים כלל. כדור אש יכול ליפול על חוליית חיילים בעלי קשקשים בלי לחרוך את המורד שעומד ביניהם.
- image: none verified
- links: Wizard (D&D Beyond) — https://www.dndbeyond.com/classes/wizard
- sources: DDB Wizard (Evoker / School of Evocation feature "Sculpt Spells")
- uncertain: none

### dragon-roads
- category: concept
- he: הסליל של הדרקון
- en: The Dragon's Coil (dragon roads)
- aliases_he: none
- blurb: "הסליל של הדרקון" הוא רשת הדרכים היוקרתיות של האימפריה. לפי החוק אסור לג'מבוקה ללכת בהן בלי היתר מאדון. מהנדסי האימפריה סוללים דרכים ומשפרים מעברי הרים בכל ארץ שנכבשת.
- image: none verified
- links: Origins of the Mharoti Empire (Kobold Press) — https://koboldpress.com/welcome-to-midgard-origins-of-the-mharoti-empire/
- sources: KP-origins (kobold settlers "improve the roads over the passes"); world.md
- uncertain: The name and the permit law are not found in canon; probably campaign invention. It may be confused with the Dragoncoil Mountains (הרי פיתול-הדרקון), whose name sounds similar. Consider renaming or adding a note.

## 3. Proposed world.md bullets

Format matches `world.md`. English in parentheses on first mention. These are proposals only; the PM decides which go in.

- **אלי הדרקונים** דת המדינה סוגדת לאלי-דרקון שנחשבים לילדיו של ולס (Veles), נחש-העולם. בעל (Baal) הוא אל האש ופטרון האימפריה, ושומר על זכותם של האצילים לשלוט. אזוראן (Azuran) הוא אל ארבע הרוחות, ו"כל מה שנושם" שלו. (source: KP-dragoncoil, KP-azuran, WB-writeup)
- **הרקש, עיר הזהב** הבירה המהארוטית, הרקש (Harkesh), יושבת בקצה המערבי של הרי פיתול-הדרקון (Dragoncoil Mountains). בבזאר הגדול שלה אלף דוכנים, ובארמון שמונת היסודות יושב הסולטן. (source: KP-sultan, KP-dragoncoil)
- **ברית מהארוט** לפני כ-400 שנה כרת הדרקון האדום מהארוט (Mharot) ברית עם דרקונים שכנים. שבטי הקובולדים (kobolds) נשבעו לו אמונים תמורת הגנה, וכך נולדה האימפריה, ועל שמו היא נקראת. (source: KP-origins)
- **למה יש סולטן** המורזה (morza), אדוני הדרקון, לא סומכים זה על זה. לכן נתנו את הכס למי שאינו דרקון. בלי הסולטן, האימפריה הייתה מתפרקת לממלכות דרקונים במלחמה. (source: KP-origins)
- **הסולטנה הגולה** הסולטנה המודחת, קסמרה אזרבהיר (Casmara Azrabahir), ברחה על גב דרקון לעיר ולרה (Valera) שבשבע הערים, ושם היא אוספת בני-ברית נגד אוזמיר. (source: KP-origins, WB-writeup) [scope call: names a previously unnamed NPC]
- **ממלכת מגדר** מצפון-מערב, ממלכת האבירים מגדר (Magdar Kingdom) נלחמת באימפריה עם עגלות מלחמה משוריינות ושני מסדרי אבירים קדושים. לפני שבע שנים נפל המלך שלה בקרב מול הלגיונות. (source: KP-origins, KP-magdar, WB-writeup)
- **החאן והעיר קא'נש** החאן של החזאקי (Khazzaki) ניסה שוב ושוב לכבוש את קא'נש (Kaa'nesh), עיר מהארוטית של אוגרים ובני-דרקון למרגלות ההרים, ונכשל. אבל הצבא היחיד שהאימפריה שלחה אל המישורים חזר מובס. (source: KP-khazzaki)

Optional, not new bullets: the existing `world.md` bullets could add English on first mention: מידגארד (Midgard), ולס (Veles), נוריה נטאל (Nuria Natal), שבע הערים (Seven Cities), טריולו (Triolo), החזאקי (Khazzaki), אוזמיר אל-סטרגול (Ozmir Al-Stragul), האדג'ט (edjet), המורזה (morza), ג'מבוקה (jambuka).

## Counts

race 14, class 6, place 14, god 9, faction 7, person 3, concept 5. Total 58.
