import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, Briefcase, AlertTriangle, CheckCircle2, XCircle, 
  Search, ShieldAlert, UserCheck, UserX, BarChart3,
  ExternalLink, Flag, Info
} from 'lucide-react'
import Layout from '../components/layout/Layout'
import { Button, Modal, EmptyState, Spinner } from '../components/common/UI'
import { adminApi, analyticsApi } from '../api/services'
import type { User, Job, Report, AdminAnalytics } from '../utils/types'
import { formatDate, getStatusColor, cn } from '../utils/helpers'
import toast from 'react-hot-toast'

const TABS = ['Stats', 'Jobs Moderation', 'Reports', 'User Management'] as const
type Tab = typeof TABS[number]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('Stats')
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [pendingJobs, setPendingJobs] = useState<Job[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [analyticsRes, jobsRes, reportsRes, usersRes] = await Promise.all([
        analyticsApi.admin(),
        adminApi.getPendingJobs(),
        adminApi.getReports(),
        adminApi.listAllUsers()
      ])
      setAnalytics(analyticsRes.data)
      setPendingJobs(jobsRes.data)
      setReports(reportsRes.data)
      setAllUsers(usersRes.data)
    } catch {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleModerateJob = async (jobId: number, isApproved: boolean) => {
    try {
      await adminApi.moderateJob(jobId, { is_approved: isApproved })
      setPendingJobs(prev => prev.filter(j => j.id !== jobId))
      toast.success(isApproved ? 'Job approved' : 'Job rejected')
    } catch {
      toast.error('Moderation failed')
    }
  }

  const handleToggleUserAction = async (userId: number, currentStatus: boolean) => {
    try {
      const { data } = await adminApi.updateUserStatus(userId, { is_active: !currentStatus })
      setAllUsers(prev => prev.map(u => u.id === userId ? data : u))
      toast.success(data.is_active ? 'User activated' : 'User deactivated')
    } catch {
      toast.error('Action failed')
    }
  }

  const filteredUsers = allUsers.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Layout>
      <div className="py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
              <p className="text-white/40 text-sm">Platform moderation & analytics</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 glass p-1 rounded-xl mb-8 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white'
              )}
            >
              <div className="flex items-center justify-center gap-2">
                {tab === 'Stats' && <BarChart3 size={14} />}
                {tab === 'Jobs Moderation' && <Briefcase size={14} />}
                {tab === 'Reports' && <AlertTriangle size={14} />}
                {tab === 'User Management' && <Users size={14} />}
                {tab}
                {(tab === 'Jobs Moderation' && pendingJobs.length > 0) && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-[10px] flex items-center justify-center font-bold">
                    {pendingJobs.length}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-6">
            {/* Stats Tab */}
            {activeTab === 'Stats' && analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: analytics.total_users, icon: Users, color: 'text-blue-400' },
                  { label: 'Live Jobs', value: analytics.total_jobs, icon: Briefcase, color: 'text-emerald-400' },
                  { label: 'Candidate Stats', value: analytics.total_candidates, icon: UserCheck, color: 'text-indigo-400' },
                  { label: 'Applications', value: analytics.total_applications, icon: BarChart3, color: 'text-purple-400' },
                ].map((stat) => (
                  <div key={stat.label} className="glass p-6">
                    <stat.icon size={20} className={`${stat.color} mb-3`} />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-white/40 text-xs mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Jobs Moderation Tab */}
            {activeTab === 'Jobs Moderation' && (
              <div className="space-y-4">
                {pendingJobs.length === 0 ? (
                  <EmptyState icon={<CheckCircle2 size={30} />} title="All Clear!" description="No pending jobs to moderate." />
                ) : (
                  pendingJobs.map(job => (
                    <div key={job.id} className="glass p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg">{job.title}</h4>
                          <span className="badge badge-indigo text-[10px]">{job.job_type}</span>
                        </div>
                        <p className="text-sm text-white/50 mb-1">{job.company_name} · {job.location}</p>
                        <p className="text-xs text-white/30 italic">Posted {formatDate(job.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button onClick={() => handleModerateJob(job.id, true)} className="flex-1 sm:flex-none py-1.5 px-4 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white border-0 text-xs">
                          Approve
                        </Button>
                        <Button onClick={() => handleModerateJob(job.id, false)} className="flex-1 sm:flex-none py-1.5 px-4 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border-0 text-xs text-nowrap">
                          Reject
                        </Button>
                        <a href={`/jobs/${job.id}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 transition-all">
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'Reports' && (
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <EmptyState icon={<ShieldAlert size={30} />} title="No Reports" description="Job seekers haven't flagged any jobs yet." />
                ) : (
                  reports.map(report => (
                    <div key={report.id} className="glass p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 text-red-400"><Flag size={16} /></div>
                          <div>
                            <h4 className="font-semibold text-red-400">{report.reason}</h4>
                            <p className="text-sm text-white/70 mt-1">{report.details}</p>
                          </div>
                        </div>
                        <span className={cn('badge text-[10px]', report.status === 'pending' ? 'badge-red' : 'badge-indigo')}>
                          {report.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="text-xs text-white/30">
                          Reported on {formatDate(report.created_at)}
                        </div>
                        <a href={`/jobs/${report.job_id}`} className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                          View Flagged Job <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'User Management' && (
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by name or email..." 
                    className="input-glass pl-12" 
                  />
                </div>
                
                <div className="glass overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/5 text-white/40 uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="px-6 py-4 font-semibold">User</th>
                          <th className="px-6 py-4 font-semibold">Role</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold">Joined</th>
                          <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-xs">
                                  {u.full_name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium">{u.full_name}</div>
                                  <div className="text-xs text-white/30">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 capitalize text-white/60">{u.role}</td>
                            <td className="px-6 py-4">
                              <span className={cn('badge text-[10px]', u.is_active ? 'badge-emerald' : 'badge-red')}>
                                {u.is_active ? 'Active' : 'Banned'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-white/40 text-xs">{formatDate(u.created_at)}</td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handleToggleUserAction(u.id, u.is_active)}
                                className={cn(
                                  'p-2 rounded-lg transition-all',
                                  u.is_active ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'
                                )}
                                title={u.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
