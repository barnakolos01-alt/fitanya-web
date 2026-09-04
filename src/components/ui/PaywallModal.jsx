import React, { useState } from "react";
import { X, Sparkles, Check, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { C, serif } from "../../styles/tokens";
import { useFitAnya, MAX_FREE_AI_CREDITS } from "../../context/FitAnyaContext";

// Cseréld le a saját Stripe Payment Link-edre a Stripe Dashboardról!
const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/test_placeholder";

export default function PaywallModal() {
  const { isPaywallOpen, setIsPaywallOpen, unlockPremium, aiUsageCount } = useFitAnya();
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState(false);

  if (!isPaywallOpen) return null;

  const handleApplyCode = (e) => {
    e.preventDefault();
    // Vész-feloldókód teszteléshez vagy VIP ügyfeleknek
    if (promoCode.trim().toUpperCase() === "FITANYA" || promoCode.trim().toUpperCase() === "PREMIUM2026") {
      unlockPremium();
    } else {
      setPromoError(true);
      setTimeout(() => setPromoError(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl relative border border-[#F0DCD4] animate-in slide-in-from-bottom duration-300 select-none max-h-[90vh] overflow-y-auto"
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
          <Lock size={12} /> {aiUsageCount}/{MAX_FREE_AI_CREDITS} ingyenes AI kóstoló felhasználva
        </div>

        <h2 style={{ fontFamily: serif }} className="text-xl font-bold text-stone-900 mb-2 leading-snug">
          Legyen saját digitális séfed a zsebedben minden nap!
        </h2>

        <p className="text-xs text-stone-600 leading-relaxed mb-4">
          A FitAnya alapprogram ingyenes. A mesterséges intelligenciával működő konyhai funkciók a <strong>Prémium Zsebedző</strong> részei.
        </p>

        {/* ÉRTÉKAJÁNLATOK */}
        <div className="space-y-2.5 mb-5 text-xs text-stone-700 bg-[#FFFDFB] p-3.5 rounded-2xl border border-[#F5EBE6]">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#F0F5F1] text-[#7C9885] flex items-center justify-center shrink-0 mt-0.5">
              <Check size={12} />
            </div>
            <span><strong>Korlátlan Hűtőmentő:</strong> 0 kidobott étel, azonnali vacsoraötletek a családnak.</span>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#F0F5F1] text-[#7C9885] flex items-center justify-center shrink-0 mt-0.5">
              <Check size={12} />
            </div>
            <span><strong>Bármilyen étel elemzése:</strong> azonnali tenyér-számítás konyhamérleg nélkül.</span>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#F0F5F1] text-[#7C9885] flex items-center justify-center shrink-0 mt-0.5">
              <Check size={12} />
            </div>
            <span><strong>Családi adagolási trükkök:</strong> nem kell kétfélét főznöd a diétád miatt.</span>
          </div>
        </div>

        {/* FŐ CTA GOMB - STRIPE CHECKOUT */}
        <a
          href={STRIPE_CHECKOUT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 rounded-2xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-98 text-center mb-3"
          style={{ backgroundColor: C.coral }}
        >
          <Sparkles size={15} /> Csatlakozom a Prémiumhoz (3 490 Ft) <ArrowRight size={14} />
        </a>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 mb-4">
          <ShieldCheck size={12} /> Biztonságos Stripe bankkártyás fizetés • Azonnali hozzáférés
        </div>

        {/* KÓD MEGADÁSA (ha már vásárolt vagy tesztel) */}
        <form onSubmit={handleApplyCode} className="pt-3 border-t border-stone-100">
          <p className="text-[11px] text-stone-500 mb-1.5 text-center">
            Már vásároltál, vagy van feloldó kódod?
          </p>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Feloldó kód (pl. FITANYA)"
              className="flex-1 text-xs px-3 py-2 bg-stone-50 border rounded-xl outline-none"
              style={{ borderColor: promoError ? "#E07A5F" : C.border }}
            />
            <button
              type="submit"
              className="px-3 py-2 bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Aktiválom
            </button>
          </div>
          {promoError && (
            <p className="text-[10px] text-red-500 mt-1 text-center">
              Érvénytelen kód. Kérlek ellenőrizd!
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
