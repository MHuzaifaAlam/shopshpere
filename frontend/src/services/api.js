import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const clearAuthData = () => {
  localStorage.removeItem('shopSphereAccessToken')
  localStorage.removeItem('shopSphereRefreshToken')
  localStorage.removeItem('shopSphereUser')
}

const setAuthData = ({ access, refresh, user }) => {
  if (access) {
    localStorage.setItem('shopSphereAccessToken', access)
  }

  if (refresh) {
    localStorage.setItem('shopSphereRefreshToken', refresh)
  }

  if (user) {
    localStorage.setItem('shopSphereUser', JSON.stringify(user))
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shopSphereAccessToken')

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  return config
})

let refreshPromise = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('shopSphereRefreshToken')

      if (!refreshToken) {
        clearAuthData()
        return Promise.reject(error)
      }

      if (!refreshPromise) {
        refreshPromise = api.post('/api/token/refresh/', { refresh: refreshToken })
      }

      try {
        const { data } = await refreshPromise
        const accessToken = data.access

        setAuthData({ access: accessToken, refresh: refreshToken })
        originalRequest._retry = true
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        refreshPromise = null

        return api(originalRequest)
      } catch (refreshError) {
        clearAuthData()
        refreshPromise = null
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export { clearAuthData, setAuthData }
