import React, { useState } from "react";
import { Sparkles, RefreshCw, CheckCircle2, UtensilsCrossed, Coffee, Loader2, Send, AlertCircle } from "lucide-react";
import { C, serif } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";

const PANTRY = {
  protein: [
    "2 szelet pulyka- vagy csirkemellsonka",
    "2 db főtt tojás vagy tükörtojás",
    "4-5 ek zsírszegény túró vagy cottage cheese",
    "1 kis doboz natúr tonhalkonzerv",
    "1 kis doboz görög joghurt (150g)",
  ],
  veg: [
    "1 db felkarikázott kígyóuborka",
    "Nagy marék ropogós csemegeuborka",
    "2 marék édes koktélparadicsom",
    "1 db kaliforniai paprika csíkokra vágva",
    "2 marék bébispenót vagy friss saláta",
  ],
  carb: [
    "1 szelet teljes kiőrlésű vagy rozskenyér",
    "1 szelet fehér kenyér",
    "3-4 db natúr puffasztott rizs",
    "1 kis tortilla lap",
  ],
  fat: [
    "1 tk vaj vagy natúr vajkrém",
    "1 ek olívaolaj a zöldségekre",
    "1 pici marék mandula vagy dió (5-6 szem)",
    "1 vékony szelet sajt",
  ],
};

export default function InteractivePlateBuilder() {
  const { remaining, logPortion } = useFitAnya();
  const [isOpen, setIsOpen] = useState(false);
  const [logged, setLogged] = useState(false);

  // Aktuális tányér tételei
  const [plate, setPlate] = useState({
    protein: PANTRY.protein[0],
    veg: PANTRY.veg[0],
    carb: PANTRY.carb[0],
    fat: PANTRY.fat[0],
  });

  // AI csere állapotai
  const [swapInput, setSwapInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiComment, setAiComment] = useState(null);
  const [aiError, setAiError] = useState(null);

  const isZeroRemaining =
    remaining.protein <= 0 && remaining.veg <= 0 && remaining.carb <= 0;

  // Gyors offline csere
  const cycleItem = (macro) => {
    const list = PANTRY[macro];
    const currentIdx = list.indexOf(plate[macro]);
    const nextIdx = (currentIdx + 1) % list.length;
    setPlate((prev) => ({ ...prev, [macro]: list[nextIdx] }));
    setAiComment(null);
    setAiError(null);
  };

  // AI csere kezelése golyóálló hibatűréssel
  const handleAiSwap = async (e) => {
    e.preventDefault();
    if (!swapInput.trim() || aiLoading) return;

    setAiLoading(true);
    setAiComment(null);
    setAiError(null);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "plate_swap",
          input: swapInput.trim(),
          remaining: remaining,
          currentPlate: plate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hiba a csere során.");

      const raw = (data.reply || "").trim();
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");

      // Ha sikerült JSON-t fogni a válaszból
      if (start !== -1 && end !== -1) {
        try {
          const jsonStr = raw.substring(start, end + 1);
          const parsed = JSON.parse(jsonStr);

          setPlate((prev) => ({
            protein: parsed.protein?.trim() || prev.protein,
            veg: parsed.veg?.trim() || prev.veg,
            carb: parsed.carb?.trim() || prev.carb,
            fat: parsed.fat?.trim() || prev.fat,
          }));

          if (parsed.comment) setAiComment(parsed.comment);
          setSwapInput("");
        } catch {
          // Ha sérült a JSON, a szöveget írjuk ki és okosan cserélünk
          handleFallbackSwap(swapInput, raw);
        }
      } else {
        // Ha sima beszélgetős választ adott a Claude
        handleFallbackSwap(swapInput, raw);
      }
    } catch (err) {
      setAiError(err.message || "Nem sikerült a csere, próbáld újra!");
    } finally {
      setAiLoading(false);
    }
  };

  // Tartalék csere logika, ha az AI nem JSON formátumban válaszolna
  const handleFallbackSwap = (userInput, aiText) => {
    const lower = userInput.toLowerCase();
    setPlate((prev) => {
      const updated = { ...prev };
      if (lower.includes("fehér") && lower.includes("kenyér")) {
        updated.carb = "1 szelet fehér kenyér";
      } else if (lower.includes("tojás")) {
        updated.protein = "2 db tükörtojás vagy főtt tojás";
      } else if (lower.includes("túró")) {
        updated.protein = "4-5 ek zsírszegény túró";
      }
      return updated;
    });

    setAiComment(aiText.replace(/[\{\}\[\]"]/g, "").trim());
    setSwapInput("");
  };

  const handleLogMeal = () => {
    const delta = {
      protein: remaining.protein > 0 ? remaining.protein : 0,
      veg: remaining.veg > 0 ? remaining.veg : 0,
      carb: remaining.carb > 0 ? remaining.carb : 0,
      fat: remaining.fat > 0 ? remaining.fat : 0,
    };

    const selectedItems = [];
    if (remaining.protein > 0) selectedItems.push(plate.protein);
    if (remaining.veg > 0) selectedItems.push(plate.veg);
    if (remaining.carb > 0) selectedItems.push(plate.carb);
    if (remaining.fat > 0) selectedItems.push(plate.fat);

    logPortion(delta, `Gyors Tányér: ${selectedItems.slice(0, 2).join(", ")}`);
    setLogged(true);
    setTimeout(() => {
      setLogged(false);
      setIsOpen(false);
    }, 1800);
  };

  return (
    <div className="mt-5 mb-3">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full p-4 rounded-3xl border border-[#F0DCD4] bg-[#FFF9F5] text-left flex items-center justify-between hover:bg-[#FDE8E1] transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center shrink-0">
              <UtensilsCrossed size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D3748]">
                Mit ehetek még ma?
              </p>
              <p className="text-[11px] text-[#6B5A52]">
                Interaktív tányérépítő a hiányzó keretedből
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#E07A5F] px-2.5 py-1 rounded-xl bg-white border border-[#F0DCD4]">
            Megnyitás
          </span>
        </button>
      ) : (
        <div
          className="rounded-3xl p-5 border animate-in fade-in duration-200"
          style={{ backgroundColor: C.card, borderColor: C.border }}
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center">
                <UtensilsCrossed size={14} />
              </div>
              <h3 style={{ fontFamily: serif }} className="text-sm font-bold text-stone-800">
                Mit ehetek még ma?
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              Bezárás
            </button>
          </div>

          {/* HA BETELT A NAPI KERET */}
          {isZeroRemaining ? (
            <div className="p-4 rounded-2xl bg-[#FDF6F0] border border-[#F5D8C7] text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-white text-[#E07A5F] flex items-center justify-center mx-auto shadow-sm">
                <Coffee size={20} />
              </div>
              <h4 style={{ fontFamily: serif }} className="font-bold text-sm text-stone-800">
                Mára a konyha bezárt! 🎉
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed max-w-xs mx-auto">
                A mai keretedet maradéktalanul lehoztad, a tested mindent megkapott. Ez most fáradtság, nem éhség!
              </p>
              <p className="text-[11px] font-semibold text-[#C3634C] bg-white py-2 px-3 rounded-xl border border-[#F5D8C7] inline-block">
                Tipp: Igyál meg egy nagy bögre citromfű teát, és pihenj!
              </p>
            </div>
          ) : (
            /* HA VAN MÉG HIÁNYZÓ KERET */
            <div className="space-y-3">
              {/* FEHÉRJE */}
              {remaining.protein > 0 && (
                <div className="p-3 bg-[#FFFDFB] border border-[#F0DCD4] rounded-2xl flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-[#E07A5F] tracking-wide block">
                      🖐️ {remaining.protein} Tenyér Fehérje
                    </span>
                    <p className="text-xs font-semibold text-stone-800 mt-0.5 leading-snug break-words">
                      {plate.protein}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cycleItem("protein")}
                    className="shrink-0 px-2.5 py-1.5 rounded-xl bg-stone-50 hover:bg-[#FDE8E1] text-[#E07A5F] text-[11px] font-bold border border-stone-200 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw size={11} /> Csere
                  </button>
                </div>
              )}

              {/* ROST */}
              {remaining.veg > 0 && (
                <div className="p-3 bg-[#FFFDFB] border border-[#F0DCD4] rounded-2xl flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-[#7C9885] tracking-wide block">
                      ✊ {remaining.veg} Ököl Rost
                    </span>
                    <p className="text-xs font-semibold text-stone-800 mt-0.5 leading-snug break-words">
                      {plate.veg}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cycleItem("veg")}
                    className="shrink-0 px-2.5 py-1.5 rounded-xl bg-stone-50 hover:bg-[#E8F0EA] text-[#7C9885] text-[11px] font-bold border border-stone-200 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw size={11} /> Csere
                  </button>
                </div>
              )}

              {/* SZÉNHIDRÁT */}
              {remaining.carb > 0 && (
                <div className="p-3 bg-[#FFFDFB] border border-[#F0DCD4] rounded-2xl flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wide block">
                      🤲 {remaining.carb} Marék Szénhidrát
                    </span>
                    <p className="text-xs font-semibold text-stone-800 mt-0.5 leading-snug break-words">
                      {plate.carb}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cycleItem("carb")}
                    className="shrink-0 px-2.5 py-1.5 rounded-xl bg-stone-50 hover:bg-amber-50 text-amber-700 text-[11px] font-bold border border-stone-200 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw size={11} /> Csere
                  </button>
                </div>
              )}

              {/* ZSÍR */}
              {remaining.fat > 0 && (
                <div className="p-3 bg-[#FFFDFB] border border-[#F0DCD4] rounded-2xl flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-stone-600 tracking-wide block">
                      👍 {remaining.fat} Hüvelykujj Zsír
                    </span>
                    <p className="text-xs font-semibold text-stone-800 mt-0.5 leading-snug break-words">
                      {plate.fat}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cycleItem("fat")}
                    className="shrink-0 px-2.5 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-600 text-[11px] font-bold border border-stone-200 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw size={11} /> Csere
                  </button>
                </div>
              )}

              {/* AI HŰTŐ-CSERE BEVITELI MEZŐ */}
              <form onSubmit={handleAiSwap} className="mt-2 pt-2 border-t border-stone-100">
                <label className="text-[11px] font-medium text-stone-600 mb-1.5 block">
                  Más van otthon? Írd be az AI-nak (pl. <em>„nincs rozskenyér, csak fehér”</em>):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={swapInput}
                    onChange={(e) => setSwapInput(e.target.value)}
                    placeholder="Írd ide, mi van a hűtődben..."
                    className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-[#E07A5F]"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !swapInput.trim()}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
                    style={{ backgroundColor: C.coral }}
                  >
                    {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>Csere</span>
                  </button>
                </div>
              </form>

              {aiComment && (
                <div className="text-[11px] font-medium text-[#C3634C] bg-[#FFF9F5] p-2.5 rounded-xl border border-[#F0DCD4] animate-in fade-in leading-relaxed">
                  💡 {aiComment}
                </div>
              )}

              {aiError && (
                <div className="text-[11px] font-medium text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* RÖGZÍTÉS GOMB */}
              <button
                type="button"
                onClick={handleLogMeal}
                className="w-full mt-2 py-3 rounded-2xl font-bold text-xs text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                style={{ backgroundColor: C.coral }}
              >
                <Sparkles size={14} /> Ezt eszem — Levonás a keretből
              </button>

              {logged && (
                <p className="text-xs text-center font-semibold text-[#7C9885] flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} /> Szuper, levonva a keretedből és rögzítve a naplóban!
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
