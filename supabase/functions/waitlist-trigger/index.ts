import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const OPENCLAW_API = Deno.env.get('OPENCLAW_API_URL') || '';
const OPENCLAW_TOKEN = Deno.env.get('OPENCLAW_TOKEN') || '';

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  try {
    // Send via OpenClaw
    const res = await fetch(`${OPENCLAW_API}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`
      },
      body: JSON.stringify({
        to: phone,
        message
      })
    });
    return res.ok;
  } catch (e) {
    console.error('WhatsApp send error:', e);
    return false;
  }
}

async function scoreResponseLikelihood(memberId: string): Promise<number> {
  let score = 50;

  const { data: pastFills } = await supabase
    .from('waitlist_fill_events')
    .select('id')
    .eq('filled_by_member_id', memberId);

  if (pastFills && pastFills.length > 0) {
    score += Math.min(20, pastFills.length * 5);
  }

  const { data: member } = await supabase
    .from('members')
    .select('membership_type')
    .eq('id', memberId)
    .single();

  if (member) {
    if (member.membership_type === 'monthly') score += 10;
    if (member.membership_type === 'annual') score += 15;
  }

  return Math.min(100, score);
}

async function hasConflictingBooking(memberId: string, classId: string): Promise<boolean> {
  const { data: cls } = await supabase
    .from('classes')
    .select('start_time, end_time')
    .eq('id', classId)
    .single();

  if (!cls) return false;

  const startTime = new Date(new Date(cls.start_time).getTime() - 30 * 60 * 1000);
  const endTime = new Date(new Date(cls.end_time).getTime() + 30 * 60 * 1000);

  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('member_id', memberId)
    .eq('status', 'confirmed')
    .in('class_id', (
      await supabase
        .from('classes')
        .select('id')
        .gte('start_time', startTime.toISOString())
        .lte('start_time', endTime.toISOString())
    ).data?.map(c => c.id) || []);

  return (conflicts?.length || 0) > 0;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { class_id, cancelled_booking_id, studio_id = 'default-studio' } = await req.json();

    if (!class_id) {
      return new Response(JSON.stringify({ success: false, error: 'class_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get settings
    const { data: settings } = await supabase
      .from('filliq_settings')
      .select('*')
      .eq('studio_id', studio_id)
      .single();

    if (!settings?.auto_fill_enabled) {
      return new Response(JSON.stringify({ success: true, message: 'Auto-fill disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get class details
    const { data: cls } = await supabase
      .from('classes')
      .select('*')
      .eq('id', class_id)
      .single();

    if (!cls || cls.available_spots < 1) {
      return new Response(JSON.stringify({ success: true, message: 'No spots available' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create fill event
    const { data: fillEvent } = await supabase
      .from('waitlist_fill_events')
      .insert({
        class_id,
        triggered_by_booking_id: cancelled_booking_id,
        status: 'active'
      })
      .select()
      .single();

    // Get waitlist
    const { data: waitlist } = await supabase
      .from('waitlist_entries')
      .select('member_id, position')
      .eq('class_id', class_id)
      .eq('status', 'waiting')
      .order('position', { ascending: true });

    if (!waitlist || waitlist.length === 0) {
      await supabase
        .from('waitlist_fill_events')
        .update({ status: 'expired' })
        .eq('id', fillEvent?.id);

      return new Response(JSON.stringify({ success: true, message: 'No waitlist entries' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Score and filter candidates
    const candidates: Array<{ memberId: string; phone: string; firstName: string; score: number; position: number }> = [];

    for (const entry of waitlist) {
      const conflict = await hasConflictingBooking(entry.member_id, class_id);
      if (conflict) continue;

      const { data: member } = await supabase
        .from('members')
        .select('phone, first_name')
        .eq('id', entry.member_id)
        .single();

      if (!member) continue;

      const likelihood = await scoreResponseLikelihood(entry.member_id);
      candidates.push({
        memberId: entry.member_id,
        phone: member.phone,
        firstName: member.first_name,
        score: likelihood,
        position: entry.position
      });
    }

    candidates.sort((a, b) => b.score - a.score);

    const inviteCount = Math.min(settings.max_simultaneous_invites || 3, candidates.length);
    const topCandidates = candidates.slice(0, inviteCount);

    // Send invites
    const classTime = new Date(cls.start_time).toLocaleString('en-ZA', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    for (const candidate of topCandidates) {
      await supabase.from('pending_invites').insert({
        class_id,
        member_id: candidate.memberId,
        phone: candidate.phone,
        position: candidate.position,
        status: 'sent'
      });

      const message = `Hi ${candidate.firstName}! 🧘 A spot just opened up in *${cls.name}* on ${classTime}. Reply *YES* to claim it — first come first served!`;

      await sendWhatsApp(candidate.phone, message);
    }

    // Update fill event
    await supabase
      .from('waitlist_fill_events')
      .update({ invites_sent: inviteCount })
      .eq('id', fillEvent?.id);

    return new Response(JSON.stringify({
      success: true,
      invitesSent: inviteCount,
      totalCandidates: candidates.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Waitlist trigger error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
