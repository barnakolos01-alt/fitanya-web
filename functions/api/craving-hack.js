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

    const isSweet = /palacsinta|csoki|édes|süti|torta|fagyi|keksz|muffin|lekvár|juhar|nutella/i.test(craving);

    const prompt = `Erre vágyik az anyuka: "${craving}".
A mai maximálisan elérhető felső kerete:
- Fehérje max: ${prot} tenyér
- Zöldség/rost max: ${veg} ököl
- Szénhidrát max: ${carb} marék
- Zsír max: ${fat} hüvelykujj

FELADAT ÉS ALAPSZABÁLYOK:
1. A cél az adott VÁGY kielégítése egy villámgyors (5-8 perces), egészséges alternatívával.
2. NEM CÉL A TELJES KERET KITÖLTÉSE! Csak annyit vonj le, amennyi a receptben ténylegesen benne van.
3. ÉDESSÉG SZABÁLY (${isSweet ? "EZ ÉDESSÉG!" : "Nem édesség"}):
   - Ha az étel édes (süti, palacsinta, krém, túró): SZIGORÚAN TILOS zöldséget (spenót, saláta, uborka, cukkini) tenni bele vagy melléadni!
   - Édességnél a veg (zöldség) értéke KÖTELEZŐEN 0!
   - Gyümölcsből max 1 marék mehet (ez szénhidrát: carb: 0.5 vagy 1, NEM veg!).
4. A RECEPT MŰKÖDJÖN A VALÓSÁGBAN:
   - Tojásos édes palacsintánál legyen benne kötőanyag (pl. 2 ek zabpehelyliszt vagy krémes túró + csipet sütőpor).
   - Természetes, anyukás, barátságos magyar nyelven írj (tilosak a kitalált szavak, mint "rostúramódosító" vagy "pólya spenót")!`;

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
        system: "Te a FitAnya Zsebedző gyakorlatias mesterszakácsa vagy. Célod, hogy életszerű, 5 perces magyar recepteket adj a nőknek. Édes ételekhez SOHA nem párosítasz zöldséget, salátát vagy spenótot.",
        tools: [
          {
            name: "generate_craving_hack",
            description: "Gyors receptet állít elő a sóvárgás kivédésére.",
            input_schema: {
              type: "object",
              properties: {
                title: { type: "string", description: "Étvágygerjesztő receptnév (pl. 5 perces Zabos Túrópalacsinta)" },
                time: { type: "string", description: "Elkészítési idő (pl. 5-7 perc)" },
                why: { type: "string", description: "1 barátságos mondat, miért segít ez a vágy kivédésében" },
                steps: {
                  type: "array",
                  items: { type: "string" },
                  description: "2-3 világos, pontokba szedett konyhai lépés"
                },
                side: { type: "string", description: "Opcionális tálalási tipp (édességnél pl. fahéj, pár szem málna; sósnál pl. paradicsomkarika)" },
                delta: {
                  type: "object",
                  properties: {
                    protein: { type: "number", description: "Ténylegesen felhasznált tenyér fehérje (0-2)" },
                    veg: { type: "number", description: "Ténylegesen felhasznált ököl zöldség. ÉDESSÉGNÉL MINDIG 0!" },
                    carb: { type: "number", description: "Ténylegesen felhasznált marék szénhidrát (0-2)" },
                    fat: { type: "number", description: "Ténylegesen felhasznált hüvelykujj zsír (0-1.5)" }
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
            title: "5 perces Serpenyős Túrópalacsinta",
            time: "6 perc",
            why: "Magas fehérjetartalmú palacsinta-élmény, ami azonnal elűzi az édességvágyat anélkül, hogy megdobná a vércukrod.",
            steps: [
              "Keverj össze 1 tojást 100g zsírszegény túróval, 2 evőkanál zabpehelyliszttel és édesítővel/fahéjjal.",
              "Egy teáskanál vajon vagy kókuszzsíron süsd át mindkét oldalát 2-2 perc alatt egy serpenyőben.",
              "Locsold meg 1 teáskanál juharsziruppal vagy szórd meg egy marék bogyós gyümölccsel."
            ],
            side: "Tálald melegen, egy csésze citromos teával!",
            delta: { protein: 1.5, veg: 0, carb: 1, fat: 0.5 }
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await anthropicResponse.json();
    const toolUse = data.content?.find((c) => c.type === "tool_use");
    const hackResult = toolUse?.input;

    if (!hackResult) {
      throw new Error("Nem sikerült feldolgozni a választ.");
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
