export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. AI COACH VÉGPONT (Nasi SOS & Esti hűtőmentés)
    if (url.pathname === "/api/coach" && request.method === "POST") {
      try {
        const apiKey = env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Az API kulcs nincs beállítva a Cloudflare-ben." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const body = await request.json();
        const { mode, input, remaining } = body;

        const systemPrompt = `Te vagy a FitAnya digitális Zsebedzője: közvetlen, empatikus, bűntudatmentes és gyakorlatias mentor édesanyáknak.
A válaszaid rövidek (3-4 mondat), és azonnal alkalmazható alternatívát adnak.
Alapszabályok:
- Soha ne kelts bűntudatot! Az éhség és a sóvárgás élettani reakció (alváshiány, stressz, kortizol).
- Használd a FitAnya Tenyér-szabályát: tenyérnyi fehérje (teltség), ökölnyi rost, maréknyi szénhidrát, hüvelykujjnyi egészséges zsír.
- Nincs kalóriaszámolgatás, csak gyors, kézzelfogható megoldások.`;

        let userPrompt = "";
        if (mode === "craving") {
          userPrompt = `Az anyuka ezt kívánja: "${input}".
Maradék mai kerete: ${remaining?.protein ?? 1} tenyér fehérje, ${remaining?.veg ?? 2} ököl rost, ${remaining?.carb ?? 1} marék szénhidrát, ${remaining?.fat ?? 1} hüvelykujj zsír.
Magyarázd el 1 mondatban empatikusan az élettani okát, és adj 2 konkrét, 60 másodperc alatt elérhető bolti/otthoni alternatívát!`;
        } else if (mode === "dinner") {
          userPrompt = `Esti hűtőmentés! Ez van otthon a hűtőben / ezt enné: "${input}".
Mai maradék kerete: ${remaining?.protein ?? 1} tenyér fehérje, ${remaining?.veg ?? 2} ököl rost, ${remaining?.carb ?? 1} marék szénhidrát, ${remaining?.fat ?? 1} hüvelykujj zsír.
Állíts össze belőle 3 mondatban egy gyors, 10 perces tányért a Tenyér-szabály arányaival!`;
        } else {
          userPrompt = input;
        }

        const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey.trim(),
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 350,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });

        if (!anthropicResponse.ok) {
          const errData = await anthropicResponse.json().catch(() => ({}));
          const errMsg = errData.error?.message || "Ismeretlen Anthropic hiba";
          return new Response(
            JSON.stringify({ error: `API hiba (${anthropicResponse.status}): ${errMsg}` }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          );
        }

        const data = await anthropicResponse.json();
        const textBlock = data.content?.find((c) => c.type === "text");
        const replyText = textBlock?.text || data.content?.[0]?.text || "Nem sikerült választ generálni.";

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

    // 2. AI ÉTELELEMZŐ VÉGPONT (Tányérom modul - Tenyér-szabály kalkuláció)
    if (url.pathname === "/api/analyze-dish" && request.method === "POST") {
      try {
        const apiKey = env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Az API kulcs nincs beállítva a Cloudflare-ben." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const { dishName } = await request.json();
        if (!dishName || !dishName.trim()) {
          return new Response(
            JSON.stringify({ error: "Hiányzó ételnév." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const systemPrompt = `Te a "FitAnya Módszer" közvetlen, gasztronómiailag és élettanilag felkészült táplálkozási szakértő AI motorja vagy.
Feladatod a beírt étel Tenyér-szabály szerinti azonnali elemzése és egy 1-2 mondatos, gyakorlatias tálalási tipp adása édesanyáknak.

SZIGORÚ GASZTRO-SZABÁLYOK A TIPPEKHEZ ("tip"):
1. Édességek, desszertek, édes tészták (pl. túrógombóc, palacsinta, gofri, torták, tejberizs):
   - SOHA NE AJÁNLJ HOZZÁ HÚST VAGY ZÖLDSÉGSALÁTÁT! Ez abszurd kombináció.
   - Vércukor-stabilizáló fehérjének KIZÁRÓLAG natúr görög joghurtot, zsírszegény túrót, skyr-t vagy egy adag fehérjeturmixot javasolj.
   - Adagnak javasolj 1 zárt maroknyi mennyiséget élvezetből fogyasztva, bűntudat nélkül.
2. Bő olajban sült ételek (pl. rántott hús, rántott sajt, sült krumpli, lángos):
   - Javasold az air fryerben vagy sütőpapíron, sütőben sütést, amivel azonnal megspórol 1 teljes hüvelykujjnyi rejtett sütőolajat.
3. Nehéz magyaros, zsíros ételek (pl. pörkölt, babgulyás, csülök, rakott zöldségek):
   - Rostnak savanyúságot (kovászos uborka, csalamádé, almapaprika) vagy gyors friss kevert salátát ajánlj.
   - Hívd fel a figyelmét, hogy a tányér alján maradt zsíros szaftot hagyja ott, ne tunkolja ki kenyérrel.
4. Könnyű / száraz ételek (pl. grillezett csirkemell, natúr köretek):
   - Javasolj 1 teáskanál minőségi olívaolajat, avokádót vagy magvakat, hogy meglegyen az esszenciális zsír.
5. Hangnem:
   - Mindig közvetlen, bűntudatmentes, életszerű és segítőkész ("anya az anyának").

VISSZATÉRÉSI FORMÁTUM:
KIZÁRÓLAG egyetlen érvényes JSON objektumot adj vissza, semmilyen felvezető szöveg, lezárás vagy markdown kódblokk (\`\`\`json) NÉLKÜL:
{
  "name": "Étel pontos, tisztított neve",
  "delta": {
    "protein": 0 és 2 közötti szám 0.5-ös léptékekben (Tenyérnyi fehérje),
    "veg": 0 és 2 közötti szám 0.5-ös léptékekben (Ökölnyi zöldség/rost),
    "carb": 0 és 2.5 közötti szám 0.5-ös léptékekben (Maréknyi szénhidrát),
    "fat": 0 és 2 közötti szám 0.5-ös léptékekben (Hüvelykujjnyi minőségi zsír)
  },
  "tip": "1-2 mondatos, közvetlen FitAnya tálalási tanács a fenti szabályok betartásával."
}`;

        const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey.trim(),
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 300,
            system: systemPrompt,
            messages: [{ role: "user", content: `Elemezd ezt az ételt a FitAnya Tenyér-szabály szerint: "${dishName.trim()}"` }],
          }),
        });

        if (!anthropicResponse.ok) {
          const errData = await anthropicResponse.json().catch(() => ({}));
          const errMsg = errData.error?.message || "Ismeretlen Anthropic hiba";
          return new Response(
            JSON.stringify({ error: `API hiba (${anthropicResponse.status}): ${errMsg}` }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          );
        }

        const data = await anthropicResponse.json();
        const rawText = data.content?.[0]?.text?.trim() || "{}";
        
        // Golyóálló JSON kinyerés (levágja a felesleges markdown és szöveges sallangot)
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : rawText;
        const parsed = JSON.parse(cleanJson);

        return new Response(
          JSON.stringify({
            success: true,
            dish: {
              id: "ai_" + Date.now(),
              name: parsed.name || dishName.trim(),
              keywords: [dishName.toLowerCase()],
              delta: {
                protein: Number(parsed.delta?.protein ?? 0),
                veg: Number(parsed.delta?.veg ?? 0),
                carb: Number(parsed.delta?.carb ?? 0),
                fat: Number(parsed.delta?.fat ?? 0),
              },
              tip: parsed.tip || "Figyelj a tenyérnyi arányokra és fogyaszd bűntudat nélkül!",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 3. STATIKUS ASSETS KISZOLGÁLÁSA (React webapp)
    return env.ASSETS.fetch(request);
  },
};
