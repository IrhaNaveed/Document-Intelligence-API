import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const FormField = forwardRef(function FormField(
  { label, error, type = 'text', icon: Icon, ...inputProps },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword && showPassword ? 'text' : type

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>
      <span className="relative flex items-center">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3 h-4.5 w-4.5 text-slate-400" />
        ) : null}
        <input
          ref={ref}
          type={resolvedType}
          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${
            Icon ? 'pl-10' : ''
          } ${isPassword ? 'pr-10' : ''} ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-300 dark:border-slate-700'
          }`}
          {...inputProps}
        />
        {isPassword ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        ) : null}
      </span>
      {error ? <p className="mt-1.5 text-sm text-red-500">{error}</p> : null}
    </label>
  )
})

export default FormField
