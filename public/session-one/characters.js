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
// Step: { id, type, prompt, hint?, options? }
//   id      Latin, unique within the character (answers are saved by this id)
//   type    'text'   free-text answer
//           'choice' pick one of options
//   prompt  the Hebrew question
//   hint    optional smaller line under the prompt
//   options for 'choice' only: [{ id, label }]
//
// Example:
//   { id: 'oath', type: 'choice', prompt: 'למה נשבעת?', options: [
//       { id: 'justice', label: 'צדק' },
//       { id: 'mercy', label: 'רחמים' },
//   ] },

export const CHARACTERS = [
  {
    id: 'turator',
    name: 'טוראטור',
    cls: 'פלדין',
    icon: 'shield',
    // TODO: Aviv fills this in
    steps: [
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
