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

    // Ha a zsír vagy szénhidrát betelt / túllépve
    const isFatOver = fat <= 0;
    const isCarbOver = carb <= 0;

    // 1. TÁNYÉR CSERE: TOOL USE (FUNCTION CALLING) KÉNYSZERÍTÉSSEL
    if (mode === "plate_swap") {
      let macroConstraints = "";
      if (isFatOver) {
        macroConstraints += " FIGYELEM: A zsírkeret BETELT vagy TÚLLÉPVE! SZIGORÚAN TILOS diót, olajos magvakat, vajat, olajat, zsíros sajtot és egész tojást javasolni! Kizárólag ZSÍRSZEGÉNY fehérje mehet (pl. zsírszegény túró, zsírszegény cottage cheese, csirkemellsonka, tonhalkonzerv sós lében, zsírszegény natúr joghurt).";
      }
      if (isCarbOver) {
        macroConstraints += " FIGYELEM: A szénhidrátkeret BETELT! SZIGORÚAN TILOS müzlit, banánt, kenyeret, zabpelyhet vagy krumplit hozzáadni!";
      }

      const toolPrompt = `Az anyuka a tányérját szeretné módosítani a hiányzó keretéhez és a hűtőjéhez.
Aktuális hiányzó keretek: ${prot} tenyér fehérje, ${veg} ököl rost, ${carb} marék szénhidrát, ${fat} hüvelykujj zsír.
${macroConstraints}

Jelenlegi kártyák a kijelzőn:
- Fehérje: "${currentPlate?.protein || ""}"
- Rost: "${currentPlate?.veg || ""}"
- Szénhidrát: "${currentPlate?.carb || ""}"
- Zsír: "${currentPlate?.fat || ""}"

Az anyuka kérése: "${input}"
Feladatod: Válaszd ki az 1 legmegfelelőbb konkrét ételt, és hívd meg az update_plate eszközt!`;

      const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 300,
          temperature: 0.1,
          tools: [
            {
              name: "update_plate",
              description: "Frissíti az interaktív tányér elemeit és ad egy rövid barátságos magyarázatot.",
              input_schema: {
                type: "object",
                properties: {
                  protein: { type: "string", description: "Az új konkrét fehérje étel pontos adaggal (pl. 200g zsírszegény túró vagy 4 szelet csirkemellsonka)" },
                  veg: { type: "string", description: "Az új zöldség pontos adaggal" },
                  carb: { type: "string", description: "Az új szénhidrát pontos adaggal" },
                  fat: { type: "string", description: "Az új zsír pontos adaggal" },
                  comment: { type: "string", description: "1 tömör, barátnős jóváhagyó mondat, kitérve a zsírszegénységre ha a zsír betelt." }
                },
                required: ["comment"]
              }
            }
          ],
          tool_choice: { type: "tool", name: "update_plate" },
          messages: [{ role: "user", content: toolPrompt }],
        }),
      });

      const data = await anthropicResponse.json();
      const toolBlock = data.content?.find((c) => c.type === "tool_use");
      const plateData = toolBlock?.input || {};

      return new Response(JSON.stringify({ plateUpdate: plateData }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. TÁNYÉROM KERESŐ
    if (mode === "dish") {
      const userPrompt = `A család ezt eszi: "${input}".
Hátralévő keret: ${prot} tenyér fehérje, ${veg} ököl rost, ${carb} marék szénhidrát, ${fat} hüvelykujj zsír.
Mondd el 2 tömör mondatban, hogyan szedjen a kész családi ételből a tányérjára mérlegelés nélkül, mit tegyen mellé rostként.
A végén kötelező sor:
🖐️ Levonás: X tenyér fehérje, X ököl rost, X marék szénhidrát, X hüvelykujj zsír.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 300,
          temperature: 0.2,
          system: "Te a FitAnya Zsebedzője vagy. Közvetlen, praktikus konyhai mentor. Kerüld az AI-zsargont!",
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      const d = await res.json();
      return new Response(JSON.stringify({ reply: d.content?.[0]?.text || "" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. NASI SOS
    if (mode === "craving") {
      const userPrompt = `Az anyuka erre vágyik: "${input}".
Hátralévő kerete: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát.
1 mondat az élettani okról (fáradtság/dopamin), plusz 2 gyors túlélő alternatíva.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 300,
          temperature: 0.2,
          system: "Te a FitAnya Zsebedzője vagy. Semmi bűntudatkeltés, csak gyors mentőöv.",
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      const d = await res.json();
      return new Response(JSON.stringify({ reply: d.content?.[0]?.text || "" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ismeretlen kérés" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
