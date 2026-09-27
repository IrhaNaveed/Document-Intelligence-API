import { Loader2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

import { getApiErrorMessage } from '../../api/errors'
import { useUploadDocument } from '../../features/documents/documentsHooks'

const ALLOWED_EXTENSIONS = ['pdf', 'docx']

export default function DocumentUploadButton() {
  const inputRef = useRef(null)
  const uploadMutation = useUploadDocument()
  const [error, setError] = useState(null)

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError('Only PDF and DOCX files are supported.')
      return
    }

    setError(null)
    uploadMutation.mutate(file, {
      onError: (uploadError) => setError(getApiErrorMessage(uploadError, 'Upload failed. Please try again.')),
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploadMutation.isPending}
        className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploadMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {uploadMutation.isPending ? 'Uploading…' : 'Upload document'}
      </button>
      {error ? <p className="max-w-xs text-right text-sm text-red-500">{error}</p> : null}
    </div>
  )
}
