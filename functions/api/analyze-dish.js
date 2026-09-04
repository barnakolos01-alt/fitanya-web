export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const { dishName } = await request.json();

    if (!dishName || dishName.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Érvénytelen ételnév" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Hiányzó API kulcs a környezeti változókban" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const systemPrompt = `Te a "FitAnya Módszer" szigorú táplálkozási szakértő AI motorja vagy. 
A feladatod egy felhasználó által beírt egyedi étel azonnali elemzése a FitAnya Tenyér-szabály szerint.

Visszatérési formátum: KIZÁRÓLAG egyetlen érvényes JSON objektumot adj vissza, mindenféle markdown formázás (pl. \`\`\`json), felvezető szöveg vagy lezárás NÉLKÜL!

A megkívánt JSON struktúra:
{
  "name": "Étel neve tisztítva és pontosítva",
  "delta": {
    "protein": 0-2 közötti szám (Tenyérnyi fehérje),
    "veg": 0-2 közötti szám (Ökölnyi zöldség/rost),
    "carb": 0-2.5 közötti szám (Maréknyi szénhidrát),
    "fat": 0-2 közötti szám (Hüvelykujjnyi minőségi zsír)
  },
  "tip": "1-2 mondatos, közvetlen, gyakorlatias FitAnya tálalási tanács az édesanyának."
}`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          { role: "user", content: `Elemezd ezt az ételt a Tenyér-szabály szerint: "${dishName}"` }
        ]
      })
    });

    const anthropicData = await anthropicResponse.json();
    
    if (anthropicData.error) {
      return new Response(JSON.stringify({ error: anthropicData.error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const rawText = anthropicData.content[0].text.trim();
    const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return new Response(JSON.stringify({
      success: true,
      dish: {
        id: "ai_" + Date.now(),
        name: parsed.name || dishName,
        keywords: [dishName.toLowerCase()],
        delta: parsed.delta,
        tip: parsed.tip
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
