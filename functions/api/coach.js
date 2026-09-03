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

    // 1. INTERAKTÍV GOMB-AJÁNLÓ (SUGGEST OPTIONS / PLATE SWAP)
    if (mode === "plate_swap" || mode === "suggest_options") {
      let restrictions = "";
      if (fat <= 0) restrictions += " FIGYELEM: Zsírkeret elfogyott! Tilos olajat, vajat, diót és zsíros sajtokat adni!";
      if (carb <= 0) restrictions += " FIGYELEM: Szénhidrátkeret elfogyott! Ne adj hozzá újabb pékárut vagy tésztát!";

      const prompt = `Az anyuka tányércserét kér.
Hátralévő keretei: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát, ${fat} zsír.
${restrictions}

Jelenlegi tételei:
- Fehérje: "${currentPlate?.protein || "nincs"}"
- Rost: "${currentPlate?.veg || "nincs"}"
- Szénhidrát: "${currentPlate?.carb || "nincs"}"
- Zsír: "${currentPlate?.fat || "nincs"}"

Kérése: "${input}"

FELADAT: Adj 3 vagy 4 konkrét, hétköznapi magyar bolti/hűtős alternatívát gombokként!
FONTOS: Ha fehérjét kért (pl. nem szereti a cottage cheese-t), KIZÁRÓLAG fehérjéket adj (pl. tojás, sonka, görög joghurt, tonhal)!

Kizárólag érvényes JSON formátumban válaszolj!
Minta:
{
  "comment": "Szuper, cseréljük le! Itt van pár könnyű alternatíva:",
  "options": [
    { "label": "🥚 2-3 db Főtt tojás", "fullText": "2-3 db főtt tojás vagy tükörtojás", "macroType": "protein" },
    { "label": "🥩 3-4 szelet Pulykasonka", "fullText": "3-4 szelet minőségi pulykasonka", "macroType": "protein" },
    { "label": "🥛 Görög joghurt (150g)", "fullText": "1 kis doboz natúr görög joghurt", "macroType": "protein" }
  ]
}`;

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
          system: "Te egy szigorúan JSON-t visszaadó táplálkozási motor vagy. Tilos bármilyen más szöveget generálni!",
          messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: '{\n  "comment":' }
          ],
        }),
      });

      if (!anthropicResponse.ok) {
        return new Response(JSON.stringify({ options: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      const data = await anthropicResponse.json();
      const rawText = '{\n  "comment":' + (data.content?.[0]?.text || "");
      
      try {
        const parsed = JSON.parse(rawText);
        return new Response(JSON.stringify(parsed), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ options: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 2. TÁNYÉROM KERESŐ
    if (mode === "dish") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 350,
          temperature: 0.2,
          system: "Te a FitAnya Zsebedzője vagy. Semmi AI-zsargon, csak életszerű tálalási tanács a családi fazékból.",
          messages: [{ role: "user", content: `A család ezt eszi: "${input}". Hátralévő keret: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát, ${fat} zsír. Mondd el hogyan szedjen! A végén kötelező: 🖐️ Levonás: X tenyér fehérje...` }],
        }),
      });
      const d = await res.json();
      return new Response(JSON.stringify({ reply: d.content?.[0]?.text || "" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // 3. NASI SOS
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
