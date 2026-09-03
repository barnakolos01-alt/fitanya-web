// ---------------------------------------------------------------------------
// Sóvárgás-cserék — kulcsszó alapú párosítás
// ---------------------------------------------------------------------------
export const CRAVING_SWAP_GROUPS = [
  {
    match: ["csoki", "kinder", "nutella", "édes", "torta", "süti"],
    options: [
      {
        text: "Görög joghurt + 1 kanál kakaópor + édesítő (20g fehérjés villám-csokikrém)",
        delta: { protein: 1 },
      },
      { text: "Meleg mandulatej fahéjjal és pár szem mandulával", delta: { fat: 0.5 } },
    ],
  },
  {
    match: ["chips", "sós", "ropi", "kréker", "pufi"],
    options: [
      {
        text: "Sós túrókrém kaporral, uborkával vagy kaliforniai paprikával mártogatva",
        delta: { protein: 1, veg: 0.5 },
      },
      { text: "Egy marék pirított tökmag vagy mandula", delta: { fat: 0.5 } },
    ],
  },
  {
    match: ["pizza", "gyros", "hamburger", "gyorsétel", "meki"],
    options: [
      {
        text: "Melegszendvics rozskenyéren, dupla sonkával és sok olvasztott sajttal",
        delta: { protein: 1, carb: 0.5 },
      },
      {
        text: "Tortilla wrap serpenyős csirkemellcsíkokkal és ropogós zöldséggel",
        delta: { protein: 1, veg: 1 },
      },
    ],
  },
];

export const DEFAULT_SWAPS = [
  { text: "Egy tenyérnyi sajt vagy sonka friss zöldséghasábokkal", delta: { protein: 1, veg: 0.5 } },
  { text: "Görög joghurt egy kevés fahéjjal és édesítővel", delta: { protein: 1 } },
];

export function getSwaps(text) {
  const key = text.toLowerCase();
  const found = CRAVING_SWAP_GROUPS.find((g) => g.match.some((m) => key.includes(m)));
  return found ? found.options : DEFAULT_SWAPS;
}
