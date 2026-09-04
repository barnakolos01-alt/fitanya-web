import React, { useState, useEffect } from "react";
import { FitAnyaProvider, useFitAnya } from "./context/FitAnyaContext";
import { C, serif, sans } from "./styles/tokens";
import FridgeRecipeCopilot from "./components/modules/FridgeRecipeCopilot";
import PalmTrackerModule from "./components/modules/PalmTrackerModule";
import HydrationEngine from "./components/modules/HydrationEngine";
import SettingsModal from "./components/ui/SettingsModal";
import { Smartphone, Download, Share, PlusSquare, X, Settings } from "lucide-react";

const MODULES = [
  { key: "tracker", label: "Tányérom", Comp: PalmTrackerModule },
  { key: "fridge", label: "Hűtőmentő", Comp: FridgeRecipeCopilot },
  { key: "hydration", label: "Folyadék", Comp: HydrationEngine },
];

function PwaContent() {
  const { activeTab, setActiveTab } = useFitAnya();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem("fa_pwa_banner_dismissed") === "true";
    } catch {
      return false;
    }
  });

  const Active = (MODULES.find((m) => m.key === activeTab) || MODULES[0]).Comp;

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

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosModal(true);
    } else {
      alert(
        "A böngésződ menüjében (jobb felső sarok) válaszd az 'Alkalmazás telepítése' vagy 'Hozzáadás a kezdőképernyőhöz' lehetőséget!"
      );
    }
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      localStorage.setItem("fa_pwa_banner_dismissed", "true");
    } catch {}
  };

  return (
    <div
      className="max-w-md mx-auto min-h-screen pb-12 relative"
      style={{ backgroundColor: C.bg, fontFamily: sans }}
    >
      <style>{`
        @keyframes fitanya-fade { from{opacity:0; transform:translateY(4px);} to{opacity:1; transform:translateY(0);} }
      `}</style>

      {/* TELEPÍTÉSI SÁV */}
      {!isStandalone && !bannerDismissed && (
        <aside
          aria-label="Kezdőképernyőre kitűzés"
          className="bg-[#FFF9F5] border-b border-[#F0DCD4] px-4 py-2.5 flex items-center justify-between gap-2.5 shadow-sm select-none"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#FDE8E1] flex items-center justify-center text-[#E07A5F] shrink-0">
              <Smartphone size={15} />
            </div>
            <p className="text-[12px] text-[#2D3748] truncate">
              Tedd ki a <strong>kezdőképernyődre</strong> a gyors eléréshez!
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl text-white shadow-sm cursor-pointer flex items-center gap-1"
              style={{ backgroundColor: C.coral }}
            >
              <Download size={12} /> Kitűzés
            </button>
            <button
              type="button"
              onClick={handleDismissBanner}
              className="text-[#8A7268] hover:text-[#2D3748] p-1 cursor-pointer"
              title="Bezárás"
            >
              <X size={14} />
            </button>
          </div>
        </aside>
      )}

      {/* FEJLÉC ÉS BEÁLLÍTÁSOK GOMB */}
      <header className="px-5 pt-5 pb-4 flex items-center justify-between gap-3">
        <div>
          <h1 style={{ fontFamily: serif, color: C.textDark }} className="text-xl font-bold">
            FitAnya Zsebedző
          </h1>
          <p className="text-xs" style={{ color: C.textSoft }}>
            Konyhamérleg nélkül, a család ritmusában
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isStandalone && bannerDismissed && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full border border-[#F0DCD4] bg-white text-[#E07A5F] hover:bg-[#FDE8E1] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <Download size={12} /> Kitűzés
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="w-8 h-8 rounded-full border border-[#F0DCD4] bg-white text-stone-600 hover:text-[#E07A5F] hover:bg-[#FFF9F5] transition-colors flex items-center justify-center cursor-pointer shadow-sm"
            title="Profil és keretek beállítása"
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* 3 OSZLOPOS MENÜVÁLASZTÓ (Tányérom | Hűtőmentő | Folyadék) */}
      <div className="px-5 grid grid-cols-3 gap-2 mb-6 select-none">
        {MODULES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setActiveTab(m.key)}
            className="w-full text-center text-xs font-semibold py-2.5 px-1.5 rounded-2xl transition-all cursor-pointer truncate"
            style={
              activeTab === m.key
                ? { backgroundColor: C.coral, color: "#fff", boxShadow: "0 4px 12px -2px rgba(224,122,95,0.4)" }
                : { backgroundColor: C.cardAlt, color: C.textSoft, border: `1px solid ${C.border}` }
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* AKTÍV MODUL TARTALMA */}
      <main className="px-5">
        <Active />
      </main>

      {/* PROFIL & BEÁLLÍTÁSOK MODAL */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* iOS SAFARI TELEPÍTÉSI SEGÉD MODAL */}
      {showIosModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl relative border border-[#F0DCD4] animate-in fade-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center mb-4">
              <Smartphone size={24} />
            </div>

            <h3 style={{ fontFamily: serif }} className="font-bold text-lg text-[#2D3748] mb-2">
              Kitűzés iPhone-on
            </h3>
            <p className="text-xs text-[#6B5A52] leading-relaxed mb-5">
              Alig 5 másodperc, és a FitAnya ikonja megjelenik a telefonod főképernyőjén:
            </p>

            <ol className="space-y-3.5 text-xs text-[#2D3748] mb-6">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F0F5F1] text-[#7C9885] font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <span>
                  Koppints a Safari alsó sávjában a <strong>Megosztás</strong> ikonra (<Share size={13} className="inline mx-0.5 text-[#E07A5F]" />).
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F0F5F1] text-[#7C9885] font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <span>
                  Görgess lejjebb, és válaszd a <strong>„Főképernyőhöz adás”</strong> (<PlusSquare size={13} className="inline mx-0.5 text-[#E07A5F]" />) menüpontot.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F0F5F1] text-[#7C9885] font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <span>
                  Koppints a jobb felső sarokban a <strong>„Hozzáadás”</strong> gombra!
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="w-full py-3 rounded-xl font-bold text-xs text-white cursor-pointer shadow-sm"
              style={{ backgroundColor: C.coral }}
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
