import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await supabase.from('users').select('email, role').limit(3);
if (error) {
    console.log('FAIL:', error.message);
} else {
    console.log('SUCCESS! Users:', JSON.stringify(data));
}
