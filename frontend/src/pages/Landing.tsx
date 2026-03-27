import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  Zap,
  Users,
  BarChart3,
  MessageCircle,
  Shield,
  ArrowRight,
  Sparkles,
  ChevronDown
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  })
}

const float = {
  animate: {
    y: [0, -12, 0],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const }
  }
}

const glow = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(124, 58, 237, 0.3)',
      '0 0 40px rgba(124, 58, 237, 0.5)',
      '0 0 20px rgba(124, 58, 237, 0.3)'
    ],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const }
  }
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-50 flex items-center justify-between px-6 lg:px-12 py-6"
      >
        <div className="flex items-center gap-3">
          <motion.div
            {...glow}
            className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center"
          >
            <TrendingUp className="w-6 h-6 text-white" />
          </motion.div>
          <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            FillIQ
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            Sign In
          </Link>
          <Link
            to="/login"
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all hover:scale-105"
          >
            Get Started
          </Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-20 lg:pt-32 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300 text-sm mb-8"
            >
              <Sparkles className="w-4 h-4" />
              AI-Powered No-Show Prevention
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
              className="text-5xl lg:text-7xl font-extrabold leading-tight"
            >
              Stop losing
              <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                revenue to
              </span>
              <span className="block bg-gradient-to-r from-fuchsia-400 to-orange-400 bg-clip-text text-transparent">
                no-shows.
              </span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
              className="mt-8 text-xl text-gray-400 max-w-lg leading-relaxed"
            >
              FillIQ predicts cancellations, fills spots automatically via WhatsApp, and stops members from churning — all before you even notice.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link
                to="/login"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl text-lg font-bold hover:shadow-2xl hover:shadow-violet-500/30 transition-all hover:scale-105"
              >
                Start Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 border border-gray-700 rounded-2xl text-lg font-semibold text-gray-300 hover:border-gray-500 hover:text-white transition-all">
                Watch Demo
              </button>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={4}
              className="mt-12 flex items-center gap-6"
            >
              <div className="flex -space-x-3">
                {['bg-violet-500', 'bg-fuchsia-500', 'bg-cyan-500', 'bg-orange-500'].map((bg, i) => (
                  <div key={i} className={`w-10 h-10 ${bg} rounded-full border-2 border-gray-950 flex items-center justify-center text-xs font-bold`}>
                    {['SJ', 'MS', 'EW', 'JB'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">Trusted by 50+ SA studios</p>
              </div>
            </motion.div>
          </div>

          {/* 3D Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 60, rotateY: -15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="relative perspective-1000"
          >
            <motion.div {...float} className="relative">
              <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 shadow-2xl shadow-violet-500/10">
                {/* Dashboard mock */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs text-gray-500">filliq.vercel.app</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: 'Revenue Recovered', value: 'R4,320', color: 'from-green-400 to-emerald-500', icon: '💰' },
                    { label: 'Spots Filled', value: '18', color: 'from-violet-400 to-purple-500', icon: '🧘' },
                    { label: 'Fill Rate', value: '86%', color: 'from-cyan-400 to-blue-500', icon: '📈' },
                    { label: 'Churns Prevented', value: '3', color: 'from-orange-400 to-red-500', icon: '🛡️' },
                  ].map((card, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.15 }}
                      className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50"
                    >
                      <div className="text-2xl mb-2">{card.icon}</div>
                      <div className={`text-2xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                        {card.value}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{card.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Mini chart */}
                <div className="bg-gray-800/30 rounded-2xl p-4 border border-gray-700/30">
                  <div className="flex items-end gap-1.5 h-20">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 1.2 + i * 0.05, duration: 0.5 }}
                        className="flex-1 bg-gradient-to-t from-violet-600 to-fuchsia-500 rounded-t-sm"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating WhatsApp notification */}
              <motion.div
                initial={{ opacity: 0, x: 30, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1.5, duration: 0.6 }}
                className="absolute -bottom-4 -right-4 bg-green-500/90 backdrop-blur rounded-2xl px-4 py-3 shadow-xl shadow-green-500/20 flex items-center gap-3"
              >
                <MessageCircle className="w-5 h-5" />
                <div>
                  <div className="text-xs font-bold">WhatsApp Sent</div>
                  <div className="text-xs opacity-80">Spot filled in 8 min ✓</div>
                </div>
              </motion.div>

              {/* Floating score badge */}
              <motion.div
                initial={{ opacity: 0, x: -30, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1.8, duration: 0.6 }}
                className="absolute -top-4 -left-4 bg-orange-500/90 backdrop-blur rounded-2xl px-4 py-3 shadow-xl shadow-orange-500/20"
              >
                <div className="text-xs font-bold">⚠️ Risk Score: 85</div>
                <div className="text-xs opacity-80">Likely no-show</div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex justify-center mt-16"
        >
          <ChevronDown className="w-6 h-6 text-gray-600" />
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl lg:text-5xl font-extrabold">
            How{' '}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              FillIQ
            </span>{' '}
            works
          </h2>
          <p className="mt-4 text-xl text-gray-400">Three steps to full classes</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Zap,
              title: 'Predict',
              desc: 'AI scores every booking 0-100 for no-show risk. You know who\'s flaking before they do.',
              gradient: 'from-violet-500 to-purple-600',
              bg: 'bg-violet-500/10',
              number: '01'
            },
            {
              icon: MessageCircle,
              title: 'Auto-Fill',
              desc: 'Cancelled? WhatsApp goes out in 60 seconds. First reply gets the spot. No human needed.',
              gradient: 'from-fuchsia-500 to-pink-600',
              bg: 'bg-fuchsia-500/10',
              number: '02'
            },
            {
              icon: Shield,
              title: 'Retain',
              desc: 'Churn radar catches disengaging members early. Auto-nudge saves them before they leave.',
              gradient: 'from-cyan-500 to-blue-600',
              bg: 'bg-cyan-500/10',
              number: '03'
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative bg-gray-900/50 backdrop-blur border border-gray-800 rounded-3xl p-8 hover:border-gray-700 transition-all"
            >
              <div className="absolute top-6 right-6 text-6xl font-black text-gray-800/50">
                {feature.number}
              </div>
              <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6`}>
                <feature.icon className={`w-7 h-7 bg-gradient-to-r ${feature.gradient} bg-clip-text`} style={{ color: 'transparent', backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                <div className={`absolute w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-20`} />
              </div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24">
        <div className="bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-cyan-600/20 border border-gray-800 rounded-3xl p-12 lg:p-16">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: 'R2.1M', label: 'Revenue Recovered', color: 'from-green-400 to-emerald-400' },
              { value: '3,400+', label: 'Spots Filled', color: 'from-violet-400 to-purple-400' },
              { value: '94%', label: 'Fill Rate', color: 'from-cyan-400 to-blue-400' },
              { value: '8min', label: 'Avg Fill Time', color: 'from-orange-400 to-red-400' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={`text-4xl lg:text-5xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <div className="text-gray-400 mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl lg:text-6xl font-extrabold">
            Ready to{' '}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">
              fill every class?
            </span>
          </h2>
          <p className="mt-6 text-xl text-gray-400">
            Join South Africa's smartest yoga & pilates studios.
          </p>
          <Link
            to="/login"
            className="group inline-flex items-center gap-3 mt-10 px-10 py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl text-xl font-bold hover:shadow-2xl hover:shadow-violet-500/30 transition-all hover:scale-105"
          >
            Start Free — No Card Needed
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            <span className="font-bold text-gray-400">FillIQ</span>
          </div>
          <p className="text-sm text-gray-600">
            Built for South African studios 🇿🇦
          </p>
        </div>
      </footer>
    </div>
  )
}
