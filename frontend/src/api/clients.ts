import axios from 'axios'
import type {
  AuthResponse,
  EventForm,
  Profile,
  Event,
  Document,
  Settings,
} from './types'

const api = axios.create({
  baseURL: '/event_organizer/backend',  
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Авторизация ─────────────────────────────────────

export const register = (data: {
  name: string
  email: string
  password: string
}) => api.post<AuthResponse>('/auth/register.php', data)

export const login = (data: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login.php', data)

// Сохранить данные после входа/регистрации
export function saveAuth(data: AuthResponse) {
  localStorage.setItem('token', data.token)
  localStorage.setItem('name', data.name)
  localStorage.setItem('email', data.email)
  localStorage.setItem('role', data.role)
}

// Выйти из системы
export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('name')
  localStorage.removeItem('email')
  localStorage.removeItem('role')
}

// Проверка роли
export const isAdmin = () => localStorage.getItem('role') === 'admin'
export const getRole = () => localStorage.getItem('role') ?? 'user'
export const getName = () => localStorage.getItem('name') ?? ''

// ─── Мероприятия ─────────────────────────────────────

export const getEvents = (params?: {
  search?: string
  category_id?: number
}) => api.get<Event[]>('/events/index.php', { params })

export const createEvent = (data: EventForm) =>
  api.post<{ id: number; message: string }>('/events/index.php', data)

export const updateEvent = (id: number, data: EventForm) =>
  api.put<{ message: string }>(`/events/update.php?id=${id}`, data)

export const deleteEvent = (id: number) =>
  api.delete<{ message: string }>(`/events/delete.php?id=${id}`)

// ─── Подписки (для роли user) ─────────────────────────

export const subscribeEvent = (event_id: number) =>
  api.post<{ message: string }>('/events/subscribe.php', { event_id })

export const unsubscribeEvent = (event_id: number) =>
  api.delete<{ message: string }>(`/events/subscribe.php?event_id=${event_id}`)

export const getMySubscriptions = () =>
  api.get<Event[]>('/events/subscriptions.php')

// ─── Документы ───────────────────────────────────────

export const getDocuments = (event_id?: number) =>
  api.get<Document[]>('/documents/index.php', { params: { event_id } })

export const uploadDocument = (event_id: number, file: File) => {
  const form = new FormData()
  form.append('event_id', String(event_id))
  form.append('file', file)
  return api.post<{ id: number; message: string }>('/documents/upload.php', form)
}

export const deleteDocument = (id: number) =>
  api.delete<{ message: string }>(`/documents/delete.php?id=${id}`)

export const getDocumentUrl = (filename: string) =>
  `/event_organizer/backend/uploads/documents/${filename}`

// ─── Профиль ─────────────────────────────────────────

export const getCurrentUser = () =>
  api.get<Profile>('/auth/me.php')

export const getProfile = () =>
  api.get<Profile>('/profile/index.php')

export const updateProfile = (data: {
  name: string
  email: string
  password?: string
  department?: string
}) => api.put<{ message: string }>('/profile/index.php', data)

// ─── Настройки ───────────────────────────────────────

export const getSettings = () =>
  api.get<Settings>('/settings/index.php')

export const updateSettings = (data: Settings) =>
  api.put<{ message: string }>('/settings/index.php', data)



export default api;