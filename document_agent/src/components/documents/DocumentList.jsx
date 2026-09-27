import { FileText, Loader2 } from 'lucide-react'

import { getApiErrorMessage } from '../../api/errors'
import { useDocuments } from '../../features/documents/documentsHooks'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default function DocumentList() {
  const { data: documents, isLoading, isError, error } = useDocuments()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-slate-500 dark:text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading documents…
      </div>
    )
  }

  if (isError) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
        {getApiErrorMessage(error, 'Unable to load documents.')}
      </p>
    )
  }

  if (!documents?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
        <FileText className="h-8 w-8 text-slate-400" />
        <p className="font-medium text-slate-700 dark:text-slate-300">No documents yet</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload a PDF, DOCX, or XLSX to start asking questions about it.
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
      {documents.map((doc) => (
        <li
          key={doc.document_name}
          className="flex items-center gap-3 bg-white px-4 py-3 dark:bg-slate-900"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-900 dark:text-white">
              {doc.document_name}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {doc.chunk_count} chunk{doc.chunk_count === 1 ? '' : 's'} · uploaded{' '}
              {dateFormatter.format(new Date(doc.uploaded_at))}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
