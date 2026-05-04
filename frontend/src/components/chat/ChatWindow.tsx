import { useEffect, useState, useRef } from 'react'
import { chatApi } from '../../api/services'
import type { Conversation, Message } from '../../utils/types'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../utils/helpers'
import { Send, User as UserIcon, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatWindowProps {
  conversation: Conversation
  wsMessages: Message[] // Incoming from WebSocket
  onMessageSent: (msg: Message) => void
}

export default function ChatWindow({ conversation, wsMessages, onMessageSent }: ChatWindowProps) {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
  }, [conversation.id])

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    // Add messages from WebSocket if they belong to this conversation
    if (wsMessages.length > 0) {
      const latest = wsMessages[0]
      if (latest.conversation_id === conversation.id) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === latest.id)) return prev;
          return [...prev, latest];
        })
      }
    }
  }, [wsMessages, conversation.id])

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const { data } = await chatApi.getMessages(conversation.id)
      // Reverse because API returns newest first for pagination, but we want oldest first for display
      setMessages([...data].reverse())
    } catch (err) {
      console.error('Failed to fetch messages', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    setSending(true)
    try {
      const { data } = await chatApi.sendMessage(conversation.id, input.trim())
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      })
      setInput('')
    } catch (err) {
      console.error('Failed to send', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-navy-950/20">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            {conversation.other_user?.avatar_url ? (
              <img src={conversation.other_user.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : (
              <UserIcon size={20} className="text-indigo-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{conversation.other_user?.full_name}</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">
              {conversation.other_user?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-indigo-400" size={30} />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    'flex flex-col max-w-[80%]',
                    isOwn ? 'ml-auto items-end' : 'mr-auto items-start'
                  )}
                >
                  <div className={cn(
                    'px-4 py-2 rounded-2xl text-sm shadow-lg',
                    isOwn 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'glass-dark border border-white/10 text-white/90 rounded-bl-none'
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-white/30 mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-white/[0.02]">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all text-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className={cn(
              'p-2 rounded-xl bg-indigo-500 text-white transition-all hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed',
              sending ? 'animate-pulse' : ''
            )}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  )
}
