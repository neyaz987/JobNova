import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { JobType, ExperienceLevel, ApplicationStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSalary(min?: number, max?: number, currency = 'USD') {
  const fmt = (n: number) => {
    if (n >= 1000) return `${currency === 'USD' ? '$' : ''}${(n / 1000).toFixed(0)}k`
    return `${currency === 'USD' ? '$' : ''}${n.toLocaleString()}`
  }
  if (!min && !max) return 'Salary not disclosed'
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  return `Up to ${fmt(max!)}`
}

export function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatJobType(type: JobType): string {
  const map: Record<JobType, string> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    internship: 'Internship',
    freelance: 'Freelance',
    remote: 'Remote',
  }
  return map[type] ?? type
}

export function formatExperienceLevel(level: ExperienceLevel): string {
  const map: Record<ExperienceLevel, string> = {
    entry: 'Entry Level',
    mid: 'Mid Level',
    senior: 'Senior',
    lead: 'Lead',
    executive: 'Executive',
  }
  return map[level] ?? level
}

export function getStatusColor(status: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    applied: 'badge-blue',
    reviewing: 'badge-amber',
    shortlisted: 'badge-indigo',
    interview: 'badge-emerald',
    offered: 'badge-emerald',
    rejected: 'badge-red',
    withdrawn: 'badge-red',
  }
  return map[status] ?? 'badge-blue'
}

export function getStatusLabel(status: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    applied: 'Applied',
    reviewing: 'Under Review',
    shortlisted: 'Shortlisted',
    interview: 'Interview',
    offered: 'Offer Received',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  }
  return map[status] ?? status
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
