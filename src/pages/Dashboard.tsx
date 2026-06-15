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

/* Cores do tooltip e eixos via CSS variables — funcionam em ambos os temas */
const CHART_TOOLTIP = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.625rem',
  color: 'hsl(var(--card-foreground))',
  boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.12)',
  fontSize: '12px',
}
const CHART_AXIS_COLOR  = 'hsl(var(--muted-foreground))'
const CHART_GRID_COLOR  = 'hsl(var(--border))'

export function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useMetrics()
  const { data: bugTrend, isLoading: trendLoading }  = useBugTrend()
  const { data: priorityDist, isLoading: priorityLoading } = usePriorityDistribution()
  const { t } = useTranslation()

  return (
    <MainLayout title={t('dashboard.title')} subtitle={t('dashboard.subtitle')}>
      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <MetricCard
          icon={<BugIcon className="h-5 w-5 text-blue-500" />}
          label={t('dashboard.openBugs')}
          value={metricsLoading ? '...' : String(metrics?.openBugs ?? 0)}
          change={t('dashboard.last30')}
          accent="blue"
        />
        <MetricCard
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          label={t('dashboard.closedBugs')}
          value={metricsLoading ? '...' : String(metrics?.closedBugs ?? 0)}
          change={t('dashboard.last30')}
          accent="green"
        />
        <MetricCard
          icon={<AlertCircle className="h-5 w-5 text-red-500" />}
          label={t('dashboard.criticalBugs')}
          value={metricsLoading ? '...' : String(metrics?.criticalBugs ?? 0)}
          change={t('dashboard.active')}
          accent="red"
        />
        <MetricCard
          icon={<Clock className="h-5 w-5 text-orange-500" />}
          label={t('dashboard.avgResolution')}
          value={metricsLoading ? '...' : `${metrics?.avgResolutionDays ?? 0} ${t('dashboard.avgResolutionUnit')}`}
          change={t('dashboard.avgCycle')}
          accent="orange"
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          label={t('dashboard.throughput')}
          value={metricsLoading ? '...' : String(metrics?.monthlyThroughput ?? 0)}
          change={t('dashboard.thisMonth')}
          accent="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('dashboard.bugEvolution')}</CardTitle>
            <CardDescription>{t('dashboard.bugEvSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <LoadingSpinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={bugTrend ?? []} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} strokeOpacity={0.6} />
                  <XAxis dataKey="month" stroke={CHART_AXIS_COLOR} tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis stroke={CHART_AXIS_COLOR} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP} cursor={{ stroke: CHART_GRID_COLOR }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="opened" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="closed" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('dashboard.priorityDist')}</CardTitle>
            <CardDescription>{t('dashboard.prioritySubtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {priorityLoading ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <LoadingSpinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={priorityDist ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    {(priorityDist ?? []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('dashboard.inProgress')}</CardTitle>
            <CardDescription>{t('dashboard.inProgressSub')}</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="h-[120px] flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="flex gap-6 items-center py-6 flex-wrap">
                <StatBlock
                  label={t('dashboard.inProgress')}
                  value={metrics?.inProgressTickets ?? 0}
                  color="text-blue-500"
                  bg="bg-blue-500/8"
                />
                <StatBlock
                  label={t('dashboard.blocked')}
                  value={metrics?.blockedTickets ?? 0}
                  color="text-red-500"
                  bg="bg-red-500/8"
                />
                <StatBlock
                  label={t('dashboard.totalTickets')}
                  value={metrics?.totalTickets ?? 0}
                  color="text-foreground"
                  bg="bg-muted/60"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('dashboard.summary')}</CardTitle>
            <CardDescription>{t('dashboard.summarySub')}</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="h-[160px] flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={[
                    { name: t('dashboard.open'),       value: metrics?.openBugs ?? 0 },
                    { name: t('dashboard.closed'),     value: metrics?.closedBugs ?? 0 },
                    { name: t('dashboard.critical'),   value: metrics?.criticalBugs ?? 0 },
                    { name: t('dashboard.throughput'), value: metrics?.monthlyThroughput ?? 0 },
                  ]}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} strokeOpacity={0.6} vertical={false} />
                  <XAxis dataKey="name" stroke={CHART_AXIS_COLOR} tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis stroke={CHART_AXIS_COLOR} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

// ── StatBlock ─────────────────────────────────────────────────────────────────

function StatBlock({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`flex-1 min-w-[100px] rounded-xl p-4 ${bg}`}>
      <p className={`text-3xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
    </div>
  )
}

// ── MetricCard ────────────────────────────────────────────────────────────────

const ACCENT_COLORS: Record<string, string> = {
  blue:   'bg-blue-500/8 dark:bg-blue-500/15',
  green:  'bg-green-500/8 dark:bg-green-500/15',
  red:    'bg-red-500/8 dark:bg-red-500/15',
  orange: 'bg-orange-500/8 dark:bg-orange-500/15',
  purple: 'bg-purple-500/8 dark:bg-purple-500/15',
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string
  change: string
  accent?: string
}

function MetricCard({ icon, label, value, change, accent = 'blue' }: MetricCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider truncate">
              {label}
            </p>
            <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-2 truncate">{change}</p>
          </div>
          <div className={`p-2.5 rounded-xl flex-shrink-0 ${ACCENT_COLORS[accent] ?? ACCENT_COLORS.blue}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSpinner() {
  return (
    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
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
