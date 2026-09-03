import React, { useState } from "react";
import { Moon, CheckCircle2 } from "lucide-react";
import { C } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";
import SectionHeader from "../ui/SectionHeader";
import { RESCUE_OPTIONS } from "../../utils/rescueOptions";

export default function EveningRescue() {
  const { remaining, logPortion } = useFitAnya();
  const [simEvening, setSimEvening] = useState(true);
  const [hungryNow, setHungryNow] = useState(false);
  const [logged, setLogged] = useState("");

  // PRODUCTION: const isEvening = new Date().getHours() >= 20;
  const isEvening = simEvening;
  const hasCapacity = remaining.protein > 0 || remaining.fat > 0;
  const showRescue = isEvening && (hasCapacity || hungryNow);

  const handleLog = (opt) => {
    logPortion(opt.delta);
    setLogged(opt.title);
    setTimeout(() => setLogged(""), 2200);
  };

  return (
    <div>
      <SectionHeader
        title="Esti Keretzáró"
        subtitle="Este 8 után tör rád az éhség? Nem rontottál el semmit."
        icon={Moon}
      />

      <button
        onClick={() => setSimEvening((v) => !v)}
        className="text-xs mb-4 px-3 py-1.5 rounded-full cursor-pointer"
        style={
          simEvening
            ? { backgroundColor: C.coral, color: "#fff" }
            : { backgroundColor: C.cardAlt, color: C.textSoft, border: `1px solid ${C.border}` }
        }
      >
        {simEvening ? "Szimuláció: Esti üzemmód aktív ✓" : "Szimuláció: Nappal"}
      </button>

      {isEvening && !showRescue && (
        <div className="rounded-3xl p-4" style={{ backgroundColor: C.sageSoft }}>
          <p className="text-sm leading-relaxed mb-3" style={{ color: C.textDark }}>
            Mára a szükséges tápanyagok lefedve! Ha mégis úgy érzed, hogy enned kell, gyakran az
            alváshiány vagy a folyadékhiány tréfál meg: igyál meg 3 dl meleg teát vagy vizet. Ha 15
            perc múlva is éhes vagy, nyugodtan válassz egy kímélő opciót.
          </p>
          <button
            onClick={() => setHungryNow(true)}
            className="text-xs font-medium px-4 py-2 rounded-2xl cursor-pointer"
            style={{ backgroundColor: "#fff", color: C.coralDeep, border: `1px solid ${C.border}` }}
          >
            Még mindig éhes vagyok
          </button>
        </div>
      )}

      {showRescue && (
        <div>
          <p className="text-sm leading-relaxed mb-3" style={{ color: C.textSoft }}>
            {remaining.protein > 0
              ? `Még maradt ${remaining.protein} tenyérnyi fehérje-kereted!`
              : "Válassz egy könnyű, gyomrot nem terhelő esti lezárót:"}
          </p>
          <div className="flex flex-col gap-2.5">
            {RESCUE_OPTIONS.map((opt) => (
              <div
                key={opt.title}
                className="rounded-2xl p-3.5 flex items-start justify-between gap-3"
                style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
              >
                <p className="text-sm leading-relaxed" style={{ color: C.textDark }}>
                  {opt.title}
                </p>
                <button
                  onClick={() => handleLog(opt)}
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

      {logged && (
        <div
          className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-2xl mt-3"
          style={{ backgroundColor: C.sageSoft, color: C.sageText }}
        >
          <CheckCircle2 size={14} /> Naplózva: {logged}
        </div>
      )}
    </div>
  );
}
