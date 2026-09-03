export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const apiKey = env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Az API kulcs hiányzik a Cloudflare-ből." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { mode, input, remaining, currentPlate } = body;

    const prot = Number(remaining?.protein ?? 0);
    const veg = Number(remaining?.veg ?? 0);
    const carb = Number(remaining?.carb ?? 0);
    const fat = Number(remaining?.fat ?? 0);

    const isFatOver = fat <= 0;
    const isCarbOver = carb <= 0;

    // 1. TÁNYÉROM KERESŐ: TOOL USE-ZAL KIKÉNYSZERÍTETT ADAGOLÁS ÉS LEVONÁS
    if (mode === "dish") {
      let fatWarning = "";
      if (isFatOver) {
        fatWarning = "KRITIKUS: Az anyuka zsírkerete mára teljesen elfogyott (0 maradt)! SZIGORÚAN TILOS plusz zsírt (tejföl, sajt, vaj, olaj) ajánlani! Ha az étel zsíros (pl. gulyás, pörkölt, rántott hús), kifejezetten mondd meg neki, hogy a zsíros levet/szaftot hagyja a tányéron, és a levonásban KÖTELEZŐ legalább 1 zsírt felszámolni a rejtett zsírok miatt!";
      }

      const prompt = `A család ezt eszi / ezt főzte: "${input}".
Az anyuka hátralévő kerete mára: ${prot} tenyér fehérje, ${veg} ököl rost, ${carb} marék szénhidrát, ${fat} hüvelykujj zsír.
${fatWarning}

SZABÁLYOK:
- Nincs mellébeszélés, semmi "szénhidrátkicsapódás", "testi-lelki kielégülés" vagy áltudományos fitnesz-zsargon!
- 2-3 tömör, barátnős mondatban tanítsd meg, hogyan szedjen a kész családi ételből a tányérjára a Tenyér-szabály szerint (mennyi hús/fehérje, mennyi zöldség/rost, és ha van benne krumpli/tészta, kell-e még kenyér).
- Állítsd be a pontos levonási számokat (protein, veg, carb, fat)! Hagyományos zsíros magyar ételeknél a zsír nem lehet 0!`;

      const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 450,
          temperature: 0.1,
          tools: [
            {
              name: "analyze_family_dish",
              description: "Elemzi a családi ételt és pontos levonási értékeket ad vissza.",
              input_schema: {
                type: "object",
                properties: {
                  advice: {
                    type: "string",
                    description: "2-3 praktikus mondat a tálalásról a Tenyér-szabály szerint.",
                  },
                  protein: { type: "number", description: "Levonandó tenyér fehérje" },
                  veg: { type: "number", description: "Levonandó ököl rost" },
                  carb: { type: "number", description: "Levonandó marék szénhidrát" },
                  fat: { type: "number", description: "Levonandó hüvelykujj zsír" },
                },
                required: ["advice", "protein", "veg", "carb", "fat"],
              },
            },
          ],
          tool_choice: { type: "tool", name: "analyze_family_dish" },
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!anthropicResponse.ok) {
        return new Response(
          JSON.stringify({
            reply: "Szedj egy tenyérnyi húst a sűrűjéből, és pakold meg a zöldségekkel! Mivel a leves pörköltalapon főtt, a zsíros levet ne tunkold ki kenyérrel, mert a zsírkereted már betelt mára.",
            delta: { protein: 1, veg: 1, carb: 1, fat: 1 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      const data = await anthropicResponse.json();
      const toolUse = data.content?.find((c) => c.type === "tool_use");
      const dishResult = toolUse?.input || {};

      return new Response(
        JSON.stringify({
          reply: dishResult.advice || "Szedj bátran a család ételéből a tenyér-szabály szerint!",
          delta: {
            protein: dishResult.protein ?? 1,
            veg: dishResult.veg ?? 1,
            carb: dishResult.carb ?? 1,
            fat: dishResult.fat ?? 1,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. INTERAKTÍV TÁNYÉR CSERE (SUGGEST OPTIONS)
    if (mode === "plate_swap" || mode === "suggest_options") {
      let restrictions = "";
      if (isFatOver) restrictions += " Zsírkeret elfogyott! Tilos olajat, vajat, diót és zsíros sajtot adni!";
      if (isCarbOver) restrictions += " Szénhidrátkeret elfogyott! Ne adj újabb kenyérfélét!";

      const prompt = `Az anyuka tányércserét kér. Keretei: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát, ${fat} zsír.
${restrictions}
Kérése: "${input}"
Adj 3-4 konkrét magyar alternatívát gombokként a suggest_food_options függvénnyel!`;

      const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 600,
          temperature: 0.1,
          tools: [
            {
              name: "suggest_food_options",
              description: "Kattintható ételjavaslat gombokat ad.",
              input_schema: {
                type: "object",
                properties: {
                  comment: { type: "string" },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        fullText: { type: "string" },
                        macroType: { type: "string" },
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
      return new Response(JSON.stringify(toolUse?.input || { options: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. NASI SOS
    if (mode === "craving") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 300,
          temperature: 0.2,
          system: "Te a FitAnya Zsebedzője vagy. Tömör, empátiás mentőöv.",
          messages: [{ role: "user", content: `Erre vágyik: "${input}". 1 mondat ok, 2 gyors alternatíva.` }],
        }),
      });
      const d = await res.json();
      return new Response(JSON.stringify({ reply: d.content?.[0]?.text || "" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Ismeretlen kérés" }), { status: 400, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
