import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabase } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const AT_RISK_THRESHOLD = 60;

interface BookingRiskFactors {
  bookingLeadTime: number;
  memberNoShowHistory: number;
  memberBookingCount: number;
  dayOfWeek: number;
  timeOfDay: number;
  membershipType: string;
  classType: string;
  daysSinceLastAttendance: number;
  hasCompletedPayment: boolean;
}

function calculateRisk(factors: BookingRiskFactors): { score: number; atRisk: boolean } {
  let score = 0;

  if (factors.bookingLeadTime < 2) score += 25;
  else if (factors.bookingLeadTime < 6) score += 15;
  else if (factors.bookingLeadTime < 24) score += 8;

  score += Math.round(factors.memberNoShowHistory * 30);

  if (factors.memberBookingCount < 5) score += 15;
  else if (factors.memberBookingCount < 10) score += 8;

  const membershipRisk: Record<string, number> = {
    'drop-in': 20, 'class-pack': 10, 'monthly': 5, 'annual': 2
  };
  score += membershipRisk[factors.membershipType] ?? 10;

  if (factors.daysSinceLastAttendance > 21) score += 12;
  else if (factors.daysSinceLastAttendance > 14) score += 7;

  if (factors.timeOfDay < 7) score += 8;
  if (!factors.hasCompletedPayment) score += 10;

  const finalScore = Math.min(100, score);
  return { score: finalScore, atRisk: finalScore >= AT_RISK_THRESHOLD };
}

async function getMemberHistory(memberId: string) {
  const { data: bookings } = await supabase
    .from('bookings')
    .select('status, attended_at, booked_at')
    .eq('member_id', memberId)
    .order('booked_at', { ascending: false });

  if (!bookings || bookings.length === 0) {
    return { totalBookings: 0, noShowRate: 0.5, lastAttendanceDate: null };
  }

  const noShows = bookings.filter(b => b.status === 'no_show').length;
  const lastAttendance = bookings.find(b => b.status === 'attended');
  
  return {
    totalBookings: bookings.length,
    noShowRate: bookings.length > 0 ? noShows / bookings.length : 0,
    lastAttendanceDate: lastAttendance?.attended_at || null
  };
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const now = new Date();
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const threeHoursFifteenFromNow = new Date(now.getTime() + 3.25 * 60 * 60 * 1000);

    // Get classes starting in ~3 hours
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('id, name, start_time, end_time, class_type, capacity, teacher_id')
      .gte('start_time', threeHoursFromNow.toISOString())
      .lte('start_time', threeHoursFifteenFromNow.toISOString())
      .eq('status', 'scheduled');

    if (classError) throw classError;
    if (!classes || classes.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No classes to score', scored: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let totalScored = 0;

    for (const cls of classes) {
      // Get confirmed bookings for this class
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, member_id, booked_at, payment_status, status')
        .eq('class_id', cls.id)
        .eq('status', 'confirmed');

      if (!bookings) continue;

      for (const booking of bookings) {
        // Check if already scored today
        const { data: existing } = await supabase
          .from('booking_risk_scores')
          .select('id')
          .eq('booking_id', booking.id)
          .gte('scored_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle();

        if (existing) continue;

        // Get member details
        const { data: member } = await supabase
          .from('members')
          .select('membership_type')
          .eq('id', booking.member_id)
          .single();

        if (!member) continue;

        const history = await getMemberHistory(booking.member_id);
        
        const bookedAt = new Date(booking.booked_at);
        const classStart = new Date(cls.start_time);
        const leadTime = Math.max(0, (classStart.getTime() - bookedAt.getTime()) / (1000 * 60 * 60));
        
        const daysSinceLast = history.lastAttendanceDate
          ? Math.floor((Date.now() - new Date(history.lastAttendanceDate).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        const factors: BookingRiskFactors = {
          bookingLeadTime: leadTime,
          memberNoShowHistory: history.noShowRate,
          memberBookingCount: history.totalBookings,
          dayOfWeek: classStart.getDay(),
          timeOfDay: classStart.getHours(),
          membershipType: member.membership_type,
          classType: cls.class_type,
          daysSinceLastAttendance: daysSinceLast,
          hasCompletedPayment: booking.payment_status === 'completed'
        };

        const result = calculateRisk(factors);

        // Save risk score
        await supabase.from('booking_risk_scores').insert({
          booking_id: booking.id,
          class_id: cls.id,
          member_id: booking.member_id,
          risk_score: result.score,
          risk_factors: factors,
          at_risk: result.atRisk
        });

        totalScored++;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      classesChecked: classes.length, 
      bookingsScored: totalScored 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Scoring error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
