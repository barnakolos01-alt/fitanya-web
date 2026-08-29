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
} from "lucide-react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Work+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');`;

const HU_MONTHS = [
  "január", "február", "március", "április", "május", "június",
  "július", "augusztus", "szeptember", "október", "november", "december",
];

function formatHuDate(date) {
  return `${date.getFullYear()}. ${HU_MONTHS[date.getMonth()]} ${date.getDate()}.`;
}

function computeAudit(data) {
  const age = Number(data.age) || 0;
  const height = Number(data.height) || 0;
  const weight = Number(data.weight) || 0;
  const goalWeight = Number(data.goalWeight) || 0;

  const bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  const tdee = bmr * 1.35;
  const targetKcal = tdee - 400;

  const snackMap = { szinte_soha: 0, napi_1_2: 180, folyamatos: 340 };
  const hiddenSurplus = snackMap[data.snacking] ?? 0;

  const weightToLose = Math.max(weight - goalWeight, 0);
  const weeksNeeded = weightToLose > 0 ? weightToLose / 0.6 : 0;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + Math.round(weeksNeeded * 7));

  let profile = "Stabil Energia Profil";
  if (data.sleep === "kronikus" && data.snacking === "folyamatos") {
    profile = "Alváshiányos Stresszevő Profil";
  } else if (data.sleep === "kronikus") {
    profile = "Kimerült, de Tudatos Profil";
  } else if (data.snacking === "folyamatos") {
    profile = "Rohanó Csipegető Profil";
  } else if (data.sleep === "1-2") {
    profile = "Éjszakai Ingadozó Profil";
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetKcal: Math.max(Math.round(targetKcal), 1200),
    hiddenSurplus,
    weeksNeeded: Math.round(weeksNeeded * 10) / 10,
    targetDateStr: weightToLose > 0 ? formatHuDate(targetDate) : "Már a célsúlyodnál jársz — irány a megtartás!",
    profile,
    weightToLose: Math.round(weightToLose * 10) / 10,
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
  basic: "https://buy.stripe.com/test_7sY00l4y4cHZ3Lf4Hq9ws00",
  premium: "https://buy.stripe.com/test_4gMcN7aWs9vN0z3c9S9ws01",
  vip: "https://buy.stripe.com/test_8x2dRb5C86jB95zb5O9ws02",
};

const ALAP_PDF_URL = "https://drive.google.com/uc?export=download&id=1SAR2O6Vk04VmkKXQqjm4FseLX9VC8dha";
const NASSOLASI_KALAUZ_URL = "https://drive.google.com/uc?export=download&id=16_CUo3kIF85x9I3k1_tcSaJdKK2w4vm-";
const SZOKASFORMALO_RENDSZER_URL = "https://drive.google.com/uc?export=download&id=1OFa8hl-F6BjvArgL-2_uRquUMYHpkS_l";
const BEVASARLOLISTA_URL = "https://drive.google.com/uc?export=download&id=1QcZnDd0bC-l59P_T_ni9z0-a3uAN9ULw";
const VIP_EDZESPROGRAM_URL = "https://drive.google.com/uc?export=download&id=1gJu3QrVK6pQTyK6S1i0XpysYLAvXdggf";
const VIP_KOLLAGEN_RESET_URL = "https://drive.google.com/uc?export=download&id=1gVQINVQWpiDorCzLELczbxeQ8TIiHuKb";
const VIP_SOS_PUFFADAS_URL = "https://drive.google.com/uc?export=download&id=1nb639k1yrMf_59XVZoMBSK9OhmdIZMte";
const VIP_TULELOKALAUZ_URL = "https://drive.google.com/uc?export=download&id=1iMpTZOXbQYQ6OxSp9TZCZ9R-gWc5xNjx";

const PACKAGE_DOWNLOADS = {
  basic: {
    files: [
      { title: "FitAnya Alapprogram – 30 Családi Gyorsrecept & Tenyér-szabály (PDF)", meta: "10 oldalas PDF · 4,2 MB", downloadUrl: ALAP_PDF_URL },
    ],
    community: false,
    vip: false,
  },
  premium: {
    files: [
      { title: "FitAnya Alapprogram – 30 Recept & Tenyér-szabály (PDF)", meta: "10 oldalas PDF · 4,2 MB", downloadUrl: ALAP_PDF_URL },
      { title: "Bolti Bűntudatmentes Nassolási Kalauz & Címkeolvasó (PDF)", meta: "PDF · 2,1 MB", downloadUrl: NASSOLASI_KALAUZ_URL },
      { title: "4 Hetes FitAnya Szokásformáló Rendszer (PDF)", meta: "PDF · 3,0 MB", downloadUrl: SZOKASFORMALO_RENDSZER_URL },
      { title: "Heti Mester-Bevásárlólista & 15 Perces Dobozolás (PDF)", meta: "PDF · 2,6 MB", downloadUrl: BEVASARLOLISTA_URL },
    ],
    community: true,
    vip: false,
  },
  vip: {
    files: [
      { title: "FitAnya Alapprogram – 30 Recept & Tenyér-szabály (PDF)", meta: "10 oldalas PDF · 4,2 MB", downloadUrl: ALAP_PDF_URL },
      { title: "Bolti Bűntudatmentes Nassolási Kalauz & Címkeolvasó (PDF)", meta: "PDF · 2,1 MB", downloadUrl: NASSOLASI_KALAUZ_URL },
      { title: "4 Hetes FitAnya Szokásformáló Rendszer (PDF)", meta: "PDF · 3,0 MB", downloadUrl: SZOKASFORMALO_RENDSZER_URL },
      { title: "Heti Mester-Bevásárlólista & 15 Perces Dobozolás (PDF)", meta: "PDF · 2,6 MB", downloadUrl: BEVASARLOLISTA_URL },
      { title: "„Feszes Pocak & Kerek Fenék” 10 Perces Csendes Torna (PDF)", meta: "PDF · 2,8 MB", downloadUrl: VIP_EDZESPROGRAM_URL },
      { title: "Kollagén & Bőrfiatalító Hormon-Reset Kisokos (PDF)", meta: "PDF · 2,3 MB", downloadUrl: VIP_KOLLAGEN_RESET_URL },
      { title: "48 Órás SOS Puffadásmentesítő & Lapos Has Protokoll (PDF)", meta: "PDF · 2,4 MB", downloadUrl: VIP_SOS_PUFFADAS_URL },
      { title: "Gyorséttermi, Rendelős & Nyaralási Túlélőkalauz (PDF)", meta: "PDF · 2,0 MB", downloadUrl: VIP_TULELOKALAUZ_URL },
    ],
    community: true,
    vip: true,
  },
};

function SectionEyebrow({ children }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full"
      style={{ background: "#F9D5CE", color: "#8A4B4F" }}
    >
      {children}
    </span>
  );
}

function WaveConnector({ steps, activeIndex }) {
  return (
    <div className="relative flex items-center justify-between w-full max-w-md mx-auto mb-2">
      <svg
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full"
        height="20"
        viewBox="0 0 400 20"
        preserveAspectRatio="none"
      >
        <path
          d="M0 10 Q 50 0, 100 10 T 200 10 T 300 10 T 400 10"
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
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-display"
            style={{
              background: i <= activeIndex ? "#E07A5F" : "#FDFBF7",
              color: i <= activeIndex ? "#FDFBF7" : "#B99189",
              border: `2px solid ${i <= activeIndex ? "#E07A5F" : "#F0C4B8"}`,
            }}
          >
            {i < activeIndex ? <Check size={14} /> : i + 1}
          </div>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent = "#E07A5F" }) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-2"
      style={{ background: "#FDFBF7", border: "1px solid #F0DCD4" }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}1A` }}>
        <Icon size={20} style={{ color: accent }} />
      </div>
      <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: "#8A7268" }}>{label}</p>
      <p className="font-display font-semibold text-3xl" style={{ color: "#2D3748", fontFamily: "'Space Grotesk', sans-serif" }}>
        {value}
      </p>
      {sub && <p className="text-xs" style={{ color: "#8A7268" }}>{sub}</p>}
    </div>
  );
}

function PricingCard({ tier, selected, onSelect }) {
  const isFeatured = tier.featured;
  const hasBadge = !!tier.badge;
  return (
    <div
      className={`relative rounded-3xl p-7 sm:p-8 flex flex-col ${isFeatured ? "sm:-translate-y-3" : ""}`}
      style={{
        background: isFeatured ? "linear-gradient(180deg,#FFF9F5,#FDE8E1)" : "#FDFBF7",
        border: isFeatured ? "2px solid #E07A5F" : hasBadge ? "1.5px solid #8A4B4F" : "1px solid #F0DCD4",
        boxShadow: isFeatured
          ? "0 24px 48px -20px rgba(224,122,95,0.45)"
          : hasBadge
          ? "0 16px 34px -20px rgba(138,75,79,0.35)"
          : "0 10px 24px -16px rgba(45,55,72,0.15)",
      }}
    >
      {isFeatured && (
        <span
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold font-display px-4 py-1.5 rounded-full whitespace-nowrap"
          style={{ background: "#E07A5F", color: "#FFF9F5" }}
        >
          Legnépszerűbb választás
        </span>
      )}
      {!isFeatured && hasBadge && (
        <span
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold font-display px-4 py-1.5 rounded-full whitespace-nowrap"
          style={{ background: "#8A4B4F", color: "#FDFBF7" }}
        >
          {tier.badge}
        </span>
      )}
      <h3 className="font-display font-semibold text-xl mt-2" style={{ color: "#2D3748" }}>{tier.name}</h3>
      <p className="font-display font-bold text-3xl mt-2" style={{ color: "#E07A5F", fontFamily: "'Space Grotesk', sans-serif" }}>
        {tier.price.toLocaleString("hu-HU")} Ft
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
        className="mt-7 w-full font-display font-bold text-sm px-6 py-3.5 rounded-xl inline-flex items-center justify-center gap-2 transition-transform"
        style={{
          background: isFeatured ? "#E07A5F" : hasBadge ? "#8A4B4F" : "#2D3748",
          color: "#FDFBF7",
        }}
      >
        {selected === tier.id ? "Kiválasztva" : "Kiválasztom"} <ArrowRight size={16} />
      </button>
    </div>
  );
}

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="border-b" style={{ borderColor: "#F0DCD4" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left py-5 gap-4"
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

function TestimonialCard({ name, role, text }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: "#FDFBF7", border: "1px solid #F0DCD4" }}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-display font-semibold"
          style={{ background: "#F9D5CE", color: "#8A4B4F" }}
        >
          {name.split(" ").map((n) => n[0]).join("")}
        </div>
        <div>
          <p className="font-display font-semibold text-sm" style={{ color: "#2D3748" }}>{name}</p>
          <p className="text-xs" style={{ color: "#8A7268" }}>{role}</p>
        </div>
      </div>
      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={15} fill="#E07A5F" color="#E07A5F" />
        ))}
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "#4A5568" }}>„{text}"</p>
    </div>
  );
}

function MacroChip({ icon: Icon, value, unit, color }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: `${color}17`, color }}>
      <Icon size={11} /> {value}{unit}
    </span>
  );
}

function MealSwapCard({ mealKey, meal, selectedIndex, isOpen, onToggleDropdown, onSelect }) {
  const current = meal.options[selectedIndex];
  const Icon = meal.icon;

  return (
    <div className="relative rounded-2xl p-5 sm:p-6 flex flex-col" style={{ background: "#FDFBF7", border: "1px solid #F0DCD4" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#B99189" }}>
          <Icon size={14} /> {meal.label} · {meal.time}
        </span>
      </div>

      <p className="font-display font-semibold text-base leading-snug mb-4 min-h-[48px]" style={{ color: "#2D3748" }}>
        {current.name}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-5">
        <MacroChip icon={Flame} value={current.kcal} unit=" kcal" color="#E07A5F" />
        <MacroChip icon={Beef} value={current.protein} unit="g" color="#8A4B4F" />
        <MacroChip icon={Wheat} value={current.carbs} unit="g" color="#B08D4F" />
        <MacroChip icon={Droplet} value={current.fat} unit="g" color="#7C9885" />
      </div>

      <button
        onClick={() => onToggleDropdown(mealKey)}
        className="mt-auto w-full inline-flex items-center justify-center gap-2 text-sm font-display font-semibold px-4 py-2.5 rounded-xl"
        style={{ border: "1.5px solid #E07A5F", color: "#E07A5F", background: isOpen ? "#FDE8E1" : "transparent" }}
      >
        <RefreshCw size={15} /> Kaja cseréje
      </button>

      {isOpen && (
        <div
          className="absolute left-3 right-3 top-full mt-2 rounded-2xl p-2 z-20"
          style={{ background: "#FFFDFB", border: "1px solid #F0DCD4", boxShadow: "0 18px 40px -16px rgba(45,55,72,0.35)" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide px-2 pt-1.5 pb-2" style={{ color: "#B99189" }}>
            Azonos makróértékű alternatívák
          </p>
          {meal.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onSelect(mealKey, i)}
              className="w-full text-left px-2.5 py-2.5 rounded-xl flex items-center justify-between gap-3"
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

      {downloads.community && (
        <button
          className="w-full inline-flex items-center justify-center gap-2 font-display font-semibold text-sm px-6 py-3.5 rounded-xl"
          style={{ background: "#FFFDFB", border: "1.5px solid #E07A5F", color: "#E07A5F" }}
        >
          <Users size={17} /> Belépés a Zárt Anyuka Közösségbe <ExternalLink size={14} />
        </button>
      )}

      <div className="rounded-2xl p-5 sm:p-6 flex items-start gap-3" style={{ background: "#FFFDFB" }}>
        <Mail size={18} className="mt-0.5 shrink-0" style={{ color: "#E07A5F" }} />
        <p className="text-sm" style={{ color: "#4A5568" }}>
          A hozzáférést és a számlát elküldtük az alábbi e-mail címre is:{" "}
          <strong style={{ color: "#2D3748" }}>{orderForm.email || "a megadott e-mail címre"}</strong>
        </p>
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
          className="inline-flex items-center gap-2 font-display font-semibold text-sm px-6 py-3 rounded-xl"
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
  const [step, setStep] = useState(0);
  const [wizardDone, setWizardDone] = useState(false);
  const [form, setForm] = useState({
    age: "", height: "", weight: "", goalWeight: "",
    sleep: "", snacking: "", kitchen: ""
  });
  const [gateEmail, setGateEmail] = useState("");
  const [gateSent, setGateSent] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState("premium");
  const [faqOpen, setFaqOpen] = useState(0);

  const [orderForm, setOrderForm] = useState({ name: "", email: "" });
  const [orderError, setOrderError] = useState("");
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState({});

  // Legal Modal State
  const [activeLegalModal, setActiveLegalModal] = useState(null);

  const handleDownload = (key) => setDownloadedFiles((s) => ({ ...s, [key]: true }));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success") {
      const pkgParam = params.get("pkg");
      if (pkgParam && PACKAGE_DOWNLOADS[pkgParam]) {
        setSelectedPkg(pkgParam);
      }
      setOrderSubmitted(true);
    }
  }, []);

  const handleStripeCheckout = () => {
    const targetUrl = STRIPE_PAYMENT_LINKS[selectedPkg];
    if (targetUrl) {
      window.location.href = targetUrl;
    }
  };

  const handleOrderSubmit = () => {
    if (!orderForm.name.trim() || !orderForm.email.trim()) {
      setOrderError("Kérjük, add meg a neved és az e-mail címed a folytatáshoz!");
      return;
    }
    setOrderError("");
    handleStripeCheckout();
  };

  const handleRestart = () => {
    setOrderSubmitted(false);
    setOrderError("");
    setWizardDone(false);
    setStep(0);
    setForm({ age: "", height: "", weight: "", goalWeight: "", sleep: "", snacking: "", kitchen: "" });
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

  const stepLabels = ["Biometria", "Alvás", "Kalóriaszivárgás", "Konyha"];

  const canProceed = useMemo(() => {
    if (step === 0) return form.age && form.height && form.weight && form.goalWeight;
    if (step === 1) return !!form.sleep;
    if (step === 2) return !!form.snacking;
    if (step === 3) return !!form.kitchen;
    return false;
  }, [step, form]);

  const results = useMemo(() => computeAudit(form), [form]);

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
        "Gyorséttermi, Rendelős & Nyaralási Túlélőkalauz (PDF)",
      ],
    },
  ];

  const faqs = [
    {
      q: "Kell külön főznöm a családnak és a gyerekeknek?",
      a: "Nem. A FitAnya Módszer arra épül, hogy ugyanazt az ételt eszed, mint a család — a tenyér-szabállyal csak a te adagodat igazítjuk hozzá a céljaidhoz, nem kell két menüt főzni.",
    },
    {
      q: "Muszáj grammra pontosan mérnem a kalóriákat a konyhamérlegen?",
      a: "Nem, ez a lényeg: a tenyér-szabály vizuális becslést ad (tenyérnyi fehérje, ökölnyi zöldség, maréknyi szénhidrát), így mérleg és appban vezetett napló nélkül is tartható a keret.",
    },
    {
      q: "Szoptatás alatt is alkalmazható a módszer?",
      a: "A rendszer alapelvei — mérsékelt, nem koplaltató kalóriakeret és családbarát ételek — szoptatás alatt is követhetők, de a pontos kalóriaigényt ilyenkor mindig egyeztesd kezelőorvosoddal vagy dietetikusoddal.",
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
          <SectionEyebrow><Sparkles size={14} /> FitAnya Módszer</SectionEyebrow>
          <h1 className="font-display font-medium leading-[1.1] text-3xl sm:text-5xl max-w-3xl" style={{ color: "#2D3748" }}>
            Fogyj le heti 0,5–0,7 kilót úgy, hogy{" "}
            <em style={{ color: "#E07A5F", fontStyle: "italic" }}>ugyanazt eszed</em>, mint a család —
            kalóriamérleg, koplalás és bűntudat nélkül.
          </h1>
          <p className="text-base sm:text-lg max-w-2xl" style={{ color: "#4A5568" }}>
            Tudományos alapú, családbarát rendszer kifejezetten időhiánnyal küzdő édesanyáknak.
            Töltsd ki a 2 perces életmód-auditot, és nézd meg a személyre szabott tervedet!
          </p>
          <button onClick={() => scrollTo(wizardRef)} className="cta-btn font-display font-semibold text-base sm:text-lg text-white px-7 py-4 rounded-2xl inline-flex items-center gap-2">
            Ingyenes Személyes Anyuka-Audit Kitöltése <ArrowRight size={20} />
          </button>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-2 text-sm" style={{ color: "#6B5A52" }}>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={16} style={{ color: "#7C9885" }} /> Tudományosan igazolt élettani alapok</span>
            <span className="inline-flex items-center gap-1.5"><Heart size={16} style={{ color: "#7C9885" }} /> 100% Pénzvisszafizetési Garancia</span>
            <span className="inline-flex items-center gap-1.5"><Star size={16} style={{ color: "#7C9885" }} /> Több mint 2 400 elégedett édesanya</span>
          </div>
        </div>
      </section>

      {/* AUDIT WIZARD */}
      <section ref={wizardRef} className="max-w-2xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        {!wizardDone ? (
          <div className="rounded-3xl p-6 sm:p-10" style={{ background: "#FDFBF7", border: "1px solid #F0DCD4", boxShadow: "0 20px 48px -28px rgba(45,55,72,0.25)" }}>
            <p className="text-center text-xs uppercase tracking-wide font-semibold mb-5" style={{ color: "#B99189" }}>
              Lépés {step + 1} / 4 — {stepLabels[step]}
            </p>
            <WaveConnector steps={stepLabels} activeIndex={step} />

            {step === 0 && (
              <div className="grid grid-cols-2 gap-4 mt-8">
                <h2 className="col-span-2 font-display font-semibold text-xl mb-1">Biometria és célok</h2>
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
                      value={form[f.key]}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-sm"
                      style={{ border: "1px solid #F0DCD4", background: "#FFFDFB" }}
                    />
                  </div>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="mt-8">
                <h2 className="font-display font-semibold text-xl mb-1 flex items-center gap-2"><Moon size={20} style={{ color: "#E07A5F" }} /> Alvás &amp; hormonális terhelés</h2>
                <p className="text-sm mb-4" style={{ color: "#6B5A52" }}>Hogyan alakul az alvásod az éjszaka folyamán?</p>
                <div className="space-y-3">
                  {[
                    { v: "atalussza", l: "Átalussza az éjszakát" },
                    { v: "1-2", l: "1-2 ébredés" },
                    { v: "kronikus", l: "Krónikus alváshiány (3+ ébredés a gyerekhez)" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setForm((s) => ({ ...s, sleep: o.v }))}
                      className="option-btn w-full text-left px-5 py-3.5 rounded-xl text-sm font-medium"
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

            {step === 2 && (
              <div className="mt-8">
                <h2 className="font-display font-semibold text-xl mb-1 flex items-center gap-2"><Utensils size={20} style={{ color: "#E07A5F" }} /> A "rejtett kalóriaszivárgás"</h2>
                <p className="text-sm mb-4" style={{ color: "#6B5A52" }}>Hányszor eszel a gyerek maradékából vagy csipegetsz a pultról napközben?</p>
                <div className="space-y-3">
                  {[
                    { v: "szinte_soha", l: "Szinte soha" },
                    { v: "napi_1_2", l: "Napi 1-2 alkalom" },
                    { v: "folyamatos", l: "Folyamatosan a maradékot eszem és rohanva csipegetek" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setForm((s) => ({ ...s, snacking: o.v }))}
                      className="option-btn w-full text-left px-5 py-3.5 rounded-xl text-sm font-medium"
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

            {step === 3 && (
              <div className="mt-8">
                <h2 className="font-display font-semibold text-xl mb-1 flex items-center gap-2"><Clock size={20} style={{ color: "#E07A5F" }} /> Konyhai kapacitás</h2>
                <p className="text-sm mb-4" style={{ color: "#6B5A52" }}>Mennyi időd jut a konyhára egy átlagos napon?</p>
                <div className="space-y-3">
                  {[
                    { v: "15perc", l: "Max. 15 perc" },
                    { v: "csak_csaladnak", l: "Nincs időm magamra, csak a családnak főzök" },
                    { v: "hetvegen", l: "Hétvégén tudok előre készülni" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setForm((s) => ({ ...s, kitchen: o.v }))}
                      className="option-btn w-full text-left px-5 py-3.5 rounded-xl text-sm font-medium"
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

            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="text-sm font-semibold px-4 py-2.5"
                style={{ color: step === 0 ? "#D8C6BE" : "#8A7268", visibility: step === 0 ? "hidden" : "visible" }}
              >
                Vissza
              </button>
              <button
                disabled={!canProceed}
                onClick={() => {
                  if (step < 3) setStep((s) => s + 1);
                  else setWizardDone(true);
                }}
                className="cta-btn font-display font-semibold text-sm text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 disabled:opacity-40"
              >
                {step < 3 ? "Tovább" : "Eredmény megtekintése"} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <SectionEyebrow><Flame size={14} /> Az auditod elkészült</SectionEyebrow>
              <h2 className="font-display font-semibold text-2xl sm:text-3xl mt-3">A te profilod:</h2>
              <p className="font-display italic text-xl sm:text-2xl mt-1" style={{ color: "#E07A5F" }}>{results.profile}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <KpiCard icon={Flame} label="Napi biztonságos kalóriakereted" value={`${results.targetKcal} kcal`} sub={`TDEE: ${results.tdee} kcal`} />
              <KpiCard icon={Utensils} label="Rejtett kalóriatöbblet" value={`+${results.hiddenSurplus} kcal/nap`} sub="a csipegetésből" accent="#8A4B4F" />
              <KpiCard icon={Calendar} label="Célsúly elérése" value={results.targetDateStr} sub={results.weightToLose > 0 ? `${results.weightToLose} kg leadása, heti 0,6 kg-os ütemben` : "Tartás fázis"} accent="#7C9885" />
            </div>

            <div className="rounded-2xl p-6 sm:p-8 mb-6" style={{ background: "#FDE8E1", border: "1px solid #F0C4B8" }}>
              <h3 className="font-display font-semibold text-lg mb-1">Kritikus hormonális éhség-zónák</h3>
              <p className="text-sm mb-6" style={{ color: "#6B5A52" }}>
                Nem a gyengeséged szól, ha ilyenkor éhes vagy — ez élettani jelenség, nem bűntudatra való ok.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="rounded-xl p-5" style={{ background: "#FDFBF7" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sun size={18} style={{ color: "#E07A5F" }} />
                    <span className="font-display font-semibold">16:30</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#4A5568" }}>
                    Ilyenkor a délutáni kortizolszint természetes hullámvölgyben van, ami fokozott édesség- és
                    gyorsenergia-vágyat okoz — pont amikor a gyerek uzsonnázik melletted.
                  </p>
                </div>
                <div className="rounded-xl p-5" style={{ background: "#FDFBF7" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Moon size={18} style={{ color: "#E07A5F" }} />
                    <span className="font-display font-semibold">21:15</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#4A5568" }}>
                    A lefekvés előtti órákban a ghrelin nevű éhséghormon szintje megemelkedik a felgyülemlett
                    napi fáradtság hatására — ezért kívánsz ilyenkor nassolnivalót, nem akaraterő kérdése.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 sm:p-8 mb-8" style={{ background: "#FDFBF7", border: "1px solid #F0DCD4" }}>
              <h3 className="font-display font-semibold text-lg mb-4">A tenyér-szabály — mérleg helyett</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: "🖐️", t: "Tenyérnyi fehérje", d: "hús, hal, tojás, túró" },
                  { icon: "✊", t: "Ökölnyi zöldség", d: "bármilyen, szabadon" },
                  { icon: "🤲", t: "Maréknyi szénhidrát", d: "rizs, tészta, kenyér" },
                ].map((r, i) => (
                  <div key={i} className="text-center rounded-xl p-5" style={{ background: "#FDE8E1" }}>
                    <span className="text-3xl">{r.icon}</span>
                    <p className="font-display font-semibold mt-2 text-sm">{r.t}</p>
                    <p className="text-xs mt-1" style={{ color: "#6B5A52" }}>{r.d}</p>
                  </div>
                ))}
              </div>
            </div>

            {!gateSent ? (
              <div className="rounded-2xl p-6 sm:p-8 text-center" style={{ background: "#2D3748" }}>
                <Mail size={28} className="mx-auto mb-3" style={{ color: "#F9D5CE" }} />
                <h3 className="font-display font-semibold text-lg text-white mb-1">Küldd el a 3 oldalas részletes profilomat PDF-ben</h3>
                <p className="text-sm mb-5" style={{ color: "#D8C6BE" }}>és aktiváld a mai kedvezményt a csomagokra!</p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="text"
                    value={gateEmail}
                    onChange={(e) => setGateEmail(e.target.value)}
                    placeholder="email@cimed.hu"
                    className="flex-1 rounded-xl px-4 py-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setGateSent(true)}
                    className="cta-btn font-display font-semibold text-sm text-white px-6 py-3 rounded-xl whitespace-nowrap"
                  >
                    Küldd el a PDF-et
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-6 sm:p-8 text-center" style={{ background: "#F0F5F1", border: "1px solid #7C9885" }}>
                <CheckCircle2 size={26} className="mx-auto mb-2" style={{ color: "#7C9885" }} />
                <p className="font-display font-semibold" style={{ color: "#2D3748" }}>Elküldtük a profilodat és a kedvezményt!</p>
                <p className="text-sm mt-1" style={{ color: "#4A5568" }}>Nézd meg az e-mail fiókodat — köztük a spam mappát is.</p>
              </div>
            )}

            <div className="text-center mt-8">
              <button onClick={() => scrollTo(pricingRef)} className="cta-btn font-display font-semibold text-base text-white px-7 py-4 rounded-2xl inline-flex items-center gap-2">
                Válasszak csomagot <ArrowRight size={18} />
              </button>
            </div>
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
                onSelect={(id) => { setSelectedPkg(id); scrollTo(orderRef); }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* VÉLEMÉNYEK */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <div className="text-center mb-12">
          <SectionEyebrow>Anyukák mondták</SectionEyebrow>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl mt-3">Nem elmélet — valódi eredmények</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
          <TestimonialCard name="Szabó Réka" role="2 gyermekes anyuka, Pécs" text="Először nem hittem, hogy tud működni koplalás nélkül. 9 hét alatt 5 kilót adtam le úgy, hogy közben ugyanazt ettem, mint a család." />
          <TestimonialCard name="Farkas Dóra" role="kismama, Budapest" text="A tenyér-szabály volt a fordulópont — végre nem kellett mérlegelnem semmit, csak ránéztem a tányéromra." />
          <TestimonialCard name="Molnár Eszter" role="háromgyermekes édesanya, Miskolc" text="A 21 órás nassolási hullámot végre megértettem, nem küzdök ellene feleslegesen, hanem beépítettem a napirendbe." />
        </div>

        <div className="rounded-2xl p-8 sm:p-10 text-center mb-14" style={{ background: "#FDFBF7", border: "2px solid #7C9885" }}>
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
                    className="w-full rounded-xl px-4 py-3 text-sm" style={{ border: "1px solid #F0DCD4" }}>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {p.price.toLocaleString("hu-HU")} Ft</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOrderSubmit}
                className="cta-btn w-full font-display font-semibold text-base text-white px-8 py-4 rounded-2xl mt-7 inline-flex items-center justify-center gap-2"
              >
                Biztonságos Fizetés a Stripe-on — {(packages.find((p) => p.id === selectedPkg)?.price ?? 0).toLocaleString("hu-HU")} Ft <ArrowRight size={18} />
              </button>
              <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
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
              <p className="text-xs text-center mt-3 flex items-center justify-center gap-1.5" style={{ color: "#8A7268" }}>
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
              className="hover:underline hover:text-[#E07A5F] transition-colors"
            >
              ÁSZF
            </button>
            <button 
              type="button"
              onClick={() => setActiveLegalModal("adatkezeles")} 
              className="hover:underline hover:text-[#E07A5F] transition-colors"
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
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
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
                    <p>• <strong>Név:</strong> Barna Kolos</p>
                    <p>• <strong>Székhely / Lakcím:</strong> 1138 Budapest, Párkány utca 22.</p>
                    <p>• <strong>Adószám:</strong> 8492921269</p>
                    <p>• <strong>E-mail:</strong> ugyfelszolgalat@fitanyamodszer.hu</p>
                    <p>• <strong>Tárhely-szolgáltató:</strong> Cloudflare Inc. (101 Townsend St, San Francisco, CA 94107, USA)</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#2D3748] mb-1">2. A termék jellege</h4>
                    <p>A FitAnya Módszer weboldalon elérhető termékek nem fizikai adathordozón rögzített digitális adattartalmak (elektronikus úton letölthető PDF formátumú receptfüzetek, szokásformáló útmutatók és interaktív kalkulátor hozzáférés).</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#2D3748] mb-1">3. Megrendelés, fizetés és teljesítés</h4>
                    <p>A termékek vételárának kiegyenlítése a Stripe nemzetközi, SSL-titkosított bankkártyás felületén keresztül történik (Apple Pay és Google Pay támogatással). A sikeres fizetést követően a rendszer azonnal biztosítja a letöltési linkeket és elküldi a hozzáférési adatokat a megadott e-mail címre.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#2D3748] mb-1">4. Elállási jog és 14 napos pénzvisszafizetési garancia</h4>
                    <p>• <strong>Jogszabályi háttér:</strong> A 45/2014. (II. 26.) Korm. rendelet 29. § (1) bekezdés m) pontja alapján a digitális adattartalom letöltésének megkezdésével a fogyasztó elveszíti a törvényes 14 napos elállási jogát.</p>
                    <p>• <strong>Önkéntes elégedettségi garancia:</strong> A Szolgáltató saját döntése alapján <strong>14 napos 100%-os pénzvisszafizetési garanciát</strong> vállal minden megvásárolt csomagra. Ha a Vevő úgy érzi, a program nem nyújtott számára értéket, a vásárlástól számított 14 napon belül elegendő egy e-mailt küldenie a <em>ugyfelszolgalat@fitanyamodszer.hu</em> címre, és a teljes vételár visszatérítésre kerül.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#2D3748] mb-1">5. Egészségügyi és felelősségkizárási nyilatkozat</h4>
                    <p>A FitAnya Módszer anyagai ismeretterjesztő és életmód-támogató célt szolgálnak. Nem minősülnek orvosi diagnózisnak, orvosi terápiának vagy személyre szabott klinikai dietetikai ellátásnak. Krónikus betegség vagy speciális élettani állapot esetén a program megkezdése előtt szakorvosi konzultáció javasolt.</p>
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
                className="font-display font-semibold text-sm px-6 py-2.5 rounded-xl text-white cta-btn"
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
