import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import type { Message } from '../utils/types'

export function useChat() {
  const { accessToken, user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const handleNewMessage = (e: any) => {
      const newMessage = e.detail as Message
      setMessages((prev) => {
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [newMessage, ...prev];
      })
    }

    window.addEventListener('new_message', handleNewMessage)
    return () => window.removeEventListener('new_message', handleNewMessage)
  }, [])

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some(m => m.id === message.id)) return prev;
      return [message, ...prev];
    })
  }, [])

  return {
    messages,
    setMessages,
    appendMessage,
    isConnected,
  }
}
