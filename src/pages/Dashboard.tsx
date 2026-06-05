import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, AlertCircle, Activity, Clock } from 'lucide-react'
import { useMetrics, useBugTrend, usePriorityDistribution } from '@/hooks/useDashboard'
import { useTranslation } from 'react-i18next'

export function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useMetrics()
  const { data: bugTrend, isLoading: trendLoading }  = useBugTrend()
  const { data: priorityDist, isLoading: priorityLoading } = usePriorityDistribution()
  const { t } = useTranslation()

  return (
    <MainLayout title={t('dashboard.title')} subtitle={t('dashboard.subtitle')}>
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard
          icon={<BugIcon className="h-6 w-6 text-blue-500" />}
          label={t('dashboard.openBugs')}
          value={metricsLoading ? '...' : String(metrics?.openBugs ?? 0)}
          change={t('dashboard.last30')}
        />
        <MetricCard
          icon={<CheckCircle className="h-6 w-6 text-green-500" />}
          label={t('dashboard.closedBugs')}
          value={metricsLoading ? '...' : String(metrics?.closedBugs ?? 0)}
          change={t('dashboard.last30')}
        />
        <MetricCard
          icon={<AlertCircle className="h-6 w-6 text-red-500" />}
          label={t('dashboard.criticalBugs')}
          value={metricsLoading ? '...' : String(metrics?.criticalBugs ?? 0)}
          change={t('dashboard.active')}
        />
        <MetricCard
          icon={<Clock className="h-6 w-6 text-orange-500" />}
          label={t('dashboard.avgResolution')}
          value={metricsLoading ? '...' : `${metrics?.avgResolutionDays ?? 0} ${t('dashboard.avgResolutionUnit')}`}
          change={t('dashboard.avgCycle')}
        />
        <MetricCard
          icon={<TrendingUp className="h-6 w-6 text-purple-500" />}
          label={t('dashboard.throughput')}
          value={metricsLoading ? '...' : String(metrics?.monthlyThroughput ?? 0)}
          change={t('dashboard.thisMonth')}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.bugEvolution')}</CardTitle>
            <CardDescription>{t('dashboard.bugEvSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <LoadingSpinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={bugTrend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="opened" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="closed" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.priorityDist')}</CardTitle>
            <CardDescription>{t('dashboard.prioritySubtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {priorityLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <LoadingSpinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityDist ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {(priorityDist ?? []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.inProgress')}</CardTitle>
            <CardDescription>{t('dashboard.inProgressSub')}</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="h-[120px] flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="flex gap-8 items-center py-8">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('dashboard.inProgress')}</p>
                  <p className="text-4xl font-bold text-blue-400">{metrics?.inProgressTickets ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('dashboard.blocked')}</p>
                  <p className="text-4xl font-bold text-red-400">{metrics?.blockedTickets ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('dashboard.totalTickets')}</p>
                  <p className="text-4xl font-bold">{metrics?.totalTickets ?? 0}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.summary')}</CardTitle>
            <CardDescription>{t('dashboard.summarySub')}</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="h-[120px] flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart
                  data={[
                    { name: t('dashboard.open'),     value: metrics?.openBugs ?? 0 },
                    { name: t('dashboard.closed'),    value: metrics?.closedBugs ?? 0 },
                    { name: t('dashboard.critical'),  value: metrics?.criticalBugs ?? 0 },
                    { name: t('dashboard.throughput'), value: metrics?.monthlyThroughput ?? 0 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string
  change: string
}

function MetricCard({ icon, label, value, change }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-2">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-2">{change}</p>
          </div>
          <div className="opacity-60">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSpinner() {
  return (
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  )
}

function BugIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" /><path d="M12 1v6m4.22-4.22-4.24 4.24m6 6h-6m4.24 4.24-4.24-4.24m6-6-4.24 4.24M7.78 5.78 11.82 9.82M5 12H1M3.78 18.22l4.24-4.24m0 0 4.24 4.24M9 12v6" />
    </svg>
  )
}

function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
