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
    const isFatOver = fat <= 0;
    const isCarbOver = carb <= 0;

    // 1. INTERAKTÍV GOMB-AJÁNLÓ (TOOL CALLING)
    if (mode === "plate_swap" || mode === "suggest_options") {
      let constraints = "";
      if (isFatOver) {
        constraints += " KRITIKUS: A zsírkeret BETELT vagy TÚLLÉPVE! SZIGORÚAN TILOS diót, mandulát, magvakat, vajat, olajat, zsíros sajtokat, egész tojást és csokit ajánlani! Csak zsírszegény opciók mehetnek.";
      }
      if (isCarbOver) {
        constraints += " KRITIKUS: A szénhidrátkeret BETELT! SZIGORÚAN TILOS kenyeret, müzlit, tésztát, rizst, banánt és pékárut ajánlani!";
      }

      const prompt = `Az anyuka étel-alternatívákat kér a tányérjához.
Hiányzó kerete: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát, ${fat} zsír.
${constraints}

Jelenlegi tételek:
- Fehérje: "${currentPlate?.protein || "nincs"}"
- Rost: "${currentPlate?.veg || "nincs"}"
- Szénhidrát: "${currentPlate?.carb || "nincs"}"
- Zsír: "${currentPlate?.fat || "nincs"}"

Az anyuka kérése / helyzete: "${input}"

Feladat: Adj 3 vagy 4 konkrét, egymástól jól megkülönböztethető, 100%-ban hétköznapi bolti/kamra opciót gombokként, amire azonnal rákattinthat!
Hívd meg a suggest_food_options függvényt!`;

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
          tools: [
            {
              name: "suggest_food_options",
              description: "Kattintható ételjavaslat gombokat ad az anyukának.",
              input_schema: {
                type: "object",
                properties: {
                  comment: {
                    type: "string",
                    description: "1etlen tömör, barátságos mondat (pl. Mivel a zsírod már betelt, ezekkel a zsírszegény fehérjékkel maradsz egyensúlyban:)",
                  },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string", description: "Rövid név a gombra (pl. 4 ek zsírszegény túró)" },
                        fullText: { type: "string", description: "Teljes szöveg a kártyára (pl. 4-5 ek zsírszegény túró vagy light cottage cheese)" },
                        macroType: { type: "string", enum: ["protein", "veg", "carb", "fat"], description: "Melyik tápanyag kártyáját cseréli" },
                      },
                      required: ["label", "fullText", "macroType"],
                    },
                  },
                },
                required: ["comment", "options"],
              },
            },
          ],
          tool_choice: { type: "tool", name: "suggest_food_options" },
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await anthropicResponse.json();
      const toolUse = data.content?.find((c) => c.type === "tool_use");
      const result = toolUse?.input || { comment: "", options: [] };

      return new Response(JSON.stringify(result), {
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
          system: "Te a FitAnya Zsebedzője vagy. Semmi AI-zsargon, csak életszerű magyar tálalási tanács.",
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
          system: "Te a FitAnya Zsebedzője vagy. Nulla bűntudat, praktikus segítség.",
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
