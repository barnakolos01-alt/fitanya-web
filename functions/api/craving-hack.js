export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const apiKey = env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Az API kulcs hiányzik a Cloudflare-ből." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { craving, remaining } = body;

    if (!craving) {
      return new Response(
        JSON.stringify({ success: false, error: "Nem adtál meg ételt." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const prot = Number(remaining?.protein ?? 0);
    const veg = Number(remaining?.veg ?? 0);
    const carb = Number(remaining?.carb ?? 0);
    const fat = Number(remaining?.fat ?? 0);

    const isFatZero = fat <= 0;
    const isCarbZero = carb <= 0;

    let restrictionPrompt = "";
    if (isCarbZero) {
      restrictionPrompt += " FIGYELEM: A szénhidrátkeret elfogyott (0 maradt mára)! A receptben tilos hagyományos kenyeret, tésztát, rizst vagy cukrot használni. Helyette adj alacsony szénhidráttartalmú trükköt (pl. cukkini, tojás, túró alapú megoldás)!";
    }
    if (isFatZero) {
      restrictionPrompt += " FIGYELEM: A zsírkeret elfogyott (0 maradt mára)! Tilos olajat, vajat, tejszínt vagy zsíros sajtot ajánlani. Zsírszegény túrót, natúr sovány sonkát, sütőpapíron sütést használj!";
    }

    const prompt = `Egy édesanya erre vágyik most: "${craving}".
A mai hátralévő tenyér-kerete:
- Fehérje: ${prot} tenyér
- Rost / Zöldség: ${veg} ököl
- Szénhidrát: ${carb} marék
- Zsír: ${fat} hüvelykujj
${restrictionPrompt}

SZIGORÚ SZABÁLYOK A RECEPTHEZ:
1. GASZTRONÓMIAI JÓZAN ÉSZ (KRITIKUS): 
   - Édességekhez, sütikhez, palacsintához SZIGORÚAN TILOS zöldséget (spenót, rukkola, uborka, saláta) tenni vagy ajánlani! Édességnél a zöldség (veg) értéke KÖTELEZŐEN 0 legyen!
   - Ne akarj mindenáron minden makrót lefedni: ha az adott ételhez nem illik a zöldség, a delta.veg legyen 0!
   - A tészta fizikailag működjön: ha palacsintát vagy süteményt készítünk, a tojás/joghurt mellé KÖTELEZŐ kötőanyagot (pl. 2-3 ek zabpehely vagy zabpehelyliszt) írni, különben folyós rántotta lesz!
   - A címben szereplő alapanyagok egyezzenek a leírással (ha túrós, legyen benne túró)!

2. TISZTA MAGYAR NYELV:
   - Tilos az anglicizmus ("fluffy", "flavoring", "amerikas")!
   - Használj természetes, hétköznapi magyar konyhai kifejezéseket.

3. VALÓBAN 5-8 PERCES: 
   - Egyetlen serpenyőben, bögrében vagy tálban összedobható megoldás egyszerű magyar alapanyagokból.`;

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
            name: "generate_craving_hack",
            description: "Keretre szabott gyors receptet állít elő a sóvárgás kivédésére.",
            input_schema: {
              type: "object",
              properties: {
                title: { type: "string", description: "Étvágygerjesztő receptnév (pl. 5 perces Serpenyős Zabpalacsinta)" },
                time: { type: "string", description: "Elkészítési idő (pl. 6-8 perc)" },
                why: { type: "string", description: "1 rövid, megerősítő mondat az anyukának, miért tökéletes ez most" },
                steps: {
                  type: "array",
                  items: { type: "string" },
                  description: "2-3 pofonegyszerű, számozott elkészítési lépés"
                },
                side: { type: "string", description: "Rövid FitAnya trükk (édességnél pl. fahéj vagy 1 pohár víz, sós ételnél ropogós zöldség)" },
                delta: {
                  type: "object",
                  properties: {
                    protein: { type: "number", description: "Levonandó tenyér fehérje" },
                    veg: { type: "number", description: "Levonandó ököl rost" },
                    carb: { type: "number", description: "Levonandó marék szénhidrát" },
                    fat: { type: "number", description: "Levonandó hüvelykujj zsír" }
                  },
                  required: ["protein", "veg", "carb", "fat"]
                }
              },
              required: ["title", "time", "why", "steps", "delta"]
            }
          }
        ],
        tool_choice: { type: "tool", name: "generate_craving_hack" },
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          hack: {
            title: "5 perces Mentőöv Tányér",
            time: "5 perc",
            why: "Gyors fehérjedús alternatíva, ami azonnal stabilizálja a vércukrodat.",
            steps: [
              "Vegyél 3 evőkanál zsírszegény túrót vagy görög joghurtot.",
              "Keverd össze egy csipet fahéjjal vagy sóval és fokhagymával a vágyadtól függően.",
              "Fogyaszd el 1 pohár hideg vízzel vagy citromfű teával."
            ],
            side: "Igyál meg mellé egy nagy pohár hideg vizet!",
            delta: { protein: 1, veg: 0, carb: 0, fat: 0 }
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await anthropicResponse.json();
    const toolUse = data.content?.find((c) => c.type === "tool_use");
    const hackResult = toolUse?.input;

    if (!hackResult) {
      throw new Error("Nem sikerült feldolgozni a receptet.");
    }

    return new Response(
      JSON.stringify({ success: true, hack: hackResult }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Hiba történt a generáláskor." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
