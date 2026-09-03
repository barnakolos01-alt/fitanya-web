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

    // 1. INTERAKTÍV GOMB-AJÁNLÓ (SUGGEST OPTIONS)
    if (mode === "plate_swap" || mode === "suggest_options") {
      let macroNotes = [];
      if (fat <= 0) macroNotes.push("A zsírkeret betelt: olaj, vaj, magvak és zsíros sajt helyett zsírszegény opciókat ajánlj!");
      if (carb <= 0) macroNotes.push("A szénhidrátkeret betelt: ha kenyeret kér, ajánlj nagyon könnyű alternatívát (pl. puffasztott rizs vagy plusz zöldség ropogtatni)!");

      const prompt = `Az anyuka a tányérján lévő ételeket szeretné cserélni a hűtője szerint.
Jelenlegi keretei: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát, ${fat} zsír.
${macroNotes.join(" ")}

Jelenlegi tételek a tányérján:
- Fehérje: "${currentPlate?.protein || "nincs"}"
- Rost: "${currentPlate?.veg || "nincs"}"
- Szénhidrát: "${currentPlate?.carb || "nincs"}"
- Zsír: "${currentPlate?.fat || "nincs"}"

Az anyuka ezt írta: "${input}"

SZABÁLYOK:
- Ha több dolgot is említett (pl. rozskenyér ÉS uborka), adj opciókat mindkettőre!
- A gombok felirata (label) legyen egyértelmű, pl: "🥒 Uborka helyett: Paradicsom" vagy "🍞 Kenyér helyett: Puffasztott rizs".
- Hívd meg a suggest_food_options eszközt 3-4 konkrét opcióval!`;

      const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 800, // Bőven elég hely a részletes opcióknak
          temperature: 0.2,
          tools: [
            {
              name: "suggest_food_options",
              description: "Kattintható ételjavaslat gombokat ad az anyukának.",
              input_schema: {
                type: "object",
                properties: {
                  comment: {
                    type: "string",
                    description: "1 tömör barátságos mondat, ami visszaigazolja a cserét.",
                  },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string", description: "Rövid gombfelirat, pl: 🥒 Uborka helyett: Koktélparadicsom" },
                        fullText: { type: "string", description: "A tányér kártyájára kerülő teljes tétel pontos adaggal" },
                        macroType: { type: "string", enum: ["protein", "veg", "carb", "fat"], description: "Melyik kártyát módosítja" },
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

      if (!anthropicResponse.ok) {
        const errText = await anthropicResponse.text();
        return new Response(JSON.stringify({ error: "AI hiba", details: errText }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }

      const data = await anthropicResponse.json();
      const toolUse = data.content?.find((c) => c.type === "tool_use");
      const result = toolUse?.input || {
        comment: "Itt van pár szuper alternatíva a hűtődhöz:",
        options: [
          { label: "🥒 Uborka helyett: Paradicsom", fullText: "2 marék édes koktélparadicsom", macroType: "veg" },
          { label: "🍞 Rozskenyér helyett: Fehér kenyér", fullText: "1 szelet fehér vagy félbarna kenyér", macroType: "carb" },
          { label: "🍞 Rozskenyér helyett: Puffasztott rizs", fullText: "3-4 db natúr puffasztott rizs", macroType: "carb" },
        ],
      };

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
          max_tokens: 350,
          temperature: 0.2,
          system: "Te a FitAnya Zsebedzője vagy. Semmi AI-zsargon, csak életszerű tálalási tanács.",
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
          max_tokens: 350,
          temperature: 0.2,
          system: "Te a FitAnya Zsebedzője vagy. Nulla bűntudat, csak gyors segítség.",
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
