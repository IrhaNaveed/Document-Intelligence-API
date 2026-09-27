import { MessageSquarePlus, Trash2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'

import { newChatStarted, selectActiveConversationId } from '../../features/chat/chatSlice'
import {
  useConversations,
  useDeleteConversation,
  useLoadConversation,
} from '../../features/conversations/conversationsHooks'

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export default function ConversationSidebar({ disabled = false }) {
  const dispatch = useDispatch()
  const activeConversationId = useSelector(selectActiveConversationId)
  const { data: conversations, isLoading } = useConversations()
  const loadConversation = useLoadConversation()
  const deleteConversation = useDeleteConversation()

  const handleSelect = (id) => {
    if (disabled || id === activeConversationId) return
    loadConversation.mutate(id)
  }

  const handleDelete = (event, id) => {
    event.stopPropagation()
    if (disabled) return
    deleteConversation.mutate(id, {
      onSuccess: () => {
        if (id === activeConversationId) dispatch(newChatStarted())
      },
    })
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="p-3">
        <button
          type="button"
          onClick={() => !disabled && dispatch(newChatStarted())}
          disabled={disabled}
          title={disabled ? 'Wait for the current response to finish' : undefined}
          className="flex w-full items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {isLoading ? (
          <p className="px-2 py-2 text-sm text-slate-400">Loading…</p>
        ) : !conversations?.length ? (
          <p className="px-2 py-2 text-sm text-slate-400">No conversations yet</p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation) => (
              <li key={conversation.id} className="group relative">
                <button
                  type="button"
                  onClick={() => handleSelect(conversation.id)}
                  disabled={disabled && conversation.id !== activeConversationId}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 pr-8 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    conversation.id === activeConversationId
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{conversation.title}</span>
                    <span className="block text-xs text-slate-400">
                      {dateFormatter.format(new Date(conversation.updated_at))}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(event) => handleDelete(event, conversation.id)}
                  disabled={disabled}
                  aria-label="Delete conversation"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 opacity-0 hover:bg-slate-200 hover:text-red-500 group-hover:opacity-100 disabled:pointer-events-none dark:hover:bg-slate-800"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
