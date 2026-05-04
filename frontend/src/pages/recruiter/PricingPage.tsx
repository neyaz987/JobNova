import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Zap, Shield, Crown, ArrowRight, CheckCircle2 } from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Button, Spinner, Modal } from '../../components/common/UI'
import { usersApi } from '../../api/services'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { cn } from '../../utils/helpers'

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<any | null>(null)
  const [showUpiModal, setShowUpiModal] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, profileRes] = await Promise.allSettled([
          usersApi.getPlans(),
          usersApi.getRecruiterProfile()
        ])

        if (plansRes.status === 'fulfilled') {
          setPlans(plansRes.value.data)
        } else {
          toast.error('Failed to load plans')
        }

        if (profileRes.status === 'fulfilled') {
          setCurrentProfile(profileRes.value.data)
        }
      } catch (err) {
        toast.error('Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSelectPlan = (plan: any) => {
    setPurchasing(plan)
    setShowUpiModal(true)
  }

  const handleConfirmPayment = async () => {
    if (!purchasing) return
    setLoading(true)
    try {

      await usersApi.subscribe(purchasing.id)
      toast.success(`Successfully subscribed to ${purchasing.name}!`)
      setShowUpiModal(false)
      window.location.href = '/recruiter/dashboard'
    } catch {
      toast.error('Failed to update subscription')
    } finally {
      setLoading(false)
    }
  }

  if (loading && plans.length === 0) return (
    <Layout><div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div></Layout>
  )

  return (
    <Layout>
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-display font-bold mb-6"
          >
            Scale Your Hiring with <span className="text-gradient">Premium Plans</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/40 text-lg max-w-2xl mx-auto"
          >
            Choose the perfect plan to boost your visibility, find better talent, and streamline your recruitment workflow.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "glass p-8 relative flex flex-col transition-all",
                plan.name === 'Pro' && "border-indigo-500/50 shadow-2xl shadow-indigo-500/10 scale-105 z-10",
                currentProfile?.plan_id === plan.id && "border-emerald-500/50 ring-1 ring-emerald-500/30"
              )}
            >
              {currentProfile?.plan_id === plan.id && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                  Your Current Plan
                </div>
              )}
              {plan.name === 'Pro' && currentProfile?.plan_id !== plan.id && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                  {plan.name === 'Starter' ? <Shield size={24} className="text-white/40" /> :
                   plan.name === 'Pro' ? <Zap size={24} className="text-indigo-400" /> :
                   <Crown size={24} className="text-amber-400" />}
                </div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₹{plan.price}</span>
                  <span className="text-white/40 text-sm">/month</span>
                </div>
              </div>

              <div className="space-y-4 mb-12 flex-1">
                {plan.features.map((feature: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1 w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check size={10} className="text-emerald-500" />
                    </div>
                    <span className="text-sm text-white/70">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant={currentProfile?.plan_id === plan.id ? 'emerald' : (plan.name === 'Pro' ? 'primary' : 'secondary')} 
                className="w-full group"
                onClick={() => handleSelectPlan(plan)}
                disabled={currentProfile?.plan_id === plan.id}
              >
                {currentProfile?.plan_id === plan.id ? (
                  <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Active Plan</span>
                ) : (
                  <>
                    {plan.price === 1 ? 'Start for ₹1' : 'Upgrade Now'}
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </motion.div>
          ))}
        </div>


        <div className="mt-32 max-w-3xl mx-auto glass p-10 text-center">
          <h2 className="text-2xl font-bold mb-4">Need a custom solution?</h2>
          <p className="text-white/40 mb-8 text-sm">
            We offer tailored enterprise packages for large organizations with high-volume hiring needs.
          </p>
          <Button variant="secondary" outline>Contact Sales</Button>
        </div>
      </div>


      <Modal 
        open={showUpiModal} 
        onClose={() => setShowUpiModal(false)}
        title="UPI Payment"
        size="sm"
      >
        <div className="space-y-6 text-center">
          <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-inner">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=8271397431@ybl&pn=JobNova&am=${purchasing?.price}&cu=INR`)}`}
              alt="UPI QR Code"
              className="w-40 h-40"
            />
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-white/60">Pay <span className="text-white font-bold text-lg">₹{purchasing?.price}</span> to</p>
            <div className="glass-dark py-3 px-4 rounded-xl border border-white/10 font-mono text-indigo-400 select-all">
              8271397431@ybl
            </div>
          </div>

          <div className="text-xs text-white/40 italic">
            Scan the QR code or pay to the UPI ID above. <br/> Once done, click confirm to activate your plan.
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowUpiModal(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1 shadow-glow-indigo" onClick={handleConfirmPayment} loading={loading}>
              Confirm Payment
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
