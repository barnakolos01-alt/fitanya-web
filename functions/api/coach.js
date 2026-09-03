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

    // Rendszerprompt: közvetlen, laza, hús-vér magyar hangnem (semmi AI-szarság vagy fordításszagú szöveg)
    const systemPrompt = `Te vagy a FitAnya digitális Zsebedzője: közvetlen, intelligens, laza és őszinte mentor édesanyáknak. 
Úgy beszélj, mint egy okos barátnő, aki ismeri a biokémiát, de nem gépieskedik. Kerülj minden steril, fordításszagú fitnesz-szöveget (pl. ne használd a "normalizálja", "kombó", "optimális" kifejezéseket).
A válaszaid rövidek, max 3-4 mondatosak.`;

    let userPrompt = "";

    // Ellenőrizzük, hogy elfogyott-e minden keret mára
    const isZeroRemaining = 
      (remaining?.protein || 0) <= 0 && 
      (remaining?.veg || 0) <= 0 && 
      (remaining?.carb || 0) <= 0;

    if (mode === "craving") {
      userPrompt = `Az anyuka ezt kívánja éppen: "${input}".
Maradék mai kerete: ${remaining?.protein || 0} fehérje, ${remaining?.veg || 0} rost, ${remaining?.carb || 0} szénhidrát, ${remaining?.fat || 0} zsír.
Mondd el 1 mondatban laza stílusban az élettani okát (pl. fáradtság, stressz), és adj 1-2 gyors alternatívát, ami nem borítja fel a napját.`;
    } else if (mode === "dinner") {
      if (isZeroRemaining) {
        userPrompt = `Esti zárás, az anyuka ezt írta be: "${input}". 
Figyelem: a mai kerete mára már teljesen betelt (mindenhol 0 vagy kevesebb van hátra)! 
SZIGORÚAN TILOS újabb kaját vagy receptet ajánlanod! Helyette állj bele határozottan, de kedvesen: mondd meg neki, hogy mára lezárt a bolt, ez már nem éhség, hanem a fáradtság vagy az esti relax keresése. Küldd el egy pohár vízre, teára vagy aludni.`;
      } else {
        userPrompt = `Esti hűtőmentés! Ezt enné / ez van otthon: "${input}".
Még hátralévő kerete: ${remaining?.protein || 0} fehérje, ${remaining?.veg || 0} rost, ${remaining?.carb || 0} szénhidrát, ${remaining?.fat || 0} zsír.
Írj egy 3 mondatos, villámgyors vacsorát kizárólag a maradék keretéből, teljesen emberi nyelven!`;
      }
    } else {
      userPrompt = input;
    }

    // Hívás a Claude 3.5 Haiku modellhez
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
