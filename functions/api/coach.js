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
    const { mode, input, remaining, currentPlate } = body;

    const prot = Number(remaining?.protein ?? 0);
    const veg = Number(remaining?.veg ?? 0);
    const carb = Number(remaining?.carb ?? 0);
    const fat = Number(remaining?.fat ?? 0);

    const isZeroRemaining = prot <= 0 && veg <= 0 && carb <= 0;

    let systemPrompt = `Te a FitAnya digitális Zsebedzője vagy: közvetlen, életrevaló, magyar konyhai mentor kisgyerekes anyukáknak.
Nincs kalóriaszámolás, a Tenyér-szabályt használjuk (fehérje: tenyér, rost: ököl, szénhidrát: marék, zsír: hüvelykujj).
Kerülj minden AI-zsargont és tükörfordítást. Természetes, hétköznapi konyhanyelven beszélj!`;

    let userPrompt = "";

    // 1. ÉTEL-FORDÍTÓ (TÁNYÉROM KERESŐ)
    if (mode === "dish") {
      userPrompt = `A család ezt eszi: "${input}".
Hátralévő keret: ${prot} tenyér fehérje, ${veg} ököl rost, ${carb} marék szénhidrát, ${fat} hüvelykujj zsír.
Mondd el 2 tömör mondatban, hogyan szedjen a kész családi ételből a tányérjára mérlegelés nélkül, mit tegyen mellé rostként.
A végén kötelező sor:
🖐️ Levonás: X tenyér fehérje, X ököl rost, X marék szénhidrát, X hüvelykujj zsír.`;
    }

    // 2. INTERAKTÍV TÁNYÉR CSERE (AI PLATE SWAP)
    else if (mode === "plate_swap") {
      systemPrompt = `KIZÁRÓLAG egyetlen érvényes JSON objektumot adhatsz vissza, semmi mást! Tilos bármilyen bevezető, lezáró vagy magyarázó szöveg!`;

      userPrompt = `Feladat: Cseréld ki a tányér megfelelő elemét az anyuka kérése alapján!
Hátralévő kerete: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát, ${fat} zsír.
Jelenlegi tányér:
- Fehérje: ${currentPlate?.protein || "nincs"}
- Rost: ${currentPlate?.veg || "nincs"}
- Szénhidrát: ${currentPlate?.carb || "nincs"}
- Zsír: ${currentPlate?.fat || "nincs"}

Az anyuka ezt írta: "${input}"

Kötelező JSON válasz sablon:
{
  "protein": "${currentPlate?.protein || ""}",
  "veg": "${currentPlate?.veg || ""}",
  "carb": "ide írd az új szénhidrátot ha ezt kérte, pl. 1 szelet kovászos fehér kenyér",
  "fat": "${currentPlate?.fat || ""}",
  "comment": "1 rövid barátnős mondat, pl: Teljesen jó a fehér kenyér is, egy szelet pont a maréknyi adagod!"
}`;
    }

    // 3. NASI SOS
    else if (mode === "craving") {
      userPrompt = `Az anyuka erre vágyik: "${input}".
Hátralévő kerete: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát.
1 mondat az élettani okról (fáradtság/stressz, semmi bűntudat!), plusz 2 gyors alternatíva.`;
    }

    // 4. ESTI ZÁRÁS
    else if (mode === "dinner") {
      if (isZeroRemaining) {
        userPrompt = `A keret betelt (0 maradt). Mondd meg neki kedvesen de határozottan, hogy mára zárva a konyha, ez fáradtság, igyon egy teát és aludjon.`;
      } else {
        userPrompt = `Gyors vacsora kizárólag a maradék keretből: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát.`;
      }
    } else {
      userPrompt = input;
    }

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
        temperature: 0.1,
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
