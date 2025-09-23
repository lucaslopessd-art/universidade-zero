import { getSupabase } from './_supabase.mjs';
import { requireUser, isAdmin } from './_auth.mjs';

export async function handler(event, context) {
  const [user, unauth] = requireUser(context);
  if (unauth) return unauth;
  if (!isAdmin(user)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403, headers: { 'content-type': 'application/json' }
    });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('video_events')
      .select('user_email, video_id, video_title, seconds, created_at')
      .limit(100000);

    if (error) throw error;

    const byKey = {};
    for (const r of data || []) {
      const k = `${r.user_email}|${r.video_id}`;
      const cur = byKey[k] || {
        user_email: r.user_email,
        video_id: r.video_id,
        video_title: r.video_title,
        seconds: 0,
        last_seen: r.created_at
      };
      cur.seconds += Number(r.seconds || 0);
      if (r.created_at && (!cur.last_seen || r.created_at > cur.last_seen)) cur.last_seen = r.created_at;
      byKey[k] = cur;
    }
    return new Response(JSON.stringify({ rows: Object.values(byKey) }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }
}
