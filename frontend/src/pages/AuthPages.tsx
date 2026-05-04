import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Briefcase, Mail, Lock, User, Building2, AlertCircle } from 'lucide-react'
import { authApi } from '../api/services'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

// ─── Login Page ───────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})
type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const { data: auth } = await authApi.login(data.email, data.password)
      setAuth(auth.user, auth.access_token, auth.refresh_token)
      toast.success(`Welcome back, ${auth.user.full_name.split(' ')[0]}!`)
      const dest = auth.user.role === 'recruiter' ? '/recruiter/dashboard'
        : auth.user.role === 'admin' ? '/admin/dashboard'
        : '/candidate/dashboard'
      navigate(dest)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your JobNova account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Email" error={errors.email?.message}>
          <FieldWrapper icon={<Mail size={16} />}>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm focus:outline-none"
              autoComplete="email"
            />
          </FieldWrapper>
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <FieldWrapper icon={<Lock size={16} />} right={
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/30 hover:text-white/60">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm focus:outline-none"
              autoComplete="current-password"
            />
          </FieldWrapper>
        </FormField>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 mt-2"
        >
          {loading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-white/40 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}

// ─── Register Page ────────────────────────────────────────────────────────────

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['candidate', 'recruiter']),
  company_name: z.string().optional(),
}).refine((d) => d.role !== 'recruiter' || (d.company_name && d.company_name.length > 1), {
  message: 'Company name is required for recruiters',
  path: ['company_name'],
})
type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const defaultRole = (params.get('role') === 'recruiter' ? 'recruiter' : 'candidate') as 'candidate' | 'recruiter'

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: defaultRole },
  })
  const role = watch('role')

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      const { data: auth } = await authApi.register(data)
      setAuth(auth.user, auth.access_token, auth.refresh_token)
      toast.success('Account created!')
      navigate(auth.user.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join thousands finding their next role">
      {/* Role Toggle */}
      <div className="flex glass p-1 rounded-xl mb-6">
        {(['candidate', 'recruiter'] as const).map((r) => (
          <label key={r} className="flex-1 cursor-pointer">
            <input type="radio" {...register('role')} value={r} className="sr-only" />
            <div className={`text-center py-2 rounded-lg text-sm font-medium transition-all ${
              role === r ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/50 hover:text-white/80'
            }`}>
              {r === 'candidate' ? '👤 Job Seeker' : '🏢 Recruiter'}
            </div>
          </label>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Full Name" error={errors.full_name?.message}>
          <FieldWrapper icon={<User size={16} />}>
            <input
              {...register('full_name')}
              placeholder="Jane Smith"
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm focus:outline-none"
            />
          </FieldWrapper>
        </FormField>

        <FormField label="Email" error={errors.email?.message}>
          <FieldWrapper icon={<Mail size={16} />}>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm focus:outline-none"
            />
          </FieldWrapper>
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <FieldWrapper icon={<Lock size={16} />} right={
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/30 hover:text-white/60">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 characters"
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm focus:outline-none"
            />
          </FieldWrapper>
        </FormField>

        {role === 'recruiter' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <FormField label="Company Name" error={errors.company_name?.message}>
              <FieldWrapper icon={<Building2 size={16} />}>
                <input
                  {...register('company_name')}
                  placeholder="Acme Inc."
                  className="flex-1 bg-transparent text-white placeholder-white/30 text-sm focus:outline-none"
                />
              </FieldWrapper>
            </FormField>
          </motion.div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
          {loading
            ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : `Create ${role === 'recruiter' ? 'Recruiter' : 'Candidate'} Account`}
        </button>
      </form>

      <p className="text-center text-sm text-white/40 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
      </p>
    </AuthLayout>
  )
}

// ─── Shared Layout ────────────────────────────────────────────────────────────

function AuthLayout({ title, subtitle, children }: {
  title: string; subtitle: string; children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass w-full max-w-md p-8 relative"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg">
            <img src="/logo.png" alt="JobNova" className="w-full h-full object-cover" />
          </div>
          <span className="font-display font-bold text-base">
            Job<span className="gradient-text">Nova</span>
          </span>
        </Link>

        <h1 className="font-display text-2xl font-bold mb-1">{title}</h1>
        <p className="text-white/40 text-sm mb-6">{subtitle}</p>

        {children}
      </motion.div>
    </div>
  )
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/60 mb-1.5">{label}</label>
      {children}
      {error && (
        <p className="flex items-center gap-1 mt-1 text-xs text-red-400">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

function FieldWrapper({ icon, right, children }: {
  icon: React.ReactNode; right?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 glass bg-white/5 border border-white/10 focus-within:border-indigo-500/60 focus-within:bg-white/8 rounded-xl px-3.5 py-2.5 transition-all">
      <span className="text-white/30">{icon}</span>
      {children}
      {right}
    </div>
  )
}
