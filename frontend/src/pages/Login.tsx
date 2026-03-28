import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'
import { supabase } from '../hooks/useSupabase'

const C = {
  g: { 900: '#1B3A0A', 800: '#2D5016', 700: '#3D6B22', 600: '#4A7C28', 400: '#8BAA6B', 200: '#D4E4C8', 100: '#E8F0DE', 50: '#F4F8EF' },
  a: { 700: '#7A2000', 600: '#D4451A' },
  t: { 900: '#0F0F0F', 700: '#2D2D2D', 500: '#6B6B6B', 400: '#8A8A8A', 300: '#ABABAB' },
  b: '#E5E5E5',
  w: '#FAFAF8',
}
const font = { display: "'Francy Regular', 'General Sans', sans-serif", body: "'General Sans', 'Satoshi', sans-serif" }

export default function Login() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email above first, then click "Forgot password?"')
      return
    }
    setResetting(true)
    setError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      setResetSent(true)
    } catch (err: any) {
      setError(err.message || 'Could not send reset email')
    } finally {
      setResetting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setError('Check your email for a confirmation link.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: C.w, color: C.t[900] }}>

      {/* ── Left panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden" style={{ backgroundColor: C.g[800] }}>
        {/* Ambient shapes */}
        <div className="absolute inset-0">
          <div className="absolute w-[500px] h-[500px] rounded-full -top-20 -left-20 opacity-10"
            style={{ background: `radial-gradient(circle, ${C.g[400]}, transparent 70%)` }} />
          <div className="absolute w-[400px] h-[400px] rounded-full bottom-0 right-0 opacity-10"
            style={{ background: `radial-gradient(circle, ${C.a[600]}, transparent 70%)` }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link to="/landing" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white" style={{ fontFamily: font.display }}>WaitUp</span>
          </Link>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-md"
          >
            <h1 className="text-[2.8rem] leading-[1.08] text-white" style={{ fontFamily: font.display }}>
              Your classes<br />deserve to be<br />
              <span style={{ color: C.g[200] }}>full.</span>
            </h1>
            <p className="mt-6 text-[15px] leading-relaxed text-white/60" style={{ fontFamily: font.body }}>
              AI-powered no-show prevention that works while you sleep. Predict, fill, retain.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                {['#fff', '#D4E4C8', '#F5D8CC'].map((bg, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[9px] font-bold"
                    style={{ backgroundColor: bg, borderColor: C.g[800], color: C.g[900] }}
                  >{['SJ','MS','EW'][i]}</div>
                ))}
              </div>
              <p className="text-[12px] text-white/40">50+ SA studios</p>
            </div>
          </motion.div>

          {/* Footer */}
          <p className="text-[12px] text-white/30" style={{ fontFamily: font.body }}>© 2026 WaitUp · Built in South Africa 🇿🇦</p>
        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────── */}
      <div className="w-full lg:w-[52%] flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <Link to="/landing" className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.g[800] }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold" style={{ fontFamily: font.display }}>WaitUp</span>
          </Link>

          <p className="text-[12px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: C.g[700], fontFamily: font.body }}>
            {isSignUp ? 'Create account' : 'Welcome back'}
          </p>
          <h2 className="text-[28px] font-bold leading-tight" style={{ fontFamily: font.display }}>
            {isSignUp ? 'Start recovering revenue' : 'Sign in to WaitUp'}
          </h2>
          <p className="mt-2 text-[14px]" style={{ color: C.t[500], fontFamily: font.body }}>
            {isSignUp ? 'Free to start. No card needed.' : 'Let\'s fill some classes.'}
          </p>

          {/* Error / success */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-5 p-3.5 rounded-xl text-[13px]"
              style={{
                backgroundColor: error.includes('email') ? C.g[50] : '#FDF2F2',
                border: `1px solid ${error.includes('email') ? C.g[200] : '#F5C6C6'}`,
                color: error.includes('email') ? C.g[800] : C.a[700],
                fontFamily: font.body,
              }}
            >{error}</motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: C.t[700], fontFamily: font.body }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px]" style={{ color: C.t[300] }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@studio.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-[14px] outline-none transition-all"
                  style={{
                    backgroundColor: '#fff',
                    border: `1.5px solid ${C.b}`,
                    fontFamily: font.body,
                  }}
                  onFocus={e => e.target.style.borderColor = C.g[600]}
                  onBlur={e => e.target.style.borderColor = C.b}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: C.t[700], fontFamily: font.body }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px]" style={{ color: C.t[300] }} />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3.5 rounded-xl text-[14px] outline-none transition-all"
                  style={{
                    backgroundColor: '#fff',
                    border: `1.5px solid ${C.b}`,
                    fontFamily: font.body,
                  }}
                  onFocus={e => e.target.style.borderColor = C.g[600]}
                  onBlur={e => e.target.style.borderColor = C.b}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: C.t[300] }}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Forgot */}
            {!isSignUp && (
              <div className="flex justify-end">
                <button type="button" onClick={handleForgotPassword} disabled={resetting}
                  className="text-[12px] transition-colors disabled:opacity-50"
                  style={{ color: C.g[700], fontFamily: font.body }}
                >
                  {resetting ? 'Sending...' : 'Forgot password?'}
                </button>
              </div>
            )}

            {/* Reset success */}
            {resetSent && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl text-[13px] flex items-center gap-2"
                style={{ backgroundColor: C.g[50], border: `1px solid ${C.g[200]}`, color: C.g[800], fontFamily: font.body }}
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Password reset link sent. Check your email.
              </motion.div>
            )}

            {/* Submit */}
            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-semibold text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: C.g[800], fontFamily: font.body }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-[14px]" style={{ color: C.t[500], fontFamily: font.body }}>
              {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}{' '}
              <button onClick={() => { setIsSignUp(!isSignUp); setError('') }}
                className="font-semibold transition-colors"
                style={{ color: C.g[800], fontFamily: font.body }}
              >{isSignUp ? 'Sign in' : 'Sign up free'}</button>
            </p>
          </div>

          {/* Demo login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                localStorage.setItem('filliq_onboarded', 'false')
                localStorage.setItem('filliq_studio_id', 'demo-studio')
                localStorage.setItem('filliq_studio_name', 'Demo Studio')
                navigate('/onboarding')
              }}
              className="text-[12px] underline transition-colors"
              style={{ color: C.t[400], fontFamily: font.body }}
            >
              Skip login — demo mode
            </button>
          </div>

          {/* Dev mode */}
          <div className="mt-3 text-center">
            <button
              onClick={() => {
                localStorage.setItem('filliq_onboarded', 'true')
                localStorage.setItem('filliq_studio_id', 'demo-studio')
                localStorage.setItem('filliq_studio_name', 'Demo Studio')
                navigate('/')
              }}
              className="text-[12px] underline transition-colors"
              style={{ color: C.t[300], fontFamily: font.body }}
            >
              ⚡ Dev → dashboard
            </button>
          </div>

          {/* Back to landing */}
          <div className="mt-8 text-center">
            <Link to="/landing" className="text-[12px] transition-colors" style={{ color: C.t[400], fontFamily: font.body }}>
              ← Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
