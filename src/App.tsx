import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'

const Dashboard    = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Tasks        = lazy(() => import('@/pages/Tasks').then(m => ({ default: m.Tasks })))
const Sprints      = lazy(() => import('@/pages/Sprints').then(m => ({ default: m.Sprints })))
const WeeklyMeeting= lazy(() => import('@/pages/WeeklyMeeting').then(m => ({ default: m.WeeklyMeeting })))
const AIInsights   = lazy(() => import('@/pages/AIInsights').then(m => ({ default: m.AIInsights })))
const Admin        = lazy(() => import('@/pages/Admin').then(m => ({ default: m.Admin })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
    },
  },
})

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard"      element={<Dashboard />} />
              <Route path="/tasks"          element={<Tasks />} />
              <Route path="/sprints"        element={<Sprints />} />
              <Route path="/admin"          element={<Admin />} />
              <Route path="/weekly-meeting" element={<WeeklyMeeting />} />
              <Route path="/ai-insights"    element={<AIInsights />} />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/bugs"            element={<Navigate to="/tasks" replace />} />
            <Route path="/features"        element={<Navigate to="/tasks" replace />} />
            <Route path="/monthly-reports" element={<Navigate to="/tasks" replace />} />
            <Route path="/todo-planner"    element={<Navigate to="/tasks" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
