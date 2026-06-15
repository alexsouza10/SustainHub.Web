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
  const [error, setError]         = useState<string | null>(null)
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">

        {/* Card principal */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
              S
            </div>
            <div>
              <div className="text-base font-bold tracking-tight leading-tight">SustainHub</div>
              <div className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase">Maintenance OS</div>
            </div>
          </div>

          {/* Título */}
          <div className="mb-7">
            <h1 className="text-xl font-bold tracking-tight mb-1">{t('register.title')}</h1>
            <p className="text-muted-foreground text-sm">{t('register.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{t('register.fullName')}</label>
              <Input
                placeholder={t('register.fullNamePlaceholder')}
                className="h-11"
                {...register('userName', { required: t('register.nameRequired') })}
              />
              {errors.userName && <p className="text-xs text-red-500 font-medium">{errors.userName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{t('register.companyName')}</label>
              <Input
                placeholder={t('register.companyPlaceholder')}
                className="h-11"
                {...register('companyName', { required: t('register.companyRequired') })}
              />
              {errors.companyName && <p className="text-xs text-red-500 font-medium">{errors.companyName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{t('register.email')}</label>
              <Input
                type="email"
                placeholder="voce@empresa.com"
                className="h-11"
                {...register('email', {
                  required: t('register.emailRequired'),
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('register.emailInvalid') },
                })}
              />
              {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t('register.password')}</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="h-11"
                  {...register('password', {
                    required:  t('register.passwordRequired'),
                    minLength: { value: 8, message: t('register.passwordMin') },
                  })}
                />
                {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t('register.confirmPassword')}</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="h-11"
                  {...register('confirmPassword', {
                    required: t('register.confirmRequired'),
                    validate: (v) => v === password || t('register.passwordMismatch'),
                  })}
                />
                {errors.confirmPassword && <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold mt-1 shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t('register.submitting')}
                </span>
              ) : t('register.submit')}
            </Button>
          </form>

          <p className="text-sm text-center mt-6 text-muted-foreground">
            {t('register.alreadyAccount')}{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              {t('register.signIn')}
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
