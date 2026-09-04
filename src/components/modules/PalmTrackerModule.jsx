import React, { useState, useEffect } from "react";
import {
  Utensils,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Sliders,
  Sparkles,
  Info,
  Loader2,
} from "lucide-react";
import WeeklySummaryCard from "../ui/WeeklySummaryCard";
import InteractivePlateBuilder from "./InteractivePlateBuilder";
import { C } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";
import SectionHeader from "../ui/SectionHeader";
import TrackerHeader from "../ui/TrackerHeader";
import { searchDishes } from "../../data/dishesCatalog";

export default function PalmTrackerModule() {
  const { log, logPortion, removeEntry, remaining } = useFitAnya();
  const [query, setQuery] = useState("");
  const [selectedDish, setSelectedDish] = useState(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [logged, setLogged] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 1. LOKÁLIS AI-GYORSÍTÓTÁR BETÖLTÉSE
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

  // 2. KERESÉS EGYESÍTÉSE: Saját korábbi AI ételek + 586-os alapkatalógus
  const trimmedQuery = query.trim().toLowerCase();
  const matchedCustom = trimmedQuery.length >= 2
    ? customDishes.filter((d) =>
        d.name.toLowerCase().includes(trimmedQuery) ||
        d.keywords?.some((k) => k.toLowerCase().includes(trimmedQuery))
      )
    : [];

  const catalogMatches = searchDishes(query);
  // Összefésülés úgy, hogy a saját AI ételek kerüljenek legfelülre
  const matchingDishes = [...matchedCustom, ...catalogMatches];

  const handleSelectDish = (dish) => {
    setSelectedDish(dish);
    setCustomDelta({ ...dish.delta });
    setIsCustomMode(false);
    setQuery(dish.name);
  };

  // 3. AI ELEMZÉS ÉS AUTOMATIKUS MENTÉS
  const handleAskClaude = async () => {
    if (!query || !query.trim()) return;
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/analyze-dish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishName: query.trim() }),
      });

      const data = await res.json();
      if (data.success && data.dish) {
        // Mentés a helyi memóriába (duplikációk kiszűrésével)
        const updatedCustom = [
          data.dish,
          ...customDishes.filter((d) => d.name.toLowerCase() !== data.dish.name.toLowerCase()),
        ].slice(0, 50); // Legutóbbi 50 egyedi étel megőrzése

        setCustomDishes(updatedCustom);
        try {
          localStorage.setItem("fa_custom_dishes", JSON.stringify(updatedCustom));
        } catch (e) {
          console.error("LocalStorage mentési hiba:", e);
        }

        handleSelectDish(data.dish);
      } else {
        alert("Nem sikerült elemezni az ételt. Kérlek írd le pontosabban az alapanyagokat!");
      }
    } catch (e) {
      console.error("AI hiba:", e);
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
    <div>
      <SectionHeader
        title="Tányérom"
        subtitle="Konyhamérleg nélkül — a családi közös fazékból a te tányérodra."
        icon={Utensils}
      />

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

      {/* CSALÁDI FAZÉK KERESŐ KÁRTYA */}
      <div
        className="rounded-3xl p-4 sm:p-5 mb-3"
        style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
      >
        {/* SZEMÉLYESEBB CÍMKE */}
        <label
          className="text-xs font-medium mb-2 flex items-center gap-1.5"
          style={{ color: C.textSoft }}
        >
          <Search size={13} /> Mit ettél? (Kezdd el gépelni az étel nevét)
        </label>

        <div className="relative mb-2">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedDish(null);
            }}
            placeholder="pl. Bolognai, Zöldborsófőzelék, Rántott sajt..."
            className="w-full text-sm outline-none bg-stone-50/60 border rounded-xl px-3.5 py-3"
            style={{ color: C.textDark, borderColor: C.border }}
          />
        </div>

        {/* TALÁLATI LISTA */}
        {query.trim().length >= 2 && !selectedDish && (
          <div className="mb-3 space-y-1.5 animate-in fade-in">
            {matchingDishes.length > 0 ? (
              <>
                {matchingDishes.map((dish) => {
                  const isCustom = String(dish.id).startsWith("ai_");
                  return (
                    <button
                      key={dish.id}
                      type="button"
                      onClick={() => handleSelectDish(dish)}
                      className="w-full text-left p-3 rounded-2xl bg-[#FFFDFB] hover:bg-[#FDE8E1] border border-[#F0DCD4] flex items-center justify-between cursor-pointer transition-all shadow-xs group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-stone-800 group-hover:text-[#E07A5F] truncate">
                            {dish.name}
                          </p>
                          {isCustom && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#FDE8E1] text-[#E07A5F] shrink-0">
                              ✨ Saját AI
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          🖐️ {dish.delta.protein}T | ✊ {dish.delta.veg}Ö | 🤲 {dish.delta.carb}M | 👍 {dish.delta.fat}H
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-[#E07A5F] px-2.5 py-1 rounded-xl bg-white border border-[#F0DCD4] shrink-0">
                        Kiválasztom
                      </span>
                    </button>
                  );
                })}

                {/* AI GOMB A LISTA ALJÁN (ha van találat, de nem az övé) */}
                <button
                  type="button"
                  onClick={handleAskClaude}
                  disabled={isAiLoading}
                  className="w-full mt-2 p-2.5 rounded-2xl bg-[#FFF9F5] hover:bg-[#FDE8E1] border border-dashed border-[#E07A5F] text-[#C3634C] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-[#E07A5F]" /> Elemzés folyamatban...
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} className="text-[#E07A5F]" /> Nem ezeket keresed? Kiszámolom AI-val: <strong>"{query}"</strong>
                    </>
                  )}
                </button>
              </>
            ) : (
              /* 0 TALÁLAT ESETÉN */
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center">
                <p className="text-xs text-stone-600 mb-1 font-medium">
                  Nincs a recepttárban: <span className="font-bold text-stone-800">"{query}"</span>
                </p>
                <p className="text-[11px] text-stone-400 mb-3">
                  Elemeztessük a FitAnya mesterséges intelligenciával, vagy állítsd be kézzel!
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleAskClaude}
                    disabled={isAiLoading}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#E07A5F] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50"
                  >
                    {isAiLoading ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Elemzés folyamatban...
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} /> Kiszámolom a Tenyér-adagját! ✨
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMode(true);
                      setSelectedDish(null);
                    }}
                    disabled={isAiLoading}
                    className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-600 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-stone-100 transition-colors"
                  >
                    <Sliders size={12} /> Beállítom kézzel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* KIVÁLASZTOTT ÉTEL TÁLALÁSI KÁRTYÁJA */}
        {selectedDish && (
          <div className="mt-3 rounded-2xl p-4 bg-[#FBF5F2] border border-[#F1DED6] animate-in fade-in">
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-[#F1DED6]">
              <Sparkles size={14} style={{ color: C.coral }} />
              <span className="text-xs font-bold text-[#C3634C] uppercase tracking-wider">
                FitAnya Tálalási Útmutató
              </span>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed mb-3">
              💡 {selectedDish.tip}
            </p>

            {/* ZSÍRKERET TÚLLÉPÉS FIGYELMEZTETÉS */}
            {remaining.fat <= 0 && selectedDish.delta.fat > 0 && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl mb-3 flex items-start gap-2 text-[11px] text-amber-900 font-medium">
                <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Figyelem: A mai zsírkereted már betelt! A szaftot és olajos levet hagyd a tányéron, ne tunkold ki!
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-[#F1DED6]">
              <p className="text-xs font-semibold text-stone-700 mb-2">
                Javasolt levonás a tányérodról:
              </p>

              {/* 4 SZÁMLÁLÓ GOMB */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#F1DED6] text-xs">
                  <span>🖐️ Fehérje:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateDelta("protein", -0.5)}
                      className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-semibold w-6 text-center">
                      {customDelta.protein}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateDelta("protein", 0.5)}
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
                      onClick={() => updateDelta("veg", -0.5)}
                      className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-semibold w-6 text-center">
                      {customDelta.veg}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateDelta("veg", 0.5)}
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
                      onClick={() => updateDelta("carb", -0.5)}
                      className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-semibold w-6 text-center">
                      {customDelta.carb}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateDelta("carb", 0.5)}
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
                      onClick={() => updateDelta("fat", -0.5)}
                      className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-semibold w-6 text-center">
                      {customDelta.fat}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateDelta("fat", 0.5)}
                      className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLog}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-sm active:scale-98 transition-all"
                style={{ backgroundColor: C.coral }}
              >
                Ezt ettem — Levonás a keretből
              </button>
            </div>
          </div>
        )}

        {/* KÉZI BEÁLLÍTÁS */}
        {isCustomMode && !selectedDish && (
          <div className="mt-3 rounded-2xl p-4 bg-stone-50 border border-stone-200 animate-in fade-in">
            <p className="text-xs font-bold text-stone-800 mb-1">
              Egyéni tálalás a Tenyér-szabály szerint:
            </p>
            <p className="text-[11px] text-stone-500 mb-3">
              Állítsd be, miből mennyit szedtél a tányérodra a fazékból:
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200 text-xs">
                <span>🖐️ Fehérje:</span>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => updateDelta("protein", -0.5)} className="w-6 h-6 rounded bg-stone-100 font-bold cursor-pointer">-</button>
                  <span className="font-semibold w-6 text-center">{customDelta.protein}</span>
                  <button type="button" onClick={() => updateDelta("protein", 0.5)} className="w-6 h-6 rounded bg-stone-100 font-bold cursor-pointer">+</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200 text-xs">
                <span>✊ Rost:</span>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => updateDelta("veg", -0.5)} className="w-6 h-6 rounded bg-stone-100 font-bold cursor-pointer">-</button>
                  <span className="font-semibold w-6 text-center">{customDelta.veg}</span>
                  <button type="button" onClick={() => updateDelta("veg", 0.5)} className="w-6 h-6 rounded bg-stone-100 font-bold cursor-pointer">+</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200 text-xs">
                <span>🤲 Szénhidrát:</span>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => updateDelta("carb", -0.5)} className="w-6 h-6 rounded bg-stone-100 font-bold cursor-pointer">-</button>
                  <span className="font-semibold w-6 text-center">{customDelta.carb}</span>
                  <button type="button" onClick={() => updateDelta("carb", 0.5)} className="w-6 h-6 rounded bg-stone-100 font-bold cursor-pointer">+</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200 text-xs">
                <span>👍 Zsír:</span>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => updateDelta("fat", -0.5)} className="w-6 h-6 rounded bg-stone-100 font-bold cursor-pointer">-</button>
                  <span className="font-semibold w-6 text-center">{customDelta.fat}</span>
                  <button type="button" onClick={() => updateDelta("fat", 0.5)} className="w-6 h-6 rounded bg-stone-100 font-bold cursor-pointer">+</button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLog}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-sm"
              style={{ backgroundColor: C.coral }}
            >
              Levonás a keretből
            </button>
          </div>
        )}

        {logged && (
          <p
            className="text-xs mt-3 text-center font-medium flex items-center justify-center gap-1 animate-in fade-in"
            style={{ color: C.sageText }}
          >
            <CheckCircle2 size={13} /> Sikeresen levonva és rögzítve a napi naplóban!
          </p>
        )}
      </div>

      {/* MIT EHETEK MÉG MA? (INTERAKTÍV TÁNYÉRÉPÍTŐ) */}
      <InteractivePlateBuilder />
    </div>
  );
}
