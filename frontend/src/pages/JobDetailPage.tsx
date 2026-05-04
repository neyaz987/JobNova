import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin, Clock, DollarSign, Users, Bookmark, BookmarkCheck,
  Building2, Calendar, Wifi, Share2, ArrowLeft, CheckCircle2,
  Briefcase, TrendingUp, Flag
} from 'lucide-react'
import Layout from '../components/layout/Layout'
import { Modal, Textarea, Button, Spinner } from '../components/common/UI'
import { jobsApi, applicationsApi, networkApi, assessmentsApi, usersApi } from '../api/services'
import type { Job } from '../utils/types'
import { formatSalary, formatDate, formatJobType, formatExperienceLevel } from '../utils/helpers'
import { useAuthStore } from '../store/authStore'
import { useSEO } from '../hooks/useSEO'
import toast from 'react-hot-toast'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  
  useSEO({
    title: job?.title,
    description: job?.description?.substring(0, 160),
  })
  const [loading, setLoading] = useState(true)
  const [applyOpen, setApplyOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [followed, setFollowed] = useState(false)
  const [following, setFollowing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [similarJobs, setSimilarJobs] = useState<Job[]>([])
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  
  // Mock Interview State
  const [mockOpen, setMockOpen] = useState(false)
  const [mockLoading, setMockLoading] = useState(false)
  const [mockQuestions, setMockQuestions] = useState<string[]>([])
  const [mockAnswers, setMockAnswers] = useState<string[]>([])
  const [mockCurrentIdx, setMockCurrentIdx] = useState(0)
  const [mockFeedback, setMockFeedback] = useState<any>(null)
  
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    Promise.all([
      jobsApi.getById(Number(id)),
      jobsApi.getSimilar(Number(id)),
      usersApi.getCompanyProfile(0).catch(() => ({data: {is_followed: false}})) // We'll update this
    ]).then(([{ data: jobData }, { data: similarData }]) => {
      setJob(jobData)
      setBookmarked(jobData.is_bookmarked ?? false)
      setSimilarJobs(similarData)
    })
    .catch(() => navigate('/jobs'))
    .finally(() => setLoading(false))
  }, [id])

  const handleFollow = async () => {
    if (!job) return
    setFollowing(true)
    try {
      const { data } = await networkApi.follow(job.recruiter_id)
      setFollowed(data.followed)
      toast.success(data.followed ? 'Following company' : 'Unfollowed')
    } catch { toast.error('Failed to follow') }
    finally { setFollowing(true) }
  }

  const handleBookmark = async () => {
    if (!isAuthenticated) return toast.error('Sign in to save jobs')
    try {
      const { data } = await jobsApi.bookmark(Number(id))
      setBookmarked(data.bookmarked)
      toast.success(data.bookmarked ? 'Job saved!' : 'Removed from saved')
    } catch { toast.error('Failed') }
  }

  const handleApply = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    setApplying(true)
    try {
      await applicationsApi.apply(Number(id), coverLetter, resumeFile || undefined)
      toast.success('Application submitted! 🎉')
      setApplyOpen(false)
      setJob((j) => j ? { ...j, has_applied: true, applications_count: j.applications_count + 1 } : j)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to apply')
    } finally {
      setApplying(false)
    }
  }

  const handleReport = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (!reportReason) return toast.error('Please select a reason')
    setReporting(true)
    try {
      await jobsApi.report(Number(id), { reason: reportReason, details: reportDetails })
      toast.success('Job reported. Our team will review it.')
      setReportOpen(false)
    } catch { toast.error('Failed to submit report') }
    finally { setReporting(false) }
  }

  if (loading) {
    return (
      <Layout>
        <div className="py-16 flex justify-center">
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (!job) return null

  return (
    <Layout>
      <div className="py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to jobs
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6"
            >
              <div className="flex items-start gap-4 mb-5">
                <Link to={`/companies/${job.recruiter_id}`} className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center flex-shrink-0 text-xl font-bold text-indigo-400 hover:scale-105 transition-transform">
                  {job.company_logo_url
                    ? <img src={job.company_logo_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                    : job.company_name.charAt(0)}
                </Link>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h1 className="font-display text-2xl font-bold mb-1">{job.title}</h1>
                    {isAuthenticated && user?.role === 'candidate' && (
                      <Button 
                        variant="secondary" 
                        outline 
                        size="sm" 
                        className={`transition-all ${followed ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : ''}`}
                        onClick={handleFollow}
                        loading={following}
                      >
                        {followed ? 'Following' : 'Follow Company'}
                      </Button>
                    )}
                  </div>
                  <Link to={`/companies/${job.recruiter_id}`} className="flex items-center gap-2 text-white/50 text-sm hover:text-indigo-400 transition-colors">
                    <Building2 size={14} />
                    <span>{job.company_name}</span>
                  </Link>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="badge-indigo flex items-center gap-1">
                  <Clock size={11} /> {formatJobType(job.job_type)}
                </span>
                <span className="badge bg-white/5 border-white/10 text-white/60 flex items-center gap-1">
                  <TrendingUp size={11} /> {formatExperienceLevel(job.experience_level)}
                </span>
                <span className="badge bg-white/5 border-white/10 text-white/60 flex items-center gap-1">
                  <MapPin size={11} /> {job.is_remote ? 'Remote' : job.location}
                </span>
                {job.is_remote && (
                  <span className="badge-emerald flex items-center gap-1">
                    <Wifi size={11} /> Remote OK
                  </span>
                )}
                <span className="badge bg-white/5 border-white/10 text-white/60 flex items-center gap-1">
                  <DollarSign size={11} /> {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                </span>
              </div>

              {/* Skills */}
              {job?.skills && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {job.skills.map((s) => (
                    <span key={s.id} className="badge-indigo">{s.name}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {job.has_applied ? (
                  <div className="btn-emerald flex items-center gap-2 opacity-75 cursor-default">
                    <CheckCircle2 size={16} /> Applied
                  </div>
                ) : (
                  <Button
                    onClick={() => isAuthenticated ? setApplyOpen(true) : navigate('/login')}
                    className="flex-1 sm:flex-none"
                  >
                    Apply Now
                  </Button>
                )}
                <button
                  onClick={handleBookmark}
                  className={`p-2.5 rounded-xl border transition-all ${
                    bookmarked
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                      : 'bg-white/5 border-white/15 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/15 text-white/50 hover:bg-white/10 transition-all"
                >
                  <Share2 size={18} />
                </button>
                <button
                  onClick={() => isAuthenticated ? setReportOpen(true) : navigate('/login')}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/15 text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all"
                  title="Report Job"
                >
                  <Flag size={18} />
                </button>
              </div>
            </motion.div>

            {/* Description */}
            {[
              { title: 'About the Role', content: job.description },
              { title: 'Requirements', content: job.requirements },
              { title: 'Responsibilities', content: job.responsibilities },
            ].filter((s) => s.content).map((section) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6"
              >
                <h2 className="font-display font-semibold text-lg mb-4">{section.title}</h2>
                <div className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-5"
            >
              <h3 className="font-display font-semibold mb-4 text-sm text-white/70 uppercase tracking-wider">
                Job Overview
              </h3>
              <div className="space-y-3">
                <InfoRow icon={<Users size={15} />} label="Applications" value={`${job.applications_count} applied`} />
                <InfoRow icon={<Calendar size={15} />} label="Posted" value={formatDate(job.created_at)} />
                {job.application_deadline && (
                  <InfoRow icon={<Clock size={15} />} label="Deadline" value={formatDate(job.application_deadline)} />
                )}
                <InfoRow icon={<Briefcase size={15} />} label="Job ID" value={`#${job.id}`} />
              </div>
            </motion.div>

            {/* AI Mock Interview CTA */}
            {isAuthenticated && user?.role === 'candidate' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="glass p-5 border border-purple-500/30 bg-purple-500/5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">AI Mock Interview</h4>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Practice Mode</p>
                  </div>
                </div>
                <p className="text-xs text-white/60 mb-4 leading-relaxed">
                  Prepare for this specific role with our AI. Get role-specific questions and instant feedback.
                </p>
                <Button 
                  variant="secondary" 
                  outline 
                  className="w-full text-xs py-2"
                  onClick={async () => {
                    setMockLoading(true)
                    try {
                      const { data } = await assessmentsApi.getMockInterview(Number(id))
                      setMockQuestions(data.questions)
                      setMockAnswers(new Array(data.questions.length).fill(''))
                      setMockCurrentIdx(0)
                      setMockOpen(true)
                      setMockFeedback(null)
                    } catch { toast.error('Failed to start mock interview') }
                    finally { setMockLoading(false) }
                  }}
                  loading={mockLoading}
                >
                  Start Practice
                </Button>
              </motion.div>
            )}

            {/* Quick Apply CTA */}
            {!job.has_applied && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass p-5 border border-indigo-500/20"
              >
                <div className="text-sm text-white/70 mb-3">Ready to apply?</div>
                <Button
                  onClick={() => isAuthenticated ? setApplyOpen(true) : navigate('/login')}
                  className="w-full"
                >
                  Apply for this job
                </Button>
              </motion.div>
            )}

            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass p-5"
              >
                <h3 className="font-display font-semibold mb-4 text-sm text-white/70 uppercase tracking-wider">
                  Similar Jobs
                </h3>
                <div className="space-y-4">
                  {similarJobs.map((sj) => (
                    <Link key={sj.id} to={`/jobs/${sj.id}`} className="block group">
                      <p className="text-sm font-medium group-hover:text-indigo-400 transition-colors truncate">{sj.title}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{sj.company_name} · {sj.location}</p>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title={`Apply — ${job.title}`} size="md">
        <div className="space-y-4">
          <Textarea
            label="Cover Letter (optional)"
            placeholder="Tell the recruiter why you're a great fit..."
            rows={5}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
          />
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2">Resume (optional — uses saved resume if not provided)</label>
            <label className="flex items-center gap-3 p-3 glass border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-white/40 transition-all">
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} className="sr-only" />
              <Briefcase size={16} className="text-white/40" />
              <span className="text-sm text-white/50">{resumeFile ? resumeFile.name : 'Upload resume (PDF/DOC)'}</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setApplyOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleApply} loading={applying} className="flex-1">Submit Application</Button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report Job" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-white/50">Help us keep our platform safe. Why are you reporting this job?</p>
          <select 
            value={reportReason} 
            onChange={(e) => setReportReason(e.target.value)}
            className="input-glass text-sm"
          >
            <option value="" disabled>Select a reason...</option>
            <option value="Fake Job / Scam" className="bg-navy-800">Fake Job / Scam</option>
            <option value="Offensive Content" className="bg-navy-800">Offensive Content</option>
            <option value="Misleading Information" className="bg-navy-800">Misleading Information</option>
            <option value="Duplicate" className="bg-navy-800">Duplicate</option>
            <option value="Other" className="bg-navy-800">Other</option>
          </select>
          <Textarea 
            placeholder="Additional details (optional)..." 
            rows={3}
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setReportOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleReport} loading={reporting} className="flex-1 bg-red-500 hover:bg-red-600 border-0">Submit Report</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
        {icon}
      </div>
      <div>
        <div className="text-xs text-white/40">{label}</div>
        <div className="text-sm font-medium text-white/80">{value}</div>
      </div>
    </div>
  )
}
