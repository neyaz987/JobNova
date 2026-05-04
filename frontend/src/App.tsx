import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import HomePage from './pages/HomePage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import JobsPage from './pages/JobsPage'
import JobDetailPage from './pages/JobDetailPage'
import CandidateDashboard from './pages/CandidateDashboard'
import RecruiterDashboard from './pages/RecruiterDashboard'
import AdminDashboard from './pages/AdminDashboard'
import MessagesPage from './pages/MessagesPage'
import PipelinePage from './pages/recruiter/PipelinePage'
import CompanyPage from './pages/CompanyPage'
import AssessmentPage from './pages/AssessmentPage'
import PricingPage from './pages/recruiter/PricingPage'
import ProfilePage from './pages/ProfilePage'
import VerifyEmailPage from './pages/VerifyEmailPage'

function PrivateRoute({
  children, roles,
}: {
  children: React.ReactElement
  roles?: string[]
}) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()
  
  if (!isAuthenticated) return <Navigate to="/login" replace />
  

  if (user && !user.is_verified && location.pathname !== '/verify') {
    return <Navigate to="/verify" replace />
  }


  if (user && user.is_verified && location.pathname === '/verify') {
    const dest = user.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard'
    return <Navigate to={dest} replace />
  }

  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function GuestRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated) {
    const dest = user?.role === 'recruiter'
      ? '/recruiter/dashboard'
      : user?.role === 'admin'
      ? '/admin/dashboard'
      : '/candidate/dashboard'
    return <Navigate to={dest} replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111b33',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <AnimatePresence mode="wait">
        <Routes>

          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/companies/:id" element={<CompanyPage />} />
          <Route path="/assessments/:skillId" element={<PrivateRoute roles={['candidate']}><AssessmentPage /></PrivateRoute>} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/verify" element={<PrivateRoute><VerifyEmailPage /></PrivateRoute>} />


          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />


          <Route
            path="/candidate/dashboard"
            element={<PrivateRoute roles={['candidate']}><CandidateDashboard /></PrivateRoute>}
          />
          <Route
            path="/candidate/bookmarks"
            element={<PrivateRoute roles={['candidate']}><CandidateDashboard /></PrivateRoute>}
          />


          <Route
            path="/recruiter/dashboard"
            element={<PrivateRoute roles={['recruiter', 'admin']}><RecruiterDashboard /></PrivateRoute>}
          />
          <Route
            path="/recruiter/jobs/:jobId/pipeline"
            element={<PrivateRoute roles={['recruiter']}><PipelinePage /></PrivateRoute>}
          />


          <Route
            path="/admin"
            element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>}
          />


          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}
