import axiosClient from './axiosClient'

export async function registerRequest({ email, password }) {
  const { data } = await axiosClient.post('/api/auth/register', { email, password })
  return data
}

export async function loginRequest({ email, password }) {
  const body = new URLSearchParams()
  body.set('username', email)
  body.set('password', password)

  const { data } = await axiosClient.post('/api/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export async function fetchCurrentUser() {
  const { data } = await axiosClient.get('/api/auth/me')
  return data
}
