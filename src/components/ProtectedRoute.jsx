import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute({ children }) {
  const { token, user, fetchMe, logout } = useAuthStore()
  const [checking, setChecking] = useState(!user)

  useEffect(() => {
    if (token && !user) {
      fetchMe()
        .catch(() => { logout() })
        .finally(() => setChecking(false))
    } else {
      setChecking(false)
    }
  }, [token])

  if (!token) return <Navigate to="/login" replace />
  if (checking) return <div className="flex items-center justify-center h-screen text-gray-500">Verifying...</div>
  return children
}
