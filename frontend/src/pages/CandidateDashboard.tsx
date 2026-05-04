import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Briefcase, Bookmark, Upload, User, TrendingUp,
  Clock, CheckCircle2, XCircle, ArrowRight, FileText,
  Award, Zap, Calendar, Download, Sparkles
} from 'lucide-react'
import Layout from '../components/layout/Layout'
import JobCard from '../components/common/JobCard'
import { Button, SkeletonCard, EmptyState } from '../components/common/UI'
import { applicationsApi, jobsApi, usersApi, assessmentsApi, schedulingApi } from '../api/services'
import type { Application, Job, CandidateProfile } from '../utils/types'
import { useAuthStore } from '../store/authStore'
import { getStatusColor, getStatusLabel, formatDate, cn } from '../utils/helpers'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import ResumeTemplate from '../components/ResumeTemplate'

gsap.registerPlugin(ScrollTrigger)

const TABS = ['Overview', 'Applications', 'Saved Jobs', 'Profile'] as const
type Tab = typeof TABS[number]

export default function CandidateDashboard() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [applications, setApplications] = useState<Application[]>([])
  
  const handlePickSlot = async (appId: number, slotIdx: number) => {
    try {
      const { data } = await schedulingApi.pickSlot(appId, slotIdx)
      setApplications(prev => prev.map(a => a.id === appId ? data : a))
      toast.success('Interview confirmed! 🗓️')
    } catch {
      toast.error('Failed to confirm slot')
    }
  }
  const [bookmarks, setBookmarks] = useState<Job[]>([])
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [profileScore, setProfileScore] = useState(0)
  const [attempts, setAttempts] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<Job[]>([])
  const resumeRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  
  const mainRef = useRef(null)
  const [aiTips, setAiTips] = useState<string[]>([])
  const [fetchingTips, setFetchingTips] = useState(false)

  useEffect(() => {
    Promise.all([
      applicationsApi.myApplications(),
      jobsApi.getBookmarks(),
      usersApi.getCandidateProfile(),
      usersApi.getProfileScore(),
      assessmentsApi.getAttempts(),
      jobsApi.getRecommendations(),
    ]).then(([appsRes, bmsRes, profRes, scoreRes, attemptsRes, recRes]) => {
      setApplications(appsRes.data)
      setBookmarks(bmsRes.data)
      setProfile(profRes.data)
      setProfileScore(scoreRes.data.score)
      setAttempts(attemptsRes.data)
      setRecommendations(recRes.data)
    }).catch((err) => {
      console.error('Dashboard Data Fetch Error:', err)
    }).finally(() => setLoading(false))

    // Fetch AI Tips
    setFetchingTips(true)
    usersApi.getResumeSuggestions()
      .then(res => setAiTips(res.data))
      .finally(() => setFetchingTips(false))
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

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { data } = await usersApi.uploadResume(file)
      setProfile(data)
      toast.success('Resume uploaded! AI is parsing your profile...')
      usersApi.getProfileScore().then(res => setProfileScore(res.data.score))
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const statusCounts = {
    applied: applications.filter((a) => a.status === 'applied').length,
    interview: applications.filter((a) => a.status === 'interview').length,
    offered: applications.filter((a) => a.status === 'offered').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  }

  const handleDownloadResume = async () => {
    if (!resumeRef.current || !profile || !user) {
      toast.error('Please wait for your profile to load')
      return
    }
    setExporting(true)
    try {
      const canvas = await html2canvas(resumeRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${user?.full_name}_Resume.pdf`)
      toast.success('Resume downloaded!')
    } catch (err) {
      toast.error('Failed to generate PDF')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="py-12 space-y-8 max-w-7xl mx-auto px-4">
          <div className="h-20 glass shimmer rounded-2xl w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 glass shimmer rounded-2xl" />)}
          </div>
          <div className="h-[400px] glass shimmer rounded-3xl" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div ref={mainRef} className="py-12 max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="dash-reveal flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="badge-indigo px-3 py-1 text-[10px] font-bold uppercase tracking-widest">Candidate Console</span>
              {profileScore >= 80 && <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold uppercase tracking-widest"><Sparkles size={12} /> Elite Profile</span>}
            </div>
            <h1 className="text-5xl lg:text-6xl mb-2">
              Welcome back, <span className="gradient-text">{user?.full_name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-white/40 font-light text-lg">Your career evolution is in progress.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleDownloadResume} className="btn-secondary flex items-center gap-2 group">
              <Download size={18} className="group-hover:translate-y-0.5 transition-transform" /> Export Resume
            </button>
            <Link to="/jobs" className="btn-primary flex items-center gap-2 shadow-glow-indigo">
              <Zap size={18} /> Instant Apply
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Applications', value: applications.length, icon: Briefcase, color: 'from-indigo-500 to-purple-600' },
            { label: 'Profile Score', value: `${profileScore}%`, icon: Award, color: 'from-pink-500 to-rose-600' },
            { label: 'Saved Roles', value: bookmarks.length, icon: Bookmark, color: 'from-blue-500 to-cyan-600' },
            { label: 'Offers', value: statusCounts.offered, icon: CheckCircle2, color: 'from-emerald-500 to-teal-600' },
          ].map((stat, i) => (
            <div key={i} className="dash-reveal glass-neumorph p-6 hover-lift">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                <stat.icon size={20} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="dash-reveal flex border-b border-white/5 mb-8 overflow-x-auto custom-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap',
                activeTab === tab ? 'text-indigo-400' : 'text-white/30 hover:text-white/60'
              )}
            >
              {tab}
              {activeTab === tab && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="dash-reveal min-h-[500px]">
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Recent Applications */}
                <div className="glass-dark p-8 rounded-3xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl flex items-center gap-2">
                      <Clock className="text-indigo-400" size={20} /> Recent Activity
                    </h3>
                    <button onClick={() => setActiveTab('Applications')} className="text-xs font-bold text-indigo-400 hover:underline uppercase tracking-widest">View All</button>
                  </div>
                  {applications.length > 0 ? (
                    <div className="space-y-4">
                      {applications.slice(0, 3).map((app) => (
                        <div key={app.id} className="glass p-5 flex items-center justify-between hover:bg-white/[0.05] transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 glass-dark rounded-xl flex items-center justify-center text-indigo-400 font-bold group-hover:scale-110 transition-transform">
                              {app.job?.company_name?.[0]}
                            </div>
                            <div>
                              <h4 className="font-semibold text-white/90">{app.job?.title}</h4>
                              <p className="text-xs text-white/40">{app.job?.company_name} • {formatDate(app.created_at)}</p>
                            </div>
                          </div>
                          <div className={cn(
                            'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                            getStatusColor(app.status)
                          )}>
                            {getStatusLabel(app.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Briefcase}
                      title="No applications yet"
                      description="Start your journey by applying to some jobs."
                      action={{ label: 'Explore Jobs', to: '/jobs' }}
                    />
                  )}
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="text-xl mb-6 flex items-center gap-2">
                    <Sparkles className="text-amber-400" size={20} /> AI Recommendations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.slice(0, 4).map((job) => (
                      <JobCard key={job.id} job={job} compact />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Profile Completion */}
                <div className="glass-neumorph p-8 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 pointer-events-none" />
                  <h3 className="text-lg mb-6">Profile Strength</h3>
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64" cy="64" r="58"
                        stroke="currentColor" strokeWidth="8"
                        fill="transparent" className="text-white/5"
                      />
                      <circle
                        cx="64" cy="64" r="58"
                        stroke="currentColor" strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={364.4}
                        strokeDashoffset={364.4 - (364.4 * profileScore) / 100}
                        className="text-indigo-500 transition-all duration-1000 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-3xl font-bold gradient-text">{profileScore}%</span>
                  </div>
                  <p className="text-sm text-white/40 mb-6">Complete your profile to increase visibility to recruiters by 4x.</p>
                  <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-widest" onClick={() => setActiveTab('Profile')}>
                    Refine Profile
                  </Button>
                </div>

                {/* AI Tips Card */}
                <div className="glass p-8 border-indigo-500/20 bg-indigo-600/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-indigo-400" size={18} />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-indigo-200">Smart Career Advice</h3>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {fetchingTips ? (
                      Array(3).fill(0).map((_, i) => <div key={i} className="h-4 bg-white/5 rounded animate-pulse w-full" />)
                    ) : aiTips.length > 0 ? (
                      aiTips.map((tip, i) => (
                        <div key={i} className="flex gap-3 text-sm text-white/60 leading-relaxed group">
                          <div className="w-1 h-1 rounded-full bg-indigo-500 mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                          {tip}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-white/30 italic">Upload your resume to get personalized tips.</p>
                    )}
                  </div>
                </div>

                {/* Assessments */}
                <div className="glass-dark p-8 rounded-3xl">
                  <h3 className="text-lg mb-6 flex items-center gap-2">
                    <Award className="text-emerald-400" size={20} /> Skill Verifications
                  </h3>
                  {attempts.length > 0 ? (
                    <div className="space-y-4">
                      {attempts.slice(0, 3).map((a, i) => (
                        <div key={i} className="flex items-center justify-between p-3 glass bg-white/[0.02]">
                          <span className="text-sm font-medium">{a.skill?.name}</span>
                          <span className="text-xs font-bold text-emerald-400">{a.score}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/30 italic">No assessments taken yet.</p>
                  )}
                  <Link to="/jobs" className="block text-center text-[10px] font-bold uppercase tracking-widest text-indigo-400 mt-6 hover:text-indigo-300">
                    Take New Assessment
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Applications' && (
            <div className="glass-dark p-8 rounded-3xl">
              <h3 className="text-2xl mb-8">Your Applications</h3>
              {applications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {applications.map((app) => (
                    <div key={app.id} className="glass-neumorph p-6 hover-lift border-white/5">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4">
                          <div className="w-14 h-14 glass-dark rounded-2xl flex items-center justify-center text-xl font-bold text-indigo-400">
                            {app.job?.company_name?.[0]}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold mb-1">{app.job?.title}</h4>
                            <p className="text-sm text-white/40">{app.job?.company_name}</p>
                          </div>
                        </div>
                        <div className={cn(
                          'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                          getStatusColor(app.status)
                        )}>
                          {getStatusLabel(app.status)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 mb-6 text-xs text-white/30">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} /> Applied {formatDate(app.created_at)}
                        </div>
                        <div className="flex items-center gap-1.5 text-indigo-400">
                          <Zap size={14} /> AI Match: {app.match_score || 0}%
                        </div>
                      </div>

                      {app.status === 'interview' && app.proposed_slots && app.proposed_slots.length > 0 && !app.interview_date && (
                        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-6 mb-6 shadow-glow-indigo/5">
                          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Sparkles size={14} /> Action Required: Pick a Slot
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {app.proposed_slots.map((slot, idx) => (
                              <button
                                key={idx}
                                onClick={() => handlePickSlot(app.id, idx)}
                                className="w-full p-3 glass-dark hover:bg-indigo-500/20 text-xs text-left border border-white/5 hover:border-indigo-500/30 transition-all rounded-xl"
                              >
                                {formatDate(slot)}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-white/30 mt-3 italic text-center">
                            Times are shown in your local timezone ({app.timezone || 'UTC'})
                          </p>
                        </div>
                      )}

                      {app.status === 'interview' && app.interview_date && (
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6">
                          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <Sparkles size={12} /> Interview Scheduled
                          </p>
                          <p className="text-xs text-white/70">{formatDate(app.interview_date)}</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Link to={`/jobs/${app.job_id}`} className="flex-1 btn-secondary text-[10px] font-bold uppercase tracking-widest py-2.5 text-center">
                          View Role
                        </Link>
                        {app.status === 'applied' && (
                          <button className="flex-1 btn-secondary text-red-400/60 border-red-500/10 hover:bg-red-500/5 text-[10px] font-bold uppercase tracking-widest py-2.5">
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Briefcase}
                  title="No applications yet"
                  description="Start your journey by applying to some jobs."
                  action={{ label: 'Explore Jobs', to: '/jobs' }}
                />
              )}
            </div>
          )}

          {activeTab === 'Saved Jobs' && (
            <div className="glass-dark p-8 rounded-3xl">
              <h3 className="text-2xl mb-8">Bookmarked Opportunities</h3>
              {bookmarks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bookmarks.map((job) => (
                    <JobCard key={job.id} job={job} onBookmarkToggle={(id) => setBookmarks(prev => prev.filter(b => b.id !== id))} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Bookmark}
                  title="Your list is empty"
                  description="Save jobs you're interested in to apply later."
                  action={{ label: 'Explore Jobs', to: '/jobs' }}
                />
              )}
            </div>
          )}

          {activeTab === 'Profile' && profile && (
            <div className="glass-dark p-8 rounded-3xl">
              <div className="flex flex-col md:flex-row gap-12">
                <div className="flex-1 space-y-8">
                  <div>
                    <h3 className="text-2xl mb-2">Professional Profile</h3>
                    <p className="text-white/40 font-light">Managed by AI to ensure maximum matching accuracy.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="glass-neumorph p-8">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-4">Bio & Objectives</label>
                      <p className="text-white/80 leading-relaxed">{user?.bio || 'No bio provided.'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-neumorph p-8">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-4">Core Competencies</label>
                        <div className="flex flex-wrap gap-2">
                          {user?.skills?.map((s: any) => (
                            <span key={s.id} className="badge-indigo px-3 py-1.5 text-[10px]">{s.name}</span>
                          )) || 'No skills listed.'}
                        </div>
                      </div>
                      <div className="glass-neumorph p-8">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-4">Total Experience</label>
                        <p className="text-lg font-bold text-indigo-400 capitalize">{profile.experience_years} Years</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-80 space-y-8">
                  <div className="glass-neumorph p-8 text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mx-auto mb-6 flex items-center justify-center text-3xl font-bold shadow-2xl">
                      {user?.full_name?.[0]}
                    </div>
                    <h4 className="text-xl font-bold mb-1">{user?.full_name}</h4>
                    <p className="text-sm text-white/40 mb-6">{user?.email}</p>
                    
                    <div className="relative group overflow-hidden rounded-xl">
                      <input
                        type="file"
                        onChange={handleResumeUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        accept=".pdf,.doc,.docx"
                      />
                      <button className={cn(
                        "w-full btn-secondary text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2",
                        uploading && "opacity-50"
                      )}>
                        {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={16} />}
                        Update Resume
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {user?.linkedin_url && (
                      <a href={user.linkedin_url} target="_blank" className="flex items-center gap-3 p-4 glass hover:bg-white/[0.08] transition-all">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center"><User size={16} /></div>
                        <span className="text-xs font-bold uppercase tracking-wider">LinkedIn</span>
                      </a>
                    )}
                    {user?.github_url && (
                      <a href={user.github_url} target="_blank" className="flex items-center gap-3 p-4 glass hover:bg-white/[0.08] transition-all">
                        <div className="w-8 h-8 rounded-lg bg-white/10 text-white/60 flex items-center justify-center"><FileText size={16} /></div>
                        <span className="text-xs font-bold uppercase tracking-wider">GitHub</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden Resume Template for PDF generation - Using absolute positioning instead of hidden to allow html2canvas to render it */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={resumeRef}>
          <ResumeTemplate profile={profile} user={user} />
        </div>
      </div>
    </Layout>
  )
}
