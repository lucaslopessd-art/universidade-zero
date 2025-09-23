import { getClient } from './_supabase.mjs'
import { getIdentity, requireAuth } from './_auth.mjs'

export async function handler(event){
  try{
    requireAuth(event)
    if(event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
    const { sub, email } = getIdentity(event)
    const body = JSON.parse(event.body || '{}')
    const seconds = Number(body.seconds || 0)
    const video_id = String(body.videoId || '')

    if(!video_id) return { statusCode: 400, body: 'videoId obrigatório' }
    if(seconds <= 0) return { statusCode: 200, body: 'ignorado' }

    const supabase = getClient()
    const payload = { user_id: sub, user_email: email, video_id, seconds, ts: new Date().toISOString() }
    const { error } = await supabase.from('video_events').insert(payload)
    if(error) throw error
    return { statusCode: 200, body: JSON.stringify({ok:true}) }
  }catch(err){
    return { statusCode: 500, body: String(err) }
  }
}
