import { getClient } from './_supabase.mjs'
export async function handler(){
  try{
    const supabase = getClient()
    const { data, error } = await supabase.from('videos').select('youtube_id,title').order('title',{ascending:true})
    if(error) throw error
    return { statusCode: 200, body: JSON.stringify((data||[]).map(v=>({id:v.youtube_id,title:v.title}))) }
  }catch(err){
    return { statusCode: 500, body: String(err) }
  }
}
