import api from './api'

// The running session, or null if none (the API answers 204 No Content)
export async function getActiveSession() {
  const response = await api.get('/focus/active/')
  return response.status === 204 ? null : response.data
}

export async function startSession({ task, duration }) {
  const response = await api.post('/focus/start/', { task, duration })
  return response.data
}

// Complete / cancel act on the user's one running session, so no id is needed
export async function completeSession() {
  const response = await api.post('/focus/complete/')
  return response.data
}

export async function cancelSession() {
  const response = await api.post('/focus/cancel/')
  return response.data
}

// Past sessions, newest first. params: page, page_size
export async function getFocusHistory(params = {}) {
  const response = await api.get('/focus/history/', { params })
  return response.data // { count, next, previous, results }
}
