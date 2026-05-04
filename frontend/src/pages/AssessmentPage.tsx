import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Timer, ChevronRight, CheckCircle2, XCircle, 
  AlertCircle, ArrowLeft, Trophy
} from 'lucide-react'
import Layout from '../components/layout/Layout'
import { assessmentsApi } from '../api/services'
import { Button, Spinner } from '../components/common/UI'
import toast from 'react-hot-toast'
import { cn } from '../utils/helpers'

export default function AssessmentPage() {
  const { skillId } = useParams<{ skillId: string }>()
  const navigate = useNavigate()
  
  const [assessment, setAssessment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    if (skillId) {
      assessmentsApi.getAssessment(+skillId)
        .then(res => {
          setAssessment(res.data)
          setTimeLeft(res.data.duration_minutes * 60)
          setAnswers(new Array(res.data.questions.length).fill(-1))
        })
        .catch(() => {
          toast.error('Failed to load assessment')
          navigate('/candidate/dashboard')
        })
        .finally(() => setLoading(false))
    }
  }, [skillId])

  useEffect(() => {
    if (timeLeft > 0 && !result && !loading) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
      return () => clearInterval(timer)
    } else if (timeLeft === 0 && !result && !loading) {
      handleSubmit()
    }
  }, [timeLeft, result, loading])

  const handleOptionSelect = (optionIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = optionIndex
    setAnswers(newAnswers)
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const { data } = await assessmentsApi.submitTest(assessment.id, answers)
      setResult(data)
    } catch {
      toast.error('Failed to submit assessment')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return (
    <Layout><div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div></Layout>
  )

  if (result) return (
    <Layout>
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-600" />
          
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
            result.is_passed ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"
          )}>
            {result.is_passed ? <Trophy size={40} /> : <AlertCircle size={40} />}
          </div>

          <h1 className="text-3xl font-display font-bold mb-2">
            {result.is_passed ? "Congratulations!" : "Keep Practicing"}
          </h1>
          <p className="text-white/50 mb-8">
            You scored {result.score}% on the {assessment.title}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="glass p-4">
              <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Status</div>
              <div className={cn("font-bold", result.is_passed ? "text-emerald-400" : "text-rose-400")}>
                {result.is_passed ? "VERIFIED" : "NOT PASSED"}
              </div>
            </div>
            <div className="glass p-4">
              <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Passing Score</div>
              <div className="font-bold text-white">70%</div>
            </div>
          </div>

          <Button onClick={() => navigate('/candidate/dashboard')} className="w-full">
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    </Layout>
  )

  const currentQuestion = assessment.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold">{assessment.title}</h1>
            <p className="text-sm text-white/40">Question {currentQuestionIndex + 1} of {assessment.questions.length}</p>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 glass rounded-2xl font-mono text-lg",
            timeLeft < 60 ? "text-rose-400 animate-pulse" : "text-indigo-400"
          )}>
            <Timer size={18} />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-white/5 rounded-full mb-12 overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass p-8 mb-8"
          >
            <h2 className="text-lg font-medium leading-relaxed mb-8">
              {currentQuestion.text}
            </h2>

            <div className="space-y-4">
              {(currentQuestion?.options || []).map((option: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleOptionSelect(i)}
                  className={cn(
                    "w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group",
                    answers[currentQuestionIndex] === i 
                      ? "bg-indigo-500/20 border-indigo-500 text-white" 
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20"
                  )}
                >
                  <span className="text-sm">{option}</span>
                  <div className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                    answers[currentQuestionIndex] === i 
                      ? "bg-indigo-500 border-indigo-500" 
                      : "border-white/20 group-hover:border-white/40"
                  )}>
                    {answers[currentQuestionIndex] === i && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white disabled:opacity-0 transition-colors"
          >
            <ArrowLeft size={16} /> Previous
          </button>
          
          {currentQuestionIndex === assessment.questions.length - 1 ? (
            <Button 
              onClick={handleSubmit} 
              loading={isSubmitting}
              disabled={answers.includes(-1)}
              className="px-12"
            >
              Submit Assessment
            </Button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              disabled={answers[currentQuestionIndex] === -1}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </Layout>
  )
}
