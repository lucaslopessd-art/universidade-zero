// netlify/functions/dashboard.mjs
import { getStore } from "@netlify/blobs";

const FALLBACK_ADMIN = "lucaslopessd@gmail.com";
const ADMINS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || FALLBACK_ADMIN)
  .toLowerCase()
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export default async (req, context) => {
  try {
    const authedEmail =
      context.clientContext?.user?.email?.toLowerCase() ||
      req.headers.get("x-user-email")?.toLowerCase() ||
      "";

    if (!ADMINS.includes(authedEmail)) {
      return new Response(JSON.stringify({ error: "not_admin" }), {
        status: 403,
        headers: { "content-type": "application/json" }
      });
    }

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
    const ranking = Object.values(users).sort((a, b) => b.completed - a.completed).slice(0, 20);

    return new Response(JSON.stringify({ totalUsers, totalViews, ranking, users }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};
