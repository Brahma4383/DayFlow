import axios from 'axios'

// The login token is kept in the browser's localStorage under this key
const TOKEN_KEY = 'dayflow_token'
// Set when the server rejects the token, so the login page can explain why the user is there
const SESSION_EXPIRED_KEY = 'dayflow_session_expired'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const removeToken = () => localStorage.removeItem(TOKEN_KEY)

export const wasSessionExpired = () => sessionStorage.getItem(SESSION_EXPIRED_KEY) === 'yes'
export const clearSessionExpired = () => sessionStorage.removeItem(SESSION_EXPIRED_KEY)

// One axios instance for every call to the Django API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// Send the login token with every request
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

// If the token stops working (e.g. logged out in another tab), go back to the login page
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      removeToken()
      sessionStorage.setItem(SESSION_EXPIRED_KEY, 'yes')
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

export default api
