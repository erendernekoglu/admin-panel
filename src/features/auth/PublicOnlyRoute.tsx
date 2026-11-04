import type { ReactNode } from "react"
import { Navigate } from "react-router"

import { SessionCheckScreen } from "./StatusScreen"
import { useAuth } from "./useAuth"

interface PublicOnlyRouteProps {
  children: ReactNode
}

export default function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { consoleRole, loading, user } = useAuth()

  if (loading) {
    return <SessionCheckScreen label="Oturum kontrol ediliyor…" />
  }

  if (user && consoleRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
