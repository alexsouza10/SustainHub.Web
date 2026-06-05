import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Zap, AlertTriangle, Calendar } from 'lucide-react'
import { useTickets } from '@/hooks/useTickets'
import { useTranslation } from 'react-i18next'

export function WeeklyMeeting() {
  const { data, isLoading } = useTickets()
  const { t } = useTranslation()
  const tickets = data?.items ?? []

  const done       = tickets.filter((t: any) => t.status === 7)
  const inProgress = tickets.filter((t: any) => t.status === 3)
  const blocked    = tickets.filter((t: any) => t.status === 4)
  const backlog    = tickets.filter((t: any) => t.status === 1 || t.status === 2)

  const sections = [
    { titleKey: 'weeklyMeeting.delivered', emptyKey: 'weeklyMeeting.noneDelivered', icon: CheckCircle2, color: 'text-green-500', items: done },
    { titleKey: 'weeklyMeeting.currentWork', emptyKey: 'weeklyMeeting.noneInProgress', icon: Zap,          color: 'text-blue-500',  items: inProgress },
    { titleKey: 'weeklyMeeting.risks',       emptyKey: 'weeklyMeeting.noRisks',        icon: AlertTriangle, color: 'text-red-500',   items: blocked },
    { titleKey: 'weeklyMeeting.nextWeek',    emptyKey: 'weeklyMeeting.noneNext',        icon: Calendar,      color: 'text-blue-500',  items: backlog.slice(0, 5) },
  ]

  const now     = new Date()
  const weekNum = Math.ceil(((+now - +new Date(now.getFullYear(), 0, 1)) / 86400000 + 1) / 7)

  return (
    <MainLayout
      title={t('weeklyMeeting.title')}
      subtitle={`${t('weeklyMeeting.week')} ${weekNum} · ${now.getFullYear()}`}
    >
      <div className="flex justify-end mb-6">
        <Button className="bg-primary">
          {t('weeklyMeeting.generateSummary')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <div key={section.titleKey} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className={`p-3 rounded-full bg-muted ${section.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="w-0.5 bg-border flex-1 mt-2 mb-2 min-h-[200px]" />
                </div>

                <Card className="flex-1 mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{t(section.titleKey)}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {section.items.length} item{section.items.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{section.items.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {section.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t(section.emptyKey)}</p>
                    ) : (
                      section.items.map((ticket: any) => (
                        <div key={ticket.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
                          <p className="font-medium mb-1">{ticket.title}</p>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{ticket.assignedToUserName ?? ticket.createdByUserName ?? '—'}</span>
                            <Badge variant="outline" className="text-xs">
                              {t('weeklyMeeting.priority')} {ticket.priority}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </MainLayout>
  )
}
