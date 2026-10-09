// Session One: the premade characters and their walkthroughs.
// Edit this file only: adding a character or a step needs no other change.
//
// Character: { id, name, cls, icon, steps }
//   id    Latin, unique, never change it once players have picked (saved data points at it)
//   name  Hebrew display name
//   cls   Hebrew class name
//   icon  a name from /shared/icons.js (sword, shield, hat, skull, ...)
//   steps the walkthrough, shown in order
//
// Step: { id, type, title?, prompt, hint?, optional?, options?, multi?, other? }
//   id      Latin, unique within the character (answers are saved by this id)
//   type    'text'   free-text answer
//           'choice' pick from options
//           'info'   read-only lore page, no answer saved (see below)
//   title   optional Hebrew heading; when set, the prompt shows under it as an intro
//   prompt  the Hebrew question (or the intro, when there is a title)
//   hint    optional smaller line under the prompt
//   optional true: a "דלג" button skips the step and clears its answer
//   options for 'choice' only: [{ id, label, emoji?, subtitle?, description? }]
//           if any option has a description, options render as full cards
//           (emoji, label, subtitle, description); otherwise as plain buttons
//   multi   'choice' only, true: several picks allowed
//   other   'choice' only, false: hide the free-text box. By default every
//           choice step shows "משהו אחר / לכתוב בעצמי" under the options, and
//           the player may continue with only that text and no pick.
//
// Saved answers (answers[step id]):
//   text            string
//   choice          option id (string); with multi: true, an array of option ids
//   choice, other   answers[`${id}_other`] = the free text, beside the pick
//   skipped/empty   the key is absent
//
// Info step: { id, type: 'info', title?, prompt?, known?, secret? }
//   known   [{ title?, text }] under "מה כולם יודעים"
//   secret  [{ title?, text }] under "🤫 מה רק אתה יודע", in a sealed dark card
//   Either section may be left out. Nothing is saved; the DM view skips it.
//   { id: 'lore', type: 'info', title: 'מה צריך לדעת', known: [
//       { title: 'העיר', text: 'כולם יודעים שהשערים נסגרים בשקיעה.' },
//   ], secret: [{ text: 'אתה יודע איפה המנהרה שעוקפת אותם.' }] },
//
// World facts all players share go in COMMON_LORE (below), not in a character.
// The DM compendium (/session-one/<CODE>/dm/lore?key=) renders this whole file.
//
// A step shared by several characters: define it once as a const and put the
// same object in each character's steps (see GOD_STEP).
//
// Example:
//   { id: 'oath', type: 'choice', prompt: 'למה נשבעת?', options: [
//       { id: 'justice', label: 'צדק' },
//       { id: 'mercy', label: 'רחמים' },
//   ] },

// World facts every player sees, once, right after the keep/rename/switch
// choice (before the character's own steps, or before the "talk to the GM"
// screen on switch). Not part of any character's steps: put world-level facts
// here, and only character-specific knowledge in a character's 'lore' step.
export const COMMON_LORE = {
  id: 'common_lore',
  type: 'info',
  title: '🌍 מה כולם יודעים על העולם',
  known: [
    {
      title: "קשקשים וג'מבוקה",
      text: "האימפריה המהארוטית מתחלקת לבעלי קשקשים (דרקונים, דרייקים, בני-דרקון וקובולדים) ולכל השאר: הג'מבוקה, \"התנים\", המעמד הנמוך ביותר. בני אדם, חצאי-אדם, אלפים וגנומים הם כולם ג'מבוקה. לפי החוק אסור לג'מבוקה ללכת בדרכי הדרקון היוקרתיות, הסליל של הדרקון, בלי היתר מאדון.",
    },
    {
      title: 'סולם המעמדות',
      text: "מעל הג'מבוקה הקובולדים, עם אגו ענק כי הם חולקים שושלת עם הדרקונים. מעליהם האדג'ט, חיילים בני-דרקון, ומעליהם המורזה, אדוני הדרקון. עלבון קטן לסוחר קובולד יכול להביא על ג'מבוקה לגיונר בן-דרקון.",
    },
    {
      title: 'הסולטן החדש',
      text: 'האימפריה החזיקה סולטנה אנושית כבובה, כדי שהדרקונים לא יילחמו זה בזה. הפיכה אכזרית הפילה אותה. הגנרל בן-הדרקון המצולק אוזמיר אל-סטרגול הוא סולטן האימה החדש. "עידן הקשקשים" התחיל, והחיים של מחתרת הג\'מבוקה נעשו הרבה יותר קשים.',
    },
    {
      title: 'אין כלא',
      text: 'פשע נגד השלטון או חבלה בצבא לא נגמרים בכלא. מי שנתפס מאבד את הזכויות המעטות שיש לו, או שמאכילים בו את הדרייקים.',
    },
    {
      title: 'דיסקה צפה',
      text: 'העולם, מידגארד, הוא דיסקה שטוחה וצפה. סביב הקצה שלו מתפתל ולס נחש-העולם, אל ענק שנושך את הזנב של עצמו.',
    },
    {
      title: 'השכנים',
      text: 'מדרום נוריה נטאל, ממלכת נהר קסומה של מלכים-אלים שלא מתים, שכבר הדפה את האימפריה בעבר. ממערב, מעבר לים, שבע הערים, ערים של סוחרים ופיראטים כמו טריולו. מצפון, במישורי רותניה, החאנות של החזאקי, שבטי פרשים שהגבול שלהם נתקל שוב ושוב בלגיונות של האימפריה.',
    },
  ],
};

// The five gods a paladin or cleric can serve. Shared by Turator and Tenni.
const GODS = [
  {
    id: 'bahamut',
    emoji: '🐉',
    label: 'בהאמוט',
    subtitle: 'דרקון הפלטינה',
    description: 'אל הצדק, הכבוד, ההגנה והדרקונים הטובים. בהאמוט מאמין שעל החזקים להגן על החלשים, ושיש להילחם ברשע באומץ וביושר. מאמיניו שואפים להיות מגינים אציליים ולעולם לא להיכנע לשחיתות.',
  },
  {
    id: 'lathander',
    emoji: '🌅',
    label: "לאת'נדר",
    subtitle: 'אדון השחר',
    description: 'אל השחר, האביב, ההתחדשות והחיים החדשים. לאת\'נדר מייצג את התקווה שגם אחרי הלילה האפל ביותר תזרח השמש מחדש. מאמיניו מאמינים בגאולה, בריפוי, ביצירת עתיד טוב יותר ובמלחמה בכוחות החושך.',
  },
  {
    id: 'torm',
    emoji: '🛡️',
    label: 'טורם',
    subtitle: 'האל האמיתי',
    description: 'אל החובה, הנאמנות, הצדק והאבירות. טורם דורש ממאמיניו לעמוד במילתם, להגן על חפים מפשע ולפעול למען הדבר הנכון גם כשהמחיר כבד. הוא מתאים למי שרואה בשבועה שלו התחייבות קדושה שאסור להפר.',
  },
  {
    id: 'selune',
    emoji: '🌙',
    label: 'סלונה',
    subtitle: 'גבירת הירח',
    description: 'אלת הירח, הכוכבים, הניווט והמחפשים את דרכם בחשכה. סלונה מגינה על נודדים, חוקרים ואלה שאבדו את דרכם. מאמיניה מאמינים שגם בחשכה העמוקה ביותר יש אור שמסוגל להוביל הביתה, ושיש לעמוד מול כוחות מסתוריים המאיימים על העולם.',
  },
  {
    id: 'ilmater',
    emoji: '🤲',
    label: 'אילמטר',
    subtitle: 'האל הבוכה',
    description: 'אל הסבל, הסיבולת, החמלה וההקרבה למען אחרים. אילמטר מלמד שכוח אמיתי אינו נמדד בכמה כאב אפשר לגרום, אלא בכמה כאב אפשר לשאת כדי שאחרים לא יצטרכו לסבול. מאמיניו מגינים על חסרי הישע, מקלים על סבלם של אחרים וממשיכים להילחם גם כשהתקווה כמעט אבדה.',
  },
];

const GOD_STEP = {
  id: 'god',
  type: 'choice',
  title: 'חמישה אלים שתוכלו לבחור בהם',
  prompt: 'אז מי מדבר אליכם? בחרו באל שהערכים שלו הכי מתאימים לדמות שלכם — לא רק למי שאתם רוצים להילחם נגדו, אלא גם לסיבה שבגללה אתם יוצאים לקרב מלכתחילה.',
  options: GODS,
};

// The four goliath tribes Deq can come from (Midgard, around the Mharoti empire).
const GOLIATH_TRIBES = [
  {
    id: 'sunder_bone',
    emoji: '🏔️',
    label: 'שבט שובר-העצם',
    subtitle: 'הרי פיתול-הדרקון, הפסגות הגבוהות ביותר',
    description: 'שבטים נוודים ומתבודדים שחיים בפסגות הגבוהות ביותר, ורואים את עצמם צאצאים של ענקי האבן והאש שמשלו בהרים לפני שהדרקונים הגיעו. הם נלחמים באלימות בכל משלחת מהארוטית שמנסה למפות את ההרים, והאוויר הדליל הוא חומת המגן שלהם. מי שבא מכאן גדל על גאווה, על בדידות ועל זיכרון של ממלכה אבודה.',
  },
  {
    id: 'kaanesh_outcasts',
    emoji: '⛓️‍💥',
    label: "מנודי קא'נש",
    subtitle: "הגבעות שליד קא'נש, עיר של אוגרים ובני-דרקון",
    description: "שרידים של שבטים שהתפרקו, שחיים למרגלות ההרים בצל העיר המהארוטית קא'נש. הם נאלצים לסחור בתנאים לא הוגנים עם מושלי האימפריה, ומתכתשים איתם שוב ושוב על כל שטח מרעה ועל כל באר. מי שבא מכאן יודע מה זה לשרוד בלי שבט שלם מאחוריו.",
  },
  {
    id: 'stone_riders',
    emoji: '🐎',
    label: 'להקות רוכבי-האבן',
    subtitle: 'מישור רותניה הדרומי, החאנות של החזאקי',
    description: 'משפחות גוליית שאומצו אל שבטי הסוסים של החזאקי. הם גדולים מדי בשביל סוסים רגילים, ולכן משרתים את החאנים כחיל רגלים כבד שפורץ את שורות האויב וכשומרי גבול, ובגבול הצפוני הם נתקלים שוב ושוב בלגיונות החלוץ של מהארוטי. מי שבא מכאן גדל במחנה נודד, בין פרשים שקיבלו אותו כמשפחה.',
  },
  {
    id: 'jambuka',
    emoji: '🔗',
    label: "הג'מבוקה – עובדי כפייה ולוחמי זירה",
    subtitle: 'בתוך האימפריה המהארוטית',
    description: "באימפריה המהארוטית, כל מי שאין לו קשקשים הוא אזרח סוג ב' או עבד. גוליית שנולד כאן מאבד את שם השבט ואת השושלת שלו, ומוערך רק בגלל הכוח שלו: עבודת פרך על המונומנטים של הרקש, או רכוש של הזירה. מי שבא מכאן קיבל את שמו מאחרים, ואת החופש שלו היה צריך לקחת בעצמו.",
  },
];

const TRIBE_STEP = {
  id: 'tribe',
  type: 'choice',
  title: 'מאיזה שבט באת?',
  prompt: 'לגוליית אין עם אחד. הם חיים כשבטי הרים מבודדים, כשכירי חרב או כעמים משועבדים, פזורים על פני שלושה אזורים — בחרו מאיפה דק בא, וזה יגיד הרבה על מי שהוא היום.',
  options: GOLIATH_TRIBES,
};

// Vilhelm: a human evoker inside the Mharoti Dragon Empire (Midgard), unregistered and rebel.
const VILHELM_LORE = {
  id: 'lore',
  type: 'info',
  title: 'קוסם אנושי באימפריית הדרקון',
  known: [
    {
      title: 'כישוף מול ספרים',
      text: 'באימפריה המהארוטית, קסם הוא מעמד. כישוף מולד הוא אצילי: הוא זורם בדם הדרקונים או בא מאלי היסודות. קוסמות נלמדת מספרים, ולכן האימפריה רואה בה חיקוי עלוב של מי שלא נולד עם מתנה, ומתייחסת אליה בחשד או בתועלתנות קרה.',
    },
    {
      title: 'סיכון ביטחוני',
      text: 'קוסם אנושי הוא "עבד שמנסה לקנות כוח של דרקון בספרים". האימפריה זוכרת את המערב השומם, שם ממלכות קוסמים אנושיות השמידו את עצמן בקסם ארקני.',
    },
    {
      title: 'רכוש קיסרי',
      text: 'קוסם אנושי נסבל רק אחרי שנשבע אמונים מלאים למורזה או לסולטן האימה. מאותו רגע הוא רכוש: מבטל לחשים, מנהל חשבונות, אדריכל ואיש לוגיסטיקה. קוסם לא רשום נצוד ומוצא להורג.',
    },
    {
      title: 'מי כן מכובד',
      text: "קוסמים בעלי קשקשים, קובולדים ואלמנטליסטים בני-דרקון, מקבלים כבוד ומקום בלגיונות או באקדמיות של הרקש. קוסמים של מעצמות יריבות, נוריה נטאל ומגדר, הם מטרה ראשונה, והקסם שלהם מוחרם. קוסמים אלפים וגנומים הם ג'מבוקה, בדיוק כמו בני אדם.",
    },
  ],
  secret: [
    {
      title: 'נשק לא רשום',
      text: 'בעיני השליטים אתה נשק לא רשום. כדור אש אחד או ברק אחד על כוחות האימפריה, ויחידות ציד-הקוסמים של לגיונות הטימאר כבר עוקבות אחרי שאריות היסוד שהשארת.',
    },
    {
      title: 'כפירה',
      text: 'הקסם שלך הוא חילול קודש: הרס יסודי טהור הוא זכות האל שהדרקונים לוקחים לעצמם. בעיני המורזה אתה לא מורד. אתה תועבה תאולוגית.',
    },
    {
      title: 'ספר הלחשים',
      text: 'ספר לחשים בלי היתר פירושו מוות. מורדים מסווים אותו כפנקס של סוחר, מקעקעים נוסחאות מתחת לבגדים, או משננים לחשים ממטמונים קבורים בשטח.',
    },
    {
      title: 'ארטילריה כבדה',
      text: 'אתה הארטילריה הכבדה של המרד: פוגע בשיירות אספקה ונעלם לפני שהדרייקים מגיעים. עיצוב לחשים מאפשר לך לפוצץ חיילים בעלי קשקשים ולחסוך את חבריך ללוחמת החופש.',
    },
    {
      title: 'רשת הברחה',
      text: "אתה תלוי במחתרת הג'מבוקה ובטבעות מבריחים כדי להשיג רכיבים מוגבלים: גופרית, גואנו עטלפים, חוטי נחושת. בשווקים של האימפריה כל אחד מהם נמצא במעקב.",
    },
  ],
};

const MAGIC_ORIGIN_STEP = {
  id: 'magic_origin',
  type: 'choice',
  multi: true,
  title: '🪄 איך למדת קסם?',
  prompt: 'לא כל אחד מסוגל לעשות קסם. איך גילית אותו, ואיך למדת לשלוט בו? בחר אחת, שלב כמה, או כתוב משהו משלך.',
  options: [
    {
      id: 'academy',
      emoji: '🏛️',
      label: 'האקדמיה',
      description: 'בית ספר לקסם: לחשים, תאוריה וסודות עתיקים. אולי הצטיינת, אולי התקשית, ואולי שברת את הכללים.',
    },
    {
      id: 'apprentice',
      emoji: '🧙',
      label: 'החניך של המאסטר',
      description: 'קוסם חזק, או מוזר במיוחד, לקח אותך תחת חסותו. השיעורים היו משונים יותר ממה שציפית.',
    },
    {
      id: 'book',
      emoji: '📚',
      label: 'הספר האסור',
      description: 'מצאת ספר לחשים יוצא דופן ולימדת את עצמך. חלק מהדפים חסרים, חלק אי אפשר לקרוא, וחלק פשוט מפחידים.',
    },
    {
      id: 'family',
      emoji: '🧬',
      label: 'מורשת משפחתית',
      description: 'הקסם עובר אצלכם במשפחה. ספרים ישנים, ידע מוזר, ואחריות שאתה עדיין לא מבין עד הסוף.',
    },
    {
      id: 'awakening',
      emoji: '⚡',
      label: 'ההתעוררות הבלתי צפויה',
      description: 'משהו יוצא דופן קרה, ומאז אתה מסוגל להפעיל קסם. אתה עדיין מנסה להבין את זה.',
    },
    {
      id: 'society',
      emoji: '🕯️',
      label: 'האגודה הסודית',
      description: 'חוג נסתר של מלומדים, מיסטיקנים או מטילי לחשים. יש לו כללים, סודות, ואולי גם התחייבויות.',
    },
    {
      id: 'wanderer',
      emoji: '🗺️',
      label: 'הנודד הסקרן',
      description: 'חורבות, חפצים עתיקים, מגילות נשכחות וניסויים מסוכנים. בלי הכשרה רשמית, אבל עם רעב אמיתי לידע.',
    },
  ],
};

const MAGIC_DREAM_STEP = {
  id: 'magic_dream',
  type: 'text',
  optional: true,
  prompt: 'מהי תעלומה קסומה אחת שהיית רוצה לפתור, או דבר אחד שאתה מקווה להשיג עם הקסם שלך?',
};

const ELEMENT_STEP = {
  id: 'element',
  type: 'choice',
  prompt: 'מה היסוד שלך?',
  options: [
    { id: 'fire', emoji: '🔥', label: 'אש', subtitle: 'חום המדבר' },
    { id: 'acid', emoji: '🧪', label: 'חומצה' },
    { id: 'lightning', emoji: '⚡', label: 'ברק' },
    { id: 'other', emoji: '✨', label: 'אחר' },
  ],
};

const ALLEGIANCE_STEP = {
  id: 'allegiance',
  type: 'choice',
  prompt: 'עם מי אתה נלחם?',
  options: [
    {
      id: 'cell',
      emoji: '🕯️',
      label: 'תא מורדים',
      description: 'אתה חלק מקבוצת מורדים בתוך האימפריה. יש לך חברים שסומכים עליך, ומפקדים שמצפים ממך לפקודות.',
    },
    {
      id: 'lone',
      emoji: '🌑',
      label: 'נוקם בודד',
      description: 'אתה פועל לבד. אף אחד לא יכול להסגיר אותך, ואף אחד לא יבוא להציל אותך.',
    },
  ],
};

const GOAL_STEP = {
  id: 'goal',
  type: 'text',
  prompt: 'מה המטרה המיידית שלך?',
  hint: 'למשל: להבריח אנשים אל מחוץ לאימפריה, או לתכנן התנקשות באדון דרקון מקומי.',
};

// Bebby: a halfling rogue inside the Mharoti Dragon Empire (Midgard).
const BEBBY_LORE = {
  id: 'lore',
  type: 'info',
  title: 'חצי-אדם באימפריית הדרקון',
  secret: [
    {
      title: 'הבזארים של הרקש',
      text: 'הבזארים המוזהבים של הרקש הם המפוארים והאכזריים בעולם. אתה יודע לעבוד את ערי האוהלים הצפופות ולקנות רכיבים אסורים, גופרית ופחם, שהצבא מקצב בקפדנות. בדיוק מה שקוסם יסודות צריך.',
    },
    {
      title: 'דרכי מילוט',
      text: 'אם משהו משתבש: דרומה לנוריה נטאל, ממלכת נהר קסומה של מלכים-אלים שלא מתים, שכבר הדפה את האימפריה בעבר. או מערבה מעבר לים, לפיראטים ולסוחרים של שבע הערים, כמו טריולו. הם שונאים את האימפריה ויבריחו מורד אנושי החוצה, תמורת מחיר.',
    },
    {
      title: 'הרחק מגנומים',
      text: 'חצאי-אדם נזרקים יחד עם גנומים לרובעי משרתים כמו רייוולד הקטנה. אבל אתה מתרחק מגנומים שעוזבים את האימפריה: באבא יאגה קיללה את הגנומים, וכוחות הצל שלה צדים את מי שיוצא לעולם הפתוח.',
    },
  ],
};

const ROGUE_TYPE_STEP = {
  id: 'rogue_type',
  type: 'choice',
  prompt: 'איזה סוג נוכל אתה?',
  options: [
    { id: 'urban', emoji: '🏙️', label: 'גנב עירוני', description: 'גדלת בבירה ואתה מכיר כל סמטה, גג ושוק.' },
    { id: 'desert', emoji: '🏜️', label: 'מבריח מדבר', description: 'אתה מריץ סחורה בשבילי הגבול, הרחק מעיני הלגיונות.' },
    { id: 'spy', emoji: '🕵️', label: 'מרגל מארץ זרה', description: 'נשלחת לאימפריה מבחוץ, ואף אחד כאן לא יודע בשביל מי אתה עובד.' },
  ],
};

const ROGUE_LEAN_STEP = {
  id: 'rogue_lean',
  type: 'choice',
  prompt: 'לאן אתה נוטה?',
  options: [
    { id: 'riches', emoji: '💰', label: 'גניבה והתעשרות', description: 'הזהב של הדרקונים לא ישמור את עצמו.' },
    { id: 'sabotage', emoji: '🔥', label: 'חבלה פוליטית', description: 'אתה פוגע באימפריה איפה שכואב לה.' },
  ],
};

const ROGUE_ORIGIN_STEP = {
  id: 'origin',
  type: 'choice',
  multi: true,
  title: '🗡️ איפה למדת את הטריקים שלך?',
  prompt: 'לכל נוכל יש סיפור. איך נהיית כל כך טוב בלהתגנב, לגנוב, לעבוד על אנשים ולצאת מצרות? בחר אחת, שלב כמה, או כתוב משהו משלך.',
  options: [
    {
      id: 'street',
      emoji: '🏚️',
      label: 'שורד רחוב',
      description: 'גדלת ברחובות. שם למדת לכייס, לזהות סכנה מרחוק ולהישאר תמיד צעד אחד לפני הצרות.',
    },
    {
      id: 'performer',
      emoji: '🎭',
      label: 'אמן נודד',
      description: 'קרקס, להקת תיאטרון או חבורת בדרנים. שם למדת זריזות ידיים, הטעיה, אקרובטיקה ואיך לקרוא קהל.',
    },
    {
      id: 'guild',
      emoji: '🗝️',
      label: 'גילדת הגנבים',
      description: 'רשת פשע אימנה אותך. אתה מכיר את החוקים של העולם התחתון, ואולי אתה עדיין חייב למישהו טובה.',
    },
    {
      id: 'con',
      emoji: '🦊',
      label: 'הרמאי',
      description: 'שקרים, תחפושות, והיכולת לגרום לאנשים לתת לך בדיוק את מה שאתה רוצה. אולי עקיצה אחת יותר מדי.',
    },
    {
      id: 'smuggler',
      emoji: '📦',
      label: 'מבריח או שליח',
      description: 'העברת הודעות סודיות או סחורה לא חוקית דרך מקומות מסוכנים. אתה מכיר שבילים נסתרים ויודע איך לא למשוך תשומת לב.',
    },
    {
      id: 'scout',
      emoji: '🏹',
      label: 'הסייר הערמומי',
      description: 'הישרדות בטבע, התגנבות מול אויבים, איתור מלכודות, ומכה ברגע שאף אחד לא מצפה לה.',
    },
    {
      id: 'rich',
      emoji: '🏰',
      label: 'חיים בין העשירים',
      description: 'עבדת בבית של עשירים או בחצר של אצילים. למדת את הסודות שלהם, את ההרגלים שלהם, ואיך לקחת דברים בלי שאף אחד ישים לב.',
    },
  ],
};

export const CHARACTERS = [
  {
    id: 'turator',
    name: 'טוראטור',
    cls: 'פלדין',
    icon: 'shield',
    // TODO: Aviv fills this in
    steps: [
      GOD_STEP,
      { id: 'why', type: 'text', prompt: 'למה טוראטור יצא להרפתקאות?' },
      { id: 'vibe', type: 'choice', prompt: 'איך תשחק אותו?', options: [
        { id: 'serious', label: 'רציני' },
        { id: 'funny', label: 'מצחיק' },
        { id: 'unsure', label: 'נגלה תוך כדי' },
      ] },
    ],
  },
  {
    id: 'deq',
    name: 'דק',
    cls: 'ברברי',
    icon: 'sword',
    steps: [
      TRIBE_STEP,
      { id: 'left_behind', type: 'text', prompt: 'מה גרם לך לעזוב, ומה השארת מאחור?' },
    ],
  },
  {
    id: 'tenni',
    name: 'טני',
    cls: 'כוהן',
    icon: 'sparkles',
    // TODO: Aviv fills this in
    steps: [
      GOD_STEP,
      { id: 'why', type: 'text', prompt: 'למה טני יצא להרפתקאות?' },
    ],
  },
  {
    id: 'vilhelm',
    name: 'וילהלם',
    cls: 'קוסם',
    icon: 'hat',
    steps: [VILHELM_LORE, MAGIC_ORIGIN_STEP, MAGIC_DREAM_STEP, ELEMENT_STEP, ALLEGIANCE_STEP, GOAL_STEP],
  },
  {
    id: 'bebby',
    name: 'בבי',
    cls: 'נוכל',
    icon: 'mask',
    steps: [
      BEBBY_LORE,
      ROGUE_ORIGIN_STEP,
      {
        id: 'past_contact',
        type: 'text',
        optional: true,
        prompt: 'יש מישהו מהעבר שלך שעלול לזהות אותך, להזדקק לעזרה שלך, או לרצות ממך משהו?',
      },
      ROGUE_TYPE_STEP,
      ROGUE_LEAN_STEP,
    ],
  },
];

export const character = (id) => CHARACTERS.find((c) => c.id === id);
