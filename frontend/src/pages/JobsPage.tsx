import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, MapPin, Filter, X, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import Layout from '../components/layout/Layout'
import JobCard from '../components/common/JobCard'
import { jobsApi } from '../api/services'
import type { Job, JobFilters } from '../utils/types'
import { SkeletonCard } from '../components/common/UI'
import { useSEO } from '../hooks/useSEO'

const JOB_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'remote', label: 'Remote' },
]

const EXP_LEVELS = [
  { value: '', label: 'All Levels' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executive' },
]

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [filters, setFilters] = useState<JobFilters>({
    search: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    job_type: (searchParams.get('job_type') || '') as any,
    experience_level: (searchParams.get('experience_level') || '') as any,
    salary_min: undefined,
    salary_max: undefined,
    is_remote: undefined,
    page: 1,
    per_page: 20,
  })

  useSEO({
    title: filters.search ? `Jobs for ${filters.search}` : 'Browse Jobs',
    description: 'Find your next career move with JobNova. Search thousands of jobs by title, skill, or location.',
  })

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
      )
      const { data } = await jobsApi.search(cleanFilters)
      setJobs(data.jobs)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleFilterChange = (key: keyof JobFilters, value: any) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchJobs()
  }

  const clearFilters = () => {
    setFilters({ search: '', location: '', job_type: '' as any, experience_level: '' as any, page: 1, per_page: 20 })
  }

  const hasActiveFilters = filters.job_type || filters.experience_level || filters.salary_min || filters.salary_max || filters.is_remote

  return (
    <Layout>
      <div className="py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">Browse Jobs</h1>
          <p className="text-white/40 text-sm">
            {loading ? 'Searching...' : `${total.toLocaleString()} jobs found`}
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="glass p-2 flex flex-col sm:flex-row gap-2 mb-6">
          <div className="flex-1 flex items-center gap-2 px-3 py-2">
            <Search size={16} className="text-white/40 flex-shrink-0" />
            <input
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Job title, skill, or keyword..."
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm focus:outline-none"
            />
            {filters.search && (
              <button type="button" onClick={() => handleFilterChange('search', '')} className="text-white/30 hover:text-white/60">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 border-t sm:border-t-0 sm:border-l border-white/10">
            <MapPin size={16} className="text-white/40 flex-shrink-0" />
            <input
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              placeholder="City or country..."
              className="bg-transparent text-white placeholder-white/30 text-sm focus:outline-none w-32"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filtersOpen || hasActiveFilters
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <SlidersHorizontal size={15} />
              Filters
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>
            <button type="submit" className="btn-primary text-sm py-2.5 px-5">
              Search
            </button>
          </div>
        </form>

        {/* Expandable Filters */}
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass p-5 mb-6"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Job Type */}
              <div>
                <label className="text-xs text-white/50 mb-2 block">Job Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {JOB_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => handleFilterChange('job_type', t.value)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        filters.job_type === t.value
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="text-xs text-white/50 mb-2 block">Experience</label>
                <div className="flex flex-wrap gap-1.5">
                  {EXP_LEVELS.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => handleFilterChange('experience_level', l.value)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        filters.experience_level === l.value
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Salary Range */}
              <div>
                <label className="text-xs text-white/50 mb-2 block">Salary Range (USD/year)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.salary_min || ''}
                    onChange={(e) => handleFilterChange('salary_min', e.target.value ? +e.target.value : undefined)}
                    className="input-glass text-xs py-2 w-full"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.salary_max || ''}
                    onChange={(e) => handleFilterChange('salary_max', e.target.value ? +e.target.value : undefined)}
                    className="input-glass text-xs py-2 w-full"
                  />
                </div>
              </div>

              {/* Remote Toggle */}
              <div>
                <label className="text-xs text-white/50 mb-2 block">Work Style</label>
                <div className="flex gap-2">
                  {[
                    { value: undefined, label: 'All' },
                    { value: true, label: '🌐 Remote' },
                    { value: false, label: '🏢 On-site' },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      onClick={() => handleFilterChange('is_remote', opt.value)}
                      className={`flex-1 text-xs px-2 py-1.5 rounded-lg border transition-all ${
                        filters.is_remote === opt.value
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
              >
                <X size={12} /> Clear all filters
              </button>
            )}
          </motion.div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading
            ? Array(9).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : jobs.length === 0
            ? (
              <div className="col-span-full py-20 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="font-display text-xl font-semibold mb-2">No jobs found</h3>
                <p className="text-white/40 text-sm mb-4">Try adjusting your search or filters</p>
                <button onClick={clearFilters} className="btn-secondary text-sm py-2">
                  Clear Filters
                </button>
              </div>
            )
            : jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onBookmarkToggle={(id, bookmarked) => {
                  setJobs((prev) => prev.map((j) => j.id === id ? { ...j, is_bookmarked: bookmarked } : j))
                }}
              />
            ))}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              disabled={(filters.page || 1) <= 1}
              onClick={() => handleFilterChange('page', (filters.page || 1) - 1)}
              className="p-2 rounded-lg glass hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                const page = i + 1
                const active = page === (filters.page || 1)
                return (
                  <button
                    key={page}
                    onClick={() => handleFilterChange('page', page)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      active ? 'bg-indigo-600 text-white' : 'glass text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
            </div>
            <button
              disabled={(filters.page || 1) >= pages}
              onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
              className="p-2 rounded-lg glass hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
