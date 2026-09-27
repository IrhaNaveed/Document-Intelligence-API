import { MessageSquare } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

import ChatComposer from '../components/chat/ChatComposer'
import ChatMessage from '../components/chat/ChatMessage'
import ConversationSidebar from '../components/chat/ConversationSidebar'
import { useChatMessages } from '../features/chat/chatHooks'
import { selectActiveConversationId } from '../features/chat/chatSlice'
import { useConversations, useLoadConversation } from '../features/conversations/conversationsHooks'

export default function ChatPage() {
  const messages = useChatMessages()
  const isStreaming = messages.some(
    (message) => message.status === 'pending' || message.status === 'streaming',
  )
  const bottomRef = useRef(null)
  const activeConversationId = useSelector(selectActiveConversationId)
  const { data: conversations } = useConversations()
  const loadConversation = useLoadConversation()
  const hasAutoSelectedRef = useRef(false)

  useEffect(() => {
    // Auto-select the most recent conversation exactly once, right after the
    // list first loads — not every time activeConversationId later becomes
    // null (e.g. from "New chat"), which would fight that reset.
    if (hasAutoSelectedRef.current || conversations === undefined) return
    hasAutoSelectedRef.current = true
    if (activeConversationId == null && conversations.length > 0) {
      loadConversation.mutate(conversations[0].id)
    }
  }, [activeConversationId, conversations, loadConversation])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex h-full">
      <ConversationSidebar disabled={isStreaming} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center">
                <MessageSquare className="h-8 w-8 text-slate-400" />
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  Ask anything about your documents
                </p>
                <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  Upload a document from the Documents tab, then ask a question here — answers are
                  grounded in what you uploaded.
                </p>
              </div>
            ) : (
              messages.map((message) => <ChatMessage key={message.id} message={message} />)
            )}
            <div ref={bottomRef} />
          </div>
        </div>
        <ChatComposer />
      </div>
    </div>
  )
}
