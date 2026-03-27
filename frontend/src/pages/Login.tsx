import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react'
import { supabase } from '../hooks/useSupabase'

export default function Login() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setError('Check your email for confirmation link!')
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
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12 bg-gradient-to-br from-violet-900/30 to-fuchsia-900/20">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">FillIQ</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-md"
        >
          <h1 className="text-4xl font-extrabold leading-tight mb-6">
            Your classes deserve to be{' '}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              full.
            </span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            AI-powered no-show prevention that works while you sleep. Predict, fill, retain.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-2">
              {['bg-violet-500', 'bg-fuchsia-500', 'bg-cyan-500'].map((bg, i) => (
                <div key={i} className={`w-8 h-8 ${bg} rounded-full border-2 border-gray-950`} />
              ))}
            </div>
            <p className="text-sm text-gray-500">Join 50+ SA studios</p>
          </div>
        </motion.div>

        <p className="text-sm text-gray-600">© 2026 FillIQ. Built in South Africa 🇿🇦</p>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">FillIQ</span>
          </Link>

          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span className="text-sm text-violet-400 font-medium">Welcome</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {isSignUp ? 'Create your account' : 'Sign in to FillIQ'}
          </h2>
          <p className="text-gray-400 mb-8">
            {isSignUp ? 'Start recovering revenue today' : 'Welcome back — let\'s fill some classes'}
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@studio.com"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-4 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl text-lg font-bold hover:shadow-lg hover:shadow-violet-500/25 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError('') }}
                className="text-violet-400 font-semibold hover:text-violet-300 transition-colors"
              >
                {isSignUp ? 'Sign In' : 'Sign Up Free'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
