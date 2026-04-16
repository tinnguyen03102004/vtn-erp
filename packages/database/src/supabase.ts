import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client for server-side use.
 * Wraps the Supabase JS client with typed database schema.
 */
export function createSupabaseClient(
    url?: string,
    anonKey?: string,
): SupabaseClient {
    const supabaseUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)')
    }

    return createClient(supabaseUrl, supabaseAnonKey)
}
