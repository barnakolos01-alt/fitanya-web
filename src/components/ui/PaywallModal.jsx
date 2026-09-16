import React from "react";
import { X, Sparkles, Check, Lock, ArrowRight, ShieldCheck, Flame } from "lucide-react";
import { C, serif } from "../../styles/tokens";
import { useFitAnya, MAX_FREE_AI_CREDITS } from "../../context/FitAnyaContext";

// Az egyetlen, tiszta egyszeri díjas ajánlat linkje
const STRIPE_40PLUS_URL = "https://buy.stripe.com/7sY00l9SodM381v2zi9ws03"; 

export default function PaywallModal() {
  const { isPaywallOpen, setIsPaywallOpen, aiUsageCount } = useFitAnya();

  if (!isPaywallOpen) return null;

  // Automatikus e-mail kitöltés a Stripe-nak, ha van mentett e-mail az appban
  const getCheckoutUrl = () => {
    try {
      const email = (localStorage.getItem("fa_email") || "").trim();
      return email 
        ? `${STRIPE_40PLUS_URL}?prefilled_email=${encodeURIComponent(email)}` 
        : STRIPE_40PLUS_URL;
    } catch {
      return STRIPE_40PLUS_URL;
    }
  };

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

        <h2 style={{ fontFamily: serif }} className="text-xl font-bold text-stone-900 mb-2 leading-snug">
          Tetszik az AI Hűtőmentő? ✨
        </h2>

        <p className="text-xs text-stone-600 leading-relaxed mb-4">
          Oldd fel a korlátlan konyhai tervezőt a <strong>FitAnya 40+ Anyagcsere-Újraindító Csomaggal</strong> — egyszeri díjért, rejtett havidíjak nélkül!
        </p>

        {/* ÉRTÉKEK - 40+ Csomag + Korlátlan AI */}
        <div className="space-y-2.5 mb-5 text-xs text-stone-700 bg-[#FFFDFB] p-4 rounded-2xl border border-[#F0DCD4] shadow-sm">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-[#F0F5F1] text-[#7C9885] flex items-center justify-center shrink-0 mt-0.5">
              <Check size={12} />
            </div>
            <span><strong>Korlátlan AI Hűtőmentő:</strong> végtelen receptgenerálás a maradékokból.</span>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center shrink-0 mt-0.5">
              <Flame size={12} />
            </div>
            <span><strong>40+ Gyorskalauz (PDF):</strong> 15 maszatmentes recept & Aldi/Lidl polctérkép.</span>
          </div>

          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-[#F0F5F1] text-[#7C9885] flex items-center justify-center shrink-0 mt-0.5">
              <Check size={12} />
            </div>
            <span><strong>Nincs előfizetés:</strong> egyszeri díj, 0 Ft havidíj, örökös hozzáférés.</span>
          </div>
        </div>

        {/* ÁR & FELTÉTELEK DOBOZ */}
        <div className="text-center mb-4 p-3 rounded-2xl bg-[#FFF9F5] border-2 border-[#E07A5F]">
          <span className="text-[10px] font-bold text-[#E07A5F] uppercase tracking-wider">Egyszeri Belépő Ár</span>
          <div className="flex items-baseline justify-center gap-1.5 mt-1">
            <span className="text-3xl font-bold text-[#2D3748]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>3 490 Ft</span>
          </div>
          <p className="text-[11px] text-[#8A7268] font-medium mt-1">
            0 Ft havidíj • Azonnali hozzáférés
          </p>
        </div>

        {/* KÖZVETLEN STRIPE GOMB */}
        <a
          href={getCheckoutUrl()}
          className="w-full py-3.5 rounded-2xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-98 text-center mb-3"
          style={{ backgroundColor: C.coral }}
        >
          <Sparkles size={15} />
          Kérem a csomagot & Korlátlan AI-t
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
