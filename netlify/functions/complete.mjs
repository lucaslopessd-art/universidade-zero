import { getSupabase } from './_supabase.mjs';
import { requireUser } from './_auth.mjs';

export async function handler(event, context) {
  const [user, unauth] = requireUser(context);
  if (unauth) return unauth;

  try {
    const { videoId, title } = JSON.parse(event.body || '{}');
    if (!videoId) {
      return new Response(JSON.stringify({ error: 'bad_request' }), {
        status: 400, headers: { 'content-type':'application/json' }
      });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('video_completions')
      .upsert(
        { user_email: user.email, video_id: videoId, video_title: title || null },
        { onConflict: 'user_email,video_id' }
      );

    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type':'application/json' }});
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'content-type':'application/json' }
    });
  }
}
