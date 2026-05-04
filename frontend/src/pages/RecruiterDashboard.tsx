import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import {
  Briefcase, Users, TrendingUp, Eye, Plus, Edit2, Trash2,
  BarChart3, ChevronDown, ChevronRight, CheckCircle2, X,
  Clock, FileText, Sparkles, Shield, Crown, Zap
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import Layout from '../components/layout/Layout'
import { Button, Modal, EmptyState, Spinner } from '../components/common/UI'
import { jobsApi, applicationsApi, analyticsApi, skillsApi, usersApi } from '../api/services'
import type { Job, Application, RecruiterAnalytics, Skill } from '../utils/types'
import { useAuthStore } from '../store/authStore'
import { formatDate, formatJobType, getStatusColor, getStatusLabel, cn } from '../utils/helpers'
import toast from 'react-hot-toast'

const TABS = ['Overview', 'My Jobs', 'Applications', 'Analytics', 'Post Job'] as const
type Tab = typeof TABS[number]

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6']

export default function RecruiterDashboard() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [jobs, setJobs] = useState<Job[]>([])
  const [analytics, setAnalytics] = useState<RecruiterAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const mainRef = useRef(null)

  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, analyticsRes, profileRes] = await Promise.allSettled([
          jobsApi.getMyJobs(),
          analyticsApi.recruiter(),
          usersApi.getRecruiterProfile()
        ])

        if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.data)
        if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data)
        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data)
      } catch (err) {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        gsap.from('.dash-reveal', {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
        })
      }, mainRef)
      return () => ctx.revert()
    }
  }, [loading, activeTab])

  const handleViewApplications = async (job: Job) => {
    setSelectedJob(job)
    setActiveTab('Applications')
    setAppsLoading(true)
    try {
      const { data } = await applicationsApi.jobApplications(job.id)
      setApplications(data)
    } catch { toast.error('Failed to load applications') }
    finally { setAppsLoading(false) }
  }

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Delete this job posting?')) return
    try {
      await jobsApi.delete(jobId)
      setJobs((prev) => prev.filter((j) => j.id !== jobId))
      toast.success('Job deleted')
    } catch { toast.error('Failed to delete') }
  }

  const handleStatusChange = async (appId: number, status: string, notes?: string) => {
    try {
      await applicationsApi.updateStatus(appId, status, notes)
      setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status: status as any } : a))
      toast.success('Status updated')
    } catch { toast.error('Failed to update') }
  }

  const statusPieData = analytics
    ? Object.entries(analytics.applications_by_status).map(([name, value]) => ({ name, value }))
    : []

  return (
    <Layout>
      <div ref={mainRef} className="py-8">

        <div className="dash-reveal mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold mb-1">Recruiter Hub</h1>
              <p className="text-white/40 text-sm">{user?.recruiter_profile?.company_name ?? 'Manage your hiring pipeline'}</p>
            </div>
            <button onClick={() => setActiveTab('Post Job')} className="btn-primary text-sm flex items-center gap-2">
              <Plus size={15} /> Post a Job
            </button>
          </div>
        </div>


        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Jobs', value: analytics?.total_jobs ?? 0, icon: Briefcase, color: 'from-indigo-500 to-purple-600' },
            { label: 'Active Jobs', value: analytics?.active_jobs ?? 0, icon: CheckCircle2, color: 'from-emerald-500 to-teal-600' },
            { label: 'Total Applications', value: analytics?.total_applications ?? 0, icon: Users, color: 'from-blue-500 to-cyan-600' },
            { label: 'In Interview', value: analytics?.applications_by_status?.['interview'] ?? 0, icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
          ].map((stat, i) => (
            <div key={stat.label} className="dash-reveal glass p-5">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon size={16} className="text-white" />
              </div>
              <div className="font-display text-2xl font-bold">{stat.value}</div>
              <div className="text-white/40 text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>


        <div className="dash-reveal flex gap-1 glass p-1 rounded-xl mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white'
              )}
            >
              {tab}
            </button>
          ))}
        </div>


        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="dash-reveal glass p-6 flex flex-col justify-between border-indigo-500/20 bg-indigo-500/5">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold">Membership Status</h3>
                  <div className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                    {profile?.plan?.name || 'No Plan'}
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                    {profile?.plan?.name === 'Starter' ? <Shield size={24} className="text-white/40" /> :
                     profile?.plan?.name === 'Pro' ? <Zap size={24} className="text-indigo-400" /> :
                     profile?.plan?.name === 'Enterprise' ? <Crown size={24} className="text-amber-400" /> :
                     <Briefcase size={24} className="text-white/20" />}
                  </div>
                  <div>
                    <p className="text-lg font-bold">{profile?.plan?.name || 'Free Access'}</p>
                    <p className="text-xs text-white/40">
                      {profile?.subscription_expires_at 
                        ? `${Math.ceil((new Date(profile.subscription_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining`
                        : 'Unlimited trial period'}
                    </p>
                  </div>
                </div>
              </div>
              <Link to="/recruiter/membership" className="btn-secondary w-full text-xs py-2 flex items-center justify-center gap-2">
                Manage Subscription <ChevronRight size={14} />
              </Link>
            </div>


            <div className="dash-reveal glass p-6">
              <h3 className="font-display font-semibold mb-4">Top Performing Jobs</h3>
              {loading ? (
                <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
              ) : analytics?.top_jobs.length === 0 ? (
                <EmptyState icon={<Briefcase size={24} />} title="No jobs yet" />
              ) : (
                <div className="space-y-3">
                  {(analytics?.top_jobs || []).map((job) => (
                    <div key={job.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{job.title}</p>
                        <p className="text-xs text-white/40">{job.applications} applications · {job.views} views</p>
                      </div>
                      <button onClick={() => { const j = jobs.find((jb) => jb.id === job.id); if (j) handleViewApplications(j) }} className="text-xs text-indigo-400 hover:text-indigo-300 flex-shrink-0">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>


            <div className="dash-reveal glass p-6">
              <h3 className="font-display font-semibold mb-4">Application Pipeline</h3>
              {statusPieData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-white/30 text-sm">No applications yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {statusPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0d1426', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}


        {activeTab === 'My Jobs' && (
          <div className="space-y-3">
            {loading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)
            ) : jobs.length === 0 ? (
              <EmptyState icon={<Briefcase size={28} />} title="No jobs posted" description="Post your first job to start receiving applications" action={<button onClick={() => setActiveTab('Post Job')} className="btn-primary text-sm py-2 px-6">Post a Job</button>} />
            ) : (
              jobs.map((job) => (
                <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-sm">{job.title}</p>
                      <span className={cn('badge text-[10px] py-0.5', job.is_active ? 'badge-emerald' : 'badge-red')}>
                        {job.is_active ? 'Active' : 'Closed'}
                      </span>
                    </div>
                    <p className="text-xs text-white/40">{formatJobType(job.job_type)} · {job.applications_count} applications · {job.views_count} views · {formatDate(job.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleViewApplications(job)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                      <Users size={13} /> {job.applications_count}
                    </button>
                    <Link to={`/recruiter/jobs/${job.id}/pipeline`} className="p-1.5 rounded-lg text-white/30 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all" title="View Pipeline">
                      <BarChart3 size={14} />
                    </Link>
                    <button onClick={() => handleDeleteJob(job.id)} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}


        {activeTab === 'Applications' && (
          <div>
            {selectedJob && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-white/50">Applications for</span>
                <span className="badge-indigo">{selectedJob.title}</span>
              </div>
            )}
            {appsLoading ? (
              <div className="flex justify-center py-12"><Spinner size="lg" /></div>
            ) : applications.length === 0 ? (
              <EmptyState icon={<Users size={28} />} title="No applications" description={selectedJob ? 'No one has applied to this job yet' : 'Select a job from My Jobs to view applications'} />
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-sm font-bold text-indigo-400 flex-shrink-0">
                        {app.candidate?.full_name?.charAt(0) ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{app.candidate?.full_name}</p>
                        <p className="text-xs text-white/40">{app.candidate?.email} · Applied {formatDate(app.applied_at)}</p>
                        {app.cover_letter && (
                          <p className="text-xs text-white/50 mt-1 line-clamp-2 italic">"{app.cover_letter}"</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`badge ${getStatusColor(app.status)}`}>{getStatusLabel(app.status)}</span>
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white cursor-pointer"
                        >
                          {['applied','reviewing','shortlisted','interview','offered','rejected'].map((s) => (
                            <option key={s} value={s} className="bg-navy-800">{s}</option>
                          ))}
                        </select>
                        {app.resume_url && (
                          <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/10 transition-all">
                            <FileText size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}


        {activeTab === 'Analytics' && analytics && (
          <div className="space-y-6">
            {analytics.hiring_funnel && (
              <div className="glass p-6">
                <h3 className="font-display font-semibold mb-6">Hiring Conversion Funnel</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Job Views', value: analytics.hiring_funnel.views, color: 'bg-indigo-500' },
                    { label: 'Applications', value: analytics.hiring_funnel.applications, color: 'bg-purple-500' },
                    { label: 'Shortlisted', value: analytics.hiring_funnel.shortlisted, color: 'bg-blue-500' },
                    { label: 'Interviewed', value: analytics.hiring_funnel.interviewed, color: 'bg-amber-500' },
                    { label: 'Hired', value: analytics.hiring_funnel.hired, color: 'bg-emerald-500' },
                  ].map((step, i, arr) => (
                    <div key={step.label} className="relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-widest text-white/40">{step.label}</span>
                        <span className="text-sm font-bold">{step.value}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${arr[0].value ? (step.value / arr[0].value) * 100 : 0}%` }}
                          className={`h-full ${step.color}`}
                        />
                      </div>
                      {i > 0 && arr[i-1].value > 0 && (
                        <div className="text-[10px] text-white/30 mt-1 flex justify-end">
                          {Math.round((step.value / arr[i-1].value) * 100)}% conversion from previous step
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass p-6">
              <h3 className="font-display font-semibold mb-4">Applications Over Time (Last 30 Days)</h3>
              {analytics.applications_over_time.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-white/30 text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics.applications_over_time}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#0d1426', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }} />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="glass p-6">
              <h3 className="font-display font-semibold mb-4">Application Status Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusPieData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0d1426', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {statusPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}


        {activeTab === 'Post Job' && (
          <PostJobForm onSuccess={(job) => { setJobs((prev) => [job, ...prev]); setActiveTab('My Jobs'); toast.success('Job posted!') }} />
        )}
      </div>
    </Layout>
  )
}

function PostJobForm({ onSuccess }: { onSuccess: (job: Job) => void }) {
  const { user } = useAuthStore()
  const [form, setForm] = useState({
    title: '', description: '', requirements: '', responsibilities: '',
    location: '', is_remote: false, job_type: 'full_time',
    experience_level: 'mid', salary_min: '', salary_max: '',
    salary_currency: 'INR',
  })
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<Skill[]>([])
  const [skillSuggestions, setSkillSuggestions] = useState<Skill[]>([])
  const [loading, setLoading] = useState(false)

  const searchSkills = async (q: string) => {
    if (!q) { setSkillSuggestions([]); return }
    const { data } = await skillsApi.list(q)
    setSkillSuggestions(data.filter((s) => !skills.find((sk) => sk.id === s.id)))
  }

  const [generating, setGenerating] = useState(false)
  const handleAIGenerate = async () => {
    if (!form.title) return toast.error('Enter a job title first')
    setGenerating(true)
    try {
      const { data } = await jobsApi.generateDescription(
        form.title,
        user?.recruiter_profile?.company_name || 'Our Company',
        form.requirements
      )
      f('description', data.description)
      toast.success('Description generated!')
    } catch { toast.error('AI generation failed') }
    finally { setGenerating(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        salary_min: form.salary_min ? +form.salary_min : undefined,
        salary_max: form.salary_max ? +form.salary_max : undefined,
        skill_ids: (skills || []).map((s) => s.id),
      }
      const { data } = await jobsApi.create(payload)
      onSuccess(data)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to post job')
    } finally { setLoading(false) }
  }

  const f = (k: string, v: any) => setForm((prev) => ({ ...prev, [k]: v }))

  return (
    <form onSubmit={handleSubmit} className="glass p-6 max-w-3xl space-y-5">
      <h3 className="font-display font-semibold text-xl">Post a New Job</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs text-white/50 mb-1.5">Job Title *</label>
          <input value={form.title} onChange={(e) => f('title', e.target.value)} required placeholder="e.g. Senior React Developer" className="input-glass text-sm" />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Job Type</label>
          <select value={form.job_type} onChange={(e) => f('job_type', e.target.value)} className="input-glass text-sm">
            {[['full_time','Full-time'],['part_time','Part-time'],['contract','Contract'],['internship','Internship'],['freelance','Freelance']].map(([v,l]) => (
              <option key={v} value={v} className="bg-navy-800">{l}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Experience Level</label>
          <select value={form.experience_level} onChange={(e) => f('experience_level', e.target.value)} className="input-glass text-sm">
            {[['entry','Entry'],['mid','Mid'],['senior','Senior'],['lead','Lead'],['executive','Executive']].map(([v,l]) => (
              <option key={v} value={v} className="bg-navy-800">{l}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Location</label>
          <input value={form.location} onChange={(e) => f('location', e.target.value)} required placeholder="New York, NY" className="input-glass text-sm" />
        </div>

        <div className="flex items-center gap-3 pt-5">
          <button type="button" onClick={() => f('is_remote', !form.is_remote)}
            className={cn('w-10 h-5 rounded-full transition-all relative', form.is_remote ? 'bg-emerald-500' : 'bg-white/20')}>
            <div className={cn('w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all', form.is_remote ? 'left-5' : 'left-0.5')} />
          </button>
          <span className="text-sm text-white/70">Remote OK</span>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Min Salary (INR)</label>
          <input type="number" value={form.salary_min} onChange={(e) => f('salary_min', e.target.value)} placeholder="60000" className="input-glass text-sm" />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Max Salary (INR)</label>
          <input type="number" value={form.salary_max} onChange={(e) => f('salary_max', e.target.value)} placeholder="100000" className="input-glass text-sm" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs text-white/50">Description *</label>
          <button 
            type="button" 
            onClick={handleAIGenerate}
            disabled={generating || !form.title}
            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase tracking-wider disabled:opacity-50"
          >
            {generating ? <Spinner size="xs" /> : <Sparkles size={12} />} AI Generate
          </button>
        </div>
        <textarea value={form.description} onChange={(e) => f('description', e.target.value)} required rows={8} placeholder="Describe the role, team, and what you're looking for..." className="input-glass text-sm resize-none" />
      </div>

      <div>
        <label className="block text-xs text-white/50 mb-1.5">Requirements</label>
        <textarea value={form.requirements} onChange={(e) => f('requirements', e.target.value)} rows={3} placeholder="Required skills and qualifications..." className="input-glass text-sm resize-none" />
      </div>


      <div>
        <label className="block text-xs text-white/50 mb-1.5">Skills</label>
        <div className="relative">
          <input
            value={skillInput}
            onChange={(e) => { setSkillInput(e.target.value); searchSkills(e.target.value) }}
            placeholder="Type to search skills..."
            className="input-glass text-sm"
          />
          {skillSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 glass-dark rounded-xl overflow-hidden z-10">
              {skillSuggestions.slice(0, 6).map((s) => (
                <button key={s.id} type="button" onClick={() => { setSkills((prev) => [...prev, s]); setSkillInput(''); setSkillSuggestions([]) }}
                  className="w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/8 transition-colors">
                  {s.name}
                  {s.category && <span className="text-white/30 ml-2 text-xs">{s.category}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        {(skills || []).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {(skills || []).map((s) => (
              <span key={s.id} className="badge-indigo flex items-center gap-2">
                {s.name}
                <button type="button" onClick={() => setSkills(skills.filter((sk) => sk.id !== s.id))} className="hover:text-red-400">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" loading={loading} className="w-full py-3">
        Post Job
      </Button>
    </form>
  )
}
