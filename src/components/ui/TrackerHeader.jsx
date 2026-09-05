import React from "react";
import { Utensils, Leaf, Wheat, Flame, RotateCcw, Check } from "lucide-react";
import { useFitAnya } from "../../context/FitAnyaContext";

export default function TrackerHeader() {
  const { profile, log, resetDay } = useFitAnya();

  const cards = [
    {
      key: "protein",
      Icon: Utensils,
      label: "Tenyér fehérje",
      unit: "tenyér",
      consumed: log?.protein || 0,
      target: profile?.palmProtein || 2,
      color: "#E07A5F",
      bgColor: "#FFF5F0",
      borderColor: "#F7DFD6",
    },
    {
      key: "veg",
      Icon: Leaf,
      label: "Ököl rost",
      unit: "ököl",
      consumed: log?.veg || 0,
      target: profile?.fistVeg || 3,
      color: "#7C9885",
      bgColor: "#F3F7F4",
      borderColor: "#DCE7E0",
    },
    {
      key: "carb",
      Icon: Wheat,
      label: "Marék szénhidrát",
      unit: "marék",
      consumed: log?.carb || 0,
      target: profile?.cuppedCarb || 5,
      color: "#D4984F",
      bgColor: "#FCF8F0",
      borderColor: "#F4EBD8",
    },
    {
      key: "fat",
      Icon: Flame,
      label: "Hüvelykujj zsír",
      unit: "hüvelyk",
      consumed: log?.fat || 0,
      target: profile?.thumbFat || 3,
      color: "#C3634C",
      bgColor: "#FFF3F0",
      borderColor: "#F7DBD4",
    },
  ];

  return (
    <div className="mb-4">
      {/* CÍMSOR ÉS DISZKRÉT ÚJ NAP GOMB */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <span className="text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
          Mai Tenyér-Egyensúlyod
        </span>
        <button
          type="button"
          onClick={resetDay}
          title="Mai nap nullázása"
          className="text-[11px] text-stone-400 hover:text-[#E07A5F] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RotateCcw size={11} /> Új nap
        </button>
      </div>

      {/* A 4 LÁGY STÁTUSZKÁRTYA GOMBOK NÉLKÜL */}
      <div className="grid grid-cols-2 gap-2.5">
        {cards.map(({ key, Icon, label, unit, consumed, target, color, bgColor, borderColor }) => {
          const percent = Math.min(100, Math.round((consumed / target) * 100)) || 0;
          const isFull = consumed >= target;

          return (
            <div
              key={key}
              className="bg-white rounded-2xl p-3 shadow-xs border transition-all flex flex-col justify-between"
              style={{ borderColor }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: bgColor, color }}
                  >
                    <Icon size={13} />
                  </div>
                  <span className="text-[11px] font-medium text-stone-600 truncate">
                    {label}
                  </span>
                </div>

                {isFull && (
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </div>

              {/* SZÁMOK ÉS MÉRTÉKEGYSÉG */}
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-base font-bold text-stone-800">
                  {consumed}
                </span>
                <span className="text-xs text-stone-400 font-normal">
                  / {target} {unit}
                </span>
              </div>

              {/* DISZKRÉT HALADÁSI CSÍK */}
              <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
