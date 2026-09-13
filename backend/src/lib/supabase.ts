import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

// Supabase Auth client
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)

// Admin client (for server-side operations)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey
)

// Prisma with Supabase connection pooling
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/filliq',
    },
  },
})

// Helper to get current user from JWT
export async function getUserFromToken(token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error) throw error
  return user
}

// Helper to verify studio access
export async function verifyStudioAccess(userId: string, studioId: string) {
  const { data, error } = await supabaseAdmin
    .from('studio_owners')
    .select('*')
    .eq('user_id', userId)
    .eq('studio_id', studioId)
    .single()
  
  if (error || !data) {
    throw new Error('Unauthorized access to studio')
  }
  
  return data
}
