import React from "react";
import { C, serif } from "../../styles/tokens";

export default function PortionCard({ icon: Icon, label, unit, consumed, target }) {
  const pct = Math.min(100, Math.round((consumed / target) * 100));
  return (
    <div className="rounded-2xl p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={14} style={{ color: C.coralDeep }} />
        <span className="text-[11px] font-medium truncate" style={{ color: C.textSoft }}>
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold mb-1.5" style={{ color: C.textDark, fontFamily: serif }}>
        {consumed % 1 === 0 ? consumed : consumed.toFixed(1)} / {target} {unit}
      </p>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.cardAlt }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? C.coralDeep : C.sage }}
        />
      </div>
    </div>
  );
}
