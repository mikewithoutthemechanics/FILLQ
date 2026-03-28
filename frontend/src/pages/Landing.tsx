import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  MessageCircle,
  Shield,
  ArrowRight,
  Star,
  Check,
  Play,
  Zap,
  Clock,
  Users,
  BarChart3,
  Heart,
} from 'lucide-react'
import TextRotate from '../components/TextRotate'
import HolographicCard from '../components/HolographicCard'

/* ── Colours ────────────────────────────────────────────── */
const C = {
  g: { 900: '#1B3A0A', 800: '#2D5016', 700: '#3D6B22', 600: '#4A7C28', 500: '#5E9A34', 400: '#8BAA6B', 300: '#B5CDA3', 200: '#D4E4C8', 100: '#E8F0DE', 50: '#F4F8EF' },
  a: { 700: '#7A2000', 600: '#D4451A', 500: '#E86840', 400: '#F5D8CC', 100: '#FFF0EA' },
  t: { 900: '#0F0F0F', 800: '#1A1A1A', 700: '#2D2D2D', 600: '#4A4A4A', 500: '#6B6B6B', 400: '#8A8A8A', 300: '#ABABAB' },
  b: '#E5E5E5',
  w: '#FAFAF8',
}

const font = { display: "'Francy Regular', 'General Sans', sans-serif", body: "'General Sans', 'Satoshi', sans-serif" }

/* ── Animated counter hook ─────────────────────────── */
function useAnimatedCounter(target: number, duration = 1800) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const raf = useRef<number>(0)

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(Math.round(target * eased))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [inView, target, duration])

  return { ref, value }
}

/* ── Stat formatter ────────────────────────────────── */
function formatStat(label: string, value: number): string {
  if (label === 'revenue') return `R${(value / 1_000_000).toFixed(1)}M`
  if (label === 'spots') return value.toLocaleString() + '+'
  if (label === 'fill') return value + '%'
  if (label === 'time') return `<${value} min`
  return String(value)
}

/* ═══════════════════════════════════════════════════════ */
export default function Landing() {
  const [scroll, setScroll] = useState(0)

  useEffect(() => {
    const onScroll = () => setScroll(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: C.w, color: C.t[900] }}>

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scroll > 60 ? 'rgba(250,250,248,0.92)' : 'transparent',
          backdropFilter: scroll > 60 ? 'blur(20px)' : 'none',
          borderBottom: scroll > 60 ? `1px solid ${C.b}` : '1px solid transparent',
        }}
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 lg:px-10 h-[72px]">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.g[800] }}>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-[17px] font-semibold" style={{ fontFamily: font.display }}>WaitUp</span>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-[14px]" style={{ color: C.t[600], fontFamily: font.body }}>
            {['Product', 'How it works', 'Pricing'].map(t => (
              <a key={t} href={`#${t.toLowerCase().replace(/ /g, '-')}`}
                className="hover:text-black transition-colors cursor-pointer"
              >{t}</a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-[14px] hidden sm:block" style={{ color: C.t[500], fontFamily: font.body }}>Sign in</Link>
            <Link to="/login"
              className="px-5 py-2.5 rounded-full text-[13px] font-semibold text-white transition-all hover:shadow-lg hover:shadow-black/10"
              style={{ backgroundColor: C.g[800], fontFamily: font.body }}
            >Start free →</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-[0.07]"
            style={{ background: `radial-gradient(ellipse, ${C.g[700]}, transparent 70%)` }} />
        </div>

        <div className="relative max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: copy */}
            <div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] tracking-[0.04em]"
                style={{ fontFamily: font.display }}
              >
                Every no-show<br />
                costs you <span style={{ color: C.g[700] }}>R150.</span><br />
                <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                  Stop{' '}
                  <TextRotate
                    texts={['no-shows.', 'empty spots.', 'lost revenue.', 'churn.', 'waiting.']}
                    interval={2200}
                  />
                </span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="mt-7 text-[18px] leading-[1.6] max-w-[500px]"
                style={{ color: C.t[500], fontFamily: font.body }}
              >
                WaitUp predicts cancellations, fills empty spots via WhatsApp in under a minute, and catches members before they churn.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Link to="/login"
                  className="group px-7 py-4 rounded-full text-[15px] font-semibold text-white flex items-center gap-2 transition-all hover:shadow-xl hover:shadow-black/10 hover:-translate-y-0.5"
                  style={{ backgroundColor: C.g[800], fontFamily: font.body }}
                >
                  Start free, no card needed
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <button className="px-7 py-4 rounded-full text-[15px] font-medium flex items-center gap-2 transition-all hover:bg-black/5"
                  style={{ border: `1.5px solid ${C.b}`, fontFamily: font.body }}
                >
                  <Play className="w-4 h-4" /> See it in action
                </button>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="mt-14 flex items-center gap-6 flex-wrap"
              >
                <div className="flex -space-x-2">
                  {[
                    { bg: C.g[800], label: 'SJ' },
                    { bg: C.a[700], label: 'MS' },
                    { bg: C.g[600], label: 'EW' },
                    { bg: C.a[500], label: 'LD' },
                  ].map((a, i) => (
                    <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2"
                      style={{ backgroundColor: a.bg, borderColor: C.w }}
                    >{a.label}</div>
                  ))}
                </div>
                <div className="h-5 w-px" style={{ background: C.b }} />
                <div>
                  <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5" style={{ color: C.a[600], fill: C.a[600] }} />)}</div>
                  <p className="text-[12px] mt-0.5" style={{ color: C.t[400], fontFamily: font.body }}>50+ studios across South Africa</p>
                </div>
              </motion.div>
            </div>

            {/* ── Dashboard preview (task 1: realistic mockup) ─── */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              className="w-full"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/[0.1]"
                style={{ border: `1px solid ${C.b}`, backgroundColor: '#fff' }}
              >
                {/* Chrome bar */}
                <div className="flex items-center gap-2 px-4 h-10" style={{ backgroundColor: '#F7F7F5', borderBottom: `1px solid ${C.b}` }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#D4451A' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#F2CC8F' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: C.g[400] }} />
                  <div className="ml-3 flex-1 rounded-md h-5 flex items-center px-2.5" style={{ background: '#EEEEEC' }}>
                    <span className="text-[10px]" style={{ color: C.t[400] }}>app.waitup.co.za/dashboard</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: C.g[100], color: C.g[800] }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.g[600] }} />
                    Live
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[15px] font-semibold" style={{ fontFamily: font.display }}>Zen Flow Studio</h3>
                      <p className="text-[11px]" style={{ color: C.t[400], fontFamily: font.body }}>Friday, 28 Mar 2026 · 4 classes today</p>
                    </div>
                    <div className="text-[10px] px-2 py-1 rounded-lg font-medium" style={{ backgroundColor: C.g[50], color: C.g[800], border: `1px solid ${C.g[200]}` }}>
                      <span className="font-bold">R4,320</span> recovered today
                    </div>
                  </div>

                  {/* KPI cards */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { icon: <BarChart3 className="w-3.5 h-3.5" />, v: 'R4,320', l: 'Recovered today', delta: '+R1,280 vs yesterday', c: C.g[800], bg: C.g[50] },
                      { icon: <Users className="w-3.5 h-3.5" />, v: '18', l: 'Spots filled', delta: '6 in the last hour', c: C.a[700], bg: '#FDF2F2' },
                      { icon: <Zap className="w-3.5 h-3.5" />, v: '86%', l: 'Fill rate', delta: 'Up from 72% last week', c: C.g[700], bg: C.g[50] },
                      { icon: <Heart className="w-3.5 h-3.5" />, v: '3', l: 'Churns prevented', delta: 'Emma, Mike, Jade', c: C.a[600], bg: '#FDF2F2' },
                    ].map((card, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="rounded-xl p-3"
                        style={{ backgroundColor: card.bg, border: `1px solid ${C.b}` }}
                      >
                        <div className="flex items-center gap-1.5 mb-1" style={{ color: card.c }}>{card.icon}<span className="text-[10px] font-medium">{card.l}</span></div>
                        <div className="text-[22px] font-bold leading-none" style={{ color: card.c, fontFamily: font.display }}>{card.v}</div>
                        <p className="text-[9px] mt-1" style={{ color: C.t[400] }}>{card.delta}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: '#FAFAF8', border: `1px solid ${C.b}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-medium" style={{ color: C.t[500], fontFamily: font.body }}>Fill rate — last 14 days</p>
                      <p className="text-[10px] font-semibold" style={{ color: C.g[800] }}>↑ 14%</p>
                    </div>
                    <div className="flex items-end gap-[3px] h-14">
                      {[40, 55, 35, 70, 45, 80, 60, 90, 50, 85, 65, 95, 75, 88].map((h, i) => (
                        <motion.div key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.4 + i * 0.02, duration: 0.4, ease: 'easeOut' }}
                          className="flex-1 rounded-sm"
                          style={{ backgroundColor: h > 70 ? C.g[700] : C.g[300] }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Upcoming classes */}
                  <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: '#FAFAF8', border: `1px solid ${C.b}` }}>
                    <p className="text-[11px] font-medium mb-2" style={{ color: C.t[500] }}>Upcoming classes</p>
                    {[
                      { time: '06:00', name: 'Morning Yoga Flow', cap: '12/12', risk: 'Low', rc: C.g[700] },
                      { time: '09:30', name: 'Power Pilates', cap: '8/10', risk: '2 at-risk', rc: C.a[600] },
                      { time: '12:00', name: 'Yin & Restore', cap: '6/8', risk: 'Low', rc: C.g[700] },
                    ].map((cls, i) => (
                      <div key={i} className="flex items-center gap-3 py-1.5" style={{ borderBottom: i < 2 ? `1px solid ${C.b}` : 'none' }}>
                        <span className="text-[10px] font-medium w-10 flex-shrink-0" style={{ color: C.t[400] }}>{cls.time}</span>
                        <span className="text-[11px] flex-1" style={{ fontFamily: font.body }}>{cls.name}</span>
                        <span className="text-[10px]" style={{ color: C.t[400] }}>{cls.cap}</span>
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: cls.rc + '18', color: cls.rc }}>{cls.risk}</span>
                      </div>
                    ))}
                  </div>

                  {/* Activity feed */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium" style={{ color: C.t[500] }}>Recent activity</p>
                    {[
                      { t: 'Spot filled: Morning Yoga Flow → Jade P.', time: '8 min ago', c: C.g[800], dot: C.g[600] },
                      { t: 'Risk alert: Emma W. — score 85/100', time: '23 min ago', c: C.a[700], dot: C.a[600] },
                      { t: 'Rebook nudge sent to Mike S.', time: '1 hr ago', c: C.t[600], dot: C.t[300] },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 py-1.5" style={{ borderBottom: i < 2 ? `1px solid ${C.b}` : 'none' }}>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.dot }} />
                        <p className="text-[11px] flex-1" style={{ color: item.c, fontFamily: font.body }}>{item.t}</p>
                        <span className="text-[10px] flex-shrink-0" style={{ color: C.t[400] }}>{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE — trust logos (task 3: real SA studios) ── */}
      <section className="border-y py-6 overflow-hidden" style={{ borderColor: C.b, backgroundColor: '#F7F7F5' }}>
        <div className="flex items-center gap-10 animate-[marquee_30s_linear_infinite] whitespace-nowrap px-6"
          style={{ fontFamily: font.body }}
        >
          {[
            'YogaLife Cape Town', 'The Pilates Room JHB', 'FlowState Ballito', 'Zen Studio Durban',
            'Pause Pilates PTA', 'Shala Yoga Stellenbosch', 'Core Balance Pretoria', 'Reform Studio CPT',
            'YogaLife Cape Town', 'The Pilates Room JHB', 'FlowState Ballito', 'Zen Studio Durban',
            'Pause Pilates PTA', 'Shala Yoga Stellenbosch', 'Core Balance Pretoria', 'Reform Studio CPT',
          ].map((name, i) => (
            <span key={i} className="text-[13px] font-medium flex items-center gap-2.5" style={{ color: C.t[400] }}>
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white" style={{ background: C.g[800] }}>
                {name.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </span>
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────── */}
      <SectionBg id="how-it-works">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <p className="text-[12px] font-medium tracking-[0.15em] uppercase mb-3" style={{ color: C.g[700], fontFamily: font.body }}>How it works</p>
          <h2 className="text-[clamp(2rem,4vw,3.2rem)] leading-[1.1] tracking-[0.04em] max-w-lg" style={{ fontFamily: font.display }}>
            Three steps to a <span style={{ color: C.g[700] }}>full studio</span>
          </h2>

          <div className="mt-16 grid md:grid-cols-3 gap-10">
            {[
              { n: '01', title: 'Predict', desc: 'Every booking gets a 0-100 no-show risk score. You know who\'s flaking 3 hours before class.', color: C.g[800] },
              { n: '02', title: 'Auto-Fill', desc: 'Spot cancelled? WhatsApp fires instantly to your top 3 waitlist candidates. First reply gets it.', color: C.a[700] },
              { n: '03', title: 'Retain', desc: 'Churn radar catches members drifting away. Auto-nudges and rebook invites keep them active.', color: C.g[700] },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 0.12}>
                <div className="text-[48px] font-bold leading-none mb-5" style={{ color: C.g[200], fontFamily: font.display }}>{step.n}</div>
                <h3 className="text-[20px] font-semibold mb-2" style={{ fontFamily: font.display }}>{step.title}</h3>
                <p className="text-[14px] leading-[1.7]" style={{ color: C.t[500], fontFamily: font.body }}>{step.desc}</p>
                <div className="mt-5 h-[3px] w-10 rounded-full" style={{ backgroundColor: step.color }} />
              </Reveal>
            ))}
          </div>
        </div>
      </SectionBg>

      {/* ── PRODUCT ────────────────────────────────────── */}
      <SectionBg id="product" style={{ backgroundColor: '#fff' }}>
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[12px] font-medium tracking-[0.15em] uppercase mb-3" style={{ color: C.g[700], fontFamily: font.body }}>The product</p>
              <h2 className="text-[clamp(2.8rem,5.5vw,4.5rem)] leading-[1.02] tracking-[0.04em]" style={{ fontFamily: font.display }}>
                Not just a dashboard.<br />
                <span style={{ color: C.a[700] }}>A recovery engine.</span>
              </h2>
              <p className="mt-6 text-[17px] leading-[1.7] max-w-md" style={{ color: C.t[500], fontFamily: font.body }}>
                WaitUp runs silently in the background. It scores, it fills, it nudges. You just see the revenue coming back.
              </p>

              <div className="mt-10 space-y-5">
                {[
                  { icon: <Clock className="w-4 h-4" />, t: '3 hours before class', d: 'Risk scores every booking' },
                  { icon: <MessageCircle className="w-4 h-4" />, t: 'On cancellation', d: 'WhatsApp to top waitlist candidates' },
                  { icon: <Users className="w-4 h-4" />, t: 'Every night at 2AM', d: 'Churn scoring all active members' },
                  { icon: <BarChart3 className="w-4 h-4" />, t: '1st of each month', d: 'Revenue recovery report' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: C.g[100], color: C.g[800] }}
                    >{item.icon}</div>
                    <div>
                      <p className="text-[14px] font-semibold" style={{ fontFamily: font.body }}>{item.t}</p>
                      <p className="text-[13px]" style={{ color: C.t[500], fontFamily: font.body }}>{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Reveal>
              <div className="rounded-2xl p-6 lg:p-8" style={{ backgroundColor: C.g[50], border: `1px solid ${C.g[200]}` }}>
                <div className="relative pl-8 space-y-6">
                  <div className="absolute left-3 top-2 bottom-2 w-px" style={{ backgroundColor: C.g[300] }} />
                  {[
                    { time: '6:00 AM', event: 'Class scored — 2 at-risk bookings', badge: 'Scored', badgeColor: C.g[800] },
                    { time: '6:45 AM', event: 'Sarah cancelled — WhatsApp fired', badge: 'Filled', badgeColor: C.a[700] },
                    { time: '6:49 AM', event: 'Mike replied YES — spot confirmed', badge: 'Booked', badgeColor: C.g[700] },
                    { time: '7:00 AM', event: 'Class starts — full capacity ✓', badge: 'Full', badgeColor: C.g[600] },
                  ].map((item, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04 }}
                      className="relative"
                    >
                      <div className="absolute -left-5 top-1 w-3 h-3 rounded-full border-2" style={{ borderColor: item.badgeColor, backgroundColor: C.w }} />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-medium" style={{ color: C.t[400], fontFamily: font.body }}>{item.time}</p>
                          <p className="text-[14px] mt-0.5" style={{ fontFamily: font.body }}>{item.event}</p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: item.badgeColor, color: '#fff' }}>{item.badge}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </SectionBg>

      {/* ── STATS (task 2: animated counters) ──────────── */}
      <SectionBg>
        <div className="max-w-[1000px] mx-auto px-6 lg:px-10 py-24">
          <div className="rounded-2xl p-8 lg:p-12" style={{ backgroundColor: C.g[50], border: `1px solid ${C.g[200]}` }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { target: 21, suffix: 'revenue', l: 'Revenue recovered' },
                { target: 3400, suffix: 'spots', l: 'Spots filled' },
                { target: 94, suffix: 'fill', l: 'Fill rate' },
                { target: 8, suffix: 'time', l: 'Avg fill time' },
              ].map((s, i) => (
                <AnimatedStat key={i} target={s.target} suffix={s.suffix} label={s.l} delay={i * 0.1} />
              ))}
            </div>
          </div>
        </div>
      </SectionBg>

      {/* ── TESTIMONIALS (task 4: social proof) ────────── */}
      <SectionBg>
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-16 lg:py-24">
          <p className="text-[12px] font-medium tracking-[0.15em] uppercase mb-3 text-center" style={{ color: C.g[700], fontFamily: font.body }}>What studios say</p>
          <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.1] tracking-[0.04em] text-center mb-14" style={{ fontFamily: font.display }}>
            Loved by studio owners <span style={{ color: C.g[700] }}>across SA</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "We were losing R8,000 a month to no-shows. WaitUp recovered R6,200 in the first month alone. The WhatsApp fill feature is magic — spots get snapped up in minutes.", name: 'Sarah Jacobs', role: 'Owner, YogaLife Cape Town', avatar: 'SJ' },
              { quote: "The churn radar alone pays for itself. We saved 12 members from cancelling last quarter by catching them early. Our retention is up 23% since switching.", name: 'Mike van der Berg', role: 'Director, The Pilates Room JHB', avatar: 'MB' },
              { quote: "I used to manually message waitlists at 5 AM. Now WaitUp does it instantly. My morning classes went from 60% to 92% capacity in two weeks.", name: 'Jade Pillay', role: 'Founder, FlowState Ballito', avatar: 'JP' },
            ].map((t, i) => (
              <Reveal key={i} delay={i * 0.12}>
                <div className="rounded-2xl p-7 h-full flex flex-col" style={{ backgroundColor: '#fff', border: `1px solid ${C.b}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div className="flex gap-0.5 mb-4">{[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4" style={{ color: C.a[600], fill: C.a[600] }} />)}</div>
                  <p className="text-[14px] leading-[1.7] flex-1" style={{ color: C.t[600], fontFamily: font.body }}>"{t.quote}"</p>
                  <div className="flex items-center gap-3 mt-6 pt-4" style={{ borderTop: `1px solid ${C.b}` }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: C.g[800] }}>{t.avatar}</div>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ fontFamily: font.body }}>{t.name}</p>
                      <p className="text-[11px]" style={{ color: C.t[400] }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </SectionBg>

      {/* ── PRICING ─────────────────────────────────────── */}
      <SectionBg id="pricing" style={{ backgroundColor: '#fff' }}>
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <p className="text-[12px] font-medium uppercase mb-3" style={{ color: C.g[700], fontFamily: font.body, letterSpacing: '0.15em' }}>Pricing</p>
          <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] leading-[1.08] max-w-lg" style={{ fontFamily: font.display, letterSpacing: '0.04em' }}>
            Simple plans for a<br /><span style={{ color: C.g[700] }}>full studio</span>
          </h2>

          <div className="mt-14 grid md:grid-cols-4 gap-5">
            {[
              { name: 'Starter', price: 'Free', desc: 'Try it out', features: ['1 studio', '50 bookings/mo', 'Risk scoring', 'Email support'], hl: false, cta: 'Start Free' },
              { name: 'Growth', price: 'R299', desc: '/month', features: ['1 studio', '500 bookings/mo', 'WhatsApp auto-fill', 'Churn radar', 'Dashboard'], hl: true, cta: 'Get Started' },
              { name: 'Studio Pro', price: 'R599', desc: '/month', features: ['Up to 3 studios', 'Unlimited bookings', 'Priority WhatsApp', 'API access', 'Reports'], hl: false, cta: 'Go Pro' },
              { name: 'Enterprise', price: 'Custom', desc: 'Chains & franchises', features: ['Unlimited studios', 'White-label', 'Dedicated support', 'Custom integrations'], hl: false, cta: 'Contact Us' },
            ].map((plan, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <HolographicCard highlighted={plan.hl}>
                  <div className="p-7 h-full flex flex-col"
                    style={{ color: plan.hl ? '#fff' : C.t[900] }}
                  >
                    <p className="text-[11px] font-semibold uppercase" style={{ color: plan.hl ? 'rgba(255,255,255,0.6)' : C.t[400], fontFamily: font.body, letterSpacing: '0.1em' }}>{plan.name}</p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-[36px] font-bold leading-none" style={{ fontFamily: font.display }}>{plan.price}</span>
                      {plan.price !== 'Free' && plan.price !== 'Custom' && <span className="text-[13px]" style={{ color: plan.hl ? 'rgba(255,255,255,0.5)' : C.t[400] }}>{plan.desc}</span>}
                    </div>
                    {plan.price === 'Free' && <p className="text-[12px] mt-1" style={{ color: plan.hl ? 'rgba(255,255,255,0.5)' : C.t[400] }}>No card needed</p>}
                    {plan.price === 'Custom' && <p className="text-[12px] mt-1" style={{ color: plan.hl ? 'rgba(255,255,255,0.5)' : C.t[400] }}>Let's talk</p>}
                    <ul className="mt-6 space-y-3 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-[13px]" style={{ fontFamily: font.body }}>
                          <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: plan.hl ? 'rgba(255,255,255,0.7)' : C.g[700] }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link to="/login"
                      className="mt-7 block text-center py-3 rounded-xl text-[14px] font-semibold transition-all hover:shadow-md"
                      style={{
                        backgroundColor: plan.hl ? '#fff' : C.g[50],
                        color: plan.hl ? C.g[900] : C.g[800],
                        border: plan.hl ? 'none' : `1.5px solid ${C.g[200]}`,
                        fontFamily: font.body,
                      }}
                    >{plan.cta}</Link>
                  </div>
                </HolographicCard>
              </Reveal>
            ))}
          </div>
        </div>
      </SectionBg>

      {/* ── CTA ─────────────────────────────────────────── */}
      <SectionBg>
        <div className="max-w-[800px] mx-auto px-6 lg:px-10 py-24 lg:py-32 text-center">
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-[0.04em]" style={{ fontFamily: font.display }}>
            Ready to stop<br />losing revenue?
          </h2>
          <p className="mt-5 text-[16px]" style={{ color: C.t[500], fontFamily: font.body }}>
            Join South Africa's smartest yoga & pilates studios.
          </p>
          <Link to="/login"
            className="group inline-flex items-center gap-2 mt-10 px-8 py-4 rounded-full text-[15px] font-semibold text-white transition-all hover:shadow-xl hover:shadow-black/10 hover:-translate-y-0.5"
            style={{ backgroundColor: C.g[800], fontFamily: font.body }}
          >Start free — no card needed <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></Link>
        </div>
      </SectionBg>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="border-t py-10 px-6" style={{ borderColor: C.b }}>
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: C.g[800] }} />
            <span className="text-[14px] font-semibold" style={{ fontFamily: font.display }}>WaitUp</span>
          </div>
          <p className="text-[12px]" style={{ color: C.t[400], fontFamily: font.body }}>Built for South African studios 🇿🇦 · © 2026</p>
        </div>
      </footer>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
    </div>
  )
}

/* ── Animated stat (task 2) ────────────────────────── */
function AnimatedStat({ target, suffix, label, delay }: { target: number; suffix: string; label: string; delay: number }) {
  const { ref, value } = useAnimatedCounter(target)
  return (
    <Reveal delay={delay}>
      <div ref={ref}>
        <div className="text-[clamp(1.8rem,3vw,2.5rem)] font-bold" style={{ color: C.g[800], fontFamily: font.display }}>
          {formatStat(suffix, value)}
        </div>
        <div className="text-[13px] mt-1" style={{ color: C.t[500], fontFamily: font.body }}>{label}</div>
      </div>
    </Reveal>
  )
}

/* ── Helpers ─────────────────────────────────────────── */
function SectionBg({ children, id, style = {} }: { children: React.ReactNode; id?: string; style?: React.CSSProperties }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section ref={ref} id={id} style={style}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
    >{children}</motion.section>
  )
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
    >{children}</motion.div>
  )
}
