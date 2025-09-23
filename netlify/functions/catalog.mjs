// netlify/functions/catalog.mjs
import { getSupabase } from './_supabase.mjs';
import { requireUser } from './_auth.mjs';

export async function handler(event, context) {
  const [user, unauth] = requireUser(context);
  if (unauth) return unauth;

  // Se usa Supabase como fonte do catálogo:
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('videos')               // tabela: videos (id, title)
      .select('id, title')
      .order('title', { ascending: true });

    if (error) throw error;
    const rows = (data || []).map(v => ({ id: v.id, title: v.title }));
    return new Response(JSON.stringify(rows), { headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'content-type': 'application/json' }
    });
  }
}
