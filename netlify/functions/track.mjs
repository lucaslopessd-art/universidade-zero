// netlify/functions/track.mjs
import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const userEmail =
      context.clientContext?.user?.email?.toLowerCase() ||
      req.headers.get('x-user-email')?.toLowerCase();

    if (!userEmail) {
      return new Response(JSON.stringify({ error: 'no_user' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { videoId, title, seconds = 0, done = false } = body;
    if (!videoId) {
      return new Response(JSON.stringify({ error: 'missing_videoId' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const store = getStore('progress');

    // 1) Registro de progresso por usuário+vídeo (opcional, útil pra histórico)
    const viewKey = `view:${userEmail}:${videoId}`;
    const current = (await store.get(viewKey, { type: 'json' })) || {};
    const newData = {
      video_id: videoId,
      video_title: title || current.video_title || '',
      seconds: Math.max(Number(seconds) || 0, Number(current.seconds) || 0),
      last_seen: Date.now(),
    };
    await store.set(viewKey, newData, { type: 'json' });

    // 2) Mapa de concluídos do usuário
    if (done) {
      const doneKey = `done:${userEmail}`;
      const doneMap = (await store.get(doneKey, { type: 'json' })) || {};
      doneMap[videoId] = true;
      await store.set(doneKey, doneMap, { type: 'json' });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};
