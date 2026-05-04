import api from './client'
import type {
  AuthToken, User, Job, JobListResponse, JobFilters,
  Application, CandidateProfile, RecruiterProfile,
  Skill, RecruiterAnalytics, AdminAnalytics,
  Notification, Report, Conversation, Message
} from '../utils/types'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: {
    email: string; password: string; full_name: string
    role: string; company_name?: string
  }) => api.post<AuthToken>('/auth/register', data),

  login: (email: string, password: string) =>
    api.post<AuthToken>('/auth/login', { email, password }),

  refresh: (refresh_token: string) =>
    api.post<AuthToken>('/auth/refresh', { refresh_token }),

  me: () => api.get<User>('/auth/me'),

  verifyEmail: (code: string) =>
    api.post('/auth/verify', null, { params: { code } }),

  resendOtp: () =>
    api.post('/auth/resend-otp'),
}

// ─── Users ───────────────────────────────────────────────────────────────────

export const usersApi = {
  updateProfile: (data: Partial<User>) =>
    api.patch<User>('/users/me', data),

  uploadAvatar: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post<User>('/users/me/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getCandidateProfile: () =>
    api.get<CandidateProfile>('/users/me/candidate-profile'),

  updateCandidateProfile: (data: Partial<CandidateProfile>) =>
    api.patch<CandidateProfile>('/users/me/candidate-profile', data),

  uploadResume: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post<CandidateProfile>('/users/me/resume', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getRecruiterProfile: () =>
    api.get<RecruiterProfile>('/users/me/recruiter-profile'),

  updateRecruiterProfile: (data: Partial<RecruiterProfile>) =>
    api.patch<RecruiterProfile>('/users/me/recruiter-profile', data),

  getProfileScore: () =>
    api.get<{ score: number }>('/users/me/profile-score'),

  getCompanyProfile: (recruiterId: number) =>
    api.get<any>(`/users/companies/${recruiterId}`),

  getResumeSuggestions: () =>
    api.get<string[]>('/users/me/resume-suggestions'),

  getPlans: () =>
    api.get<any[]>('/users/subscription-plans'),

  subscribe: (planId: number) =>
    api.post<RecruiterProfile>(`/users/me/subscribe`, null, { params: { plan_id: planId } }),
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export const jobsApi = {
  search: (filters: JobFilters) =>
    api.get<JobListResponse>('/jobs/search', { params: filters }),

  getById: (id: number) =>
    api.get<Job>(`/jobs/${id}`),

  getMyJobs: () =>
    api.get<Job[]>('/jobs/my-jobs'),

  create: (data: Partial<Job> & { skill_ids?: number[] }) =>
    api.post<Job>('/jobs', data),

  update: (id: number, data: Partial<Job> & { skill_ids?: number[] }) =>
    api.patch<Job>(`/jobs/${id}`, data),

  delete: (id: number) =>
    api.delete(`/jobs/${id}`),

  bookmark: (id: number) =>
    api.post<{ bookmarked: boolean }>(`/jobs/${id}/bookmark`),

  getBookmarks: () =>
    api.get<Job[]>('/jobs/bookmarks'),

  report: (id: number, data: { reason: string; details?: string }) =>
    api.post<any>(`/jobs/${id}/report`, data),

  getRecommendations: () =>
    api.get<Job[]>('/jobs/recommendations'),

  getSimilar: (id: number) =>
    api.get<Job[]>(`/jobs/${id}/similar`),

  generateDescription: (title: string, company: string, requirements?: string) =>
    api.post<{ description: string }>('/jobs/generate-description', null, {
      params: { title, company, requirements }
    }),
}

// ─── Applications ─────────────────────────────────────────────────────────────

export const applicationsApi = {
  apply: (jobId: number, coverLetter?: string, resume?: File) => {
    const fd = new FormData()
    if (coverLetter) fd.append('cover_letter', coverLetter)
    if (resume) fd.append('resume', resume)
    return api.post<Application>(`/applications/jobs/${jobId}/apply`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  myApplications: () =>
    api.get<Application[]>('/applications/my'),

  jobApplications: (jobId: number) =>
    api.get<Application[]>(`/applications/jobs/${jobId}`),

  updateStatus: (appId: number, status: string, notes?: string) =>
    api.patch<Application>(`/applications/${appId}/status`, {
      status,
      recruiter_notes: notes,
    }),

  withdraw: (appId: number) =>
    api.post(`/applications/${appId}/withdraw`),

  updateInterview: (appId: number, date: string, notes?: string) =>
    api.patch<Application>(`/applications/${appId}/interview`, {
      interview_date: date,
      interview_notes: notes,
    }),
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export const skillsApi = {
  list: (q?: string) =>
    api.get<Skill[]>('/skills', { params: { q } }),
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export const analyticsApi = {
  recruiter: () =>
    api.get<RecruiterAnalytics>('/analytics/recruiter'),

  admin: () =>
    api.get<AdminAnalytics>('/analytics/admin'),
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export const adminApi = {
  getPendingJobs: () =>
    api.get<Job[]>('/admin/jobs/pending'),

  moderateJob: (id: number, data: { is_approved: boolean; rejection_reason?: string }) =>
    api.post<Job>(`/admin/jobs/${id}/moderate`, data),

  getReports: () =>
    api.get<Report[]>('/admin/reports'),

  updateUserStatus: (id: number, data: { is_active: boolean }) =>
    api.patch<User>(`/admin/users/${id}/status`, data),

  listAllUsers: () =>
    api.get<User[]>('/users'), // Already exists but moved here for organization
}

// ─── Notifications ──────────────────────────────────────────────────────────

export const notificationsApi = {
  list: () =>
    api.get<Notification[]>('/notifications'),

  markAsRead: (id: number) =>
    api.patch<Notification>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.post('/notifications/read-all'),
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const chatApi = {
  getConversations: () =>
    api.get<Conversation[]>('/chat/conversations'),

  getMessages: (conversationId: number, params?: { skip?: number; limit?: number }) =>
    api.get<Message[]>(`/chat/conversations/${conversationId}/messages`, { params }),

  sendMessage: (conversationId: number, content: string) =>
    api.post<Message>(`/chat/conversations/${conversationId}/messages`, { content }),

  initiate: (otherUserId: number, jobId?: number) =>
    api.post<Conversation>(`/chat/initiate/${otherUserId}`, null, { params: { job_id: jobId } }),
}

// ─── Assessments ──────────────────────────────────────────────────────────────

export const assessmentsApi = {
  getAssessment: (skillId: number) =>
    api.get<any>(`/assessments/skill/${skillId}`),

  submitTest: (assessmentId: number, answers: number[]) =>
    api.post<any>(`/assessments/${assessmentId}/submit`, answers),

  getAttempts: () =>
    api.get<any[]>('/assessments/my-attempts'),

  getMockInterview: (jobId: number) =>
    api.get<{ questions: string[] }>(`/assessments/mock-interview/${jobId}`),

  submitMockInterview: (jobId: number, questions: string[], answers: string[]) =>
    api.post<any>(`/assessments/mock-interview/${jobId}/submit`, { questions, answers }),
}

export const networkApi = {
  follow: (recruiterId: number) =>
    api.post<{ followed: boolean }>(`/users/companies/${recruiterId}/follow`),
}

export const schedulingApi = {
  pickSlot: (appId: number, slotIndex: number) =>
    api.post<Application>(`/applications/${appId}/pick-slot`, null, { params: { slot_index: slotIndex } }),
}
