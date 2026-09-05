import React, { useState, useRef } from "react";
import {
  Sparkles,
  CheckCircle2,
  Coffee,
  Loader2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { C, serif } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";

export default function InteractivePlateBuilder() {
  const { remaining, logPortion, consumeAiCredit } = useFitAnya();
  const [cravingInput, setCravingInput] = useState("");
  const [activeHack, setActiveHack] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [logged, setLogged] = useState(false);

  const inputRef = useRef(null);

  const isZeroRemaining =
    remaining.protein <= 0 &&
    remaining.veg <= 0 &&
    remaining.carb <= 0 &&
    remaining.fat <= 0;

  const handleAskHack = async (e) => {
    if (e) e.preventDefault();
    const query = cravingInput.trim();
    if (!query || aiLoading) return;

    if (!consumeAiCredit()) return;

    setAiLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/craving-hack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          craving: query,
          remaining: remaining,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.hack) {
        setActiveHack(data.hack);
      } else {
        setErrorMessage(data.error || "Nem sikerült az AI elemzés. Kérlek próbáld újra!");
      }
    } catch (err) {
      setErrorMessage("Hálózati hiba történt az AI hívásakor.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogHack = () => {
    if (!activeHack) return;

    logPortion(activeHack.delta, `Sóvárgás-mentő: ${activeHack.title}`);
    setLogged(true);
    setTimeout(() => {
      setLogged(false);
    }, 2200);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. FEJLÉC ÉS AKTUÁLIS KERET */}
      <div className="bg-white rounded-3xl p-4 shadow-xs border border-[#F5EBE6]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-8 h-8 rounded-xl bg-[#FFF5F0] text-[#E07A5F] flex items-center justify-center text-base">
            ✨
          </span>
          <div>
            <h2 style={{ fontFamily: serif }} className="text-base font-bold text-stone-800">
              Mit ehetek még ma?
            </h2>
            <p className="text-[11px] text-stone-500">
              Mit kívánsz most? Átalakítjuk a mai keretedre szabva!
            </p>
          </div>
        </div>

        {/* HÁTRALÉVŐ KERET MEGJELENÍTÉSE */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
          <span className="text-[11px] font-semibold text-stone-500">Mai hiányzó kereted:</span>
          <div className="flex items-center gap-2 font-bold text-[11px]">
            <span className="text-[#E07A5F]" title="Fehérje">🖐️ {Math.max(0, remaining.protein)} T</span>
            <span className="text-[#7C9885]" title="Rost">✊ {Math.max(0, remaining.veg)} Ö</span>
            <span className="text-[#D4984F]" title="Szénhidrát">🤲 {Math.max(0, remaining.carb)} M</span>
            <span className="text-[#C3634C]" title="Zsír">👍 {Math.max(0, remaining.fat)} H</span>
          </div>
        </div>
      </div>

      {isZeroRemaining ? (
        <div className="p-6 rounded-3xl bg-[#FDF6F0] border border-[#F5D8C7] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white text-[#E07A5F] flex items-center justify-center mx-auto shadow-xs">
            <Coffee size={24} />
          </div>
          <h4 style={{ fontFamily: serif }} className="font-bold text-base text-stone-800">
            Mára a konyha bezárt! 🎉
          </h4>
          <p className="text-xs text-stone-600 leading-relaxed max-w-xs mx-auto">
            A mai tányérod 100%-os egyensúlyban van, a tested minden tápanyagot megkapott. Ez most fáradtság, nem éhség!
          </p>
          <p className="text-xs font-semibold text-[#C3634C] bg-white py-2 px-3 rounded-xl border border-[#F5D8C7] inline-block">
            🌸 Főzz egy meleg citromfű teát, és pihenj!
          </p>
        </div>
      ) : (
        <>
          {/* 2. VALÓDI AI KERESŐ */}
          <div className="bg-white rounded-3xl p-4 shadow-xs border border-[#F5EBE6]">
            <form onSubmit={handleAskHack}>
              <label className="text-xs font-bold text-stone-700 mb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#E07A5F]" /> Mit ennél vagy kívánsz most leginkább?
              </label>

              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={cravingInput}
                  onChange={(e) => setCravingInput(e.target.value)}
                  placeholder="pl. Pizza, Tészta, Nutellás toast, Gyros, Chips..."
                  className="flex-1 px-4 py-3 bg-[#FFFDFB] border border-[#F0DCD4] rounded-2xl text-xs outline-none focus:border-[#E07A5F] transition-all text-stone-800 placeholder-stone-400"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !cravingInput.trim()}
                  className="px-4 py-3 rounded-2xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-xs active:scale-98 transition-all"
                  style={{ backgroundColor: C.coral }}
                >
                  {aiLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Tervezés...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Átalakítás</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {errorMessage && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle size={13} /> {errorMessage}
              </p>
            )}
          </div>

          {/* 3. ALAPÉRTELMEZETT SEGÍTŐ KÁRTYA */}
          {!activeHack && !aiLoading && (
            <div className="p-4 rounded-3xl bg-[#FFFDFB] border border-dashed border-[#F0DCD4] text-center space-y-2 animate-in fade-in">
              <span className="w-9 h-9 mx-auto rounded-full bg-[#FFF5F0] text-[#E07A5F] flex items-center justify-center text-sm">
                💡
              </span>
              <p className="text-xs font-bold text-stone-700">
                A Claude AI a mai keretedre szabja a vacsorád
              </p>
              <p className="text-[11px] text-stone-500 leading-relaxed max-w-xs mx-auto">
                Írd be, mi után sóvárogsz, és az AI megnézi, miből mennyi maradt mára (pl. ha már nincs szénhidrátod, alacsony CH trükköt ad).
              </p>
            </div>
          )}

          {/* 4. A GENERÁLT FITANYA HACK */}
          {activeHack && (
            <div className="bg-[#FFFDFB] rounded-3xl p-5 border border-[#F0DCD4] shadow-xs animate-in fade-in space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#E07A5F] uppercase tracking-wider bg-[#FFF2EB] px-2.5 py-0.5 rounded-md">
                    ✨ Keretedre szabott Hack
                  </span>
                  <span className="text-[11px] font-medium text-stone-400 flex items-center gap-1">
                    <Clock size={12} /> {activeHack.time || "6-8 perc"}
                  </span>
                </div>
                <h3 style={{ fontFamily: serif }} className="text-base font-bold text-stone-800 mt-1">
                  {activeHack.title}
                </h3>
                {activeHack.why && (
                  <p className="text-xs text-stone-600 mt-1.5 leading-relaxed italic bg-white p-2.5 rounded-xl border border-[#F5EBE6]">
                    "{activeHack.why}"
                  </p>
                )}
              </div>

              {/* LÉPÉSEK */}
              {activeHack.steps && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-stone-700">Gyors elkészítés:</p>
                  <ol className="space-y-1.5 text-xs text-stone-700 pl-4 list-decimal">
                    {activeHack.steps.map((step, idx) => (
                      <li key={idx} className="leading-snug">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* PLUSZ TIPP A HIÁNYZÓ ROSTHOZ */}
              {activeHack.side && (
                <div className="text-[11px] text-[#42614E] bg-[#F3F7F4] p-2.5 rounded-xl border border-[#DCE7E0] leading-relaxed">
                  <strong>💡 FitAnya Trükk:</strong> {activeHack.side}
                </div>
              )}

              {/* MIT VON LE VIZUÁLISAN */}
              {activeHack.delta && (
                <div className="p-2.5 rounded-xl bg-white border border-[#F0DCD4] flex items-center justify-between text-[11px] text-stone-600">
                  <span className="font-semibold">Levonás a mai keretedből:</span>
                  <div className="flex gap-2 font-bold">
                    {activeHack.delta.protein > 0 && <span className="text-[#E07A5F]">🖐️ +{activeHack.delta.protein}</span>}
                    {activeHack.delta.veg > 0 && <span className="text-[#7C9885]">✊ +{activeHack.delta.veg}</span>}
                    {activeHack.delta.carb > 0 && <span className="text-[#D4984F]">🤲 +{activeHack.delta.carb}</span>}
                    {activeHack.delta.fat > 0 && <span className="text-[#C3634C]">👍 +{activeHack.delta.fat}</span>}
                  </div>
                </div>
              )}

              {/* LEVONÁS GOMB */}
              <button
                type="button"
                onClick={handleLogHack}
                className="w-full py-3 rounded-2xl font-bold text-xs text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                style={{ backgroundColor: C.coral }}
              >
                <CheckCircle2 size={15} /> Ezt készítem el — Levonás a keretemből
              </button>

              {logged && (
                <p className="text-xs text-center font-semibold text-[#7C9885] flex items-center justify-center gap-1 animate-in fade-in">
                  <CheckCircle2 size={13} /> Szuper, levonva a mai keretedből és beírva a naplódba!
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
