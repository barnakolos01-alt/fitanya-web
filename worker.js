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

        const systemPrompt = `Te a "FitAnya Módszer" gyakorlatias családi séfje vagy.
A feladatod: a megadott otthoni alapanyagokból 3 különböző stílusú, gyors családi vacsoraötletet adni.
Alapszabályok:
- Családbarát receptek: a gyerek és a férj is megeszi, de az anyuka Tenyér-adagjával nem lépi túl a keretét.
- Ne kérj extra egzotikus alapanyagokat, csak a megadott dolgokat + só, bors, fokhagyma, alapvető olaj/víz használd.
- TÖMÖRSÉG: Az elkészítés maximum 3 rövid, lényegretörő mondat legyen!
${quickOnly ? "- KRITIKUS: Kizárólag 15-20 perces, villámgyors serpenyős vagy sütőmentes ételeket javasolj!" : ""}

SZIGORÚ VÁLASZFORMÁTUM: KIZÁRÓLAG egyetlen érvényes JSON objektumot adj vissza, semmi mást (markdown kódblokk nélkül):
{
  "recipes": [
    {
      "id": "rec_1",
      "title": "Étel neve tisztán",
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
        "1. tömör mondat az előkészítésről.",
        "2. tömör mondat a sütésről/főzésről.",
        "3. tálalási mozdulat."
      ],
      "fitanyaTip": "1 mondatos FitAnya tálalási trükk az arányokhoz."
    }
  ]
}`;

        const userPrompt = `Alapanyagaim: "${ingredients}".
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

    // 2. AI ÉTELELEMZŐ VÉGPONT (/api/analyze-dish)
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

        const systemPrompt = `Te a "FitAnya Módszer" közvetlen, gasztronómiailag és élettanilag felkészült táplálkozási szakértő AI motorja vagy.
Feladatod a beírt étel Tenyér-szabály szerinti azonnali elemzése és egy 1-2 mondatos, gyakorlatias tálalási tipp adása édesanyáknak.

SZIGORÚ GASZTRO-SZABÁLYOK A TIPPEKHEZ ("tip"):
1. Édességek, desszertek, édes tészták (pl. túrógombóc, palacsinta, gofri, torták, tejberizs):
   - SOHA NE AJÁNLJ HOZZÁ HÚST VAGY ZÖLDSÉGSALÁTÁT!
   - Fehérjének KIZÁRÓLAG natúr görög joghurtot, zsírszegény túrót, skyr-t vagy egy adag fehérjeport javasolj.
   - Adagnak 1 zárt maroknyi mennyiséget javasolj élvezetből fogyasztva, bűntudat nélkül.
2. Bő olajban sült ételek (pl. rántott hús, rántott sajt, sült krumpli, lángos):
   - Javasold az air fryerben vagy sütőpapíron, sütőben sütést a rejtett zsírok felezésére.
3. Nehéz magyaros, zsíros ételek (pl. pörkölt, babgulyás, csülök, rakott ételek):
   - Rostnak savanyúságot (kovászos uborka, csalamádé) vagy gyors kevert salátát ajánlj, és a szaft kitunkolásának elhagyását.
4. Hangnem: közvetlen, bűntudatmentes és életszerű.

VISSZATÉRÉSI FORMÁTUM:
KIZÁRÓLAG egyetlen érvényes JSON objektumot adj vissza (markdown kódblokk nélkül):
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

    // 3. STATIKUS ASSETS KISZOLGÁLÁSA (React webapp)
    return env.ASSETS.fetch(request);
  },
};
