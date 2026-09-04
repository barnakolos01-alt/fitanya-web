export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. RECEPTES HŰTŐMENTŐ AI VÉGPONT (/api/recipe-ideas)
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

        const systemPrompt = `Te a "FitAnya Módszer" profi, gyakorlatias családi séfje vagy.
A feladatod: a megadott otthoni alapanyagokból pontosan 3 különböző stílusú, egészséges és gyors receptötletet készíteni.
Alapszabályok:
- A receptek családbarátak: a gyerek és a férj is szívesen megeszi, de az anyuka Tenyér-szabály szerinti adagjával nem borítja fel a diétáját.
- Nem kell bonyolult alapanyag, csak amit az anyuka megadott + só, bors, fokhagyma, alapvető olaj/víz.
${quickOnly ? "- KRITIKUS: Kizárólag 15-20 perces, villámgyors serpenyős vagy hideg ételeket ajánlj!" : ""}

SZIGORÚ VÁLASZFORMÁTUM: KIZÁRÓLAG egyetlen érvényes JSON objektumot adj vissza, felvezető és markdown kódblokk (\`\`\`json) NÉLKÜL:
{
  "recipes": [
    {
      "id": "rec_1",
      "title": "Étel neve (pl. Tejfölös-zöldbabos serpenyős csirke rizzsel)",
      "timeMinutes": 20,
      "tag": "Villámgyors serpenyős",
      "delta": {
        "protein": 1.5,
        "veg": 1,
        "carb": 1,
        "fat": 1
      },
      "ingredients": ["30 dkg csirkemell", "1 doboz tejföl", "25 dkg mirelit zöldbab", "főtt rizs"],
      "instructions": [
        "A csirkemellet felkockázzuk és pici olajon fehéredésig pirítjuk.",
        "Hozzáadjuk a zöldbabot, sózzuk, borsozzuk, fedő alatt 8 percig pároljuk.",
        "Összeforgatjuk a tejföllel, és összeforraljuk."
      ],
      "fitanyaTip": "A családnak szedhetsz több rizst, a te tányérodra 2 nagy szedőkanál ragu és legfeljebb 1 marék rizs kerüljön!"
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
            max_tokens: 1000,
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

    // 2. AI ÉTELELEMZŐ VÉGPONT (Tányérom modul)
    if (url.pathname === "/api/analyze-dish" && request.method === "POST") {
      try {
        const apiKey = env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Az API kulcs nincs beállítva." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const { dishName } = await request.json();
        const systemPrompt = `Te a "FitAnya Módszer" szakértő AI motorja vagy.
Elemezd az ételt a FitAnya Tenyér-szabály szerint.
SZABÁLYOK:
1. Édességhez SOHA ne ajánlj húst/salátát! Csak görög joghurtot, túrót, skyr-t.
2. Bő olajban sülteknél ajánld az air fryert vagy sütőpapírt.
3. Nehéz ételeknél javasolj savanyúságot/salátát, és a tunkolás elhagyását.

KIZÁRÓLAG JSON:
{
  "name": "Tisztított név",
  "delta": { "protein": szám, "veg": szám, "carb": szám, "fat": szám },
  "tip": "1-2 mondatos tanács"
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
            messages: [{ role: "user", content: `Elemezd ezt: "${dishName}"` }],
          }),
        });

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

    // 3. STATIKUS KISZOLGÁLÁS
    return env.ASSETS.fetch(request);
  },
};
