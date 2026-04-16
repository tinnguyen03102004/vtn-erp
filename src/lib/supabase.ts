import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { serverSupabase } from './server-supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const browserSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export const supabase = (typeof window === 'undefined'
    ? serverSupabase
    : browserSupabase) as typeof browserSupabase

// Re-export table row helpers for use in components
export type { Tables, TablesInsert, TablesUpdate, Enums } from './database.types'
