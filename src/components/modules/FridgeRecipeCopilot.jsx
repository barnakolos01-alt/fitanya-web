import React, { useState } from "react";
import {
  ChefHat,
  Sparkles,
  Clock,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { C, serif } from "../../styles/tokens";
import { useFitAnya } from "../../context/FitAnyaContext";
import SectionHeader from "../ui/SectionHeader";

export default function FridgeRecipeCopilot() {
  const { remaining, logPortion, setActiveTab } = useFitAnya();
  const [ingredients, setIngredients] = useState("");
  const [quickOnly, setQuickOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loggedId, setLoggedId] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!ingredients.trim()) return;

    setLoading(true);
    setRecipes([]);
    setExpandedId(null);

    try {
      const res = await fetch("/api/recipe-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: ingredients.trim(),
          quickOnly,
          remaining,
        }),
      });

      const data = await res.json();
      if (data.success && data.recipes && data.recipes.length > 0) {
        setRecipes(data.recipes);
        setExpandedId(data.recipes[0].id);
      } else {
        alert("Hiba: " + (data.error || "Nem sikerült feldolgozni a recepteket. Próbáld újra egy pillanat múlva!"));
      }
    } catch (err) {
      console.error("Recept hívási hiba:", err);
      alert("Hálózati hiba történt a receptek generálása közben.");
    } finally {
      setLoading(false);
    }
  };

  const handleCookRecipe = (recipe) => {
    logPortion(recipe.delta, recipe.title);
    setLoggedId(recipe.id);

    setTimeout(() => {
      setActiveTab("tracker");
    }, 1200);
  };

  return (
    <div>
      <SectionHeader
        title="Hűtőmentő Konyhafőnök"
        subtitle="Írd be, mi van otthon a hűtőben — mi kihozunk belőle 3 diétabarát családi vacsorát."
        icon={ChefHat}
      />

      {/* BEVITELI KÁRTYA */}
      <div
        className="rounded-3xl p-5 mb-5 select-none"
        style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
      >
        <form onSubmit={handleGenerate}>
          <label className="text-xs font-bold text-stone-700 mb-1.5 block">
            Mi van most otthon a hűtőben és a kamrában?
          </label>
          <textarea
            rows={3}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="pl. 1kg csirkemell, spenót, tejszín, cheddar sajt, rizs..."
            className="w-full text-sm outline-none bg-stone-50/60 border rounded-2xl p-3.5 mb-3 resize-none"
            style={{ color: C.textDark, borderColor: C.border }}
          />

          <div className="flex items-center justify-between gap-2 mb-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-600">
              <input
                type="checkbox"
                checked={quickOnly}
                onChange={(e) => setQuickOnly(e.target.checked)}
                className="w-4 h-4 rounded text-[#E07A5F] focus:ring-0 cursor-pointer"
              />
              <span>⚡ Csak villámgyors recept (max. 15-20 perc)</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !ingredients.trim()}
            className="w-full py-3 rounded-2xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 transition-all active:scale-98"
            style={{ backgroundColor: C.coral }}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Főzési opciók tervezése...
              </>
            ) : (
              <>
                <Sparkles size={15} /> Mutass 3 családi vacsoraötletet!
              </>
            )}
          </button>
        </form>
      </div>

      {/* GENERÁLT RECEPTEK */}
      {recipes.length > 0 && (
        <div className="space-y-3 mb-6 animate-in fade-in">
          <p className="text-xs font-bold text-stone-600 uppercase tracking-wider px-1">
            Válassz egyet a mai vacsorához:
          </p>

          {recipes.map((recipe) => {
            const isExpanded = expandedId === recipe.id;
            const isLogged = loggedId === recipe.id;

            return (
              <div
                key={recipe.id}
                className="rounded-3xl border transition-all overflow-hidden"
                style={{
                  backgroundColor: C.card,
                  borderColor: isExpanded ? C.coral : C.border,
                }}
              >
                {/* FEJLÉC */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : recipe.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50/50"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF3EE] text-[#E07A5F]">
                        {recipe.tag}
                      </span>
                      <span className="text-[11px] text-stone-400 flex items-center gap-0.5">
                        <Clock size={12} /> {recipe.timeMinutes} perc
                      </span>
                    </div>
                    <h3
                      style={{ fontFamily: serif }}
                      className="font-bold text-sm text-stone-800 truncate"
                    >
                      {recipe.title}
                    </h3>
                  </div>

                  <div className="text-stone-400 shrink-0">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* LENYÍLÓ RECEPT TARTALOM */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-stone-100 animate-in fade-in text-xs">
                    {/* TENYÉR METRIKA */}
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 mb-3 flex items-center justify-around font-medium text-stone-700 text-[11px]">
                      <span>🖐️ {recipe.delta.protein}T Fehérje</span>
                      <span>✊ {recipe.delta.veg}Ö Rost</span>
                      <span>🤲 {recipe.delta.carb}M Szénhidrát</span>
                      <span>👍 {recipe.delta.fat}H Zsír</span>
                    </div>

                    {/* FITANYA TÁLALÁSI HACK */}
                    <div className="p-3 rounded-xl bg-[#FFF9F5] border border-[#F5E1D8] text-[#9A412A] mb-3 leading-relaxed">
                      <strong>💡 FitAnya Tálalási Trükk:</strong> {recipe.fitanyaTip}
                    </div>

                    {/* HOZZÁVALÓK */}
                    <p className="font-bold text-stone-800 mb-1">Szükséges alapanyagok:</p>
                    <ul className="list-disc list-inside text-stone-600 space-y-0.5 mb-3">
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i}>{ing}</li>
                      ))}
                    </ul>

                    {/* ELKÉSZÍTÉS */}
                    <p className="font-bold text-stone-800 mb-1">Elkészítés tömören:</p>
                    <ol className="list-decimal list-inside text-stone-600 space-y-1 mb-4 leading-relaxed">
                      {recipe.instructions.map((ins, i) => (
                        <li key={i}>{ins}</li>
                      ))}
                    </ol>

                    {/* KÖZVETLEN ÁTKÖTÉS A TÁNYÉRRA */}
                    <button
                      type="button"
                      disabled={isLogged}
                      onClick={() => handleCookRecipe(recipe)}
                      className="w-full py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98 transition-all"
                      style={{ backgroundColor: isLogged ? "#7C9885" : C.coral }}
                    >
                      {isLogged ? (
                        <>
                          <CheckCircle2 size={14} /> Áttéve a Tányérodra! Átirányítás...
                        </>
                      ) : (
                        <>
                          🍽️ Ezt választom — Átteszem a Tányéromra <ArrowRight size={13} />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
