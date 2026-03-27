import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'class';
    const id = url.searchParams.get('id');

    if (action === 'class' && id) {
      const { data } = await supabase
        .from('booking_risk_scores')
        .select('*, members(first_name, last_name, email)')
        .eq('class_id', id)
        .order('risk_score', { ascending: false });

      return new Response(JSON.stringify({ success: true, data: data?.map(s => ({
        bookingId: s.booking_id,
        memberId: s.member_id,
        memberName: `${s.members?.first_name} ${s.members?.last_name}`,
        riskScore: s.risk_score,
        atRisk: s.at_risk,
        riskFactors: s.risk_factors,
        scoredAt: s.scored_at,
        outcome: s.outcome
      })) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'member' && id) {
      const { data } = await supabase
        .from('booking_risk_scores')
        .select('*, classes(name, start_time)')
        .eq('member_id', id)
        .order('scored_at', { ascending: false });

      return new Response(JSON.stringify({ success: true, data: data?.map(s => ({
        bookingId: s.booking_id,
        classId: s.class_id,
        className: s.classes?.name,
        classDate: s.classes?.start_time,
        riskScore: s.risk_score,
        atRisk: s.at_risk,
        scoredAt: s.scored_at,
        outcome: s.outcome
      })) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Provide action=class&id= or action=member&id=' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Scores error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
