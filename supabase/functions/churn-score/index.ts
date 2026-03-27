import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

function calculateChurnRisk(factors: any): { score: number; riskLevel: string } {
  let score = 0;

  if (factors.daysSinceLastAttendance > 21) score += 35;
  else if (factors.daysSinceLastAttendance > 14) score += 20;
  else if (factors.daysSinceLastAttendance > 10) score += 10;

  const rateDrop = factors.attendanceRate90 - factors.attendanceRate30;
  if (rateDrop > 0.4) score += 20;
  else if (rateDrop > 0.2) score += 10;

  if (factors.missedInRow >= 3) score += 15;
  else if (factors.missedInRow >= 2) score += 8;

  if (factors.lifetimeClasses < 10) score += 10;
  score += factors.paymentFailures * 8;
  if (!factors.hasOpenedApp14Days) score += 10;

  const finalScore = Math.min(100, score);
  let riskLevel = 'low';
  if (finalScore >= 80) riskLevel = 'critical';
  else if (finalScore >= 65) riskLevel = 'high';
  else if (finalScore >= 50) riskLevel = 'medium';

  return { score: finalScore, riskLevel };
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Get active members
    const { data: members } = await supabase
      .from('members')
      .select('*')
      .eq('membership_status', 'active');

    if (!members || members.length === 0) {
      return new Response(JSON.stringify({ success: true, scored: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let highRisk = 0, critical = 0;

    for (const member of members) {
      // Get all bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('status, booked_at, attended_at, payment_status')
        .eq('member_id', member.id)
        .order('booked_at', { ascending: false });

      if (!bookings) continue;

      const recentBookings = bookings.filter(b => new Date(b.booked_at) >= ninetyDaysAgo);
      const last30Bookings = bookings.filter(b => new Date(b.booked_at) >= thirtyDaysAgo);

      const calcRate = (bkgs: typeof bookings) => {
        if (bkgs.length === 0) return 0;
        return bkgs.filter(b => b.status === 'attended').length / bkgs.length;
      };

      const lastAttendance = bookings.find(b => b.status === 'attended');
      const daysSince = lastAttendance?.attended_at
        ? Math.floor((now.getTime() - new Date(lastAttendance.attended_at).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Consecutive misses
      let missedInRow = 0;
      for (const b of bookings) {
        if (b.status === 'no_show' || b.status === 'cancelled') missedInRow++;
        else if (b.status === 'attended') break;
      }

      const paymentFailures = bookings.filter(b => b.payment_status === 'failed').length;

      const factors = {
        daysSinceLastAttendance: daysSince,
        attendanceRate30: calcRate(last30Bookings),
        attendanceRate90: calcRate(recentBookings),
        missedInRow,
        lifetimeClasses: bookings.filter(b => b.status === 'attended').length,
        paymentFailures,
        hasOpenedApp14Days: daysSince <= 14
      };

      const result = calculateChurnRisk(factors);

      // Check if already scored today
      const { data: existing } = await supabase
        .from('member_churn_signals')
        .select('id')
        .eq('member_id', member.id)
        .eq('signal_date', now.toISOString().split('T')[0])
        .maybeSingle();

      if (existing) continue;

      await supabase.from('member_churn_signals').insert({
        member_id: member.id,
        churn_score: result.score,
        last_attendance_date: lastAttendance?.attended_at?.split('T')[0] || null,
        days_since_last_booking: daysSince,
        membership_type: member.membership_type,
        membership_days_remaining: member.membership_expires_at
          ? Math.max(0, Math.floor((new Date(member.membership_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : 0,
        attendance_rate_30_days: factors.attendanceRate30,
        attendance_rate_90_days: factors.attendanceRate90,
        missed_classes_in_row: missedInRow,
        has_opened_app_last_14_days: factors.hasOpenedApp14Days,
        payment_failures: paymentFailures,
        outcome: 'pending'
      });

      if (result.riskLevel === 'high') highRisk++;
      if (result.riskLevel === 'critical') critical++;
    }

    return new Response(JSON.stringify({
      success: true,
      totalScored: members.length,
      highRisk,
      critical
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Churn scoring error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
