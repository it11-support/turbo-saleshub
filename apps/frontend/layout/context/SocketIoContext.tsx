'use client'
import { useAuth } from './AuthContext'
import { getCookie } from 'cookies-next'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const SocketContext = createContext<Socket | null>(null)

export const SocketIoProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)

  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const token = getCookie('accessToken') as string

    if (user && token && !socketRef.current) {
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
        auth: { token },
        transports: ['websocket'],
        upgrade: false,
      })

      socketRef.current = newSocket
      setSocket(newSocket)
    }

    if (!user && socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setSocket(null)
    }

    return () => {}
  }, [user])

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketIoProvider')
  }
  return context
}

export default SocketIoProvider
