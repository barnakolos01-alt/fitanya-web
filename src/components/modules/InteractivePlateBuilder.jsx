import React, { useState } from "react";
import { Sparkles, RefreshCw, CheckCircle2, Moon, UtensilsCrossed, Coffee } from "lucide-react";
import { C, serif } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";

// Hétköznapi, 0 perc előkészületet igénylő magyar kamra- és hűtőkészlet
const PANTRY = {
  protein: [
    "2 szelet minőségi pulyka- vagy csirkemellsonka",
    "2 db főtt tojás vagy tükörtojás",
    "4-5 ek zsírszegény túró vagy cottage cheese",
    "1 kis doboz natúr tonhalkonzerv (lecsöpögtetve)",
    "1 kis doboz natúr görög joghurt (150g)",
    "100g tegnapi sült hús maradék felcsíkozva",
  ],
  veg: [
    "1 db felkarikázott kígyóuborka",
    "2 marék koktélparadicsom vagy 1 nagy paradicsom",
    "Nagy marék ropogós csemegeuborka vagy csalamádé",
    "1 db kaliforniai paprika csíkokra vágva",
    "2 marék bébispenót vagy madársaláta",
  ],
  carb: [
    "1 szelet teljes kiőrlésű vagy rozskenyér",
    "1 szelet kovászos fehér kenyér",
    "3-4 db natúr puffasztott rizs",
    "1 marék hűtőben maradt főtt rizs vagy burgonya",
    "1 db kis méretű tortilla lap",
  ],
  fat: [
    "1 tk vaj vagy natúr vajkrém a kenyérre",
    "1 ek olívaolaj a zöldségekre csurgatva",
    "Egy pici marék mandula vagy dió (5-6 szem)",
    "1 szelet trappista vagy mozzarella sajt",
  ],
};

export default function InteractivePlateBuilder() {
  const { remaining, logPortion } = useFitAnya();
  const [isOpen, setIsOpen] = useState(false);
  const [logged, setLogged] = useState(false);

  // Kiválasztott opciók indexei
  const [indices, setIndices] = useState({
    protein: 0,
    veg: 0,
    carb: 0,
    fat: 0,
  });

  const isZeroRemaining =
    remaining.protein <= 0 && remaining.veg <= 0 && remaining.carb <= 0;

  const cycleItem = (macro) => {
    setIndices((prev) => ({
      ...prev,
      [macro]: (prev[macro] + 1) % PANTRY[macro].length,
    }));
  };

  const handleLogMeal = () => {
    const delta = {
      protein: remaining.protein > 0 ? remaining.protein : 0,
      veg: remaining.veg > 0 ? remaining.veg : 0,
      carb: remaining.carb > 0 ? remaining.carb : 0,
      fat: remaining.fat > 0 ? remaining.fat : 0,
    };

    const selectedItems = [];
    if (remaining.protein > 0) selectedItems.push(PANTRY.protein[indices.protein]);
    if (remaining.veg > 0) selectedItems.push(PANTRY.veg[indices.veg]);
    if (remaining.carb > 0) selectedItems.push(PANTRY.carb[indices.carb]);
    if (remaining.fat > 0) selectedItems.push(PANTRY.fat[indices.fat]);

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
                Interaktív tányérépítő a hiányzó keretedből és a hűtődből
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#E07A5F] px-2.5 py-1 rounded-xl bg-white border border-[#F0DCD4]">
            Megnézem
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

          {/* HA BETELT A NAPI KERET (0T, 0Ö, 0M) */}
          {isZeroRemaining ? (
            <div className="p-4 rounded-2xl bg-[#FDF6F0] border border-[#F5D8C7] text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-white text-[#E07A5F] flex items-center justify-center mx-auto shadow-sm">
                <Coffee size={20} />
              </div>
              <h4 style={{ fontFamily: serif }} className="font-bold text-sm text-stone-800">
                Mára a konyha bezárt! 🎉
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed max-w-xs mx-auto">
                A mai keretedet maradéktalanul lehoztad, a tested mindent megkapott. Ez a késői vágy most nem valódi éhség, hanem a nap végi leeresztés.
              </p>
              <p className="text-[11px] font-semibold text-[#C3634C] bg-white py-2 px-3 rounded-xl border border-[#F5D8C7] inline-block">
                Tipp: Igyál meg egy nagy bögre citromfű teát, és pihenj!
              </p>
            </div>
          ) : (
            /* HA VAN MÉG HIÁNYZÓ KERET — INTERAKTÍV ÉPÍTŐ */
            <div className="space-y-3">
              <p className="text-xs text-stone-500">
                Koppints az alapanyagra vagy a csere gombra, ha más van otthon a hűtőben:
              </p>

              {/* FEHÉRJE SZEKCIÓ */}
              {remaining.protein > 0 && (
                <div className="p-3 bg-[#FFFDFB] border border-[#F0DCD4] rounded-2xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-[#E07A5F] tracking-wide block">
                      🖐️ {remaining.protein} Tenyér Fehérje
                    </span>
                    <p className="text-xs font-semibold text-stone-800 mt-0.5 truncate">
                      {PANTRY.protein[indices.protein]}
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

              {/* ROST SZEKCIÓ */}
              {remaining.veg > 0 && (
                <div className="p-3 bg-[#FFFDFB] border border-[#F0DCD4] rounded-2xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-[#7C9885] tracking-wide block">
                      ✊ {remaining.veg} Ököl Rost
                    </span>
                    <p className="text-xs font-semibold text-stone-800 mt-0.5 truncate">
                      {PANTRY.veg[indices.veg]}
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

              {/* SZÉNHIDRÁT SZEKCIÓ */}
              {remaining.carb > 0 && (
                <div className="p-3 bg-[#FFFDFB] border border-[#F0DCD4] rounded-2xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wide block">
                      🤲 {remaining.carb} Marék Szénhidrát
                    </span>
                    <p className="text-xs font-semibold text-stone-800 mt-0.5 truncate">
                      {PANTRY.carb[indices.carb]}
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

              {/* ZSÍR SZEKCIÓ */}
              {remaining.fat > 0 && (
                <div className="p-3 bg-[#FFFDFB] border border-[#F0DCD4] rounded-2xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-stone-600 tracking-wide block">
                      👍 {remaining.fat} Hüvelykujj Zsír
                    </span>
                    <p className="text-xs font-semibold text-stone-800 mt-0.5 truncate">
                      {PANTRY.fat[indices.fat]}
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
                  <CheckCircle2 size={13} /> Szuper, levontuk a keretedből és rögzítettük a naplóban!
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
