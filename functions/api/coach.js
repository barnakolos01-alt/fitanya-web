export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const apiKey = env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Az API kulcs hiányzik." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { mode, input, remaining, currentPlate } = body;

    const prot = Number(remaining?.protein ?? 0);
    const veg = Number(remaining?.veg ?? 0);
    const carb = Number(remaining?.carb ?? 0);
    const fat = Number(remaining?.fat ?? 0);

    // 1. INTERAKTÍV GOMB-AJÁNLÓ
    if (mode === "plate_swap" || mode === "suggest_options") {
      const prompt = `Az anyuka a tányérján lévő ételeket szeretné cserélni.
Jelenlegi keretei: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát, ${fat} zsír.

Jelenlegi tételek a tányérján:
- Fehérje: "${currentPlate?.protein || "nincs"}"
- Rost: "${currentPlate?.veg || "nincs"}"
- Szénhidrát: "${currentPlate?.carb || "nincs"}"
- Zsír: "${currentPlate?.fat || "nincs"}"

Kérése: "${input}"

SZABÁLYOK:
- Ha több dolgot említ (pl. túró helyett mást, és rozs helyett fehér kenyeret), AKKOR MINDKETTŐRE adj külön gombot! 
- Ha konkrét ételt kér (pl. fehér kenyér), adj egy gombot, ami pontosan arra cseréli!
- Hívd meg a suggest_food_options eszközt!`;

      const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 800,
          temperature: 0.2,
          tools: [
            {
              name: "suggest_food_options",
              description: "Kattintható ételjavaslat gombokat ad.",
              input_schema: {
                type: "object",
                properties: {
                  comment: {
                    type: "string",
                    description: "1 barátságos jóváhagyó mondat.",
                  },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string", description: "Rövid gombfelirat, pl: 🍞 Fehér kenyér" },
                        fullText: { type: "string", description: "Teljes szöveg a kártyára, pl: 1 szelet fehér kenyér" },
                        macroType: { type: "string", description: "Melyik kártya: protein, veg, carb vagy fat" },
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

      // Vészhelyzeti háló: Ha az Anthropic API hibát dob, azonnal adunk 3 mentő-gombot
      if (!anthropicResponse.ok) {
        return new Response(JSON.stringify({
          comment: "Itt van pár szuper alternatíva a kérésed alapján:",
          options: [
            { label: "🥚 2-3 db Főtt tojás (Fehérje)", fullText: "2-3 db főtt tojás vagy tükörtojás", macroType: "protein" },
            { label: "🥛 Natúr Joghurt (Fehérje)", fullText: "1 kis doboz natúr görög joghurt", macroType: "protein" },
            { label: "🍞 Fehér kenyér (Szénhidrát)", fullText: "1 szelet fehér vagy félbarna kenyér", macroType: "carb" },
          ]
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      const data = await anthropicResponse.json();
      const toolUse = data.content?.find((c) => c.type === "tool_use");
      const result = toolUse?.input || {
        comment: "Nézd, ezeket dobhatod be helyette:",
        options: [
            { label: "🥚 Tojás (Fehérje)", fullText: "2-3 db főtt tojás", macroType: "protein" },
            { label: "🍞 Fehér kenyér (Szénhidrát)", fullText: "1 szelet fehér kenyér", macroType: "carb" },
        ],
      };

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // TÁNYÉROM KERESŐ
    if (mode === "dish") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 350,
          temperature: 0.2,
          system: "Te a FitAnya Zsebedzője vagy. Semmi AI-zsargon, csak életszerű tálalási tanács.",
          messages: [{ role: "user", content: `A család ezt eszi: "${input}". Hátralévő keret: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát, ${fat} zsír. Mondd el hogyan szedjen! A végén kötelező: 🖐️ Levonás: X tenyér fehérje...` }],
        }),
      });
      const d = await res.json();
      return new Response(JSON.stringify({ reply: d.content?.[0]?.text || "" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // NASI SOS
    if (mode === "craving") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 350,
          temperature: 0.2,
          system: "Te a FitAnya Zsebedzője vagy. Nulla bűntudat, csak gyors segítség.",
          messages: [{ role: "user", content: `Erre vágyik: "${input}". 1 mondat ok, 2 gyors túlélő alternatíva.` }],
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
