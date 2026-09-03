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

    const isFatOver = fat <= 0;
    const isCarbOver = carb <= 0;

    // 1. TÁNYÉROM KERESŐ (DISH): STRUKTURÁLT MAGYAR KONYHAI ELEMZÉS
    if (mode === "dish") {
      let warning = "";
      if (isFatOver) {
        warning += " FIGYELEM: A zsírkeret BETELT vagy TÚLLÉPVE! SZIGORÚAN TILOS vajat, olajat vagy plusz zsírt ajánlani! Ha zsírosabb magyar ételről van szó (gulyás, pörkölt, rakott ételek), figyelmeztesd, hogy a zsíros szaftot/levet hagyja a tányéron, ne tunkoljon, és a javasolt levonásban KÖTELEZŐ legalább 1 zsírt felszámolni a rejtett zsírok miatt!";
      }

      const prompt = `A család ezt eszi: "${input}".
Az anyuka megmaradt kerete: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát, ${fat} zsír.
${warning}

SZABÁLYOK:
- Nincs mellébeszélés, nincs "rozs" a rost helyett, nincs áltudományoskodás!
- Tanítsd meg 2-3 tömör mondatban, hogyan szedjen a kész családi fazékból a Tenyér-szabály szerint (mit tegyen a tányérra fehérjeként, rostként, szénhidrátként).
- Állítsd be a reális levonási számokat az adagolási javaslathoz!

Kizárólag érvényes JSON-t adj vissza:
{
  "reply": "2-3 praktikus magyar mondat a tálalásról",
  "delta": {
    "protein": 1,
    "veg": 1,
    "carb": 1,
    "fat": ${isFatOver ? 1 : 1}
  }
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
          max_tokens: 400,
          temperature: 0.1,
          system: "Te a FitAnya Zsebedzője vagy. Ismered a hagyományos magyar konyha rejtett zsírtartalmát. Szigorúan JSON formátumban válaszolsz.",
          messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: '{\n  "reply":' }
          ],
        }),
      });

      if (!anthropicResponse.ok) {
        return new Response(JSON.stringify({
          reply: "Nyugodtan egyél belőle! Szedj egy tenyérnyi húst és bőségesen zöldséget a sűrűjéből. A zsíros levét ne kanalazd ki mind, mert a leves alapja zsíros!",
          delta: { protein: 1, veg: 1, carb: 1, fat: 1 }
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      const data = await anthropicResponse.json();
      const raw = '{\n  "reply":' + (data.content?.[0]?.text || "");
      try {
        const parsed = JSON.parse(raw);
        return new Response(JSON.stringify(parsed), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({
          reply: "Nyugodtan egyél belőle! A hús a fehérjéd, a zöldség a rostod. A zsíros szaftot és tunkolást kerüld, mert a keretedből a zsír már betelt!",
          delta: { protein: 1, veg: 1, carb: 1, fat: 1 }
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
    }

    // 2. INTERAKTÍV GOMB-AJÁNLÓ (SUGGEST OPTIONS)
    if (mode === "plate_swap" || mode === "suggest_options") {
      let restrictions = "";
      if (isFatOver) restrictions += " FIGYELEM: Zsírkeret elfogyott! Tilos olajat, vajat, diót és zsíros sajtokat adni!";
      if (isCarbOver) restrictions += " FIGYELEM: Szénhidrátkeret elfogyott! Ne adj hozzá újabb pékárut vagy tésztát!";

      const prompt = `Az anyuka tányércserét kér.
Hátralévő keretei: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát, ${fat} zsír.
${restrictions}
Jelenlegi tételei: Fehérje: "${currentPlate?.protein}", Rost: "${currentPlate?.veg}", Szénhidrát: "${currentPlate?.carb}", Zsír: "${currentPlate?.fat}".
Kérése: "${input}"

Kizárólag érvényes JSON formátumban válaszolj!`;

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
          system: "Te egy szigorúan JSON-t visszaadó táplálkozási motor vagy.",
          messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: '{\n  "comment":' }
          ],
        }),
      });

      const data = await anthropicResponse.json();
      const rawText = '{\n  "comment":' + (data.content?.[0]?.text || "");
      try {
        const parsed = JSON.parse(rawText);
        return new Response(JSON.stringify(parsed), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ options: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
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
