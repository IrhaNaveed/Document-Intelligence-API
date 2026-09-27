import { FileText, Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { getApiErrorMessage } from '../../api/errors'
import { useDeleteDocument, useDocuments } from '../../features/documents/documentsHooks'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default function DocumentList() {
  const { data: documents, isLoading, isError, error } = useDocuments()
  const deleteDocument = useDeleteDocument()
  const [deleteError, setDeleteError] = useState(null)

  const handleDelete = (documentName) => {
    setDeleteError(null)
    deleteDocument.mutate(documentName, {
      onError: (deleteErr) =>
        setDeleteError(getApiErrorMessage(deleteErr, 'Failed to delete document. Please try again.')),
    })
  }

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
    <div className="space-y-3">
      {deleteError ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {deleteError}
        </p>
      ) : null}

      <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {documents.map((doc) => {
          const isDeleting =
            deleteDocument.isPending && deleteDocument.variables === doc.document_name

          return (
            <li
              key={doc.document_name}
              className="group flex items-center gap-3 bg-white px-4 py-3 dark:bg-slate-900"
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
              <button
                type="button"
                onClick={() => handleDelete(doc.document_name)}
                disabled={isDeleting}
                aria-label={`Delete ${doc.document_name}`}
                className="shrink-0 rounded-lg p-2 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-100 dark:hover:bg-red-500/10"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
