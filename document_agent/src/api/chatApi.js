import { store } from '../app/store'

const EVENT_LINE = /^event: (.+)$/m
const DATA_LINE = /^data: (.+)$/m

/**
 * POSTs to /api/ask/stream and invokes callbacks as Server-Sent Events arrive.
 * Plain `fetch` is used instead of EventSource because EventSource can't send
 * a POST body or an Authorization header.
 */
export async function streamAsk(
  { question, documentNames, conversationId, topK = 5 },
  callbacks,
  signal,
) {
  const { onSources, onToken, onDone, onError } = callbacks
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  const token = store.getState().auth.token

  const response = await fetch(`${baseURL}/api/ask/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      question,
      conversation_id: conversationId,
      document_names: documentNames?.length ? documentNames : null,
      top_k: topK,
    }),
    signal,
  })

  if (!response.ok || !response.body) {
    const detail = await response.json().catch(() => null)
    throw new Error(detail?.detail || `Request failed with status ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)

      const eventMatch = rawEvent.match(EVENT_LINE)
      const dataMatch = rawEvent.match(DATA_LINE)
      if (eventMatch && dataMatch) {
        const eventName = eventMatch[1]
        const data = JSON.parse(dataMatch[1])

        if (eventName === 'sources') onSources?.(data)
        else if (eventName === 'token') onToken?.(data)
        else if (eventName === 'done') onDone?.()
        else if (eventName === 'error') onError?.(new Error(data.detail || 'Something went wrong'))
      }

      boundary = buffer.indexOf('\n\n')
    }
  }
}
