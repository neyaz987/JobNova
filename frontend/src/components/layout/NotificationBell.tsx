import { useState, useEffect } from 'react'
import { Bell, Check, ExternalLink, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { notificationsApi } from '../../api/services'
import type { Notification } from '../../utils/types'
import { formatDate, cn } from '../../utils/helpers'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

export default function NotificationBell() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    if (!user?.is_verified) return

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000) // Poll every minute
    
    const handleNewNotification = (e: any) => {
      setNotifications(prev => [e.detail, ...prev])
    }
    window.addEventListener('new_notification', handleNewNotification)

    return () => {
      clearInterval(interval)
      window.removeEventListener('new_notification', handleNewNotification)
    }
  }, [user?.is_verified])

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationsApi.list()
      setNotifications(data)
    } catch {
      console.error('Failed to fetch notifications')
    }
  }

  const markRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('All marked as read')
    } catch {
      toast.error('Failed')
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'p-2 rounded-xl transition-all relative',
          open ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/50 hover:text-white hover:bg-white/5'
        )}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-navy-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 sm:w-96 glass-dark rounded-2xl overflow-hidden shadow-2xl z-50 border border-white/10"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <h3 className="font-display font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-white/30">
                    <Info size={30} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm italic">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((n) => (
                      <div 
                        key={n.id}
                        className={cn(
                          'p-4 transition-colors relative group',
                          !n.is_read ? 'bg-indigo-500/[0.03]' : 'opacity-60 grayscale-[0.5]'
                        )}
                      >
                        <div className="flex gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            n.type === 'application_status' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-white/40'
                          )}>
                            <Info size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold mb-0.5">{n.title}</h4>
                            <p className="text-xs text-white/50 leading-relaxed truncate-2-lines">{n.message}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-[10px] text-white/30">{formatDate(n.created_at)}</span>
                              <div className="flex items-center gap-2">
                                {!n.is_read && (
                                  <button 
                                    onClick={() => markRead(n.id)}
                                    className="p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-all"
                                    title="Mark as read"
                                  >
                                    <Check size={12} />
                                  </button>
                                )}
                                {n.link && (
                                  <Link 
                                    to={n.link} 
                                    onClick={() => { setOpen(false); markRead(n.id) }}
                                    className="p-1 rounded-md hover:bg-white/10 text-indigo-400 transition-all"
                                  >
                                    <ExternalLink size={12} />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {!n.is_read && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
