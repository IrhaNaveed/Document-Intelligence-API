import { FileText, ShieldCheck, Sparkles } from 'lucide-react'

const FEATURES = [
  {
    icon: FileText,
    title: 'Understand any document',
    description: 'Upload contracts, reports, or notes and ask questions in plain language.',
  },
  {
    icon: Sparkles,
    title: 'Hybrid search + re-ranking',
    description: 'Retrieval-augmented answers grounded in your own files, not guesses.',
  },
  {
    icon: ShieldCheck,
    title: 'Your data stays yours',
    description: 'Every workspace is scoped to your account and protected by auth.',
  },
]

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900 px-12 py-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-brand-300/20 blur-3xl" />

        <div className="relative">
          <span className="text-xl font-semibold tracking-tight">Document Agent</span>
        </div>

        <div className="relative space-y-8">
          <h1 className="text-3xl font-semibold leading-tight text-balance">
            Ask questions. Get answers grounded in your documents.
          </h1>
          <ul className="space-y-5">
            {FEATURES.map(({ icon: Icon, title: featureTitle, description }) => (
              <li key={featureTitle} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="font-medium">{featureTitle}</p>
                  <p className="text-sm text-white/70">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/50">
          &copy; {new Date().getFullYear()} Document Agent. All rights reserved.
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="text-xl font-semibold tracking-tight text-brand-600 dark:text-brand-400">
              Document Agent
            </span>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          {subtitle ? (
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          ) : null}

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
