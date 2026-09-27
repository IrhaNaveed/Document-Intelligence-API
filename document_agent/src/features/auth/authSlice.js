import { createSlice } from '@reduxjs/toolkit'

const TOKEN_STORAGE_KEY = 'document_agent.access_token'

const initialState = {
  token: localStorage.getItem(TOKEN_STORAGE_KEY),
  user: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.token = action.payload.token
      localStorage.setItem(TOKEN_STORAGE_KEY, action.payload.token)
    },
    setUser(state, action) {
      state.user = action.payload
    },
    logout(state) {
      state.token = null
      state.user = null
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    },
  },
})

export const { setCredentials, setUser, logout } = authSlice.actions
export default authSlice.reducer

export const selectIsAuthenticated = (state) => Boolean(state.auth.token)
export const selectCurrentUser = (state) => state.auth.user
export const selectAuthToken = (state) => state.auth.token
