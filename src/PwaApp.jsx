import React, { useState, useEffect } from "react";
import { FitAnyaProvider, useFitAnya } from "./context/FitAnyaContext";
import { C, serif, sans } from "./styles/tokens";
import FridgeRecipeCopilot from "./components/modules/FridgeRecipeCopilot";
import PalmTrackerModule from "./components/modules/PalmTrackerModule";
import HydrationEngine from "./components/modules/HydrationEngine";
import InteractivePlateBuilder from "./components/modules/InteractivePlateBuilder";
import SettingsModal from "./components/ui/SettingsModal";
import PaywallModal from "./components/ui/PaywallModal";
import FullQuizModal from "./components/ui/FullQuizModal";
import WeeklySummaryCard from "./components/ui/WeeklySummaryCard";
import { Smartphone, Download, Share, PlusSquare, X, Settings, Sparkles, Heart, MoreVertical, Check } from "lucide-react";

const MODULES = [
  { 
    key: "tracker", 
    icon: "🍽️", 
    label: "Tányérom", 
    desc: "Mai étkezések", 
    Comp: PalmTrackerModule 
  },
  { 
    key: "builder", 
    icon: "✨", 
    label: "Mit ehetek még?", 
    desc: "Tányérépítő", 
    Comp: InteractivePlateBuilder 
  },
  { 
    key: "fridge", 
    icon: "🧊", 
    label: "Hűtőmentő", 
    desc: "AI maradékmentő", 
    Comp: FridgeRecipeCopilot 
  },
  { 
    key: "hydration", 
    icon: "💧", 
    label: "Folyadék", 
    desc: "Napi vízbevitel", 
    Comp: HydrationEngine 
  },
];

function PwaContent() {
  const { activeTab, setActiveTab, isPremium, setIsPaywallOpen } = useFitAnya();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // TELJES AUDIT ONBOARDING: Ha nincs kitöltve teszt adat, a 7 lépéses audit ugrik fel!
  const [showFullQuizModal, setShowFullQuizModal] = useState(() => {
    try {
      return !localStorage.getItem("fa_form");
    } catch {
      return false;
    }
  });

  const [showMondayModal, setShowMondayModal] = useState(false);

  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem("fa_pwa_banner_dismissed") === "true";
    } catch {
      return false;
    }
  });

  const Active = (MODULES.find((m) => m.key === activeTab) || MODULES[0]).Comp;

  // HÉTFŐ REGGEL 8:00 UTÁNI INTELLIGENS FELUGRÓ
  useEffect(() => {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentHour = now.getHours();

      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      const pastDaysOfYear = (now - firstDayOfYear) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      const currentWeekKey = `${now.getFullYear()}-W${weekNumber}`;
      const lastShownWeek = localStorage.getItem("fa_monday_summary_shown");

      if (dayOfWeek === 1 && currentHour >= 8 && lastShownWeek !== currentWeekKey) {
        setShowMondayModal(true);
      }
    } catch (e) {
      console.error("Hétfői modal hiba:", e);
    }
  }, []);

  const handleCloseMondayModal = () => {
    try {
      const now = new Date();
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      const pastDaysOfYear = (now - firstDayOfYear) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      localStorage.setItem("fa_monday_summary_shown", `${now.getFullYear()}-W${weekNumber}`);
    } catch {}
    setShowMondayModal(false);
  };

  useEffect(() => {
    const checkStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (checkStandalone) {
      setIsStandalone(true);
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setDeferredPrompt(null);
        }
      } catch (err) {
        setShowInstallGuideModal(true);
      }
    } else {
      setShowInstallGuideModal(true);
    }
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      localStorage.setItem("fa_pwa_banner_dismissed", "true");
    } catch {}
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-12 relative bg-[#FDFBF7]" style={{ fontFamily: sans }}>
      {/* 1. TELEPÍTÉSI SÁV */}
      {!isStandalone && !bannerDismissed && (
        <aside
          aria-label="Alkalmazás letöltése"
          className="bg-[#FFF9F5] border-b border-[#F0DCD4] px-4 py-2.5 flex items-center justify-between gap-2 shadow-xs select-none"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#FDE8E1] flex items-center justify-center text-[#E07A5F] shrink-0">
              <Smartphone size={15} />
            </div>
            <p className="text-[12px] text-[#2D3748] truncate">
              <strong>Töltsd le telefonra</strong> a gyors, 1-kattintásos eléréshez!
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl text-white shadow-xs cursor-pointer flex items-center gap-1 hover:opacity-95 transition-opacity"
              style={{ backgroundColor: C.coral }}
            >
              <Download size={12} /> Letöltés
            </button>
            <button
              type="button"
              onClick={handleDismissBanner}
              className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              title="Bezárás"
            >
              <X size={14} />
            </button>
          </div>
        </aside>
      )}

      {/* 2. FEJLÉC */}
      <header className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-[#C3634C] uppercase flex items-center gap-1">
            <Heart size={12} className="fill-[#E07A5F] text-[#E07A5F]" /> FitAnya Módszer
          </span>
          <h1 style={{ fontFamily: serif }} className="text-xl font-bold text-[#2D3748]">
            Zsebedző
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* PRÉMIUM AKTIVÁLÁSA GOMB NEM-ELŐFIZETŐKNEK */}
          {!isPremium && (
            <button
              type="button"
              onClick={() => setIsPaywallOpen(true)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-[#E07A5F] to-[#C3634C] text-white shadow-xs hover:opacity-95 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Sparkles size={12} />
              <span>7 nap 0 Ft</span>
            </button>
          )}

          {!isStandalone && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full border border-[#F0DCD4] bg-[#FFF5F0] text-[#E07A5F] hover:bg-[#FDE8E1] transition-all flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Download size={12} /> Letöltés
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="w-8 h-8 rounded-full bg-white border border-[#F0DCD4] text-stone-500 hover:text-[#E07A5F] transition-all flex items-center justify-center cursor-pointer shadow-xs"
            title="Profil és keretek"
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* 3. FUNKCIÓVÁLASZTÓ KÁRTYÁK */}
      <nav className="px-4 grid grid-cols-2 gap-2 mb-5 select-none">
        {MODULES.map((m) => {
          const isActive = activeTab === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setActiveTab(m.key)}
              className={`p-2.5 rounded-2xl transition-all cursor-pointer flex items-center gap-2.5 text-left border ${
                isActive
                  ? "bg-[#E07A5F] text-white border-[#E07A5F] shadow-sm scale-[1.01]"
                  : "bg-white text-stone-700 border-[#F2E5DF] hover:bg-[#FFF9F6]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 ${
                  isActive ? "bg-white/20" : "bg-[#FFF2EB]"
                }`}
              >
                {m.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold leading-tight truncate ${isActive ? "text-white" : "text-stone-800"}`}>
                  {m.label}
                </p>
                <p className={`text-[10px] leading-tight mt-0.5 truncate ${isActive ? "text-white/80" : "text-stone-400"}`}>
                  {m.desc}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* 4. AKTÍV NÉZET */}
      <main className="px-4">
        <Active />
      </main>

      {/* HÉTFŐ REGGELI MOTIVÁCIÓS MODAL */}
      {showMondayModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-[#F5DED7] animate-in fade-in zoom-in-95">
            <div className="text-center mb-4">
              <span className="w-12 h-12 mx-auto rounded-2xl bg-[#FFF5F0] text-[#E07A5F] flex items-center justify-center mb-2">
                <Sparkles size={24} />
              </span>
              <h3 style={{ fontFamily: serif }} className="text-lg font-bold text-[#2D3748]">
                Új hét, új lendület! 🌸
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Fantasztikus anyuka vagy, nézd meg a múlt heti egyensúlyodat:
              </p>
            </div>

            <div className="mb-4">
              <WeeklySummaryCard />
            </div>

            <button
              type="button"
              onClick={handleCloseMondayModal}
              className="w-full py-3 rounded-2xl font-bold text-xs text-white bg-[#E07A5F] shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
            >
              Köszönöm, induljon a hét! ✨
            </button>
          </div>
        </div>
      )}

      {/* MODALOK: TELJES AUDIT ONBOARDING, BEÁLLÍTÁSOK ÉS PAYWALL */}
      <FullQuizModal isOpen={showFullQuizModal} onClose={() => setShowFullQuizModal(false)} />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
      <PaywallModal />

      {/* TELEPÍTÉSI ÚTMUTATÓ MODAL */}
      {showInstallGuideModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl relative border border-[#F0DCD4] max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowInstallGuideModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 cursor-pointer rounded-full bg-[#FDFBF7]"
              title="Bezárás"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF5F0] text-[#E07A5F] flex items-center justify-center mx-auto mb-2">
                <Smartphone size={24} />
              </div>
              <h3 style={{ fontFamily: serif }} className="font-bold text-lg text-[#2D3748]">
                Hogyan tedd ki a mobilodra?
              </h3>
              <p className="text-xs text-[#6B5A52] mt-1">
                Nem kell letöltened semmit az áruházból: 2 egyszerű lépéssel kint lesz az ikonja a telefonodon!
              </p>
            </div>

            <div className={`p-3.5 rounded-2xl border mb-3 text-left ${!isIos ? "bg-[#FFF9F5] border-[#F0DCD4]" : "bg-[#FDFBF7] border-stone-200 opacity-80"}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xs font-bold text-[#E07A5F]">🤖 Android / Facebook böngésző:</span>
              </div>
              <ol className="text-xs text-[#4A5568] space-y-1.5 pl-1">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-[#E07A5F]">1.</span>
                  <span>Koppints a jobb felső sarokban a <strong>három pontra (<MoreVertical size={13} className="inline text-[#E07A5F]" />)</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-[#E07A5F]">2.</span>
                  <span>Válaszd a <strong>„Hozzáadás a kezdőképernyőhöz”</strong> lehetőséget!</span>
                </li>
              </ol>
            </div>

            <div className={`p-3.5 rounded-2xl border mb-4 text-left ${isIos ? "bg-[#FFF9F5] border-[#F0DCD4]" : "bg-[#FDFBF7] border-stone-200 opacity-80"}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xs font-bold text-[#2D3748]">🍏 iPhone (Safari):</span>
              </div>
              <ol className="text-xs text-[#4A5568] space-y-1.5 pl-1">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-[#E07A5F]">1.</span>
                  <span>Koppints lenn a <strong>Megosztás (<Share size={13} className="inline text-[#E07A5F]" />)</strong> gombra.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-[#E07A5F]">2.</span>
                  <span>Görgess le és válaszd a <strong>„Főképernyőhöz adás” (<PlusSquare size={13} className="inline text-[#E07A5F]" />)</strong> lehetőséget!</span>
                </li>
              </ol>
            </div>

            <div className="flex items-center justify-center gap-1.5 bg-[#F0F5F1] text-[#526356] py-2 px-3 rounded-xl mb-4 text-[11px] font-medium">
              <Check size={14} className="text-[#7C9885] shrink-0" />
              <span>Letöltés nélkül, közvetlenül innen is működik!</span>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallGuideModal(false)}
              className="w-full py-3 rounded-2xl font-bold text-xs text-white bg-[#E07A5F] shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
            >
              Értem, használom az appot! ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PwaApp() {
  return (
    <FitAnyaProvider>
      <PwaContent />
    </FitAnyaProvider>
  );
}
