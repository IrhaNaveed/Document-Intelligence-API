import DocumentList from '../components/documents/DocumentList'
import DocumentUploadButton from '../components/documents/DocumentUploadButton'

export default function DocumentsPage() {
  return (
    <div className="mx-auto h-full max-w-3xl overflow-y-auto px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Your documents</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Upload PDFs, Word documents, or Excel spreadsheets to make them searchable in the chat.
          </p>
        </div>
        <DocumentUploadButton />
      </div>

      <DocumentList />
    </div>
  )
}
