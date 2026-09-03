// ---------------------------------------------------------------------------
// Élettani számítási motor — a landing oldali audit (fa_form) alapján
// ---------------------------------------------------------------------------
export function calculateProfileFromForm(data) {
  if (!data || !data.weight) {
    // Alapértelmezett biztonsági profil, ha még nem töltötte ki a tesztet
    return {
      palmProtein: 4,
      fistVeg: 3,
      cuppedCarb: 3,
      thumbFat: 3,
      targetKcal: 1650,
      weightKg: 68,
      breastfeeding: false,
    };
  }

  const age = Number(data.age) || 30;
  const height = Number(data.height) || 165;
  const weight = Number(data.weight) || 70;

  // Mifflin-St Jeor alapanyagcsere
  const bmr = 10 * weight + 6.25 * height - 5 * age - 161;

  let activityMult = 1.3;
  if (data.activity === "seta") activityMult = 1.4;
  if (data.activity === "porgos") activityMult = 1.5;

  let tdee = bmr * activityMult;

  // Szoptatási védelem
  let lactationBonus = 0;
  if (data.nursing === "kizarolag") lactationBonus = 450;
  if (data.nursing === "hozzataplal") lactationBonus = 250;
  tdee += lactationBonus;

  // Biztonságos deficit
  let targetKcal = tdee - 400;
  if (data.nursing === "kizarolag") {
    targetKcal = Math.max(targetKcal, 1750);
  } else {
    targetKcal = Math.max(targetKcal, 1300);
  }

  // Tenyér-Makró arányok
  const proteinGrams = Math.round(weight * 1.5);
  const fatGrams = Math.round((targetKcal * 0.28) / 9);
  const carbGrams = Math.round((targetKcal - (proteinGrams * 4 + fatGrams * 9)) / 4);

  const palmProtein = Math.max(Math.round(proteinGrams / 30), 2);
  const fistVeg = 3;
  const cuppedCarb = Math.max(Math.round(carbGrams / 40), 2);
  const thumbFat = Math.max(Math.round(fatGrams / 15), 2);

  return {
    palmProtein,
    fistVeg,
    cuppedCarb,
    thumbFat,
    targetKcal: Math.round(targetKcal),
    weightKg: weight,
    breastfeeding: data.nursing === "kizarolag" || data.nursing === "hozzataplal",
  };
}

export function getTodayKey() {
  const now = new Date();
  return `fa_log_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}
