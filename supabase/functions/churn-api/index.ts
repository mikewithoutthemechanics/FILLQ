import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'members';

    if (action === 'members') {
      const minScore = parseInt(url.searchParams.get('minScore') || '50');

      const { data: signals } = await supabase
        .from('member_churn_signals')
        .select('member_id, churn_score, days_since_last_booking, signal_date, last_attendance_date')
        .gte('churn_score', minScore)
        .gte('signal_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('churn_score', { ascending: false });

      const results = [];
      for (const signal of signals || []) {
        const { data: member } = await supabase
          .from('members')
          .select('first_name, last_name, phone')
          .eq('id', signal.member_id)
          .single();

        if (member) {
          results.push({
            memberId: signal.member_id,
            firstName: member.first_name,
            lastName: member.last_name,
            phone: member.phone,
            lastSeen: signal.last_attendance_date,
            churnScore: signal.churn_score,
            riskLevel: signal.churn_score >= 80 ? 'critical' : signal.churn_score >= 65 ? 'high' : 'medium',
            daysSinceLastAttendance: signal.days_since_last_booking,
            signalDate: signal.signal_date
          });
        }
      }

      return new Response(JSON.stringify({ success: true, data: results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'summary') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [{ count: totalAtRisk }, { count: highRisk }, { count: criticalRisk }, { count: nudgesSent }] = await Promise.all([
        supabase.from('member_churn_signals').select('id', { count: 'exact' }).gte('churn_score', 50).gte('signal_date', weekAgo),
        supabase.from('member_churn_signals').select('id', { count: 'exact' }).gte('churn_score', 65).gte('signal_date', weekAgo),
        supabase.from('member_churn_signals').select('id', { count: 'exact' }).gte('churn_score', 80).gte('signal_date', weekAgo),
        supabase.from('member_churn_signals').select('id', { count: 'exact' }).in('action_taken', ['nudge_sent', 'offer_sent']).gte('action_taken_at', weekAgo)
      ]);

      return new Response(JSON.stringify({
        success: true,
        data: {
          totalAtRisk: totalAtRisk || 0,
          highRisk: highRisk || 0,
          criticalRisk: criticalRisk || 0,
          nudgesSent: nudgesSent || 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Churn API error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
