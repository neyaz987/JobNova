import { useEffect, useState } from 'react'
import { chatApi } from '../../api/services'
import type { Conversation } from '../../utils/types'
import { cn, formatDate } from '../../utils/helpers'
import { MessageSquare, User as UserIcon } from 'lucide-react'

interface ChatSidebarProps {
  onSelectConversation: (conv: Conversation) => void
  selectedId?: number
}

export default function ChatSidebar({ onSelectConversation, selectedId }: ChatSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const { data } = await chatApi.getConversations()
      setConversations(data)
    } catch (err) {
      console.error('Failed to fetch conversations', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col glass-dark border-r border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center gap-2">
        <MessageSquare className="text-indigo-400" size={20} />
        <h2 className="font-display font-semibold">Messages</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-8 text-center text-white/30 text-sm animate-pulse">Loading chats...</div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-white/30 text-sm">No conversations yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={cn(
                  'w-full p-4 flex items-start gap-3 transition-all hover:bg-white/5 text-left',
                  selectedId === conv.id ? 'bg-indigo-500/10' : ''
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  {conv.other_user?.avatar_url ? (
                    <img src={conv.other_user.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <UserIcon size={20} className="text-white/20" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold truncate text-white/90">
                      {conv.other_user?.full_name || 'User'}
                    </h3>
                    <span className="text-[10px] text-white/30">
                      {formatDate(conv.last_message_at)}
                    </span>
                  </div>
                  <p className={cn(
                    'text-xs truncate',
                    conv.unread_count > 0 ? 'text-white font-medium' : 'text-white/50'
                  )}>
                    {conv.last_message?.content || 'No messages yet'}
                  </p>
                </div>
                {conv.unread_count > 0 && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
