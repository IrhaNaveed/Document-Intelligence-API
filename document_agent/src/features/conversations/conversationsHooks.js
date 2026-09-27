import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import {
  createConversation,
  deleteConversation,
  fetchConversation,
  fetchConversations,
} from '../../api/conversationsApi'
import { conversationLoaded } from '../chat/chatSlice'

export const CONVERSATIONS_QUERY_KEY = ['conversations']

export function useConversations() {
  return useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: fetchConversations,
    staleTime: 30 * 1000,
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
    },
  })
}

export function useLoadConversation() {
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: fetchConversation,
    onSuccess: (data) => {
      dispatch(
        conversationLoaded({
          id: data.id,
          messages: data.messages.map((message) => ({
            id: `db-${message.id}`,
            role: message.role,
            content: message.content,
            sources: message.sources || [],
            status: 'done',
            error: null,
          })),
        }),
      )
    },
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
    },
  })
}
