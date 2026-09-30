import api from './api'

// Tasks per page; the same as the backend's page size
export const PAGE_SIZE = 10

// params: search, status (e.g. "pending,in_progress"), priority, due_date, due_from, due_to, ordering, page, page_size
export async function getTasks(params = {}) {
  const response = await api.get('/tasks/', { params })
  return response.data // { count, next, previous, results }
}

export async function createTask(fields) {
  const response = await api.post('/tasks/', fields)
  return response.data
}

// Changes only the fields sent, e.g. updateTask(5, { status: 'completed' })
export async function updateTask(id, fields) {
  const response = await api.patch(`/tasks/${id}/`, fields)
  return response.data
}

export async function deleteTask(id) {
  await api.delete(`/tasks/${id}/`)
}
