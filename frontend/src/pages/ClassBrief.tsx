import { useState, useEffect } from 'react'
import { supabase } from '../hooks/useSupabase'
import { Calendar, Clock, Users, AlertTriangle, UserPlus, List, ChevronRight } from 'lucide-react'

interface ClassBrief {
  id: string; name: string; class_type: string; start_time: string
  instructor: string; capacity: number; booked_count: number
  waitlist_count: number; high_risk_count: number; new_members_count: number; risk_score: number
}

export default function ClassBrief() {
  const [classes, setClasses] = useState<ClassBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchToday() }, [])

  async function fetchToday() {
    setLoading(true)
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

    const { data, error: err } = await supabase
      .from('classes')
      .select(`id, name, class_type, start_time, instructor, capacity,
        bookings(count), waitlist_entries(count),
        booking_risk_scores(risk_score, member_id),
        members:bookings(membership_type, created_at)`)
      .gte('start_time', start).lt('start_time', end)
      .order('start_time', { ascending: true })

    if (err) { setError(err.message); setLoading(false); return }

    setClasses((data || []).map((c: any) => {
      const risks = c.booking_risk_scores || []
      const avgRisk = risks.length > 0 ? Math.round(risks.reduce((s: number, r: any) => s + r.risk_score, 0) / risks.length) : 0
      const newM = (c.members || []).filter((m: any) => m.membership_type === 'drop-in' || m.created_at > start)
      return {
        id: c.id, name: c.name, class_type: c.class_type, start_time: c.start_time,
        instructor: c.instructor, capacity: c.capacity,
        booked_count: c.bookings?.[0]?.count || 0,
        waitlist_count: c.waitlist_entries?.[0]?.count || 0,
        high_risk_count: risks.filter((r: any) => r.risk_score >= 70).length,
        new_members_count: newM.length, risk_score: avgRisk,
      }
    }))
    setLoading(false)
  }

  const s = (f: (c: ClassBrief) => number) => classes.reduce((a, c) => a + f(c), 0)

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-8" style={{ background: '#FAFAF8', fontFamily: "'General Sans', 'Satoshi', sans-serif" }}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl" style={{ fontFamily: "'Francy Regular', 'General Sans', sans-serif", color: '#0F0F0F' }}>Class Briefs</h1>
            <p className="mt-1 text-sm" style={{ color: '#6B6B6B' }}>Pre-class insights for today</p>
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#6B6B6B' }}>
            <Calendar className="w-4 h-4" style={{ color: '#4A7C28' }} />
            {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Stat label="Classes" val={classes.length} icon={<Calendar className="w-5 h-5" />} bg="#E8F0DE" fg="#4A7C28" />
          <Stat label="Booked" val={s(c => c.booked_count)} icon={<Users className="w-5 h-5" />} bg="#E8F0DE" fg="#4A7C28" />
          <Stat label="High Risk" val={s(c => c.high_risk_count)} icon={<AlertTriangle className="w-5 h-5" />} bg="#FEE2E2" fg="#7A2000" />
          <Stat label="New" val={s(c => c.new_members_count)} icon={<UserPlus className="w-5 h-5" />} bg="#E8F0DE" fg="#4A7C28" />
        </div>

        {error && <div className="rounded-lg p-4 text-sm" style={{ background: '#FEE2E2', color: '#7A2000' }}>{error}</div>}

        {/* Loading */}
        {loading && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="rounded-xl h-48 animate-pulse" style={{ background: '#E5E5E5' }} />)}
        </div>}

        {/* Empty */}
        {!loading && classes.length === 0 && (
          <div className="text-center py-16 rounded-xl" style={{ background: '#fff', border: '1px solid #E5E5E5' }}>
            <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: '#8A8A8A' }} />
            <h3 className="text-lg mb-1" style={{ fontFamily: "'Francy Regular', 'General Sans', sans-serif", color: '#0F0F0F' }}>No classes today</h3>
            <p className="text-sm" style={{ color: '#6B6B6B' }}>No classes are scheduled for today.</p>
          </div>
        )}

        {/* Cards */}
        {!loading && classes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classes.map(c => <ClassCard key={c.id} cls={c} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, val, icon, bg, fg }: { label: string; val: number; icon: React.ReactNode; bg: string; fg: string }) {
  return (
    <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#fff', border: '1px solid #E5E5E5' }}>
      <div className="p-2 rounded-lg" style={{ background: bg, color: fg }}>{icon}</div>
      <div>
        <p className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'Francy Regular', 'General Sans', sans-serif", color: '#0F0F0F' }}>{val}</p>
        <p className="text-xs sm:text-sm" style={{ color: '#6B6B6B' }}>{label}</p>
      </div>
    </div>
  )
}

function ClassCard({ cls }: { cls: ClassBrief }) {
  const start = new Date(cls.start_time)
  const isSoon = start.getTime() - Date.now() > 0 && start.getTime() - Date.now() < 7200000
  const riskCol = cls.risk_score >= 70 ? '#7A2000' : cls.risk_score >= 40 ? '#D4451A' : '#4A7C28'
  const riskBg = cls.risk_score >= 70 ? '#FEE2E2' : cls.risk_score >= 40 ? '#FEF3C7' : '#E8F0DE'

  return (
    <div className="rounded-xl p-5 transition-shadow hover:shadow-md" style={{ background: '#fff', border: `1px solid ${isSoon ? '#4A7C28' : '#E5E5E5'}` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg truncate" style={{ fontFamily: "'Francy Regular', 'General Sans', sans-serif", color: '#0F0F0F' }}>{cls.name}</h3>
            {isSoon && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#E8F0DE', color: '#2D5016' }}>Soon</span>}
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: riskBg, color: riskCol }}>Risk {cls.risk_score}</span>
          </div>
          <p className="text-sm mt-1 flex items-center gap-1" style={{ color: '#8A8A8A' }}>
            <Clock className="w-3.5 h-3.5" />
            {start.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: true })} · {cls.instructor}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: '#8A8A8A' }} />
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <Cell icon={<Users className="w-4 h-4" />} val={cls.booked_count} label="Booked" />
        <Cell icon={<AlertTriangle className="w-4 h-4" />} val={cls.high_risk_count} label="Risk" hi={cls.high_risk_count > 0} />
        <Cell icon={<List className="w-4 h-4" />} val={cls.waitlist_count} label="Wait" />
        <Cell icon={<UserPlus className="w-4 h-4" />} val={cls.new_members_count} label="New" />
      </div>
    </div>
  )
}

function Cell({ icon, val, label, hi }: { icon: React.ReactNode; val: number; label: string; hi?: boolean }) {
  return (
    <div className="text-center p-2 sm:p-3 rounded-lg" style={{ background: hi ? '#FEE2E2' : '#F4F8EF' }}>
      <div className="flex justify-center mb-1" style={{ color: hi ? '#7A2000' : '#4A7C28' }}>{icon}</div>
      <p className="text-lg font-bold" style={{ color: hi ? '#7A2000' : '#0F0F0F' }}>{val}</p>
      <p className="text-xs" style={{ color: '#8A8A8A' }}>{label}</p>
    </div>
  )
}
