import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export function useWebsocket() {
  const { accessToken, user } = useAuthStore()
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!accessToken || !user) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host === 'localhost:5173' ? 'localhost:8000' : window.location.host
    const wsUrl = `${protocol}//${host}/api/v1/chat/ws?token=${accessToken}`

    const socket = new WebSocket(wsUrl)
    socketRef.current = socket

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data)
      
      // Global Notification Handler
      if (payload.type === 'new_notification') {
        toast.success(payload.data.title + ': ' + payload.data.message, {
          duration: 4000,
          icon: '🔔',
        })
        window.dispatchEvent(new CustomEvent('new_notification', { detail: payload.data }))
      }

      // Chat Message Handler
      if (payload.type === 'new_message') {
        window.dispatchEvent(new CustomEvent('new_message', { detail: payload.data }))
      }
    }

    return () => {
      socket.close()
    }
  }, [accessToken, user])

  return socketRef
}
