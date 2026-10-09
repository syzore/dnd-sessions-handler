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
    // TODO: Aviv fills this in
    steps: [
      { id: 'why', type: 'text', prompt: 'למה דק יצא להרפתקאות?' },
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
