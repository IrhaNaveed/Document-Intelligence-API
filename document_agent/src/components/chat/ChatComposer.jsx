import { Send } from 'lucide-react'
import { useState } from 'react'

import { useSendChatMessage } from '../../features/chat/chatHooks'
import ChatDocumentScope from './ChatDocumentScope'

export default function ChatComposer() {
  const [value, setValue] = useState('')
  const { sendMessage, isStreaming } = useSendChatMessage()

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!value.trim() || isStreaming) return
    sendMessage(value)
    setValue('')
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit(event)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        <div className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white p-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask a question about your documents…"
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!value.trim() || isStreaming}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <ChatDocumentScope />
      </div>
    </form>
  )
}
