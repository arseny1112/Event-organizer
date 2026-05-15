export interface User {
    name: string
    email: string
    avatar: string | null
    role: string | null
    department: string | null
    last_login: string | null
    timezone: string
  }
  
  export interface Stats {
    total: number
    future: number
    past: number
  }
  
  export interface Profile extends User {
    stats: Stats
  }
  
  export interface Category {
    id: number
    name: string
  }
  
  export interface Event {
    id: number
    user_id: number
    category_id: number
    category_name: string
    title: string
    description: string | null
    location: string | null
    start_datetime: string
    end_datetime?: string
    created_at: string
  }
  
  export interface EventForm {
      title: string;
  description?: string;
  start_datetime: string; // YYYY-MM-DD HH:MM:SS
  location?: string;
  end_datetime?: string
  category_id?: number | null;
  }
  
  export interface Document {
    date: string
    description: string
    id: number
    name: string
    event_id: number
    user_id: number
    filename: string
    original_name: string
    size: number;
    created_at: string
    event_title?: string
  }
  
  export interface Settings {
    vk_notify: boolean
    notify_day_before: boolean
    notify_hour_before: boolean
    email_notify: boolean
    vk_id: string | null
    email?: string
  }
  
  export interface AuthResponse {
    token: string
    name: string
    email: string
    role: string  
  }
  
  export interface ApiError {
    error: string
  }