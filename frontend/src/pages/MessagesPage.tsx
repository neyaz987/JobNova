import { useState } from 'react'
import Layout from '../components/layout/Layout'
import ChatSidebar from '../components/chat/ChatSidebar'
import ChatWindow from '../components/chat/ChatWindow'
import { useChat } from '../hooks/useChat'
import type { Conversation } from '../utils/types'
import { MessageSquare } from 'lucide-react'

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const { messages: wsMessages, appendMessage } = useChat()

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-120px)]">
        <div className="flex h-full rounded-2xl overflow-hidden glass-dark border border-white/10">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0">
            <ChatSidebar 
              onSelectConversation={setSelectedConversation} 
              selectedId={selectedConversation?.id} 
            />
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedConversation ? (
              <ChatWindow 
                conversation={selectedConversation} 
                wsMessages={wsMessages}
                onMessageSent={appendMessage}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/30 text-center p-12">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <MessageSquare size={32} className="opacity-50" />
                </div>
                <h3 className="text-xl font-display font-semibold text-white/80 mb-2">Your Inbox</h3>
                <p className="max-w-xs text-sm">Select a conversation from the sidebar to start messaging.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
