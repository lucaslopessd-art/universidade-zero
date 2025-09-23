// netlify/functions/_supabase.mjs
import { createClient } from '@supabase/supabase-js';

export function getSupabase() {
  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !KEY) throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurado');
  return createClient(URL, KEY, { auth: { persistSession: false } });
}
