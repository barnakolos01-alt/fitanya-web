import React, { useState } from 'react';
import { Sparkles, Send, Loader2, AlertCircle, RefreshCw, Flame } from 'lucide-react';

// Formázó komponens: a nyers ** és * Markdown jeleket HTML elemekké alakítja
function FormattedMessage({ content }) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-sm text-stone-700 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Darabolás a **félkövér** és *dőlt* részek mentén
        const parts = line.split(/(\*\*[\s\S]*?\*\*|\*[^*]+?\*)/g);

        const isHighlightLine = trimmed.startsWith('🎯') || trimmed.startsWith('💡');

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

export default function CravingCopilot({ remaining = { protein: 1, veg: 2, carb: 1, fat: 1 } }) {
  const [cravingInput, setCravingInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const quickPills = [
    '🍫 Tábla csoki / Édesség',
    '🥔 Sós chips / Ropi',
    '🥐 Péksüti / Melegszendvics',
    '🍦 Fagyi / Desszert',
    '🍕 Megmaradt pizza',
  ];

  const handleQuickSelect = (text) => {
    const cleanText = text.replace(/^[^\w\s\u00C0-\u017F]+/u, '').trim();
    setCravingInput(cleanText);
  };

  const handleAskCoach = async (e) => {
    if (e) e.preventDefault();
    if (!cravingInput.trim() || loading) return;

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
          mode: 'craving',
          input: cravingInput.trim(),
          remaining: remaining,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Hiba történt a válaszadás közben.');
      }

      setResponse(data.reply);
    } catch (err) {
      setError(err.message || 'Nem sikerült elérni a zsebedzőt. Kérlek próbáld újra!');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCravingInput('');
    setResponse(null);
    setError(null);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200/80 max-w-lg mx-auto">
      {/* Fejléc */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-[#fbf3ef] text-[#c3634c] flex items-center justify-center border border-[#f3e1d8]">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-stone-800 tracking-tight">Nasi & Sóvárgás Tűzoltó</h2>
          <p className="text-xs text-stone-500">AI Zsebedző • Bűntudatmentes alternatívák 60 mp alatt</p>
        </div>
      </div>

      {/* Gyorsválasztó címkék */}
      {!response && (
        <div className="mb-5">
          <p className="text-xs font-medium text-stone-500 mb-2">Gyakori vészhelyzetek:</p>
          <div className="flex flex-wrap gap-2">
            {quickPills.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickSelect(pill)}
                className="text-xs bg-stone-50 hover:bg-[#fbf3ef] hover:text-[#c3634c] hover:border-[#f3e1d8] text-stone-700 px-3.5 py-1.5 rounded-full border border-stone-200 transition-colors cursor-pointer"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Beküldő űrlap */}
      {!response ? (
        <form onSubmit={handleAskCoach} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Mit kívánsz vagy mit ennél meg most azonnal?
            </label>
            <div className="relative">
              <input
                type="text"
                value={cravingInput}
                onChange={(e) => setCravingInput(e.target.value)}
                placeholder="pl. Csokoládé torta marcipánnal, sós mogyoró..."
                className="w-full pl-4 pr-12 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#c3634c]/20 focus:border-[#c3634c] focus:bg-white text-stone-800 placeholder-stone-400 transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!cravingInput.trim() || loading}
                className="absolute right-2 top-2 bottom-2 px-3 bg-[#c3634c] hover:bg-[#b0533d] disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!cravingInput.trim() || loading}
            className="w-full py-3.5 bg-[#c3634c] hover:bg-[#b0533d] text-white font-semibold text-sm rounded-2xl shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Zsebedző elemzi az élettani hátteret...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Bűntudatmentes megoldás kérése</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* AI Válasz kártya tiszta formázással */
        <div className="space-y-4">
          <div className="p-4 bg-[#fbf5f2] border border-[#f1ded6] rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-[#c3634c] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                FitAnya Zsebedző javaslata
              </span>
              <span className="text-[11px] text-stone-400">Sóvárgás: "{cravingInput}"</span>
            </div>

            <FormattedMessage content={response} />
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Másik kívánósságot adok meg
          </button>
        </div>
      )}

      {/* Hibaüzenet kezelés */}
      {error && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
          <span className="break-all">{error}</span>
        </div>
      )}
    </div>
  );
}
