// netlify/functions/dashboard.mjs
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

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('video_events')
    .select('user_email, video_id, video_title, seconds, created_at')
    .limit(100000);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }

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

  const rows = Object.values(byKey).sort((a, b) => (b.last_seen || '').localeCompare(a.last_seen || ''));
  return new Response(JSON.stringify({ rows }), { headers: { 'content-type': 'application/json' } });
}
