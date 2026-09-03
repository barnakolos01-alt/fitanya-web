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

    // Számértékek biztonságos parse-olása
    const prot = Number(remaining?.protein ?? 0);
    const veg = Number(remaining?.veg ?? 0);
    const carb = Number(remaining?.carb ?? 0);
    const fat = Number(remaining?.fat ?? 0);

    const isZeroRemaining = prot <= 0 && veg <= 0 && carb <= 0;

    const systemPrompt = `Te a FitAnya digitális Zsebedzője vagy. Egyenes, intelligens, laza, jókedvű magyar konyhai mentor kisgyerekes anyukáknak.

ALAPSZABÁLYOK:
1. SOHA NE REFORMÁLD MEG A CSALÁD ÉTELÉT! Az anyuka NEM főz kétfelé, nem használ szarvashúst, parmezánt vagy külön diétás alapanyagokat. A meglévő, kész családi ételből szed a saját tányérjára a Tenyér-szabály szerint!
2. TILOS az AI-zsargon és a tükörfordítás (tilos: "Mission ACCEPTED", "kombó", "normalizálja a sóvárgást", "csipogtatunk", "szerű").
3. Életszerű, természetes magyar nyelven beszélj, ahogy egy praktikus barátnő mondaná.
4. Válaszaid legyenek tömörek: 2-4 mondat, semmi felesleges bevezető ömlengés.`;

    let userPrompt = "";

    // 1. TÁNYÉROM (ÉTELFELISMERŐ & ADAGOLÓ)
    if (mode === "dish") {
      userPrompt = `A család ezt eszi / ezt főzte: "${input}".
Az anyuka hátralévő kerete: ${prot} tenyér fehérje, ${veg} ököl rost, ${carb} marék szénhidrát, ${fat} hüvelykujj zsír.

Így válaszolj (kövesd ezt a stílust és szerkezetet):
PÉLDA:
"Nyugodtan egyél belőle! A rakott krumpliból a kolbász és a tojás a fehérjéd, a krumpli a szénhidrát. Szedj egy tenyérnyi kockát a tányérodra, de a tepsi alján maradt zsíros szaftot ne kanalazd rá! Mellé kötelezően vágj egy nagy ökölnyi savanyúságot (kovászos ubi, csemegeubi vagy csalamádé), hogy meglegyen a rostod és eltelítsen.

🖐️ Levonás: 1 tenyér fehérje, 1 ököl rost, 1 marék szénhidrát, 1 hüvelykujj zsír."

Most válaszolj a megadott ételre ("${input}") pontosan ugyanebben a szellemben és tálalási logikában! A végén kötelező a levonás sor.`;
    }

    // 2. NASI SOS (SÓVÁRGÁS)
    else if (mode === "craving") {
      userPrompt = `Az anyuka erre vágyik most: "${input}".
Hátralévő kerete: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát.

Így válaszolj:
1. Egyetlen együttérző, laza mondat az élettani okról (nem akaraterő-hiány: kimerültség, alváshiány, kortizol, dopaminéhség).
2. Két valódi, 60 másodperces túlélő alternatíva (hétköznapi bolti vagy otthoni dolog), ami elüti a vágyat.`;
    }

    // 3. ESTI ZÁRÁS & HŰTŐMENTŐ
    else if (mode === "dinner") {
      if (isZeroRemaining) {
        userPrompt = `Este van, az anyuka ezt írta be a hűtőmentőbe: "${input}".
FONTOS: A mai kerete teljesen elfogyott (0 fehérje, 0 rost, 0 szénhidrát maradt)!
SZIGORÚAN TILOS vacsorát, receptet, csirkét vagy rizst ajánlani!
Így válaszolj:
"Állj, mára a konyha bezárt! 🛑 A mai keretedet hibátlanul lehoztad, a tested mindent megkapott. Ez a vágy most nem valódi éhség, hanem a fáradtság és a nap végi leeresztés jele. Igyál meg egy nagy bögre meleg citromfű vagy mentateát, és bújj ágyba – holnap reggel nagyon büszke leszel magadra!"`;
      } else {
        userPrompt = `Esti hűtőmentés! Ez van otthon a hűtőben: "${input}".
Hátralévő kerete: ${prot} tenyér fehérje, ${veg} ököl rost, ${carb} marék szénhidrát, ${fat} hüvelykujj zsír.

Állíts össze 3 mondatban egy 10 perces túlélő vacsorát KIZÁRÓLAG a maradék keretéből. Semmi flancolás: mit mivel dobjon a serpenyőbe vagy tányérra.`;
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
        temperature: 0.2, // Alacsony kreativitás a hallucinációk megszüntetésére
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
