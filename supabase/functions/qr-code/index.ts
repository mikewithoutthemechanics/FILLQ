import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { supabase } from '../_shared/supabase.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

/**
 * Generate QR code for WhatsApp pairing
 * 
 * POST /qr-code
 * Body: { studio_id }
 * 
 * Returns a QR code SVG/base64 for the studio to scan with WhatsApp.
 * In production, this would generate a real WhatsApp Web pairing QR.
 */

// Simple QR code SVG generator (for display purposes)
function generateQRSVG(data: string, size: number = 280): string {
  // Generate a deterministic pattern from the data hash
  const gridSize = 25
  const cellSize = size / gridSize
  let cells: boolean[][] = []

  // Simple hash-based pattern
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i)
    hash = hash & hash
  }

  // Seed a pseudo-random generator
  let seed = Math.abs(hash)
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  // Generate grid
  for (let y = 0; y < gridSize; y++) {
    cells[y] = []
    for (let x = 0; x < gridSize; x++) {
      // Position markers (corners)
      const isCornerMarker = (
        (x < 7 && y < 7) ||
        (x >= gridSize - 7 && y < 7) ||
        (x < 7 && y >= gridSize - 7)
      )

      if (isCornerMarker) {
        // Corner marker pattern
        const lx = x < 7 ? x : (x >= gridSize - 7 ? x - (gridSize - 7) : x)
        const ly = y < 7 ? y : (y >= gridSize - 7 ? y - (gridSize - 7) : y)
        cells[y][x] = (
          lx === 0 || lx === 6 || ly === 0 || ly === 6 ||
          (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4)
        )
      } else {
        cells[y][x] = random() > 0.55
      }
    }
  }

  // Build SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`
  svg += `<rect width="${size}" height="${size}" fill="white"/>`

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (cells[y][x]) {
        svg += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1A1A1A" rx="1"/>`
      }
    }
  }

  svg += '</svg>'
  return svg
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { studio_id } = await req.json()

    if (!studio_id) {
      return new Response(JSON.stringify({ success: false, error: 'studio_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate unique pairing token
    const pairingToken = `${studio_id}:${Date.now()}:${crypto.randomUUID()}`
    const pairingData = `filliq://pair?token=${encodeURIComponent(pairingToken)}&studio=${studio_id}`

    // Generate QR code
    const qrSvg = generateQRSVG(pairingData)

    // Store pairing token
    await supabase.from('filliq_settings').update({
      waba_provider: 'openclaw',
      waba_access_token_encrypted: pairingToken,
    }).eq('studio_id', studio_id)

    return new Response(JSON.stringify({
      success: true,
      qr_svg: qrSvg,
      pairing_token: pairingToken,
      instructions: [
        'Open WhatsApp on your phone',
        'Go to Settings → Linked Devices',
        'Tap "Link a Device"',
        'Scan this QR code',
        'FillIQ will start receiving booking requests!'
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('QR code error:', error)
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
