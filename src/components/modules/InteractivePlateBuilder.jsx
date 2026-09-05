import React, { useState, useRef } from "react";
import {
  Sparkles,
  CheckCircle2,
  Coffee,
  Loader2,
  Send,
  Flame,
  Clock,
  Heart,
} from "lucide-react";
import { C, serif } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";

// GOLYÓÁLLÓ FITANYA SÓVÁRGÁS-RECEPTEK (GYORS, HÁZI HACKEK)
const CRAVING_HACKS = {
  pizza: {
    title: "🍕 6 perces Serpenyős Tortilla-Pizza",
    why: "Megkapod az igazi ropogós pizzás, sajtos élményt, miközben nem eszel meg 800 kcal fehér lisztet.",
    steps: [
      "1 db kis méretű tortillalapot tegyél száraz, forró serpenyőbe kis lángon.",
      "Kend meg 2 ek sűrített paradicsommal (oregánó, só, fokhagymapor).",
      "Dobj rá 3-4 szelet csirkemellsonkát és egy vékony szelet sajtot (vagy 30g light mozzarellát).",
      "Tedd rá a fedőt 4 percre: az alja ropogós lesz, a sajt gyönyörűen ráolvad!",
    ],
    side: "🥒 Ha hiányzik még rostod, vágj mellé uborkát vagy koktélparadicsomot!",
    time: "6 perc",
    delta: { protein: 1, carb: 1, fat: 0.5, veg: 0 },
  },
  sweet: {
    title: "🍫 3 perces Krémes Csokis-Túró Mousse",
    why: "A kazein fehérje eltelíti a gyomrod éjszakára, a valódi kakaó pedig azonnal lekapcsolja az agyad édesség-központját.",
    steps: [
      "4-5 ek zsírszegény krémtúrót vagy natúr görög joghurtot tegyél egy kis tálkába.",
      "Keverj el benne 1 teáskanál jó minőségű holland kakaóport és pár csepp édesítőt vagy 1 tk mézet.",
      "A tetejére reszelj rá egyetlen kocka (10g) jó minőségű fekete étcsokit!",
    ],
    side: "🍓 Dobj a tetejére pár szem fagyasztott vagy friss bogyós gyümölcsöt!",
    time: "3 perc",
    delta: { protein: 1.5, carb: 0.5, fat: 0.5, veg: 0 },
  },
  sandwich: {
    title: "🥪 Szaftos Serpenyős Melegszendvics",
    why: "Semmi baj a melegszendviccsel, ha nem áztatod el fél kiló trappistával, hanem a fehérjét helyezed fókuszba.",
    steps: [
      "1 szelet teljes kiőrlésű vagy rozskenyeret kenj meg nagyon vékonyan vajkrémmel vagy dijoni mustárral.",
      "Pakolj rá 4 szelet minőségi sonkát (dupla fehérje!) és 1 szelet sajtot.",
      "Serpenyőben mindkét oldalát pirítsd aranybarnára 2-2 perc alatt, fedő alatt.",
    ],
    side: "🥗 Egy nagy marék ropogós csemegeuborkával edd, hogy tele legyen a tányérod!",
    time: "5 perc",
    delta: { protein: 1, carb: 1, fat: 0.5, veg: 1 },
  },
  pasta: {
    title: "🍝 8 perces Sajtos-Túrós 'Kamu-Alfredo'",
    why: "A krémes tészta-élményt nem zsíros tejszínből, hanem fehérjedús túróból és főzővízből csináljuk meg.",
    steps: [
      "Főzz ki 1 maréknyi (kb. 50g) tésztát (lehetőleg durum vagy teljes kiőrlésű).",
      "Amikor leszűröd, hagyj meg 3 kanál főzővizet a lábas alján.",
      "Keverj el benne 3 ek túrót vagy krémsajtot, fokhagymát, sót, és forgasd bele a tésztát.",
      "Dobj bele 3 szelet felcsíkozott sonkát vagy fél doboz lecsöpögtetett tonhalat!",
    ],
    side: "🥦 Dobj a tészta mellé a vízbe pár brokkolirózsát az utolsó 3 percre!",
    time: "8 perc",
    delta: { protein: 1.5, carb: 1, fat: 0.5, veg: 1 },
  },
  chips: {
    title: "🥨 Fűszeres Ropogós Tortilla-Chips Mártogatóssal",
    why: "Nem a chipset kívánod, hanem a SÓS ROPOGÁST a filmnézéshez. Ez nem olajban tocsog, mégis roppan.",
    steps: [
      "1 db tortillalapot vágj fel háromszögekre ollóval.",
      "Fújd le egy leheletnyi olajjal, szórd meg jó sok sóval, füstölt paprikával és oregánóval.",
      "Air fryerben 4 perc (vagy forró serpenyőben rázogatva) kőkeményre ropogósodik.",
      "Keverj ki 3 ek natúr görög joghurtot fokhagymával és sóval mártogatósnak.",
    ],
    side: "🥕 Vágj mellé répa- vagy uborkahasábokat, és azokat is mártogasd!",
    time: "5 perc",
    delta: { protein: 0.5, carb: 1, fat: 0.5, veg: 0 },
  },
  burger: {
    title: "🍔 Tányéros Szaftos Smash Burger",
    why: "A burger íze a marhahús pirult kérgéből és a savanyú uborkából jön, nem az édesre cukrozott buciból.",
    steps: [
      "Egy jó minőségű húspogácsát (vagy darált húst) lapíts ki nagyon vékonyra a serpenyőben, süsd forrón 2-2 percig.",
      "Tedd a tetejére 1 szelet sajtot, hogy ráolvadjon.",
      "Ha maradt szénhidrátod, piríts meg 1 db bucit. Ha elfogyott a szénhidrátod: tedd óriási salátaágyra!",
      "Pakold meg paradicsomkarikákkal, sok savanyú uborkával és light ketchuppal.",
    ],
    side: "🥗 A buci helyetti salátaágy azonnal lehozza a hiányzó 2 ököl rostodat!",
    time: "8 perc",
    delta: { protein: 1.5, carb: 0.5, fat: 1, veg: 1 },
  },
};

const QUICK_CHIPS = [
  { key: "pizza", label: "🍕 Pizza" },
  { key: "sweet", label: "🍫 Csoki / Édesség" },
  { key: "sandwich", label: "🥪 Melegszendvics" },
  { key: "pasta", label: "🍝 Tészta" },
  { key: "chips", label: "🥨 Chips / Sós" },
  { key: "burger", label: "🍔 Szaftos Burger" },
];

export default function InteractivePlateBuilder() {
  const { remaining, logPortion, consumeAiCredit } = useFitAnya();
  const [cravingInput, setCravingInput] = useState("");
  const [activeHack, setActiveHack] = useState(CRAVING_HACKS.pizza);
  const [aiLoading, setAiLoading] = useState(false);
  const [logged, setLogged] = useState(false);

  const inputRef = useRef(null);

  const isZeroRemaining =
    remaining.protein <= 0 &&
    remaining.veg <= 0 &&
    remaining.carb <= 0 &&
    remaining.fat <= 0;

  const handleSelectChip = (key) => {
    if (CRAVING_HACKS[key]) {
      setActiveHack(CRAVING_HACKS[key]);
      setCravingInput("");
    }
  };

  // INTELLIGENS VÁLASZTÓ ÉS CLAUDE AI BEKÖTÉS
  const handleAskHack = async (e) => {
    if (e) e.preventDefault();
    const query = cravingInput.trim().toLowerCase();
    if (!query || aiLoading) return;

    // 1. Lokális gyors felismerés a leggyakoribb szavakra
    if (query.includes("pizz")) return setActiveHack(CRAVING_HACKS.pizza);
    if (
      query.includes("csok") ||
      query.includes("édes") ||
      query.includes("edes") ||
      query.includes("süti") ||
      query.includes("cukor")
    ) {
      return setActiveHack(CRAVING_HACKS.sweet);
    }
    if (query.includes("szendvics") || query.includes("toast") || query.includes("pirítós")) {
      return setActiveHack(CRAVING_HACKS.sandwich);
    }
    if (query.includes("tészt") || query.includes("teszt") || query.includes("spagetti")) {
      return setActiveHack(CRAVING_HACKS.pasta);
    }
    if (
      query.includes("chips") ||
      query.includes("sós") ||
      query.includes("ropi") ||
      query.includes("nasi")
    ) {
      return setActiveHack(CRAVING_HACKS.chips);
    }
    if (query.includes("burger") || query.includes("hús") || query.includes("gyros")) {
      return setActiveHack(CRAVING_HACKS.burger);
    }

    // 2. Ha teljesen egyedit írt be, meghívjuk a Claude végpontot
    if (!consumeAiCredit()) return;

    setAiLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "craving_hack",
          craving: query,
          remaining: remaining,
        }),
      });

      const data = await res.json();
      if (data && data.hack) {
        setActiveHack(data.hack);
      } else {
        // Fallback: finom melegszendvics trükk
        setActiveHack(CRAVING_HACKS.sandwich);
      }
    } catch {
      setActiveHack(CRAVING_HACKS.sandwich);
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogHack = () => {
    if (!activeHack) return;

    // Levonjuk a hack arányait a keretből
    logPortion(activeHack.delta, `Sóvárgás-mentő: ${activeHack.title}`);
    setLogged(true);
    setTimeout(() => {
      setLogged(false);
    }, 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. KEDVES FEJLÉC ÉS KERET-EMLÉKEZTETŐ */}
      <div className="bg-white rounded-3xl p-4 shadow-xs border border-[#F5EBE6]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-8 h-8 rounded-xl bg-[#FFF5F0] text-[#E07A5F] flex items-center justify-center text-base">
            ✨
          </span>
          <div>
            <h2 style={{ fontFamily: serif }} className="text-base font-bold text-stone-800">
              Sóvárgás-Mentő Tányér
            </h2>
            <p className="text-[11px] text-stone-500">
              Mit kívánsz most? Átalakítjuk gyors FitAnya-vacsorává!
            </p>
          </div>
        </div>

        {/* HÁTRALÉVŐ KERET JELZŐ CSÍK */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
          <span className="text-[11px] font-semibold text-stone-500">Mai hiányzó kereted:</span>
          <div className="flex items-center gap-2 font-bold text-[11px]">
            <span className="text-[#E07A5F]">🖐️ {Math.max(0, remaining.protein)}</span>
            <span className="text-[#7C9885]">✊ {Math.max(0, remaining.veg)}</span>
            <span className="text-[#D4984F]">🤲 {Math.max(0, remaining.carb)}</span>
            <span className="text-[#C3634C]">👍 {Math.max(0, remaining.fat)}</span>
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
            A mai tányérod 100%-os egyensúlyban van, a tested minden szükséges tápanyagot megkapott. Ez most fáradtság, nem éhség!
          </p>
          <p className="text-xs font-semibold text-[#C3634C] bg-white py-2 px-3 rounded-xl border border-[#F5D8C7] inline-block">
            🌸 Főzz egy forró citromfű teát, és kapcsold ki a napot!
          </p>
        </div>
      ) : (
        <>
          {/* 2. GYORS KÍVÁNSÁG-VÁLASZTÓ CHIPEK */}
          <div className="bg-white rounded-3xl p-4 shadow-xs border border-[#F5EBE6]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2.5">
              Válassz a leggyakoribb kívánságokból:
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => handleSelectChip(chip.key)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    activeHack?.title.includes(chip.label.split(" ")[1])
                      ? "bg-[#E07A5F] text-white border-[#E07A5F] shadow-xs"
                      : "bg-[#FFFDFB] text-stone-700 border-[#F2E5DF] hover:bg-[#FFF5F0]"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* EGYÉNI KÍVÁNSÁG MEZŐ */}
            <form onSubmit={handleAskHack} className="pt-2 border-t border-stone-100">
              <label className="text-[11px] font-medium text-stone-600 mb-1.5 block">
                Vagy írd le pontosan, mit ennél szívesen:
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={cravingInput}
                  onChange={(e) => setCravingInput(e.target.value)}
                  placeholder="pl. Nutellás kenyér, Lángos, Fagyi..."
                  className="flex-1 px-3.5 py-2.5 bg-[#FFFDFB] border border-[#F0DCD4] rounded-xl text-xs outline-none focus:border-[#E07A5F]"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !cravingInput.trim()}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
                  style={{ backgroundColor: C.coral }}
                >
                  {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  <span>Átalakítás</span>
                </button>
              </div>
            </form>
          </div>

          {/* 3. A MEGOLDÁS KÁRTYA (AZ IGAZI FITANYA HACK) */}
          {activeHack && (
            <div className="bg-[#FFFDFB] rounded-3xl p-5 border border-[#F0DCD4] shadow-xs animate-in fade-in space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#E07A5F] uppercase tracking-wider bg-[#FFF2EB] px-2.5 py-0.5 rounded-md">
                    ✨ FitAnya Sóvárgás-Hack
                  </span>
                  <span className="text-[11px] font-medium text-stone-400 flex items-center gap-1">
                    <Clock size={12} /> {activeHack.time}
                  </span>
                </div>
                <h3 style={{ fontFamily: serif }} className="text-base font-bold text-stone-800 mt-1">
                  {activeHack.title}
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed italic bg-white p-2.5 rounded-xl border border-[#F5EBE6]">
                  "{activeHack.why}"
                </p>
              </div>

              {/* LÉPÉSEK */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-stone-700">Így készítsd el villámgyorsan:</p>
                <ol className="space-y-1.5 text-xs text-stone-700 pl-4 list-decimal">
                  {activeHack.steps.map((step, idx) => (
                    <li key={idx} className="leading-snug">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* PLUSZ TIPP A HIÁNYZÓ ROSTHOZ */}
              {activeHack.side && (
                <div className="text-[11px] text-[#42614E] bg-[#F3F7F4] p-2.5 rounded-xl border border-[#DCE7E0] leading-relaxed">
                  <strong>💡 FitAnya Trükk:</strong> {activeHack.side}
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
