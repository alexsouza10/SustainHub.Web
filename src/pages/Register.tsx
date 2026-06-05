import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface RegisterFormData {
  userName: string
  companyName: string
  email: string
  password: string
  confirmPassword: string
}

export function Register() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { t } = useTranslation()
  const [error, setError]     = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>()
  const password = watch('password')

  const onSubmit = async (data: RegisterFormData) => {
    setError(null)
    setIsLoading(true)
    try {
      const response = await authService.signup({
        userName:    data.userName,
        companyName: data.companyName,
        email:       data.email,
        password:    data.password,
      })
      const { token, refreshToken, user, tenantName } = response.data
      login(user, tenantName, token, refreshToken)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      const msg = err.response?.data?.error || t('register.error')
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
          <h1 className="text-2xl font-bold mb-2">{t('register.title')}</h1>
          <p className="text-muted-foreground text-sm mb-6">{t('register.subtitle')}</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('register.fullName')}</label>
              <Input
                placeholder={t('register.fullNamePlaceholder')}
                {...register('userName', { required: t('register.nameRequired') })}
              />
              {errors.userName && <p className="text-xs text-red-400">{errors.userName.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">{t('register.companyName')}</label>
              <Input
                placeholder={t('register.companyPlaceholder')}
                {...register('companyName', { required: t('register.companyRequired') })}
              />
              {errors.companyName && <p className="text-xs text-red-400">{errors.companyName.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">{t('register.email')}</label>
              <Input
                type="email"
                placeholder="you@company.com"
                {...register('email', {
                  required: t('register.emailRequired'),
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('register.emailInvalid') },
                })}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">{t('register.password')}</label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register('password', {
                  required:  t('register.passwordRequired'),
                  minLength: { value: 8, message: t('register.passwordMin') },
                })}
              />
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">{t('register.confirmPassword')}</label>
              <Input
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword', {
                  required: t('register.confirmRequired'),
                  validate: (value) => value === password || t('register.passwordMismatch'),
                })}
              />
              {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('register.submitting') : t('register.submit')}
            </Button>
          </form>

          <p className="text-sm text-center mt-6 text-muted-foreground">
            {t('register.alreadyAccount')}{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              {t('register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
