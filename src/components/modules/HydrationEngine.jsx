import React, { useState, useEffect } from "react";
import {
  Droplet,
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

// ANYUKA-BARÁT PRESETEK: Nincs ml matekozás, tiszta hétköznapi mértékek
const DRINKS = [
  {
    id: "water_glass",
    name: "Tiszta víz",
    icon: "💧",
    btnLabel: "+ 1 pohár",
    ml: 250,
    delta: {},
    sugar: 0,
    desc: "0 kalória, tiszta hidratáció",
  },
  {
    id: "water_bottle",
    name: "Kulacs víz",
    icon: "🚰",
    btnLabel: "+ 1 kulacs",
    ml: 500,
    delta: {},
    sugar: 0,
    desc: "0 kalória, fél liter pipa",
  },
  {
    id: "coffee",
    name: "Fekete kávé / Tea",
    icon: "☕",
    btnLabel: "+ 1 bögre",
    ml: 150,
    delta: {},
    sugar: 0,
    desc: "Cukormentes frissítő",
  },
  {
    id: "zero",
    name: "Zero üdítő",
    icon: "🥤",
    btnLabel: "+ 1 pohár",
    ml: 250,
    delta: {},
    sugar: 0,
    desc: "0g cukor, nem bántja a keretet",
  },
  {
    id: "latte",
    name: "Tejeskávé / Cappuccino / Latte",
    icon: "☕🥛",
    btnLabel: "+ 1 bögre",
    ml: 200,
    delta: { carb: 0.5, fat: 0.5 },
    sugar: 10,
    desc: "-0.5 M szénhidrát | -0.5 H zsír",
  },
  {
    id: "soda",
    name: "Cukros üdítő / Szörp / Gyümölcslé",
    icon: "🧃",
    btnLabel: "+ 1 pohár",
    ml: 250,
    delta: { carb: 1 },
    sugar: 28,
    desc: "-1 Marék szénhidrát a tányérodról!",
    warning: true,
  },
  {
    id: "alcohol",
    name: "Alkohol (Bor, Fröccs, Sör)",
    icon: "🍷",
    btnLabel: "+ 1 pohár",
    ml: -150, // Dehidratál
    delta: { carb: 1.5 },
    sugar: 8,
    desc: "-1.5 Marék szénhidrát (Dehidratál!)",
    warning: true,
  },
];

export default function HydrationEngine() {
  const { profile, log, logDrink, hydrationTargetMl } = useFitAnya();
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
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationStatus(Notification.permission);
    } else {
      setNotificationStatus("unsupported");
    }
  }, []);

  const handleRequestNotification = async () => {
    if (!("Notification" in window)) {
      alert("A böngésződ sajnos nem támogatja az értesítéseket. Mentsd a PWA-t a kezdőképernyőre!");
      return;
    }

    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);

      if (permission === "granted") {
        const title = "FitAnya Folyadék 💧";
        const options = {
          body: "Szuper! Az emlékeztető aktív, szólni fogunk, hogy igyál!",
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
        };

        // Megerősítő értesítés (Service Worker vagy fallback)
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            registration.showNotification(title, options);
          } else {
            new Notification(title, options);
          }
        } else {
          new Notification(title, options);
        }

        // Időzített értesítés (2 óránként = 7200000 ms)
        setInterval(() => {
          const reminderText = "Itt az idő egy pohár vízre! Felfrissít és segít az energiaszintedben. 💧";
          if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.getRegistration().then((reg) => {
              if (reg) {
                reg.showNotification("FitAnya Vízidő 💧", {
                  body: reminderText,
                  icon: "/icons/icon-192.png",
                });
              } else {
                new Notification("FitAnya Vízidő 💧", {
                  body: reminderText,
                  icon: "/icons/icon-192.png",
                });
              }
            });
          } else {
            new Notification("FitAnya Vízidő 💧", {
              body: reminderText,
              icon: "/icons/icon-192.png",
            });
          }
        }, 7200000);
      } else if (permission === "denied") {
        alert("Az értesítések le vannak tiltva a böngésződben. A címsor melletti beállítások ikonra kattintva tudod engedélyezni!");
      }
    } catch (err) {
      console.error("Értesítés hiba:", err);
      alert("Nem sikerült bekapcsolni az értesítéseket. Ellenőrizd a böngésző engedélyeit!");
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

    setLastLoggedText(`✓ Rögzítve: ${drink.name}`);
    setTimeout(() => setLastLoggedText(null), 2200);
  };

  const currentMl = Math.max(0, log.waterMl || 0);
  const pct = Math.min(100, Math.round((currentMl / hydrationTargetMl) * 100));
  const sugarTotal = log.sugarGrams || 0;
  const sugarCubes = Math.round(sugarTotal / 3.5);

  return (
    <div>
      <SectionHeader
        title="Folyadék & Rejtett Kalóriák"
        subtitle={`Személyes célod: ${(hydrationTargetMl / 1000).toFixed(1)} liter tiszta víz naponta${
          profile.breastfeeding ? " (szoptatási védelemmel)" : ""
        }`}
        icon={Droplet}
      />

      {/* VIZUÁLIS POHÁR */}
      <div
        className="rounded-3xl p-5 mb-4 flex flex-col items-center select-none"
        style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
      >
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

        {lastLoggedText && (
          <p className="text-xs font-bold text-[#7C9885] animate-in fade-in">
            {lastLoggedText}
          </p>
        )}
      </div>

      {/* REJTETT CUKOR SOKK-DOBOZ */}
      {sugarTotal > 0 && (
        <div className="rounded-2xl p-3.5 mb-4 bg-[#FFF5F2] border border-[#F5D5C8] flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center font-bold text-sm">
              🍬
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D3748]">
                Ma megivott felesleges cukor: <span className="text-[#C3634C]">{sugarTotal} g</span>
              </p>
              <p className="text-[11px] text-[#6B5A52]">
                Ez összesen kb. <strong>{sugarCubes} kockacukornak</strong> felel meg!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ITALOK LISTÁJA */}
      <div
        className="rounded-3xl p-4 mb-4 select-none"
        style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
      >
        <p className="text-xs font-bold text-stone-700 mb-3 uppercase tracking-wider">
          Mit ittál épp? (Koppints a rögzítéshez)
        </p>

        <div className="space-y-2">
          {DRINKS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => handleDrinkClick(d)}
              className="w-full p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all active:scale-98 hover:bg-[#FFF9F5]"
              style={{
                borderColor: d.warning ? "#F0C8BC" : C.border,
                backgroundColor: d.warning ? "#FFFBF9" : "#FFFDFB",
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span className="text-lg shrink-0">{d.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-800 truncate">{d.name}</p>
                  <p className="text-[10px] text-stone-400 font-medium truncate">{d.desc}</p>
                </div>
              </div>

              {/* TISZTA ÉS EGYÉRTELMŰ GOMB-FELIRAT */}
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-xl border shrink-0 shadow-xs"
                style={{
                  backgroundColor: d.warning ? "#FFF3EE" : "#FFFFFF",
                  borderColor: d.warning ? "#E07A5F" : "#F0DCD4",
                  color: d.warning ? "#C3634C" : "#E07A5F",
                }}
              >
                {d.btnLabel}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ÉRTESÍTÉSEK */}
      {notificationStatus !== "unsupported" && (
        <div className="mb-3 p-3.5 rounded-2xl bg-[#FFF9F5] border border-[#F0DCD4] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center shrink-0">
              {notificationStatus === "granted" ? <BellRing size={16} /> : <Bell size={16} />}
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D3748]">
                {notificationStatus === "granted" ? "Vízivás emlékeztető aktív" : "Kérsz ivás emlékeztetőt?"}
              </p>
              <p className="text-[11px] text-[#6B5A52]">
                {notificationStatus === "granted" ? "2 óránként szólunk, hogy hidratálj." : "Szólunk, ha elfelejtenél inni."}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={subscribing || notificationStatus === "granted"}
            onClick={handleRequestNotification}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer shrink-0 shadow-sm flex items-center gap-1 transition-all ${
              notificationStatus === "granted"
                ? "bg-[#7C9885] text-white cursor-default"
                : "text-white"
            }`}
            style={{ backgroundColor: notificationStatus === "granted" ? "#7C9885" : C.coral }}
          >
            {subscribing ? (
              <Loader2 size={12} className="animate-spin" />
            ) : notificationStatus === "granted" ? (
              <CheckCircle2 size={12} />
            ) : null}
            <span>{notificationStatus === "granted" ? "Bekapcsolva" : "Bekapcsolás"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
