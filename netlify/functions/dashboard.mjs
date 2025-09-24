// netlify/functions/dashboard.mjs
import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./_auth.mjs";

export default async (req, context) => {
  // Garante que recebeu o token do Netlify Identity e que é admin
  const [user, error] = requireAdmin(context);
  if (error) return error;

  try {
    // Lemos o progresso salvo no Netlify Blobs (chaves "done:{email}")
    const store = getStore("progress");

    const users = {};
    let cursor;
    do {
      const { blobs, cursor: next } = await store.list({ prefix: "done:", cursor, limit: 1000 });
      for (const b of blobs) {
        const email = b.key.split(":")[1];
        const doneMap = (await store.getJSON(b.key)) || {};
        const vids = Object.keys(doneMap);
        if (!users[email]) users[email] = { email, completed: 0, videos: [] };
        users[email].completed += vids.length;
        users[email].videos.push(...vids);
      }
      cursor = next;
    } while (cursor);

    const totalUsers = Object.keys(users).length;
    const totalViews = Object.values(users).reduce((sum, u) => sum + u.completed, 0);
    const ranking = Object.values(users)
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 50);

    return new Response(
      JSON.stringify({ ok: true, totalUsers, totalViews, ranking, users }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
