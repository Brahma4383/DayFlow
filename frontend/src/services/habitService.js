import api from './api'

export async function getHabits(params = {}) {
  const response = await api.get('/habits/', { params })
  return response.data // { count, next, previous, results }
}

export async function createHabit(fields) {
  const response = await api.post('/habits/', fields)
  return response.data
}

export async function updateHabit(id, fields) {
  const response = await api.patch(`/habits/${id}/`, fields)
  return response.data
}

export async function deleteHabit(id) {
  await api.delete(`/habits/${id}/`)
}

// Tick (completed = true) or untick (false) the habit for today. Returns the habit with updated progress.
export async function setHabitCompleted(id, completed) {
  const response = await api.post(`/habits/${id}/complete/`, { completed })
  return response.data
}

// For each day from start to end ("YYYY-MM-DD"): how many habits were ticked out of how many existed
export async function getHabitHistory(start, end) {
  const response = await api.get('/habits/history/', { params: { start, end } })
  return response.data // [{ date, done, total }]
}
