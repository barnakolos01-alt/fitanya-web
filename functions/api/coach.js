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

    const isZeroRemaining = prot <= 0 && veg <= 0 && carb <= 0;

    let systemPrompt = `Te a FitAnya digitális Zsebedzője vagy: közvetlen, életrevaló, magyar konyhai mentor kisgyerekes anyukáknak.
Nincs kalóriaszámolás, a Tenyér-szabályt használjuk (fehérje: tenyér, rost: ököl, szénhidrát: marék, zsír: hüvelykujj).
Kerülj minden AI-zsargont és tükörfordítást.`;

    let userPrompt = "";
    let isJsonMode = false;

    // 1. TÁNYÉROM KERESŐ
    if (mode === "dish") {
      userPrompt = `A család ezt eszi: "${input}".
Hátralévő keret: ${prot} tenyér fehérje, ${veg} ököl rost, ${carb} marék szénhidrát, ${fat} hüvelykujj zsír.
Mondd el 2 tömör mondatban, hogyan szedjen a kész családi ételből a tányérjára mérlegelés nélkül, mit tegyen mellé rostként.
A végén kötelező sor:
🖐️ Levonás: X tenyér fehérje, X ököl rost, X marék szénhidrát, X hüvelykujj zsír.`;
    }

    // 2. INTERAKTÍV TÁNYÉR CSERE (KÖTELEZŐ GÉPI ADATVÁLASZ)
    else if (mode === "plate_swap") {
      isJsonMode = true;
      systemPrompt = `Te egy belső konyhai adatfeldolgozó vagy. Feladatod: az anyuka kérése alapján KÖZVETLENÜL kicserélni a hiányzó tápanyag kártyáját a hűtője szerint.
SOHA NE írj szöveges választ, listát vagy magyarázatot a JSON elé vagy mögé!
Kizárólag érvényes JSON mezőket tölts ki:
- protein: az új konkrét fehérjeétel pontos adaggal (pl. "1 nagy doboz görög joghurt (200g)" vagy "150g zsírszegény túró")
- veg: az új zöldség pontos adaggal
- carb: az új szénhidrát pontos adaggal
- fat: az új zsír pontos adaggal
- comment: 1etlen rövid jóváhagyó mondat (pl. "Átírtam natúr joghurtra, szuper választás!")`;

      userPrompt = `Hiányzó adagok mára: ${prot} tenyér fehérje, ${veg} ököl rost, ${carb} marék szénhidrát, ${fat} hüvelykujj zsír.
Jelenlegi kártyák a képernyőn:
- Fehérje: "${currentPlate?.protein || ""}"
- Rost: "${currentPlate?.veg || ""}"
- Szénhidrát: "${currentPlate?.carb || ""}"
- Zsír: "${currentPlate?.fat || ""}"

Az anyuka kérése: "${input}"
(Ha azt írja, hogy valami nincs vagy mást kér, cseréld le a megfelelő mezőt konkrét bolti/otthoni ételre!)`;
    }

    // 3. NASI SOS
    else if (mode === "craving") {
      userPrompt = `Az anyuka erre vágyik: "${input}".
Hátralévő kerete: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát.
1 mondat az élettani okról (fáradtság/dopamin), plusz 2 gyors túlélő alternatíva.`;
    }

    // 4. ESTI ZÁRÁS
    else if (mode === "dinner") {
      if (isZeroRemaining) {
        userPrompt = `A keret betelt (0 maradt). Mondd meg neki kedvesen de határozottan, hogy mára zárva a konyha, ez fáradtság, igyon egy teát és aludjon.`;
      } else {
        userPrompt = `Gyors vacsora kizárólag a maradék keretből: ${prot} fehérje, ${veg} rost, ${carb} szénhidrát.`;
      }
    } else {
      userPrompt = input;
    }

    const messages = [{ role: "user", content: userPrompt }];

    // Assistant Pre-fill trükk: Ha JSON-t várunk, kényszerítjük a kezdést
    if (isJsonMode) {
      messages.push({ role: "assistant", content: '{\n  "' });
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
        max_tokens: 300,
        temperature: 0.1,
        system: systemPrompt,
        messages: messages,
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
    let replyText = data.content?.[0]?.text || "";

    if (isJsonMode) {
      replyText = '{\n  "' + replyText;
    }

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
