import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, MapPin, TrendingUp, Users, Briefcase, Zap, ArrowRight, Star } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Layout from '../components/layout/Layout'
import JobCard from '../components/common/JobCard'
import { jobsApi } from '../api/services'
import type { Job } from '../utils/types'
import { SkeletonCard } from '../components/common/UI'
import { useSEO } from '../hooks/useSEO'

gsap.registerPlugin(ScrollTrigger)

const TRENDING_SEARCHES = ['React Developer', 'Product Manager', 'Data Scientist', 'UX Designer', 'DevOps Engineer']

const STATS = [
  { label: 'Active Jobs', value: '12,400+', icon: Briefcase, color: 'from-indigo-500 to-purple-600' },
  { label: 'Companies', value: '3,200+', icon: Users, color: 'from-emerald-500 to-teal-600' },
  { label: 'Hired Monthly', value: '8,900+', icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
  { label: 'Success Rate', value: '94%', icon: Star, color: 'from-rose-500 to-pink-600' },
]

export default function HomePage() {
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useSEO({
    title: 'Elevate Your Career Trajectory',
    description: 'Find your dream job with JobNova AI. The next generation job portal powered by artificial intelligence.',
  })
  
  const heroRef = useRef(null)
  const statsRef = useRef(null)
  const jobsRef = useRef(null)

  useEffect(() => {
    jobsApi.search({ per_page: 6, page: 1 })
      .then(({ data }) => setFeaturedJobs(data.jobs))
      .catch(() => {})
      .finally(() => setLoading(false))


    const ctx = gsap.context(() => {
      gsap.from('.hero-content > *', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power4.out',
      })


      const hero = heroRef.current
      if (hero) {
        hero.addEventListener('mousemove', (e: MouseEvent) => {
          const { clientX, clientY } = e
          const xPos = (clientX / window.innerWidth - 0.5) * 40
          const yPos = (clientY / window.innerHeight - 0.5) * 40
          
          gsap.to('.hero-3d-container', {
            rotateY: xPos,
            rotateX: -yPos,
            duration: 1,
            ease: 'power2.out',
            transformPerspective: 1000
          })

          gsap.to('.hero-bg-accent', {
            x: -xPos * 2,
            y: -yPos * 2,
            duration: 1.5,
            ease: 'power2.out'
          })
        })
      }

      gsap.from('.stat-card', {
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 85%',
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'back.out(1.7)',
      })

      if (!loading) {
        gsap.from('.job-reveal', {
          scrollTrigger: {
            trigger: jobsRef.current,
            start: 'top 80%',
          },
          y: 30,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
        })
      }
    }, heroRef)

    return () => ctx.revert()
  }, [loading])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (location) params.set('location', location)
    navigate(`/jobs?${params.toString()}`)
  }

  return (
    <Layout>

      <section ref={heroRef} className="relative min-h-[90vh] flex items-center py-20 overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />
        <div className="hero-bg-accent absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full hero-content z-10 hero-3d-container">
          <div className="text-center max-w-5xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 glass px-5 py-2 mb-10 rounded-full border-white/20">
              <Zap size={14} className="text-amber-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-wider uppercase text-white/60">Over 12,000 opportunities waiting</span>
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl mb-8 leading-[1.1]">
              Elevate Your <br />
              <span className="gradient-text">Career Trajectory</span>
            </h1>

            <p className="text-white/50 text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              The next generation job portal powered by AI. Connect with top-tier 
              companies and discover roles that define your future.
            </p>

            <form
              onSubmit={handleSearch}
              className="glass-neumorph p-2.5 flex flex-col sm:flex-row gap-2 mb-10 max-w-3xl mx-auto"
            >
              <div className="flex-[1.5] flex items-center gap-3 px-4 py-3">
                <Search size={20} className="text-indigo-400 flex-shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Design, Engineering, Marketing..."
                  className="w-full bg-transparent text-white placeholder-white/20 text-base focus:outline-none"
                />
              </div>
              <div className="flex-1 flex items-center gap-3 px-4 py-3 border-t sm:border-t-0 sm:border-l border-white/10">
                <MapPin size={20} className="text-emerald-400 flex-shrink-0" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Remote, NYC..."
                  className="w-full bg-transparent text-white placeholder-white/20 text-base focus:outline-none"
                />
              </div>
              <button type="submit" className="btn-primary py-4 px-10 whitespace-nowrap text-base shadow-glow-indigo">
                Find Jobs
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Trending:</span>
              {TRENDING_SEARCHES.map((t) => (
                <button
                  key={t}
                  onClick={() => navigate(`/jobs?q=${encodeURIComponent(t)}`)}
                  className="text-xs font-medium text-white/40 hover:text-white glass px-4 py-2 rounded-full hover:border-indigo-500/50 transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>


      <section ref={statsRef} className="py-24 relative">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="stat-card glass-neumorph p-8 text-center hover-lift"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-5 shadow-xl`}>
                <stat.icon size={24} className="text-white" />
              </div>
              <div className="text-4xl font-display font-bold text-white mb-2">{stat.value}</div>
              <div className="text-white/30 text-xs font-bold uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>


      <section ref={jobsRef} className="py-24 max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-4xl mb-2">Prime Opportunities</h2>
            <p className="text-white/40 font-light">Curated roles from high-growth companies</p>
          </div>
          <Link
            to="/jobs"
            className="btn-secondary py-3 px-6 text-sm flex items-center gap-2 group"
          >
            Explore All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : featuredJobs.map((job) => (
                <div key={job.id} className="job-reveal">
                  <JobCard job={job} />
                </div>
              ))}
        </div>
      </section>


      <section className="py-24 px-4 mb-12">
        <div className="glass-dark relative overflow-hidden rounded-[40px] p-16 lg:p-24 text-center max-w-6xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-5xl lg:text-6xl mb-6">
              Empower Your <span className="gradient-text">Hiring Process</span>
            </h2>
            <p className="text-white/40 text-lg mb-12 max-w-xl mx-auto font-light">
              Tap into a global network of elite professionals. Our AI-matching 
              engine finds the perfect fit for your team, faster than ever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register?role=recruiter" className="btn-primary px-12 py-5 text-lg shadow-glow-indigo">
                Post Your First Job
              </Link>
              <Link to="/jobs" className="btn-secondary px-12 py-5 text-lg">
                View Talent Network
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
