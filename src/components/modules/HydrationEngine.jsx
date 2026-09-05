import React, { useState } from "react";
import { Droplet, Check } from "lucide-react";
import { C, serif } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";
import SectionHeader from "../ui/SectionHeader";

// ANYUKA-BARÁT PRESETEK: Nincs ml matekozás, tiszta hétköznapi mértékek
const DRINKS = [
  {
    id: "water_glass",
    name: "Tiszta víz",
    icon: "💧",
    btnLabel: "+ 1 pohár",
    ml: 250,
    delta: {},
    sugar: 0,
    desc: "0 kalória, tiszta hidratáció",
  },
  {
    id: "water_bottle",
    name: "Kulacs víz",
    icon: "🚰",
    btnLabel: "+ 1 kulacs",
    ml: 500,
    delta: {},
    sugar: 0,
    desc: "0 kalória, fél liter pipa",
  },
  {
    id: "coffee",
    name: "Fekete kávé / Tea",
    icon: "☕",
    btnLabel: "+ 1 bögre",
    ml: 150,
    delta: {},
    sugar: 0,
    desc: "Cukormentes frissítő",
  },
  {
    id: "zero",
    name: "Zero üdítő",
    icon: "🥤",
    btnLabel: "+ 1 pohár",
    ml: 250,
    delta: {},
    sugar: 0,
    desc: "0g cukor, nem bántja a keretet",
  },
  {
    id: "latte",
    name: "Tejeskávé / Cappuccino / Latte",
    icon: "☕🥛",
    btnLabel: "+ 1 bögre",
    ml: 200,
    delta: { carb: 0.5, fat: 0.5 },
    sugar: 10,
    desc: "-0.5 M szénhidrát | -0.5 H zsír",
  },
  {
    id: "soda",
    name: "Cukros üdítő / Szörp / Gyümölcslé",
    icon: "🧃",
    btnLabel: "+ 1 pohár",
    ml: 250,
    delta: { carb: 1 },
    sugar: 28,
    desc: "-1 Marék szénhidrát a tányérodról!",
    warning: true,
  },
  {
    id: "alcohol",
    name: "Alkohol (Bor, Fröccs, Sör)",
    icon: "🍷",
    btnLabel: "+ 1 pohár",
    ml: -150, // Dehidratál
    delta: { carb: 1.5 },
    sugar: 8,
    desc: "-1.5 Marék szénhidrát (Dehidratál!)",
    warning: true,
  },
];

export default function HydrationEngine() {
  const { profile, log, logDrink, hydrationTargetMl } = useFitAnya();
  const [lastLoggedText, setLastLoggedText] = useState(null);

  const handleDrinkClick = (drink) => {
    logDrink({
      name: drink.name,
      ml: drink.ml,
      delta: drink.delta,
      sugarGrams: drink.sugar,
    });

    setLastLoggedText(`✓ Rögzítve: ${drink.name}`);
    setTimeout(() => setLastLoggedText(null), 2000);
  };

  const currentMl = Math.max(0, log.waterMl || 0);
  const pct = Math.min(100, Math.round((currentMl / hydrationTargetMl) * 100));
  const sugarTotal = log.sugarGrams || 0;
  const sugarCubes = Math.round(sugarTotal / 3.5);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <SectionHeader
        title="Folyadék & Rejtett Kalóriák"
        subtitle={`Személyes célod: ${(hydrationTargetMl / 1000).toFixed(1)} liter tiszta víz naponta${
          profile.breastfeeding ? " (szoptatási védelemmel)" : ""
        }`}
        icon={Droplet}
      />

      {/* VIZUÁLIS POHÁR */}
      <div
        className="rounded-3xl p-5 flex flex-col items-center select-none bg-white border border-[#F5EBE6] shadow-xs"
      >
        <div className="relative w-24 h-36 mb-3">
          <div
            className="absolute inset-0 rounded-b-3xl rounded-t-xl overflow-hidden shadow-inner border-2 border-[#F0DCD4] bg-[#FFF9F5]"
          >
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out"
              style={{
                height: `${pct}%`,
                background:
                  pct >= 100
                    ? "linear-gradient(180deg, #7C9885 0%, #5E7A67 100%)"
                    : "linear-gradient(180deg, #E68C6F 0%, #E07A5F 100%)",
                opacity: 0.85,
              }}
            />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-2xl font-bold tracking-tight"
              style={{
                color: pct > 45 ? "#FFFFFF" : "#2D3748",
                fontFamily: serif,
                textShadow: pct > 45 ? "0 1px 3px rgba(0,0,0,0.25)" : "none",
              }}
            >
              {pct}%
            </span>
          </div>
        </div>

        <p
          className="text-base font-semibold mb-1 text-stone-800"
          style={{ fontFamily: serif }}
        >
          {(currentMl / 1000).toFixed(2)} liter / {(hydrationTargetMl / 1000).toFixed(1)} liter
        </p>

        {lastLoggedText ? (
          <p className="text-xs font-bold text-[#7C9885] animate-in fade-in">
            {lastLoggedText}
          </p>
        ) : (
          <p className="text-[11px] text-stone-400">
            {pct >= 100 ? "🌸 Fantasztikus vagy, a mai cél lehozva!" : "Minden korty számít a fejfájás ellen"}
          </p>
        )}
      </div>

      {/* REJTETT CUKOR VISSZAJELZŐ DOBOZ */}
      {sugarTotal > 0 && (
        <div className="rounded-2xl p-3.5 bg-[#FFF5F2] border border-[#F5D5C8] flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center font-bold text-sm shrink-0">
              🍬
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D3748]">
                Ma megivott felesleges cukor: <span className="text-[#C3634C]">{sugarTotal} g</span>
              </p>
              <p className="text-[11px] text-[#6B5A52]">
                Ez kb. <strong>{sugarCubes} darab kockacukornak</strong> felel meg!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ITALOK LISTÁJA */}
      <div className="bg-white rounded-3xl p-4 border border-[#F5EBE6] shadow-xs select-none">
        <p className="text-xs font-bold text-stone-700 mb-3 uppercase tracking-wider">
          Mit ittál épp? (Koppints a rögzítéshez)
        </p>

        <div className="space-y-2">
          {DRINKS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => handleDrinkClick(d)}
              className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all active:scale-98 ${
                d.warning
                  ? "border-[#F5D5C8] bg-[#FFFBF9] hover:bg-[#FFF5F0]"
                  : "border-[#F5EBE6] bg-[#FFFDFB] hover:bg-[#FFF9F5]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span className="text-lg shrink-0">{d.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-800 truncate">{d.name}</p>
                  <p className="text-[10px] text-stone-400 font-medium truncate">{d.desc}</p>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border shrink-0 shadow-xs ${
                  d.warning
                    ? "bg-[#FFF3EE] border-[#E07A5F] text-[#C3634C]"
                    : "bg-white border-[#F0DCD4] text-[#E07A5F]"
                }`}
              >
                {d.btnLabel}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
