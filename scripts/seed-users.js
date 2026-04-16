const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error('Missing SUPABASE env vars. Loading from .env.local...');
        const fs = require('fs');
        const path = require('path');
        const envPath = path.join(__dirname, '..', '.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        });
        var url = envVars.NEXT_PUBLIC_SUPABASE_URL;
        var key = envVars.SUPABASE_SERVICE_ROLE_KEY;
    } else {
        var url = SUPABASE_URL;
        var key = SUPABASE_SERVICE_KEY;
    }

    const supabase = createClient(url, key);
    const hash = await bcrypt.hash('password123', 10);
    
    console.log('Generated hash:', hash);
    console.log('Verify:', await bcrypt.compare('password123', hash));

    // Update all VTN demo users
    const { data, error } = await supabase
        .from('users')
        .update({ password: hash })
        .in('email', ['director@vtn.vn', 'pm@vtn.vn', 'arch@vtn.vn', 'finance@vtn.vn'])
        .select('email');

    if (error) {
        console.error('Update error:', error);
    } else {
        console.log('Updated users:', data.map(u => u.email));
    }
}

main().catch(console.error);
