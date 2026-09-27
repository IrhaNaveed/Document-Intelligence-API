import axiosClient from './axiosClient'

export async function fetchConversations() {
  const { data } = await axiosClient.get('/api/conversations')
  return data
}

export async function createConversation() {
  const { data } = await axiosClient.post('/api/conversations')
  return data
}

export async function fetchConversation(id) {
  const { data } = await axiosClient.get(`/api/conversations/${id}`)
  return data
}

export async function deleteConversation(id) {
  await axiosClient.delete(`/api/conversations/${id}`)
}
