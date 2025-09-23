import { createClient } from '@supabase/supabase-js'
export function getClient(){
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!url || !key){ throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados') }
  return createClient(url, key, { auth: { persistSession: false } })
}
