export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. AI COACH VÉGPONT (Nasi SOS & Esti hűtőmentés)
    if (url.pathname === "/api/coach" && request.method === "POST") {
      try {
        const apiKey = env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Az API kulcs nincs beállítva a Cloudflare-ben." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const body = await request.json();
        const { mode, input, remaining } = body;

        const systemPrompt = `Te vagy a FitAnya digitális Zsebedzője: közvetlen, empatikus, bűntudatmentes és gyakorlatias mentor édesanyáknak.
A válaszaid rövidek (3-4 mondat), és azonnal alkalmazható alternatívát adnak.
Alapszabályok:
- Soha ne kelts bűntudatot! Az éhség és a sóvárgás élettani reakció (alváshiány, stressz, kortizol).
- Használd a FitAnya Tenyér-szabályát: tenyérnyi fehérje (teltség), ökölnyi rost, maréknyi szénhidrát, hüvelykujjnyi egészséges zsír.
- Nincs kalóriaszámolgatás, csak gyors, kézzelfogható megoldások.`;

        let userPrompt = "";
        if (mode === "craving") {
          userPrompt = `Az anyuka ezt kívánja: "${input}".
Maradék mai kerete: ${remaining?.protein ?? 1} tenyér fehérje, ${remaining?.veg ?? 2} ököl rost, ${remaining?.carb ?? 1} marék szénhidrát, ${remaining?.fat ?? 1} hüvelykujj zsír.
Magyarázd el 1 mondatban empatikusan az élettani okát, és adj 2 konkrét, 60 másodperc alatt elérhető bolti/otthoni alternatívát!`;
        } else if (mode === "dinner") {
          userPrompt = `Esti hűtőmentés! Ez van otthon a hűtőben / ezt enné: "${input}".
Mai maradék kerete: ${remaining?.protein ?? 1} tenyér fehérje, ${remaining?.veg ?? 2} ököl rost, ${remaining?.carb ?? 1} marék szénhidrát, ${remaining?.fat ?? 1} hüvelykujj zsír.
Állíts össze belőle 3 mondatban egy gyors, 10 perces tányért a Tenyér-szabály arányaival!`;
        } else {
          userPrompt = input;
        }

        const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey.trim(),
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 350,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });

        if (!anthropicResponse.ok) {
          const errData = await anthropicResponse.json().catch(() => ({}));
          const errMsg = errData.error?.message || "Ismeretlen Anthropic hiba";
          return new Response(
            JSON.stringify({ error: `API hiba (${anthropicResponse.status}): ${errMsg}` }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          );
        }

        const data = await anthropicResponse.json();
        const textBlock = data.content?.find((c) => c.type === "text");
        const replyText = textBlock?.text || data.content?.[0]?.text || "Nem sikerült választ generálni.";

        return new Response(JSON.stringify({ reply: replyText }), {
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

    // 2. AI ÉTELELEMZŐ VÉGPONT (Tányérom modul - Tenyér-szabály kalkuláció)
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

        const systemPrompt = `Te a "FitAnya Módszer" szigorú táplálkozási szakértő AI motorja vagy.
A feladatod egy egyedi étel azonnali elemzése a FitAnya Tenyér-szabály szerint.

Visszatérési formátum: KIZÁRÓLAG egyetlen érvényes JSON objektumot adj vissza felvezető szöveg vagy lezárás nélkül, szigorúan ebben a formátumban:
{
  "name": "Étel neve tisztítva",
  "delta": {
    "protein": 0 és 2 közötti szám (Tenyérnyi fehérje),
    "veg": 0 és 2 közötti szám (Ökölnyi zöldség/rost),
    "carb": 0 és 2.5 közötti szám (Maréknyi szénhidrát),
    "fat": 0 és 2 közötti szám (Hüvelykujjnyi minőségi zsír)
  },
  "tip": "1-2 mondatos, közvetlen, gyakorlatias FitAnya tálalási tanács az édesanyának az adagoláshoz."
}`;

        const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey.trim(),
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 300,
            system: systemPrompt,
            messages: [{ role: "user", content: `Elemezd ezt az ételt: "${dishName.trim()}"` }],
          }),
        });

        if (!anthropicResponse.ok) {
          const errData = await anthropicResponse.json().catch(() => ({}));
          const errMsg = errData.error?.message || "Ismeretlen Anthropic hiba";
          return new Response(
            JSON.stringify({ error: `API hiba (${anthropicResponse.status}): ${errMsg}` }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          );
        }

        const data = await anthropicResponse.json();
        const rawText = data.content?.[0]?.text?.trim() || "{}";
        const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);

        return new Response(
          JSON.stringify({
            success: true,
            dish: {
              id: "ai_" + Date.now(),
              name: parsed.name || dishName.trim(),
              keywords: [dishName.toLowerCase()],
              delta: parsed.delta,
              tip: parsed.tip,
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
