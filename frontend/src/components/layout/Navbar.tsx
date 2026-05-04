import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import {
  Briefcase, Menu, X, ChevronDown,
  User, LayoutDashboard, LogOut, MessageSquare, Bookmark
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { getInitials, cn } from '../../utils/helpers'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const navRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    handleScroll() // Check initial position
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setDropdownOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const dashboardLink = user?.role === 'recruiter'
    ? '/recruiter/dashboard'
    : user?.role === 'admin'
    ? '/admin/dashboard'
    : '/candidate/dashboard'

  return (
    <nav
      ref={navRef}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled
          ? 'py-3 bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl'
          : 'py-6 bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center group-hover:rotate-[10deg] transition-transform duration-500 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Briefcase size={20} className="text-[#020617]" strokeWidth={2.5} />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight text-white">
              JOB<span className="text-white/40 font-light">NOVA</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/jobs">Opportunities</NavLink>
            {isAuthenticated && (
              <>
                <NavLink to={dashboardLink}>Console</NavLink>
                <NavLink to="/messages">Messages</NavLink>
                {user?.role === 'recruiter' && <NavLink to="/pricing">Membership</NavLink>}
              </>
            )}
            
            <div className="h-6 w-px bg-white/10 mx-4" />

            {!isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary py-2.5 px-6 text-xs uppercase tracking-widest shadow-glow-indigo">
                  Join Now
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <NotificationBell />
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-3 glass px-4 py-2 hover:bg-white/5 transition-all group border-white/10"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                      {user?.avatar_url
                        ? <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        : getInitials(user?.full_name || 'U')}
                    </div>
                    <ChevronDown size={14} className={cn('text-white/40 transition-transform duration-300', dropdownOpen && 'rotate-180')} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-4 w-64 glass-dark rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 p-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-4 py-3 mb-2 border-b border-white/5">
                        <p className="text-sm font-bold text-white truncate">{user?.full_name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mt-0.5">{user?.role}</p>
                      </div>
                      <DropdownItem icon={<LayoutDashboard size={16} />} to={dashboardLink}>Dashboard</DropdownItem>
                      <DropdownItem icon={<User size={16} />} to="/profile">Profile Settings</DropdownItem>
                      <DropdownItem icon={<MessageSquare size={16} />} to="/messages">Inboxes</DropdownItem>
                      {user?.role === 'candidate' && (
                        <DropdownItem icon={<Bookmark size={16} />} to="/candidate/bookmarks">Saved Roles</DropdownItem>
                      )}
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center glass rounded-xl border-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[73px] bg-[#020617]/95 backdrop-blur-3xl z-40 p-6 animate-in slide-in-from-top duration-300">
          <div className="space-y-4">
            <MobileNavLink to="/jobs">Opportunities</MobileNavLink>
            {isAuthenticated && (
              <>
                <MobileNavLink to={dashboardLink}>Console</MobileNavLink>
                <MobileNavLink to="/messages">Messages</MobileNavLink>
                <MobileNavLink to="/profile">Account Settings</MobileNavLink>
                {user?.role === 'recruiter' && <MobileNavLink to="/pricing">Membership</MobileNavLink>}
              </>
            )}
            <div className="pt-8 flex flex-col gap-4">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="btn-secondary text-center py-4 text-sm font-bold uppercase tracking-widest">Login</Link>
                  <Link to="/register" className="btn-primary text-center py-4 text-sm font-bold uppercase tracking-widest shadow-glow-indigo">Join Now</Link>
                </>
              ) : (
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-red-400 border-red-500/10 py-4 text-sm font-bold uppercase tracking-widest"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation()
  const active = location.pathname === to || location.pathname.startsWith(to + '/')
  return (
    <Link
      to={to}
      className={cn(
        'px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300',
        active 
          ? 'text-white bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
          : 'text-white/40 hover:text-white hover:bg-white/5'
      )}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="block px-6 py-4 rounded-2xl glass border-white/5 text-sm font-bold uppercase tracking-widest text-white/60 hover:text-white hover:border-indigo-500/50 transition-all"
    >
      {children}
    </Link>
  )
}

function DropdownItem({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all"
    >
      {icon}
      {children}
    </Link>
  )
}
