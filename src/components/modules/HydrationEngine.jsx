import React, { useState, useEffect } from "react";
import {
  Droplet,
  Plus,
  Minus,
  Sparkles,
  Bell,
  BellRing,
  CheckCircle2,
} from "lucide-react";
import { C, serif } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";
import SectionHeader from "../ui/SectionHeader";
import { REMINDERS } from "../../utils/reminders";

export default function HydrationEngine() {
  const { profile, log, addWater, hydrationTargetMl } = useFitAnya();
  const [reminderIdx, setReminderIdx] = useState(0);
  const [notificationStatus, setNotificationStatus] = useState("default");

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
    if (!("Notification" in window)) {
      alert("A böngésződ nem támogatja a közvetlen push értesítéseket.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);

      if (permission === "granted") {
        const title = "FitAnya Zsebedző 💧";
        const options = {
          body: "Szuper! Bekapcsoltad az emlékeztetőket. Időben szólni fogunk, hogy igyál egy kortyot!",
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
        };

        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          registration.showNotification(title, options);
        } else {
          new Notification(title, options);
        }
      }
    } catch (err) {
      console.warn("Értesítési engedélykérés hiba:", err);
    }
  };

  const currentMl = log.waterMl || 0;
  const pct = Math.min(100, Math.round((currentMl / hydrationTargetMl) * 100));
  const remainingMl = Math.max(0, hydrationTargetMl - currentMl);

  return (
    <div>
      <SectionHeader
        title="Hidratációs Motor"
        subtitle={`Személyes célod: ${(hydrationTargetMl / 1000).toFixed(1)} liter / nap${
          profile.breastfeeding ? " (szoptatási védelemmel)" : ""
        }`}
        icon={Droplet}
      />

      <div
        className="rounded-3xl p-5 mb-4 flex flex-col items-center select-none"
        style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
      >
        {/* VIZUÁLIS POHÁR / KULACS */}
        <div className="relative w-28 h-40 mb-3">
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
                textShadow:
                  pct > 45 ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
              }}
            >
              {pct}%
            </span>
            {pct >= 100 && (
              <span className="text-[10px] font-bold text-white uppercase tracking-wider mt-0.5">
                Kész! 🎉
              </span>
            )}
          </div>
        </div>

        {/* AKTUÁLIS LITER ÉS HÁTRALÉVŐ KERET */}
        <p
          className="text-base font-semibold mb-1"
          style={{ color: C.textDark, fontFamily: serif }}
        >
          {(currentMl / 1000).toFixed(2)} liter /{" "}
          {(hydrationTargetMl / 1000).toFixed(1)} liter
        </p>

        <p className="text-xs font-medium mb-4 text-center min-h-[18px]">
          {pct >= 100 ? (
            <span className="text-[#7C9885] font-bold flex items-center justify-center gap-1">
              <CheckCircle2 size={13} /> Gratulálunk! Elérted a mai élettani célodat!
            </span>
          ) : (
            <span style={{ color: C.textSoft }}>
              Még <strong>{(remainingMl / 1000).toFixed(1)} liter</strong> hiányzik mára
            </span>
          )}
        </p>

        {/* GYORSGOMBOK */}
        <div className="flex flex-wrap justify-center items-center gap-2">
          <button
            type="button"
            onClick={() => addWater(250)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white cursor-pointer active:scale-95 transition-transform shadow-sm"
            style={{ backgroundColor: C.coral }}
          >
            <Plus size={14} /> +2,5 dl pohár
          </button>

          <button
            type="button"
            onClick={() => addWater(500)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold text-white cursor-pointer active:scale-95 transition-transform shadow-sm"
            style={{ backgroundColor: C.coralDeep }}
          >
            <Plus size={14} /> +5 dl kulacs
          </button>

          <button
            type="button"
            disabled={currentMl <= 0}
            onClick={() => addWater(-250)}
            className="flex items-center justify-center w-9 h-9 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 disabled:opacity-30 cursor-pointer active:scale-95 transition-all"
            title="2,5 dl visszavonása"
          >
            <Minus size={14} />
          </button>
        </div>
      </div>

      {/* PUSH ÉRTESÍTÉSI SÁV */}
      {notificationStatus !== "unsupported" && notificationStatus !== "granted" && (
        <div className="mb-3 p-3.5 rounded-2xl bg-[#FFF9F5] border border-[#F0DCD4] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FDE8E1] text-[#E07A5F] flex items-center justify-center shrink-0">
              <Bell size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#2D3748]">
                Kérsz emlékeztetőt napközben?
              </p>
              <p className="text-[11px] text-[#6B5A52]">
                Szólunk, ha elfelejtenél inni a rohanásban.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestNotification}
            className="text-[11px] font-bold px-3 py-1.5 rounded-xl text-white cursor-pointer shrink-0 shadow-sm"
            style={{ backgroundColor: C.coral }}
          >
            Bekapcsolás
          </button>
        </div>
      )}

      {notificationStatus === "granted" && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-[#F0F5F1] border border-[#D5E5D8] flex items-center gap-2 text-[11px] font-medium text-[#3F5B49]">
          <BellRing size={13} className="text-[#7C9885] shrink-0" />
          <span>Telefonos emlékeztetők aktívak</span>
        </div>
      )}

      {/* TÁMOGATÓ IDÉZET KÁRTYA */}
      <div
        className="rounded-2xl p-3.5 flex items-start gap-2.5"
        style={{ backgroundColor: C.sageSoft }}
      >
        <Sparkles size={15} style={{ color: C.sageText, marginTop: 2 }} className="shrink-0" />
        <div>
          <p className="text-[11px] font-medium mb-0.5" style={{ color: C.sageText }}>
            Támogató emlékeztető
          </p>
          <p className="text-sm leading-relaxed" style={{ color: C.textDark }}>
            {REMINDERS[reminderIdx]}
          </p>
        </div>
      </div>
    </div>
  );
}
