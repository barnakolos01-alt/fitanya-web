// ---------------------------------------------------------------------------
// Sóvárgás-cserék — kulcsszó alapú élettani párosítás
// ---------------------------------------------------------------------------
export const CRAVING_SWAP_GROUPS = [
  // 1. ÉDESSÉG / CSOKI / SÜTEMÉNY
  {
    match: ["csoki", "kinder", "nutella", "édes", "torta", "süti", "édesség", "muffin"],
    options: [
      {
        text: "Görög joghurt + 1 ek holland kakaópor + édesítő (20g fehérjés villám-csokikrém)",
        delta: { protein: 1, fat: 0.5 },
      },
      {
        text: "Túrókrém villával összetörve, fahéjjal, pár csepp vaníliával és 1 marék bogyós gyümölccsel",
        delta: { protein: 1, carb: 0.5 },
      },
      {
        text: "Meleg mandulatej fahéjjal és 10 szem pirított mandulával",
        delta: { fat: 1 },
      },
    ],
  },

  // 2. PÉKSÜTEMÉNY / KAKAÓS CSIGA / POGÁCSA
  {
    match: ["péksüti", "csiga", "kakaós csiga", "pogácsa", "croissant", "kifli", "fánk", "pékáru"],
    options: [
      {
        text: "Serpenyős zabpalacsinta: 1 tojás + 3 ek zabpehely + fahéj összekeverve, 3 perc alatt kisütve",
        delta: { protein: 0.5, carb: 1 },
      },
      {
        text: "Pirított teljes kiőrlésű pirítós vékonyan vajazva, vastag réteg sonkával és kígyóuborkával",
        delta: { protein: 1, carb: 1, veg: 0.5 },
      },
      {
        text: "Sajtos mikrós omlett bögrében: 2 tojás + 1 ek reszelt trappista 90 másodperc alatt",
        delta: { protein: 1.5, fat: 1 },
      },
    ],
  },

  // 3. GYORSÉTEL / PIZZA / BURGER / GYROS
  {
    match: ["pizza", "gyros", "hamburger", "gyorsétel", "meki", "mcdonalds", "kfc", "hotdog"],
    options: [
      {
        text: "Tortilla-pizza: 1 teljes kiőrlésű tortilla megkenve sűrített paradicsommal, sonkával, sajttal és oregánóval, 5 perc sütőben",
        delta: { protein: 1, carb: 1, fat: 0.5 },
      },
      {
        text: "Gyros tál házilag: natúr sült csirkemellcsíkok ropogós jégsalátával, uborkával és fokhagymás natúr joghurt öntettel",
        delta: { protein: 1.5, veg: 1 },
      },
      {
        text: "Melegszendvics rozskenyéren: dupla sonka, mustár és ráolvasztott sajt",
        delta: { protein: 1, carb: 1 },
      },
    ],
  },

  // 4. TÉSZTA / OLASZ ÉTELEK
  {
    match: ["tészta", "spagetti", "carbonara", "bolognai", "lasagne", "nokedli", "milánói"],
    options: [
      {
        text: "Fehérjés villámtészta: 1 marék durum tészta összekeverve 3 ek zsírszegény túróval és 1 ek pirított sonkakockával",
        delta: { protein: 1, carb: 1 },
      },
      {
        text: "Cukkini-spagetti fele-fele arányban normál spagettivel és bolognai darálthús raguval",
        delta: { protein: 1, carb: 0.5, veg: 1 },
      },
    ],
  },

  // 5. SÓS RÁCSOLNIVALÓ / CHIPS
  {
    match: ["chips", "sós", "ropi", "kréker", "pufi", "nachos", "popcorn", "sós mogyoró"],
    options: [
      {
        text: "Zöldség-mártogatós: ropogós kaliforniai paprika- és uborkahasábok zöldfűszeres sós túrókrémmel",
        delta: { protein: 1, veg: 1 },
      },
      {
        text: "1 marék pirított, sózott tökmag vagy pisztácia",
        delta: { fat: 1 },
      },
      {
        text: "Sajtos ropogós: 2 szelet trappista sajt sütőpapíron 2 perc alatt aranybarnára ropogósra sütve a mikróban",
        delta: { protein: 0.5, fat: 1 },
      },
    ],
  },

  // 6. FAGYLALT / KRÉMEK
  {
    match: ["fagyi", "fagylalt", "jégkrém", "shake", "parfé"],
    options: [
      {
        text: "Villámfagyi: Fagyasztott eper vagy málna összeturmixolva 3 kanál natúr görög joghurttal és édesítővel",
        delta: { protein: 0.5, carb: 0.5 },
      },
      {
        text: "Jeges fehérjekávé: 1 presszókávé + hideg mandulatej + 1 gombóc csokis fehérjepor és jégkocka felrázva",
        delta: { protein: 1 },
      },
    ],
  },

  // 7. RÁNTOTT ÉTELEK
  {
    match: ["rántott", "rántott hús", "rántott sajt", "nuggets", "bundás"],
    options: [
      {
        text: "Airfryer vagy sütős bundás csirkemell: kukoricapehely morzsába vagy zabpehelybe forgatva, olajban tocsogás nélkül",
        delta: { protein: 1.5, carb: 0.5 },
      },
      {
        text: "Sült mozzarella szeletek bazsalikommal és paradicsomkarikákkal",
        delta: { protein: 1, fat: 1, veg: 0.5 },
      },
    ],
  },
];

export const DEFAULT_SWAPS = [
  { 
    text: "Egy tenyérnyi sovány sajt vagy sonka friss zöldséghasábokkal és 1 pohár hideg vízzel", 
    delta: { protein: 1, veg: 0.5 } 
  },
  { 
    text: "Görög joghurt fahéjjal és 10 szem roppanós mandulával", 
    delta: { protein: 1, fat: 0.5 } 
  },
  {
    text: "1 csésze meleg menta- vagy citromfű tea 1 teáskanál mézzel",
    delta: { carb: 0.5 },
  },
];

export function getSwaps(text) {
  if (!text) return DEFAULT_SWAPS;
  const key = text.toLowerCase().trim();
  const found = CRAVING_SWAP_GROUPS.find((g) => g.match.some((m) => key.includes(m)));
  return found ? found.options : DEFAULT_SWAPS;
}
