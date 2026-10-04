import { zodResolver } from '@hookform/resolvers/zod'
import { Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { getApiErrorMessage } from '../api/errors'
import AuthLayout from '../components/AuthLayout'
import FormField from '../components/FormField'
import { useChangePassword, useLogout } from '../features/auth/authHooks'
import { selectIsAuthenticated, selectMustChangePassword } from '../features/auth/authSlice'

const changeSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const mustChangePassword = useSelector(selectMustChangePassword)
  const logout = useLogout()
  const changeMutation = useChangePassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changeSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (!mustChangePassword && !changeMutation.isSuccess) {
    return <Navigate to="/" replace />
  }

  const onSubmit = ({ newPassword }) => {
    changeMutation.mutate(
      { newPassword },
      {
        onSuccess: () => {
          logout()
          navigate('/login', { replace: true })
        },
      },
    )
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Your password was reset. Choose a new one to continue">
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          label="New password"
          type="password"
          icon={Lock}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />

        <FormField
          label="Confirm new password"
          type="password"
          icon={Lock}
          placeholder="Re-enter your new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {changeMutation.isError ? (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {getApiErrorMessage(changeMutation.error, 'Unable to change password. Please try again.')}
          </p>
        ) : null}

        <button type="submit" disabled={changeMutation.isPending} className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
          {changeMutation.isPending ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </AuthLayout>
  )
}
