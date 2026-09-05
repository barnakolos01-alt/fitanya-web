export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. VIP KÓD ELLENŐRZÉSE
    if (url.pathname === "/api/verify-vip" && request.method === "POST") {
      try {
        const { code } = await request.json();
        const validCodes = ["FITANYA", "VIP2026", "ANYAERO", "BARNAKOLOS"];
        
        if (code && validCodes.includes(code.trim().toUpperCase())) {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ success: false, error: "Érvénytelen kód" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false }), { status: 500 });
      }
    }

    // 2. RECEPTES HŰTŐMENTŐ AI VÉGPONT (/api/recipe-ideas)
    if (url.pathname === "/api/recipe-ideas" && request.method === "POST") {
      try {
        const apiKey = env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Az API kulcs nincs beállítva a Cloudflare-ben." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const { ingredients, quickOnly, remaining } = await request.json();

        const systemPrompt = `Te a "FitAnya Módszer" gyakorlatias családi séfje és dietetikusa vagy.
A feladatod: a megadott otthoni alapanyagokból pontosan 3 különböző stílusú, gyors családi vacsoraötletet adni.

ALAPSZABÁLYOK:
- Családbarát receptek: a gyerek és a férj is szívesen megeszi, de az anyuka a saját tányérján tartja az arányokat.
- KRITIKUS - A "delta" ÉRTÉKEK KIZÁRÓLAG 1 SZEMÉLYRE (AZ ANYUKA EGYETLEN TÁLALÁSI ADAGJÁRA) VONATKOZNAK, SOHA NEM A TELJES FAZÉKRA!
  * Fehérje: 1 - 2 Tenyér (T)
  * Rost: 1 - 2 Ököl (Ö)
  * Szénhidrát: 0.5 - 1.5 Marék (M) — Tésztaételeknél is! A család ehet sokat, anyuka tányérjára max 1-1.5M kerül!
  * Zsír: 0.5 - 1.5 Hüvelykujj (H)
- MENNYISÉGEK: Ha a felhasználó sok alapanyagot ad meg (pl. "1kg hús", "500g tészta"), a recept hozzávalóinál jelezd, mennyit főz meg a családnak, és mit tesz el későbbre.
- NYELVHELYESSÉG ÉS TÖMÖRSÉG:
  * Használj természetes, közvetlen magyar felszólító módot az elkészítésnél (pl. "Pirítsd meg a húst", "Keverd össze a szósszal", SOHA ne múlt időt vagy passzív szerkezetet)!
  * Maximum 3-4 tömör lépés legyen, sorszámok NÉLKÜL a szövegben.
${quickOnly ? "- KRITIKUS: Kizárólag 15-20 perces, villámgyors serpenyős vagy hideg ételeket javasolj!" : ""}

SZIGORÚ VÁLASZFORMÁTUM: KIZÁRÓLAG egyetlen érvényes JSON objektumot adj vissza (markdown kódblokk nélkül):
{
  "recipes": [
    {
      "id": "rec_1",
      "title": "Étel tiszta neve",
      "timeMinutes": 20,
      "tag": "Villámgyors serpenyős",
      "delta": {
        "protein": 1.5,
        "veg": 1,
        "carb": 1,
        "fat": 1
      },
      "ingredients": ["főbb hozzávalók listája"],
      "instructions": [
        "Első lépés felszólító módban sorszám nélkül.",
        "Második lépés felszólító módban sorszám nélkül."
      ],
      "fitanyaTip": "Gyakorlatias tálalási trükk."
    }
  ]
}`;

        const userPrompt = `Alapanyagaim a hűtőben/kamrában: "${ingredients}".
Mai maradék tenyér-keretem: ${remaining?.protein ?? 1} tenyér fehérje, ${remaining?.veg ?? 1} ököl rost, ${remaining?.carb ?? 1} marék szénhidrát, ${remaining?.fat ?? 1} hüvelykujj zsír.
Készíts 3 különböző receptjavaslatot!`;

        const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey.trim(),
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2500,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });

        if (!anthropicResponse.ok) {
          const errData = await anthropicResponse.json().catch(() => ({}));
          return new Response(
            JSON.stringify({ error: errData.error?.message || "Anthropic hiba" }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          );
        }

        const data = await anthropicResponse.json();
        const rawText = data.content?.[0]?.text?.trim() || "{}";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

        return new Response(JSON.stringify({ success: true, recipes: parsed.recipes || [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 3. AI ÉTELELEMZŐ VÉGPONT (/api/analyze-dish)
    if (url.pathname === "/api/analyze-dish" && request.method === "POST") {
      try {
        const apiKey = env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Az API kulcs nincs beállítva a Cloudflare-ben." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const { dishName } = await request.json();
        if (!dishName || !dishName.trim()) {
          return new Response(
            JSON.stringify({ error: "Hiányzó ételnév." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const systemPrompt = `Te a "FitAnya Módszer" közvetlen, táplálkozási szakértő AI motorja vagy.
Feladatod a beírt étel Tenyér-szabály szerinti azonnali elemzése és egy 1-2 mondatos gyakorlatias tálalási tipp adása édesanyáknak.

SZIGORÚ GASZTRO-SZABÁLYOK A TIPPEKHEZ ("tip"):
1. Édességek, desszertek: Fehérjének KIZÁRÓLAG túrót, görög joghurtot, skyr-t ajánlj, ne húst vagy salátát.
2. Bő olajban sült ételek: Javasold az air fryerben vagy sütőben sütést.
3. Nehéz magyaros ételek: Rostnak savanyúságot vagy friss salátát javasolj.

VISSZATÉRÉSI FORMÁTUM:
KIZÁRÓLAG egyetlen érvényes JSON objektumot adj vissza (markdown nélkül):
{
  "name": "Étel pontos neve",
  "delta": {
    "protein": 0 és 2 közötti szám,
    "veg": 0 és 2 közötti szám,
    "carb": 0 és 2.5 közötti szám,
    "fat": 0 és 2 közötti szám
  },
  "tip": "1-2 mondatos közvetlen jótanács."
}`;

        const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey.trim(),
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 300,
            system: systemPrompt,
            messages: [{ role: "user", content: `Elemezd ezt az ételt: "${dishName.trim()}"` }],
          }),
        });

        if (!anthropicResponse.ok) {
          const errData = await anthropicResponse.json().catch(() => ({}));
          return new Response(
            JSON.stringify({ error: errData.error?.message || "Anthropic hiba" }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          );
        }

        const data = await anthropicResponse.json();
        const rawText = data.content?.[0]?.text?.trim() || "{}";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

        return new Response(
          JSON.stringify({
            success: true,
            dish: {
              id: "ai_" + Date.now(),
              name: parsed.name || dishName.trim(),
              keywords: [dishName.toLowerCase()],
              delta: {
                protein: Number(parsed.delta?.protein ?? 0),
                veg: Number(parsed.delta?.veg ?? 0),
                carb: Number(parsed.delta?.carb ?? 0),
                fat: Number(parsed.delta?.fat ?? 0),
              },
              tip: parsed.tip || "Figyelj a tenyérnyi arányokra!",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 4. ÚJ: SÓVÁRGÁS-HACK ÉS DÖNTÉSTÁMOGATÓ VÉGPONT (/api/craving-hack)
    if (url.pathname === "/api/craving-hack" && request.method === "POST") {
      try {
        const apiKey = env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Az API kulcs nincs beállítva a Cloudflare-ben." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const { craving, remaining } = await request.json();
        const remP = Math.max(0, Number(remaining?.protein ?? 1));
        const remV = Math.max(0, Number(remaining?.veg ?? 1));
        const remC = Math.max(0, Number(remaining?.carb ?? 0));
        const remF = Math.max(0, Number(remaining?.fat ?? 0.5));

        const systemPrompt = `Te a "FitAnya Módszer" empatikus, zseniális sóvárgás-mentő séfje vagy.
Egy fáradt édesanya megírja, mit kíván enni vagy nassolni este/délután (pl. pizza, nutellás kenyér, chips, csoki, hamburger, tészta).
A te feladatod ezt az ételvágyat átalakítani egy 5-10 perces villámgyors otthoni FITANYA-HACKKÉ, ami:
1. Megadja a vágyott ízélményt és textúrát bűntudat nélkül.
2. SZIGORÚAN ILLESZKEDIK A MAI HÁTRALÉVŐ KERETÉHEZ:
   - Ha a hátralévő szénhidrát (remC) <= 0.2: TILOS lisztes tésztát, kenyeret, tortillát, cukrot ajánlani! Helyette alacsony szénhidráttartalmú trükköt használj (pl. tojásalap, cukkiniszelet, salátalevélbe csomagolva, túróalap).
   - Ha remC >= 0.5: Engedélyezett a pontos adag (pl. 1 db kis tortilla vagy 1 szelet kenyér).
   - A fehérjét (remP) és rostot (remV) igyekezz beépíteni, hogy éjszakára teltségérzetet adjon.
3. Formátum: Közvetlen, kedves magyar hangnem, felszólító mód ("Pirítsd meg", "Keverd össze").

KIZÁRÓLAG egyetlen érvényes JSON objektumot adj vissza (markdown nélkül):
{
  "title": "Kreatív ételnév (pl. 🍕 6 perces Serpenyős Cukkinipizza)",
  "time": "5-8 perc",
  "why": "1 mondat, hogy miért elégíti ki pontosan a vágyát bűntudat nélkül.",
  "steps": [
    "Első gyors lépés.",
    "Második lépés.",
    "Harmadik lépés."
  ],
  "side": "Tipp a hiányzó rostokhoz/zöldségekhez, vagy tálalási trükk.",
  "delta": {
    "protein": ${remP > 0 ? remP : 0.5},
    "veg": ${remV > 0 ? remV : 0},
    "carb": ${remC > 0 ? Math.min(remC, 1) : 0},
    "fat": ${remF > 0 ? Math.min(remF, 1) : 0.5}
  }
}`;

        const userPrompt = `Mit kíván az anyuka: "${craving}"
Mai hátralévő tenyér-kerete:
- Fehérje: ${remP} tenyér
- Rost: ${remV} ököl
- Szénhidrát: ${remC} marék
- Zsír: ${remF} hüvelykujj

Készíts el pontosan egy személyre szabott sóvárgás-hack receptet, ami kielégíti ezt a vágyat, és lehozza a hiányzó keretet!`;

        const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey.trim(),
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 600,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });

        if (!anthropicResponse.ok) {
          const errData = await anthropicResponse.json().catch(() => ({}));
          return new Response(
            JSON.stringify({ error: errData.error?.message || "Anthropic hiba" }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          );
        }

        const data = await anthropicResponse.json();
        const rawText = data.content?.[0]?.text?.trim() || "{}";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

        return new Response(JSON.stringify({ success: true, hack: parsed }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 5. STATIKUS ASSETS KISZOLGÁLÁSA (React webapp)
    return env.ASSETS.fetch(request);
  },
};
