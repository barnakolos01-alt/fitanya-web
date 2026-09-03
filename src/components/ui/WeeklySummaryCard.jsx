import React, { useState, useMemo } from "react";
import { Award, Trophy, Droplets, Utensils, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { C, serif } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";

export default function WeeklySummaryCard() {
  const { profile, log } = useFitAnya();
  const [isOpen, setIsOpen] = useState(false);

  // Kiszámoljuk az elmúlt 7 nap aggregált adatait a localStorage-ból
  const stats = useMemo(() => {
    let totalWaterMl = 0;
    let loggedDaysCount = 0;
    let proteinSuccessDays = 0;

    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `fa_log_${d.toISOString().slice(0, 10)}`;

      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.protein > 0 || parsed.waterMl > 0) {
            loggedDaysCount++;
          }
          totalWaterMl += parsed.waterMl || 0;
          if (parsed.protein >= (profile.palmProtein || 3)) {
            proteinSuccessDays++;
          }
        }
      } catch {}
    }

    // Ha még most indult az app, a mai napot vesszük minimumnak
    if (loggedDaysCount === 0 && (log.protein > 0 || log.waterMl > 0)) {
      loggedDaysCount = 1;
      totalWaterMl = log.waterMl || 0;
      if (log.protein >= (profile.palmProtein || 3)) proteinSuccessDays = 1;
    }

    return {
      loggedDaysCount,
      totalLiters: (totalWaterMl / 1000).toFixed(1),
      proteinSuccessDays,
    };
  }, [log, profile]);

  return (
    <div
      className="rounded-3xl p-4 mb-5 border transition-all duration-200"
      style={{
        backgroundColor: "#FAF7F5",
        borderColor: C.border,
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center shrink-0">
            <Trophy size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              Heti Eredményed <Sparkles size={13} className="text-[#E07A5F]" />
            </span>
            <p className="text-[11px] text-stone-500">
              {stats.loggedDaysCount > 0
                ? `${stats.loggedDaysCount} aktív nap a héten • Nézd meg a mérföldköveket!`
                : "Kattints a heti ritmusod és sikereid megtekintéséhez!"}
            </p>
          </div>
        </div>

        <div className="w-7 h-7 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-500 shrink-0">
          {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 pt-3 border-t border-[#EAE2DC] animate-in fade-in duration-200">
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {/* VÍZ KPI */}
            <div className="p-3 rounded-2xl bg-white border border-[#F0DCD4] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Droplets size={16} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-stone-400">Összes folyadék</p>
                <p className="text-sm font-bold text-stone-800" style={{ fontFamily: serif }}>
                  {stats.totalLiters} liter
                </p>
              </div>
            </div>

            {/* FEHÉRJE KPI */}
            <div className="p-3 rounded-2xl bg-white border border-[#F0DCD4] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Utensils size={16} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-stone-400">Fehérje cél</p>
                <p className="text-sm font-bold text-stone-800" style={{ fontFamily: serif }}>
                  {stats.proteinSuccessDays} nap pipa
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#FFF9F5] border border-[#F0DCD4] rounded-2xl flex items-start gap-2 text-xs text-stone-700 leading-relaxed">
            <Award size={16} className="text-[#E07A5F] shrink-0 mt-0.5" />
            <p>
              <strong>Zsebedző üzenete:</strong> Minden pohár víz és minden tenyérnyi fehérje segít megvédeni az energiaszintedet. Nem a tökéletesség számít, hanem hogy a család ritmusában haladsz!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
