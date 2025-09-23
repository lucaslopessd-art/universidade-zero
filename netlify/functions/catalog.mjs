import { getSupabase } from './_supabase.mjs';
import { requireUser } from './_auth.mjs';

export async function handler(event, context) {
  const [user, unauth] = requireUser(context);
  if (unauth) return unauth;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('videos')               // tabela: videos (id, title)
      .select('id, title')
      .order('title', { ascending: true });

    if (error) throw error;
    return new Response(JSON.stringify((data||[]).map(v => ({ id: v.id, title: v.title }))), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }
}
