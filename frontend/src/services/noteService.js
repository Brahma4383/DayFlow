import api from './api'

// Notes per page; the grid shows more at once than the task list does
export const NOTES_PAGE_SIZE = 24

// params: search, color (e.g. "yellow,blue"), pinned (true/false), ordering, page, page_size
export async function getNotes(params = {}) {
  const response = await api.get('/notes/', { params })
  return response.data // { count, next, previous, results }
}

export async function createNote(fields) {
  const response = await api.post('/notes/', fields)
  return response.data
}

// Changes only the fields sent, e.g. updateNote(5, { pinned: true })
export async function updateNote(id, fields) {
  const response = await api.patch(`/notes/${id}/`, fields)
  return response.data
}

export async function deleteNote(id) {
  await api.delete(`/notes/${id}/`)
}
