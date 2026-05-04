import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  MapPin, Clock, DollarSign, Users, Bookmark, BookmarkCheck,
  Wifi, Star, ExternalLink
} from 'lucide-react'
import type { Job } from '../../utils/types'
import {
  formatSalary, formatDate, formatJobType, formatExperienceLevel, cn
} from '../../utils/helpers'
import { jobsApi } from '../../api/services'
import { useState, useRef } from 'react'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

interface JobCardProps {
  job: Job
  onBookmarkToggle?: (jobId: number, bookmarked: boolean) => void
  variant?: 'default' | 'compact'
}

export default function JobCard({ job, onBookmarkToggle, variant = 'default' }: JobCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [bookmarked, setBookmarked] = useState(job.is_bookmarked ?? false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const { isAuthenticated } = useAuthStore()

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || window.innerWidth < 768) return
    const card = cardRef.current
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 10
    const rotateY = (centerX - x) / 10

    gsap.to(card, {
      rotateX,
      rotateY,
      duration: 0.5,
      ease: 'power2.out',
      transformPerspective: 1000,
    })
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: 'power2.out',
    })
  }

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error('Sign in to save jobs')
      return
    }
    setBookmarkLoading(true)
    try {
      const { data } = await jobsApi.bookmark(job.id)
      setBookmarked(data.bookmarked)
      onBookmarkToggle?.(job.id, data.bookmarked)
      toast.success(data.bookmarked ? 'Job saved!' : 'Job removed from saved')
    } catch {
      toast.error('Failed to update bookmark')
    } finally {
      setBookmarkLoading(false)
    }
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="glass group relative overflow-hidden transition-all duration-500 hover:border-indigo-500/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.1)]"
    >
      {job.is_featured && (
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
      )}

      <Link to={`/jobs/${job.id}`} className="block p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {job.company_logo_url ? (
              <img src={job.company_logo_url} alt={job.company_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-base font-bold text-indigo-400">
                {(job.company_name || 'C').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="font-display font-semibold text-sm leading-tight mb-0.5 group-hover:text-indigo-300 transition-colors line-clamp-2">
              {job.title}
            </h3>
            <p className="text-white/50 text-xs">{job.company_name}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 mb-4">
          <MetaTag icon={<MapPin size={11} />}>
            {job.is_remote ? 'Remote' : job.location}
          </MetaTag>
          <MetaTag icon={<Clock size={11} />}>
            {formatJobType(job.job_type)}
          </MetaTag>
          <MetaTag icon={<DollarSign size={11} />}>
            {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
          </MetaTag>
        </div>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.skills.slice(0, 4).map((skill) => (
              <span key={skill.id} className="badge-indigo text-[11px] py-0.5">
                {skill.name}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="badge text-[11px] py-0.5 bg-white/5 text-white/40 border-white/10">
                +{job.skills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/8">
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <Users size={11} /> {job.applications_count}
            </span>
            {job.is_remote && (
              <span className="flex items-center gap-1 text-emerald-400">
                <Wifi size={11} /> Remote
              </span>
            )}
            <span>{formatDate(job.created_at)}</span>
          </div>

          <div className="flex items-center gap-2">
            {job.has_applied && (
              <span className="badge-emerald text-[10px] py-0.5">Applied</span>
            )}
            <button
              onClick={handleBookmark}
              disabled={bookmarkLoading}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                bookmarked
                  ? 'text-indigo-400 bg-indigo-500/20'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/8'
              )}
            >
              {bookmarked
                ? <BookmarkCheck size={15} />
                : <Bookmark size={15} />}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function MetaTag({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-white/50 bg-white/5 border border-white/8 rounded-lg px-2 py-1">
      <span className="text-white/30">{icon}</span>
      {children}
    </span>
  )
}
