
import { createClient } from '@supabase/supabase-js';

// No Vercel, estas variáveis devem ser configuradas no painel do projeto
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://abobkntwlgezpalqpemr.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_fjUCbpatZV86DN704Ilwdg_kd4UOVn3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
