import { createSlice } from '@reduxjs/toolkit'

const TOKEN_STORAGE_KEY = 'document_agent.access_token'

const initialState = {
  token: localStorage.getItem(TOKEN_STORAGE_KEY),
  user: null,
  mustChangePassword: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.token = action.payload.token
      state.mustChangePassword = Boolean(action.payload.mustChangePassword)
      localStorage.setItem(TOKEN_STORAGE_KEY, action.payload.token)
    },
    passwordChangeRequired(state) {
      state.mustChangePassword = true
    },
    setUser(state, action) {
      state.user = action.payload
      state.mustChangePassword = Boolean(action.payload.must_change_password)
    },
    logout(state) {
      state.token = null
      state.user = null
      state.mustChangePassword = false
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    },
  },
})

export const { setCredentials, passwordChangeRequired, setUser, logout } = authSlice.actions
export default authSlice.reducer

export const selectIsAuthenticated = (state) => Boolean(state.auth.token)
export const selectCurrentUser = (state) => state.auth.user
export const selectAuthToken = (state) => state.auth.token
export const selectMustChangePassword = (state) => state.auth.mustChangePassword
