'use client'

import { IUser } from '@saleshub-tsm/types'
import { deleteCookie, getCookie, setCookie } from 'cookies-next'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

import { $api } from '@/lib/api'

interface AuthContextType {
  user: IUser | null
  loading: boolean
  login: (token: string, userData?: IUser) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  setLoading: (loading: boolean) => void
  isAdmin?: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()

  const [user, setUser] = useState<IUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const token = getCookie('accessToken')
    const cachedUser = getCookie('userData')
    const cachedIsAdmin = getCookie('isAdmin')

    if (!token) {
      setUser(null)
      setIsAdmin(false)
      setLoading(false)
      return
    }

    if (cachedUser) {
      const parsedUser = JSON.parse(cachedUser as string)
      setUser(parsedUser)
      setIsAdmin(cachedIsAdmin === '1')
      setLoading(false)
      return
    }

    $api('/user/me')
      .then((res: any) => {
        const u = res.data.user || res
        setUser(u)
        setIsAdmin(u?.roles?.role === 'admin')

        setCookie('userData', JSON.stringify(u), {
          path: '/',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          secure: process.env.NODE_ENV === 'production',
        })

        setCookie('isAdmin', u?.roles?.role === 'admin' ? '1' : '0', {
          path: '/',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          secure: process.env.NODE_ENV === 'production',
        })
      })
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (user) {
      setIsAdmin(user?.roles?.role === 'admin')
    }
  }, [user])

  // 🔹 Saat login berhasil
  const login = async (token: string, userData?: IUser) => {
    setCookie('accessToken', token, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    if (userData) {
      setCookie('userData', JSON.stringify(userData), {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      })

      setUser(userData || null)

      setCookie('isAdmin', userData?.roles?.role === 'admin', {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    setTimeout(() => {
      router.replace('/')
    }, 200)
  }

  const logout = async () => {
    deleteCookie('accessToken', { path: '/' })
    deleteCookie('userData', { path: '/' })
    setUser(null)
    router.replace('/auth/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        setLoading,
        isAuthenticated: !!user,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export default AuthProvider
