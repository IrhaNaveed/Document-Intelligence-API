import axios from 'axios'

import { store } from '../app/store'
import { logout, passwordChangeRequired } from '../features/auth/authSlice'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
})

axiosClient.interceptors.request.use((config) => {
  const { token } = store.getState().auth
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout())
    }
    if (error.response?.status === 403 && error.response.data?.detail === 'Password change required') {
      store.dispatch(passwordChangeRequired())
    }
    return Promise.reject(error)
  },
)

export default axiosClient
