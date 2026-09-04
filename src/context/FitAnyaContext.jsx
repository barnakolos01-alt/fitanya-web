import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { calculateProfileFromForm, getTodayKey } from "../utils/calculateProfile";

const FitAnyaContext = createContext(null);
export const MAX_FREE_AI_CREDITS = 3;

export function FitAnyaProvider({ children }) {
  const [activeTab, setActiveTab] = useState("tracker");
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  // 1. PRÉMIUM STÁTUSZ KEZELÉSE (LocalStorage + Stripe URL paraméter figyelés)
  const [isPremium, setIsPremium] = useState(() => {
    try {
      return localStorage.getItem("fa_is_premium") === "true";
    } catch {
      return false;
    }
  });

  // Stripe visszatérés figyelése (?access=unlocked vagy ?session_id)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("access") === "unlocked" || params.get("session_id")) {
        localStorage.setItem("fa_is_premium", "true");
        setIsPremium(true);
        // URL tisztítása újratöltés nélkül
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.warn("URL paraméter hiba:", e);
    }
  }, []);

  // 2. INGYENES AI KVÓTA SZÁMLÁLÓ
  const [aiUsageCount, setAiUsageCount] = useState(() => {
    try {
      return parseInt(localStorage.getItem("fa_ai_usage") || "0", 10);
    } catch {
      return 0;
    }
  });

  // AI kredit levonásának logikája
  const consumeAiCredit = () => {
    if (isPremium) return true;

    if (aiUsageCount >= MAX_FREE_AI_CREDITS) {
      setIsPaywallOpen(true);
      return false;
    }

    const next = aiUsageCount + 1;
    setAiUsageCount(next);
    try {
      localStorage.setItem("fa_ai_usage", String(next));
    } catch {}
    return true;
  };

  const unlockPremium = () => {
    setIsPremium(true);
    try {
      localStorage.setItem("fa_is_premium", "true");
    } catch {}
    setIsPaywallOpen(false);
  };

  // 3. PROFIL ÉS NAPI LOG
  const [profile, setProfile] = useState(() => {
    try {
      const savedForm = localStorage.getItem("fa_form");
      if (savedForm) return calculateProfileFromForm(JSON.parse(savedForm));
    } catch (e) {}
    return calculateProfileFromForm(null);
  });

  const [log, setLog] = useState(() => {
    const defaultLog = {
      protein: 0,
      veg: 0,
      carb: 0,
      fat: 0,
      waterMl: 0,
      sugarGrams: 0,
      entries: [],
    };
    try {
      const todayKey = getTodayKey();
      const savedLog = localStorage.getItem(todayKey);
      if (savedLog) {
        const parsed = JSON.parse(savedLog);
        return {
          ...defaultLog,
          ...parsed,
          entries: Array.isArray(parsed.entries) ? parsed.entries : [],
        };
      }
    } catch (e) {}
    return defaultLog;
  });

  useEffect(() => {
    try {
      localStorage.setItem(getTodayKey(), JSON.stringify(log));
    } catch (e) {}
  }, [log]);

  const updateProfile = (formData) => {
    try {
      localStorage.setItem("fa_form", JSON.stringify(formData));
      setProfile(calculateProfileFromForm(formData));
    } catch (e) {}
  };

  const logPortion = (delta, label = null) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      time: timeStr,
      label: label || "Gyors korrekció",
      delta: {
        protein: delta.protein || 0,
        veg: delta.veg || 0,
        carb: delta.carb || 0,
        fat: delta.fat || 0,
      },
    };

    setLog((prev) => ({
      ...prev,
      protein: Math.max(0, prev.protein + (delta.protein || 0)),
      veg: Math.max(0, prev.veg + (delta.veg || 0)),
      carb: Math.max(0, prev.carb + (delta.carb || 0)),
      fat: Math.max(0, prev.fat + (delta.fat || 0)),
      entries: [newEntry, ...(prev.entries || [])],
    }));
  };

  const removeEntry = (entryId) => {
    setLog((prev) => {
      const target = (prev.entries || []).find((e) => e.id === entryId);
      if (!target) return prev;

      return {
        ...prev,
        protein: Math.max(0, prev.protein - (target.delta.protein || 0)),
        veg: Math.max(0, prev.veg - (target.delta.veg || 0)),
        carb: Math.max(0, prev.carb - (target.delta.carb || 0)),
        fat: Math.max(0, prev.fat - (target.delta.fat || 0)),
        entries: (prev.entries || []).filter((e) => e.id !== entryId),
      };
    });
  };

  const addWater = (ml) =>
    setLog((prev) => ({ ...prev, waterMl: Math.max(0, prev.waterMl + ml) }));

  const logDrink = ({ name, ml, delta = {}, sugarGrams = 0 }) => {
    if (ml !== 0) addWater(ml);
    if (delta.carb || delta.fat || delta.protein || delta.veg) {
      logPortion(delta, `Folyadék: ${name}`);
    }
    if (sugarGrams > 0) {
      setLog((prev) => ({
        ...prev,
        sugarGrams: (prev.sugarGrams || 0) + sugarGrams,
      }));
    }
  };

  const resetDay = () => {
    const fresh = { protein: 0, veg: 0, carb: 0, fat: 0, waterMl: 0, sugarGrams: 0, entries: [] };
    setLog(fresh);
    try {
      localStorage.setItem(getTodayKey(), JSON.stringify(fresh));
    } catch (e) {}
  };

  const remaining = useMemo(
    () => ({
      protein: Math.max(0, profile.palmProtein - log.protein),
      veg: Math.max(0, profile.fistVeg - log.veg),
      carb: Math.max(0, profile.cuppedCarb - log.carb),
      fat: Math.max(0, profile.thumbFat - log.fat),
    }),
    [profile, log]
  );

  const hydrationTargetMl =
    profile.weightKg * 35 + (profile.breastfeeding ? 600 : 0);

  const value = {
    profile,
    updateProfile,
    log,
    logPortion,
    logDrink,
    removeEntry,
    addWater,
    resetDay,
    remaining,
    hydrationTargetMl,
    activeTab,
    setActiveTab,
    // Paywall & AI kvóta mezők:
    isPremium,
    aiUsageCount,
    consumeAiCredit,
    unlockPremium,
    isPaywallOpen,
    setIsPaywallOpen,
  };

  return <FitAnyaContext.Provider value={value}>{children}</FitAnyaContext.Provider>;
}

export function useFitAnya() {
  const ctx = useContext(FitAnyaContext);
  if (!ctx) throw new Error("useFitAnya csak FitAnyaProvider-en belül használható");
  return ctx;
}
