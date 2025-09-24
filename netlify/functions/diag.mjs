// netlify/functions/diag.mjs
import { getStore } from "@netlify/blobs";

export default async (req, ctx) => {
  try {
    const store = getStore("progress");

    // grava um teste (compatível com runtimes antigos)
    await store.set("diag:test", JSON.stringify({ ping: Date.now() }));

    // lê em modo JSON (compatível)
    const ok = await store.get("diag:test", { type: "json" });

    return new Response(
      JSON.stringify({
        ok: !!ok,
        email: ctx.clientContext?.user?.email || null,
        identityAttached: !!ctx.clientContext?.identity,
        adminVar: (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "").toLowerCase()
      }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};
