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
    const { mode, input, remaining } = body;

    const prot = remaining?.protein ?? 0;
    const veg = remaining?.veg ?? 0;
    const carb = remaining?.carb ?? 0;
    const fat = remaining?.fat ?? 0;

    // Ha minden fő keret elfogyott mára
    const isZeroRemaining = prot <= 0 && veg <= 0 && carb <= 0;

    // RENDSZERPROMPT: Emberi, természetes, magabiztos magyar zsebedző
    const systemPrompt = `Te a FitAnya digitális Zsebedzője vagy: egyenes, közvetlen, életrevaló és empatikus konyhai mentor kisgyerekes anyukáknak.
Módszered: konyhamérleg nélkül, tenyér-mértékekkel (tenyérnyi fehérje, ökölnyi zöldség/rost, maréknyi szénhidrát, hüvelykujjnyi zsír) a közös családi fazékból.

STÍLUSSZABÁLYOK:
- Beszélj úgy, mint egy éles eszű, támogató barátnő a konyhapult mellett: közvetlen, laza, természetes magyar mondatokkal.
- SZIGORÚAN TILOS az angol tükörfordítás és az AI-zsargon! Ne használj olyan szavakat, mint: "kombó", "normalizálja a sóvárgást", "retúr tányér", "optimalizálás", "kompaundálódik".
- Nincs felesleges bevezető sallang ("Íme a javaslatom:", "Örömmel segítek:"). Azonnal a lényegre térj!
- Ne használj markdown kettőskereszteket (#, ##). Csak normál bekezdéseket és félkövér kiemelést (**).
- Válaszaid legyenek rövidek, pörgősek (3-4 mondat max).`;

    let userPrompt = "";

    // 1. ÉTEL-FORDÍTÓ (TÁNYÉROM KERESŐ)
    if (mode === "dish") {
      userPrompt = `A család ezt eszi / ezt főzte: "${input}".
Az anyuka hátralévő mai kerete: ${prot} tenyér fehérje, ${veg} ököl rost, ${carb} marék szénhidrát, ${fat} hüvelykujj zsír.
Feladatod:
1. Magyarázd el 2 tömör mondatban, hogyan szedjen ebből a saját tányérjára a közös fazékból mérlegelés nélkül (pl. mennyi hús/feltét, köret, és mit tegyen mellé zöldségként).
2. A legvégén egyetlen külön sorban add meg a pontos levonási javaslatot így:
🖐️ Levonás: X tenyér fehérje, X ököl rost, X marék szénhidrát, X hüvelykujj zsír.`;
    }

    // 2. SÓVÁRGÁS ÉS NASI SOS
    else if (mode === "craving") {
      userPrompt = `Az anyuka ezt kívánja azonnal: "${input}".
Hátralévő kerete: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát.
Feladatod:
1. Mondd el 1 empátiával teli, közvetlen mondatban a valós élettani hátteret (fáradtság, kialvatlanság vagy kortizol-ugrás miatti dopaminéhség – semmi bűntudat!).
2. Adj 2 olyan pofonegyszerű bolti vagy hűtős alternatívát, ami 60 másodperc alatt összedobható, kielégíti az ízvágyat (édes vagy sós), de nem robbantja szét a napját.`;
    }

    // 3. ESTI ZÁRÁS & HŰTŐMENTŐ
    else if (mode === "dinner") {
      if (isZeroRemaining) {
        userPrompt = `Késő este van, az anyuka ezt írta be a Hűtőmentőbe: "${input}".
KRITIKUS HELYZET: A mai napi kerete már teljesen elfogyott (0 fehérje, 0 rost, 0 szénhidrát van hátra)!
SZIGORÚAN TILOS receptet vagy újabb étkezést javasolnod!
Feladatod:
Állítsd meg kedvesen, de határozottan és őszintén:
- Mondd meg neki, hogy a mai keretét hibátlanul lehozta, a teste megkapott mindent.
- Világíts rá, hogy ez a késő esti vágy most nem valódi éhség, hanem a csendes házban fellépő fáradtság és a napi stressz levezetése.
- Javasolj neki egy nagy bögre meleg gyógyteát (citromfű/menta), 2-3 dl vizet, vagy hogy csukja be a hűtőt és feküdjön le aludni.`;
      } else {
        userPrompt = `Esti hűtőmentés! Ez van otthon a hűtőben: "${input}".
Még hátralévő kerete mára: ${prot} tenyér fehérje, ${veg} ököl rost, ${carb} marék szénhidrát, ${fat} hüvelykujj zsír.
Feladatod:
Rakj össze belőle egy 10 perces, konyhai túlélő vacsorát KIZÁRÓLAG a maradék keretéből. Semmi flancolás: mit mivel dobjon össze a serpenyőben vagy tányéron, hogy jóllakottan zárja a napot.`;
      }
    }

    // EGYÉB ESET
    else {
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
