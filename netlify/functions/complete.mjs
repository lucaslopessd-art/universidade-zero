import { getSupabase } from './_supabase.mjs';
import { requireUser } from './_auth.mjs';

export async function handler(event, context) {
  const [user, unauth] = requireUser(context);
  if (unauth) return unauth;

  try {
    const body = JSON.parse(event.body || '{}');
    const { videoId, title } = body || {};

    if (!videoId) {
      return new Response(JSON.stringify({ error: 'missing videoId' }), {
        status: 400, headers: { 'content-type': 'application/json' }
      });
    }

    const supabase = getSupabase();
    const { error } = await supabase.from('video_completions').insert({
      user_email: user.email,
      video_id: videoId,
      video_title: title || null
    });

    if (error) throw new Error(error.message);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }
}
