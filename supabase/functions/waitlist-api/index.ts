import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'events';

    if (action === 'events') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const classId = url.searchParams.get('classId');

      let query = supabase
        .from('waitlist_fill_events')
        .select('*, classes(name, start_time), filled_by_member:members!filled_by_member_id(first_name, last_name)')
        .order('triggered_at', { ascending: false })
        .limit(limit);

      if (classId) query = query.eq('class_id', classId);
      const { data } = await query;

      return new Response(JSON.stringify({ success: true, data: data?.map(e => ({
        id: e.id,
        classId: e.class_id,
        className: e.classes?.name,
        classDate: e.classes?.start_time,
        triggeredAt: e.triggered_at,
        invitesSent: e.invites_sent,
        filled: e.filled,
        filledByMember: e.filled_by_member ? `${e.filled_by_member.first_name} ${e.filled_by_member.last_name}` : null,
        fillTimeSeconds: e.fill_time_seconds,
        revenueRecovered: e.revenue_recovered,
        status: e.status
      })) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'pending') {
      const classId = url.searchParams.get('classId');

      let query = supabase
        .from('pending_invites')
        .select('*, members(first_name, last_name), classes(name, start_time)')
        .eq('status', 'sent')
        .order('sent_at', { ascending: false });

      if (classId) query = query.eq('class_id', classId);
      const { data } = await query;

      return new Response(JSON.stringify({ success: true, data: data?.map(i => ({
        id: i.id,
        classId: i.class_id,
        className: i.classes?.name,
        memberId: i.member_id,
        memberName: `${i.members?.first_name} ${i.members?.last_name}`,
        phone: i.phone,
        position: i.position,
        sentAt: i.sent_at,
        status: i.status
      })) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Waitlist error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
