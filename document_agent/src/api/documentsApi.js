import axiosClient from './axiosClient'

export async function fetchDocuments() {
  const { data } = await axiosClient.get('/api/documents')
  return data
}

export async function uploadDocument(file) {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await axiosClient.post('/api/fileUpload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
