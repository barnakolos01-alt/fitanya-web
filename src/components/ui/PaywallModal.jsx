import React, { useState } from "react";
import { X, Sparkles, Check, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { C, serif } from "../../styles/tokens";
import { useFitAnya, MAX_FREE_AI_CREDITS } from "../../context/FitAnyaContext";

// ÉLES STRIPE LINKEK
const STRIPE_MONTHLY_TRIAL_URL = "https://buy.stripe.com/14AbJ36Gc8rJ4Pja1K9ws04"; // 7 nap próba -> 2 490 Ft/hó
const STRIPE_ANNUAL_URL = "https://buy.stripe.com/5kQ4gB2pW8rJdlP1ve9ws05";        // Éves 19 900 Ft

export default function PaywallModal() {
  const { isPaywallOpen, setIsPaywallOpen, aiUsageCount } = useFitAnya();
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "yearly"

  if (!isPaywallOpen) return null;

  const activeCheckoutUrl = billingCycle === "monthly" ? STRIPE_MONTHLY_TRIAL_URL : STRIPE_ANNUAL_URL;

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl relative border border-[#F0DCD4] animate-in slide-in-from-bottom duration-300 select-none max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setIsPaywallOpen(false)}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* KVÓTA JELZÉS */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF3EE] text-[#E07A5F] text-[11px] font-bold mb-3">
          <Lock size={12} /> {aiUsageCount}/{MAX_FREE_AI_CREDITS} ingyenes AI próba felhasználva
        </div>

        <h2 style={{ fontFamily: serif }} className="text-xl font-bold text-stone-900 mb-1.5 leading-snug">
          Legyen saját digitális séfed a zsebedben minden nap! ✨
        </h2>

        <p className="text-xs text-stone-600 leading-relaxed mb-4">
          A mesterséges intelligenciával működő, stresszmentes konyhai funkciók a <strong>Prémium Zsebedző</strong> részei.
        </p>

        {/* ÉRTÉKEK */}
        <div className="space-y-2 mb-4 text-xs text-stone-700 bg-[#FFFDFB] p-3 rounded-2xl border border-[#F5EBE6]">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-[#F0F5F1] text-[#7C9885] flex items-center justify-center shrink-0 mt-0.5">
              <Check size={12} />
            </div>
            <span><strong>Korlátlan AI Hűtőmentő:</strong> azonnali családi vacsora maradékokból.</span>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-[#F0F5F1] text-[#7C9885] flex items-center justify-center shrink-0 mt-0.5">
              <Check size={12} />
            </div>
            <span><strong>Bármilyen étel elemzése:</strong> tenyér-számítások konyhamérleg nélkül.</span>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-[#F0F5F1] text-[#7C9885] flex items-center justify-center shrink-0 mt-0.5">
              <Check size={12} />
            </div>
            <span><strong>Több tízezer forint megtakarítás:</strong> 0 kidobott étel a hónapban.</span>
          </div>
        </div>

        {/* HAVI / ÉVES KAPCSOLÓ (TOGGLE) */}
        <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl mb-3.5 border border-stone-200/70">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
              billingCycle === "monthly"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Havi (7 nap próba)
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
              billingCycle === "yearly"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Éves <span className="text-[10px] bg-[#E07A5F] text-white px-1.5 py-0.2 rounded-md font-bold">-33%</span>
          </button>
        </div>

        {/* ÁR & FELTÉTELEK DOBOZ */}
        <div className="text-center mb-4 bg-[#FDFBF9] p-3 rounded-2xl border border-[#F0DCD4]">
          {billingCycle === "monthly" ? (
            <>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-xs text-stone-400 font-medium">Ma:</span>
                <span className="text-2xl font-bold text-[#7C9885]">0 Ft</span>
                <span className="text-xs text-stone-500 font-medium">, utána 2 490 Ft/hó</span>
              </div>
              <p className="text-[11px] text-[#E07A5F] font-bold mt-0.5">
                7 napig teljesen ingyen • Bármikor lemondható
              </p>
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-2xl font-bold text-[#2D3748]">19 900 Ft</span>
                <span className="text-xs text-stone-500 font-medium">/ év</span>
              </div>
              <p className="text-[11px] text-[#7C9885] font-bold mt-0.5">
                Csak ~1 658 Ft / hó • 4 hónap ajándékba
              </p>
            </>
          )}

          <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400 mt-1.5 pt-1.5 border-t border-stone-200/60">
            <span>Nincs hűségidő</span>
            <span>•</span>
            <span>1 kattintásos online lemondás</span>
          </div>
        </div>

        {/* DINAMIKUS AKCIÓGOMB */}
        <a
          href={activeCheckoutUrl}
          className="w-full py-3.5 rounded-2xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-98 text-center mb-2.5"
          style={{ backgroundColor: C.coral }}
        >
          <Sparkles size={15} />
          {billingCycle === "monthly" ? "Kipróbálom 7 napig 0 Ft-ért" : "Kérem az Éves tagságot (-33%)"}
          <ArrowRight size={14} />
        </a>

        {/* BIZTONSÁGI ZÁRADÉK */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400">
          <ShieldCheck size={13} className="text-[#7C9885]" /> 14 napos elégedettségi garancia • Biztonságos Stripe
        </div>
      </div>
    </div>
  );
}
