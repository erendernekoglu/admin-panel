import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { authErrorMessage } from "../../lib/auth/authErrors"
import { isDemoMode } from "../../lib/config"
import { roleCan, type Permission } from "../../lib/auth/permissions"
import type { AdminUser, AdminProfile } from "../../types/auth"
import {
  commitSessionAfterCancel,
  resetSessionCache,
  type SessionCache,
} from "./sessionCache"
import { AuthContext, type AuthContextValue } from "./AuthContext"
import {
  createDemoSession,
  fetchSession,
  loginWithEmail as loginWithEmailRequest,
  logout as logoutRequest,
  type AuthSession,
} from "./authService"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
  // Demo starts signed out with no request; API starts by reading the cookie session.
  const [loading, setLoading] = useState(!isDemoMode)
  const [error, setError] = useState<string | null>(null)

  // Every identity-changing operation takes a generation. A response from an
  // older generation (for example a session read that finishes after logout)
  // is ignored instead of resurrecting the previous identity.
  const generationRef = useRef(0)

  const applySession = useCallback((session: AuthSession | null) => {
    setUser(session?.user ?? null)
    setAdminProfile(session?.adminProfile ?? null)
  }, [])

  const sessionCache = useMemo<SessionCache>(
    () => ({
      cancelQueries: () => queryClient.cancelQueries(),
      clear: () => queryClient.clear(),
    }),
    [queryClient],
  )

  const clearQueryCache = useCallback(() => {
    resetSessionCache(sessionCache)
  }, [sessionCache])

  const commitSession = useCallback(
    async (session: AuthSession | null, generation: number) =>
      commitSessionAfterCancel(
        sessionCache,
        generation,
        (candidate) => candidate === generationRef.current,
        () => applySession(session),
      ),
    [applySession, sessionCache],
  )

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false)
      return
    }

    const generation = ++generationRef.current
    let cancelled = false
    setLoading(true)
    setError(null)

    void fetchSession()
      .then(async (session) => {
        if (cancelled || generation !== generationRef.current) return
        await commitSession(session, generation)
      })
      .catch((err: unknown) => {
        if (cancelled || generation !== generationRef.current) return
        clearQueryCache()
        applySession(null)
        setError(authErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled && generation === generationRef.current) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [applySession, clearQueryCache, commitSession])

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const generation = ++generationRef.current
      setError(null)
      try {
        const session = await loginWithEmailRequest(email, password)
        await commitSession(session, generation)
        return session
      } catch (err) {
        if (generation === generationRef.current) {
          clearQueryCache()
          applySession(null)
          setError(authErrorMessage(err))
        }
        throw err
      } finally {
        // A successful login that superseded the delayed startup session must
        // also release the loading gate, not only the startup effect.
        if (generation === generationRef.current) setLoading(false)
      }
    },
    [applySession, clearQueryCache, commitSession],
  )

  const enterDemo = useCallback(() => {
    if (!isDemoMode) {
      setError("Demo entry is only available in demo mode.")
      return
    }
    ++generationRef.current
    clearQueryCache()
    setError(null)
    setLoading(false)
    applySession(createDemoSession())
  }, [applySession, clearQueryCache])

  const logout = useCallback(async () => {
    // Take a new generation and clear local state before the server request so
    // no earlier response can restore the session while logout is in flight.
    const generation = ++generationRef.current
    clearQueryCache()
    applySession(null)
    setLoading(false)
    setError(null)

    try {
      await logoutRequest()
    } catch (err) {
      // Logout still succeeds locally, but a server failure is surfaced rather
      // than reported as a clean sign-out.
      if (generation === generationRef.current) setError(authErrorMessage(err))
    }
  }, [applySession, clearQueryCache])

  const refreshAdminProfile = useCallback(async () => {
    if (isDemoMode) return adminProfile

    const generation = ++generationRef.current
    setError(null)
    try {
      const session = await fetchSession()
      const applied = await commitSession(session, generation)
      return applied ? session?.adminProfile ?? null : null
    } catch (err) {
      if (generation === generationRef.current) {
        clearQueryCache()
        applySession(null)
        setError(authErrorMessage(err))
      }
      return null
    } finally {
      if (generation === generationRef.current) setLoading(false)
    }
  }, [adminProfile, applySession, clearQueryCache, commitSession])

  const consoleRole = adminProfile?.consoleRole ?? null
  const can = useCallback(
    (permission: Permission) => roleCan(consoleRole, permission),
    [consoleRole],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      adminProfile,
      loading,
      error,
      consoleRole,
      can,
      loginWithEmail,
      enterDemo,
      logout,
      refreshAdminProfile,
    }),
    [
      adminProfile,
      can,
      consoleRole,
      enterDemo,
      error,
      loading,
      loginWithEmail,
      logout,
      refreshAdminProfile,
      user,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
