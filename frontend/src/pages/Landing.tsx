import { motion, useInView } from 'framer-motion'
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
  Play,
  Check
} from 'lucide-react'

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ===== NAV ===== */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#7c3aed] to-[#c084fc] rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">FillIQ</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#how" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-300 hover:text-white transition-colors">Sign In</Link>
            <Link
              to="/login"
              className="px-5 py-2.5 bg-white text-[#0a0a0f] rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <Section className="max-w-6xl mx-auto px-6 pt-20 pb-24 lg:pt-32 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7c3aed]/10 border border-[#7c3aed]/20 rounded-full text-[#c084fc] text-sm mb-8">
              <Star className="w-3.5 h-3.5 fill-current" />
              Rated 5.0 from 200+ reviews
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              Explore the
              <span className="block text-[#c084fc]">path to</span>
              <span className="block bg-gradient-to-r from-[#7c3aed] via-[#c084fc] to-[#f0abfc] bg-clip-text text-transparent">
                full classes.
              </span>
            </h1>

            <p className="mt-7 text-lg text-gray-400 max-w-md leading-relaxed">
              Let AI handle no-shows, churn, and empty spots — so you can focus on what you do best: teaching.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/login"
                className="group inline-flex items-center gap-2.5 px-7 py-4 bg-[#7c3aed] rounded-full text-base font-semibold hover:bg-[#6d28d9] transition-colors"
              >
                Start your journey
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button className="inline-flex items-center gap-2.5 px-7 py-4 border border-white/10 rounded-full text-base font-medium hover:border-white/25 transition-colors">
                <Play className="w-4 h-4" />
                Watch demo
              </button>
            </div>

            <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {['#7c3aed', '#c084fc', '#22d3ee', '#f97316'].map((c, i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: c }}>
                    {['SJ', 'MS', 'EW', 'LD'][i]}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-0.5 text-yellow-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <span className="text-gray-500">Loved by 50+ studios across SA</span>
              </div>
            </div>
          </div>

          {/* Hero image — abstract gradient shape */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-[400px] h-[400px] bg-[#7c3aed]/20 rounded-full blur-[100px]" />
            <div className="absolute w-[300px] h-[300px] bg-[#c084fc]/15 rounded-full blur-[80px] translate-x-16 translate-y-10" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative w-full max-w-md aspect-square bg-gradient-to-br from-[#7c3aed]/20 to-[#c084fc]/10 border border-white/10 rounded-[2.5rem] flex items-center justify-center overflow-hidden"
            >
              {/* Mini dashboard mock */}
              <div className="w-[85%] space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: 'R4,320', l: 'Recovered', c: '#22c55e' },
                    { v: '18', l: 'Spots Filled', c: '#c084fc' },
                    { v: '86%', l: 'Fill Rate', c: '#22d3ee' },
                    { v: '3', l: 'Saved', c: '#f97316' },
                  ].map((card, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.12 }}
                      className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4"
                    >
                      <div className="text-xl font-bold" style={{ color: card.c }}>{card.v}</div>
                      <div className="text-[10px] text-gray-500 mt-1">{card.l}</div>
                    </motion.div>
                  ))}
                </div>
                {/* Mini bar chart */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 flex items-end gap-1.5 h-24">
                  {[35, 60, 45, 75, 50, 85, 65, 90, 55, 80, 70, 95].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 1 + i * 0.04, duration: 0.4 }}
                      className="flex-1 rounded-sm"
                      style={{ background: `linear-gradient(to top, #7c3aed, #c084fc)` }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ===== SERVICES ===== */}
      <Section id="services" className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-sm text-[#c084fc] font-medium tracking-wide uppercase mb-3">Our Services</p>
        <h2 className="text-4xl lg:text-5xl font-bold leading-tight max-w-lg">
          Our services for a <span className="text-[#c084fc]">healthy studio</span>
        </h2>
        <p className="mt-4 text-gray-400 max-w-xl">
          Explore how FillIQ keeps your classes full, your members happy, and your revenue growing.
        </p>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: 'No-Show Predictor',
              desc: 'AI scores every booking 0-100. Know who\'s flaking before they do.',
              tag: 'Predict'
            },
            {
              icon: MessageCircle,
              title: 'Auto-Fill Engine',
              desc: 'Cancelled spot? WhatsApp fires in 60 seconds. First reply wins.',
              tag: 'Fill'
            },
            {
              icon: Shield,
              title: 'Churn Radar',
              desc: 'Catches disengaging members early. Auto-nudge saves them.',
              tag: 'Retain'
            }
          ].map((svc, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25 }}
              className="group bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 hover:border-[#7c3aed]/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-[#7c3aed]/10 rounded-2xl flex items-center justify-center">
                  <svc.icon className="w-6 h-6 text-[#c084fc]" />
                </div>
                <span className="text-xs text-gray-600 font-medium">{svc.tag}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{svc.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{svc.desc}</p>
              <div className="mt-6 flex items-center gap-1.5 text-sm text-[#c084fc] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ChevronRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== HOW IT WORKS ===== */}
      <Section id="how" className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-sm text-[#c084fc] font-medium tracking-wide uppercase mb-3">Yoga Spirit</p>
        <h2 className="text-4xl lg:text-5xl font-bold leading-tight max-w-2xl">
          FillIQ is committed to your <span className="text-[#c084fc]">studio's growth</span>
        </h2>

        <div className="mt-14 grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Class Intelligence',
              desc: 'Immerse yourself in data-driven insights. FillIQ scores every booking and predicts no-shows 3 hours before class — from soothing morning flows to packed evening sessions.',
              accent: '#7c3aed'
            },
            {
              step: '02',
              title: 'Instant Recovery',
              desc: 'When a spot opens, our AI selects the best waitlist candidate and fires a WhatsApp in 60 seconds. First reply gets the spot. No human needed.',
              accent: '#c084fc'
            },
            {
              step: '03',
              title: 'Member Retention',
              desc: 'Our churn radar catches disengaging members before they leave. Auto-nudges, rebook invites, and smart offers keep them on the mat.',
              accent: '#22d3ee'
            }
          ].map((item, i) => (
            <div key={i} className="relative">
              <div className="text-6xl font-black text-white/[0.04] mb-4">{item.step}</div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              <div className="mt-6 h-1 w-12 rounded-full" style={{ backgroundColor: item.accent }} />
            </div>
          ))}
        </div>
      </Section>

      {/* ===== STATS BANNER ===== */}
      <Section className="max-w-6xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-r from-[#7c3aed]/10 via-[#c084fc]/5 to-[#22d3ee]/10 border border-white/[0.06] rounded-[2rem] p-10 lg:p-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { v: 'R2.1M', l: 'Revenue Recovered' },
              { v: '3,400+', l: 'Spots Filled' },
              { v: '94%', l: 'Fill Rate' },
              { v: '8 min', l: 'Avg Fill Time' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl lg:text-4xl font-bold text-[#c084fc]">{s.v}</div>
                <div className="text-sm text-gray-500 mt-1">{s.l}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ===== PRICING ===== */}
      <Section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-sm text-[#c084fc] font-medium tracking-wide uppercase mb-3">Features</p>
        <h2 className="text-4xl lg:text-5xl font-bold leading-tight max-w-xl">
          Our plan for a <span className="text-[#c084fc]">full studio</span>
        </h2>

        <div className="mt-14 grid md:grid-cols-4 gap-5">
          {[
            {
              name: 'Starter',
              price: 'Free',
              desc: 'For trying FillIQ out',
              features: ['1 studio', '50 bookings/mo', 'Risk scoring', 'Email support'],
              cta: 'Start Free',
              highlight: false
            },
            {
              name: 'Growth',
              price: 'R299',
              desc: 'per month',
              features: ['1 studio', '500 bookings/mo', 'Auto-fill via WhatsApp', 'Churn radar', 'Dashboard'],
              cta: 'Get Started',
              highlight: true
            },
            {
              name: 'Studio Pro',
              price: 'R599',
              desc: 'per month',
              features: ['Up to 3 studios', 'Unlimited bookings', 'Priority WhatsApp', 'API access', 'Custom reports'],
              cta: 'Go Pro',
              highlight: false
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              desc: 'For chains & franchises',
              features: ['Unlimited studios', 'White-label option', 'Dedicated support', 'Custom integrations'],
              cta: 'Contact Us',
              highlight: false
            }
          ].map((plan, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              className={`rounded-3xl p-7 border transition-colors ${
                plan.highlight
                  ? 'bg-[#7c3aed]/10 border-[#7c3aed]/30'
                  : 'bg-white/[0.03] border-white/[0.06] hover:border-white/10'
              }`}
            >
              <h3 className="text-base font-semibold text-gray-300">{plan.name}</h3>
              <div className="mt-3 text-4xl font-bold">{plan.price}</div>
              <p className="text-xs text-gray-500 mt-1">{plan.desc}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-[#c084fc] mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className={`mt-8 block text-center py-3 rounded-full text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== FINAL CTA ===== */}
      <Section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
          A better path to
          <span className="block bg-gradient-to-r from-[#7c3aed] via-[#c084fc] to-[#f0abfc] bg-clip-text text-transparent">
            a full studio
          </span>
        </h2>
        <p className="mt-5 text-lg text-gray-400">
          Discover the power of AI: Fill your classes & grow your revenue.
        </p>
        <Link
          to="/login"
          className="group inline-flex items-center gap-2.5 mt-10 px-9 py-4 bg-[#7c3aed] rounded-full text-lg font-semibold hover:bg-[#6d28d9] transition-colors"
        >
          Get started free
          <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </Section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#c084fc]" />
            <span className="font-semibold">FillIQ</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-sm text-gray-600">
            Built for South African studios 🇿🇦
          </p>
        </div>
      </footer>
    </div>
  )
}
