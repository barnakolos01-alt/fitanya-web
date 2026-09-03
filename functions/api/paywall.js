// functions/api/paywall.js

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { action, sessionId, email } = body;

    const stripeSecretKey = env.STRIPE_SECRET_KEY;

    // 1. STRIPE CHECKOUT INDÍTÁSA
    if (action === "create_checkout") {
      if (!stripeSecretKey) {
        return new Response(
          JSON.stringify({ error: "A STRIPE_SECRET_KEY nincs beállítva a Cloudflare-ben." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const priceId = env.STRIPE_PRICE_ID; // A havidíjas előfizetés árazonosítója a Stripe-ból
      const domain = new URL(request.url).origin;

      const params = new URLSearchParams();
      params.append("payment_method_types[]", "card");
      params.append("mode", "subscription");
      params.append("line_items[0][price]", priceId);
      params.append("line_items[0][quantity]", "1");
      params.append("success_url", `${domain}/app?session_id={CHECKOUT_SESSION_ID}`);
      params.append("cancel_url", `${domain}/app`);
      if (email) {
        params.append("customer_email", email);
      }

      const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const session = await stripeRes.json();
      if (!stripeRes.ok) {
        return new Response(JSON.stringify({ error: session.error?.message || "Stripe hiba" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ url: session.url }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. SIKERES FIZETÉS ELLENŐRZÉSE (SESSION VERIFY)
    if (action === "verify_session") {
      if (!sessionId) {
        return new Response(JSON.stringify({ error: "Hiányzó session_id" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${stripeSecretKey}` },
      });

      const session = await stripeRes.json();

      if (session.payment_status === "paid" || session.status === "complete") {
        // Generálunk egy tokent, amit a frontend eltárolhat
        const token = `fa_sub_${btoa(session.customer_email || session.id).slice(0, 24)}`;
        return new Response(
          JSON.stringify({
            valid: true,
            token,
            email: session.customer_details?.email || session.customer_email,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } else {
        return new Response(JSON.stringify({ valid: false, message: "A fizetés még nem zárult le." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 3. MEGLÉVŐ VEVŐ KÉZI KÓDJA (pl. teszteléshez vagy VIP hozzáféréshez)
    if (action === "verify_code") {
      const { code } = body;
      // Ideiglenes VIP kód az azonnali tesztelésedhez
      if (code && (code.trim().toUpperCase() === "FITANYA2026" || code.trim().toUpperCase() === "VIP")) {
        return new Response(
          JSON.stringify({ valid: true, token: "fa_vip_access_pass" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ valid: false, error: "Érvénytelen aktiváló kód." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Ismeretlen kérés" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
