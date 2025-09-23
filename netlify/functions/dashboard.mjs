import { getClient } from './_supabase.mjs'
import { getIdentity, requireAuth } from './_auth.mjs'

export async function handler(event){
  try{
    requireAuth(event)
    const supabase = getClient()
    const { roles, sub } = getIdentity(event)
    const isManager = roles.includes('gestor') || roles.includes('gerente')

    let { data, error } = await supabase
      .from('video_events')
      .select('user_id, user_email, video_id, seconds, ts')
    if(error) throw error

    if(!isManager){
      data = data.filter(r => r.user_id === sub)
    }

    const agg = {}
    for(const r of data){
      const key = `${r.user_email || r.user_id}__${r.video_id}`
      if(!agg[key]) agg[key] = { user_email: r.user_email, user_id: r.user_id, video_id: r.video_id, seconds: 0, last_seen: null }
      agg[key].seconds += Number(r.seconds||0)
      const ts = r.ts ? new Date(r.ts).toISOString() : null
      if(ts && (!agg[key].last_seen || ts > agg[key].last_seen)) agg[key].last_seen = ts
    }

    // optional: map titles from videos table
    const titleMap = {}
    try{
      const res = await supabase.from('videos').select('youtube_id,title')
      if(res.data) res.data.forEach(v=> titleMap[v.youtube_id] = v.title)
    }catch{}

    const rows = Object.values(agg).map(r => ({...r, video_title: titleMap[r.video_id] || null}))
    rows.sort((a,b) => (b.seconds||0)-(a.seconds||0))

    return { statusCode: 200, body: JSON.stringify({ rows }) }
  }catch(err){
    return { statusCode: 500, body: String(err) }
  }
}
