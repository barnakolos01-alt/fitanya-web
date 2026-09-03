// functions/api/subscribe.js

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { subscription, action } = body;

    if (!subscription || !subscription.endpoint) {
      return new Response(
        JSON.stringify({ error: "Érvénytelen feliratkozási objektum." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Feliratkozás mentése Cloudflare KV-ba (ha konfigurálva van a KV binding)
    if (env.FITANYA_KV) {
      const subKey = `sub_${encodeURIComponent(subscription.endpoint).slice(-40)}`;
      await env.FITANYA_KV.put(
        subKey,
        JSON.stringify({
          ...subscription,
          updatedAt: new Date().toISOString(),
        })
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sikeres feliratkozás a FitAnya Push értesítésekre!",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify({ status: "Push Service aktív" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
