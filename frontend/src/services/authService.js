import api from './api'

export async function register({ name, email, password, confirm_password }) {
  const response = await api.post('/auth/register/', { name, email, password, confirm_password })
  return response.data // { token, user }
}

export async function login(email, password) {
  const response = await api.post('/auth/login/', { email, password })
  return response.data // { token, user }
}

export async function logout() {
  await api.post('/auth/logout/')
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me/')
  return response.data // { id, name, email, date_joined }
}
