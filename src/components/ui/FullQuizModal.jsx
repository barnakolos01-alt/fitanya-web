import React, { useState, useMemo } from "react";
import { useFitAnya } from "../../context/FitAnyaContext";
import { serif, sans } from "../../styles/tokens";
import {
  Baby,
  Activity,
  Moon,
  Utensils,
  Clock,
  Target,
  Flame,
  Check,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Mail,
} from "lucide-react";

const HU_MONTHS = [
  "január", "február", "március", "április", "május", "június",
  "július", "augusztus", "szeptember", "október", "november", "december",
];

function formatHuDate(date) {
  return `${date.getFullYear()}. ${HU_MONTHS[date.getMonth()]} ${date.getDate()}.`;
}

// INTELLIGENS ÉLETKOR TISZTÍTÓ (Kezeli, ha valaki születési évet ír be)
function sanitizeAge(rawAge) {
  const num = parseInt(rawAge, 10);
  if (isNaN(num)) return 30;
  
  const currentYear = new Date().getFullYear();
  if (num >= 1920 && num <= currentYear) {
    return currentYear - num; // pl. 2026 - 1973 = 53
  }
  if (num < 16) return 25;
  if (num > 100) return 40;
  return num;
}

function computeAudit(data) {
  const age = sanitizeAge(data.age);
  const height = Number(data.height) || 165;
  const weight = Number(data.weight) || 70;
  const goalWeight = Number(data.goalWeight) || 62;

  const bmr = 10 * weight + 6.25 * height - 5 * age - 161;

  let activityMult = 1.3;
  if (data.activity === "seta") activityMult = 1.4;
  if (data.activity === "porgos") activityMult = 1.5;

  let tdee = bmr * activityMult;

  let lactationBonus = 0;
  if (data.nursing === "kizarolag") lactationBonus = 450;
  if (data.nursing === "hozzataplal") lactationBonus = 250;

  tdee += lactationBonus;

  let targetKcal = tdee - 400;
  if (data.nursing === "kizarolag") {
    targetKcal = Math.max(targetKcal, 1750);
  } else {
    targetKcal = Math.max(targetKcal, 1300);
  }

  const snackMap = { szinte_soha: 0, napi_1_2: 210, folyamatos: 380 };
  const hiddenSurplus = snackMap[data.snacking] ?? 0;

  const weightToLose = Math.max(weight - goalWeight, 0);
  const weeklyRate = data.nursing === "kizarolag" ? 0.45 : 0.6;
  const weeksNeeded = weightToLose > 0 ? weightToLose / weeklyRate : 0;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + Math.round(weeksNeeded * 7));

  const proteinGrams = Math.round(weight * 1.5);
  const fatGrams = Math.round((targetKcal * 0.28) / 9);
  const carbGrams = Math.round((targetKcal - (proteinGrams * 4 + fatGrams * 9)) / 4);

  const palmProtein = Math.max(Math.round(proteinGrams / 30), 2);
  const fistVeg = 3;
  const cuppedCarb = Math.max(Math.round(carbGrams / 40), 2);
  const thumbFat = Math.max(Math.round(fatGrams / 15), 2);

  let profile = "Családi Egyensúly Profil";
  if (data.focus === "bor_puffadas" || data.focus === "torna_has") {
    profile = "Regenerációs & Bőrfeszesítő Profil";
  } else if (data.snacking === "folyamatos" || data.kitchen === "15perc") {
    profile = "Időhiányos Gyors-Megoldás Profil";
  } else if (weightToLose <= 4 && data.sleep === "atalussza") {
    profile = "Könnyed Finomhangoló Profil";
  }

  return {
    age,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetKcal: Math.round(targetKcal),
    hiddenSurplus,
    weeksNeeded: Math.round(weeksNeeded * 10) / 10,
    targetDateStr: weightToLose > 0 ? formatHuDate(targetDate) : "Célsúlyon vagy! 🎉",
    profile,
    weightToLose: Math.round(weightToLose * 10) / 10,
    proteinGrams,
    carbGrams,
    fatGrams,
    palmProtein,
    fistVeg,
    cuppedCarb,
    thumbFat,
    lactationBonus,
  };
}

export default function FullQuizModal({ isOpen, onClose }) {
  const { updateProfile } = useFitAnya();
  const [step, setStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisIndex, setAnalysisIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  // E-mail és küldési állapot
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    age: "",
    height: "",
    weight: "",
    goalWeight: "",
    nursing: "",
    activity: "",
    sleep: "",
    snacking: "",
    kitchen: "",
    focus: "",
  });

  const stepLabels = [
    "Alapadatok",
    "Élethelyzet",
    "Aktivitás",
    "Alvás",
    "Nassolás",
    "Konyha",
    "Fókusz",
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

  const auditResults = useMemo(() => computeAudit(form), [form]);

  if (!isOpen) return null;

  const handleSingleChoice = (key, value) => {
    setForm((s) => ({ ...s, [key]: value }));
    setTimeout(() => {
      setStep((s) => s + 1);
    }, 200);
  };

  const handleStartAnalysis = () => {
    if (!form.focus) return;
    setIsAnalyzing(true);
    setAnalysisIndex(0);

    setTimeout(() => setAnalysisIndex(1), 600);
    setTimeout(() => setAnalysisIndex(2), 1200);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowSummary(true);
    }, 1800);
  };

  // VÉGSŐ BEKÜLDÉS ÉS SHEET SZINKRONIZÁLÁS + META PIXEL KÖVETÉS
  const handleFinalSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      alert("Kérlek, add meg az e-mail címedet, hogy elmenthessük a fiókodat!");
      return;
    }

    setIsSubmitting(true);

    const cleanAge = sanitizeAge(form.age);

    const formDataToSave = {
      ...form,
      age: cleanAge,
      email: cleanEmail,
      weightKg: Number(form.weight) || 70,
      heightCm: Number(form.height) || 165,
      breastfeeding: form.nursing !== "nem",
      goal: form.goalWeight < form.weight ? "fogyas" : "szintentartas",
    };

    // Google Apps Script Payload (tiszta életkorral)
    const payload = {
      email: cleanEmail,
      profile: auditResults.profile,
      targetKcal: auditResults.targetKcal,
      weightToLose: auditResults.weightToLose,
      targetDateStr: auditResults.targetDateStr,
      palmProtein: auditResults.palmProtein,
      fistVeg: auditResults.fistVeg,
      cuppedCarb: auditResults.cuppedCarb,
      thumbFat: auditResults.thumbFat,
      recommendedPkg: "premium",
      age: cleanAge,
      height: form.height,
      weight: form.weight,
      goalWeight: form.goalWeight,
      nursing: form.nursing,
      activity: form.activity,
      sleep: form.sleep,
      snacking: form.snacking,
      kitchen: form.kitchen,
      focus: form.focus,
    };

    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzYnNbGqwXhX5AGhQ-1bwSZhLZM0e1LYMPN84XTFXGgysxuOnVvT-2_HwxY6xZIh1Bi/exec";

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Sheet beküldési hiba:", err);
    }

    if (updateProfile) {
      updateProfile(formDataToSave);
    }

    try {
      localStorage.setItem("fa_form", JSON.stringify(formDataToSave));
      localStorage.setItem("fa_done", "true");
      localStorage.setItem("fa_email", cleanEmail);

      // META PIXEL LEAD (ÉRDEKLŐDŐ) ESEMÉNY ELSÜTÉSE
      if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq("track", "Lead", {
          content_name: auditResults.profile,
          currency: "HUF",
          value: 0,
        });
      }
    } catch (e) {
      console.error("Hiba a mentés vagy a Képpont esemény során:", e);
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-in fade-in">
      <div
        className="bg-[#FDFBF7] max-w-md w-full rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#F0DCD4] max-h-[92vh] overflow-y-auto"
        style={{ fontFamily: sans }}
      >
        {/* FEJLÉC / PROGRESS SÁV */}
        {!isAnalyzing && !showSummary && (
          <div className="mb-4 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E07A5F]">
              Lépés {step + 1} / 7 — {stepLabels[step]}
            </span>
            <div className="w-full bg-[#F0DCD4] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#E07A5F] h-full transition-all duration-300"
                style={{ width: `${((step + 1) / 7) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 1. LÉPÉS: ALAPADATOK */}
        {step === 0 && !isAnalyzing && !showSummary && (
          <div className="space-y-4">
            <h2 style={{ fontFamily: serif }} className="text-xl font-bold text-[#2D3748]">
              Állítsuk be a személyes kereteidet!
            </h2>
            <p className="text-xs text-[#6B5A52]">
              Add meg a kiinduló adataidat a pontos anyagcsere- és tenyér-számításokhoz:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "age", label: "Hány éves vagy?", placeholder: "pl. 34", min: 18, max: 95 },
                { key: "height", label: "Magasság (cm)", placeholder: "pl. 165", min: 120, max: 220 },
                { key: "weight", label: "Testsúly (kg)", placeholder: "pl. 70", min: 40, max: 200 },
                { key: "goalWeight", label: "Célsúly (kg)", placeholder: "pl. 62", min: 40, max: 200 },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-[#4A5568] block mb-1">{f.label}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={f.placeholder}
                    min={f.min}
                    max={f.max}
                    value={form[f.key]}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm bg-white border border-[#F0DCD4] focus:outline-[#E07A5F] placeholder:text-stone-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. LÉPÉS: ÉLETHELYZET */}
        {step === 1 && !isAnalyzing && !showSummary && (
          <div className="space-y-3">
            <h2 style={{ fontFamily: serif }} className="text-xl font-bold text-[#2D3748] flex items-center gap-2">
              <Baby size={20} className="text-[#E07A5F]" /> Anyai életszakasz
            </h2>
            <p className="text-xs text-[#6B5A52]">Szoptatási kalóriapótlék beállítása:</p>
            {[
              { v: "nem", l: "Nem szoptatok / Fókusz: zsírégetés & tónus" },
              { v: "hozzataplal", l: "Szoptatok hozzátáplálás mellett (+250 kcal)" },
              { v: "kizarolag", l: "Kizárólagos szoptatás kisbaba mellett (+450 kcal)" },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => handleSingleChoice("nursing", o.v)}
                className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                  form.nursing === o.v ? "bg-[#FDE8E1] border-[#E07A5F] text-[#2D3748]" : "bg-white border-[#F0DCD4] text-stone-700"
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        )}

        {/* 3. LÉPÉS: AKTIVITÁS */}
        {step === 2 && !isAnalyzing && !showSummary && (
          <div className="space-y-3">
            <h2 style={{ fontFamily: serif }} className="text-xl font-bold text-[#2D3748] flex items-center gap-2">
              <Activity size={20} className="text-[#E07A5F]" /> Napi mozgás
            </h2>
            <p className="text-xs text-[#6B5A52]">Fizikai aktivitási szinted:</p>
            {[
              { v: "ulo", l: "Ülőmunka / Kevesebb napi lépésszám" },
              { v: "seta", l: "Átlagos mozgás (séta, játszótér, házimunka)" },
              { v: "porgos", l: "Egész napos pörgés és talpalás" },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => handleSingleChoice("activity", o.v)}
                className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                  form.activity === o.v ? "bg-[#FDE8E1] border-[#E07A5F] text-[#2D3748]" : "bg-white border-[#F0DCD4] text-stone-700"
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        )}

        {/* 4. LÉPÉS: ALVÁS */}
        {step === 3 && !isAnalyzing && !showSummary && (
          <div className="space-y-3">
            <h2 style={{ fontFamily: serif }} className="text-xl font-bold text-[#2D3748] flex items-center gap-2">
              <Moon size={20} className="text-[#E07A5F]" /> Alvás & regeneráció
            </h2>
            <p className="text-xs text-[#6B5A52]">Éjszakai alvásminőség:</p>
            {[
              { v: "atalussza", l: "Átaluszom az éjszakát (pihentető alvás)" },
              { v: "1-2", l: "Megszakított alvás (1-2 ébredés teendők miatt)" },
              { v: "kronikus", l: "Krónikus kimerültség / rendszertelen alvás" },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => handleSingleChoice("sleep", o.v)}
                className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                  form.sleep === o.v ? "bg-[#FDE8E1] border-[#E07A5F] text-[#2D3748]" : "bg-white border-[#F0DCD4] text-stone-700"
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        )}

        {/* 5. LÉPÉS: NASSOLÁS */}
        {step === 4 && !isAnalyzing && !showSummary && (
          <div className="space-y-3">
            <h2 style={{ fontFamily: serif }} className="text-xl font-bold text-[#2D3748] flex items-center gap-2">
              <Utensils size={20} className="text-[#E07A5F]" /> Csipegetés
            </h2>
            <p className="text-xs text-[#6B5A52]">Napközbeni nassolás vagy maradékok megevése:</p>
            {[
              { v: "szinte_soha", l: "Szinte soha, csak főétkezések" },
              { v: "napi_1_2", l: "Napi 1-2 alkalommal becsúszik a pultról" },
              { v: "folyamatos", l: "Gyakori csipegetés / én eszem meg a maradékot" },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => handleSingleChoice("snacking", o.v)}
                className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                  form.snacking === o.v ? "bg-[#FDE8E1] border-[#E07A5F] text-[#2D3748]" : "bg-white border-[#F0DCD4] text-stone-700"
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        )}

        {/* 6. LÉPÉS: KONYHA */}
        {step === 5 && !isAnalyzing && !showSummary && (
          <div className="space-y-3">
            <h2 style={{ fontFamily: serif }} className="text-xl font-bold text-[#2D3748] flex items-center gap-2">
              <Clock size={20} className="text-[#E07A5F]" /> Konyhai kapacitás
            </h2>
            <p className="text-xs text-[#6B5A52]">Mennyi idő jut főzésre?</p>
            {[
              { v: "15perc", l: "Max. 15-20 perc gyors ételekre" },
              { v: "csak_csaladnak", l: "Nincs külön időm, csak a családnak főzök" },
              { v: "hetvegen", l: "Inkább hétvégén készülnék elő dobozolással" },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => handleSingleChoice("kitchen", o.v)}
                className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                  form.kitchen === o.v ? "bg-[#FDE8E1] border-[#E07A5F] text-[#2D3748]" : "bg-white border-[#F0DCD4] text-stone-700"
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        )}

        {/* 7. LÉPÉS: FŐ FÓKUSZ */}
        {step === 6 && !isAnalyzing && !showSummary && (
          <div className="space-y-3">
            <h2 style={{ fontFamily: serif }} className="text-xl font-bold text-[#2D3748] flex items-center gap-2">
              <Target size={20} className="text-[#E07A5F]" /> Fő személyes cél
            </h2>
            <p className="text-xs text-[#6B5A52]">Mi a legfontosabb fókuszod most?</p>
            {[
              { v: "nassolas_ido", l: "Nassolási vágy leküzdése & gyors családi receptek" },
              { v: "bor_puffadas", l: "Puffadásmentesítés & anyagcsere-serkentés" },
              { v: "torna_has", l: "Hasfal formálása & 10 perces torna" },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => setForm((s) => ({ ...s, focus: o.v }))}
                className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                  form.focus === o.v ? "bg-[#FDE8E1] border-[#E07A5F] text-[#2D3748]" : "bg-white border-[#F0DCD4] text-stone-700"
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        )}

        {/* ANIMÁLT ELEMZÉS KÉPERNYŐ */}
        {isAnalyzing && (
          <div className="py-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center mx-auto animate-pulse">
              <Flame size={28} />
            </div>
            <h3 style={{ fontFamily: serif }} className="text-lg font-bold text-[#2D3748]">
              Élettani profil kalkulálása...
            </h3>
            <div className="w-full bg-[#F0DCD4] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#E07A5F] h-full transition-all duration-500"
                style={{ width: `${(analysisIndex + 1) * 33.3}%` }}
              />
            </div>
            <p className="text-xs text-[#8A7268]">
              {analysisIndex === 0 && "Alapanyagcsere (BMR) számolása..."}
              {analysisIndex === 1 && "Szoptatási védelem és aktivitási szorzó..."}
              {analysisIndex === 2 && "Tenyér-Makró adagok véglegesítése..."}
            </p>
          </div>
        )}

        {/* FELOLDOTT EREDMÉNYEK & E-MAIL REGISZTRÁCIÓS KAPU */}
        {showSummary && (
          <div className="space-y-4 animate-in fade-in">
            <div className="text-center">
              <span className="w-12 h-12 rounded-2xl bg-[#FFF5F0] text-[#E07A5F] flex items-center justify-center mx-auto mb-2">
                <Sparkles size={24} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E07A5F]">Profilod elkészült!</span>
              <h3 style={{ fontFamily: serif }} className="text-xl font-bold text-[#2D3748] mt-1">
                {auditResults.profile}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-white p-3 rounded-2xl border border-[#F0DCD4]">
                <p className="text-[#8A7268]">Napi kalóriakeret</p>
                <p className="font-bold text-base text-[#2D3748] mt-0.5">{auditResults.targetKcal} kcal</p>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-[#F0DCD4]">
                <p className="text-[#8A7268]">Célsúly elérése</p>
                <p className="font-bold text-base text-[#7C9885] mt-0.5">{auditResults.targetDateStr}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#F0DCD4]">
              <p className="text-xs font-bold text-[#2D3748] mb-2 text-center">Személyes Tenyér-adagjaid mára:</p>
              <div className="grid grid-cols-4 gap-1 text-center text-[11px]">
                <div className="p-2 bg-[#FFF5F2] rounded-xl">
                  <span className="text-base">🖐️</span>
                  <p className="font-bold">{auditResults.palmProtein} Tenyér</p>
                  <p className="text-[10px] text-stone-500">Fehérje</p>
                </div>
                <div className="p-2 bg-[#F0F5F1] rounded-xl">
                  <span className="text-base">✊</span>
                  <p className="font-bold">{auditResults.fistVeg} Ököl</p>
                  <p className="text-[10px] text-stone-500">Zöldség</p>
                </div>
                <div className="p-2 bg-[#FFFDF5] rounded-xl">
                  <span className="text-base">🤲</span>
                  <p className="font-bold">{auditResults.cuppedCarb} Marék</p>
                  <p className="text-[10px] text-stone-500">Szénhidrát</p>
                </div>
                <div className="p-2 bg-[#FAF6F0] rounded-xl">
                  <span className="text-base">👍</span>
                  <p className="font-bold">{auditResults.thumbFat} Ujj</p>
                  <p className="text-[10px] text-stone-500">Zsír</p>
                </div>
              </div>
            </div>

            {/* E-MAIL MEZŐ A BELÉPÉSHEZ */}
            <div className="bg-[#FFF9F6] p-4 rounded-2xl border border-[#E07A5F]/30 text-left space-y-2">
              <label className="text-xs font-bold text-[#2D3748] flex items-center gap-1.5">
                <Mail size={14} className="text-[#E07A5F]" /> Add meg az e-mail címed a profil mentéséhez:
              </label>
              <p className="text-[11px] text-[#6B5A52] leading-tight">
                Ide mentjük a számaidat, és ezzel aktiválod a <strong>7 napos díjmentes Zsebedző</strong> elérést.
              </p>
              <input
                type="email"
                required
                placeholder="pelda@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-white border border-[#F0DCD4] focus:outline-[#E07A5F] shadow-xs"
              />
            </div>

            {/* BELÉPÉS GOMB */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#E07A5F] shadow-md cursor-pointer hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? "Profil mentése folyamatban..." : "Számaim mentése és belépés a Zsebedzőbe"}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* LÉPÉSKÖZI GOMBOK */}
        {!isAnalyzing && !showSummary && (
          <div className="flex items-center justify-between mt-5 pt-3 border-t border-[#F0DCD4]">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={`text-xs font-bold text-stone-500 cursor-pointer ${step === 0 ? "invisible" : ""}`}
            >
              Vissza
            </button>

            {step === 0 && (
              <button
                type="button"
                disabled={!canProceed}
                onClick={() => setStep(1)}
                className="text-xs font-bold px-5 py-2.5 rounded-xl text-white bg-[#E07A5F] disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                Tovább <ChevronRight size={14} />
              </button>
            )}

            {step === 6 && (
              <button
                type="button"
                disabled={!form.focus}
                onClick={handleStartAnalysis}
                className="text-xs font-bold px-5 py-2.5 rounded-xl text-white bg-[#E07A5F] disabled:opacity-40 cursor-pointer flex items-center gap-1 shadow-sm"
              >
                Számítás <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
