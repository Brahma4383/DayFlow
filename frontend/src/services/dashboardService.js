import api from './api'

export async function getDashboardStats() {
  const response = await api.get('/dashboard/')
  return response.data // { total_tasks, completed_tasks, pending_tasks, total_habits, completed_habits, productivity_score, focus_minutes }
}

export async function getProductivity() {
  const response = await api.get('/dashboard/productivity/')
  return response.data // { task_completion, habit_completion, focus_score, productivity_score }
}

export async function getWeeklyReport() {
  const response = await api.get('/dashboard/weekly-report/')
  return response.data // [{ date: "Monday", score: 80 }, ...]
}

export async function getOverview() {
  const response = await api.get('/dashboard/overview/')
  return response.data // { completed_this_week, completed_last_week, status, open_by_priority, upcoming, recent_activity, ... }
}

// The score and its numbers for each of the last `days` days, oldest first
export async function getHistory(days = 30) {
  const response = await api.get('/dashboard/history/', { params: { days } })
  return response.data // [{ date, day, productivity_score, task_completion, habit_completion, focus_score, focus_minutes, ... }]
}
