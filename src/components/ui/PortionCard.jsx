import React from "react";
import { Plus, Minus } from "lucide-react";
import { C, serif } from "../../styles/tokens";

export default function PortionCard({
  icon: Icon,
  label,
  unit,
  consumed,
  target,
  onIncrement,
  onDecrement,
}) {
  const pct = Math.min(100, Math.round((consumed / target) * 100));

  return (
    <div
      className="rounded-2xl p-3 flex flex-col justify-between"
      style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
    >
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Icon size={14} style={{ color: C.coralDeep }} />
          <span className="text-[11px] font-medium truncate" style={{ color: C.textSoft }}>
            {label}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 mb-2">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: C.textDark, fontFamily: serif }}
          >
            {consumed % 1 === 0 ? consumed : consumed.toFixed(1)} / {target} {unit}
          </p>

          {/* GYORSLÉPTETŐ GOMBOK */}
          {(onIncrement || onDecrement) && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onDecrement}
                disabled={consumed <= 0}
                className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-600 disabled:opacity-25 flex items-center justify-center transition-all cursor-pointer"
                title="1 adag levonása"
              >
                <Minus size={11} />
              </button>
              <button
                type="button"
                onClick={onIncrement}
                className="w-6 h-6 rounded-lg text-white active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                style={{ backgroundColor: C.coral }}
                title="1 adag hozzáadása"
              >
                <Plus size={11} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.cardAlt }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? C.coralDeep : C.sage }}
        />
      </div>
    </div>
  );
}
