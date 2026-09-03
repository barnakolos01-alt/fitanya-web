import React, { useState } from "react";
import {
  Utensils,
  Search,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
} from "lucide-react";
import WeeklySummaryCard from "../ui/WeeklySummaryCard";
import InteractivePlateBuilder from "./InteractivePlateBuilder";
import { C } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";
import SectionHeader from "../ui/SectionHeader";
import TrackerHeader from "../ui/TrackerHeader";

function FormattedMessage({ content }) {
  if (!content) return null;
  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-sm text-stone-700 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        const parts = line.split(/(\*\*[\s\S]*?\*\*|\*[^*]+?\*)/g);
        const isHighlight =
          trimmed.startsWith("🖐️") || trimmed.startsWith("💡") || trimmed.startsWith("🎯");

        return (
          <p
            key={idx}
            className={
              isHighlight
                ? "mt-2 pt-2 border-t border-[#f1ded6] font-semibold text-[#c3634c]"
                : ""
            }
          >
            {parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={pIdx} className="font-semibold text-stone-900">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

export default function PalmTrackerModule() {
  const { log, logPortion, removeEntry, remaining } = useFitAnya();
  const [query, setQuery] = useState("");
  const [logged, setLogged] = useState(false);

  // AI állapotok
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [aiError, setAiError] = useState(null);

  const [customDelta, setCustomDelta] = useState({
    protein: 1,
    veg: 1,
    carb: 1,
    fat: 0,
  });

  const handleAskCoachForDish = async () => {
    if (!query.trim() || aiLoading) return;

    setAiLoading(true);
    setAiError(null);
    setAiResponse(null);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "dish",
          input: query.trim(),
          remaining: remaining,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nem sikerült elemezni az ételt.");
      setAiResponse(data.reply);
    } catch (err) {
      setAiError(err.message || "Hiba történt. Kérlek próbáld újra!");
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogCustomAiDelta = () => {
    logPortion(customDelta, query.trim() || "Családi étkezés");
    setLogged(true);
    setTimeout(() => {
      setLogged(false);
      setAiResponse(null);
      setQuery("");
    }, 1800);
  };

  const updateDelta = (field, amount) => {
    setCustomDelta((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] + amount),
    }));
  };

  const renderDeltaTags = (delta) => {
    const tags = [];
    if (delta.protein) tags.push(`+${delta.protein} Fehérje`);
    if (delta.veg) tags.push(`+${delta.veg} Rost`);
    if (delta.carb) tags.push(`+${delta.carb} Szénhidrát`);
    if (delta.fat) tags.push(`+${delta.fat} Zsír`);
    return tags.join(", ");
  };

  return (
    <div>
      <SectionHeader
        title="Tányérom"
        subtitle="Konyhamérleg nélkül — a családi közös fazékból a te tányérodra."
        icon={Utensils}
      />

      {/* HETI ÖSSZEFOGLALÓ KÁRTYA */}
      <WeeklySummaryCard />

      <TrackerHeader />

      {/* MAI NAPLÓZOTT TÉTELEK */}
      {log.entries && log.entries.length > 0 && (
        <div
          className="rounded-3xl p-4 mb-4"
          style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={13} className="text-[#E07A5F]" /> Mai naplózott ételek
            </span>
            <span className="text-[11px] text-stone-400 font-medium">
              {log.entries.length} tétel
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {log.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FFFDFB] border border-[#F5EBE6] text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-stone-800 truncate">
                      {entry.label}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {entry.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#C3634C] mt-0.5 truncate">
                    {renderDeltaTags(entry.delta)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="w-7 h-7 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Tétel visszavonása"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TISZTA AI KERESŐ KÁRTYA */}
      <div
        className="rounded-3xl p-4 sm:p-5 mb-3"
        style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
      >
        <label
          className="text-xs font-medium mb-2 flex items-center gap-1.5"
          style={{ color: C.textSoft }}
        >
          <Search size={13} /> Mit eszik ma a család?
        </label>

        <div className="relative mb-3">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setAiResponse(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                handleAskCoachForDish();
              }
            }}
            placeholder="pl. Bolognai spagetti, Rakott krumpli, Húsleves..."
            className="w-full text-sm outline-none bg-stone-50/60 border rounded-xl px-3.5 py-3"
            style={{ color: C.textDark, borderColor: C.border }}
          />
        </div>

        {query.trim().length > 1 && (
          <button
            type="button"
            disabled={aiLoading}
            onClick={handleAskCoachForDish}
            className="w-full py-3 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-white shadow-sm active:scale-95"
            style={{ backgroundColor: C.coral }}
          >
            {aiLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Zsebedző fordítja a családi fazekat...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Kérdezd a Zsebedzőt: hogyan szedj ebből?</span>
              </>
            )}
          </button>
        )}

        {/* AI VÁLASZ & LEVONÓ PULT */}
        {aiResponse && (
          <div className="mt-4 rounded-2xl p-4 bg-[#FBF5F2] border border-[#F1DED6] animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-[#F1DED6]">
              <Sparkles size={14} style={{ color: C.coral }} />
              <span className="text-xs font-bold text-[#C3634C] uppercase tracking-wider">
                FitAnya Adagolási Útmutató
              </span>
            </div>

            <FormattedMessage content={aiResponse} />

            <div className="mt-4 pt-3 border-t border-[#F1DED6]">
              <p className="text-xs font-semibold text-stone-700 mb-2">
                Mennyit vonjunk le a mai keretedből?
              </p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#F1DED6] text-xs">
                  <span>🖐️ Fehérje:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateDelta("protein", -1)}
                      className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-semibold w-4 text-center">
                      {customDelta.protein}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateDelta("protein", 1)}
                      className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#F1DED6] text-xs">
                  <span>✊ Rost:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateDelta("veg", -1)}
                      className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-semibold w-4 text-center">
                      {customDelta.veg}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateDelta("veg", 1)}
                      className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#F1DED6] text-xs">
                  <span>🤲 Szénhidrát:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateDelta("carb", -1)}
                      className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-semibold w-4 text-center">
                      {customDelta.carb}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateDelta("carb", 1)}
                      className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#F1DED6] text-xs">
                  <span>👍 Zsír:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateDelta("fat", -1)}
                      className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-semibold w-4 text-center">
                      {customDelta.fat}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateDelta("fat", 1)}
                      className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogCustomAiDelta}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-sm"
                style={{ backgroundColor: C.coral }}
              >
                Ezt ettem — Levonás a keretből
              </button>
            </div>
          </div>
        )}

        {aiError && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle size={15} className="mt-0.5 text-amber-600 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {logged && (
          <p
            className="text-xs mt-3 text-center font-medium flex items-center justify-center gap-1"
            style={{ color: C.sageText }}
          >
            <CheckCircle2 size={13} /> Sikeresen levonva és rögzítve a napi naplóban!
          </p>
        )}
      </div>

      {/* AZ ÚJ INTERAKTÍV TÁNYÉRÉPÍTŐ: MIT EHETEK MÉG MA? */}
      <InteractivePlateBuilder />
    </div>
  );
}
