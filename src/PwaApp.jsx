import React, { useState, useEffect } from "react";
import { FitAnyaProvider, useFitAnya } from "./context/FitAnyaContext";
import { C, serif, sans } from "./styles/tokens";
import FridgeRecipeCopilot from "./components/modules/FridgeRecipeCopilot";
import PalmTrackerModule from "./components/modules/PalmTrackerModule";
import HydrationEngine from "./components/modules/HydrationEngine";
import InteractivePlateBuilder from "./components/modules/InteractivePlateBuilder";
import SettingsModal from "./components/ui/SettingsModal";
import PaywallModal from "./components/ui/PaywallModal";
import WeeklySummaryCard from "./components/ui/WeeklySummaryCard";
import { Smartphone, Download, Share, PlusSquare, X, Settings, Sparkles, Heart } from "lucide-react";

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
  const { activeTab, setActiveTab } = useFitAnya();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
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
      const dayOfWeek = now.getDay(); // 1 = Hétfő
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
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosModal(true);
    } else {
      alert("A böngésződ menüjében válaszd az 'Alkalmazás telepítése' vagy 'Hozzáadás a kezdőképernyőhöz' lehetőséget!");
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
      {/* 1. TELEPÍTÉSI SÁV - ÉRTHETŐ "LETÖLTÉS" SZÖVEGEZÉSSEL */}
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
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl text-white shadow-xs cursor-pointer flex items-center gap-1"
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

      {/* 2. FEJLÉC - LETÖLTÉS GOMBBAL */}
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

      {/* 3. 2×2-ES FUNKCIÓVÁLASZTÓ KÁRTYÁK */}
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

      {/* MODALOK */}
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
      <PaywallModal />

      {/* iPHONE SEGÉD MODAL - ÉRTHETŐ LÉPÉSEKKEL */}
      {showIosModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl relative border border-[#F0DCD4]">
            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5"
            >
              <X size={18} />
            </button>
            <h3 style={{ fontFamily: serif }} className="font-bold text-lg text-[#2D3748] mb-2">
              App letöltése iPhone-ra
            </h3>
            <p className="text-xs text-[#6B5A52] leading-relaxed mb-4">
              Koppints a Safari alsó sávjában a <strong>Megosztás</strong> ikonra (<Share size={13} className="inline text-[#E07A5F]" />), majd válaszd a <strong>„Főképernyőhöz adás”</strong> (<PlusSquare size={13} className="inline text-[#E07A5F]" />) lehetőséget az azonnali letöltéshez!
            </p>
            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="w-full py-3 rounded-xl font-bold text-xs text-white bg-[#E07A5F] cursor-pointer"
            >
              Értem, megcsinálom!
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
