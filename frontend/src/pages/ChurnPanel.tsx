import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  AlertTriangle, 
  Users, 
  MessageSquare, 
  Gift,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { churnApi, dashboardApi } from '../services/api'
import type { AtRiskMember } from '../types'

function RiskBadge({ level }: { level: string }) {
  const styles = {
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  }

  const labels = {
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  }

  return (
    <span className={`badge ${styles[level as keyof typeof styles] || styles.medium}`}>
      {labels[level as keyof typeof labels] || level}
    </span>
  )
}

function MemberRow({ 
  member, 
  onNudge,
  onOffer,
  isNudging,
  isOffering 
}: { 
  member: AtRiskMember
  onNudge: (id: string) => void
  onOffer: (id: string) => void
  isNudging: boolean
  isOffering: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border-b border-gray-200 last:border-0">
      <div className="p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold">
              {member.firstName[0]}{member.lastName[0]}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                {member.firstName} {member.lastName}
              </h4>
              <p className="text-sm text-gray-500">
                Last seen: {member.lastSeen 
                  ? new Date(member.lastSeen).toLocaleDateString('en-ZA', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  : 'Never'
                }
                {' • '}
                {member.daysSinceLastAttendance} days ago
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {member.churnScore}
              </div>
              <div className="text-xs text-gray-500">churn score</div>
            </div>
            <RiskBadge level={member.riskLevel} />
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={() => onNudge(member.memberId)}
                disabled={isNudging}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                {isNudging ? 'Sending...' : 'Send Nudge'}
              </button>
              <button
                onClick={() => onOffer(member.memberId)}
                disabled={isOffering}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Gift className="w-4 h-4" />
                {isOffering ? 'Processing...' : 'Free Class Offer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChurnPanel() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all')

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['at-risk-members'],
    queryFn: () => dashboardApi.getAtRiskMembers(),
  })

  const { data: summaryData } = useQuery({
    queryKey: ['churn-summary'],
    queryFn: () => churnApi.getSummary(),
  })

  const nudgeMutation = useMutation({
    mutationFn: (memberId: string) => churnApi.sendNudge(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['at-risk-members'] })
    },
  })

  const offerMutation = useMutation({
    mutationFn: (memberId: string) => churnApi.sendOffer(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['at-risk-members'] })
    },
  })

  const members: AtRiskMember[] = membersData?.data?.data || []
  const summary = summaryData?.data?.data || {
    totalAtRisk: 0,
    highRisk: 0,
    criticalRisk: 0,
    churnsPrevented: 0,
    nudgesSent: 0,
  }

  const filteredMembers = filter === 'all' 
    ? members 
    : members.filter(m => m.riskLevel === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">At-Risk Members</h1>
        <p className="text-gray-500 mt-1">
          Members flagged by the churn early-warning system
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary.totalAtRisk}</p>
              <p className="text-sm text-gray-500">Total at risk</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary.criticalRisk}</p>
              <p className="text-sm text-gray-500">Critical</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary.churnsPrevented}</p>
              <p className="text-sm text-gray-500">Retained this month</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{summary.nudgesSent}</p>
              <p className="text-sm text-gray-500">Nudges sent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Filter:</span>
        {(['all', 'critical', 'high', 'medium'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-brand-100 text-brand-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Members List */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            Members ({filteredMembers.length})
          </h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No at-risk members
            </h3>
            <p className="text-gray-500">
              Great news! All your members are actively engaged.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMembers.map((member) => (
              <MemberRow
                key={member.memberId}
                member={member}
                onNudge={(id) => nudgeMutation.mutate(id)}
                onOffer={(id) => offerMutation.mutate(id)}
                isNudging={nudgeMutation.isPending}
                isOffering={offerMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="card bg-blue-50 border-blue-100">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">About Churn Scoring</h4>
            <p className="text-sm text-blue-700 mt-1">
              The churn algorithm runs nightly at 2 AM. Members are scored based on 
              attendance patterns, recency, payment history, and app engagement. 
              Scores ≥ 80 trigger automatic WhatsApp nudges (if enabled in settings).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
