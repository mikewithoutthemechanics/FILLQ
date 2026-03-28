import { useState, useEffect } from 'react'
import { AlertTriangle, Users, CheckCircle, Clock, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { supabase } from '../hooks/useSupabase'

type RiskLevel = 'critical' | 'high' | 'medium'

interface ChurnMember {
  id: string
  member_id: string
  churn_score: number
  signals: string[]
  created_at: string
  name: string
  phone: string
  risk_level: RiskLevel
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'critical'
  if (score >= 65) return 'high'
  return 'medium'
}

const riskStyles: Record<RiskLevel, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-[#7A2000]/10', text: 'text-[#7A2000]', label: 'Critical' },
  high: { bg: 'bg-[#D4451A]/10', text: 'text-[#D4451A]', label: 'High' },
  medium: { bg: 'bg-[#E8F0DE]', text: 'text-[#2D5016]', label: 'Medium' },
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const s = riskStyles[level]
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>{s.label}</span>
}

function MemberRow({ member }: { member: ChurnMember }) {
  const [open, setOpen] = useState(false)
  const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="border-b border-[#E5E5E5] last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full text-left p-4 hover:bg-[#F4F8EF] transition-colors">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4A7C28] to-[#2D5016] flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-[#0F0F0F] truncate" style={{ fontFamily: "'Francy Regular', 'General Sans', sans-serif" }}>{member.name}</h4>
              <p className="text-sm text-[#8A8A8A] truncate">{member.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xl font-bold text-[#0F0F0F]">{member.churn_score}</div>
              <div className="text-xs text-[#8A8A8A]">score</div>
            </div>
            <RiskBadge level={member.risk_level} />
            {open ? <ChevronUp className="w-4 h-4 text-[#6B6B6B]" /> : <ChevronDown className="w-4 h-4 text-[#6B6B6B]" />}
          </div>
        </div>
        {/* Mobile score */}
        <div className="flex sm:hidden items-center gap-2 mt-2 ml-[52px]">
          <span className="text-lg font-bold text-[#0F0F0F]">{member.churn_score}</span>
          <span className="text-xs text-[#8A8A8A]">churn score</span>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 ml-0 sm:ml-[52px]">
          <div className="p-3 rounded-lg bg-[#F4F8EF] border border-[#E5E5E5]">
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide mb-2">Risk Signals</p>
            {member.signals.length > 0 ? (
              <ul className="space-y-1">
                {member.signals.map((s, i) => (
                  <li key={i} className="text-sm text-[#0F0F0F] flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#D4451A] mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#8A8A8A]">No specific signals recorded</p>
            )}
            <p className="text-xs text-[#8A8A8A] mt-2">
              Flagged {new Date(member.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChurnPanel() {
  const [members, setMembers] = useState<ChurnMember[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | RiskLevel>('all')

  useEffect(() => {
    async function fetchChurnData() {
      setLoading(true)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const { data: signals } = await supabase
        .from('member_churn_signals')
        .select('id, member_id, churn_score, signals, created_at')
        .gte('churn_score', 50)
        .gte('created_at', sevenDaysAgo)
        .order('churn_score', { ascending: false })

      if (!signals?.length) { setMembers([]); setLoading(false); return }

      const memberIds = [...new Set(signals.map(s => s.member_id))]
      const { data: memberRows } = await supabase
        .from('members')
        .select('id, name, phone')
        .in('id', memberIds)

      const memberMap = Object.fromEntries((memberRows || []).map(m => [m.id, m]))

      setMembers(signals.map(s => ({
        ...s,
        name: memberMap[s.member_id]?.name || 'Unknown',
        phone: memberMap[s.member_id]?.phone || '',
        risk_level: getRiskLevel(s.churn_score),
      })))
      setLoading(false)
    }
    fetchChurnData()
  }, [])

  const filtered = filter === 'all' ? members : members.filter(m => m.risk_level === filter)
  const criticalCount = members.filter(m => m.risk_level === 'critical').length
  const highCount = members.filter(m => m.risk_level === 'high').length

  const filters: { key: 'all' | RiskLevel; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'critical', label: 'Critical' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
  ]

  return (
    <div className="space-y-6" style={{ fontFamily: "'General Sans', 'Satoshi', sans-serif" }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F0F0F]" style={{ fontFamily: "'Francy Regular', 'General Sans', sans-serif" }}>Churn Panel</h1>
        <p className="text-[#6B6B6B] mt-1">Members at risk of leaving — last 7 days</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: <Users className="w-5 h-5 text-[#4A7C28]" />, bg: 'bg-[#E8F0DE]', value: members.length, label: 'At Risk' },
          { icon: <AlertTriangle className="w-5 h-5 text-[#7A2000]" />, bg: 'bg-[#7A2000]/10', value: criticalCount, label: 'Critical' },
          { icon: <AlertTriangle className="w-5 h-5 text-[#D4451A]" />, bg: 'bg-[#D4451A]/10', value: highCount, label: 'High Risk' },
          { icon: <CheckCircle className="w-5 h-5 text-[#4A7C28]" />, bg: 'bg-[#E8F0DE]', value: members.filter(m => m.risk_level === 'medium').length, label: 'Medium' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-[#E5E5E5] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-[#0F0F0F]">{s.value}</p>
                <p className="text-xs text-[#8A8A8A]">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-[#6B6B6B]">Filter:</span>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-[#E8F0DE] text-[#2D5016]'
                : 'text-[#6B6B6B] hover:bg-[#F4F8EF]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Members List */}
      <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-[#F4F8EF] border-b border-[#E5E5E5]">
          <h3 className="font-semibold text-[#0F0F0F]" style={{ fontFamily: "'Francy Regular', 'General Sans', sans-serif" }}>
            Members ({filtered.length})
          </h3>
        </div>
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-[#E5E5E5] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#E5E5E5] rounded w-1/4" />
                  <div className="h-3 bg-[#E5E5E5] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-[#E8F0DE] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#4A7C28]" />
            </div>
            <h3 className="text-lg font-medium text-[#0F0F0F] mb-2" style={{ fontFamily: "'Francy Regular', 'General Sans', sans-serif" }}>All Clear</h3>
            <p className="text-[#6B6B6B]">No at-risk members in the selected filter.</p>
          </div>
        ) : (
          <div>
            {filtered.map(m => <MemberRow key={m.id} member={m} />)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-[#F4F8EF] border border-[#E8F0DE] rounded-xl p-4 flex items-start gap-3">
        <Clock className="w-5 h-5 text-[#4A7C28] mt-0.5 shrink-0" />
        <div>
          <h4 className="font-medium text-[#0F0F0F]" style={{ fontFamily: "'Francy Regular', 'General Sans', sans-serif" }}>About Churn Scoring</h4>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Scores are updated nightly. Members scoring ≥ 80 are critical, ≥ 65 high risk, ≥ 50 medium.
            Scores factor in attendance patterns, recency, payment history, and app engagement.
          </p>
        </div>
      </div>
    </div>
  )
}
