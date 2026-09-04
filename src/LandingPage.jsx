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
  Bookmark,
  Smartphone,
  Gift,
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
  let pkgReason = "A te helyzetedben a legfontosabb a rohanó hétköznapok rendszerezése és a rejtett nassolási szivárgások azonnali megállítása a 4 hetes szokásrendszerrel.";

  if (data.focus === "bor_puffadas" || data.focus === "torna_has") {
    profile = "Regenerációs & Bőrfeszesítő Profil";
    recommendedPkg = "vip";
    pkgReason = "A szöveti regeneráció, a feszesebb hasfal és az SOS puffadásmentesítés miatt a 7 az 1-ben VIP csomag nyújtja a legteljesebb megoldást 3 hónapos app hozzáféréssel.";
  } else if (data.snacking === "folyamatos" || data.kitchen === "15perc") {
    profile = "Időhiányos Gyors-Megoldás Profil";
    recommendedPkg = "premium";
    pkgReason = "A 15 perces receptek, a bolti nassolási kalauz és a 2 hónap Zsebedző app hozzáférés garantálja, hogy dupla főzés nélkül is elérd a célodat.";
  } else if (weightToLose <= 4 && data.sleep === "atalussza") {
    profile = "Könnyed Finomhangoló Profil";
    recommendedPkg = "basic";
    pkgReason = "Mivel kis súlyfeleslegről van szó és stabil az alvásod, az alap tenyér-szabály és az 1 hónapos app támogatás tökéletesen elegendő számodra.";
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

const STRIPE_PAYMENT_LINKS = {
  sulikezdo: "https://buy.stripe.com/7sY00l9SodM381v2zi9ws03",
  basic: "https://buy.stripe.com/7sY00l4y4cHZ3Lf4Hq9ws00",
  premium: "https://buy.stripe.com/4gMcN7aWs9vN0z3c9S9ws01",
  vip: "https://buy.stripe.com/8x2dRb5C86jB95zb5O9ws02",
};

const PACKAGE_CONTENTS = {
  sulikezdo: {
    title: "Sulikezdő Túlélőcsomag (Szeptemberi Különkiadás)",
    items: [
      "2 az 1-ben Uzsidoboz & Anya-Tízórai Rendszer (PDF)",
      "15 Maszatmentes Recept & Bolti Polctérkép (PDF)",
      "Reggeli Kávépuffer & Maradéktakarítás-Stop Kisokos (PDF)",
    ],
  },
  basic: {
    title: "FitAnya Alapprogram",
    items: [
      "FitAnya Alapprogram – 30 Családi Gyorsrecept & Tenyér-szabály (PDF)",
      "Interaktív Tenyér-Makró Útmutató (PDF)",
      "🎁 AJÁNDÉK: 1 hónap FitAnya Zsebedző Prémium App hozzáférés (2 490 Ft értékben)",
    ],
  },
  premium: {
    title: "Prémium Csomag",
    items: [
      "FitAnya Alapprogram – 30 Recept & Tenyér-szabály (PDF)",
      "Bolti Bűntudatmentes Nassolási Kalauz & Címkeolvasó (PDF)",
      "4 Hetes FitAnya Szokásformáló Rendszer (PDF)",
      "Heti Mester-Bevásárlólista & 15 Perces Dobozolási Kisokos (PDF)",
      "🎁 AJÁNDÉK: 2 hónap FitAnya Zsebedző Prémium App hozzáférés (4 980 Ft értékben)",
    ],
  },
  vip: {
    title: "VIP Anya Csomag",
    vip: true,
    items: [
      "FitAnya Alapprogram – 30 Recept & Tenyér-szabály (PDF)",
      "Bolti Bűntudatmentes Nassolási Kalauz & Címkeolvasó (PDF)",
      "4 Hetes FitAnya Szokásformáló Rendszer (PDF)",
      "Heti Mester-Bevásárlólista & 15 Perces Dobozolás (PDF)",
      "„Feszes Pocak & Kerek Fenék” 10 Perces Csendes Torna (PDF)",
      "Kollagén & Bőrfiatalító Hormon-Reset Kisokos (PDF)",
      "48 Órás SOS Puffadásmentesítő & Lapos Has Protokoll (PDF)",
      "🎁 AJÁNDÉK: 3 hónap Teljes VIP Zsebedző App hozzáférés (7 470 Ft értékben)",
    ],
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
    title: "Folyamatos Energia & Kávépuffer",
    desc: "Megszüntetjük a délelőtti vércukor-zuhanást és az éhgyomri kávé okozta remegést. Kiegyensúlyozott energiaszint egész napra, délutáni kómák és esti nasirohamok nélkül.",
    icon: Sun,
    iconColor: "#7C9885",
    img: "/energia.jpg",
    modalTitle: "Folyamatos Energia & Reggeli Kávépuffer",
    modalPoints: [
      "A kávé-sorrend szabály: a reggeli feketét nem üres gyomorra döntjük, hanem előbb hidratálással és fehérjével védjük a gyomorsavat és a vércukrot.",
      "Viszlát esti nasirohamok: ha napközben stabilizáljuk a vércukorszintedet, este 9-kor nem tör rád a hűtőfosztási kényszer.",
      "Természetes energiaszint koffein-túladagolás nélkül: egyenletes fizikai és mentális teherbírás a nap végéig.",
      "Szoptatásbarát és kíméletes a női szervezethez, nem borítja fel az anyagcserét."
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

function PricingCard({ tier, isRecommended, onCheckout, isCheckingOut }) {
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
        Egyszeri fizetés • Nincs rejtett költség
      </p>

      <ul className="mt-5 space-y-3 flex-1">
        {tier.features.map((f, i) => {
          const isGift = f.includes("🎁");
          return (
            <li key={i} className={`flex items-start gap-2 text-sm ${isGift ? "font-semibold text-[#8A4B4F] bg-[#FFF5F2] p-2 rounded-xl border border-[#F0DCD4]" : "text-[#4A5568]"}`}>
              {isGift ? (
                <Gift size={17} className="mt-0.5 shrink-0 text-[#E07A5F]" />
              ) : (
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#7C9885]" />
              )}
              <span>{f}</span>
            </li>
          );
        })}
      </ul>

      <button
        disabled={isCheckingOut}
        onClick={() => onCheckout(tier.id)}
        className="mt-7 w-full font-display font-bold text-sm px-6 py-3.5 rounded-xl inline-flex items-center justify-center gap-2 transition-transform cursor-pointer shadow-md disabled:opacity-60"
        style={{
          background: isRecommended ? "#C8624A" : isFeatured ? "#E07A5F" : hasBadge ? "#8A4B4F" : "#2D3748",
          color: "#FDFBF7",
        }}
      >
        {isCheckingOut ? (
          <><Loader2 size={16} className="animate-spin" /> Átirányítás...</>
        ) : (
          <>Kérem a csomagot <ArrowRight size={16} /></>
        )}
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

function OrderSuccessPanel({ email, selectedPkg, onRestart }) {
  const pkgData = PACKAGE_CONTENTS[selectedPkg] || PACKAGE_CONTENTS.premium;
  const buyerEmail = email || "a megadott e-mail címedre";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div
        className="rounded-3xl p-8 sm:p-10 text-center"
        style={{ background: "linear-gradient(160deg,#FDE8E1,#F9D5CE)" }}
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white shadow-sm">
          <CheckCircle2 size={32} style={{ color: "#7C9885" }} />
        </div>
        <h3 className="font-display font-semibold text-2xl sm:text-3xl mb-2" style={{ color: "#2D3748" }}>
          Sikeres megrendelés! 🎉
        </h3>
        <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "#6B5A52" }}>
          A fizetés sikeresen megtörtént. A(z) <strong style={{ color: "#E07A5F" }}>{pkgData.title}</strong> letöltési linkjeit és az applikáció aktivációs hozzáférését elküldtük az e-mail fiókodba:
        </p>
        <div className="mt-3 inline-block px-4 py-2 rounded-xl bg-white/80 border border-[#F0DCD4] font-semibold text-sm text-[#2D3748]">
          📬 {buyerEmail}
        </div>
      </div>

      <div className="rounded-3xl p-6 sm:p-8 bg-white border border-[#F0DCD4] shadow-sm">
        <h4 className="font-display font-semibold text-base sm:text-lg text-[#2D3748] mb-4 flex items-center gap-2">
          <Sparkles size={18} style={{ color: "#E07A5F" }} /> Mi történik most? (30 másodperces teendő)
        </h4>
        <ol className="space-y-3 text-sm text-[#4A5568]">
          <li className="flex items-start gap-2.5">
            <span className="font-bold text-[#E07A5F]">1.</span>
            <span>Nyisd meg a leveleződet (<strong>{buyerEmail}</strong>).</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-bold text-[#E07A5F]">2.</span>
            <span>Keresd a <em>„FitAnya – A megvásárolt anyagaid”</em> tárgyú levelet. Ha nem látod 2 percen belül, <strong>nézd meg a Promóciók és a Spam mappát is!</strong></span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-bold text-[#E07A5F]">3.</span>
            <span>Kattints a levélben lévő PDF letöltési linkekre, valamint az 1-kattintásos aktiváló linkre, amivel azonnal prémium státuszba lép a Zsebedző applikációd.</span>
          </li>
        </ol>
      </div>

      <div className="rounded-3xl p-6 bg-[#FFFDFB] border border-[#F0DCD4]">
        <p className="text-xs uppercase tracking-wider font-bold mb-3 text-[#8A7268]">
          A megvásárolt csomagod tartalma:
        </p>
        <ul className="space-y-2">
          {pkgData.items.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-[#2D3748]">
              <Check size={16} className="text-[#7C9885] shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl p-5 bg-[#FFFDFB] border border-[#F0DCD4]">
          <ShieldCheck size={20} style={{ color: "#7C9885" }} className="mb-2" />
          <p className="font-display font-semibold text-sm mb-1 text-[#2D3748]">14 napos garancia</p>
          <p className="text-xs text-[#8A7268] leading-relaxed">
            Ha nem válik be, egyetlen e-mailre 100%-ban visszautaljuk a vételárat, kérdés nélkül.
          </p>
        </div>
        <div className="rounded-2xl p-5 bg-[#FFFDFB] border border-[#F0DCD4]">
          <Mail size={20} style={{ color: "#7C9885" }} className="mb-2" />
          <p className="font-display font-semibold text-sm mb-1 text-[#2D3748]">Ügyfélszolgálat</p>
          <p className="text-xs text-[#8A7268] leading-relaxed">
            Kérdésed van? Írj nekünk bátran: <strong>ugyfelszolgalat@fitanyamodszer.hu</strong>
          </p>
        </div>
      </div>

      <div className="text-center pt-2">
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 font-display font-semibold text-sm px-6 py-3 rounded-xl cursor-pointer bg-transparent border border-[#D8C6BE] text-[#8A7268] hover:text-[#2D3748]"
        >
          <Home size={16} /> Vissza a főoldalra
        </button>
      </div>
    </div>
  );
}

export default function LandingPage({ onOpenApp }) {
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
      const done = localStorage.getItem("fa_done") === "true";
      const gatePassed = localStorage.getItem("fa_gate_sent") === "true";
      return done && gatePassed;
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
  const [gateError, setGateError] = useState("");
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisIndex, setAnalysisIndex] = useState(0);
  const [showEmailGate, setShowEmailGate] = useState(false);

  const [selectedPkg, setSelectedPkg] = useState("premium");
  const [faqOpen, setFaqOpen] = useState(0);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const [activeLegalModal, setActiveLegalModal] = useState(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [activePalmDetail, setActivePalmDetail] = useState(null);
  const [activePillarModal, setActivePillarModal] = useState(null);

  const wizardRef = useRef(null);
  const pricingRef = useRef(null);
  const seasonalRef = useRef(null);
  const orderRef = useRef(null);

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    const handlePageShow = () => {
      setIsCheckingOut(false);
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handlePageShow);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("fa_step", String(step));
      localStorage.setItem("fa_done", String(wizardDone));
      localStorage.setItem("fa_form", JSON.stringify(form));
    } catch (e) {}
  }, [step, wizardDone, form]);

  useEffect(() => {
    if (wizardRef.current && step > 0 && !wizardDone) {
      wizardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step]);

  useEffect(() => {
    if (wizardDone && !orderSubmitted) {
      setTimeout(() => {
        wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }, [wizardDone]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success") {
      const pkgParam = params.get("pkg");
      if (pkgParam && PACKAGE_CONTENTS[pkgParam]) {
        setSelectedPkg(pkgParam);
      }

      if (window.fbq) {
        let price = 7990;
        if (pkgParam === "sulikezdo") price = 3490;
        if (pkgParam === "basic") price = 4990;
        if (pkgParam === "vip") price = 12990;
        window.fbq("track", "Purchase", { value: price, currency: "HUF" });
      }

      setOrderSubmitted(true);
    }
  }, []);

  useEffect(() => {
    if (orderSubmitted && orderRef.current) {
      setTimeout(() => {
        orderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }, [orderSubmitted]);

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

      if (checkVisibility(pricingRef) || checkVisibility(seasonalRef) || checkVisibility(orderRef)) {
        hideBar = true;
      }

      if (scrollY > 380 && !hideBar) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [orderSubmitted]);

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

  const handleSingleChoice = (key, value) => {
    setForm((s) => ({ ...s, [key]: value }));
    setTimeout(() => {
      setStep((s) => s + 1);
    }, 220);
  };

  const handleDirectCheckout = (pkgId) => {
    const targetPkg = pkgId || selectedPkg;
    const baseUrl = STRIPE_PAYMENT_LINKS[targetPkg];
    if (baseUrl) {
      setIsCheckingOut(true);
      setSelectedPkg(targetPkg);

      if (window.fbq) {
        let price = 7990;
        if (targetPkg === "sulikezdo") price = 3490;
        if (targetPkg === "basic") price = 4990;
        if (targetPkg === "vip") price = 12990;
        window.fbq("track", "InitiateCheckout", { value: price, currency: "HUF" });
      }

      const rawEmail = (gateEmail || "").trim();
      const checkoutUrl = rawEmail 
        ? `${baseUrl}?prefilled_email=${encodeURIComponent(rawEmail)}` 
        : baseUrl;

      setTimeout(() => {
        setIsCheckingOut(false);
      }, 4000);

      setTimeout(() => {
        window.location.href = checkoutUrl;
      }, 150);
    }
  };

  const handleOpenApp = () => {
    try {
      localStorage.setItem("fa_form", JSON.stringify(form));
      localStorage.setItem("fa_done", "true");
      localStorage.setItem("fa_opened_app", "true");
    } catch (e) {}

    if (typeof onOpenApp === "function") {
      onOpenApp();
    } else if (window.location.pathname !== "/app") {
      window.location.href = "/app";
    } else {
      window.location.search = "?view=app";
    }
  };

  const handleRestart = () => {
    try {
      localStorage.removeItem("fa_step");
      localStorage.removeItem("fa_done");
      localStorage.removeItem("fa_form");
      localStorage.removeItem("fa_email");
      localStorage.removeItem("fa_gate_sent");
    } catch (e) {}

    setOrderSubmitted(false);
    setWizardDone(false);
    setShowEmailGate(false);
    setIsAnalyzing(false);
    setStep(0);
    setGateEmail("");
    setGateSent(false);
    setGateError("");
    setForm({
      age: "", height: "", weight: "", goalWeight: "",
      nursing: "", activity: "", sleep: "", snacking: "", kitchen: "", focus: ""
    });
    window.location.href = "/";
  };

  const stepLabels = [
    "Alapadatok",
    "Élethelyzet",
    "Aktivitás",
    "Alvás & Stressz",
    "Nassolás",
    "Konyhai idő",
    "Fő Fókusz",
  ];

  const canProceed = useMemo(() => {
    if (step === 0) return !!(form.age && form.height && form.weight && form.goalWeight);
    if (step === 1) return !!form.nursing;
    if (step === 2) return !!form.activity;
    if (step === 3) return !!form.sleep;
    if (step === 4) return !!form.snacking;
    if (step === 5) return !!form.kitchen;
    if (step === 6) return !!form.focus;
    return false;
  }, [step, form]);

  const results = useMemo(() => computeAudit(form), [form]);

  useEffect(() => {
    if (wizardDone && results.recommendedPkg) {
      setSelectedPkg(results.recommendedPkg);
    }
  }, [wizardDone, results.recommendedPkg]);

  const handleStartAnalysis = () => {
    if (!form.focus) return;
    setIsAnalyzing(true);
    setAnalysisIndex(0);

    setTimeout(() => setAnalysisIndex(1), 700);
    setTimeout(() => setAnalysisIndex(2), 1400);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowEmailGate(true);
    }, 2100);
  };

  const handleUnlockResults = async () => {
    if (!gateEmail || !gateEmail.includes("@") || !gateEmail.includes(".")) {
      setGateError("Kérjük, valós e-mail címet adj meg a hozzáféréshez!");
      return;
    }
    setGateError("");
    setIsSendingGate(true);

    const cleanEmail = gateEmail.trim();

    try {
      localStorage.setItem("fa_email", cleanEmail);
      localStorage.setItem("fa_gate_sent", "true");
      localStorage.setItem("fa_done", "true");
    } catch (e) {}

    try {
      sendLeadData({
        action: "gate_lead",
        email: cleanEmail,
        ...results,
        ...form,
      });

      if (window.fbq) {
        window.fbq("track", "Lead");
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setIsSendingGate(false);
      setGateSent(true);
      setShowEmailGate(false);
      setWizardDone(true);
      setTimeout(() => {
        wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  };

  const mainPackages = [
    {
      id: "basic",
      name: "Alap Csomag",
      price: 4990,
      features: [
        "FitAnya Alapprogram (30 Családi Gyorsrecept & Tenyér-szabály PDF)",
        "Interaktív Tenyér-Makró Útmutató (PDF)",
        "🎁 AJÁNDÉK: 1 hónap FitAnya Zsebedző Prémium App hozzáférés (2 490 Ft értékben)",
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
        "🎁 AJÁNDÉK: 2 hónap FitAnya Zsebedző Prémium App hozzáférés (4 980 Ft értékben)",
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
        "🎁 AJÁNDÉK: 3 hónap Teljes VIP Zsebedző App hozzáférés (7 470 Ft értékben)",
      ],
    },
  ];

  const allPackages = [
    {
      id: "sulikezdo",
      name: "Sulikezdő Túlélőcsomag (Szeptemberi Limitált Kiadás)",
      price: 3490,
    },
    ...mainPackages,
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
      q: "Hogyan működik az ajándék Zsebedző app hozzáférés?",
      a: "A csomag megvásárlása után az e-mailben kapott linken keresztül a megvásárolt csomagtól függően 1, 2 vagy 3 hónapig ingyenesen és korlátlanul használhatod a digitális zsebedzőt (Claude AI Hűtőmentő, Tányérkövető, Ivás emlékeztető).",
    },
    {
      q: "Mi történik a fizetés után? Hogyan kapom meg az anyagokat?",
      a: "A bankkártyás vagy Apple/Google Pay fizetés után a hozzáférés és a letöltési linkek azonnal kiküldésre kerülnek a megadott e-mail címedre. Nincs várakozás vagy szállítási idő.",
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

      {/* SZEPTEMBERI SÜRGŐSSÉGI TOP BANNER */}
      <aside aria-label="Szezonális értesítés" className="w-full bg-[#E07A5F] text-white px-4 py-2.5 sm:py-3 text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-2 select-none shadow-sm relative z-30">
        <span>🎒 <strong>SZEPTEMBERI LIMITÁLT KIADÁS:</strong> Sulikezdő Uzsidoboz &amp; Anya-Tízórai Rendszer (3 490 Ft) — Csak szeptember 30-ig!</span>
        <button
          onClick={() => scrollTo(seasonalRef)}
          className="underline font-bold hover:text-[#FFFDFB] ml-1 cursor-pointer transition-colors"
        >
          Megnézem →
        </button>
      </aside>

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg,#FDE8E1 0%, #FDFBF7 70%)" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 pb-14 sm:pt-20 sm:pb-20 text-center flex flex-col items-center gap-6">
          <h1 className="font-display font-medium leading-[1.1] text-3xl sm:text-5xl max-w-3xl" style={{ color: "#2D3748" }}>
            Fogyj le heti 0,5–0,7 kilót úgy, hogy{" "}
            <em style={{ color: "#E07A5F", fontStyle: "italic" }}>ugyanazt eszed</em>, mint a család —
            kalóriamérleg, koplalás és bűntudat nélkül.
          </h1>
          <p className="text-base sm:text-lg max-w-2xl" style={{ color: "#4A5568" }}>
            Tudományos alapú, családbarát rendszer kifejezetten időhiánnyal küzdő nőknek és édesanyáknak.
            Töltsd ki az élettani auditot, és aktiváld az ingyenes Zsebedző applikációt!
          </p>
          
          <button 
            onClick={() => scrollTo(wizardRef)} 
            className="cta-btn font-display font-semibold text-base sm:text-lg text-white px-8 py-4 rounded-2xl inline-flex items-center justify-center gap-2.5 shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            Kattints ide a teszt kitöltéséhez &amp; kalóriaszámoláshoz <ArrowRight size={20} />
          </button>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-2 text-sm select-none" style={{ color: "#6B5A52" }}>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={16} style={{ color: "#7C9885" }} /> Tudományosan igazolt élettani alapok</span>
            <span className="inline-flex items-center gap-1.5"><Smartphone size={16} style={{ color: "#7C9885" }} /> Ingyenes PWA Zsebedző App</span>
            <span className="inline-flex items-center gap-1.5"><Zap size={16} style={{ color: "#E07A5F" }} /> Külön főzés és koplalás nélkül</span>
          </div>
        </div>
      </section>

      {/* A 3 ALAPPILLÉR */}
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

      {/* SIKERES RENDELÉS VAGY 7 LÉPÉSES AUDIT WIZARD */}
      <section ref={orderSubmitted ? orderRef : wizardRef} className="max-w-2xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        {orderSubmitted ? (
          <OrderSuccessPanel
            email={gateEmail}
            selectedPkg={selectedPkg}
            onRestart={handleRestart}
          />
        ) : !wizardDone ? (
          <div className="rounded-3xl p-6 sm:p-10" style={{ background: "#FDFBF7", border: "1px solid #F0DCD4", boxShadow: "0 20px 48px -28px rgba(45,55,72,0.25)" }}>
            
            {!isAnalyzing && !showEmailGate && (
              <>
                <p className="text-center text-xs uppercase tracking-wide font-semibold mb-5 select-none" style={{ color: "#B99189" }}>
                  Lépés {step + 1} / 7 — {stepLabels[step]}
                </p>
                <WaveConnector steps={stepLabels} activeIndex={step} />
              </>
            )}

            {/* 1. Alapadatok */}
            {step === 0 && !isAnalyzing && !showEmailGate && (
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
            {step === 1 && !isAnalyzing && !showEmailGate && (
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
                      onClick={() => handleSingleChoice("nursing", o.v)}
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
            {step === 2 && !isAnalyzing && !showEmailGate && (
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
                      onClick={() => handleSingleChoice("activity", o.v)}
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
            {step === 3 && !isAnalyzing && !showEmailGate && (
              <div className="mt-8">
                <h2 className="font-display font-semibold text-xl mb-1 flex items-center gap-2">
                  <Moon size={20} style={{ color: "#E07A5F" }} /> Alvás &amp; kimerültség
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
                      onClick={() => handleSingleChoice("sleep", o.v)}
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

            {/* 5. Nassolás */}
            {step === 4 && !isAnalyzing && !showEmailGate && (
              <div className="mt-8">
                <h2 className="font-display font-semibold text-xl mb-1 flex items-center gap-2">
                  <Utensils size={20} style={{ color: "#E07A5F" }} /> Kalóriaszivárgás &amp; csipegetés
                </h2>
                <p className="text-sm mb-4" style={{ color: "#6B5A52" }}>
                  Milyen gyakran csúszik be csipegetés, stresszevés vagy a családi maradékok megevése?
                </p>
                <div className="space-y-3">
                  {[
                    { v: "szinte_soha", l: "Szinte soha, tartom a főétkezéseket" },
                    { v: "napi_1_2", l: "Napi 1-2 alkalommal becsúszik a pultról vagy a tányérokról" },
                    { v: "folyamatos", l: "Gyakran csipegetek napközben, és én eszem meg a maradékokat" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => handleSingleChoice("snacking", o.v)}
                      className="option-btn w-full text-left px-5 py-3.5 rounded-xl text-sm font-medium cursor-pointer"
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
            )}

            {/* 6. Konyhai idő */}
            {step === 5 && !isAnalyzing && !showEmailGate && (
              <div className="mt-8">
                <h2 className="font-display font-semibold text-xl mb-1 flex items-center gap-2">
                  <Clock size={20} style={{ color: "#E07A5F" }} /> Konyhai idő és kapacitás
                </h2>
                <p className="text-sm mb-4" style={{ color: "#6B5A52" }}>
                  Mennyi időd jut a főzésre egy átlagos napon?
                </p>
                <div className="space-y-3">
                  {[
                    { v: "15perc", l: "Max. 15-20 perc gyors ételekre" },
                    { v: "csak_csaladnak", l: "Nincs külön időm magamra, csak a családnak főzök" },
                    { v: "hetvegen", l: "Inkább hétvégén szeretek előre dobozolni / előkészülni" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => handleSingleChoice("kitchen", o.v)}
                      className="option-btn w-full text-left px-5 py-3.5 rounded-xl text-sm font-medium cursor-pointer"
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
            )}

            {/* 7. Fő Fókusz */}
            {step === 6 && !isAnalyzing && !showEmailGate && (
              <div className="mt-8">
                <h2 className="font-display font-semibold text-xl mb-1 flex items-center gap-2">
                  <Target size={20} style={{ color: "#E07A5F" }} /> Mi a legnagyobb személyes kihívásod?
                </h2>
                <p className="text-sm mb-4" style={{ color: "#6B5A52" }}>
                  Jelöld be az elsődleges fókuszt, majd kattints a diagnosztika véglegesítésére:
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

            {/* ANIMÁLT ELEMZÉS */}
            {isAnalyzing && (
              <div className="py-12 px-4 text-center animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center mx-auto mb-5 animate-pulse">
                  <Flame size={32} />
                </div>
                <h3 className="font-display font-semibold text-xl sm:text-2xl text-[#2D3748] mb-3">
                  Élettani profilod kalkulálása folyamatban...
                </h3>
                <div className="w-full max-w-sm mx-auto h-2 bg-[#F0DCD4] rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-[#E07A5F] transition-all duration-700 ease-out" 
                    style={{ width: `${(analysisIndex + 1) * 33.3}%` }} 
                  />
                </div>
                <p className="text-sm font-medium text-[#8A7268] min-h-[24px]">
                  {analysisIndex === 0 && "Alapanyagcsere (BMR) számolása a Mifflin-St Jeor képlettel..."}
                  {analysisIndex === 1 && "Anyagcsere-korrekció és szoptatási védelem beállítása..."}
                  {analysisIndex === 2 && "Személyre szabott Tenyér-Makró adagok véglegesítése..."}
                </p>
              </div>
            )}

            {/* E-MAIL KAPU */}
            {showEmailGate && (
              <div className="py-6 sm:py-8 px-2 text-center animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#F0F5F1] text-[#7C9885] shadow-sm">
                  <Sparkles size={30} />
                </div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-[#FDE8E1] text-[#E07A5F] mb-3 select-none">
                  Kalkuláció Kész!
                </span>
                <h3 className="font-display font-semibold text-2xl sm:text-3xl text-[#2D3748] mb-2">
                  A személyes terved elkészült! 🎉
                </h3>
                <p className="text-sm text-[#4A5568] max-w-md mx-auto mb-6 leading-relaxed">
                  Add meg az e-mail címed, és <strong>azonnal megnyitjuk a pontos számaidat</strong> a képernyőn (napi kalóriakeret, tenyér-makrók, céldátum), valamint ingyen elküldjük a <strong>Heti Mester-Bevásárlólistát PDF-ben</strong>!
                </p>

                <div className="max-w-md mx-auto space-y-3">
                  <input
                    type="email"
                    value={gateEmail}
                    onChange={(e) => { setGateEmail(e.target.value); setGateError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleUnlockResults(); }}
                    placeholder="hova küldhetjük? (pl. anna@gmail.com)"
                    className="w-full rounded-xl px-4 py-3.5 text-sm bg-white border"
                    style={{ borderColor: gateError ? "#C8624A" : "#F0DCD4" }}
                  />
                  {gateError && (
                    <p className="text-xs text-[#C8624A] font-medium text-left px-1">{gateError}</p>
                  )}
                  <button
                    type="button"
                    disabled={isSendingGate || !gateEmail}
                    onClick={handleUnlockResults}
                    className="cta-btn w-full font-display font-semibold text-base text-white px-7 py-4 rounded-xl inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {isSendingGate ? (
                      <><Loader2 size={18} className="animate-spin" /> Eredmények feloldása...</>
                    ) : (
                      <>Kérem a számaimat és az anyagokat <ArrowRight size={18} /></>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-4 mt-5 text-xs text-[#8A7268] select-none">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck size={14} className="text-[#7C9885]" /> Zéró spam garancia
                  </span>
                  <span>•</span>
                  <span>Azonnali képernyős hozzáférés</span>
                </div>
              </div>
            )}

            {/* LÉPÉSKÖZI NAVIGÁCIÓ */}
            {!isAnalyzing && !showEmailGate && (
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="text-sm font-semibold px-4 py-2.5 cursor-pointer"
                  style={{ color: step === 0 ? "#D8C6BE" : "#8A7268", visibility: step === 0 ? "hidden" : "visible" }}
                >
                  Vissza
                </button>

                {step === 0 && (
                  <button
                    disabled={!canProceed}
                    onClick={() => setStep(1)}
                    className="cta-btn font-display font-semibold text-sm text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                  >
                    Tovább <ChevronRight size={16} />
                  </button>
                )}

                {step === 6 && (
                  <button
                    disabled={!form.focus}
                    onClick={handleStartAnalysis}
                    className="cta-btn font-display font-semibold text-sm text-white px-6 py-3.5 rounded-xl inline-flex items-center gap-2 disabled:opacity-40 cursor-pointer shadow-md"
                  >
                    Diagnosztika &amp; Terv véglegesítése <ChevronRight size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* FELOLDOTT EREDMÉNYEK KÉPERNYŐJE */
          <div>
            <div className="text-center mb-8">
              <SectionEyebrow><Flame size={14} /> Személyes Élettani Térkép</SectionEyebrow>
              <h2 className="font-display font-semibold text-2xl sm:text-3xl mt-3">A te profilod:</h2>
              <p className="font-display italic text-xl sm:text-2xl mt-1" style={{ color: "#E07A5F" }}>{results.profile}</p>
            </div>

            {/* ANTI-BOUNCE BANNER */}
            <div className="rounded-2xl p-4 sm:p-5 mb-6 text-center shadow-xs" style={{ background: "#F0F5F1", border: "1.5px solid #7C9885" }}>
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#2D3748]">
                <CheckCircle2 size={18} style={{ color: "#7C9885" }} />
                <span>A Heti Mester-Bevásárlólistát &amp; Dobozolási Kisokost elküldtük az e-mail címedre!</span>
              </div>
              <p className="text-xs text-[#526356] mt-1">
                📬 Címzett: <strong>{gateEmail}</strong> — <span className="font-semibold text-[#8A4B4F]">Ne lépj ki a leveleződbe</span>, a személyre szabott Zsebedződ azonnal elérhető lentebb!
              </p>
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
            <div className="rounded-3xl p-6 sm:p-8 mb-6 bg-white border border-[#F0DCD4] shadow-sm">
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

            {/* FŐ CTA: AZ ÚJ FITANYA ZSEBEDZŐ APP INGYENES AKTIVÁLÁSA */}
            <div className="rounded-3xl p-6 sm:p-8 mb-6 border-2 bg-gradient-to-br from-[#FFFDFB] via-[#FFF5F2] to-[#FDE8E1] border-[#E07A5F] shadow-lg relative overflow-hidden">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold font-display px-3.5 py-1 rounded-full bg-[#E07A5F] text-white mb-3 select-none">
                <Sparkles size={13} /> Újdonság • Digitális Zsebedző
              </span>
              <h3 className="font-display font-semibold text-xl sm:text-2xl text-[#2D3748] mb-2">
                A tenyér-számaidat betöltöttük az applikációba! 📲
              </h3>
              <p className="text-sm text-[#4A5568] leading-relaxed mb-5">
                Nem kell fejben számolnod: a <strong>FitAnya Zsebedző PWA</strong>-ban 1 koppintással követheted a napi arányokat, a beépített <strong>Claude AI Hűtőmentő</strong> 15 perces vacsorát tervez a maradékaidból, és az ivás emlékeztető segít az energiaszinted megőrzésében.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6 text-xs text-[#2D3748] font-medium select-none">
                <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-[#F0DCD4]">
                  <CheckCircle2 size={16} className="text-[#7C9885] shrink-0" />
                  <span>0 Ft Belépés · Nem kell letölteni</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-[#F0DCD4]">
                  <CheckCircle2 size={16} className="text-[#7C9885] shrink-0" />
                  <span>AI Hűtőmentő Receptgenerátor</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-[#F0DCD4]">
                  <CheckCircle2 size={16} className="text-[#7C9885] shrink-0" />
                  <span>Személyre szabott tányérkövető</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenApp}
                className="cta-btn w-full font-display font-bold text-base text-white px-7 py-4 rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99] transition-transform"
              >
                <span>Megnyitom a FitAnya Zsebedzőt (Kipróbálom 0 Ft-ért)</span>
                <ArrowRight size={18} />
              </button>

              <p className="text-[11px] text-center text-[#8A7268] mt-3">
                Közvetlenül a böngésződben fut · Egyetlen gombbal a kezdőképernyőre tehető
              </p>
            </div>

            {/* MÁSODLAGOS AJÁNLÓ: NYOMTATHATÓ KÉZIKÖNYVEK ÉS RECEPTEK */}
            <div className="rounded-3xl p-6 sm:p-7 mb-6 border bg-[#FFFDFB] border-[#F0DCD4]">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <h4 className="font-display font-semibold text-lg text-[#2D3748]">
                  Szeretnéd a nyomtatható családi recepteket &amp; kisokosokat is?
                </h4>
                <span className="text-xs font-bold text-[#E07A5F]">PDF Csomagok + Ajándék App</span>
              </div>
              <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed mb-4">
                Ha szereted a hűtőre kitett heti menütervezőket, a bolti polctérképet és a kész családi receptfüzetet, válaszd ki a csomagodat, és az átfogó PDF kézikönyvek mellé <strong>1–3 hónap Prémium Zsebedző hozzáférést adunk ajándékba</strong>!
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#F0DCD4]">
                <span className="text-xs text-[#6B5A52]">
                  Neked ajánlott: <strong>{mainPackages.find(p => p.id === results.recommendedPkg)?.name}</strong> ({mainPackages.find(p => p.id === results.recommendedPkg)?.price.toLocaleString("hu-HU")} Ft)
                </span>
                <button
                  onClick={() => scrollTo(pricingRef)}
                  className="w-full sm:w-auto text-xs font-bold px-4 py-2.5 rounded-xl border border-[#E07A5F] text-[#E07A5F] hover:bg-[#FDE8E1] transition-colors cursor-pointer inline-flex items-center justify-center gap-1 shrink-0"
                >
                  Csomagok &amp; Sulikezdő akció megtekintése <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ÁRAZÁSI SZEKCIÓ */}
      <section ref={pricingRef} className="py-16 sm:py-24" style={{ background: "#FDE8E1" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          
          {/* SZEPTEMBERI LIMITÁLT DOBOZ */}
          <div 
            ref={seasonalRef}
            className="mb-14 rounded-3xl p-7 sm:p-10 bg-white border-2 border-[#E07A5F] shadow-xl relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold font-display px-3.5 py-1.5 rounded-full bg-[#E07A5F] text-white select-none mb-3">
                  🔥 SZEPTEMBERI LIMITÁLT KIADÁS • CSAK SZEPTEMBER 30-IG
                </span>
                <h3 className="font-display font-semibold text-2xl sm:text-3xl text-[#2D3748]">
                  Sulikezdő Túlélőcsomag
                </h3>
                <p className="text-sm font-semibold text-[#8A4B4F] mt-1 mb-3">
                  2 az 1-ben Uzsidoboz &amp; Anya-Tízórai Rendszer kimerült édesanyáknak
                </p>
                <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed mb-5 max-w-2xl">
                  Nincs szükséged most a teljes vacsoraprogramra, csak a reggeli káoszt, a gyerek maradékának megevését és a pékséges kényszerreggeliket akarod azonnal megállítani?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-[#2D3748]">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#7C9885] shrink-0 mt-0.5" />
                    <span><strong>8 perces szimultán pultlogisztika:</strong> Egy vágódeszkán a gyerek uzsija és az anya-tízórai</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#7C9885] shrink-0 mt-0.5" />
                    <span><strong>15 maszatmentes recept:</strong> Autóban és buszon egy kézzel, nulla morzsával</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#7C9885] shrink-0 mt-0.5" />
                    <span><strong>Lidl / Aldi / Spar SOS polctérkép:</strong> 20g tiszta fehérje 90 másodperc alatt</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[#7C9885] shrink-0 mt-0.5" />
                    <span><strong>Reggeli Kávépuffer &amp; Maradéktakarítás-stop:</strong> Éhgyomri kávécsapda és délelőtti remegés kivédése</span>
                  </div>
                </div>
              </div>

              {/* 1-KATTINTÁSOS STRIPE GOMB A SULIKEZDŐHÖZ */}
              <div className="shrink-0 w-full md:w-auto p-6 rounded-2xl bg-[#FFF9F5] border border-[#F0DCD4] text-center flex flex-col items-center justify-center">
                <span className="text-xs font-semibold text-[#8A7268] uppercase tracking-wider">Szezonális Belépő Ár</span>
                <p className="font-display font-bold text-3xl sm:text-4xl text-[#E07A5F] my-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  3 490 Ft
                </p>
                <p className="text-[11px] text-[#8A7268] mb-4">Egyszeri díj · Azonnali kézbesítés</p>
                
                <button
                  type="button"
                  disabled={isCheckingOut}
                  onClick={() => handleDirectCheckout("sulikezdo")}
                  className="cta-btn w-full font-display font-bold text-sm text-white px-7 py-3.5 rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
                >
                  {isCheckingOut ? (
                    <><Loader2 size={16} className="animate-spin" /> Átirányítás...</>
                  ) : (
                    <>Kérem a Sulikezdő Csomagot <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* TELJES CSOMAGOK LISTÁJA */}
          <div className="text-center mb-14">
            <SectionEyebrow>Komplett Életmód Csomagok</SectionEyebrow>
            <h2 className="font-display font-semibold text-3xl sm:text-4xl mt-3">Válaszd ki, meddig szeretnél eljutni</h2>
            <p className="text-sm sm:text-base text-[#6B5A52] mt-2 max-w-xl mx-auto">
              Minden csomag tartalmazza a nyomtatható útmutatókat és a megfelelő időtartamú <strong>FitAnya Zsebedző Prémium</strong> applikáció hozzáférést!
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-5 items-start">
            {mainPackages.map((p) => (
              <PricingCard
                key={p.id}
                tier={p}
                isRecommended={wizardDone && results.recommendedPkg === p.id}
                onCheckout={handleDirectCheckout}
                isCheckingOut={isCheckingOut}
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
            <h4 className="font-semibold text-base text-[#2D3748] mb-1">Azonnali kézbesítés</h4>
            <p className="text-xs text-[#6B5A52]">A letöltési linkek és az app aktivációs hozzáférés automatikusan megérkezik.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-[#F0DCD4]">
            <div className="w-12 h-12 rounded-full bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center font-bold text-lg mx-auto mb-3">3</div>
            <h4 className="font-semibold text-base text-[#2D3748] mb-1">Azonnal használható</h4>
            <p className="text-xs text-[#6B5A52]">Már a mai vacsoránál vagy a holnapi reggelinél működik a rendszer.</p>
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

      {/* MOBIL LEBEGŐ SÁV */}
      {showStickyBar && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white/95 backdrop-blur-md border-t border-[#F0DCD4] px-5 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom duration-300"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
          <div className="flex flex-col select-none">
            <span className="font-display font-bold text-sm text-[#2D3748]">
              {wizardDone ? "Személyes terved kész!" : "FitAnya Módszer"}
            </span>
            <span className="text-[11px] font-semibold text-[#E07A5F]">
              {wizardDone 
                ? "Digitális Zsebedző applikáció"
                : "3 490 Ft-tól • 14 nap garancia"}
            </span>
          </div>
          <button
            onClick={wizardDone ? handleOpenApp : () => scrollTo(wizardRef)}
            className="cta-btn font-display font-bold text-sm text-white px-5 py-3 rounded-xl inline-flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
          >
            {wizardDone ? (
              <>Belépés az Appba <ArrowRight size={16} /></>
            ) : (
              <>Teszt kitöltése <ArrowRight size={16} /></>
            )}
          </button>
        </div>
      )}

      {/* JOGI FELUGRÓ ABLAK */}
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
                    <p>A fizetés a Stripe nemzetközi, titkosított rendszerén keresztül történik (bankkártya, Apple Pay, Google Pay). A sikeres fizetést követően a hozzáférés és a letöltési linkek automatikusan kiküldésre kerülnek a megadott e-mail címre. A szerződés elektronikus úton megkötött, magyar nyelvű szerződésnek minősül.</p>
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
