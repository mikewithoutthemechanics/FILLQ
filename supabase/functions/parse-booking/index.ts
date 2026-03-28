import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { supabase } from '../_shared/supabase.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

/**
 * WhatsApp Booking Parser
 * 
 * Receives WhatsApp messages from OpenClaw nodes.
 * Parses booking intent using pattern matching (and optionally AI).
 * Creates bookings in Supabase.
 * Returns confirmation message to send back.
 * 
 * POST /parse-booking
 * Body: { studio_id, phone, message, sender_name }
 */

interface BookingIntent {
  isBooking: boolean
  isCancellation: boolean
  className?: string
  date?: string
  time?: string
  memberName?: string
  confidence: number
}

// Simple pattern-based parser (upgrade to AI later)
function parseBookingIntent(message: string, senderName?: string): BookingIntent {
  const lower = message.toLowerCase()

  // Booking patterns
  const bookingPatterns = [
    /(?:book|reserve|sign\s*me\s*up|save\s*me\s*a?\s*spot|put\s*me\s*(?:down|in))\s*(?:me\s*)?(?:for\s*)?(?:a?\s*)?(\w+(?:\s+\w+)?)?/i,
    /(?:can\s*i|could\s*i|i(?:'d|\s+would)\s+like\s*to)\s*(?:book|reserve|attend|join|come\s*to)\s*(?:a?\s*)?(\w+(?:\s+\w+)?)?/i,
    /(?:i\s+want\s*(?:to\s*)?(?:book|attend|join|come\s*to))\s*(?:a?\s*)?(\w+(?:\s+\w+)?)?/i,
  ]

  // Cancellation patterns
  const cancelPatterns = [
    /(?:cancel|can't\s*make\s*it|won't\s*be\s*(?:there|able)|need\s*to\s*cancel|not\s*coming)/i,
    /(?:i\s*can(?:'t|not)\s*(?:make|come|attend))/i,
  ]

  // Check cancellation first
  for (const pattern of cancelPatterns) {
    if (pattern.test(lower)) {
      return { isBooking: false, isCancellation: true, confidence: 0.9 }
    }
  }

  // Check booking
  let className: string | undefined
  let date: string | undefined
  let time: string | undefined

  for (const pattern of bookingPatterns) {
    const match = lower.match(pattern)
    if (match) {
      // Extract class type
      const classTypes = ['yoga', 'pilates', 'barre', 'reformer', 'vinyasa', 'hatha', 'power', 'restorative', 'yin', 'ashtanga']
      for (const type of classTypes) {
        if (lower.includes(type)) {
          className = type.charAt(0).toUpperCase() + type.slice(1)
          break
        }
      }

      // Extract time
      const timeMatch = lower.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/i)
      if (timeMatch) {
        let hour = parseInt(timeMatch[1])
        const minutes = timeMatch[2] || '00'
        const period = timeMatch[3]?.toLowerCase()
        if (period === 'pm' && hour < 12) hour += 12
        if (period === 'am' && hour === 12) hour = 0
        time = `${hour.toString().padStart(2, '0')}:${minutes}`
      }

      // Extract date
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      for (const day of days) {
        if (lower.includes(day)) {
          date = day
          break
        }
      }
      if (lower.includes('tomorrow')) date = 'tomorrow'
      if (lower.includes('today')) date = 'today'
      if (lower.match(/\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)) {
        date = lower.match(/\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i)?.[0]
      }

      return {
        isBooking: true,
        isCancellation: false,
        className,
        date,
        time,
        memberName: senderName,
        confidence: className ? 0.9 : (time ? 0.7 : 0.5)
      }
    }
  }

  return { isBooking: false, isCancellation: false, confidence: 0 }
}

// Resolve date string to actual date
function resolveDate(dateStr?: string): string {
  if (!dateStr) {
    // Default to next available class
    return new Date().toISOString().split('T')[0]
  }
  const now = new Date()
  const lower = dateStr.toLowerCase()

  if (lower === 'today') return now.toISOString().split('T')[0]
  if (lower === 'tomorrow') {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayIndex = days.indexOf(lower)
  if (dayIndex !== -1) {
    const d = new Date(now)
    const diff = (dayIndex - d.getDay() + 7) % 7 || 7
    d.setDate(d.getDate() + diff)
    return d.toISOString().split('T')[0]
  }

  return now.toISOString().split('T')[0]
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { studio_id, phone, message, sender_name } = await req.json()

    if (!studio_id || !phone || !message) {
      return new Response(JSON.stringify({ success: false, error: 'studio_id, phone, and message required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse the message
    const intent = parseBookingIntent(message, sender_name)

    if (!intent.isBooking && !intent.isCancellation) {
      return new Response(JSON.stringify({
        success: true,
        action: 'ignored',
        reply: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Find or create member
    const { data: member } = await supabase
      .from('members')
      .select('id, first_name')
      .eq('phone', phone)
      .eq('studio_id', studio_id)
      .maybeSingle()

    let memberId = member?.id
    let memberName = member?.first_name || sender_name || 'there'

    if (!memberId) {
      // Create new member
      const { data: newMember } = await supabase
        .from('members')
        .insert({
          phone,
          first_name: sender_name || 'Guest',
          last_name: '',
          email: `${phone}@filliq.temp`,
          membership_type: 'drop-in',
          membership_status: 'active'
        })
        .select('id, first_name')
        .single()

      if (newMember) {
        memberId = newMember.id
        memberName = newMember.first_name
      }
    }

    if (intent.isBooking && memberId) {
      const targetDate = resolveDate(intent.date)

      // Find matching class
      let classQuery = supabase
        .from('classes')
        .select('id, name, start_time, available_spots, class_type')
        .eq('studio_id', studio_id)
        .eq('status', 'scheduled')
        .gt('available_spots', 0)
        .gte('start_time', `${targetDate}T00:00:00`)
        .lt('start_time', `${targetDate}T23:59:59`)

      if (intent.className) {
        classQuery = classQuery.ilike('class_type', `%${intent.className.toLowerCase()}%`)
      }
      if (intent.time) {
        classQuery = classQuery.ilike('start_time', `%T${intent.time}%`)
      }

      const { data: matchingClasses } = await classQuery.order('start_time').limit(1)

      if (matchingClasses && matchingClasses.length > 0) {
        const cls = matchingClasses[0]

        // Check for existing booking
        const { data: existing } = await supabase
          .from('bookings')
          .select('id')
          .eq('class_id', cls.id)
          .eq('member_id', memberId)
          .eq('status', 'confirmed')
          .maybeSingle()

        if (existing) {
          return new Response(JSON.stringify({
            success: true,
            action: 'already_booked',
            reply: `You're already booked for ${cls.name}! ✅`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Create booking
        await supabase.from('bookings').insert({
          class_id: cls.id,
          member_id: memberId,
          status: 'confirmed',
          payment_status: 'pending',
          amount_paid: 0
        })

        // Decrease available spots
        await supabase
          .from('classes')
          .update({ available_spots: cls.available_spots - 1 })
          .eq('id', cls.id)

        const classTime = new Date(cls.start_time).toLocaleString('en-ZA', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })

        return new Response(JSON.stringify({
          success: true,
          action: 'booked',
          booking: {
            class_name: cls.name,
            class_time: classTime,
            member_name: memberName
          },
          reply: `✅ You're booked, ${memberName}! *${cls.name}* on ${classTime}. See you on the mat! 🧘`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } else {
        // No matching class found — list upcoming
        const { data: upcoming } = await supabase
          .from('classes')
          .select('name, start_time, class_type')
          .eq('studio_id', studio_id)
          .eq('status', 'scheduled')
          .gt('available_spots', 0)
          .gte('start_time', new Date().toISOString())
          .order('start_time')
          .limit(5)

        let reply = `I don't see a ${intent.className || ''} class`
        if (intent.date) reply += ` on ${intent.date}`
        if (intent.time) reply += ` at ${intent.time}`
        reply += `. Here's what's available:\n\n`

        upcoming?.forEach(c => {
          const time = new Date(c.start_time).toLocaleString('en-ZA', {
            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
          })
          reply += `• ${c.name} — ${time}\n`
        })
        reply += `\nWhich would you like to book?`

        return new Response(JSON.stringify({
          success: true,
          action: 'no_match',
          reply
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    if (intent.isCancellation && memberId) {
      // Find active booking and cancel it
      const { data: activeBooking } = await supabase
        .from('bookings')
        .select('id, class_id, classes(name, start_time)')
        .eq('member_id', memberId)
        .eq('status', 'confirmed')
        .gte('classes.start_time', new Date().toISOString())
        .order('classes.start_time')
        .limit(1)
        .maybeSingle()

      if (activeBooking) {
        await supabase
          .from('bookings')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('id', activeBooking.id)

        // Increase available spots
        await supabase
          .from('classes')
          .update({ available_spots: supabase.rpc('increment') })
          .eq('id', activeBooking.class_id)

        // Trigger waitlist fill
        await supabase.functions.invoke('waitlist-trigger', {
          body: { class_id: activeBooking.class_id, cancelled_booking_id: activeBooking.id, studio_id }
        })

        const className = activeBooking.classes?.name || 'your class'

        return new Response(JSON.stringify({
          success: true,
          action: 'cancelled',
          reply: `No worries, ${memberName}! I've cancelled *${className}*. We'll fill the spot from the waitlist. 🙏`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({
        success: true,
        action: 'no_active_booking',
        reply: `I don't see any upcoming bookings for you, ${memberName}. All good! 👍`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true, action: 'ignored', reply: null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Parse error:', error)
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
