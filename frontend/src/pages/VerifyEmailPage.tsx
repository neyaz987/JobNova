import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, ArrowRight, RefreshCw, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/services'
import { Button } from '../components/common/UI'
import toast from 'react-hot-toast'
import Layout from '../components/layout/Layout'

export default function VerifyEmailPage() {
  const { user, logout, updateUser } = useAuthStore()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return toast.error('Enter 6-digit code')
    
    setLoading(true)
    try {
      await authApi.verifyEmail(code)
      toast.success('Email verified successfully!')
      
      // Refresh user state in store
      const { data } = await authApi.me()
      updateUser(data)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await authApi.resendOtp()
      toast.success('New code sent to your email')
    } catch {
      toast.error('Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-dark max-w-md w-full p-10 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>

          <h1 className="text-3xl font-display font-bold mb-4">Verify your email</h1>
          <p className="text-white/50 mb-8 text-sm leading-relaxed">
            We've sent a 6-digit verification code to <br />
            <span className="text-white font-medium">{user?.email}</span>
          </p>

          <form onSubmit={handleVerify} className="space-y-6">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-center text-3xl font-bold tracking-[10px] focus:outline-none focus:border-indigo-500 transition-all placeholder:tracking-normal placeholder:text-sm placeholder:font-normal"
              required
            />

            <Button type="submit" className="w-full py-4 h-auto" loading={loading}>
              Verify Account <ArrowRight size={18} className="ml-2" />
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 flex flex-col gap-4">
            <button 
              onClick={handleResend}
              disabled={resending}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
            >
              <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
              Resend Code
            </button>
            
            <button 
              onClick={() => logout()}
              className="text-xs font-bold text-white/30 hover:text-white/60 flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <LogOut size={14} />
              Logout and try again
            </button>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}
