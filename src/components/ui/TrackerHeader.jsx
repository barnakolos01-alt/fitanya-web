import React from "react";
import { Utensils, Leaf, Wheat, Flame, RotateCcw } from "lucide-react";
import { useFitAnya } from "../../context/FitAnyaContext";
import PortionCard from "./PortionCard";

export default function TrackerHeader() {
  const { profile, log, resetDay } = useFitAnya();
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#8A7268]">
          Mai Tenyér-Egyenleged
        </span>
        <button
          onClick={resetDay}
          title="Mai nap nullázása"
          className="text-[11px] text-[#8A7268] hover:text-[#E07A5F] flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw size={11} /> Új nap
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <PortionCard icon={Utensils} label="Tenyér fehérje" unit="tenyér" consumed={log.protein} target={profile.palmProtein} />
        <PortionCard icon={Leaf} label="Ököl rost" unit="ököl" consumed={log.veg} target={profile.fistVeg} />
        <PortionCard icon={Wheat} label="Marék szénhidrát" unit="marék" consumed={log.carb} target={profile.cuppedCarb} />
        <PortionCard icon={Flame} label="Hüvelykujj zsír" unit="hüvelyk" consumed={log.fat} target={profile.thumbFat} />
      </div>
    </div>
  );
}
