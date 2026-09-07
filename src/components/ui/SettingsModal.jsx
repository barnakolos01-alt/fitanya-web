import React, { useState } from "react";
import { useFitAnya } from "../../context/FitAnyaContext";
import { serif, sans } from "../../styles/tokens";
import { X, Sparkles, CheckCircle2, ShieldCheck, ExternalLink, RefreshCw } from "lucide-react";

export default function SettingsModal({ isOpen, onClose }) {
  const { profile, updateProfile, isPremium, setIsPaywallOpen, resetDay, aiUsageCount } = useFitAnya();

  const [weight, setWeight] = useState(profile.weightKg || 70);
  const [breastfeeding, setBreastfeeding] = useState(profile.breastfeeding || false);
  const [goal, setGoal] = useState(profile.goal || "fogyas");

  if (!isOpen) return null;

  const handleSave = () => {
    const updated = {
      ...profile,
      weightKg: Number(weight) || 70,
      breastfeeding: Boolean(breastfeeding),
      goal,
    };
    updateProfile(updated);
    onClose();
  };

  const handleOpenPaywall = () => {
    onClose();
    setIsPaywallOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div
        className="bg-[#FDFBF7] max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-[#F0DCD4] relative max-h-[90vh] overflow-y-auto"
        style={{ fontFamily: sans }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 cursor-pointer rounded-full bg-white border border-[#F0DCD4]"
          title="Bezárás"
        >
          <X size={16} />
        </button>

        <h3 style={{ fontFamily: serif }} className="text-xl font-bold text-[#2D3748] mb-1">
          Profil &amp; Keretek
        </h3>
        <p className="text-xs text-[#6B5A52] mb-4">
          Itt finomhangolhatod a tested paramétereit és az előfizetésedet.
        </p>

        {/* ELŐFIZETÉSI STÁTUSZ KÁRTYA */}
        <div className="mb-5">
          {isPremium ? (
            <div className="p-3.5 rounded-2xl bg-[#F0F5F1] border border-[#7C9885]/40 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2D3748]">
                <CheckCircle2 size={16} className="text-[#7C9885]" />
                <span>FitAnya Prémium Zsebedző Aktív</span>
              </div>
              <p className="text-[11px] text-[#526356] mt-1">
                Korlátlan AI Hűtőmentő, Tányérépítő és minden modul elérhető.
              </p>
              <div className="mt-2.5 pt-2 border-t border-[#D5E5D8]">
                <a
                  href="https://billing.stripe.com/p/login/test_4gwaF46L3e7C2zK000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-[#8A4B4F] hover:underline inline-flex items-center gap-1"
                >
                  Előfizetés kezelése vagy lemondása <ExternalLink size={11} />
                </a>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF5F2] to-[#FDE8E1] border border-[#E07A5F] text-left">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#C3634C] flex items-center gap-1">
                  <Sparkles size={14} /> Ingyenes Fiók
                </span>
                <span className="text-[10px] font-bold bg-white/80 px-2 py-0.5 rounded-full text-[#2D3748]">
                  {Math.max(0, 3 - aiUsageCount)} / 3 AI kredit
                </span>
              </div>
              <p className="text-xs text-[#4A5568] mt-1.5 leading-tight">
                Nyisd meg a korlátlan AI Hűtőmentőt és az összes családi modult!
              </p>
              <button
                type="button"
                onClick={handleOpenPaywall}
                className="mt-3 w-full py-2.5 rounded-xl font-bold text-xs text-white bg-[#E07A5F] shadow-sm hover:opacity-95 transition-opacity cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles size={13} /> Prémium aktiválása (7 nap 0 Ft)
              </button>
            </div>
          )}
        </div>

        {/* PROFIL BEÁLLÍTÁSOK */}
        <div className="space-y-3.5 mb-5 text-left">
          <div>
            <label className="text-xs font-semibold text-[#4A5568] block mb-1">
              Testsúly (kg)
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm bg-white border border-[#F0DCD4] focus:outline-[#E07A5F]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#4A5568] block mb-1">
              Szoptatás
            </label>
            <select
              value={breastfeeding ? "igen" : "nem"}
              onChange={(e) => setBreastfeeding(e.target.value === "igen")}
              className="w-full rounded-xl px-3 py-2 text-sm bg-white border border-[#F0DCD4] focus:outline-[#E07A5F]"
            >
              <option value="nem">Nem szoptatok</option>
              <option value="igen">Szoptatok (+ kalória &amp; folyadék védelem)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#4A5568] block mb-1">
              Cél
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm bg-white border border-[#F0DCD4] focus:outline-[#E07A5F]"
            >
              <option value="fogyas">Fogyás (egészséges deficit)</option>
              <option value="szintentartas">Szintentartás &amp; Tónusosodás</option>
            </select>
          </div>
        </div>

        {/* NAPI ADATOK NULLÁZÁSA */}
        <div className="mb-5 pt-3 border-t border-[#F0DCD4] flex items-center justify-between">
          <span className="text-xs text-stone-500">Mai adatok törlése:</span>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Biztosan nullázod a mai naplót?")) {
                resetDay();
                onClose();
              }
            }}
            className="text-xs font-semibold text-[#8A4B4F] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={12} /> Nap újraindítása
          </button>
        </div>

        {/* MENTÉS GOMB */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 rounded-2xl font-bold text-xs text-white bg-[#2D3748] hover:bg-[#1A202C] shadow-sm cursor-pointer transition-colors"
        >
          Módosítások mentése
        </button>
      </div>
    </div>
  );
}
