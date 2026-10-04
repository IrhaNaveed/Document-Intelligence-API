import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { getApiErrorMessage } from '../api/errors'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import { useForgotPassword } from '../features/auth/authHooks'

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

export default function ForgotPasswordPage() {
  const forgotMutation = useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = (values) => forgotMutation.mutate(values)

  return (
    <AuthLayout title="Forgot password" subtitle="We'll reset your password to a temporary one">
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          label="Email"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        {forgotMutation.isSuccess ? (
          <p className="rounded-lg bg-green-50 px-3.5 py-2.5 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-400">
            {forgotMutation.data.message}
          </p>
        ) : null}

        {forgotMutation.isError ? (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {getApiErrorMessage(forgotMutation.error, 'Unable to reset password. Please try again.')}
          </p>
        ) : null}

        <button type="submit" disabled={forgotMutation.isPending} className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
          {forgotMutation.isPending ? 'Resetting…' : 'Reset password'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
