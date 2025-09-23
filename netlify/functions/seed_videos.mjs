import { getClient } from './_supabase.mjs'

export async function handler(){
  try{
    const supabase = getClient()
    const catalog = [{"id": "S6fuCmU8kEM", "title": "Aula 1"}, {"id": "LLeqOgeSbvc", "title": "Aula 2"}, {"id": "kM7SEtw8ahw", "title": "Aula 3"}, {"id": "lmoqq9_VXRA", "title": "Aula 4"}, {"id": "kPbS6VRwPr4", "title": "Aula 5"}, {"id": "ycwSktQcWN4", "title": "Aula 6"}, {"id": "N90yizpfjwE", "title": "Aula 7"}, {"id": "v0ZQDACRgS0", "title": "Aula 8"}, {"id": "BgdvxqTVOFQ", "title": "Aula 9"}, {"id": "0ooN6ETAZVI", "title": "Aula 10"}, {"id": "3MVkkBAZHLo", "title": "Aula 11"}]
    const rows = catalog.map(v => ({ youtube_id: v.id, title: v.title }))
    // upsert-like: insert, ignoring duplicates
    for(const r of rows){
      await supabase.from('videos').upsert(r, { onConflict: 'youtube_id' })
    }
    return { statusCode: 200, body: JSON.stringify({ok:true, inserted: rows.length}) }
  }catch(err){
    return { statusCode: 500, body: String(err) }
  }
}
