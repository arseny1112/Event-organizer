// components/AdminRoute.tsx
import React from 'react'
import { Navigate } from 'react-router-dom'

interface AdminRouteProps {
  children: React.ReactNode
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  if (role !== 'admin') {
    // Если не админ — редирект на главную или dashboard
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

export default AdminRoute