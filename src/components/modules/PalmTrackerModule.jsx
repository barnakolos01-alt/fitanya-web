import React, { useState } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Sliders,
  Sparkles,
  Info,
  Loader2,
} from "lucide-react";
import { C } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";
import TrackerHeader from "../ui/TrackerHeader";
import { searchDishes } from "../../data/dishesCatalog";

export default function PalmTrackerModule() {
  const { log, logPortion, removeEntry, remaining, consumeAiCredit } = useFitAnya();
  const [query, setQuery] = useState("");
  const [selectedDish, setSelectedDish] = useState(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [logged, setLogged] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [customDishes, setCustomDishes] = useState(() => {
    try {
      const saved = localStorage.getItem("fa_custom_dishes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customDelta, setCustomDelta] = useState({
    protein: 1,
    veg: 1,
    carb: 1,
    fat: 0,
  });

  const trimmedQuery = query.trim().toLowerCase();
  const matchedCustom = trimmedQuery.length >= 2
    ? customDishes.filter((d) =>
        d.name.toLowerCase().includes(trimmedQuery) ||
        d.keywords?.some((k) => k.toLowerCase().includes(trimmedQuery))
      )
    : [];

  const catalogMatches = searchDishes(query);
  const matchingDishes = [...matchedCustom, ...catalogMatches];

  const handleSelectDish = (dish) => {
    setSelectedDish(dish);
    setCustomDelta({ ...dish.delta });
    setIsCustomMode(false);
    setQuery(dish.name);
  };

  const handleAskClaude = async () => {
    if (!query || !query.trim()) return;
    if (!consumeAiCredit()) return;

    setIsAiLoading(true);
    try {
      const res = await fetch("/api/analyze-dish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishName: query.trim() }),
      });

      const data = await res.json();
      if (data.success && data.dish) {
        const updatedCustom = [
          data.dish,
          ...customDishes.filter((d) => d.name.toLowerCase() !== data.dish.name.toLowerCase()),
        ].slice(0, 50);

        setCustomDishes(updatedCustom);
        try {
          localStorage.setItem("fa_custom_dishes", JSON.stringify(updatedCustom));
        } catch (e) {}

        handleSelectDish(data.dish);
      } else {
        alert("Nem sikerült elemezni az ételt. Kérlek írd le pontosabban!");
      }
    } catch (e) {
      alert("Hálózati hiba történt az AI elemzés közben.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const updateDelta = (field, amount) => {
    setCustomDelta((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] + amount),
    }));
  };

  const handleLog = () => {
    const label = selectedDish ? selectedDish.name : query.trim() || "Családi étkezés";
    logPortion(customDelta, label);
    setLogged(true);
    setTimeout(() => {
      setLogged(false);
      setSelectedDish(null);
      setQuery("");
      setIsCustomMode(false);
    }, 1800);
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
    <div className="space-y-4">
      {/* 1. LEGFELÜL: MIT ETTÉL KERESŐ (LETISZTULT, MELEG KÁRTYA) */}
      <div className="bg-white rounded-3xl p-4 shadow-xs border border-[#F5EBE6]">
        <label className="text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
          <Search size={14} className="text-[#E07A5F]" /> Mit ettél? (Kezdd el gépelni az ételt)
        </label>

        <div className="relative">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedDish(null);
            }}
            placeholder="pl. Húsleves zöldséggel, Rántotta, Túrógombóc..."
            className="w-full text-sm outline-none bg-[#FFFDFB] border border-[#F0DCD4] rounded-2xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:border-[#E07A5F] transition-all"
          />
        </div>

        {/* TALÁLATI LISTA */}
        {query.trim().length >= 2 && !selectedDish && (
          <div className="mt-3 space-y-1.5 animate-in fade-in">
            {matchingDishes.length > 0 ? (
              <>
                {matchingDishes.map((dish) => {
                  const isCustom = String(dish.id).startsWith("ai_");
                  return (
                    <button
                      key={dish.id}
                      type="button"
                      onClick={() => handleSelectDish(dish)}
                      className="w-full text-left p-3 rounded-2xl bg-[#FFFDFB] hover:bg-[#FFF5F0] border border-[#F5EBE6] flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-stone-800 truncate">{dish.name}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          🖐️ {dish.delta.protein} Fehérje | ✊ {dish.delta.veg} Rost | 🤲 {dish.delta.carb} Szénhidrát
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-[#E07A5F] px-2.5 py-1 rounded-xl bg-white border border-[#F5DED7] shrink-0">
                        Kiválasztom
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={handleAskClaude}
                  disabled={isAiLoading}
                  className="w-full mt-2 p-2.5 rounded-2xl bg-[#FFF5F0] hover:bg-[#FDE8E1] border border-dashed border-[#E07A5F] text-[#C3634C] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-[#E07A5F]" /> Elemzés folyamatban...
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} className="text-[#E07A5F]" /> Nem találod? Kiszámolom AI-val: <strong>"{query}"</strong>
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="p-3.5 bg-[#FFF9F6] rounded-2xl border border-[#F5DED7] text-center">
                <p className="text-xs text-stone-700 font-medium mb-2">
                  Nem szerepel az alaplistában: <strong>"{query}"</strong>
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={handleAskClaude}
                    disabled={isAiLoading}
                    className="px-3.5 py-2 rounded-xl bg-[#E07A5F] text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={12} /> Kiszámolom AI-val ✨
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMode(true);
                      setSelectedDish(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-600 text-xs font-medium cursor-pointer"
                  >
                    <Sliders size={12} /> Kézzel állítom
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* KIVÁLASZTOTT ÉTEL ADAGOLÓ */}
        {selectedDish && (
          <div className="mt-3 rounded-2xl p-3.5 bg-[#FFF9F6] border border-[#F5DED7] animate-in fade-in">
            <p className="text-xs text-stone-700 leading-relaxed mb-3">
              💡 {selectedDish.tip}
            </p>

            <button
              type="button"
              onClick={handleLog}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[#E07A5F] cursor-pointer shadow-xs active:scale-98 transition-all"
            >
              Ezt ettem — Levonás a mai keretemből
            </button>
          </div>
        )}

        {/* KÉZI BEÁLLÍTÁS MODUS */}
        {isCustomMode && !selectedDish && (
          <div className="mt-3 rounded-2xl p-3.5 bg-stone-50 border border-stone-200">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white text-xs">
                <span>🖐️ Fehérje:</span>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => updateDelta("protein", -0.5)} className="w-5 h-5 rounded bg-stone-100 font-bold">-</button>
                  <span className="w-4 text-center font-bold">{customDelta.protein}</span>
                  <button type="button" onClick={() => updateDelta("protein", 0.5)} className="w-5 h-5 rounded bg-stone-100 font-bold">+</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white text-xs">
                <span>✊ Rost:</span>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => updateDelta("veg", -0.5)} className="w-5 h-5 rounded bg-stone-100 font-bold">-</button>
                  <span className="w-4 text-center font-bold">{customDelta.veg}</span>
                  <button type="button" onClick={() => updateDelta("veg", 0.5)} className="w-5 h-5 rounded bg-stone-100 font-bold">+</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white text-xs">
                <span>🤲 Szénhidrát:</span>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => updateDelta("carb", -0.5)} className="w-5 h-5 rounded bg-stone-100 font-bold">-</button>
                  <span className="w-4 text-center font-bold">{customDelta.carb}</span>
                  <button type="button" onClick={() => updateDelta("carb", 0.5)} className="w-5 h-5 rounded bg-stone-100 font-bold">+</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white text-xs">
                <span>👍 Zsír:</span>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => updateDelta("fat", -0.5)} className="w-5 h-5 rounded bg-stone-100 font-bold">-</button>
                  <span className="w-4 text-center font-bold">{customDelta.fat}</span>
                  <button type="button" onClick={() => updateDelta("fat", 0.5)} className="w-5 h-5 rounded bg-stone-100 font-bold">+</button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLog}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[#E07A5F] cursor-pointer"
            >
              Levonás a keretből
            </button>
          </div>
        )}

        {logged && (
          <p className="text-xs mt-2 text-center font-medium text-[#7C9885] flex items-center justify-center gap-1">
            <CheckCircle2 size={13} /> Sikeresen levonva a mai keretedből!
          </p>
        )}
      </div>

      {/* 2. KÖZÉPEN: A 4 TENYÉR-SZÁMLÁLÓ */}
      <TrackerHeader />

      {/* 3. ALUL: MAI NAPLÓZOTT ÉTELEK */}
      {log.entries && log.entries.length > 0 && (
        <div className="bg-white rounded-3xl p-4 shadow-xs border border-[#F5EBE6]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Clock size={13} className="text-[#E07A5F]" /> Mai étkezéseim
            </span>
            <span className="text-[11px] text-stone-400">{log.entries.length} tétel</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {log.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FFFDFB] border border-[#F5EBE6] text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-stone-800 truncate">{entry.label}</span>
                    <span className="text-[10px] text-stone-400">{entry.time}</span>
                  </div>
                  <p className="text-[11px] text-[#C3634C] mt-0.5 truncate">{renderDeltaTags(entry.delta)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="w-7 h-7 rounded-xl bg-stone-50 hover:bg-red-50 text-stone-400 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                  title="Visszavonás"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
