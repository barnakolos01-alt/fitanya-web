import React, { useState, useEffect } from "react";
import {
  Droplet,
  Plus,
  Minus,
  Bell,
  BellRing,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { C, serif } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";
import SectionHeader from "../ui/SectionHeader";
import { REMINDERS } from "../../utils/reminders";

// FOLYADÉK PRESETEK: Hidratáció + Makrólevonás + Cukor gramm
const DRINKS = [
  { id: "water", name: "Tiszta víz", icon: "💧", ml: 250, delta: {}, sugar: 0, desc: "0 kalória" },
  { id: "water_big", name: "Kulacs víz", icon: "🚰", ml: 500, delta: {}, sugar: 0, desc: "0 kalória" },
  { id: "coffee", name: "Fekete kávé / Tea", icon: "☕", ml: 150, delta: {}, sugar: 0, desc: "Cukormentes" },
  { id: "zero", name: "Zero üdítő", icon: "🥤", ml: 330, delta: {}, sugar: 0, desc: "0g cukor" },
  {
    id: "soda",
    name: "Cukros üdítő / Gyümölcslé",
    icon: "🧃",
    ml: 300,
    delta: { carb: 1 },
    sugar: 32,
    desc: "-1 Marék CH | 32g cukor",
    warning: true,
  },
  {
    id: "latte",
    name: "Tejeskávé / Cappuccino",
    icon: "☕🥛",
    ml: 250,
    delta: { carb: 0.5, fat: 0.5 },
    sugar: 12,
    desc: "-0.5 M / -0.5 H",
  },
  {
    id: "alcohol",
    name: "Alkohol (Bor / Sör)",
    icon: "🍷",
    ml: -100, // Dehidratál!
    delta: { carb: 1.5 },
    sugar: 10,
    desc: "-1.5 Marék CH (Dehidratál)",
    warning: true,
  },
];

export default function HydrationEngine() {
  const { profile, log, addWater, logDrink, hydrationTargetMl } = useFitAnya();
  const [reminderIdx, setReminderIdx] = useState(0);
  const [notificationStatus, setNotificationStatus] = useState("default");
  const [subscribing, setSubscribing] = useState(false);
  const [lastLoggedText, setLastLoggedText] = useState(null);

  useEffect(() => {
    const id = setInterval(
      () => setReminderIdx((i) => (i + 1) % REMINDERS.length),
      6000
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationStatus(Notification.permission);
    } else {
      setNotificationStatus("unsupported");
    }
  }, []);

  const handleRequestNotification = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      alert("A push értesítésekhez szükséges a PWA kezdőképernyőre tűzése.");
      return;
    }

    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);

      if (permission === "granted") {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await fetch("/api/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription }),
          });
        }

        registration.showNotification("FitAnya Folyadék 💧", {
          body: "Szuper! Az emlékeztetők aktívak. Időben szólni fogunk inni!",
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
        });
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setSubscribing(false);
    }
  };

  const handleDrinkClick = (drink) => {
    logDrink({
      name: drink.name,
      ml: drink.ml,
      delta: drink.delta,
      sugarGrams: drink.sugar,
    });

    setLastLoggedText(`Rögzítve: ${drink.name}`);
    setTimeout(() => setLastLoggedText(null), 2000);
  };

  const currentMl = log.waterMl || 0;
  const pct = Math.min(100, Math.round((currentMl / hydrationTargetMl) * 100));
  const sugarTotal = log.sugarGrams || 0;
  const sugarCubes = Math.round(sugarTotal / 3.5);

  return (
    <div>
      <SectionHeader
        title="Folyadék & Rejtett Kalóriák"
        subtitle={`Személyes célod: ${(hydrationTargetMl / 1000).toFixed(1)} liter / nap${
          profile.breastfeeding ? " (szoptatási védelemmel)" : ""
        }`}
        icon={Droplet}
      />

      {/* FŐ HIDRATÁCIÓS KÁRTYA */}
      <div
        className="rounded-3xl p-5 mb-4 flex flex-col items-center select-none"
        style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
      >
        {/* POHÁR */}
        <div className="relative w-24 h-36 mb-3">
          <div
            className="absolute inset-0 rounded-b-3xl rounded-t-xl overflow-hidden shadow-inner"
            style={{
              border: `2px solid ${C.border}`,
              backgroundColor: "#FFF9F5",
            }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out"
              style={{
                height: `${pct}%`,
                background:
                  pct >= 100
                    ? "linear-gradient(180deg, #7C9885 0%, #5E7A67 100%)"
                    : "linear-gradient(180deg, #E68C6F 0%, #E07A5F 100%)",
                opacity: 0.85,
              }}
            />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-2xl font-bold tracking-tight"
              style={{
                color: pct > 45 ? "#FFFFFF" : C.textDark,
                fontFamily: serif,
                textShadow: pct > 45 ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
              }}
            >
              {pct}%
            </span>
          </div>
        </div>

        <p
          className="text-base font-semibold mb-1"
          style={{ color: C.textDark, fontFamily: serif }}
        >
          {(currentMl / 1000).toFixed(2)} liter / {(hydrationTargetMl / 1000).toFixed(1)} liter
        </p>

        {/* GYORS VISSZAJELZÉS */}
        {lastLoggedText && (
          <p className="text-xs font-bold text-[#7C9885] animate-in fade-in mb-2">
            ✓ {lastLoggedText}
          </p>
        )}
      </div>

      {/* REJTETT CUKOR SOKK KÁRTYA */}
      {sugarTotal > 0 && (
        <div className="rounded-2xl p-3.5 mb-4 bg-[#FFF5F2] border border-[#F5D5C8] flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center font-bold text-sm">
              🍬
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D3748]">
                Ma megivott rejtett cukor: <span className="text-[#C3634C]">{sugarTotal} g</span>
              </p>
              <p className="text-[11px] text-[#6B5A52]">
                Ez kb. <strong>{sugarCubes} kockacukornak</strong> felel meg!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ITALVÁLASZTÓ LISTA */}
      <div
        className="rounded-3xl p-4 mb-4 select-none"
        style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
      >
        <p className="text-xs font-bold text-stone-700 mb-3 uppercase tracking-wider">
          Mit ittál épp? (Koppints a rögzítéshez)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DRINKS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => handleDrinkClick(d)}
              className="p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all active:scale-98 hover:bg-[#FFF9F5]"
              style={{
                borderColor: d.warning ? "#F0C8BC" : C.border,
                backgroundColor: d.warning ? "#FFFBF9" : "#FFFDFB",
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                <span className="text-lg shrink-0">{d.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-800 truncate">{d.name}</p>
                  <p className="text-[10px] text-stone-400 font-medium truncate">{d.desc}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#E07A5F] px-2 py-1 bg-white rounded-lg border border-[#F0DCD4] shrink-0">
                + {d.ml > 0 ? `${d.ml} ml` : `${d.ml} ml`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* PUSH ÉRTESÍTÉSEK */}
      {notificationStatus !== "unsupported" && notificationStatus !== "granted" && (
        <div className="mb-3 p-3.5 rounded-2xl bg-[#FFF9F5] border border-[#F0DCD4] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center shrink-0">
              <Bell size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D3748]">Kérsz ivás emlékeztetőt?</p>
              <p className="text-[11px] text-[#6B5A52]">Szólunk, ha kimaradna a víz.</p>
            </div>
          </div>

          <button
            type="button"
            disabled={subscribing}
            onClick={handleRequestNotification}
            className="text-[11px] font-bold px-3 py-1.5 rounded-xl text-white cursor-pointer shrink-0 shadow-sm flex items-center gap-1"
            style={{ backgroundColor: C.coral }}
          >
            {subscribing ? <Loader2 size={12} className="animate-spin" /> : null}
            <span>Bekapcsolás</span>
          </button>
        </div>
      )}
    </div>
  );
}
