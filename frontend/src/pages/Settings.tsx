import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Bell,
  Shield,
  Save,
  CheckCircle,
  Building2
} from 'lucide-react'
import { supabase } from '../hooks/useSupabase'

const C = {
  g: { 800: '#2D5016', 700: '#3D6B22', 600: '#4A7C28', 400: '#8BAA6B', 200: '#D4E4C8', 100: '#E8F0DE', 50: '#F4F8EF' },
  a: { 700: '#7D4E37' },
  t: { 900: '#0F0F0F', 700: '#2D2D2D', 500: '#6B6B6B', 400: '#8A8A8A', 300: '#ABABAB' },
  b: '#E5E5E5',
  w: '#FAFAF8',
}
const font = { display: "'Francy Regular', 'General Sans', sans-serif", body: "'General Sans', 'Satoshi', sans-serif" }

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between py-4" style={{ borderBottom: `1px solid ${C.b}` }}>
      <div>
        <h4 className="text-[14px] font-medium" style={{ fontFamily: font.body }}>{label}</h4>
        <p className="text-[13px] mt-0.5" style={{ color: C.t[500], fontFamily: font.body }}>{desc}</p>
      </div>
      <button onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4"
        style={{ backgroundColor: checked ? C.g[800] : C.b }}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

function Input({ label, desc, value, onChange, type = 'text', placeholder }: {
  label: string; desc?: string; value: string | number; onChange: (v: any) => void; type?: string; placeholder?: string
}) {
  return (
    <div className="py-4" style={{ borderBottom: `1px solid ${C.b}` }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="text-[14px] font-medium" style={{ fontFamily: font.body }}>{label}</h4>
          {desc && <p className="text-[13px] mt-0.5" style={{ color: C.t[500], fontFamily: font.body }}>{desc}</p>}
        </div>
        <input type={type} value={value} onChange={e => onChange(type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
          placeholder={placeholder}
          className="w-28 px-3 py-2 rounded-lg text-[14px] text-right outline-none transition-all"
          style={{ border: `1.5px solid ${C.b}`, fontFamily: font.body, backgroundColor: '#fff' }}
          onFocus={e => e.target.style.borderColor = C.g[600]}
          onBlur={e => e.target.style.borderColor = C.b}
        />
      </div>
    </div>
  )
}

function Card({ icon: Icon, title, desc, color, children }: {
  icon: any; title: string; desc: string; color: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: '#fff', border: `1px solid ${C.b}` }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <h2 className="text-[16px] font-semibold" style={{ fontFamily: font.display }}>{title}</h2>
          <p className="text-[12px]" style={{ color: C.t[500], fontFamily: font.body }}>{desc}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState<any>({})

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const studioId = localStorage.getItem('filliq_studio_id') || 'default-studio'
    const { data } = await supabase.from('filliq_settings').select('*').eq('studio_id', studioId).single()
    if (data) setSettings(data)
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const studioId = localStorage.getItem('filliq_studio_id') || 'default-studio'
    await supabase.from('filliq_settings').update(settings).eq('studio_id', studioId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const update = (key: string, value: any) => setSettings((s: any) => ({ ...s, [key]: value }))

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 rounded w-1/4 animate-pulse" style={{ backgroundColor: C.b }} />
        <div className="h-64 rounded-2xl animate-pulse" style={{ backgroundColor: C.b }} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold" style={{ fontFamily: font.display }}>Settings</h1>
          <p className="text-[14px] mt-1" style={{ color: C.t[500], fontFamily: font.body }}>Configure WaitUp for your studio</p>
        </div>
        <motion.button onClick={handleSave} disabled={saving}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all disabled:opacity-50"
          style={{ backgroundColor: C.g[800], fontFamily: font.body }}
        >
          {saving ? 'Saving...' : saved ? <><CheckCircle className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save</>}
        </motion.button>
      </div>

      {/* Studio */}
      <Card icon={Building2} title="Studio" desc="Your business details" color={C.g[800]}>
        <Input label="Studio name" value={localStorage.getItem('filliq_studio_name') || ''} onChange={() => {}} placeholder="Your studio" />
        <Input label="Default class price (ZAR)" value={settings.default_class_price || 150} onChange={(v) => update('default_class_price', v)} type="number" />
      </Card>

      {/* Waitlist Engine */}
      <Card icon={MessageSquare} title="Waitlist Engine" desc="Automatic spot filling" color={C.g[700]}>
        <Toggle label="Auto-fill enabled" desc="Fill cancelled spots via WhatsApp" checked={settings.auto_fill_enabled ?? true} onChange={(v) => update('auto_fill_enabled', v)} />
        <Input label="Max simultaneous invites" desc="Members to invite at once" value={settings.max_simultaneous_invites || 3} onChange={(v) => update('max_simultaneous_invites', v)} type="number" />
        <Input label="Invite expiry (min)" desc="How long to respond" value={settings.invite_expiry_minutes || 30} onChange={(v) => update('invite_expiry_minutes', v)} type="number" />
      </Card>

      {/* Rebook */}
      <Card icon={Bell} title="Rebook Nudges" desc="Post-class reminders" color={C.g[600]}>
        <Toggle label="Rebook nudges" desc="Send reminders after attendance" checked={settings.rebook_nudge_enabled ?? true} onChange={(v) => update('rebook_nudge_enabled', v)} />
        <Input label="Delay (min)" desc="Time after class to nudge" value={settings.rebook_nudge_delay_minutes || 45} onChange={(v) => update('rebook_nudge_delay_minutes', v)} type="number" />
      </Card>

      {/* Churn */}
      <Card icon={Shield} title="Churn Prevention" desc="Member retention" color={C.a[700]}>
        <Input label="Churn threshold" desc="Score to flag as at-risk (0-100)" value={settings.churn_score_threshold || 65} onChange={(v) => update('churn_score_threshold', v)} type="number" />
        <Toggle label="Auto-nudge" desc="Auto-send to highest-risk members" checked={settings.auto_nudge_enabled ?? false} onChange={(v) => update('auto_nudge_enabled', v)} />
        <Input label="Nudge cooldown (days)" desc="Between nudges to same member" value={settings.churn_nudge_cooldown_days || 14} onChange={(v) => update('churn_nudge_cooldown_days', v)} type="number" />
      </Card>

      {/* WhatsApp */}
      <Card icon={MessageSquare} title="WhatsApp" desc="Integration settings" color="#25D366">
        <Input label="Studio WhatsApp number" desc="For notifications" value={settings.studio_whatsapp_number || ''} onChange={(v) => update('studio_whatsapp_number', v)} placeholder="+27..." />
        <div className="py-4">
          <h4 className="text-[14px] font-medium mb-2" style={{ fontFamily: font.body }}>Status</h4>
          <div className="flex items-center gap-2 text-[13px]" style={{ fontFamily: font.body }}>
            <div className="w-2 h-2 rounded-full" style={{ background: settings.studio_whatsapp_number ? C.g[600] : C.t[300] }} />
            <span style={{ color: C.t[500] }}>{settings.studio_whatsapp_number ? 'Configured' : 'Not configured — add your number above'}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
