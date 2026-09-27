import { ChevronDown, FileStack } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

import { useSelectedDocuments } from '../../features/chat/chatHooks'
import { setSelectedDocuments } from '../../features/chat/chatSlice'
import { useDocuments } from '../../features/documents/documentsHooks'

export default function ChatDocumentScope() {
  const { data: documents } = useDocuments()
  const selectedDocuments = useSelectedDocuments()
  const dispatch = useDispatch()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDocument = (name) => {
    const next = selectedDocuments.includes(name)
      ? selectedDocuments.filter((doc) => doc !== name)
      : [...selectedDocuments, name]
    dispatch(setSelectedDocuments(next))
  }

  const label =
    selectedDocuments.length === 0
      ? 'All documents'
      : `${selectedDocuments.length} document${selectedDocuments.length === 1 ? '' : 's'} selected`

  if (!documents?.length) return null

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <FileStack className="h-3.5 w-3.5" />
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open ? (
        <div className="absolute bottom-full left-0 z-10 mb-2 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <p className="px-2 py-1 text-xs font-medium text-slate-400">
            Scope questions to specific documents
          </p>
          <div className="max-h-48 overflow-y-auto">
            {documents.map((doc) => (
              <label
                key={doc.document_name}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <input
                  type="checkbox"
                  checked={selectedDocuments.includes(doc.document_name)}
                  onChange={() => toggleDocument(doc.document_name)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="truncate">{doc.document_name}</span>
              </label>
            ))}
          </div>
          {selectedDocuments.length > 0 ? (
            <button
              type="button"
              onClick={() => dispatch(setSelectedDocuments([]))}
              className="mt-1 w-full rounded-md px-2 py-1 text-left text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
            >
              Clear selection
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
