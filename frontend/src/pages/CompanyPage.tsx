import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Globe, MapPin, Users, Briefcase, Linkedin, 
  Twitter, ExternalLink, Mail
} from 'lucide-react'
import Layout from '../components/layout/Layout'
import JobCard from '../components/common/JobCard'
import { usersApi, chatApi } from '../api/services'
import { Spinner, EmptyState } from '../components/common/UI'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function CompanyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [contacting, setContacting] = useState(false)

  useEffect(() => {
    if (id) {
      usersApi.getCompanyProfile(+id)
        .then(res => setData(res.data))
        .catch(() => toast.error('Failed to load company profile'))
        .finally(() => setLoading(false))
    }
  }, [id])

  const handleContact = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to contact the hiring team')
      navigate('/login')
      return
    }
    setContacting(true)
    try {
      await chatApi.initiate(Number(id))
      toast.success('Conversation started!')
      navigate('/messages')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to start conversation')
    } finally {
      setContacting(false)
    }
  }

  if (loading) return (
    <Layout><div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div></Layout>
  )

  if (!data) return (
    <Layout><EmptyState title="Company not found" icon={<Users size={48} />} /></Layout>
  )

  const { profile, jobs, recruiter_name } = data

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Banner/Header */}
        <div className="relative mb-12">
          <div className="h-48 rounded-3xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-white/10" />
          <div className="absolute -bottom-6 left-8 flex items-end gap-6">
            <div className="w-32 h-32 rounded-3xl glass p-1 shadow-2xl">
              <div className="w-full h-full rounded-2xl bg-navy-900 flex items-center justify-center overflow-hidden">
                {profile.company_logo_url ? (
                  <img src={profile.company_logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-indigo-500">{profile.company_name.charAt(0)}</span>
                )}
              </div>
            </div>
            <div className="mb-2">
              <h1 className="text-3xl font-display font-bold text-white mb-1">{profile.company_name}</h1>
              <div className="flex items-center gap-4 text-sm text-white/50">
                <span className="flex items-center gap-1"><MapPin size={14} /> {profile.industry}</span>
                <span className="flex items-center gap-1"><Users size={14} /> {profile.company_size} employees</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="text-xl font-display font-bold mb-4">About the Company</h2>
              <p className="text-white/70 leading-relaxed whitespace-pre-wrap">
                {profile.company_description || 'No description provided.'}
              </p>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold">Open Positions</h2>
                <span className="badge-indigo">{jobs.length} Jobs</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job: any) => (
                  <JobCard key={job.id} job={job} />
                ))}
                {jobs.length === 0 && (
                  <div className="col-span-full">
                    <EmptyState title="No active jobs" description="This company has no open positions at the moment." icon={<Briefcase size={32} />} />
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="glass p-6 space-y-6">
              <h3 className="font-display font-bold text-lg">Company Details</h3>
              
              <div className="space-y-4">
                {profile.company_website && (
                  <a href={profile.company_website} target="_blank" rel="noreferrer" className="flex items-center justify-between text-sm group">
                    <span className="text-white/40 flex items-center gap-2"><Globe size={14} /> Website</span>
                    <span className="text-indigo-400 group-hover:underline flex items-center gap-1">
                      Visit <ExternalLink size={12} />
                    </span>
                  </a>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40 flex items-center gap-2"><Briefcase size={14} /> Industry</span>
                  <span className="text-white/80">{profile.industry}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40 flex items-center gap-2"><Users size={14} /> Company Size</span>
                  <span className="text-white/80">{profile.company_size}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">Social Presence</p>
                <div className="flex gap-3">
                  <button className="w-10 h-10 rounded-xl glass hover:bg-indigo-500/20 transition-all flex items-center justify-center text-white/60 hover:text-indigo-400">
                    <Linkedin size={18} />
                  </button>
                  <button className="w-10 h-10 rounded-xl glass hover:bg-blue-500/20 transition-all flex items-center justify-center text-white/60 hover:text-blue-400">
                    <Twitter size={18} />
                  </button>
                  <button className="w-10 h-10 rounded-xl glass hover:bg-white/10 transition-all flex items-center justify-center text-white/60 hover:text-white">
                    <Mail size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="glass p-6 text-center">
              <p className="text-sm text-white/40 mb-2">Primary Recruiter</p>
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-2 text-indigo-400 font-bold">
                {recruiter_name.charAt(0)}
              </div>
              <p className="font-semibold">{recruiter_name}</p>
              <button 
                onClick={handleContact}
                disabled={contacting}
                className="btn-secondary w-full text-xs py-2 mt-4 flex items-center justify-center gap-2"
              >
                {contacting ? <Spinner size="sm" /> : 'Contact Hiring Team'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
