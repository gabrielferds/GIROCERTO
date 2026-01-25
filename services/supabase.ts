
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://abobkntwlgezpalqpemr.supabase.co';
const supabaseAnonKey = 'sb_publishable_fjUCbpatZV86DN704Ilwdg_kd4UOVn3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
