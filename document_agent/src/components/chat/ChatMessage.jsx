import { AlertCircle, FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function ChatMessage({ message }) {
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    )
  }

  const isPending = message.status === 'pending'
  const hasSources = message.sources?.length > 0

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100">
        {isPending ? (
          <span className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking…
          </span>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}

        {message.status === 'error' ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {message.error || 'Something went wrong.'}
          </p>
        ) : null}

        {hasSources ? (
          <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setSourcesOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <FileText className="h-3.5 w-3.5" />
              {sourcesOpen ? 'Hide sources' : `${message.sources.length} source${message.sources.length === 1 ? '' : 's'}`}
            </button>
            {sourcesOpen ? (
              <ul className="mt-2 space-y-2">
                {message.sources.map((source, index) => (
                  <li
                    key={`${source.document}-${source.page}-${index}`}
                    className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                  >
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {source.document}
                      {source.page != null ? ` · page ${source.page}` : ''}
                    </p>
                    <p className="mt-1 line-clamp-3">{source.content}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
