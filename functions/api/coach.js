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

    let systemPrompt = `Te a FitAnya digitális Zsebedzője vagy: közvetlen, életrevaló, magyar konyhai mentor.
Nincs mérlegelés, a Tenyér-szabályt használjuk (fehérje: tenyér, rost: ököl, szénhidrát: marék, zsír: hüvelykujj).
Kerülj minden AI-zsargont, esszét és tükörfordítást.`;

    let userPrompt = "";

    // 1. TÁNYÉROM KERESŐ
    if (mode === "dish") {
      userPrompt = `A család ezt eszi: "${input}".
Hátralévő keret: ${prot} tenyér fehérje, ${veg} ököl rost, ${carb} marék szénhidrát, ${fat} hüvelykujj zsír.
Mondd el 2 tömör mondatban, hogyan szedjen a kész családi ételből a tányérjára mérlegelés nélkül, mit tegyen mellé rostként.
A végén kötelező sor:
🖐️ Levonás: X tenyér fehérje, X ököl rost, X marék szénhidrát, X hüvelykujj zsír.`;
    }

    // 2. INTERAKTÍV TÁNYÉR CSERE (SZIGORÚAN 1 ADAT, SEMMI LISTÁZÁS)
    else if (mode === "plate_swap") {
      systemPrompt = `Te egy beágyazott adat-motor vagy. SOHA NE írj listát, opciókat, markdown címet (#) és NE kérdezz vissza!
KIZÁRÓLAG egyetlen érvényes JSON objektumot adhatsz vissza!
Ha az anyuka azt írja, hogy valami nincs otthon (pl. "nincs sonkám"), VÁLASSZ KI TE EGYETLEN konkrét hétköznapi ételt a hiányzó keretére (pl. "2-3 db főtt tojás vagy rántotta"), és írd be a megfelelő mezőbe!`;

      userPrompt = `Az anyuka ezt írta: "${input}"
Hátralévő kerete: ${prot} tenyér fehérje, ${veg} ököl rost, ${carb} marék szénhidrát, ${fat} hüvelykujj zsír.
Jelenlegi kártyák:
- Fehérje: "${currentPlate?.protein || ""}"
- Rost: "${currentPlate?.veg || ""}"
- Szénhidrát: "${currentPlate?.carb || ""}"
- Zsír: "${currentPlate?.fat || ""}"

KIZÁRÓLAG EZT A JSON FORMÁTUMOT ADD VISSZA:
{
  "protein": "${prot > 0 ? "új konkrét fehérje pontos adaggal" : ""}",
  "veg": "${veg > 0 ? "új konkrét zöldség pontos adaggal" : ""}",
  "carb": "${carb > 0 ? "új konkrét szénhidrát pontos adaggal" : ""}",
  "fat": "${fat > 0 ? "új konkrét zsír pontos adaggal" : ""}",
  "comment": "1 nagyon rövid jóváhagyó mondat (pl. Átírtam tojásra, 2 db tökéletesen fedezi a fehérjédet!)"
}`;
    }

    // 3. NASI SOS
    else if (mode === "craving") {
      userPrompt = `Az anyuka erre vágyik: "${input}".
Hátralévő kerete: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát.
1 mondat az élettani okról (fáradtság/dopamin), plusz 2 gyors, 60 másodperces túlélő alternatíva.`;
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
        max_tokens: 250,
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
    const replyText = data.content?.[0]?.text || "{}";

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
