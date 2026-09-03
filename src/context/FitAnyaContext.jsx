import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { calculateProfileFromForm, getTodayKey } from "../utils/calculateProfile";

// ---------------------------------------------------------------------------
// Megosztott állapot — FitAnyaContext valódi perzisztenciával
// ---------------------------------------------------------------------------
const FitAnyaContext = createContext(null);

export function FitAnyaProvider({ children }) {
  // 1. Profil betöltése a landing page auditjából (fa_form)
  const [profile] = useState(() => {
    try {
      const savedForm = localStorage.getItem("fa_form");
      if (savedForm) {
        return calculateProfileFromForm(JSON.parse(savedForm));
      }
    } catch (e) {
      console.warn("Hiba a profil betöltésekor:", e);
    }
    return calculateProfileFromForm(null);
  });

  // 2. Napi napló betöltése a mai nap kulcsából (napváltáskor automatikusan nullázódik)
  const [log, setLog] = useState(() => {
    const defaultLog = { protein: 0, veg: 0, carb: 0, fat: 0, waterMl: 0 };
    try {
      const todayKey = getTodayKey();
      const savedLog = localStorage.getItem(todayKey);
      if (savedLog) {
        return JSON.parse(savedLog);
      }
    } catch (e) {
      console.warn("Hiba a napi log betöltésekor:", e);
    }
    return defaultLog;
  });

  // Log mentése valahányszor változik
  useEffect(() => {
    try {
      const todayKey = getTodayKey();
      localStorage.setItem(todayKey, JSON.stringify(log));
    } catch (e) {}
  }, [log]);

  const logPortion = (delta) => {
    setLog((prev) => ({
      ...prev,
      protein: Math.max(0, prev.protein + (delta.protein || 0)),
      veg: Math.max(0, prev.veg + (delta.veg || 0)),
      carb: Math.max(0, prev.carb + (delta.carb || 0)),
      fat: Math.max(0, prev.fat + (delta.fat || 0)),
    }));
  };

  const addWater = (ml) => setLog((prev) => ({ ...prev, waterMl: Math.max(0, prev.waterMl + ml) }));

  const resetDay = () => {
    const fresh = { protein: 0, veg: 0, carb: 0, fat: 0, waterMl: 0 };
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

  const hydrationTargetMl = profile.weightKg * 35 + (profile.breastfeeding ? 600 : 0);

  const value = {
    profile,
    log,
    logPortion,
    addWater,
    resetDay,
    remaining,
    hydrationTargetMl,
  };

  return <FitAnyaContext.Provider value={value}>{children}</FitAnyaContext.Provider>;
}

export function useFitAnya() {
  const ctx = useContext(FitAnyaContext);
  if (!ctx) throw new Error("useFitAnya csak FitAnyaProvider-en belül használható");
  return ctx;
}
