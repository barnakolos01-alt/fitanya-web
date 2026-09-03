import React, { useState } from "react";
import { FitAnyaProvider } from "./context/FitAnyaContext";
import { C, serif, sans } from "./styles/tokens";
import CravingCopilot from "./components/modules/CravingCopilot";
import PalmTrackerModule from "./components/modules/PalmTrackerModule";
import EveningRescue from "./components/modules/EveningRescue";
import HydrationEngine from "./components/modules/HydrationEngine";

const MODULES = [
  { key: "craving", label: "Tűzoltó", Comp: CravingCopilot },
  { key: "tracker", label: "Tenyér-Tracker", Comp: PalmTrackerModule },
  { key: "evening", label: "Esti Zárás", Comp: EveningRescue },
  { key: "hydration", label: "Víz", Comp: HydrationEngine },
];

export default function App() {
  const [tab, setTab] = useState("craving");
  const Active = MODULES.find((m) => m.key === tab).Comp;

  return (
    <FitAnyaProvider>
      <div className="max-w-md mx-auto min-h-screen pb-12 relative" style={{ backgroundColor: C.bg, fontFamily: sans }}>
        <style>{`
          @keyframes fitanya-fade { from{opacity:0; transform:translateY(4px);} to{opacity:1; transform:translateY(0);} }
        `}</style>

        <header className="px-5 pt-6 pb-4 flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: serif, color: C.textDark }} className="text-xl font-bold">
              FitAnya Zsebedző
            </h1>
            <p className="text-xs" style={{ color: C.textSoft }}>
              Konyhamérleg nélkül, a család ritmusában
            </p>
          </div>
        </header>

        <div className="px-5 flex gap-1.5 mb-6 overflow-x-auto pb-1 select-none">
          {MODULES.map((m) => (
            <button
              key={m.key}
              onClick={() => setTab(m.key)}
              className="flex-shrink-0 text-xs font-semibold px-4 py-2.5 rounded-full transition-all cursor-pointer"
              style={
                tab === m.key
                  ? { backgroundColor: C.coral, color: "#fff", boxShadow: "0 4px 12px -2px rgba(224,122,95,0.4)" }
                  : { backgroundColor: C.cardAlt, color: C.textSoft, border: `1px solid ${C.border}` }
              }
            >
              {m.label}
            </button>
          ))}
        </div>

        <main className="px-5">
          <Active />
        </main>
      </div>
    </FitAnyaProvider>
  );
}
