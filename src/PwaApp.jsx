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
  { key: "tracker", label: "🍽️ Tányérom", Comp: PalmTrackerModule },
  { key: "builder", label: "✨ Mit ehetek?", Comp: InteractivePlateBuilder },
  { key: "fridge", label: "🧊 Hűtőmentő", Comp: FridgeRecipeCopilot },
  { key: "hydration", label: "💧 Folyadék", Comp: HydrationEngine },
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

  // HÉTFŐ REGGEL 8:00 UTÁNI INTELLIGENS FELUGRÓ ELLENŐRZÉS
  useEffect(() => {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 1 = Hétfő
      const currentHour = now.getHours();

      // Év + hét száma azonosítónak (pl. "2026-W36")
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
      alert("A böngésződ menüjében válaszd a 'Hozzáadás a kezdőképernyőhöz' lehetőséget!");
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
      {/* LÁGY, KEDVES FEJLÉC */}
      <header className="px-5 pt-6 pb-3 flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-[#C3634C] uppercase flex items-center gap-1">
            <Heart size={12} className="fill-[#E07A5F] text-[#E07A5F]" /> FitAnya Módszer
          </span>
          <h1 style={{ fontFamily: serif }} className="text-xl font-bold text-[#2D3748]">
            Zsebedző
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isStandalone && bannerDismissed && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#FFF5F0] border border-[#F5DED7] text-[#E07A5F] hover:bg-[#FDE8E1] transition-all flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Download size={12} /> Kitűzés
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

      {/* 4 FŐ GOMB (LETISZTULT, LÁGY NŐIES KAPSZULÁK) */}
      <nav className="px-4 grid grid-cols-4 gap-1.5 mb-5 select-none">
        {MODULES.map((m) => {
          const isActive = activeTab === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setActiveTab(m.key)}
              className={`py-2 px-1 rounded-2xl text-[11px] font-medium transition-all text-center cursor-pointer truncate ${
                isActive
                  ? "bg-[#E07A5F] text-white font-semibold shadow-sm scale-102"
                  : "bg-white/80 text-stone-600 border border-[#F2E5DF] hover:bg-white"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </nav>

      {/* AKTÍV NÉZET */}
      <main className="px-4">
        <Active />
      </main>

      {/* HÉTFŐ REGGELI KEDVES MOTIVÁCIÓS MODAL */}
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
              Kitűzés iPhone-on
            </h3>
            <p className="text-xs text-[#6B5A52] leading-relaxed mb-4">
              Koppints a Safari alsó sávjában a <strong>Megosztás</strong> ikonra (<Share size={13} className="inline text-[#E07A5F]" />), majd válaszd a <strong>„Főképernyőhöz adás”</strong> (<PlusSquare size={13} className="inline text-[#E07A5F]" />) lehetőséget!
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
