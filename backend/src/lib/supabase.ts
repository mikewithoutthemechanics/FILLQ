import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

// Supabase Auth client
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Admin client (for server-side operations)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Prisma with Supabase connection pooling
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
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
