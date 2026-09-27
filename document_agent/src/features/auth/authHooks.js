import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { fetchCurrentUser, loginRequest, registerRequest } from '../../api/authApi'
import { chatCleared } from '../chat/chatSlice'
import { logout, selectAuthToken, setCredentials, setUser } from './authSlice'

export function useRegister() {
  return useMutation({
    mutationFn: registerRequest,
  })
}

export function useLogin() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      dispatch(setCredentials({ token: data.access_token }))
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
  })
}

export function useCurrentUser() {
  const dispatch = useDispatch()
  const token = useSelector(selectAuthToken)

  const query = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    enabled: Boolean(token),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (query.data) {
      dispatch(setUser(query.data))
    }
  }, [query.data, dispatch])

  useEffect(() => {
    if (query.isError) {
      dispatch(logout())
    }
  }, [query.isError, dispatch])

  return query
}

export function useLogout() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  return () => {
    dispatch(logout())
    dispatch(chatCleared())
    queryClient.clear()
  }
}
