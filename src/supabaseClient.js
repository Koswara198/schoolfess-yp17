import { createClient } from '@supabase/supabase-js'


const supabaseUrl = 'https://muquiakruqdtnripedbk.supabase.co/rest/v1/'
const supabaseAnonKey = 'sb_publishable_DN4cKAfrtYN6zeuYXyKyDg_sZHTYOxv'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)