import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { useTodos, useUpdateTodo } from '@/hooks/useTodos'
import { useTranslation } from 'react-i18next'

const priorityColor: Record<number, string> = {
  1: 'bg-red-500/10 text-red-400',
  2: 'bg-orange-500/10 text-orange-400',
  3: 'bg-yellow-500/10 text-yellow-400',
  4: 'bg-green-500/10 text-green-400',
}

export function TodoPlanner() {
  const { data: todos, isLoading, isError } = useTodos({ myTodosOnly: false })
  const updateTodo = useUpdateTodo()
  const { t } = useTranslation()

  const columns = [
    { id: 1, titleKey: 'todo.backlog'    },
    { id: 2, titleKey: 'todo.thisWeek'   },
    { id: 3, titleKey: 'todo.inProgress' },
    { id: 4, titleKey: 'todo.waiting'    },
    { id: 5, titleKey: 'todo.done'       },
  ]

  const priorityLabel: Record<number, string> = {
    1: t('severity.critical'),
    2: t('severity.high'),
    3: t('severity.medium'),
    4: t('severity.low'),
  }

  const groupedTodos = (todos ?? []).reduce((acc: Record<number, any[]>, todo: any) => {
    const status = todo.status ?? 1
    if (!acc[status]) acc[status] = []
    acc[status].push(todo)
    return acc
  }, {})

  const handleMoveToNext = (todo: any) => {
    const nextStatus = Math.min(todo.status + 1, 5)
    if (nextStatus !== todo.status) {
      updateTodo.mutate({ id: todo.id, data: { status: nextStatus } })
    }
  }

  return (
    <MainLayout title={t('todo.title')} subtitle={t('todo.subtitle')}>
      {isError && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {t('todo.error')}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4 auto-cols-max overflow-x-auto">
        {columns.map((column) => {
          const items = groupedTodos[column.id] ?? []
          return (
            <div key={column.id} className="min-w-[350px] space-y-3">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{t(column.titleKey)}</h3>
                  <Badge variant="secondary" className="rounded-full w-6 h-6 flex items-center justify-center p-0 text-xs">
                    {isLoading ? '...' : items.length}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-lg p-3">
                {isLoading ? (
                  [...Array(2)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                  ))
                ) : items.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center pt-4">{t('todo.noItems')}</p>
                ) : (
                  items.map((todo: any) => (
                    <Card key={todo.id} className="cursor-move hover:shadow-md transition-shadow">
                      <CardContent className="p-3 space-y-2">
                        <p className="text-sm font-medium">{todo.title}</p>
                        {todo.relatedTicketTitle && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 bg-blue-500/10 text-blue-400">
                            {todo.relatedTicketTitle}
                          </Badge>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
                              {(todo.userName ?? 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            {column.id < 5 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-xs"
                                onClick={() => handleMoveToNext(todo)}
                                title={t('todo.moveNext')}
                              >
                                →
                              </Button>
                            )}
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-xs px-2 ${priorityColor[todo.priority] ?? 'bg-gray-500/10 text-gray-400'}`}
                          >
                            {priorityLabel[todo.priority] ?? String(todo.priority)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </MainLayout>
  )
}
