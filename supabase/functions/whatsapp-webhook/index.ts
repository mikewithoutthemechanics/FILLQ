import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const OPENCLAW_API = Deno.env.get('OPENCLAW_API_URL') || '';

/**
 * WhatsApp Webhook — processes inbound replies from OpenClaw
 * 
 * When someone replies "YES" or "BOOK" to a waitlist invite,
 * this function claims the spot and sends confirmation via OpenClaw.
 */
serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { phone, message, channel = 'whatsapp' } = await req.json();

    if (!phone || !message) {
      return new Response(JSON.stringify({ success: false, error: 'phone and message required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const normalizedReply = message.trim().toUpperCase();

    // Only process YES/BOOK replies
    if (normalizedReply !== 'YES' && normalizedReply !== 'BOOK') {
      return new Response(JSON.stringify({ success: true, action: 'ignored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find active pending invite for this phone
    const { data: invite } = await supabase
      .from('pending_invites')
      .select('*, classes(*)')
      .eq('phone', phone)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!invite) {
      return new Response(JSON.stringify({ success: true, action: 'no_invite' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Attempt to claim the spot (atomic)
    const { data: classDetails } = await supabase
      .from('classes')
      .select('available_spots, price, name, start_time')
      .eq('id', invite.class_id)
      .single();

    if (!classDetails || classDetails.available_spots < 1) {
      // Spot already taken
      await supabase
        .from('pending_invites')
        .update({ status: 'taken', responded_at: new Date().toISOString(), response: message })
        .eq('id', invite.id);

      return new Response(JSON.stringify({ success: true, action: 'spot_taken' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check for existing booking
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('class_id', invite.class_id)
      .eq('member_id', invite.member_id)
      .eq('status', 'confirmed')
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, action: 'already_booked' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Claim the spot
    const { error: updateError } = await supabase
      .from('classes')
      .update({ available_spots: classDetails.available_spots - 1 })
      .eq('id', invite.class_id)
      .eq('available_spots', classDetails.available_spots); // Optimistic lock

    if (updateError) {
      // Race condition — spot was taken
      await supabase
        .from('pending_invites')
        .update({ status: 'taken', responded_at: new Date().toISOString() })
        .eq('id', invite.id);

      return new Response(JSON.stringify({ success: true, action: 'race_lost' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create booking
    const { data: booking } = await supabase
      .from('bookings')
      .insert({
        class_id: invite.class_id,
        member_id: invite.member_id,
        status: 'confirmed',
        payment_status: 'completed',
        amount_paid: classDetails.price
      })
      .select()
      .single();

    // Update waitlist entry
    await supabase
      .from('waitlist_entries')
      .update({ status: 'filled' })
      .eq('class_id', invite.class_id)
      .eq('member_id', invite.member_id);

    // Update invite
    await supabase
      .from('pending_invites')
      .update({ status: 'responded', responded_at: new Date().toISOString(), response: message })
      .eq('id', invite.id);

    // Mark other invites as taken
    await supabase
      .from('pending_invites')
      .update({ status: 'taken' })
      .eq('class_id', invite.class_id)
      .neq('id', invite.id)
      .eq('status', 'sent');

    // Update fill event
    const { data: fillEvent } = await supabase
      .from('waitlist_fill_events')
      .select('id, triggered_at')
      .eq('class_id', invite.class_id)
      .eq('status', 'active')
      .maybeSingle();

    if (fillEvent) {
      const fillTime = Math.floor((Date.now() - new Date(fillEvent.triggered_at).getTime()) / 1000);
      await supabase
        .from('waitlist_fill_events')
        .update({
          filled: true,
          filled_by_member_id: invite.member_id,
          fill_time_seconds: fillTime,
          revenue_recovered: classDetails.price,
          status: 'filled',
          completed_at: new Date().toISOString()
        })
        .eq('id', fillEvent.id);
    }

    // Mark waitlist entry as filled
    await supabase
      .from('waitlist_entries')
      .update({ status: 'filled' })
      .eq('class_id', invite.class_id)
      .eq('member_id', invite.member_id);

    // Get member name for response
    const { data: member } = await supabase
      .from('members')
      .select('first_name')
      .eq('id', invite.member_id)
      .single();

    const classTime = new Date(classDetails.start_time).toLocaleString('en-ZA', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    // Return response to send back via OpenClaw
    return new Response(JSON.stringify({
      success: true,
      action: 'booked',
      reply_to: phone,
      reply_message: `✅ You're in, ${member?.first_name || 'there'}! *${classDetails.name}* on ${classTime} is confirmed. See you on the mat! 🧘`,
      booking_id: booking?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
