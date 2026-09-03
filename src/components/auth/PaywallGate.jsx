import React, { useState } from "react";
import { Sparkles, Lock, CreditCard, KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { C, serif, sans } from "../../styles/tokens";

export default function PaywallGate({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [vipCode, setVipCode] = useState("");

  const handleStartStripeCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/paywall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_checkout" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nem sikerült elindítani a fizetési folyamatot.");

      if (data.url) {
        window.location.href = data.url; // Átirányítás a Stripe felületére
      }
    } catch (err) {
      setError(err.message || "Hiba történt a fizetés indításakor.");
      setLoading(false);
    }
  };

  const handleVerifyVipCode = async (e) => {
    e.preventDefault();
    if (!vipCode.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/paywall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_code", code: vipCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Érvénytelen kód.");

      if (data.valid && data.token) {
        localStorage.setItem("fa_auth_token", data.token);
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.message || "Hibás aktiváló kód.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="max-w-md mx-auto min-h-screen px-5 py-8 flex flex-col justify-between"
      style={{ backgroundColor: C.bg, fontFamily: sans }}
    >
      <div>
        {/* FEJLÉC ÉS IKON */}
        <div className="text-center pt-6 pb-8">
          <div className="w-14 h-14 rounded-3xl bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center mx-auto mb-4 shadow-sm border border-[#F0DCD4]">
            <Lock size={26} />
          </div>
          <h1 style={{ fontFamily: serif, color: C.textDark }} className="text-2xl font-bold mb-2">
            FitAnya Zsebedző Prémium
          </h1>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            Korlátlan hozzáférés a Nassolás SOS-hez, a Tányér-Mérőhöz és az automata Hűtőmentőhöz.
          </p>
        </div>

        {/* ELŐNYÖK KÁRTYA */}
        <div
          className="rounded-3xl p-5 mb-6 space-y-3.5"
          style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
        >
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#F0F5F1] text-[#7C9885] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
              ✓
            </div>
            <div>
              <p className="text-xs font-bold text-stone-800">Azonnali Konyhai Fordító (AI)</p>
              <p className="text-[11px] text-stone-500">Nem kell számolgatnod: bedobod, amit a családból eszel, és megmondja a tenyér-adagot.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#F0F5F1] text-[#7C9885] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
              ✓
            </div>
            <div>
              <p className="text-xs font-bold text-stone-800">Esti Hűtőmentő Vacsorák</p>
              <p className="text-[11px] text-stone-500">10 perces túlélő receptek a maradékokból, közvetlenül a keretedre szabva.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#F0F5F1] text-[#7C9885] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
              ✓
            </div>
            <div>
              <p className="text-xs font-bold text-stone-800">Napi Hidratálás & Push Emlékeztetők</p>
              <p className="text-[11px] text-stone-500">Személyre szabott szoptatási védelemmel és háttérben futó jelzésekkel.</p>
            </div>
          </div>
        </div>

        {/* FIZETÉSI GOMB */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={loading}
            onClick={handleStartStripeCheckout}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            style={{ backgroundColor: C.coral }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Kapcsolódás a biztonságos fizetéshez...</span>
              </>
            ) : (
              <>
                <CreditCard size={18} />
                <span>Előfizetés indítása (3 490 Ft / hó)</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-stone-400">
            Bármikor lemondható egy kattintással. 14 napos pénzvisszafizetési garancia.
          </p>
        </div>

        {/* MÁR VAN ELŐFIZETÉSEM / AKTIVÁLÓ KÓD */}
        <div className="mt-8 text-center">
          {!showCodeInput ? (
            <button
              type="button"
              onClick={() => setShowCodeInput(true)}
              className="text-xs font-semibold text-stone-600 hover:text-[#E07A5F] underline underline-offset-4 cursor-pointer"
            >
              Már van előfizetésem vagy aktiváló kódom
            </button>
          ) : (
            <form onSubmit={handleVerifyVipCode} className="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 animate-in fade-in">
              <p className="text-xs font-bold text-stone-800">Add meg az aktiváló kódod:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={vipCode}
                  onChange={(e) => setVipCode(e.target.value)}
                  placeholder="pl. FITANYA2026"
                  className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs uppercase font-mono tracking-wider outline-none focus:border-[#E07A5F]"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Belépés
                </button>
              </div>
              <p className="text-[10px] text-stone-400">
                (Teszthez használhatod a <code className="text-stone-600 font-bold">FITANYA2026</code> kódot)
              </p>
            </form>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={15} className="text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="text-center pt-6 text-[11px] text-stone-400">
        FitAnya Mdsz. • Minden jog fenntartva
      </div>
    </div>
  );
}
