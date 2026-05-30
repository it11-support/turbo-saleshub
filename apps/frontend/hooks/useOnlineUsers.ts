import { useEffect, useState } from 'react'

import { useSocket } from '@/layout/context/SocketIoContext'

// apps/frontend/hooks/useOnlineUsers.ts
export const useOnlineUsers = () => {
  const socket = useSocket()
  const [onlineIds, setOnlineIds] = useState<number[]>([])

  useEffect(() => {
    if (!socket) return

    // Pastikan listener hanya ada satu
    const handler = (ids: number[]) => {
      setOnlineIds(ids)
    }

    socket.on('getOnlineUsers', handler)

    // Minta data terbaru segera setelah konek (antisipasi load pertama)
    socket.emit('requestOnlineUsers')

    return () => {
      socket.off('getOnlineUsers', handler)
    }
  }, [socket]) // Dependency pada socket instance

  return onlineIds
}
