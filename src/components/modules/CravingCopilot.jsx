import React, { useState, useMemo } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { C } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";
import SectionHeader from "../ui/SectionHeader";
import { getSwaps } from "../../utils/cravingSwaps";

export default function CravingCopilot() {
  const { logPortion } = useFitAnya();
  const [text, setText] = useState("");
  const [mode, setMode] = useState(null);
  const [loggedMsg, setLoggedMsg] = useState("");

  const swaps = useMemo(() => getSwaps(text), [text]);

  const handleLog = (delta, label) => {
    logPortion(delta);
    setLoggedMsg(label);
    setTimeout(() => setLoggedMsg(""), 2200);
  };

  return (
    <div>
      <SectionHeader
        title="Sóvárgás- & Nasi-Tűzoltó"
        subtitle="Nincs tiltás vagy bűntudat, csak egy józan döntésmentő."
        icon={Sparkles}
      />

      <div className="rounded-3xl p-4 mb-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: C.textSoft }}>
          Mit kívánsz most éppen?
        </label>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setMode(null);
          }}
          placeholder="pl. Kinder Bueno, sós chips, pizza…"
          className="w-full text-sm outline-none bg-transparent border-b pb-2 mb-3"
          style={{ color: C.textDark, borderColor: C.border }}
        />

        {text.trim() && (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: C.textSoft }}>
              Fizikailag korog a gyomrod, vagy inkább fáradt / feszült vagy?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("hunger")}
                className="flex-1 py-2.5 rounded-2xl text-xs font-medium transition-all"
                style={
                  mode === "hunger"
                    ? { backgroundColor: C.coral, color: "#fff" }
                    : { backgroundColor: C.cardAlt, color: C.textDark, border: `1px solid ${C.border}` }
                }
              >
                Korog a gyomrom
              </button>
              <button
                onClick={() => setMode("stress")}
                className="flex-1 py-2.5 rounded-2xl text-xs font-medium transition-all"
                style={
                  mode === "stress"
                    ? { backgroundColor: C.coral, color: "#fff" }
                    : { backgroundColor: C.cardAlt, color: C.textDark, border: `1px solid ${C.border}` }
                }
              >
                Fáradt / feszült vagyok
              </button>
            </div>
          </div>
        )}
      </div>

      {mode === "hunger" && (
        <div className="rounded-3xl p-4 mb-3" style={{ backgroundColor: C.sageSoft, animation: "fitanya-fade 0.3s ease-out" }}>
          <p className="text-sm leading-relaxed mb-3" style={{ color: C.textDark }}>
            <strong>Ez valódi éhség — ne koplalj!</strong> Egyél belőle nyugodtan egy fél adagot, de
            előtte igyál meg 3 dl hideg vizet, és dobj be mellé egy falat fehérjét (pl. 2 kocka sajt
            vagy 2 kanál túró). Ez azonnal megfogja a vércukor-tüskét, és nem fogod kívánni a másik
            felét.
          </p>
          <button
            onClick={() => handleLog({ protein: 0.5 }, "Naplózva: fél adag + fehérje-puffer ✓")}
            className="text-xs font-medium px-4 py-2 rounded-2xl cursor-pointer"
            style={{ backgroundColor: "#fff", color: C.coralDeep, border: `1px solid ${C.border}` }}
          >
            Naplózom a napomba (fél adag + fehérje)
          </button>
        </div>
      )}

      {mode === "stress" && (
        <div className="mb-3">
          <p className="text-sm leading-relaxed mb-3" style={{ color: C.textSoft }}>
            Ilyenkor az agyad dopamint és pihenést keres, nem kalóriát. Válassz egy 2 perces
            alternatívát:
          </p>
          <div className="flex flex-col gap-2">
            {swaps.map((s) => (
              <div
                key={s.text}
                className="rounded-2xl p-3.5 flex items-start justify-between gap-3"
                style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
              >
                <p className="text-sm leading-relaxed" style={{ color: C.textDark }}>
                  {s.text}
                </p>
                <button
                  onClick={() => handleLog(s.delta, "Cserés falat naplózva ✓")}
                  className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer"
                  style={{ backgroundColor: C.sageSoft, color: C.sageText }}
                >
                  Ezt eszem
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loggedMsg && (
        <div
          className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-2xl"
          style={{ backgroundColor: C.sageSoft, color: C.sageText }}
        >
          <CheckCircle2 size={14} /> {loggedMsg}
        </div>
      )}
    </div>
  );
}
