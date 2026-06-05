import { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tags, AlertTriangle, Zap, Activity, TrendingUp, Send } from 'lucide-react'
import { useTickets } from '@/hooks/useTickets'
import { useMetrics } from '@/hooks/useDashboard'
import { useTranslation } from 'react-i18next'

export function AIInsights() {
  const [chatMessage, setChatMessage] = useState('')
  const { data: ticketData, isLoading: ticketsLoading } = useTickets()
  const { data: metrics, isLoading: metricsLoading }    = useMetrics()
  const { t } = useTranslation()

  const tickets = ticketData?.items ?? []

  const bugTickets      = tickets.filter((t: any) => t.type === 1)
  const featureTickets  = tickets.filter((t: any) => t.type === 2)
  const improvTickets   = tickets.filter((t: any) => t.type === 3)
  const techDebtTickets = tickets.filter((t: any) => t.type === 4)
  const total = tickets.length || 1

  const classifications = [
    { label: t('ticketType.bug'),         percent: Math.round((bugTickets.length      / total) * 100) },
    { label: t('ticketType.feature'),     percent: Math.round((featureTickets.length  / total) * 100) },
    { label: t('ticketType.improvement'), percent: Math.round((improvTickets.length   / total) * 100) },
    { label: t('ticketType.techDebt'),    percent: Math.round((techDebtTickets.length / total) * 100) },
  ]

  const blockedCount = tickets.filter((t: any) => t.status === 4).length
  const criticalOpen = tickets.filter((t: any) => t.priority === 1 && t.status !== 7 && t.status !== 8).length
  const risks = [
    blockedCount > 0
      ? { title: t('aiInsights.blockedRisk', { count: blockedCount }), confidence: 'high', severity: t('severity.high') }
      : null,
    criticalOpen > 0
      ? { title: t('aiInsights.criticalRisk', { count: criticalOpen }), confidence: 'high', severity: t('severity.high') }
      : null,
  ].filter(Boolean) as Array<{ title: string; confidence: string; severity: string }>

  const openTickets = tickets.filter((t: any) => t.status !== 7 && t.status !== 8).length
  const healthScore = openTickets === 0
    ? 100
    : Math.max(0, Math.round(100 - (criticalOpen / openTickets) * 100 - (blockedCount / openTickets) * 50))

  return (
    <MainLayout title={t('aiInsights.title')} subtitle={t('aiInsights.subtitle')}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Classification */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-primary" />
              <CardTitle>{t('aiInsights.classification')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticketsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}
              </div>
            ) : (
              classifications.map((c) => (
                <div key={c.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">{c.label}</span>
                    <span className="text-sm font-medium">{c.percent}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${c.percent}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Risk Detection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle>{t('aiInsights.riskDetection')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {ticketsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : risks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('aiInsights.noRisks')}</p>
            ) : (
              risks.map((r, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-1">{r.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Confidence {r.confidence}</span>
                    <Badge variant="outline" className="text-xs">{r.severity}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* AI Copilot */}
        <Card className="lg:row-span-2 flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <CardTitle>AI Copilot</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground">{t('aiInsights.chatComingSoon')}</p>
            <div className="flex-1 flex items-center justify-center min-h-[150px]">
              <Button className="bg-primary">What's the top risk this week?</Button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {risks.length > 0
                  ? `Top risk: ${risks[0].title}.`
                  : t('aiInsights.noRisks')}
              </p>
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <Input
                placeholder={t('aiInsights.chatPlaceholder')}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="text-xs"
              />
              <Button size="icon" variant="ghost">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backlog Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <CardTitle>Backlog Health</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {metricsLoading || ticketsLoading ? (
              <div className="h-16 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div>
                  <div className="text-4xl font-bold mb-1">{healthScore}</div>
                  <p className="text-sm text-muted-foreground">/ 100 health index</p>
                </div>
                <div>
                  <Badge
                    variant="secondary"
                    className={healthScore >= 70 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}
                  >
                    {healthScore >= 70 ? 'Healthy' : 'Needs attention'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">{openTickets} open items</p>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${healthScore}%` }} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ticket Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <CardTitle>{t('aiInsights.trend')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {metricsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}
              </div>
            ) : (
              [
                { name: t('dashboard.openBugs'),   value: metrics?.openBugs ?? 0,        max: Math.max(metrics?.openBugs ?? 0, 1) },
                { name: t('dashboard.closedBugs'),  value: metrics?.closedBugs ?? 0,       max: Math.max(metrics?.closedBugs ?? 0, 1) },
                { name: t('dashboard.inProgress'),  value: metrics?.inProgressTickets ?? 0, max: Math.max(metrics?.totalTickets ?? 1, 1) },
                { name: t('dashboard.blocked'),     value: metrics?.blockedTickets ?? 0,   max: Math.max(metrics?.totalTickets ?? 1, 1) },
              ].map(({ name, value, max }) => {
                const percent = max > 0 ? Math.round((value / max) * 100) : 0
                return (
                  <div key={name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">{name}</span>
                      <span className="text-sm font-bold text-blue-400">{value}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
