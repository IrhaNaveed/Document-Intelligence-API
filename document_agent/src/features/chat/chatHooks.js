import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { streamAsk } from '../../api/chatApi'
import { CONVERSATIONS_QUERY_KEY, useCreateConversation } from '../conversations/conversationsHooks'
import {
  assistantMessageCompleted,
  assistantMessageFailed,
  assistantSourcesReceived,
  assistantTokenReceived,
  conversationCreated,
  selectActiveConversationId,
  selectChatMessages,
  selectSelectedDocuments,
  userMessageSent,
} from './chatSlice'

export function useChatMessages() {
  return useSelector(selectChatMessages)
}

export function useSelectedDocuments() {
  return useSelector(selectSelectedDocuments)
}

export function useSendChatMessage() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const selectedDocuments = useSelector(selectSelectedDocuments)
  const activeConversationId = useSelector(selectActiveConversationId)
  const createConversationMutation = useCreateConversation()
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef(null)

  const sendMessage = useCallback(
    async (question) => {
      const trimmed = question.trim()
      if (!trimmed || isStreaming) return

      let conversationId = activeConversationId
      if (!conversationId) {
        try {
          const conversation = await createConversationMutation.mutateAsync()
          conversationId = conversation.id
          dispatch(conversationCreated(conversationId))
        } catch {
          return
        }
      }

      const action = dispatch(userMessageSent(trimmed))
      const { assistantMessageId } = action.payload

      const controller = new AbortController()
      abortRef.current = controller
      setIsStreaming(true)

      try {
        await streamAsk(
          { question: trimmed, documentNames: selectedDocuments, conversationId },
          {
            onSources: (sources) =>
              dispatch(assistantSourcesReceived({ id: assistantMessageId, sources })),
            onToken: (token) => dispatch(assistantTokenReceived({ id: assistantMessageId, token })),
            onDone: () => {
              dispatch(assistantMessageCompleted({ id: assistantMessageId }))
              queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
            },
            onError: (error) =>
              dispatch(assistantMessageFailed({ id: assistantMessageId, error: error.message })),
          },
          controller.signal,
        )
      } catch (error) {
        if (error.name !== 'AbortError') {
          dispatch(assistantMessageFailed({ id: assistantMessageId, error: error.message }))
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [
      activeConversationId,
      createConversationMutation,
      dispatch,
      isStreaming,
      queryClient,
      selectedDocuments,
    ],
  )

  return { sendMessage, isStreaming }
}
