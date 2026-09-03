export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const apiKey = env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Az API kulcs még nincs beállítva a Cloudflare-ben." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { mode, input, remaining, profile } = body;

    // Rendszerprompt: a FitAnya szakmai és lélektani szabályrendszere
    const systemPrompt = `Te vagy a FitAnya digitális Zsebedzője: közvetlen, empatikus, bűntudatmentes és gyakorlatias mentor édesanyáknak.
A válaszaid rövidek, 3-4 mondatosak, és azonnal alkalmazható alternatívát adnak.
Alapszabályok:
- Soha ne kelts bűntudatot! Az éhség és a sóvárgás nem akaraterő kérdése, hanem élettani reakció (alváshiány, stressz, kortizol).
- Használd a FitAnya Tenyér-szabályát: tenyérnyi fehérje (izomvédelem/teltség), ökölnyi rost (emésztés), maréknyi szénhidrát (energia), hüvelykujjnyi egészséges zsír.
- Nincs kalóriaszámolgatás, csak gyors, kézzelfogható megoldások.`;

    let userPrompt = "";

    if (mode === "craving") {
      userPrompt = `Az anyuka ezt kívánja / ezt enné meg: "${input}".
Maradék mai kerete: ${remaining?.protein || 0} tenyér fehérje, ${remaining?.veg || 0} ököl rost, ${remaining?.carb || 0} marék szénhidrát, ${remaining?.fat || 0} hüvelykujj zsír.
Magyarázd el 1 mondatban empatikusan az élettani okát (pl. miért kívánja a sót/cukrot fáradtan), és adj 2 konkrét, 60 másodperc alatt elérhető bolti/otthoni alternatívát, ami kielégíti a vágyat anélkül, hogy megborítaná a napját!`;
    } else if (mode === "dinner") {
      userPrompt = `Esti hűtőmentés! Ez van otthon a hűtőben / ezt szeretné enni: "${input}".
A mai napból hátralévő kerete: ${remaining?.protein || 0} tenyér fehérje, ${remaining?.veg || 0} ököl rost, ${remaining?.carb || 0} marék szénhidrát, ${remaining?.fat || 0} hüvelykujj zsír.
Állíts össze belőle 3 mondatban egy gyors, 10 perces tányért a Tenyér-szabály arányaival!`;
    } else {
      userPrompt = input;
    }

    // Hívás a Claude 3.5 Haiku modellhez
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 350,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      return new Response(
        JSON.stringify({ error: "Hiba az AI válaszadásakor", details: errText }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await anthropicResponse.json();
    const replyText = data.content?.[0]?.text || "Nem sikerült választ generálni.";

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
