import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

declare module 'next-auth' {
    interface User {
        role?: string
    }
    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            role?: string
        }
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    session: { strategy: 'jwt' },
    pages: {
        signIn: '/login',
    },
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const { data: user } = await supabase
                    .from('users')
                    .select('id, email, name, password, role, isActive')
                    .eq('email', credentials.email as string)
                    .single()

                if (!user || !user.password) return null
                if (!user.isActive) return null

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )
                if (!isValid) return null

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        },
    },
})
