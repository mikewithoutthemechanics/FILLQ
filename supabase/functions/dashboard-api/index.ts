import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'summary';

    if (action === 'summary') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        { count: spotsFilled },
        { data: revenueData },
        { count: atRiskCount },
        { count: highRiskCount },
        { count: criticalCount },
        { count: nudgesSent }
      ] = await Promise.all([
        supabase.from('waitlist_fill_events').select('id', { count: 'exact' }).eq('filled', true).gte('triggered_at', weekAgo.toISOString()),
        supabase.from('waitlist_fill_events').select('revenue_recovered').eq('filled', true).gte('triggered_at', weekAgo.toISOString()),
        supabase.from('member_churn_signals').select('id', { count: 'exact' }).gte('churn_score', 50).gte('signal_date', weekAgo.toISOString().split('T')[0]),
        supabase.from('member_churn_signals').select('id', { count: 'exact' }).gte('churn_score', 65).gte('signal_date', weekAgo.toISOString().split('T')[0]),
        supabase.from('member_churn_signals').select('id', { count: 'exact' }).gte('churn_score', 80).gte('signal_date', weekAgo.toISOString().split('T')[0]),
        supabase.from('member_churn_signals').select('id', { count: 'exact' }).in('action_taken', ['nudge_sent', 'offer_sent']).gte('action_taken_at', weekAgo.toISOString())
      ]);

      const revenueRecovered = revenueData?.reduce((sum, r) => sum + Number(r.revenue_recovered || 0), 0) || 0;

      // Get avg fill time
      const { data: fillTimes } = await supabase
        .from('waitlist_fill_events')
        .select('fill_time_seconds')
        .eq('filled', true)
        .not('fill_time_seconds', 'is', null)
        .gte('triggered_at', weekAgo.toISOString());

      const avgFillTimeMinutes = fillTimes && fillTimes.length > 0
        ? Math.round(fillTimes.reduce((s, f) => s + (f.fill_time_seconds || 0), 0) / fillTimes.length / 60 * 10) / 10
        : 0;

      // Get churns prevented
      const { count: churnsPrevented } = await supabase
        .from('member_churn_signals')
        .select('id', { count: 'exact' })
        .eq('outcome', 'retained')
        .gte('signal_date', weekAgo.toISOString().split('T')[0]);

      return new Response(JSON.stringify({
        success: true,
        data: {
          revenueRecoveredThisMonth: revenueRecovered,
          spotsFilledThisMonth: spotsFilled || 0,
          avgFillTimeMinutes,
          churnsPreventedThisMonth: churnsPrevented || 0,
          fillRatePercentage: spotsFilled && spotsFilled > 0 ? Math.round((spotsFilled / (spotsFilled + 1)) * 100) : 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'fill-chart') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const { data: events } = await supabase
        .from('waitlist_fill_events')
        .select('triggered_at, filled, revenue_recovered')
        .gte('triggered_at', thirtyDaysAgo.toISOString())
        .order('triggered_at', { ascending: true });

      // Group by date
      const chartData: Record<string, { total: number; filled: number; revenue: number }> = {};
      events?.forEach(e => {
        const date = e.triggered_at.split('T')[0];
        if (!chartData[date]) chartData[date] = { total: 0, filled: 0, revenue: 0 };
        chartData[date].total++;
        if (e.filled) {
          chartData[date].filled++;
          chartData[date].revenue += Number(e.revenue_recovered || 0);
        }
      });

      // Transform to array format matching frontend types
      const chartArray = Object.entries(chartData).map(([date, d]) => ({
        date,
        spotsFilled: d.filled,
        spotsEmpty: d.total - d.filled,
        fillRate: d.total > 0 ? Math.round((d.filled / d.total) * 100) : 0
      }));

      return new Response(JSON.stringify({ success: true, data: chartArray }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'at-risk') {
      const { data: signals } = await supabase
        .from('member_churn_signals')
        .select('member_id, churn_score, days_since_last_booking, signal_date')
        .gte('churn_score', 50)
        .gte('signal_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('churn_score', { ascending: false })
        .limit(20);

      const results = [];
      for (const signal of signals || []) {
        const { data: member } = await supabase
          .from('members')
          .select('first_name, last_name, phone')
          .eq('id', signal.member_id)
          .single();

        if (member) {
          results.push({
            ...signal,
            firstName: member.first_name,
            lastName: member.last_name,
            phone: member.phone,
            riskLevel: signal.churn_score >= 80 ? 'critical' : signal.churn_score >= 65 ? 'high' : 'medium'
          });
        }
      }

      return new Response(JSON.stringify({ success: true, data: results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'today-classes') {
      const { data } = await supabase
        .from('today_at_risk_classes')
        .select('*');

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
