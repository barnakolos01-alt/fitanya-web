import React, { useState } from 'react';
import { Sparkles, Send, Loader2, AlertCircle, RefreshCw, UtensilsCrossed, Moon } from 'lucide-react';
import { useFitAnya } from '../../context/FitAnyaContext';

// Formázó segédkomponens: kezeli a félkövér és dőlt jelöléseket
function FormattedMessage({ content }) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-sm text-stone-700 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        const parts = line.split(/(\*\*[\s\S]*?\*\*|\*[^*]+?\*)/g);
        const isHighlightLine = trimmed.startsWith('🎯') || trimmed.startsWith('💡') || trimmed.startsWith('🍳');

        return (
          <p
            key={idx}
            className={
              isHighlightLine
                ? 'mt-3 pt-2.5 border-t border-stone-200/80 font-medium text-stone-800'
                : ''
            }
          >
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={pIdx} className="font-semibold text-stone-900">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              if (part.startsWith('*') && part.endsWith('*')) {
                return (
                  <em key={pIdx} className="italic text-stone-800">
                    {part.slice(1, -1)}
                  </em>
                );
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

export default function FridgeRescue() {
  const { remaining } = useFitAnya();
  const [fridgeInput, setFridgeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const quickPills = [
    '🥚 Tojás + fagyasztott zöldség',
    '🐟 Konzerv tonhal + kukorica',
    '🧀 Cottage cheese + sonka',
    '🍗 Maradék sült csirke + saláta',
    '🫘 Csicseriborsó konzerv + tejföl',
  ];

  const handleQuickSelect = (text) => {
    const cleanText = text.replace(/^[^\w\s\u00C0-\u017F]+/u, '').trim();
    setFridgeInput(cleanText);
  };

  const handleAskCoach = async (e) => {
    if (e) e.preventDefault();
    if (!fridgeInput.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'dinner',
          input: fridgeInput.trim(),
          remaining: remaining,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Hiba történt a vacsoratervezés közben.');
      }

      setResponse(data.reply);
    } catch (err) {
      setError(err.message || 'Nem sikerült elérni a vacsoratervezőt. Próbáld újra!');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFridgeInput('');
    setResponse(null);
    setError(null);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200/80 max-w-lg mx-auto">
      {/* Fejléc */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-[#fbf3ef] text-[#c3634c] flex items-center justify-center border border-[#f3e1d8]">
          <Moon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-stone-800 tracking-tight">Esti Zárás & Hűtőmentő</h2>
          <p className="text-xs text-stone-500">10 perces vacsoraötlet a napi hiányzó keretedből</p>
        </div>
      </div>

      {/* Napi maradék keret emlékeztető */}
      <div className="mb-5 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/70 flex items-center justify-between text-xs">
        <span className="font-medium text-stone-600">Még hiányzik mára:</span>
        <div className="flex gap-2 font-semibold text-stone-800">
          <span className="bg-white px-2 py-0.5 rounded-lg border border-stone-200">{remaining?.protein ?? 0}T fehérje</span>
          <span className="bg-white px-2 py-0.5 rounded-lg border border-stone-200">{remaining?.veg ?? 0}Ö rost</span>
          <span className="bg-white px-2 py-0.5 rounded-lg border border-stone-200">{remaining?.carb ?? 0}M szénhidrát</span>
        </div>
      </div>

      {/* Gyorsválasztó gombok */}
      {!response && (
        <div className="mb-5">
          <p className="text-xs font-medium text-stone-500 mb-2">Gyakori alapanyagok a hűtőből:</p>
          <div className="flex flex-wrap gap-2">
            {quickPills.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickSelect(pill)}
                className="text-xs bg-stone-50 hover:bg-[#fbf3ef] hover:text-[#c3634c] hover:border-[#f3e1d8] text-stone-700 px-3 py-1.5 rounded-full border border-stone-200 transition-colors cursor-pointer"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Beküldő mező */}
      {!response ? (
        <form onSubmit={handleAskCoach} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Mi árválkodik a hűtőben / mit dobnál össze vacsorára?
            </label>
            <div className="relative">
              <input
                type="text"
                value={fridgeInput}
                onChange={(e) => setFridgeInput(e.target.value)}
                placeholder="pl. 2 db tojás, fél cukkini, maradék rizs..."
                className="w-full pl-4 pr-12 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c3634c]/20 focus:border-[#c3634c] focus:bg-white text-stone-800 placeholder-stone-400 transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!fridgeInput.trim() || loading}
                className="absolute right-2 top-2 bottom-2 px-3 bg-[#c3634c] hover:bg-[#b0533d] disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!fridgeInput.trim() || loading}
            className="w-full py-3.5 bg-[#c3634c] hover:bg-[#b0533d] text-white font-semibold text-sm rounded-2xl shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Vacsora összerakása a Tenyér-szabállyal...</span>
              </>
            ) : (
              <>
                <UtensilsCrossed className="w-4 h-4" />
                <span>10 perces vacsoratányér tervezése</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* AI Válasz kártya tiszta elrendezéssel */
        <div className="space-y-4">
          <div className="p-4 bg-[#fbf5f2] border border-[#f1ded6] rounded-2xl">
            {/* Fejléc - reszponzív, nem csúszik össze */}
            <div className="flex flex-col gap-1 mb-3 pb-2.5 border-b border-[#f1ded6]">
              <span className="text-[11px] font-bold text-[#c3634c] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                FitAnya Vacsora Recept (10 perc)
              </span>
              <p className="text-xs text-stone-500 italic break-words">
                Alap: "{fridgeInput}"
              </p>
            </div>

            <FormattedMessage content={response} />
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Másik alapanyagokat adok meg
          </button>
        </div>
      )}

      {/* Hibaüzenet */}
      {error && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
          <span className="break-all">{error}</span>
        </div>
      )}
    </div>
  );
}
