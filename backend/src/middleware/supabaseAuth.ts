import { Request, Response, NextFunction } from 'express'
import { getUserFromToken, verifyStudioAccess } from '../lib/supabase.js'

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        studioId?: string
      }
    }
  }
}

/**
 * Middleware to verify Supabase JWT token
 */
export async function supabaseAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const user = await getUserFromToken(token)

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      })
    }

    // Get studio ID from header or user metadata
    const studioId = req.headers['x-studio-id'] as string || 
                     user.user_metadata?.studio_id

    // If studio ID provided, verify access
    if (studioId) {
      await verifyStudioAccess(user.id, studioId)
    }

    req.user = {
      id: user.id,
      email: user.email!,
      studioId
    }

    next()
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}

/**
 * Optional auth middleware - sets user if token valid, doesn't require it
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const user = await getUserFromToken(token)
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email!,
          studioId: req.headers['x-studio-id'] as string || user.user_metadata?.studio_id
        }
      }
    }

    next()
  } catch (error) {
    // Continue without user
    next()
  }
}
