import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Settings, 
  MessageSquare, 
  Bell, 
  Shield,
  Save,
  CheckCircle
} from 'lucide-react'
import { settingsApi } from '../services/api'
import type { FillIQSettings } from '../types'

function Toggle({ 
  label, 
  description, 
  checked, 
  onChange 
}: { 
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between py-4">
      <div>
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-brand-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

function NumberInput({ 
  label, 
  description, 
  value, 
  onChange,
  min = 0,
  max = 100
}: { 
  label: string
  description: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900">{label}</h4>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  })

  const [localSettings, setLocalSettings] = useState<Partial<FillIQSettings>>({})

  // Update local settings when data loads
  if (data?.data?.data && Object.keys(localSettings).length === 0) {
    setLocalSettings(data.data.data)
  }

  const updateMutation = useMutation({
    mutationFn: (data: any) => settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const handleSave = () => {
    updateMutation.mutate(localSettings)
  }

  const updateSetting = (key: keyof FillIQSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="card h-96 animate-pulse" />
      </div>
    )
  }

  const settings = localSettings as FillIQSettings

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">
            Configure FillIQ behavior and integrations
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="btn-primary flex items-center gap-2"
        >
          {updateMutation.isPending ? (
            'Saving...'
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Waitlist Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-100 rounded-lg">
            <MessageSquare className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Waitlist Engine</h2>
            <p className="text-sm text-gray-500">Configure automatic spot filling</p>
          </div>
        </div>

        <div className="space-y-2 divide-y divide-gray-100">
          <Toggle
            label="Auto-fill enabled"
            description="Automatically fill cancelled spots via WhatsApp"
            checked={settings.autoFillEnabled ?? true}
            onChange={(v) => updateSetting('autoFillEnabled', v)}
          />
          
          <NumberInput
            label="Max simultaneous invites"
            description="Number of waitlist members to invite at once"
            value={settings.maxSimultaneousInvites ?? 3}
            onChange={(v) => updateSetting('maxSimultaneousInvites', v)}
            min={1}
            max={10}
          />
          
          <NumberInput
            label="Invite expiry (minutes)"
            description="How long members have to respond"
            value={settings.inviteExpiryMinutes ?? 30}
            onChange={(v) => updateSetting('inviteExpiryMinutes', v)}
            min={5}
            max={120}
          />
          
          <NumberInput
            label="Auto-expand delay (minutes)"
            description="Wait before inviting next batch"
            value={settings.autoExpandAfterMinutes ?? 30}
            onChange={(v) => updateSetting('autoExpandAfterMinutes', v)}
            min={5}
            max={120}
          />
        </div>
      </div>

      {/* Rebook Nudge Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Rebook Nudges</h2>
            <p className="text-sm text-gray-500">Post-class rebooking reminders</p>
          </div>
        </div>

        <div className="space-y-2 divide-y divide-gray-100">
          <Toggle
            label="Rebook nudges enabled"
            description="Send WhatsApp reminders after class attendance"
            checked={settings.rebookNudgeEnabled ?? true}
            onChange={(v) => updateSetting('rebookNudgeEnabled', v)}
          />
          
          <NumberInput
            label="Nudge delay (minutes)"
            description="Time after class ends to send nudge"
            value={settings.rebookNudgeDelayMinutes ?? 45}
            onChange={(v) => updateSetting('rebookNudgeDelayMinutes', v)}
            min={15}
            max={180}
          />
        </div>
      </div>

      {/* Churn Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Churn Prevention</h2>
            <p className="text-sm text-gray-500">Member retention settings</p>
          </div>
        </div>

        <div className="space-y-2 divide-y divide-gray-100">
          <NumberInput
            label="Churn score threshold"
            description="Minimum score to flag as at-risk (0-100)"
            value={settings.churnScoreThreshold ?? 65}
            onChange={(v) => updateSetting('churnScoreThreshold', v)}
            min={0}
            max={100}
          />
          
          <Toggle
            label="Auto-nudge enabled"
            description="Automatically send nudges to highest-risk members"
            checked={settings.autoNudgeEnabled ?? false}
            onChange={(v) => updateSetting('autoNudgeEnabled', v)}
          />
          
          <NumberInput
            label="Auto-nudge threshold"
            description="Score required for automatic nudge"
            value={settings.autoNudgeThreshold ?? 80}
            onChange={(v) => updateSetting('autoNudgeThreshold', v)}
            min={0}
            max={100}
          />
          
          <NumberInput
            label="Nudge cooldown (days)"
            description="Minimum days between nudges to same member"
            value={settings.churnNudgeCooldownDays ?? 14}
            onChange={(v) => updateSetting('churnNudgeCooldownDays', v)}
            min={1}
            max={90}
          />
        </div>
      </div>

      {/* WhatsApp Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <MessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">WhatsApp Integration</h2>
            <p className="text-sm text-gray-500">WABA provider settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Provider
            </label>
            <select
              value={settings.wabaProvider ?? '360dialog'}
              onChange={(e) => updateSetting('wabaProvider', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="360dialog">360dialog</option>
              <option value="vonage">Vonage</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Phone Number ID
            </label>
            <input
              type="text"
              value={settings.wabaPhoneNumberId || ''}
              onChange={(e) => updateSetting('wabaPhoneNumberId', e.target.value)}
              placeholder="Enter your WABA phone number ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Studio WhatsApp Number
            </label>
            <input
              type="text"
              value={settings.studioWhatsAppNumber || ''}
              onChange={(e) => updateSetting('studioWhatsAppNumber', e.target.value)}
              placeholder="+27831234567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used as fallback for replies and notifications
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
