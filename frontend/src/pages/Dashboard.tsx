import { useState, useEffect } from 'react'
import { supabase } from '../hooks/useSupabase'
import { TrendingUp, Users, Shield, RefreshCw, AlertTriangle, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// ── Colors ──────────────────────────────────────────────
const C = {
  gD: '#2D5016', gM: '#4A7C28', gL: '#8BAA6B', gP: '#E8F0DE', gW: '#F4F8EF',
  rD: '#8B6914', rM: '#B8860B',
  t9: '#0F0F0F', t5: '#6B6B6B', t4: '#8A8A8A',
  bg: '#FAFAF8', bd: '#E5E5E5',
}
const ff = { serif: "'Francy Regular', 'General Sans', sans-serif", sans: "'General Sans', 'Satoshi', sans-serif" }
const card: React.CSSProperties = { background: '#fff', borderRadius: 12, border: `1px solid ${C.bd}`, padding: '20px 24px' }

// ── MetricCard ──────────────────────────────────────────
function MetricCard({ title, value, sub, icon: Icon, accent }: {
  title: string; value: string; sub: string; icon: React.ElementType; accent: 'g' | 'r' | 'b'
}) {
  const colors = { g: [C.gM, C.gP], r: [C.rM, '#FDE8E8'], b: [C.gD, C.gW] }[accent]
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, color: C.t5, margin: 0, fontFamily: ff.sans }}>{title}</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: C.t9, margin: '6px 0 2px', fontFamily: ff.serif }}>{value}</p>
          <p style={{ fontSize: 12, color: C.t4, margin: 0, fontFamily: ff.sans }}>{sub}</p>
        </div>
        <div style={{ padding: 10, background: colors[1], borderRadius: 10 }}>
          <Icon size={22} color={colors[0]} />
        </div>
      </div>
    </div>
  )
}

// ── Chart ───────────────────────────────────────────────
function FillChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <div style={card}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: C.t9, margin: '0 0 4px', fontFamily: ff.serif }}>Fill Events — Last 14 Days</h3>
      <p style={{ fontSize: 12, color: C.t4, margin: '0 0 16px', fontFamily: ff.sans }}>Waitlist spots successfully filled</p>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data} barCategoryGap="20%">
            <XAxis dataKey="date" tickFormatter={d => d.slice(5)} stroke={C.t4} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} stroke={C.t4} fontSize={11} tickLine={false} axisLine={false} width={28} />
            <Tooltip contentStyle={{ background: '#fff', border: `1px solid ${C.bd}`, borderRadius: 8, fontSize: 13 }} labelFormatter={d => `Date: ${d}`} formatter={(v: number) => [v, 'Fills']} />
            <Bar dataKey="count" fill={C.gM} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Risk badge ──────────────────────────────────────────
function riskBadge(score: number | null) {
  if (score === null) return { label: 'N/A', bg: '#F3F4F6', color: C.t5 }
  if (score >= 75) return { label: `${score}%`, bg: '#FDE8E8', color: C.rD }
  if (score >= 50) return { label: `${score}%`, bg: '#FEF3C7', color: '#92400E' }
  return { label: `${score}%`, bg: C.gP, color: C.gD }
}

// ── Types ───────────────────────────────────────────────
interface FillEvent { id: string; class_id: string; filled: boolean; created_at: string; class_name?: string; revenue_amount?: number }
interface ClassWithRisk { id: string; name: string; starts_at: string; risk_score: number | null }

// ── Main ────────────────────────────────────────────────
export default function Dashboard() {
  const [revenue, setRevenue] = useState(0)
  const [spotsFilled, setSpotsFilled] = useState(0)
  const [fillRate, setFillRate] = useState(0)
  const [atRisk, setAtRisk] = useState(0)
  const [events, setEvents] = useState<FillEvent[]>([])
  const [classes, setClasses] = useState<ClassWithRisk[]>([])
  const [chart, setChart] = useState<{ date: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const d14 = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10)

    // Fill events (30d)
    const { data: fills } = await supabase.from('waitlist_fill_events')
      .select('id, class_id, filled, created_at, class_name, revenue_amount')
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .order('created_at', { ascending: false })
    const all = (fills as FillEvent[]) || []
    const filled = all.filter(e => e.filled)
    setSpotsFilled(filled.length)
    setRevenue(filled.reduce((s, e) => s + (e.revenue_amount || 0), 0))
    setFillRate(all.length ? Math.round((filled.length / all.length) * 100) : 0)
    setEvents(all.slice(0, 8))

    // At-risk members
    const { count } = await supabase.from('member_churn_signals')
      .select('id', { count: 'exact', head: true }).gte('churn_score', 65)
    setAtRisk(count || 0)

    // Today's classes + risk
    const { data: cls } = await supabase.from('classes')
      .select('id, name, starts_at')
      .gte('starts_at', `${today}T00:00:00`).lte('starts_at', `${today}T23:59:59`)
      .order('starts_at')
    if (cls?.length) {
      const ids = cls.map(c => c.id)
      const { data: risks } = await supabase.from('booking_risk_scores')
        .select('class_id, risk_score').in('class_id', ids)
      const map: Record<string, number> = {}
      risks?.forEach(r => { if (map[r.class_id] === undefined || r.risk_score > map[r.class_id]) map[r.class_id] = r.risk_score })
      setClasses(cls.map(c => ({ ...c, risk_score: map[c.id] ?? null })))
    } else setClasses([])

    // 14-day chart
    const { data: chartFills } = await supabase.from('waitlist_fill_events')
      .select('created_at').eq('filled', true)
      .gte('created_at', `${d14}T00:00:00`).lte('created_at', new Date().toISOString())
    const buckets: Record<string, number> = {}
    for (let i = 0; i < 14; i++) { buckets[new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10)] = 0 }
    chartFills?.forEach(r => { const d = r.created_at.slice(0, 10); if (buckets[d] !== undefined) buckets[d]++ })
    setChart(Object.entries(buckets).map(([date, count]) => ({ date, count })))

    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '24px 20px 48px', fontFamily: ff.sans }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.t9, margin: 0, fontFamily: ff.serif }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: C.t5, margin: '4px 0 0' }}>Revenue recovery &amp; no-show prevention</p>
        </div>
        <button onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fff', border: `1px solid ${C.bd}`, borderRadius: 8, fontSize: 13, color: C.t9, cursor: 'pointer', fontFamily: ff.sans }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <MetricCard title="Revenue Recovered" value={`R${revenue.toLocaleString()}`} sub="from filled waitlist spots" icon={TrendingUp} accent="g" />
        <MetricCard title="Spots Filled" value={spotsFilled.toString()} sub="last 30 days" icon={Users} accent="g" />
        <MetricCard title="Fill Rate" value={`${fillRate}%`} sub="of available spots" icon={TrendingUp} accent="b" />
        <MetricCard title="At-Risk Members" value={atRisk.toString()} sub="churn score ≥ 65" icon={Shield} accent="r" />
      </div>

      {/* Chart + Activity grid */}
      <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginBottom: 28 }}>
        {loading ? <div style={{ ...card, height: 260, background: '#F3F4F6' }} /> : <FillChart data={chart} />}

        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.t9, margin: '0 0 14px', fontFamily: ff.serif }}>Recent Activity</h3>
          {loading ? [1,2,3].map(i => <div key={i} style={{ height: 14, background: '#F3F4F6', borderRadius: 4, marginBottom: 12 }} />) :
           events.length === 0 ? <p style={{ fontSize: 13, color: C.t4 }}>No recent fill events</p> :
           events.map(ev => (
            <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.bd}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: ev.filled ? C.gM : C.t4 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: C.t9, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ev.class_name || `Class ${ev.class_id?.slice(0, 8)}`}
                </p>
                <p style={{ fontSize: 11, color: C.t4, margin: '2px 0 0' }}>
                  {new Date(ev.created_at).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {ev.filled
                ? <span style={{ fontSize: 11, fontWeight: 600, color: C.gD, background: C.gP, padding: '2px 8px', borderRadius: 4 }}>Filled</span>
                : <span style={{ fontSize: 11, color: C.t5, background: '#F3F4F6', padding: '2px 8px', borderRadius: 4 }}>Pending</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Today's Classes */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Calendar size={18} color={C.gM} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.t9, margin: 0, fontFamily: ff.serif }}>Today's Classes</h3>
        </div>
        {loading ? <div style={{ height: 14, background: '#F3F4F6', borderRadius: 4, width: '60%' }} /> :
         classes.length === 0 ? <p style={{ fontSize: 13, color: C.t4 }}>No classes scheduled today</p> :
         <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.bd}` }}>
                <th style={{ textAlign: 'left', padding: '8px 8px 8px 0', color: C.t5, fontWeight: 500 }}>Class</th>
                <th style={{ textAlign: 'left', padding: 8, color: C.t5, fontWeight: 500 }}>Time</th>
                <th style={{ textAlign: 'right', padding: '8px 0 8px 8px', color: C.t5, fontWeight: 500 }}>Risk</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(c => {
                const b = riskBadge(c.risk_score)
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${C.bd}` }}>
                    <td style={{ padding: '10px 8px 10px 0', fontWeight: 500, color: C.t9 }}>{c.name}</td>
                    <td style={{ padding: 10, color: C.t5 }}>{new Date(c.starts_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ padding: '10px 0 10px 8px', textAlign: 'right' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: b.bg, color: b.color }}>
                        {c.risk_score !== null && c.risk_score >= 50 && <AlertTriangle size={12} style={{ marginRight: 4, verticalAlign: -1 }} />}
                        {b.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
         </div>
        }
      </div>

      {/* Responsive override */}
      <style>{`@media (min-width:768px){.dash-grid{grid-template-columns:2fr 1fr !important}}`}</style>
    </div>
  )
}
