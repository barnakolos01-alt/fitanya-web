import React, { useState } from "react";
import { X, Settings, Check, Sparkles } from "lucide-react";
import { C, serif } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";

export default function SettingsModal({ isOpen, onClose }) {
  const { profile, updateProfile } = useFitAnya();

  const [weightKg, setWeightKg] = useState(() => {
    try {
      const saved = localStorage.getItem("fa_form");
      if (saved) return JSON.parse(saved).weightKg || profile.weightKg || 68;
    } catch {}
    return profile.weightKg || 68;
  });

  const [heightCm, setHeightCm] = useState(() => {
    try {
      const saved = localStorage.getItem("fa_form");
      if (saved) return JSON.parse(saved).heightCm || 168;
    } catch {}
    return 168;
  });

  const [breastfeeding, setBreastfeeding] = useState(() => {
    try {
      const saved = localStorage.getItem("fa_form");
      if (saved) return Boolean(JSON.parse(saved).breastfeeding);
    } catch {}
    return Boolean(profile.breastfeeding);
  });

  const [goal, setGoal] = useState(() => {
    try {
      const saved = localStorage.getItem("fa_form");
      if (saved) return JSON.parse(saved).focus || "fogyas";
    } catch {}
    return "fogyas";
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();

    let currentFormData = {};
    try {
      const saved = localStorage.getItem("fa_form");
      if (saved) currentFormData = JSON.parse(saved);
    } catch {}

    const updatedFormData = {
      ...currentFormData,
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      breastfeeding: Boolean(breastfeeding),
      focus: goal,
    };

    updateProfile(updatedFormData);
    setSavedSuccess(true);

    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl relative border border-[#F0DCD4]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* BEZÁRÁS GOMB */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* FEJLÉC */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center shrink-0">
            <Settings size={20} />
          </div>
          <div>
            <h3 style={{ fontFamily: serif }} className="font-bold text-lg text-stone-800">
              Profil & Keretek
            </h3>
            <p className="text-xs text-stone-500">
              Finomhangold a számaidat a jelenlegi ritmusodhoz!
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* SÚLY ÉS MAGASSÁG */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Aktuális súly (kg)
              </label>
              <input
                type="number"
                min="40"
                max="180"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold text-stone-800 outline-none focus:border-[#E07A5F]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Magasság (cm)
              </label>
              <input
                type="number"
                min="130"
                max="210"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold text-stone-800 outline-none focus:border-[#E07A5F]"
                required
              />
            </div>
          </div>

          {/* FŐ CÉL */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Fő fókuszod jelenleg:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGoal("fogyas")}
                className="py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer"
                style={
                  goal === "fogyas"
                    ? { backgroundColor: "#FDE8E1", borderColor: "#E07A5F", color: "#C3634C" }
                    : { backgroundColor: "#FAF7F5", borderColor: "#EAE2DC", color: "#6B5A52" }
                }
              >
                Kíméletes Fogyás
              </button>
              <button
                type="button"
                onClick={() => setGoal("energia")}
                className="py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer"
                style={
                  goal === "energia"
                    ? { backgroundColor: "#FDE8E1", borderColor: "#E07A5F", color: "#C3634C" }
                    : { backgroundColor: "#FAF7F5", borderColor: "#EAE2DC", color: "#6B5A52" }
                }
              >
                Energia / Szinten tartás
              </button>
            </div>
          </div>

          {/* SZOPTATÁSI VÉDELEM TOGGLE */}
          <div className="p-3 bg-[#FFF9F5] border border-[#F0DCD4] rounded-2xl flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-stone-800">Szoptatási védelem</p>
              <p className="text-[11px] text-stone-500">
                +600 ml folyadék és extra kalória a tejtermelésért
              </p>
            </div>
            <input
              type="checkbox"
              checked={breastfeeding}
              onChange={(e) => setBreastfeeding(e.target.checked)}
              className="w-5 h-5 accent-[#E07A5F] rounded cursor-pointer"
            />
          </div>

          {/* MENTÉS GOMB */}
          <button
            type="submit"
            disabled={savedSuccess}
            className="w-full py-3 rounded-2xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            style={{ backgroundColor: savedSuccess ? C.sage : C.coral }}
          >
            {savedSuccess ? (
              <>
                <Check size={16} /> Újraszámolva és elmentve!
              </>
            ) : (
              <>
                <Sparkles size={14} /> Számok és keretek frissítése
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
