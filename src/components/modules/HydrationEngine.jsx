import React, { useState, useEffect } from "react";
import { Droplet, Plus, Sparkles } from "lucide-react";
import { C, serif } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";
import SectionHeader from "../ui/SectionHeader";
import { REMINDERS } from "../../utils/reminders";

export default function HydrationEngine() {
  const { profile, log, addWater, hydrationTargetMl } = useFitAnya();
  const [reminderIdx, setReminderIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setReminderIdx((i) => (i + 1) % REMINDERS.length), 6000);
    return () => clearInterval(id);
  }, []);

  const pct = Math.min(100, Math.round((log.waterMl / hydrationTargetMl) * 100));

  return (
    <div>
      <SectionHeader
        title="Hidratációs Motor"
        subtitle={`Személyes célod: ${(hydrationTargetMl / 1000).toFixed(1)} liter / nap${
          profile.breastfeeding ? " (szoptatási védelemmel)" : ""
        }`}
        icon={Droplet}
      />

      <div className="rounded-3xl p-5 mb-3 flex flex-col items-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="relative w-28 h-36 mb-4">
          <div className="absolute inset-0 rounded-b-3xl rounded-t-xl overflow-hidden" style={{ border: `2px solid ${C.border}` }}>
            <div
              className="absolute bottom-0 left-0 right-0 transition-all"
              style={{ height: `${pct}%`, backgroundColor: C.coral, opacity: 0.8 }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-semibold" style={{ color: C.textDark, fontFamily: serif }}>
              {pct}%
            </span>
          </div>
        </div>
        <p className="text-sm font-semibold mb-4" style={{ color: C.textDark, fontFamily: serif }}>
          {(log.waterMl / 1000).toFixed(2)} liter / {(hydrationTargetMl / 1000).toFixed(1)} liter
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => addWater(250)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white cursor-pointer shadow-sm"
            style={{ backgroundColor: C.coral }}
          >
            <Plus size={14} /> +2,5 dl víz
          </button>
          <button
            onClick={() => addWater(500)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white cursor-pointer shadow-sm"
            style={{ backgroundColor: C.coralDeep }}
          >
            <Plus size={14} /> +5 dl kulacs
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-3.5 flex items-start gap-2.5" style={{ backgroundColor: C.sageSoft }}>
        <Sparkles size={15} style={{ color: C.sageText, marginTop: 2 }} />
        <div>
          <p className="text-[11px] font-medium mb-0.5" style={{ color: C.sageText }}>
            Támogató emlékeztető
          </p>
          <p className="text-sm leading-relaxed" style={{ color: C.textDark }}>
            {REMINDERS[reminderIdx]}
          </p>
        </div>
      </div>
    </div>
  );
}
