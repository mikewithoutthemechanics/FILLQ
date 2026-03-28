import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../hooks/useSupabase'
import {
  TrendingUp,
  Building2,
  MapPin,
  Clock,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles
} from 'lucide-react'

const C = {
  g: { 900: '#1B3A0A', 800: '#2D5016', 700: '#3D6B22', 600: '#4A7C28', 400: '#8BAA6B', 200: '#D4E4C8', 100: '#E8F0DE', 50: '#F4F8EF' },
  a: { 700: '#8B2500', 600: '#FF6B6B' },
  t: { 900: '#0F0F0F', 700: '#2D2D2D', 500: '#6B6B6B', 400: '#8A8A8A', 300: '#ABABAB' },
  b: '#E5E5E5',
  w: '#FAFAF8',
}
const font = { display: "'Francy Regular', 'General Sans', sans-serif", body: "'General Sans', 'Satoshi', sans-serif" }

const STEPS = ['Studio', 'Classes', 'WhatsApp', 'Done']

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  // Form state
  const [studioName, setStudioName] = useState('')
  const [studioLocation, setStudioLocation] = useState('')
  const [classTypes, setClassTypes] = useState<string[]>(['yoga'])
  const [defaultPrice, setDefaultPrice] = useState('150')
  const [whatsappNumber, setWhatsappNumber] = useState('')

  const allClassTypes = ['yoga', 'pilates', 'barre', 'reformer', 'spin', 'hiit', 'meditation']

  const toggleClass = (type: string) => {
    setClassTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      const studioId = `studio-${Date.now()}`
      const { data: { user } } = await supabase.auth.getUser()

      // Create studio settings
      await supabase.from('filliq_settings').upsert({
        studio_id: studioId,
        default_class_price: parseFloat(defaultPrice) || 150,
        auto_fill_enabled: true,
        rebook_nudge_enabled: true,
        studio_whatsapp_number: whatsappNumber || null,
        waba_provider: '360dialog',
      })

      // Create studio owner record
      if (user) {
        await supabase.from('studio_owners').upsert({
          user_id: user.id,
          studio_id: studioId,
          email: user.email || '',
        })
      }

      // Store studio ID in localStorage for the session
      localStorage.setItem('filliq_studio_id', studioId)
      localStorage.setItem('filliq_studio_name', studioName)
      localStorage.setItem('filliq_onboarded', 'true')

      setStep(3)
    } catch (err) {
      console.error('Onboarding error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: C.w }}>
      <div className="w-full max-w-[520px]">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full transition-colors duration-300"
                style={{ backgroundColor: i <= step ? C.g[800] : C.b }}
              />
            </div>
          ))}
        </div>

        {/* Step labels */}
        <div className="flex justify-between mb-8">
          {STEPS.map((s, i) => (
            <span key={i} className="text-[11px] font-medium transition-colors"
              style={{ color: i <= step ? C.g[800] : C.t[300], fontFamily: font.body }}
            >{s}</span>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step 0: Studio Info ──────────────────── */}
          {step === 0 && (
            <motion.div key="studio" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: C.g[100] }}>
                <Building2 className="w-6 h-6" style={{ color: C.g[800] }} />
              </div>
              <h1 className="text-[28px] font-bold" style={{ fontFamily: font.display }}>Welcome to WaitUp</h1>
              <p className="mt-2 text-[14px]" style={{ color: C.t[500], fontFamily: font.body }}>
                Let's set up your studio. Takes 2 minutes.
              </p>

              <div className="mt-8 space-y-5">
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: C.t[700], fontFamily: font.body }}>Studio name</label>
                  <input value={studioName} onChange={e => setStudioName(e.target.value)} placeholder="e.g. The Movement Studio"
                    className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none transition-all"
                    style={{ border: `1.5px solid ${C.b}`, fontFamily: font.body, backgroundColor: '#fff' }}
                    onFocus={e => e.target.style.borderColor = C.g[600]}
                    onBlur={e => e.target.style.borderColor = C.b}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: C.t[700], fontFamily: font.body }}>
                    <MapPin className="w-3.5 h-3.5 inline mr-1" />Location
                  </label>
                  <input value={studioLocation} onChange={e => setStudioLocation(e.target.value)} placeholder="e.g. Ballito, KZN"
                    className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none transition-all"
                    style={{ border: `1.5px solid ${C.b}`, fontFamily: font.body, backgroundColor: '#fff' }}
                    onFocus={e => e.target.style.borderColor = C.g[600]}
                    onBlur={e => e.target.style.borderColor = C.b}
                  />
                </div>
              </div>

              <button onClick={() => setStep(1)} disabled={!studioName}
                className="mt-8 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-semibold text-white transition-all disabled:opacity-40"
                style={{ backgroundColor: C.g[800], fontFamily: font.body }}
              >Continue <ArrowRight className="w-4 h-4" /></button>
            </motion.div>
          )}

          {/* ── Step 1: Class Types ─────────────────── */}
          {step === 1 && (
            <motion.div key="classes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: C.g[100] }}>
                <Clock className="w-6 h-6" style={{ color: C.g[800] }} />
              </div>
              <h1 className="text-[28px] font-bold" style={{ fontFamily: font.display }}>What do you teach?</h1>
              <p className="mt-2 text-[14px]" style={{ color: C.t[500], fontFamily: font.body }}>
                Select all that apply. You can add more later.
              </p>

              <div className="mt-8 flex flex-wrap gap-2.5">
                {allClassTypes.map(type => (
                  <button key={type} onClick={() => toggleClass(type)}
                    className="px-4 py-2.5 rounded-full text-[13px] font-medium transition-all capitalize"
                    style={{
                      backgroundColor: classTypes.includes(type) ? C.g[800] : '#fff',
                      color: classTypes.includes(type) ? '#fff' : C.t[700],
                      border: `1.5px solid ${classTypes.includes(type) ? C.g[800] : C.b}`,
                      fontFamily: font.body,
                    }}
                  >
                    {classTypes.includes(type) && <Check className="w-3.5 h-3.5 inline mr-1" />}
                    {type}
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: C.t[700], fontFamily: font.body }}>
                  Default class price (ZAR)
                </label>
                <input type="number" value={defaultPrice} onChange={e => setDefaultPrice(e.target.value)} placeholder="150"
                  className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none transition-all"
                  style={{ border: `1.5px solid ${C.b}`, fontFamily: font.body, backgroundColor: '#fff' }}
                  onFocus={e => e.target.style.borderColor = C.g[600]}
                  onBlur={e => e.target.style.borderColor = C.b}
                />
              </div>

              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(0)}
                  className="px-6 py-3.5 rounded-xl text-[14px] font-medium transition-all"
                  style={{ border: `1.5px solid ${C.b}`, fontFamily: font.body }}
                ><ArrowLeft className="w-4 h-4" /></button>
                <button onClick={() => setStep(2)} disabled={classTypes.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-semibold text-white transition-all disabled:opacity-40"
                  style={{ backgroundColor: C.g[800], fontFamily: font.body }}
                >Continue <ArrowRight className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: WhatsApp ────────────────────── */}
          {step === 2 && (
            <motion.div key="whatsapp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: C.g[100] }}>
                <MessageCircle className="w-6 h-6" style={{ color: C.g[800] }} />
              </div>
              <h1 className="text-[28px] font-bold" style={{ fontFamily: font.display }}>WhatsApp setup</h1>
              <p className="mt-2 text-[14px]" style={{ color: C.t[500], fontFamily: font.body }}>
                WaitUp sends waitlist notifications and rebook nudges via WhatsApp. Add your business number to get started.
              </p>

              <div className="mt-8">
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: C.t[700], fontFamily: font.body }}>
                  WhatsApp business number (optional)
                </label>
                <input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="+27..."
                  className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none transition-all"
                  style={{ border: `1.5px solid ${C.b}`, fontFamily: font.body, backgroundColor: '#fff' }}
                  onFocus={e => e.target.style.borderColor = C.g[600]}
                  onBlur={e => e.target.style.borderColor = C.b}
                />
                <p className="mt-2 text-[12px]" style={{ color: C.t[400], fontFamily: font.body }}>
                  You can configure full WhatsApp API integration later in Settings.
                </p>
              </div>

              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(1)}
                  className="px-6 py-3.5 rounded-xl text-[14px] font-medium transition-all"
                  style={{ border: `1.5px solid ${C.b}`, fontFamily: font.body }}
                ><ArrowLeft className="w-4 h-4" /></button>
                <button onClick={handleFinish} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-semibold text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: C.g[800], fontFamily: font.body }}
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Finish setup →'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Done ────────────────────────── */}
          {step === 3 && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: C.g[100] }}>
                <Sparkles className="w-8 h-8" style={{ color: C.g[800] }} />
              </div>
              <h1 className="text-[32px] font-bold" style={{ fontFamily: font.display }}>
                You're all set, <span style={{ color: C.g[700] }}>{studioName.split(' ')[0]}</span>!
              </h1>
              <p className="mt-3 text-[15px] max-w-sm mx-auto" style={{ color: C.t[500], fontFamily: font.body }}>
                WaitUp is now watching over your classes. Head to the dashboard to see it in action.
              </p>

              <button onClick={() => navigate('/tour')}
                className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-full text-[15px] font-semibold text-white transition-all hover:shadow-lg"
                style={{ backgroundColor: C.g[800], fontFamily: font.body }}
              >Connect your system <ArrowRight className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
