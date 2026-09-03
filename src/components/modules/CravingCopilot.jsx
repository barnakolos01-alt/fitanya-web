import React, { useState } from 'react';
import { Sparkles, Send, Loader2, AlertCircle, RefreshCw, Flame } from 'lucide-react';

export default function CravingCopilot({ remaining = { protein: 1, veg: 2, carb: 1, fat: 1 } }) {
  const [cravingInput, setCravingInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  // Gyorsválasztó gombok a leggyakoribb vészhelyzetekhez
  const quickPills = [
    '🍫 Tábla csoki / Édesség',
    '🥔 Sós chips / Ropi',
    '🥐 Péksüti / Melegszendvics',
    '🍦 Fagyi / Desszert',
    '🍕 Megmaradt pizza',
  ];

  const handleQuickSelect = (text) => {
    // Levágjuk az emojit a kényelmes promptoláshoz
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
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-rose-100 max-w-lg mx-auto">
      {/* Fejléc */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Nasi & Sóvárgás Tűzoltó</h2>
          <p className="text-xs text-slate-500">AI Zsebedző • Bűntudatmentes alternatívák 60 mp alatt</p>
        </div>
      </div>

      {/* Gyorsválasztó címkék */}
      {!response && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">Gyakori vészhelyzetek:</p>
          <div className="flex flex-wrap gap-1.5">
            {quickPills.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickSelect(pill)}
                className="text-xs bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 transition-colors"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Beküldő űrlap */}
      {!response ? (
        <form onSubmit={handleAskCoach} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mit kívánsz vagy mit ennél meg most azonnal?
            </label>
            <div className="relative">
              <input
                type="text"
                value={cravingInput}
                onChange={(e) => setCravingInput(e.target.value)}
                placeholder="pl. 3 sor Milka csoki, sós popcorn tejföllel..."
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white text-slate-800"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!cravingInput.trim() || loading}
                className="absolute right-2 top-2 bottom-2 px-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!cravingInput.trim() || loading}
            className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-sm rounded-2xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Zsebedző elemzi az élettani okot...</span>
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
        /* AI Válasz kártya */
        <div className="space-y-4">
          <div className="p-4 bg-rose-50/60 border border-rose-100 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                FitAnya Zsebedző javaslata
              </span>
              <span className="text-[11px] text-slate-400">Sóvárgás: "{cravingInput}"</span>
            </div>

            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {response}
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Másik kívánósságot adok meg
          </button>
        </div>
      )}

      {/* Hibaüzenet kezelés */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
