/**
 * Script: Hash all plaintext passwords in the users table
 * Run: npx tsx scripts/hash-passwords.ts
 * 
 * This is needed because F-003 fix changed employee creation to hash passwords,
 * but existing users in the DB still have plaintext passwords.
 */
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function hashPasswords() {
    console.log('🔐 Starting password hash migration...\n')

    // Get all users with passwords
    const { data: users, error } = await supabase
        .from('users')
        .select('id, email, password')

    if (error) {
        console.error('❌ Failed to fetch users:', error.message)
        process.exit(1)
    }

    if (!users || users.length === 0) {
        console.log('ℹ️  No users found in database')
        return
    }

    let updated = 0
    let skipped = 0

    for (const user of users) {
        if (!user.password) {
            console.log(`  ⏭️  ${user.email} — no password set, skipping`)
            skipped++
            continue
        }

        // Check if already hashed (bcrypt hashes start with $2a$ or $2b$)
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            console.log(`  ✅ ${user.email} — already hashed, skipping`)
            skipped++
            continue
        }

        // Hash the plaintext password
        const hashed = await bcrypt.hash(user.password, 10)
        const { error: updateErr } = await supabase
            .from('users')
            .update({ password: hashed })
            .eq('id', user.id)

        if (updateErr) {
            console.error(`  ❌ ${user.email} — failed: ${updateErr.message}`)
        } else {
            console.log(`  🔒 ${user.email} — hashed successfully`)
            updated++
        }
    }

    console.log(`\n✅ Done! Updated: ${updated}, Skipped: ${skipped}, Total: ${users.length}`)
}

hashPasswords().catch(console.error)
