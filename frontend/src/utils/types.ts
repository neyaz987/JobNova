export type UserRole = 'candidate' | 'recruiter' | 'admin'

export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance' | 'remote'

export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive'

export type ApplicationStatus =
  | 'applied'
  | 'reviewing'
  | 'shortlisted'
  | 'interview'
  | 'offered'
  | 'rejected'
  | 'withdrawn'

export interface User {
  id: number
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  avatar_url?: string
  phone?: string
  location?: string
  bio?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
  created_at: string
  is_verified: boolean
  skills?: Skill[]
  recruiter_profile?: RecruiterProfile
}

export interface CandidateProfile {
  id: number
  user_id: number
  resume_url?: string
  resume_filename?: string
  experience_years: number
  current_title?: string
  current_company?: string
  expected_salary?: number
  notice_period_days: number
  is_open_to_work: boolean
  preferred_job_types: string[]
  education: EducationEntry[]
  experience: ExperienceEntry[]
  certifications: CertificationEntry[]
  portfolio_projects: PortfolioEntry[]
}

export interface PortfolioEntry {
  title: string
  description: string
  link?: string
  image_url?: string
}

export interface EducationEntry {
  degree: string
  institution: string
  year: string
  gpa?: string
}

export interface ExperienceEntry {
  title: string
  company: string
  start_date: string
  end_date?: string
  description?: string
  current?: boolean
}

export interface CertificationEntry {
  name: string
  issuer: string
  year: string
}

export interface RecruiterProfile {
  id: number
  user_id: number
  company_name: string
  company_website?: string
  company_size?: string
  company_logo_url?: string
  industry?: string
  company_description?: string
}

export interface Skill {
  id: number
  name: string
  category?: string
}

export interface Job {
  id: number
  recruiter_id: number
  title: string
  description: string
  requirements?: string
  responsibilities?: string
  company_name: string
  company_logo_url?: string
  location: string
  is_remote: boolean
  job_type: JobType
  experience_level: ExperienceLevel
  salary_min?: number
  salary_max?: number
  salary_currency: string
  is_active: boolean
  is_featured: boolean
  application_deadline?: string
  views_count: number
  applications_count: number
  skills: Skill[]
  created_at: string
  is_bookmarked?: boolean
  has_applied?: boolean
  is_approved?: boolean
  rejection_reason?: string
}

export interface JobListResponse {
  jobs: Job[]
  total: number
  page: number
  per_page: number
  pages: number
}

export interface Application {
  id: number
  job_id: number
  candidate_id: number
  status: ApplicationStatus
  cover_letter?: string
  resume_url?: string
  resume_filename?: string
  recruiter_notes?: string
  applied_at: string
  created_at: string
  updated_at: string
  job?: Job
  candidate?: User
  proposed_slots?: string[]
  timezone?: string
  interview_date?: string
  match_score?: number
  match_reasoning?: string
  missing_skills?: string[]
  strengths?: string[]
}

export interface AuthToken {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface JobFilters {
  search?: string
  location?: string
  job_type?: JobType | ''
  experience_level?: ExperienceLevel | ''
  salary_min?: number
  salary_max?: number
  is_remote?: boolean
  skills?: string[]
  page?: number
  per_page?: number
}

export interface RecruiterAnalytics {
  total_jobs: number
  active_jobs: number
  total_applications: number
  applications_by_status: Record<string, number>
  top_jobs: Array<{ id: number; title: string; applications: number; views: number }>
  applications_over_time: Array<{ date: string; count: number }>
  hiring_funnel?: {
    views: number
    applications: number
    shortlisted: number
    interviewed: number
    hired: number
  }
}

export interface AdminAnalytics {
  total_users: number
  total_candidates: number
  total_recruiters: number
  total_jobs: number
  total_applications: number
  new_users_this_month: number
  new_jobs_this_month: number
}

export interface Notification {
  id: number
  title: string
  message: string
  type: string
  link?: string
  is_read: boolean
  created_at: string
}

export interface Report {
  id: number
  job_id: number
  reporter_id: number
  reason: string
  details?: string
  status: 'pending' | 'resolved' | 'dismissed'
  created_at: string
  job?: Job
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  content: string
  is_read: boolean
  created_at: string
}

export interface Conversation {
  id: number
  recruiter_id: number
  candidate_id: number
  job_id?: number
  last_message_at: string
  created_at: string
  updated_at: string
  other_user?: User
  last_message?: Message
  unread_count: number
}
