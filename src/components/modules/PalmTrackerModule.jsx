import React, { useState } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Sliders,
  Sparkles,
  Info,
  AlertTriangle,
  Loader2,
  X,
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

  // OKOS ÉRTÉKELÉS: JÓ VÁLASZTÁS-E?
  const getDishFeedback = () => {
    if (!selectedDish) return null;
    const { protein, veg, carb, fat } = customDelta;

    const exceedsFat = remaining.fat < fat;
    const exceedsCarb = remaining.carb < carb;
    const lowSatiety = (protein === 0 && veg === 0) && (carb > 0 || fat > 0);

    if (exceedsFat || exceedsCarb) {
      return {
        type: "warning",
        title: "Kicsit túllépi a mai keretet",
        text: "Semmi baj! Élvezd az ízeket, a következő étkezésnél pedig fókuszálj a friss zöldségekre és tiszta fehérjére.",
      };
    }

    if (lowSatiety) {
      return {
        type: "tip",
        title: "Finom, de gyorsan megéhezel utána!",
        text: "Önmagában kevés benne a fehérje és a rost. Ha dobsz mellé 1 főtt tojást vagy egy kis zöldséget, órákig nem leszel éhes!",
      };
    }

    return {
      type: "success",
      title: "Szuper, kiegyensúlyozott választás! 🌸",
      text: "Szépen illeszkedik a mai napodba és támogatja a jóllakottságodat.",
    };
  };

  const feedback = getDishFeedback();

  return (
    <div className="space-y-4">
      {/* 1. LEGFELÜL: KERESŐ ÉS ELŐNÉZET */}
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
            placeholder="pl. Vajas kenyér, Húsleves, Rántotta..."
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
                          🖐️ {dish.delta.protein} Fehérje | ✊ {dish.delta.veg} Rost | 🤲 {dish.delta.carb} Szénhidrát | 👍 {dish.delta.fat} Zsír
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

        {/* KIVÁLASZTOTT ÉTEL ADAG- ÉS ÉRTÉKELŐ KÁRTYA */}
        {selectedDish && (
          <div className="mt-3 rounded-2xl p-4 bg-[#FFF9F6] border border-[#F5DED7] animate-in fade-in space-y-3">
            {/* Fejléc */}
            <div className="flex items-center justify-between pb-2 border-b border-[#F0DCD4]">
              <div>
                <span className="text-[10px] font-bold text-[#E07A5F] uppercase tracking-wider">
                  Kalkuláció
                </span>
                <h4 className="text-sm font-bold text-stone-800">{selectedDish.name}</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedDish(null);
                  setQuery("");
                }}
                className="text-stone-400 hover:text-stone-700 p-1"
                title="Mégsem ezt ettem"
              >
                <X size={15} />
              </button>
            </div>

            {/* A 4 Tenyér érték lágy dobozkákban */}
            <div>
              <p className="text-[11px] font-semibold text-stone-600 mb-1.5">
                Ezt vonjuk le a mai tányérodról:
              </p>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="p-2 rounded-xl bg-white border border-[#F7DFD6]">
                  <span className="text-xs block">🖐️</span>
                  <span className="text-xs font-bold text-stone-800 block mt-0.5">
                    {customDelta.protein}
                  </span>
                  <span className="text-[9px] text-stone-500">Fehérje</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#DCE7E0]">
                  <span className="text-xs block">✊</span>
                  <span className="text-xs font-bold text-stone-800 block mt-0.5">
                    {customDelta.veg}
                  </span>
                  <span className="text-[9px] text-stone-500">Rost</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#F4EBD8]">
                  <span className="text-xs block">🤲</span>
                  <span className="text-xs font-bold text-stone-800 block mt-0.5">
                    {customDelta.carb}
                  </span>
                  <span className="text-[9px] text-stone-500">Szénhidrát</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#F7DBD4]">
                  <span className="text-xs block">👍</span>
                  <span className="text-xs font-bold text-stone-800 block mt-0.5">
                    {customDelta.fat}
                  </span>
                  <span className="text-[9px] text-stone-500">Zsír</span>
                </div>
              </div>
            </div>

            {/* JÓ VÁLASZTÁS-E? VISSZAJELZŐ DOBOZ */}
            {feedback && (
              <div
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  feedback.type === "warning"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : feedback.type === "tip"
                    ? "bg-[#FFF5F0] border-[#F7DFD6] text-[#8C4A38]"
                    : "bg-[#F3F7F4] border-[#DCE7E0] text-[#42614E]"
                }`}
              >
                <p className="font-bold flex items-center gap-1.5">
                  {feedback.type === "warning" && <AlertTriangle size={13} className="text-amber-600 shrink-0" />}
                  {feedback.type === "tip" && <Info size={13} className="text-[#E07A5F] shrink-0" />}
                  {feedback.type === "success" && <CheckCircle2 size={13} className="text-[#7C9885] shrink-0" />}
                  {feedback.title}
                </p>
                <p className="text-[11px] leading-relaxed opacity-90">{feedback.text}</p>
              </div>
            )}

            {/* Szakmai tálalási tipp */}
            {selectedDish.tip && (
              <p className="text-xs text-stone-600 leading-relaxed bg-white p-2.5 rounded-xl border border-[#F5EBE6]">
                💡 <strong>Tipp:</strong> {selectedDish.tip}
              </p>
            )}

            {/* Levonás gomb */}
            <button
              type="button"
              onClick={handleLog}
              className="w-full py-3 rounded-2xl text-xs font-bold text-white bg-[#E07A5F] shadow-xs cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={14} /> Ezt ettem — Levonás a keretből
            </button>
          </div>
        )}

        {/* KÉZI BEÁLLÍTÁS */}
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
