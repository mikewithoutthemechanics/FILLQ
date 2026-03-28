import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../hooks/useSupabase'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Link2,
  Upload,
  FileSpreadsheet,
  Globe,
  Calendar,
  Users,
  BarChart3,
  MessageCircle,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react'

const C = {
  g: { 900: '#1B3A0A', 800: '#2D5016', 700: '#3D6B22', 600: '#4A7C28', 400: '#8BAA6B', 200: '#D4E4C8', 100: '#E8F0DE', 50: '#F4F8EF' },
  a: { 700: '#8B2500' },
  t: { 900: '#0F0F0F', 700: '#2D2D2D', 500: '#6B6B6B', 400: '#8A8A8A', 300: '#ABABAB' },
  b: '#E5E5E5',
  w: '#FAFAF8',
}
const font = { display: "'Francy Regular', 'General Sans', sans-serif", body: "'General Sans', 'Satoshi', sans-serif" }

const INTEGRATIONS = [
  { id: 'mindbody', name: 'Mindbody', desc: 'The global standard for fitness & wellness', logo: '🧠', tier: 1, api: true },
  { id: 'glofox', name: 'Glofox', desc: 'Built for boutique fitness studios', logo: '💪', tier: 1, api: true },
  { id: 'momoyoga', name: 'Momoyoga', desc: 'Made specifically for yoga studios', logo: '🧘', tier: 1, api: true },
  { id: 'wellnessliving', name: 'WellnessLiving', desc: 'All-in-one business management', logo: '🌿', tier: 1, api: true },
  { id: 'gymmaster', name: 'GymMaster', desc: 'Popular in SA & NZ', logo: '🏋️', tier: 2, api: true },
  { id: 'teamup', name: 'TeamUp', desc: 'Class & membership management', logo: '👥', tier: 2, api: true },
  { id: 'vagaro', name: 'Vagaro', desc: 'Budget-friendly scheduling', logo: '📅', tier: 2, api: true },
  { id: 'google_sheets', name: 'Google Sheets', desc: 'Sync classes & bookings from a spreadsheet', logo: '📊', tier: 3, api: true },
  { id: 'excel', name: 'Excel / CSV', desc: 'Upload an Excel or CSV file', logo: '📁', tier: 3, api: false },
  { id: 'whatsapp_intake', name: 'WhatsApp Booking', desc: 'Clients book by texting your WhatsApp — we parse it automatically', logo: '💬', tier: 1, api: true, highlight: true },
]

const TOUR_STEPS = [
  {
    title: 'Connect your booking system',
    desc: 'WaitUp reads from your existing system — it doesn\'t replace it. Pick yours below and we\'ll handle the sync.',
    icon: <Link2 className="w-6 h-6" />,
    tip: 'No booking system? Start with Google Sheets or Excel upload.'
  },
  {
    title: 'We import your data',
    desc: 'Members, classes, and bookings flow in automatically. You\'ll see them populate on the dashboard within minutes.',
    icon: <Upload className="w-6 h-6" />,
    tip: 'Your data stays yours. WaitUp only reads — it never modifies your booking system.'
  },
  {
    title: 'AI starts scoring',
    desc: 'Every booking gets a 0-100 no-show risk score. Classes within 3 hours get priority scoring.',
    icon: <BarChart3 className="w-6 h-6" />,
    tip: 'Scores improve over time as WaitUp learns your studio\'s patterns.'
  },
  {
    title: 'WhatsApp auto-fill kicks in',
    desc: 'When someone cancels, WaitUp instantly contacts your top waitlist candidates. First reply wins the spot.',
    icon: <MessageCircle className="w-6 h-6" />,
    tip: 'You can set how many people to invite at once (default: 3).'
  },
  {
    title: 'Watch the dashboard',
    desc: 'Revenue recovered, spots filled, fill rates, at-risk members — all in real-time.',
    icon: <Sparkles className="w-6 h-6" />,
    tip: 'Check back daily or let WaitUp work in the background.'
  },
]

export default function Tour() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<'tour' | 'connect'>('tour')
  const [tourStep, setTourStep] = useState(0)
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [pairingInstructions, setPairingInstructions] = useState<string[]>([])

  const handleConnect = async () => {
    setConnecting(true)
    const studioId = localStorage.getItem('filliq_studio_id')

    if (selectedIntegration === 'google_sheets') {
      // Store Google Sheets config
      await supabase.from('filliq_settings').update({
        waba_provider: 'google_sheets',
        waba_phone_number_id: apiUrl, // Reuse field for sheet URL
      }).eq('studio_id', studioId || 'default-studio')
    } else if (selectedIntegration === 'excel') {
      // CSV/Excel upload — just mark as connected
    } else if (selectedIntegration === 'whatsapp_intake') {
      // Provision WhatsApp node and get QR code
      try {
        const { data } = await supabase.functions.invoke('qr-code', {
          body: { studio_id: studioId }
        })
        if (data?.qr_svg) {
          setQrCode(data.qr_svg)
          setPairingInstructions(data.instructions || [])
        }
      } catch (e) {
        console.error('QR code error:', e)
      }
      setConnecting(false)
      return // Don't set connected yet — user needs to scan QR
    } else {
      // API-based integration
      await supabase.from('filliq_settings').update({
        waba_provider: selectedIntegration,
        waba_access_token_encrypted: apiKey || null,
      }).eq('studio_id', studioId || 'default-studio')
    }

    localStorage.setItem('filliq_integration', selectedIntegration || '')
    setConnecting(false)
    setConnected(true)
  }

  const copyWebhook = () => {
    navigator.clipboard.writeText(`https://zlanegnamrsrphcvxtcf.supabase.co/functions/v1/whatsapp-webhook`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (connected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: C.w }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: C.g[100] }}>
            <CheckCircle className="w-8 h-8" style={{ color: C.g[800] }} />
          </div>
          <h1 className="text-[32px] font-bold" style={{ fontFamily: font.display }}>
            You're <span style={{ color: C.g[700] }}>connected!</span>
          </h1>
          <p className="mt-3 text-[15px]" style={{ color: C.t[500], fontFamily: font.body }}>
            WaitUp is now syncing with your {INTEGRATIONS.find(i => i.id === selectedIntegration)?.name} data.
            Risk scores will appear within 15 minutes.
          </p>

          <div className="mt-8 rounded-xl p-5 text-left" style={{ backgroundColor: C.g[50], border: `1px solid ${C.g[200]}` }}>
            <p className="text-[13px] font-medium mb-3" style={{ fontFamily: font.body }}>What happens next:</p>
            <ul className="space-y-2">
              {[
                'Classes & members imported automatically',
                'First risk scores in ~15 minutes',
                'Auto-fill activates on next cancellation',
                'Dashboard shows live data'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-[13px]" style={{ fontFamily: font.body }}>
                  <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.g[700] }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <button onClick={() => navigate('/')}
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-full text-[15px] font-semibold text-white transition-all hover:shadow-lg"
            style={{ backgroundColor: C.g[800], fontFamily: font.body }}
          >Go to Dashboard <ArrowRight className="w-4 h-4" /></button>
        </motion.div>
      </div>
    )
  }

  if (phase === 'connect') {
    const selected = INTEGRATIONS.find(i => i.id === selectedIntegration)

    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: C.w }}>
        <div className="w-full max-w-[600px]">
          <button onClick={() => setPhase('tour')} className="flex items-center gap-1.5 text-[13px] mb-6" style={{ color: C.t[500], fontFamily: font.body }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to integrations
          </button>

          <div className="rounded-2xl p-8" style={{ backgroundColor: '#fff', border: `1px solid ${C.b}` }}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{selected?.logo}</span>
              <div>
                <h2 className="text-[22px] font-bold" style={{ fontFamily: font.display }}>{selected?.name}</h2>
                <p className="text-[13px]" style={{ color: C.t[500], fontFamily: font.body }}>{selected?.desc}</p>
              </div>
            </div>

            {selectedIntegration === 'google_sheets' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: C.t[700], fontFamily: font.body }}>
                    Google Sheets URL
                  </label>
                  <input value={apiUrl} onChange={e => setApiUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none"
                    style={{ border: `1.5px solid ${C.b}`, fontFamily: font.body, backgroundColor: '#fff' }}
                    onFocus={e => e.target.style.borderColor = C.g[600]}
                    onBlur={e => e.target.style.borderColor = C.b}
                  />
                  <p className="mt-2 text-[12px]" style={{ color: C.t[400], fontFamily: font.body }}>
                    Share your sheet with: <span className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: C.g[50] }}>waitup-sync@waitup.iam.gserviceaccount.com</span>
                  </p>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: C.g[50], border: `1px solid ${C.g[200]}` }}>
                  <p className="text-[13px] font-medium mb-2" style={{ fontFamily: font.body }}>Expected format:</p>
                  <p className="text-[12px]" style={{ color: C.t[500], fontFamily: font.body }}>
                    Columns: <code className="px-1 rounded" style={{ backgroundColor: C.g[100] }}>member_name</code>{' '}
                    <code className="px-1 rounded" style={{ backgroundColor: C.g[100] }}>email</code>{' '}
                    <code className="px-1 rounded" style={{ backgroundColor: C.g[100] }}>phone</code>{' '}
                    <code className="px-1 rounded" style={{ backgroundColor: C.g[100] }}>class_name</code>{' '}
                    <code className="px-1 rounded" style={{ backgroundColor: C.g[100] }}>class_date</code>{' '}
                    <code className="px-1 rounded" style={{ backgroundColor: C.g[100] }}>status</code>
                  </p>
                </div>
              </div>
            )}

            {selectedIntegration === 'excel' && (
              <div className="space-y-5">
                <div className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors hover:bg-black/[0.02]"
                  style={{ borderColor: C.g[400] }}
                >
                  <Upload className="w-8 h-8 mx-auto mb-3" style={{ color: C.g[600] }} />
                  <p className="text-[14px] font-medium" style={{ fontFamily: font.body }}>Drop your Excel or CSV file here</p>
                  <p className="text-[12px] mt-1" style={{ color: C.t[400], fontFamily: font.body }}>or click to browse</p>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: C.g[50], border: `1px solid ${C.g[200]}` }}>
                  <p className="text-[13px] font-medium mb-2" style={{ fontFamily: font.body }}>Need a template?</p>
                  <button className="text-[13px] font-medium flex items-center gap-1" style={{ color: C.g[800], fontFamily: font.body }}>
                    <FileSpreadsheet className="w-4 h-4" /> Download sample CSV
                  </button>
                </div>
              </div>
            )}

            {selectedIntegration === 'whatsapp_intake' && (
              <div className="space-y-5">
                {!qrCode ? (
                  <>
                    <div className="rounded-xl p-5" style={{ backgroundColor: C.g[50], border: `1px solid ${C.g[200]}` }}>
                      <p className="text-[14px] font-semibold mb-2" style={{ fontFamily: font.display }}>How it works</p>
                      <div className="space-y-3">
                        {[
                          'Client texts your WhatsApp: "Can I book yoga tomorrow at 9am?"',
                          'WaitUp parses the message — extracts name, class, date, time',
                          'Booking created automatically in your system',
                          'Confirmation sent back: "✅ Booked! See you there 🧘"'
                        ].map((step, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5" style={{ background: C.g[700] }}>{i + 1}</span>
                            <p className="text-[13px]" style={{ color: C.t[700], fontFamily: font.body }}>{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl p-4" style={{ backgroundColor: '#FFF8F0', border: '1px solid #F5D6B8' }}>
                      <p className="text-[13px] font-medium mb-1" style={{ fontFamily: font.body }}>⚡ Zero API costs</p>
                      <p className="text-[12px]" style={{ color: C.t[500], fontFamily: font.body }}>
                        Uses OpenClaw to connect your WhatsApp — no Meta Business account, no 360dialog fees. Just scan a QR code.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* QR Code display */}
                    <div className="rounded-xl p-6 text-center" style={{ backgroundColor: '#fff', border: `1px solid ${C.b}` }}>
                      <p className="text-[14px] font-semibold mb-4" style={{ fontFamily: font.display }}>Scan with WhatsApp</p>
                      <div className="inline-block p-4 rounded-xl" style={{ backgroundColor: '#fff', border: `2px solid ${C.g[800]}` }}
                        dangerouslySetInnerHTML={{ __html: qrCode }}
                      />
                    </div>

                    {/* Instructions */}
                    <div className="space-y-2">
                      {pairingInstructions.map((inst, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{ background: C.g[700] }}>{i + 1}</span>
                          <p className="text-[13px]" style={{ fontFamily: font.body }}>{inst}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: C.g[50], border: `1px solid ${C.g[200]}` }}>
                      <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: C.g[600] }} />
                      <p className="text-[13px]" style={{ color: C.g[800], fontFamily: font.body }}>Waiting for scan...</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {selected?.api && selectedIntegration !== 'google_sheets' && selectedIntegration !== 'excel' && selectedIntegration !== 'whatsapp_intake' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: C.t[700], fontFamily: font.body }}>
                    API Key
                  </label>
                  <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                    placeholder="Paste your API key"
                    className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none"
                    style={{ border: `1.5px solid ${C.b}`, fontFamily: font.body, backgroundColor: '#fff' }}
                    onFocus={e => e.target.style.borderColor = C.g[600]}
                    onBlur={e => e.target.style.borderColor = C.b}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: C.t[700], fontFamily: font.body }}>
                    API URL (if custom)
                  </label>
                  <input value={apiUrl} onChange={e => setApiUrl(e.target.value)}
                    placeholder="https://api.example.com"
                    className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none"
                    style={{ border: `1.5px solid ${C.b}`, fontFamily: font.body, backgroundColor: '#fff' }}
                    onFocus={e => e.target.style.borderColor = C.g[600]}
                    onBlur={e => e.target.style.borderColor = C.b}
                  />
                </div>

                <div className="rounded-xl p-4" style={{ backgroundColor: C.g[50], border: `1px solid ${C.g[200]}` }}>
                  <p className="text-[13px] font-medium mb-2" style={{ fontFamily: font.body }}>Webhook URL</p>
                  <p className="text-[12px] mb-2" style={{ color: C.t[500], fontFamily: font.body }}>
                    Add this to your {selected.name} webhook settings to get real-time updates:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[11px] px-3 py-2 rounded-lg truncate" style={{ backgroundColor: '#fff', border: `1px solid ${C.b}` }}>
                      https://zlanegnamrs...cf.supabase.co/functions/v1/whatsapp-webhook
                    </code>
                    <button onClick={copyWebhook}
                      className="p-2 rounded-lg transition-colors"
                      style={{ backgroundColor: C.g[100], color: C.g[800] }}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button onClick={handleConnect} disabled={connecting}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-semibold text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: C.g[800], fontFamily: font.body }}
            >
              {connecting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Connect & Import →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Tour + integration selection
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: C.w }}>
      <div className="max-w-[900px] mx-auto pt-10">
        {/* Tour steps */}
        <div className="mb-12">
          <p className="text-[12px] font-medium tracking-[0.1em] uppercase mb-2" style={{ color: C.g[700], fontFamily: font.body }}>How it works</p>
          <h1 className="text-[32px] font-bold mb-2" style={{ fontFamily: font.display }}>
            Get started in <span style={{ color: C.g[700] }}>5 steps</span>
          </h1>

          <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
            {TOUR_STEPS.map((step, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="min-w-[220px] flex-shrink-0 rounded-2xl p-5 cursor-pointer transition-all"
                style={{
                  backgroundColor: tourStep === i ? C.g[800] : '#fff',
                  color: tourStep === i ? '#fff' : C.t[900],
                  border: `1px solid ${tourStep === i ? C.g[800] : C.b}`,
                }}
                onClick={() => setTourStep(i)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: tourStep === i ? 'rgba(255,255,255,0.15)' : C.g[100], color: tourStep === i ? '#fff' : C.g[800] }}
                  >{step.icon}</div>
                  <span className="text-[11px] font-bold opacity-50">0{i + 1}</span>
                </div>
                <h3 className="text-[14px] font-semibold mb-1" style={{ fontFamily: font.display }}>{step.title}</h3>
                <p className="text-[12px] leading-relaxed" style={{ color: tourStep === i ? 'rgba(255,255,255,0.7)' : C.t[500], fontFamily: font.body }}>
                  {step.desc}
                </p>
                {step.tip && (
                  <p className="mt-3 text-[11px] italic" style={{ color: tourStep === i ? 'rgba(255,255,255,0.5)' : C.t[400], fontFamily: font.body }}>
                    💡 {step.tip}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Integration selection */}
        <div>
          <p className="text-[12px] font-medium tracking-[0.1em] uppercase mb-2" style={{ color: C.g[700], fontFamily: font.body }}>Integrations</p>
          <h2 className="text-[24px] font-bold" style={{ fontFamily: font.display }}>Connect your booking system</h2>
          <p className="mt-2 text-[14px]" style={{ color: C.t[500], fontFamily: font.body }}>
            Pick yours — WaitUp reads your data, it never modifies it.
          </p>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {INTEGRATIONS.map((integ, i) => (
              <motion.button key={integ.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => { setSelectedIntegration(integ.id); setPhase('connect') }}
                className="flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:shadow-md"
                style={{
                  backgroundColor: selectedIntegration === integ.id ? C.g[50] : '#fff',
                  border: `1.5px solid ${selectedIntegration === integ.id ? C.g[600] : C.b}`,
                }}
              >
                <span className="text-2xl">{integ.logo}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold" style={{ fontFamily: font.body }}>{integ.name}</span>
                    {integ.tier === 1 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: C.g[100], color: C.g[800] }}>POPULAR</span>}
                  </div>
                  <p className="text-[12px] truncate" style={{ color: C.t[500], fontFamily: font.body }}>{integ.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: C.t[300] }} />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Skip option */}
        <div className="mt-10 text-center">
          <button onClick={() => navigate('/')}
            className="text-[13px] underline transition-colors"
            style={{ color: C.t[400], fontFamily: font.body }}
          >
            Skip for now — connect later in Settings
          </button>
        </div>
      </div>
    </div>
  )
}
