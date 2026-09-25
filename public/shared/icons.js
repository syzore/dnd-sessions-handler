// Hand-drawn line icons on a 48x48 grid. Paths with class "fl" get a soft accent fill.
const I = {
  sword:
    '<path class="fl" d="M37 5h6v6L22 32l-6-6z"/><path d="M12 24l12 12"/><path d="M16 32l-8 8"/><circle cx="7" cy="41" r="2.5"/>',
  shield: '<path class="fl" d="M24 5l15 5v11c0 10-6.5 17-15 22C15.5 38 9 31 9 21V10z"/><path d="M24 12v24M16 20h16"/>',
  dragon:
    '<path class="fl" d="M6 30c3-1 6-3 8-6l-4-9 9 5c2-1 4-2 7-2l3-10 4 11c5 1 9 5 11 10l-9-1c-1 3-3 5-6 6l2 8-7-5c-3 1-6 1-9 0l-6 4 1-7c-2-1-3-2-4-4z"/><circle cx="31" cy="23" r="1.8" fill="currentColor"/><path d="M36 30l4 1"/>',
  grin: '<circle class="fl" cx="24" cy="24" r="18"/><path d="M14 26c2 7 18 7 20 0z"/><path d="M15 19l3-3 3 3M27 19l3-3 3 3"/>',
  magnifier: '<circle class="fl" cx="20" cy="20" r="12"/><path d="M29 29l12 12"/><path d="M14 18a6 6 0 0 1 6-5"/>',
  castle:
    '<path class="fl" d="M8 42V16h6v5h5v-5h10v5h5v-5h6v26z"/><path d="M20 42v-8a4 4 0 0 1 8 0v8"/><path d="M24 16V5l7 3-7 3"/>',
  skull:
    '<path class="fl" d="M24 6c-9 0-15 6-15 14 0 5 2 8 5 10v6h20v-6c3-2 5-5 5-10 0-8-6-14-15-14z"/><circle cx="18" cy="21" r="3.5" fill="currentColor"/><circle cx="30" cy="21" r="3.5" fill="currentColor"/><path d="M20 36v5M24 36v5M28 36v5M24 26l-2 4h4z"/>',
  sparkles:
    '<path class="fl" d="M20 6l3 10 10 3-10 3-3 10-3-10-10-3 10-3z"/><path class="fl" d="M36 28l1.5 5 5 1.5-5 1.5-1.5 5-1.5-5-5-1.5 5-1.5z"/><path d="M37 6v7M33.5 9.5h7"/>',
  question:
    '<circle class="fl" cx="24" cy="24" r="18"/><path d="M18 19a6 6 0 1 1 8 5.6c-1.3.6-2 1.6-2 3V30"/><circle cx="24" cy="35" r="1.4" fill="currentColor"/>',
  mask: '<path class="fl" d="M8 10c6 3 16 3 22 0v12c0 8-5 14-11 14S8 30 8 22z"/><path d="M13 19l3-2 3 2M20 19l3-2 3 2M14 26c2 4 8 4 10 0"/><path d="M30 17c3 1 7 1 10 0v11c0 7-4 12-10 12-2 0-4-1-5-2"/><path d="M32 33c2-2 5-2 6 0M32 23h3M36 23h2"/>',
  scales:
    '<path d="M24 6v34M14 40h20M9 12h30"/><path class="fl" d="M9 12l-6 13h12zM39 12l-6 13h12z"/><path d="M3 25c1 4 11 4 12 0M33 25c1 4 11 4 12 0"/>',
  d20: '<path class="fl" d="M24 4l17 10v20L24 44 7 34V14z"/><path d="M16 20h16l-8 13z"/><path d="M24 4l-8 16M24 4l8 16M7 14l9 6M41 14l-9 6M7 34l9-14M7 34l17-1M41 34l-9-14M41 34l-17-1M24 33v11"/>',
  dice: '<rect class="fl" x="8" y="8" width="32" height="32" rx="7"/><circle cx="17" cy="17" r="2.6" fill="currentColor"/><circle cx="24" cy="24" r="2.6" fill="currentColor"/><circle cx="31" cy="31" r="2.6" fill="currentColor"/><circle cx="31" cy="17" r="2.6" fill="currentColor"/><circle cx="17" cy="31" r="2.6" fill="currentColor"/>',
  bubble: '<path class="fl" d="M7 9h34v23H22l-9 8v-8H7z"/><path d="M14 17h20M14 24h13"/>',
  hat: '<path class="fl" d="M26 4c-6 6-12 18-14 30h22c-1-8-2-16 1-22-4 0-7-3-9-8z"/><path d="M5 36c7 4 31 4 38 0-7-4-31-4-38 0z"/><circle cx="22" cy="20" r="1.3" fill="currentColor"/><circle cx="26" cy="27" r="1.3" fill="currentColor"/>',
  people:
    '<circle class="fl" cx="17" cy="16" r="6"/><circle class="fl" cx="33" cy="18" r="5"/><path d="M5 40c0-8 5-13 12-13s12 5 12 13"/><path d="M28 29c1.5-1.5 3-2.5 5-2.5 6 0 10 4.5 10 12"/>',
  meh: '<circle class="fl" cx="24" cy="24" r="18"/><circle cx="18" cy="21" r="2" fill="currentColor"/><circle cx="30" cy="21" r="2" fill="currentColor"/><path d="M17 31h14"/>',
  book: '<path class="fl" d="M6 10c6-2 12-2 18 2v28c-6-4-12-4-18-2z"/><path class="fl" d="M42 10c-6-2-12-2-18 2v28c6-4 12-4 18-2z"/>',
  bolt: '<path class="fl" d="M28 4L10 27h12l-3 17 19-24H26z"/>',
  compass:
    '<circle class="fl" cx="24" cy="24" r="18"/><path d="M32 16l-5 11-11 5 5-11z"/><circle cx="24" cy="24" r="1.6" fill="currentColor"/>',
  beer: '<path class="fl" d="M10 15h20v26H10z"/><path d="M30 19h5a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-5"/><path d="M9 15c0-4 3-6 7-5 2-3 7-3 9 0 3-1 6 1 6 5"/><path d="M16 22v13M24 22v13"/>',
  scroll:
    '<rect class="fl" x="11" y="7" width="26" height="33" rx="3"/><path d="M17 15h14M17 21h14M17 27h9"/><path d="M37 11h3a3 3 0 0 0-3-4M11 36H8a3 3 0 0 0 3 4"/>',
  flame:
    '<path class="fl" d="M24 44c-8 0-13-5-13-12 0-8 7-11 8-20 5 4 6 8 6 12 2-2 3-4 3-7 5 4 9 9 9 15 0 7-5 12-13 12z"/><path d="M24 40c-3 0-5-2-5-5 0-3 3-5 5-8 2 3 5 5 5 8 0 3-2 5-5 5z"/>',
  bulb: '<path class="fl" d="M24 5a12 12 0 0 0-7 21.8V32h14v-5.2A12 12 0 0 0 24 5z"/><path d="M18 37h12M20 42h8M24 32v-9l-3-3M24 23l3-3"/>',
  knight:
    '<path class="fl" d="M14 40c1-6 6-9 7-15l-6 2-3-4 8-8-1-5c8 0 15 5 16 14 1 6-1 11 0 16z"/><path d="M11 42h26"/><circle cx="22" cy="16" r="1.5" fill="currentColor"/>',
  map: '<path class="fl" d="M6 12l11-4 14 4 11-4v28l-11 4-14-4-11 4z"/><path d="M17 8v28M31 12v28"/><path d="M36 19l-4 4M32 19l4 4"/>',
  door: '<path class="fl" d="M12 42V9a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v33"/><path d="M8 42h32"/><circle cx="30" cy="26" r="2" fill="currentColor"/>',
  target: '<circle class="fl" cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="11"/><circle cx="24" cy="24" r="4" fill="currentColor"/>',
  globe:
    '<circle class="fl" cx="24" cy="24" r="18"/><path d="M6 24h36M9 15h30M9 33h30M24 6c-6 5-8 11-8 18s2 13 8 18c6-5 8-11 8-18S30 11 24 6z"/>',
  snowflake:
    '<path d="M24 4v40M6.7 14l34.6 20M6.7 34l34.6-20"/><path d="M19 7l5 5 5-5M19 41l5-5 5 5M6 20l7-1-2-7M42 28l-7 1 2 7M6 28l7 1-2 7M42 20l-7-1 2-7"/><circle class="fl" cx="24" cy="24" r="4"/>',
  coins:
    '<ellipse class="fl" cx="19" cy="13" rx="12" ry="5"/><path d="M7 13v8c0 3 5 5 12 5s12-2 12-5v-8M7 21v8c0 3 5 5 12 5"/><ellipse class="fl" cx="30" cy="31" rx="11" ry="5"/><path d="M19 31v6c0 3 5 5 11 5s11-2 11-5v-6"/>',
  crown: '<path class="fl" d="M5 16l9 9 10-15 10 15 9-9-4 23H9z"/><path d="M9 39h30"/><path d="M25 21l-3 6 5 3-3 7"/>',
  eye: '<path class="fl" d="M4 24c5-9 12-14 20-14s15 5 20 14c-5 9-12 14-20 14S9 33 4 24z"/><circle cx="24" cy="24" r="7.5"/><path d="M24 19v10" stroke-width="3.2"/>',
  quill:
    '<path class="fl" d="M41 5C27 7 17 17 13 33l3 2c4-4 8-6 12-6l-4-3 9-2-3-3 7-4c2-4 3-8 4-12z"/><path d="M13 33l-5 10M7 43h14"/>',
  flag: '<path d="M11 44V5"/><path class="fl" d="M11 7h27l-6 8 6 8H11"/>',
  ban: '<circle cx="24" cy="24" r="17"/><path d="M12 12l24 24"/>',
  check: '<path d="M10 25l9 9 19-19"/>',
  chevR: '<path d="M18 10l14 14-14 14"/>',
  chevL: '<path d="M30 10L16 24l14 14"/>',
  copy: '<rect x="15" y="15" width="24" height="26" rx="4"/><path d="M9 33V11a4 4 0 0 1 4-4h18"/>',
  link: '<path d="M20 28l8-8"/><path d="M22 14l3-3a7 7 0 0 1 10 10l-3 3M26 34l-3 3a7 7 0 0 1-10-10l3-3"/>',
  x: '<path d="M13 13l22 22M35 13L13 35"/>',
  maybe: '<path d="M18 17a6 6 0 1 1 8 5.6c-1.3.6-2 1.6-2 3V28"/><circle cx="24" cy="34" r="1.6" fill="currentColor"/>',
  calendar:
    '<rect class="fl" x="6" y="10" width="36" height="32" rx="5"/><path d="M6 19h36M15 6v8M33 6v8"/><circle cx="16" cy="27" r="1.8" fill="currentColor"/><circle cx="24" cy="27" r="1.8" fill="currentColor"/><circle cx="32" cy="27" r="1.8" fill="currentColor"/><circle cx="16" cy="34" r="1.8" fill="currentColor"/><circle cx="24" cy="34" r="1.8" fill="currentColor"/>',
  moon: '<path class="fl" d="M34 30A15 15 0 0 1 20 8a16 16 0 1 0 20 20 15 15 0 0 1-6 2z"/><path d="M34 8v6M31 11h6"/>',
  lock: '<rect class="fl" x="10" y="21" width="28" height="21" rx="4"/><path d="M16 21v-6a8 8 0 0 1 16 0v6"/><circle cx="24" cy="31" r="2.5" fill="currentColor"/>',
  unlock: '<rect class="fl" x="10" y="21" width="28" height="21" rx="4"/><path d="M16 21v-6a8 8 0 0 1 15.5-2.8"/><circle cx="24" cy="31" r="2.5" fill="currentColor"/>',
  pin: '<path class="fl" d="M24 43s13-12 13-23a13 13 0 0 0-26 0c0 11 13 23 13 23z"/><circle cx="24" cy="20" r="5"/>',
  download: '<path d="M24 6v24M14 20l10 10 10-10M8 36v4a2 2 0 0 0 2 2h28a2 2 0 0 0 2-2v-4"/>',
  chest:
    '<path class="fl" d="M6 20h36v20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M6 20c0-7 4-12 10-12h16c6 0 10 5 10 12"/><path d="M6 26h36M20 23h8v8h-8z"/>',
  anchor: '<circle cx="24" cy="9" r="4"/><path d="M24 13v29M14 21h20"/><path d="M7 28c0 8 8 14 17 14s17-6 17-14"/><path d="M7 28l-2 4M7 28l4 2M41 28l2 4M41 28l-4 2"/>',
  trash: '<path d="M8 13h32M19 13V8h10v5"/><path class="fl" d="M11 13l2 28a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2l2-28z"/><path d="M20 20v16M28 20v16"/>',
  plus: '<path d="M24 10v28M10 24h28"/>',
  pencil: '<path class="fl" d="M32 6l10 10-24 24H8V30z"/><path d="M27 11l10 10"/>',
};

export function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name] || I.question}</svg>`;
}
