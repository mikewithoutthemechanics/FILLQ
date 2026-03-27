import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  Zap,
  MessageCircle,
  Shield,
  ArrowRight,
  Star,
  ChevronRight,
  Check,
  Play
} from 'lucide-react'

/* ── Colours ────────────────────────────────────────────── */
const C = {
  green: { deep: '#2D5016', mid: '#4A7C28', light: '#8BAA6B', pale: '#E8F0DE', wash: '#F4F8EF' },
  red:   { deep: '#6B1D1D', mid: '#8B3A3A', accent: '#A85454' },
  text:  '#1A1A1A',
  muted: '#6B6B6B',
  border:'#E5E5E5',
  white: '#FAFAF8',
}

/* ── Reusable section wrapper ──────────────────────────── */
function Section({ children, className = '', id, bg = 'bg-transparent' }: {
  children: React.ReactNode; className?: string; id?: string; bg?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.section
      ref={ref} id={id}
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className={`${bg} ${className}`}
    >
      {children}
    </motion.section>
  )
}

/* ── Parallax floating shape ───────────────────────────── */
function FloatingShape({ className, delay = 0, style }: { className: string; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 0.12, scale: 1 }}
      transition={{ duration: 2, delay }}
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      style={style}
    />
  )
}

/* ═══════════════════════════════════════════════════════ */
export default function Landing() {
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.96])

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.white, color: C.text }}>
      {/* ── Parallax background shapes ─────────────────── */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <FloatingShape className="w-[600px] h-[600px] -top-20 -left-32" style={{ background: C.green.pale }} delay={0} />
        <FloatingShape className="w-[500px] h-[500px] top-1/3 -right-24" style={{ background: '#F0E8E0' }} delay={0.4} />
        <FloatingShape className="w-[400px] h-[400px] bottom-0 left-1/4" style={{ background: C.green.wash }} delay={0.8} />
      </div>

      {/* ── NAV ─────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ backgroundColor: 'rgba(250,250,248,0.85)', borderColor: C.border }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 lg:px-12 py-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.green.deep }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>FillIQ</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
            <a href="#services" className="hover:text-black transition-colors">Services</a>
            <a href="#how" className="hover:text-black transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm transition-colors" style={{ color: C.muted }}>Sign In</Link>
            <Link to="/login"
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: C.green.deep }}
            >Get Started</Link>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <Section className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 pt-20 pb-28 lg:pt-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8"
              style={{ backgroundColor: C.green.pale, color: C.green.deep, fontFamily: "'DM Sans', sans-serif" }}
            >
              <Star className="w-3.5 h-3.5 fill-current" style={{ color: C.red.mid }} />
              Rated 5.0 from 200+ reviews
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-5xl lg:text-7xl leading-[1.08] tracking-tight"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Every empty<br />
              spot is<br />
              <span style={{ color: C.green.deep }}>lost revenue.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-7 text-lg max-w-md leading-relaxed"
              style={{ color: C.muted, fontFamily: "'DM Sans', sans-serif" }}
            >
              FillIQ predicts no-shows, fills cancelled spots via WhatsApp in 60 seconds, and stops members from leaving — before you even notice.
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link to="/login"
                className="group inline-flex items-center gap-2.5 px-7 py-4 rounded-full text-base font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: C.green.deep, fontFamily: "'DM Sans', sans-serif" }}
              >
                Start free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full text-base font-medium border transition-all hover:bg-black/5"
                style={{ borderColor: C.border, fontFamily: "'DM Sans', sans-serif" }}
              >
                <Play className="w-4 h-4" /> Watch demo
              </button>
            </motion.div>

            {/* Social proof */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="mt-12 flex items-center gap-4"
            >
              <div className="flex -space-x-2.5">
                {[C.green.deep, C.red.deep, '#3B6B2A', '#7A3B3B'].map((c, i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: c, borderColor: C.white }}
                  >{['SJ','MS','EW','LD'][i]}</div>
                ))}
              </div>
              <div className="text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <div className="flex items-center gap-0.5" style={{ color: C.red.mid }}>
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <span style={{ color: C.muted }}>Loved by 50+ SA studios</span>
              </div>
            </motion.div>
          </div>

          {/* ── Hero visual: parallax dashboard ────────── */}
          <motion.div style={{ y: heroY, scale: heroScale }} className="relative flex items-center justify-center">
            {/* Ambient blurs */}
            <div className="absolute w-[380px] h-[380px] rounded-full blur-[100px] opacity-30" style={{ background: C.green.pale }} />
            <div className="absolute w-[280px] h-[280px] rounded-full blur-[80px] opacity-20 translate-x-20 translate-y-12" style={{ background: '#EDE4DC' }} />

            <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl"
              style={{ border: `1px solid ${C.border}`, backgroundColor: '#fff' }}
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: '#F5F5F3', borderBottom: `1px solid ${C.border}` }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#E07A5F' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#F2CC8F' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: C.green.light }} />
                <span className="ml-2 text-[10px]" style={{ color: C.muted }}>filliq.vercel.app</span>
              </div>

              <div className="p-5 space-y-4">
                {/* Metric cards */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: 'R4,320', l: 'Recovered', accent: C.green.deep },
                    { v: '18', l: 'Spots Filled', accent: C.red.mid },
                    { v: '86%', l: 'Fill Rate', accent: C.green.mid },
                    { v: '3', l: 'Saved', accent: C.red.accent },
                  ].map((card, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className="rounded-xl p-3.5"
                      style={{ backgroundColor: C.green.wash, border: `1px solid ${C.green.pale}` }}
                    >
                      <div className="text-lg font-bold" style={{ color: card.accent, fontFamily: "'DM Serif Display', serif" }}>{card.v}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: C.muted }}>{card.l}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Mini bar chart */}
                <div className="rounded-xl p-4 flex items-end gap-1.5 h-20"
                  style={{ backgroundColor: '#FAFAF8', border: `1px solid ${C.border}` }}
                >
                  {[35, 60, 45, 75, 50, 85, 65, 90, 55, 80, 70, 95].map((h, i) => (
                    <motion.div key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 1 + i * 0.04, duration: 0.4 }}
                      className="flex-1 rounded-sm"
                      style={{ backgroundColor: i % 2 === 0 ? C.green.deep : C.green.light }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating notification - WhatsApp */}
            <motion.div
              initial={{ opacity: 0, x: 24, y: 16 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 1.4 }}
              className="absolute -bottom-3 -right-3 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3"
              style={{ backgroundColor: C.green.deep }}
            >
              <MessageCircle className="w-5 h-5 text-white" />
              <div className="text-white">
                <div className="text-xs font-bold">WhatsApp Sent</div>
                <div className="text-xs opacity-75">Spot filled in 8 min ✓</div>
              </div>
            </motion.div>

            {/* Floating risk badge */}
            <motion.div
              initial={{ opacity: 0, x: -24, y: -16 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 1.6 }}
              className="absolute -top-3 -left-3 rounded-2xl px-4 py-3 shadow-lg"
              style={{ backgroundColor: C.red.deep }}
            >
              <div className="text-white text-xs font-bold">⚠ Risk Score: 85</div>
              <div className="text-white text-xs opacity-75">Likely no-show</div>
            </motion.div>
          </motion.div>
        </div>
      </Section>

      {/* ── SERVICES ────────────────────────────────────── */}
      <Section id="services" className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 py-24">
        <p className="text-sm font-medium tracking-wide uppercase mb-3" style={{ color: C.green.deep, fontFamily: "'DM Sans', sans-serif" }}>Our Services</p>
        <h2 className="text-4xl lg:text-5xl leading-tight max-w-lg" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Three ways we keep your studio <span style={{ color: C.green.mid }}>full</span>
        </h2>
        <p className="mt-4 max-w-xl" style={{ color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
          Predict cancellations, auto-fill empty spots, and retain at-risk members.
        </p>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: 'No-Show Predictor', desc: 'AI scores every booking 0-100. Know who\'s flaking before they do.', accent: C.green.deep, tag: 'Predict' },
            { icon: MessageCircle, title: 'Auto-Fill Engine', desc: 'Cancelled spot? WhatsApp fires in 60 seconds. First reply wins.', accent: C.red.mid, tag: 'Fill' },
            { icon: Shield, title: 'Churn Radar', desc: 'Catches disengaging members early. Auto-nudge saves them.', accent: C.green.mid, tag: 'Retain' },
          ].map((svc, i) => (
            <motion.div key={i} whileHover={{ y: -6 }} transition={{ duration: 0.25 }}
              className="group rounded-2xl p-8 transition-colors"
              style={{ backgroundColor: '#fff', border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.green.pale }}>
                  <svc.icon className="w-6 h-6" style={{ color: svc.accent }} />
                </div>
                <span className="text-xs font-medium" style={{ color: C.muted }}>{svc.tag}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>{svc.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>{svc.desc}</p>
              <div className="mt-6 flex items-center gap-1.5 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: C.green.deep }}
              >Learn more <ChevronRight className="w-4 h-4" /></div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <Section id="how" className="relative z-10 py-24" bg="py-24" >
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <p className="text-sm font-medium tracking-wide uppercase mb-3" style={{ color: C.green.deep, fontFamily: "'DM Sans', sans-serif" }}>How It Works</p>
          <h2 className="text-4xl lg:text-5xl leading-tight max-w-2xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Your studio, <span style={{ color: C.green.mid }}>always full</span>
          </h2>

          <div className="mt-14 grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Class Intelligence', desc: 'FillIQ scores every booking and predicts no-shows 3 hours before class. From soothing morning flows to packed evening sessions.', accent: C.green.deep },
              { step: '02', title: 'Instant Recovery', desc: 'When a spot opens, our AI selects the best waitlist candidate and fires a WhatsApp in 60 seconds. First reply gets the spot.', accent: C.red.mid },
              { step: '03', title: 'Member Retention', desc: 'Our churn radar catches disengaging members before they leave. Auto-nudges, rebook invites, and smart offers keep them on the mat.', accent: C.green.mid },
            ].map((item, i) => (
              <div key={i}>
                <div className="text-6xl font-black mb-4" style={{ color: C.green.pale, fontFamily: "'DM Serif Display', serif" }}>{item.step}</div>
                <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>{item.desc}</p>
                <div className="mt-6 h-1 w-12 rounded-full" style={{ backgroundColor: item.accent }} />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── STATS ───────────────────────────────────────── */}
      <Section className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 py-24">
        <div className="rounded-3xl p-10 lg:p-16" style={{ backgroundColor: C.green.wash, border: `1px solid ${C.green.pale}` }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { v: 'R2.1M', l: 'Revenue Recovered' },
              { v: '3,400+', l: 'Spots Filled' },
              { v: '94%', l: 'Fill Rate' },
              { v: '8 min', l: 'Avg Fill Time' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="text-3xl lg:text-4xl font-bold" style={{ color: C.green.deep, fontFamily: "'DM Serif Display', serif" }}>{s.v}</div>
                <div className="text-sm mt-1" style={{ color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>{s.l}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── PRICING ─────────────────────────────────────── */}
      <Section id="pricing" className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 py-24">
        <p className="text-sm font-medium tracking-wide uppercase mb-3" style={{ color: C.green.deep, fontFamily: "'DM Sans', sans-serif" }}>Pricing</p>
        <h2 className="text-4xl lg:text-5xl leading-tight max-w-xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Simple plans for a <span style={{ color: C.green.mid }}>full studio</span>
        </h2>

        <div className="mt-14 grid md:grid-cols-4 gap-5">
          {[
            { name: 'Starter', price: 'Free', desc: 'For trying FillIQ out', features: ['1 studio', '50 bookings/mo', 'Risk scoring', 'Email support'], highlight: false },
            { name: 'Growth', price: 'R299', desc: 'per month', features: ['1 studio', '500 bookings/mo', 'Auto-fill via WhatsApp', 'Churn radar', 'Dashboard'], highlight: true },
            { name: 'Studio Pro', price: 'R599', desc: 'per month', features: ['Up to 3 studios', 'Unlimited bookings', 'Priority WhatsApp', 'API access', 'Custom reports'], highlight: false },
            { name: 'Enterprise', price: 'Custom', desc: 'For chains & franchises', features: ['Unlimited studios', 'White-label option', 'Dedicated support', 'Custom integrations'], highlight: false },
          ].map((plan, i) => (
            <motion.div key={i} whileHover={{ y: -4 }}
              className="rounded-2xl p-7 transition-colors"
              style={{
                backgroundColor: plan.highlight ? C.green.wash : '#fff',
                border: `1px solid ${plan.highlight ? C.green.light : C.border}`,
              }}
            >
              <h3 className="text-base font-semibold" style={{ color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>{plan.name}</h3>
              <div className="mt-3 text-4xl font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>{plan.price}</div>
              <p className="text-xs mt-1" style={{ color: C.muted }}>{plan.desc}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: C.green.deep }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/login"
                className="mt-8 block text-center py-3 rounded-full text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: plan.highlight ? C.green.deep : 'transparent',
                  color: plan.highlight ? '#fff' : C.text,
                  border: plan.highlight ? 'none' : `1px solid ${C.border}`,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >{plan.highlight ? 'Get Started' : 'Choose Plan'}</Link>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <Section className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 py-24 text-center">
        <h2 className="text-4xl lg:text-6xl leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Ready to fill<br />every class?
        </h2>
        <p className="mt-5 text-lg" style={{ color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>
          Join South Africa's smartest yoga & pilates studios.
        </p>
        <Link to="/login"
          className="group inline-flex items-center gap-2.5 mt-10 px-9 py-4 rounded-full text-lg font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: C.green.deep, fontFamily: "'DM Sans', sans-serif" }}
        >Get started free <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" /></Link>
      </Section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="relative z-10 border-t py-12 px-6" style={{ borderColor: C.border }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: C.green.deep }} />
            <span className="font-semibold" style={{ fontFamily: "'DM Serif Display', serif" }}>FillIQ</span>
          </div>
          <p className="text-sm" style={{ color: C.muted, fontFamily: "'DM Sans', sans-serif" }}>Built for South African studios 🇿🇦</p>
        </div>
      </footer>
    </div>
  )
}
