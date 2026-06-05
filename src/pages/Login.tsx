import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface LoginFormData {
  email: string
  password: string
}

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { t } = useTranslation()
  const [error, setError]     = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setIsLoading(true)
    try {
      const response = await authService.login({ email: data.email, password: data.password })
      const { token, refreshToken, user, tenantName } = response.data
      login(user, tenantName, token, refreshToken)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      const msg = err.response?.data?.error || t('login.error')
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-lg">
            S
          </div>
          <div>
            <div className="text-xl font-bold">SustainHub</div>
            <div className="text-xs text-muted-foreground">Maintenance OS</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold mb-2">{t('login.title')}</h1>
          <p className="text-muted-foreground text-sm mb-6">{t('login.subtitle')}</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('login.email')}</label>
              <Input
                type="email"
                placeholder="you@company.com"
                {...register('email', { required: t('login.emailRequired') })}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">{t('login.password')}</label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register('password', { required: t('login.passwordRequired') })}
              />
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('login.submitting') : t('login.submit')}
            </Button>
          </form>

          <p className="text-sm text-center mt-6 text-muted-foreground">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              {t('login.createAccount')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
