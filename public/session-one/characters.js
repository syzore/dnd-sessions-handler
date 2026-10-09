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
// Step: { id, type, title?, prompt, hint?, options? }
//   id      Latin, unique within the character (answers are saved by this id)
//   type    'text'   free-text answer
//           'choice' pick one of options
//   title   optional Hebrew heading; when set, the prompt shows under it as an intro
//   prompt  the Hebrew question (or the intro, when there is a title)
//   hint    optional smaller line under the prompt
//   options for 'choice' only: [{ id, label, emoji?, subtitle?, description? }]
//           if any option has a description, options render as full cards
//           (emoji, label, subtitle, description); otherwise as plain buttons
//
// A step shared by several characters: define it once as a const and put the
// same object in each character's steps (see GOD_STEP).
//
// Example:
//   { id: 'oath', type: 'choice', prompt: 'למה נשבעת?', options: [
//       { id: 'justice', label: 'צדק' },
//       { id: 'mercy', label: 'רחמים' },
//   ] },

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
    // TODO: Aviv fills this in
    steps: [
      { id: 'why', type: 'text', prompt: 'למה וילהלם יצא להרפתקאות?' },
    ],
  },
  {
    id: 'bebby',
    name: 'בבי',
    cls: 'נוכל',
    icon: 'mask',
    // TODO: Aviv fills this in
    steps: [
      { id: 'why', type: 'text', prompt: 'למה בבי יצא להרפתקאות?' },
    ],
  },
];

export const character = (id) => CHARACTERS.find((c) => c.id === id);
