// netlify/functions/diag.mjs
import { getStore } from "@netlify/blobs";

export default async (req, ctx) => {
  try {
    const email = ctx.clientContext?.user?.email || null;

    // cria/escreve a store "progress"
    const store = getStore("progress");
    await store.setJSON("diag:test", { ts: Date.now() });
    const ok = await store.getJSON("diag:test");

    return new Response(
      JSON.stringify({
        email,
        adminVar: (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "").toLowerCase(),
        blobsOk: !!ok
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
