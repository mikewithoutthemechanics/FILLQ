import { useQuery } from '@tanstack/react-query'
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Shield,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Line,
  ComposedChart,
  Legend
} from 'recharts'
import { dashboardApi } from '../services/api'
import type { RecoverySummary, FillChartData } from '../types'

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  trendUp 
}: { 
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  trend?: string
  trendUp?: boolean
}) {
  return (
    <div className="card card-hover">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <div className="mt-2 flex items-center gap-2">
            {trend && (
              <span className={`inline-flex items-center text-sm font-medium ${
                trendUp ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendUp ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                )}
                {trend}
              </span>
            )}
            <span className="text-sm text-gray-500">{subtitle}</span>
          </div>
        </div>
        <div className="p-3 bg-brand-50 rounded-xl">
          <Icon className="w-6 h-6 text-brand-600" />
        </div>
      </div>
    </div>
  )
}

function FillRateChart({ data }: { data: FillChartData[] }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Fill Rate Trend</h3>
          <p className="text-sm text-gray-500">Last 30 days</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-brand-500 rounded-full" />
            <span className="text-gray-600">Filled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full" />
            <span className="text-gray-600">Empty</span>
          </div>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-ZA', { 
                day: 'numeric', 
                month: 'short' 
              })}
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
              labelFormatter={(date) => new Date(date).toLocaleDateString('en-ZA', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            />
            <Legend />
            <Bar 
              dataKey="spotsFilled" 
              name="Filled" 
              fill="#22c55e" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="spotsEmpty" 
              name="Empty" 
              fill="#d1d5db" 
              radius={[4, 4, 0, 0]}
            />
            <Line 
              type="monotone" 
              dataKey="fillRate" 
              name="Fill Rate %" 
              stroke="#16a34a" 
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function RecentActivity() {
  const { data, isLoading } = useQuery({
    queryKey: ['waitlist-events'],
    queryFn: () => waitlistApi.getEvents({ limit: 5 }),
  })

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-full" />
        </div>
      </div>
    )
  }

  const events = data?.data?.data || []

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent activity</p>
        ) : (
          events.slice(0, 5).map((event: any) => (
            <div key={event.id} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                event.filled ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {event.className}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(event.classDate).toLocaleDateString('en-ZA', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              {event.filled ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                  Filled
                </span>
              ) : (
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {event.status}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Import for RecentActivity
import { waitlistApi } from '../services/api'

export default function Dashboard() {
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardApi.getSummary(),
  })

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['fill-chart'],
    queryFn: () => dashboardApi.getFillChart(),
  })

  const summary: RecoverySummary = summaryData?.data?.data || {
    revenueRecoveredThisMonth: 0,
    spotsFilledThisMonth: 0,
    avgFillTimeMinutes: 0,
    churnsPreventedThisMonth: 0,
    fillRatePercentage: 0,
  }

  const chartDataArray: FillChartData[] = chartData?.data?.data || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FillIQ Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Revenue recovery and no-show optimization
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Revenue Recovered"
          value={`R${summary.revenueRecoveredThisMonth.toLocaleString()}`}
          subtitle="this month"
          icon={TrendingUp}
          trend="+12%"
          trendUp={true}
        />
        <MetricCard
          title="Spots Filled"
          value={summary.spotsFilledThisMonth.toString()}
          subtitle="from waitlist"
          icon={Users}
          trend="+8%"
          trendUp={true}
        />
        <MetricCard
          title="Avg Fill Time"
          value={`${summary.avgFillTimeMinutes} min`}
          subtitle="to fill a spot"
          icon={Clock}
          trend="-15%"
          trendUp={true}
        />
        <MetricCard
          title="Churns Prevented"
          value={summary.churnsPreventedThisMonth.toString()}
          subtitle="members retained"
          icon={Shield}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2">
          {chartLoading ? (
            <div className="card h-96 animate-pulse">
              <div className="h-full bg-gray-200 rounded" />
            </div>
          ) : (
            <FillRateChart data={chartDataArray} />
          )}
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>

      {/* Feature Overview */}
      <div className="card bg-gradient-to-br from-brand-50 to-white border-brand-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-brand-100 rounded-xl">
            <TrendingUp className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              How FillIQ Works
            </h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                  <h4 className="font-medium text-gray-900">Predict No-Shows</h4>
                </div>
                <p className="text-sm text-gray-600">
                  AI scores each booking 3 hours before class for no-show risk
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">2</div>
                  <h4 className="font-medium text-gray-900">Auto-Fill Spots</h4>
                </div>
                <p className="text-sm text-gray-600">
                  WhatsApp invites sent to waitlist when cancellations happen
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">3</div>
                  <h4 className="font-medium text-gray-900">Prevent Churn</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Early warning system flags at-risk members for retention
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
