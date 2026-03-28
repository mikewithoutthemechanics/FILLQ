import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { supabase } from '../_shared/supabase.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

/**
 * WhatsApp Node Provisioning
 * 
 * POST /provision-whatsapp
 * Body: { studio_id, studio_name }
 * 
 * Creates a new OpenClaw node config for a studio.
 * Returns a pairing URL/QR for the studio to scan.
 */
serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'POST only' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { studio_id, studio_name } = await req.json()

    if (!studio_id || !studio_name) {
      return new Response(JSON.stringify({ success: false, error: 'studio_id and studio_name required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if already provisioned
    const { data: existing } = await supabase
      .from('filliq_settings')
      .select('studio_whatsapp_number, waba_provider')
      .eq('studio_id', studio_id)
      .single()

    if (existing?.waba_provider === 'openclaw' && existing?.studio_whatsapp_number) {
      return new Response(JSON.stringify({
        success: true,
        status: 'already_connected',
        message: 'WhatsApp already connected for this studio',
        whatsapp_number: existing.studio_whatsapp_number
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate a unique node ID
    const nodeId = `filliq-${studio_id}-${Date.now()}`
    const pairingToken = crypto.randomUUID()

    // Store provisioning record
    await supabase.from('filliq_settings').update({
      waba_provider: 'openclaw',
      waba_access_token_encrypted: pairingToken,
      updated_at: new Date().toISOString()
    }).eq('studio_id', studio_id)

    // In production, this would call the OpenClaw gateway API
    // to actually spin up a new node process.
    // For now, we return the pairing instructions.

    const gatewayUrl = Deno.env.get('OPENCLAW_GATEWAY_URL') || 'https://your-gateway.com'

    return new Response(JSON.stringify({
      success: true,
      status: 'provisioned',
      node_id: nodeId,
      pairing_token: pairingToken,
      pairing_url: `${gatewayUrl}/pair?node=${nodeId}&token=${pairingToken}`,
      instructions: {
        step_1: 'Open WhatsApp on your phone',
        step_2: 'Go to Settings → Linked Devices',
        step_3: 'Tap "Link a Device"',
        step_4: 'Scan the QR code shown on screen',
        note: 'Once scanned, FillIQ will start receiving and processing booking requests from your WhatsApp.'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Provision error:', error)
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
