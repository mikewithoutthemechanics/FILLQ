import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle,
  UserPlus,
  List,
  ChevronRight
} from 'lucide-react'
import { dashboardApi } from '../services/api'
import type { TeacherClassBrief } from '../types'

function ClassCard({ brief }: { brief: TeacherClassBrief }) {
  const startTime = new Date(brief.startTime)
  const now = new Date()
  const isUpcoming = startTime > now
  const isSoon = isUpcoming && (startTime.getTime() - now.getTime()) < 2 * 60 * 60 * 1000

  return (
    <div className={`card card-hover ${isSoon ? 'border-brand-300 ring-1 ring-brand-200' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{brief.className}</h3>
            {isSoon && (
              <span className="badge badge-risk-medium">Soon</span>
            )}
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <Clock className="w-4 h-4" />
            {startTime.toLocaleTimeString('en-ZA', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
            {' • '}
            {startTime.toLocaleDateString('en-ZA', {
              weekday: 'long',
              day: 'numeric',
              month: 'short'
            })}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <Users className="w-5 h-5 text-gray-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900">{brief.confirmedCount}</p>
          <p className="text-xs text-gray-500">Booked</p>
        </div>
        <div className={`text-center p-3 rounded-lg ${
          brief.highRiskCount > 0 ? 'bg-red-50' : 'bg-gray-50'
        }`}>
          <AlertTriangle className={`w-5 h-5 mx-auto mb-1 ${
            brief.highRiskCount > 0 ? 'text-red-600' : 'text-gray-600'
          }`} />
          <p className={`text-xl font-bold ${
            brief.highRiskCount > 0 ? 'text-red-600' : 'text-gray-900'
          }`}>
            {brief.highRiskCount}
          </p>
          <p className="text-xs text-gray-500">High Risk</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <List className="w-5 h-5 text-gray-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900">{brief.waitlistCount}</p>
          <p className="text-xs text-gray-500">Waitlist</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <UserPlus className="w-5 h-5 text-gray-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900">{brief.newMembersCount}</p>
          <p className="text-xs text-gray-500">New</p>
        </div>
      </div>

      {/* Note */}
      {brief.note && (
        <div className={`p-3 rounded-lg text-sm ${
          brief.highRiskCount >= 2 
            ? 'bg-red-50 text-red-700' 
            : 'bg-brand-50 text-brand-700'
        }`}>
          {brief.note}
        </div>
      )}
    </div>
  )
}

export default function ClassBrief() {
  const [teacherId, setTeacherId] = useState('teacher-1') // In production, from auth context

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-daily', teacherId],
    queryFn: () => dashboardApi.getTeacherDaily(teacherId),
  })

  const briefs: TeacherClassBrief[] = data?.data?.data || []

  // Group by date
  const groupedByDate = briefs.reduce((acc, brief) => {
    const date = new Date(brief.startTime).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(brief)
    return acc
  }, {} as Record<string, TeacherClassBrief[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Briefs</h1>
          <p className="text-gray-500 mt-1">
            Pre-class insights for teachers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-gray-700">
            {new Date().toLocaleDateString('en-ZA', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-brand-50 to-white border-brand-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg">
              <Calendar className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{briefs.length}</p>
              <p className="text-sm text-gray-500">Classes today</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {briefs.reduce((sum, b) => sum + b.confirmedCount, 0)}
              </p>
              <p className="text-sm text-gray-500">Total bookings</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {briefs.reduce((sum, b) => sum + b.highRiskCount, 0)}
              </p>
              <p className="text-sm text-gray-500">High risk</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {briefs.reduce((sum, b) => sum + b.newMembersCount, 0)}
              </p>
              <p className="text-sm text-gray-500">New members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Class List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="card h-48 animate-pulse">
              <div className="h-full bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : briefs.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No classes scheduled
          </h3>
          <p className="text-gray-500">
            You don't have any classes scheduled for today.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByDate).map(([date, dateBriefs]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                {new Date(date).toLocaleDateString('en-ZA', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dateBriefs
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map((brief) => (
                    <ClassCard key={brief.classId} brief={brief} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
