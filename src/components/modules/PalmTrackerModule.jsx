import React, { useState } from "react";
import { Utensils, Search } from "lucide-react";
import { C } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";
import SectionHeader from "../ui/SectionHeader";
import TrackerHeader from "../ui/TrackerHeader";
import { DISHES } from "../../utils/dishes";

export default function PalmTrackerModule() {
  const { logPortion } = useFitAnya();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [logged, setLogged] = useState(false);

  const visibleDishes = Object.keys(DISHES).filter((d) => d.toLowerCase().includes(query.toLowerCase()));

  const handleLog = () => {
    if (!selected) return;
    logPortion(DISHES[selected].delta);
    setLogged(true);
    setTimeout(() => setLogged(false), 2200);
  };

  return (
    <div>
      <SectionHeader
        title="Napi Tenyér-Tracker"
        subtitle="Konyhamérleg nélkül — a családi fazékból a te tányérodra."
        icon={Utensils}
      />
      <TrackerHeader />

      <div className="rounded-3xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: C.textSoft }}>
          <Search size={13} /> Mit eszel a családdal?
        </label>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          placeholder="pl. Bolognai, Húsleves, Pörkölt…"
          className="w-full text-sm outline-none bg-transparent border-b pb-2 mb-2"
          style={{ color: C.textDark, borderColor: C.border }}
        />

        <div className="flex flex-col gap-1.5 mb-3">
          {visibleDishes.map((d) => (
            <button
              key={d}
              onClick={() => setSelected(d)}
              className="text-left text-sm px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
              style={
                selected === d
                  ? { backgroundColor: C.sageSoft, color: C.textDark, fontWeight: 600 }
                  : { backgroundColor: C.cardAlt, color: C.textDark }
              }
            >
              {d}
            </button>
          ))}
        </div>

        {selected && (
          <div className="rounded-2xl p-3.5 mb-3" style={{ backgroundColor: "#FFF9F5", border: `1px solid ${C.border}` }}>
            <p className="text-xs font-semibold mb-1" style={{ color: C.coralDeep }}>
              Így szedd ki a tányérodra (20 mp):
            </p>
            <p className="text-sm leading-relaxed" style={{ color: C.textDark }}>
              {DISHES[selected].text}
            </p>
          </div>
        )}

        <button
          disabled={!selected}
          onClick={handleLog}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 cursor-pointer shadow-sm"
          style={{ backgroundColor: C.coral }}
        >
          Ezt ettem — Levonás a keretből
        </button>
        {logged && (
          <p className="text-xs mt-2 text-center font-medium" style={{ color: C.sageText }}>
            Levonva a mai keretedből ✓
          </p>
        )}
      </div>
    </div>
  );
}
