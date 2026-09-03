import React, { useState } from "react";
import {
  Utensils,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Sliders,
  Sparkles,
  Info,
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

  const [customDelta, setCustomDelta] = useState({
    protein: 1,
    veg: 1,
    carb: 1,
    fat: 0,
  });

  // Helyi keresés a 300 ételes katalógusban (0 hálózati forgalom, 0 késleltetés)
  const matchingDishes = searchDishes(query);

  const handleSelectDish = (dish) => {
    setSelectedDish(dish);
    setCustomDelta({ ...dish.delta });
    setIsCustomMode(false);
    setQuery(dish.name);
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
        <label
          className="text-xs font-medium mb-2 flex items-center gap-1.5"
          style={{ color: C.textSoft }}
        >
          <Search size={13} /> Mit eszik ma a család? (Kezdd el gépelni a nevét)
        </label>

        <div className="relative mb-2">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedDish(null);
            }}
            placeholder="pl. Gulyás, Bolognai, Rántott sajt, Rakott kel..."
            className="w-full text-sm outline-none bg-stone-50/60 border rounded-xl px-3.5 py-3"
            style={{ color: C.textDark, borderColor: C.border }}
          />
        </div>

        {/* AUTOMATIKUS TALÁLATI LISTA GÉPELÉSRE */}
        {query.trim().length >= 2 && !selectedDish && (
          <div className="mb-3 space-y-1.5 animate-in fade-in">
            {matchingDishes.length > 0 ? (
              matchingDishes.map((dish) => (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => handleSelectDish(dish)}
                  className="w-full text-left p-3 rounded-2xl bg-[#FFFDFB] hover:bg-[#FDE8E1] border border-[#F0DCD4] flex items-center justify-between cursor-pointer transition-all shadow-xs group"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-stone-800 group-hover:text-[#E07A5F]">
                      {dish.name}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      🖐️ {dish.delta.protein}T | ✊ {dish.delta.veg}Ö | 🤲 {dish.delta.carb}M | 👍 {dish.delta.fat}H
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[#E07A5F] px-2.5 py-1 rounded-xl bg-white border border-[#F0DCD4] shrink-0">
                    Kiválasztom
                  </span>
                </button>
              ))
            ) : (
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-center">
                <p className="text-xs text-stone-500 mb-2">
                  Ez az étel nincs a 300-as listában.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMode(true);
                    setSelectedDish(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#E07A5F] text-white font-bold text-xs flex items-center gap-1.5 mx-auto cursor-pointer"
                >
                  <Sliders size={12} /> Beállítom a tányérom kézzel (10 mp)
                </button>
              </div>
            )}
          </div>
        )}

        {/* KIVÁLASZTOTT ÉTEL FITANYA ADAGOLÁSI KÁRTYÁJA */}
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

        {/* EGYÉNI TÁLALÁS (HA AZ ÉTEL NINCS A LISTÁBAN) */}
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
