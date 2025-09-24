// netlify/functions/track.mjs
import { getStore } from "@netlify/blobs";

export default async (req) => {
  try {
    const body = await req.json().catch(() => ({}));

    const email =
      (body.email || body.user?.email || body.who?.email || "").toLowerCase();
    const videoId = body.videoId || body.id || body.video_id;
    const title = body.title || body.videoTitle || body.name || "";
    const pct = Number(body.pct ?? body.progress ?? 100);

    if (!email || !videoId) {
      return new Response(JSON.stringify({ ok: false, error: "missing email/videoId" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }

    const ts = Date.now();
    const store = getStore("progress");

    // log do evento
    await store.setJSON(`ev:${ts}:${email}:${videoId}`, { ts, email, videoId, title, pct });

    // marca como concluído se >= 95%
    if (pct >= 95) {
      const key = `done:${email}`;
      const done = (await store.getJSON(key)) || {};
      done[videoId] = { ts, title };
      await store.setJSON(key, done);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};
