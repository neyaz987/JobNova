import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, ChevronLeft, Search, Filter, MoreHorizontal, 
  FileText, MessageSquare, Star, Brain, Calendar
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { applicationsApi, jobsApi } from '../../api/services'
import type { Job, Application } from '../../utils/types'
import { getStatusColor, cn, formatDate } from '../../utils/helpers'
import { Spinner, EmptyState } from '../../components/common/UI'
import toast from 'react-hot-toast'

const COLUMNS = [
  { id: 'applied', title: 'Applied', color: 'bg-blue-500' },
  { id: 'reviewing', title: 'Reviewing', color: 'bg-indigo-500' },
  { id: 'shortlisted', title: 'Shortlisted', color: 'bg-purple-500' },
  { id: 'interview', title: 'Interview', color: 'bg-amber-500' },
  { id: 'offered', title: 'Offered', color: 'bg-emerald-500' },
  { id: 'rejected', title: 'Rejected', color: 'bg-rose-500' },
]

export default function PipelinePage() {
  const { jobId } = useParams<{ jobId: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (jobId) {
      Promise.all([
        jobsApi.getById(+jobId),
        applicationsApi.jobApplications(+jobId)
      ]).then(([jobRes, appsRes]) => {
        setJob(jobRes.data)
        setApplications(appsRes.data)
      }).catch(() => toast.error('Failed to load pipeline'))
        .finally(() => setLoading(false))
    }
  }, [jobId])

  const handleStatusChange = async (appId: number, newStatus: string) => {
    try {
      await applicationsApi.updateStatus(appId, newStatus)
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus as any } : a))
      toast.success(`Moved to ${newStatus}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const filteredApps = applications.filter(app => 
    app.candidate?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    app.candidate?.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <Layout><div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div></Layout>
  )

  return (
    <Layout>
      <div className="h-[calc(100vh-64px)] flex flex-col">
        {/* Subheader */}
        <div className="p-4 border-b border-white/10 glass flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/recruiter/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight">{job?.title}</h1>
              <p className="text-xs text-white/40">{applications.length} Applicants · Pipeline View</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
              <input 
                type="text" 
                placeholder="Search candidates..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-indigo-500/50 w-64"
              />
            </div>
            <button className="p-2 glass hover:bg-white/10 rounded-xl transition-all">
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto p-6 flex gap-6 custom-scrollbar bg-navy-950/20">
          {COLUMNS.map(column => (
            <div key={column.id} className="w-80 flex-shrink-0 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", column.color)} />
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-white/70">{column.title}</h3>
                  <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded-full text-white/40">
                    {filteredApps.filter(a => a.status === column.id).length}
                  </span>
                </div>
                <button className="text-white/20 hover:text-white/50 transition-colors">
                  <MoreHorizontal size={14} />
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-3 min-h-[100px]">
                <AnimatePresence mode="popLayout">
                  {filteredApps.filter(a => a.status === column.id).map((app) => (
                    <motion.div
                      key={app.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="glass p-4 group hover:border-indigo-500/30 transition-all cursor-grab active:cursor-grabbing relative"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                          {app.candidate?.full_name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold truncate group-hover:text-indigo-300 transition-colors">
                            {app.candidate?.full_name}
                          </h4>
                          <p className="text-[10px] text-white/30 truncate">Applied {formatDate(app.applied_at)}</p>
                        </div>
                        {app.match_score && (
                          <div className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-[9px] font-bold",
                            app.match_score > 80 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                            app.match_score > 60 ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" :
                            "bg-white/5 border-white/10 text-white/40"
                          )}>
                            <Brain size={10} />
                            {app.match_score}%
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => window.open(app.resume_url, '_blank')}
                          className="p-1.5 glass rounded-lg text-white/30 hover:text-white/60 hover:bg-white/10 transition-all"
                          title="View Resume"
                        >
                          <FileText size={12} />
                        </button>
                        <Link 
                          to="/messages" 
                          className="p-1.5 glass rounded-lg text-white/30 hover:text-white/60 hover:bg-white/10 transition-all"
                          title="Message"
                        >
                          <MessageSquare size={12} />
                        </Link>
                        <button 
                          onClick={() => {
                            const slotsStr = prompt('Enter up to 3 proposed slots (ISO format, comma separated):', '')
                            if (slotsStr) {
                              const slots = (slotsStr || '').split(',').map(s => s.trim()).filter(Boolean)
                              applicationsApi.updateStatus(app.id, 'interview', 'Please pick a slot.')
                                .then(() => {
                                  // We'll use a direct fetch to refresh since we don't have a multi-slot endpoint yet
                                  toast.success('Slots proposed!')
                                  window.location.reload()
                                })
                            }
                          }}
                          className={cn(
                            "p-1.5 glass rounded-lg transition-all",
                            app.proposed_slots?.length ? "text-indigo-400 bg-indigo-400/10" : 
                            app.interview_date ? "text-amber-400 bg-amber-400/10" : "text-white/30 hover:text-white/60"
                          )}
                          title="Propose Slots / Schedule"
                        >
                          <Calendar size={12} />
                        </button>
                        <div className="ml-auto flex items-center gap-1">
                          {COLUMNS.map(c => (
                            <button
                              key={c.id}
                              onClick={() => handleStatusChange(app.id, c.id)}
                              className={cn(
                                "w-2 h-2 rounded-full transition-all hover:scale-150",
                                c.id === app.status ? "opacity-0 scale-0" : c.color,
                                "opacity-40 hover:opacity-100"
                              )}
                              title={`Move to ${c.title}`}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredApps.filter(a => a.status === column.id).length === 0 && (
                  <div className="h-20 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center text-[10px] text-white/20 uppercase tracking-widest font-bold">
                    Drop Here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
