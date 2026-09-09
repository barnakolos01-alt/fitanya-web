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

SZABÁLYOK A RECEPTHEZ:
1. MAX 8 PERC: Egyetlen serpenyőben, mikróban vagy tálban azonnal összedobható legyen. Nincs órákig tartó pepecselés!
2. HÉTKÖZNAPI MAGYAR ALAPANYAGOK: Szigorúan olyan hozzávalók kellenek, amik egy átlagos magyar háztartásban megtalálhatók (tojás, zabpehely, túró, sonka, reszelt sajt, tortilla, tejföl/görög joghurt, kakaópor, alma, fagyasztott zöldség). TILOS egzotikus bioboltos port vagy luxus összetevőt kérni!
3. VÁGY-KIELÉGÍTÉS: A textúra vagy az ízvilág pontosan elégítse ki a kívánt ételt (pl. ha csoki -> sűrű kakaós túrókrém; ha pizza -> serpenyős tortilla-pizza; ha chips -> fűszeres sajtropogós vagy zöldségmártogatós).
4. TENYÉR-LEVONÁS: Állítsd be a pontos levonási értékeket (protein, veg, carb, fat).`;

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
                title: { type: "string", description: "Étvágygerjesztő receptnév (pl. 5 perces Serpenyős Tortilla-Pizza)" },
                time: { type: "string", description: "Elkészítési idő (pl. 6-8 perc)" },
                why: { type: "string", description: "1 rövid, megerősítő mondat az anyukának, miért tökéletes ez most" },
                steps: {
                  type: "array",
                  items: { type: "string" },
                  description: "2-3 pofonegyszerű, számozott elkészítési lépés"
                },
                side: { type: "string", description: "Rövid FitAnya trükk a teltségérzetért vagy plusz rostért" },
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
      // Biztonsági tartalék válasz hálózati elakadás esetén
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
            side: "Egyél mellé pár szem ropogós kígyóuborkát vagy répát!",
            delta: { protein: 1, veg: 0.5, carb: 0, fat: 0 }
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
