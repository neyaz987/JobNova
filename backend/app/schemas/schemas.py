from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Any
from datetime import datetime
from app.models.models import UserRole, ApplicationStatus, JobType, ExperienceLevel




class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2, max_length=255)
    role: UserRole = UserRole.candidate
    company_name: Optional[str] = None

    @validator("company_name")
    def company_required_for_recruiter(cls, v, values):
        if values.get("role") == UserRole.recruiter and not v:
            raise ValueError("company_name is required for recruiter registration")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserOut"


class TokenRefresh(BaseModel):
    refresh_token: str




class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str]
    phone: Optional[str]
    location: Optional[str]
    bio: Optional[str]
    linkedin_url: Optional[str]
    github_url: Optional[str]
    website_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None




class CandidateProfileUpdate(BaseModel):
    experience_years: Optional[float] = None
    current_title: Optional[str] = None
    current_company: Optional[str] = None
    expected_salary: Optional[int] = None
    notice_period_days: Optional[int] = None
    is_open_to_work: Optional[bool] = None
    preferred_job_types: Optional[List[str]] = None
    education: Optional[List[dict]] = None
    experience: Optional[List[dict]] = None
    certifications: Optional[List[dict]] = None
    portfolio_projects: Optional[List[dict]] = None


class CandidateProfileOut(BaseModel):
    id: int
    user_id: int
    resume_url: Optional[str]
    resume_filename: Optional[str]
    experience_years: float
    current_title: Optional[str]
    current_company: Optional[str]
    expected_salary: Optional[int]
    notice_period_days: int
    is_open_to_work: bool
    preferred_job_types: List[str]
    education: List[Any]
    experience: List[Any]
    certifications: List[Any]
    portfolio_projects: Optional[List[Any]] = []

    class Config:
        from_attributes = True


class RecruiterProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    company_website: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    company_description: Optional[str] = None
    social_links: Optional[dict] = None


class SubscriptionPlanOut(BaseModel):
    id: int
    name: str
    price: int
    features: List[str]
    job_limit: int
    is_active: bool

    class Config:
        from_attributes = True


class RecruiterProfileOut(BaseModel):
    id: int
    user_id: int
    company_name: str
    company_website: Optional[str]
    company_size: Optional[str]
    company_logo_url: Optional[str]
    industry: Optional[str]
    company_description: Optional[str]
    social_links: dict = {}
    plan_id: Optional[int]
    plan: Optional[SubscriptionPlanOut] = None
    subscription_expires_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True




class SkillOut(BaseModel):
    id: int
    name: str
    category: Optional[str]

    class Config:
        from_attributes = True




class JobCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10)
    requirements: Optional[str] = None
    responsibilities: Optional[str] = None
    location: str
    is_remote: bool = False
    job_type: JobType = JobType.full_time
    experience_level: ExperienceLevel = ExperienceLevel.mid
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = "USD"
    application_deadline: Optional[datetime] = None
    skill_ids: List[int] = []


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    responsibilities: Optional[str] = None
    location: Optional[str] = None
    is_remote: Optional[bool] = None
    job_type: Optional[JobType] = None
    experience_level: Optional[ExperienceLevel] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    is_active: Optional[bool] = None
    application_deadline: Optional[datetime] = None
    skill_ids: Optional[List[int]] = None


class JobOut(BaseModel):
    id: int
    recruiter_id: int
    title: str
    description: str
    requirements: Optional[str]
    responsibilities: Optional[str]
    company_name: str
    company_logo_url: Optional[str]
    location: str
    is_remote: bool
    job_type: JobType
    experience_level: ExperienceLevel
    salary_min: Optional[int]
    salary_max: Optional[int]
    salary_currency: str
    is_active: bool
    is_featured: bool
    application_deadline: Optional[datetime]
    views_count: int
    applications_count: int
    skills: List[SkillOut] = []
    created_at: datetime
    is_bookmarked: Optional[bool] = False
    has_applied: Optional[bool] = False
    is_approved: bool = True
    rejection_reason: Optional[str] = None

    class Config:
        from_attributes = True


class CompanyPublicOut(BaseModel):
    profile: RecruiterProfileOut
    jobs: List[JobOut]
    recruiter_name: str


class JobListOut(BaseModel):
    jobs: List[JobOut]
    total: int
    page: int
    per_page: int
    pages: int




class ApplicationCreate(BaseModel):
    cover_letter: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    recruiter_notes: Optional[str] = None
    interview_at: Optional[datetime] = None
    meeting_link: Optional[str] = None
    interview_location: Optional[str] = None
    proposed_slots: Optional[List[datetime]] = None
    timezone: Optional[str] = "UTC"


class ApplicationOut(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    status: ApplicationStatus
    cover_letter: Optional[str]
    resume_url: Optional[str]
    resume_filename: Optional[str]
    recruiter_notes: Optional[str]
    interview_at: Optional[datetime] = None
    meeting_link: Optional[str] = None
    interview_location: Optional[str] = None
    match_score: Optional[int] = None
    match_reasoning: Optional[str] = None
    proposed_slots: Optional[List[datetime]] = None
    timezone: Optional[str] = "UTC"
    applied_at: datetime
    updated_at: datetime
    job: Optional[JobOut] = None
    candidate: Optional[UserOut] = None

    class Config:
        from_attributes = True




class RecruiterAnalytics(BaseModel):
    total_jobs: int
    active_jobs: int
    total_applications: int
    applications_by_status: dict
    top_jobs: List[dict]
    applications_over_time: List[dict]
    hiring_funnel: Optional[dict] = None


class AdminAnalytics(BaseModel):
    total_users: int
    total_candidates: int
    total_recruiters: int
    total_jobs: int
    total_applications: int
    new_users_this_month: int
    new_jobs_this_month: int




class JobModeration(BaseModel):
    is_approved: bool
    rejection_reason: Optional[str] = None


class ReportCreate(BaseModel):
    reason: str = Field(min_length=5, max_length=500)
    details: Optional[str] = None


class ReportOut(BaseModel):
    id: int
    job_id: int
    reporter_id: int
    reason: str
    details: Optional[str]
    status: str
    created_at: datetime
    job: Optional[JobOut] = None

    class Config:
        from_attributes = True


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    link: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserStatusUpdate(BaseModel):
    is_active: bool




class MessageCreate(BaseModel):
    content: str = Field(min_length=1)


class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: int
    recruiter_id: int
    candidate_id: int
    job_id: Optional[int]
    last_message_at: datetime
    created_at: datetime
    updated_at: datetime
    other_user: Optional[UserOut] = None
    last_message: Optional[MessageOut] = None
    unread_count: int = 0

    class Config:
        from_attributes = True





Token.model_rebuild()
