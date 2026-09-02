import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ShieldCheck,
  Sparkles,
  Clock,
  Moon,
  Utensils,
  TrendingDown,
  Calendar,
  Mail,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Star,
  Check,
  ArrowRight,
  Sun,
  CreditCard,
  Wallet,
  Heart,
  Flame,
  X,
  Beef,
  Wheat,
  Droplet,
  RefreshCw,
  Coffee,
  Salad,
  Soup,
  Cookie,
  Download,
  FileText,
  Users,
  Award,
  Phone,
  Home,
  ExternalLink,
  Zap,
  CheckCheck,
  XCircle,
  Baby,
  Activity,
  Target,
  Loader2,
  HelpCircle,
  Info,
} from "lucide-react";

// AZ ÉLES GOOGLE APPS SCRIPT WEBHOOK URL:
const GOOGLE_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzYnNbGqwXhX5AGhQ-1bwSZhLZM0e1LYMPN84XTFXGgysxuOnVvT-2_HwxY6xZIh1Bi/exec";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Work+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');`;

const HU_MONTHS = [
  "január", "február", "március", "április", "május", "június",
  "július", "augusztus", "szeptember", "október", "november", "december",
];

function formatHuDate(date) {
  return `${date.getFullYear()}. ${HU_MONTHS[date.getMonth()]} ${date.getDate()}.`;
}

function computeAudit(data) {
  const age = Number(data.age) || 30;
  const height = Number(data.height) || 165;
  const weight = Number(data.weight) || 70;
  const goalWeight = Number(data.goalWeight) || 62;

  // Mifflin-St Jeor alapanyagcsere
  const bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  
  let activityMult = 1.3;
  if (data.activity === "seta") activityMult = 1.4;
  if (data.activity === "porgos") activityMult = 1.5;
  
  let tdee = bmr * activityMult;

  // Szoptatási kalóriapótlék
  let lactationBonus = 0;
  if (data.nursing === "kizarolag") lactationBonus = 450;
  if (data.nursing === "hozzataplal") lactationBonus = 250;

  tdee += lactationBonus;

  // Biztonságos napi kalóriakeret
  let targetKcal = tdee - 400;
  if (data.nursing === "kizarolag") {
    targetKcal = Math.max(targetKcal, 1750);
  } else {
    targetKcal = Math.max(targetKcal, 1300);
  }

  // Csipegetési többlet
  const snackMap = { szinte_soha: 0, napi_1_2: 210, folyamatos: 380 };
  const hiddenSurplus = snackMap[data.snacking] ?? 0;

  // Időtartam kalkuláció
  const weightToLose = Math.max(weight - goalWeight, 0);
  const weeklyRate = data.nursing === "kizarolag" ? 0.45 : 0.6;
  const weeksNeeded = weightToLose > 0 ? weightToLose / weeklyRate : 0;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + Math.round(weeksNeeded * 7));

  // Tenyér-Makró adagok
  const proteinGrams = Math.round(weight * 1.5);
  const fatGrams = Math.round((targetKcal * 0.28) / 9);
  const carbGrams = Math.round((targetKcal - (proteinGrams * 4 + fatGrams * 9)) / 4);

  const palmProtein = Math.max(Math.round(proteinGrams / 30), 2);
  const fistVeg = 3;
  const cuppedCarb = Math.max(Math.round(carbGrams / 40), 2);
  const thumbFat = Math.max(Math.round(fatGrams / 15), 2);

  // Intelligens csomagajánló logika
  let profile = "Családi Egyensúly Profil";
  let recommendedPkg = "premium";
  let pkgReason = "A te helyzetedben a legfontosabb a rohanó hétköznapok rendszerezése és a rejtett nassolási szivárgások azonnali megállítása.";

  if (data.focus === "bor_puffadas" || data.focus === "torna_has") {
    profile = "Regenerációs & Bőrfeszesítő Profil";
    recommendedPkg = "vip";
    pkgReason = "A szöveti regeneráció, a feszesebb hasfal és az SOS puffadásmentesítés miatt a 7 az 1-ben VIP csomag nyújtja a legteljesebb megoldást.";
  } else if (data.snacking === "folyamatos" || data.kitchen === "15perc") {
    profile = "Időhiányos Gyors-Megoldás Profil";
    recommendedPkg = "premium";
    pkgReason = "A 15 perces receptek, a bolti nassolási kalauz és a mester-bevásárlólista garantálja, hogy dupla főzés nélkül is elérd a célodat.";
  } else if (weightToLose <= 4 && data.sleep === "atalussza") {
    profile = "Könnyed Finomhangoló Profil";
    recommendedPkg = "basic";
    pkgReason = "Mivel kis súlyfeleslegről van szó és stabil az alvásod, az alap tenyér-szabály és a 30 gyorsrecept tökéletesen elegendő számodra.";
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetKcal: Math.round(targetKcal),
    hiddenSurplus,
    weeksNeeded: Math.round(weeksNeeded * 10) / 10,
    targetDateStr: weightToLose > 0 ? formatHuDate(targetDate) : "Már a célsúlyodnál jársz — irány a megtartás!",
    profile,
    weightToLose: Math.round(weightToLose * 10) / 10,
    proteinGrams,
    carbGrams,
    fatGrams,
    palmProtein,
    fistVeg,
    cuppedCarb,
    thumbFat,
    recommendedPkg,
    pkgReason,
    lactationBonus,
  };
}

const MEAL_PLAN = {
  reggeli: {
    label: "Reggeli",
    icon: Coffee,
    time: "7:30",
    options: [
      { name: "Zabkása tejjel, banánnal és fahéjjal", kcal: 360, protein: 16, carbs: 55, fat: 9 },
      { name: "Tojásrántotta 2 tojásból, teljes kiőrlésű pirítóssal", kcal: 350, protein: 21, carbs: 30, fat: 15 },
      { name: "Görög joghurt zabmüzlivel és bogyós gyümölccsel", kcal: 340, protein: 22, carbs: 42, fat: 8 },
      { name: "Sonkás-sajtos teljes kiőrlésű szendvics paradicsommal", kcal: 355, protein: 19, carbs: 38, fat: 13 },
    ],
  },
  ebed: {
    label: "Ebéd",
    icon: Soup,
    time: "12:30",
    options: [
      { name: "Csirkemellfilé barna rizzsel és gőzölt brokkolival", kcal: 560, protein: 42, carbs: 58, fat: 15 },
      { name: "Currys pulykacomb basmati rizzsel", kcal: 545, protein: 38, carbs: 60, fat: 16 },
      { name: "Bolognai spagetti sovány darálthússal", kcal: 570, protein: 35, carbs: 65, fat: 17 },
      { name: "Töltött paprika sovány hússal, tejfölös öntettel", kcal: 550, protein: 33, carbs: 52, fat: 19 },
    ],
  },
  vacsora: {
    label: "Vacsora",
    icon: Salad,
    time: "18:30",
    options: [
      { name: "Sült lazacfilé párolt zöldségekkel", kcal: 460, protein: 34, carbs: 22, fat: 24 },
      { name: "Túrós tésztasaláta sonkával és kukoricával", kcal: 445, protein: 28, carbs: 48, fat: 14 },
      { name: "Zöldséges omlett sajttal", kcal: 450, protein: 27, carbs: 14, fat: 30 },
      { name: "Csirkemell saláta olívaolajos öntettel, sajttal", kcal: 440, protein: 36, carbs: 18, fat: 22 },
    ],
  },
  uzsonna: {
    label: "Nasi",
    icon: Cookie,
    time: "16:00",
    options: [
      { name: "Alma mogyoróvajjal", kcal: 190, protein: 6, carbs: 22, fat: 9 },
      { name: "Túró Rudi és egy szem alma", kcal: 185, protein: 8, carbs: 24, fat: 7 },
      { name: "Sovány sajt teljes kiőrlésű ropival", kcal: 180, protein: 11, carbs: 18, fat: 7 },
      { name: "Görög joghurt egy marék dióval", kcal: 195, protein: 10, carbs: 12, fat: 12 },
    ],
  },
};

const STRIPE_PAYMENT_LINKS = {
  basic: "https://buy.stripe.com/7sY00l4y4cHZ3Lf4Hq9ws00",
  premium: "https://buy.stripe.com/4gMcN7aWs9vN0z3c9S9ws01",
  vip: "https://buy.stripe.com/8x2dRb5C86jB95zb5O9ws02",
};

const ALAP_PDF_URL = "https://drive.google.com/uc?export=download&id=1FkvydVMN9LU5hSFa1ib6kVeYh5Nmxazq";
const NASSOLASI_KALAUZ_URL = "https://drive.google.com/uc?export=download&id=10xkdMG9usiyfffr2Z4MwUdD6Z1wm3Dnd";
const SZOKASFORMALO_RENDSZER_URL = "https://drive.google.com/uc?export=download&id=1BHgqESp4BSHB6p48OYmBG9V39rLqArUe";
const BEVASARLOLISTA_URL = "https://drive.google.com/uc?export=download&id=1JO7UtDfRscfZCJb_wei1biIneb5TQQmj";
const VIP_EDZESPROGRAM_URL = "https://drive.google.com/uc?export=download&id=1t0jzoQI1IthWdQrbVaQhrxSyv2fF0aKu";
const VIP_KOLLAGEN_RESET_URL = "https://drive.google.com/uc?export=download&id=1EtnQtKoVQHweDYpQsFcsJuEfyml_BIU9";
const VIP_SOS_PUFFADAS_URL = "https://drive.google.com/uc?export=download&id=16VRXRWDo5kn06EvPIJTOc5yfTvLabGCN";

const PACKAGE_DOWNLOADS = {
  basic: {
    files: [
      { title: "FitAnya Alapprogram – 30 Családi Gyorsrecept & Tenyér-szabály (PDF)", meta: "Teljes Kézikönyv · Nyomtatható PDF", downloadUrl: ALAP_PDF_URL },
    ],
  },
  premium: {
    files: [
      { title: "FitAnya Alapprogram – 30 Recept & Tenyér-szabály (PDF)", meta: "Teljes Kézikönyv · Nyomtatható PDF", downloadUrl: ALAP_PDF_URL },
      { title: "Bolti Bűntudatmentes Nassolási Kalauz & Címkeolvasó (PDF)", meta: "Lidl / Aldi / Spar Polctérkép · PDF", downloadUrl: NASSOLASI_KALAUZ_URL },
      { title: "4 Hetes FitAnya Szokásformáló Rendszer (PDF)", meta: "Heti Protokollok & Habit Tracker · PDF", downloadUrl: SZOKASFORMALO_RENDSZER_URL },
      { title: "Heti Mester-Bevásárlólista & 15 Perces Dobozolás (PDF)", meta: "Nyomtatható Sablon · PDF", downloadUrl: BEVASARLOLISTA_URL },
    ],
  },
  vip: {
    files: [
      { title: "FitAnya Alapprogram – 30 Recept & Tenyér-szabály (PDF)", meta: "Teljes Kézikönyv · Nyomtatható PDF", downloadUrl: ALAP_PDF_URL },
      { title: "Bolti Bűntudatmentes Nassolási Kalauz & Címkeolvasó (PDF)", meta: "Lidl / Aldi / Spar Polctérkép · PDF", downloadUrl: NASSOLASI_KALAUZ_URL },
      { title: "4 Hetes FitAnya Szokásformáló Rendszer (PDF)", meta: "Heti Protokollok & Habit Tracker · PDF", downloadUrl: SZOKASFORMALO_RENDSZER_URL },
      { title: "Heti Mester-Bevásárlólista & 15 Perces Dobozolás (PDF)", meta: "Nyomtatható Sablon · PDF", downloadUrl: BEVASARLOLISTA_URL },
      { title: "„Feszes Pocak & Kerek Fenék” 10 Perces Csendes Torna (PDF)", meta: "Eszközmentes Anyabarát Torna · PDF", downloadUrl: VIP_EDZESPROGRAM_URL },
      { title: "Kollagén & Bőrfiatalító Hormon-Reset Kisokos (PDF)", meta: "Anti-aging Protokoll · PDF", downloadUrl: VIP_KOLLAGEN_RESET_URL },
      { title: "48 Órás SOS Puffadásmentesítő & Lapos Has Protokoll (PDF)", meta: "Gyorssegély Vészhelyzetre · PDF", downloadUrl: VIP_SOS_PUFFADAS_URL },
    ],
    vip: true,
  },
};

const PILLARS_DATA = [
  {
    id: "pillar1",
    tag: "1. Pillér",
    title: "10 Perces Csendes Mozgás",
    desc: "Nincs szükség kondibérletre vagy ugrálásra. Kifejezetten a hasfal és a törzsizmok kíméletes, de hatékony megerősítésére fókuszálunk.",
    icon: Clock,
    iconColor: "#E07A5F",
    img: "/edzes.jpg",
    modalTitle: "10 Perces Csendes Otthoni Mozgás",
    modalPoints: [
      "Zéró ugrálás: Nem ébreszti fel az alvó babát és védi a szülés után érzékeny medencefenék izomzatát.",
      "Szétnyílt hasizom (diastasis recti) barát gyakorlatok a hasfal biztonságos feszesítésére.",
      "Nincs szükség semmilyen eszközre, mindössze egy polifoamra vagy szőnyegre a nappaliban.",
      "Pontosan 10 perc: bármikor beilleszthető a délelőtti vagy délutáni alvásidőbe."
    ]
  },
  {
    id: "pillar2",
    tag: "2. Pillér",
    title: "Egy Főzés — Tenyér-szabály",
    desc: "Nincs kétfelé főzés. A család kedvenc ételeit készíted el, csupán a saját tányérodra szedett makróarányokat állítod be 20 másodperc alatt a tenyered segítségével.",
    icon: Utensils,
    iconColor: "#8A4B4F",
    img: "/etrend.jpg",
    modalTitle: "Egy Főzés a Családnak — Tenyér-szabály",
    modalPoints: [
      "Nem kell külön diétás kaját főznöd magadnak: a gulyás, bolognai vagy sült csirke a családnak is ugyanaz marad.",
      "Konyhamérleg nélkül: a tenyered, öklöd és hüvelykujjad adja a grammra pontos tápanyagarányt.",
      "Nincs éhezés: a megemelt fehérje- és zöldségarány miatt 4-5 órán át stabil marad a jóllakottságod.",
      "Gyors tálalás: mindössze 20 másodperc alatt a megfelelő arány kerül a tányérodra a közös fazékból."
    ]
  },
  {
    id: "pillar3",
    tag: "3. Pillér",
    title: "Hormon-Reset & Energia",
    desc: "A kimerültség és a stressz miatti kortizolszintet célzott tápanyagokkal és mikro-pihenőkkel ellensúlyozzuk, megelőzve az esti falásrohamokat.",
    icon: Sun,
    iconColor: "#7C9885",
    img: "/energia.jpg",
    modalTitle: "Hormon-Reset & Anyai Energiaszint",
    modalPoints: [
      "Kortizolkontroll: az alváshiány miatti stresszhormonok raktározó hatását célzott tápanyag-időzítéssel tompítjuk.",
      "Viszlát esti nasirohamok: ha napközben stabilizáljuk a vércukrodat, este 9-kor nem tör rád a hűtőfosztási kényszer.",
      "Természetes energiaszint koffein-túladagolás nélkül: egyenletes fizikai és mentális teherbírás a nap végéig.",
      "Szoptatásbarát és kíméletes a női hormonrendszerhez, nem borítja fel az anyagcserét."
    ]
  }
];

function SectionEyebrow({ children }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full select-none"
      style={{ background: "#F9D5CE", color: "#8A4B4F" }}
    >
      {children}
    </span>
  );
}

function WaveConnector({ steps, activeIndex }) {
  return (
    <div className="relative flex items-center justify-between w-full max-w-lg mx-auto mb-2 select-none">
      <svg
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full"
        height="20"
        viewBox="0 0 500 20"
        preserveAspectRatio="none"
      >
        <path
          d="M0 10 Q 50 0, 100 10 T 200 10 T 300 10 T 400 10 T 500 10"
          fill="none"
          stroke="#F0C4B8"
          strokeWidth="2"
          strokeDasharray="1 8"
          strokeLinecap="round"
        />
      </svg>
      {steps.map((label, i) => (
        <div key={i} className="relative z-10 flex flex-col items-center gap-1.5" style={{ width: `${100 / steps.length}%` }}>
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold font-display transition-colors"
            style={{
              background: i <= activeIndex ? "#E07A5F" : "#FDFBF7",
              color: i <= activeIndex ? "#FDFBF7" : "#B99189",
              border: `2px solid ${i <= activeIndex ? "#E07A5F" : "#F0C4B8"}`,
            }}
          >
            {i < activeIndex ? <Check size={13} /> : i + 1}
          </div>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent = "#E07A5F" }) {
  return (
    <div
      className="rounded-2xl p-5 sm:p-6 flex flex-col gap-2 select-none"
      style={{ background: "#FDFBF7", border: "1px solid #F0DCD4" }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}1A` }}>
        <Icon size={20} style={{ color: accent }} />
      </div>
      <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: "#8A7268" }}>{label}</p>
      <p className="font-display font-semibold text-2xl sm:text-3xl" style={{ color: "#2D3748", fontFamily: "'Space Grotesk', sans-serif" }}>
        {value}
      </p>
      {sub && <p className="text-xs" style={{ color: "#8A7268" }}>{sub}</p>}
    </div>
  );
}

function PricingCard({ tier, selected, isRecommended, onSelect }) {
  const isFeatured = tier.featured;
  const hasBadge = !!tier.badge;
  return (
    <div
      className={`relative rounded-3xl p-7 sm:p-8 flex flex-col ${isFeatured ? "sm:-translate-y-3" : ""}`}
      style={{
        background: isRecommended
          ? "linear-gradient(180deg,#FFF6F2,#FDE0D6)"
          : isFeatured
          ? "linear-gradient(180deg,#FFF9F5,#FDE8E1)"
          : "#FDFBF7",
        border: isRecommended
          ? "2.5px solid #C8624A"
          : isFeatured
          ? "2px solid #E07A5F"
          : hasBadge
          ? "1.5px solid #8A4B4F"
          : "1px solid #F0DCD4",
        boxShadow: isRecommended
          ? "0 26px 52px -18px rgba(200,98,74,0.55)"
          : isFeatured
          ? "0 24px 48px -20px rgba(224,122,95,0.45)"
          : "0 10px 24px -16px rgba(45,55,72,0.15)",
      }}
    >
      {isRecommended ? (
        <span
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold font-display px-4 py-1.5 rounded-full whitespace-nowrap shadow-md select-none"
          style={{ background: "#C8624A", color: "#FFFDFB" }}
        >
          ★ NEKED AJÁNLOTT CSOMAG ★
        </span>
      ) : isFeatured ? (
        <span
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold font-display px-4 py-1.5 rounded-full whitespace-nowrap select-none"
          style={{ background: "#E07A5F", color: "#FFF9F5" }}
        >
          Legnépszerűbb választás
        </span>
      ) : hasBadge ? (
        <span
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold font-display px-4 py-1.5 rounded-full whitespace-nowrap select-none"
          style={{ background: "#8A4B4F", color: "#FDFBF7" }}
        >
          {tier.badge}
        </span>
      ) : null}

      <h3 className="font-display font-semibold text-xl mt-2" style={{ color: "#2D3748" }}>{tier.name}</h3>
      <p className="font-display font-bold text-3xl mt-2" style={{ color: "#E07A5F", fontFamily: "'Space Grotesk', sans-serif" }}>
        {tier.price.toLocaleString("hu-HU")} Ft
      </p>
      <p className="text-xs font-medium mt-1" style={{ color: "#8A7268" }}>
        Egyszeri fizetés • Nincs havidíj
      </p>

      <ul className="mt-5 space-y-3 flex-1">
        {tier.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#4A5568" }}>
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" style={{ color: "#7C9885" }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => onSelect(tier.id)}
        className="mt-7 w-full font-display font-bold text-sm px-6 py-3.5 rounded-xl inline-flex items-center justify-center gap-2 transition-transform cursor-pointer"
        style={{
          background: isRecommended ? "#C8624A" : isFeatured ? "#E07A5F" : hasBadge ? "#8A4B4F" : "#2D3748",
          color: "#FDFBF7",
        }}
      >
        {selected === tier.id ? "Kiválasztva" : "Kérem a csomagot"} <ArrowRight size={16} />
      </button>
    </div>
  );
}

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="border-b" style={{ borderColor: "#F0DCD4" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left py-5 gap-4 cursor-pointer"
      >
        <span className="font-display font-medium text-base sm:text-lg" style={{ color: "#2D3748" }}>{q}</span>
        <ChevronDown
          size={20}
          className="shrink-0 transition-transform"
          style={{ color: "#E07A5F", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <p className="pb-5 text-sm leading-relaxed" style={{ color: "#4A5568" }}>{a}</p>
      )}
    </div>
  );
}

function MacroChip({ icon: Icon, value, unit, color }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full select-none" style={{ background: `${color}17`, color }}>
      <Icon size={11} /> {value}{unit}
    </span>
  );
}

function MealSwapCard({ mealKey, meal, selectedIndex, isOpen, onToggleDropdown, onSelect }) {
  const current = meal.options[selectedIndex];
  const Icon = meal.icon;

  return (
    <div className="relative rounded-2xl p-5 sm:p-6 flex flex-col" style={{ background: "#FDFBF7", border: "1px solid #F0DCD4" }}>
      <div className="flex items-center justify-between mb-3 select-none">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#B99189" }}>
          <Icon size={14} /> {meal.label} · {meal.time}
        </span>
      </div>

      <p className="font-display font-semibold text-base leading-snug mb-4 min-h-[48px]" style={{ color: "#2D3748" }}>
        {current.name}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-5 select-none">
        <MacroChip icon={Flame} value={current.kcal} unit=" kcal" color="#E07A5F" />
        <MacroChip icon={Beef} value={current.protein} unit="g" color="#8A4B4F" />
        <MacroChip icon={Wheat} value={current.carbs} unit="g" color="#B08D4F" />
        <MacroChip icon={Droplet} value={current.fat} unit="g" color="#7C9885" />
      </div>

      <button
        onClick={() => onToggleDropdown(mealKey)}
        className="mt-auto w-full inline-flex items-center justify-center gap-2 text-sm font-display font-semibold px-4 py-2.5 rounded-xl cursor-pointer relative z-20"
        style={{ border: "1.5px solid #E07A5F", color: "#E07A5F", background: isOpen ? "#FDE8E1" : "transparent" }}
      >
        <RefreshCw size={15} /> Kaja cseréje
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20 cursor-default"
            onClick={(e) => {
              e.stopPropagation();
              onToggleDropdown(null);
            }}
          />

          <div
            className="absolute left-3 right-3 top-full mt-2 rounded-2xl p-2 z-30"
            style={{ background: "#FFFDFB", border: "1px solid #F0DCD4", boxShadow: "0 18px 40px -16px rgba(45,55,72,0.35)" }}
          >
            <div className="flex items-center justify-between px-2 pt-1.5 pb-2 select-none">
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#B99189" }}>
                Azonos makróértékű alternatívák
              </p>
              <button
                type="button"
                onClick={() => onToggleDropdown(null)}
                className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                aria-label="Bezárás"
              >
                <X size={14} />
              </button>
            </div>
            {meal.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => onSelect(mealKey, i)}
                className="w-full text-left px-2.5 py-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer"
                style={{ background: i === selectedIndex ? "#FDE8E1" : "transparent" }}
              >
                <span className="text-sm" style={{ color: "#2D3748" }}>
                  {opt.name}
                  {i === selectedIndex && <span className="ml-2 text-[11px] font-semibold" style={{ color: "#E07A5F" }}>(jelenlegi)</span>}
                </span>
                <span className="text-xs font-semibold shrink-0" style={{ color: "#8A7268" }}>{opt.kcal} kcal</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DownloadCard({ file, downloaded, onDownload }) {
  return (
    <div
      className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
      style={{ background: "#FDFBF7", border: "1px solid #F0DCD4" }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#FDE8E1" }}>
        <FileText size={22} style={{ color: "#E07A5F" }} />
      </div>
      <div className="flex-1">
        <p className="font-display font-semibold text-sm sm:text-base leading-snug" style={{ color: "#2D3748" }}>{file.title}</p>
        <p className="text-xs mt-1" style={{ color: "#8A7268" }}>{file.meta}</p>
      </div>
      <a
        href={file.downloadUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        download
        onClick={onDownload}
        className="shrink-0 inline-flex items-center justify-center gap-2 font-display font-semibold text-sm px-5 py-2.5 rounded-xl transition-transform no-underline"
        style={{
          background: downloaded ? "#F0F5F1" : "#E07A5F",
          color: downloaded ? "#7C9885" : "#FFFDFB",
          border: downloaded ? "1px solid #7C9885" : "none",
        }}
      >
        {downloaded ? (<><CheckCircle2 size={16} /> Letöltve</>) : (<><Download size={16} /> Letöltés (PDF)</>)}
      </a>
    </div>
  );
}

function OrderSuccessPanel({ orderForm, selectedPkg, packages, downloadedFiles, onDownload, onRestart }) {
  const pkg = packages.find((p) => p.id === selectedPkg) || packages[0];
  const downloads = PACKAGE_DOWNLOADS[selectedPkg] || PACKAGE_DOWNLOADS.premium;

  return (
    <div className="space-y-5">
      <div
        className="rounded-3xl p-8 sm:p-10 text-center"
        style={{ background: "linear-gradient(160deg,#FDE8E1,#F9D5CE)" }}
      >
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#FFFDFB" }}>
          <CheckCircle2 size={28} style={{ color: "#7C9885" }} />
        </div>
        <h3 className="font-display font-semibold text-2xl mb-1" style={{ color: "#2D3748" }}>
          Sikeres megrendelés, {orderForm.name || "kedves Anyuka"}! 🎉
        </h3>
        <p className="text-sm" style={{ color: "#6B5A52" }}>
          Megvásárolt csomagod: <strong style={{ color: "#E07A5F" }}>{pkg.name}</strong> — a hozzáférési központod alább érhető el.
        </p>
        {downloads.vip && (
          <span
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-display font-bold px-4 py-1.5 rounded-full"
            style={{ background: "#2D3748", color: "#F9D5CE" }}
          >
            <Award size={14} style={{ color: "#F4A825" }} /> VIP Prioritásos Támogatás aktiválva
          </span>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide font-semibold mb-3 px-1" style={{ color: "#D8C6BE" }}>
          A csomagod tartalma — {downloads.files.length} letölthető anyag
        </p>
        <div className="space-y-3">
          {downloads.files.map((f, i) => {
            const key = `${selectedPkg}-${i}`;
            return (
              <DownloadCard
                key={key}
                file={f}
                downloaded={!!downloadedFiles[key]}
                onDownload={() => onDownload(key)}
              />
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl p-5" style={{ background: "#FFFDFB" }}>
          <ShieldCheck size={20} style={{ color: "#7C9885" }} className="mb-2" />
          <p className="font-display font-semibold text-sm mb-1" style={{ color: "#2D3748" }}>14 napos garancia</p>
          <p className="text-xs leading-relaxed" style={{ color: "#8A7268" }}>
            Ha nem válik be, egyetlen e-mailre 100%-ban visszautaljuk a vételárat, kérdés nélkül.
          </p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "#FFFDFB" }}>
          <Phone size={20} style={{ color: "#7C9885" }} className="mb-2" />
          <p className="font-display font-semibold text-sm mb-1" style={{ color: "#2D3748" }}>Ügyfélszolgálat</p>
          <p className="text-xs leading-relaxed" style={{ color: "#8A7268" }}>
            Kérdésed van? Írj nekünk: <strong>ugyfelszolgalat@fitanyamodszer.hu</strong>
          </p>
        </div>
      </div>

      <div className="text-center pt-2">
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 font-display font-semibold text-sm px-6 py-3 rounded-xl cursor-pointer"
          style={{ background: "transparent", border: "1.5px solid #D8C6BE", color: "#D8C6BE" }}
        >
          <Home size={16} /> Vissza a főoldalra
        </button>
      </div>
    </div>
  );
}

export default function FitAnyaLandingRoot() {
  return <FitAnyaLanding />;
}

function FitAnyaLanding() {
  // 1. LOCALSTORAGE: Kérdőív és űrlap állapotok betöltése
  const [step, setStep] = useState(() => {
    try {
      const savedStep = localStorage.getItem("fa_step");
      return savedStep !== null ? Number(savedStep) : 0;
    } catch {
      return 0;
    }
  });

  const [wizardDone, setWizardDone] = useState(() => {
    try {
      return localStorage.getItem("fa_done") === "true";
    } catch {
      return false;
    }
  });

  const [form, setForm] = useState(() => {
    const defaultForm = {
      age: "", height: "", weight: "", goalWeight: "",
      nursing: "", activity: "", sleep: "", snacking: "", kitchen: "", focus: ""
    };
    try {
      const saved = localStorage.getItem("fa_form");
      return saved ? JSON.parse(saved) : defaultForm;
    } catch {
      return defaultForm;
    }
  });

  const [gateEmail, setGateEmail] = useState(() => {
    try { return localStorage.getItem("fa_email") || ""; } catch { return ""; }
  });
  
  const [gateSent, setGateSent] = useState(() => {
    try { return localStorage.getItem("fa_gate_sent") === "true"; } catch { return false; }
  });
  
  const [isSendingGate, setIsSendingGate] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState("premium");
  const [faqOpen, setFaqOpen] = useState(0);

  const [orderForm, setOrderForm] = useState(() => {
    const defaultOrder = { name: "", email: "" };
    try {
      const saved = localStorage.getItem("fa_order_form");
      if (saved) return JSON.parse(saved);
      const savedEmail = localStorage.getItem("fa_email");
      return savedEmail ? { name: "", email: savedEmail } : defaultOrder;
    } catch {
      return defaultOrder;
    }
  });

  const [orderError, setOrderError] = useState("");
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState({});

  const [activeLegalModal, setActiveLegalModal] = useState(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [activePalmDetail, setActivePalmDetail] = useState(null);
  const [activePillarModal, setActivePillarModal] = useState(null);

  // Mentés LocalStorage-ba
  useEffect(() => {
    try {
      localStorage.setItem("fa_step", String(step));
      localStorage.setItem("fa_done", String(wizardDone));
      localStorage.setItem("fa_form", JSON.stringify(form));
    } catch (e) {}
  }, [step, wizardDone, form]);

  useEffect(() => {
    try {
      localStorage.setItem("fa_order_form", JSON.stringify(orderForm));
    } catch (e) {}
  }, [orderForm]);

  const handleDownload = (key) => setDownloadedFiles((s) => ({ ...s, [key]: true }));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success") {
      const pkgParam = params.get("pkg");
      if (pkgParam && PACKAGE_DOWNLOADS[pkgParam]) {
        setSelectedPkg(pkgParam);
      }

      // Meta Pixel Vásárlás Mérése
      if (window.fbq) {
        let price = 7990;
        if (pkgParam === "basic") price = 4990;
        if (pkgParam === "vip") price = 12990;
        window.fbq("track", "Purchase", { value: price, currency: "HUF" });
      }

      setOrderSubmitted(true);
    }
  }, []);

  // Görgetésfigyelő mobilos lebegő sávhoz
  useEffect(() => {
    const handleScroll = () => {
      if (orderSubmitted) {
        setShowStickyBar(false);
        return;
      }
      
      const scrollY = window.scrollY;
      let hideBar = false;

      const checkVisibility = (ref) => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          if (rect.top <= window.innerHeight && rect.bottom >= 0) {
            return true;
          }
        }
        return false;
      };

      if (checkVisibility(pricingRef) || checkVisibility(orderRef)) {
        hideBar = true;
      }

      if (scrollY > 400 && !hideBar) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [orderSubmitted]);

  // Súrlódásmentes adatmentés sendBeacon háttérhívással a feliratkozási kapuhoz
  const sendLeadData = (payload) => {
    const dataStr = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([dataStr], { type: "text/plain;charset=utf-8" });
      navigator.sendBeacon(GOOGLE_SHEET_WEBHOOK_URL, blob);
    } else {
      fetch(GOOGLE_SHEET_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: dataStr,
        keepalive: true,
      }).catch((e) => console.warn(e));
    }
  };

  // STRIPE ÁTIRÁNYÍTÁS DINAMIKUS PREFILL-LEL
  const handleStripeCheckout = () => {
    const baseUrl = STRIPE_PAYMENT_LINKS[selectedPkg];
    if (baseUrl) {
      setIsCheckingOut(true);

      // Meta Pixel Fizetés kezdeményezése
      if (window.fbq) {
        let price = 7990;
        if (selectedPkg === "basic") price = 4990;
        if (selectedPkg === "vip") price = 12990;
        window.fbq("track", "InitiateCheckout", { value: price, currency: "HUF" });
      }

      const rawEmail = (orderForm.email || gateEmail || "").trim();
      const checkoutUrl = rawEmail 
        ? `${baseUrl}?prefilled_email=${encodeURIComponent(rawEmail)}` 
        : baseUrl;

      window.location.href = checkoutUrl;
      setTimeout(() => setIsCheckingOut(false), 6000); 
    }
  };

  // JAVÍTVA: Kizárólag validáció és Stripe indítás fut, nincs webhook hívás, így nem generálódik téves e-mail!
  const handleOrderSubmit = () => {
    if (!orderForm.name.trim() || !orderForm.email.trim()) {
      setOrderError("Kérjük, add meg a neved és az e-mail címed a folytatáshoz!");
      return;
    }
    setOrderError("");
    handleStripeCheckout();
  };

  const handleRestart = () => {
    try {
      localStorage.removeItem("fa_step");
      localStorage.removeItem("fa_done");
      localStorage.removeItem("fa_form");
      localStorage.removeItem("fa_order_form");
      localStorage.removeItem("fa_email");
      localStorage.removeItem("fa_gate_sent");
    } catch (e) {}

    setOrderSubmitted(false);
    setOrderError("");
    setWizardDone(false);
    setStep(0);
    setGateEmail("");
    setGateSent(false);
    setForm({
      age: "", height: "", weight: "", goalWeight: "",
      nursing: "", activity: "", sleep: "", snacking: "", kitchen: "", focus: ""
    });
    setDownloadedFiles({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [mealSelection, setMealSelection] = useState({ reggeli: 0, ebed: 0, vacsora: 0, uzsonna: 0 });
  const [openMealDropdown, setOpenMealDropdown] = useState(null);

  const toggleMealDropdown = (key) => setOpenMealDropdown((cur) => (cur === key ? null : key));
  const selectMealOption = (key, idx) => {
    setMealSelection((s) => ({ ...s, [key]: idx }));
    setOpenMealDropdown(null);
  };

  const dailyTotals = useMemo(() => {
    return Object.entries(mealSelection).reduce(
      (acc, [key, idx]) => {
        const opt = MEAL_PLAN[key].options[idx];
        acc.kcal += opt.kcal;
        acc.protein += opt.protein;
        acc.carbs += opt.carbs;
        acc.fat += opt.fat;
        return acc;
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [mealSelection]);

  const wizardRef = useRef(null);
  const mealPlannerRef = useRef(null);
  const pricingRef = useRef(null);
  const orderRef = useRef(null);

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    if (orderSubmitted) {
      const id = setTimeout(() => {
        orderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      return () => clearTimeout(id);
    }
  }, [orderSubmitted]);

  const stepLabels = ["Alapadatok", "Élethelyzet", "Aktivitás", "Alvás & Stressz", "Konyha & Szokások", "Fő Fókusz"];

  const canProceed = useMemo(() => {
    if (step === 0) return form.age && form.height && form.weight && form.goalWeight;
    if (step === 1) return !!form.nursing;
    if (step === 2) return !!form.activity;
    if (step === 3) return !!form.sleep;
    if (step === 4) return form.snacking && form.kitchen;
    if (step === 5) return !!form.focus;
    return false;
  }, [step, form]);

  const results = useMemo(() => computeAudit(form), [form]);

  useEffect(() => {
    if (wizardDone && results.recommendedPkg) {
      setSelectedPkg(results.recommendedPkg);
    }
  }, [wizardDone, results.recommendedPkg]);

  const handleSendGateEmail = async () => {
    if (!gateEmail || !gateEmail.includes("@")) return;
    setIsSendingGate(true);
    
    setOrderForm((prev) => ({ ...prev, email: gateEmail.trim() }));
    try {
      localStorage.setItem("fa_email", gateEmail.trim());
      localStorage.setItem("fa_gate_sent", "true");
    } catch (e) {}
    
    try {
      sendLeadData({
        action: "gate_lead",
        email: gateEmail.trim(),
        ...results,
        ...form,
      });

      if (window.fbq) {
        window.fbq("track", "Lead");
      }

      setGateSent(true);
    } catch (err) {
      setGateSent(true);
    } finally {
      setIsSendingGate(false);
    }
  };

  const packages = [
    {
      id: "basic",
      name: "Alap Csomag",
      price: 4990,
      features: [
        "FitAnya Alapprogram (30 Családi Gyorsrecept & Tenyér-szabály PDF)",
        "Interaktív Tenyér-Makró Kalkulátor hozzáférés",
      ],
    },
    {
      id: "premium",
      name: "Prémium Csomag",
      price: 7990,
      featured: true,
      features: [
        "Minden az Alapcsomagból",
        "Bolti Bűntudatmentes Nassolási Kalauz & Címkeolvasó (PDF)",
        "4 Hetes FitAnya Szokásformáló Rendszer (PDF)",
        "Heti Mester-Bevásárlólista & 15 Perces Dobozolási Kisokos (PDF)",
      ],
    },
    {
      id: "vip",
      name: "VIP Anya Csomag",
      price: 12990,
      badge: "★ Teljes Átalakulás & Bőrfeszesítés",
      features: [
        "Minden a Prémium Csomagból (4 db PDF + Kalkulátor)",
        "„Feszes Pocak & Kerek Fenék” 10 Perces Csendes Torna (PDF)",
        "Kollagén & Bőrfiatalító Hormon-Reset Kisokos (PDF)",
        "48 Órás SOS Puffadásmentesítő & Lapos Has Protokoll (PDF)",
      ],
    },
  ];

  const faqs = [
    {
      q: "Kell külön főznöm a családnak és a gyerekeknek?",
      a: "Nem. A FitAnya Módszer lényege, hogy egyetlen fazékban készül el az étel (pl. pörkölt, bolognai, sült húsok). A tenyér-szabállyal csak a te tányérodra szedett arányokat igazítjuk a célodhoz, 20 másodperc alatt.",
    },
    {
      q: "Muszáj grammra pontosan mérnem az ételeket mérlegen?",
      a: "Egyáltalán nem. A tenyér-szabály vizuális támpontot ad (tenyérnyi fehérje, ökölnyi rost, maréknyi szénhidrát), így konyhamérleg és applikációs kalóriabevitel nélkül is tartható a kívánt deficit.",
    },
    {
      q: "Szoptatás alatt is biztonságosan alkalmazható?",
      a: "Igen! A kalkulátorunk automatikusan hozzáad +250–450 kcal élettani kalóriapótlékot szoptató anyukáknak, így a fogyás kizárólag a zsírraktárakból történik, a tejtermelés és a tápanyagellátás teljes biztonsága mellett.",
    },
    {
      q: "Mi történik a fizetés után? Hogyan kapom meg az anyagokat?",
      a: "A bankkártyás vagy Apple/Google Pay fizetés után azonnal megnyílik a letöltési felület a telefonodon, és a hozzáférést e-mailben is elküldjük. Nincs várakozás vagy szállítási idő.",
    },
  ];

  return (
    <div style={{ fontFamily: "'Work Sans', sans-serif", background: "#FDFBF7", color: "#2D3748" }} className="w-full min-h-screen">
      <style>{`
        ${FONT_IMPORT}
        .font-display { font-family: 'Fraunces', serif; }
        input:focus, select:focus { outline: 2px solid #E07A5F; outline-offset: 2px; }
        .cta-btn {
          background: linear-gradient(180deg, #E68C6F 0%, #E07A5F 100%);
          box-shadow: 0 12px 24px -10px rgba(224,122,95,0.55), inset 0 1px 0 rgba(255,255,255,0.2);
          transition: transform .15s ease;
        }
        .cta-btn:hover { transform: translateY(-2px); }
        .cta-btn:active { transform: translateY(0) scale(0.98); }
        .option-btn { transition: all .15s ease; }
      `}</style>

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg,#FDE8E1 0%, #FDFBF7 70%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-16 pb-14 sm:pt-24 sm:pb-20 text-center flex flex-col items-center gap-6">
          <h1 className="font-display font-medium leading-[1.1] text-3xl sm:text-5xl max-w-3xl" style={{ color: "#2D3748" }}>
            Fogyj le heti 0,5–0,7 kilót úgy, hogy{" "}
            <em style={{ color: "#E07A5F", fontStyle: "italic" }}>ugyanazt eszed</em>, mint a család —
            kalóriamérleg, koplalás és bűntudat nélkül.
          </h1>
          <p className="text-base sm:text-lg max-w-2xl" style={{ color: "#4A5568" }}>
            Tudományos alapú, családbarát rendszer kifejezetten időhiánnyal küzdő nőknek és édesanyáknak.
            Töltsd ki az élettani auditot, és nézd meg a személyre szabott Tenyér-Makró tervedet!
          </p>
          
          <button 
            onClick={() => scrollTo(wizardRef)} 
            className="cta-btn font-display font-semibold text-base sm:text-lg text-white px-8 py-4 rounded-2xl inline-flex items-center justify-center gap-2.5 shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            Kattints ide a teszt kitöltéséhez &amp; kalóriaszámoláshoz <ArrowRight size={20} />
          </button>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-2 text-sm select-none" style={{ color: "#6B5A52" }}>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={16} style={{ color: "#7C9885" }} /> Tudományosan igazolt élettani alapok</span>
            <span className="inline-flex items-center gap-1.5"><Heart size={16} style={{ color: "#7C9885" }} /> 100% Pénzvisszafizetési Garancia</span>
            <span className="inline-flex items-center gap-1.5"><Zap size={16} style={{ color: "#E07A5F" }} /> Külön főzés és koplalás nélkül</span>
          </div>
        </div>
      </section>

      {/* A 3 ALAPPILLÉR — INTERAKTÍV KÁRTYÁK MODAL NYITÁSSAL */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
        <div className="text-center mb-10">
          <SectionEyebrow><Award size={14} /> Miért működik?</SectionEyebrow>
          <h2 className="font-display font-semibold text-2xl sm:text-4xl mt-3">A FitAnya Módszer 3 Alappillére</h2>
          <p className="text-sm sm:text-base mt-2 max-w-xl mx-auto" style={{ color: "#4A5568" }}>
            Nem drasztikus diétákról vagy kimerítő edzésekről szól. Három egyszerű, egymásra épülő szokás. 
            <strong className="text-[#E07A5F] block sm:inline sm:ml-1">Koppints a kártyákra a részletekért!</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLARS_DATA.map((p) => {
            const Icon = p.icon;
            return (
              <div 
                key={p.id}
                onClick={() => setActivePillarModal(p)}
                className="group rounded-3xl overflow-hidden bg-[#FFFDFB] border border-[#F0DCD4] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col hover:-translate-y-1 active:scale-[0.99] select-none"
              >
                <div className="h-52 w-full overflow-hidden relative">
                  <img 
                    src={p.img} 
                    alt={p.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-sm">
                    <Icon size={20} style={{ color: p.iconColor }} />
                  </div>
                  <span className="absolute bottom-3 right-3 text-[11px] font-bold px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[#2D3748] shadow-sm flex items-center gap-1 group-hover:text-[#E07A5F]">
                    Részletek <ChevronRight size={13} />
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: p.iconColor }}>
                      {p.tag}
                    </span>
                    <h3 className="font-display font-semibold text-lg text-[#2D3748] mb-2 group-hover:text-[#E07A5F] transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-sm text-[#4A5568] leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#F0DCD4] text-xs font-semibold text-[#E07A5F] flex items-center gap-1">
                    <span>Hogyan működik a gyakorlatban?</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3 ALAPPILLÉR RÉSZLETES MODAL */}
      {activePillarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-[#FFFDFB] max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-[#F0DCD4] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" 
              onClick={() => setActivePillarModal(null)} 
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Bezárás"
            >
              <X size={20} />
            </button>

            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#FDE8E1] text-[#E07A5F]">
              {activePillarModal.tag}
            </span>
            <h3 className="font-display font-semibold text-xl sm:text-2xl text-[#2D3748] mt-3 mb-2">
              {activePillarModal.modalTitle}
            </h3>
            <p className="text-xs sm:text-sm text-[#6B5A52] mb-5 leading-relaxed">
              A FitAnya Módszerben így építjük be ezt a mindennapjaidba:
            </p>

            <div className="space-y-3 mb-6">
              {activePillarModal.modalPoints.map((pt, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-[#4A5568]">
                  <CheckCircle2 size={18} className="text-[#7C9885] shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#F0DCD4] flex items-center justify-between gap-3">
              <button 
                type="button" 
                onClick={() => setActivePillarModal(null)} 
                className="text-xs font-semibold text-[#8A7268] hover:text-[#2D3748] cursor-pointer"
              >
                Bezárás
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setActivePillarModal(null);
                  scrollTo(wizardRef);
                }} 
                className="cta-btn font-display font-semibold text-xs sm:text-sm text-white px-5 py-2.5 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
              >
                Kitöltöm az auditot <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EGY FŐZÉS - KÉT TÁNYÉR ÖSSZEHASONLÍTÁS */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
        <div className="text-center mb-10">
          <SectionEyebrow><Utensils size={14} /> Nincs dupla munka</SectionEyebrow>
          <h2 className="font-display font-semibold text-2xl sm:text-3xl mt-3">Hogyan néz ki ez a vasárnapi asztalnál?</h2>
          <p className="text-sm sm:text-base mt-2 max-w-xl mx-auto" style={{ color: "#4A5568" }}>
            Nem kell kétfélét főznöd. Ugyanaz a Bolognai vagy Csirkés tészta készül el a fazékban — a tenyér-szabállyal csak a tányérodra szedés aránya változik 20 másodperc alatt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl p-6 sm:p-7 border" style={{ background: "#FFFDFB", borderColor: "#F0DCD4" }}>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-red-100 text-red-800 select-none">
              A Család / Gyerekek tányérja
            </span>
            <h3 className="font-display font-semibold text-lg mt-3 text-[#2D3748]">Klasszikus Bolognai tészta</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#4A5568]">
              <li className="flex items-center gap-2">🍝 <strong>65% Szénhidrát:</strong> Nagy adag fehér tészta</li>
              <li className="flex items-center gap-2">🥩 <strong>25% Fehérje:</strong> Húsos mártás</li>
              <li className="flex items-center gap-2">🧀 <strong>10% Zsír:</strong> Vastag réteg sajt</li>
            </ul>
            <p className="mt-4 text-xs italic text-[#8A7268] bg-[#FDE8E1]/40 p-3 rounded-xl">
              Nagy energiasűrűség, ami a mozgásban lévő családnak ideális, de ülőmunka vagy hétköznapi rutin mellett könnyen raktározódik.
            </p>
          </div>

          <div className="rounded-3xl p-6 sm:p-7 border-2" style={{ background: "#FFF9F5", borderColor: "#E07A5F" }}>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-green-100 text-green-800 select-none">
              A Te tányérod (FitAnya módszer)
            </span>
            <h3 className="font-display font-semibold text-lg mt-3 text-[#2D3748]">Ugyanaz a Bolognai – FitAnya arányban</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#4A5568]">
              <li className="flex items-center gap-2">🖐️ <strong>Tenyérnyi fehérje:</strong> Dupla adag darálthúsos szósz</li>
              <li className="flex items-center gap-2">✊ <strong>Ökölnyi rost:</strong> Rádobott bébispenót vagy reszelt cukkini</li>
              <li className="flex items-center gap-2">🤲 <strong>Maréknyi tészta:</strong> Ízélmény megmarad, kalória felére esik</li>
            </ul>
            <p className="mt-4 text-xs font-semibold text-[#7C9885] bg-[#F0F5F1] p-3 rounded-xl">
              ✅ Eredmény: Ugyanaz az íz, tele vagy 4 órán át, nulla bűntudat és heti 0,6 kg tiszta zsírfogyás.
            </p>
          </div>
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => scrollTo(pricingRef)}
            className="font-display font-semibold text-sm sm:text-base px-8 py-4 rounded-2xl inline-flex items-center justify-center gap-2 border-2 border-[#E07A5F] text-[#E07A5F] bg-white hover:bg-[#FDE8E1] transition-colors cursor-pointer"
          >
            Megnézem a csomagokat és az árakat <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* 6 LÉPÉSES AUDIT WIZARD */}
      <section ref={wizardRef} className="max-w-2xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        {!wizardDone ? (
          <div className="rounded-3xl p-6 sm:p-10" style={{ background: "#FDFBF7", border: "1px solid #F0DCD4", boxShadow: "0 20px 48px -28px rgba(45,55,72,0.25)" }}>
            <p className="text-center text-xs uppercase tracking-wide font-semibold mb-5 select-none" style={{ color: "#B99189" }}>
              Lépés {step + 1} / 6 — {stepLabels[step]}
            </p>
            <WaveConnector steps={stepLabels} activeIndex={step} />

            {/* 1. Alapadatok */}
            {step === 0 && (
              <div className="grid grid-cols-2 gap-4 mt-8">
                <h2 className="col-span-2 font-display font-semibold text-xl mb-1">Személyes adatok és célkitűzés</h2>
                {[
                  { key: "age", label: "Életkor (év)" },
                  { key: "height", label: "Magasság (cm)" },
                  { key: "weight", label: "Jelenlegi testsúly (kg)" },
                  { key: "goalWeight", label: "Célsúly (kg)" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-sm font-medium mb-1 block" style={{ color: "#4A5568" }}>{f.label}</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={form[f.key]}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-sm"
                      style={{ border: "1px solid #F0DCD4", background: "#FFFDFB" }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 2. Élethelyzet */}
            {step === 1 && (
              <div className="mt-8">
                <h2 className="font-display font-semibold text-xl mb-1 flex items-center gap-2">
                  <Baby size={20} style={{ color: "#E07A5F" }} /> Milyen anyai / női életszakaszban vagy most?
                </h2>
                <p className="text-sm mb-4" style={{ color: "#6B5A52" }}>
                  Ez alapján állítjuk be a pontos anyagcsere- és kalóriakorrekciót:
                </p>
                <div className="space-y-3">
                  {[
                    { v: "nem", l: "Nem szoptatok / Nagyobb gyermek(ek) vagy önálló életszakasz (Fókusz: zsírégetés & feszesítés)" },
                    { v: "hozzataplal", l: "Szoptatok hozzátáplálás mellett (+250 kcal/nap védelem)" },
                    { v: "kizarolag", l: "Kizárólagos szoptatás kisbaba mellett (+450 kcal/nap védelem)" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setForm((s) => ({ ...s, nursing: o.v }))}
                      className="option-btn w-full text-left px-5 py-3.5 rounded-xl text-sm font-medium cursor-pointer"
                      style={{
                        border: `1.5px solid ${form.nursing === o.v ? "#E07A5F" : "#F0DCD4"}`,
                        background: form.nursing === o.v ? "#FDE8E1" : "#FFFDFB",
                        color: "#2D3748",
                      }}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Aktivitás */}
            {step === 2 && (
              <div className="mt-8">
                <h2 className="font-display font-semibold text-xl mb-1 flex items-center gap-2">
                  <Activity size={20} style={{ color: "#E07A5F" }} /> Napi mozgás és fizikai aktivitás
                </h2>
                <p className="text-sm mb-4" style={{ color: "#6B5A52" }}>
                  Hogyan telik egy átlagos napod mozgás szempontjából?
                </p>
                <div className="space-y-3">
                  {[
                    { v: "ulo", l: "Ülőmunka / Irodai napok, minimális napi lépésszám" },
                    { v: "seta", l: "Átlagos mozgás (napi séta, bevásárlás, játszótér, házimunka)" },
                    { v: "porgos", l: "Egész napos pörgés és talpalás (munka + család, magas lépésszám)" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setForm((s) => ({ ...s, activity: o.v }))}
                      className="option-btn w-full text-left px-5 py-3.5 rounded-xl text-sm font-medium cursor-pointer"
                      style={{
                        border: `1.5px solid ${form.activity === o.v ? "#E07A5F" : "#F0DCD4"}`,
                        background: form.activity === o.v ? "#FDE8E1" : "#FFFDFB",
                        color: "#2D3748",
                      }}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Alvás & Stressz */}
            {step === 3 && (
              <div className="mt-8">
                <h2 className="font-display font-semibold text-xl mb-1 flex items-center gap-2">
                  <Moon size={20} style={{ color: "#E07A5F" }} /> Alvás &amp; hormonális kimerültség
                </h2>
                <p className="text-sm mb-4" style={{ color: "#6B5A52" }}>
                  Hogyan alakul az éjszakai pihenésed és energiaszinted?
                </p>
                <div className="space-y-3">
                  {[
                    { v: "atalussza", l: "Átaluszom az éjszakát / pihentető alvás (6-8 óra)" },
                    { v: "1-2", l: "Megszakított alvás (1-2 ébredés gyerek, stressz vagy teendők miatt)" },
                    { v: "kronikus", l: "Krónikus kimerültség (rendszertelen, rossz alvás, állandó fáradtság)" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setForm((s) => ({ ...s, sleep: o.v }))}
                      className="option-btn w-full text-left px-5 py-3.5 rounded-xl text-sm font-medium cursor-pointer"
                      style={{
                        border: `1.5px solid ${form.sleep === o.v ? "#E07A5F" : "#F0DCD4"}`,
                        background: form.sleep === o.v ? "#FDE8E1" : "#FFFDFB",
                        color: "#2D3748",
                      }}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Konyha & Szokások */}
            {step === 4 && (
              <div className="mt-8 space-y-6">
                <div className="p-4 rounded-2xl bg-[#FFFDFB] border border-[#F0DCD4]">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                      <Utensils size={18} style={{ color: "#E07A5F" }} /> 1. Kérdés: Kalóriaszivárgás
                    </h2>
                    {form.snacking ? <span className="text-xs font-bold text-[#7C9885] bg-green-50 px-2 py-0.5 rounded-md select-none">Kiválasztva ✓</span> : <span className="text-xs font-semibold text-[#E07A5F] bg-orange-50 px-2 py-0.5 rounded-md select-none">Válassz egyet</span>}
                  </div>
                  <p className="text-xs mb-3 text-[#6B5A52]">
                    Milyen gyakran csúszik be csipegetés, stresszevés vagy a családi maradékok elfogyasztása?
                  </p>
                  <div className="space-y-2">
                    {[
                      { v: "szinte_soha", l: "Szinte soha, tartom a főétkezéseket" },
                      { v: "napi_1_2", l: "Napi 1-2 alkalommal becsúszik a pultról vagy a tányérokról" },
                      { v: "folyamatos", l: "Gyakran csipegetek napközben, és én eszem meg a maradékokat" },
                    ].map((o) => (
                      <button
                        key={o.v}
                        onClick={() => setForm((s) => ({ ...s, snacking: o.v }))}
                        className="option-btn w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                        style={{
                          border: `1.5px solid ${form.snacking === o.v ? "#E07A5F" : "#F0DCD4"}`,
                          background: form.snacking === o.v ? "#FDE8E1" : "#FFFDFB",
                          color: "#2D3748",
                        }}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFFDFB] border border-[#F0DCD4]">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                      <Clock size={18} style={{ color: "#E07A5F" }} /> 2. Kérdés: Konyhai kapacitás
                    </h2>
                    {form.kitchen ? <span className="text-xs font-bold text-[#7C9885] bg-green-50 px-2 py-0.5 rounded-md select-none">Kiválasztva ✓</span> : <span className="text-xs font-semibold text-[#E07A5F] bg-orange-50 px-2 py-0.5 rounded-md select-none">Válassz egyet</span>}
                  </div>
                  <p className="text-xs mb-3 text-[#6B5A52]">Mennyi időd jut a főzésre egy átlagos napon?</p>
                  <div className="space-y-2">
                    {[
                      { v: "15perc", l: "Max. 15-20 perc gyors ételekre" },
                      { v: "csak_csaladnak", l: "Nincs külön időm magamra, csak a családnak főzök" },
                      { v: "hetvegen", l: "Inkább hétvégén szeretek előre dobozolni / előkészülni" },
                    ].map((o) => (
                      <button
                        key={o.v}
                        onClick={() => setForm((s) => ({ ...s, kitchen: o.v }))}
                        className="option-btn w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                        style={{
                          border: `1.5px solid ${form.kitchen === o.v ? "#E07A5F" : "#F0DCD4"}`,
                          background: form.kitchen === o.v ? "#FDE8E1" : "#FFFDFB",
                          color: "#2D3748",
                        }}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. Fő Fókusz */}
            {step === 5 && (
              <div className="mt-8">
                <h2 className="font-display font-semibold text-xl mb-1 flex items-center gap-2">
                  <Target size={20} style={{ color: "#E07A5F" }} /> Mi a legnagyobb személyes kihívásod?
                </h2>
                <p className="text-sm mb-4" style={{ color: "#6B5A52" }}>
                  Ez alapján választjuk ki a számodra legoptimálisabb protokollt:
                </p>
                <div className="space-y-3">
                  {[
                    { v: "nassolas_ido", l: "Nassolási vágy leküzdése, gyors családi receptek és időspórolás" },
                    { v: "bor_puffadas", l: "Puffadásmentesítés, lassuló anyagcsere felpörgetése és bőrfeszesítés" },
                    { v: "torna_has", l: "Hasfal / hasi zsírréteg célzott formálása és 10 perces otthoni torna" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setForm((s) => ({ ...s, focus: o.v }))}
                      className="option-btn w-full text-left px-5 py-3.5 rounded-xl text-sm font-medium cursor-pointer"
                      style={{
                        border: `1.5px solid ${form.focus === o.v ? "#E07A5F" : "#F0DCD4"}`,
                        background: form.focus === o.v ? "#FDE8E1" : "#FFFDFB",
                        color: "#2D3748",
                      }}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="text-sm font-semibold px-4 py-2.5 cursor-pointer"
                style={{ color: step === 0 ? "#D8C6BE" : "#8A7268", visibility: step === 0 ? "hidden" : "visible" }}
              >
                Vissza
              </button>
              <button
                disabled={!canProceed}
                onClick={() => {
                  if (step < 5) setStep((s) => s + 1);
                  else setWizardDone(true);
                }}
                className="cta-btn font-display font-semibold text-sm text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                {step < 5 ? "Tovább" : "Diagnosztika & Terv megtekintése"} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <SectionEyebrow><Flame size={14} /> Személyes Élettani Térkép</SectionEyebrow>
              <h2 className="font-display font-semibold text-2xl sm:text-3xl mt-3">A te profilod:</h2>
              <p className="font-display italic text-xl sm:text-2xl mt-1" style={{ color: "#E07A5F" }}>{results.profile}</p>
            </div>

            {/* FŐ KPI KÁRTYÁK */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <KpiCard
                icon={Flame}
                label="Biztonságos kalóriakereted"
                value={`${results.targetKcal} kcal`}
                sub={results.lactationBonus > 0 ? `+${results.lactationBonus} kcal szoptatási védelemmel` : `TDEE: ${results.tdee} kcal`}
              />
              <KpiCard
                icon={Utensils}
                label="Rejtett kalóriaszivárgás"
                value={`+${results.hiddenSurplus} kcal/nap`}
                sub="a falatozásokból és maradékokból"
                accent="#8A4B4F"
              />
              <KpiCard
                icon={Calendar}
                label="Célsúly elérése"
                value={results.targetDateStr}
                sub={results.weightToLose > 0 ? `${results.weightToLose} kg leadása koplalás nélkül` : "Súlytartás fázis"}
                accent="#7C9885"
              />
            </div>

            {/* SZEMÉLYRE SZABOTT TENYÉR-MAKRÓ ADAGOLÓ */}
            <div className="rounded-3xl p-6 sm:p-8 mb-4 bg-white border border-[#F0DCD4] shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                <h3 className="font-display font-semibold text-lg sm:text-xl text-[#2D3748]">
                  Személyre Szabott Napi Tenyér-Adagod
                </h3>
                <span className="text-[11px] font-semibold text-[#E07A5F] flex items-center gap-1">
                  <Info size={13} /> Koppints a kártyákra a magyarázatért!
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#6B5A52] mb-6">
                Ezekből az arányokból állítsd össze a tányérod a napi étkezések során — konyhamérleg nélkül:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div 
                  onClick={() => setActivePalmDetail((c) => c === "protein" ? null : "protein")}
                  className="p-4 rounded-2xl bg-[#FFF5F2] border cursor-pointer transition-transform active:scale-95 select-none"
                  style={{ borderColor: activePalmDetail === "protein" ? "#E07A5F" : "#F0DCD4" }}
                >
                  <span className="text-2xl">🖐️</span>
                  <p className="font-display font-bold text-lg text-[#2D3748] mt-1">{results.palmProtein} Tenyér</p>
                  <p className="text-xs font-semibold text-[#8A4B4F]">Fehérje (~{results.proteinGrams}g)</p>
                  <p className="text-[11px] text-[#8A7268] mt-1">Hús, hal, tojás, túró</p>
                </div>

                <div 
                  onClick={() => setActivePalmDetail((c) => c === "veg" ? null : "veg")}
                  className="p-4 rounded-2xl bg-[#F0F5F1] border cursor-pointer transition-transform active:scale-95 select-none"
                  style={{ borderColor: activePalmDetail === "veg" ? "#7C9885" : "#D5E5D8" }}
                >
                  <span className="text-2xl">✊</span>
                  <p className="font-display font-bold text-lg text-[#2D3748] mt-1">{results.fistVeg} Ököl</p>
                  <p className="text-xs font-semibold text-[#7C9885]">Rost / Zöldség</p>
                  <p className="text-[11px] text-[#8A7268] mt-1">Saláta, uborka, brokkoli</p>
                </div>

                <div 
                  onClick={() => setActivePalmDetail((c) => c === "carb" ? null : "carb")}
                  className="p-4 rounded-2xl bg-[#FFFDF5] border cursor-pointer transition-transform active:scale-95 select-none"
                  style={{ borderColor: activePalmDetail === "carb" ? "#B08D4F" : "#F2E6C8" }}
                >
                  <span className="text-2xl">🤲</span>
                  <p className="font-display font-bold text-lg text-[#2D3748] mt-1">{results.cuppedCarb} Marék</p>
                  <p className="text-xs font-semibold text-[#B08D4F]">Szénhidrát (~{results.carbGrams}g)</p>
                  <p className="text-[11px] text-[#8A7268] mt-1">Rizs, tészta, burgonya</p>
                </div>

                <div 
                  onClick={() => setActivePalmDetail((c) => c === "fat" ? null : "fat")}
                  className="p-4 rounded-2xl bg-[#FAF6F0] border cursor-pointer transition-transform active:scale-95 select-none"
                  style={{ borderColor: activePalmDetail === "fat" ? "#8A7268" : "#E8DFD8" }}
                >
                  <span className="text-2xl">👍</span>
                  <p className="font-display font-bold text-lg text-[#2D3748] mt-1">{results.thumbFat} Hüvelykujj</p>
                  <p className="text-xs font-semibold text-[#6B5A52]">Egészséges Zsír (~{results.fatGrams}g)</p>
                  <p className="text-[11px] text-[#8A7268] mt-1">Olívaolaj, magvak, sajt</p>
                </div>
              </div>

              {activePalmDetail && (
                <div className="mt-4 p-4 rounded-2xl bg-[#FFF9F5] border border-[#F0DCD4] text-xs leading-relaxed text-[#4A5568] animate-in fade-in duration-200">
                  {activePalmDetail === "protein" && (
                    <p>🖐️ <strong>1 Tenyérnyi fehérje</strong> = kb. egy tenyér nagyságú és vastagságú csirkemell, halfilé, 2 db tojás vagy 150g zsírszegény túró. Cél: az izomzat megtartása és a jóllakottság.</p>
                  )}
                  {activePalmDetail === "veg" && (
                    <p>✊ <strong>1 Ökölnyi rost</strong> = egy zárt ököl méretű nyers vagy párolt zöldség (pl. brokkoli, cukkini, spenót, uborka, paradicsom). Emésztésjavítás és tartós teltségérzet.</p>
                  )}
                  {activePalmDetail === "carb" && (
                    <p>🤲 <strong>1 Maréknyi szénhidrát</strong> = amennyi főtt rizs, burgonya, édesburgonya vagy tészta kényelmesen elfér a markodban. Nincs koplalás, a pontos mérték adja a deficitet.</p>
                  )}
                  {activePalmDetail === "fat" && (
                    <p>👍 <strong>1 Hüvelykujjnyi zsír</strong> = kb. 1 evőkanál olívaolaj salátára, egy kis szelet sajt vagy egy fél marék olajos mag a hormonális egyensúly fenntartásához.</p>
                  )}
                </div>
              )}
            </div>

            {/* HÍD BANNER: SZÁMOKBÓL GYAKORLAT */}
            <div className="rounded-2xl p-5 mb-6 bg-[#FFF9F5] border border-[#F0DCD4] flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#FDE8E1] text-[#E07A5F] mt-0.5">
                <Zap size={20} />
              </div>
              <div>
                <p className="font-display font-semibold text-sm sm:text-base text-[#2D3748]">
                  A számaidat már ismered — de hogyan lesz ebből valódi vacsora?
                </p>
                <p className="text-xs sm:text-sm text-[#4A5568] mt-1 leading-relaxed">
                  Egy dolog ismerni a keretedet, és egy másik dolog a kimerítő hétköznapokban konyhamérleg nélkül, a családnak ugyanabból a fazékból főzni. Ebben segít a FitAnya programcsomag:
                </p>
              </div>
            </div>

            {/* NEKED AJÁNLOTT CSOMAG KIEMELÉS */}
            <div className="rounded-3xl p-6 sm:p-8 mb-6 border-2 bg-gradient-to-br from-[#FFF9F5] to-[#FDE8E1] border-[#E07A5F] relative">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold font-display px-3.5 py-1 rounded-full bg-[#E07A5F] text-white mb-3 select-none">
                <Sparkles size={13} /> Algoritmus által kijelölt csomag
              </span>
              <h3 className="font-display font-semibold text-xl text-[#2D3748] mb-2">
                Miért a <strong className="text-[#E07A5F]">{packages.find(p => p.id === results.recommendedPkg)?.name}</strong> a tökéletes választás számodra?
              </h3>
              <p className="text-sm text-[#4A5568] leading-relaxed mb-5">
                {results.pkgReason}
              </p>
              <button
                onClick={() => {
                  setSelectedPkg(results.recommendedPkg);
                  scrollTo(orderRef);
                }}
                className="cta-btn font-display font-semibold text-sm sm:text-base text-white px-7 py-3.5 rounded-xl inline-flex items-center gap-2 cursor-pointer"
              >
                Megnézem a csomag tartalmát és a recepteket <ArrowRight size={18} />
              </button>
            </div>

            {/* E-MAIL KAPU — FINOMHANGOLT LEAD MAGNET */}
            {!gateSent ? (
              <div className="rounded-2xl p-6 sm:p-8 text-center" style={{ background: "#2D3748" }}>
                <Mail size={28} className="mx-auto mb-3" style={{ color: "#F9D5CE" }} />
                <h3 className="font-display font-semibold text-lg text-white mb-1">
                  Kérem a Heti Mester-Bevásárlólistát &amp; 15 Perces Dobozolási Kisokost PDF-ben!
                </h3>
                <p className="text-sm mb-5" style={{ color: "#D8C6BE" }}>
                  A személyes napi kalóriaterved mellé azonnal elküldjük a Lidl / Aldi / Spar zónatérképet és a 15 perces hétvégi előkészítési útmutatót ingyen az e-mail fiókodba.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    value={gateEmail}
                    onChange={(e) => setGateEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSendGateEmail(); }}
                    placeholder="email@cimed.hu"
                    className="flex-1 rounded-xl px-4 py-3 text-sm"
                  />
                  <button
                    type="button"
                    disabled={isSendingGate || !gateEmail}
                    onClick={handleSendGateEmail}
                    className="cta-btn font-display font-semibold text-sm text-white px-6 py-3 rounded-xl whitespace-nowrap inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingGate ? (
                      <><Loader2 size={16} className="animate-spin" /> Küldés...</>
                    ) : (
                      "Kérem a PDF Anyagokat"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-6 sm:p-8 text-center" style={{ background: "#F0F5F1", border: "1px solid #7C9885" }}>
                <CheckCircle2 size={26} className="mx-auto mb-2" style={{ color: "#7C9885" }} />
                <p className="font-display font-semibold" style={{ color: "#2D3748" }}>
                  Elküldtük a Mester-Bevásárlólistát és a kalóriatervedet!
                </p>
                <p className="text-sm mt-1" style={{ color: "#4A5568" }}>
                  Nézd meg az e-mail fiókodat — a letöltési linket a 15 perces dobozolási útmutatóval már elküldtük.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 1 NAPOS MINTAÉTREND TERVEZŐ */}
      <section ref={mealPlannerRef} className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <div className="text-center mb-4">
          <SectionEyebrow><Utensils size={14} /> Tenyér-szabály a gyakorlatban</SectionEyebrow>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl mt-3">1 Napos Mintaétrend Tervező</h2>
          <p className="mt-3 max-w-xl mx-auto text-sm sm:text-base" style={{ color: "#4A5568" }}>
            Nem szereted az egyik ételt, vagy nincs otthon hozzávaló? Kattints a{" "}
            <span className="font-semibold" style={{ color: "#E07A5F" }}>„Kaja cseréje"</span> gombra, és válassz
            egy azonos makróértékű alternatívát — a napi kereted nem billen ki.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {Object.entries(MEAL_PLAN).map(([key, meal]) => (
            <MealSwapCard
              key={key}
              mealKey={key}
              meal={meal}
              selectedIndex={mealSelection[key]}
              isOpen={openMealDropdown === key}
              onToggleDropdown={toggleMealDropdown}
              onSelect={selectMealOption}
            />
          ))}
        </div>

        <div className="rounded-2xl p-6 sm:p-8 mt-8" style={{ background: "#FDE8E1", border: "1px solid #F0C4B8" }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: "#8A4B4F" }}>Napi összesített bevitel</p>
              <p className="font-display font-semibold text-2xl mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#2D3748" }}>
                {dailyTotals.kcal} kcal
              </p>
              {wizardDone && (
                <p className="text-xs mt-1" style={{ color: "#6B5A52" }}>
                  A te napi kereted: <strong>{results.targetKcal} kcal</strong> —{" "}
                  {dailyTotals.kcal <= results.targetKcal
                    ? "ez a napi menüd szépen belefér!"
                    : `${dailyTotals.kcal - results.targetKcal} kcal-lal a kereted felett — próbálj cserélni egy könnyebb opcióra.`}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <MacroChip icon={Beef} value={dailyTotals.protein} unit="g fehérje" color="#8A4B4F" />
              <MacroChip icon={Wheat} value={dailyTotals.carbs} unit="g szénhidrát" color="#B08D4F" />
              <MacroChip icon={Droplet} value={dailyTotals.fat} unit="g zsír" color="#7C9885" />
            </div>
          </div>
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => scrollTo(pricingRef)}
            className="cta-btn font-display font-semibold text-sm sm:text-base text-white px-8 py-4 rounded-2xl inline-flex items-center justify-center gap-2 shadow-md cursor-pointer hover:scale-105 transition-transform"
          >
            Kérem a teljes 30 receptes heti menüt és a csomagokat <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ÁRAZÁS */}
      <section ref={pricingRef} className="py-16 sm:py-24" style={{ background: "#FDE8E1" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <SectionEyebrow>Csomagok</SectionEyebrow>
            <h2 className="font-display font-semibold text-3xl sm:text-4xl mt-3">Válaszd ki, meddig szeretnél eljutni</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-5 items-start">
            {packages.map((p) => (
              <PricingCard
                key={p.id}
                tier={p}
                selected={selectedPkg}
                isRecommended={wizardDone && results.recommendedPkg === p.id}
                onSelect={(id) => { setSelectedPkg(id); scrollTo(orderRef); }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* KINEK VALÓ ÉS KINEK NEM VALÓ? */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
        <div className="text-center mb-10">
          <SectionEyebrow><Zap size={14} /> Őszinte szűrő</SectionEyebrow>
          <h2 className="font-display font-semibold text-2xl sm:text-3xl mt-3">Neked való a FitAnya Módszer?</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-4 rounded-3xl overflow-hidden shadow-sm border border-[#F0DCD4] min-h-[300px] lg:min-h-full">
            <img 
              src="/anya.jpg" 
              alt="Anyuka hidratáció és egészséges életmód" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="lg:col-span-8 flex flex-col sm:flex-row gap-6">
            <div className="flex-1 rounded-3xl p-6 sm:p-7 bg-green-50/60 border border-green-200 flex flex-col justify-between">
              <div>
                <h3 className="font-display font-semibold text-lg text-green-900 flex items-center gap-2 mb-4">
                  <CheckCheck className="text-green-600 shrink-0" /> IGEN, ha:
                </h3>
                <ul className="space-y-3 text-sm text-green-950">
                  <li className="flex items-start gap-2">✓ Nincs időd grammozni és kalóriát számolni minden falat után</li>
                  <li className="flex items-start gap-2">✓ Nem akarsz 2 külön menüt főzni a családnak és magadnak</li>
                  <li className="flex items-start gap-2">✓ Olyan rendszert keresel, ami alváshiány és stressz mellett is tartható</li>
                  <li className="flex items-start gap-2">✓ Szeretnél újra magabiztosan, feszengés nélkül tükörbe nézni</li>
                </ul>
              </div>
            </div>

            <div className="flex-1 rounded-3xl p-6 sm:p-7 bg-red-50/60 border border-red-200 flex flex-col justify-between">
              <div>
                <h3 className="font-display font-semibold text-lg text-red-900 flex items-center gap-2 mb-4">
                  <XCircle className="text-red-600 shrink-0" /> NEM, ha:
                </h3>
                <ul className="space-y-3 text-sm text-red-950">
                  <li className="flex items-start gap-2">✕ Csodateákat, zsírégető bogyókat vagy 3 napos koplalást keresel</li>
                  <li className="flex items-start gap-2">✕ Napi 2 órát akarsz konditeremben tölteni a család helyett</li>
                  <li className="flex items-start gap-2">✕ Nem vagy hajlandó ránézni a tányérod arányaira az asztalnál</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 LÉPÉSES FOLYAMAT */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
        <div className="text-center mb-10">
          <SectionEyebrow><Clock size={14} /> 0 másodperc várakozás</SectionEyebrow>
          <h2 className="font-display font-semibold text-2xl sm:text-3xl mt-3">Mi történik a megrendelés után?</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-6 rounded-2xl bg-white border border-[#F0DCD4]">
            <div className="w-12 h-12 rounded-full bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center font-bold text-lg mx-auto mb-3">1</div>
            <h4 className="font-semibold text-base text-[#2D3748] mb-1">Biztonságos fizetés</h4>
            <p className="text-xs text-[#6B5A52]">30 másodperc alatt bankkártyával vagy Apple/Google Pay-jel.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-[#F0DCD4]">
            <div className="w-12 h-12 rounded-full bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center font-bold text-lg mx-auto mb-3">2</div>
            <h4 className="font-semibold text-base text-[#2D3748] mb-1">Azonnali letöltés</h4>
            <p className="text-xs text-[#6B5A52]">Azonnal megnyílik a letöltőfelület, nem kell postára vagy jóváhagyásra várnod.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-[#F0DCD4]">
            <div className="w-12 h-12 rounded-full bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center font-bold text-lg mx-auto mb-3">3</div>
            <h4 className="font-semibold text-base text-[#2D3748] mb-1">Azonnal használható</h4>
            <p className="text-xs text-[#6B5A52]">Már a mai vacsoránál vagy a holnapi bevásárlásnál működik a Tenyér-szabály.</p>
          </div>
        </div>
      </section>

      {/* 3 TIPIKUS ÉLETHELYZET */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <div className="text-center mb-12">
          <SectionEyebrow><HelpCircle size={14} /> Valós Hétköznapok</SectionEyebrow>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl mt-3">3 tipikus helyzet, amit azonnal megoldunk</h2>
          <p className="text-sm sm:text-base mt-2 max-w-xl mx-auto" style={{ color: "#4A5568" }}>
            Nem kell megváltoztatnod a családod életét ahhoz, hogy te magad újra energikus és fitt legyél.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
          <div className="rounded-2xl p-6 flex flex-col justify-between" style={{ background: "#FDFBF7", border: "1px solid #F0DCD4" }}>
            <div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-orange-100/70 text-[#E07A5F] text-xl">
                🍝
              </div>
              <h3 className="font-display font-semibold text-lg text-[#2D3748] mb-2">„A család mást enne, mint én”</h3>
              <p className="text-sm text-[#4A5568] leading-relaxed">
                Nincs több kétfelé főzés és duplán mosogatás. Egyetlen fazékban készül el a normális étel, a te tányérodra pedig 20 másodperc alatt a megfelelő arány kerül.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F0DCD4] text-xs font-semibold text-[#E07A5F]">
              ✓ 30 Családi Gyorsrecept az alapcsomagban
            </div>
          </div>

          <div className="rounded-2xl p-6 flex flex-col justify-between" style={{ background: "#FDFBF7", border: "1px solid #F0DCD4" }}>
            <div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-rose-100/70 text-[#8A4B4F] text-xl">
                🌙
              </div>
              <h3 className="font-display font-semibold text-lg text-[#2D3748] mb-2">„Este 9-kor rám tör a nassolási vágy”</h3>
              <p className="text-sm text-[#4A5568] leading-relaxed">
                A tiltás helyett okos cseréket kapsz: a bolti címkeolvasó megmutatja a Lidl/Aldi/Spar polcain azokat a finomságokat, amik nem borítják fel a deficitet.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F0DCD4] text-xs font-semibold text-[#8A4B4F]">
              ✓ Bolti Nassolási Kalauz a Prémium csomagban
            </div>
          </div>

          <div className="rounded-2xl p-6 flex flex-col justify-between" style={{ background: "#FDFBF7", border: "1px solid #F0DCD4" }}>
            <div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-emerald-100/70 text-[#7C9885] text-xl">
                ⚖️
              </div>
              <h3 className="font-display font-semibold text-lg text-[#2D3748] mb-2">„Nincs időm grammozni a mérlegen”</h3>
              <p className="text-sm text-[#4A5568] leading-relaxed">
                A tenyered mérete pontosan arányos a tested tápanyagigényével. Bárhol, vendégségben vagy étteremben is egy pillantás alatt beállítod az adagodat.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F0DCD4] text-xs font-semibold text-[#7C9885]">
              ✓ Tenyér-Makró Útmutató minden csomagban
            </div>
          </div>
        </div>

        {/* 14 NAPOS GARANCIA */}
        <div className="rounded-2xl p-8 sm:p-10 text-center mb-14 select-none" style={{ background: "#FDFBF7", border: "2px solid #7C9885" }}>
          <ShieldCheck size={32} className="mx-auto mb-3" style={{ color: "#7C9885" }} />
          <h3 className="font-display font-semibold text-xl mb-1">14 Napos Kérdés Nélküli Pénzvisszafizetési Garancia</h3>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#4A5568" }}>
            Ha nem válik be, egyetlen e-mailre 100%-ban visszautaljuk a vételárat — nincs kérdőív, nincs vita.
          </p>
        </div>

        {/* GYIK */}
        <div className="max-w-2xl mx-auto">
          <h3 className="font-display font-semibold text-2xl text-center mb-6">Gyakori kérdések</h3>
          {faqs.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} open={faqOpen === i} onToggle={() => setFaqOpen(faqOpen === i ? -1 : i)} />
          ))}
        </div>
      </section>

      {/* RENDELÉS */}
      <section ref={orderRef} className="py-16 sm:py-24" style={{ background: "#2D3748" }}>
        <div className={orderSubmitted ? "max-w-3xl mx-auto px-5 sm:px-8" : "max-w-xl mx-auto px-5 sm:px-8"}>
          {!orderSubmitted && (
            <div className="text-center mb-8">
              <h2 className="font-display font-semibold text-3xl text-white">Foglald le a csomagod</h2>
              <p className="text-sm mt-2" style={{ color: "#D8C6BE" }}>
                Kiválasztott csomag: <span className="font-semibold" style={{ color: "#F9D5CE" }}>{packages.find((p) => p.id === selectedPkg)?.name}</span>
              </p>
            </div>
          )}

          {orderSubmitted ? (
            <OrderSuccessPanel
              orderForm={orderForm}
              selectedPkg={selectedPkg}
              packages={packages}
              downloadedFiles={downloadedFiles}
              onDownload={handleDownload}
              onRestart={handleRestart}
            />
          ) : (
            <div
              className="rounded-3xl p-6 sm:p-9"
              style={{ background: "#FDFBF7" }}
            >
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block" style={{ color: "#4A5568" }}>Teljes név</label>
                  <input value={orderForm.name} onChange={(e) => setOrderForm((s) => ({ ...s, name: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") handleOrderSubmit(); }}
                    className="w-full rounded-xl px-4 py-3 text-sm" style={{ border: "1px solid #F0DCD4" }} placeholder="pl. Kovács Anna" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block" style={{ color: "#4A5568" }}>E-mail cím</label>
                  <input value={orderForm.email} onChange={(e) => setOrderForm((s) => ({ ...s, email: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") handleOrderSubmit(); }}
                    className="w-full rounded-xl px-4 py-3 text-sm" style={{ border: "1px solid #F0DCD4" }} placeholder="pl. anna@gmail.com" />
                </div>
                {orderError && (
                  <p className="text-xs font-medium px-1" style={{ color: "#C8624A" }}>{orderError}</p>
                )}
                <div>
                  <label className="text-sm font-medium mb-1 block" style={{ color: "#4A5568" }}>Csomag</label>
                  <select value={selectedPkg} onChange={(e) => setSelectedPkg(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm cursor-pointer" style={{ border: "1px solid #F0DCD4" }}>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {p.price.toLocaleString("hu-HU")} Ft</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                disabled={isCheckingOut}
                onClick={handleOrderSubmit}
                className="cta-btn w-full font-display font-semibold text-base text-white px-8 py-4 rounded-2xl mt-7 inline-flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {isCheckingOut ? (
                  <><Loader2 size={18} className="animate-spin" /> Átirányítás a fizetéshez...</>
                ) : (
                  <>Biztonságos Fizetés a Stripe-on — {(packages.find((p) => p.id === selectedPkg)?.price ?? 0).toLocaleString("hu-HU")} Ft <ArrowRight size={18} /></>
                )}
              </button>
              <div className="flex items-center justify-center gap-4 mt-4 flex-wrap select-none">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "#8A7268" }}>
                  <CreditCard size={14} style={{ color: "#7C9885" }} /> Kártya
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "#8A7268" }}>
                   Apple Pay
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "#8A7268" }}>
                  <Wallet size={14} style={{ color: "#7C9885" }} /> Google Pay
                </span>
              </div>
              <p className="text-xs text-center mt-3 flex items-center justify-center gap-1.5 select-none" style={{ color: "#8A7268" }}>
                <ShieldCheck size={13} style={{ color: "#7C9885" }} /> Titkosított Stripe fizetés · 14 napos garancia
              </p>
            </div>
          )}
        </div>
      </section>

      {/* LÁBLÉC */}
      <footer className="py-10 px-5 sm:px-8" style={{ background: "#FDFBF7" }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm mb-4" style={{ color: "#8A7268" }}>
            <button 
              type="button" 
              onClick={() => setActiveLegalModal("aszf")} 
              className="hover:underline hover:text-[#E07A5F] transition-colors cursor-pointer"
            >
              ÁSZF
            </button>
            <button 
              type="button" 
              onClick={() => setActiveLegalModal("adatkezeles")} 
              className="hover:underline hover:text-[#E07A5F] transition-colors cursor-pointer"
            >
              Adatkezelési Tájékoztató
            </button>
          </div>
          <p className="text-xs leading-relaxed max-w-2xl mx-auto" style={{ color: "#B0A199" }}>
            A FitAnya Módszer tájékoztató jellegű életmód- és táplálkozási útmutató, nem minősül egyéni orvosi
            diagnózisnak vagy terápiás kezelésnek. Krónikus betegség esetén konzultáljon kezelőorvosával.
          </p>
          <p className="text-xs mt-4" style={{ color: "#C4B5AC" }}>© 2026 FitAnya Módszer</p>
        </div>
      </footer>

      {/* MOBIL LEBEGŐ SÁV (STICKY BOTTOM CTA) */}
      {showStickyBar && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white/95 backdrop-blur-md border-t border-[#F0DCD4] px-5 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom duration-300"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
          <div className="flex flex-col select-none">
            <span className="font-display font-bold text-sm text-[#2D3748]">FitAnya Módszer</span>
            <span className="text-[11px] font-semibold text-[#E07A5F]">4 990 Ft-tól • 14 nap garancia[cite: 1]</span>
          </div>
          <button
            onClick={() => scrollTo(pricingRef)}
            className="cta-btn font-display font-bold text-sm text-white px-5 py-3 rounded-xl inline-flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
          >
            Csomagok <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* JOGI FELUGRÓ ABLAK (MODAL) */}
      {activeLegalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-[#FFFDFB] max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-[#F0DCD4]"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" 
              onClick={() => setActiveLegalModal(null)} 
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Bezárás"
            >
              <X size={22} />
            </button>

            {activeLegalModal === "aszf" ? (
              <div>
                <h3 className="font-display font-semibold text-2xl mb-4 text-[#2D3748]">
                  Általános Szerződési Feltételek (ÁSZF)
                </h3>
                <div className="text-sm text-[#4A5568] space-y-4 leading-relaxed">
                  <div>
                    <h4 className="font-semibold text-[#2D3748] mb-1">1. Szolgáltató adatai</h4>
                    <p>• <strong>Név:</strong> Barna Kolos E.V.</p>
                    <p>• <strong>Székhely:</strong> 1138 Budapest, Párkány utca 22.</p>
                    <p>• <strong>Adószám:</strong> 8492921269</p>
                    <p>• <strong>E-mail:</strong> ugyfelszolgalat@fitanyamodszer.hu</p>
                    <p>• <strong>Tárhely-szolgáltató:</strong> Cloudflare Inc. (101 Townsend St, San Francisco, CA 94107, USA)</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#2D3748] mb-1">2. A termék jellege és árak</h4>
                    <p>A weboldalon megvásárolható termékek nem fizikai adathordozón rögzített digitális adattartalmak (letölthető PDF kézikönyvek, étrend- és receptfüzetek, kalkulátor hozzáférés). A feltüntetett árak forintban (HUF) értendők, bruttó összegek (alanyi adómentesek).</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#2D3748] mb-1">3. Megrendelés, fizetés és kézbesítés</h4>
                    <p>A fizetés a Stripe nemzetközi, titkosított rendszerén keresztül történik (bankkártya, Apple Pay, Google Pay). A sikeres fizetést követően a hozzáférés és a letöltési linkek azonnal megjelennek a felületen, valamint automatikusan kiküldésre kerülnek a megadott e-mail címre. A szerződés elektronikus úton megkötött, magyar nyelvű szerződésnek minősül.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#2D3748] mb-1">4. Elállási jog és 14 napos elégedettségi garancia</h4>
                    <p>• <strong>Jogszabályi háttér:</strong> A 45/2014. (II. 26.) Korm. rendelet 29. § (1) m) pontja alapján a digitális adattartalom letöltésének megkezdésével a vásárló lemond a törvényes elállási jogról.</p>
                    <p>• <strong>100% Pénzvisszafizetési Garancia:</strong> A Szolgáltató önkéntes <strong>14 napos pénzvisszafizetési garanciát</strong> vállal. Ha a vásárló nem elégedett, a vásárlástól számított 14 napon belül a <em>ugyfelszolgalat@fitanyamodszer.hu</em> címre küldött e-mailben kérheti a teljes vételár visszatérítését indoklás nélkül.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#2D3748] mb-1">5. Szerzői jogok és felhasználási feltételek</h4>
                    <p>A letölthető anyagok, receptek, táblázatok és szövegek Barna Kolos szellemi tulajdonát képezik. A megvásárolt anyagok kizárólag személyes használatra jogosítanak fel. Tilos a tartalmak bármilyen formában történő másolása, megosztása, nyilvános közzététele vagy kereskedelmi célú továbbértékesítése.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#2D3748] mb-1">6. Egészségügyi és felelősségkizárási nyilatkozat</h4>
                    <p>A FitAnya Módszer tájékoztató jellegű életmód- és táplálkozási útmutató, nem minősül orvosi diagnózisnak vagy személyre szabott klinikai terápiának. Krónikus betegség, gyógyszeres kezelés vagy speciális élettani állapot esetén a program alkalmazása előtt szakorvosi konzultáció javasolt.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#2D3748] mb-1">7. Panaszkezelés és jogorvoslat</h4>
                    <p>Panasz esetén a vásárló az <em>ugyfelszolgalat@fitanyamodszer.hu</em> címen élhet kifogással. Fogyasztói jogvita esetén a <strong>Budapesti Békéltető Testülethez</strong> (1016 Budapest, Krisztina krt. 99., bekelteto.testulet@bkik.hu) vagy az illetékes Fogyasztóvédelmi Hatósághoz fordulhat.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-display font-semibold text-2xl mb-4 text-[#2D3748]">
                  Adatkezelési Tájékoztató (GDPR)
                </h3>
                <div className="text-sm text-[#4A5568] space-y-4 leading-relaxed">
                  <div>
                    <h4 className="font-semibold text-[#2D3748] mb-1">1. Az Adatkezelő</h4>
                    <p>• <strong>Név:</strong> Barna Kolos</p>
                    <p>• <strong>Cím:</strong> 1138 Budapest, Párkány utca 22.</p>
                    <p>• <strong>Adószám:</strong> 8492921269</p>
                    <p>• <strong>E-mail:</strong> ugyfelszolgalat@fitanyamodszer.hu</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#2D3748] mb-1">2. A kezelt adatok köre és célja</h4>
                    <p>• <strong>Megrendelési adatok (Név, E-mail cím):</strong> A digitális csomag kézbesítéséhez, a kapcsolattartáshoz és a számviteli kötelezettségek (számlakiállítás) teljesítéséhez. Jogalap: a szerződés teljesítése (GDPR 6. cikk (1) b)).</p>
                    <p>• <strong>Audit kérdőív adatai (Életkor, magasság, testsúly, szokások):</strong> Kizárólag a látogató böngészőjében futnak a kalkulációk idejéig, adatbázisban nem kerülnek tartós tárolásra vagy profilalkotási célú felhasználásra.</p>
                    <p>• <strong>Technikai adatok (IP-cím, naplófájlok):</strong> A szerverek biztonsága, stabilitása és DDoS védelme érdekében.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#2D3748] mb-1">3. Adatfeldolgozók</h4>
                    <p>• <strong>Stripe Payments Europe, Ltd. (Írország):</strong> Bankkártyás fizetési tranzakciók lebonyolítása (kártyaadatokhoz a Szolgáltató nem fér hozzá).</p>
                    <p>• <strong>Cloudflare Inc. (USA / EU):</strong> Tárhelyszolgáltatás, webes kiszolgálás és hálózati védelem.</p>
                    <p>• <strong>Google Ireland Ltd. (Írország):</strong> PDF tananyagok biztonságos felhőtárhelye.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#2D3748] mb-1">4. Az érintettek jogai</h4>
                    <p>A felhasználó bármikor jogosult kérelmezni személyes adatainak megtekintését, helyesbítését, törlését vagy kezelésének korlátozását a <em>ugyfelszolgalat@fitanyamodszer.hu</em> címen. Panasztételi jog: Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH — 1055 Budapest, Falk Miksa utca 9-11., www.naih.hu).</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-[#F0DCD4] text-right">
              <button 
                type="button" 
                onClick={() => setActiveLegalModal(null)} 
                className="font-display font-semibold text-sm px-6 py-2.5 rounded-xl text-white cta-btn cursor-pointer"
              >
                Rendben, bezárom
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
