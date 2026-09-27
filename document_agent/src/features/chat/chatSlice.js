import { createSlice, nanoid } from '@reduxjs/toolkit'

const initialState = {
  activeConversationId: null,
  messages: [],
  selectedDocuments: [],
}

function findMessage(state, id) {
  return state.messages.find((message) => message.id === id)
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSelectedDocuments(state, action) {
      state.selectedDocuments = action.payload
    },
    newChatStarted(state) {
      state.activeConversationId = null
      state.messages = []
    },
    conversationCreated(state, action) {
      state.activeConversationId = action.payload
      state.messages = []
    },
    conversationLoaded(state, action) {
      state.activeConversationId = action.payload.id
      state.messages = action.payload.messages
    },
    userMessageSent: {
      reducer(state, action) {
        const { userMessageId, assistantMessageId, content } = action.payload
        state.messages.push({ id: userMessageId, role: 'user', content })
        state.messages.push({
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          sources: [],
          status: 'pending',
          error: null,
        })
      },
      prepare(content) {
        return {
          payload: { userMessageId: nanoid(), assistantMessageId: nanoid(), content },
        }
      },
    },
    assistantSourcesReceived(state, action) {
      const message = findMessage(state, action.payload.id)
      if (message) {
        message.sources = action.payload.sources
      }
    },
    assistantTokenReceived(state, action) {
      const message = findMessage(state, action.payload.id)
      if (message) {
        message.content += action.payload.token
        message.status = 'streaming'
      }
    },
    assistantMessageCompleted(state, action) {
      const message = findMessage(state, action.payload.id)
      if (message) {
        message.status = 'done'
      }
    },
    assistantMessageFailed(state, action) {
      const message = findMessage(state, action.payload.id)
      if (message) {
        message.status = 'error'
        message.error = action.payload.error
      }
    },
    chatCleared() {
      return initialState
    },
  },
})

export const {
  setSelectedDocuments,
  newChatStarted,
  conversationCreated,
  conversationLoaded,
  userMessageSent,
  assistantSourcesReceived,
  assistantTokenReceived,
  assistantMessageCompleted,
  assistantMessageFailed,
  chatCleared,
} = chatSlice.actions

export default chatSlice.reducer

export const selectChatMessages = (state) => state.chat.messages
export const selectSelectedDocuments = (state) => state.chat.selectedDocuments
export const selectActiveConversationId = (state) => state.chat.activeConversationId
