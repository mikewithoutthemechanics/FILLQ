import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const OPENCLAW_API = Deno.env.get('OPENCLAW_API_URL') || '';

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  try {
    const res = await fetch(`${OPENCLAW_API}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phone, message })
    });
    return res.ok;
  } catch { return false; }
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Get settings
    const { data: settings } = await supabase
      .from('filliq_settings')
      .select('rebook_nudge_enabled, rebook_nudge_delay_minutes')
      .eq('studio_id', 'default-studio')
      .single();

    if (!settings?.rebook_nudge_enabled) {
      return new Response(JSON.stringify({ success: true, message: 'Rebook nudges disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const delayMinutes = settings.rebook_nudge_delay_minutes || 45;
    const cutoffTime = new Date(Date.now() - delayMinutes * 60 * 1000);

    // Get recently completed classes
    const { data: completedClasses } = await supabase
      .from('classes')
      .select('id, name, class_type, start_time, end_time, teacher_id')
      .eq('status', 'completed')
      .lte('end_time', cutoffTime.toISOString())
      .gte('end_time', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()); // Last 4 hours

    if (!completedClasses || completedClasses.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No recent classes to nudge' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let nudgesSent = 0;

    for (const cls of completedClasses) {
      // Get attendees
      const { data: attendees } = await supabase
        .from('bookings')
        .select('member_id')
        .eq('class_id', cls.id)
        .eq('status', 'attended');

      if (!attendees) continue;

      // Find next occurrence of same class type
      const { data: nextClass } = await supabase
        .from('classes')
        .select('id, name, start_time')
        .eq('class_type', cls.class_type)
        .eq('status', 'scheduled')
        .gt('start_time', new Date().toISOString())
        .gt('available_spots', 0)
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!nextClass) continue;

      const nextTime = new Date(nextClass.start_time).toLocaleString('en-ZA', {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });

      for (const attendee of attendees) {
        // Check if already booked for next class
        const { data: hasBooking } = await supabase
          .from('bookings')
          .select('id')
          .eq('class_id', nextClass.id)
          .eq('member_id', attendee.member_id)
          .eq('status', 'confirmed')
          .maybeSingle();

        if (hasBooking) continue;

        // Check cooldown (7 days)
        const { data: recentNudge } = await supabase
          .from('rebook_nudge_logs')
          .select('id')
          .eq('member_id', attendee.member_id)
          .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle();

        if (recentNudge) continue;

        // Get member
        const { data: member } = await supabase
          .from('members')
          .select('first_name, phone')
          .eq('id', attendee.member_id)
          .single();

        if (!member) continue;

        // Send nudge
        const sent = await sendWhatsApp(
          member.phone,
          `Hey ${member.first_name}! Great session today 🙌 Ready for your next one? *${nextClass.name}* is available on ${nextTime}. Book now!`
        );

        if (sent) {
          await supabase.from('rebook_nudge_logs').insert({
            member_id: attendee.member_id,
            class_id: cls.id,
            nudged_class_id: nextClass.id
          });
          nudgesSent++;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, nudgesSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Rebook nudge error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
