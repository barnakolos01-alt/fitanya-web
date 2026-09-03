export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. AI Coach végpont kezelése
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
            model: "claude-haiku-4-5-20251001",
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

    // 2. Statikus frontend kiszolgálása
    return env.ASSETS.fetch(request);
  },
};
