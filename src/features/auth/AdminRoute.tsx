import type { ReactNode } from "react"
import { Navigate } from "react-router"

import { SessionCheckScreen } from "./StatusScreen"
import { useAuth } from "./useAuth"

interface AdminRouteProps {
  children: ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { consoleRole, loading, user } = useAuth()

  if (loading) {
    return <SessionCheckScreen label="Yönetici erişimi kontrol ediliyor…" />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!consoleRole) {
    return <Navigate to="/access-denied" replace />
  }

  return children
}
